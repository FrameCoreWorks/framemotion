// Reanimate engine: FrameMotion's JavaScript port prints the same SVG as Reanimate itself for every
// ported documentation example (Reanimate's golden files, 10 frames each), its scenes follow the
// Haskell semantics, and the engine page renders deterministic frames through the engine kit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as R from '../skills/framemotion/assets/engines/reanimate/core/index.mjs';
import {EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/index.mjs';
import {CORE_EXAMPLES, haskellRound, haskellShowDouble} from '../skills/framemotion/assets/engines/reanimate/examples/core.mjs';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

const GOLDEN = fileURLToPath(new URL('./fixtures/reanimate-golden/', import.meta.url));
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }

/** Reanimate's test mode: 10 frames, frame i at duration / 9 * i, one line each, prefixed by i. */
const testFrames = (ani) => Array.from({length: 10}, (_, i) => `${i}${R.renderSvg(R.frameAt((ani.duration / 9) * i, ani))}`);

test('every core example with a Reanimate golden file prints byte-identical SVG', () => {
  const goldens = fs.readdirSync(GOLDEN).filter((f) => f.endsWith('.golden'));
  assert.equal(goldens.length, 54);
  for (const file of goldens) {
    const name = file.slice('doc_'.length, -'.golden'.length);
    assert.ok(CORE_EXAMPLES[name], `no port of ${name}`);
    const expected = fs.readFileSync(path.join(GOLDEN, file), 'utf8').split('\n').filter(Boolean);
    assert.deepEqual(testFrames(CORE_EXAMPLES[name]()), expected, name);
  }
});

test('examples without a golden file still draw every frame', () => {
  for (const name of ['powerS', 'signalS', 'spriteScope']) {
    const frames = testFrames(CORE_EXAMPLES[name]());
    assert.ok(frames.every((f) => f.includes('<svg') && f.endsWith('</svg>')), name);
  }
  assert.equal(R.duration(CORE_EXAMPLES.spriteScope()), 3);
  assert.equal(R.duration(CORE_EXAMPLES.signalS()), 4);
});

test('signals match their Haskell definitions', () => {
  assert.equal(R.curveS(2)(0.25), 0.125);
  assert.equal(R.curveS(2)(0.75), 0.875);
  assert.equal(R.bellS(2)(0.5), 1);
  assert.equal(R.oscillateS(0.75), 0.5);
  assert.equal(R.cubicBezierS([0, 0.8, 0.9, 1])(0.5), 3 * 0.8 * 0.125 + 3 * 0.9 * 0.125 + 0.125);
  assert.equal(R.fromToS(0.8, 0.2)(0.5), 0.5);
});

test('combinators keep Reanimate durations and timing', () => {
  const {drawBox, drawCircle} = R;
  assert.equal(R.seqA(drawBox, drawCircle).duration, 4);
  assert.equal(R.parA(drawBox, R.adjustDuration((d) => d * 2, drawCircle)).duration, 4);
  assert.equal(R.repeatA(1.5, drawCircle).duration, 3);
  assert.equal(R.overlapT(0.5, R.fadeT)(drawBox, drawCircle).duration, 3.5);
  assert.equal(R.pauseAround(1, 1, R.drawProgress).duration, 4);
  assert.throws(() => R.mkAnimation(0, () => R.None), /not positive/);
});

test('paths: arcs, partial drawing and bounding boxes', () => {
  const circle = R.pathify(R.mkCircle(1));
  const cmds = R.toLineCommands(circle.d);
  assert.equal(cmds.filter((c) => c.k === 'bezier').length, 4, 'a circle is four quarter arcs');
  assert.ok(Math.abs(R.totalLength(cmds) - 2 * Math.PI) < 2e-3, 'arc length of a unit circle');
  const half = R.partialSvg(0.5, circle);
  const end = R.toLineCommands(half.d).at(-1).ps.at(-1);
  assert.ok(Math.hypot(end[0] - 1, end[1]) < 1e-6, 'half a circle ends opposite its start');
  const [x, y, w, h] = R.boundingBox(R.translate(2, 1, R.mkRect(4, 2)));
  assert.deepEqual([x, y, w, h], [0, 0, 4, 2]);
  assert.deepEqual(R.parsePath('M0 0 l1,2 h3 Z').map((c) => c.c), ['M', 'L', 'H', 'Z']);
  assert.equal(R.renderSvg(R.mkPathString('M0,0 L1,1')).includes('d="M0,0 L1,1"'), true);
});

test('scene variables follow Reanimate (write, tween, modify)', () => {
  const ani = R.scene((s) => {
    const v = s.newVar(0);
    s.newSprite((f) => R.mkCircle(f.get(v)));
    s.tweenVar(v, 1, (val, t) => R.fromToS(val, 4)(t));
    s.modifyVar(v, (x) => x + 1);
    s.wait(1);
  });
  const radius = (t) => R.frameAt(t, ani).children[0].r;
  assert.equal(radius(0.5), 2);
  assert.equal(radius(1.5), 5);
});

test('Haskell helpers used by the examples', () => {
  assert.deepEqual([0.5, 1.5, 2.5, 2.6].map(haskellRound), [0, 2, 2, 3]);
  assert.equal(haskellShowDouble(2), '2.0');
  assert.equal(haskellShowDouble(0.25), '0.25');
  assert.equal(haskellShowDouble(0.01), '1.0e-2');
});

test('the engine page renders deterministic frames for several examples', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 300000}, async () => {
  assert.ok(Object.keys(EXAMPLES).length >= 57);
  for (const example of ['drawCircle', 'spriteZ', 'chainT']) {
    const r = await kit.renderFrames('reanimate', {params: {width: 320, height: 180, example}, frames: [10, 25, 40]});
    assert.ok(r.frames.every((f) => f.deterministic && !f.flat), example);
    assert.notEqual(r.frames[0].hash, r.frames[2].hash, `${example} moves`);
  }
});
