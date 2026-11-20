// toy-theatre: a scene built on a cardboard toy-theatre stage the way the bundled toy-theatre film
// builds its seaside town (anidoodle paperCraft.ts with scrapbookKit.ts, Apache-2.0, Copyright 2026 Alex
// Greenshpun: the staged runner, scissor, tear and fibres are the kit's; gouache, shade strokes, the
// printed papers, the piece's card edge and shadow, the pose on twos, the curtains, valance and proscenium
// are ported from the film). Every thing is a card piece: painted in visible gouache strokes or cut from a
// printed paper, a darker cut edge down-right, standing a finger's width in front of the flat behind it.
// The theatre is set on the table first, then the scene is built from the back, each piece moved in by
// hand on twos (held high, landing with a small damped jiggle), the curtains and valance last.
import { Gfx, rng, type Ctx, type Env, type Medium, type P } from "../core";
import { bounds, mix, smooth } from "../gallery";
import { clamp01, fibres, path, scissor, staged, tear, type Step } from "../scrapbookKit";
import { W, H, scene, fillOf, hex, sizeOf, outlineOf, areaOf, lit, type Shape } from "../sceneKit";

const PEN: Medium = { nib: 1, taper: 0.3, pressure: 0.3, retrace: false, wobble: 0.4, rough: 0.3 };
const WHITE = "#fbf9f2";
// the stage opening and the theatre box, from the frame (the original's 1080 sheet, proportionally)
const OPEN = { x0: W * 0.139, y0: H * 0.185, x1: W * 0.861, y1: H * 0.789 }, BOX = { x0: W * 0.067, y0: H * 0.093, x1: W * 0.933, y1: H * 0.878 };
// the scene, drawn in to stand on the stage
const KS = Math.min((OPEN.x1 - OPEN.x0) / W, (OPEN.y1 - OPEN.y0 + 30) / H), toStage = ([x, y]: P): P => [(OPEN.x0 + OPEN.x1) / 2 + (x - W / 2) * KS, OPEN.y1 + 4 - (H - y) * KS];

const gouache = (c: Ctx, shape: P[], color: string, seed: number, o: { dir?: number; len?: number; w?: number; vary?: number; dens?: number } = {}) => {
  const { dir = 0, len = 44, w = 13, vary = 0.1, dens = 1 } = o, r = rng(seed), b = bounds(shape), area = (b.x1 - b.x0) * (b.y1 - b.y0);
  c.fillStyle = color; path(c, shape); c.fill();
  c.save(); path(c, shape); c.clip(); c.lineCap = "round";
  const n = Math.max(6, Math.round((area / (len * w)) * 1.6 * dens));
  for (let i = 0; i < n; i++) { const x = b.x0 + r() * (b.x1 - b.x0), y = b.y0 + r() * (b.y1 - b.y0), a = dir + (r() - 0.5) * 0.35, l = len * (0.6 + r() * 0.7), k = r(); c.strokeStyle = k < 0.5 ? mix(color, "#ffffff", vary * (0.5 + r())) : mix(color, "#1d2430", vary * (0.4 + r())); c.globalAlpha = 0.28 + r() * 0.25; c.lineWidth = w * (0.6 + r() * 0.6); c.beginPath(); c.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2); c.lineTo(x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2); c.stroke(); }
  c.restore(); c.globalAlpha = 1;
};
// painted shade: darker strokes laid on the side away from the sun (by the scene's light)
const shadeSide = (c: Ctx, shape: P[], color: string, seed: number, s: Shape) => {
  const b = bounds(shape), r = rng(seed), L = lit(s), area = (b.x1 - b.x0) * (b.y1 - b.y0); c.save(); path(c, shape); c.clip(); c.lineCap = "round";
  const n = Math.max(10, Math.round(area / 900));
  for (let i = 0; i < n * 3 && i < 400; i++) { const x = b.x0 + r() * (b.x1 - b.x0), y = b.y0 + r() * (b.y1 - b.y0); const ox = (x - (OPEN.x0 + OPEN.x1) / 2) / KS + W / 2, oy = H - ((OPEN.y1 + 4 - y) / KS); if (L.side(ox, oy) < 0.35) continue; const l = 16 + r() * 26; c.strokeStyle = color; c.globalAlpha = 0.3 + r() * 0.25; c.lineWidth = 5 + r() * 5; c.beginPath(); c.moveTo(x, y - l / 2); c.lineTo(x + 3, y + l / 2); c.stroke(); }
  c.restore(); c.globalAlpha = 1;
};
const print = (c: Ctx, shape: P[], fn: (b: { x0: number; y0: number; x1: number; y1: number }) => void) => { c.save(); path(c, shape); c.clip(); fn(bounds(shape)); c.restore(); c.globalAlpha = 1; };
const wavePrint = (c: Ctx, shape: P[], col: string, gap = 22, sw = 2) => print(c, shape, (b) => { c.strokeStyle = col; c.lineWidth = sw; c.globalAlpha = 0.55; for (let y = b.y0 + 8, row = 0; y < b.y1 + 10; y += gap, row++) { c.beginPath(); for (let x = b.x0 - 30 + (row % 2) * 15; x < b.x1 + 30; x += 30) { c.moveTo(x, y); c.quadraticCurveTo(x + 7.5, y - 7, x + 15, y); } c.stroke(); } });
const dotPrint = (c: Ctx, shape: P[], col: string, gap = 14, rad = 2.2) => print(c, shape, (b) => { c.fillStyle = col; c.globalAlpha = 0.8; for (let y = b.y0, row = 0; y < b.y1 + gap; y += gap * 0.87, row++) for (let x = b.x0 + (row % 2) * gap * 0.5; x < b.x1 + gap; x += gap) { c.beginPath(); c.arc(x, y, rad, 0, 6.28); c.fill(); } });
const starPrint = (c: Ctx, shape: P[], col: string, seed: number) => print(c, shape, (b) => { const r = rng(seed); c.fillStyle = col; c.globalAlpha = 0.6; for (let i = 0; i < (b.x1 - b.x0) * (b.y1 - b.y0) / 2600; i++) { const x = b.x0 + r() * (b.x1 - b.x0), y = b.y0 + r() * (b.y1 - b.y0); c.beginPath(); c.arc(x, y, 1 + r() * 1.4, 0, 6.28); c.fill(); } });
const woodPrint = (c: Ctx, shape: P[], col: string, seed: number) => print(c, shape, (b) => { const r = rng(seed); c.strokeStyle = col; c.lineWidth = 1; c.globalAlpha = 0.35; for (let y = b.y0; y < b.y1; y += 3 + r() * 4) { c.beginPath(); c.moveTo(b.x0, y); for (let x = b.x0; x <= b.x1; x += 40) c.lineTo(x, y + Math.sin(x * 0.013 + y) * 1.6); c.stroke(); } });

type Piece = { hole?: boolean; id: string; at: [number, number]; from: P; pivot: P; cut: P[][]; border?: number; edge: string; depth: number; face: (c: Ctx) => void };
const cutPath = (c: Ctx, pc: Piece, dx = 0, dy = 0, grow = 0) => { c.save(); c.translate(dx, dy); c.beginPath(); pc.cut.forEach((s) => { s.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }); c.fill(pc.hole ? "evenodd" : "nonzero"); if (pc.border || grow) { c.lineJoin = "round"; c.lineWidth = 2 * ((pc.border ?? 0) + grow); c.strokeStyle = c.fillStyle; c.stroke(); } c.restore(); };
type Pose = { dx: number; dy: number; rot: number; lift: number };
const REST: Pose = { dx: 0, dy: 0, rot: 0, lift: 0 };
const poseAt = (pc: Piece, f: number): Pose => {
  const [s, d] = pc.at, f2 = f - (f % 2); if (f >= s + d) return REST;
  const u = clamp01((f2 - s) / d), r = rng(pc.id.length * 131 + Math.round(f2)), seed = pc.id.charCodeAt(0) + pc.id.length;
  if (u < 0.62) { const v = u / 0.62, e = 1 - (1 - v) ** 2; return { dx: pc.from[0] * (1 - e) + (r() - 0.5) * 1.4, dy: pc.from[1] * (1 - e) + (r() - 0.5) * 1.4, rot: (seed % 2 ? 1 : -1) * 0.04 * (1 - e), lift: 1 - 0.6 * e }; }
  const v = (u - 0.62) / 0.38, damp = Math.exp(-4 * v) * (1 - v);
  return { dx: 0, dy: -2.2 * Math.abs(Math.sin(v * 9)) * damp, rot: (seed % 2 ? 1 : -1) * 0.035 * Math.sin(v * 13 + 0.6) * damp, lift: 0.4 * (1 - v) };
};
const drawPiece = (ctx: Ctx, env: Env, pc: Piece, f: number, p: number) => {
  const q = p >= 1 ? REST : poseAt(pc, f), xf = (c: Ctx) => { c.translate(pc.pivot[0] + q.dx, pc.pivot[1] + q.dy); c.rotate(q.rot); c.translate(-pc.pivot[0], -pc.pivot[1]); };
  const g = new Gfx(ctx, env, 0, PEN), sd = pc.depth * (1 + 2.2 * q.lift), all = pc.cut.flat();
  const box = (c: Ctx) => { if (pc.hole) return; c.beginPath(); c.rect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); c.clip(); };
  g.group("plain", () => { const c = g.cur; c.save(); box(c); xf(c); c.fillStyle = "#2a1c10"; cutPath(c, pc, sd * 0.6, sd); c.restore(); const b = bounds(all), m = (pc.border ?? 0) + sd * 2 + 60; g.touch(b.x0 - m, b.y0 - m, b.x1 + m, b.y1 + m); }, { blur: 2 + sd * 0.5, alpha: 0.36 - 0.1 * q.lift });
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.save(); box(ctx); xf(ctx);
  ctx.fillStyle = pc.edge; cutPath(ctx, pc, 1.2, 1.9);
  if (pc.border) { ctx.fillStyle = WHITE; cutPath(ctx, pc); }
  pc.face(ctx); ctx.restore();
};

// the scene's things as card pieces: a wide backdrop is a printed paper flown in or slid from the wing;
// a thing is a gouache cut-out with a white sticker margin; a thin thing a painted strip of card
const scenePieces = (t0: number, t1: number): Piece[] => {
  const list = scene(), out: Piece[] = [], r = rng(31), n = list.length;
  list.forEach((s, i) => {
    const at: [number, number] = [Math.round(t0 + ((t1 - t0 - 16) * i) / Math.max(1, n)), s.big ? 20 : 14], e = outlineOf(s).map(toStage), col = hex(fillOf(s)), sz = sizeOf(s) * KS;
    const [x0, y0, x1, y1] = s.box.map((v, k) => (k % 2 ? toStage([0, v])[1] : toStage([v, 0])[0])), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (!s.fill) {
      const pts = s.poly.flatMap((sub) => [sub.map(toStage)]), w = Math.max(1.6, s.sw * KS * 0.5);
      out.push({ id: "line" + i, at, from: [0, -160], pivot: [cx, cy], edge: mix(hex(s.stroke!), "#000000", 0.4), depth: 4, cut: pts.map((p) => [...p.map(([x, y]) => [x - w * 0.5, y - w * 0.5] as P), ...[...p].reverse().map(([x, y]) => [x + w * 0.5, y + w * 0.5] as P)]), face: (c) => { c.fillStyle = hex(s.stroke!); pts.forEach((p) => { c.beginPath(); p.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.lineWidth = w * 1.6; c.strokeStyle = hex(s.stroke!); c.lineCap = "round"; c.stroke(); }); } });
      return;
    }
    const blueish = fillOf(s)[2] > fillOf(s)[0] + 10, greenish = fillOf(s)[1] > fillOf(s)[0] + 10 && fillOf(s)[1] > fillOf(s)[2], dark = 0.299 * fillOf(s)[0] + 0.587 * fillOf(s)[1] + 0.114 * fillOf(s)[2] < 70;
    if (s.big || areaOf(s) > 0.12 * W * H) {
      const cut = s.big ? scissor(e, 50 + i, 0.5) : tear(e, 1.6, 50 + i), sky = cy < (OPEN.y0 + OPEN.y1) / 2;
      out.push({ id: "flat" + i, at, from: sky ? [0, -420] : [(r() < 0.5 ? -1 : 1) * 900, 0], pivot: [cx, cy], edge: mix(col, "#000000", 0.35), depth: 3 + Math.min(6, s.layer), cut: [cut],
        face: (c) => { if (s.grad) { const g = c.createLinearGradient(0, y0, 0, y1); s.grad.stops.forEach(([o, cc]) => g.addColorStop(clamp01(o), hex(cc))); c.fillStyle = g; path(c, cut); c.fill(); } else { c.fillStyle = col; path(c, cut); c.fill(); } fibres(c, cut, col, 52 + i, 0.6, 0.2); if (dark && blueish) starPrint(c, cut, "#f3e7b5", 53 + i); else if (blueish) wavePrint(c, cut, mix(col, "#ffffff", 0.35)); else if (greenish) dotPrint(c, cut, mix(col, "#ffffff", 0.3), 13, 2); else woodPrint(c, cut, mix(col, "#3b2a14", 0.3), 54 + i); } });
      return;
    }
    const cut = scissor(e, 60 + i, 0.6);
    out.push({ id: "piece" + i, at, from: [(r() - 0.5) * 300, 150 + r() * 80], pivot: [cx, y1], edge: "#b9ad94", depth: 5 + Math.min(4, s.layer), border: sz > 14 ? 5 : 3, cut: [cut],
      face: (c) => { gouache(c, cut, col, 70 + i, { dir: x1 - x0 > y1 - y0 ? 0 : Math.PI / 2, len: Math.max(8, Math.min(40, sz * 0.4)), w: Math.max(3, Math.min(12, sz * 0.12)), vary: 0.12 }); if (sz > 30) shadeSide(c, cut, mix(col, "#1d2430", 0.35), 71 + i, s); } });
  });
  return out;
};

// ---- the theatre: floor, curtains and valance, proscenium (ported, sized to the frame)
const floor = (at: [number, number]): Piece => { const cut: P[] = [[OPEN.x0 - 20, OPEN.y1 - 20], [OPEN.x1 + 20, OPEN.y1 - 20], [OPEN.x1 + 20, OPEN.y1 + 18], [OPEN.x0 - 20, OPEN.y1 + 18]]; return { id: "floor", at, from: [0, -120], pivot: [W / 2, OPEN.y1], edge: "#6b4424", depth: 4, cut: [cut], face: (c) => { c.fillStyle = "#b07a45"; path(c, cut); c.fill(); woodPrint(c, cut, "#6d4524", 141); } }; };
const curtain = (sg: number, at: [number, number]): Piece => {
  const x0 = sg < 0 ? OPEN.x0 - 6 : OPEN.x1 + 6, k = sg < 0 ? 1 : -1, ow = (OPEN.x1 - OPEN.x0) / 780, oh = (OPEN.y1 - OPEN.y0) / 652, y = (v: number) => OPEN.y0 + (v - 200) * oh;
  const s = smooth([[x0, OPEN.y0 - 6], [x0 + k * 104 * ow, OPEN.y0 - 6], [x0 + k * 84 * ow, y(380)], [x0 + k * 46 * ow, y(560)], [x0 + k * 22 * ow, y(610)], [x0 + k * 40 * ow, y(700)], [x0 + k * 62 * ow, OPEN.y1 + 4], [x0, OPEN.y1 + 4]], false, 6);
  return { id: sg < 0 ? "curtainL" : "curtainR", at, from: [sg * 220, 0], pivot: [x0, y(400)], edge: "#6b1a18", depth: 10, cut: [s],
    face: (c) => { gouache(c, s, "#b8302c", sg < 0 ? 151 : 152, { dir: Math.PI / 2, len: 70, w: 10, vary: 0.18, dens: 1.4 }); c.save(); path(c, s); c.clip(); const r = rng(153 + sg); for (let i = 0; i < 5; i++) { const x = x0 + sg * -1 * (12 + i * 18) * ow; c.strokeStyle = i % 2 ? "#7c1c1a" : "#d9574a"; c.globalAlpha = 0.45; c.lineWidth = 6 + r() * 4; c.beginPath(); c.moveTo(x, OPEN.y0); c.quadraticCurveTo(x + k * 10, y(500), x + k * (14 + i * 6) * ow, OPEN.y1); c.stroke(); } c.restore(); c.globalAlpha = 1; c.strokeStyle = "#e1b54a"; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, y(560)); c.quadraticCurveTo(x0 + k * 30 * ow, y(580), x0 + k * 50 * ow, y(560)); c.stroke(); } };
};
const valance = (at: [number, number]): Piece => {
  const pts: P[] = [[OPEN.x0 - 10, OPEN.y0 - 30], [OPEN.x1 + 10, OPEN.y0 - 30]], n = 9, w = (OPEN.x1 - OPEN.x0 + 20) / n;
  for (let i = n; i >= 1; i--) { const x1 = OPEN.x0 - 10 + i * w; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI; pts.push([x1 - w / 2 + Math.cos(a) * w / 2, OPEN.y0 + 44 + Math.sin(a) * 18]); } }
  return { id: "valance", at, from: [0, -200], pivot: [W / 2, OPEN.y0], edge: "#6b1a18", depth: 10, cut: [pts],
    face: (c) => { gouache(c, pts, "#b8302c", 161, { dir: 0, len: 60, w: 10, vary: 0.16, dens: 1.2 }); c.save(); path(c, pts); c.clip(); c.strokeStyle = "#e1b54a"; c.lineWidth = 5; path(c, pts.map(([x, y]) => [x, y - 5] as P), true); c.stroke(); c.restore(); c.fillStyle = "#e1b54a"; for (let i = 0; i < n - 1; i++) { const x = OPEN.x0 - 10 + (i + 1) * w; c.beginPath(); c.arc(x, OPEN.y0 + 52, 4, 0, 6.28); c.fill(); } } };
};
const proscenium = (at: [number, number]): Piece => {
  const cx = W / 2, top = BOX.y0 + (OPEN.y0 - BOX.y0) * 0.2;
  const OUT: P[] = smooth([[BOX.x0, BOX.y1], [BOX.x0, BOX.y0 + 20], [cx - (OPEN.x1 - OPEN.x0) * 0.23, BOX.y0 + 20], [cx - (OPEN.x1 - OPEN.x0) * 0.13, BOX.y0 - 8], [cx, top - 40], [cx + (OPEN.x1 - OPEN.x0) * 0.13, BOX.y0 - 8], [cx + (OPEN.x1 - OPEN.x0) * 0.23, BOX.y0 + 20], [BOX.x1, BOX.y0 + 20], [BOX.x1, BOX.y1]], false, 5);
  const IN: P[] = [[OPEN.x0, OPEN.y1], [OPEN.x0, OPEN.y0 + 30], ...smooth([[OPEN.x0, OPEN.y0 + 30], [cx, OPEN.y0 - 6], [OPEN.x1, OPEN.y0 + 30]], false, 10).slice(1, -1), [OPEN.x1, OPEN.y0 + 30], [OPEN.x1, OPEN.y1]];
  return { hole: true, id: "pros", at, from: [0, -160], pivot: [cx, H], edge: "#173b3e", depth: 5, cut: [OUT, IN],
    face: (c) => {
      c.save(); path(c, IN); c.clip(); c.fillStyle = "rgba(20,14,8,0.28)"; c.beginPath(); c.rect(OPEN.x0 - 40, OPEN.y0 - 60, OPEN.x1 - OPEN.x0 + 80, OPEN.y1 - OPEN.y0 + 100); path(c, IN.map(([x, y]) => [x + 16, y + 22] as P)); c.fill("evenodd"); c.restore();
      const ring = () => { c.beginPath(); [OUT, IN].forEach((s) => { s.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }); };
      c.fillStyle = "#2f6f73"; ring(); c.fill("evenodd");
      c.save(); ring(); c.clip("evenodd"); print(c, OUT, (b) => { c.fillStyle = "#e6c56a"; c.globalAlpha = 0.5; const gap = 26; for (let y = b.y0, row = 0; y < b.y1 + gap; y += gap / 2, row++) for (let x = b.x0 + (row % 2) * gap / 2; x < b.x1 + gap; x += gap) { c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 3, y); c.lineTo(x, y + 4); c.lineTo(x - 3, y); c.closePath(); c.fill(); } }); c.restore();
      c.save(); ring(); c.clip("evenodd"); fibres(c, OUT, "#2f6f73", 171, 0.5, 0.15); c.restore();
      c.strokeStyle = "#d9ae4a"; c.lineWidth = 14; c.lineJoin = "round"; path(c, IN.map(([x, y]) => [x + (x < cx ? -7 : 7), y + (y > OPEN.y1 - 10 ? 7 : -7)] as P), false); c.stroke();
      c.strokeStyle = "#f2d78a"; c.lineWidth = 3; path(c, IN.map(([x, y]) => [x + (x < cx ? -10 : 10), y + (y > OPEN.y1 - 10 ? 10 : -10)] as P), false); c.stroke();
      const r = rng(172); c.fillStyle = "#9c6f22"; for (let y = OPEN.y0 + 40; y < OPEN.y1; y += 22) [OPEN.x0 - 7, OPEN.x1 + 7].forEach((x) => { c.beginPath(); c.arc(x + (r() - 0.5), y, 2.4, 0, 6.28); c.fill(); });
      const apron: P[] = [[OPEN.x0 - 30, OPEN.y1 + 18], [OPEN.x1 + 30, OPEN.y1 + 18], [OPEN.x1 + 30, BOX.y1 - 16], [OPEN.x0 - 30, BOX.y1 - 16]]; c.fillStyle = "#b8302c"; path(c, apron); c.fill(); fibres(c, apron, "#b8302c", 173, 0.5, 0.2); print(c, apron, (b) => { c.fillStyle = "#f0dcb0"; c.globalAlpha = 0.5; for (let x = b.x0 + 8; x < b.x1; x += 16) c.fillRect(x, b.y0 + 12, 3, b.y1 - b.y0 - 24); });
      const cart: P[] = Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * 6.28; return [cx + Math.cos(a) * 62, top + 18 + Math.sin(a) * 44] as P; }); c.fillStyle = WHITE; c.beginPath(); path(c, cart); c.lineWidth = 10; c.strokeStyle = WHITE; c.stroke(); c.fill();
      gouache(c, cart, "#f1e2c2", 174, { len: 16, w: 6, vary: 0.06 }); const shell: P[] = [[cx, top + 46]]; for (let k = 0; k <= 16; k++) { const a = Math.PI + (k / 16) * Math.PI; shell.push([cx + Math.cos(a) * 40, top + 38 + Math.sin(a) * 40 * (0.85 + 0.15 * Math.abs(Math.sin(k * Math.PI / 2)))]); } gouache(c, shell, "#e58f6f", 175, { dir: -Math.PI / 2, len: 16, w: 5 });
    } };
};

const table = (ctx: Ctx, env: Env) => { ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = "#b8905f"; ctx.fillRect(0, 0, W, H); fibres(ctx, [[0, 0], [W, 0], [W, H], [0, H]], "#b8905f", 201, 1.2, 0.3); };
const post = (ctx: Ctx, env: Env) => { const g = new Gfx(ctx, env, 0, PEN); g.paper("paper", 0.12); g.vignette("rgba(60,36,14,0.32)"); };
// painter's order: the scene back to front, then the floor, the curtains, the valance and the proscenium
// (which arrives first: the theatre is set on the table before the scene is built in it)
let run: ((ctx: Ctx, f: number, env: Env) => void) | null = null;
export const theatreLook = (ctx: Ctx, f: number, env: Env) => {
  if (!run) {
    const PAINTER: Piece[] = [...scenePieces(28, 222), floor([222, 12]), curtain(-1, [234, 14]), curtain(1, [238, 14]), valance([248, 14]), proscenium([4, 20])];
    const steps: Step[] = [{ id: "table", start: -1, end: 0, draw: (c, e) => table(c, e) }, ...PAINTER.map((pc): Step => ({ id: pc.id, start: pc.at[0], end: pc.at[0] + pc.at[1], draw: (c, e, p, ff) => drawPiece(c, e, pc, ff, p) }))];
    run = staged("scene-theatre", steps, post);
  }
  run(ctx, f, env);
};
