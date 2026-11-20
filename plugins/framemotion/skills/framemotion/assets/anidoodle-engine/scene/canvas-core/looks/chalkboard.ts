// chalkboard: a scene written on the board the way the bundled chalkboard film writes its moon
// phases (anidoodle moonPhases.ts, Apache-2.0, Copyright 2026 Alex Greenshpun; the chalk, the scumble,
// the board, its ghosts and the wooden frame are ported from there). Every stroke is broken by the board's
// tooth and sheds a haze of dust; each thing is scumbled in with the side of the chalk, its lit side gone
// over a second time, its lit edge firm and its shade edge barely there. Dark things stay mostly board:
// only their edge and a rubbed-in haze, as a teacher would draw them.
import { Gfx, rng, type Ctx, type Env, type Medium, type P } from "../core";
import { blob, fillShape, hatchRuns, mix } from "../gallery";
import { W, H, N, scene, shown, lit, fillOf, hex, outlineOf, drawOn, lenOf, areaOf, type Clock, type Region, type Shape } from "../sceneKit";

const CHALK_M: Medium = { nib: 2.1, taper: 0.55, pressure: 0.95, retrace: true, wobble: 1.4, rough: 1.2 };
const CHALK = "#f4f0e6";
const lumOf = (s: Shape) => { const c = fillOf(s); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; };
// a stick of coloured chalk near the scene's colour: pastel, lifted toward white
const stick = (s: Shape) => { const c = fillOf(s), l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; return mix(hex(c.map((v) => l + (v - l) * 1.4) as [number, number, number]), CHALK, 0.42); };

const chalk = (g: Gfx, draw: (dust: boolean) => void, dustAlpha = 0.2) => {
  g.group("plain", () => draw(true), { blur: 3.2, alpha: dustAlpha });
  g.group("plain", () => draw(false), { textures: ["pencilTooth", "risoSpeck"] });
};
const line = (g: Gfx, dust: boolean, pts: P[], w: number, color: string, seed: number, op: number, progress: number) =>
  progress > 0 && g.pen(pts, { w: dust ? w * 2.6 : w, color, seed, wobble: 1, boil: 0, opacity: op, retrace: !dust, taper: 1, progress });
const runsOf = new Map<string, P[][]>();
const scumble = (g: Gfx, dust: boolean, reg: Region, key: string, color: string, o: { angle: number; gap: number; w: number; alpha: number; seed: number; keep?: (x: number, y: number) => boolean; progress: number }) => {
  const { angle, gap, w, alpha, seed, keep = () => true, progress } = o, r = rng(seed), b = reg.box;
  if (progress <= 0) return;
  const c = g.cur; g.touch(b.x0 - 12, b.y0 - 12, b.x1 + 12, b.y1 + 12);
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = color; c.lineWidth = dust ? w * 2.2 : w;
  const k = `${key}:${seed}`; let runs = runsOf.get(k);
  if (!runs) { runs = hatchRuns(b, angle, gap, (x, y) => reg.has(x, y) && keep(x, y), 4, seed); runsOf.set(k, runs); }
  const upto = progress * runs.length;
  runs.forEach((run, i) => { if (i > upto) return; const pts = run.filter((_, kk, a) => kk % 2 === 0 || kk === a.length - 1), m = i + 1 > upto ? Math.max(2, Math.ceil(pts.length * (upto - i))) : pts.length; c.globalAlpha = alpha * (0.86 + r() * 0.2); c.beginPath(); pts.slice(0, m).forEach(([x, y], kk) => (kk ? c.lineTo(x + (r() - 0.5) * 1.5, y + (r() - 0.5) * 1.5) : c.moveTo(x, y))); c.stroke(); });
  c.restore();
};

const M = () => Math.round(Math.min(W, H) * 0.0315), LEDGE = () => H - Math.round(Math.min(W, H) * 0.113);
const board = (g: Gfx, ctx: Ctx) => {
  const gr = ctx.createRadialGradient(W / 2, H * 0.44, 60, W / 2, H * 0.44, Math.hypot(W, H) * 0.47);
  gr.addColorStop(0, "#35493f"); gr.addColorStop(0.62, "#27352f"); gr.addColorStop(1, "#1b2622");
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  g.paper("coldpress", 0.3);
  // the ghosts of erased lessons: wide swipes of haze
  g.group("plain", () => { const r = rng(5); for (let i = 0; i < 9; i++) { const cx = W * (0.11 + r() * 0.78), cy = H * (0.11 + r() * 0.7), rr = Math.min(W, H) * (0.11 + r() * 0.15), a0 = r() * 6, pts: P[] = []; for (let k = 0; k <= 12; k++) { const a = a0 + (k / 12) * 2.2; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.55]); } g.pen(pts, { w: 40 + r() * 30, color: CHALK, seed: 6 + i, wobble: 3, boil: 0, opacity: 0.05, retrace: false, taper: 0.4 }); } }, { blur: 9 });
};
const frame = (g: Gfx) => {
  const B0 = M(), B1 = W - M(), L = LEDGE();
  g.group("plain", () => {
    const wood = "#7b5231", dark = "#553620", r = rng(70);
    fillShape(g, [[0, 0], [W, 0], [W, B0], [0, B0]], wood); fillShape(g, [[0, 0], [B0, 0], [B0, H], [0, H]], wood); fillShape(g, [[B1, 0], [W, 0], [W, H], [B1, H]], wood);
    fillShape(g, [[0, L], [W, L], [W, H], [0, H]], "#6a4526");
    fillShape(g, [[B0 - 8, L - 4], [B1 + 8, L - 4], [B1 + 20, L + 24], [B0 - 20, L + 24]], "#8c6139");
    for (let i = 0; i < 26; i++) { const y = r() * H, x = r() < 0.5 ? r() * B0 : B1 + r() * B0; g.pen([[x, y], [x + (r() - 0.5) * 3, y + 40 + r() * 60]], { w: 0.9, color: dark, seed: 71 + i, wobble: 0.6, boil: 0, opacity: 0.45, retrace: false }); }
    for (let i = 0; i < 16; i++) { const x = r() * W, y = r() < 0.5 ? r() * B0 : L + 30 + r() * Math.max(10, H - L - 40); g.pen([[x, y], [x + 60 + r() * 90, y + (r() - 0.5) * 3]], { w: 0.9, color: dark, seed: 100 + i, wobble: 0.6, boil: 0, opacity: 0.45, retrace: false }); }
    fillShape(g, [[B0, B0], [B1, B0], [B1 - 6, B0 + 8], [B0 + 8, B0 + 8], [B0 + 8, L - 4], [B0, L - 4]], "#0e1512", 0.55);
    for (let i = 0; i < 140; i++) { const x = B0 + r() * (B1 - B0), y = L + 2 + r() * 20; fillShape(g, blob(x, y, 0.8 + r() * 1.8, 0.6 + r(), 110 + i, 0.3, 6), CHALK, 0.25 + r() * 0.45); }
    const sx = W * 0.64; fillShape(g, [[sx + 6, L + 20], [sx + 106, L + 12], [sx + 110, L + 20], [sx + 10, L + 26]], "#3a2616", 0.6);
    fillShape(g, [[sx, L + 2], [sx + 100, L - 6], [sx + 104, L + 10], [sx + 4, L + 18]], CHALK); fillShape(g, [[sx, L + 11], [sx + 104, L + 3], [sx + 104, L + 10], [sx + 4, L + 18]], "#d9d3c6");
    const ex = W * 0.23; fillShape(g, [[ex + 6, L + 20], [ex + 146, L + 14], [ex + 154, L + 24], [ex + 12, L + 28]], "#2a1a0e", 0.6);
    fillShape(g, [[ex, L - 16], [ex + 140, L - 22], [ex + 146, L + 14], [ex + 6, L + 20]], "#a0714a"); fillShape(g, [[ex + 2, L + 4], [ex + 144, L - 2], [ex + 146, L + 14], [ex + 6, L + 20]], "#8e8a86");
  });
};

const picture = (ctx: Ctx, env: Env, clk: Clock) => {
  const g = new Gfx(ctx, env, 0, CHALK_M);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1;
  board(g, ctx);
  // the board is the picture's ground: everything is drawn inside the frame
  const inside = (fn: () => void) => { const c = g.cur; c.save(); c.beginPath(); c.rect(M() + 8, M() + 8, W - 2 * M() - 16, LEDGE() - M() - 12); c.clip(); fn(); c.restore(); };
  scene().forEach((s) => {
    const L = lit(s), seed = 200 + s.i * 11, key = `ch:${s.i}`;
    if (!s.fill) { const p = clk.p("line", lenOf(s.poly[0] ?? []) ** 0.75 + 6); chalk(g, (dust) => inside(() => s.poly.forEach((sub, j) => line(g, dust, sub.filter((_, k, a) => k % 2 === 0 || k === a.length - 1), Math.max(1.3, Math.min(4, s.sw * 0.4)), stick({ ...s, fill: s.stroke }), seed + j, 0.9, p)))); return; }
    const reg = shown(env, s), lum = lumOf(s), col = stick(s), big = s.big, cost = Math.sqrt(areaOf(s)) * 0.9 + 14;
    const face = clk.p("face", cost, big ? 9 : 0), again = big ? 0 : clk.p("again", cost), edge = big ? 0 : clk.p("line", lenOf(outlineOf(s)) ** 0.75 + 6);
    chalk(g, (dust) => inside(() => {
      if (dust) scumble(g, dust, reg, key, CHALK, { angle: 0.7, gap: 5, w: 5, alpha: 0.18 + 0.2 * lum, seed: seed + 1, progress: face });   // chalk rubbed into the board with a finger
      // the face, evenly: a light thing gets a solid scumble, a dark thing only a thin one, a backdrop a light haze
      scumble(g, dust, reg, key, col, { angle: -0.9 + (s.i % 5) * 0.12, gap: big ? 5.5 : 3, w: big ? 4 : 4.4, alpha: big ? 0.12 + 0.3 * lum : 0.1 + 0.55 * Math.pow(lum, 0.8), seed: seed + 2, progress: face });
      if (!big) {
        scumble(g, dust, reg, key, col, { angle: 0.75 + (s.i % 3) * 0.1, gap: 3.2, w: 4.2, alpha: 0.2 + 0.35 * lum, seed: seed + 8, keep: (x, y) => L.side(x, y) < 0.1, progress: again });   // the lit side gone over again
        const e = outlineOf(s).filter((_, i, a) => i % 3 === 0 || i === a.length - 1), n = e.length;
        let cur: P[] = []; const pieces: [P[], boolean][] = [];
        e.forEach((q, i) => { const litSide = L.side(q[0], q[1]) < 0.15; cur.push(q); if (i === n - 1 || (L.side(e[i + 1][0], e[i + 1][1]) < 0.15) !== litSide) { pieces.push([cur, litSide]); cur = [q]; } });
        pieces.forEach(([pts, litSide], j) => pts.length > 1 && line(g, dust, pts, litSide ? 2.3 : 1.4, lum < 0.3 ? CHALK : col, seed + 5 + j, litSide ? 0.95 : 0.5, edge));   // the lit edge firm, the shade edge barely
      }
    }));
  });
  frame(g);
};

const PHASES: Record<string, [number, number]> = { face: [2, 170], again: [172, 212], line: [214, 266] };
export const chalkboardLook = (ctx: Ctx, f: number, env: Env) => drawOn("chalkboard", Math.min(f, N), PHASES, 270, (clk) => picture(ctx, env, clk));
