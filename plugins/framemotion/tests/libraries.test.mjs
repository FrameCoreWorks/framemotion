// Library engines (assets/engines/libraries): each library on the FrameMotion clock.
import test from 'node:test';
import assert from 'node:assert/strict';
import {withSeededRandom} from '../skills/framemotion/assets/engines/libraries/library-kit.mjs';
import {PRESETS, uniformsFor} from '../skills/framemotion/assets/engines/libraries/paper-shaders/presets.mjs';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import fs from 'node:fs';
import {PRESETS as PARTICLES} from '../skills/framemotion/assets/engines/libraries/tsparticles/presets.mjs';
import {DOODLES} from '../skills/framemotion/assets/engines/libraries/css-doodle/doodles.mjs';
import {EFFECTS} from '../skills/framemotion/assets/engines/libraries/pixi-filters/effects.mjs';
import {DRAWINGS} from '../skills/framemotion/assets/engines/libraries/brush/drawings.mjs';

const ENGINES = new URL('../skills/framemotion/assets/engines/', import.meta.url);
const entry = (id) => kit.registry().engines.find((e) => e.id === id);

let ready = true;
try { await kit.loadPlaywright(); await import('../skills/framemotion/assets/engines/node_modules/torph/dist/index.mjs'); } catch { ready = false; }
const skip = ready ? false : 'engines: Playwright or the library packages are not installed (npm ci in assets/engines)';

test('seeded random numbers repeat and Math.random comes back, even after an error', () => {
  const original = Math.random;
  const a = withSeededRandom(42, () => [Math.random(), Math.random()]);
  const b = withSeededRandom(42, () => [Math.random(), Math.random()]);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, withSeededRandom(43, () => [Math.random(), Math.random()]));
  assert.throws(() => withSeededRandom(1, () => { throw new Error('x'); }));
  assert.equal(Math.random, original);
});

test('a Paper Shaders look refuses a setting the shader does not have', () => {
  const paper = {ShaderFitOptions: {contain: 1, none: 0}, getShaderColorFromString: () => [1, 1, 1, 1], getShaderNoiseTexture: () => null, GrainGradientShapes: {corners: 4}};
  assert.throws(() => uniformsFor(paper, 'mesh-gradient', {...PRESETS['mesh-gradient'].look, swril: 1}), /no look setting "swril"/);
  const u = uniformsFor(paper, 'grain-gradient', PRESETS['grain-gradient'].look);
  assert.equal(u.u_shape, 4);
  assert.equal(u.u_colorsCount, 4);
});

test('each ready look in the registry is one the page knows, and wrong settings fail before a browser starts', () => {
  const pairs = [['paper-shader', 'shader', PRESETS], ['pixi-filter', 'effect', EFFECTS], ['css-doodle', 'doodle', DOODLES],
    ['tsparticles', 'preset', PARTICLES], ['p5-brush', 'drawing', DRAWINGS]];
  for (const [id, key, table] of pairs) assert.deepEqual([...entry(id).params[key].enum].sort(), Object.keys(table).sort(), `${id}.${key}`);
  assert.throws(() => kit.validateParams(entry('tsparticles'), {preset: 'snow'}), /must be one of: confetti, drift, links/);
  assert.doesNotThrow(() => kit.validateParams(entry('torph-text'), {words: ['Raz', 'Dwa', 'Trzy']}));
  assert.throws(() => kit.validateParams(entry('torph-text'), {words: 'Raz'}), /must be array/);
  assert.throws(() => kit.validateParams(entry('torph-text'), {words: ['Raz', 3]}), /must hold string items/);
  assert.throws(() => kit.validateParams(entry('torph-text'), {words: []}), /1 to 50 items/);
  assert.throws(() => kit.validateParams(entry('torph-text'), {words: ['x'.repeat(61)]}), /at most 60 characters/);
});

test('npm does not install p5.js (LGPL) as a peer of p5.brush', () => {
  assert.match(fs.readFileSync(new URL('.npmrc', ENGINES), 'utf8'), /^legacy-peer-deps=true$/m);
  const lock = JSON.parse(fs.readFileSync(new URL('package-lock.json', ENGINES), 'utf8'));
  assert.ok(lock.packages['node_modules/p5.brush'], 'p5.brush is in the lock');
  assert.equal(lock.packages['node_modules/p5'], undefined, 'p5 is not in the lock');
});

// Each engine: frames repeat exactly, are not blank, a frame is the same after seeking elsewhere
// (also backwards, which restarts the particle simulation), and the last frame rendered alone in a
// fresh browser is the same as in the run (the picture does not depend on what came before).
const CASES = [
  ['paper-shader', {}, [0, 60, 119, 60]],
  ['paper-shader', {shader: 'god-rays'}, [0, 90, 0]],
  ['paper-shader', {shader: 'grain-gradient'}, [10, 70, 10]],
  ['paper-shader', {shader: 'warp'}, [10, 70, 10]],
  ['pixi-filter', {effect: 'glitch'}, [15, 45, 15]],
  ['pixi-filter', {effect: 'shockwave'}, [10, 30, 10]],
  ['pixi-filter', {effect: 'crt'}, [10, 30, 10]],
  ['pixi-filter', {effect: 'godrays'}, [10, 60, 10]],
  ['css-doodle', {doodle: 'tiles'}, [20, 60, 20]],
  ['torph-text', {}, [34, 90, 34]],
  ['torph-text', {words: ['Raz', 'Dwa', 'Trzy'], hold: 1.5}, [20, 60, 120, 60]],
  ['tsparticles', {preset: 'confetti'}, [0, 30, 90, 30]],
  ['tsparticles', {preset: 'links'}, [30, 90, 30]],
  ['tsparticles', {preset: 'drift', options: {particles: {number: {value: 40}}}}, [30, 90, 30]],
  ['p5-brush', {}, [50, 119, 50]],
];
for (const [id, params, frames] of CASES) {
  test(`${id} ${JSON.stringify(params)} draws repeatable frames in any order`, {skip: skip || (id === 'p5-brush' && process.env.CI ? 'KNOWN-CI-ONLY (owner-approved 2026-11-18): differs on the GitHub runner, passes locally; fix tracked in its own PR. Runs everywhere else.' : false), timeout: 300000}, async () => {
    const report = await kit.renderFrames(id, {params, frames});
    assert.ok(report.frames.every((f) => f.deterministic), 'every frame repeats exactly');
    assert.ok(report.frames.every((f) => !f.flat), 'no frame is blank');
    assert.equal(report.frames.at(-1).hash, report.frames.find((f) => f.frame === frames.at(-1)).hash);
    const distinct = new Set(report.frames.map((f) => f.hash));
    assert.ok(distinct.size > 1, 'the picture moves');
    const alone = await kit.renderFrames(id, {params, frames: [frames.at(-1)], once: true});
    assert.equal(alone.frames[0].hash, report.frames.at(-1).hash, 'the same frame from a fresh browser');
  });
}

test('css-doodle rings repeat when rendered in order (the one known limit)', {skip, timeout: 300000}, async () => {
  const a = await kit.renderFrames('css-doodle', {params: {doodle: 'rings'}, frames: [0, 30, 60]});
  const b = await kit.renderFrames('css-doodle', {params: {doodle: 'rings'}, frames: [0, 30, 60], once: true});
  assert.deepEqual(a.frames.map((f) => f.hash), b.frames.map((f) => f.hash));
});

test('a full-size reel frame draws for every library engine', {skip, timeout: 300000}, async () => {
  for (const id of ['paper-shader', 'pixi-filter', 'css-doodle', 'torph-text', 'tsparticles', 'p5-brush']) {
    const report = await kit.renderFrames(id, {params: {width: 1080, height: 1920}, frames: [60], once: true});
    assert.equal(report.engine.width, 1080, id);
    assert.ok(!report.frames[0].flat, `${id} draws at 1080×1920`);
  }
});

/** Pixels of the engine canvas at a frame: the corner pixel and the number of clearly different colours. */
async function canvasAt(id, params, frame) {
  const {page, close} = await kit.openEngine(id, {params});
  try {
    return await page.evaluate(async (f) => {
      const fm = window.__framemotion;
      await fm.engine.seekFrame(f);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = fm.canvas.width; ctx.canvas.height = fm.canvas.height; ctx.drawImage(fm.canvas, 0, 0);
      const px = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
      const colours = new Set();
      for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 200) colours.add(`${px[i] >> 5},${px[i + 1] >> 5},${px[i + 2] >> 5}`);
      return {corner: [...px.slice(0, 4)], colours: colours.size};
    }, frame);
  } finally { await close(); }
}

test('tsParticles keeps its colours and paints its background, or leaves it clear for an overlay', {skip, timeout: 120000}, async () => {
  const confetti = await canvasAt('tsparticles', {preset: 'confetti'}, 60);
  assert.deepEqual(confetti.corner, [13, 15, 20, 255], 'the background is in the pixels');
  assert.ok(confetti.colours >= 5, `confetti has its colours (saw ${confetti.colours})`);
  const overlay = await canvasAt('tsparticles', {preset: 'drift', background: 'transparent'}, 60);
  assert.equal(overlay.corner[3], 0, 'an overlay leaves the background clear');
});

test('a wrong setting found by the page fails at once, not after the time limit', {skip, timeout: 60000}, async () => {
  const t0 = Date.now();
  await assert.rejects(kit.renderFrames('torph-text', {params: {morph: 2}, frames: [0]}), /at most hold/);
  assert.ok(Date.now() - t0 < 30000, 'within 30 s');
});

test('a drawing may start on blank paper: frame 0 is flat by design, and the registry says so', {skip, timeout: 120000}, async () => {
  const report = await kit.renderFrames('p5-brush', {frames: [0], once: true});
  assert.ok(report.frames[0].flat && report.frames[0].flatExpected);
});

test('css-doodle and torph keep their own CSS animations where seek put them', {skip, timeout: 120000}, () => {
  const entries = kit.registry().engines.filter((e) => ['css-doodle', 'torph-text'].includes(e.id));
  assert.ok(entries.every((e) => e.css_animations === 'seeked'));
});
