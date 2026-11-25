// Reanimate engine, mathematics (pack 4): Haskell's random numbers, complex numbers and exact
// fractions, cubicbezier's curve functions, polygons with shortest paths, balloon, the wavelength
// tables, and the Fourier, tangent, star and balloon examples. Reanimate ships no golden file for
// these; balloon was compared with Reanimate's documentation GIF (doc_balloon.gif, mean grey
// difference 3.25 on 0..255, the TeX font and GIF palette). The pinned frame hashes below are a
// regression test, not proof of agreement. The TeX examples use MathJax in Node (the engines'
// node_modules); without it those tests are skipped.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as R from '../skills/framemotion/assets/engines/reanimate/core/index.mjs';
import * as Q from '../skills/framemotion/assets/engines/reanimate/core/rational.mjs';
import {mkStdGen, nextWord64, randomRsDouble} from '../skills/framemotion/assets/engines/reanimate/core/random.mjs';
import {cmul, csum, expTurn, cx, cneg} from '../skills/framemotion/assets/engines/reanimate/core/complex.mjs';
import {bezierIntersection, closest, evalBezier} from '../skills/framemotion/assets/engines/reanimate/core/cubicbezier.mjs';
import {mkPolygon, pParent, pCycles, pIsCCW, polygonPoints, pAccess} from '../skills/framemotion/assets/engines/reanimate/core/polygon.mjs';
import {toShapes} from '../skills/framemotion/assets/engines/reanimate/core/polyshape.mjs';
import {MATH_EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/math.mjs';

let mathjax = false;
try {
  const {useMathJaxNode} = await import('../skills/framemotion/assets/engines/reanimate/tex-mathjax-node.mjs');
  mathjax = await useMathJaxNode();
} catch { mathjax = false; }
const needsMathJax = {skip: mathjax ? false : 'engines: mathjax is not installed (npm ci in assets/engines)'};

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const P = (pts) => mkPolygon(pts.map(([x, y]) => [Q.fromDouble(x), Q.fromDouble(y)]));

test('random 1.2.0: mkStdGen 137 and randomRs give Haskell\'s numbers', () => {
  const [w, g] = nextWord64(mkStdGen(137));
  assert.equal(w, 7879794327570578227n, 'the example in System.Random.SplitMix\'s documentation');
  assert.deepEqual([g.seed, g.gamma], [11285859549637045894n, 7641485672361121627n]);
  const xs = randomRsDouble([0, 1], mkStdGen(0x87654321), 1000);
  assert.ok(xs.every((x) => x >= 0 && x <= 1));
  assert.deepEqual(randomRsDouble([0, 1], mkStdGen(0x87654321), 3), xs.slice(0, 3), 'a pure function of the seed');
});

test('complex numbers multiply and sum as Data.Complex does', () => {
  assert.deepEqual(cmul([1, 2], [3, 4]), [-5, 10]);
  assert.deepEqual(csum([[1, 1], [2, -3]]), [3, -2]);
  const [re, im] = expTurn(cx(1), 0.25);   // exp (2 pi i / 4) = i
  assert.ok(Math.abs(re) < 1e-15 && Math.abs(im - 1) < 1e-15);
  assert.ok(Object.is(cneg(cx(0))[1], -0), 'negate keeps the negative zero');
});

test('Rational: exact from doubles, rounded to the nearest double, ties to even', () => {
  assert.equal(Q.toDouble(Q.qFrac(1, 3)), 1 / 3);
  assert.equal(Q.toDouble(Q.add(Q.fromDouble(0.1), Q.fromDouble(0.2))), 0.30000000000000004);
  assert.equal(Q.toDouble(Q.qFrac(2n ** 53n + 1n, 1)), 2 ** 53, 'a tie rounds to even');
  assert.equal(Q.toDouble(Q.qFrac(2n ** 53n + 3n, 1)), 2 ** 53 + 4);
  assert.deepEqual(Q.fromDouble(Infinity), {n: 2n ** 1024n, d: 1n}, 'GHC\'s toRational of infinity');
  assert.ok(Q.eq(Q.fromDouble(0.5), Q.qFrac(1, 2)));
  assert.equal(Q.toDouble(Q.qFrac(1n, 2n ** 1070n)), 2 ** -1070, 'subnormals keep their last bits, as GHC does');
  assert.equal(Q.toDouble(Q.qFrac(3n, 2n ** 1075n)), 2 ** -1073, 'and round ties to even there');
});

test('atPartial gives the point and derivative at a share of the length', () => {
  const [[x, y], [dx, dy]] = R.atPartial(0.5, R.toLineCommands(R.parsePath('M0,0 L4,0 L4,4')));
  assert.deepEqual([x, y, dx, dy], [4, 0, 0, 4]);
  const [p] = R.atPartial(0.25, R.toLineCommands(R.parsePath('M0,0 Q1,2 2,0')));
  assert.ok(p[1] > 0 && p[0] < 1);
  assert.throws(() => R.atPartial(0.9, R.toLineCommands(R.parsePath('M0,0 L1,0 L1,1 Z'))), /no curve for a end/, 'closing segments fail as in Reanimate');
});

test('cubicbezier: Bézier clipping finds where two curves cross; closest finds the nearest parameter', () => {
  const a = [[0, 0], [1, 2], [2, 2], [3, 0]], b = [[0, 1], [1, 1], [2, 1], [3, 1]];
  const hits = bezierIntersection(a, b, 1e-6).map(([t]) => evalBezier(a, t));
  assert.equal(hits.length, 2);
  for (const [, y] of hits) assert.ok(Math.abs(y - 1) < 1e-5);
  const ts = bezierIntersection(a, b, 1e-6).map(([t]) => t);   // the arch is 6t(1 - t): y = 1 at t = (3 -+ sqrt 3) / 6
  assert.ok(Math.abs(ts[0] - (3 - Math.sqrt(3)) / 6) < 1e-6 && Math.abs(ts[1] - (3 + Math.sqrt(3)) / 6) < 1e-6);
  const t = closest(a, [1.5, 5], 1e-6);
  assert.ok(Math.abs(t - 0.5) < 1e-6);
});

test('polygons: exact orientation and the shortest-path tree around a corner', () => {
  // a U shape: from vertex 0 (bottom left) the shortest path to the top of the right arm bends at the inner corner
  const u = P([[0, 0], [3, 0], [3, 3], [2, 3], [2, 1], [1, 1], [1, 3], [0, 3]]);
  assert.ok(pIsCCW(u));
  assert.ok(!pIsCCW(P([[0, 0], [0, 1], [1, 1], [1, 0]])));
  assert.equal(pParent(u, 0, 3), 4, 'top of the right arm: through the inner corner (2, 1)');
  assert.equal(pParent(u, 0, 6), 0, 'top of the left arm: seen directly');
  assert.equal(pParent(u, 0, 2), 4, 'the outer top right corner too');
  assert.equal(pParent(pCycles(u)[3], 0, 5), 1, 'from (2, 3), rotated by 3: (0, 0) is reached through (2, 1)');
});

test('toShapes cuts a hole into its outline; balloon grows a shape from one point', () => {
  const ring = R.mkPath(R.parsePath('M-2,-2 L2,-2 L2,2 L-2,2 Z M-1,-1 L-1,1 L1,1 L1,-1 Z'));
  const shapes = toShapes(0.01, ring);
  assert.equal(shapes.length, 1, 'the inner square is a hole of the outer one');
  const square = R.withFillColor('red', R.mkRect(4, 2));
  const grow = R.balloon(square);
  const pts = (svg) => (R.renderSvg(svg).match(/[ML]-?[\d.]+,-?[\d.]+|\s-?[\d.]+,-?[\d.]+/g) ?? []).length;
  assert.equal(pts(grow(0)), 1, 'at 0 only the start point (the path stops at the empty line command)');
  assert.ok(pts(grow(0.5)) > pts(grow(0)));
  assert.match(R.renderSvg(grow(1)), /fill="#FF0000"/, 'the shape keeps its attributes');
});

test('nmToColor reads the CIE table up to 700 nm', () => {
  assert.deepEqual(R.toSRGB24(R.nmToColor(550)), [0, 255, 0]);
  assert.equal(R.nmToColor(800), null);
  assert.equal(R.bigXYZCoordinates().size, 311);
  assert.deepEqual(R.coneSensitivity().get(700), [0.00589749, 0.000365317, 0], 'an empty S value is 0');
});

test('a path command with no points ends the path data instead of writing invalid SVG', () => {
  assert.equal(R.serializeCommands([{c: 'M', abs: true, args: [[1, 2]]}, {c: 'L', abs: true, args: []}, {c: 'Z'}]), 'M1,2');
});

// shortest-path distances from each start, on the polygon and on its points rotated: they must agree
// whatever vertex the ear clipping starts from
function rotationSpread(poly) {
  const pts = polygonPoints(poly), n = pts.length;
  const dists = (p, root) => {
    const d = new Array(n);
    const get = (i) => d[i] ?? (d[i] = i === root ? 0 : get(pParent(p, root, i)) + Q.distanceD(pAccess(p, i), pAccess(p, pParent(p, root, i))));
    for (let i = 0; i < n; i++) get(i);
    return d;
  };
  let worst = 0;
  for (const s of [1, 7, Math.floor(n / 3), Math.floor(n / 2)]) {
    const rot = mkPolygon([...pts.slice(s), ...pts.slice(0, s)]);
    for (const root of [0, Math.floor(n / 4), Math.floor((3 * n) / 4)]) {
      const a = dists(poly, root), b = dists(rot, (root - s + n) % n);
      for (let i = 0; i < n; i++) worst = Math.max(worst, Math.abs(a[i] - b[(i - s + n) % n]));
    }
  }
  return worst;
}

test('a shape with a hole: the cut does not change the shortest paths', () => {
  const ring = R.mkPath(R.parsePath('M-2,-2 L2,-2 L2,2 L-2,2 Z M-1,-1 L-1,1 L1,1 L1,-1 Z'));
  const [[, poly]] = toShapes(0.01, ring);
  assert.equal(rotationSpread(poly), 0);
});

test('letters with holes (e, 8, B, R, O, g) triangulate exactly and give the same shortest paths from any start', {...needsMathJax, timeout: 120000}, () => {
  for (const ch of ['e', '8', 'B', 'R', 'O', 'g']) {
    const shapes = toShapes(0.01, R.scale(8, R.center(R.latex(ch))));
    for (const [, poly] of shapes) assert.ok(rotationSpread(poly) < 1e-9, ch);
  }
});

const PINNED = {
  fourier: ['3a5abf45308877e8', '3efa7affb4e41111', 'e9b77396aab96e0c'],
  fourier_draw: ['fe36f6ddd50fd5d4', 'a1e9621e4ce649c3', '3175c95f7c74b269'],
  tut_glue_fourier: ['ec608fd684f974c1', 'de1775be05d00ed5', '7e879a1078f1da5c'],
  demo_tangent: ['eaf63f99ff84851c', '44e9768be5fd5a74', '8de820521b17ee27'],
  demo_stars: ['bf7d8a28786e3e37', '5401006f1daa9a2c', '7e9294f1dd8364e6'],
  balloon: ['e04e14731848ac9e', '258816d200a01a0f', 'a2ed32212a65b91c'],
};

test('the mathematics examples draw their pinned frames with MathJax\'s outlines', {...needsMathJax, timeout: 300000}, () => {
  assert.deepEqual(Object.keys(MATH_EXAMPLES).sort(), Object.keys(PINNED).sort());
  for (const [name, make] of Object.entries(MATH_EXAMPLES)) {
    const ani = make();
    const frames = [0.1, 0.5, 0.9].map((f) => R.renderSvg(R.frameAt(f * ani.duration, ani)));
    for (const svg of frames) assert.ok(!/NaN|undefined|Infinity/.test(svg), name);
    assert.deepEqual(frames.map(hash), PINNED[name], name);
  }
});

test('fourier_draw ends with 501 circles: 499 whole, the first and one cut short', {...needsMathJax, timeout: 120000}, () => {
  const ani = MATH_EXAMPLES.fourier_draw();
  assert.equal(ani.duration, 52);
  const end = R.renderSvg(R.frameAt(52, ani));
  assert.ok(end.includes('<path'), 'the green outline');
  const circles = (end.match(/<circle /g) ?? []).length;
  assert.equal(circles, 501, 'one circle per coefficient (500 after the first: whole pairs, no zero partner)');
});
