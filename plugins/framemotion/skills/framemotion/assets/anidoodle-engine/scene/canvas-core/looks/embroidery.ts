// embroidery: a scene stitched the way the bundled embroidery film stitches its wreath (anidoodle
// embroideryKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the linen weave, the stitches with their
// lit and shade sides, twist and shadow, and the stitch generators are the kit's; the hoop, the needle and
// the checkpointed replay are ported from embroidery.ts). Floss through plain-weave linen in a beech hoop:
// split-stitch outlines first, stem stitch for thin things, then the fills: satin laid across each form
// (its lit side a lighter thread, its shade side a darker one), brick rows of long-and-short for a wide
// backdrop, French knots for the small round things. Each stitch is pulled through by the needle in turn.
import { Gfx, rng, type Ctx, type Env, type Layer, type Medium, type P } from "../core";
import { LIGHT, drawShadows, drawThreads, headOf, knots, linenLayer, splitStitch, stemStitch, type St } from "../embroideryKit";
import { clamp, hatchRuns, lerp, lerpP, mix, smooth } from "../gallery";
import { W, H, scene, shown, lit, fillOf, hex, sizeOf, outlineOf, areaOf, type Shape } from "../sceneKit";

const EMB_M: Medium = { nib: 1, taper: 0, pressure: 1, retrace: false, wobble: 0, rough: 0 };
const TALL = H > W * 1.4, HC: P = [W / 2, TALL ? H * 0.45 : H / 2], RX = W * 0.445, RY = TALL ? H * 0.34 : H * 0.445, TH = Math.min(W, H) * 0.022, K = 0.9;   // the hoop (an oval one for a tall frame, kept inside the 9:16 safe area: 10% top, 20% bottom) and how much the scene is drawn in to sit inside it
const inHoop = (x: number, y: number, pad = 0) => ((x - HC[0]) / (RX - TH - pad)) ** 2 + ((y - HC[1]) / (RY - TH - pad)) ** 2 < 1;
const toHoop = ([x, y]: P): P => [HC[0] + (x - W / 2) * K, HC[1] + (y - H / 2) * K];
const floss = (c: [number, number, number]) => { const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return hex(c.map((v) => l + (v - l) * 1.1) as [number, number, number]); };
type Timed = St & { f0: number; f1: number };

const build = (env: Env): St[] => {
  const list = scene(), outl: St[] = [], fills: St[] = [], knotsAll: St[] = [];
  const keep = (s: St) => inHoop(s.a[0], s.a[1], 2) && inHoop(s.b[0], s.b[1], 2);
  list.forEach((s) => {
    if (!s.fill) { s.poly.forEach((sub, j) => outl.push(...stemStitch(sub.map(toHoop), 7, Math.max(1.4, Math.min(3, s.sw * 0.35)), floss(s.stroke!), 40 + s.i * 7 + j))); return; }
    const col = floss(fillOf(s)), L = lit(s), reg = shown(env, s), sz = sizeOf(s) * K;
    if (!s.big && sz < 26) {   // small round things: a packed bed of French knots
      const [x0, y0, x1, y1] = s.box, c = toHoop([(x0 + x1) / 2, (y0 + y1) / 2]);
      knotsAll.push(...knots(c[0], c[1], Math.max(2.4, (x1 - x0) * K / 2), Math.max(2.4, (y1 - y0) * K / 2), Math.max(1.4, Math.min(2.6, sz / 8)), (u, v) => (u + v < 0 ? mix(col, "#ffffff", 0.25) : col), 900 + s.i).filter((k) => reg.has(W / 2 + (k.a[0] - HC[0]) / K, H / 2 + (k.a[1] - HC[1]) / K)));
      return;
    }
    if (!s.big) outl.push(...splitStitch(outlineOf(s).map(toHoop), 5.5, 1.9, mix(col, "#1a120c", 0.45), true));
    // satin across the form: one stitch from edge to edge, split if long; lighter on the lit side
    const [x0, y0, x1, y1] = s.box, wide = x1 - x0 > y1 - y0, ang = s.big ? 0.06 : (wide ? Math.PI / 2 : 0) + (rng(s.i)() - 0.5) * 0.5;
    const r = rng(500 + s.i), gap = s.big ? 4.2 : 2.3, span = s.big ? 12 : 26;
    for (const run of hatchRuns({ x0, y0, x1, y1 }, ang, gap / K, (x, y) => reg.has(x, y), 2, 3 + s.i)) {
      const a = run[0], b = run[run.length - 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]) * K, n = Math.max(1, Math.ceil(len / span));
      // a wide backdrop in brick rows (long and short), a form in satin
      const off = s.big ? (Math.round((a[1] + a[0]) / gap) % 2) * 0.5 : 0;
      for (let k = 0; k < n; k++) {
        const f0 = clamp((k - off) / n), f1 = clamp((k + 1 - off) / n); if (f1 - f0 < 0.3 / n) continue;
        const pa = lerpP(a, b, f0), pb = lerpP(a, b, f1), m = lerpP(pa, pb, 0.5), sd = L.side(m[0], m[1]);
        const tone = sd > 0 ? mix(col, "#1a120c", 0.32 * clamp((sd - 0.1) / 0.9)) : s.big ? col : mix(col, "#ffffff", 0.22 * clamp((-sd - 0.2) / 0.8));
        fills.push({ k: "flat", a: toHoop([pa[0] + (r() - 0.5) * 0.6, pa[1] + (r() - 0.5) * 0.6]), b: toHoop(pb), w: s.big ? 2.6 : 2.2, c: mix(tone, col, (r() - 0.5) * 0.12 + 0.06), t: 1 });
      }
    }
  });
  return [...outl, ...fills, ...knotsAll].filter(keep);
};
// stitch times: outlines first, then the fills, then the knots; each stitch as long as its thread
const timeline = (sts: St[]): Timed[] => {
  const cost = (s: St) => (s.k === "knot" ? 2.2 : Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) * 0.12 + 1), tot = sts.reduce((a, s) => a + cost(s), 0) || 1;
  let acc = 0; const A = 3, B = 262;
  return sts.map((s) => { const f0 = A + ((B - A) * acc) / tot; acc += cost(s); return { ...s, f0, f1: A + ((B - A) * acc) / tot }; });
};

const cache = new Map<string, unknown>();
const cached = <T,>(key: string, fn: () => T): T => { let v = cache.get(key) as T | undefined; if (v === undefined) { v = fn(); cache.set(key, v); } return v; };
const DWH = (env: Env): [number, number] => [Math.round(W * env.scale), Math.round(H * env.scale)];
const STRIDE = 400;
const drawRun = (L: Layer, env: Env, sts: St[], lastP = 1) => {
  if (!sts.length) return;
  const g = new Gfx(L.ctx, env, 0, EMB_M); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of sts) { x0 = Math.min(x0, s.a[0], s.b[0]); y0 = Math.min(y0, s.a[1], s.b[1]); x1 = Math.max(x1, s.a[0], s.b[0]); y1 = Math.max(y1, s.a[1], s.b[1]); }
  g.group("plain", () => { g.touch(x0 - 8, y0 - 8, x1 + 10, y1 + 10); drawShadows(g.cur, sts, lastP); }, { blur: 0.9 });
  g.group("plain", () => { g.touch(x0 - 6, y0 - 6, x1 + 6, y1 + 6); drawThreads(g.cur, sts, lastP); });
};
const checkpoint = (env: Env, all: Timed[], k: number): Layer | null => {
  if (k <= 0) return null;
  const key = `ck:${k}:${env.scale}`, hit = cache.get(key) as Layer | undefined; if (hit) return hit;
  const prev = checkpoint(env, all, k - 1), [dw, dh] = DWH(env), L = env.canvas(dw, dh); L.ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (prev) { L.ctx.globalCompositeOperation = "copy"; L.ctx.drawImage(prev.canvas as CanvasImageSource, 0, 0); L.ctx.globalCompositeOperation = "source-over"; }
  drawRun(L, env, all.slice((k - 1) * STRIDE, k * STRIDE));
  cache.set(key, L); cache.delete(`ck:${k - 3}:${env.scale}`);
  return L;
};
const ground = (env: Env): Layer => linenLayer(env, `scene${W}x${H}`, 4.2, [224, 211, 186], (x, y) => {
  const d = Math.hypot((x - HC[0]) / RX, (y - HC[1]) / RY);
  if (d < 1 - TH / Math.min(RX, RY)) return 1.03 - 0.05 * d * d;
  return 0.84 + 0.07 * Math.sin((x * 0.8 + y * 0.35) * 0.012 + Math.sin(y * 0.01) * 1.6);   // slack cloth outside the hoop, in soft folds
});
const hoop = (env: Env): Layer => cached(`hoop:${env.scale}`, () => {
  const [dw, dh] = DWH(env), L = env.canvas(dw, dh), c = L.ctx, s = env.scale; c.setTransform(s, 0, 0, s, 0, 0);
  const ring = (dx: number, dy: number, i0: number, o0: number) => { c.beginPath(); c.ellipse(HC[0] + dx, HC[1] + dy, RX + o0, RY + o0, 0, 0, Math.PI * 2); c.ellipse(HC[0] + dx, HC[1] + dy, RX - TH - i0, RY - TH - i0, 0, 0, Math.PI * 2, true); };
  for (let k = 0; k < 6; k++) { c.globalAlpha = 0.07; c.fillStyle = "#2b1d10"; ring(5 + k * 1.6, 7 + k * 2.2, k * 0.8, k * 0.8); c.fill("evenodd"); }
  c.globalAlpha = 1;
  const gr = c.createLinearGradient(HC[0] - RX, HC[1] - RY, HC[0] + RX, HC[1] + RY); gr.addColorStop(0, "#e2b67c"); gr.addColorStop(0.5, "#c89960"); gr.addColorStop(1, "#a97a45");
  c.fillStyle = gr; ring(0, 0, 0, 0); c.fill("evenodd");
  const r = rng(515); c.lineCap = "round";
  for (let k = 0; k < 30; k++) { const f = 2 + r() * (TH - 4), a0 = r() * Math.PI * 2, a1 = a0 + 0.3 + r() * 1.3; c.strokeStyle = r() < 0.5 ? "#96683a" : "#b5854f"; c.globalAlpha = 0.35 + r() * 0.3; c.lineWidth = 0.6 + r() * 0.9; c.beginPath(); c.ellipse(HC[0], HC[1], RX - TH + f, RY - TH + f, 0, a0, a1); c.stroke(); }
  c.globalAlpha = 0.55; c.strokeStyle = "#f6dcae"; c.lineWidth = 2.2; c.beginPath(); c.ellipse(HC[0], HC[1], RX - 1.5, RY - 1.5, 0, (160 * Math.PI) / 180, (290 * Math.PI) / 180); c.stroke();
  c.globalAlpha = 0.5; c.strokeStyle = "#7c5530"; c.lineWidth = 1.6; c.beginPath(); c.ellipse(HC[0], HC[1], RX - TH + 1, RY - TH + 1, 0, 0, Math.PI * 2); c.stroke();
  // the clamp at the top: two lugs and a brass screw
  const top = HC[1] - RY, x = HC[0];
  c.globalAlpha = 0.28; c.fillStyle = "#2b1d10"; c.fillRect(x - 21, top - 36, 52, 52); c.globalAlpha = 1;
  for (const lx of [x - 28, x + 6]) { const lg = c.createLinearGradient(lx, 0, lx + 22, 0); lg.addColorStop(0, "#d9a96b"); lg.addColorStop(1, "#a47440"); c.fillStyle = lg; c.beginPath(); c.roundRect(lx, top - 40, 22, 52, 4); c.fill(); }
  const sg = c.createLinearGradient(0, top - 26, 0, top - 12); sg.addColorStop(0, "#f3dc8e"); sg.addColorStop(0.45, "#c9a043"); sg.addColorStop(1, "#7d5f1f"); c.fillStyle = sg; c.fillRect(x - 40, top - 25, 96, 12);
  const ng = c.createLinearGradient(x + 56, 0, x + 74, 0); ng.addColorStop(0, "#f0d27f"); ng.addColorStop(1, "#8a6a24"); c.fillStyle = ng; c.beginPath(); c.roundRect(x + 56, top - 36, 16, 34, 5); c.fill();
  return L;
});
const add = (a: P, d: P, k = 1): P => [a[0] + d[0] * k, a[1] + d[1] * k];
const needle = (c: Ctx, tip: P, dir: P, colour: string, parked: boolean) => {
  const len = 52, back = add(tip, dir, -len), n: P = [-dir[1], dir[0]], tail = add(back, dir, -4);
  c.save(); c.lineCap = "round";
  const th = smooth(parked ? [tail, add(tail, [-40, 30]), add(tail, [-10, 76]), add(tail, [-62, 96])] : [tail, add(add(tail, dir, -30), n, 18), add(add(tail, dir, -58), n, 8), add(add(tail, dir, -84), n, 30)], false, 10);
  c.globalAlpha = 0.3; c.strokeStyle = "#3b2c1c"; c.lineWidth = 2.4; c.beginPath(); th.forEach(([x, y], i) => (i ? c.lineTo(x + 2, y + 3) : c.moveTo(x + 2, y + 3))); c.stroke();
  c.globalAlpha = 1; c.strokeStyle = colour; c.lineWidth = 2; c.beginPath(); th.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  const seg = (a: P, b: P) => { c.globalAlpha = 0.35; c.strokeStyle = "#2b1d10"; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0] + 2, a[1] + 3); c.lineTo(b[0] + 2, b[1] + 3); c.stroke(); c.globalAlpha = 1; c.strokeStyle = "#8d949a"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = "#f5f7f8"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(a[0] + n[0] * 0.6, a[1] + n[1] * 0.6); c.lineTo(b[0] + n[0] * 0.6, b[1] + n[1] * 0.6); c.stroke(); };
  if (parked) { seg(back, add(back, dir, 17)); seg(add(back, dir, 35), tip); } else seg(back, tip);
  c.restore();
};

export const embroideryLook = (ctx: Ctx, f: number, env: Env) => {
  const all = cached("timeline", () => timeline(build(env))), [dw, dh] = DWH(env);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(ground(env).canvas as CanvasImageSource, 0, 0);
  let n = 0; while (n < all.length && all[n].f0 <= f) n++;
  const last = n ? all[n - 1] : null, p = last ? clamp((f - last.f0) / Math.max(0.01, last.f1 - last.f0)) : 1;
  const k = Math.floor(Math.max(0, n - 1) / STRIDE), base = checkpoint(env, all, k);
  const work = cached(`work:${env.scale}`, () => env.canvas(dw, dh));
  work.ctx.setTransform(1, 0, 0, 1, 0, 0); if (base) { work.ctx.globalCompositeOperation = "copy"; work.ctx.drawImage(base.canvas as CanvasImageSource, 0, 0); work.ctx.globalCompositeOperation = "source-over"; } else work.ctx.clearRect(0, 0, dw, dh);
  drawRun(work, env, all.slice(k * STRIDE, n), p);
  ctx.drawImage(work.canvas as CanvasImageSource, 0, 0);
  ctx.drawImage(hoop(env).canvas as CanvasImageSource, 0, 0);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  const park: [P, P] = [[HC[0] + RX * 0.42, HC[1] + RY * 0.5], [0.84, -0.54]];
  if (f >= 264) { const t = clamp((f - 264) / 5), from = last ? headOf(last, 1) : park[0], tip = lerpP(from, park[0], t * t * (3 - 2 * t)); needle(ctx, tip, t >= 1 ? park[1] : [lerp(0.7, park[1][0], t), lerp(0.7, park[1][1], t)], "#d6b25a", t >= 1); }
  else if (last) { const a = last.a, h = headOf(last, p), dir: P = last.k === "knot" ? [0.7, 0.7] : (() => { const d = Math.hypot(last.b[0] - a[0], last.b[1] - a[1]) || 1; return [(last.b[0] - a[0]) / d, (last.b[1] - a[1]) / d] as P; })(); needle(ctx, add(h, dir, last.k === "knot" ? 4 : 10), dir, last.c, false); }
  void LIGHT; void areaOf;
};
