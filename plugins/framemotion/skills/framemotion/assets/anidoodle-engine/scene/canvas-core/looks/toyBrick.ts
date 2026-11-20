// toy-brick: a scene built from toy bricks the way the bundled toy-brick film builds its tug (anidoodle
// toyBrickKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the parts, the ortho camera, the cube-rule
// tones, the bevels and seams, the studs as real cylinders and the painter's order are the kit's). The
// picture stands as a brick-built wall on a grey baseplate: each row of the scene in bricks of real toy
// colours, the nearer groups of the scene built a stud in front of the ones behind, so the picture has
// depth. Built like the instruction booklet: the baseplate drops in, then step by step, bottom up and back
// to front, each brick falls down its insertion axis, ghosted while it travels, and seats.
import { type Ctx, type Env } from "../core";
import { BRICK, Cam, PLATE, STUD, aabb, drawPart, order, type Part } from "../toyBrickKit";
import { W, H, N, scene, raster, idAt, fillOf } from "../sceneKit";

// real toy-brick colours, the table the picture is built from (the common solid colours of the system)
const PAL = ["#F4F4F4", "#1B2A34", "#B40000", "#1E5AA8", "#FAC80A", "#646464", "#969696", "#5F3109", "#D7BA8C", "#237841", "#0A3463", "#D67923", "#68C3E2", "#720E0F", "#A0BCAC", "#958A73", "#AC78BA", "#C870A0", "#3F3691", "#4B9F4A", "#E4CD9E", "#352100", "#FC97AC",
  "#FE8A18", "#F8BB3D", "#A95500", "#82422A", "#AA7D55", "#5A93DB", "#078BC9", "#70819A", "#FFF03A", "#BBE90B", "#9B9A5A", "#845E84", "#E1D5ED", "#D3359D", "#FF698F", "#9DC3F7", "#897D62", "#3E3C39", "#0A1327", "#E95B2E", "#CC702A"];
// nearest by eye, not by the numbers: compared in CIE Lab
const lab = (c: number[]) => { const f = (v: number) => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; }; const [r, g, b] = c.map(f), X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, Y = r * 0.2126 + g * 0.7152 + b * 0.0722, Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883, q = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * q(Y) - 16, 500 * (q(X) - q(Y)), 200 * (q(Y) - q(Z))]; };
const LAB = PAL.map((h) => lab([1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))));
const ranked = (c: number[]) => { const l = lab(c); return LAB.map((p, i) => ({ i, e: (p[0] - l[0]) ** 2 + (p[1] - l[1]) ** 2 + (p[2] - l[2]) ** 2 })).sort((a, b) => a.e - b.e); };
const nearest = (c: number[]) => PAL[ranked(c)[0].i];
// a gradient (a sky) is built as a builder would: two neighbouring colours mixed brick by brick where it turns
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dithered = (c: number[], x: number, y: number) => { const r = ranked(c), a = Math.sqrt(r[0].e), b = Math.sqrt(r[1].e), t = a / Math.max(1e-6, a + b); return PAL[r[t * 2 > (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 ? 1 : 0].i]; };
type Placed = { p: Part; t0: number; t1: number };
// the kit's camera turned so the picture faces the eye: the same 30-degree elevation (the studs' ellipses
// stay true), the azimuth brought round from 45 to 22 degrees so the front faces read and the sides show
const CA = Math.cos((22 * Math.PI) / 180), SA = Math.sin((22 * Math.PI) / 180);
class FrontCam extends Cam { p(X: number, Y: number, Z: number): [number, number] { return [this.ox + (X * CA - Z * SA) * this.s, this.oy + (X * SA + Z * CA) * 0.5 * this.s - Y * 0.86603 * this.s]; } }
let B: { cam: Cam; parts: Placed[]; base: Part } | null = null;
const build = (env: Env) => B ??= (() => {
  const r0 = raster(env), list = scene(), layers = [...new Set(list.map((s) => s.layer))].sort((a, b) => a - b);
  const COLS = 80, cw = W / COLS, ROWS = Math.round((H / cw) * (STUD / BRICK)), rh = H / ROWS, h = BRICK / PLATE;   // a brick is 3 plates high
  type Cell = { col: string; z: number };
  const cells: Cell[][] = [];
  // each thing's brick colour: its nearest, unless that is the colour of what it stands against, then the next one that differs (a builder keeps the cat off the night sky)
  const idOf = (r: number, c: number) => idAt(r0, (c + 0.5) * cw, H - (r + 0.5) * rh), pix = (r: number, c: number) => { const x = (c + 0.5) * cw, y = H - (r + 0.5) * rh, p = (Math.min(r0.h - 1, Math.floor(y)) * r0.w + Math.min(r0.w - 1, Math.floor(x))) * 4; return [r0.rgb[p], r0.rgb[p + 1], r0.rgb[p + 2]]; };
  const colOf = new Map<number, string>(), around = new Map<number, Map<string, number>>();
  const brickOf = (id: number, r: number, c: number) => (id >= 0 && list[id].fill && !list[id].grad ? (colOf.get(id) ?? nearest(fillOf(list[id]))) : dithered(pix(r, c), c, r));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const id = idOf(r, c); if (id < 0 || !list[id].fill || list[id].big) continue; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= ROWS || cc >= COLS) continue; const o = idOf(rr, cc); if (o === id || o > id) continue; const m = around.get(id) ?? new Map(); const k = brickOf(o, rr, cc); m.set(k, (m.get(k) ?? 0) + 1); around.set(id, m); } }
  list.forEach((sh, id) => { if (!sh.fill || sh.grad) return; const rk = ranked(fillOf(sh)), m = around.get(id); if (!m) { colOf.set(id, PAL[rk[0].i]); return; } const tot = [...m.values()].reduce((a, b) => a + b, 0), clash = (h: string) => (m.get(h) ?? 0) > tot * 0.3; colOf.set(id, PAL[(rk.slice(0, 6).find((q) => !clash(PAL[q.i]) && Math.sqrt(q.e) < Math.sqrt(rk[0].e) + 22) ?? rk[0]).i]); });   // the next colour only when it is still close to the thing's own
  for (let r = 0; r < ROWS; r++) { cells.push([]); for (let c = 0; c < COLS; c++) { const id = idOf(r, c); cells[r].push({ col: brickOf(id, r, c), z: id >= 0 ? layers.indexOf(list[id].layer) : 0 }); } }
  // runs of the same colour at the same depth become 1x2, 1x3 and 1x4 bricks, staggered row to row as a builder lays them
  const parts: Placed[] = []; let id = 1;
  const D = layers.length;
  for (let r = 0; r < ROWS; r++) { let c = 0; while (c < COLS) { const a = cells[r][c]; let e = c + 1; const maxLen = r % 2 ? 4 : 3; while (e < COLS && e - c < maxLen && cells[r][e].col === a.col && cells[r][e].z === a.z) e++; const top = r === ROWS - 1 || cells[r + 1][c].z < a.z; const z = (D - 1 - a.z); parts.push({ p: { id: id++, color: a.col, kind: "prism", foot: [[c, z], [e, z], [e, z + 1], [c, z + 1]].map(([x, zz]) => [x, zz]) as [number, number][], y0: r * h + 1, h, studs: top, step: r }, t0: 0, t1: 0 }); c = e; } }
  // the foot is CCW seen from above in the kit's frame: x along X, z along Z (toward the eye); the picture faces +Z
  parts.forEach((pp) => { const f = pp.p.foot; pp.p.foot = [f[0], f[3], f[2], f[1]]; });
  const base: Part = { id: 0, color: "#A0A5A9", kind: "prism", foot: [[-1, -1], [-1, D + 1], [COLS + 1, D + 1], [COLS + 1, -1]], y0: 0, h: 1, studs: false, step: -1 };
  // steps: a few rows at a time, bottom up; inside a step the far bricks first
  const steps = Math.ceil(ROWS / 3), per = (254 - 18) / steps;
  parts.forEach((pp) => { const st = Math.floor(pp.p.step / 3), k = (pp.p.foot[0][1] / Math.max(1, D)) * 0.4 + (pp.p.foot[0][0] / COLS) * 0.4; pp.t0 = 18 + st * per + k * per * 0.6; pp.t1 = pp.t0 + Math.max(4, per * 0.45); });
  // the camera fitted to the frame: measure the wall's corners
  const probe = new FrontCam(1, 0, 0), pts: [number, number][] = [];
  [[-1, 0, -1], [COLS + 1, 0, -1], [-1, 0, D + 1], [COLS + 1, 0, D + 1], [-1, ROWS * h * PLATE + 10, -1], [COLS + 1, ROWS * h * PLATE + 10, -1], [-1, ROWS * h * PLATE + 10, D + 1], [COLS + 1, ROWS * h * PLATE + 10, D + 1]].forEach(([x, y, z]) => pts.push(probe.p(x * STUD, y, z * STUD)));
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const top = H > W * 1.4 ? H * 0.12 : H * 0.05, bot = H > W * 1.4 ? H * 0.22 : H * 0.05, s = Math.min((W * 0.92) / (x1 - x0), (H - top - bot) / (y1 - y0));
  return { cam: new FrontCam(s, W / 2 - ((x0 + x1) / 2) * s, top + (H - top - bot) / 2 - ((y0 + y1) / 2) * s), parts, base };
})();
export const toyBrickLook = (ctx: Ctx, f: number, env: Env) => {
  const { cam, parts, base } = build(env), fe = Math.min(f, N), HAIR = Math.max(0.6, cam.s * 0.9);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = "#dfe3e8"; ctx.fillRect(0, 0, W, H);
  // the baseplate drops in
  const bq = Math.max(0, Math.min(1, (fe - 2) / 12)); if (bq <= 0) return;
  drawPart(ctx, cam, base, (1 - bq) * (1 - bq) * 400, HAIR);
  const live = parts.filter((pp) => fe >= pp.t0).map((pp) => { const u = Math.max(0, Math.min(1, (fe - pp.t0) / (pp.t1 - pp.t0))), dy = u >= 1 ? 0 : (1 - u) * (1 - u) * 260; return { pp, dy }; });
  // the soft ground shadow of what has been built
  if (live.length) { const D = Math.max(...parts.map((pp) => pp.p.foot[2][1])), a = cam.p(-0.5 * STUD, PLATE, (D + 0.4) * STUD), b = cam.p((parts.reduce((m, pp) => Math.max(m, pp.p.foot[1][0]), 0) + 0.5) * STUD, PLATE, (D + 0.4) * STUD); ctx.save(); ctx.globalAlpha = 0.22; ctx.strokeStyle = "#3b3f46"; ctx.lineWidth = STUD * cam.s * 0.9; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a[0] + 6, a[1] + 4); ctx.lineTo(b[0] + 6, b[1] + 4); ctx.stroke(); ctx.restore(); }
  order(live.map(({ pp, dy }) => ({ p: pp.p, dy })), cam).forEach((i) => { const { pp, dy } = live[i]; ctx.globalAlpha = dy > 0 ? 0.55 : 1; drawPart(ctx, cam, pp.p, dy, HAIR); ctx.globalAlpha = 1; });
  void aabb;
};
