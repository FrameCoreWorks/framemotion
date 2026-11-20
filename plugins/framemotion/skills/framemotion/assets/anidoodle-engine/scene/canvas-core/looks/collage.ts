// paper-collage: a scene laid down in torn paper the way the bundled collage film lays its fox
// (anidoodle fox.ts and foxDraw.ts, Apache-2.0, Copyright 2026 Alex Greenshpun; the tear, the scissor cut,
// the fibres and dye, the layer of pieces with their shadows and the piece held in the hand and pressed
// down are ported from there). Not one drawn line: every thing is a piece of coloured paper, torn ones
// showing the white core of the sheet along their edge, each lifting a soft shadow off what is under it.
// Form is made as a collage artist makes it: a darker paper laid into the shade, a lighter one where the
// light lands. Wide sheets slide in from below and go down fast, small pieces are fiddly and slow.
import { Gfx, PENCIL, fractal, rng, type Ctx, type Env, type Layer, type P } from "../core";
import { blob, bounds, clipped, fillShape, mix, resample } from "../gallery";
import { W, H, scene, lit, fillOf, hex, sizeOf, outlineOf, areaOf, type Shape } from "../sceneKit";

const PAPER_CORE = "#fbf5e6", SHADOW = "#3c2814", BOARD = "#e9dfc9";
type Piece = { shape: P[]; color: string; torn?: number; seed: number; fibre?: number; lift?: number; clip?: P[]; layer: number; big: boolean };
const normals = (s: P[]): P[] => s.map((_, i) => { const a = s[(i - 1 + s.length) % s.length], b = s[(i + 1) % s.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; });
const ringLen = (s: P[]) => s.reduce((a, p, i) => a + Math.hypot(p[0] - s[(i + 1) % s.length][0], p[1] - s[(i + 1) % s.length][1]), 0);
const tear = (shape: P[], amp: number, seed: number, grow = 0): P[] => {
  const closed = [...shape, shape[0]], n = Math.max(24, Math.round(ringLen(shape) / 2.6)), s = resample(closed, n).slice(0, -1), nr = normals(s), r = rng(seed);
  return s.map(([x, y], i) => { const d = (fractal(seed, x, y, 0.09, 0.09, 3) - 0.5) * amp * 2.2 + (r() - 0.5) * amp * 0.6 + grow; return [x + nr[i][0] * d, y + nr[i][1] * d]; });
};
const cut = (shape: P[], seed: number): P[] => { const s = resample([...shape, shape[0]], Math.max(24, Math.round(ringLen(shape) / 4))).slice(0, -1), r = rng(seed); return s.map(([x, y]) => [x + (r() - 0.5) * 0.7, y + (r() - 0.5) * 0.7]); };
const fibres = (g: Gfx, shape: P[], color: string, seed: number, density: number) => {
  const b = bounds(shape), r = rng(seed), area = (b.x1 - b.x0) * (b.y1 - b.y0), c = g.cur;
  clipped(g, shape, () => {
    for (let i = 0; i < 5; i++) fillShape(g, blob(b.x0 + r() * (b.x1 - b.x0), b.y0 + r() * (b.y1 - b.y0), 30 + r() * 90, 20 + r() * 60, seed + i, 0.4, 12, r() * 3), r() < 0.5 ? mix(color, "#ffffff", 0.18) : mix(color, "#000000", 0.12), 0.25);
    c.lineCap = "round";
    const n = Math.round((area / 900) * density);
    for (let i = 0; i < n; i++) { const x = b.x0 + r() * (b.x1 - b.x0), y = b.y0 + r() * (b.y1 - b.y0), a = r() * Math.PI, l = 3 + r() * 9; c.strokeStyle = r() < 0.55 ? mix(color, "#fff8e8", 0.45) : mix(color, "#1a0e06", 0.3); c.globalAlpha = 0.25 + r() * 0.3; c.lineWidth = 0.6 + r() * 0.7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 3, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
    c.globalAlpha = 1;
  });
};
// a thin thing as a torn strip of paper along its line
const strip = (pts: P[], w: number): P[] => { const nr = normals(pts.length > 2 ? pts : [...pts, pts[pts.length - 1]]).slice(0, pts.length); return [...pts.map(([x, y], i) => [x - nr[i][0] * w, y - nr[i][1] * w] as P), ...pts.map(([x, y], i) => [x + nr[i][0] * w, y + nr[i][1] * w] as P).reverse()]; };
const scaleAbout = (pts: P[], cx: number, cy: number, k: number, dx: number, dy: number): P[] => pts.map(([x, y]) => [cx + (x - cx) * k + dx, cy + (y - cy) * k + dy]);

const pieces = (): Piece[] => {
  const out: Piece[] = [];
  scene().forEach((s) => {
    if (!s.fill) { s.poly.forEach((sub, j) => sub.length > 1 && out.push({ shape: strip(sub.filter((_, k, a) => k % 3 === 0 || k === a.length - 1), Math.max(1.6, s.sw * 0.5)), color: hex(s.stroke!), torn: 0.8, seed: 900 + s.i * 7 + j, fibre: 0.4, layer: s.layer, big: false })); return; }
    const e = outlineOf(s), col = hex(fillOf(s)), sz = sizeOf(s), L = lit(s), [x0, y0, x1, y1] = s.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const torn = s.big ? 3.2 : sz < 30 ? 1.2 : 2.4, base = (s.big ? tear : sz < 60 ? cut : tear)(e, torn, 10 + s.i);
    out.push({ shape: e, color: col, torn: s.big || sz >= 60 ? torn : undefined, seed: 10 + s.i, fibre: s.big ? 0.6 : 1, layer: s.layer, big: s.big, lift: s.big ? 0.5 : 1 });
    if (s.big) {   // a sky or a field: a second, darker band torn across its shade side
      const dark = mix(col, "#2a1d3a", 0.25), sky = cy < H / 2, band: P[] = sky ? [[x0 - 20, y0 - 20], [x1 + 20, y0 - 20], [x1 + 20, y0 + (y1 - y0) * 0.32], [x0 - 20, y0 + (y1 - y0) * 0.24]] : [[x0 - 20, y1 - (y1 - y0) * 0.3], [x1 + 20, y1 - (y1 - y0) * 0.38], [x1 + 20, y1 + 20], [x0 - 20, y1 + 20]];
      out.push({ shape: band, color: dark, torn: 4, seed: 40 + s.i, fibre: 0.6, clip: base, layer: s.layer, big: true, lift: 0.5 });
      return;
    }
    if (sz > 40 && areaOf(s) < 0.08 * W * H) {   // darker paper into the shade, lighter where the light lands
      const k = sz * 0.14;
      out.push({ shape: scaleAbout(e, cx, cy, 0.78, k, k * 1.1), color: mix(col, "#2a1d3a", 0.3), torn: 2, seed: 60 + s.i, fibre: 0.6, clip: base, layer: s.layer, big: false, lift: 0.6 });
      if (sz > 70 && areaOf(s) < 0.08 * W * H) out.push({ shape: scaleAbout(e, cx, cy, 0.36, -(x1 - x0) * 0.16, -(y1 - y0) * 0.18), color: mix(col, "#fff4dc", 0.3), torn: 1.6, seed: 80 + s.i, fibre: 0.5, clip: base, layer: s.layer, big: false, lift: 0.6 });
    }
    void L;
  });
  return out;
};

type Pose = { dx: number; dy: number; lift: number };
const drawPieces = (g: Gfx, list: Piece[], poses: (Pose | null | undefined)[]) => {
  const mv = (s: P[], q: Pose | null | undefined): P[] => (q ? s.map(([x, y]) => [x + q.dx, y + q.dy] as P) : s);
  const shapes = list.map((p, i) => mv(p.torn ? tear(p.shape, p.torn, p.seed) : cut(p.shape, p.seed), poses[i]));
  const inClip = (p: Piece, i: number, fn: () => void) => (p.clip ? clipped(g, mv(p.clip, poses[i]), fn) : fn());
  g.group("plain", () => list.forEach((p, i) => { if (poses[i] === null) return; const l = (p.lift ?? 1) * (poses[i]?.lift ?? 1); inClip(p, i, () => fillShape(g, shapes[i].map(([x, y]) => [x + 3 * l, y + 5 * l] as P), SHADOW, 0.5)); }), { blur: 4, alpha: 0.55 });
  g.group("plain", () => list.forEach((p, i) => {
    if (poses[i] === null) return;
    inClip(p, i, () => {
      if (p.torn) fillShape(g, mv(tear(p.shape, p.torn * 0.8, p.seed + 1, p.torn * 0.7), poses[i]), PAPER_CORE);
      fillShape(g, shapes[i], p.color);
      fibres(g, shapes[i], p.color, p.seed + 2, p.fibre ?? 1);
    });
  }));
};

// the schedule: piece after piece, a beat between layers; wide sheets quick, small ones slow
type Slot = { start: number; dur: number; dx: number; dy: number };
const cache = new Map<string, unknown>();
const plan = () => (cache.get("plan") as { list: Piece[]; slots: Slot[] } | undefined) ?? (() => {
  const list = pieces(), r = rng(58), raw: { t: number; d: number }[] = []; let t = 0;
  list.forEach((p, i) => { if (i && p.layer !== list[i - 1].layer) t += 8; const d = p.big ? 10 : 6 + Math.min(6, Math.sqrt(ringLen(p.shape)) * 0.25); raw.push({ t, d }); t += d * 0.7; });
  const k = (262 - 4) / Math.max(1, t + raw[raw.length - 1]?.d);
  const slots = list.map((p, i) => { const a = p.big ? Math.PI / 2 : -Math.PI / 2 + (r() - 0.5) * 2.2, far = p.big ? 70 : 22 + r() * 16; return { start: 4 + raw[i].t * k, dur: Math.max(6, raw[i].d * k), dx: Math.cos(a) * far, dy: Math.sin(a) * far }; });
  const v = { list, slots }; cache.set("plan", v); return v;
})();
const ease = (u: number) => (u >= 1 ? 1 : 1 - (1 - u) ** 3);
const poseAt = (s: Slot, f: number): Pose | null | undefined => { if (f < s.start) return null; const u = (f - s.start) / s.dur; if (u >= 1) return undefined; const e = ease(u), h = (1 - e) * (1 - e); return { dx: s.dx * (1 - e), dy: s.dy * (1 - e), lift: 1 + 5 * h }; };

export const collageLook = (ctx: Ctx, f: number, env: Env) => {
  const { list, slots } = plan(), DW = Math.round(W * env.scale), DH = Math.round(H * env.scale);
  let k = 0; while (k < list.length && slots[k].start + slots[k].dur <= f) k++;
  // pieces [0, k) settled, on the board: rolled forward from the last frame's prefix, rebuilt on a seek back
  let c = cache.get("base") as { k: number; L: Layer } | undefined;
  if (!c) { c = { k: -1, L: env.canvas(DW, DH) }; cache.set("base", c); }
  if (c.k > k || c.k < 0) { const b = c.L.ctx; b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = "source-over"; b.fillStyle = BOARD; b.fillRect(0, 0, DW, DH); c.k = 0; }
  if (c.k < k) { const from = c.k, g = new Gfx(c.L.ctx, env, 0, PENCIL); c.L.ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); for (let i = from; i < k; i++) drawPieces(g, [list[i]], [undefined]); c.k = k; }   // one piece at a time, so the stack is the same however the frames are visited
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c.L.canvas as CanvasImageSource, 0, 0);
  const g = new Gfx(ctx, env, 0, PENCIL); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  if (k < list.length) drawPieces(g, list, list.map((_, i) => (i < k ? null : poseAt(slots[i], f))));
  g.paper("paper", 0.1);
};
