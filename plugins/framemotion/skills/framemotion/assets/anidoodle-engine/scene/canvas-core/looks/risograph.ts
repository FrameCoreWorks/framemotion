// risograph: a scene pulled through the riso drum by drum, the way the bundled risograph film pulls its
// lighthouse (anidoodle riso.ts with lighthouse.ts and lighthouseDraw.ts, Apache-2.0, Copyright 2026 Alex
// Greenshpun: the inks, the drum with its registration offset and speck and mottle, the halftone screen per
// ink angle, the litho crayon and the plate marks are riso.ts's; the passes, the nip line and the drum's
// shadow are ported from the film). One drum per ink, the same sheet fed through once per ink: yellow,
// then pink over it, then the blue key plate; every other colour is an overprint, tone is a screen whose
// dots grow with the ink's share of the scene's colour, white is bare paper, small bright things are flat
// solids, and the blue plate carries the shade side and the crayon key lines.
import { Gfx, fractal, rng, type Ctx, type Env, type Layer, type P } from "../core";
import { INK, LITHO, PAPER, REG, drum, screen } from "../riso";
import { fillShape } from "../gallery";
import { W, H, scene, lit, fillOf, sizeOf, areaOf, raster, visibleRuns, toneField, type Shape } from "../sceneKit";

const PITCH = 6.2, ANG = { yellow: 0, pink: 75, blue: 15 };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
// how much of each ink the scene's colour wants (a three-ink separation, the grey pulled into the blue)
const sep = (c: number[]) => { const cy = 1 - c[0] / 255, mg = 1 - c[1] / 255, yl = 1 - c[2] / 255, k = Math.min(cy, mg, yl); return { yellow: clamp((yl - k * 0.55) * 1.05), pink: clamp((mg - k * 0.5) * 1.0), blue: clamp((cy - k * 0.8) * 0.95 + k * 0.38) }; };
type Ink = "yellow" | "pink" | "blue";
const plate = (ink: Ink) => (g: Gfx, env: Env) => drum(g, REG[ink], () => {
  const r = raster(env), T = toneField(env), list = scene(), all = { x0: 0, y0: 0, x1: W, y1: H };
  const at = (x: number, y: number) => Math.max(0, Math.min(r.h - 1, Math.floor(y * r.R))) * r.w + Math.max(0, Math.min(r.w - 1, Math.floor(x * r.R)));
  const solid = (s: Shape) => !s.big && sizeOf(s) < 46 && s.fill;
  // the screen over everything except the small flat solids; the blue plate deepens the shade side
  screen(g, all, PITCH, ANG[ink], (x, y) => { const p = at(x, y), id = r.id[p]; if (id >= 0 && solid(list[id])) return 0; const c = [r.rgb[p * 4], r.rgb[p * 4 + 1], r.rgb[p * 4 + 2]], v = sep(c)[ink]; return ink === "blue" ? clamp(v + 0.35 * Math.max(0, T[p] - 0.55)) : v * (0.85 + 0.3 * fractal(17, x, y, 0.004, 0.004, 2)); }, INK[ink]);
  // small bright things: flat solids on the plates their colour needs
  list.filter(solid).forEach((s) => { const v = sep(fillOf(s))[ink]; if (v > 0.35) s.subs.forEach((sub) => fillShape(g, sub, INK[ink], Math.min(1, v * 1.2))); });
  if (ink !== "blue") return;
  // the key plate's litho crayon: each thing's edge on its shade side, thin things whole
  const pen = (pts: P[], w: number, seed: number, op = 0.9) => g.pen(pts, { w, color: INK.blue, seed, wobble: 0.6, boil: 0, opacity: op, retrace: false });
  list.forEach((s) => {
    if (!s.fill) { s.poly.forEach((q, j) => pen(q.filter((_, i, a) => i % 2 === 0 || i === a.length - 1), Math.max(1.1, Math.min(3, s.sw * 0.4)), 900 + s.i * 7 + j)); return; }
    if (s.big) return; const L = lit(s);
    visibleRuns(env, s).forEach((run, j) => { let cur: P[] = []; const flush = () => { if (cur.length > 3) pen(cur.filter((_, i, a) => i % 2 === 0 || i === a.length - 1), areaOf(s) > 0.01 * W * H ? 1.6 : 1.2, 950 + s.i * 13 + j, 0.85); cur = []; }; run.forEach((p) => { if (L.side(p[0], p[1]) > -0.2) cur.push(p); else flush(); }); flush(); });
  });
});
const PLATES = [plate("yellow"), plate("pink"), plate("blue")], SWATCH = [INK.yellow, INK.pink, INK.blue];
const cache = new Map<string, Layer>();
const marks = (g: Gfx, k: number) => {
  g.group("plain", () => { const x = g.cur; x.strokeStyle = "#1b1b1b"; x.lineWidth = 1.1; [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]].forEach(([px, py]) => { x.beginPath(); x.arc(px, py, 7, 0, Math.PI * 2); x.moveTo(px - 12, py); x.lineTo(px + 12, py); x.moveTo(px, py - 12); x.lineTo(px, py + 12); x.stroke(); }); }, { alpha: 0.9 });
  if (k > 0) drum(g, [0, 0], () => SWATCH.slice(0, k).forEach((col, i) => { const x = g.cur; x.fillStyle = col; x.fillRect(W / 2 - SWATCH.length * 16 + i * 32, H - 34, 28, 14); }));
  g.paper("paper", 0.26); g.paper("coldpress", 0.22);
};
const state = (env: Env, k: number): Layer => {
  let L = cache.get(`st:${k}`); if (L) return L;
  L = env.canvas(Math.round(W * env.scale), Math.round(H * env.scale));
  const g = new Gfx(L.ctx, env, 0, LITHO), c = L.ctx;
  c.setTransform(env.scale, 0, 0, env.scale, 0, 0); c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  for (let i = 0; i < k; i++) PLATES[i](g, env);
  marks(g, k);
  cache.set(`st:${k}`, L); return L;
};
const feed = (u: number) => { const a = 0.08; if (u <= 0) return 0; if (u >= 1) return 1; const v = u < a ? (u * u) / (2 * a) : u > 1 - a ? 1 - ((1 - u) * (1 - u)) / (2 * a) : u - a / 2; return v / (1 - a / 2); };
const PASSES: [number, number][] = [[2, 86], [92, 176], [182, 262]];
export const risographLook = (ctx: Ctx, f: number, env: Env) => {
  let done = 0; while (done < 3 && f >= PASSES[done][1]) done++;
  const DW = Math.round(W * env.scale), DH = Math.round(H * env.scale);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(state(env, done).canvas as CanvasImageSource, 0, 0);
  const p = PASSES[done]; if (!p || f < p[0]) return;
  const u = feed((f - p[0]) / (p[1] - p[0])), shade = 46 * env.scale, y = Math.round(u * DH);
  if (y > 0) ctx.drawImage(state(env, done + 1).canvas as CanvasImageSource, 0, 0, DW, y, 0, 0, DW, y);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const gr = ctx.createLinearGradient(0, y, 0, y + shade); gr.addColorStop(0, "rgba(40,30,40,0.2)"); gr.addColorStop(0.25, "rgba(40,30,40,0.09)"); gr.addColorStop(1, "rgba(40,30,40,0)");
  ctx.fillStyle = gr; ctx.fillRect(0, y, DW, shade); ctx.restore();
};
void rng;
