// scratchboard: a scene scraped out of a black board the way the bundled scratchboard film scrapes its
// lynx (anidoodle scratchboard.ts, Apache-2.0, Copyright 2026 Alex Greenshpun; the contour highlights, the
// tone-weighted Poisson seeds each cut as a tapered flick along the lie of the form, the crossing cuts for
// the mid tones, the knife's ribbon, the checkpointed replay and the chipped clay edge are ported from
// there). White china clay under black ink: nothing is added, every mark is ink scraped away, widest where
// the knife bites in, tapering as it lifts. First the edges the light catches, then a sparse layer of cuts
// to set each form's direction, then the mid tones, the crossing cuts, the lights until they close up.
import { Gfx, PENCIL, fractal, rng, sample, type Ctx, type Env, type Layer, type P } from "../core";
import { W, H, scene, outlineOf, sizeOf, toneField, raster, idAt, type Shape } from "../sceneKit";

const BOARD = "#0c0b0a", CLAY = "#ebe5d8", TAU = Math.PI * 2, clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
type Cut = { pts: P[]; w: number[]; t0: number; t1: number; alpha: number };
const LX = -0.6, LY = -0.8;   // to the light: upper left
const cache = new Map<string, unknown>();

// the fields: light (1 - the scene's tone), and the lie of each thing (along its long side, a slow swirl in a backdrop)
const fields = (env: Env) => {
  const r0 = raster(env), T = toneField(env), list = scene();
  const angOf = list.map((s) => { if (s.big) return 0.04; const w = s.box[2] - s.box[0], h = s.box[3] - s.box[1]; return (w >= h ? 0.25 : 1.35) + (rng(s.i)() - 0.5) * 0.4; });
  const light = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : Math.pow(1 - T[Math.floor(y) * r0.w + Math.floor(x)], 1.6));   // a scratchboard is mostly board: the knife only goes where the light is
  const dir = (x: number, y: number): P => { const id = idAt(r0, x, y), a = (id >= 0 ? angOf[id] : 0) + (fractal(31 + id, x, y, 0.006, 0.006, 2) - 0.5) * (id >= 0 && list[id].big ? 0.9 : 0.6); return [Math.cos(a), Math.sin(a)]; };
  const len = (x: number, y: number) => { const id = idAt(r0, x, y); return id < 0 ? 10 : Math.max(5, Math.min(26, sizeOf(list[id]) * 0.12)); };
  return { light, dir, len, id: (x: number, y: number) => idAt(r0, x, y) };
};
const taper = (n: number, w0: number, a = 0.12, b = 0.75) => Array.from({ length: n }, (_, i) => { const t = n > 1 ? i / (n - 1) : 0; return w0 * Math.sqrt(clamp(t / a)) * Math.pow(clamp((1 - t) / b), 0.8) + 0.05; });

const buildCuts = (env: Env): Cut[] => {
  let C = cache.get("cuts") as Cut[] | undefined; if (C) return C;
  const fa = fields(env), r = rng(4711), cuts: { c: Cut; phase: number }[] = [], list = scene();
  // 1 CONTOUR HIGHLIGHTS: just inside each thing's edge where it faces the light, a knife line in short runs
  list.forEach((s: Shape) => {
    if (!s.fill || s.big) return;
    const st = sample(outlineOf(s).filter((_, i, a) => i % 3 === 0 || i === a.length - 1), true, 3), n = st.length, area = st.reduce((a, p, i) => a + p[0] * st[(i + 1) % n][1] - st[(i + 1) % n][0] * p[1], 0), out = area > 0 ? 1 : -1;
    let run: P[] = [], fs: number[] = [];
    const flush = () => { if (run.length > 6) { let i = 0; while (i < run.length - 3) { const m = Math.min(run.length - i, 6 + Math.floor(r() * 9)), seg = run.slice(i, i + m), fav = fs.slice(i, i + m).reduce((a, b) => a + b, 0) / m; cuts.push({ c: { pts: seg, w: taper(seg.length, 1.8 * (0.6 + 0.6 * fav), 0.2, 0.4), t0: 0, t1: 0, alpha: 0.97 }, phase: 0 }); i += m - 1 - (r() < 0.5 ? 1 : 0); } } run = []; fs = []; };
    st.forEach((p, i) => { const a = st[(i - 1 + n) % n], b = st[(i + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = (ty / l) * out, ny = (-tx / l) * out, f = nx * LX + ny * LY, q: P = [p[0] - nx * 2.5 + (r() - 0.5), p[1] - ny * 2.5 + (r() - 0.5)]; if (f > 0.1 && fa.id(q[0], q[1]) === s.i) { run.push(q); fs.push(f); } else flush(); });
    flush();
  });
  list.filter((s) => !s.fill).forEach((s) => s.poly.forEach((p) => { const pts = sample(p.filter((_, i, a) => i % 3 === 0 || i === a.length - 1), false, 3); if (pts.length > 1) cuts.push({ c: { pts, w: taper(pts.length, Math.max(1, Math.min(3.5, s.sw * 0.45)) * (0.4 + fa.light(pts[0][0], pts[0][1])), 0.1, 0.8), t0: 0, t1: 0, alpha: 0.95 }, phase: 0 }); }));
  // 2 THE COAT: tone-weighted Poisson seeds, each a flick along the lie of its form
  const cell = 1.3, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell), grid = new Int32Array(gw * gh).fill(-1), xs: number[] = [], ys: number[] = [], ds: number[] = [];
  const wOf = (t: number) => (t < 0.03 ? 0 : 0.34 + 2.3 * Math.pow(t, 1.6));
  const spacing = (x: number, y: number) => { const t = fa.light(x, y); if (t < 0.06) return 0; const L = Math.max(4, fa.len(x, y)), area = L * wOf(t) * 0.5, cov = Math.pow(t, 1.15) * (0.85 + 0.5 * t * t); return clamp(Math.sqrt((0.9 * area) / cov), 1.9, 26); };
  const ok = (x: number, y: number, d: number) => { const reach = Math.ceil((d * 1.2) / cell), gx = Math.floor(x / cell), gy = Math.floor(y / cell); for (let j = Math.max(0, gy - reach); j <= Math.min(gh - 1, gy + reach); j++) for (let i = Math.max(0, gx - reach); i <= Math.min(gw - 1, gx + reach); i++) { const q = grid[j * gw + i]; if (q < 0) continue; const dx = xs[q] - x, dy = ys[q] - y, m = 0.5 * (d + ds[q]); if (dx * dx + dy * dy < m * m) return false; } return true; };
  const add = (x: number, y: number, d: number) => { const q = xs.length; xs.push(x); ys.push(y); ds.push(d); grid[Math.floor(y / cell) * gw + Math.floor(x / cell)] = q; return q; };
  const grow = (q0: number) => { const act = [q0]; while (act.length) { const ai = Math.floor(r() * act.length), q = act[ai]; let found = false; for (let t = 0; t < 16; t++) { const a = r() * TAU, rr = ds[q] * (1 + r()), x = xs[q] + Math.cos(a) * rr, y = ys[q] + Math.sin(a) * rr; if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue; const d = spacing(x, y); if (!d || !ok(x, y, d)) continue; act.push(add(x, y, d)); found = true; } if (!found) { act[ai] = act[act.length - 1]; act.pop(); } } };
  for (let y = 4; y < H; y += 9) for (let x = 4; x < W; x += 9) { const px = x + (r() - 0.5) * 6, py = y + (r() - 0.5) * 6, d = spacing(px, py); if (d && ok(px, py, d)) grow(add(px, py, d)); }
  const flick = (x0: number, y0: number, L: number, bend: number, dev: number): P[] => { const pts: P[] = [[x0, y0]], id0 = fa.id(x0, y0); let x = x0, y = y0, s = 0; const step = Math.max(1.2, L / 14); while (s < L) { const [dx, dy] = fa.dir(x, y), a = Math.atan2(dy, dx) + dev + bend * (s / L); x += Math.cos(a) * step; y += Math.sin(a) * step; s += step; if (fa.id(x, y) !== id0) break; pts.push([x, y]); } return pts; };
  xs.forEach((x, i) => {
    const y = ys[i], t = fa.light(x, y), L = Math.max(4, fa.len(x, y)) * (0.7 + r() * 0.6), rank = r(), pts = flick(x, y, L, (r() - 0.5) * 0.5, (r() - 0.5) * 0.24); if (pts.length < 2) return;
    const tp = taper(pts.length, 1), w = pts.map((p, j) => tp[j] * wOf(fa.light(p[0], p[1])));
    cuts.push({ c: { pts, w, t0: 0, t1: 0, alpha: 0.9 + 0.08 * r() }, phase: rank < 0.34 ? 1 : t < 0.5 ? 2 : 4 });
    const mid = clamp(1 - Math.abs(t - 0.38) / 0.22);   // 3 CROSS-HATCH for the mid tones
    if (mid > 0 && r() < 0.6 * mid) { const [dx, dy] = fa.dir(x, y), a = Math.atan2(dy, dx) + (r() < 0.5 ? 0.62 : -0.62), l = L * 0.5, cx = x + dx * L * 0.3, cy = y + dy * L * 0.3; cuts.push({ c: { pts: [[cx - Math.cos(a) * l / 2, cy - Math.sin(a) * l / 2], [cx, cy], [cx + Math.cos(a) * l / 2, cy + Math.sin(a) * l / 2]], w: taper(3, 0.75 * wOf(t), 0.2, 0.6), t0: 0, t1: 0, alpha: 0.85 }, phase: 3 }); }
  });
  const win: [number, number][] = [[2, 60], [60, 140], [140, 190], [190, 222], [222, 264]], PATCH = 90, patch = (p: P) => { const py = Math.floor(p[1] / PATCH), px0 = Math.floor(p[0] / PATCH); return py * 64 + (py % 2 ? 63 - px0 : px0); };
  for (let ph = 0; ph < win.length; ph++) {
    const l = cuts.filter((c) => c.phase === ph); if (!l.length) continue;
    const [a, b] = win[ph];
    if (ph === 0) { const cost = l.map((c) => { let s = 0; for (let i = 1; i < c.c.pts.length; i++) s += Math.hypot(c.c.pts[i][0] - c.c.pts[i - 1][0], c.c.pts[i][1] - c.c.pts[i - 1][1]); return 1.5 + Math.pow(s, 0.7); }), tot = cost.reduce((x, y) => x + y, 0); let t = a; l.forEach((c, i) => { const d = ((b - a) * cost[i]) / tot; c.c.t0 = t; c.c.t1 = t + Math.max(d, 0.5); t += d; }); }
    else { l.sort((p, q) => patch(p.c.pts[0]) - patch(q.c.pts[0]) || p.c.pts[0][1] - q.c.pts[0][1]); l.forEach((c, i) => { const f = a + ((b - a) * (i + 1)) / l.length; c.c.t0 = f - 1; c.c.t1 = f; }); }
  }
  C = cuts.map((c) => c.c).sort((x, y) => x.t1 - y.t1); cache.set("cuts", C);
  return C;
};
const ribbon = (c0: Cut, prog = 1): P[] => {
  let c = c0;
  if (prog < 1) { const n0 = c0.pts.length, u = (n0 - 1) * prog, i = Math.floor(u), f = u - i, a = c0.pts[i], b = c0.pts[Math.min(n0 - 1, i + 1)]; c = { ...c0, pts: [...c0.pts.slice(0, i + 1), [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]], w: [...c0.w.slice(0, i + 1), c0.w[Math.min(n0 - 1, i + 1)] ?? 0.5] }; }
  const n = c.pts.length, L: P[] = [], R: P[] = [];
  for (let i = 0; i < n; i++) { const a = c.pts[Math.max(0, i - 1)], b = c.pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = (c.w[i] ?? 0.5) / 2; L.push([c.pts[i][0] - (dy / l) * w, c.pts[i][1] + (dx / l) * w]); R.push([c.pts[i][0] + (dy / l) * w, c.pts[i][1] - (dx / l) * w]); }
  return [...L, ...R.reverse()];
};
const trace = (path: Path2D, pts: P[]) => { path.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]); path.closePath(); };
const CHUNK = 500;
const cutRange = (ctx: Ctx, C: Cut[], from: number, to: number) => {
  ctx.fillStyle = CLAY;
  for (let a = from; a < to; a += CHUNK) { const b = Math.min(to, a + CHUNK); for (const hi of [0, 1]) { const pk = `path:${a}:${b}:${hi}`; let path = cache.get(pk) as Path2D | undefined; if (!path) { path = new Path2D(); for (let i = a; i < b; i++) if ((C[i].alpha > 0.9 ? 1 : 0) === hi) trace(path, ribbon(C[i])); if (b - a === CHUNK) cache.set(pk, path); } ctx.globalAlpha = hi ? 0.97 : 0.8; ctx.fill(path); } }
  ctx.globalAlpha = 1;
};
const layerOf = (env: Env, key: string): Layer => { let L = cache.get(key) as Layer | undefined; if (!L) { L = env.canvas(Math.round(W * env.scale), Math.round(H * env.scale)); cache.set(key, L); } return L; };
export const scratchboardLook = (ctx: Ctx, frame: number, env: Env) => {
  const C = buildCuts(env), DW = Math.round(W * env.scale), DH = Math.round(H * env.scale), HOLD = 266, f = Math.min(frame, HOLD), done = f >= HOLD;
  if (done && cache.has("final")) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage((cache.get("final") as Layer).canvas as CanvasImageSource, 0, 0); return; }
  let lo = 0, hi = C.length; while (lo < hi) { const m = (lo + hi) >> 1; if (C[m].t1 <= f) lo = m + 1; else hi = m; }
  const n = done ? C.length : lo, CK = 4000, c = Math.floor(n / CK) * CK;
  const ck = (m: number): Layer => { let L = cache.get(`ck:${m}`) as Layer | undefined; if (L) return L; L = env.canvas(DW, DH); L.ctx.setTransform(1, 0, 0, 1, 0, 0); if (m > CK) L.ctx.drawImage(ck(m - CK).canvas as CanvasImageSource, 0, 0); L.ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); cutRange(L.ctx, C, m - CK, m); cache.set(`ck:${m}`, L); return L; };
  const S = layerOf(env, "work"), sc = S.ctx;
  sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = "source-over"; sc.globalAlpha = 1; sc.clearRect(0, 0, DW, DH);
  if (c > 0) sc.drawImage(ck(c).canvas as CanvasImageSource, 0, 0);
  sc.setTransform(env.scale, 0, 0, env.scale, 0, 0); cutRange(sc, C, c, n);
  if (!done) { sc.fillStyle = CLAY; for (let i = n; i < C.length && C[i].t0 < f; i++) { const p = (f - C[i].t0) / (C[i].t1 - C[i].t0); if (p <= 0) continue; const path = new Path2D(); trace(path, ribbon(C[i], p)); sc.globalAlpha = C[i].alpha > 0.9 ? 0.97 : 0.8; sc.fill(path); } sc.globalAlpha = 1; }
  const out = done ? layerOf(env, "final") : null, o = out ? out.ctx : ctx;
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = "source-over"; o.fillStyle = BOARD; o.fillRect(0, 0, DW, DH);
  o.globalAlpha = 0.55; o.drawImage(S.canvas as CanvasImageSource, 0, 0); o.globalAlpha = 1;
  new Gfx(sc, env, 0, PENCIL).tooth(S as never, "draftTooth", [0, 0, DW, DH]);
  o.drawImage(S.canvas as CanvasImageSource, 0, 0);
  if (out) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(out.canvas as CanvasImageSource, 0, 0); }
};
