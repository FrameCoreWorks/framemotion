// dream-glaze: a scene in resin-thinned oil glazes the way the bundled dream-glaze film paints (anidoodle
// dreamGlazeKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: forms as height fields raised and lit by one
// low sun with cast shadows walked across the heights, the linen surface, the ground laid in rows and each
// form laid in its shadow tone and worked up to the light are the kit's). No visible stroke, every edge
// hard, every form turned pixel by pixel: each thing of the scene becomes a soft raised form, the backdrop
// is laid in rows and darkened where the forms throw their shadows, the forms are laid in shadow and the
// light rises across them until the highlights are last.
import { type Ctx, type Env, type Layer, type P } from "../core";
import { OUT, cl, laid, paintForms, raise, sunlight, surface, workPlan, workUp, type Obj } from "../dreamGlazeKit";
import { W, H, N, scene, fillOf, sizeOf, raster, visibleRuns, type Shape } from "../sceneKit";

const S = sunlight([-0.55, 0.62, -0.5]);
const lin = (c: number[]): [number, number, number] => [Math.pow(c[0] / 255, 2.2), Math.pow(c[1] / 255, 2.2), Math.pow(c[2] / 255, 2.2)];
const segDist = (polys: P[][], x: number, y: number) => { let d = 1e9; for (const pts of polys) for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[j], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, t = cl(((x - a[0]) * dx + (y - a[1]) * dy) / l); d = Math.min(d, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy)); } return d; };
const inShape = (s: Shape, x: number, y: number) => { let k = false; for (const pts of s.poly) for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) k = !k; } return k; };
// a thing as a soft raised form: its edge distance, a pillow of height rising to its middle
const objOf = (s: Shape, mat: number): Obj => { const R = Math.max(6, Math.min(48, sizeOf(s) * 0.38)); /* a big flat thing is a plateau with a rounded edge, a small one a dome */ return { box: [s.box[0] - 3, s.box[1] - 3, s.box[2] + 3, s.box[3] + 3], at: (x, y, o) => { const inside = inShape(s, x, y), d = segDist(s.poly, x, y) * (inside ? 1 : -1), q = cl(d / R); o[0] = d; o[1] = inside ? R * Math.sqrt(1 - (1 - q) * (1 - q)) : 0; o[2] = x; o[3] = y; o[4] = mat; } }; };

type Built = { bg: Layer; forms: Layer; src: Uint8ClampedArray; things: Shape[]; oid: Uint8Array };
let B: Built | null = null;
const build = (env: Env): Built => {
  const list = scene(), things = list.filter((s) => s.fill && !s.big).slice(0, 250), R = raise(env, W, H, things.map((s, i) => objOf(s, i + 1))), r = raster(env), s = env.scale;
  const albedo = things.map((t) => lin(fillOf(t)));
  const F = paintForms(env, R, (b, mat, x, y, h, nx, ny, nz) => { const sh = S.sunAt(b, x, y, h), ao = cl(1 - (b.Hb[((y * b.s) | 0) * b.DW + ((x * b.s) | 0)] - h) / 60, 0.45, 1); S.light(albedo[mat - 1], nx, ny, nz, 0.25 + 0.75 * sh, ao, 0.35, 36); });
  // the backdrop, per pixel: the scene's colour lit flat, darkened where a form keeps the sun off it
  const bg = env.canvas(R.DW, R.DH), img = bg.ctx.createImageData(R.DW, R.DH), d = img.data, GAM = (v: number) => Math.round(255 * Math.pow(cl(1 - Math.exp(-1.35 * Math.max(0, v))), 1 / 2.2));
  for (let j = 0; j < R.DH; j++) for (let i = 0; i < R.DW; i++) { const x = (i + 0.5) / s, y = (j + 0.5) / s, p = (Math.min(r.h - 1, Math.floor(y)) * r.w + Math.min(r.w - 1, Math.floor(x))) * 4, al = lin([r.rgb[p], r.rgb[p + 1], r.rgb[p + 2]]), sh = S.sunAt(R.b, x, y, 0); S.light(al, 0, -0.35, 0.94, 0.45 + 0.55 * sh, 1, 0, 1); const g = (j * R.DW + i) * 4; d[g] = GAM(OUT[0] * 1.15); d[g + 1] = GAM(OUT[1] * 1.15); d[g + 2] = GAM(OUT[2] * 1.15); d[g + 3] = 255; }
  bg.ctx.putImageData(img, 0, 0);
  const src = F.objL.ctx.getImageData(0, 0, R.DW, R.DH).data;
  return { bg, forms: F.objL, src, things, oid: F.oid };
};
export const dreamGlazeLook = (ctx: Ctx, f: number, env: Env) => {
  B ??= build(env); const { bg, src, things, oid } = B, s = env.scale, DW = Math.round(W * s), DH = Math.round(H * s), fe = Math.min(f, N);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#f2ece2"; ctx.fillRect(0, 0, DW, DH);
  // the ground laid in rows, then each form laid in shadow and worked up to the light, back to front
  laid(ctx, s, bg, fe, [2, 92], [0, 0, W, H], Math.max(60, H / 12), 1);
  const n = things.length, span = 262 - 96, P = workPlan(env, "scene-dream", DW, DH, src, (g) => oid[g], (id) => things[id - 1].box as unknown as number[], (id) => Math.max(14, sizeOf(things[id - 1]) / 6));
  workUp(ctx, P, src, fe, (id) => { if (!id || id > n) return undefined; const a = 96 + (span * 0.75 * (id - 1)) / Math.max(1, n), d = span * 0.25; return [a, a + d * 0.5, a + d * 0.3, a + d]; });
  // thin things last: a hard-edged glaze line each, lit on its upper side
  const q = Math.max(0, Math.min(1, (fe - 236) / 24)); if (q > 0) { ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round"; scene().filter((t) => !t.fill).forEach((t) => t.poly.flatMap((q0) => visibleRuns(env, t, q0)).forEach((pts) => { const n2 = Math.max(2, Math.ceil(pts.length * q)), w = Math.max(1.6, t.sw), c = t.stroke!; const path = () => { ctx.beginPath(); pts.slice(0, n2).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); }; ctx.globalAlpha = 0.3; ctx.strokeStyle = "#1a1410"; ctx.lineWidth = w; ctx.save(); ctx.translate(w * 0.5, w * 0.7); path(); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; ctx.strokeStyle = `rgb(${c.join(",")})`; path(); ctx.stroke(); ctx.globalAlpha = 0.45; ctx.strokeStyle = "#fff8ec"; ctx.lineWidth = Math.max(0.6, w * 0.3); ctx.save(); ctx.translate(-w * 0.18, -w * 0.22); path(); ctx.stroke(); ctx.restore(); })); ctx.restore(); }
  surface(ctx, env, W, H);
};
