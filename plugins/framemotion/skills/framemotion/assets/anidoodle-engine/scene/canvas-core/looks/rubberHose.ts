// rubber-hose: a scene as a 1930s cartoon cel, made the way the bundled rubber-hose film makes its
// dancing coffee pot (anidoodle rubberHose.ts with rubberHoseKit.ts, Apache-2.0, Copyright 2026 Alex
// Greenshpun: the parts, schedule, paintFills, inkCel and filmPrint are the kit's; the blue-pencil rough,
// the surfaces, the peg holes and the pull-down through the gate are ported from the film). A non-photo
// blue pencil rough on punched bond, India ink at ONE pressure on a clear cel (a nearer shape stops the
// line behind it), flat greys painted on the back of the cel with no modelling at all, cast shadows as
// translucent flat shapes without ink; then the drawing is threaded through the gate and comes back as
// a black-and-white film print: warm silver tone, grain, dust, a sprocket scratch, the rounded gate.
import { Gfx, PENCIL, type Ctx, type Env, type Layer, type P } from "../core";
import { clamp } from "../gallery";
import { ell, filmPrint, inkCel, paintFills, schedule, wob, type Part } from "../rubberHoseKit";
import { W, H, scene, fillOf, outlineOf, sizeOf, type Shape } from "../sceneKit";

const BLUE = "#7fb3d8", PAPER = "#f2eee3", INK = "#16130f";
// five greys and a white, as the cel was painted: the scene's colour read as a value
const GREYS = ["#f6f3ea", "#e2ded3", "#cbc5b8", "#b3ada1", "#8a857b", "#5d5952", "#2b2824"];
const grey = (s: Shape) => { const c = fillOf(s), l = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; return GREYS[Math.round((1 - l) * (GREYS.length - 1))]; };
const T = { pen: [4, 70], ink: [74, 172], fill: [176, 232], pull: [236, 252] } as const;
const k = (f: number, w: readonly [number, number]) => clamp((f - w[0]) / (w[1] - w[0]));

let PARTS: Part[] | null = null;
const parts = (): Part[] => PARTS ??= (() => {
  const out: Part[] = [];
  scene().forEach((s, z) => {
    if (!s.fill) { out.push({ fills: [], outline: [], ow: 0, orank: z, details: s.poly.map((p) => ({ pts: wob(p.filter((_, i, a) => i % 2 === 0 || i === a.length - 1), 1.2, 30 + z), w: Math.max(2, Math.min(6, s.sw * 0.6)), rank: z, col: INK })), knock: false }); return; }
    const e = wob(outlineOf(s).filter((_, i, a) => i % 2 === 0 || i === a.length - 1), s.big ? 0.6 : 1.4, 10 + z);
    // a flat cast shadow to the right, no ink (the window is upper left)
    if (!s.big && sizeOf(s) > 30) out.push({ fills: [{ pts: e.map(([x, y]) => [x + sizeOf(s) * 0.12, y + sizeOf(s) * 0.06] as P), col: "#3b3732", alpha: 0.25, rank: z }], outline: [], ow: 0, orank: z, details: [], knock: false });
    out.push({ fills: [{ pts: e, col: grey(s), rank: z }], outline: s.big ? [] : [e], ow: sizeOf(s) > 60 ? 2.6 : 1.8, orank: z, details: [] });
  });
  return out;
})();
const pencil = (g: Gfx, p: number) => {
  const strokes = scene().map((s) => (s.fill ? outlineOf(s) : s.poly[0] ?? [])).filter((pts) => pts.length > 1).map((pts) => pts.filter((_, i, a) => i % 3 === 0 || i === a.length - 1));
  g.group("ink", () => strokes.forEach((s, i) => { const q = p >= 1 ? 1 : clamp(p * strokes.length * 1.15 - i * 1.15); if (q > 0) g.pen(s, { w: 1.3, color: BLUE, seed: 900 + i, wobble: 2.2, opacity: 0.85, progress: q }); }));
};
type Surf = { X: Layer; F: Layer; K: Layer; Y: Layer };
let SURF: Surf | null = null;
const surfaces = (env: Env): Surf => SURF ??= (() => { const mk = () => env.canvas(Math.round(W * env.scale), Math.round(H * env.scale)); return { X: mk(), F: mk(), K: mk(), Y: mk() }; })();
const fresh = (L: Layer, env: Env) => { const c = L.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, L.canvas.width, L.canvas.height); c.setTransform(env.scale, 0, 0, env.scale, 0, 0); return c; };
const blit = (c: Ctx, L: Layer, env: Env, dx = 0, dy = 0) => { c.save(); c.setTransform(1, 0, 0, 1, Math.round(dx * env.scale), Math.round(dy * env.scale)); c.drawImage(L.canvas as CanvasImageSource, 0, 0); c.restore(); };
const drawCel = (env: Env, penP: number, inkP: number, fillP: number): Layer => {
  const S = surfaces(env), pt = parts(), sch = schedule(pt);
  const x = fresh(S.X, env); x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
  if (penP > 0 && fillP < 1) pencil(new Gfx(x, env, 0, PENCIL), penP);
  if (fillP > 0) { paintFills(fresh(S.F, env), pt, sch.fill, fillP); blit(x, S.F, env); }
  if (inkP > 0) { inkCel(fresh(S.K, env), pt, sch.ink, inkP); blit(x, S.K, env); }
  return S.X;
};
const pegHoles = (c: Ctx) => { c.save(); c.fillStyle = "#2a2622"; [[W / 2, 30, 12, 12], [W / 2 - 130, 30, 30, 8], [W / 2 + 130, 30, 30, 8]].forEach(([x, y, rx, ry]) => { c.beginPath(); ell(x, y, rx, ry, 0, 20).forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.fill(); }); c.restore(); };
const printed = (env: Env, cel: Layer, seed: number): Layer => { const S = surfaces(env), y = fresh(S.Y, env); blit(y, cel, env); filmPrint(y, { ...env, W, H }, seed); return S.Y; };

export const rubberHoseLook = (ctx: Ctx, f: number, env: Env) => {
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  if (f >= T.pull[1]) { blit(ctx, printed(env, drawCel(env, 1, 1, 1), f >= T.pull[1] + 6 ? 0 : 1 + f), env); return; }   // the print, held
  const cel = drawCel(env, k(f, T.pen), k(f, T.ink), k(f, T.fill));
  if (f < T.pull[0]) { blit(ctx, cel, env); pegHoles(ctx); return; }
  // the pull-down: the drawing is threaded through the gate and comes back down as a print
  const t = k(f, T.pull), e = t >= 1 ? 1 : 1 - Math.pow(1 - t, 3) * (1 - 2.2 * t * (1 - t)), BAR = 56, y0 = -(H + BAR) * (1 - e);
  ctx.fillStyle = "#0b0907"; ctx.fillRect(0, 0, W, H);
  blit(ctx, printed(env, cel, 1 + (f - T.pull[0])), env, 0, y0);
  ctx.save(); ctx.translate(0, y0 + H + BAR); blit(ctx, cel, env, 0, y0 + H + BAR); pegHoles(ctx); ctx.restore();
};
