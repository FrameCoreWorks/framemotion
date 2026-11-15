// Library engines (assets/engines/libraries): each library on the FrameMotion clock.
import test from 'node:test';
import assert from 'node:assert/strict';
import {withSeededRandom} from '../skills/framemotion/assets/engines/libraries/library-kit.mjs';
import {PRESETS, uniformsFor} from '../skills/framemotion/assets/engines/libraries/paper-shaders/presets.mjs';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

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

// Each engine: frames repeat exactly, are not blank, and a frame is the same after seeking elsewhere
// (also backwards, which restarts the particle simulation).
const CASES = [
  ['paper-shader', {}, [0, 60, 119, 60]],
  ['paper-shader', {shader: 'god-rays'}, [0, 90, 0]],
  ['pixi-filter', {effect: 'glitch'}, [15, 45, 15]],
  ['pixi-filter', {effect: 'shockwave'}, [10, 30, 10]],
  ['css-doodle', {doodle: 'tiles'}, [20, 60, 20]],
  ['torph-text', {}, [34, 90, 34]],
  ['tsparticles', {preset: 'confetti'}, [0, 30, 90, 30]],
  ['tsparticles', {preset: 'links'}, [30, 90, 30]],
  ['p5-brush', {}, [50, 119, 50]],
];
for (const [id, params, frames] of CASES) {
  test(`${id} ${JSON.stringify(params)} draws repeatable frames in any order`, {skip, timeout: 300000}, async () => {
    const report = await kit.renderFrames(id, {params, frames});
    assert.ok(report.frames.every((f) => f.deterministic), 'every frame repeats exactly');
    assert.ok(report.frames.every((f) => !f.flat), 'no frame is blank');
    assert.equal(report.frames.at(-1).hash, report.frames.find((f) => f.frame === frames.at(-1)).hash);
    const distinct = new Set(report.frames.map((f) => f.hash));
    assert.ok(distinct.size > 1, 'the picture moves');
  });
}

test('css-doodle and torph keep their own CSS animations where seek put them', {skip, timeout: 120000}, () => {
  const entries = kit.registry().engines.filter((e) => ['css-doodle', 'torph-text'].includes(e.id));
  assert.ok(entries.every((e) => e.css_animations === 'seeked'));
});
