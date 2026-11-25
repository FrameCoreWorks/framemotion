// Reanimate engine, morphing (pack 5): the polygon functions morph uses, the point and object
// correspondences, the linear and rotational trajectories, and the eleven morphing examples.
// doc_linear, doc_rawLinear and doc_rotationalTrajectory were compared with Reanimate's documentation
// GIFs (mean grey difference about 8 of 255, 6.4 already on the still X: LaTeX's and MathJax's X
// differ); the other examples have neither golden file nor GIF and were checked by eye. The pinned
// frame hashes below are a regression test, not proof of agreement.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as R from '../skills/framemotion/assets/engines/reanimate/core/index.mjs';
import * as Q from '../skills/framemotion/assets/engines/reanimate/core/rational.mjs';
import {mkPolygon, polygonPoints, pSize, pCycles} from '../skills/framemotion/assets/engines/reanimate/core/polygon.mjs';
import {toShapes} from '../skills/framemotion/assets/engines/reanimate/core/polyshape.mjs';
import {MORPH_EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/morph.mjs';
import {MISC_EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/misc.mjs';

let mathjax = false;
try {
  const {useMathJaxNode} = await import('../skills/framemotion/assets/engines/reanimate/tex-mathjax-node.mjs');
  mathjax = await useMathJaxNode();
} catch { mathjax = false; }
const needsMathJax = {skip: mathjax ? false : 'engines: mathjax is not installed (npm ci in assets/engines)'};

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const P = (pts) => mkPolygon(pts.map(([x, y]) => [Q.fromDouble(x), Q.fromDouble(y)]));
const D = (p) => polygonPoints(p).map(Q.v2ToDouble);
const square = P([[0, 0], [2, 0], [2, 2], [0, 2]]);

test('pArea, pCentroid and pBoundingBox are exact; the bounding box starts its maxima at 0 as Reanimate does', () => {
  assert.equal(Q.toDouble(R.pArea(square)), 4);
  assert.deepEqual(R.pCentroid(square).map(Q.toDouble), [1, 1]);
  assert.deepEqual(R.pBoundingBox(P([[-3, -3], [-1, -3], [-1, -1]])).map(Q.toDouble), [-3, -3, 3, 3], 'maximum x and y stay 0');
  assert.throws(() => R.pCentroid(P([[0, 0], [1, 0], [2, 0]])), /no area/);
});

test('pAddPoints splits the longest edge, the last of equals, at its middle', () => {
  assert.deepEqual(D(R.pAddPoints(1, square)), [[0, 0], [2, 0], [2, 2], [0, 2], [0, 1]]);
  assert.deepEqual(D(R.pAddPoints(1, P([[0, 0], [4, 0], [4, 1], [0, 1]]))), [[0, 0], [4, 0], [4, 1], [2, 1], [0, 1]]);
  const [a, b] = R.normalizePolygons(square, R.pAddPoints(3, square));
  assert.equal(pSize(a), pSize(b));
});

test('pCutEqual cuts along the diagonal that halves the area', () => {
  const [a, b] = R.pCutEqual(square);
  assert.deepEqual([D(a), D(b)], [[[0, 0], [2, 0], [2, 2]], [[0, 0], [2, 2], [0, 2]]]);
});

test('closestLinearCorrespondence turns the target to start nearest the source; linearTrajectory runs between them', () => {
  const turned = mkPolygon(polygonPoints(pCycles(square)[2]).map((_, i) => polygonPoints(square)[(i + 2) % 4]));
  const [, best] = R.closestLinearCorrespondence(square, turned);
  assert.deepEqual(D(best), D(square), 'the rotation is applied (Reanimate drops it; see core/morph.mjs)');
  const move = R.linearTrajectory([square, P([[2, 0], [4, 0], [4, 2], [2, 2]])]);
  assert.deepEqual(D(move(0.5)), [[1, 0], [3, 0], [3, 2], [1, 2]]);
  assert.throws(() => R.linearTrajectory([square, P([[0, 0], [1, 0], [1, 1]])]), /Invalid lengths/);
});

test('rotationalTrajectory turns points about the boxes\' origins and keeps the ends', () => {
  const dst = P([[0, 0], [0, 2], [-2, 2], [-2, 0]]);
  const move = R.rotationalTrajectory([0.5, 0.5])([square, dst]);
  for (const [p, q] of D(move(0)).map((p, i) => [p, D(square)[i]])) assert.ok(Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-12);
  for (const [p, q] of D(move(1)).map((p, i) => [p, D(dst)[i]])) assert.ok(Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-12);
  assert.deepEqual(R.polygonOrigin(square, [0.5, 0.5]), [1, 1]);
});

test('morph shows the source at 0 and the target at 1; colours blend in LAB, opacities as 32-bit floats', () => {
  const src = R.withFillOpacity(1, R.withFillColor('red', R.mkRect(2, 2)));
  const dst = R.withFillOpacity(0.3, R.withFillColor('blue', R.mkCircle(1)));
  const m = R.morph(R.linear, src, dst);
  assert.equal(R.renderSvg(m(0)), R.renderSvg(R.lowerTransformations(src)));
  assert.equal(R.renderSvg(m(1)), R.renderSvg(R.lowerTransformations(dst)));
  const mid = R.renderSvg(m(0.5));
  assert.match(mid, /fill-opacity="0\.65"/);
  assert.doesNotMatch(mid, /fill="#FF0000"|fill="#0000FF"/);
  const noFill = R.morph(R.linear, src, R.mkCircle(1));
  assert.doesNotMatch(R.renderSvg(noFill(0.5)), /fill="#/, 'a colour on one side only is dropped, as Reanimate\'s Maybe does');
});

test('object correspondences: one shape against two is cut, copied or grown from the centre', () => {
  const two = toShapes(0.001, R.mkGroup([R.translate(-2, 0, R.mkRect(1, 1)), R.translate(2, 0, R.mkRect(1, 1))]));
  const one = toShapes(0.001, R.mkRect(2, 2));
  const cut = R.splitObjectCorrespondence(two, one);
  assert.equal(cut.length, 2);
  assert.notDeepEqual(D(cut[0][1][1]), D(cut[1][1][1]), 'two different halves');
  const dup = R.dupObjectCorrespondence(two, one);
  assert.equal(dup[0][1][1], dup[1][1][1], 'the same square twice');
  const grow = R.genesisObjectCorrespondence(one, two);
  assert.equal(grow.length, 2);
  assert.ok(D(grow[1][1][1]).every(([x, y]) => x === 2 && y === 0), 'the unpaired square shrinks to its centre');
});

const PINNED = {
  morphology_intro: ['a132e6f4466c48bd', 'bb9dc47424c38b86', '775e425ba1b227fb'],
};

test('the morphing examples without TeX draw their pinned frames', {timeout: 300000}, () => {
  for (const [name, frames] of Object.entries(PINNED)) {
    const ani = MORPH_EXAMPLES[name]();
    assert.deepEqual([0.1, 0.5, 0.9].map((f) => hash(R.renderSvg(R.frameAt(f * ani.duration, ani)))), frames, name);
  }
});

const PINNED_TEX = {
  linear: ['050eb810d8e66b94', '08d4216b45a664b9', '1b99949fcf2ca3ab'],
  rawLinear: ['d9feaf5e55241455', '08d4216b45a664b9', '5708e74bb608d7fe'],
  rotationalTrajectory: ['7d6050f77012307e', '08d4216b45a664b9', '7d6050f77012307e'],
  morphology_color: ['7a13ddaa27c32c8d', 'dc6e20b68c22dbf6', '39a30bf4bcba0ad2'],
  morphology_linear: ['e5de6c9d8b71a986', '30be71ec6cf52cb9', '7b2c1022c30d55a8'],
  morphology_closest: ['ad42418cfd866a39', 'd7734a20e90b72ea', '4a70e525bf2fdfad'],
  morphology_rotational: ['77ea042265b96511', 'fb2e2acaaa17c01c', '67f24e8b8b944f52'],
  morphology_object_correspondence: ['620fb146c082ef8f', 'f99bb058511d3cbb', 'db86ad187104b4d6'],
  morphology_point_correspondence: ['2c5d1e28d1f1a586', 'c838068c0350f802', 'bbe184b90c54e2ae'],
  morphology_rotational_intro: ['3d337bde1c76d36f', '442501f835cc1565', '7dd27fe767d0eb78'],
};

test('the morphing examples with TeX outlines draw their pinned frames', {...needsMathJax, timeout: 600000}, () => {
  for (const [name, frames] of Object.entries(PINNED_TEX)) {
    const ani = MORPH_EXAMPLES[name]();
    const svgs = [0.1, 0.5, 0.9].map((f) => R.renderSvg(R.frameAt(f * ani.duration, ani)));
    for (const svg of svgs) assert.ok(!/NaN|undefined|Infinity/.test(svg), name);
    assert.deepEqual(svgs.map(hash), frames, name);
  }
});

// intro_canvas, intro_canvas_square, latex_basic and fe_morph have golden files drawn with LaTeX's
// glyphs; with MathJax only the grid, brackets, dot and labels' positions can agree, which was checked
// by eye on a contact sheet. These hashes are a regression test.
const PINNED_MISC_TEX = {
  intro_canvas: ['826d721543b7b723', '832a823735603c06', '0fa5ee5b225f337d'],
  intro_canvas_square: ['b026ece8ae9edcde', 'e0e2ab85f07f486e', 'f0151ff8fa20ea84'],
  latex_basic: ['d2ca95d3e93fbf36', '3996e3e3f25b40d7', 'd2ca95d3e93fbf36'],
  fe_morph: ['0df6e4a1d57f716f', '49f640439c9baaed', '8568c1b3d46e6a33'],
};

test('the canvas introduction and the TeX pictures draw their pinned frames', {...needsMathJax, timeout: 300000}, () => {
  for (const [name, frames] of Object.entries(PINNED_MISC_TEX)) {
    const ani = MISC_EXAMPLES[name]();
    assert.deepEqual([0.1, 0.5, 0.9].map((f) => hash(R.renderSvg(R.frameAt(f * ani.duration, ani)))), frames, name);
  }
});

test('reel formats keep the short side at 9 units; fitScreenA scales a 16 x 9 drawing to contain or cover', () => {
  for (const {width, height, screen} of Object.values(R.REEL_FORMATS)) {
    assert.ok(Math.abs(screen[0] / screen[1] - width / height) < 1e-12);
    assert.equal(Math.min(...screen), 9);
  }
  const ani = R.staticFrame(1, R.mkCircle(1));
  assert.match(R.renderSvg(R.frameAt(0, R.fitScreenA(ani, [9, 16], 'contain'))), /scale\(0\.5625/);
  assert.match(R.renderSvg(R.frameAt(0, R.fitScreenA(ani, [9, 16], 'cover'))), /scale\(1\.777778/);
  assert.equal(R.fitScreenA(ani, [9, 16], 'none'), ani);
  assert.throws(() => R.fitScreenA(ani, [9, 16], 'stretch'), /mode must be/);
  // The bands around a contained film take its own background, frame by frame (here black, not the page's white).
  const dark = R.fitScreenA(R.addStatic(R.mkBackground('black'), ani), [9, 16], 'contain');
  assert.match(R.renderSvg(R.frameAt(0, dark), {screen: [9, 16]}), /^<svg[^>]*><g[^>]*><g><rect [^>]*fill="#000000"[^>]*width="9" height="16"/);
  // 'safe' keeps the 16 x 9 picture inside the 9:16 safe area: below the top 10 %, above the bottom 20 %.
  const safe = R.fitScreenA(R.staticFrame(1, R.mkRect(16, 8.99)), [9, 16], 'safe');   // not 16 x 9: that would be read as the background
  const [x, y, w, h] = R.boundingBox(R.frameAt(0, safe));
  assert.ok(x >= -4.5 - 1e-9 && x + w <= 4.5 + 1e-9);
  assert.ok(y >= -8 + 0.2 * 16 - 1e-9 && y + h <= 8 - 0.1 * 16 + 1e-9, `${y} .. ${y + h}`);
  assert.equal(R.fitScreenA(ani, [9, 9], 'safe').duration, 1, 'no safe area outside 9:16: same as contain');
});

test('renderSphere: an opaque texture shows its colour on the disc only; the back shows through a transparent front', () => {
  const img = R.renderSphere({texture: () => [10, 20, 30, 255], radius: 1, pxPerUnit: 10});
  assert.equal(img.width, 20);
  assert.deepEqual([...img.data.slice((10 + 10 * 20) * 4, (10 + 10 * 20) * 4 + 4)], [10, 20, 30, 255], 'centre');
  assert.equal(img.data[3], 0, 'corner outside the disc');
  // POV-Ray's uv: u counts from +x towards +z, so the camera (at -z) sees u = 0.75 and u = 0.25 is behind.
  // A clear front lets the back's red through.
  const back = R.renderSphere({texture: (u) => (Math.abs(u - 0.25) < 0.1 ? [255, 0, 0, 255] : [0, 0, 255, 0]), radius: 1, pxPerUnit: 10});
  assert.deepEqual([...back.data.slice((10 + 10 * 20) * 4, (10 + 10 * 20) * 4 + 4)], [255, 0, 0, 255]);
  const lines = R.sphereLines({lines: [[[0.25, 0.1], [0.25, 0.9]], [[0.75, 0.1], [0.75, 0.9]]], radius: 1});
  assert.equal(lines.length, 1, 'the meridian behind the sphere is hidden');
  assert.ok(lines[0].every(([x]) => Math.abs(x) < 1e-12), 'the front meridian (u = 0.75) runs down the middle');
  // u = 0 at +x: a texture red only near u = 0 colours the right edge, not the left.
  const right = R.renderSphere({texture: (u) => (u < 0.05 || u > 0.95 ? [255, 0, 0, 255] : [0, 0, 255, 255]), radius: 1, pxPerUnit: 10, samples: 1});
  const px = (i, j) => [...right.data.slice((i + j * 20) * 4, (i + j * 20) * 4 + 3)];
  assert.deepEqual(px(19, 10), [255, 0, 0]);
  assert.deepEqual(px(0, 10), [0, 0, 255]);
  // Supersampling: an edge pixel is partly covered.
  const edge = R.renderSphere({texture: () => [255, 255, 255, 255], radius: 1, pxPerUnit: 10, samples: 3});
  assert.ok(edge.data.some((v, k) => k % 4 === 3 && v > 0 && v < 255), 'antialiased rim');
});

test('the films: the map projection borders bend with the projection and the showcase sphere turns', async () => {
  const {FILM_EXAMPLES} = await import('../skills/framemotion/assets/engines/reanimate/examples/films.mjs');
  const {SHOWCASE_EXAMPLES} = await import('../skills/framemotion/assets/engines/reanimate/examples/showcase.mjs');
  const gif = FILM_EXAMPLES.map_projection_gif();
  assert.notEqual(hash(R.renderSvg(R.frameAt(0, gif))), hash(R.renderSvg(R.frameAt(1, gif))));
  assert.equal(hash(R.renderSvg(R.frameAt(0, gif))), hash(R.renderSvg(R.frameAt(6, gif))), 'back to equirectangular');
  const show = SHOWCASE_EXAMPLES.showcase();
  assert.notEqual(R.renderSvg(R.frameAt(0.2, show)), R.renderSvg(R.frameAt(0.6, show)));
});

test('oTransform morphs one object into another, moving with the source easing, and swaps which is shown', () => {
  const ani = R.scene((s) => {
    const c = s.oNew(new R.Circle(1));
    s.oShow(c);
    s.wait(0.5);
    const r = s.oNew(new R.Rectangle(3, 1));
    s.oSet(r, 'translate', [3, 0]);
    s.oTransform(c, r, 1);
    s.wait(0.5);
  });
  assert.equal(ani.duration, 2);
  assert.match(R.renderSvg(R.frameAt(0.75, ani)), /translate\(0\.375, 0\)/, 'curveS(2) of 0.25 is 0.125 of the way');
  assert.equal(R.renderSvg(R.frameAt(1.9, ani)).match(/<rect /g)?.length, 1, 'the target rectangle alone at the end');
  assert.doesNotMatch(R.renderSvg(R.frameAt(1, ani)), /<circle |<rect /, 'mid-way it is the morph\'s outline');
});
