// pixel-art: a scene laid in pixels the way the bundled pixel-art film lays its pouncing cat (anidoodle
// pixelArtKit.ts with pixelArt.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the draft that records
// every cell laid, its strokes and passes, the polygon cover, the ordered dither, the cel plan and the
// whole-cell blit are the kit's). A grid of cells, each one of sixteen palette colours made from the
// scene's own, blown up by a whole number with no smoothing. Flat mid colours blocked in with the pencil
// and the bucket, back to front; a dark line of cells on each thing's shade side; shading clusters and a
// dithered sky band; highlights and rim light last. Played in 3-frame cels, a 10 fps feel.
import { type Ctx, type Env } from "../core";
import { PixelDraft, blit, celPlan } from "../pixelArtKit";
import { W, H, N, scene, lit, fillOf, sizeOf, areaOf, raster, idAt, type Shape } from "../sceneKit";

type RGB = [number, number, number];
const hx = (c: RGB) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const CELLPX = Math.max(6, Math.round(Math.min(W, H) / 120)), G = Math.floor(W / CELLPX), GH = Math.floor(H / CELLPX), CEL = 3, HOLD = 30;
let V: { d: PixelDraft; plan: number[]; pal: string[] } | null = null;
const author = (env: Env) => {
  const list = scene(), r0 = raster(env);
  // the palette: the five biggest colours of the scene, each as a shade, a mid and a light, plus a void
  const bases: RGB[] = [];
  // chosen far apart: the biggest colour first, then each time the colour farthest from those chosen (weighted by its area)
  const cand = list.filter((s) => s.fill).map((s) => ({ c: fillOf(s) as RGB, a: areaOf(s) }));
  if (cand.length) bases.push(cand.reduce((x, y) => (y.a > x.a ? y : x)).c);
  while (bases.length < 5) { let best: RGB | null = null, score = 0; cand.forEach(({ c, a }) => { const dmin = Math.min(...bases.map((b) => Math.hypot(b[0] - c[0], b[1] - c[1], b[2] - c[2]))), sc = dmin * Math.pow(a, 0.25); if (dmin > 30 && sc > score) { score = sc; best = c; } }); if (!best) break; bases.push(best); }
  const pal: RGB[] = [[10, 10, 18]]; bases.forEach((b) => pal.push(mixc(b, [24, 18, 48], 0.45), b, mixc(b, [255, 248, 230], 0.35)));
  while (pal.length < 16) pal.push(pal[pal.length - 1]);
  const near = (c: RGB, from = 1) => { let best = from, d = 1e9; for (let i = from; i < pal.length; i++) { const p = pal[i], e = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (e < d) { d = e; best = i; } } return best; };
  const midOf = (c: RGB) => { const i = near(c); return i - ((i - 1) % 3) + 1; };   // the mid of the ramp nearest the colour
  const d = new PixelDraft(G, GH, 0), cellOf = (s: Shape) => s.poly.map((p) => p.map(([x, y]) => [x / CELLPX, y / CELLPX] as [number, number]));
  const owner = (i: number) => idAt(r0, ((i % G) + 0.5) * CELLPX, (Math.floor(i / G) + 0.5) * CELLPX);
  // 0 · blocking: flat mid colours with the bucket, back to front; a gradient in its own ramp's steps
  d.setPass(0);
  list.forEach((s) => {
    if (!s.fill) { d.begin("pencil"); s.poly.forEach((p) => p.forEach(([x, y], j) => { if (j) d.line(p[j - 1][0] / CELLPX, p[j - 1][1] / CELLPX, x / CELLPX, y / CELLPX, near(s.stroke as RGB)); })); return; }
    d.begin("fill"); const cells = cellOf(s).flatMap((p) => PixelDraft.cover(p, G, GH));
    cells.forEach((i) => { if (owner(i) !== s.i) return; if (s.grad) { const p = (Math.floor(((Math.floor(i / G) + 0.5) * CELLPX)) * r0.w + Math.floor(((i % G) + 0.5) * CELLPX)) * 4; d.px(i % G, Math.floor(i / G), near([r0.rgb[p], r0.rgb[p + 1], r0.rgb[p + 2]])); } else d.px(i % G, Math.floor(i / G), midOf(fillOf(s) as RGB)); });
  });
  // 1 · the line of cells along each thing's shade side (the selective outline)
  d.setPass(1);
  list.filter((s) => s.fill && !s.big && sizeOf(s) > 2 * CELLPX).forEach((s) => { d.begin("pencil"); const L = lit(s), m = midOf(fillOf(s) as RGB); for (let y = 0; y < GH; y++) for (let x = 0; x < G; x++) { const i = y * G + x; if (owner(i) !== s.i) continue; const edge = owner(i + 1) !== s.i || owner(i + G) !== s.i; if (edge && L.side((x + 0.5) * CELLPX, (y + 0.5) * CELLPX) > 0.1) d.px(x, y, m - 1); } });
  // 2 · shading clusters, dithered where they meet the lit part
  d.setPass(2);
  list.filter((s) => s.fill).forEach((s) => { d.begin("cluster"); const L = lit(s), m = s.grad ? 0 : midOf(fillOf(s) as RGB); for (let y = 0; y < GH; y++) for (let x = 0; x < G; x++) { const i = y * G + x; if (owner(i) !== s.i) continue; const sd = L.side((x + 0.5) * CELLPX, (y + 0.5) * CELLPX), base = m || d.get(x, y); if (!base) continue; const shade = base - ((base - 1) % 3); if (sd > 0.55 || (sd > 0.3 && PixelDraft.dith(x, y, 2))) d.px(x, y, shade); } });
  // 3 · highlights and the rim where the light catches an edge
  d.setPass(3);
  list.filter((s) => s.fill && !s.big && sizeOf(s) > 3 * CELLPX).forEach((s) => { d.begin("cluster"); const L = lit(s), m = midOf(fillOf(s) as RGB); for (let y = 0; y < GH; y++) for (let x = 0; x < G; x++) { const i = y * G + x; if (owner(i) !== s.i) continue; const X = (x + 0.5) * CELLPX, Y = (y + 0.5) * CELLPX, rim = (owner(i - 1) !== s.i || owner(i - G) !== s.i) && L.side(X, Y) < -0.35; if ((L.hi(X, Y) && areaOf(s) < 0.06 * W * H) || rim) d.px(x, y, m + 1); } });
  d.end();
  const raw = celPlan(d, [40, 14, 24, 14], 4), cels = Math.floor((N - HOLD - 1) / CEL);
  const plan = Array.from({ length: cels }, (_, c) => raw[Math.min(raw.length - 1, Math.round((c * (raw.length - 1)) / (cels - 1)))]);
  return { d, plan, pal: pal.map(hx) };
};
export const pixelArtLook = (ctx: Ctx, f: number, env: Env) => {
  V ??= author(env); const { d, plan, pal } = V;
  const n = f >= N - HOLD ? d.ops.length : plan[Math.min(plan.length - 1, Math.max(1, Math.floor((f - 1) / CEL)))];
  const buf = new Uint8Array(G * GH); for (let k = 0; k < n; k++) { const o = d.ops[k]; buf[o >> 4] = o & 15; }
  blit(ctx, buf, G, GH, pal, Math.round(W * env.scale), Math.round(H * env.scale), pal[0]);
};
