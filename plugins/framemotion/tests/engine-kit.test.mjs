import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRng, halton, subframeTimes, defineEngine, bindToGsap} from '../skills/framemotion/assets/engines/kit/engine-kit.mjs';

test('seeded random numbers repeat for the same seed and differ for another', () => {
  const a = createRng(7), b = createRng(7), c = createRng(8);
  const seqA = Array.from({length: 5}, () => a.next());
  assert.deepEqual(seqA, Array.from({length: 5}, () => b.next()));
  assert.notDeepEqual(seqA, Array.from({length: 5}, () => c.next()));
  assert.ok(seqA.every((v) => v >= 0 && v < 1));
  assert.throws(() => createRng(-1), RangeError);
  assert.throws(() => createRng(1.5), RangeError);
});

test('halton gives the known base-2 and base-3 sequence', () => {
  assert.deepEqual([1, 2, 3, 4].map((i) => halton(i, 2)), [0.5, 0.25, 0.75, 0.125]);
  assert.ok(Math.abs(halton(1, 3) - 1 / 3) < 1e-12);
  assert.throws(() => halton(0, 2), RangeError);
});

test('sub-frames stay inside the shutter and the film', () => {
  assert.deepEqual(subframeTimes(30, {fps: 30}), [1]);
  const times = subframeTimes(30, {fps: 30, samples: 16, shutter: 0.5});
  assert.equal(times.length, 16);
  assert.ok(times.every((t) => Math.abs(t - 1) <= 0.25 / 30 + 1e-12));
  assert.ok(subframeTimes(0, {fps: 30, samples: 8}).every((t) => t >= 0));
  assert.ok(subframeTimes(59, {fps: 30, samples: 8, duration: 59 / 30}).every((t) => t <= 59 / 30));
  assert.deepEqual(subframeTimes(30, {fps: 30, samples: 8}), subframeTimes(30, {fps: 30, samples: 8}));
});

test('an engine is a pure function of time', () => {
  const engine = defineEngine({id: 'demo-dot', width: 1080, height: 1920, fps: 30, duration: 2,
    seek: (t) => ({x: Math.round(100 * t), seed: createRng(3).next()})});
  assert.equal(engine.totalFrames, 60);
  assert.deepEqual(engine.seekFrame(45), engine.seekFrame(45));
  const forward = [0, 15, 30, 59].map((f) => engine.seekFrame(f));
  const backward = [59, 30, 15, 0].map((f) => engine.seekFrame(f)).reverse();
  assert.deepEqual(forward, backward);
  assert.throws(() => engine.seekFrame(60), RangeError);
});

test('invalid engine definitions are refused', () => {
  const ok = {id: 'a', width: 64, height: 64, fps: 30, duration: 1, seek: () => {}};
  assert.throws(() => defineEngine({...ok, id: 'Bad Id'}), TypeError);
  assert.throws(() => defineEngine({...ok, width: 10}), RangeError);
  assert.throws(() => defineEngine({...ok, duration: 0}), RangeError);
  assert.throws(() => defineEngine({...ok, seek: null}), TypeError);
});

function loadGsap() {
  try {
    return createRequire(new URL('../skills/framemotion/assets/engines/package.json', import.meta.url))('gsap').gsap;
  } catch { return null; }
}

test('a paused real GSAP timeline draws the engine on every seek', {skip: loadGsap() ? false : 'engines: gsap not installed (npm ci in assets/engines)'}, () => {
  const gsap = loadGsap();
  const seen = [];
  const engine = defineEngine({id: 'probe', width: 64, height: 64, fps: 30, duration: 2, seek: (t) => seen.push(+t.toFixed(6))});
  const timeline = bindToGsap(engine, gsap);
  assert.equal(seen[0], 0, 'binding draws t = 0 at once');
  assert.equal(timeline.paused(), true);
  assert.equal(timeline.duration(), 2);
  seen.length = 0;
  timeline.seek(1.5);            // HyperFrames-style seek: callbacks suppressed by default
  timeline.seek(0.5, false);
  timeline.progress(1);
  timeline.seek(0.25);
  assert.deepEqual(seen, [1.5, 0.5, 2, 0.25]);
  assert.throws(() => bindToGsap(engine, {}), TypeError);
});

test('a renderFrame page becomes a contract engine', async () => {
  const {fromRenderFrame} = await import('../skills/framemotion/assets/engines/kit/adapters.mjs');
  const seen = [];
  const engine = fromRenderFrame({id: 'legacy', width: 64, height: 64, fps: 24, duration: 2, renderFrame: (t) => seen.push(t)});
  assert.equal(engine.totalFrames, 48);
  engine.seekFrame(12);
  engine.seekFrame(47);
  assert.deepEqual(seen, [0.5, 47 / 24]);
  assert.throws(() => fromRenderFrame({id: 'x', width: 64, height: 64, fps: 24, duration: 1}), TypeError);
});
