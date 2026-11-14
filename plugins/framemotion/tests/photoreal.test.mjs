import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {subframePlan, shearProjection} from '../skills/framemotion/assets/engines/photoreal/lens.mjs';
import {uchimura, gradePixel, vignetteFactor, DEFAULT_LOOK} from '../skills/framemotion/assets/engines/photoreal/film-grade.mjs';
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

test('the renderer serves files only from inside the engines folder', () => {
  assert.equal(resolveInside(ENGINES_ROOT, '/../../SKILL.md'), null);
  assert.equal(resolveInside(ENGINES_ROOT, '/%2e%2e/%2e%2e/SKILL.md'), null);
  assert.equal(resolveInside(ENGINES_ROOT, '/photoreal/lens.mjs'), path.join(ENGINES_ROOT, 'photoreal/lens.mjs'));
});

const three = fs.existsSync(path.join(engines, 'node_modules/three/package.json'));
test('photoreal demo renders deterministic frames and the shader matches the reference grade', {skip: three ? false : 'three is not installed (npm ci in assets/engines)', timeout: 300000}, async (t) => {
  const kit = await import('../skills/framemotion/assets/engines/kit/render-engine.mjs');
  try { await kit.loadPlaywright(); } catch { t.skip('Playwright is not installed'); return; }
  const report = await kit.renderFrames('photoreal-demo', {frames: [0, 59], params: {samples: 4, width: 270, height: 480}});
  assert.ok(report.frames.every((f) => f.deterministic), 'every frame repeats exactly');
  assert.ok(report.frames.every((f) => f.max - f.min > 40), 'frames are not blank');
  const {browser, page} = await kit.openEngine('photoreal-demo', {params: {samples: 1, width: 64, height: 64}});
  try {
    const look = {exposure: 1.2, vignette: 0, bloom: 0, grain: 0, dither: false, saturation: 1.1, contrast: 1.05};
    for (const flat of [[0.05, 0.18, 0.9], [0.6, 0.6, 0.6], [2.5, 0.4, 0.02]]) {
      const shader = await page.evaluate(({flat, look}) => window.__framemotion.checks.gradeParity(flat, look), {flat, look});
      const reference = gradePixel(flat, look).map((x) => Math.round(x * 255));
      shader.forEach((v, i) => assert.ok(Math.abs(v - reference[i]) <= 1, `${flat}: shader ${shader} vs reference ${reference}`));
    }
  } finally { await browser.close(); }
});
