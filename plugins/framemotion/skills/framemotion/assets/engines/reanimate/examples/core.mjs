// Reanimate's documentation examples for the engine core (time, signals, paths, effects,
// transitions, scenes, variables and sprites), ported line for line from the doc_*.hs files of
// reanimate/reanimate (public domain, commit 583ee9f). Each entry returns an Animation.

import * as R from '../core/index.mjs';

const {docEnv, drawBox, drawCircle, drawProgress, scene} = R;
const doc = (make) => () => docEnv(make());

export const CORE_EXAMPLES = {
  // Animation combinators
  addStatic: doc(() => R.addStatic(R.mkBackground('lightblue'), drawCircle)),
  andThen: doc(() => R.andThen(drawBox, drawCircle)),
  drawBox: doc(() => drawBox),
  drawCircle: doc(() => drawCircle),
  drawProgress: doc(() => drawProgress),
  mapA: doc(() => R.mapA((s) => R.scale(0.5, s), drawCircle)),
  parA: doc(() => R.parA(drawBox, R.adjustDuration((d) => d * 2, drawCircle))),
  parDropA: doc(() => R.parDropA(drawBox, R.adjustDuration((d) => d * 2, drawCircle))),
  parLoopA: doc(() => R.parLoopA(drawBox, R.adjustDuration((d) => d * 2, drawCircle))),
  pause: doc(() => R.seqA(R.pause(1), drawProgress)),
  pauseAround: doc(() => R.pauseAround(1, 1, drawProgress)),
  pauseAtBeginning: doc(() => R.pauseAtBeginning(1, drawProgress)),
  pauseAtEnd: doc(() => R.pauseAtEnd(1, drawProgress)),
  playThenReverseA: doc(() => R.playThenReverseA(drawCircle)),
  repeatA: doc(() => R.repeatA(1.5, drawCircle)),
  reverseA: doc(() => R.reverseA(drawCircle)),
  seqA: doc(() => R.seqA(drawBox, drawCircle)),

  // Signals
  bellS: doc(() => R.signalA(R.bellS(2), drawProgress)),
  constantS: doc(() => R.signalA(R.constantS(0.5), drawProgress)),
  cubicBezierS: doc(() => R.signalA(R.cubicBezierS([0.0, 0.8, 0.9, 1.0]), drawProgress)),
  curveS: doc(() => R.signalA(R.curveS(2), drawProgress)),
  fromToS: doc(() => R.signalA(R.fromToS(0.8, 0.2), drawProgress)),
  oscillateS: doc(() => R.signalA(R.oscillateS, drawProgress)),
  powerS: doc(() => R.signalA(R.powerS(2), drawProgress)),
  reverseS: doc(() => R.signalA(R.reverseS, drawProgress)),
  signalA: doc(() => R.signalA(R.fromToS(0.25, 0.75), drawCircle)),

  // Transitions
  chainT: doc(() => R.chainT(R.overlapT(0.5, R.fadeT), [drawBox, drawCircle, drawProgress])),
  fadeT: doc(() => R.fadeT(drawBox, drawCircle)),
  overlapT: doc(() => R.overlapT(0.5, R.fadeT)(drawBox, drawCircle)),
  slideDownT: doc(() => slide(R.slideDownT)),
  slideLeftT: doc(() => slide(R.slideLeftT)),
  slideUpT: doc(() => slide(R.slideUpT)),

  // Paths and shapes
  pathify: doc(() => R.animate((t) => R.gridLayout([
    [R.partialSvg(t, R.pathify(R.mkCircle(1))), R.partialSvg(t, R.pathify(R.mkRect(2, 2)))],
    [R.partialSvg(t, R.pathify(R.mkEllipse(1, 0.5))), R.partialSvg(t, R.pathify(R.mkLine([-1, -1], [1, 1])))],
  ]))),
  mkBackground: () => R.animate(() => R.mkBackground('yellow')),
  withViewBox: () => R.animate(() => R.withViewBox([0, 0, 1, 1], R.mkBackground('yellow'))),
  mkText: doc(() => R.mkAnimation(2, (t) => R.scale(2, R.withStrokeWidth(0.05, R.mkText('text'.slice(0, haskellRound(t * 15))))))),

  // Scenes, variables and sprites
  applyVar: doc(() => scene((s) => {
    const sp = s.fork((f) => f.newSpriteA(drawBox));
    const v = s.newVar(0);
    s.applyVar(v, sp, R.rotate);
    s.tweenVar(v, 2, (val, t) => R.fromToS(val, 90)(t));
  })),
  destroySprite: doc(() => scene((s) => {
    const sp = s.newSpriteSVG(R.withFillOpacity(1, R.mkCircle(1)));
    s.fork((f) => { f.wait(1); f.destroySprite(sp); });
    s.play(drawBox);
  })),
  fork: doc(() => scene((s) => { s.fork((f) => f.play(drawBox)); s.play(drawCircle); })),
  newSprite: doc(() => scene((s) => { s.newSprite((f) => R.mkCircle(f.t)); s.wait(2); })),
  newSpriteA: doc(() => scene((s) => { s.fork((f) => f.newSpriteA(drawCircle)); s.play(drawBox); s.play(R.reverseA(drawBox)); })),
  "newSpriteA'": doc(() => scene((s) => { s.fork((f) => f.newSpriteA_(R.Sync.Freeze, drawCircle)); s.play(drawBox); s.play(R.reverseA(drawBox)); })),
  newSpriteSVG: doc(() => scene((s) => { s.newSpriteSVG(R.mkBackground('lightblue')); s.play(drawCircle); })),
  play: doc(() => scene((s) => { s.play(drawBox); s.play(drawCircle); })),
  queryNow: doc(() => scene((s) => {
    s.play(drawCircle);
    const now = s.queryNow();
    s.play(R.staticFrame(1, R.scale(2, R.withStrokeWidth(0.05, R.mkText(`Now=${haskellShowDouble(now)}`)))));
  })),
  signalS: doc(() => R.playThenReverseA(scene((s) => {
    const sp = s.fork((f) => f.newSpriteA(drawCircle));
    s.signalS(sp, 1, R.curveS(2));
    s.wait(1);
    s.signalS(sp, 1, R.powerS(2));
  }))),
  simpleVar: doc(() => scene((s) => {
    const v = s.simpleVar(R.mkCircle, 0);
    s.tweenVar(v, 2, (val, t) => R.fromToS(val, R.SCREEN_HEIGHT / 2)(t));
  })),
  spriteE: doc(() => scene((s) => {
    const sp = s.fork((f) => f.newSpriteA(drawCircle));
    s.spriteE(sp, R.overBeginning(1, R.fadeInE));
    s.spriteE(sp, R.overEnding(0.5, R.fadeOutE));
  })),
  spriteMap: doc(() => scene((s) => {
    const sp = s.fork((f) => f.newSpriteA(drawCircle));
    s.wait(1);
    s.spriteMap(sp, R.flipYAxis);
  })),
  spriteScope: doc(() => scene((s) => {
    s.newSpriteSVG_(R.translate(-3, 0, R.mkRect(4, 4)));
    s.wait(1);
    s.spriteScope((sc) => {
      const local = sc.newSpriteSVG(R.translate(3, 0, R.mkCircle(2)));
      sc.spriteE(local, R.overBeginning(0.3, R.fadeInE));
      sc.spriteE(local, R.overEnding(0.3, R.fadeOutE));
      sc.wait(1);
    });
    s.wait(1);
  })),
  spriteTween: doc(() => scene((s) => {
    const sp = s.fork((f) => f.newSpriteA(drawCircle));
    s.spriteTween(sp, 1, (val, svg) => R.translate(R.SCREEN_WIDTH * 0.3 * val, 0, svg));
  })),
  spriteVar: doc(() => scene((s) => {
    const sp = s.fork((f) => f.newSpriteA(drawBox));
    const v = s.spriteVar(sp, 0, R.rotate);
    s.tweenVar(v, 2, (val, t) => R.fromToS(val, 90)(t));
  })),
  spriteZ: doc(() => scene((s) => {
    const s1 = s.newSpriteSVG(R.withFillOpacity(1, R.withFillColor('blue', R.mkCircle(3))));
    s.newSpriteSVG(R.withFillOpacity(1, R.withFillColor('red', R.mkRect(8, 3))));
    s.wait(1);
    s.spriteZ(s1, 1);
    s.wait(1);
  })),
  unVar: doc(() => scene((s) => {
    const v = s.newVar(0);
    s.newSprite((f) => R.mkCircle(f.get(v)));
    s.tweenVar(v, 1, (val, t) => R.fromToS(val, 3)(t));
    s.tweenVar(v, 1, (val, t) => R.fromToS(val, 0)(t));
  })),
  wait: doc(() => scene((s) => { s.fork((f) => f.play(drawBox)); s.wait(1); s.play(drawCircle); })),
  waitOn: doc(() => scene((s) => { s.waitOn((w) => w.fork((f) => f.play(drawBox))); s.play(drawCircle); })),
  writeVar: doc(() => scene((s) => {
    const v = s.newVar(0);
    s.newSprite((f) => R.mkCircle(f.get(v)));
    s.writeVar(v, 1); s.wait(1);
    s.writeVar(v, 2); s.wait(1);
    s.writeVar(v, 3); s.wait(1);
  })),
};

function slide(transition) {
  const left = drawCircle;
  const right = R.parA(R.staticFrame(1, R.mkBackground('black')), R.mapA((svg) => R.flipXAxis(R.withStrokeColor('white', svg)), drawCircle));
  return R.pauseAtEnd(1, R.signalT(R.curveS(2), transition)(left, right));
}

/** Haskell's `round` (halves to the even neighbour), now part of the core. */
export const haskellRound = R.haskellRound;

/** Haskell's `show` for a Double in the range scenes use (2.0, 0.5, 1.0e-2). */
export function haskellShowDouble(x) {
  if (Number.isInteger(x) && Math.abs(x) < 1e7) return `${x}.0`;
  const a = Math.abs(x);
  if (a >= 0.1 && a < 1e7) return String(x);
  const [m, e] = x.toExponential().split('e');
  return `${m.includes('.') ? m : `${m}.0`}e${Number(e)}`;
}
