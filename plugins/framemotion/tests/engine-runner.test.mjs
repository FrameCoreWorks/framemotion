// The shared engine renderer: offline routing, safe file serving and frame checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

const {ENGINES_ROOT, isEngineUrl, resolveInside} = kit;
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const browserSkip = playwright ? false : 'Playwright is not installed';

test('only the engines origin itself counts as local', () => {
  assert.equal(isEngineUrl('http://framemotion.local/photoreal/lens.mjs'), true);
  for (const url of ['http://framemotion.local.example.com/x', 'http://framemotion.local:8080/x',
    'https://framemotion.local/x', 'ws://framemotion.local/x', 'http://user@evil.test/', 'not a url', 'data:text/plain,x']) {
    assert.equal(isEngineUrl(url), false, url);
  }
});

test('file serving refuses traversal, malformed escapes and symlinks that leave the folder', (t) => {
  assert.equal(resolveInside(ENGINES_ROOT, '/../../SKILL.md'), null);
  assert.equal(resolveInside(ENGINES_ROOT, '/%2e%2e/%2e%2e/SKILL.md'), null);
  assert.equal(resolveInside(ENGINES_ROOT, '/%E0%A4%A'), null, 'a malformed escape is a 404, not a crash');
  assert.equal(resolveInside(ENGINES_ROOT, '/kit/%00x'), null);
  assert.equal(resolveInside(ENGINES_ROOT, '/photoreal/lens.mjs'), path.join(fs.realpathSync(ENGINES_ROOT), 'photoreal/lens.mjs'));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-root-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.writeFileSync(path.join(root, 'inside.txt'), 'ok');
  fs.symlinkSync('/etc/hostname', path.join(root, 'outside.txt'));
  assert.equal(resolveInside(root, '/outside.txt'), null);
  assert.equal(resolveInside(root, '/inside.txt'), path.join(fs.realpathSync(root), 'inside.txt'));
});

/** A throwaway engines folder: the kit copied in, plus small canvas engines written by the test. */
function fixtureRoot(t, engines) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-engines-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.cpSync(path.join(ENGINES_ROOT, 'kit'), path.join(root, 'kit'), {recursive: true});
  const entries = [];
  for (const [id, seekBody] of Object.entries(engines)) {
    fs.mkdirSync(path.join(root, id));
    fs.writeFileSync(path.join(root, id, 'index.html'), `<!doctype html><canvas id="c" width="64" height="64"></canvas>
<script type="module">
import {defineEngine} from '/kit/engine-kit.mjs';
const canvas = document.getElementById('c'), g = canvas.getContext('2d');
const engine = defineEngine({id: '${id}', width: 64, height: 64, fps: 10, duration: 1, seek(t) { ${seekBody} }});
window.__framemotion = {engine, canvas, ready: true};
</script>`);
    entries.push({id, page: `${id}/index.html`, size: {width: 64, height: 64}, fps: 10, duration: 1});
  }
  fs.writeFileSync(path.join(root, 'engines.json'), JSON.stringify({schema: 'framemotion-engines/1', engines: entries}));
  return root;
}

const drawRamp = `g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.fillRect(0, 0, 8 + Math.round(t * 50), 64);`;

test('nothing leaves the page: lookalike hosts, other ports and WebSockets all fail', {skip: browserSkip, timeout: 120000}, async (t) => {
  const root = fixtureRoot(t, {'net-probe': drawRamp});
  const {page, close} = await kit.openEngine('net-probe', {root});
  try {
    const result = await page.evaluate(async () => {
      const tryFetch = (url) => fetch(url).then((r) => `status ${r.status}`, () => 'blocked');
      const trySocket = (url) => new Promise((resolve) => {
        let ws;
        try { ws = new WebSocket(url); } catch { resolve('blocked'); return; }
        ws.onopen = () => resolve('open');
        ws.onerror = () => resolve('blocked');
        ws.onclose = () => resolve('blocked');
        setTimeout(() => resolve('timeout'), 5000);
      });
      return {
        own: await tryFetch('/engines.json'),
        lookalike: await tryFetch('http://framemotion.local.example.com/x'),
        port: await tryFetch('http://framemotion.local:8080/x'),
        https: await tryFetch('https://example.com/'),
        socket: await trySocket('ws://example.com/'),
        ownSocket: await trySocket('ws://framemotion.local/'),
        beacon: navigator.sendBeacon('https://example.com/b', 'x'),
      };
    });
    assert.equal(result.own, 'status 200', 'the engines folder itself is served');
    for (const key of ['lookalike', 'port', 'https', 'socket', 'ownSocket']) assert.equal(result[key], 'blocked', `${key}: ${result[key]}`);
  } finally { await close(); }
});

test('the runner fails on an error after start and flags a flat frame', {skip: browserSkip, timeout: 120000}, async (t) => {
  const root = fixtureRoot(t, {
    'late-error': `${drawRamp} if (t > 0.5) throw new Error('boom at ' + t);`,
    'async-error': `${drawRamp} if (t > 0.5) setTimeout(() => { throw new Error('async boom'); }, 0);`,
    'flat-frame': `g.fillStyle = '#336'; g.fillRect(0, 0, 64, 64);`,
    'good-ramp': drawRamp,
    'missing-file': `${drawRamp} if (t > 0.5 && !window.asked) { window.asked = true; const img = new Image(); img.src = '/missing-file/logo.png'; }`,
  });
  await assert.rejects(kit.renderFrames('late-error', {root, frames: [0, 9]}), /boom at 0\.9/);
  await assert.rejects(kit.renderFrames('async-error', {root, frames: [0, 9, 0]}), /async boom/);
  await assert.rejects(kit.renderFrames('missing-file', {root, frames: [0, 9, 0]}), /404 \/missing-file\/logo\.png/);
  const flat = await kit.renderFrames('flat-frame', {root, frames: [0]});
  assert.equal(flat.frames[0].flat, true);
  const good = await kit.renderFrames('good-ramp', {root, frames: [0, 9]});
  assert.ok(good.frames.every((f) => f.deterministic && !f.flat));
});

test('the runner refuses a page whose engine differs from its registry entry', {skip: browserSkip, timeout: 120000}, async (t) => {
  const root = fixtureRoot(t, {'size-check': drawRamp});
  const registryFile = path.join(root, 'engines.json');
  const reg = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  reg.engines[0].fps = 24;
  fs.writeFileSync(registryFile, JSON.stringify(reg));
  await assert.rejects(kit.renderFrames('size-check', {root, frames: [0]}), /fps 10 differs from registry 24/);
});

test('engine settings are checked against the registry before a browser starts', () => {
  const entry = kit.registry().engines.find((e) => e.id === 'photoreal-demo');
  assert.doesNotThrow(() => kit.validateParams(entry, {samples: 32, aperture: 0, width: 270, height: 480}));
  assert.throws(() => kit.validateParams(entry, {sampels: 32}), /no setting "sampels"/);
  assert.throws(() => kit.validateParams(entry, {samples: 1.5}), TypeError);
  assert.throws(() => kit.validateParams(entry, {samples: 100000}), RangeError);
  assert.throws(() => kit.validateParams(entry, {width: 4}), RangeError);
  assert.throws(() => kit.validateParams(entry, []), TypeError);
});
