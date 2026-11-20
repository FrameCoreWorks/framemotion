// charcoal: a scene drawn in charcoal the way the bundled charcoal film draws its oak (anidoodle
// charcoalErasureKit.ts with charcoalErasure.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the stick,
// the side of the stick, the stump's rubbed zigzag, the kneaded eraser, the vine/compressed/stump/erase
// tools and the pass runner are the kit's). Willow vine and compressed charcoal on heavy cream rag paper:
// the backdrop toned with the side of the stick and rubbed into the tooth with a stump, the lights lifted
// with the eraser (never all of it), each thing laid in with vine, its tone dragged in by value and rubbed,
// the darks and the shade-side edges in compressed charcoal last, the highlights lifted. Value only.
import { Gfx, rng, type Ctx, type Env, type P } from "../core";
import { COMP, ERASE, INK, STUMP, VINE, rubMark, runPass, sideMarks, stick, zigzag, type Step } from "../charcoalErasureKit";
import { W, H, N, scene, lit, fillOf, outlineOf, sizeOf, areaOf, visibleRuns, toneField, raster, idAt, type Shape } from "../sceneKit";

const PAPER = "#efe7d6", CHAR_M = { nib: 1.2, taper: 0.6, pressure: 0.8, retrace: false, wobble: 1.2, rough: 0.8 };
const lumOf = (s: Shape) => { const c = fillOf(s); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; };
const cache = new Map<string, Step[]>();
const passes = (env: Env): Step[][] => {
  const r0 = raster(env), T = toneField(env), list = scene(), tone = (x: number, y: number) => T[Math.max(0, Math.min(r0.h - 1, Math.floor(y))) * r0.w + Math.max(0, Math.min(r0.w - 1, Math.floor(x)))];
  const frame: P[] = [[0, 0], [W, 0], [W, H], [0, H]];
  // 1 · the backdrop: side of the vine stick, by value, then the stump rubbed across it
  const backs = list.filter((s) => s.fill && s.big);
  const p1: Step[] = [
    { o: VINE, m: backs.flatMap((s) => sideMarks(frame, { angle: 0.35, gap: 7, w: 9, alpha: 0.32, seed: 10 + s.i, test: (x, y) => idAt(r0, x, y) === s.i, keep: (x, y) => tone(x, y) > 0.12 })) },
    { o: VINE, m: backs.flatMap((s) => sideMarks(frame, { angle: -0.5, gap: 9, w: 8, alpha: 0.28, seed: 20 + s.i, test: (x, y) => idAt(r0, x, y) === s.i, keep: (x, y) => tone(x, y) > 0.45 })) },
    { o: STUMP(7), m: zigzag({ x0: 0, y0: 0, x1: W, y1: H }, 38, 26, 30, 0.15).map((row) => rubMark(row, 30, 0.12)) },
  ];
  // 2 · the lights lifted with the kneaded eraser: where the scene is lightest
  const p2: Step[] = [{ o: ERASE(0.75), m: sideMarks(frame, { angle: 0.6, gap: 6, w: 10, alpha: 0.85, seed: 40, keep: (x, y) => tone(x, y) < 0.12 }) }];
  // 3 · each thing: vine lay-in, its tone dragged in by value, rubbed
  const things = list.filter((s) => s.fill && !s.big);
  const p3: Step[] = [
    { o: VINE, m: things.flatMap((s) => visibleRuns(env, s).map((run) => ({ t: 0.2 + run.length / 300, d: (g: Gfx, p: number) => stick(g, run.filter((_, i, a) => i % 3 === 0 || i === a.length - 1), 2.2, 1.6, 0.55, 50 + s.i, p, { rough: 0.8 }) }))) },
    { o: VINE, m: things.flatMap((s) => { const L = lit(s), e = outlineOf(s); return sideMarks(e, { angle: s.box[2] - s.box[0] > s.box[3] - s.box[1] ? 0.3 : 1.2, gap: sizeOf(s) < 40 ? 3.5 : 5, w: sizeOf(s) < 40 ? 4 : 7, alpha: 0.42, seed: 60 + s.i, test: (x, y) => idAt(r0, x, y) === s.i, keep: (x, y) => tone(x, y) > 0.18 + 0.1 * Math.max(0, -L.side(x, y)) }); }) },
    { o: STUMP(5), m: things.filter((s) => sizeOf(s) > 40).flatMap((s) => zigzag({ x0: s.box[0], y0: s.box[1], x1: s.box[2], y1: s.box[3] }, 14, 10, 70 + s.i, 0.4).map((row) => rubMark(row, 16, 0.14, INK, outlineOf(s)))) },
  ];
  // 4 · compressed charcoal: the darks, and each thing's edge on its shade side
  const p4: Step[] = [
    { o: COMP, m: things.flatMap((s) => sideMarks(outlineOf(s), { angle: -0.7, gap: 4, w: 4.5, alpha: 0.55, seed: 80 + s.i, test: (x, y) => idAt(r0, x, y) === s.i, keep: (x, y) => tone(x, y) > 0.82 })) },
    { o: COMP, m: [...things.flatMap((s) => { const L = lit(s); return visibleRuns(env, s).flatMap((run) => { const out: P[][] = []; let cur: P[] = []; run.forEach((p) => { if (L.side(p[0], p[1]) > 0.05) cur.push(p); else { if (cur.length > 3) out.push(cur); cur = []; } }); if (cur.length > 3) out.push(cur); return out; }).map((run) => ({ t: 0.2 + run.length / 320, d: (g: Gfx, p: number) => stick(g, run.filter((_, i, a) => i % 3 === 0 || i === a.length - 1), areaOf(s) > 0.01 * W * H ? 3.2 : 2.2, 1.4, 0.92, 90 + s.i, p, { rough: 0.5, ends: 0.1 }) })); }),
      ...list.filter((s) => !s.fill).flatMap((s) => s.poly.map((q) => ({ t: 0.2 + q.length / 320, d: (g: Gfx, p: number) => stick(g, q.filter((_, i, a) => i % 3 === 0 || i === a.length - 1), Math.max(1.5, s.sw * 0.5), Math.max(1, s.sw * 0.35), lumOf({ ...s, fill: s.stroke }) > 0.7 ? 0.35 : 0.9, 95 + s.i, p, { rough: 0.5 }) })))] },
  ];
  // 5 · the highlights lifted: the eraser dragged across each thing's lit spot, and the light things
  const p5: Step[] = [{ o: ERASE(0.6, 2), m: things.filter((s) => sizeOf(s) > 30 && areaOf(s) < 0.06 * W * H).flatMap((s) => { const L = lit(s); return sideMarks(outlineOf(s), { angle: 0.8, gap: 5, w: 7, alpha: 0.8, seed: 110 + s.i, test: (x, y) => idAt(r0, x, y) === s.i, keep: (x, y) => L.hi(x, y) || lumOf(s) > 0.85 }); }) }];
  return [p1, p2, p3, p4, p5];
};
const PH: [number, number][] = [[1, 70], [72, 92], [94, 200], [202, 250], [252, 266]];
// the charcoal lives on its own transparent sheet (so the eraser lifts charcoal, not paper); each finished
// pass is cached, the pass in hand is run over a copy of the one before
const layers = new Map<string, ReturnType<Env["canvas"]>>();
const state = (env: Env, P5: Step[][], i: number): ReturnType<Env["canvas"]> | null => {
  if (i < 0) return null;
  const k = `st:${i}`; let L = layers.get(k); if (L) return L;
  L = env.canvas(Math.round(W * env.scale), Math.round(H * env.scale)); const prev = state(env, P5, i - 1);
  if (prev) L.ctx.drawImage(prev.canvas as CanvasImageSource, 0, 0);
  L.ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); runPass(new Gfx(L.ctx, env, 0, CHAR_M), P5[i], 1);
  layers.set(k, L); return L;
};
export const charcoalLook = (ctx: Ctx, f: number, env: Env) => {
  const P5 = (cache.get("p") as unknown as Step[][] | undefined) ?? (() => { const v = passes(env); cache.set("p", v as unknown as Step[]); return v; })();
  let i = 0; while (i < PH.length && f >= PH[i][1]) i++;
  let sheet = state(env, P5, i - 1);
  if (i < PH.length && f > PH[i][0]) {
    let work = layers.get("work"); if (!work) { work = env.canvas(Math.round(W * env.scale), Math.round(H * env.scale)); layers.set("work", work); }
    const c = work.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "copy"; if (sheet) c.drawImage(sheet.canvas as CanvasImageSource, 0, 0); else c.clearRect(0, 0, work.canvas.width, work.canvas.height); c.globalCompositeOperation = "source-over";
    c.setTransform(env.scale, 0, 0, env.scale, 0, 0); runPass(new Gfx(c, env, 0, CHAR_M), P5[i], (f - PH[i][0]) / (PH[i][1] - PH[i][0]));
    sheet = work;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, Math.round(W * env.scale), Math.round(H * env.scale));
  const g = new Gfx(ctx, env, 0, CHAR_M); g.paper("ce_sheet", 0.22);
  if (sheet) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sheet.canvas as CanvasImageSource, 0, 0); ctx.restore(); }
  g.paper("paper", 0.16); g.vignette("rgba(120,100,80,0.10)");
};
void N;
