// flat-vector: a scene built in a vector app the way the bundled flat-vector film builds its regatta
// (anidoodle flatVector.ts with koiDrawKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the pen tool
// placing anchors, the fill that lands when a path closes, the long shadows with a transparency ramp and
// the grain brush over the shade side are ported from the film; streaks and cut are the kit's). Every
// thing a closed path of hand-placed anchors filled with one flat colour the instant it closes, no strokes
// anywhere; depth from overlapping planes; the long shadows thrown away from the light; the grain brush
// last, clipped to each shape and ramped from nothing on its lit side.
import { rng, type Ctx, type Env, type Layer, type P } from "../core";
import { cut, streakClip, streakTip, streaks } from "../koiDrawKit";
import { W, H, N, scene, fillOf, hex, sizeOf, areaOf, type Shape } from "../sceneKit";

const UI = "#2b7bf6", NAVY_RGB = "31,58,86", GANG = 0.9;   // the grain ramps toward the lower right, away from the light
type Item = { s: Shape; polys: P[][]; anchors: P[][]; fill: string; grain: boolean; shadow: P[] | null; t0: number; t1: number; g0: number; g1: number };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
// anchors: the corners where the path turns, and a point every so often on a long smooth run
const anchorsOf = (pts: P[]): P[] => { const out: P[] = []; let acc = 0; pts.forEach((p, i) => { const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length], t1 = Math.atan2(p[1] - a[1], p[0] - a[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]); let d = Math.abs(t2 - t1); if (d > Math.PI) d = 2 * Math.PI - d; acc += Math.hypot(p[0] - a[0], p[1] - a[1]); if (i === 0 || d > 0.5 || acc > 120) { out.push(p); acc = 0; } }); return out.length > 2 ? out : pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 4)) === 0); };
const throwShadow = (pts: P[], y0: number, len = 1.2, drop = 0.3): P[] => pts.map(([x, y]) => [x + Math.max(0, y0 - y) * len, y0 + Math.max(0, y0 - y) * drop]);
let ITEMS: Item[] | null = null;
const items = (): Item[] => ITEMS ??= (() => {
  const list = scene().filter((s) => s.fill), out: Item[] = list.map((s) => { const c = fillOf(s), l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return { s, polys: s.poly, anchors: s.poly.map(anchorsOf), fill: hex(c.map((v) => l + (v - l) * 1.12) as [number, number, number]), grain: !s.big && sizeOf(s) > 30, shadow: !s.big && sizeOf(s) > 40 && areaOf(s) < 0.1 * W * H && s.box[3] < H * 0.95 ? throwShadow(s.poly[0] ?? [], s.box[3]) : null, t0: 0, t1: 0, g0: 0, g1: 0 }; });
  const wt = (o: Item) => 2 + o.anchors.reduce((a, b) => a + b.length, 0) * 0.9, tot = out.reduce((a, o) => a + wt(o), 0); let acc = 0;
  out.forEach((o) => { o.t0 = 2 + (226 * acc) / tot; acc += wt(o); o.t1 = 2 + (226 * acc) / tot; });
  const gi = out.filter((o) => o.grain); gi.forEach((o, i) => { o.g0 = 232 + (32 * i) / gi.length; o.g1 = Math.min(264, 232 + (32 * (i + 1.6)) / gi.length); });
  return out;
})();
const path = (c: Ctx, ps: P[][]) => { c.beginPath(); ps.forEach((p) => { p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }); };
const bbox = (ps: P[][]) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; ps.forEach((p) => p.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); })); return { x0: Math.max(0, x0 - 2), y0: Math.max(0, y0 - 2), x1: Math.min(W, x1 + 2), y1: Math.min(H, y1 + 2) }; };
const cache = new Map<string, Layer>();
const grainTile = (env: Env): Layer => { let L = cache.get("grain"); if (L) return L; const n = Math.round(240 * env.scale); L = env.canvas(n, n); const img = L.ctx.createImageData(n, n), d = img.data, r = rng(4242); for (let i = 0; i < n * n; i++) { const v = r(); if (v < 0.34) { d[i * 4] = 31; d[i * 4 + 1] = 58; d[i * 4 + 2] = 86; d[i * 4 + 3] = Math.round(90 + r() * 165); } } L.ctx.putImageData(img, 0, 0); cache.set("grain", L); return L; };
const grain = (c: Ctx, env: Env, it: Item, q: number, idx: number) => {
  const b = bbox(it.polys), k = env.scale, w = Math.ceil((b.x1 - b.x0) * k) + 4, h = Math.ceil((b.y1 - b.y0) * k) + 4, key = `g:${idx}:${q >= 1 ? 1 : 0}`;
  let L = q >= 1 ? cache.get(key) : undefined;
  if (!L) {
    L = q >= 1 ? env.canvas(w, h) : (cache.get("gtmp") && cache.get("gtmp")!.canvas.width >= w && cache.get("gtmp")!.canvas.height >= h ? cache.get("gtmp")! : (() => { const t = env.canvas(Math.round(W * k), Math.round(H * k)); cache.set("gtmp", t); return t; })());
    const t = L.ctx; t.save(); t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, w, h); t.setTransform(k, 0, 0, k, -b.x0 * k, -b.y0 * k); path(t, it.polys); t.clip();
    if (q < 1) streakClip(t, streaks(it.polys, Math.max(26, (b.y1 - b.y0) * 0.22), GANG + Math.PI / 2 + 0.3, 900 + idx, 260), q);
    t.setTransform(1, 0, 0, 1, 0, 0); t.fillStyle = t.createPattern(grainTile(env).canvas as CanvasImageSource, "repeat")!; t.fillRect(0, 0, w, h); t.restore();
    t.save(); t.setTransform(k, 0, 0, k, -b.x0 * k, -b.y0 * k); const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, R = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2, dx = Math.cos(GANG), dy = Math.sin(GANG), g = t.createLinearGradient(cx - dx * R, cy - dy * R, cx + dx * R, cy + dy * R); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.35, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)"); t.globalCompositeOperation = "destination-in"; t.fillStyle = g; t.fillRect(b.x0 - 2, b.y0 - 2, b.x1 - b.x0 + 4, b.y1 - b.y0 + 4); t.restore();
    if (q >= 1) cache.set(key, L);
  }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.32; c.drawImage(L.canvas as CanvasImageSource, 0, 0, w, h, Math.floor(b.x0 * k), Math.floor(b.y0 * k), w, h); c.restore();
  if (q < 1) { const st = streaks(it.polys, Math.max(26, (b.y1 - b.y0) * 0.22), GANG + Math.PI / 2 + 0.3, 900 + idx, 260), [x, y] = streakTip(st, q), rr = st.w / 2; c.save(); c.setTransform(k, 0, 0, k, 0, 0); c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 2.6; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.stroke(); c.strokeStyle = UI; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.moveTo(x, y - 5); c.lineTo(x, y + 5); c.stroke(); c.restore(); }
};
const penTool = (c: Ctx, it: Item, q: number) => {
  const tot = it.polys.length, per = 1 / tot; c.save(); c.lineWidth = 1.4; c.strokeStyle = UI; c.lineJoin = "round";
  it.polys.forEach((poly, i) => {
    const qi = clamp((q - i * per) / per); if (qi <= 0 || poly.length < 2) return;
    const drawn = cut([...poly, poly[0]], qi); c.beginPath(); drawn.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    const an = it.anchors[i] ?? [], na = Math.min(an.length, Math.ceil(qi * an.length + 1e-9));
    for (let j = 0; j < na; j++) { const [x, y] = an[j]; c.fillStyle = j === na - 1 && qi < 1 ? UI : "#ffffff"; c.fillRect(x - 3.5, y - 3.5, 7, 7); c.strokeRect(x - 3.5, y - 3.5, 7, 7); }
  });
  c.restore();
};
export const flatVectorLook = (ctx: Ctx, f: number, env: Env) => {
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  const tl = items(), drawing: [Item, number][] = [], fin = f >= N - 30;
  tl.forEach((it, i) => {
    const q = fin || f >= it.t1 ? 1 : f <= it.t0 ? 0 : (f - it.t0) / (it.t1 - it.t0);
    if (q < 1) { if (q > 0) drawing.push([it, q]); return; }
    if (it.shadow) { const g = ctx.createLinearGradient(it.s.box[0], it.s.box[3], it.s.box[2] + (it.s.box[3] - it.s.box[1]) * 1.2, it.s.box[3]); g.addColorStop(0, `rgba(${NAVY_RGB},0.28)`); g.addColorStop(1, `rgba(${NAVY_RGB},0)`); ctx.fillStyle = g; path(ctx, [it.shadow]); ctx.fill(); }
    ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
    if (it.s.grad) { const [x0, y0, x1, y1] = it.s.box, g = ctx.createLinearGradient(x0 + it.s.grad.x1 * (x1 - x0), y0 + it.s.grad.y1 * (y1 - y0), x0 + it.s.grad.x2 * (x1 - x0), y0 + it.s.grad.y2 * (y1 - y0)); it.s.grad.stops.forEach(([o, c]) => g.addColorStop(clamp(o), hex(c))); ctx.fillStyle = g; } else ctx.fillStyle = it.fill;
    path(ctx, it.polys); ctx.fill(it.s.rule);
    if (it.grain) { const gq = fin || f >= it.g1 ? 1 : f <= it.g0 ? 0 : (f - it.g0) / (it.g1 - it.g0); if (gq > 0) grain(ctx, env, it, gq, i); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); }
  });
  // thin things: a flat filled ribbon each (a vector stroke expanded), after the shapes
  const lq = clamp((f - 226) / 6); if (lq > 0 || fin) { ctx.lineCap = "round"; ctx.lineJoin = "round"; scene().filter((s) => !s.fill).forEach((s) => { ctx.strokeStyle = hex(s.stroke!); ctx.lineWidth = Math.max(1.5, s.sw); ctx.globalAlpha = fin ? 1 : lq; s.poly.forEach((q) => { ctx.beginPath(); q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }); }); ctx.globalAlpha = 1; }
  drawing.forEach(([it, q]) => penTool(ctx, it, q));
};
