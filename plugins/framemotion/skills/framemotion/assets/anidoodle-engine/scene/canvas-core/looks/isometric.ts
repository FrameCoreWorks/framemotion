// isometric: a scene built as an isometric diorama the way the bundled isometric film builds its night
// bakery (anidoodle isometricKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the true 2:1 projection,
// the three tones per material by the cube rule, and the plane being made, its outline traced by the pen
// and then filled sweeping down, are the kit's). The scene's groups stand as cut-out flats one behind the
// other on a base, each thing a slab with thickness: its face in the thing's colour, its right side darker,
// its top lighter, crisp edges and no line. Order: the iso grid, the base, then the flats from the back,
// each plane traced and filled, the thin things last.
import { type Ctx, type Env, type P } from "../core";
import { mix } from "../gallery";
import { Iso, span, type P2 } from "../isometricKit";
import { W, H, N, scene, fillOf, hex, outlineOf, type Shape } from "../sceneKit";

const thin = (pts: P[], d: number): P[] => { const o: P[] = [pts[0]]; for (const p of pts) { const q = o[o.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= d) o.push(p); } return o; };
type Plane = { pts: P2[]; fill: string };
type Piece = { faces: Plane[]; t0: number; t1: number; lines?: { a: P2; b: P2; c: string; w: number }[] };
let PIECES: { pieces: Piece[]; grid: [P2, P2][]; iso: Iso | null; base: Plane[] } | null = null;
const build = () => PIECES ??= (() => {
  const list = scene(), layers = [...new Set(list.map((s) => s.layer))].sort((a, b) => a - b), k = 1, DL = Math.max(W, H) * 0.05;
  // world: the scene's plane is x (right) and z (up); its groups stand at depth y, the first at the back
  const world = (s: Shape, sx: number, sy: number, y: number): [number, number, number] => [sx * k, y, (H - sy) * k];
  const depthOf = (s: Shape) => layers.indexOf(s.layer) * DL;
  // projection fitted to the frame: measure, then place
  const probe = new Iso(null as unknown as Ctx, 1, 0, 0), pts: P2[] = [];
  list.forEach((s) => (s.poly[0] ?? []).forEach(([x, y]) => { const w = world(s, x, y, depthOf(s)); pts.push(probe.p(...w), probe.p(w[0], w[1] + DL * 0.4, w[2])); }));
  const zb = -Math.max(W, H) * 0.03; [[0, 0], [W * k, 0], [0, layers.length * DL + DL], [W * k, layers.length * DL + DL]].forEach(([x, y]) => pts.push(probe.p(x, y, zb)));
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const safeTop = H > W * 1.4 ? H * 0.12 : H * 0.06, safeBot = H > W * 1.4 ? H * 0.22 : H * 0.06, u = Math.min((W * 0.9) / (x1 - x0), (H - safeTop - safeBot) / (y1 - y0));
  const iso = new Iso(null as unknown as Ctx, u, W / 2 - ((x0 + x1) / 2) * u, safeTop + (H - safeTop - safeBot) / 2 - ((y0 + y1) / 2) * u);
  const pieces: Piece[] = [], n = list.length, T = DL * 0.3;
  list.forEach((s, i) => {
    const y = depthOf(s), t0 = 30 + (200 * i) / n, t1 = t0 + Math.max(8, 200 / n * 2.2);
    if (!s.fill) { const ls = s.poly.flatMap((q) => thin(q, 6).slice(1).map((p, j, a) => ({ a: iso.p(...world(s, (j ? a[j - 1] : q[0])[0], (j ? a[j - 1] : q[0])[1], y + T + 0.5)), b: iso.p(...world(s, p[0], p[1], y + T + 0.5)), c: hex(s.stroke!), w: Math.max(1.4, s.sw * u * k) }))); pieces.push({ faces: [], lines: ls, t0, t1 }); return; }
    const c = hex(fillOf(s)), m = { top: mix(c, "#ffffff", 0.2), left: c, right: mix(c, "#1a1a30", 0.28) }, e = thin(outlineOf(s), 5), faces: Plane[] = [];
    const area = e.reduce((a, p, j) => { const q = e[(j + 1) % e.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0), out = area > 0 ? 1 : -1, t = s.big ? 3 : T;
    // the slab's sides that face the eye: the right side (+x) in the dark tone, the top (+z) in the light
    e.forEach((a, j) => { const b = e[(j + 1) % e.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (dy / l) * out, nz = (dx / l) * out; if (nx <= 0.05 && nz <= 0.05) return; const A = world(s, a[0], a[1], y), B = world(s, b[0], b[1], y); faces.push({ pts: [iso.p(A[0], y, A[2]), iso.p(B[0], y, B[2]), iso.p(B[0], y + t, B[2]), iso.p(A[0], y + t, A[2])], fill: nz > Math.abs(nx) ? m.top : m.right }); });
    faces.push({ pts: e.map(([x, yy]) => iso.p(...world(s, x, yy, y + t))), fill: s.grad ? hex(s.grad.stops[Math.floor(s.grad.stops.length / 2)][1]) : m.left });
    pieces.push({ faces, t0, t1 });
  });
  // the grid on the base, and the base itself: a slab under the whole stage
  const Wk = W * k, D = layers.length * DL + DL, grid: [P2, P2][] = [];
  for (let gx = 0; gx <= Wk; gx += Wk / 12) grid.push([iso.p(gx, 0, zb), iso.p(gx, D, zb)]);
  for (let gy = 0; gy <= D; gy += D / 6) grid.push([iso.p(0, gy, zb), iso.p(Wk, gy, zb)]);
  const B = { top: "#d9dde3", left: "#b9bfc9", right: "#9aa1ad" }, base = iso.boxFaces(-10, -10, zb - DL * 0.5, Wk + 10, D + 10, zb, B);
  return { pieces, grid, iso: null, base };
})();
export const isometricLook = (ctx: Ctx, f: number, env: Env) => {
  const B = build(), fe = Math.min(f, N), iso = new Iso(ctx, 1, 0, 0);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = "#eef0f3"; ctx.fillRect(0, 0, W, H);
  const gq = span(fe, 1, 14); B.grid.slice(0, Math.ceil(B.grid.length * gq)).forEach(([a, b]) => iso.line(a, b, "#c4cad4", 1, 0.8));
  iso.make(B.base, span(fe, 12, 28), "#2b7bf6");
  B.pieces.forEach((p) => { const q = span(fe, p.t0, p.t1); if (q <= 0) return; if (p.faces.length) iso.make(p.faces, q, "#2b7bf6"); p.lines?.slice(0, Math.ceil((p.lines?.length ?? 0) * q)).forEach((l) => iso.line(l.a, l.b, l.c, l.w)); });
};
