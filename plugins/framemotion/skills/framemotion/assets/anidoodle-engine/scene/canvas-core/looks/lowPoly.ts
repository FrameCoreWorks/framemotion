// low-poly: a scene modelled as triangle meshes and flat-shaded the way the bundled low-poly film models
// its mountain lake (anidoodle lowPoly.ts, Apache-2.0, Copyright 2026 Alex Greenshpun; the flat shading by
// each facet's normal against one low sun plus a cool sky ambient, hazed by distance, the painter's order
// and the modeller's order (wireframe first, then the faces shading in back to front) are ported from the
// film). Every thing becomes a mesh: its silhouette kept, its middle raised like a low hill so its facets
// turn toward or away from the sun; a backdrop a gently rolling field of facets. The mark is the facet:
// one colour per triangle, no line, no gradient.
import { fractal, rng, type Ctx, type Env, type P } from "../core";
import { W, H, N, scene, fillOf, sizeOf, raster, idAt, type Shape } from "../sceneKit";

type V = [number, number, number];
const norm = (v: V): V => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const SUN: V = norm([-0.6, -0.65, 0.5]), AMB: V = [0.55, 0.58, 0.82], SUNC: V = [1.25, 0.95, 0.75];   // screen space: x right, y down, z toward the eye
const segDist = (polys: P[][], x: number, y: number) => { let d = 1e9; for (const pts of polys) for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[j], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)); d = Math.min(d, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy)); } return d; };
type Tri = { p: P[]; col: string };
type Mesh = { s: Shape; tris: Tri[] };
let MESH: Mesh[] | null = null;
const build = (env: Env): Mesh[] => MESH ??= (() => {
  const r0 = raster(env), list = scene().filter((s) => s.fill), maxL = Math.max(1, ...list.map((s) => s.layer));
  return list.map((s) => {
    const sz = sizeOf(s), g = s.big ? Math.min(W, H) / 16 : Math.max(9, Math.min(42, sz / 5)), [x0, y0, x1, y1] = s.box, R = Math.max(8, Math.min(120, sz * 0.4)), r = rng(17 + s.i), c = fillOf(s);
    const cols = Math.ceil((x1 - x0) / g) + 2, rows = Math.ceil((y1 - y0) / g) + 2, v: V[][] = [], thin = s.poly.map((p) => p.filter((_, i) => i % 2 === 0));
    for (let j = 0; j <= rows; j++) { v.push([]); for (let i = 0; i <= cols; i++) { const x = x0 - g + i * g + (r() - 0.5) * g * 0.7, y = y0 - g + j * g + (r() - 0.5) * g * 0.7; const h = s.big ? (fractal(40 + s.i, x, y, 0.006, 0.006, 2) - 0.5) * g * 0.45 : R * Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, segDist(thin, x, y) / R), 2))) * (idAt(r0, x, y) === s.i ? 1 : 0.2); v[j].push([x, y, h]); } }
    const tris: Tri[] = [], depth = 1 - s.layer / maxL;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = v[j][i], b = v[j][i + 1], cc = v[j + 1][i + 1], d = v[j + 1][i];
      for (const t of (r() < 0.5 ? [[a, b, cc], [a, cc, d]] : [[a, b, d], [b, cc, d]]) as V[][]) {
        const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, my = (t[0][1] + t[1][1] + t[2][1]) / 3; if (idAt(r0, mx, my) !== s.i && !(Math.abs(mx - (x0 + x1) / 2) < (x1 - x0) / 2 && Math.abs(my - (y0 + y1) / 2) < (y1 - y0) / 2)) continue;
        const u: V = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]], w: V = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]];
        let n = norm([u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]); if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
        const dif = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]), sky = 0.55 + 0.45 * Math.max(0, -n[1]);
        // the scene's colour, lit: sun on the faces that turn to it, a cool sky on the rest, a breath of haze with distance
        const base = s.grad ? (() => { const p = (Math.max(0, Math.min(r0.h - 1, Math.floor(my))) * r0.w + Math.max(0, Math.min(r0.w - 1, Math.floor(mx)))) * 4; return [r0.rgb[p], r0.rgb[p + 1], r0.rgb[p + 2]]; })() : c;
        const lc = base.map((ch, k) => ch * (AMB[k] * sky * 0.62 + SUNC[k] * dif * 0.62)).map((ch) => ch * (1 - 0.12 * depth) + 214 * 0.12 * depth);
        tris.push({ p: t.map((q) => [q[0], q[1]] as P), col: `rgb(${lc.map((ch) => Math.round(Math.max(0, Math.min(255, ch)))).join(",")})` });
      }
    }
    return { s, tris };
  });
})();
const clipTo = (c: Ctx, s: Shape) => { c.beginPath(); for (const sub of s.subs) { sub.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); } c.clip(s.rule); };
export const lowPolyLook = (ctx: Ctx, f: number, env: Env) => {
  const M = build(env), fe = Math.min(f, N), n = M.length;
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = "#2a2c3a"; ctx.fillRect(0, 0, W, H);   // the empty viewport
  // the wireframe, swept from the back to the front; then the faces shade in, back to front
  const wire = Math.max(0, Math.min(1, (fe - 2) / 96)), faces = (fe - 100) / 162;
  M.forEach((m, i) => {
    const fq = Math.max(0, Math.min(1, faces * n - i * 0.85));
    ctx.save(); clipTo(ctx, m.s); ctx.lineJoin = "round";
    if (fq > 0) { const k = Math.ceil(m.tris.length * fq); for (let t = 0; t < k; t++) { const tr = m.tris[t]; ctx.fillStyle = ctx.strokeStyle = tr.col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...tr.p[0]); ctx.lineTo(...tr.p[1]); ctx.lineTo(...tr.p[2]); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    const wq = Math.max(0, Math.min(1, wire * n - i)); if (wq > 0 && fq < 1) { ctx.strokeStyle = "rgba(170,190,230,0.55)"; ctx.lineWidth = 0.8; ctx.beginPath(); m.tris.slice(Math.ceil(m.tris.length * fq), Math.ceil(m.tris.length * wq)).forEach((tr) => { ctx.moveTo(...tr.p[0]); ctx.lineTo(...tr.p[1]); ctx.lineTo(...tr.p[2]); ctx.closePath(); }); ctx.stroke(); }
    ctx.restore();
  });
  // thin things: a narrow strip of facets each, in their colour, last
  if (fe > 240) { ctx.lineCap = "round"; scene().filter((s) => !s.fill).forEach((s) => { ctx.strokeStyle = `rgb(${s.stroke!.join(",")})`; ctx.lineWidth = Math.max(1.5, s.sw); s.poly.forEach((q) => { ctx.beginPath(); q.filter((_, i, a) => i % 4 === 0 || i === a.length - 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }); }); }
};
