// Reanimate's showcase film (videos/showcase/showcase.hs at commit 583ee9f), ported line for line.
// showcase is its main: a turning wire-frame sphere fades into a solid one, a circle is drawn and four
// copies of it fan out. showcase_latex is the LaTeX feature from the same file, run as its commented-
// out main line (`mapA (scale 2) $ setDuration 20 featLaTeX`): equations drawn glyph by glyph.
//
// Reanimate renders the sphere with POV-Ray and traces the wire-frame from that render with potrace.
// Neither program runs here: core/sphere.mjs draws the same orthographic textured sphere directly, and
// the wire-frame is the outline of each texture line placed on the sphere (potrace would join crossing
// outlines into one network; here they cross). introSVG is not ported: it shows the SVG logo and uses
// the ray tracer and the bitmap tracer throughout.
import * as R from '../core/index.mjs';
import {renderSphere, sphereLines} from '../core/sphere.mjs';
import {haskellRound} from './core.mjs';

const W = R.SCREEN_WIDTH, H = R.SCREEN_HEIGHT, SW = R.DEFAULT_STROKE_WIDTH;

// --- texture = checker 10 10, drawn on the 16 x 9 screen and wrapped round the sphere (uv_mapping)

const CHECKER = {w: 10, h: 10, half: 0.05};   // white lines 0.1 wide
const stepX = W / CHECKER.w, stepY = H / CHECKER.h;
const vLines = Array.from({length: CHECKER.w}, (_, x) => stepX * x - W / 2 + stepX / 2);   // x of each, y within ±0.9 H/2
const hLines = Array.from({length: CHECKER.h + 1}, (_, y) => stepY * y - H / 2);
function checkerTexture(u, v) {
  const x = (u - 0.5) * W, y = (v - 0.5) * H;
  const onV = Math.abs(y) <= H / 2 * 0.9 && vLines.some((lx) => Math.abs(x - lx) <= CHECKER.half);
  const onH = hLines.some((ly) => Math.abs(y - ly) <= CHECKER.half);
  return onV || onH ? [255, 255, 255, 255] : [0, 0, 255, Math.round(0.8 * 255)];   // withFillOpacity 0.8 blue
}
/** The texture lines' outlines in uv, as potrace (-i) would trace the white lines. */
function checkerOutlines() {
  const toU = (x) => x / W + 0.5, toV = (y) => y / H + 0.5, n = 200, lines = [];
  const along = (f) => Array.from({length: n + 1}, (_, i) => f(i / n));
  const top = toV(H / 2 * 0.9), bottom = toV(-H / 2 * 0.9);
  for (const lx of vLines) {
    const l = toU(lx - CHECKER.half), r = toU(lx + CHECKER.half);
    lines.push([...along((t) => [l, R.fromToS(bottom, top)(t)]), [r, top], ...along((t) => [r, R.fromToS(top, bottom)(t)]), [l, bottom]]);
  }
  for (const ly of hLines) {
    for (const edge of [ly - CHECKER.half, ly + CHECKER.half]) {
      if (edge <= -H / 2 || edge >= H / 2) continue;   // the half beyond the picture's edge
      lines.push(along((t) => [t, toV(edge)]));
    }
  }
  return lines;
}
const OUTLINES = checkerOutlines();

/** script's `rotate <0,s',0>`: the angle rounded to 0.1 degree. */
const povAngle = (t) => haskellRound((t * 360 / 10) / 0.1) * 0.1;

const rotateWireSphere = () => R.animate((t) => R.withStrokeColor('white', R.withStrokeWidth(0.01, R.withFillOpacity(0,
  R.mkGroup(sphereLines({lines: OUTLINES, rotY: povAngle(t), rotX: -30}).map(R.mkLinePath))))));

// 160 pixels per unit, as the film's POV-Ray render (2560 pixels over 16 units), 2 x 2 samples for +A.
const rotateSphere = () => R.animate((t) => R.scaleToSize(4, 4,
  R.embedImageRGBA(renderSphere({texture: checkerTexture, rotY: povAngle(t), rotX: -30, pxPerUnit: 160, samples: 2}))));

// --- sphereIntro

function sphereIntro() {
  const circ = R.withFillColor('blue', R.withStrokeColor('white', R.mkCircle(2)));
  return R.scene((s) => {
    s.fork((c) => c.play(R.applyE(R.delayE(2, R.fadeOutE), R.takeA(2 + 5, R.repeatA(10, R.setDuration(1, rotateWireSphere()))))));
    const sphereX = s.newVar(0);
    const sphereS = s.newSpriteA(R.repeatA(5 + 3 + 1 + 2, rotateSphere()));
    s.applyVar(sphereX, sphereS, (xValue, svg) => R.translate(xValue, 0, svg));
    s.spriteE(sphereS, R.overBeginning(1, R.constE((svg) => R.withGroupOpacity(0, svg))));
    s.spriteE(sphereS, R.delayE(1, R.overBeginning(2, R.fadeInE)));
    s.wait(5);
    s.adjustZ((z) => z + 1, (c) => c.play(R.setDuration(3, R.animate((t) =>
      R.partialSvg(t, R.withFillOpacity(0, R.rotate(180, R.pathify(circ))))))));
    const scaleFactor = 0.05;
    s.tweenVar(sphereX, 1, (x, t) => R.fromToS(x, -3)(R.curveS(3)(t)));
    for (const [dx, dy] of [[1, 2], [1, -2], [5, 2], [5, -2]]) {
      s.fork((c) => c.adjustZ((z) => z + 1, (cz) => cz.play(R.pauseAtEnd(2, R.setDuration(1, R.animate((t) => {
        const p = R.curveS(3)(t);
        return R.withFillOpacity(p, R.translate(dx * p, dy * p, R.scale(1 - scaleFactor * p, circ)));
      }))))));
    }
  });
}

const showcase = () => R.addStatic(R.mkBackground('black'), sphereIntro());

// --- featLaTeX

/** drawAnimation' fillDur step: each glyph's outline drawn, then filled, one glyph every `step` s. */
function drawAnimation(svg, fillDur = 0.5, step = 0.3) {
  return R.scene((s) => {
    R.svgGlyphs(svg).forEach(([fn, attr, tree], n) => {
      const sWidth = typeof attr.strokeWidth === 'number' ? attr.strokeWidth : SW;
      s.fork((c) => {
        c.wait(n * step);
        c.play(R.mapA(fn, R.applyE(R.overEnding(fillDur, R.fadeLineOutE(sWidth)), R.animate((t) => R.withFillOpacity(0, R.partialSvg(t, tree))))));
      });
      s.fork((c) => {
        c.wait(n * step + (1 - fillDur));
        c.newSprite((f) => R.withStrokeWidth(0, fn(R.withFillOpacity(Math.min(1, f.t / fillDur), tree))));
      });
    });
  });
}
const fadeTransition = (overlap) => (a, b) => R.seqA(
  a.duration === 0 ? R.pause(overlap) : R.applyE(R.overEnding(overlap, R.fadeOutE), R.pauseAtEnd(overlap, a)),
  R.applyE(R.overBeginning(overlap, R.fadeInE), b));
// Reanimate folds from `pause 0`, which its mkAnimation refuses ("Animation duration (0) is not
// positive") as soon as the duration is read, so this feature fails there. Here the fold starts from no
// animation, and its first step is the blank `overlap` seconds that `pause 0 & pauseAtEnd overlap` means.
const fadeTransitions = (overlap, anis) => anis.reduce((acc, a) => fadeTransition(overlap)(acc, a), {duration: 0});
const frameAtT = (t, ani) => R.getAnimationFrame(R.Sync.Stretch, ani, t, 1);

function featLaTeX() {
  const mkEQ = (txt) => drawAnimation(R.withStrokeColor('white', R.withFillColor('white', R.withStrokeWidth(0.01,
    R.translate(0, -1.5, R.scale(0.5, R.center(R.latexAlign(txt))))))));
  const eqs = fadeTransitions(0.2, [
    '\\sum_{k=1}^\\infty {1 \\over k^2} = {\\pi^2 \\over 6}',
    '\\Delta \\times E=- \\frac{\\partial B}{\\partial t}',
    '\\frac{d}{dt}(\\frac{\\partial L}{\\partial \\dot{q}}) = \\frac{\\partial L}{\\partial q}',
    '\\vec{E} = \\frac{\\sigma}{2\\epsilon_0}\\hat{n}',
  ].map(mkEQ));
  // MathJax's \LaTeX logo is built with \raise, which it allows in math mode only: same logo, set as math.
  const title = R.scale(1.5, R.center(R.withFillColor('white', R.math('\\LaTeX'))));
  return R.animate((t) => R.translate(0, 0.5, R.mkGroup([title, frameAtT(t, eqs)])));
}
const showcaseLatex = () => R.addStatic(R.mkBackground('black'), R.mapA((svg) => R.scale(2, svg), R.setDuration(20, featLaTeX())));

export const SHOWCASE_EXAMPLES = {
  showcase,
  showcase_latex: showcaseLatex,
};
