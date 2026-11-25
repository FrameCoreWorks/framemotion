// Geometry for the Reanimate engine: points, Bézier curves of any degree and 2D affine matrices.
// FrameCore Works' JavaScript port of the geometry Reanimate (reanimate/reanimate, public domain)
// takes from the Haskell packages cubicbezier 0.6.0.7 (BSD-3-Clause: evalBezier, splitBezier,
// bezierSubsegment, quadToCubic, arcLength ported from Geom2D.CubicBezier.Basic) and linear 1.23
// (BSD-3-Clause: the `lerp` argument order), plus Reanimate.Transform. No DOM, clock or network.

/** A point is [x, y]. */
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const lerpP = (t, a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Linear's `lerp alpha u v` is `alpha *^ u ^+^ (1 - alpha) *^ v`: alpha weighs the FIRST point.
 * Reanimate's `adjustLineLength` uses it for a closing segment, so it is kept as is.
 */
export const linearLerp = (alpha, u, v) => [alpha * u[0] + (1 - alpha) * v[0], alpha * u[1] + (1 - alpha) * v[1]];

/** De Casteljau evaluation of a Bézier curve of any degree (control points `ps`) at `t`. */
export function evalBezier(ps, t) {
  let pts = ps.map((p) => [p[0], p[1]]);
  while (pts.length > 1) {
    const next = [];
    for (let i = 0; i + 1 < pts.length; i++) next.push(lerpP(t, pts[i], pts[i + 1]));
    pts = next;
  }
  return pts[0];
}

/** Split a Bézier curve of any degree at `t`; returns [left, right] control points. */
export function splitBezier(ps, t) {
  const left = [], right = [];
  let pts = ps.map((p) => [p[0], p[1]]);
  while (pts.length) {
    left.push(pts[0]);
    right.unshift(pts[pts.length - 1]);
    const next = [];
    for (let i = 0; i + 1 < pts.length; i++) next.push(lerpP(t, pts[i], pts[i + 1]));
    pts = next;
  }
  return [left, right];
}

/** The control points of the part of a Bézier curve between parameters `a` and `b` (bezierSubsegment). */
export function bezierSubsegment(ps, a, b) {
  if (a >= b) {
    const p = evalBezier(ps, a);
    return ps.map(() => [p[0], p[1]]);
  }
  const tail = a <= 0 ? ps : splitBezier(ps, a)[1];
  const local = a >= 1 ? 1 : (b - a) / (1 - a);
  return local >= 1 ? tail : splitBezier(tail, local)[0];
}

/**
 * Bernstein polynomial evaluation as cubicbezier 0.6.0.7's Math.BernsteinPoly.bernsteinEval (BSD-3-Clause),
 * step for step, so values round as in Reanimate.
 */
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
const bernsteinDeriv = (v) => v.slice(1).map((x, i) => (x - v[i]) * (v.length - 1));
/**
 * evalBezierDeriv on cubicbezier's AnyBezier (control points of any degree): [point, derivative] at t,
 * through the Bernstein polynomials of each coordinate, as Reanimate's demo_tangent evaluates it.
 */
export function evalBezierDeriv(ps, t) {
  const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
  const one = (v) => (v.length <= 1 ? [v[0], 0] : [bernsteinEval(v, t), bernsteinEval(bernsteinDeriv(v), t)]);
  const [x, dx] = one(xs), [y, dy] = one(ys);
  return [[x, y], [dx, dy]];
}

/** Degree elevation of a quadratic curve [a, b, c] to a cubic (quadToCubic). */
export const quadToCubic = ([a, b, c]) => [a, lerpP(2 / 3, a, b), lerpP(2 / 3, c, b), c];

const outline = (ps) => { let s = 0; for (let i = 0; i + 1 < ps.length; i++) s += distance(ps[i], ps[i + 1]); return s; };

/**
 * Arc length of a cubic curve [c0, c1, c2, c3] from 0 to `t`, within the tolerance `eps`: ported from
 * cubicbezier 0.6.0.7 (Geom2D.CubicBezier.Basic.arcLength and arcLengthEstimate, BSD-3-Clause), which
 * Reanimate calls with tolerance 0.0001. Each half's estimate is (4 * outline of its halves - its own
 * outline) / 3; a curve whose halves' estimates agree with its own within `eps` takes their sum, otherwise
 * both halves are measured the same way (with the same `eps`, as in the original).
 * The original's other branch (Tanh-Sinh quadrature of |B'(t)|) runs only when eps / the longest control
 * leg is at most 1e-10, i.e. legs over a million units long here; it is replaced by adaptive Simpson.
 */
export function arcLength(cubic, t = 1, eps = 1e-4) {
  const longest = Math.max(distance(cubic[0], cubic[1]), distance(cubic[1], cubic[2]), distance(cubic[2], cubic[3]));
  if (!(eps / longest > 1e-10)) return arcLengthQuad(cubic, t, eps);
  return Math.sign(t) * arcLengthEstimate(splitBezier(cubic, t)[0], eps).arclen;
}

function arcLengthEstimate(b, eps, depth = 0) {
  const [bl, br] = splitBezier(b, 0.5);
  const ol = outline(b);
  const olL = outline(bl), olR = outline(br);
  const estimate = (4 * (olL + olR) - ol) / 3;
  const halfEstimate = (h) => { const [l, r] = splitBezier(h, 0.5); return (4 * (outline(l) + outline(r)) - outline(h)) / 3; };
  const estL = halfEstimate(bl), estR = halfEstimate(br);
  // Haskell evaluates lazily and stops when the halves agree; the depth cap only guards degenerate input.
  const arclen = Math.abs(estL + estR - estimate) < eps || depth > 20
    ? estL + estR
    : arcLengthEstimate(bl, eps, depth + 1).arclen + arcLengthEstimate(br, eps, depth + 1).arclen;
  return {arclen, estimate, ol};
}

function arcLengthQuad(cubic, t, eps) {
  const speed = (u) => {
    const [a, b, c, d] = cubic, v = 1 - u;
    return Math.hypot(3 * (v * v * (b[0] - a[0]) + 2 * v * u * (c[0] - b[0]) + u * u * (d[0] - c[0])),
      3 * (v * v * (b[1] - a[1]) + 2 * v * u * (c[1] - b[1]) + u * u * (d[1] - c[1])));
  };
  const simpson = (a, b, fa, fm, fb) => ((b - a) / 6) * (fa + 4 * fm + fb);
  const go = (a, b, fa, fm, fb, whole, tol, depth) => {
    const m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2;
    const flm = speed(lm), frm = speed(rm);
    const left = simpson(a, m, fa, flm, fm), right = simpson(m, b, fm, frm, fb);
    if (depth > 30 || Math.abs(left + right - whole) <= 15 * tol) return left + right + (left + right - whole) / 15;
    return go(a, m, fa, flm, fm, left, tol / 2, depth + 1) + go(m, b, fm, frm, fb, right, tol / 2, depth + 1);
  };
  const fa = speed(0), fm = speed(t / 2), fb = speed(t);
  return go(0, t, fa, fm, fb, simpson(0, t, fa, fm, fb), eps, 0);
}

// ---------------------------------------------------------------------------------------------
// 2D affine matrices as [a, b, c, d, e, f] (SVG order): x' = a x + c y + e, y' = b x + d y + f.

export const IDENTITY = Object.freeze([1, 0, 0, 1, 0, 0]);

/** Matrix product m · n (apply n first, then m). */
export const mulMatrix = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

export const transformPoint = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

const translateM = (x, y) => [1, 0, 0, 1, x, y];
const rotateM = (deg) => { const r = (deg * Math.PI) / 180; return [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]; };

/** The matrix of one SVG transformation (Reanimate.Transform.transformationMatrix). */
export function transformationMatrix(tr) {
  switch (tr.t) {
    case 'matrix': return tr.m.slice();
    case 'translate': return translateM(tr.x, tr.y);
    case 'scale': return [tr.x, 0, 0, tr.y ?? tr.x, 0, 0];
    case 'rotate': return tr.c ? mulMatrix(mulMatrix(translateM(tr.c[0], tr.c[1]), rotateM(tr.a)), translateM(-tr.c[0], -tr.c[1])) : rotateM(tr.a);
    case 'skewX': return [1, 0, Math.tan((tr.a * Math.PI) / 180), 1, 0, 0];
    case 'skewY': return [1, Math.tan((tr.a * Math.PI) / 180), 0, 1, 0, 0];
    default: return IDENTITY.slice();
  }
}

/** mkMatrix: the product of a node's transformation list, left to right. */
export const mkMatrix = (list) => (list ?? []).reduce((m, tr) => mulMatrix(m, transformationMatrix(tr)), IDENTITY.slice());
