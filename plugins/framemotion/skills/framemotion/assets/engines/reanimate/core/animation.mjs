// Time in the Reanimate engine: signals (easing), animations, effects and transitions.
// FrameCore Works' JavaScript port of Reanimate.Ease, Reanimate.Animation, Reanimate.Effect,
// Reanimate.Transition and Reanimate.Builtin.Slide from reanimate/reanimate (public domain).
// An animation is a duration in seconds and a function of normalized time t in [0, 1] that
// returns an SVG tree, so every frame is a pure function of time. No DOM, clock or network.

import {mkGroup, None, withGroupOpacity, withStrokeWidth, withFillOpacity, translate, scale, SCREEN_WIDTH, SCREEN_HEIGHT} from './svg.mjs';
import {partialSvg, pathify} from './paths.mjs';
import {aroundCenter} from './layout.mjs';

const fmod = (a, b) => { const r = a % b; return r < 0 ? r + b : r; };   // Haskell's mod' for positive b

// ---------------------------------------------------------------------------------------------
// Signals: functions from [0, 1] to [0, 1] (Reanimate.Ease)

export const constantS = (v) => () => v;
export const fromToS = (from, to) => (t) => from + (to - from) * t;
export const reverseS = (t) => 1 - t;
export const curveS = (steepness) => (s) => (s < 0.5 ? 0.5 * (2 * s) ** steepness : 1 - 0.5 * (2 - 2 * s) ** steepness);
export const powerS = (steepness) => (s) => s ** steepness;
export const oscillateS = (t) => (t < 1 / 2 ? t * 2 : 2 - t * 2);
export const bellS = (steepness) => (t) => curveS(steepness)(oscillateS(t));
export const cubicBezierS = ([x1, x2, x3, x4]) => (s) => { const ms = 1 - s; return x1 * ms ** 3 + 3 * x2 * ms ** 2 * s + 3 * x3 * ms * s ** 2 + x4 * s ** 3; };

// ---------------------------------------------------------------------------------------------
// Animations

export class Animation {
  constructor(duration, gen) {
    this.duration = duration;
    this.gen = gen;   // normalized time [0, 1] -> SVG tree
    Object.freeze(this);
  }
}

export function mkAnimation(d, f) {
  if (!(d > 0)) throw new Error(`Animation duration (${d}) is not positive.`);
  return new Animation(d, f);
}
export const unsafeMkAnimation = (d, f) => new Animation(d, f);
export const animate = (f) => new Animation(1, f);
export const staticFrame = (d, svg) => mkAnimation(d, () => svg);
export const duration = (a) => a.duration;
export const pause = (d) => mkAnimation(d, () => None);

const clamp = (a, b, n) => (a < b ? Math.max(a, Math.min(b, n)) : Math.max(b, Math.min(a, n)));

/** frameAt: the frame at `t` seconds (clamped to the animation). */
export const frameAt = (t, a) => a.gen(clamp(0, 1, t / a.duration));

export function seqA(a, b) {
  const total = a.duration + b.duration;
  return new Animation(total, (t) => (t < a.duration / total ? a.gen((t * total) / a.duration) : b.gen(((t - a.duration / total) * total) / b.duration)));
}
export function parA(a, b) {
  const total = Math.max(a.duration, b.duration);
  return new Animation(total, (t) => mkGroup([a.gen(Math.min(1, (t * total) / a.duration)), b.gen(Math.min(1, (t * total) / b.duration))]));
}
export function parLoopA(a, b) {
  const total = Math.max(a.duration, b.duration);
  return new Animation(total, (t) => mkGroup([a.gen(fmod((t * total) / a.duration, 1)), b.gen(fmod((t * total) / b.duration, 1))]));
}
export function parDropA(a, b) {
  const total = Math.max(a.duration, b.duration);
  return new Animation(total, (t) => {
    const t1 = (t * total) / a.duration, t2 = (t * total) / b.duration;
    return mkGroup([t1 > 1 ? None : a.gen(t1), t2 > 1 ? None : b.gen(t2)]);
  });
}
export const andThen = (a, b) => parA(a, seqA(pause(a.duration), b));
export const mapA = (fn, a) => new Animation(a.duration, (t) => fn(a.gen(t)));

const freezeFrame = (t, a) => () => a.gen(t / a.duration);
export const pauseAtEnd = (t, a) => (t === 0 ? a : andThen(a, pause(t)));
export const pauseAtBeginning = (t, a) => (t === 0 ? a : seqA(mkAnimation(t, freezeFrame(0, a)), a));
export const pauseAround = (start, end, a) => pauseAtEnd(end, pauseAtBeginning(start, a));
export const adjustDuration = (fn, a) => mkAnimation(fn(a.duration), a.gen);
export const setDuration = (d, a) => adjustDuration(() => d, a);
export const signalA = (fn, a) => new Animation(a.duration, (t) => a.gen(fn(t)));
export const reverseA = (a) => signalA(reverseS, a);
export const playThenReverseA = (a) => seqA(a, reverseA(a));
export const repeatA = (n, a) => mkAnimation(a.duration * n, (t) => a.gen(fmod(t * n, 1)));
export const freezeAtPercentage = (frac, a) => new Animation(a.duration, () => a.gen(frac));
export const addStatic = (staticSvg, a) => mapA((frame) => mkGroup([staticSvg, frame]), a);
export const takeA = (len, a) => (len >= a.duration ? a : mkAnimation(len, (t) => a.gen((t * len) / a.duration)));
export function dropA(len, a) {
  if (len <= 0) return a;
  const rest = a.duration - len;
  return mkAnimation(rest, (t) => a.gen((t * rest) / a.duration + len / a.duration));
}
export const lastA = (len, a) => dropA(a.duration - len, a);

/** How a sprite plays an animation that is shorter or longer than the sprite (Sync). */
export const Sync = Object.freeze({Stretch: 'stretch', Loop: 'loop', Drop: 'drop', Freeze: 'freeze'});

/** getAnimationFrame: the frame of `a` at `t` seconds when it fills a span of `d` seconds. */
export function getAnimationFrame(sync, a, t, d) {
  switch (sync) {
    case Sync.Stretch: return a.gen(t / d);
    case Sync.Loop: { const f = t / a.duration; return a.gen(f - Math.trunc(f)); }
    case Sync.Drop: return t > a.duration ? None : a.gen(t / a.duration);
    case Sync.Freeze: return a.gen(Math.min(1, t / a.duration));
    default: throw new Error(`unknown sync ${sync}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Effects: (duration, elapsed seconds, tree) -> tree

export const overBeginning = (maxT, effect) => (_d, t) => (t < maxT ? effect(maxT, t) : (svg) => svg);
export const overEnding = (minT, effect) => (d, t) => (t >= d - minT ? effect(minT, t - (d - minT)) : (svg) => svg);
export const overInterval = (start, end, effect) => (_d, t) => {
  const dur = end - start;
  return start <= t && t <= end ? effect(dur, (t - start) / dur) : (svg) => svg;
};
export const reverseE = (fn) => (d, t) => fn(d, d - t);
export const delayE = (delayT, fn) => (d, t) => overEnding(d - delayT, fn)(d, t);
export const applyE = (fn, ani) => {
  const d = ani.duration;
  return mkAnimation(d, (t) => fn(d, d * t)(frameAt(d * t, ani)));
};
export const constE = (fn) => () => fn;
export const fadeInE = (d, t) => (svg) => withGroupOpacity(t / d, svg);
export const fadeOutE = reverseE(fadeInE);
export const fadeLineInE = (w) => (d, t) => (svg) => withStrokeWidth(w * (t / d), svg);
export const fadeLineOutE = (w) => reverseE(fadeLineInE(w));
export const drawInE = (d, t) => (svg) => withFillOpacity(0, partialSvg(t / d, pathify(svg)));
export const drawOutE = reverseE(drawInE);
export const fillInE = (d, t) => (svg) => withFillOpacity(t / d, svg);
export const scaleE = (target) => (d, t) => (svg) => scale(1 + ((target - 1) * t) / d, svg);
export const translateE = (x, y) => (d, t) => (svg) => translate((x * t) / d, (y * t) / d, svg);
export const aroundCenterE = (e) => (d, t) => (svg) => aroundCenter(e(d, t), svg);

// ---------------------------------------------------------------------------------------------
// Transitions: (animation, animation) -> animation

export const mapT = (fn, tr) => (a, b) => fn(tr(a, b));
export const signalT = (signal, tr) => mapT((ani) => signalA(signal, ani), tr);
export const overlapT = (overlap, tr) => (a, b) =>
  seqA(seqA(takeA(a.duration - overlap, a), tr(lastA(overlap, a), takeA(overlap, b))), dropA(overlap, b));
export const effectT = (eA, eB) => (a, b) => parA(applyE(eA, a), applyE(eB, b));
export const chainT = (tr, list) => (list.length === 0 ? pause(0) : list.slice(1).reduce((acc, x) => tr(acc, x), list[0]));
export const fadeT = effectT(fadeOutE, fadeInE);

const andE = (a, b) => (d, t) => (svg) => a(d, t)(b(d, t)(svg));
export const slideLeftT = effectT(translateE(-SCREEN_WIDTH, 0), andE(translateE(-SCREEN_WIDTH, 0), constE((s) => translate(SCREEN_WIDTH, 0, s))));
export const slideDownT = effectT(translateE(0, -SCREEN_HEIGHT), andE(translateE(0, -SCREEN_HEIGHT), constE((s) => translate(0, SCREEN_HEIGHT, s))));
export const slideUpT = effectT(translateE(0, SCREEN_HEIGHT), andE(translateE(0, SCREEN_HEIGHT), constE((s) => translate(0, -SCREEN_HEIGHT, s))));
