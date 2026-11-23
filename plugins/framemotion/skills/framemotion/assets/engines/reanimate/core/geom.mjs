// Geometry for the Reanimate engine: points, Bézier curves of any degree and 2D affine matrices.
// FrameCore Works' JavaScript port of the geometry Reanimate (reanimate/reanimate, public domain)
// takes from the cubicbezier and linear Haskell packages: evalBezier, bezierSubsegment,
// quadToCubic, arcLength (to a tolerance) and Reanimate.Transform. No DOM, clock or network.

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

/** Degree elevation of a quadratic curve [a, b, c] to a cubic (quadToCubic). */
export const quadToCubic = ([a, b, c]) => [a, lerpP(2 / 3, a, b), lerpP(2 / 3, c, b), c];

const outline = (ps) => { let s = 0; for (let i = 0; i + 1 < ps.length; i++) s += distance(ps[i], ps[i + 1]); return s; };

/**
 * Arc length of a cubic curve [c0, c1, c2, c3] from 0 to `t`, to the tolerance `eps`: the chord and
 * control-polygon estimate refined by halving until the two halves agree (as the cubicbezier package does).
 */
export function arcLength(cubic, t = 1, eps = 1e-4) {
  const part = t >= 1 ? cubic : splitBezier(cubic, t)[0];
  const estimate = (ps) => (2 * outline(ps) + distance(ps[0], ps[ps.length - 1])) / 3;
  const go = (ps, tol, depth) => {
    const whole = estimate(ps);
    const [l, r] = splitBezier(ps, 0.5);
    const halves = estimate(l) + estimate(r);
    if (Math.abs(halves - whole) < tol || depth > 24) return halves;
    return go(l, tol / 2, depth + 1) + go(r, tol / 2, depth + 1);
  };
  return go(part, eps, 0);
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
