// crayon: a scene drawn the way the bundled crayon film draws its balloon (anidoodle balloon.ts and
// balloonDraw.ts, Apache-2.0, Copyright 2026 Alex Greenshpun; the scribble, the line and the phases are
// ported from there). Wax on toothy paper: every fill a back-and-forth scribble that skips the valleys of
// the sheet, a darker crayon worked over the shade side, a white crayon burnishing the highlight, a thin
// lay-in first and the fat contour gone over twice last. The sky is coloured last, as a child does.
import { Gfx, rng, type Ctx, type Env, type Medium, type P } from "../core";
import { clamp, hatchRuns, mix } from "../gallery";
import { W, H, N, scene, shown, whole, lit, fillOf, hex, sizeOf, outlineOf, drawOn, lenOf, areaOf, type Clock, type Region, type Shape } from "../sceneKit";

const CRAYON_M: Medium = { nib: 2.9, taper: 0.3, pressure: 0.8, retrace: true, wobble: 2.2, rough: 1.3 };
const PAPER = "#fdf8ea", BLACK = "#262233", WHITE = "#fffdf4";
const dark = (c: string) => mix(c, "#2a1d3a", 0.45);
// a crayon box colour: the scene's colour pushed toward the pure, saturated wax of a crayon
const crayon = (s: Shape) => { const c = fillOf(s), l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return hex(c.map((v) => l + (v - l) * 1.35 + 6) as [number, number, number]); };

type Opts = { angle: number; gap: number; w: number; alpha: number; seed: number; keep?: (x: number, y: number) => boolean; kind?: string; prio?: number };
const runsCache = new Map<string, P[][]>();
const scribble = (g: Gfx, clk: Clock, reg: Region, key: string, color: string, o: Opts) => {
  const b = reg.box, p = clk.p(o.kind ?? "fill", Math.sqrt(Math.max(1, (b.x1 - b.x0) * (b.y1 - b.y0))) * 0.9 + 14, o.prio ?? 0);
  if (p <= 0) return;
  const { angle, gap, w, alpha, seed, keep = () => true } = o, r = rng(seed);
  const rk = `${key}:${seed}:${angle}:${gap}`;
  let runs = runsCache.get(rk);
  if (!runs) { runs = hatchRuns({ x0: b.x0 - 8, y0: b.y0 - 8, x1: b.x1 + 8, y1: b.y1 + 8 }, angle, gap, (x, y) => reg.has(x, y) && keep(x, y), 5, seed); runsCache.set(rk, runs); }
  const c = g.cur; g.touch(b.x0 - 14, b.y0 - 14, b.x1 + 14, b.y1 + 14);
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = color; c.lineWidth = w;
  let prev: P | null = null; const lim = p * runs.length;
  runs.forEach((run, i) => {
    if (i >= lim) return;
    let pts = (i % 2 ? [...run].reverse() : run).filter((_, k, a) => k % 3 === 0 || k === a.length - 1).map(([x, y]) => [x + (r() - 0.5) * 1.6, y + (r() - 0.5) * 1.6] as P);
    if (lim - i < 1) pts = pts.slice(0, Math.max(2, Math.ceil(pts.length * (lim - i))));
    const jump = prev ? Math.hypot(pts[0][0] - prev[0], pts[0][1] - prev[1]) : 0;
    c.globalAlpha = alpha * (0.72 + r() * 0.4);
    c.beginPath();
    if (prev && jump < gap * 3.2) { c.moveTo(prev[0], prev[1]); pts.forEach(([x, y]) => c.lineTo(x, y)); }
    else pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke(); prev = pts[pts.length - 1];
  });
  c.restore();
};
// drawn on: a thin light lay-in of the contour first, then the fat line gone over twice, which replaces it
const line = (g: Gfx, clk: Clock, pts: P[], color: string, w: number, seed: number, op = 0.92, wob = 1, prio = 0) => {
  const len = lenOf(pts), lay = len >= 25 ? clk.p("lay", Math.pow(len, 0.75) + 6, prio) : 0, full = clk.p("line", Math.pow(len, 0.75) + 6, prio);
  if (full < 1 && lay > 0) g.pen(pts, { w: w * 0.45, color, seed, wobble: wob, boil: 0, opacity: op * 0.6, retrace: false, taper: 1, progress: lay });
  if (full > 0) g.pen(pts, { w, color, seed, wobble: wob, boil: 0, opacity: op, retrace: true, taper: 1, progress: full });
};
// a solid patch of bare paper under a thing: the colour behind stops at its edge (wax colours up to a line)
const knockOut = (g: Gfx, s: Shape) => { const c = g.cur; g.touch(s.box[0] - 2, s.box[1] - 2, s.box[2] + 2, s.box[3] + 2); c.fillStyle = PAPER; c.beginPath(); for (const sub of s.subs) { sub.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); } c.fill(s.rule); };
const wax = (g: Gfx, fn: () => void) => g.group("plain", fn, { textures: ["pencilTooth"] });

const picture = (ctx: Ctx, env: Env, clk: Clock) => {
  const g = new Gfx(ctx, env, 0, CRAYON_M);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  scene().forEach((s) => {
    const L = lit(s), seed = 100 + s.i * 13, key = `cr:${s.i}`;
    if (!s.fill) {   // a thin thing: a crayon line in its own colour
      s.poly.forEach((sub, j) => wax(g, () => line(g, clk, sub.filter((_, k, a) => k % 2 === 0 || k === a.length - 1), mix(hex(s.stroke!), BLACK, 0.15), Math.max(1.3, Math.min(5, s.sw * 0.45)), seed + j, 0.92, 0.7)));
      return;
    }
    const col = crayon(s), reg = s.big ? whole(s) : shown(env, s), big = s.big;
    wax(g, () => {
      if (!big) knockOut(g, s);
      const a = 1.25 + (s.i % 3) * 0.12;
      scribble(g, clk, reg, key, col, { angle: big ? 0.38 : a, gap: big ? 7 : 5.2, w: big ? 6 : 6.2, alpha: big ? 0.66 : 0.9, seed, prio: big ? 9 : 0 });
      scribble(g, clk, reg, key, col, { angle: big ? -0.5 : -0.35 + (s.i % 2) * 0.2, gap: big ? 12 : 9, w: 5, alpha: big ? 0.4 : 0.5, seed: seed + 1, prio: big ? 9 : 0 });
      scribble(g, clk, reg, key, dark(col), { angle: 0.55, gap: 6.5, w: 5, alpha: big ? 0.5 : 0.72, kind: "shade", seed: seed + 2, keep: (x, y) => L.side(x, y) > (big ? 0.35 : 0.15) });
      if (!big) scribble(g, clk, reg, key, mix(dark(col), BLACK, 0.3), { angle: -0.6, gap: 7, w: 4.4, alpha: 0.6, kind: "shade", seed: seed + 3, keep: (x, y) => L.side(x, y) > 0.75 });
      if (!big && sizeOf(s) > 50 && areaOf(s) < 0.06 * W * H) scribble(g, clk, reg, key, WHITE, { angle: 1.0, gap: 5, w: 4.5, alpha: 0.75, kind: "burnish", seed: seed + 4, keep: L.hi });
    });
    if (!big) {
      const edge = outlineOf(s).filter((_, k, a2) => k % 2 === 0 || k === a2.length - 1), heavy = areaOf(s) > 0.01 * W * H;
      wax(g, () => line(g, clk, edge, heavy ? BLACK : mix(dark(col), BLACK, 0.35), heavy ? 2.4 : 1.6, seed + 5, 0.92, sizeOf(s) < 40 ? 0.4 : 1, heavy ? 0 : 1));
    }
  });
  g.paper("paper", 0.08);
};

// frames of the 10 s film: lay-in, colouring (sky last), shade, burnish, the fat line, then a hold
const PHASES: Record<string, [number, number]> = { lay: [2, 62], fill: [64, 196], shade: [198, 226], burnish: [228, 238], line: [240, 268] };
export const crayonLook = (ctx: Ctx, f: number, env: Env) => drawOn("crayon", Math.min(f, N), PHASES, 270, (clk) => picture(ctx, env, clk));
void clamp;
