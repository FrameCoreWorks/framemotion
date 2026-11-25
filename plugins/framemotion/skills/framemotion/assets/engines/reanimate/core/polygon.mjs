// Polygons with exact coordinates for the Reanimate engine: FrameCore Works' JavaScript port of
// Reanimate.Math.Common, Reanimate.Math.SSSP and the parts of Reanimate.Math.Polygon that balloon uses,
// from reanimate/reanimate (public domain). Coordinates are Rationals (core/rational.mjs) as in
// Reanimate, so turns and intersections are decided exactly.
//
// One difference: Reanimate triangulates with the hgeometry library; this port triangulates by ear
// clipping. The shortest-path tree (SSSP) that Reanimate builds on the triangulation is the same for
// any triangulation of a simple polygon; only polygons with three or more collinear vertices on a
// shortest path can tie differently.
import * as Q from './rational.mjs';

// --- exact turn tests on integer coordinates (a polygon's points over a common denominator)

const lcm = (a, b) => { let x = a, y = b; while (y) [x, y] = [y, x % y]; return (a / x) * b; };
/** The polygon's points as BigInt pairs scaled by one positive factor; turn signs do not change. */
function integerRing(points) {
  const den = points.reduce((acc, [x, y]) => lcm(lcm(acc, x.d), y.d), 1n);
  return points.map(([x, y]) => [x.n * (den / x.d), y.n * (den / y.d)]);
}
/** sign of direction p1 p2 p3 = crossZ (p3 - p1) (p2 - p1) */
const dirSign = (p1, p2, p3) => {
  const v = (p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0]);
  return v < 0n ? -1 : v > 0n ? 1 : 0;
};
const isLeftTurn = (a, b, c) => dirSign(a, b, c) < 0;
const isRightTurn = (a, b, c) => dirSign(a, b, c) > 0;

// --- Reanimate.Math.Common on V2 Rational

/** rayIntersect: where the lines through (a, b) and (c, d) cross, or null when they are parallel. */
export function rayIntersect([[x1, y1], [x2, y2]], [[x3, y3], [x4, y4]]) {
  const {sub, mul, div, isZero} = Q;
  const c12 = sub(mul(x1, y2), mul(y1, x2)), c34 = sub(mul(x3, y4), mul(y3, x4));
  const bot = sub(mul(sub(x1, x2), sub(y3, y4)), mul(sub(y1, y2), sub(x3, x4)));
  if (isZero(bot)) return null;
  const xTop = sub(mul(c12, sub(x3, x4)), mul(sub(x1, x2), c34));
  const yTop = sub(mul(c12, sub(y3, y4)), mul(sub(y1, y2), c34));
  return [div(xTop, bot), div(yTop, bot)];
}

// --- triangulation (diagonals per vertex, ascending, as edgesToTriangulation builds them)

function triangulate(ring) {
  const n = ring.length;
  const adj = Array.from({length: n}, () => new Set());
  if (n < 4) return adj.map(() => []);
  // orientation from the signed area (twice), exactly
  let area2 = 0n;
  for (let i = 0; i < n; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n]; area2 += x1 * y2 - x2 * y1; }
  const ccw = area2 > 0n ? 1 : -1;
  const convex = (a, b, c) => -dirSign(a, b, c) * ccw;   // > 0: a left turn for a CCW polygon
  const inTriangle = (p, a, b, c) => {
    const s1 = convex(a, b, p), s2 = convex(b, c, p), s3 = convex(c, a, p);
    return s1 >= 0 && s2 >= 0 && s3 >= 0;
  };
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  const idx = [...Array(n).keys()];
  const isEar = (k, allowFlat) => {
    const m = idx.length;
    const a = idx[(k + m - 1) % m], i = idx[k], b = idx[(k + 1) % m];
    const turn = convex(ring[a], ring[i], ring[b]);
    if (turn < 0 || (turn === 0 && !allowFlat)) return false;
    for (const j of idx) {
      if (j === a || j === i || j === b) continue;
      const p = ring[j];
      if (same(p, ring[a]) || same(p, ring[i]) || same(p, ring[b])) continue;
      if (turn > 0 ? inTriangle(p, ring[a], ring[i], ring[b]) : false) return false;
    }
    return true;
  };
  while (idx.length > 3) {
    let k = idx.findIndex((_, k2) => isEar(k2, false));
    if (k < 0) k = idx.findIndex((_, k2) => isEar(k2, true));
    if (k < 0) k = 0;   // not a simple polygon; keep going so every edge still gets a triangle
    const m = idx.length;
    const a = idx[(k + m - 1) % m], b = idx[(k + 1) % m];
    adj[a].add(b);
    adj[b].add(a);
    idx.splice(k, 1);
  }
  const next = (x) => (x + 1) % n, prev = (x) => (x + n - 1) % n;
  return adj.map((s, v) => [...s].filter((w) => w !== next(v) && w !== prev(v)).sort((x, y) => x - y));
}

// --- the dual tree and the shortest-path tree (Reanimate.Math.SSSP)

const intersect = (xs, ys) => xs.filter((x) => ys.includes(x));
function dualTree(t, a, b, e) {
  const n = t.length, next = (x) => (x + 1) % n, prev = (x) => (x + n - 1) % n;
  const has = intersect([prev(a), next(a), ...t[a]], [prev(b), next(b), ...t[b]]);
  const at = has.indexOf(e);
  if (at >= 0) has.splice(at, 1);
  if (has.length === 0) return null;
  if (has.length > 1) throw new Error(`Invalid triangulation: ${JSON.stringify([a, b, e, has])}`);
  const ab = has[0];
  return {x: ab, l: dualTree(t, ab, b, a), r: dualTree(t, a, ab, b)};
}
function dual(root, t) {
  const n = t.length, idx = (i) => ((i % n) + n) % n;
  const rootNext = idx(root + 1), rootPrev = idx(root - 1), rootNNext = idx(root + 2);
  const has = intersect([rootPrev, ...t[root]], [rootNNext, ...t[rootNext]]);
  if (!has.length) throw new Error('weird triangulation');
  const x = has[0];
  return {a: root, b: rootNext, c: x, l: dualTree(t, x, root, rootNext), r: dualTree(t, rootNext, x, root)};
}

function sssp(ring, d) {
  const P = (i) => ring[i];
  const out = [[d.a, d.a], [d.b, d.a], [d.c, d.a]];
  const searchFn = (checkStep, cusp, x, list) => {
    if (!list.length) return null;
    const [y, ...ys] = list;
    if (checkStep(P(cusp), P(y), P(x))) return null;
    const acc = [];
    let v1 = y;
    for (let k = 0; k < ys.length; k++) {
      const v2 = ys[k];
      if (checkStep(P(v1), P(v2), P(x))) return [v1, ys.slice(k), acc];
      acc.push(v1);
      v1 = v2;
    }
    return [v1, [], acc];
  };
  const worker = (f1, f2, cusp, node) => {
    if (!node) return;
    const {x, l, r} = node;
    const left = searchFn(isRightTurn, cusp, x, f1);
    if (left) {
      const [v, hi, lo] = left;
      out.push([x, v]);
      worker(hi, [x], v, l);
      worker([...lo, v, x], f2, cusp, r);
      return;
    }
    const right = searchFn(isLeftTurn, cusp, x, f2);
    if (right) {
      const [v, hi, lo] = right;
      out.push([x, v]);
      worker(f1, [...lo, v, x], cusp, l);
      worker([x], hi, v, r);
      return;
    }
    out.push([x, cusp]);
    worker(f1, [x], cusp, l);
    worker([x], f2, cusp, r);
  };
  worker([d.c], [d.b], d.a, d.r);
  for (let node = d.l, outer = d.c; node; outer = node.x, node = node.l) {
    out.push([node.x, d.a]);
    worker([node.x], [outer], d.a, node.r);
  }
  return out.map((e, i) => [...e, i]).sort((u, w) => u[0] - w[0] || u[2] - w[2]).map((e) => e[1]);
}

// --- polygons

/**
 * mkPolygon: a polygon from [x, y] Rational points; its triangulation and shortest-path trees are
 * computed when first needed and shared by its rotations (pCycles).
 */
export function mkPolygon(points) {
  const base = {points, trig: null, ints: null, trees: new Map()};
  return {base, points, offset: 0};
}
const ints = (base) => (base.ints ??= integerRing(base.points));
function tree(base, root) {
  if (!base.trees.has(root)) {
    base.trig ??= triangulate(ints(base));
    base.trees.set(root, sssp(ints(base), dual(root, base.trig)));
  }
  return base.trees.get(root);
}
const mod = (i, n) => ((i % n) + n) % n;
export const polygonPoints = (p) => p.points;
export const pSize = (p) => p.points.length;
export const pNext = (p, i) => mod(i + 1, pSize(p));
export const pAccess = (p, i) => p.points[mod(p.offset + i, pSize(p))];
/** pParent p i j: j's parent on the shortest-path tree from i. */
export function pParent(p, i, j) {
  const n = pSize(p);
  return mod(tree(p.base, mod(i + p.offset, n))[mod(j + p.offset, n)] - p.offset, n);
}
const pAdjustOffset = (p, k) => ({...p, offset: mod(p.offset + k, pSize(p))});
export const pCycles = (p) => Array.from({length: pSize(p)}, (_, i) => pAdjustOffset(p, i));
/** pIsCCW: the sum of (x2 - x1) * (y2 + y1) over the edges is negative. */
export function pIsCCW(p) {
  const pts = p.points, n = pts.length;
  if (!n) return false;
  let s = Q.ZERO;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i === n - 1 ? 0 : i + 1];
    s = Q.add(s, Q.mul(Q.sub(x2, x1), Q.add(y2, y1)));
  }
  return Q.sign(s) < 0;
}
