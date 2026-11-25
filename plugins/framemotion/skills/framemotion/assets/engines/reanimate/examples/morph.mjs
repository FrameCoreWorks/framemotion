// Reanimate's morphing examples (examples/doc_linear.hs, doc_rawLinear.hs, doc_rotationalTrajectory.hs
// and morphology_*.hs at commit 583ee9f), ported line for line on core/morph.mjs.
//
// Where Reanimate builds a morph inside a frame function from values that do not change, the port
// builds it once outside; the frames are the same. The examples that morph TeX glyphs need a TeX
// renderer (the factories carry needsTex). Three examples colour their shapes with Reanimate's parula
// map, which this engine does not ship (its colours are MathWorks'); they use viridis, the nearest map
// it has, a difference on purpose.
import * as R from '../core/index.mjs';
import * as Q from '../core/rational.mjs';
import {mkPolygon, polygonPoints, pSize, pAccess, pNext} from '../core/polygon.mjs';

const BG = R.RTFD_BACKGROUND;
const W = R.SCREEN_WIDTH;
const SW = R.DEFAULT_STROKE_WIDTH;
const needsTex = (make) => Object.assign(make, {needsTex: true});
function texOutline(svg, what) {
  if (!R.hasTexRenderer()) {
    throw new Error(`this example morphs the TeX outline of ${what}; plug in a TeX renderer first ` +
      '(useMathJax on the engine page, useMathJaxNode from tex-mathjax-node.mjs in Node)');
  }
  return svg;
}
const parulaStandIn = (t) => [...R.viridis(t), 255];
const colorize = (lst) => lst.map((elt, n) => R.withFillColorPixel(parulaStandIn(n / (lst.length - 1)), elt));
/** the same strokes and fill over a whole scene, applied in Reanimate's order */
const styled = (ani, ...fns) => fns.reduceRight((a, fn) => R.mapA(fn, a), ani);
const glyphStages = (k) => colorize([
  R.latex('X'), R.latex('$\\aleph$'), R.latex('Y'), R.latex('$\\infty$'), R.latex('I'),
  R.latex('$\\pi$'), R.latex('1'), R.latex('S'), R.mkRect(0.5, 0.5),
]).map((svg) => R.lowerTransformations(R.scale(k, R.pathify(R.center(svg)))));
const ringPairs = (stages) => stages.map((s, i) => [s, stages[(i + 1) % stages.length]]);

// --- doc_linear.hs, doc_rawLinear.hs, doc_rotationalTrajectory.hs: X into H

function docXH(conf) {
  texOutline(null, 'X and H');
  const src = R.scale(8, R.center(R.latex('X'))), dst = R.scale(8, R.center(R.latex('H')));
  const m = R.morph(conf, src, dst);
  return R.docEnv(R.playThenReverseA(R.pauseAround(0.5, 0.5, R.mkAnimation(3, (t) => R.withStrokeLineJoin('round', m(t))))));
}

// --- morphology_intro.hs: a circle, a square, two squares, a small circle

function morphologyIntro() {
  const radius = 2.5;
  const step = (from, to) => R.signalA(R.curveS(4), R.animate(R.morph(R.linear, from, to)));
  const stage1 = R.translate(-3, 0, R.withFillColor('red', R.mkCircle(radius)));
  const stage2 = R.translate(3, 0, R.withFillColor('blue', R.mkRect(radius * 2, radius * 2)));
  const stage3 = R.mkGroup([
    R.translate(-1, -1, R.withFillColor('green', R.mkRect(radius * 0.5, radius * 0.5))),
    R.translate(1, 1, R.withFillColor('black', R.mkRect(radius * 0.5, radius * 0.5)))]);
  const stage4 = R.translate(-3, 0, R.withFillColor('purple', R.mkCircle(radius * 0.24)));
  return R.addStatic(R.mkBackgroundPixel(BG), styled(R.scene((s) => {
    s.play(step(stage1, stage2));
    s.play(step(stage2, stage3));
    s.play(step(stage3, stage4));
    s.play(R.setDuration(5, step(stage4, stage1)));
  }), (x) => R.withStrokeWidth(0, x), (x) => R.withStrokeColor('black', x), (x) => R.withFillOpacity(1, x)));
}

// --- morphology_color.hs: yellow into blue through LAB, XYZ and HSV

function morphologyColor() {
  const radius = 2.5;
  const yellow = R.withFillColor('yellow', R.mkCircle(radius)), blue = R.withFillColor('blue', R.mkCircle(radius));
  const confs = [R.linear, {...R.linear, colorComponents: R.xyzComponents}, {...R.linear, colorComponents: R.hsvComponents}];
  const labels = ['LAB', 'XYZ', 'HSV'];
  const doMorph = (s, from, to) => {
    const ms = confs.map((conf) => R.morph(conf, from, to));
    s.play(R.pauseAtEnd(0.5, R.animate((t) => R.mkGroup(ms.map((m, n) =>
      R.translate(-W / 2 + W / 6 * (n * 2 + 1), 0, R.mkGroup([
        R.translate(0, 3, R.scale(1.5, R.center(R.latex(labels[n])))),
        R.translate(0, -0.5, m(t)),
      ])))))));
  };
  return R.addStatic(R.mkBackgroundPixel(BG), R.setDuration(5, styled(R.scene((s) => {
    doMorph(s, yellow, blue);
    doMorph(s, blue, yellow);
  }), (x) => R.withStrokeWidth(0, x), (x) => R.withFillOpacity(1, x))));
}

// --- morphology_linear.hs: nine glyphs into each other, the target shown on the right

function morphologyLinear() {
  texOutline(null, 'the glyphs');
  const stages = glyphStages(8);
  const showPair = (s, list) => {
    if (list.length < 2) return;
    const [from, to, ...rest] = list;
    s.waitOn((w) => {
      const toS = w.newSpriteSVG(R.translate(4, 0, to));
      w.spriteE(toS, R.overBeginning(0.2, R.fadeInE));
      w.spriteE(toS, R.overEnding(0.2, R.fadeOutE));
      const m = w.fork((f) => f.newSpriteA(R.mapA((x) => R.translate(-4, 0, x), R.signalA(R.curveS(4), R.animate(R.morph(R.linear, from, to))))));
      w.wait(4);
      w.destroySprite(m);
      w.destroySprite(toS);
      showPair(w, [to, ...rest]);
    });
  };
  return R.addStatic(R.mkBackgroundPixel(BG), styled(R.scene((s) => showPair(s, [...stages, stages[0]])),
    (x) => R.withStrokeWidth(SW, x), (x) => R.withStrokeColor('black', x), (x) => R.withStrokeLineJoin('round', x), (x) => R.withFillOpacity(1, x)));
}

// --- morphology_closest.hs and morphology_rotational.hs: two strategies side by side

function sideBySide(labels, k, dx, left, right) {
  texOutline(null, 'the glyphs');
  const stages = glyphStages(k);
  return R.addStatic(R.mkBackgroundPixel(BG), styled(R.scene((s) => {
    s.newSpriteSVG(R.withStrokeWidth(0, R.translate(-dx, 4, R.center(R.latex(labels[0])))));
    s.newSpriteSVG(R.withStrokeWidth(0, R.translate(dx, 4, R.center(R.latex(labels[1])))));
    for (const [from, to] of ringPairs(stages)) {
      s.waitOn((w) => {
        w.fork((f) => f.play(R.signalA(R.curveS(4), R.mapA((x) => R.translate(-dx, -0.5, x), R.mkAnimation(4, R.morph(left, from, to))))));
        w.fork((f) => f.play(R.signalA(R.curveS(4), R.mapA((x) => R.translate(dx, -0.5, x), R.mkAnimation(4, R.morph(right, from, to))))));
      });
    }
  }), (x) => R.withStrokeWidth(SW, x), (x) => R.withStrokeColor('black', x), (x) => R.withStrokeLineJoin('round', x), (x) => R.withFillOpacity(1, x)));
}
const morphologyClosest = () => sideBySide(['no-op', 'closest'], 8, 4, R.rawLinear, R.linear);
const morphologyRotational = () => sideBySide(['linear', 'rotational'], 6, 3, R.linear, {...R.linear, trajectory: R.rotationalTrajectory([0.5, 0.5])});

// --- morphology_object_correspondence.hs: two circles and a square, cut, overlapped or obliterated

function morphologyObjectCorrespondence() {
  const step = (conf) => (from, to) => R.signalA(R.curveS(2), R.animate(R.morph(conf, from, to)));
  const cut = step(R.linear);
  const dup = step({...R.linear, objectCorrespondence: R.dupObjectCorrespondence});
  const genesis = step({...R.linear, objectCorrespondence: R.genesisObjectCorrespondence});
  const sides = R.mkGroup([
    R.translate(-4, 0, R.withFillColor('blue', R.mkCircle(2))),
    R.translate(4, 0, R.withFillColor('green', R.mkCircle(2)))]);
  const middle = R.withFillColor('red', R.mkRect(4, 4));
  return R.addStatic(R.mkBackgroundPixel(BG), styled(R.scene((s) => {
    const showLabel = (label) => s.fork((f) => f.play(R.applyE(R.overEnding(0.1, R.fadeOutE),
      R.applyE(R.overBeginning(0.1, R.fadeInE), R.mapA((x) => R.translate(0, 4, x), R.staticFrame(4, R.center(R.latex(label))))))));
    showLabel('Cut');
    s.play(R.pauseAtEnd(1, cut(sides, middle)));
    s.play(R.pauseAtEnd(1, cut(middle, sides)));
    showLabel('Overlap');
    s.play(R.pauseAtEnd(1, dup(sides, middle)));
    s.play(R.pauseAtEnd(1, dup(middle, sides)));
    showLabel('Obliterate');
    s.play(R.pauseAtEnd(1, genesis(sides, middle)));
    s.play(R.pauseAtEnd(1, genesis(middle, sides)));
  }), (x) => R.withStrokeWidth(0, x), (x) => R.withStrokeColor('black', x), (x) => R.withFillOpacity(1, x)));
}

// --- morphology_point_correspondence.hs: an octagon into a star, the star's first point moving on

const polygonShape = (p) => R.mkLinePathClosed(polygonPoints(p).map(Q.v2ToDouble));
const pSetOffset = (p, offset) => ({...p, offset: ((offset % pSize(p)) + pSize(p)) % pSize(p)});
const pScale = (s, p) => mkPolygon(polygonPoints(p).map(([x, y]) => [Q.mul(x, s), Q.mul(y, s)]));
const octogon = mkPolygon(Array.from({length: 8}, (_, n) => {
  const phi = n * 2 * Math.PI / 8 + Math.PI / 8;
  return [Q.fromDouble(Math.cos(phi)), Q.fromDouble(Math.sin(phi))];
}));
const star = pScale(Q.qFrac(1, 2), mkPolygon([[0, 1], [-2, 2], [-1, 0], [-2, -2], [0, -1], [2, -2], [1, 0], [2, 2]].map(([x, y]) => [Q.qInt(x), Q.qInt(y)])));
const genColor = (n, m) => parulaStandIn((n + 5) / (m + 5));
function polygonNumDots(p, t) {
  const circR = 0.1;
  const ppNum = (n) => R.scaleToHeight(circR * 1.5, R.center(R.latex(`\\texttt{${n}}`)));
  const out = [];
  for (let n = 0; n < pSize(p); n++) {
    const a = Q.v2ToDouble(pAccess(p, n)), b = Q.v2ToDouble(pAccess(p, pNext(p, n)));
    const x = t * b[0] + (1 - t) * a[0], y = t * b[1] + (1 - t) * a[1];
    out.push(R.mkGroup([
      R.withFillColorPixel(genColor(n, pSize(p) - 1), R.withStrokeWidth(SW * 0.5, R.withStrokeColor('black', R.translate(x, y, R.pathify(R.mkCircle(circR)))))),
      R.withFillColor('black', R.translate(x, y, ppNum(n))),
    ]));
  }
  return R.mkGroup(out.reverse());
}
function morphologyPointCorrespondence() {
  texOutline(null, 'the point numbers');
  const step = (from, to) => R.signalA(R.curveS(2), R.animate(R.morph(R.rawLinear, from, to)));
  const pl1 = R.translate(-4, 0, R.mkGroup([
    R.lowerTransformations(R.scale(3, R.withFillOpacity(1, R.withStrokeColor('black', R.withStrokeWidth(SW, R.withFillColor('lightgreen', polygonShape(octogon))))))),
    R.lowerTransformations(R.scale(3, polygonNumDots(octogon, 0))),
  ]));
  const pl2Cache = new Map();
  const pl2 = (n, t) => {
    const make = () => R.translate(4, 0, R.lowerTransformations(R.scale(3, R.mkGroup([
      R.withFillOpacity(1, R.withStrokeColor('black', R.withStrokeWidth(SW, R.withFillColor('cyan', polygonShape(pSetOffset(star, n)))))),
      polygonNumDots(pSetOffset(star, n), t),
    ]))));
    if (t !== 0) return make();
    if (!pl2Cache.has(n)) pl2Cache.set(n, make());
    return pl2Cache.get(n);
  };
  return R.addStatic(R.mkBackgroundPixel(BG), styled(R.scene((s) => {
    const offset = s.newVar(0), slide = s.newVar(0);
    s.newSprite((f) => pl2(f.get(offset), f.get(slide)));
    s.newSpriteSVG(pl1);
    for (let k = 0; k < 8; k++) {
      const offsetVal = s.readVar(offset);
      s.play(R.setDuration(3, step(pl1, pl2(offsetVal, 0))));
      s.tweenVar(slide, 1, (v, t) => R.fromToS(v, 1)(R.curveS(4)(t)));
      s.writeVar(slide, 0);
      s.modifyVar(offset, (x) => x + 1);
    }
  }), (x) => R.withStrokeWidth(0, x), (x) => R.withStrokeColor('black', x), (x) => R.withFillOpacity(1, x)));
}

// --- morphology_rotational_intro.hs: a spike flipped, with the rotation origin moving about

const spike = (third) => pScale(Q.qFrac(5, 2), mkPolygon([[0, 0], [2, 0], third].map(([x, y]) => [Q.qInt(x - 1), Q.qInt(y - 1)])));
const spike1 = spike([2, 1]), spike2 = spike([0, 1]);
function genTrails(plotters) {
  const steps = 100;
  const rows = plotters.flatMap((plotter) => Array.from({length: steps + 1}, (_, n) => polygonPoints(plotter(n / steps)).map(Q.v2ToDouble)));
  const trails = rows[0].map((_, i) => rows.map((row) => row[i]));   // transpose
  return R.withFillOpacity(0, R.withStrokeWidth(SW * 0.5, R.withStrokeColor('black', R.withStrokeDashArray([0.1, 0.05],
    R.mkGroup(trails.map((lst) => R.mkLinePath(lst)))))));
}
function morphologyRotationalIntro() {
  texOutline(null, 'the labels');
  return R.addStatic(R.mkBackgroundPixel(BG), styled(R.scene((s) => {
    s.newSpriteSVG(R.withStrokeWidth(0, R.translate(-4, 4, R.center(R.latex('linear')))));
    s.newSpriteSVG(R.withStrokeWidth(0, R.translate(4, 4, R.center(R.latex('rotational')))));
    const originVar = s.newVar([0.5, 0.5]);
    s.newSpriteSVG(R.translate(-4, -0.5, genTrails([R.linearTrajectory([spike1, spike2])])));
    s.newSprite((f) => R.translate(4, -0.5, genTrails([R.rotationalTrajectory(f.get(originVar))([spike1, spike2])])));
    const linearMorphs = new Map();
    const showPair = (from, to) => s.waitOn((w) => {
      const key = from === spike1 ? 'lr' : 'rl';
      if (!linearMorphs.has(key)) linearMorphs.set(key, R.morph(R.linear, polygonShape(from), polygonShape(to)));
      w.fork((f) => f.play(R.signalA(R.curveS(4), R.mapA((x) => R.withFillColor('lightgreen', x), R.mapA((x) => R.translate(-4, -0.5, x), R.mkAnimation(2, linearMorphs.get(key)))))));
      const sp = w.fork((f) => f.newSprite((fr) => {
        const origin = fr.get(originVar);
        const localTime = R.curveS(4)(fr.t / fr.d);
        const myMorph = {...R.linear, trajectory: R.rotationalTrajectory(origin)};
        const os = R.polygonOrigin(from, origin), od = R.polygonOrigin(to, origin);
        const ox = localTime * od[0] + (1 - localTime) * os[0], oy = localTime * od[1] + (1 - localTime) * os[1];
        return R.translate(4, -0.5, R.mkGroup([
          R.withFillColor('cyan', R.morph(myMorph, polygonShape(from), polygonShape(to))(localTime)),
          R.withFillColor('red', R.translate(ox, oy, R.mkCircle(0.1))),
        ]));
      }));
      w.wait(2);
      w.destroySprite(sp);
    });
    const push = (newOrigin, from, to) => {
      s.fork((f) => f.tweenVar(originVar, 0.5, ([x, y], t) => {
        const t2 = R.curveS(2)(t);
        return [R.fromToS(x, newOrigin[0])(t2), R.fromToS(y, newOrigin[1])(t2)];
      }));
      showPair(from, to);
    };
    push([1, 0.5], spike1, spike2);
    push([0.1, 0.95], spike2, spike1);
    push([0.5, 1], spike1, spike2);
    push([0.5, 2], spike2, spike1);
    push([-0.3, -0.2], spike1, spike2);
    push([0.5, 0.5], spike2, spike1);
  }), (x) => R.withStrokeWidth(SW, x), (x) => R.withStrokeColor('black', x), (x) => R.withStrokeLineJoin('round', x), (x) => R.withFillOpacity(1, x)));
}

export const MORPH_EXAMPLES = {
  linear: needsTex(() => docXH(R.linear)),
  rawLinear: needsTex(() => docXH(R.rawLinear)),
  rotationalTrajectory: needsTex(() => docXH({...R.linear, trajectory: R.rotationalTrajectory([0.5, 0.5])})),
  morphology_intro: morphologyIntro,
  morphology_color: morphologyColor,
  morphology_linear: needsTex(morphologyLinear),
  morphology_closest: needsTex(morphologyClosest),
  morphology_rotational: needsTex(morphologyRotational),
  morphology_object_correspondence: morphologyObjectCorrespondence,
  morphology_point_correspondence: needsTex(morphologyPointCorrespondence),
  morphology_rotational_intro: needsTex(morphologyRotationalIntro),
};
