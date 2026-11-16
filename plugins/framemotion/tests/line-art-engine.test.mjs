// The bundled Line-art engine through FrameMotion's builder: a missing page or a frame rate the 1/60 s
// loop cannot hit stops the build, and a frame is a pure function of its time (replay and seeded random).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {BUILDERS} from '../skills/framemotion/assets/engines/kit/builders.mjs';

const ENGINES = path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines');
const entries = JSON.parse(fs.readFileSync(path.join(ENGINES, 'engines.json'), 'utf8')).engines;
const esbuild = fs.existsSync(path.join(ENGINES, 'node_modules/esbuild/package.json'));
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const buildSkip = esbuild ? false : 'engines: esbuild is not installed (npm ci in assets/engines)';
const browserSkip = !esbuild ? buildSkip : playwright ? false : 'engines: Playwright is not installed';
const walker = entries.find((e) => e.id === 'lineart-walker');

test('the build stops on a missing example, a missing mount or a frame rate off the 1/60 s grid', {skip: buildSkip}, async () => {
  await assert.rejects(BUILDERS.lineart({...walker, build: {tool: 'lineart', example: 'no-such'}}, ENGINES), /no index\.html/);
  await assert.rejects(BUILDERS.lineart({...walker, build: {...walker.build, mount: '#nothing'}}, ENGINES), /no #nothing element/);
  await assert.rejects(BUILDERS.lineart({...walker, fps: 24}, ENGINES), /fps must divide 60/);
  for (const seed of [0, -3, 2147483647, 1.5]) {
    await assert.rejects(BUILDERS.lineart({...walker, build: {...walker.build, seed}}, ENGINES), /build\.seed must be/);
  }
  const built = await BUILDERS.lineart(walker, ENGINES);
  const html = fs.readFileSync(path.join(built.dir, built.page), 'utf8');
  assert.doesNotMatch(html, /<script type="module"/);
  assert.match(html, /Math\.random = /);
  assert.match(html, /fm-canvas/);
  assert.equal(built.query.debug, '');
  fs.rmSync(built.dir, {recursive: true, force: true});
});

// The village moved up to a few thousand pixels between runs when captured as a screenshot (review 2026-11-16):
// the same sequences twice, forwards, backwards and alone, must give the same bytes.
for (const [id, orders] of [['lineart-walker', [[40, 300, 150], [150, 300, 40], [300]]],
  ['lineart-village', [[599, 150, 300], [0, 300, 599], [599, 150, 300], [0, 300, 599], [300]]]]) {
  test(`${id}: a frame does not depend on the frames drawn before it, nor on the run`, {skip: browserSkip, timeout: 900000}, async () => {
    const seen = new Map();
    for (const frames of orders) {
      const r = await kit.renderFrames(id, {frames, once: true});
      assert.deepEqual(r.blocked, []);
      for (const f of r.frames) {
        assert.ok(!f.flat, `frame ${f.frame} is flat`);
        if (seen.has(f.frame)) assert.equal(f.hash, seen.get(f.frame), `frame ${f.frame} after ${frames.join(', ')}`);
        else seen.set(f.frame, f.hash);
      }
    }
  });
}
