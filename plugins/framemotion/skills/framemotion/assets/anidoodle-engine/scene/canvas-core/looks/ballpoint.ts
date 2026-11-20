// ballpoint: a scene drawn in one blue biro the way the bundled ballpoint film draws its pocket watch
// (anidoodle pocketWatch.ts and pocketWatchDraw.ts, Apache-2.0, Copyright 2026 Alex Greenshpun; the biro
// stroke with its ink bead, the hatching cut into hand-length flicked strokes and the order of passes are
// ported from there). Near-constant line weight; tone only from WHERE strokes are: a first layer of
// hatching everywhere there is shade, a cross layer where it is darker, a third direction in the deepest
// darks, the solid blacks scribbled in last. Construction lines barely pressed, then the contours, firm
// strokes leaving a bead of ink where the ball stops. The tone is the scene's.
import { Gfx, rng, type Ctx, type Env, type Medium, type P } from "../core";
import { hatchRuns, lerpP } from "../gallery";
import { W, H, N, scene, lit, outlineOf, sizeOf, areaOf, toneField, raster, idAt, drawOn, visibleRuns, lenOf, type Clock } from "../sceneKit";

const BIRO = "#23379f", PAPER = "#f6f2e6";
const BIRO_M: Medium = { nib: 0.98, taper: 0.12, pressure: 0.1, retrace: true, wobble: 1.15, rough: 0.3 };
const stroke = (g: Gfx, clk: Clock, pts: P[], o: { w?: number; op?: number; seed: number; wob?: number; blob?: boolean; kind: string; prio?: number }) => {
  const { w = 1.1, op = 0.86, seed, wob = 0.35, kind } = o, progress = clk.p(kind, 4 + Math.pow(lenOf(pts), 0.85), o.prio ?? 0), blob = (o.blob ?? false) && progress >= 1;
  if (progress <= 0) return;
  g.pen(pts, { w, color: BIRO, seed, wobble: wob, boil: 0, taper: 1, opacity: op, retrace: false, progress });
  if (blob) { const e = pts[pts.length - 1], s0 = pts[0], c = g.cur, r = rng(seed * 7); g.touch(e[0] - 4, e[1] - 4, e[0] + 4, e[1] + 4); g.touch(s0[0] - 3, s0[1] - 3, s0[0] + 3, s0[1] + 3); c.fillStyle = BIRO; c.globalAlpha = 0.8; c.beginPath(); c.arc(e[0] + (r() - 0.5), e[1] + (r() - 0.5), 1.2 + r() * 0.8, 0, Math.PI * 2); c.fill(); c.globalAlpha = 0.5; c.beginPath(); c.arc(s0[0], s0[1], 0.8 + r() * 0.5, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
};
const runsCache = new Map<string, P[][]>();
// the hatch strokes of one layer: runs where the tone asks for it, cut into hand-length flicked strokes
const layer = (env: Env, angle: number, gap: number, th: number, seed: number) => (runsCache.get(`${angle}:${th}`) ?? (() => {
  const r0 = raster(env), T = toneField(env), keep = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && T[Math.floor(y) * r0.w + Math.floor(x)] > th + (Math.sin(x * 0.05 + y * 0.03) * 0.03);
  const rs = hatchRuns({ x0: 0, y0: 0, x1: W, y1: H }, angle, gap, keep, 2.5, seed), r = rng(seed), out: P[][] = [];
  rs.forEach((run) => { let i = 0; while (i < run.length - 1) { const n = Math.min(run.length - 1 - i, 8 + Math.floor(r() * 22)), seg = run.slice(i, i + n + 1); if (seg.length > 1) { const a = seg[0], z = seg[seg.length - 1], m = lerpP(a, z, 0.5), bow = (r() - 0.5) * 1.6; out.push([a, [m[0] + bow, m[1] - bow], z]); } i += n + (r() < 0.25 ? 1 : 0); } });
  runsCache.set(`${angle}:${th}`, out); return out;
})());

const picture = (ctx: Ctx, env: Env, clk: Clock) => {
  const g = new Gfx(ctx, env, 0, BIRO_M), list = scene(), r0 = raster(env);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  g.group("plain", () => {
    // 1 · construction: the big masses as faint loose boxes, barely pressed
    list.filter((s) => s.fill && !s.big && areaOf(s) > 0.01 * W * H).forEach((s, i) => { const [x0, y0, x1, y1] = s.box; stroke(g, clk, [[x0 - 8, (y0 + y1) / 2], [x1 + 8, (y0 + y1) / 2 + 2]], { w: 0.7, op: 0.25, seed: 10 + i, kind: "build" }); stroke(g, clk, [[(x0 + x1) / 2, y0 - 8], [(x0 + x1) / 2 + 2, y1 + 8]], { w: 0.7, op: 0.25, seed: 20 + i, kind: "build" }); });
    // 2 · the contours, firm, in pieces as a hand lifts, a bead where the ball stops; thin things as lines
    list.forEach((s) => {
      if (s.fill && s.big) return;
      const pieces = s.fill ? visibleRuns(env, s) : s.poly.flatMap((q) => visibleRuns(env, s, q));
      pieces.forEach((pts, j) => { const step = Math.max(10, Math.round(pts.length / Math.max(1, Math.round(lenOf(pts) / 120)))); for (let a = 0; a < pts.length - 1; a += step) { const seg = pts.slice(a, Math.min(pts.length, a + step + 1)).filter((_, k, q) => k % 2 === 0 || k === q.length - 1); if (seg.length > 1) stroke(g, clk, seg, { w: sizeOf(s) > 60 ? 1.25 : 1.05, op: 0.9, seed: 100 + s.i * 31 + j * 7 + a, blob: true, kind: "line", prio: s.i }); } });
    });
    // 3 · tone, by where the strokes are: one direction, then the cross, then the third in the deepest darks
    ([["h1", -0.82, 4.2, 0.3], ["h2", 0.62, 4.6, 0.55], ["h3", 0.0, 5, 0.78]] as [string, number, number, number][]).forEach(([kind, ang, gap, th], li) => {
      layer(env, ang, gap, th, 300 + li).forEach((pts, k) => { const m = pts[1], id = idAt(r0, m[0], m[1]); stroke(g, clk, pts, { w: 0.82, op: 0.62 * (0.75 + ((k * 37) % 10) / 28), seed: 1000 * (li + 1) + k, wob: 0.25, kind, prio: id }); });
    });
    // 4 · the solid blacks scribbled in last
    list.filter((s) => s.fill && !s.big && (() => { const c = s.fill!; return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] < 45; })()).forEach((s) => {
      const L = lit(s);
      hatchRuns({ x0: s.box[0], y0: s.box[1], x1: s.box[2], y1: s.box[3] }, -0.3, 1.8, (x, y) => idAt(r0, x, y) === s.i && L.side(x, y) > -0.3, 2.5, 900 + s.i).forEach((run, k) => stroke(g, clk, run.filter((_, i, a) => i % 3 === 0 || i === a.length - 1), { w: 1, op: 0.8, seed: 5000 + s.i * 100 + k, wob: 0.2, kind: "fill", prio: s.i }));
    });
  });
  g.paper("paper", 0.06);
};
const PHASES: Record<string, [number, number]> = { build: [1, 18], line: [22, 80], h1: [84, 180], h2: [184, 226], h3: [230, 246], fill: [248, 264] };
export const ballpointLook = (ctx: Ctx, f: number, env: Env) => drawOn("ballpoint", Math.min(f, N), PHASES, 268, (clk) => picture(ctx, env, clk));
