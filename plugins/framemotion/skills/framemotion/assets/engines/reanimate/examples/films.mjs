// Reanimate's map-projection film (videos/map-projection at commit 583ee9f), ported line for line:
// gif.hs, the world's borders morphing through five projections and back, and distortion.hs, the
// 59-second tour of seventeen projections with the Earth's picture, the land outlines, a graticule and
// a label. The film's sizes.hs is not ported: its globe is rendered by Blender, which this engine
// does not run. EndScene.hs only shows the GitHub logo.
//
// Reanimate reads countries.json, land.geojson and earth-extreme.jpg from the working directory and
// its repository holds none of them. Here the borders and land are Natural Earth's 1:110m layers
// (public domain, core/natural-earth-data.mjs) and the picture is Reanimate's built-in smallEarth
// (300 x 150), or any equirectangular {width, height, data} RGBA image passed as `earth`.
import * as R from '../core/index.mjs';
import {haskellRound} from './core.mjs';
import {NE_110M_COUNTRIES, NE_110M_LAND} from '../core/natural-earth-data.mjs';

const W = R.SCREEN_WIDTH, H = R.SCREEN_HEIGHT, SW = R.DEFAULT_STROKE_WIDTH;
const halfPi = Math.PI / 2, maxLat = Math.atan(Math.sinh(Math.PI));
const toRads = (d) => d / 180 * Math.PI;
const fwd = (p, lam, phi) => p.forward(lam, phi);

/** geometryToSVG: a GeoJSON geometry's lines (a polygon's outer ring only), projected by p. */
function geometryToSVG(p, geo) {
  const line = (pts) => R.mkLinePath(pts.map(([x, y]) => fwd(p, x / 180 * Math.PI, y / 180 * Math.PI)));
  switch (geo.type) {
    case 'MultiPolygon': return R.mkGroup(geo.coordinates.map((c) => geometryToSVG(p, {type: 'Polygon', coordinates: c})));
    case 'Polygon': return R.mkGroup([line(geo.coordinates[0])]);
    case 'LineString': return line(geo.coordinates);
    case 'MultiLineString': return R.mkGroup(geo.coordinates.map((c) => line(c)));
    default: return R.None;
  }
}
const borders = (collection) => collection.features.map((f) => f.geometry);
// A pole line can be 0/0 in a projection (Bottomley at latitude 90): Reanimate prints "NaN" into the
// path and its renderer draws nothing for it; here the line is left out, which draws the same.
const graticule = (lines) => R.mkGroup(lines.filter((l) => l.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).map(R.mkLinePath));

function latitudeLines(p, latLines) {
  const segments = 100;
  return Array.from({length: latLines * 2 + 1}, (_, n) => {
    const lam = R.fromToS(-Math.PI, Math.PI)(n / (latLines * 2));
    return Array.from({length: segments + 1}, (_, k) => fwd(p, lam, R.fromToS(-maxLat, maxLat)(k / segments)));
  });
}
function longitudeLines(p, lonLines, from) {
  const segments = 100;
  const line = (phi) => Array.from({length: segments + 1}, (_, k) => fwd(p, R.fromToS(-Math.PI, Math.PI)(k / segments), phi));
  return [line(maxLat), line(-maxLat),
    ...Array.from({length: lonLines * 2 - 2 * from + 1}, (_, i) => line(R.fromToS(-halfPi, halfPi)((i + from) / (lonLines * 2))))];
}

// --- gif.hs

function gifGrid(p) {
  return R.withStrokeWidth(SW * 0.5, R.lowerTransformations(R.scaleXY(W, H, R.translate(-1 / 2, -1 / 2,
    R.withFillOpacity(0, R.withStrokeColor('black', R.mkGroup([
      R.mkGroup(borders(NE_110M_COUNTRIES).map((g) => geometryToSVG(p, g))),
      graticule([...latitudeLines(p, 2), ...longitudeLines(p, 2, 1)]),
    ])))))));
}

function mapProjectionGif() {
  const waitT = 0, morphT = 1;
  return R.scene((s) => {
    s.newSpriteSVG_(R.mkBackgroundPixel(R.RTFD_BACKGROUND));
    const prevProj = s.newVar(R.equirectangularP);
    const morphTo = (proj) => {
      const prev = s.readVar(prevProj);
      s.play(R.pauseAtEnd(waitT, R.signalA(R.curveS(2), R.setDuration(morphT, R.animate((t) => gifGrid(R.mergeP(prev, proj, t)))))));
    };
    for (const proj of [R.mollweideP, R.bottomleyP(toRads(30)), R.wernerP, R.foucautP, R.lagrangeP]) {
      morphTo(proj);
      s.writeVar(prevProj, proj);
    }
    morphTo(R.equirectangularP);
  });
}

// --- distortion.hs

function distortionGrid(p) {
  return R.lowerTransformations(R.scaleXY(W, H, R.translate(-1 / 2, -1 / 2, R.withStrokeWidth(SW * 0.5,
    R.withFillOpacity(0, R.mkGroup([
      R.mkGroup([]),
      R.withStrokeColorPixel([0x90, 0x90, 0x90, 0], R.withFillOpacity(0, R.mkGroup(borders(NE_110M_LAND).map((g) => geometryToSVG(p, g))))),
      R.withStrokeColorPixel([0x50, 0x50, 0x50, 0], graticule([...latitudeLines(p, 4), ...longitudeLines(p, 4, 0)])),
    ]))))));
}

// LaTeX's \degree (gensymb) is a math-mode macro in MathJax; in text it is drawn as $^\circ$.
function renderLabel(label) {
  label = label.replaceAll('\\degree', '$^\\circ$');
  const ref = R.scale(1.5, R.latex('\\texttt{Tygv123}'));
  const glyphs = R.scale(1.5, R.latex(`\\texttt{${label}}`));
  const svgTxt = R.mkGroup([R.withStrokeColor('black', R.withFillColor('white', glyphs)), R.withFillColor('white', glyphs)]);
  return R.translate(W * 0.01, H * 0.02, R.translate(-W / 2, -H / 2, R.translate(0, R.svgHeight(ref), svgTxt)));
}

function mapProjectionDistortion({earth} = {}) {
  const src = earth ?? R.smallEarth();
  const waitT = 2, morphT = 2;
  const picture = (img) => R.scaleToSize(W, H, R.embedImageRGBA(img));
  return R.setDuration(59, R.scene((s) => {
    const bg = s.newSpriteSVG(R.mkBackground('white'));
    s.spriteZ(bg, -1);
    const prevProj = s.newVar(R.equirectangularP);
    const txtVar = s.newVar('Equirectangular');
    const txtS = s.newSprite((f) => renderLabel(f.get(txtVar)));
    const txtFade = s.spriteVar(txtS, 1, R.withGroupOpacity);
    s.spriteZ(txtS, 2);
    const pushInterp = (label, proj) => {
      s.fork((c) => {
        c.tweenVar(txtFade, 0.2, (v, t) => R.fromToS(v, 0)(R.curveS(2)(t)));
        c.writeVar(txtVar, label);
        c.tweenVar(txtFade, 0.2, (v, t) => R.fromToS(v, 1)(R.curveS(2)(t)));
      });
      const prev = s.readVar(prevProj);
      s.play(R.pauseAtEnd(waitT, R.signalA(R.curveS(2), R.mkAnimation(morphT, (t) =>
        R.mkGroup([picture(R.interpP(src, prev, proj, t)), distortionGrid(R.mergeP(prev, proj, t))])))));
      s.writeVar(prevProj, proj);
    };
    const pushT = (mkLabel, mkProj) => {
      s.fork((c) => c.tweenVar(txtVar, morphT, (v, t) => (t > 0 ? mkLabel(t) : v)));
      s.play(R.pauseAtEnd(waitT, R.signalA(R.curveS(2), R.mkAnimation(morphT, (t) =>
        R.mkGroup([picture(R.project(src, mkProj(t))), distortionGrid(mkProj(t))])))));
      s.writeVar(prevProj, mkProj(1));
    };

    s.play(R.staticFrame(waitT / 2, R.mkGroup([picture(R.project(src, R.equirectangularP)), distortionGrid(R.equirectangularP)])));
    pushInterp('Lambert', R.lambertP);
    pushInterp('Web Mercator', R.mercatorP);
    pushInterp('Mollweide', R.mollweideP);
    pushInterp('Hammer', R.hammerP);
    pushInterp('Bottomley 30\\degree', R.bottomleyP(toRads(30)));
    pushInterp('Werner', R.wernerP);
    pushInterp('Bonne 45\\degree', R.bonneP(toRads(45)));
    pushT((t) => `Bonne ${haskellRound(R.fromToS(45, 0)(t))}\\degree`, (t) => R.bonneP(toRads(R.fromToS(45, 0)(t))));
    pushInterp('Eckert I', R.eckert1P);
    const eckert = s.newSpriteSVG(renderLabel('Eckert'));
    s.spriteZ(eckert, 2);
    pushInterp('Eckert III', R.eckert3P);
    pushInterp('Eckert V', R.eckert5P);
    s.destroySprite(eckert);
    pushInterp('Fahey', R.faheyP);
    pushInterp('Collignon', R.collignonP);
    pushInterp('August', R.augustP);
    pushInterp('Foucaut', R.foucautP);
    pushInterp('Lagrange', R.lagrangeP);
    pushInterp('Equirectangular', R.equirectangularP);
  }));
}

export const FILM_EXAMPLES = {
  map_projection_gif: mapProjectionGif,
  map_projection_distortion: mapProjectionDistortion,
};
