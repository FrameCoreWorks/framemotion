// scrapbook: a scene as a copperplate engraving on a torn card taped into an old album, the way the
// bundled scrapbook film makes its honeybee page (anidoodle scrapbook.ts with scrapbookKit.ts, Apache-2.0,
// Copyright 2026 Alex Greenshpun: the burin cut, engrave, cutLine with its occluders, the staged runner,
// tear, fibres and shadowOf are the kit's; the foxed page, the card and the cellulose tape are ported from
// the film). Every tone is a burin line that swells where it is pressed and comes to a point where it
// lifts: each thing contour-hatched round its form (rings following its outline, darker toward its shade
// side), cross-hatched only in the darks, a wide sky or field ruled in parallel lines; then a thin hand
// tint, as plates were; then a red pen ringing the subject. The light is the scene's, upper left.
import { Gfx, fractal, rng, type Ctx, type Env, type Medium, type P } from "../core";
import { hatchRuns, mix, smooth } from "../gallery";
import { GLYPHS, cutLine, easeOut, engrave, fibres, occluder, path, rect, shadowOf, staged, tear, typed, type Cut, type Occluder, type Step } from "../scrapbookKit";
import { W, H, title, scene, lit, fillOf, hex, sizeOf, outlineOf, areaOf, raster, lumAt, idAt, type Shape } from "../sceneKit";

const INK = "#2a2019", PARCH = "#e8d6b2", RED = "#c23a2a";
const PEN: Medium = { nib: 1, taper: 0.35, pressure: 0.35, retrace: false, wobble: 0.5, rough: 0.35 };
// the card: torn from cream stock, tilted a little, the engraving drawn in to fit it
const CARD = { cx: W / 2 + 4, cy: H * 0.47, w: W * 0.8, h: H * 0.72, rot: -0.018, torn: 2.6, seed: 41, color: "#f3e9d2", from: [0, -60] as P };
const K = Math.min((CARD.w - 70) / W, (CARD.h - 120) / H), toCard = ([x, y]: P): P => [CARD.cx + (x - W / 2) * K, CARD.cy - 22 + (y - H / 2) * K];
const toPage = (q: P, dx = 0, dy = 0): P => { const c = Math.cos(CARD.rot), s = Math.sin(CARD.rot); return [CARD.cx + dx + q[0] * c - q[1] * s, CARD.cy + dy + q[0] * s + q[1] * c]; };

const page = (ctx: Ctx, env: Env) => {
  const r = rng(301); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  ctx.fillStyle = PARCH; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H, R = 120 + r() * 260, gr = ctx.createRadialGradient(x, y, 0, x, y, R), col = r() < 0.55 ? "#f4e7c9" : "#caa874"; gr.addColorStop(0, col); gr.addColorStop(1, col + "00"); ctx.globalAlpha = 0.28; ctx.fillStyle = gr; ctx.fillRect(x - R, y - R, R * 2, R * 2); }
  const eg = (x0: number, y0: number, x1: number, y1: number) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "rgba(120,78,30,0.34)"); gr.addColorStop(1, "rgba(120,78,30,0)"); ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); };
  eg(0, 0, 60, 0); eg(W, 0, W - 70, 0); eg(0, 0, 0, 55); eg(0, H, 0, H - 80);
  const drift = (cx: number, cy: number, sx: number, sy: number, n: number, big: number) => { for (let i = 0; i < n; i++) { const x = cx + (r() + r() - 1) * sx, y = cy + (r() + r() - 1) * sy, s = (0.6 + r() * r() * big) * 2.2; ctx.globalAlpha = 0.18 + r() * 0.25; ctx.fillStyle = "#a4652a"; path(ctx, smooth(Array.from({ length: 7 }, (_, k) => { const a = (k / 7) * 6.28; return [x + Math.cos(a) * s * (0.8 + r() * 0.4), y + Math.sin(a) * s * (0.8 + r() * 0.4)] as P; }), true, 4)); ctx.fill(); } };
  drift(W - 40, H * 0.4, 30, H * 0.3, 70, 3); drift(50, H - 60, 50, 40, 40, 2.5); drift(W * 0.5, H * 0.95, W * 0.3, 12, 30, 1.5);
  ctx.globalAlpha = 1; fibres(ctx, [[0, 0], [W, 0], [W, H], [0, H]], PARCH, 305, 0.6, 0.12);
};
const cardShape = () => tear(rect(CARD.w, CARD.h), CARD.torn, CARD.seed);
const drawCard = (ctx: Ctx, env: Env, p: number) => {
  const e = easeOut(p), dx = CARD.from[0] * (1 - e), dy = CARD.from[1] * (1 - e), lift = 1 + 6 * (1 - e) * (1 - e);
  const g = new Gfx(ctx, env, 0, PEN), sh = cardShape().map((q) => toPage(q, dx, dy));
  shadowOf(g, [sh], [2.5 * lift, 4 * lift], 3 + 2.5 * lift, 0.34 / Math.sqrt(lift));
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  ctx.fillStyle = CARD.color; path(ctx, sh); ctx.fill();
  fibres(ctx, sh, CARD.color, CARD.seed + 5, 0.8, 0.28);
  ctx.strokeStyle = mix(CARD.color, "#7a5a30", 0.35); ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2; path(ctx, sh); ctx.stroke(); ctx.globalAlpha = 1;
};
const tape = (ctx: Ctx, env: Env, at: P, ang: number, len: number, p: number, seed: number) => {
  if (p <= 0) return; const r = rng(seed), L = len * easeOut(p), h = 30, c = Math.cos(ang), s = Math.sin(ang), T = ([x, y]: P): P => [at[0] + x * c - y * s, at[1] + x * s + y * c];
  const top: P[] = [], bot: P[] = []; for (let k = 0; k <= 5; k++) top.push([-len / 2 + (r() - 0.5) * 3, -h / 2 + (k * h) / 5]);
  const endX = -len / 2 + L; for (let k = 5; k >= 0; k--) bot.push([endX + (k % 2 ? 3 : -2) * (p >= 1 ? 1 : 0), -h / 2 + (k * h) / 5]);
  const sh = [...top, ...bot].map(T); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  const g = new Gfx(ctx, env, 0, PEN); shadowOf(g, [sh], [1, 1.5], 1.5, 0.12); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  ctx.globalAlpha = 0.5; ctx.fillStyle = "#efe0a8"; path(ctx, sh); ctx.fill();
  ctx.globalAlpha = 0.28; ctx.fillStyle = "#fffbe8"; path(ctx, ([[-len / 2 + 4, -h / 2 + 4], [endX - 4, -h / 2 + 4], [endX - 4, -h / 2 + 8], [-len / 2 + 4, -h / 2 + 9]] as P[]).map(T)); ctx.fill();
  ctx.globalAlpha = 1;
};

// ---- the engraving: cuts in the order an engraver cuts them (contours, form shading, cross-hatch, the rules)
const lumOf = (s: Shape) => { const c = fillOf(s); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; };
const engraving = (env: Env) => {
  const list = scene(), r = raster(env), occ = (s: Shape): Occluder[] => list.filter((o) => o.i > s.i && o.fill).map((o) => occluder(outlineOf(o).map(toCard)));
  const contours: Cut[] = [], shading: Cut[] = [], cross: Cut[] = [], rules: Cut[] = [];
  list.forEach((s) => {
    const o = occ(s), L = lit(s);
    if (!s.fill) { s.poly.forEach((sub) => contours.push(cutLine(sub.map(toCard), (_x, _y, i, n) => Math.max(0.5, Math.min(2.4, s.sw * K * 0.6)) * (0.6 + 0.4 * Math.sin((Math.PI * i) / Math.max(1, n - 1))), o))); return; }
    const e = outlineOf(s);
    if (s.big) {
      // a wide sky or field: ruled lines, closer and heavier where it is darker
      const [x0, y0, x1, y1] = s.box;
      for (const run of hatchRuns({ x0, y0, x1, y1 }, 0, 7.5 / K, (x, y) => idAt(r, x, y) === s.i, 3, 7 + s.i)) rules.push(cutLine(run.map(toCard), (x, y) => { const ox = (x - CARD.cx) / K + W / 2, oy = (y - CARD.cy + 22) / K + H / 2; return 0.1 + 0.75 * Math.pow(1 - lumAt(r, ox, oy), 1.4) + 0.2 * Math.max(0, L.side(ox, oy)); }, o));
      return;
    }
    contours.push(cutLine(e.map(toCard), (x, y) => { const ox = (x - CARD.cx) / K + W / 2, oy = (y - CARD.cy + 22) / K + H / 2; return L.side(ox, oy) > 0 ? 1.6 : 0.9; }, o));
    // contour hatching: rings following the outline inward, each swelling toward the shade side
    const [x0, y0, x1, y1] = s.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sz = sizeOf(s), rings = Math.max(1, Math.min(22, Math.floor((sz * K) / 7))), tone = 1 - lumOf(s);
    for (let k = 1; k <= rings; k++) {
      const f = 1 - k / (rings + 1), ring = e.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f] as P);
      shading.push(cutLine(ring.map(toCard), (x, y) => { const ox = (x - CARD.cx) / K + W / 2, oy = (y - CARD.cy + 22) / K + H / 2, sd = L.side(ox, oy); if (idAt(r, ox, oy) !== s.i) return 0; return Math.max(0, 0.15 + 1.25 * tone + 0.9 * sd) * (0.75 + 0.25 * fractal(s.i, x, y, 0.05, 0.05, 1)); }, o));
    }
    // cross-hatch the darks only
    if (tone > 0.35 || sz > 60) for (const run of hatchRuns({ x0, y0, x1, y1 }, 0.78, 5 / K, (x, y) => idAt(r, x, y) === s.i && (L.side(x, y) > 0.5 || tone > 0.7), 3, 9 + s.i)) cross.push(cutLine(run.map(toCard), () => 0.55 + 0.6 * tone, o));
  });
  return { contours, shading, cross, rules };
};

const cache = new Map<string, unknown>();
let run: ((ctx: Ctx, f: number, env: Env) => void) | null = null;
const inCard = (c: Ctx, env: Env) => { c.setTransform(env.scale, 0, 0, env.scale, 0, 0); c.beginPath(); cardShape().map((q) => toPage(q)).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip(); };
// the plate: the picture's own rectangle on the card, the cuts kept inside it, and its border ruled twice as prints are
const plate = (): [P, P] => [toCard([0, 0]), toCard([W, H])];
const inPlate = (c: Ctx) => { const [a, b] = plate(); c.beginPath(); c.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); c.clip(); };
const border = (): Cut[] => { const [a, b] = plate(), box = (d: number): P[] => [[a[0] - d, a[1] - d], [b[0] + d, a[1] - d], [b[0] + d, b[1] + d], [a[0] - d, b[1] + d], [a[0] - d, a[1] - d]]; return [cutLine(box(0), () => 1.1), cutLine(box(6), () => 0.5)]; };
export const scrapbookLook = (ctx: Ctx, f: number, env: Env) => {
  if (!run) {
    const E = (cache.get("eng") as ReturnType<typeof engraving> | undefined) ?? (() => { const v = engraving(env); cache.set("eng", v); return v; })();
    const cutStep = (id: string, cuts: Cut[], a: number, b: number): Step => ({ id, start: a, end: b, draw: (c, e, p) => { c.save(); inCard(c, e); if (id === "border") engrave(c, cuts, p, INK); else { inPlate(c); engrave(c, cuts, p, INK); } c.restore(); } });
    // the subject: the biggest thing in the frontmost group that has a thing of any size (the scene is written back to front)
    const list = scene().filter((s) => s.fill && !s.big && areaOf(s) > 0.004 * W * H), hero = list.reduce<Shape | null>((a, s) => (!a || s.layer > a.layer || (s.layer === a.layer && areaOf(s) > areaOf(a)) ? s : a), null);
    const tint: Step = { id: "tint", start: 214, end: 238, draw: (c, e, p) => { c.save(); inCard(c, e); inPlate(c); c.globalCompositeOperation = "multiply"; scene().filter((s) => s.fill).forEach((s, i, a) => { const q = Math.max(0, Math.min(1, p * a.length - i)); if (q <= 0) return; c.globalAlpha = (s.big ? 0.12 : 0.26) * q; c.fillStyle = hex(fillOf(s)); c.beginPath(); for (const sub of s.subs) { sub.map(toCard).forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); } c.fill(s.rule); }); c.restore(); } };
    const pen: Step = { id: "pen", start: 242, end: 262, draw: (c, e, p) => { if (!hero) return; const g = new Gfx(c, e, 0, { nib: 1.3, taper: 1, pressure: 1, retrace: false, wobble: 1.2, rough: 0.4 }); const [x0, y0, x1, y1] = hero.box, a = toCard([x0, y0]), b = toCard([x1, y1]), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, rx = (b[0] - a[0]) / 2 + 16, ry = (b[1] - a[1]) / 2 + 14; const ring: P[] = Array.from({ length: 30 }, (_, i) => { const t = -1.9 + (i / 29) * Math.PI * 2.15; return [cx + Math.cos(t) * rx * (1 + i * 0.004), cy + Math.sin(t) * ry]; }); c.setTransform(e.scale, 0, 0, e.scale, 0, 0); g.group("plain", () => g.pen(ring, { w: 2.2, color: RED, seed: 7, boil: 0, opacity: 0.9, progress: p })); } };
    // the caption under the plate, typed one strike at a time, as the film captions its figures
    const words = ("FIG. 1   " + title().toUpperCase()).split("").filter((ch) => ch === " " || ch in GLYPHS).join("").trim(), capY = CARD.cy - 22 + (H / 2) * K + 34, capX = CARD.cx - (W / 2) * K;
    const cap: Step = { id: "cap", start: 230, end: 242, draw: (c, e, p) => { c.save(); inCard(c, e); typed(c, words, capX, capY, 13, "#221d1a", 31, p >= 1 ? Infinity : Math.floor(p * words.length)); c.restore(); } };
    const tl: P = toPage([-CARD.w / 2 + 30, -CARD.h / 2 + 8]), tr: P = toPage([CARD.w / 2 - 30, -CARD.h / 2 + 8]), bl: P = toPage([-CARD.w / 2 + 30, CARD.h / 2 - 8]), br: P = toPage([CARD.w / 2 - 30, CARD.h / 2 - 8]);
    const steps: Step[] = [
      { id: "page", start: -1, end: 0, draw: (c, e) => page(c, e) },
      { id: "card", start: 4, end: 20, draw: (c, e, p) => drawCard(c, e, p) },
      cutStep("border", border(), 20, 30), cutStep("contours", E.contours, 28, 80), cutStep("rules", E.rules, 80, 128), cutStep("shading", E.shading, 128, 186), cutStep("cross", E.cross, 186, 212), tint,
      { id: "tape1", start: 238, end: 242, draw: (c, e, p) => tape(c, e, tl, -0.7, 110, p, 61) }, { id: "tape2", start: 240, end: 244, draw: (c, e, p) => tape(c, e, tr, 0.7, 110, p, 62) },
      { id: "tape3", start: 242, end: 246, draw: (c, e, p) => tape(c, e, bl, 0.7, 110, p, 63) }, { id: "tape4", start: 244, end: 248, draw: (c, e, p) => tape(c, e, br, -0.7, 110, p, 64) },
      cap, pen,
    ];
    run = staged("scene-scrapbook", steps, (c, e) => new Gfx(c, e, 0, PEN).paper("paper", 0.1));
  }
  run(ctx, f, env);
};
