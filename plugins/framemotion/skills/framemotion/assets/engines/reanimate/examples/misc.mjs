// Reanimate's remaining examples with a golden file (examples/*.hs at commit 583ee9f): the play-timing
// regressions, a quadratic morph, a frame counter, SVG filters, a hello world, a raster image, the
// canvas introduction and two TeX pictures, ported line for line.
//
// bug_play1..3, bug_quad, counter, goo, intro_hello and raster print Reanimate's golden SVG byte for
// byte (the raster's PNG pixel for pixel). intro_canvas, intro_canvas_square, latex_basic and fe_morph
// draw TeX, whose glyphs come from MathJax here (plain text when no TeX renderer is plugged in) and
// from LaTeX in the golden files, so they are checked by eye. doc_githubIcon, doc_haskellLogo and doc_svgLogo are not ported: they draw the GitHub, Haskell
// and SVG logos, which are those projects' marks, not Reanimate's.
import * as R from '../core/index.mjs';
import {evalBezier} from '../core/cubicbezier.mjs';

const W = R.SCREEN_WIDTH, H = R.SCREEN_HEIGHT, SW = R.DEFAULT_STROKE_WIDTH;

// --- bug_play1.hs, bug_play2.hs, bug_play3.hs: a scene held at its start, middle and end

const bugPlay = (v) => () => R.signalA(R.constantS(v), R.scene((s) => {
  s.play(R.animate(() => R.mkCircle(1)));
  s.play(R.animate(() => R.mkRect(1, 1)));
}));

// --- bug_quad.hs: a quadratic curve morphed into a taller one

function bugQuad() {
  const m = R.morph(R.rawLinear, R.mkPathString('M 0 0 q 1 1, 2 0 z'), R.mkPathString('M 0 0 q 1 2, 2 0 z'));
  return R.docEnv(R.scene((s) => s.play(R.animate((t) => m(t)))));
}

// --- counter.hs: a circle whose radius counts the frames

const counter = () => R.mkAnimation(2, (t) => R.mkCircle(R.fromToS(0, 2 * 60 - 1)(t)));

// --- goo.hs: two circles drifting apart, plain, blurred and through a "goo" filter

function goo() {
  const sharpness = 10, dev = 0.2, radius = 1;
  const circ = R.mkCircle(radius);
  const box = {width: {percent: 3}, height: {percent: 3}, x: {percent: -1}, y: {percent: -1}};
  const pair = (s) => R.mkGroup([R.translate(s * -radius, 0, circ), R.translate(s * radius, 0, circ)]);
  return R.playThenReverseA(R.mkAnimation(5, (t) => {
    const s = R.fromToS(0, 1.5)(R.curveS(2)(t));
    return R.mkGroup([
      R.mkBackground('black'),
      R.mkFilter('blur', [R.feGaussianBlur({stdDeviation: dev, result: 'blur'})], box),
      R.mkFilter('goo', [
        R.feGaussianBlur({stdDeviation: dev, result: 'blur'}),
        R.feColorMatrix({values: `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${sharpness * 2} -${sharpness}`, result: 'goo'}),
        R.feComposite({in: 'SourceGraphic', in2: 'goo', operator: 'atop'}),
      ], box),
      R.translate(0, radius * 2.2, R.withFillColor('red', pair(s))),
      R.withFilterRef('blur', R.withFillColor('red', pair(s))),
      R.translate(0, -radius * 2.2, R.withFilterRef('goo', R.withFillColor('red', pair(s)))),
    ]);
  }));
}

// --- intro_hello.hs

const introHello = () => R.addStatic(R.mkBackground('cyan'), R.staticFrame(1, R.mkText('Hello world')));

// --- raster.hs: a 255 x 255 gradient image, turning

function raster() {
  const img = R.embedImage(255, 255, (x, y) => [x, y, 128]);
  return R.addStatic(R.mkBackground('black'), R.mkAnimation(5, (t) => R.rotate(t * 360, R.scaleToWidth(6, img))));
}

// --- intro_canvas.hs and intro_canvas_square.hs: the 16 x 9 canvas, a red dot travelling over it

/** Haskell's printf "%.1f": the shortest decimal digits, rounded half up at one decimal. */
function printf1(x) {
  if (x < 0 || Object.is(x, -0)) return `-${printf1(-x)}`;
  const [mant, exp] = x.toExponential().split('e');
  const digits = mant.replace('.', ''), e = Number(exp) + 1;   // x = 0.digits * 10^e
  const intLen = Math.max(e, 0);
  const padded = (e < 0 ? '0'.repeat(-e) : '') + digits + '0'.repeat(Math.max(0, intLen + 2 - digits.length));
  const keep = intLen + 1;   // integer digits and one decimal
  let n = BigInt(padded.slice(0, keep) || '0');
  if (Number(padded[keep] ?? '0') >= 5) n += 1n;
  const str = n.toString().padStart(2, '0');
  return `${str.slice(0, -1)}.${str.slice(-1)}`;
}
const normalize = ([x, y]) => {
  const l = x * x + y * y;
  const nearZero = (v) => Math.abs(v) <= 1e-12;
  return nearZero(l) || nearZero(1 - l) ? [x, y] : [x / Math.sqrt(l), y / Math.sqrt(l)];
};
function outlinedText(txt) {
  return R.mkGroup([
    R.center(R.withStrokeColorPixel(R.RTFD_BACKGROUND, R.withStrokeWidth(SW * 8, R.withFillOpacity(0, R.latex(txt))))),
    R.center(R.latex(txt)),
  ]);
}
function curlyBracket(from, to, height) {
  const [nx, ny] = normalize([from[0] - to[0], from[1] - to[1]]).map((v) => v * height);
  const outwards = [-ny, nx];
  const halfway = [0.5 * from[0] + 0.5 * to[0], 0.5 * from[1] + 0.5 * to[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  return R.withStrokeColor('black', R.withFillOpacity(0, R.withStrokeWidth(SW * 2, R.mkPath([
    {c: 'M', abs: true, args: [from]},
    {c: 'C', abs: true, args: [[add(from, outwards), halfway, add(halfway, outwards)]]},
    {c: 'C', abs: true, args: [[halfway, add(to, outwards), to]]},
  ]))));
}
const range = (n) => Array.from({length: Math.floor(n + 0.5) + 1}, (_, i) => i);   // [0 .. n] on doubles
function grid() {
  return R.withStrokeColor('grey', R.withStrokeWidth(SW * 0.5, R.mkGroup([
    R.mkGroup(range(H).map((i) => R.translate(0, i / H * H - H / 2 - H / 18, R.mkLine([-W, 0], [W, 0])))),
    R.mkGroup(range(W).map((i) => R.translate(i / W * W - W / 2, 0, R.mkLine([0, -H], [0, H])))),
  ])));
}
function canvasStatic(w, h, labelY, sideX) {   // the 16 x 9 canvas, or the 8 x 8 square
  return R.mkGroup([
    grid(),
    R.withStrokeColor('grey', R.mkLine([-W, 0], [W, 0])),
    R.withStrokeColor('grey', R.mkLine([0, -H], [0, H])),
    curlyBracket([-w / 2 + SW, h / 2], [w / 2 - SW, h / 2], 1),
    R.translate(0, labelY, outlinedText(`${w} units`)),
    curlyBracket([-w / 2, -h / 2 + SW], [-w / 2, h / 2 - SW], 1),
    R.translate(sideX, 0, R.rotate(90, outlinedText(`${h} units`))),
  ]);
}
const redDot = ([x, y]) => R.translate(x, y, R.mkGroup([
  R.translate(0, -0.5, R.scale(0.5, outlinedText(`${printf1(x)},${printf1(y)}`))),
  R.withFillColor('red', R.mkCircle(0.1)),
]));
function canvasScene(still, moves, waitFirst) {
  return R.scene((s) => {
    s.newSpriteSVG_(R.mkBackgroundPixel(R.RTFD_BACKGROUND));
    s.newSpriteSVG_(still);
    const dotPath = s.newVar([[0, 0], [0, 0], [0, 0]]), dotParam = s.newVar(0);
    s.newSprite_((f) => redDot(evalBezier(f.get(dotPath), f.get(dotParam))));
    const moveDot = (a, b) => {
      const pos = evalBezier(s.readVar(dotPath), 1);
      s.writeVar(dotPath, [pos, a, b]);
      s.writeVar(dotParam, 0);
      s.tweenVar(dotParam, 5, (v, t) => R.fromToS(v, 1)(R.curveS(2)(t)));
      s.wait(1);
    };
    if (waitFirst) s.wait(1);
    for (const [a, b] of moves) moveDot(a, b);
  });
}
const introCanvas = () => canvasScene(canvasStatic(W, H, 3, -6.5), [[[0, 1], [4, 2]], [[-1, 0], [-4, 3]], [[0, 0], [-4, -3]], [[0, 0], [5, -2]], [[6, 2], [2, 1]], [[0, 0], [0, 0]]], true);
const introCanvasSquare = () => R.mapA((svg) => R.withViewBox([-4, -4, 8, 8], svg),
  canvasScene(canvasStatic(8, 8, 2.5, -2.5), [[[0, 1], [2, 1]], [[-1, 0], [-1, 1.5]], [[0, 0], [-2, -3]], [[0, 0], [2.5, -1]], [[3, 1.5], [1.5, 1]], [[0, 0], [0, 0]]], false));

// --- latex_basic.hs: the Basel sum, outlined then filled

function latexBasic() {
  const text = R.withStrokeWidth(0.01, R.scale(2, R.center(R.latexAlign('\\sum_{k=1}^\\infty {1 \\over k^2} = {\\pi^2 \\over 6}'))));
  return R.playThenReverseA(R.mkAnimation(2, (t) => R.mkGroup([
    R.mkBackground('black'),
    R.withStrokeColor('white', R.withFillOpacity(0, text)),
    R.withFillColor('white', R.withFillOpacity(t, text)),
  ])));
}

// --- fe_morph.hs: coloured circles orbiting the word "Text" through a gooey filter

function feMorph() {
  const circles = [[900, 0.3], [760, 0.5], [670, 0.4], [600, 0.6], [450, 0.7]];
  const alphaDiff = 20, alphaMin = 255 / 2 - alphaDiff / 2;
  const mul = 255 / alphaDiff, sub = -alphaMin * mul / 255;
  const printfF = (v) => v.toFixed(6).replace(/^-0\.000000$/, '-0.000000');   // printf "%f": six decimals
  const gooey = R.mkFilter('gooey', [
    R.feGaussianBlur({stdDeviation: 0.2, edgeMode: 'none', result: 'blur'}),
    R.feColorMatrix({values: `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${printfF(mul)} ${printfF(sub)}`, in: 'blur', result: 'colormatrix'}),
  ]);
  const word = R.lowerTransformations(R.center(R.withFillColor('black', R.latex('Text'))));
  return R.scene((s) => {
    s.newSpriteSVG_(R.mkBackground('white'));
    s.play(R.pauseAtEnd(2, R.mkAnimation(10, (t) => R.mkGroup([
      gooey,
      R.withFilterRef('gooey', R.mkGroup([
        word,
        R.mkGroup(circles.map(([rot, size], n) => R.rotate(t * rot, R.translate(R.fromToS(0, 3.5)(R.bellS(2)(t)), 0,
          R.withFillColorPixel([...R.turbo(n / (circles.length - 1)), 255], R.mkCircle(size * 1.5)))))),
      ])),
    ]))));
  });
}

export const MISC_EXAMPLES = {
  bug_play1: bugPlay(0),
  bug_play2: bugPlay(0.5),
  bug_play3: bugPlay(1),
  bug_quad: bugQuad,
  counter,
  goo,
  intro_hello: introHello,
  raster,
  intro_canvas: introCanvas,
  intro_canvas_square: introCanvasSquare,
  latex_basic: latexBasic,
  fe_morph: feMorph,
};
