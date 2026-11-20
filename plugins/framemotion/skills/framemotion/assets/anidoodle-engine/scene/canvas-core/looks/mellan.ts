// single-line-engraving: a scene as ONE engraved spiral, unspooled the way the bundled Mellan film
// unspools its moon (anidoodle mellan.ts and mellanUnspool.ts, Apache-2.0, Copyright 2026 Alex Greenshpun;
// the walk of the Archimedean spiral into one ribbon whose width is the tone below, the plate and its
// mark, and the camera carried out by the burin are ported from there). After Claude Mellan's 1649
// Sudarium: one unbroken line from the centre whose weight alone makes the picture, swelling where the
// plate should print dark, running to a hair where it should be light. The tone is the scene's.
import { type Ctx, type Env, type P } from "../core";
import { clamp } from "../gallery";
import { W, H, toneField, raster } from "../sceneKit";

const C: P = [W / 2, H / 2], PLATE = Math.round(Math.min(W, H) * 0.043), PITCH = 6.2, INKC = "#17130f", PAPER = "#f2ead8", A = PITCH / (Math.PI * 2);
type Ribbon = { L: P[]; R: P[]; th: number[]; base: number[] };
const cache = new Map<string, unknown>();
const tone = (env: Env, x: number, y: number) => { const r = raster(env), T = toneField(env); return x < 0 || y < 0 || x >= W || y >= H ? 0 : T[Math.floor(y * r.R) * r.w + Math.floor(x * r.R)]; };
const walk = (env: Env, maxStep: number): Ribbon => {
  const rMax = Math.hypot(W / 2, H / 2) + PITCH, thMax = rMax / A, L: P[] = [], R: P[] = [], ths: number[] = [], base: number[] = [];
  let th = 0.6;
  while (th < thMax) {
    const step = 1.4 / Math.max(A * th, 1.4), m = Math.max(1, Math.ceil(step / maxStep));
    for (let j = 0; j < m; j++) {
      if (!j) base.push(L.length);
      const t = j ? th + (step * j) / m : th, r = A * t, x = C[0] + Math.cos(t) * r, y = C[1] + Math.sin(t) * r;
      const dark = tone(env, x, y), grow = Math.min(1, r / 40), w = PITCH * (0.05 + 0.86 * dark) * grow / 2;
      const tx = -Math.sin(t) * r + Math.cos(t) * A, ty = Math.cos(t) * r + Math.sin(t) * A, tl = Math.hypot(tx, ty), nx = ty / tl, ny = -tx / tl;
      L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]); ths.push(t);
    }
    th += step;
  }
  return { L, R, th: ths, base };
};
const ribbon = (env: Env, maxStep: number) => (cache.get("rb" + maxStep) as Ribbon | undefined) ?? (() => { const r = walk(env, maxStep); cache.set("rb" + maxStep, r); return r; })();
const outline = (rb: Ribbon, k: number): P[] => [...rb.L.slice(0, k), ...rb.R.slice(0, k).reverse()];
const stillOutline = (rb: Ribbon): P[] => [...rb.base.map((i) => rb.L[i]), ...rb.base.map((i) => rb.R[i]).reverse()];
const printPlate = (ctx: Ctx, env: Env, rib: P[] | null, zoom = 1) => {
  const s = env.scale * zoom;
  ctx.setTransform(s, 0, 0, s, (1 - zoom) * C[0] * env.scale, (1 - zoom) * C[1] * env.scale);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(PLATE, PLATE, W - 2 * PLATE, H - 2 * PLATE); ctx.clip();
  if (rib) { ctx.fillStyle = INKC; ctx.beginPath(); rib.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = "rgba(60,45,30,0.28)"; ctx.lineWidth = 2; ctx.strokeRect(PLATE - 6, PLATE - 6, W - 2 * PLATE + 12, H - 2 * PLATE + 12);
  ctx.strokeStyle = "rgba(255,252,240,0.7)"; ctx.lineWidth = 1.2; ctx.strokeRect(PLATE - 7.5, PLATE - 7.5, W - 2 * PLATE + 12, H - 2 * PLATE + 12);
};
// the unspooling: paced by the spiral's angle, the camera opening close on the centre and pulled back with the tip
const NF = 264, FINE = 0.02, V0 = 9, K = 1.3, HALF = Math.max(W, H) / 2, KNEE = HALF * 0.24, R_LAST = Math.hypot(W / 2 - PLATE, H / 2 - PLATE) + PITCH;
const speed = (u: number) => 0.12 + u ** 1.7;
const clock = (() => { const th0 = 0.6, th1 = R_LAST / A, out = [0]; let acc = 0; const inc: number[] = []; for (let f = 1; f < NF; f++) { acc += speed((f - 1) / (NF - 2)); inc.push(acc); } inc.forEach((a) => out.push(th0 + ((th1 - th0) * a) / acc)); return out; })();
const view = (r: number) => { const raw = V0 + K * r; if (raw <= HALF - KNEE) return raw; if (raw >= HALF + KNEE) return HALF; const d = raw - (HALF - KNEE); return raw - (d * d) / (4 * KNEE); };
export const mellanLook = (ctx: Ctx, f: number, env: Env) => {
  if (f >= NF - 1) return printPlate(ctx, env, stillOutline(ribbon(env, Infinity)), 1);
  const rb = ribbon(env, FINE), th = clock[Math.max(2, f)], n = rb.th.length;
  let lo = 0, hi = n - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (rb.th[m] < th) lo = m + 1; else hi = m; }
  printPlate(ctx, env, outline(rb, Math.max(2, lo + 1)), clamp(HALF / view(A * th), 1, 1e3));
};
