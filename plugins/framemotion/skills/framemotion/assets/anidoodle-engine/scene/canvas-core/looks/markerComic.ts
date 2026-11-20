// marker-comic: a scene drawn as a marker comic panel the way the bundled marker-comic film draws its
// koi (anidoodle koi.ts and koiDraw.ts with koiDrawKit.ts and gallery.ts, Apache-2.0, Copyright 2026 Alex
// Greenshpun: the flats laid in chisel-marker streaks, the ink ribbon that thickens away from the light and
// the contour growing along its centreline are the kit's and the film's). A blue-pencil lay-in, bold cel
// flats laid by the marker, a hard-edged cel shadow on the side away from the light, gel-pen whites, then
// one heavy confident contour round every thing. Light from the upper left.
import { Gfx, PENCIL, rng, type Ctx, type Env, type P } from "../core";
import { ink, mix, type InkOpts } from "../gallery";
import { cut, streakClip, streaks } from "../koiDrawKit";
import { W, H, N, scene, lit, fillOf, hex, sizeOf, areaOf, outlineOf, visibleRuns, drawOn, lenOf, type Clock, type Shape } from "../sceneKit";

const INK = "#15122a", LIGHT: P = [-0.62, -0.78], PAPER = "#fbfaf6", BLUE = "#7fb0dd";
const cel = (s: Shape) => { const c = fillOf(s), l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return hex(c.map((v) => l + (v - l) * 1.25 + 4) as [number, number, number]); };
const pathOf = (c: Ctx, s: Shape, dx = 0, dy = 0) => { c.beginPath(); for (const sub of s.subs) { sub.forEach(([x, y], i) => (i ? c.lineTo(x + dx, y + dy) : c.moveTo(x + dx, y + dy))); c.closePath(); } };
const lay = (c: Ctx, p: number, s: Shape, fn: () => void, w: number) => { if (p >= 1) return fn(); if (p <= 0) return; c.save(); streakClip(c, streaks(s.poly, w, -0.5, 4000 + s.i, 300), p); fn(); c.restore(); };
const inkP = (g: Gfx, center: P[], o: InkOpts, q: number) => { if (q <= 0 || center.length < 2) return; if (q >= 1) return ink(g, center, INK, o); ink(g, cut(center, q), INK, { ...o, taper: [o.taper?.[0] ?? 0.12, 0.08] }); };

const picture = (ctx: Ctx, env: Env, clk: Clock) => {
  const g = new Gfx(ctx, env, 0, PENCIL), list = scene();
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  // 1 · non-photo blue lay-in
  g.group("plain", () => list.forEach((s) => { if (s.big) return; const pts = s.fill ? outlineOf(s) : s.poly[0] ?? []; const q = clk.p("pencil", lenOf(pts) ** 0.7 + 4); if (q > 0 && pts.length > 1) g.pen(pts.filter((_, i, a) => i % 3 === 0 || i === a.length - 1), { w: 1, color: BLUE, seed: 10 + s.i, wobble: 2, boil: 0, opacity: 0.6, retrace: false, progress: q }); }), { alpha: 0.85 });
  // 2 · the flats, each laid in marker streaks back to front; 3 · its hard cel shadow; 4 · gel-pen whites
  list.forEach((s) => {
    if (!s.fill) return;
    const c = cel(s), fl = clk.p("flat", Math.sqrt(areaOf(s)) + 10, s.big ? 0 : 1), sh = s.big ? 0 : clk.p("shade", Math.sqrt(areaOf(s)) * 0.5 + 6), dt = s.big ? 0 : clk.p("detail", 8), sz = sizeOf(s), k = Math.max(4, Math.min(26, sz * 0.12));
    g.group("plain", () => { const cc = g.cur; g.touch(s.box[0] - 4, s.box[1] - 4, s.box[2] + 4, s.box[3] + 4); lay(cc, fl, s, () => { if (s.grad) { const gr = cc.createLinearGradient(0, s.box[1], 0, s.box[3]); s.grad.stops.forEach(([o, col]) => gr.addColorStop(Math.max(0, Math.min(1, o)), mix(hex(col), "#ffffff", 0))); cc.fillStyle = gr; } else cc.fillStyle = c; pathOf(cc, s); cc.fill(s.rule); }, Math.max(18, Math.min(60, sz * 0.4))); });
    if (sh > 0 && sz > 16) g.group("plain", () => {
      // the shadow: the shape minus a copy of itself pushed toward the light, a hard edge, laid with a darker marker
      const cc = g.cur; g.touch(s.box[0] - 4, s.box[1] - 4, s.box[2] + 4, s.box[3] + 4); cc.save(); pathOf(cc, s); cc.clip(s.rule);
      lay(cc, sh, s, () => { cc.fillStyle = mix(c, "#2a1d4a", 0.38); pathOf(cc, s); cc.fill(s.rule); cc.globalCompositeOperation = "destination-out"; pathOf(cc, s, LIGHT[0] * k * 1.6, LIGHT[1] * k * 1.6); cc.fill(s.rule); cc.globalCompositeOperation = "source-over"; }, 20);
      cc.restore();
    });
    if (dt > 0 && sz > 30 && areaOf(s) < 0.06 * W * H) g.group("plain", () => { const L = lit(s), [x0, y0, x1, y1] = s.box, cx = x0 + (x1 - x0) * 0.3, cy = y0 + (y1 - y0) * 0.26, r = rng(50 + s.i), cc = g.cur; g.touch(x0, y0, x1, y1); cc.strokeStyle = "#ffffff"; cc.lineCap = "round"; cc.lineWidth = Math.max(1.5, sz * 0.025); const n = Math.ceil(3 * dt); for (let i = 0; i < n; i++) { const a = -0.8 + i * 0.35, l = sz * (0.08 + r() * 0.06); if (!L.hi(cx, cy) && i > 0) break; cc.beginPath(); cc.moveTo(cx + i * sz * 0.03, cy + i * sz * 0.02); cc.lineTo(cx + i * sz * 0.03 + Math.cos(a) * l, cy + i * sz * 0.02 + Math.sin(a) * l); cc.stroke(); } });
  });
  // 5 · the heavy contour, thickening away from the light; thin things as single inked lines
  g.group("plain", () => list.forEach((s) => {
    if (s.fill && s.big) return;
    const w = !s.fill ? Math.max(2, Math.min(8, s.sw * 0.8)) : areaOf(s) > 0.01 * W * H ? 6.5 : 4.2;
    (s.fill ? visibleRuns(env, s) : s.poly.flatMap((q) => visibleRuns(env, s, q))).forEach((run, j) => { const q = clk.p("line", lenOf(run) ** 0.75 + 5, s.i); inkP(g, run.filter((_, i, a) => i % 2 === 0 || i === a.length - 1), { w, light: LIGHT, seed: 300 + s.i * 7 + j, shadow: 0.9, taper: [0.1, 0.14] }, q); });
  }));
  g.paper("paper", 0.06);
};
const PHASES: Record<string, [number, number]> = { pencil: [1, 40], flat: [42, 150], shade: [152, 190], detail: [192, 210], line: [212, 266] };
export const markerComicLook = (ctx: Ctx, f: number, env: Env) => drawOn("marker", Math.min(f, N), PHASES, 268, (clk) => picture(ctx, env, clk));
