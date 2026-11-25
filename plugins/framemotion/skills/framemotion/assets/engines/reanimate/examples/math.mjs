// Reanimate's mathematical examples (examples/*.hs at commit 583ee9f), ported line for line: Fourier
// series drawing a square wave and the letter pi, a tangent and normal sliding along a glyph, and a
// star field with motion trails. Numbers follow Haskell: Data.Complex step by step (core/complex.mjs),
// random 1.2.0's StdGen (core/random.mjs) and cubicbezier's Bernstein evaluation (core/geom.mjs).
//
// fourier_draw, tut_glue_fourier and demo_tangent compute with TeX glyph outlines (pi and "s"), so
// they need a TeX renderer (MathJax on the page, useMathJaxNode in Node; the factories carry
// needsTex). Without one they stop with an error instead of drawing nothing. tangent_and_normal is
// not ported: it is commented out in Reanimate (it needs the diagrams library).
import * as R from '../core/index.mjs';
import {cx, cmul, magnitude, csum, cscan, expTurn, cneg} from '../core/complex.mjs';
import {mkStdGen, randomRsDouble} from '../core/random.mjs';

const W = R.SCREEN_WIDTH, H = R.SCREEN_HEIGHT;
const needsTex = (make) => Object.assign(make, {needsTex: true});
function texOutline(svg, what) {
  if (!R.hasTexRenderer()) {
    throw new Error(`this example computes with the TeX outline of ${what}; plug in a TeX renderer first ` +
      '(useMathJax on the engine page, useMathJaxNode from tex-mathjax-node.mjs in Node)');
  }
  return svg;
}

// --- fourier.hs: a square wave from 1 to 100 circles

const sWidth = 0.02;
const waveMultiplier = 2;   // 1 is a sawtooth wave, 2 a square wave

function nthCircle(n, phi) {
  const k = n * waveMultiplier + 1;
  const radius = 2.5 * (2 / (k * Math.PI));
  return [Math.cos(k * phi) * radius, Math.sin(k * phi) * radius];
}
const fourierYValue = (n, phi) => csum(Array.from({length: n}, (_, i) => nthCircle(i, phi)))[1];

function mkCirclePath(nCircles, phiOffset) {
  const granularity = 500;
  const cycle = [];
  for (let x = granularity; x >= 1; x--) cycle.push(fourierYValue(nCircles, 2 * Math.PI * (x / granularity)));
  const drop = R.haskellRound((1 - phiOffset / (2 * Math.PI)) * granularity);
  return R.mkLinePath(Array.from({length: 2000}, (_, i) => [2 * i / granularity, cycle[(drop + i) % granularity]]));
}

function drawNCircles(totalCircles, phi) {
  const circles = Array.from({length: totalCircles}, (_, n) => nthCircle(n, phi));
  const worker = (i) => {
    if (i >= circles.length) return R.None;
    const [x, y] = circles[i];
    const radius = Math.sqrt(x * x + y * y);
    return R.mkGroup([
      R.withStrokeWidth(sWidth, R.withStrokeColor('grey', R.withFillOpacity(0, R.mkCircle(radius)))),
      R.translate(x, y, worker(i + 1)),
      R.withStrokeWidth(sWidth, R.withStrokeColor('white', R.mkLine([0, 0], [x, y]))),
    ]);
  };
  const [x, y] = csum(circles);
  return R.mkGroup([worker(0), R.withStrokeWidth(sWidth, R.withStrokeColor('white', R.mkLine([x, y], [W / 4, y])))]);
}

const fourierAnimation = (nCircles) => R.repeatA(2, R.mkAnimation(3, (t) => {
  const phi = R.fromToS(0, 2 * Math.PI)(t);
  return R.mkGroup([
    R.mkBackground('black'),
    R.translate(-W / 4, 0, R.mkGroup([
      drawNCircles(nCircles, phi),
      R.withStrokeColor('white', R.withStrokeWidth(sWidth, R.withFillOpacity(0, R.translate(W / 4, 0, mkCirclePath(nCircles, phi))))),
    ])),
    R.withStrokeWidth(sWidth, R.withFillColor('white', R.translate(-W / 8 * 3, H / 8 * 3, R.latex(`Circles: ${nCircles}`)))),
  ]);
}));

// --- The Fourier series of a path (fourier_draw.hs and tut_glue_fourier.hs share these)

/** mkFourier: coefficients 0, 1, -1, 2, -2, ... of `points` as a closed curve, computed when first read. */
function mkFourier(points) {
  const nPoints = points.length, deltaT = cx(1 / nPoints);
  const memo = [];
  const findCoefficient = (n) => csum(points.map((p, idx) =>
    cmul(cmul(cx(p[0], p[1]), expTurn(cneg(cx(n)), idx / nPoints)), deltaT)));
  return (i) => (memo[i] ??= findCoefficient(i === 0 ? 0 : i % 2 ? (i + 1) / 2 : -i / 2));
}
const coefficientsLength = (coeff, from, to) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += magnitude(coeff(i));
  return sum;
};
/** setFourierLength: the first coefficient, then circles until their radii add up to `len0`, the last cut short. */
function setFourierLength(len0, coeff) {
  const out = [coeff(0)];
  let len = len0;
  for (let i = 1; ; i++) {
    const c = coeff(i), m = magnitude(c);
    if (m < len) { out.push(c); len -= m; continue; }
    out.push(cmul(c, cx(len / m)));
    return out;
  }
}
/** rotateFourier: turn each pair of coefficients n and -n by phi turns (a lone last one gains a zero partner). */
function rotateFourier(phi, coeffs) {
  if (!coeffs.length) return [];
  const out = [coeffs[0]];
  for (let i = 1, n = 1; i < coeffs.length; i += 2, n++) {
    const left = coeffs[i], right = i + 1 < coeffs.length ? coeffs[i + 1] : cx(0);
    out.push(cmul(left, expTurn(cneg(cx(n)), phi)), cmul(right, expTurn(cx(n), phi)));
  }
  return out;
}
const mkFourierOutline = (coeffs) => Array.from({length: 501}, (_, idx) => csum(rotateFourier(idx / 500, coeffs)));

const piPoints = (size) => R.lineToPoints(500, R.toLineCommands(R.extractPath(R.scale(size, R.center(texOutline(R.latexAlign('\\pi'), 'pi'))))));
const fourierCache = new Map();
const piFourier = (size) => {
  if (!fourierCache.has(size)) {
    const coeff = mkFourier(piPoints(size));
    fourierCache.set(size, {coeff, length: coefficientsLength(coeff, 1, 500)});
  }
  return fourierCache.get(size);
};

// fourier_draw.hs
function fourierDraw() {
  const {coeff, length: maxLength} = piFourier(10);
  const drawCircles = (circles) => {
    const worker = (i) => {
      if (i >= circles.length) return R.None;
      const [x, y] = circles[i];
      return R.mkGroup([
        R.withStrokeWidth(sWidth, R.withStrokeColor('dimgrey', R.withFillOpacity(0, R.mkCircle(Math.sqrt(x * x + y * y))))),
        R.translate(x, y, worker(i + 1)),
      ]);
    };
    return R.mkGroup([worker(0), R.withStrokeWidth(sWidth, R.withStrokeColor('white', R.withStrokeLineJoin('round',
      R.withFillOpacity(0, R.mkLinePath(cscan(circles)))))),
    ]);
  };
  return R.pauseAtEnd(2, R.mkAnimation(50, (t) => {
    const circles = setFourierLength(t * maxLength, coeff);
    const phi = R.fromToS(0, 15)(t);
    return R.mkGroup([
      R.mkBackground('black'),
      drawCircles(rotateFourier(phi, circles)),
      R.withStrokeColor('green', R.withFillOpacity(0, R.mkLinePath(mkFourierOutline(circles)))),
      R.withFillColor('white', R.translate(-W / 16 * 7, H / 16 * 7, R.latex(`Circles: ${circles.length}`))),
    ]);
  }));
}

// tut_glue_fourier.hs
function tutGlueFourier() {
  const {coeff, length: piFourierLen} = piFourier(15);
  const drawCirclesInner = (circles) => {
    const worker = (i) => {
      if (i >= circles.length) return R.None;
      const [x, y] = circles[i];
      return R.mkGroup([
        R.withStrokeColor('dimgrey', R.withFillOpacity(0, R.mkCircle(Math.sqrt(x * x + y * y)))),
        R.translate(x, y, worker(i + 1)),
      ]);
    };
    return R.mkGroup([worker(0), R.withStrokeColor('black', R.withStrokeLineJoin('round', R.withFillOpacity(0, R.mkLinePath(cscan(circles)))))]);
  };
  const drawCircles = (circles) => (circles.length ? R.translate(circles[0][0], circles[0][1], drawCirclesInner(circles.slice(1))) : R.mkGroup([]));
  const fourierA = (genPhi) => R.animate((t) => {
    const circles = setFourierLength(t * piFourierLen, coeff);
    const coeffs = rotateFourier(genPhi(t), circles);
    const [x, y] = csum(coeffs);
    return R.mkGroup([
      drawCircles(coeffs),
      R.withStrokeColor('green', R.withStrokeLineJoin('round', R.withFillOpacity(0,
        R.withStrokeWidth(R.DEFAULT_STROKE_WIDTH * 2, R.mkLinePath(mkFourierOutline(circles)))))),
      R.translate(x, y, R.withFillColor('red', R.mkCircle(R.DEFAULT_STROKE_WIDTH * 3))),
    ]);
  });
  return R.setDuration(30, R.scene((s) => {
    s.newSpriteSVG(R.mkBackgroundPixel([252, 252, 252, 255]));
    s.play(R.pauseAtEnd(2, R.signalA((x) => R.reverseS(R.powerS(2)(R.reverseS(x))), R.setDuration(50, fourierA(R.fromToS(0, 5))))));
    s.play(R.pauseAtEnd(2, R.signalA(R.powerS(2), R.reverseA(R.setDuration(10, fourierA(R.constantS(0)))))));
  }));
}

// --- demo_tangent.hs: the tangent and normal of the letter s, drawn along its outline

const nearZero = (v) => Math.abs(v) <= 1e-12;
/** linear's normalize: unchanged when its squared length is 0 or 1 (within 1e-12). */
function normalize([x, y]) {
  const l = x * x + y * y;
  if (nearZero(l) || nearZero(1 - l)) return [x, y];
  const n = Math.sqrt(l);
  return [x / n, y / n];
}
/** unangle from demo_tangent: the direction of a vector in radians. */
function unangle([ax, ay]) {
  const alpha = Math.asin(ay / Math.sqrt(ax * ax + ay * ay));
  return ax < 0 ? Math.PI - alpha : alpha;
}

function demoTangent() {
  const piSvg = R.pathify(R.lowerTransformations(R.center(R.scale(10, texOutline(R.latex('s'), '"s"')))));
  const tangentTxt = R.scale(1.1, R.center(R.latex('tangent')));
  const normalTxt = R.scale(1.1, R.center(R.latex('normal')));
  const drawTangent = (alpha, svg) => (alpha >= 1 ? svg : R.mapTree((node) => {
    if (node.kind !== 'path') return node;
    const [[posX, posY], tangent] = R.atPartial(alpha, R.toLineCommands(node.d));
    const unit = normalize(tangent);
    const normed = [unit[0] * 4, unit[1] * 4];
    const [tangentX, tangentY] = normed;
    const [midX, midY] = [0.5 * 0 + 0.5 * normed[0], 0.5 * 0 + 0.5 * normed[1]];
    const k = R.svgWidth(normalTxt) * 1.1;
    const [normVectX, normVectY] = [unit[0] * k, unit[1] * k];
    const tangentSvg = R.translate(posX, posY, R.rotate(unangle(normed) / Math.PI * 180 + 180,
      R.translate(0, R.svgHeight(tangentTxt) / 2, tangentTxt)));
    const normalSvg = R.translate(posX, posY, R.rotate(unangle(normed) / Math.PI * 180 + 90,
      R.translate(R.svgWidth(normalTxt) / 2 * 1.1, R.svgHeight(normalTxt) / 2 * 1.3, normalTxt)));
    const outlined = (txt) => R.withStrokeWidth(R.DEFAULT_STROKE_WIDTH * 2, R.withStrokeColor('white', txt));
    const filled = (txt) => R.withFillOpacity(1, R.withFillColor('black', R.withStrokeWidth(0, txt)));
    return R.mkGroup([
      R.withStrokeWidth(R.DEFAULT_STROKE_WIDTH, R.withStrokeColor('black',
        R.translate(posX - midX, posY - midY, R.mkLine([0, 0], [tangentX, tangentY])))),
      R.withStrokeWidth(R.DEFAULT_STROKE_WIDTH, R.withStrokeColor('black', R.translate(posX, posY, R.mkLine([0, 0], [-normVectY, normVectX])))),
      outlined(tangentSvg), filled(tangentSvg), outlined(normalSvg), filled(normalSvg),
    ]);
  }, svg));
  return R.docEnv(R.mkAnimation(30, (t) => R.mkGroup([R.mkBackgroundPixel(R.RTFD_BACKGROUND), piSvg, drawTangent(t, piSvg)])));
}

// --- demo_stars.hs: flying through 1000 stars, with 10 fading trail frames

const N_STARS = 1000;
let starTable = null;
function stars() {
  if (!starTable) {
    const xs = randomRsDouble([-W / 2, W / 2], mkStdGen(0xDEAFBEEF), N_STARS);
    const ys = randomRsDouble([-W / 2, W / 2], mkStdGen(0x12345678), N_STARS);
    const zs = randomRsDouble([0, 1], mkStdGen(0x87654321), N_STARS);
    starTable = xs.map((x, i) => [x, ys[i], zs[i]]).sort((a, b) => a[2] - b[2]);
  }
  return starTable;
}
/** allStars: the sorted stars again and again, each round one unit deeper. */
const starAt = (i) => { const [x, y, z] = stars()[i % N_STARS]; return [x, y, z + Math.floor(i / N_STARS)]; };

function starAnimation() {
  const dot = (o) => R.withFillColorPixel([...R.interpolateRGB8(R.labComponents, [252, 252, 252], [0, 0, 0])(o), 255], R.mkCircle(0.05));
  return R.mkAnimation(10, (t) => {
    const camZ = t * 4;
    let first = 0;
    while (starAt(first)[2] < camZ) first++;
    const shown = Array.from({length: N_STARS}, (_, i) => starAt(first + i)).reverse();
    return R.withStrokeWidth(0, R.rotate(t * 360, R.mkGroup(shown.map(([x, y, z]) => {
      const newZ = z - camZ;
      return R.translate(x / newZ, y / newZ, dot(1 - newZ));
    }))));
  });
}

function trails(trailDur, raw) {
  const fps = 200;
  const trailFrames = R.haskellRound(trailDur * fps);
  const nFrames = R.haskellRound(raw.duration * fps);
  const frames = new Map();
  const getFrame = (idx) => {
    const i = ((idx % nFrames) + nFrames) % nFrames;
    if (!frames.has(i)) frames.set(i, R.frameAt(i / nFrames * raw.duration, raw));
    return frames.get(i);
  };
  return R.mkAnimation(raw.duration, (t) => {
    const idx = R.haskellRound(t * nFrames);
    let svg = R.mkGroup([]);
    for (let x = idx - trailFrames; x <= idx; x++) svg = R.mkGroup([R.withGroupOpacity(trailFrames / (trailFrames + 1), svg), getFrame(x)]);
    return svg;
  });
}

const demoStars = () => R.scene((s) => {
  s.newSpriteSVG_(R.mkBackgroundPixel(R.RTFD_BACKGROUND));
  s.play(trails(0.05, starAnimation()));
});

// doc_balloon.hs: the letter X inflated from one corner
const docBalloon = () => {
  const grow = R.balloon(R.scale(8, R.center(texOutline(R.latex('X'), '"X"'))));
  return R.docEnv(R.pauseAtEnd(1, R.mkAnimation(5, (t) => R.withStrokeLineJoin('round', grow(t)))));
};

export const MATH_EXAMPLES = {
  fourier: () => [1, 2, 3, 5, 10, 25, 50, 100].map(fourierAnimation).reduce((a, b) => R.seqA(a, b)),
  fourier_draw: needsTex(fourierDraw),
  tut_glue_fourier: needsTex(tutGlueFourier),
  demo_tangent: needsTex(demoTangent),
  demo_stars: demoStars,
  balloon: needsTex(docBalloon),
};
