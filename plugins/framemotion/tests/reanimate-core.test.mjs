// Reanimate engine, pure computation: FrameMotion's JavaScript port prints the same SVG as Reanimate
// itself for every ported documentation example (Reanimate's golden files, 10 frames each) and its
// scenes, paths and geometry follow the Haskell semantics. No browser is needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as R from '../skills/framemotion/assets/engines/reanimate/core/index.mjs';
import {CORE_EXAMPLES, haskellRound, haskellShowDouble} from '../skills/framemotion/assets/engines/reanimate/examples/core.mjs';
import {EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/index.mjs';

const GOLDEN = fileURLToPath(new URL('./fixtures/reanimate-golden/', import.meta.url));

/** Reanimate's test mode: 10 frames, frame i at duration / 9 * i, one line each, prefixed by i. */
const testFrames = (ani) => Array.from({length: 10}, (_, i) => `${i}${R.renderSvg(R.frameAt((ani.duration / 9) * i, ani))}`);

/**
 * Embedded PNGs are compared by their header and decoded pixels: Reanimate's come from zlib at its build's
 * version, ours use stored deflate blocks, so the compressed bytes may differ while the image is the same.
 */
function pngPixels(b64) {
  const b = Buffer.from(b64, 'base64');
  let i = 8, ihdr = '';
  const idat = [];
  while (i < b.length) {
    const n = b.readUInt32BE(i), type = b.subarray(i + 4, i + 8).toString();
    if (type === 'IHDR') ihdr = b.subarray(i + 8, i + 8 + n).toString('hex');
    if (type === 'IDAT') idat.push(b.subarray(i + 8, i + 8 + n));
    i += 12 + n;
  }
  return `${ihdr}:${zlib.inflateSync(Buffer.concat(idat)).toString('hex')}`;
}
const normalisePng = (svg) => svg.replace(/data:image\/png;base64,([^"]+)/g, (_, d) => `PNG[${pngPixels(d)}]`);

test('every example with a Reanimate golden file prints the same SVG (byte for byte; PNGs pixel for pixel)', () => {
  const goldens = fs.readdirSync(GOLDEN).filter((f) => f.endsWith('.golden'));
  assert.equal(goldens.length, 70);
  for (const file of goldens) {
    const name = file.slice('doc_'.length, -'.golden'.length);
    assert.ok(EXAMPLES[name], `no port of ${name}`);
    const expected = fs.readFileSync(path.join(GOLDEN, file), 'utf8').split('\n').filter(Boolean);
    const got = testFrames(EXAMPLES[name]());
    if (!expected.some((l) => l.includes('data:image/png'))) assert.deepEqual(got, expected, name);
    else assert.deepEqual(got.map(normalisePng), expected.map(normalisePng), name);
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

test('pause(0) and chainT of nothing throw, as Reanimate.Animation.mkAnimation does', () => {
  assert.throws(() => R.pause(0), /Animation duration \(0\) is not positive/);
  assert.throws(() => R.chainT(R.fadeT, []), /not positive/);
  assert.equal(R.pauseAtEnd(0, R.drawBox), R.drawBox, 'a zero pause is skipped before mkAnimation');
});

test('colour names are looked up in the table only', () => {
  assert.deepEqual(R.mkColor('red'), {rgba: [255, 0, 0, 255]});
  assert.equal(R.mkColor('none'), 'none');
  for (const name of ['constructor', '__proto__', 'toString', 'nosuchcolour']) {
    assert.deepEqual(R.mkColor(name), {rgba: [240, 248, 255, 255]}, name);
  }
});

test('arcLength of an asymmetric cubic (cubicbezier arcLengthEstimate)', () => {
  const c = [[0, 0], [0.3, 2.1], [3.7, -1.4], [4, 1]];
  const speed = (u) => {
    const v = 1 - u, [a, b, cc, d] = c;
    return Math.hypot(3 * (v * v * (b[0] - a[0]) + 2 * v * u * (cc[0] - b[0]) + u * u * (d[0] - cc[0])),
      3 * (v * v * (b[1] - a[1]) + 2 * v * u * (cc[1] - b[1]) + u * u * (d[1] - cc[1])));
  };
  let exact = 0;
  const n = 200000;
  for (let i = 0; i < n; i++) exact += speed((i + 0.5) / n) / n;
  const len = R.arcLength(c, 1, 1e-4);
  assert.ok(Math.abs(len - exact) < 2e-5, `${len} vs ${exact}`);
  assert.ok(Math.abs(len - 5.004750434288294) < 1e-12, 'pinned port value');
  assert.ok(R.arcLength(c, 0.4, 1e-4) < len);
  assert.equal(R.arcLength([[1, 1], [1, 1], [1, 1], [1, 1]], 1, 1e-4), 0, 'a point has no length');
});

test('modifyVar changes the value from now on, including a running tween', () => {
  const ani = R.scene((s) => {
    const v = s.newVar(1);
    s.newSprite((f) => R.mkCircle(f.get(v)));
    s.wait(1);
    s.modifyVar(v, (x) => x * 10);
    s.wait(1);
  });
  const radius = (t) => R.frameAt(t, ani).children[0].r;
  assert.equal(radius(0.5), 1);
  assert.equal(radius(1.5), 10);
});

test('spriteScope removes its sprites when it ends; adjustZ reorders them', () => {
  const scoped = R.scene((s) => {
    s.spriteScope((inner) => { inner.newSpriteSVG(R.mkCircle(1)); inner.wait(1); });
    s.newSpriteSVG(R.mkRect(1, 1));
    s.wait(1);
  });
  const kinds = (ani, t) => R.frameAt(t, ani).children.map((c) => c.kind).filter((k) => k !== 'none');
  assert.deepEqual(kinds(scoped, 0.5), ['circle'], 'the rectangle starts after the scope');
  assert.ok(!kinds(scoped, 1.5).includes('circle'));
  assert.ok(kinds(scoped, 1.5).includes('rect'));
  const layered = R.scene((s) => {
    s.adjustZ((z) => z + 1, (inner) => inner.newSpriteSVG(R.mkCircle(1)));
    s.newSpriteSVG(R.mkRect(1, 1));
    s.wait(1);
  });
  assert.deepEqual(kinds(layered, 0.5), ['rect', 'circle'], 'the raised circle is drawn last');
});

test('transitionO overlaps two scene parts by the given time', () => {
  const ani = R.scene((s) => {
    s.transitionO(R.fadeT, 0.5, (a) => a.play(R.drawBox), (b) => b.play(R.drawCircle));
  });
  assert.equal(R.duration(ani), R.duration(R.drawBox) + R.duration(R.drawCircle) - 0.5);
});

test('lowerTransformations bakes transforms into path points', () => {
  const moved = R.lowerTransformations(R.translate(2, 1, R.scale(2, R.pathify(R.mkRect(2, 2)))));
  assert.equal(moved.attrs?.transform, undefined);
  assert.deepEqual(R.boundingBox(moved), [0, -1, 4, 4]);
});

test('simplify drops empty and attribute-free groups', () => {
  const t = R.mkGroup([R.mkGroup([]), R.mkGroup([R.mkCircle(1)]), R.None]);
  assert.equal(R.simplify(t).kind, 'circle');
  const kept = R.simplify(R.withFillColor('red', R.mkGroup([R.mkCircle(1)])));
  assert.equal(kept.kind, 'group', 'a group with attributes stays');
  assert.equal(R.simplify(R.mkGroup([R.mkGroup([])])), R.None);
});

test('splitGlyphs picks glyphs by index and keeps their groups (lists reversed, as in Haskell)', () => {
  const t = R.mkGroup([R.mkCircle(1), R.withFillColor('red', R.mkGroup([R.mkRect(1, 1)])), R.mkCircle(3)]);
  const [rest, picked] = R.splitGlyphs([1], t);
  assert.deepEqual(rest.children.map((c) => c.children[0].r), [3, 1]);
  assert.equal(picked.children.length, 1);
  assert.equal(picked.children[0].children[0].children[0].kind, 'rect');
});
