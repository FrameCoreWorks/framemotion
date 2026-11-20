// broken-colour: a scene painted in separate dabs of unmixed colour the way the bundled broken-colour
// film paints its harbour (anidoodle brokenColourKit.ts with brokenColour.ts, Apache-2.0, Copyright 2026
// Alex Greenshpun: the loaded flat dab with its ridge and groove, the rigger line, the scrubbed lay-in, the
// staged runner and the primed linen are the kit's). Paint straight from the tube, put down once: a warm
// imprimatura scrubbed thin, the placement drawn in thinned ultramarine, the big masses in big dabs, then
// smaller broken dabs over everything, two or three unmixed colours side by side for the eye to mix
// (no outlines, no black), the shade side cooled and the light side warmed with complementary accents,
// the sparkles last. Water dabs lie flat, a sky turns, a thing's dabs follow its long side.
import { Gfx, PENCIL, fractal, rng, type Ctx, type Env, type P } from "../core";
import { brush, checkOps, fromHsl, linen, mixC, schedule, staged, toHsl, type Mark, type Op, type RGB } from "../brokenColourKit";
import { W, H, scene, lit, fillOf, sizeOf, areaOf, outlineOf, raster, idAt, type Shape } from "../sceneKit";

const shiftHue = (c: RGB, dh: number, ds: number, dl: number): RGB => { const [h, s, l] = toHsl(c); return fromHsl([(((h + dh / 360) % 1) + 1) % 1, Math.max(0, Math.min(1, s + ds)), Math.max(0, Math.min(1, l + dl))]); };
const dirAt = (s: Shape, x: number, y: number) => { if (s.big) { const sky = (s.box[1] + s.box[3]) / 2 < H / 2; return sky ? (fractal(5, x, y, 0.004, 0.004, 2) - 0.5) * 1.6 : 0.03 + (fractal(6, x, y, 0.01, 0.01, 1) - 0.5) * 0.15; } const w = s.box[2] - s.box[0], h = s.box[3] - s.box[1]; return h > w * 1.2 ? Math.PI / 2 + (fractal(7, x, y, 0.02, 0.02, 1) - 0.5) * 0.4 : (fractal(8, x, y, 0.02, 0.02, 1) - 0.5) * 0.7; };
let OPS: Op[] | null = null;
const build = (env: Env): Op[] => {
  const r0 = raster(env), list = scene(), ops: Op[] = [], R = rng(11);
  const add = (marks: Mark[], f0: number, f1: number, dur: number) => { if (!marks.length) return; const t = schedule(marks.length, f0, f1, dur); marks.forEach((m, i) => ops.push({ ...t[i], draw: (c, e, p) => brush(c, e, m, p) })); };
  const dab = (a: P, ang: number, len: number, w: number, rgb: RGB, alpha: number, kind: 0 | 1 | 2 = 0): Mark => ({ a: [a[0] - Math.cos(ang) * len / 2, a[1] - Math.sin(ang) * len / 2], b: [a[0] + Math.cos(ang) * len / 2, a[1] + Math.sin(ang) * len / 2], bend: (R() - 0.5) * w * 0.4, w, rgb, alpha, seed: Math.floor(R() * 1e6), kind });
  // 1 · the warm imprimatura, scrubbed thin
  // the imprimatura takes the scene's own key, warmed, so the gaps between dabs read as colour, not as white
  const tone: Mark[] = []; for (let y = -20; y < H + 40; y += 40) { const p = (Math.max(0, Math.min(r0.h - 1, Math.floor(y))) * r0.w + Math.floor(W / 2)) * 4; tone.push(dab([W / 2, y + R() * 20], (R() - 0.5) * 0.15, W * 1.3, 64, mixC([r0.rgb[p], r0.rgb[p + 1], r0.rgb[p + 2]], [214, 168, 120], 0.45), 0.9, 2)); }
  add(tone, 1, 24, 6);
  // 2 · the placement: thinned ultramarine lines round the things
  const draw: Mark[] = []; list.filter((s) => s.fill && !s.big).forEach((s) => { const e = outlineOf(s), step = Math.max(4, Math.round(e.length / 10)); for (let i = 0; i + step < e.length; i += step) draw.push({ a: e[i], b: e[i + step], bend: 0, w: 2.2, rgb: [96, 104, 168], alpha: 0.5, seed: 100 + s.i * 37 + i, kind: 1 }); });
  add(draw, 22, 58, 4);
  // 3 · the big masses, big dabs, back to front
  const sweep = (step: number, len: number, w: number, test: (s: Shape) => boolean, col: (s: Shape, x: number, y: number) => RGB | null, alpha = 0.95): Mark[] => { const out: { m: Mark; k: number }[] = []; for (let y = step / 2; y < H; y += step * 0.8) for (let x = (Math.round(y / step) % 2) * step / 2; x < W + step; x += step) { const px = x + (R() - 0.5) * step * 0.8, py = y + (R() - 0.5) * step * 0.8, id = idAt(r0, px, py); if (id < 0 || !test(list[id])) continue; const s = list[id], c = col(s, px, py); if (!c) continue; const sz = Math.min(1, sizeOf(s) / (len * 3)); out.push({ m: dab([px, py], dirAt(s, px, py), len * (0.4 + 0.6 * sz) * (0.75 + R() * 0.5), w * (0.5 + 0.5 * sz), c, alpha), k: id * 1e6 + py }); } return out.sort((a, b) => a.k - b.k).map((o) => o.m); };
  const base = (s: Shape, x: number, y: number): RGB => { const p = (Math.floor(y) * r0.w + Math.floor(x)) * 4, c: RGB = [r0.rgb[p], r0.rgb[p + 1], r0.rgb[p + 2]], sd = lit(s).side(x, y); return sd > 0.3 ? shiftHue(c, 15, 0.05, -0.12 * sd) : sd < -0.4 ? shiftHue(c, -10, 0.05, 0.08) : c; };
  add(sweep(W * 0.024, 36, 19, () => true, base), 58, 140, 3);
  // 4 · broken dabs over everything: unmixed neighbours of the colour side by side
  add(sweep(W * 0.0125, 15, 6.5, () => true, (s, x, y) => { const c = base(s, x, y), k = R(); return k < 0.33 ? shiftHue(c, 16, 0.06, 0.03) : k < 0.66 ? shiftHue(c, -16, 0.05, -0.02) : shiftHue(c, 0, 0.08, 0.05); }), 136, 220, 2);
  // 5 · the things restated, smaller and surer, and thin things in one pull of the rigger
  add([...sweep(W * 0.009, 10, 4.5, (s) => !s.big && sizeOf(s) > 14, (s, x, y) => shiftHue(base(s, x, y), (R() - 0.5) * 18, 0.05, 0)), ...list.filter((s) => !s.fill).flatMap((s) => s.poly.flatMap((q) => { const out: Mark[] = [], step = Math.max(3, Math.round(q.length / 6)); for (let i = 0; i + step < q.length; i += step) out.push({ a: q[i], b: q[i + step], bend: 0, w: Math.max(2, s.sw * 0.7), rgb: (s.stroke ?? [60, 60, 60]) as RGB, alpha: 0.95, seed: 500 + s.i * 31 + i, kind: 1 }); return out; }))], 218, 248, 2);
  // 6 · complementary accents: orange into the blue shadows, violet into the gold light; sparkles on the lit spots
  add([...sweep(W * 0.03, 9, 4, (s) => !s.big, (s, x, y) => { const L = lit(s), c = base(s, x, y), [h] = toHsl(c); if (L.side(x, y) > 0.4 && h > 180 && h < 260) return [232, 132, 64]; if (L.side(x, y) < -0.4 && h > 30 && h < 70) return [150, 110, 190]; return null; }, 0.85), ...sweep(W * 0.02, 8, 4.5, (s) => !s.big && areaOf(s) < 0.06 * W * H, (s, x, y) => (lit(s).hi(x, y) ? mixC(fillOf(s) as RGB, [255, 250, 232], 0.6) : null), 1)], 246, 266, 2);
  ops.sort((a, b) => a.t1 - b.t1);
  return checkOps(ops, 270);
};
export const brokenColourLook = (ctx: Ctx, f: number, env: Env) => staged("scene-broken", () => (OPS ??= build(env)),
  (c, e) => { c.setTransform(e.scale, 0, 0, e.scale, 0, 0); c.fillStyle = "#f2ece0"; c.fillRect(0, 0, W, H); },
  (c, e) => { linen(c, e, 0.9); new Gfx(c, e, 0, PENCIL).paper("paper", 0.04); })(ctx, f, env);
