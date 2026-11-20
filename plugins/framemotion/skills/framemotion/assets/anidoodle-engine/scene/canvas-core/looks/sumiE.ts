// sumi-e: a scene in ink on xuan paper the way the bundled sumi-e film paints its bamboo (anidoodle
// sumiEKit.ts with sumiE.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the brush of real hairs that
// spends its ink and splits into flying white, bleeds at its slow points into the fibres, the five inks,
// the timeline and process runner are the kit's; the paper and the cinnabar seal are ported from the film).
// One soft brush, nothing corrected: depth is dilution (the near thing in thick ink, the far in light,
// the farthest clear), a dark thing laid with the side of the brush in strokes along its long side, a
// light thing left as paper inside a pressed-and-lifted contour with one clear wash on its shade side, a
// backdrop as a few wet sweeps, thin things in single strokes, dry accents, then the seal.
import { Gfx, fractal, rng, type P } from "../core";
import { clamp, hatchRuns } from "../gallery";
import { DAN, NONG, QING, ZHONG, fit, runProcess, strokeDraw, timeline, type Brush, type Proc } from "../sumiEKit";
import { W, H, N, scene, lit, fillOf, sizeOf, areaOf, outlineOf, visibleRuns, raster, idAt, type Shape } from "../sceneKit";

const SUMI_M = { nib: 1, taper: 1, pressure: 1, retrace: false, wobble: 0, rough: 0 }, PAPER = "#f3ede0";
const lumOf = (s: Shape) => { const c = fillOf(s); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; };
type Step = { kind: string; b: Brush; dur: number; clip?: Shape };
let STEPS: Step[] | null = null;
const steps = (env: Parameters<typeof raster>[0]): Step[] => STEPS ??= (() => {
  const list = scene(), maxL = Math.max(1, ...list.map((s) => s.layer)), r0 = raster(env), out: Step[] = [], R = rng(7);
  const depth = (s: Shape) => 1 - s.layer / maxL;   // 0 near .. 1 far
  const inkOf = (s: Shape) => { const d = depth(s), dark = 1 - lumOf(s); return clamp(QING + (NONG - QING) * dark * (1 - 0.6 * d)); };
  const press: [number, number][] = [[0, 0.5], [0.12, 1], [0.8, 0.95], [1, 0.25]];
  // backdrops: a few wet sweeps of light ink, darker where the scene is darker
  list.filter((s) => s.fill && s.big).forEach((s) => { const ink = clamp((1 - lumOf(s)) * DAN), [x0, y0, x1, y1] = s.box; if (ink < 0.08) return; for (let y = y0 + 40; y < y1; y += 95) { const ok = idAt(r0, (x0 + x1) / 2, y) === s.i; if (!ok && R() < 0.5) continue; out.push({ kind: "wash", dur: 10, b: { ctrl: [[x0 - 40, y + (R() - 0.5) * 20], [(x0 + x1) / 2, y + (R() - 0.5) * 30], [x1 + 40, y + (R() - 0.5) * 20]], w: 74, press: [[0, 0.8], [0.2, 1], [1, 0.7]], ink: ink * (0.7 + R() * 0.3), load: 1, dry: 0.12, bleed: 0.9, wet: 1, seed: 100 + s.i * 31 + Math.round(y) } }); } });
  // things, back to front
  list.filter((s) => s.fill && !s.big).forEach((s) => {
    const ink = inkOf(s), L = lit(s), [x0, y0, x1, y1] = s.box, wide = x1 - x0 >= y1 - y0, sz = sizeOf(s);
    if (lumOf(s) < 0.55 || sz < 18) {
      // the side of the brush, strokes along the long side, each one gesture; small things a single dab
      const wbr = Math.max(8, Math.min(80, sz * 0.5)), n = Math.max(1, Math.round((wide ? y1 - y0 : x1 - x0) / (wbr * 0.8)));
      void n; hatchRuns({ x0, y0, x1, y1 }, wide ? 0.04 : -Math.PI / 2 + 0.06, wbr * 0.42, (x, y) => idAt(r0, x, y) === s.i, 2, 5 + s.i).forEach((run, k) => { if (run.length < 2) return; const a: P = run[0], b: P = run[run.length - 1], m: P = [(a[0] + b[0]) / 2 + (R() - 0.5) * wbr * 0.2, (a[1] + b[1]) / 2 + (R() - 0.5) * wbr * 0.2]; out.push({ kind: "mass", dur: 6, clip: s, b: { ctrl: [a, m, b], w: wbr, press: [[0, 0.85], [0.06, 1], [0.9, 1], [1, 0.6]], ink: ink * (L.side(m[0], m[1]) > 0.3 ? 1.12 : 0.92), load: 1, dry: 0.22, edge: 0.3, split: 0.25, bleed: 0.9, wet: 0.8, slow: [[0, 0.6], [1, 0.4]], seed: 200 + s.i * 37 + k } }); });
    } else {
      // a light thing: the paper itself, a pressed-and-lifted contour, a clear wash on the shade side
      visibleRuns(env, s).forEach((run, j) => { const step = Math.max(6, Math.round(run.length / Math.max(1, Math.round(run.length / 30)))); for (let a = 0; a < run.length - 2; a += step) { const seg = run.slice(a, Math.min(run.length, a + step + 1)); if (seg.length < 2) continue; out.push({ kind: "line", dur: 4, b: { ctrl: [seg[0], seg[seg.length >> 1], seg[seg.length - 1]], w: Math.max(3, Math.min(9, sz * 0.04)), press: [[0, 0.7], [0.3, 1], [1, 0.3]], ink: clamp(ink + 0.4), load: 1, dry: 0.8, split: 0.3, slow: [[0, 0.5]], seed: 300 + s.i * 41 + j * 7 + a } }); } });
      const c: P = [x0 + (x1 - x0) * 0.68, y0 + (y1 - y0) * 0.62]; out.push({ kind: "wash", dur: 6, b: { ctrl: [[c[0] - (x1 - x0) * 0.2, c[1] - (y1 - y0) * 0.15], c, [c[0] + (x1 - x0) * 0.1, c[1] + (y1 - y0) * 0.25]], w: Math.max(10, sz * 0.35), press: [[0, 0.8], [1, 0.8]], ink: QING, load: 1, dry: 0.1, bleed: 1, wet: 1, seed: 350 + s.i } });
    }
  });
  // thin things: one stroke each; then dry accents along the near things' shade edges
  list.filter((s) => !s.fill).forEach((s) => s.poly.forEach((q, j) => { if (q.length > 1) out.push({ kind: "line", dur: 5, b: { ctrl: q.filter((_, i, a) => i % Math.max(1, Math.round(a.length / 5)) === 0 || i === a.length - 1), w: Math.max(2.5, Math.min(10, s.sw * 0.9)), press: [[0, 0.6], [0.2, 1], [1, 0.3]], ink: clamp(0.3 + (1 - (0.299 * s.stroke![0] + 0.587 * s.stroke![1] + 0.114 * s.stroke![2]) / 255) * 0.7), load: 1, dry: 0.6, split: 0.3, seed: 500 + s.i * 7 + j } }); }));
  list.filter((s) => s.fill && !s.big && depth(s) < 0.4 && areaOf(s) > 0.005 * W * H).forEach((s) => { const L = lit(s), pts = outlineOf(s).filter(([x, y]) => L.side(x, y) > 0.5); if (pts.length > 4) out.push({ kind: "dry", dur: 5, b: { ctrl: [pts[0], pts[pts.length >> 1], pts[pts.length - 1]], w: 5, press: [[0, 0.8], [1, 0.2]], ink: ZHONG + 0.2, load: 0.7, dry: 1.4, split: 0.7, streak: true, seed: 700 + s.i } }); });
  return out;
})();
const SEAL = () => { const s = Math.round(Math.min(W, H) * 0.058); return { x: W - Math.round(W * 0.09) - s, y: H > W * 1.4 ? Math.round(H * 0.74) - s : H - Math.round(H * 0.09) - s, s }; };
const seal = (g: Gfx, press: number) => {
  if (press <= 0) return; const { x, y, s } = SEAL(), r = rng(900);
  g.group("plain", () => {
    const k = g.cur; g.touch(x - 4, y - 4, x + s + 4, y + s + 4);
    k.fillStyle = "#b8352b"; k.globalAlpha = 0.92; k.beginPath(); const edge: P[] = []; for (let i = 0; i < 40; i++) { const t = i / 10, side = Math.floor(t), f = t - side, j = (fractal(901, i, 0, 0.7, 0.7, 2) - 0.5) * 2.2; edge.push(side === 0 ? [x + s * f, y + j] : side === 1 ? [x + s + j, y + s * f] : side === 2 ? [x + s * (1 - f), y + s + j] : [x + j, y + s * (1 - f)]); } edge.forEach(([a, b], i) => (i ? k.lineTo(a, b) : k.moveTo(a, b))); k.closePath(); k.fill();
    // an invented seal-script mark cut into the stone (not text): it prints as paper inside the red
    k.globalCompositeOperation = "destination-out"; k.globalAlpha = 1; k.lineCap = "square"; k.lineWidth = s * 0.07;
    ([[[0.2, 0.25], [0.45, 0.25], [0.45, 0.75]], [[0.2, 0.5], [0.4, 0.5]], [[0.58, 0.2], [0.58, 0.8]], [[0.58, 0.35], [0.8, 0.35], [0.8, 0.65], [0.58, 0.65]]] as P[][]).forEach((ln) => { k.beginPath(); ln.forEach(([u, v], i) => (i ? k.lineTo(x + u * s + (r() - 0.5), y + v * s + (r() - 0.5)) : k.moveTo(x + u * s, y + v * s))); k.stroke(); });
    k.lineWidth = 1.6; k.strokeRect(x + 3.2, y + 3.2, s - 6.4, s - 6.4);
    k.globalCompositeOperation = "source-over"; k.globalAlpha = 1;
  }, { blend: "multiply", alpha: clamp(0.35 + 0.65 * press), textures: ["risoSpeck"] });
};
const ground = (g: Gfx) => {
  const c = g.cur, e = g.env; c.setTransform(e.scale, 0, 0, e.scale, 0, 0); c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  g.group("plain", () => { const k = g.cur, r = rng(501); k.lineCap = "round"; for (let i = 0; i < (W * H) / 3400; i++) { const x = r() * W, y = r() * H, a = (fractal(502, x, y, 0.004, 0.004, 2) - 0.5) * 5, L = 18 + r() * 70, bend = (r() - 0.5) * 0.5; k.strokeStyle = r() < 0.5 ? "#d9cfbc" : "#fbf7ee"; k.globalAlpha = 0.35 + r() * 0.35; k.lineWidth = 0.4 + r() * 0.6; k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + Math.cos(a + bend) * L * 0.5, y + Math.sin(a + bend) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); k.stroke(); } k.globalAlpha = 1; g.touch(0, 0, W, H); });
};
let PROC: Proc | null = null;
export const sumiELook = (ctx: CanvasRenderingContext2D, f: number, env: Parameters<typeof runProcess>[3]) => {
  PROC ??= fit((k) => {
    const tl = timeline(2, k), st = steps(env); let prev = "";
    st.forEach((s) => { if (s.kind !== prev && prev) tl.wait(6); prev = s.kind; const draw = strokeDraw(s.b), c = s.clip; tl.add(s.dur, c ? (g, p) => { const k = g.cur; k.save(); k.setTransform(g.env.scale, 0, 0, g.env.scale, 0, 0); k.beginPath(); for (const d of [[0, 0], [7, 4]]) for (const sub of c.subs) { sub.forEach(([x, y], i) => (i ? k.lineTo(x + d[0], y + d[1]) : k.moveTo(x + d[0], y + d[1]))); k.closePath(); } k.clip("nonzero"); draw(g, p); k.restore(); } : draw); });   // a mass keeps its silhouette, found on the lit side, lost into the shade
    tl.wait(8); tl.add(4, (g, p) => seal(g, p));
    return { id: "scene-sumi", medium: SUMI_M, ground, ops: tl.ops, finish: (g) => { g.paper("paper", 0.1); g.paper("coldpress", 0.045); } };
  }, 266);
  runProcess(PROC, ctx, Math.min(f, N), env);
};
