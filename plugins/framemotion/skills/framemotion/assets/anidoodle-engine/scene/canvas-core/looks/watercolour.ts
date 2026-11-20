// pencil-watercolour, storybook and ink-wash: a scene painted the way the bundled films paint
// (anidoodle ranunculusDraw.ts, storybook.ts / storybookDraw.ts and wren.ts / wrenDraw.ts, Apache-2.0,
// Copyright 2026 Alex Greenshpun; the staged timing comes from brokenColourKit, the wet wash, the spread of
// the brush, the graphite that stops under later paint and the wet front settling at the bottom edge are
// ported from those films). The core's own wash and form (shading toward one light) do the painting.
//   pencil-watercolour: an HB lay-in light enough to live under paint, pale first washes spreading from
//     where the brush touched, every form shaded toward the light with a lifted highlight, then fine
//     graphite over the paint, stopping where later paint sits.
//   storybook: blue-grey construction (ovals and a gesture line) that stays, a light pencil drawing,
//     soft pastel washes, then a full-weight graphite line and a few flicks of paint.
//   ink-wash: no pencil; wet washes first that flood past the line and pool along each shape's bottom
//     edge, a backrun in the big ones, then a flexible nib thick on the press and hair-thin on the lift,
//     contours left open where the light eats the edge, and spatter.
import { Gfx, PENCIL, displace, jitter, oval, rng, sample, fractal, type Ctx, type Env, type Medium, type P } from "../core";
import { blob, bounds, clipped, fillShape, mix } from "../gallery";
import { checkOps, schedule, staged, type Op } from "../brokenColourKit";
import { W, H, scene, lit, fillOf, hex, sizeOf, outlineOf, areaOf, type Shape } from "../sceneKit";

type Kind = "pencil-watercolour" | "storybook" | "ink-wash";
const INK_M: Medium = { nib: 1.7, taper: 1, pressure: 1.75, retrace: false, wobble: 1.35, rough: 0.6 };
const SPEC: Record<Kind, { paper: string; lay: string; line: string; tint: (c: string) => string; shade: (c: string) => string; key: string }> = {
  "pencil-watercolour": { paper: "#fffaf3", lay: "#8a7f86", line: "#726262", tint: (c) => mix(c, "#fff8ee", 0.18), shade: (c) => mix(c, "#5b3f52", 0.42), key: "pw" },
  "storybook": { paper: "#fdf6ea", lay: "#9fb0c8", line: "#3d3437", tint: (c) => mix(c, "#fffaf3", 0.32), shade: (c) => mix(c, "#6a5a7a", 0.38), key: "sb" },
  "ink-wash": { paper: "#fbf8f0", lay: "#16131f", line: "#16131f", tint: (c) => mix(c, "#fbf8f0", 0.12), shade: (c) => mix(c, "#2a1d2a", 0.4), key: "iw" },
};
const gfx = (ctx: Ctx, env: Env, m: Medium = PENCIL) => new Gfx(ctx, env, 0, m);
const edgeOf = (s: Shape) => outlineOf(s);
// the brush touched at `at` and the wet front runs out along a ragged edge
const spread = (g: Gfx, at: P, shape: P[], p: number, seed: number, fn: () => void) => {
  if (p >= 1) return fn();
  const reach = (Math.max(...shape.map(([x, y]) => Math.hypot(x - at[0], y - at[1]))) + 10) / 0.75, c = g.cur, R = reach * Math.pow(p, 0.75);
  const pts: P[] = Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2, k = 0.75 + 0.5 * fractal(seed, Math.cos(a) * 40 + 100, Math.sin(a) * 40 + 100, 0.05, 0.05, 2); return [at[0] + Math.cos(a) * R * k, at[1] + Math.sin(a) * R * k]; });
  c.save(); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip(); fn(); c.restore();
};
// a wet wash that pools along the bottom edge of its shape (wren.ts `wet`), with a backrun in a big one
const wet = (g: Gfx, pts: P[], color: string, o: { alpha: number; seed: number; pool?: number; bloom?: P | null; bloomR?: number; paper: string }) => {
  const { alpha, seed, pool = 0.55, bloom = null, bloomR = 22 } = o, b = bounds(pts);
  g.wash(pts, color, { alpha, seed, dx: 7, dy: 6, shrink: 1.07, rim: true });
  clipped(g, pts, () => {
    const c = g.cur, gr = c.createLinearGradient(0, b.y0 + (b.y1 - b.y0) * 0.45, 0, b.y1 + 2), hx = (v: number) => Math.round(255 * Math.max(0, Math.min(1, v))).toString(16).padStart(2, "0");
    gr.addColorStop(0, color + "00"); gr.addColorStop(0.75, color + hx(alpha * pool * 0.6)); gr.addColorStop(1, color + hx(alpha * pool * 1.3));
    c.fillStyle = gr; c.fillRect(b.x0 - 20, b.y0, b.x1 - b.x0 + 40, b.y1 - b.y0 + 20);
  });
  if (bloom) { const bl = blob(bloom[0], bloom[1], bloomR, bloomR * 0.8, seed + 7, 0.32, 18); fillShape(g, bl, o.paper, 0.42); const c = g.cur; c.strokeStyle = mix(color, "#16131f", 0.25); c.globalAlpha = alpha * 0.9; c.lineWidth = 1.6; c.beginPath(); bl.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke(); c.globalAlpha = 1; }
};
// where a later thing's paint sits, an earlier line is not drawn (a hand does not draw what it cannot see)
const hidden = (g: Gfx, s: Shape, later: Shape[]) => {
  const c = g.cur; c.save(); c.globalCompositeOperation = "destination-out"; c.globalAlpha = 0.94; c.fillStyle = "#000";
  later.forEach((o) => { if (!o.fill || o.box[0] > s.box[2] + 6 || o.box[2] < s.box[0] - 6 || o.box[1] > s.box[3] + 6 || o.box[3] < s.box[1] - 6) return; c.beginPath(); for (const sub of o.subs) { sub.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); } c.fill(o.rule); });
  c.restore();
};
const hiOf = (s: Shape): P[] => { const e = edgeOf(s), [x0, y0, x1, y1] = s.box, cx = x0 + (x1 - x0) * 0.32, cy = y0 + (y1 - y0) * 0.3; return e.filter((_, i) => i % 3 === 0).map(([x, y]) => [cx + (x - (x0 + x1) / 2) * 0.32, cy + (y - (y0 + y1) / 2) * 0.28] as P); };
// the painting stops short of the sheet's edge in a ragged margin, as the bundled films' washes do
let VIG: P[] | null = null;
const vignette = (): P[] => { if (VIG) return VIG; const m = Math.min(W, H) * 0.055, pts: P[] = [], n = 120, per = 2 * (W + H - 4 * m); for (let i = 0; i < n; i++) { let d = (i / n) * per, x: number, y: number; const w = W - 2 * m, h = H - 2 * m; if (d < w) { x = m + d; y = m; } else if ((d -= w) < h) { x = W - m; y = m + d; } else if ((d -= h) < w) { x = W - m - d; y = H - m; } else { d -= w; x = m; y = H - m - d; } const k = (fractal(77, x, y, 0.012, 0.012, 2) - 0.5) * m * 0.9; pts.push([x + (x < W / 2 ? -k : k) * 0.6, y + (y < H / 2 ? -k : k) * 0.6]); } VIG = pts; return pts; };
const inVig = (g: Gfx, fn: () => void) => clipped(g, vignette(), fn);
const touch = (s: Shape): P => [s.box[0] + (s.box[2] - s.box[0]) * 0.3, s.box[1] + (s.box[3] - s.box[1]) * 0.25];

const build = (kind: Kind): Op[] => {
  const K = SPEC[kind], list = scene(), things = list.filter((s) => s.fill && !s.big), backs = list.filter((s) => s.fill && s.big), lines = list.filter((s) => !s.fill);
  const ops: Op[] = [], add = (marks: ((ctx: Ctx, env: Env, p: number) => void)[], f0: number, f1: number, dur: number, pace?: (u: number) => number) => { if (!marks.length) return; const t = schedule(marks.length, f0, f1, dur, pace); marks.forEach((d, i) => ops.push({ ...t[i], draw: d })); };
  const col = (s: Shape) => hex(fillOf(s));
  const ink = kind === "ink-wash";
  // (1) construction (storybook) and the pencil lay-in (not for ink and wash: the washes go down first)
  if (kind === "storybook") add(things.filter((s) => sizeOf(s) > 30).map((s) => (ctx: Ctx, env: Env, p: number) => { const g = gfx(ctx, env), [x0, y0, x1, y1] = s.box; g.group("ink", () => { g.pen(oval((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.52, (y1 - y0) * 0.52, 12, -2.4), { closed: true, w: 0.8, color: K.lay, opacity: 0.5, seed: 3 + s.i, wobble: 2.5, boil: 0, retrace: false, progress: p }); if (p > 0.6) g.pen([[(x0 + x1) / 2, y0 - 6], [(x0 + x1) / 2 + (x1 - x0) * 0.05, y1 + 6]], { w: 0.7, color: K.lay, opacity: 0.45, seed: 40 + s.i, wobble: 1, boil: 0, retrace: false, progress: (p - 0.6) / 0.4 }); }); }), 0.5, 30, 6, (u) => Math.pow(u, 1.15));
  if (!ink) add(things.map((s) => (ctx: Ctx, env: Env, p: number) => { const g = gfx(ctx, env); g.group("ink", () => inVig(g, () => g.pen(edgeOf(s), { closed: true, w: kind === "storybook" ? 1.2 : 0.8, color: kind === "storybook" ? "#5a5258" : K.lay, opacity: kind === "storybook" ? 0.5 : 0.42, seed: s.i + 7, wobble: 1.4, boil: 0, retrace: false, progress: p }))); }), kind === "storybook" ? 30 : 0.5, 62, 6, (u) => Math.pow(u, 1.15));
  // (2) the washes: the backdrop first, then each thing back to front, spreading from where the brush touched
  add([...backs, ...things].map((s) => (ctx: Ctx, env: Env, p: number) => {
    const g = gfx(ctx, env), e = edgeOf(s), c = col(s), L = lit(s);
    g.group("paint", () => inVig(g, () => spread(g, touch(s), e, p, 300 + s.i, () => {
      if (ink) wet(g, e, K.tint(c), { alpha: s.big ? 0.42 : 0.58, seed: 300 + s.i, pool: s.big ? 0.35 : 0.7, bloom: areaOf(s) > 0.02 * W * H && !s.big ? [s.box[0] + (s.box[2] - s.box[0]) * 0.62, s.box[1] + (s.box[3] - s.box[1]) * 0.42] : null, bloomR: Math.min(40, sizeOf(s) * 0.12), paper: K.paper });
      else if (s.big) { g.wash(e, K.tint(c), { alpha: 0.42, seed: 300 + s.i, dx: 0, dy: 2, shrink: 1, rim: false }); g.wash(e, mix(K.tint(c), K.shade(c), 0.3), { alpha: 0.16, seed: 330 + s.i, dx: 9, dy: -6, shrink: 0.9, rim: false }); clipped(g, e, () => { const cc = g.cur, [x0, y0, x1, y1] = s.box, sky = (y0 + y1) / 2 < H / 2, gr = cc.createLinearGradient(0, sky ? y0 : y1, 0, sky ? y1 : y0); gr.addColorStop(0, K.shade(c)); gr.addColorStop(1, K.shade(c) + "00"); cc.globalAlpha = 0.32; cc.fillStyle = gr; cc.fillRect(x0, y0, x1 - x0, y1 - y0); cc.globalAlpha = 1; }); }
      else g.wash(e, mix(K.tint(c), K.paper, 0.45), { alpha: 0.36, seed: 300 + s.i, dx: -2, dy: -2, shrink: 0.93 });
    })));
    void L;
  }), ink ? 1 : 60, ink ? 120 : 112, ink ? 14 : 16);
  // (3) form toward the one light (watercolour styles): the shaded body and a lifted highlight
  if (!ink) add(things.map((s) => (ctx: Ctx, env: Env, p: number) => {
    const g = gfx(ctx, env), e = edgeOf(s), c = col(s), k = Math.max(1, sizeOf(s) / 120);
    g.group("paint", () => inVig(g, () => spread(g, touch(s), e, p, 500 + s.i, () => {
      g.form(e, K.tint(c), K.shade(c), { seed: 500 + s.i, light: [-3.2 * Math.min(2.5, k), -4.6 * Math.min(2.5, k)], alpha: kind === "storybook" ? 0.9 : 0.94 });
      if (sizeOf(s) > 40 && sizeOf(s) < 260 && areaOf(s) < 0.04 * W * H) g.wash(hiOf(s), "#fff2dc", { seed: 501 + s.i, alpha: 0.28, dx: -1, dy: -1, shrink: 0.91, rim: false });
    })));
  }), 110, 210, 9, (u) => u * 0.6 + u * u * 0.4);
  // (4) the line over the paint: graphite (stopping under later paint) or the flexible nib
  const later = (s: Shape) => list.slice(s.i + 1);
  add([...things.map((s) => (ctx: Ctx, env: Env, p: number) => {
    const g = gfx(ctx, env, ink ? INK_M : PENCIL), e = edgeOf(s), L = lit(s), big = areaOf(s) > 0.01 * W * H;
    g.group(ink ? "plain" : "ink", () => inVig(g, () => {
      if (ink) {
        // open where the light eats the edge, pressed on the shade side
        const n = e.length, segs: P[][] = []; let cur: P[] = [];
        e.forEach((q, i) => { const lost = L.side(q[0], q[1]) < -0.65; if (!lost) cur.push(q); if ((lost || i === n - 1) && cur.length > 2) { segs.push(cur); cur = []; } else if (lost) cur = []; });
        segs.forEach((sg, j) => { const shade = L.side(sg[sg.length >> 1][0], sg[sg.length >> 1][1]) > 0.2; g.pen(sg.filter((_, k) => k % 2 === 0 || k === sg.length - 1), { w: (shade ? 3.8 : 2.2) * (big ? 1 : 0.75), color: K.line, seed: 700 + s.i * 9 + j, wobble: 0.9, boil: 0, taper: 1, opacity: shade ? 0.95 : 0.85, retrace: false, progress: Math.min(1, Math.max(0, p * (segs.length) - j)) }); });
      } else g.pen(e, { closed: true, seed: 700 + s.i, w: kind === "storybook" ? (big ? 3.6 : 2.8) : 1.15, opacity: kind === "storybook" ? 0.94 : 0.62, color: K.line, wobble: kind === "storybook" ? 0.5 : 0.65, boil: 0, taper: kind === "storybook" ? 0.5 : 1, retrace: true, progress: Math.min(1, p * 1.4) });
      hidden(g, s, later(s));
    }));
  }), ...lines.map((s) => (ctx: Ctx, env: Env, p: number) => { const g = gfx(ctx, env, ink ? INK_M : PENCIL); g.group("plain", () => inVig(g, () => s.poly.forEach((sub, j) => g.pen(sub, { w: Math.max(1, Math.min(4, s.sw * 0.4)), color: mix(hex(s.stroke!), K.line, ink ? 0.5 : 0.2), seed: 800 + s.i * 7 + j, wobble: 0.6, boil: 0, opacity: 0.9, retrace: false, progress: p })))); })], ink ? 120 : 208, kind === "storybook" ? 250 : 266, 8, (u) => u * 0.8 + u * u * 0.2);
  // (5) flicks of paint (storybook) or spatter shaken off the nib (ink and wash)
  if (kind !== "pencil-watercolour") add([(ctx: Ctx, env: Env, p: number) => { const g = gfx(ctx, env), r = rng(13), cols = things.map(col); g.group("plain", () => { const n = Math.round(22 * p); for (let i = 0; i < n; i++) { const x = W * (0.12 + r() * 0.76), y = H * (0.14 + r() * 0.62), big = r() < 0.25, cc = ink ? K.line : cols[i % Math.max(1, cols.length)] ?? "#c98f8f"; fillShape(g, blob(x, y, big ? 3.6 : 1.4 + r(), big ? 3 : 1.2 + r() * 0.8, 20 + i, 0.3, 8), cc, ink ? 0.7 + r() * 0.3 : 0.5); } }); }], kind === "storybook" ? 252 : 254, 266, 10);
  ops.sort((a, b) => a.t1 - b.t1);
  return checkOps(ops, 270);
};

const cache = new Map<string, Op[]>();
const ops = (kind: Kind) => () => { let o = cache.get(kind); if (!o) { o = build(kind); cache.set(kind, o); } return o; };
const look = (kind: Kind) => staged("scene:" + kind, ops(kind),
  (c, e) => { c.setTransform(e.scale, 0, 0, e.scale, 0, 0); c.fillStyle = SPEC[kind].paper; c.fillRect(0, 0, W, H); },
  (c, e) => { const g = new Gfx(c, e, 0, PENCIL); g.paper("paper", kind === "ink-wash" ? 0.08 : 0.12); g.paper("coldpress", kind === "ink-wash" ? 0.16 : 0.18); });
export const pencilWatercolourLook = look("pencil-watercolour");
export const storybookLook = look("storybook");
export const inkWashLook = look("ink-wash");
void displace; void jitter; void sample;
