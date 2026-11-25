// balloon: SVG shapes inflated like a balloon from one point, FrameCore Works' JavaScript port of
// Reanimate.Math.Balloon from reanimate/reanimate (public domain). Each outline becomes an exact
// polygon (core/polyshape.mjs); points farther along the shortest paths from its start than t of the
// longest such path are pulled back onto the circle of that length, as in Reanimate.
import * as Q from './rational.mjs';
import {mkGroup, mkLinePathClosed} from './svg.mjs';
import {toShapes, dropHairs} from './polyshape.mjs';
import {mkPolygon, polygonPoints, pSize, pNext, pAccess, pParent, pCycles, rayIntersect} from './polygon.mjs';

/** ssspDistances: each vertex's shortest-path distance from vertex 0 (doubles, as distance' gives). */
function ssspDistances(p) {
  const n = pSize(p), arr = new Array(n);
  const get = (i) => {
    if (arr[i] !== undefined) return arr[i];
    if (i === 0) return (arr[0] = 0);
    const parent = pParent(p, 0, i);
    return (arr[i] = get(parent) + Q.distanceD(pAccess(p, i), pAccess(p, parent)));
  };
  for (let i = 0; i < n; i++) get(i);
  return arr;
}
const maximum = (xs) => xs.reduce((a, b) => (b > a ? b : a));   // V.maximum: the first of the largest
const diameter = (p) => maximum(ssspDistances(p));

/** shiftLongestDiameter: the rotation of the polygon whose start has the longest shortest path (top-left on ties). */
function shiftLongestDiameter(p) {
  const margin = 0.01;
  const isTopLeft = (a, b) => { const [x, y] = Q.v2Sub(pAccess(a, 0), pAccess(b, 0)); return Q.cmp(y, x) > 0; };
  let score = 0, elt = p;
  for (const x of pCycles(p)) {
    const newScore = diameter(x);
    if (newScore - score > score * margin) { score = newScore; elt = x; }
    else if (score - newScore > newScore * margin) continue;
    else if (isTopLeft(x, elt)) { score = newScore; elt = x; }
  }
  return elt;
}

const takeUntil = (fn, xs) => { const out = []; for (const x of xs) { out.push(x); if (fn(x)) break; } return out; };

/** balloonP p t: the polygon with everything beyond t of its diameter (from vertex 0) cut away. */
function balloonP(p) {
  const ds = ssspDistances(p);
  const d = maximum(ds);
  const parentsMemo = new Map();
  const getParents = (x) => {
    if (!parentsMemo.has(x)) {
      const out = [];
      for (let v = x; v !== 0;) { v = pParent(p, 0, v); out.push(v); }
      parentsMemo.set(x, out);
    }
    return parentsMemo.get(x);
  };
  const getFunnel = (a, b) => {
    const aP = getParents(a), bP = getParents(b);
    return [takeUntil((v) => bP.includes(v), aP), takeUntil((v) => aP.includes(v), bP)];
  };
  const split = (aP, bP) => Array.from({length: 51}, (_, t) => Q.v2Lerp(Q.qFrac(t, 50), bP, aP));
  const P = (i) => pAccess(p, i);

  return (t) => {
    const targetLength = d * t;
    const nodeVisible = (x) => ds[x] <= targetLength;
    const moveCloser = (target) => (a) => {
      const targetDist = ds[target];
      const aDist = Q.distanceD(P(target), a);
      const frac = Q.qMin(Q.ONE, Q.fromDouble((targetLength - targetDist) / aDist));
      return Q.v2Lerp(frac, a, P(target));
    };
    const chunkRight = (a, b, funnel) => {
      const out = [];
      for (let k = 0; k + 1 < funnel.length; k++) {
        const x = funnel[k], y = funnel[k + 1];
        const u = rayIntersect([a, b], [P(x), P(y)]);
        if (!u) { if (nodeVisible(x)) out.push(moveCloser(x)(a)); return out; }
        if (nodeVisible(x)) out.push(...split(a, u).map(moveCloser(x)));
        a = u;
      }
      return out;
    };
    const chunkLeft = (a, b, funnel) => {
      // chunkLeft builds its output back to front: the deeper pieces come first
      const pieces = [];
      for (let k = 0; k + 1 < funnel.length; k++) {
        const x = funnel[k], y = funnel[k + 1];
        const u = rayIntersect([a, b], [P(x), P(y)]);
        if (!u) { if (nodeVisible(x)) pieces.push([moveCloser(x)(b)]); break; }
        if (nodeVisible(x)) pieces.push(split(u, b).map(moveCloser(x)));
        b = u;
      }
      return pieces.reverse().flat();
    };
    const chunkCenter = (a, b) => {
      const [aF, bF] = getFunnel(a, b);
      const ra = aF.slice().reverse(), rb = bF.slice().reverse();
      const aP = P(a), bP = P(b);
      if (!ra.length || !rb.length) return [];
      const x = ra[0];
      if (!nodeVisible(x)) return [];
      const mc = moveCloser(x);
      if (ra.length === 1 && rb.length === 1) return split(aP, bP).map(mc);
      if (ra.length === 1) {
        const v = rayIntersect([aP, bP], [P(x), P(rb[1])]);
        return v ? split(aP, v).map(mc) : [aP, bP].map(mc);
      }
      const u = rayIntersect([aP, bP], [P(x), P(ra[1])]);
      if (rb.length === 1) return u ? split(u, bP).map(mc) : [aP, bP].map(mc);
      if (!u) return [aP, bP].map(mc);
      const v = rayIntersect([aP, bP], [P(x), P(rb[1])]);
      return v ? split(u, v).map(mc) : [aP, bP].map(mc);
    };
    const worker = (a) => {
      if (a === 0) return [P(0)];
      const b = pNext(p, a);
      if (nodeVisible(a) && nodeVisible(b)) return [P(a), P(b)];
      const [aF, bF] = getFunnel(a, b);
      return [...chunkRight(P(a), P(b), aF), ...chunkCenter(a, b), ...chunkLeft(P(a), P(b), bF)];
    };
    const all = [];
    for (let a = 0; a < pSize(p); a++) all.push(...worker(a));
    const cleared = all.filter((v, i) => i === 0 || !Q.v2Eq(v, all[i - 1]));
    return mkPolygon(cleared);
  };
}

/** balloon' tol svg t: each outline of svg ballooned to t (0 to 1), keeping its drawing attributes. */
export function balloonWith(tol, svg) {
  let shapes = null;
  return (t) => {
    shapes ??= toShapes(tol, svg).map(([attrs, poly]) => [attrs, balloonP(shiftLongestDiameter(mkPolygon(dropHairs(polygonPoints(poly)))))]);
    return mkGroup(shapes.map(([attrs, gen]) => ({...mkLinePathClosed(polygonPoints(gen(t)).map(Q.v2ToDouble)), attrs: {...attrs}})));
  };
}
/** balloon: balloon' with tolerance 0.01. */
export const balloon = (svg) => balloonWith(0.01, svg);
