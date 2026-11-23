// Scenes of the Reanimate engine: a script that places sprites and variables on a timeline.
// FrameCore Works' JavaScript port of Reanimate.Scene.Core, Reanimate.Scene.Var and
// Reanimate.Scene.Sprite from reanimate/reanimate (public domain). The Haskell Scene monad
// becomes a builder object passed to the script: `s.wait(d)`, `s.fork(fn)`, `s.newSprite(fn)`, ...
// The script runs once, when the scene is made; frames are then pure functions of time.

import {mkAnimation, dropA, getAnimationFrame, Sync, overlapT, delayE} from './animation.mjs';
import {mkGroup, None} from './svg.mjs';

// ---------------------------------------------------------------------------------------------
// Variables (Reanimate.Scene.Var): a default value and a timeline of static values and tweens.
// The timeline is an array of [time, modifier] sorted by time, standing in for Data.Map.

const staticValue = (v) => ({kind: 'static', v});
const tweenValue = (dur, f) => ({kind: 'tween', dur, f});

/** Data.Map.lookupLE: the last entry at or before `t`. */
function lookupLE(tl, t) {
  let hit = null;
  for (const e of tl) {
    if (e[0] > t) break;
    hit = e;
  }
  return hit;
}
/** Data.Map.insert: replace or add the entry at `t`. */
function insertAt(tl, t, m) {
  const out = tl.filter((e) => e[0] !== t);
  out.push([t, m]);
  return out.sort((a, b) => a[0] - b[0]);
}
/** Data.Map.union: left-biased. */
function union(a, b) {
  const keys = new Set(a.map((e) => e[0]));
  return [...a, ...b.filter((e) => !keys.has(e[0]))].sort((x, y) => x[0] - y[0]);
}

function readVarData(v, now) {
  if (v.lastTime === null) return v.def;
  if (now < v.lastTime) return lookupTimeline(v.timeline, v.def, now);
  return v.lastValue;
}
function lookupTimeline(tl, def, now) {
  const hit = lookupLE(tl, now);
  if (hit && hit[1].kind === 'static') return hit[1].v;
  if (hit && hit[1].kind === 'tween' && hit[0] + hit[1].dur > now) return hit[1].f(def, now);
  return def;
}
const maxMaybe = (a, b) => (a === null ? b : b === null ? a : Math.max(a, b));
function keepFrom(st, v) {
  let tl = v.timeline.filter((e) => e[0] >= st);
  const hit = lookupLE(v.timeline, st);
  if (hit && hit[0] < st) {
    const [at, m] = hit;
    if (m.kind === 'static') tl = insertAt(tl, st, m);
    else if (at + m.dur > st) tl = insertAt(tl, st, tweenValue(at + m.dur - st, m.f));
  }
  return {def: v.def, timeline: tl, lastTime: maxMaybe(v.lastTime, st), lastValue: v.lastValue};
}
function keepBefore(nd, v) {
  let tl = v.timeline.filter((e) => e[0] < nd);
  const last = tl.length ? tl[tl.length - 1] : null;
  const lastTween = last && last[1].kind === 'tween' ? last : null;
  if (lastTween && lastTween[0] + lastTween[1].dur > nd) tl = insertAt(tl, lastTween[0], tweenValue(nd - lastTween[0], lastTween[1].f));
  let lastTime;
  if (lastTween) lastTime = Math.min(nd, lastTween[0] + lastTween[1].dur);
  else lastTime = v.lastTime === null ? null : Math.min(nd, v.lastTime);
  return {def: v.def, timeline: tl, lastTime, lastValue: lastTime === null ? v.def : readVarData(v, lastTime)};
}
const keepInRange = (st, nd, v) => keepFrom(st, keepBefore(nd, v));
function elseVar(v1, v2) {
  if (v1.lastTime === null) return v2;
  const joinAt = v1.timeline.length ? v1.timeline[0][0] : v1.lastTime;
  const x = keepBefore(joinAt, v2);
  const before = x.lastTime !== null && x.lastTime < joinAt
    ? insertAt(x.timeline, x.lastTime, staticValue(x.lastValue))
    : x.timeline;
  return {...v1, timeline: union(v1.timeline, before)};
}
function writeVarData(now, x, v) {
  return elseVar({def: v.def, timeline: [], lastTime: now, lastValue: x}, keepBefore(now, v));
}
function modifyVarData(now, fn, v) {
  const before = keepBefore(now, v);
  const after = keepFrom(now, v);
  const mapped = (m) => (m.kind === 'static' ? staticValue(fn(m.v)) : tweenValue(m.dur, (a, tt) => fn(m.f(a, tt))));
  const tl = after.timeline.map(([t, m]) => [t, mapped(m)]);
  return elseVar({...after, timeline: tl, lastValue: fn(after.lastValue)}, before);
}
function tweenVarData(st, dur, fn, v) {
  const nd = st + dur;
  const before = keepBefore(st, v);
  const during = keepInRange(st, nd, v);
  const tweenFn = (a, t) => {
    const idx = (t - st) / dur;
    return fn(readVarData({...during, def: a}, t), Number.isNaN(idx) ? 1 : idx);
  };
  const after = {def: v.def, timeline: [[st, tweenValue(dur, tweenFn)]], lastTime: nd, lastValue: tweenFn(v.def, nd)};
  return elseVar(after, before);
}

export class Var {
  constructor(def) { this.data = {def, timeline: [], lastTime: null, lastValue: def}; }
  /** The value at absolute scene time `t` (unpackVar). */
  at(t) { return readVarData(this.data, t); }
}

// ---------------------------------------------------------------------------------------------
// The scene builder (Scene.Core). Times are absolute seconds from the scene start; `maxEnd` is the
// latest end of anything forked, so the scene lasts max(cursor, maxEnd) like Haskell's max s p.

export class SceneBuilder {
  constructor(start) { this.cursor = start; this.maxEnd = start; this.gens = []; }

  // --- time
  queryNow() { return this.cursor; }
  /** wait: move the clock (back, too). The scene lasts at least to the latest time the clock reached, as
   *  Haskell's bind keeps max p1 (s1 + p2) for every step. */
  wait(d) { this.maxEnd = Math.max(this.maxEnd, this.cursor); this.cursor += d; }
  waitUntil(t) { this.wait(Math.max(0, t - this.cursor)); }
  /** Run `fn` on a branch: its time does not move this scene's clock, but the scene lasts at least as long. */
  fork(fn) { const child = new SceneBuilder(this.cursor); const v = fn(child); this.#absorb(child, false); return v; }
  /** Run `fn` and wait until everything it started (forks included) has ended. */
  waitOn(fn) { const child = new SceneBuilder(this.cursor); const v = fn(child); this.gens.push(...child.gens); this.cursor = Math.max(child.cursor, child.maxEnd); return v; }
  /** Run `fn` in sequence (the plain monadic bind); a helper for scripts that build sub-scenes. */
  run(fn) { const child = new SceneBuilder(this.cursor); const v = fn(child); this.#absorb(child, true); return v; }
  withSceneDuration(fn) { const t1 = this.cursor; this.run(fn); return this.cursor - t1; }
  #absorb(child, advance) {
    this.gens.push(...child.gens);
    this.maxEnd = Math.max(this.maxEnd, child.cursor, child.maxEnd);
    if (advance) this.cursor = child.cursor;
  }
  /** adjustZ: change the z index of every sprite `fn` makes. */
  adjustZ(zfn, fn) {
    const child = new SceneBuilder(this.cursor);
    const v = fn(child);
    child.gens = child.gens.map((gen) => () => { const frameGen = gen(); return (d, t) => { const [svg, z] = frameGen(d, t); return [svg, zfn(z)]; }; });
    this.#absorb(child, true);
    return v;
  }
  /** spriteScope: sprites made inside `fn` disappear when `fn` (and its forks) end. */
  spriteScope(fn) {
    const start = this.cursor;
    const child = new SceneBuilder(start);
    const v = fn(child);
    const maxT = Math.max(child.cursor, child.maxEnd);
    child.gens = child.gens.map((gen) => () => { const frameGen = gen(); return (_d, t) => (t < maxT ? frameGen(maxT, t) : [None, 0]); });
    this.#absorb(child, true);
    return v;
  }
  addGen(gen) { this.gens.push(gen); }

  // --- variables
  newVar(def) { return new Var(def); }
  readVar(v) { return v.at(this.cursor); }
  writeVar(v, val) { v.data = writeVarData(this.cursor, val, v.data); }
  modifyVar(v, fn) { v.data = modifyVarData(this.cursor, fn, v.data); }
  /** tweenVar: change `v` over `dur` seconds by fn(value, progress 0..1), then wait `dur`. */
  tweenVar(v, dur, fn) {
    if (dur < 0) throw new Error('Reanimate.tweenVar: durations must be non-negative');
    v.data = tweenVarData(this.cursor, dur, fn, v.data);
    this.wait(dur);
  }

  // --- sprites (Scene.Sprite)
  /**
   * newSprite: a sprite drawn by `render(f)` from now until it is destroyed or the scene ends, where
   * f = {t, d, absT, absD, get(v)}: seconds since the sprite started, its length, the scene time
   * and length, and a variable's value at the scene time (unVar).
   */
  newSprite(render) { const s = this.newSpritePart(render); this.addPartToScene(s); return s; }
  newSprite_(render) { this.newSprite(render); }
  newSpritePart(render) { return new Sprite(this.cursor, render); }
  addPartToScene(sprite) { this.addGen(() => sprite.gen()); }
  newSpriteA(ani) { return this.newSpriteA_(Sync.Stretch, ani); }
  /** newSpriteA': play `ani` as a sprite with the given Sync, waiting for its length. */
  newSpriteA_(sync, ani) {
    const s = this.newSprite((f) => getAnimationFrame(sync, ani, f.t, f.d));
    this.wait(ani.duration);
    return s;
  }
  newSpriteSVG(svg) { return this.newSprite(() => svg); }
  newSpriteSVG_(svg) { this.newSpriteSVG(svg); }
  play(ani) { const s = this.newSpriteA(ani); this.destroySprite(s); }
  simpleVar(render, def) { const v = this.newVar(def); this.newSprite((f) => render(f.get(v))); return v; }
  findVar(cond, vars) { for (const v of vars) if (cond(this.readVar(v))) return v; throw new Error('Variable not found.'); }
  destroySprite(s) { const now = this.cursor; s.ttl = s.ttl < 0 ? now : Math.min(s.ttl, now); }
  /** spriteModify: wrap the sprite's output; `mod(f)` returns a function of [svg, z]. */
  spriteModify(s, mod) {
    const born = s.born, prev = s.effect;
    s.effect = (absD, relD, relT, svg) => mod({t: relT, d: relD, absT: relT + born, absD, get: (v) => v.at(relT + born)})(prev(absD, relD, relT, svg));
  }
  applyVar(v, s, fn) { this.spriteModify(s, (f) => ([svg, z]) => [fn(f.get(v), svg), z]); }
  spriteVar(s, def, fn) { const v = this.newVar(def); this.applyVar(v, s, fn); return v; }
  signalS(s, dur, signal) {
    const now = this.cursor, prev = s.timeFn;
    const modT = (t) => (t < now || t > now + dur ? t : now + signal((t - now) / dur) * dur);
    s.timeFn = (t) => modT(prev(t));
  }
  spriteMap(s, fn) {
    const tDelta = this.cursor - s.born;
    this.spriteModify(s, (f) => ([svg, z]) => [f.t - tDelta < 0 ? svg : fn(svg), z]);
  }
  /** spriteTween: change the sprite over `dur` seconds by fn(progress 0..1, svg), then wait `dur`. */
  spriteTween(s, dur, fn) {
    const tDelta = this.cursor - s.born;
    this.spriteModify(s, (f) => ([svg, z]) => [fn(Math.min(1, Math.max(0, (f.t - tDelta) / dur)), svg), z]);
    this.wait(dur);
  }
  spriteE(s, effect) {
    const delay = Math.max(0, this.cursor - s.born), prev = s.effect;
    s.effect = (ad, d, t, svg) => { const [out, z] = prev(ad, d, t, svg); return [delayE(delay, effect)(d, t)(out), z]; };
  }
  spriteZ(s, zindex) {
    const at = this.cursor - s.born, prev = s.effect;
    s.effect = (ad, d, t, svg) => { const [out, z] = prev(ad, d, t, svg); return [out, t < at ? z : zindex]; };
  }
  /** asAnimation: a scene script turned into an animation that starts now. */
  asAnimation(fn) { const now = this.cursor; return dropA(now, scene((s) => { s.wait(now); fn(s); })); }
  transitionO(t, o, a, b) {
    const aA = this.asAnimation(a);
    const bA = this.fork((s) => { s.wait(aA.duration - o); return s.asAnimation(b); });
    this.play(overlapT(o, t)(aA, bA));
  }
}

export class Sprite {
  constructor(born, render) {
    this.born = born;
    this.render = render;
    this.timeFn = (t) => t;
    this.ttl = -1;
    this.effect = (_ad, _d, _t, svg) => [svg, 0];
  }
  /** The sprite's frame function, made when the scene is finished (Haskell runs this ST action then). */
  gen() {
    const {born: now, render, timeFn, ttl, effect} = this;
    return (absD, absT0) => {
      const absT = timeFn(absT0);
      const relD = (ttl < 0 ? absD : ttl) - now;
      const relT = absT - now;
      const inTimeSlice = relT >= 0 && relT < relD;
      const isLastFrame = absD === absT && relT === relD;
      if (!(inTimeSlice || isLastFrame)) return [None, 0];
      const svg = render({t: relT, d: relD, absT, absD, get: (v) => v.at(absT)});
      return effect(absD, relD, relT, svg);
    };
  }
  /** renderSprite: this sprite's picture as a value another sprite can draw. */
  frame() { return (f) => { const g = this.gen(); return g(f.absD, f.absT)[0]; }; }
}

/** scene: run a script and return the animation it describes. */
export function scene(script) {
  const s = new SceneBuilder(0);
  script(s);
  const dur = Math.max(s.cursor, s.maxEnd);
  let genFns = null;
  return mkAnimation(dur, (t) => {
    genFns ??= s.gens.map((g) => g());
    const frames = genFns.map((fn) => fn(dur, t * dur));
    return mkGroup(frames.map((f, i) => [f, i]).sort((a, b) => a[0][1] - b[0][1] || a[1] - b[1]).map((x) => x[0][0]));
  });
}

/** evalScene: run a script for its return value only. */
export function evalScene(script) { return script(new SceneBuilder(0)); }

