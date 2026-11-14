import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {subframePlan, shearProjection} from '../skills/framemotion/assets/engines/photoreal/lens.mjs';
import {createAccumCamera} from '../skills/framemotion/assets/engines/photoreal/accum-camera.mjs';
import {subframeTimes} from '../skills/framemotion/assets/engines/kit/engine-kit.mjs';
import {uchimura, gradePixel, vignetteFactor, grainOffset, MAX_LINEAR, DEFAULT_LOOK} from '../skills/framemotion/assets/engines/photoreal/film-grade.mjs';
import {resolveInside, ENGINES_ROOT} from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

const engines = fileURLToPath(new URL('../skills/framemotion/assets/engines/', import.meta.url));

function perspective(fovDeg, aspect, near = 0.1, far = 100) {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0];
}
function ndc(m, [x, y, z]) {
  const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  return [cx / cw, cy / cw];
}

test('the focus plane stays still while the camera crosses the aperture', () => {
  const focus = 2.5, point = [0.3, -0.2, -focus];
  const base = ndc(perspective(35, 9 / 16), point);
  for (const s of subframePlan(10, {fps: 30, samples: 24, aperture: 0.02})) {
    const m = shearProjection(perspective(35, 9 / 16), {...s, jx: 0, jy: 0, focus, width: 540, height: 960});
    const moved = ndc(m, [point[0] - s.lx, point[1] - s.ly, point[2]]);
    assert.ok(Math.abs(moved[0] - base[0]) < 1e-9 && Math.abs(moved[1] - base[1]) < 1e-9);
  }
  // a point far behind the focus plane moves: that is the blur
  const far = [0.3, -0.2, -10], s = subframePlan(10, {fps: 30, samples: 24, aperture: 0.02})[3];
  const m = shearProjection(perspective(35, 9 / 16), {...s, jx: 0, jy: 0, focus, width: 540, height: 960});
  assert.ok(Math.abs(ndc(m, [far[0] - s.lx, far[1] - s.ly, far[2]])[0] - ndc(perspective(35, 9 / 16), far)[0]) > 1e-4);
});

test('pixel jitter shifts the image by less than one pixel', () => {
  const s = {jx: 0.5, jy: -0.5, lx: 0, ly: 0, focus: 1, width: 540, height: 960};
  const m = shearProjection(perspective(35, 0.5625), s), p = [0.1, 0.1, -3];
  const [a, b] = [ndc(perspective(35, 0.5625), p), ndc(m, p)];
  assert.ok(Math.abs((a[0] - b[0]) * 540 / 2) <= 0.5 + 1e-9);
  assert.ok(Math.abs((a[1] - b[1]) * 960 / 2) <= 0.5 + 1e-9);
});

test('sub-frames stay inside the shutter, the aperture and the film, and repeat exactly', () => {
  const plan = subframePlan(30, {fps: 30, samples: 32, shutter: 0.5, aperture: 0.01});
  assert.equal(plan.length, 32);
  for (const s of plan) {
    assert.ok(Math.abs(s.t - 1) <= 0.25 / 30 + 1e-12);
    assert.ok(Math.hypot(s.lx, s.ly) <= 0.01 + 1e-12);
    assert.ok(Math.abs(s.jx) <= 0.5 && Math.abs(s.jy) <= 0.5);
  }
  assert.deepEqual(plan, subframePlan(30, {fps: 30, samples: 32, shutter: 0.5, aperture: 0.01}));
  assert.deepEqual(subframePlan(0, {fps: 30, samples: 1}), [{t: 0, jx: 0, jy: 0, lx: 0, ly: 0}]);
  assert.ok(subframePlan(0, {fps: 30, samples: 8}).every((s) => s.t >= 0));
  assert.ok(subframePlan(59, {fps: 30, samples: 8, duration: 59 / 30}).every((s) => s.t <= 59 / 30));
  assert.throws(() => shearProjection(perspective(35, 1), {jx: 0, jy: 0, lx: 0, ly: 0, focus: 0, width: 1, height: 1}), RangeError);
});

test('the filmic curve is monotonic, keeps black and approaches its peak', () => {
  assert.equal(uchimura(0, 1), 0);
  let last = -1;
  for (let x = 0; x <= 8; x += 0.01) { const y = uchimura(x, 1); assert.ok(y >= last - 1e-12); last = y; }
  assert.ok(uchimura(8, 1) > 0.99 && uchimura(8, 1) <= 1);
  assert.ok(Math.abs(uchimura(0.4, 1) - 0.4) < 1e-9, 'linear section passes through');
});

test('the reference grade is stable and keeps grey neutral', () => {
  const neutral = {...DEFAULT_LOOK, shadowTint: [1, 1, 1], highTint: [1, 1, 1], vignette: 0};
  const g = gradePixel([0.18, 0.18, 0.18], neutral);
  assert.ok(Math.abs(g[0] - g[1]) < 1e-12 && Math.abs(g[1] - g[2]) < 1e-12);
  assert.deepEqual(gradePixel([0.3, 0.2, 0.1]), gradePixel([0.3, 0.2, 0.1]));
  assert.ok(gradePixel([4, 4, 4]).every((x) => x <= 1));
  assert.ok(vignetteFactor(0.5, 0.5, 9 / 16, 0.3) === 1 && vignetteFactor(0, 0, 9 / 16, 0.3) < 1);
});

test('the lens plan uses exactly the contract sub-frame times', () => {
  for (const [frame, samples] of [[0, 1], [12, 8], [59, 16]]) {
    const options = {fps: 30, samples, shutter: 0.5, duration: 2};
    assert.deepEqual(subframePlan(frame, options).map((s) => s.t), subframeTimes(frame, options));
  }
});

test('very bright light is clamped and burns towards white', () => {
  assert.deepEqual(gradePixel([1e9, 1, 1]), gradePixel([MAX_LINEAR, 1, 1]));
  assert.ok(gradePixel([Infinity, 0, 0]).every(Number.isFinite));
  const hot = gradePixel([40, 4, 0.4], {vignette: 0});
  assert.ok(Math.min(...hot) > 0.9, `a hot orange highlight reaches near white: ${hot}`);
  const kept = gradePixel([40, 4, 0.4], {vignette: 0, highlightRolloff: 0});
  assert.ok(kept[2] < hot[2], 'without roll-off the highlight stays saturated');
  assert.deepEqual(gradePixel([0.2, 0.1, 0.05], {vignette: 0}), gradePixel([0.2, 0.1, 0.05], {vignette: 0, highlightRolloff: 0}), 'mid tones are untouched');
});

test('the grain offset is small and changes every frame', () => {
  const seen = new Set();
  for (let f = 0; f < 600; f++) {
    const [x, y] = grainOffset(f);
    assert.ok(x >= 0 && x < 256 && y >= 0 && y < 256);
    seen.add(`${x},${y}`);
  }
  assert.equal(seen.size, 600);
  assert.deepEqual(grainOffset(123456789), grainOffset(123456789));
});

test('the vignette darkens the corners smoothly, the same way the shader does', () => {
  let last = 2;
  for (let r = 0; r <= 0.7; r += 0.05) { const v = vignetteFactor(0.5 + r, 0.5 + r, 1 / 0.82, 1); assert.ok(v <= last + 1e-12); last = v; }
  assert.equal(vignetteFactor(0.5, 0.5, 1, 1), 1);
});

const three = fs.existsSync(path.join(engines, 'node_modules/three/package.json'));
test('photoreal demo renders deterministic frames and the shader matches the reference grade', {skip: three ? false : 'three is not installed (npm ci in assets/engines)', timeout: 300000}, async (t) => {
  const kit = await import('../skills/framemotion/assets/engines/kit/render-engine.mjs');
  try { await kit.loadPlaywright(); } catch { t.skip('Playwright is not installed'); return; }
  const report = await kit.renderFrames('photoreal-demo', {frames: [0, 59], params: {samples: 4, width: 270, height: 480}});
  assert.ok(report.frames.every((f) => f.deterministic), 'every frame repeats exactly');
  assert.ok(report.frames.every((f) => f.max - f.min > 40), 'frames are not blank');
  const {page, close} = await kit.openEngine('photoreal-demo', {params: {samples: 1, width: 64, height: 64}});
  try {
    const look = {exposure: 1.2, vignette: 0, bloom: 0, grain: 0, dither: false, saturation: 1.1, contrast: 1.05};
    for (const flat of [[0.05, 0.18, 0.9], [0.6, 0.6, 0.6], [2.5, 0.4, 0.02]]) {
      const shader = await page.evaluate(({flat, look}) => window.__framemotion.checks.gradeParity(flat, look), {flat, look});
      const reference = gradePixel(flat, look).map((x) => Math.round(x * 255));
      shader.forEach((v, i) => assert.ok(Math.abs(v - reference[i]) <= 1, `${flat}: shader ${shader} vs reference ${reference}`));
    }
    // Off centre with vignette, bloom and very bright input: the bloom of a flat frame is the
    // frame itself once normalised by the number of levels (and clamped like the frame).
    const lit = {exposure: 1, vignette: 0.6, bloom: 0.4, grain: 0, dither: false};
    for (const [flat, x, y] of [[[0.4, 0.3, 0.2], 0, 0], [[0.4, 0.3, 0.2], 7, 3], [[100, 2, 0.5], 1, 6]]) {
      const shader = await page.evaluate(({flat, lit, x, y}) => window.__framemotion.checks.gradeParity(flat, lit, {x, y}), {flat, lit, x, y});
      const glow = flat.map((c) => Math.min(c, MAX_LINEAR));
      const reference = gradePixel(flat, lit, {u: (x + 0.5) / 8, v: (y + 0.5) / 8, aspect: 1, bloom: glow}).map((c) => Math.round(c * 255));
      shader.forEach((v, i) => assert.ok(Math.abs(v - reference[i]) <= 1, `${flat} at ${x},${y}: shader ${shader} vs reference ${reference}`));
    }
    // 96 sub-frames of one flat grey must average back to that grey.
    const auto = await page.evaluate(() => window.__framemotion.checks.accumPrecision(0.37, 96));
    const half = await page.evaluate(() => window.__framemotion.checks.accumPrecision(0.37, 96, 'half'));
    t.diagnostic(`accumulation over 96 sub-frames: ${auto.precision} error ${(auto.error * 100).toFixed(4)}%, half error ${(half.error * 100).toFixed(4)}%`);
    if (auto.precision === 'float') assert.ok(auto.error < 0.001, `float accumulation drifts ${auto.error}`);
    else t.diagnostic('this GPU cannot blend 32-bit floats; accumulation fell back to half floats');
  } finally { await close(); }
});

test('bundled engines render deterministic frames through their adapters', {skip: three ? false : 'engines are not installed (npm ci in assets/engines)', timeout: 300000}, async (t) => {
  const kit = await import('../skills/framemotion/assets/engines/kit/render-engine.mjs');
  try { await kit.loadPlaywright(); } catch { t.skip('Playwright is not installed'); return; }
  for (const [id, frames] of [['animate-starter', [0, 191]], ['anatomy-svg', [0, 119]]]) {
    const report = await kit.renderFrames(id, {frames});
    assert.equal(report.engine.id, id);
    assert.ok(report.frames.every((f) => f.deterministic), `${id}: every frame repeats exactly`);
    assert.ok(report.frames.every((f) => f.max - f.min > 20), `${id}: frames are not blank`);
  }
});

async function loadThree() {
  try { return await import(new URL('../skills/framemotion/assets/engines/node_modules/three/build/three.module.js', import.meta.url)); } catch { return null; }
}

/** A renderer stand-in that records what the accumulation camera asks of it. */
function fakeRenderer(THREE, {float = true, failAt = -1} = {}) {
  const state = {target: 'canvas', autoClear: true, color: new THREE.Color(0.2, 0.4, 0.6), alpha: 0.5, renders: []};
  return {
    state,
    extensions: {has: (name) => float || !/float/i.test(name)},
    capabilities: {isWebGL2: true},
    get autoClear() { return state.autoClear; }, set autoClear(v) { state.autoClear = v; },
    getRenderTarget: () => state.target, setRenderTarget: (t) => { state.target = t; },
    getClearColor: (c) => c.copy(state.color), getClearAlpha: () => state.alpha,
    setClearColor: (c, a) => { state.color = new THREE.Color(c); state.alpha = a; }, clear() {},
    render(scene, camera) {
      if (camera.isPerspectiveCamera) {
        if (state.renders.length === failAt) throw new Error('lost context');
        state.renders.push(camera.getWorldPosition(new THREE.Vector3()));
      }
    },
  };
}

test('the accumulation camera works from a parented, scaled camera and restores everything', {skip: three ? false : 'three is not installed'}, async () => {
  const THREE = await loadThree();
  const renderer = fakeRenderer(THREE);
  const accum = createAccumCamera({THREE, renderer, width: 64, height: 64});
  assert.equal(accum.precision, 'float');
  assert.equal(accum.target.texture.type, THREE.FloatType);
  assert.equal(createAccumCamera({THREE, renderer: fakeRenderer(THREE, {float: false}), width: 64, height: 64}).precision, 'half');

  const rig = new THREE.Group();
  rig.position.set(5, 1, -2); rig.rotation.y = 0.7; rig.scale.setScalar(3);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0.5, 2); rig.add(camera);
  const scene = new THREE.Scene(); scene.add(rig);
  rig.updateMatrixWorld(true);
  const base = camera.getWorldPosition(new THREE.Vector3());
  const times = [];
  const aperture = 0.05;
  accum.render({scene, camera, frame: 10, fps: 30, samples: 16, aperture, focus: 2, prepare: (t) => times.push(t)});
  const offsets = renderer.state.renders.map((p) => p.distanceTo(base));
  assert.ok(offsets.every((d) => d <= aperture + 1e-9), `world offsets stay inside the aperture: ${Math.max(...offsets)}`);
  assert.ok(Math.max(...offsets) > aperture * 0.5, 'the lens really moves the camera');
  assert.ok(camera.getWorldPosition(new THREE.Vector3()).distanceTo(base) < 1e-12, 'camera restored');
  assert.equal(times.at(-1), 10 / 30, 'the scene is left at the frame time');
  assert.equal(renderer.state.target, 'canvas');
  assert.equal(renderer.state.autoClear, true);
  assert.deepEqual([renderer.state.color.r, renderer.state.alpha], [0.2, 0.5], 'clear colour restored');

  const failing = fakeRenderer(THREE, {failAt: 3});
  const broken = createAccumCamera({THREE, renderer: failing, width: 64, height: 64});
  assert.throws(() => broken.render({scene, camera, frame: 0, fps: 30, samples: 8, aperture, focus: 2}), /lost context/);
  assert.equal(failing.state.target, 'canvas');
  assert.equal(failing.state.autoClear, true);
  assert.equal(failing.state.alpha, 0.5);
  assert.ok(camera.getWorldPosition(new THREE.Vector3()).distanceTo(base) < 1e-12, 'camera restored after a failed sub-frame');
  assert.throws(() => accum.render({scene, camera: new THREE.OrthographicCamera(), frame: 0, fps: 30}), TypeError);
});
