// halftone: a scene printed as a newspaper photograph the way the bundled halftone film prints its
// viaduct (anidoodle halftoneKit.ts with halftone.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the AM
// screen with dot gain, the ink-spread plate, newsprint and the starve mottle are the kit's; the make-ready
// sheets, ink keys across the width and the spot coming into register are ported from the film). Black on
// a 45 degree screen plus one warm orange spot at 15 degrees on unbleached groundwood newsprint: the press
// comes up to colour sheet by sheet, the spot alone and blotchy first, then the black over it, the spot
// nudged into register, and the last sheet is the approved print. The black is the scene's tone; the spot
// is where the scene is warm.
import { type Ctx, type Env, type Layer, type P } from "../core";
import { clamp, newsprint, plateLayer, screenDots, starve } from "../halftoneKit";
import { W, H, toneField, raster } from "../sceneKit";

const BLACK = "#1d1a17", SPOT = "#e86a2c", PITCH = 5.2, ANG_K = 45, ANG_S = 15, GAIN_K = 0.42, GAIN_S = 0.3, FAN = 0.0016, KEYS = 12;
const REG_FINAL: P = [1.2, 1.6], REG_START: P = [9, -7];
const BEAT = 15, CUE = { firstSheet: 6, blackOn: 96, register: 186, lastSheet: 246 }, SLIDE = 6, SHEETS = (CUE.lastSheet - CUE.firstSheet) / BEAT + 1;
const cache = new Map<string, unknown>();
const photo = () => ({ x0: Math.round(W * 0.045), y0: Math.round(H * 0.045), x1: Math.round(W * 0.955), y1: Math.round(H * 0.955) });
const plates = (env: Env) => (cache.get("plates") as { k: Layer; s: Layer } | undefined) ?? (() => {
  const r = raster(env), T = toneField(env), b = photo(), inside = (x: number, y: number) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
  const at = (x: number, y: number) => Math.max(0, Math.min(r.h - 1, Math.floor(y * r.R))) * r.w + Math.max(0, Math.min(r.w - 1, Math.floor(x * r.R)));
  // black: the scene's tone, a touch lighter for newsprint; spot: how warm the scene is there
  const k = (x: number, y: number) => (inside(x, y) ? Math.pow(T[at(x, y)], 1.15) * 0.92 : 0);
  const s = (x: number, y: number) => { if (!inside(x, y)) return 0; const p = at(x, y) * 4, R = r.rgb[p], G = r.rgb[p + 1], B = r.rgb[p + 2]; return clamp(((R - B) / 255) * 1.6 + ((G - B) / 255) * 0.3) * 0.85; };
  const v = { k: plateLayer(env, `scene-halftone:k:${W}x${H}`, screenDots(b, PITCH, ANG_K, k, GAIN_K), BLACK, 0.9, 7), s: plateLayer(env, `scene-halftone:s:${W}x${H}`, screenDots(b, PITCH, ANG_S, s, GAIN_S, FAN), SPOT, 0.8, 11) };
  cache.set("plates", v); return v;
})();
type Sheet = { spot: (x: number) => number; black: (x: number) => number; reg: P; seed: number };
const hash = (a: number, b: number) => Math.abs(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1;
const across = (level: number, seed: number) => (x: number) => { if (level >= 1) return 1; if (level <= 0) return 0; const f = x * (KEYS - 1), i = Math.floor(f), t = f - i, e = (1 - Math.cos(t * Math.PI)) / 2, key = (z: number) => clamp(level * 1.5 - hash(z, seed) * 0.6 - 0.1); return key(i) * (1 - e) + key(Math.min(KEYS - 1, i + 1)) * e; };
const I_BLACK = (CUE.blackOn - CUE.firstSheet) / BEAT, I_REG = (CUE.register - CUE.firstSheet) / BEAT;
const sheet = (i: number): Sheet => {
  const done = i >= SHEETS - 1, lS = done ? 1 : Math.min(1, (i + 1) / I_BLACK) * (i >= I_BLACK + 2 ? 2 : 1), lK = done ? 1 : i < I_BLACK ? 0 : Math.min(1, (i - I_BLACK + 1) / (I_REG - I_BLACK)) * (i >= I_REG ? 2 : 1);
  const nudge = clamp((i - I_REG) / (SHEETS - 1 - I_REG)), reg: P = [REG_START[0] + (REG_FINAL[0] - REG_START[0]) * nudge, REG_START[1] + (REG_FINAL[1] - REG_START[1]) * nudge];
  return { spot: across(lS, 3 + (i % 3)), black: across(lK, 7 + (i % 2)), reg, seed: i };
};
const STRIPS = 54;
const printSheet = (env: Env, i: number): Layer => {
  const key = `sheet:${i}`; let L = cache.get(key) as Layer | undefined; if (L) return L;
  for (const ck of [...cache.keys()]) if (ck.startsWith("sheet:")) { const n = Number(ck.split(":")[1]); if (n < i - 1 || n > i + 1) cache.delete(ck); }
  const k = env.scale, DW = Math.round(W * k), DH = Math.round(H * k);
  L = env.canvas(DW, DH); const c = L.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(newsprint(env, `scene-halftone:paper:${W}x${H}@${k}`).canvas as CanvasImageSource, 0, 0);
  if (i < 0) { cache.set(key, L); return L; }
  const sh = sheet(i), Pl = plates(env), tmp = (cache.get("tmp") as Layer | undefined) ?? (() => { const t = env.canvas(DW, DH); cache.set("tmp", t); return t; })();
  const ink = (plate: Layer, dens: (x: number) => number, off: P, seed: number) => {
    const sw = W / STRIPS, d = Array.from({ length: STRIPS }, (_, z) => dens((z + 0.5) / STRIPS)); if (d.every((v) => v <= 0)) return;
    const t = tmp.ctx; t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = "copy"; t.drawImage(plate.canvas as CanvasImageSource, Math.round(off[0] * k), Math.round(off[1] * k)); t.globalCompositeOperation = "source-over";
    const sft: P = [hash(seed, 1) * 256, hash(seed, 2) * 256];
    d.forEach((v, z) => { if (v < 1) starve(t, env, [z * sw, 0, (z + 1) * sw, H], 1 - v * 0.9, sft); });
    c.save(); c.globalCompositeOperation = "multiply";
    d.forEach((v, z) => { if (v <= 0) return; const x0 = Math.floor(z * sw * k), x1 = z === STRIPS - 1 ? DW : Math.floor((z + 1) * sw * k); c.globalAlpha = v >= 1 ? 1 : 0.3 + 0.7 * v; c.drawImage(tmp.canvas as CanvasImageSource, x0, 0, x1 - x0, DH, x0, 0, x1 - x0, DH); });
    c.restore();
  };
  ink(Pl.s, sh.spot, sh.reg, sh.seed * 2 + 1);
  ink(Pl.k, sh.black, [0, 0], sh.seed * 2 + 2);
  cache.set(key, L); return L;
};
export const halftoneLook = (ctx: Ctx, f: number, env: Env) => {
  const k = env.scale, DW = Math.round(W * k), DH = Math.round(H * k);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const n = f < CUE.firstSheet ? -1 : Math.min(SHEETS - 1, Math.floor((f - CUE.firstSheet) / BEAT)), t0 = CUE.firstSheet + n * BEAT, u = n < 0 ? 1 : clamp((f - t0) / SLIDE);
  if (f >= CUE.lastSheet + SLIDE || u >= 1) { ctx.drawImage(printSheet(env, n).canvas as CanvasImageSource, 0, 0); return; }
  ctx.drawImage(printSheet(env, n - 1).canvas as CanvasImageSource, 0, 0);
  const e = 1 - Math.pow(1 - u, 3), y = Math.round(-DH * (1 - e));
  const sg = ctx.createLinearGradient(0, y + DH, 0, y + DH + 26 * k); sg.addColorStop(0, "rgba(30,25,20,0.32)"); sg.addColorStop(1, "rgba(30,25,20,0)");
  ctx.fillStyle = sg; ctx.fillRect(0, y + DH, DW, 26 * k);
  ctx.drawImage(printSheet(env, n).canvas as CanvasImageSource, 0, y);
};
