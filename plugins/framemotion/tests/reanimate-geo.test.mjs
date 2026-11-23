// Reanimate engine, map projections (pack 3): FrameMotion's port of Reanimate.GeoProjection redraws
// Reanimate's smallEarth pixel by pixel through each projection's inverse, with Haskell's rounding.
// Reanimate ships no golden file for these examples; the pinned pixel hashes below were checked against
// its documentation GIFs (mean grey difference 0.7 to 2.0 on 0..255, the GIF palette and edges) and
// keep later changes from moving a pixel unnoticed. No browser is needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as R from '../skills/framemotion/assets/engines/reanimate/core/index.mjs';
import {GEO_EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/geo.mjs';

const hash = (img) => crypto.createHash('sha256').update(img.data).digest('hex').slice(0, 16);
const deg = (d) => d / 180 * Math.PI;
const PROJECTIONS = {
  augustP: R.augustP, bonneP: R.bonneP(deg(45)), bottomleyP: R.bottomleyP(deg(30)), cassiniP: R.cassiniP,
  collignonP: R.collignonP, cylindricalEqualAreaP: R.cylindricalEqualAreaP(0), eckert1P: R.eckert1P, eckert3P: R.eckert3P,
  eckert5P: R.eckert5P, equirectangularP: R.equirectangularP, faheyP: R.faheyP, foucautP: R.foucautP, hammerP: R.hammerP,
  lagrangeP: R.lagrangeP, lambertP: R.lambertP, mercatorP: R.mercatorP, mollweideP: R.mollweideP, orthoP: R.orthoP([0, 0]),
  sinusoidalP: R.sinusoidalP, wernerP: R.wernerP,
};
const PIXELS = {
  augustP: '990ea9b21b9e63b4', bonneP: '954e9d7a9635f8f0', bottomleyP: '1cb79b04db303fdd', cassiniP: '82abf5a4f2f4ef1d',
  collignonP: '887746b4f152d33d', cylindricalEqualAreaP: '64bcccd3ef969ab6', eckert1P: 'a6f030dc8558feb0',
  eckert3P: '595cabb22cfe9f96', eckert5P: 'de867365a2ea7071', equirectangularP: '781210337d97f002', faheyP: '19caede92170d2fd',
  foucautP: 'b8c939675b29d3d8', hammerP: '8d2063b0900be6ea', lagrangeP: 'd75a7fb7d1c6849d', lambertP: '64bcccd3ef969ab6',
  mercatorP: '6ca2198ff14413d9', mollweideP: '4c3cdde40c5eeadd', orthoP: '1993826e8bb33425', sinusoidalP: 'af091a4e091e2b61',
  wernerP: 'a05bda314affdf59',
};

test('smallEarth is the 300 x 150 equirectangular Earth, opaque', () => {
  const earth = R.smallEarth();
  assert.equal(earth.width, 300);
  assert.equal(earth.height, 150);
  assert.ok(earth.data.every((v, i) => i % 4 !== 3 || v === 255));
});

test('every documentation projection redraws smallEarth with its pinned pixels', () => {
  assert.deepEqual(Object.keys(GEO_EXAMPLES).sort(), Object.keys(PIXELS).sort());
  for (const [name, p] of Object.entries(PROJECTIONS)) assert.equal(hash(R.project(R.smallEarth(), p)), PIXELS[name], name);
  assert.equal(PIXELS.equirectangularP, hash(R.smallEarth()), 'the equirectangular projection is the source itself');
  assert.equal(PIXELS.lambertP, PIXELS.cylindricalEqualAreaP, 'Lambert is the equal-area cylinder at the equator');
});

test('the examples are one-second stills that embed the projected image as RGBA PNG', () => {
  for (const [name, make] of Object.entries(GEO_EXAMPLES)) {
    const ani = make();
    assert.equal(ani.duration, 1, name);
    const svg = R.renderSvg(R.frameAt(0, ani));
    assert.match(svg, /<image [^>]*href="data:image\/png;base64,/, name);
    assert.equal(svg, R.renderSvg(R.frameAt(1, ani)), `${name} does not move`);
  }
});

test('forward and inverse agree inside each projection', () => {
  // Reanimate's own isValidP: the inverse of the forward of every valid grid point returns it. August's
  // series and Mollweide's 50001-step theta table are approximate, as in Reanimate.
  const exact = Object.entries(PROJECTIONS).filter(([n]) => n !== 'augustP' && n !== 'mollweideP');
  for (const [name, p] of exact) assert.ok(R.isValidP(p), name);
  assert.equal(R.isValidP(R.mollweideP), false);
  const [lon, lat] = R.mollweideP.inverse(...R.mollweideP.forward(0.5, 0.3));
  assert.ok(Math.abs(lon - 0.5) < 1e-3 && Math.abs(lat - 0.3) < 1e-4, 'Mollweide is close');
});

test('interpP blends two projections and keeps the ends exact', () => {
  const earth = R.smallEarth();
  assert.equal(hash(R.interpP(earth, R.equirectangularP, R.mollweideP, 0)), PIXELS.equirectangularP);
  assert.equal(hash(R.interpP(earth, R.equirectangularP, R.mollweideP, 1)), PIXELS.mollweideP);
  const half = R.interpP(earth, R.equirectangularP, R.mollweideP, 0.5);
  assert.equal(hash(half), 'f1d54fa993ac615b');
  assert.equal(hash(R.interpP(earth, R.mercatorP, R.orthoP([0, 0]), 0.3)), '26b87b1acad1e14e');
  const boxed = R.interpBBP(earth, R.equirectangularP, R.mollweideP, [0, 0, 0.5, 1], [0, 0, 0.5, 1], 0.5);
  assert.ok(R.pixelAt(boxed, 280, 75)[3] === 0 && R.pixelAt(half, 280, 75)[3] === 255, 'interpBBP samples only its boxes');
});

test('projection helpers follow Reanimate', () => {
  const p = R.scaleP(0.5, 2, R.equirectangularP);
  assert.deepEqual(p.forward(Math.PI, Math.PI / 2), [0.75, 1.5]);
  assert.deepEqual(R.flipYAxisP(R.mercatorP).forward(0, Math.PI / 4), [0.5, 1 - R.mercatorP.forward(0, -Math.PI / 4)[1]]);
  assert.deepEqual(R.moveBottomP(0.2, R.equirectangularP).forward(0, -Math.PI / 2), [0.5, 0.2]);
  assert.deepEqual(R.mergeP(R.equirectangularP, R.lambertP, 0.5).inverse(5, 0.5), [NaN, NaN], 'outside both: NaN');
  assert.equal(R.bonneP(0), R.sinusoidalP);
  assert.deepEqual(R.lagrangeP.inverse(0.5, 1), [100, 100], 'the pole is outside, as in Reanimate');
});

test('GeoJSON geometry becomes line paths and applyProjection bends long segments', () => {
  const geo = {type: 'FeatureCollection', features: [
    {type: 'Feature', properties: {name: 'box'}, geometry: {type: 'Polygon', coordinates: [[[-1, -0.5], [1, -0.5], [1, 0.5], [-1, -0.5]], [[0, 0], [0.1, 0], [0, 0.1], [0, 0]]]}},
    {type: 'Feature', properties: {name: 'dot'}, geometry: {type: 'Point', coordinates: [0, 0]}},
  ]};
  const names = [];
  const svg = R.drawFeatureCollection(geo, (props, s) => { names.push(props.name); return s; });
  assert.deepEqual(names, ['box', 'dot']);
  assert.equal((R.renderSvg(svg).match(/<path /g) ?? []).length, 1, 'outer ring only; a point draws nothing');
  const line = R.mkLinePath([[-3, 1], [3, 1]]);
  const ys = (p) => new Set([...R.renderSvg(R.applyProjection(p, line)).matchAll(/[ML][-\d.]+,([-\d.]+)/g)].map((m) => m[1]));
  const flat = ys(R.equirectangularP), bent = ys(R.orthoP([0, 0]));
  assert.equal(flat.size, 1, 'a parallel stays straight in the equirectangular projection');
  assert.ok(bent.size > 20, 'the orthographic globe bends it, split into short pieces');
});
