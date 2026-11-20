// mid-century: a scene painted the way the bundled mid-century film paints its hill village (anidoodle
// midCentury.ts with koiDrawKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the brush streaks that
// lay each flat are the kit's; the ragged gouache edge, the dry brush and the off-register line plate are
// ported from the film). Designer's gouache on warm illustration board, a limited bold palette: each shape
// laid in flat with a loaded flat brush, big to small, a darker flat on its shade side; then a nearly dry
// brush dragged across the flats; last a loose brush-and-ink line printed on its own plate, off register,
// leaving out the edges the colour already says.
import { Gfx, displace, fractal, rng, type Ctx, type Env, type Medium, type P } from "../core";
import { clamp, mix } from "../gallery";
import { streakClip, streaks } from "../koiDrawKit";
import { W, H, N, scene, lit, fillOf, hex, sizeOf, outlineOf, areaOf, shown, drawOn, visibleRuns, type Clock, type Shape } from "../sceneKit";

const C = { board: "#f1e1b8", ink: "#2a2420" };
const PALETTE = ["#f1e1b8", "#fbf2dc", "#98c1ad", "#4f8f86", "#a6a340", "#4c8c52", "#356a3e", "#f5e8c8", "#e8a296", "#e2a73a", "#56aba2", "#f7efdc", "#d2462a", "#244e4a", "#7a4a33", "#2b2a33", "#3e5f8a", "#8a6f9e", "#c98a5a"];
const BRUSH: Medium = { nib: 1.15, taper: 1, pressure: 0.85, retrace: false, wobble: 1.4, rough: 0.35 };
const REG: P = [5, -4];
const hx = (h: string) => { const v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
// a colour from the gouache jars: the scene's colour pulled halfway to the nearest jar of the limited palette
const jar = (c: number[]) => { let best = PALETTE[0], d = 1e9; for (const p of PALETTE) { const q = hx(p), e = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2; if (e < d) { d = e; best = p; } } return mix(hex(c as [number, number, number]), best, 0.55); };
const dens = (s: P[]): P[] => s.flatMap((a, i) => { const b = s[(i + 1) % s.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4)); return Array.from({ length: n }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n] as P); });
const edgeOf = (s: Shape): P[] => { const a = Math.sqrt(areaOf(s)), amp = clamp(a * 0.011, 0.3, 2.6); return displace(dens(outlineOf(s).filter((_, i, q) => i % 3 === 0 || i === q.length - 1)), amp, 0.11, 2, 40 + s.i); };
const trace = (c: Ctx, pts: P[]) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
const dryBrush = (c: Ctx, a: P, b: P, w: number, col: string, seed: number, q: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, nb = Math.max(5, Math.round(w / 2.2)), steps = Math.max(6, Math.round(l / 3)), r = rng(seed);
  c.strokeStyle = col; c.lineWidth = 1.7; c.lineCap = "round"; c.globalAlpha = 0.85; c.beginPath();
  for (let k = 0; k < nb; k++) {
    const v = (k / (nb - 1) - 0.5) * w + (r() - 0.5) * 1.2, start = r() * 0.08, dn = 0.2 + r() * 0.14; let on = false;
    for (let j = 0; j <= steps * q; j++) { const t = j / steps; if (t < start) continue; const skip = fractal(seed + k, t * l * 0.35, k * 3.1, 1, 1, 2) < dn + t * 0.35, x = a[0] + dx * t + nx * v, y = a[1] + dy * t + ny * v; if (skip) { on = false; continue; } if (!on) { c.moveTo(x, y); on = true; } else c.lineTo(x, y); }
  }
  c.stroke(); c.globalAlpha = 1;
};
const E = new Map<number, P[]>(), edge = (s: Shape) => E.get(s.i) ?? (() => { const e = edgeOf(s); E.set(s.i, e); return e; })();

const picture = (ctx: Ctx, env: Env, clk: Clock) => {
  const g = new Gfx(ctx, env, 0, BRUSH), list = scene();
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = C.board; ctx.fillRect(0, 0, W, H);
  // flats, big to small in stacking order, each laid by the brush where it has been; the shade side a darker flat
  list.forEach((s) => {
    if (!s.fill) return;
    const e = edge(s), col = jar(fillOf(s)), a = Math.sqrt(areaOf(s)), q = clk.p("paint", Math.sqrt(a) * 3 + 6), L = lit(s);
    if (q <= 0) return;
    const lay = (fn: () => void) => { ctx.save(); if (q < 1) streakClip(ctx, streaks([e], clamp(a / 5, 5, 58), s.big ? 0 : 0.6, 60 + s.i, clamp(a * 0.9, 60, 340)), q); fn(); ctx.restore(); };
    lay(() => {
      if (s.grad) { const gr = ctx.createLinearGradient(0, s.box[1], 0, s.box[3]); s.grad.stops.forEach(([o, c]) => gr.addColorStop(clamp(o), jar(c))); ctx.fillStyle = gr; } else ctx.fillStyle = col;
      trace(ctx, e); ctx.fill();
      if (!s.big && sizeOf(s) > 26) { const reg = shown(env, s), [x0, y0, x1, y1] = s.box; ctx.save(); trace(ctx, e); ctx.clip(); ctx.fillStyle = mix(col, "#2b2a33", 0.28); ctx.beginPath(); for (let y = y0; y <= y1; y += 3) { let run = -1; for (let x = x0; x <= x1 + 3; x += 3) { const inS = x <= x1 && reg.has(x, y) && L.side(x, y) > 0.3; if (inS && run < 0) run = x; if (!inS && run >= 0) { ctx.rect(run, y, x - run, 3.2); run = -1; } } } ctx.fill(); ctx.restore(); }
    });
  });
  // the dry brush dragged across the flats: bristle streaks in a lighter and a darker tone
  list.forEach((s) => {
    if (!s.fill || sizeOf(s) < 40) return;
    const col = jar(fillOf(s)), e = edge(s), r = rng(300 + s.i), n = Math.min(4, Math.max(1, Math.round(Math.sqrt(areaOf(s)) / 140))), q = clk.p("dry", n * 8);
    if (q <= 0) return;
    ctx.save(); trace(ctx, e); ctx.clip();
    for (let k = 0; k < n; k++) { const [x0, y0, x1, y1] = s.box, y = y0 + r() * (y1 - y0), x = x0 + r() * (x1 - x0) * 0.4, l = (x1 - x0) * (0.3 + r() * 0.5), ang = s.big ? (r() - 0.5) * 0.15 : 0.2 + (r() - 0.5) * 0.3; dryBrush(ctx, [x, y], [x + Math.cos(ang) * l, y + Math.sin(ang) * l], 7 + r() * 8, k % 2 ? mix(col, "#fffaf0", 0.16) : mix(col, "#2b2a33", 0.14), 400 + s.i * 13 + k, clamp(q * n - k)); }
    ctx.restore();
  });
  // the line plate, off register: open contours (the lit edge left out), thin things as brush lines
  g.push(REG[0], REG[1], 1);
  g.group("plain", () => list.forEach((s) => {
    if (s.big) return;
    if (!s.fill) { const q = clk.p("line", 20); if (q > 0) s.poly.forEach((p, j) => g.pen(p.filter((_, i, a) => i % 2 === 0 || i === a.length - 1), { w: Math.max(1.2, Math.min(4, s.sw * 0.5)), color: C.ink, seed: 700 + s.i * 5 + j, wobble: 0.9, opacity: 0.92, progress: q })); return; }
    const L = lit(s), segs: P[][] = [];
    visibleRuns(env, s).forEach((run) => { let cur: P[] = []; run.filter((_, i, a) => i % 2 === 0 || i === a.length - 1).forEach((p) => { if (L.side(p[0], p[1]) > -0.45) cur.push(p); else { if (cur.length > 2) segs.push(cur); cur = []; } }); if (cur.length > 2) segs.push(cur); });
    segs.forEach((sg, j) => { const q = clk.p("line", sg.length * 0.4 + 6); if (q > 0) g.pen(sg, { w: sizeOf(s) > 60 ? 1.8 : 1.3, color: C.ink, seed: 600 + s.i * 9 + j, wobble: 0.9, opacity: 0.92, progress: q }); });
  }));
  g.pop();
  g.paper("coldpress", 0.16);
};
const PHASES: Record<string, [number, number]> = { paint: [2, 150], dry: [154, 200], line: [204, 266] };
export const midCenturyLook = (ctx: Ctx, f: number, env: Env) => drawOn("midCentury", Math.min(f, N), PHASES, 270, (clk) => picture(ctx, env, clk));
