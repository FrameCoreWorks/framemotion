// The shared engine renderer: offline routing, safe file serving and frame checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

const {ENGINES_ROOT, isEngineUrl, resolveInside} = kit;
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const browserSkip = playwright ? false : 'engines: Playwright is not installed';

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

test('an engine whose renderFrame draws later is captured after it has drawn', {skip: browserSkip, timeout: 120000}, async (t) => {
  const root = fixtureRoot(t, {});
  fs.mkdirSync(path.join(root, 'slow-draw'));
  fs.writeFileSync(path.join(root, 'slow-draw', 'index.html'), `<!doctype html><canvas id="c" width="64" height="64"></canvas>
<script>
const g = document.getElementById('c').getContext('2d');
window.renderFrame = async (t) => {
  await new Promise((r) => setTimeout(r, 30));   // a font or image that loads first, like a kaventro film
  g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.fillRect(0, 0, 8 + Math.round(t * 50), 64);
};
</script>`);
  const registryFile = path.join(root, 'engines.json');
  const reg = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  reg.engines.push({id: 'slow-draw', page: 'slow-draw/index.html', adapter: 'renderFrame', capture: '#c', size: {width: 64, height: 64}, fps: 10, duration: 1});
  fs.writeFileSync(registryFile, JSON.stringify(reg));
  const report = await kit.renderFrames('slow-draw', {root, frames: [0, 5, 9]});
  for (const f of report.frames) assert.ok(f.mean > 20 && !f.flat, `frame ${f.frame} was captured before it was drawn (mean ${f.mean})`);
  assert.ok(report.frames[2].mean > report.frames[0].mean);
});

test('a request outside the engines folder fails the render unless the entry allows it', {skip: browserSkip, timeout: 120000}, async (t) => {
  const asks = `${drawRamp} if (!window.asked) { window.asked = true; const s = document.createElement('script'); s.src = 'https://cdn.example.com/lib.js'; document.head.append(s); }`;
  const root = fixtureRoot(t, {'asks-outside': asks});
  await assert.rejects(kit.renderFrames('asks-outside', {root, frames: [0]}), /asked for files outside.*cdn\.example\.com\/lib\.js/);
  const registryFile = path.join(root, 'engines.json');
  const reg = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  reg.engines[0].allowed_blocked = ['https://cdn.example.com/lib.js'];
  fs.writeFileSync(registryFile, JSON.stringify(reg));
  const report = await kit.renderFrames('asks-outside', {root, frames: [0]});
  assert.deepEqual(report.blocked, ['https://cdn.example.com/lib.js']);
});

/** The first pixel of a PNG and its colour type (6 = RGBA), read without an image library. */
function firstPixel(file) {
  const png = fs.readFileSync(file);
  const colourType = png[25];
  const chunks = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at), type = png.toString('ascii', at + 4, at + 8);
    if (type === 'IDAT') chunks.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  return {colourType, rgba: [...raw.subarray(1, 5)]};   // every PNG filter leaves the first pixel of row 0 as is
}

test('the kaventro overlay film is captured with a transparent background', {skip: browserSkip, timeout: 180000}, async (t) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-overlay-'));
  t.after(() => fs.rmSync(out, {recursive: true, force: true}));
  const report = await kit.renderFrames('kaventro-overlay', {frames: [240], out, once: true});
  assert.ok(!report.frames[0].flat, 'the lower third is drawn');
  const {colourType, rgba} = firstPixel(path.join(out, 'kaventro-overlay-00240.png'));
  assert.equal(colourType, 6, 'PNG with an alpha channel');
  assert.equal(rgba[3], 0, 'the corner is fully transparent (no preview checkerboard)');
});

test('bundled engines render from a workspace copy when their folders sit next to engines', {skip: browserSkip, timeout: 240000}, async (t) => {
  const assets = path.dirname(ENGINES_ROOT);
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-workspace-'));
  t.after(() => fs.rmSync(workspace, {recursive: true, force: true}));
  const engines = path.join(workspace, 'engines');
  fs.cpSync(ENGINES_ROOT, engines, {recursive: true, filter: (src) => !src.split(path.sep).includes('node_modules')});
  for (const name of ['kaventro-engine', 'hairline', 'anatomy-engine']) fs.cpSync(path.join(assets, name), path.join(workspace, name), {recursive: true});
  for (const [id, frame] of [['kaventro-blank', 360], ['hairline-spice-rack', 120], ['anatomy-svg', 119]]) {
    const report = await kit.renderFrames(id, {root: engines, frames: [frame], once: true});
    assert.ok(!report.frames[0].flat, `${id} draws from the workspace copy`);
  }
  fs.rmSync(path.join(workspace, 'kaventro-engine'), {recursive: true});
  await assert.rejects(kit.renderFrames('kaventro-blank', {root: engines, frames: [0], once: true}), /needs the folder "kaventro-engine" next to "engines"/);
});

test('the stickman engine shows one clip at a time and repeats every frame', {skip: browserSkip, timeout: 240000}, async () => {
  // Frames inside four clips of the reel sample (hook, steam, mechanism) and the very last frame.
  const report = await kit.renderFrames('stickman-reel', {frames: [30, 400, 900, 1214]});
  for (const f of report.frames) {
    assert.ok(f.deterministic, `frame ${f.frame} repeats byte for byte`);
    assert.ok(!f.flat, `frame ${f.frame} is drawn`);
  }
  assert.equal(new Set(report.frames.map((f) => f.hash)).size, 4, 'each clip shows its own scene');
});

test('a teardown frame repeats and does not depend on the frames drawn before it', {skip: browserSkip, timeout: 240000}, async () => {
  // The watch sample: assembled, labelled and exploded, the board out under its own camera, closed.
  const forward = await kit.renderFrames('teardown-watch', {frames: [0, 120, 210, 323]});
  for (const f of forward.frames) {
    assert.ok(f.deterministic, `frame ${f.frame} repeats byte for byte`);
    assert.ok(!f.flat, `frame ${f.frame} is drawn`);
  }
  assert.equal(new Set(forward.frames.map((f) => f.hash)).size, 4);
  const back = await kit.renderFrames('teardown-watch', {frames: [323, 210, 120, 0], once: true});
  const hash = (r) => Object.fromEntries(r.frames.map((f) => [f.frame, f.hash]));
  assert.deepEqual(hash(back), hash(forward));
});

test('a launch film draws Polish letters and its frames do not depend on the frames drawn before it', {skip: browserSkip || (process.env.CI ? 'KNOWN-CI-ONLY (owner-approved 2026-11-18): differs on the GitHub runner, passes locally; fix tracked in its own PR. Runs everywhere else.' : false), timeout: 240000}, async () => {
  // FrameMotion's Polish sample of the kinetic type style at 9:16: the lockup, the hook with Ł and Ż, Ś, the lockup again.
  const forward = await kit.renderFrames('launch-type-pl', {frames: [0, 131, 348, 479]});
  for (const f of forward.frames) {
    assert.ok(f.deterministic, `frame ${f.frame} repeats byte for byte`);
    assert.ok(!f.flat, `frame ${f.frame} is drawn`);
  }
  assert.equal(forward.engine.width, 1080);
  assert.equal(forward.engine.height, 1920);
  assert.deepEqual(forward.critique.filter((c) => c.status === 'FAIL'), [], 'the engine\'s own check passes (letter gaps, margins, loop)');
  const back = await kit.renderFrames('launch-type-pl', {frames: [479, 348, 131, 0], once: true});
  const hash = (r) => Object.fromEntries(r.frames.map((f) => [f.frame, f.hash]));
  assert.deepEqual(hash(back), hash(forward));
});

test('a launch film\'s planned one-colour wipe is a listed flat frame, not a failed draw', {skip: browserSkip, timeout: 240000}, async () => {
  const report = await kit.renderFrames('launch-shapes', {frames: [300], once: true});
  assert.ok(report.frames[0].flat && report.frames[0].flatExpected);
  await assert.rejects(kit.renderFrames('launch-shapes', {frames: [600], once: true}), /has 600 frames \(0 to 599\)/);
});
