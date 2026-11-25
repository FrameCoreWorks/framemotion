// Morphing between SVG shapes for the Reanimate engine: FrameCore Works' JavaScript port of
// Reanimate.Morph.Common, Reanimate.Morph.Linear, Reanimate.Morph.Rotational and the polygon functions
// they use from Reanimate.Math.Polygon (pAddPoints, pCentroid, pArea, pBoundingBox, pCutEqual), from
// reanimate/reanimate (public domain). Shapes are exact polygons (core/polygon.mjs); every outline of
// the source is paired with one of the target, given the same number of points and moved point by point.
//
// Reanimate.Morph.Cache stores point correspondences on disk between runs; here each morph computes
// them once, when first drawn.
//
// One difference on purpose. In Reanimate, `linear`'s closest correspondence picks the rotation of the
// target with the shortest paths, but the trajectory then reads the polygon's points without that
// rotation (polygonPoints ignores the offset, in the cache too), so `linear` moves exactly like
// `rawLinear` (the documentation GIFs doc_linear.gif and doc_rawLinear.gif are identical). With
// LaTeX's Computer Modern outlines the glyphs happen to start at matching corners, so this does not
// show; MathJax's outlines start elsewhere and the raw morph tangles. Here `linear` applies the
// rotation it picked, as its documentation says ("realigning corners"), which draws Reanimate's
// pictures; `rawLinear` is unchanged.
import * as Q from './rational.mjs';
import {mkGroup, mkLinePathClosed} from './svg.mjs';
import {lowerTransformations} from './paths.mjs';
import {toShapes} from './polyshape.mjs';
import {mkPolygon, polygonPoints, pSize, pAccess, pParent, pCycles} from './polygon.mjs';
import {interpolateRGBA8, labComponents} from './color.mjs';
import {fromToS} from './animation.mjs';
import {SceneBuilder} from './scene.mjs';
import {oOver} from './object.mjs';
import {linearLerp} from './geom.mjs';

// --- Reanimate.Math.Polygon on exact polygons

/** pArea: the signed area (points as stored, without the offset). */
export function pArea(p) {
  const arr = polygonPoints(p), n = arr.length;
  let acc = Q.ZERO;
  for (let i = 0; i < n; i++) {
    const [x, y] = arr[i], [x2, y2] = arr[i === n - 1 ? 0 : i + 1];
    acc = Q.add(acc, Q.sub(Q.mul(x, y2), Q.mul(x2, y)));
  }
  return Q.mul(Q.qFrac(1, 2), acc);
}
/** pCentroid: the centre of mass; it fails on a polygon without area, as Reanimate's does. */
export function pCentroid(p) {
  const arr = polygonPoints(p), n = arr.length;
  let sx = Q.ZERO, sy = Q.ZERO;
  for (let i = 0; i < n; i++) {
    const [x, y] = arr[i], [x2, y2] = arr[i === n - 1 ? 0 : i + 1];
    const c = Q.sub(Q.mul(x, y2), Q.mul(x2, y));
    sx = Q.add(sx, Q.mul(Q.add(x, x2), c));
    sy = Q.add(sy, Q.mul(Q.add(y, y2), c));
  }
  const a = pArea(p);
  if (Q.isZero(a)) throw new Error('pCentroid: the polygon has no area (Ratio has zero denominator)');
  const k = Q.div(Q.ONE, Q.mul(Q.qInt(6), a));
  return [Q.mul(k, sx), Q.mul(k, sy)];
}
/** pBoundingBox: [min x, min y, width, height], exact. */
export function pBoundingBox(p) {
  let [xMin, yMin] = pAccess(p, 0), xMax = Q.ZERO, yMax = Q.ZERO;   // Reanimate starts the maxima at 0
  for (const [x, y] of polygonPoints(p)) {
    if (Q.cmp(x, xMin) < 0) xMin = x;
    if (Q.cmp(y, yMin) < 0) yMin = y;
    if (Q.cmp(x, xMax) > 0) xMax = x;
    if (Q.cmp(y, yMax) > 0) yMax = y;
  }
  return [xMin, yMin, Q.sub(xMax, xMin), Q.sub(yMax, yMin)];
}
const HALF = Q.qFrac(1, 2);
/** pAddPoints n p: n times, the longest edge (the last of equals) is split at its middle. */
export function pAddPoints(n, p) {
  for (let k = 0; k < n; k++) {
    const size = pSize(p);
    let longest = 0, best = null;
    for (let i = 0; i < size; i++) {
      const d = Q.distSquared(pAccess(p, i), pAccess(p, i + 1));
      if (best === null || Q.cmp(best, d) <= 0) { best = d; longest = i; }   // maximumBy: the last maximum
    }
    const out = [];
    for (let i = 0; i < size; i++) {
      out.push(pAccess(p, i));
      if (i === longest) out.push(Q.v2Lerp(HALF, pAccess(p, i + 1), pAccess(p, i)));
    }
    p = mkPolygon(out);
  }
  return p;
}
/** pCutAt p i: the polygon cut along the diagonal from vertex 0 to vertex i. */
function pCutAt(p, i) {
  const n = pSize(p);
  const left = Array.from({length: i + 1}, (_, k) => pAccess(p, k));
  const right = [pAccess(p, 0)];
  for (let k = i; k < n; k++) right.push(pAccess(p, k));
  return [mkPolygon(left), mkPolygon(right)];
}
/** pCutEqual: the cut along a diagonal that splits the area most evenly (the first of equals). */
export function pCutEqual(p) {
  const n = pSize(p), cycles = pCycles(p);
  let best = null, bestScore = null;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i || pParent(p, i, j) !== i) continue;
      const cut = pCutAt(cycles[i], j - i);
      const diff = Q.sub(pArea(cut[0]), pArea(cut[1]));
      const score = Q.sign(diff) < 0 ? Q.neg(diff) : diff;
      if (bestScore === null || Q.cmp(score, bestScore) < 0) { best = cut; bestScore = score; }
    }
  }
  return best ?? [p, p];
}

// --- Reanimate.Morph.Common

/** normalizePolygons: points added to the smaller polygon until both have the same number. */
export function normalizePolygons(src, dst) {
  const srcN = pSize(src), dstN = pSize(dst);
  return [pAddPoints(Math.max(0, dstN - srcN), src), pAddPoints(Math.max(0, srcN - dstN), dst)];
}

const opacityKeys = ['fillOpacity', 'opacity', 'strokeOpacity'];
/** interpolateAttrs: the source's attributes with fill, stroke and opacities blended toward the target's. */
function interpolateAttrs(comps, src, dst) {
  const colour = (key) => {
    const a = src[key], b = dst[key];
    if (a === undefined || b === undefined) return null;   // Nothing on either side: no attribute
    if (a && b && a.rgba && b.rgba) return interpolateRGBA8(comps, a.rgba, b.rgba);
    return () => a;
  };
  const fill = colour('fill'), stroke = colour('stroke');
  const ops = opacityKeys.map((k) => [k, src[k] === undefined || dst[k] === undefined ? null : fromToS(src[k], dst[k])]);
  return (t) => {
    const out = {...src};
    for (const [key, fn] of [['fill', fill], ['stroke', stroke]]) {
      if (!fn) { delete out[key]; continue; }
      const v = fn(t);
      out[key] = Array.isArray(v) ? {rgba: v} : v;
    }
    for (const [key, fn] of ops) { if (!fn) delete out[key]; else out[key] = Math.fround(fn(t)); }
    return out;
  };
}

/** morph m src dst t: src at 0, dst at 1, and in between each paired outline moved by m's trajectory. */
export function morph(m, src, dst) {
  let gens = null;
  const build = () => {
    const pairs = m.objectCorrespondence(toShapes(m.tolerance, src), toShapes(m.tolerance, dst));
    return pairs.map(([[srcAttr, srcPoly], [dstAttr, dstPoly]]) =>
      [interpolateAttrs(m.colorComponents, srcAttr, dstAttr), m.trajectory(m.pointCorrespondence(srcPoly, dstPoly))]);
  };
  return (t) => {
    if (t === 0) return lowerTransformations(src);
    if (t === 1) return lowerTransformations(dst);
    gens ??= build();
    return mkGroup(gens.map(([attrs, points]) => ({...mkLinePathClosed(polygonPoints(points(t)).map(Q.v2ToDouble)), attrs: attrs(t)})));
  };
}

/** genesisObjectCorrespondence: unpaired outlines shrink to their centre. */
export function genesisObjectCorrespondence(left, right) {
  const emptyFrom = (a, b) => { const c = pCentroid(a); return mkPolygon(polygonPoints(b).map(() => c)); };
  const out = [];
  let i = 0;
  for (; i < left.length && i < right.length; i++) out.push([left[i], right[i]]);
  for (let k = i; k < right.length; k++) { const [y1, y2] = right[k]; out.push([[y1, y2], [y1, emptyFrom(y2, y2)]]); }
  for (let k = i; k < left.length; k++) { const [x1, x2] = left[k]; out.push([[x1, x2], [x1, emptyFrom(x2, x2)]]); }
  return out;
}
const pairUp = (copy) => function corr(left, right) {
  if (!left.length || !right.length) return [];
  if (left.length === 1 && right.length === 1) return [[left[0], right[0]]];
  if (left.length === 1) { const [x1, x2] = left[0]; return corr(copy(right.length, x2).map((p) => [x1, p]), right); }
  if (right.length === 1) { const [y1, y2] = right[0]; return corr(left, copy(left.length, y2).map((p) => [y1, p])); }
  return [[left[0], right[0]], ...corr(left.slice(1), right.slice(1))];
};
/** dupObjectCorrespondence: a lone outline is copied for each outline on the other side. */
export const dupObjectCorrespondence = pairUp((n, p) => Array(n).fill(p));
function splitPolygon(n, p) {
  if (n === 1) return [p];
  const [a, b] = pCutEqual(p);
  return [...splitPolygon(Math.floor(n / 2), a), ...splitPolygon(Math.floor((n + 1) / 2), b)];
}
/** splitObjectCorrespondence: a lone outline is cut into as many pieces as the other side has. */
export const splitObjectCorrespondence = pairUp(splitPolygon);

/** annotatePolygons fn svg: fn of each outline (tolerance 0.001), with that outline's attributes. */
export const annotatePolygons = (fn, svg) => mkGroup(toShapes(0.001, svg).map(([attrs, poly]) => ({...fn(poly), attrs: {...attrs}})));
/** unsafeSVGToPolygon: the first outline of an SVG. */
export function unsafeSVGToPolygon(tol, svg) {
  const shapes = toShapes(tol, svg);
  if (!shapes.length) throw new Error('Prelude.head: empty list');
  return shapes[0][1];
}

// --- Reanimate.Morph.Linear

/** linearTrajectory: each point on a straight line (exact, then rounded to doubles when drawn). */
export function linearTrajectory([src, dst]) {
  if (pSize(src) !== pSize(dst)) throw new Error(`Invalid lengths: (${pSize(src)},${pSize(dst)})`);
  const a = polygonPoints(src), b = polygonPoints(dst);
  return (t) => { const T = Q.fromDouble(t); return mkPolygon(b.map((q, i) => Q.v2Lerp(T, q, a[i]))); };
}
/** closestLinearCorrespondence: the rotation of the target whose points are closest to the source's. */
export function closestLinearCorrespondence(src0, dst0) {
  const [src, dst] = normalizePolygons(src0, dst0);
  const n = pSize(src);
  const score = (p) => { let s = Q.ZERO; for (let i = 0; i < n; i++) s = Q.add(s, Q.distSquared(pAccess(src, i), pAccess(p, i))); return s; };
  let best = dst, bestScore = score(dst);
  for (const x of pCycles(dst)) { const s = score(x); if (Q.cmp(s, bestScore) < 0) { best = x; bestScore = s; } }
  return [src, mkPolygon(Array.from({length: n}, (_, i) => pAccess(best, i)))];   // the rotation applied (see the top)
}
/** rawLinear: points added where needed, straight-line moves, LAB colours, outlines split to pair up. */
export const rawLinear = Object.freeze({
  tolerance: 0.001,
  colorComponents: labComponents,
  pointCorrespondence: normalizePolygons,
  trajectory: linearTrajectory,
  objectCorrespondence: splitObjectCorrespondence,
});
/** linear: rawLinear with the closest correspondence, the target turned to start nearest the source. */
export const linear = Object.freeze({...rawLinear, pointCorrespondence: closestLinearCorrespondence});

// --- Reanimate.Morph.Rotational

/** polygonOrigin p (ox, oy): a point of p's bounding box, as fractions of its size. */
export function polygonOrigin(p, [ox, oy]) {
  const [x, y, w, h] = pBoundingBox(p).map(Q.toDouble);
  return [x + w * ox, y + h * oy];
}
function lerpAngle(fromAng, toAng, t) {
  if (Math.abs(fromAng - (toAng + 2 * Math.PI)) < Math.abs(fromAng - toAng)) return (1 - t) * fromAng + t * (toAng + 2 * Math.PI);
  if (Math.abs(fromAng - (toAng - 2 * Math.PI)) < Math.abs(fromAng - toAng)) return (1 - t) * fromAng + t * (toAng - 2 * Math.PI);
  return (1 - t) * fromAng + t * toAng;
}
const originAngle = (o, p) => {
  const a = [(o[0] + 1) - o[0], (o[1] + 0) - o[1]], b = [p[0] - o[0], p[1] - o[1]];   // lineAngle (o + V2 1 0) o p
  return Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
};
const distance = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); };
/** rotationalTrajectory origin: points turn around a moving origin while their distance to it changes. */
export const rotationalTrajectory = (origin) => ([src, dst]) => {
  const srcOrigin = polygonOrigin(src, origin), dstOrigin = polygonOrigin(dst, origin);
  const sp = polygonPoints(src).map(Q.v2ToDouble), dp = polygonPoints(dst).map(Q.v2ToDouble);
  const srcLengths = sp.map((p) => distance(srcOrigin, p)), dstLengths = dp.map((p) => distance(dstOrigin, p));
  const srcAngles = sp.map((p) => originAngle(srcOrigin, p)), dstAngles = dp.map((p) => originAngle(dstOrigin, p));
  return (t) => {
    const o = [t * dstOrigin[0] + (1 - t) * srcOrigin[0], t * dstOrigin[1] + (1 - t) * srcOrigin[1]];
    return mkPolygon(sp.map((_, i) => {
      const len = fromToS(srcLengths[i], dstLengths[i])(t);
      const ang = lerpAngle(srcAngles[i], dstAngles[i], t);
      return [Q.fromDouble(o[0] + Math.cos(ang) * len), Q.fromDouble(o[1] + Math.sin(ang) * len)];
    }));
  };
};

// --- Reanimate.Scene.Object: the Morph object and oTransform

const morphCache = new WeakMap();   // src -> dst -> morph(linear, src, dst), so a tween pairs the shapes once
function cachedMorph(src, dst) {
  let byDst = morphCache.get(src);
  if (!byDst) morphCache.set(src, (byDst = new WeakMap()));
  let m = byDst.get(dst);
  if (!m) byDst.set(dst, (m = morph(linear, src, dst)));
  return m;
}

/** Morph: an object value drawn as `morph linear src dst` at `delta` (0 gives src, 1 gives dst). */
export class Morph {
  constructor(delta, src, dst) { this.delta = delta; this.src = src; this.dst = dst; }
  toSVG() { return cachedMorph(this.src, this.dst)(this.delta); }
}

/**
 * s.oTransform(src, dst, d): morph object src into object dst over d seconds, moving from src's place
 * to dst's with src's easing; src is hidden at the start and dst shown at the end. As in Reanimate,
 * opacity, scale and scale origin are not carried over (its FIXME).
 */
SceneBuilder.prototype.oTransform = function oTransform(src, dst, d) {
  const srcSvg = this.oRead(src, 'svg'), srcCtx = this.oRead(src, 'context');
  const srcEase = this.oRead(src, 'easing'), srcLoc = this.oRead(src, 'translate');
  this.oSet(src, 'shown', false);
  const dstSvg = this.oRead(dst, 'svg'), dstCtx = this.oRead(dst, 'context'), dstLoc = this.oRead(dst, 'translate');
  const m = this.newObject(new Morph(0, srcCtx(srcSvg), dstCtx(dstSvg)));
  this.oModify(m, (o) => ({...o, shown: true, easing: srcEase, translate: srcLoc}));
  this.fork((f) => f.oTween(m, d, (t, o) => oOver(o, 'translate', (v) => linearLerp(t, dstLoc, v))));
  this.oTweenV(m, d, (t, v) => new Morph(t, v.src, v.dst));
  this.oSet(m, 'shown', false);
  this.oSet(dst, 'shown', true);
};
