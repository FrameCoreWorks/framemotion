// The parts of the Haskell library cubicbezier 0.6.0.7 (Kristof Bastiaensen, BSD-3-Clause) that
// Reanimate's shape code calls (Reanimate.PolyShape through Geom2D.CubicBezier.Linear), ported step
// for step so the numbers round as in Reanimate. Points are [x, y]; a cubic curve is [p0, p1, p2, p3].
//
// GHC rewrite rules matter here: inside cubicbezier, calls on its own CubicBezier type use the
// cubic formulas (evalBezierCubic, bezierSubsegmentCubic and so on), while Reanimate's Linear wrappers
// call the generic Bernstein versions (evalBezier below). Both are kept, named after what runs.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const vectorMag = ([x, y]) => Math.sqrt(x * x + y * y);
const vectorMagSquare = ([x, y]) => x * x + y * y;
export const vectorDistance = (p, q) => vectorMag(sub(p, q));
const vectorCross = ([x1, y1], [x2, y2]) => x1 * y2 - y1 * x2;
/** interpolateVector a b t = t *^ b ^+^ (1 - t) *^ a */
export const interpolateVector = (a, b, t) => [t * b[0] + (1 - t) * a[0], t * b[1] + (1 - t) * a[1]];
/** Haskell's signum on Double: zeros and NaN come back unchanged. */
const signum = (x) => (x > 0 ? 1 : x < 0 ? -1 : x);

// --- evaluation

/** evalBezierCubic */
export function evalBezierCubic([a, b, c, d], t) {
  const u = 1 - t, t2 = t * t, t3 = t2 * t;
  return [0, 1].map((k) => u * (u * (u * a[k] + (3 * t) * b[k]) + (3 * t2) * c[k]) + t3 * d[k]);
}
function evalBezierDerivs2Cubic([a, b, c, d], t) {
  const u = 1 - t, t2 = t * t, t3 = t2 * t;
  const da = [3 * (b[0] - a[0]), 3 * (b[1] - a[1])], db = [3 * (c[0] - b[0]), 3 * (c[1] - b[1])], dc = [3 * (d[0] - c[0]), 3 * (d[1] - c[1])];
  const p = [0, 1].map((k) => u * (u * (u * a[k] + (3 * t) * b[k]) + (3 * t2) * c[k]) + t3 * d[k]);
  const p1 = [0, 1].map((k) => u * (u * da[k] + (2 * t) * db[k]) + t2 * dc[k]);
  const p2 = [0, 1].map((k) => (2 * u) * (db[k] - da[k]) + (2 * t) * (dc[k] - db[k]));
  return [p, p1, p2];
}
const evalBezierDerivCubic = (b, t) => evalBezierDerivs2Cubic(b, t).slice(0, 2);

function bernsteinEval(v, t) {
  if (v.length === 0) return 0;
  if (v.length === 1) return v[0];
  const u = 1 - t, n = v.length - 1;
  let tn = t, bc = n, tmp = v[0] * u;
  for (let i = 1; i < n; i++) {
    const next = (tmp + tn * bc * v[i]) * u;
    tn *= t;
    bc = (bc * (n - i)) / (i + 1);
    tmp = next;
  }
  return tmp + tn * v[n];
}
/** evalBezier through Reanimate's Linear wrapper: the generic Bernstein evaluation. */
export const evalBezier = (ps, t) => [bernsteinEval(ps.map((p) => p[0]), t), bernsteinEval(ps.map((p) => p[1]), t)];

// --- splitting

/** splitBezier on a cubic: the same numbers whether the cubic rule or bernsteinSplit runs. */
export function splitBezier([a, b, c, d], t) {
  const ab = interpolateVector(a, b, t), bc = interpolateVector(b, c, t), cd = interpolateVector(c, d, t);
  const abbc = interpolateVector(ab, bc, t), bccd = interpolateVector(bc, cd, t);
  const mid = interpolateVector(abbc, bccd, t);
  return [[a, ab, abbc, mid], [mid, bccd, cd, d]];
}
/** bezierSubsegmentCubic (no swap of t1 and t2, as in the rule's target). */
function bezierSubsegmentCubic(b, t1, t2) {
  const [b1, d1] = evalBezierDerivCubic(b, t1), [b2, d2] = evalBezierDerivCubic(b, t2);
  const k = (t2 - t1) / 3;
  return [b1, [b1[0] + d1[0] * k, b1[1] + d1[1] * k], [b2[0] - d2[0] * k, b2[1] - d2[1] * k], b2];
}
/** quadToCubic (QuadBezier a b c) = CubicBezier a ((1/3) *^ (a ^+^ 2 *^ b)) ((1/3) *^ (2 *^ b ^+^ c)) c */
export const quadToCubic = ([a, b, c]) => [a, [(1 / 3) * (a[0] + 2 * b[0]), (1 / 3) * (a[1] + 2 * b[1])],
  [(1 / 3) * (2 * b[0] + c[0]), (1 / 3) * (2 * b[1] + c[1])], c];

// --- lines, tolerance, colinearity

/** lineDistance (Line p1 p2): signed distance of a point from the line. */
function lineDistance([x1, y1], [x2, y2]) {
  const dy = y1 - y2, dx = x2 - x1, d = Math.sqrt(dx * dx + dy * dy);
  return ([x, y]) => ((x - x1) * dy) / d + ((y - y1) * dx) / d;
}
const bezierParamTolerance = ([p0, p1, p2, p3], eps) =>
  eps / (3 * Math.max(vectorDistance(p0, p1), Math.max(vectorDistance(p1, p2), vectorDistance(p2, p3))));

/** colinear: the control points lie within eps of the chord (the curve is flat enough). */
export function colinear([a, b, c, d], eps) {
  const ld = lineDistance(a, d);
  const d1 = ld(b), d2 = ld(c);
  const [lo, hi] = d1 * d2 > 0 ? [3 / 4, 3 / 4] : [4 / 9, 4 / 9];
  const dmin = lo * Math.min(0, d1, d2), dmax = hi * Math.max(0, d1, d2);
  return dmax - dmin < eps;
}

// --- closest point

const fastVectorAngle = ([x, y]) => (Math.abs(y) < Math.abs(x) ? y / x + (x < 0 ? signum(y) * Math.PI : 0) : (signum(y) * Math.PI) / 2 - x / y);
/** Transform a b c d e f applied to a point */
const transform = ([a, b, c, d, e, f], [x, y]) => [a * x + b * y + c, d * x + e * y + f];
const rotateScaleVec = ([x, y]) => [x, -y, 0, y, x, 0];
const ROTATE_90R = [0, 1, 0, -1, 0, 0];

function closestBezierCurve(cb, p, t) {
  const [px, py] = p;
  const [b, b1, b2] = evalBezierDerivs2Cubic(cb, t);
  const [bx, by] = b, [bx1, by1] = b1, [bx2, by2] = b2;
  const vSqr = bx1 * bx1 + by1 * by1;
  if (vSqr === 0) {
    const [dx, dy] = sub(cb[3], cb[0]);
    return signum((px - bx) * dx + (py - by) * dy);
  }
  const denom = bx2 * by1 - bx1 * by2;
  const rv = vSqr / denom;
  if (vectorMagSquare(sub(p, b)) * 100 < vSqr * rv * rv) return ((px - bx) * bx1 + (py - by) * by1) / vSqr;
  const rot = transform(ROTATE_90R, b1);
  const c = [b[0] + rot[0] * rv, b[1] + rot[1] * rv];
  const s = signum(rv);
  return -fastVectorAngle(transform(rotateScaleVec(sub(c, p)), [by1 * s, bx1 * s])) * rv;
}

/** iter: Newton-like steps of f, falling back to bisection, within [mint, maxt]. */
function iter(f, eps, mint, maxt, curt) {
  for (;;) {
    const dt = f(curt);
    if (Math.abs(dt) <= eps) return curt + dt;
    if (dt < 0) {
      if (curt + dt <= mint) {
        if (mint === 0 && f(0) <= 0) return 0;
        const dT = (curt - mint) / 2;
        if (dT < eps) return mint + dT;
        [maxt, curt] = [curt, mint + dT];
      } else [maxt, curt] = [curt, curt + dt];
    } else if (curt + dt >= maxt) {
      if (maxt === 1 && f(1) >= 0) return 1;
      const dT = (maxt - curt) / 2;
      if (dT < eps) return curt + dT;
      [mint, curt] = [curt, curt + dT];
    } else [mint, curt] = [curt, curt + dt];
  }
}
/** closest: the curve parameter of the point nearest to p, within eps. */
export const closest = (cb, p, eps) => iter((t) => closestBezierCurve(cb, p, t), bezierParamTolerance(cb, eps), 0, 1, 0.5);

// --- intersection of two cubics by Bézier clipping (Geom2D.CubicBezier.Intersection)

function findOuterStep(upper, dir, p1, l) {
  // findOuter': Left = the list to retry from p1, Right = the finished hull
  if (l.length === 0) return {right: [p1]};
  const [p2, ...rest] = l;
  const turn = vectorCross(dir, sub(p2, p1));
  if (upper ? turn > 0 : turn < 0) return {left: l};
  const r = findOuterStep(upper, sub(p2, p1), p2, rest);
  if (r.left) return findOuterStep(upper, dir, p1, r.left);
  return {right: [p1, ...r.right]};
}
function findOuter(upper, l) {
  for (;;) {
    if (l.length < 2) return l;
    const [p1, p2, ...rest] = l;
    const r = findOuterStep(upper, sub(p2, p1), p2, rest);
    if (r.right) return [p1, ...r.right];
    l = [p1, ...r.left];
  }
}
function makeHull(ds) {
  const n = ds.length - 1;
  const points = ds.map((d, i) => [i / n, d]);
  return [findOuter(true, points), findOuter(false, points)];
}
const intersectPt = (d, [x1, y1], [x2, y2]) => (y1 === y2 ? x1 : x1 + ((d - y1) * (x2 - x1)) / (y2 - y1));
function testBelow(dmin, ps, cont) {
  for (let i = 0; ; i++) {
    if (ps.length - i < 2) return null;
    const p = ps[i], q = ps[i + 1];
    if (p[1] >= dmin) return cont();
    if (p[1] > q[1]) return null;
    if (q[1] < dmin) continue;
    return intersectPt(dmin, p, q);
  }
}
const testBetween = (dmax, [x, y], cont) => (y <= dmax ? x : cont());
function testAbove(dmax, ps) {
  for (let i = 0; ; i++) {
    if (ps.length - i < 2) return null;
    const p = ps[i], q = ps[i + 1];
    if (p[1] < q[1]) return null;
    if (q[1] > dmax) continue;
    return intersectPt(dmax, p, q);
  }
}
function chopHull(dmin, dmax, ds) {
  const [upper, lower] = makeHull(ds);
  const left = testBelow(dmin, upper, () => testBetween(dmax, upper[0], () => testAbove(dmax, lower)));
  if (left === null) return null;
  const ru = upper.slice().reverse(), rl = lower.slice().reverse();
  const right = testBelow(dmin, ru, () => testBetween(dmax, upper[upper.length - 1], () => testAbove(dmax, rl)));
  if (right === null) return null;
  return [left, right];
}

function bezierClip(p, q, tmin, tmax, umin, umax, prevClip, pEps, vEps, revCurves) {
  const [p0, p1, p2, p3] = p, [q0, q1, q2, q3] = q;
  let q3b;
  if (vectorDistance(q0, q3) > Math.max(vectorMag(q0), vectorMag(q3)) / 2 ** 30) q3b = q3;
  else if (vectorDistance(q0, q1) > Math.max(vectorMag(q0), vectorMag(q1)) / 2 ** 30) q3b = q1;
  else if (vectorDistance(q0, q2) > Math.max(vectorMag(q0), vectorMag(q2)) / 2 ** 30) q3b = q2;
  else {
    const t = closest(p, q0, vEps);
    const newT = tmin * (1 - t) + tmax * t;
    const umid = umax >= 0.5 ? umax : umin;
    if (vectorDistance(evalBezierCubic(p, t), evalBezierCubic(q, 0.5)) > vEps) return [];
    return revCurves ? [[umid, newT]] : [[newT, umid]];
  }
  const d = lineDistance(q0, q3b);
  const d1 = d(q1), d2 = d(q2);
  const [dmin, dmax] = d1 * d2 > 0
    ? [(3 / 4) * Math.min(0, Math.min(d1, d2)), (3 / 4) * Math.max(0, Math.max(d1, d2))]
    : [(4 / 9) * Math.min(0, Math.min(d1, d2)), (4 / 9) * Math.max(0, Math.max(d1, d2))];
  const chop = chopHull(dmin, dmax, [p0, p1, p2, p3].map(d));
  if (!chop) return [];
  const [chopTmin, chopTmax] = chop;
  const newP = bezierSubsegmentCubic(p, chopTmin, chopTmax);
  const newClip = chopTmax - chopTmin;
  const newTmin = tmax * chopTmin + tmin * (1 - chopTmin);
  const newTmax = tmax * chopTmax + tmin * (1 - chopTmax);
  if (Math.max(umax - umin, newTmax - newTmin) * 4 < pEps) {
    const newu = umax >= 0.5 ? umax : umin;
    const newt = newTmax >= 0.5 ? newTmax : newTmin;
    return revCurves ? [[newu, newt]] : [[newt, newu]];
  }
  if (prevClip > 0.8 && newClip > 0.8) {
    if ((newTmax - newTmin) * (newTmax - newTmin) * vectorMagSquare(sub(p3, p0)) > (umax - umin) * (umax - umin) * vectorMagSquare(sub(q3, q0))) {
      const [pl, pr] = splitBezier(newP, 0.5);
      const halfT = newTmin + (newTmax - newTmin) / 2;
      return [...bezierClip(q, pl, umin, umax, newTmin, halfT, 0, pEps, vEps, !revCurves),
        ...bezierClip(q, pr, umin, umax, halfT, newTmax, 0, pEps, vEps, !revCurves)];
    }
    const [ql, qr] = splitBezier(q, 0.5);
    const halfU = umin + (umax - umin) / 2;
    return [...bezierClip(ql, newP, umin, halfU, newTmin, newTmax, newClip, pEps, vEps, !revCurves),
      ...bezierClip(qr, newP, halfU, umax, newTmin, newTmax, newClip, pEps, vEps, !revCurves)];
  }
  return bezierClip(q, newP, umin, umax, newTmin, newTmax, newClip, pEps, vEps, !revCurves);
}
/** bezierIntersection p q eps: pairs of curve parameters where the two cubics meet. */
export function bezierIntersection(p, q, vEps) {
  const eps2 = Math.max(Math.min(bezierParamTolerance(p, vEps), bezierParamTolerance(q, vEps)), 1e-8);
  return bezierClip(p, q, 0, 1, 0, 1, 0, eps2, vEps, false);
}
