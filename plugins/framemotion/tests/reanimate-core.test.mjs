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

test('object lenses follow Reanimate.Scene.Object', () => {
  let d = R.evalScene((s) => s.readVar(s.oNew(R.mkRect(2, 1)).data));
  assert.deepEqual(d.bb, [-1, -0.5, 2, 1]);
  assert.equal(R.oGet(d, 'leftX'), -1.5, 'box plus the 0.5 margin');
  d = R.oSet(d, 'leftX', 0);
  assert.deepEqual(d.translate, [1.5, 0]);
  d = R.oSet(d, 'centerXY', [0, 2]);
  assert.deepEqual(d.translate, [0, 2]);
  d = R.oSet(d, 'scale', 2);
  assert.deepEqual(d.bb, [-2, -1, 4, 2], 'scale recomputes the box');
  assert.throws(() => R.oSet(d, 'bb', [0, 0, 0, 0]), /read-only/);
  assert.throws(() => R.oGet(d, 'nope'), /unknown object property/);
});

test('objects show, tween and hide on the scene clock', () => {
  const ani = R.scene((s) => {
    const o = s.oNew(new R.Circle(1));
    s.oShowWith(o, R.oFadeIn);
    s.oTween(o, 1, (t, d) => R.oSet(d, 'translateX', 4 * t));
    s.oHideWith(o, R.oFadeOut);
  });
  assert.equal(ani.duration, 3);
  const at = (t) => R.renderSvg(R.frameAt(t, ani));
  assert.match(at(1.5), /translate\(2, 0\)/, 'halfway along the eased move');
  assert.ok(!at(3).includes('<circle'), 'hidden at the end');
});

test('without a TeX renderer latex falls back to mkText, as Reanimate does without LaTeX', () => {
  assert.equal(R.hasTexRenderer(), false);
  assert.equal(R.latex('oDraw').kind, 'group');
  assert.ok(R.renderSvg(R.latex('oDraw')).includes('>oDraw</text>'));
  assert.deepEqual(R.parseTransform('translate(1,2) scale(3) matrix(1 0 0 1 4 5)'),
    [{t: 'translate', x: 1, y: 2}, {t: 'scale', x: 3, y: 3}, {t: 'matrix', m: [1, 0, 0, 1, 4, 5]}]);
});

test('oDraw and oScaleIn time each glyph as Reanimate does', () => {
  const three = R.mkGroup([R.mkCircle(1), R.mkCircle(2), R.mkCircle(3)]);
  assert.ok(Math.abs(R.oDraw(three).duration - (0.4 + 1 + 0.3 - 0.3)) < 1e-12, 'glyphs 0.2 s apart, each 1 s');
  assert.ok(Math.abs(R.oScaleIn(three).duration - (0.1 + 0.3)) < 1e-12, 'glyphs 0.05 s apart, each 0.3 s');
});

// Duration of every example in Node, where latex has no renderer and draws mkText (the engine page
// draws TeX glyphs with MathJax, so its text examples are longer; reanimate-engine.test.mjs pins those).
const DURATIONS = {
  addStatic: 2, andThen: 4, drawBox: 2, drawCircle: 2, drawProgress: 2, mapA: 2, parA: 4, parDropA: 4, parLoopA: 4,
  pause: 3, pauseAround: 4, pauseAtBeginning: 3, pauseAtEnd: 3, playThenReverseA: 4, repeatA: 3, reverseA: 2, seqA: 4,
  bellS: 2, constantS: 2, cubicBezierS: 2, curveS: 2, fromToS: 2, oscillateS: 2, powerS: 2, reverseS: 2, signalA: 2,
  chainT: 5, fadeT: 2, overlapT: 3.5, slideDownT: 3, slideLeftT: 3, slideUpT: 3, pathify: 1, mkBackground: 1,
  withViewBox: 1, mkText: 2, applyVar: 2, destroySprite: 2, fork: 2, newSprite: 2, newSpriteA: 4, "newSpriteA'": 4,
  newSpriteSVG: 2, play: 4, queryNow: 3, signalS: 4, simpleVar: 2, spriteE: 2, spriteMap: 2, spriteScope: 3,
  spriteTween: 2, spriteVar: 2, spriteZ: 2, unVar: 2, wait: 3, waitOn: 4, writeVar: 3, cividis: 1, greyscale: 1,
  hsv: 1, hsvMatlab: 1, inferno: 1, jet: 1, magma: 1, plasma: 1, sinebow: 1, turbo: 1, viridis: 1, hsvComponents: 1,
  labComponents: 1, lchComponents: 1, rgbComponents: 1, xyzComponents: 1, oDraw: 3, oGrow: 3, oHideWith: 1,
  oScaleIn: 2.6, oScaleOut: 1.6, latex: 1, latexAlign: 1, signalO: 3, cameraAttach: 4, cameraFocus: 8,
  // pack 3: one-second stills of the map projections
  augustP: 1, bonneP: 1, bottomleyP: 1, cassiniP: 1, collignonP: 1, cylindricalEqualAreaP: 1, eckert1P: 1, eckert3P: 1,
  eckert5P: 1, equirectangularP: 1, faheyP: 1, foucautP: 1, hammerP: 1, lagrangeP: 1, lambertP: 1, mercatorP: 1,
  mollweideP: 1, orthoP: 1, sinusoidalP: 1, wernerP: 1,
};

test('every example (103) renders 10 frames with no NaN or undefined, at its pinned duration', () => {
  assert.deepEqual(Object.keys(EXAMPLES).sort(), Object.keys(DURATIONS).sort());
  for (const [name, make] of Object.entries(EXAMPLES)) {
    const ani = make();
    assert.ok(Math.abs(ani.duration - DURATIONS[name]) < 1e-9, `${name}: ${ani.duration} s`);
    for (const frame of testFrames(ani)) {
      const text = frame.replace(/data:[^"]*/g, 'data:');   // embedded images are base64, which may spell NaN
      assert.ok(!/NaN|undefined|Infinity/.test(text), `${name}: ${text.slice(0, 120)}`);
    }
  }
});

test('signalO: three circles leave on an eased clock over 3 s', () => {
  const ani = EXAMPLES.signalO();
  assert.equal(ani.duration, 3);
  assert.notEqual(R.renderSvg(R.frameAt(1, ani)), R.renderSvg(R.frameAt(2, ani)));
});

test('camera pan and zoom move the camera object', () => {
  let end;
  const ani = R.scene((s) => {
    const cam = s.newObject(new R.Camera());
    s.cameraSetPan(cam, [1, 2]);
    assert.deepEqual(s.oRead(cam, 'translate'), [1, 2]);
    s.cameraPan(cam, 2, [5, -2]);
    s.cameraSetZoom(cam, 3);
    end = [s.oRead(cam, 'translate'), s.oRead(cam, 'scale')];
  });
  assert.equal(ani.duration, 2);
  assert.deepEqual(end, [[5, -2], 3]);
});

test('oShrink and oStaggerRev run their animators backwards and last glyph first', () => {
  const shrink = R.oShrink(R.mkCircle(1));
  assert.ok(R.renderSvg(R.frameAt(0, shrink)).includes('<g transform="scale(1)"><circle'));
  assert.ok(R.renderSvg(R.frameAt(1, shrink)).includes('<g transform="scale(0)"><circle'), 'gone at the end');
  const two = R.mkGroup([R.mkCircle(1), R.mkRect(1, 1)]);
  const rev = R.oStaggerRev(R.oFadeIn)(two);
  assert.ok(Math.abs(rev.duration - 1.2) < 1e-12);
  const early = R.renderSvg(R.frameAt(0.1, rev));
  assert.ok(early.includes('<rect') && !early.includes('<circle'), 'the last glyph starts first');
  assert.throws(() => R.oStagger(R.oFadeIn)(R.mkGroup([])), /no glyphs/);
});

test('interpolateRGBA8 blends colour through the components and rounds alpha the Haskell way', () => {
  const f = R.interpolateRGBA8(R.rgbComponents, [255, 0, 0, 0], [0, 0, 255, 255]);
  assert.deepEqual(f(0), [255, 0, 0, 0]);
  assert.deepEqual(f(1), [0, 0, 255, 255]);
  assert.equal(f(0.5)[3], 128, '127.5 rounds to the even 128');
  assert.equal(R.interpolateRGBA8(R.rgbComponents, [0, 0, 0, 0], [0, 0, 0, 5])(0.5)[3], 2, '2.5 rounds to 2');
  const grey = R.interpolateRGB8(R.lchComponents, [128, 128, 128], [128, 128, 128])(0.5);
  assert.ok(grey.every(Number.isInteger), 'a grey has no lch hue (NaN) and still quantizes');
  assert.throws(() => R.encodePng(1, 1, () => [NaN, 0, 0]), /not three bytes/);
});

test('latex reports what MathJax could not draw instead of dropping it', () => {
  const svg = (children) => ({name: 'svg', attrs: {}, children: [{name: 'g', attrs: {transform: 'scale(1,-1)'}, children}]});
  const glyph = {name: 'path', attrs: {d: 'M 0 0 L 100 0 L 100 100 Z'}, children: []};
  assert.equal(R.textAccents('żółć é'), "{\\.{z}}{\\'{o}}ł{\\'{c}} {\\'{e}}");
  try {
    R.setTexRenderer(() => svg([glyph, {name: 'text', attrs: {}, children: [], text: 'ł'}]));
    assert.throws(() => R.latex('ł'), /no glyph for "ł"/);
    R.setTexRenderer(() => svg([{name: 'g', attrs: {'data-mml-node': 'merror', 'data-mjx-error': 'Missing close brace'}, children: []}]));
    assert.throws(() => R.math('\\frac{1}{'), /TeX error: Missing close brace/);
    R.setTexRenderer(() => svg([{name: 'g', attrs: {'data-mml-node': 'mlabeledtr'}, children: []}]));
    assert.throws(() => R.latexAlign('x \\tag{1}'), /tags/);
    R.setTexRenderer(() => svg([glyph]));
    assert.equal(R.renderSvg(R.latex('a')).match(/<path /g).length, 1);
  } finally { R.setTexRenderer(null); }
});
