// oil: a scene painted in oil the way the bundled oil film paints its pears and copper pot (anidoodle
// paintedOilKit.ts with paintedOil.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the loaded hog-bristle
// stroke with its drag, ridges and impasto, the region fill that lays strokes along the form, and the
// linen weave are the kit's; the stages, the lost edge on the shadow side and the process runner from
// sumiEKit are ported from the film). A toned ground rubbed over the priming, a thin burnt-umber drawing,
// the dark masses blocked in with a big brush and lean paint, the mid tones wet into wet, the lights on
// the side facing the light, the impasto highlights and the last dark accents. The edge is found on the
// lit side and lost in shadow.
import { Gfx, rng, type P } from "../core";
import { mix } from "../gallery";
import { darken, fill, lighten, oilStroke, weave, type OStroke } from "../paintedOilKit";
import { fit, runProcess, timeline, type Proc } from "../sumiEKit";
import { W, H, N, scene, lit, fillOf, hex, sizeOf, outlineOf, areaOf, type Shape } from "../sceneKit";

const OIL_M = { nib: 1, taper: 0.4, pressure: 0.8, retrace: false, wobble: 0.6, rough: 0.6 };
const TONE = "#9a6a44", UMBER = "#4a2c18";
type Clip = { keep?: P[][]; out?: P[][] };
type Stage = { name: string; clip?: Clip; strokes: OStroke[]; per: number };
const shift = (pts: P[], dx: number, dy: number): P[] => pts.map(([x, y]) => [x + dx, y + dy]);
const lost = (pts: P[], dx = 9, dy = 3): Clip => ({ keep: [pts, shift(pts, dx, dy)] });   // the shadow side's paint spills past the outline
const paint = (s: Shape) => { const c = fillOf(s), l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return hex(c.map((v) => l + (v - l) * 0.9) as [number, number, number]); };
const dirOf = (s: Shape) => { const w = s.box[2] - s.box[0], h = s.box[3] - s.box[1]; return s.big ? 0.02 : w > h * 1.3 ? 0.05 : h > w * 1.3 ? Math.PI / 2 - 0.1 : 0.7; };

let STAGES: Stage[] | null = null;
const stages = (): Stage[] => STAGES ??= (() => {
  const S: Stage[] = [], list = scene(), things = list.filter((s) => s.fill && !s.big), backs = list.filter((s) => s.fill && s.big);
  const tr = rng(3), toning: OStroke[] = [], n = Math.ceil((H + 80) / 76);
  for (let i = 0; i < n; i++) { const y = -40 + i * 76 + tr() * 30, a = (i % 2 ? 0.12 : -0.1) + (tr() - 0.5) * 0.1; toning.push({ ctrl: [[-80, y - a * 600], [W / 2, y + (tr() - 0.5) * 40], [W + 80, y + a * 600]], w: 150, c0: mix(TONE, "#7e5636", tr() * 0.5), c1: mix(TONE, "#a87a50", tr() * 0.5), load: 1.1, dry: 0.5, impasto: 0, alpha: 0.5, jit: 0.04, seed: 10 + i }); }
  S.push({ name: "tone", strokes: toning, per: 2.6 });
  // the drawing: thin burnt umber, a small brush, searching lines along what shows of each thing
  const lines: OStroke[] = [];
  things.forEach((s) => { const e = outlineOf(s), k = Math.max(1, Math.round(e.length / 40)); for (let a = 0; a < e.length - 2; a += Math.ceil(e.length / Math.max(2, k * 2))) { const seg = e.slice(a, Math.min(e.length, a + Math.ceil(e.length / Math.max(2, k * 2)) + 2)); if (seg.length > 2) lines.push({ ctrl: [seg[0], seg[seg.length >> 1], seg[seg.length - 1]], w: 3.2, c0: UMBER, load: 1, dry: 0.15, impasto: 0, alpha: 0.7, seed: 40 + s.i * 31 + a }); } });
  S.push({ name: "drawing", strokes: lines, per: 0.9 });
  // the backdrop: big brush, lean paint, by value; then the dark masses of each thing
  backs.forEach((s) => { const L = lit(s), c = paint(s); const [bx0, by0, bx1, by1] = s.box, cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2; S.push({ name: "back" + s.i, per: 1.6, strokes: fill({ region: outlineOf(s).map(([x, y]) => [cx + (x - cx) * 1.08, cy + (y - cy) * 1.08] as P), step: Math.max(48, Math.min(96, Math.sqrt(areaOf(s)) * 0.1)), len: 300, w: 100, dir: () => dirOf(s), seed: 100 + s.i, load: 1.05, dry: 0.42, impasto: 0.04, bend: 0.12, jit: 0.035, soft: 0.25, color: (x, y) => { const sd = L.side(x, y); return sd > 0 ? darken(c, 0.25 * sd) : lighten(c, 0.12 * -sd); }, sweep: 0 }) }); });
  things.forEach((s) => { const L = lit(s), c = paint(s), sz = sizeOf(s), e = outlineOf(s); S.push({ name: "dark" + s.i, clip: lost(e), per: 0.5, strokes: fill({ region: e, step: Math.max(10, sz * 0.18), len: Math.max(20, sz * 0.7), w: Math.max(8, sz * 0.22), dir: () => dirOf(s), seed: 130 + s.i, dry: 0.3, impasto: 0.08, jit: 0.03, soft: 0.3, color: (x, y) => (L.side(x, y) > 0.1 ? darken(c, 0.35) : null) }) }); });
  // the mid tones, wet into wet: each stroke loaded with one value picks up the next across the form
  things.forEach((s) => { const L = lit(s), c = paint(s), sz = sizeOf(s), e = outlineOf(s); S.push({ name: "mid" + s.i, clip: lost(e, 6, 2), per: 0.45, strokes: fill({ region: e, step: Math.max(8, sz * 0.13), len: Math.max(16, sz * 0.55), w: Math.max(6, sz * 0.17), dir: () => dirOf(s), seed: 160 + s.i, dry: 0.25, impasto: 0.16, jit: 0.03, soft: 0.25, color: (x, y) => { const sd = L.side(x, y); return sd > 0.5 ? darken(c, 0.25) : sd < -0.5 ? lighten(c, 0.12) : c; } }) }); });
  // the lights, on the side facing the window, fatter paint
  things.forEach((s) => { const L = lit(s), c = paint(s), sz = sizeOf(s), e = outlineOf(s); S.push({ name: "light" + s.i, clip: { keep: [e] }, per: 0.6, strokes: fill({ region: e, step: Math.max(7, sz * 0.12), len: Math.max(12, sz * 0.4), w: Math.max(5, sz * 0.14), dir: () => dirOf(s), seed: 200 + s.i, dry: 0.35, impasto: 0.28, jit: 0.03, soft: 0.25, color: (x, y) => (L.side(x, y) < -0.25 ? lighten(c, 0.3) : null) }) }); });
  // impasto highlights and the last dark accents
  const hi: OStroke[] = [];
  things.filter((s) => sizeOf(s) > 24 && areaOf(s) < 0.06 * W * H).forEach((s) => { const [x0, y0, x1, y1] = s.box, x = x0 + (x1 - x0) * 0.32, y = y0 + (y1 - y0) * 0.26, w = Math.max(4, sizeOf(s) * 0.06); hi.push({ ctrl: [[x - w, y + w * 0.3], [x, y], [x + w, y - w * 0.2]], w: w * 1.2, c0: lighten(paint(s), 0.6), c1: lighten(paint(s), 0.45), load: 1.4, dry: 0, impasto: 1, jit: 0.01, soft: 0, seed: 300 + s.i }); });
  list.filter((s) => !s.fill).forEach((s) => s.poly.forEach((q, j) => { const step = Math.max(1, Math.round(q.length / Math.max(3, Math.round(q.length / 6)))), ctrl = q.filter((_, i, a) => i % step === 0 || i === a.length - 1); if (ctrl.length > 1) hi.push({ ctrl, w: Math.max(2, s.sw * 0.7), c0: hex(s.stroke!), c1: darken(hex(s.stroke!), 0.2), load: 1.1, dry: 0.25, impasto: 0.4, jit: 0.04, seed: 330 + s.i * 7 + j }); }));
  S.push({ name: "accents", per: 3, strokes: hi });
  return S;
})();

const withClip = (g: Gfx, clip: Clip | undefined, fn: () => void) => {
  if (!clip) return fn();
  const c = g.cur; c.save(); c.beginPath();
  if (clip.keep) { clip.keep.forEach((p) => { c.moveTo(p[0][0], p[0][1]); p.forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); }); c.clip("nonzero"); }
  fn(); c.restore();
};
const build = (k: number): Proc => {
  const tl = timeline(2, k, true);
  stages().forEach((st, si) => {
    const B = Math.max(1, Math.round(2 / st.per));
    for (let a = 0; a < st.strokes.length; a += B) { const batch = st.strokes.slice(a, a + B); tl.add(batch.length * st.per, (g, p) => withClip(g, st.clip, () => { const f = p * batch.length; batch.forEach((s, i) => { if (p >= 1 || i < Math.floor(f)) oilStroke(g, s, 1); else if (i === Math.floor(f)) oilStroke(g, s, f - i); }); })); }
    tl.wait(si < 2 ? 8 : 1);
  });
  return { id: "scene-oil", medium: OIL_M, ground: (g) => { const c = g.cur, e = g.env; c.setTransform(e.scale, 0, 0, e.scale, 0, 0); c.fillStyle = "#efe8da"; c.fillRect(0, 0, W, H); weave(g, 0.55); }, ops: tl.ops, finish: (g) => weave(g, 0.3) };
};
let PROC: Proc | null = null;
export const oilLook = (ctx: CanvasRenderingContext2D, f: number, env: Parameters<typeof runProcess>[3]) => { PROC ??= fit(build, 266); runProcess(PROC, ctx, Math.min(f, N), env); };
