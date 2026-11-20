// stipple: a scene in pen-and-ink stipple, made the way the bundled stipple film makes its nautilus
// (anidoodle stipple.ts, Apache-2.0, Copyright 2026 Alex Greenshpun; the weighted blue-noise dot field,
// the passes from dark to light worked patch by patch, the slightly oval ragged dot, the dry nib, the
// checkpointed replay and the sheet are ported from there). One 0.25 mm technical pen dotted straight down
// onto hot-press bristol; nothing is drawn with a line: every tone is the number of dots, every edge only
// where that number changes. The tone is the scene's (sceneKit toneField): its value, each thing turned
// to the light, its cast shadow, stretched so the lightest thing is bare paper.
import { Gfx, PENCIL, rng, type Ctx, type Env } from "../core";
import { W, H, toneField, raster } from "../sceneKit";

const PASSES = 6, DONE = 266, INK = "#15120e", PAPER = "#fbfaf5", DOT = 1.22;
type Dot = { x: number; y: number; t: number; pass: number; key: number };
type Stip = { dots: Dot[]; shape: Float32Array; alpha: Uint8Array; start: number[] };
const cache = new Map<string, unknown>();

const build = (env: Env): Stip => {
  let S = cache.get("dots") as Stip | undefined; if (S) return S;
  const r0 = raster(env), T = toneField(env), at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : Math.pow(T[Math.floor(y * r0.R) * r0.w + Math.floor(x * r0.R)], 1.45));   // a pen-and-ink plate is mostly paper: the mid tones lightened
  const MIN_T = 0.022, spacing = (t: number) => 1.5 / Math.pow(Math.max(t, MIN_T), 0.64);
  const cell = 1.35, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell), grid = new Int32Array(gw * gh).fill(-1);
  const xs: number[] = [], ys: number[] = [], rs: number[] = [], r = rng(20260925);
  const ok = (x: number, y: number, d: number) => {
    const reach = Math.ceil((d * 1.25) / cell), gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    for (let j = Math.max(0, gy - reach); j <= Math.min(gh - 1, gy + reach); j++) for (let i = Math.max(0, gx - reach); i <= Math.min(gw - 1, gx + reach); i++) { const k = grid[j * gw + i]; if (k < 0) continue; const dx = xs[k] - x, dy = ys[k] - y, m = 0.5 * (d + rs[k]); if (dx * dx + dy * dy < m * m) return false; }
    return true;
  };
  const add = (x: number, y: number, d: number) => { const k = xs.length; xs.push(x); ys.push(y); rs.push(d); grid[Math.floor(y / cell) * gw + Math.floor(x / cell)] = k; return k; };
  const grow = (k0: number) => {
    const active = [k0];
    while (active.length) {
      const ai = Math.floor(r() * active.length), k = active[ai]; let found = false;
      for (let n = 0; n < 18; n++) { const a = r() * Math.PI * 2, d0 = rs[k], rr = d0 * (1 + r()), x = xs[k] + Math.cos(a) * rr, y = ys[k] + Math.sin(a) * rr; if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue; const t = at(x, y); if (t < MIN_T) continue; const d = spacing(t); if (!ok(x, y, d)) continue; active.push(add(x, y, d)); found = true; }
      if (!found) { active[ai] = active[active.length - 1]; active.pop(); }
    }
  };
  for (let y = 3; y < H; y += 7) for (let x = 3; x < W; x += 7) { const px = x + (r() - 0.5) * 5, py = y + (r() - 0.5) * 5, t = at(px, py); if (t < MIN_T) continue; const d = spacing(t); if (ok(px, py, d)) grow(add(px, py, d)); }
  const PATCH = 84, dots: Dot[] = xs.map((x, i) => { const t = at(x, ys[i]), u = r(); return { x, y: ys[i], t, pass: 0, key: (1 - t) + 0.42 * u }; });
  let lo = 1e9, hi = -1e9; dots.forEach((d) => { lo = Math.min(lo, d.key); hi = Math.max(hi, d.key); });
  dots.forEach((d) => { d.pass = Math.min(PASSES - 1, Math.floor(((d.key - lo) / (hi - lo + 1e-9)) ** 1.25 * PASSES)); });
  const patchOf = (d: Dot) => { const py = Math.floor(d.y / PATCH), px0 = Math.floor(d.x / PATCH), px = py % 2 ? 100 - px0 : px0; return py * 128 + px; };
  dots.sort((a, b) => a.pass - b.pass || patchOf(a) - patchOf(b) || a.key - b.key);
  const start: number[] = []; for (let p = 0, i = 0; p <= PASSES; p++) { while (i < dots.length && dots[i].pass < p) i++; start.push(i); }
  const V = 7, shape = new Float32Array(dots.length * V * 2), alpha = new Uint8Array(dots.length), tilt = -0.62;
  dots.forEach((d, i) => {
    const s = rng(i * 7919 + 17), rad = DOT * (0.9 + s() * 0.24), el = 1.06 + s() * 0.12, ph = s() * 6.283, h2 = s() * 0.1, h3 = s() * 0.08, tail = s() < 0.035;
    alpha[i] = s() < 0.04 ? 150 : 236 + Math.floor(s() * 19);
    for (let v = 0; v < V; v++) { const a = (v / V) * Math.PI * 2, k = 1 + h2 * Math.sin(2 * a + ph) + h3 * Math.sin(3 * a + ph * 1.7); let ex = Math.cos(a) * rad * el * k, ey = Math.sin(a) * rad * k; if (tail && v === 0) ex *= 1.9; shape[(i * V + v) * 2] = d.x + ex * Math.cos(tilt) - ey * Math.sin(tilt); shape[(i * V + v) * 2 + 1] = d.y + ex * Math.sin(tilt) + ey * Math.cos(tilt); }
  });
  S = { dots, shape, alpha, start }; cache.set("dots", S);
  return S;
};
const countAt = (S: Stip, f: number): number => {
  if (f >= DONE) return S.dots.length;
  const counts = Array.from({ length: PASSES }, (_, p) => S.start[p + 1] - S.start[p]), total = counts.reduce((a, b) => a + b, 0) || 1, A = 1, span = DONE - A;
  let f0 = A, n = 0;
  counts.forEach((c) => { const len = Math.max(12, Math.round(((span - 12 * PASSES) * c) / total) + 12), a = f0, b = f0 + len, u = Math.max(0, Math.min(1, (f - a) / (b - a))), e = u < 1 ? u * u * (3 - 2 * u) * 0.35 + u * 0.65 : 1; n += Math.floor(c * e); f0 = b; });
  return n;
};
const CHUNK = 600;
const inkRange = (ctx: Ctx, S: Stip, from: number, n: number) => {
  const V = 7, fillRange = (a: number, b: number, cls: number) => {
    const pk = `path:${a}:${b}:${cls}`; let path = cache.get(pk) as Path2D | undefined;
    if (!path) { path = new Path2D(); for (let i = a; i < b; i++) { if ((S.alpha[i] < 200 ? 1 : 0) !== cls) continue; const o = i * V * 2; path.moveTo(S.shape[o], S.shape[o + 1]); for (let v = 1; v < V; v++) path.lineTo(S.shape[o + v * 2], S.shape[o + v * 2 + 1]); path.closePath(); } if (b - a === CHUNK) cache.set(pk, path); }
    ctx.globalAlpha = cls ? 0.6 : 0.95; ctx.fill(path);
  };
  ctx.fillStyle = INK;
  for (let a = from; a < n; a += CHUNK) { const b = Math.min(n, a + CHUNK); fillRange(a, b, 0); fillRange(a, b, 1); }
  ctx.globalAlpha = 1;
};
const sheet = (ctx: Ctx, env: Env) => { ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); };
const tooth = (ctx: Ctx, env: Env) => { new Gfx(ctx, env, 0, PENCIL).paper("paper", 0.05); };
export const stippleLook = (ctx: Ctx, frame: number, env: Env) => {
  const S = build(env), n = countAt(S, frame), DW = Math.round(W * env.scale), DH = Math.round(H * env.scale);
  if (n >= S.dots.length) {
    let L = cache.get("final") as ReturnType<Env["canvas"]> | undefined;
    if (!L) { L = env.canvas(DW, DH); sheet(L.ctx, env); inkRange(L.ctx, S, 0, n); tooth(L.ctx, env); cache.set("final", L); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(L.canvas as CanvasImageSource, 0, 0); return;
  }
  const CK = 4800, c = Math.floor(n / CK) * CK, layer = (m: number): ReturnType<Env["canvas"]> => {
    let L = cache.get(`ck:${m}`) as ReturnType<Env["canvas"]> | undefined; if (L) return L;
    L = env.canvas(DW, DH); const lc = L.ctx; lc.setTransform(1, 0, 0, 1, 0, 0);
    if (m > CK) lc.drawImage(layer(m - CK).canvas as CanvasImageSource, 0, 0);
    lc.setTransform(env.scale, 0, 0, env.scale, 0, 0); inkRange(lc, S, m - CK, m); cache.set(`ck:${m}`, L); return L;
  };
  sheet(ctx, env);
  if (c > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(layer(c).canvas as CanvasImageSource, 0, 0); ctx.restore(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); }
  inkRange(ctx, S, c, n); tooth(ctx, env);
};
