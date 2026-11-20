// woodblock: a scene printed the way the bundled woodblock film prints its herons (anidoodle
// woodcut.ts with woodcutKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: carved, grain, washi, rubPath,
// rubMask and bokashi are the kit's; the pull order, the registration and the sheet are ported from the
// film). Water-based pigment from hand-carved blocks onto kozo washi: the keyblock's carved sumi line
// first, then one flat colour block per colour, lightest to darkest, each a hair off register and showing
// the plank's grain, then the bokashi wipes (a sky or a sea graded to nothing). Every pull is rubbed through
// by the baren working down the back of the sheet; the margin stays bare.
import { type Ctx, type Env, type Layer, type P } from "../core";
import { bokashi, carved, clamp, fillAll, grain, path, rubMask, rubPath, washi } from "../woodcutKit";
import { mix } from "../gallery";
import { W, H, scene, fillOf, hex, outlineOf, areaOf, type Shape, type RGB } from "../sceneKit";

const SUMI = "#1f1b18";
// the picture area: a bare margin all round, wider at the foot, as a print's
const IN = () => { const m = Math.min(W, H) * 0.06; return { x0: m, y0: m, x1: W - m, y1: H - m * 1.5 }; };
const box = (x0: number, y0: number, x1: number, y1: number): P[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// a woodblock pigment near the scene's colour: softened toward the washi, a little muted
const pigment = (c: RGB) => { const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return mix(hex(c.map((v) => l + (v - l) * 0.82) as RGB), "#efe6d1", 0.1); };
const lumH = (h: string) => { const v = parseInt(h.slice(1), 16); return 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255); };
type Block = { id: string; color: string; alpha: number; reg: P; grain: number; seed: number; area: number; cut: (c: Ctx) => void };

const shapePath = (c: Ctx, s: Shape) => { c.beginPath(); for (const sub of s.subs) { sub.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); } };
// a thing's flat as the wood is left standing: its shape, minus everything printed in front of it
const flat = (c: Ctx, s: Shape, color: string, list: Shape[]) => {
  c.save(); shapePath(c, s); c.clip(s.rule); c.fillStyle = color; c.fillRect(s.box[0] - 2, s.box[1] - 2, s.box[2] - s.box[0] + 4, s.box[3] - s.box[1] + 4);
  c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000";
  list.forEach((o) => { if (o.i <= s.i || !o.fill || o.box[0] > s.box[2] || o.box[2] < s.box[0] || o.box[1] > s.box[3] || o.box[3] < s.box[1]) return; shapePath(c, o); c.fill(o.rule); });
  c.restore();
};

const blocks = (): Block[] => {
  const list = scene(), A = W * H, out: Block[] = [], I = IN();
  // the keyblock: the frame line, every thing's outline as a carved ridge, thin things as carved lines
  out.push({ id: "key", color: SUMI, alpha: 0.95, reg: [0, 0], grain: 0.06, seed: 1, area: A, cut: (c) => {
    const k = (pts: P[], w: number, s: number, o = {}) => pts.length > 1 && fillAll(c, [carved(pts, w, s, o)], SUMI);
    k([[I.x0, I.y0], [I.x1, I.y0]], 3.2, 11, { smooth: false }); k([[I.x1, I.y0], [I.x1, I.y1]], 3.2, 12, { smooth: false }); k([[I.x1, I.y1], [I.x0, I.y1]], 3.2, 13, { smooth: false }); k([[I.x0, I.y1], [I.x0, I.y0]], 3.2, 14, { smooth: false });
    c.save(); path(c, box(I.x0, I.y0, I.x1, I.y1)); c.clip();
    list.forEach((s) => {
      // a thing in front hides the lines behind it: clear its inside, then carve its own outline
      if (s.fill) { c.save(); c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000"; shapePath(c, s); c.fill(s.rule); c.restore(); }
      if (s.fill && s.big) return;
      if (!s.fill) { s.poly.forEach((sub, j) => k(sub, Math.max(1.2, Math.min(4, s.sw * 0.45)), 300 + s.i * 7 + j, { tail: 0.6 })); return; }
      const e = outlineOf(s), w = areaOf(s) > 0.01 * A ? 2.6 : 1.8;
      // the outline in a few cuts, the carver re-setting the knife at the corners
      const step = Math.max(12, Math.round(e.length / 6));
      for (let a = 0; a < e.length - 1; a += step) k(e.slice(a, Math.min(e.length, a + step + 2)), w, 100 + s.i * 13 + a, { smooth: false, tail: 0.85 });
      k([e[e.length - 1], e[0]], w, 99 + s.i, { smooth: false });
    });
    c.restore();
  } });
  // one colour block per colour, lightest to darkest; a graded thing prints its lightest colour flat here
  const groups = new Map<string, Shape[]>();
  list.filter((s) => s.fill).forEach((s) => { const col = pigment(s.grad ? s.grad.stops.reduce((a, b) => (0.299 * b[1][0] + 0.587 * b[1][1] + 0.114 * b[1][2] > 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2] ? b[1] : a), s.grad.stops[0][1]) : fillOf(s)); const key = [...groups.keys()].find((g) => { const a = parseInt(g.slice(1), 16), b = parseInt(col.slice(1), 16); return Math.hypot((a >> 16) - (b >> 16), ((a >> 8) & 255) - ((b >> 8) & 255), (a & 255) - (b & 255)) < 20; }) ?? col; groups.set(key, [...(groups.get(key) ?? []), s]); });
  [...groups.entries()].sort((a, b) => lumH(b[0]) - lumH(a[0])).forEach(([col, ss], k) => {
    const area = ss.reduce((a, s) => a + areaOf(s), 0) / A;
    out.push({ id: "c" + k, color: col, alpha: 0.9, reg: [((k * 37) % 5) - 2, ((k * 23) % 5) - 2], grain: 0.1 + 0.25 * clamp(area * 2), seed: 2 + k, area: area * A, cut: (c) => { c.save(); path(c, box(I.x0, I.y0, I.x1, I.y1)); c.clip(); ss.forEach((s) => flat(c, s, col, list)); c.restore(); } });
  });
  // bokashi: each graded thing (a sky, a sea) wiped from its darkest edge to nothing
  list.filter((s) => s.fill && s.grad).forEach((s, k) => {
    const g = s.grad!, dark = g.stops.reduce((a, b) => (0.299 * b[1][0] + 0.587 * b[1][1] + 0.114 * b[1][2] < 0.299 * a[1][0] + 0.587 * a[1][1] + 0.114 * a[1][2] ? b : a)), col = pigment(dark[1]);
    const [x0, y0, x1, y1] = s.box, top = (dark[0] < 0.5) === (g.y2 >= g.y1), yFull = top ? Math.max(y0, I.y0) : Math.min(y1, I.y1), yGone = top ? y0 + (y1 - y0) * 0.8 : y0 + (y1 - y0) * 0.2;
    out.push({ id: "b" + k, color: col, alpha: 0.9, reg: [0.5, 0], grain: 0.26, seed: 40 + k, area: areaOf(s), cut: (c) => { c.save(); path(c, box(I.x0, I.y0, I.x1, I.y1)); c.clip(); const L = c.canvas; void L; c.save(); shapePath(c, s); c.clip(s.rule); bokashi(c, x0, x1, yFull, yGone, col, 841 + k); c.restore(); c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000"; list.forEach((o) => { if (o.i > s.i && o.fill) { shapePath(c, o); c.fill(o.rule); } }); c.restore(); } });
  });
  return out;
};

// ---- the pulls (ported from woodcut.ts: the sheet after n pulls, the pull in progress rubbed through)
const cache = new Map<string, unknown>();
const BL = () => (cache.get("blocks") as Block[] | undefined) ?? (() => { const b = blocks(); cache.set("blocks", b); return b; })();
const blockLayer = (env: Env, b: Block): Layer => {
  const key = `block:${b.id}:${env.scale}`; let L = cache.get(key) as Layer | undefined; if (L) return L;
  const k = env.scale; L = env.canvas(Math.round(W * k), Math.round(H * k)); const c = L.ctx;
  c.setTransform(k, 0, 0, k, b.reg[0] * k, b.reg[1] * k); b.cut(c);
  grain(c, env, b.grain, [b.seed * 97 % 512, b.seed * 211 % 512], ((b.seed % 3) - 1) * 0.004);
  cache.set(key, L); return L;
};
const pulls = () => (cache.get("pulls") as { b: Block; start: number; end: number }[] | undefined) ?? (() => {
  // a big block is a long pull, a small one quick, a breath between them while the next block is inked
  const bl = BL(), A = W * H, w = bl.map((b) => 10 + 40 * Math.sqrt(clamp(b.area / A))), PAUSE = 4, total = w.reduce((a, b) => a + b, 0) + PAUSE * (bl.length - 1), k = Math.min(1, 262 / total);
  let t = 2; const out = bl.map((b, i) => { const p = { b, start: t, end: t + w[i] * k }; t = p.end + PAUSE * k; return p; });
  cache.set("pulls", out); return out;
})();
const sheet = (env: Env, n: number): Layer => {
  const key = `sheet:${n}:${env.scale}`; let L = cache.get(key) as Layer | undefined; if (L) return L;
  const DW = Math.round(W * env.scale), DH = Math.round(H * env.scale), bl = BL();
  L = env.canvas(DW, DH); const c = L.ctx; c.setTransform(1, 0, 0, 1, 0, 0);
  if (n > 0) c.drawImage(sheet(env, n - 1).canvas as CanvasImageSource, 0, 0); else c.drawImage(washi(env).canvas as CanvasImageSource, 0, 0);
  if (n > 0) { const b = bl[n - 1]; c.globalCompositeOperation = "multiply"; c.globalAlpha = b.alpha; c.drawImage(blockLayer(env, b).canvas as CanvasImageSource, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
  cache.set(key, L); return L;
};
const bbox = (b: Block) => { const I = IN(); return { x0: I.x0 - 10, y0: I.y0 - 10, x1: I.x1 + 10, y1: I.y1 + 10, ...(b.id === "key" ? {} : {}) }; };
export const woodblockLook = (ctx: Ctx, f: number, env: Env) => {
  const ps = pulls();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  let n = 0; while (n < ps.length && f >= ps[n].end) n++;
  ctx.drawImage(sheet(env, n).canvas as CanvasImageSource, 0, 0);
  const p = ps[n]; if (!p || f < p.start) return;
  const u = (f - p.start) / (p.end - p.start), s = env.scale, DW = Math.round(W * s), DH = Math.round(H * s), PAD = Math.min(W, H) * 0.23;
  let m = cache.get("mask") as Layer | undefined; if (!m) { m = env.canvas(DW, DH); cache.set("mask", m); }
  const c = m.ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, DW, DH);
  c.setTransform(s, 0, 0, s, 0, 0); rubMask(c, rubPath(bbox(p.b), PAD), u, PAD, p.b.seed * 7);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-in"; c.drawImage(blockLayer(env, p.b).canvas as CanvasImageSource, 0, 0); c.globalCompositeOperation = "source-over";
  ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = p.b.alpha; ctx.drawImage(m.canvas as CanvasImageSource, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
};
