// coloured-pencil: a scene drawn with the bundled coloured-pencil film's own kit (anidoodle
// colouredPencilKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: Sheet, hatch, contour). The replay
// is ported from the kit so the sheet keeps one scale in any frame shape (the kit's own replay maps a
// square design sheet onto the frame). Wax pencil on toothy cream paper: hatching in one diagonal laid
// in strips, a faint graphite lay-in, local colour light to dark with colour thickening toward each
// form's edge and a paler band on top (the light is above), a second hue over the shade side, darks
// cross-hatched, broken sepia contours heavier on the shade side, drawn last.
import { Gfx, PENCIL, fractal, type Ctx, type Env, type Layer } from "../core";
import { Sheet, contour, edgeDist, hatch, smoothstep, type Mark, type Pass } from "../colouredPencilKit";
import { mix } from "../gallery";
import { W, H, scene, shown, lit, fillOf, hex, sizeOf, outlineOf, areaOf, visibleRuns, type Shape } from "../sceneKit";

const ANG = -1.02, X2 = 0.22, PAPER = "#f3ecdc", LAY = "#8e8894", SEPIA = "#3e3134", INDIGO = "#3d467f", WARM = "#f1c47a";
// the original sheet is seen at 1.34x: strokes, gaps and lengths at that size
const Z = 1.3;
const lumOf = (s: Shape) => { const c = fillOf(s); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; };
const pencil = (s: Shape) => { const c = fillOf(s), l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return hex(c.map((v) => l + (v - l) * 1.15) as [number, number, number]); };

const build = (env: Env): Sheet => {
  const S = new Sheet(), list = scene(), things = list.filter((s) => s.fill && !s.big), backs = list.filter((s) => s.fill && s.big);
  // 1 · lay-in: faint graphite outlines of the things
  S.pass("lay", 0);
  things.forEach((s) => contour(S, outlineOf(s), { w: 1.0, col: LAY, a: 0.42, seed: 10 + s.i, closed: true, seg: 90 }));
  // 2 · the backdrop at light pressure, deeper toward its shade edge
  S.pass("ground", 1);
  backs.forEach((s) => { const L = lit(s); hatch(S, shown(env, s), { ang: ANG, gap: 2.4 * Z, len: 32 * Z, w: 1.5 * Z, col: pencil(s), a: 0.85, seed: 100 + s.i, dens: (x, y) => 0.72 + 0.28 * smoothstep(-0.6, 1, L.side(x, y)) }); });
  // 3 · local colour, thickening toward the edge of every form, a paler band on its top
  S.pass("local", 1);
  things.forEach((s) => {
    const L = lit(s), e = edgeDist(outlineOf(s)), k = Math.max(6, sizeOf(s) * 0.12), top = s.box[1] + (s.box[3] - s.box[1]) * 0.16;
    hatch(S, shown(env, s), { ang: ANG, gap: (sizeOf(s) < 40 ? 1.8 : 2.2) * Z, len: Math.min(30, 8 + sizeOf(s) * 0.25) * Z, w: 1.5 * Z, col: pencil(s), a: 1, seed: 200 + s.i,
      dens: (x, y) => 0.7 + 0.3 * smoothstep(k, 0, e(x, y)) + 0.2 * smoothstep(-0.4, 0.6, L.side(x, y)) - 0.3 * smoothstep(top, s.box[1], y) });
  });
  // 4 · a second hue over the first: cool over the shade side, warm where the light falls
  S.pass("layer", 1);
  list.filter((s) => s.fill).forEach((s) => {
    const L = lit(s), reg = shown(env, s), col = pencil(s);
    hatch(S, reg, { ang: ANG + 0.07, gap: 2.6 * Z, len: 24 * Z, w: 1.4 * Z, col: mix(col, INDIGO, 0.45), a: 0.6, seed: 300 + s.i, dens: (x, y) => smoothstep(0, 0.9, L.side(x, y)) * (s.big ? 0.6 : 0.85) });
    if (!s.big) hatch(S, reg, { ang: ANG + 0.25, gap: 3.2 * Z, len: 16 * Z, w: 1.3 * Z, col: mix(col, WARM, 0.5), a: 0.4, seed: 350 + s.i, dens: (x, y) => smoothstep(-0.2, -0.9, L.side(x, y)) * 0.6 });
  });
  // 5 · darks, cross-hatched in the second direction, never filled
  S.pass("darks", 2);
  list.filter((s) => s.fill).forEach((s) => {
    const L = lit(s), dk = mix(mix(pencil(s), "#262a3f", 0.55), INDIGO, 0.2);
    hatch(S, shown(env, s), { ang: X2, gap: 2.6 * Z, len: 20 * Z, w: 1.4 * Z, col: dk, a: 0.75, seed: 400 + s.i, dens: (x, y) => Math.max(smoothstep(0.5, 1.1, L.side(x, y)) * (s.big ? 0.6 : 0.9), lumOf(s) < 70 ? 0.85 : 0) });
  });
  // 6 · contours in sepia, broken, heavier on the shade side, lost where the light eats the edge; thin things as lines
  S.pass("line", 1);
  things.forEach((s) => { const L = lit(s); visibleRuns(env, s).forEach((run) => contour(S, run, { w: (areaOf(s) > 0.01 * W * H ? 1.5 : 1.2) * Z, col: SEPIA, a: 0.85, seed: 500 + s.i, closed: false, keep: (x, y) => L.side(x, y) > -0.55 })); });
  list.filter((s) => !s.fill).forEach((s) => s.poly.forEach((sub, j) => contour(S, sub, { w: Math.max(1.1, Math.min(4, s.sw * 0.4)), col: mix(hex(s.stroke!), SEPIA, 0.25), a: 0.9, seed: 600 + s.i * 7 + j, smooth: false })));
  return S;
};

// ---- the replay (ported from colouredPencilKit.replay: tooth field, layers and timing, at one scale)
const LEVELS = [0.53, 0.575, 0.645];
const cache = new Map<string, unknown>();
const toothMask = (env: Env, lvl: number): Layer => {
  const DW = Math.round(W * env.scale), DH = Math.round(H * env.scale), key = `tooth:${lvl}:${DW}x${DH}`;
  let L = cache.get(key) as Layer | undefined; if (L) return L;
  let f = cache.get("field") as Float32Array | undefined;
  const c = Math.cos(ANG), s = Math.sin(ANG);
  if (!f) { f = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const u = x * c + y * s, v = -x * s + y * c; f[y * W + x] = 0.62 * fractal(71, u, v, 0.12, 0.62, 2) + 0.38 * fractal(73, x, y, 0.8, 0.8, 1); } cache.set("field", f); }
  const small = env.canvas(W, H), img = small.ctx.createImageData(W, H), d = img.data, T = LEVELS[lvl];
  for (let i = 0; i < W * H; i++) d[i * 4 + 3] = 255 * Math.max(0, Math.min(1, (T - f[i]) * 11 + 0.5));
  small.ctx.putImageData(img, 0, 0);
  L = env.canvas(DW, DH); L.ctx.imageSmoothingEnabled = true; L.ctx.drawImage(small.canvas as CanvasImageSource, 0, 0, W, H, 0, 0, DW, DH);
  cache.set(key, L); return L;
};
const fillMark = (c: Ctx, m: Mark, poly = m.poly) => { c.globalAlpha = m.a; c.fillStyle = m.col; c.beginPath(); c.moveTo(poly[0], poly[1]); for (let i = 2; i < poly.length; i += 2) c.lineTo(poly[i], poly[i + 1]); c.closePath(); c.fill(); };
const cutMark = (m: Mark, p: number) => { const n = Math.max(1, Math.floor(m.poly.length / 4 * p)), half = m.poly.length / 2, out: number[] = []; for (let i = 0; i < n * 2; i++) out.push(m.poly[i]); for (let i = half * 2 - n * 2; i < half * 2; i++) out.push(m.poly[i]); return Float32Array.from(out); };
const surface = (env: Env, name: string): Layer => { const DW = Math.round(W * env.scale), DH = Math.round(H * env.scale), k = `surf:${name}:${DW}x${DH}`; let L = cache.get(k) as Layer | undefined; if (!L) { L = env.canvas(DW, DH); cache.set(k, L); } return L; };
const lay = (env: Env, dst: Ctx, pass: Pass, n: number, part: number) => {
  const L = surface(env, "scratch"), c = L.ctx, DW = Math.round(W * env.scale), DH = Math.round(H * env.scale);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over"; c.globalAlpha = 1; c.clearRect(0, 0, DW, DH);
  c.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  for (let i = 0; i < n; i++) fillMark(c, pass.marks[i]);
  if (part > 0 && n < pass.marks.length) fillMark(c, pass.marks[n], cutMark(pass.marks[n], part));
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "destination-in"; c.drawImage(toothMask(env, pass.tooth).canvas as CanvasImageSource, 0, 0); c.globalCompositeOperation = "source-over";
  dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = 1; dst.drawImage(L.canvas as CanvasImageSource, 0, 0); dst.restore();
};
// frames of the 10 s film for each pass, then a hold
const CUES: [string, number, number][] = [["lay", 2, 32], ["ground", 34, 92], ["local", 94, 170], ["layer", 172, 208], ["darks", 210, 236], ["line", 238, 266]];
const sheetOf = (env: Env) => { let s = cache.get("sheet") as { S: Sheet; cost: Float64Array[] } | undefined; if (!s) { const S = build(env); s = { S, cost: S.passes.map((p) => { const o = new Float64Array(p.marks.length + 1); p.marks.forEach((m, i) => (o[i + 1] = o[i] + m.len + 7)); return o; }) }; cache.set("sheet", s); } return s; };
const done = (env: Env, k: number): Layer => {
  const DW = Math.round(W * env.scale), DH = Math.round(H * env.scale), key = `cum:${k}:${DW}x${DH}`;
  const hit = cache.get(key) as Layer | undefined; if (hit) return hit;
  const { S } = sheetOf(env), L = env.canvas(DW, DH), c = L.ctx;
  if (k > 0) c.drawImage(done(env, k - 1).canvas as CanvasImageSource, 0, 0); else { c.fillStyle = PAPER; c.fillRect(0, 0, DW, DH); }
  if (k > 0) { const p = S.passes.find((q) => q.id === CUES[k - 1][0])!; lay(env, c, p, p.marks.length, 0); }
  cache.set(key, L); return L;
};
export const colouredPencilLook = (ctx: Ctx, frame: number, env: Env) => {
  const { S, cost } = sheetOf(env);
  let k = 0; while (k < CUES.length && frame >= CUES[k][2]) k++;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(done(env, k).canvas as CanvasImageSource, 0, 0); ctx.restore();
  if (k < CUES.length && frame >= CUES[k][1]) {
    const [id, a, b] = CUES[k], pi = S.passes.findIndex((p) => p.id === id), pass = S.passes[pi], cc = cost[pi], t = (frame - a) / (b - a);
    const want = cc[cc.length - 1] * Math.max(0, Math.min(1, t * 0.85 + smoothstep(0, 1, t) * 0.15));
    let lo = 0, hi = pass.marks.length; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (cc[m] <= want) lo = m; else hi = m - 1; }
    lay(env, ctx, pass, lo, lo < pass.marks.length ? Math.max(0, Math.min(1, (want - cc[lo]) / (pass.marks[lo].len + 7))) : 0);
  }
  new Gfx(ctx, env, 0, PENCIL).paper("paper", 0.05);
};
