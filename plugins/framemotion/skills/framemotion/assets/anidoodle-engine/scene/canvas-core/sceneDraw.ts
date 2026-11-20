// FrameMotion's scene film (ours, MIT like FrameMotion): any scene, drawn in any anidoodle style.
// The scene is a layered SVG (written by the model from a description, see the engine README, "A scene
// from words"): back to front, flat colours, one shape per thing. The builder hands it to the page as
// window.__SCENE__ = {svg, style, look?, W, H}. Each style is a LOOK: one of a few techniques (sketch,
// flat, cut, raster, hatch, spiral, block, stitch) with that style's paper, tools and colour rules, so a
// scene is drawn the way that style draws (crayon scribbles, woodblock prints colour blocks, stipple
// builds dots). The picture is drawn thing after thing in the file's order, then holds.
// Every frame is drawn from its number alone (caches hold only what never changes), so any order renders the same.
import { Gfx, PENCIL, RISOLINE, rng, fractal, type Ctx, type Env, type Medium, type P } from "./core";
import type { Film } from "./film";
import { clamp, hatchRuns } from "./gallery";
import { SPEC, W, H, FPS, N, rgbOf, css, mixc, lum, avg, scene, thin, once, trace, raster, at, colAt, idAt, lumAt, palette, nearest, paintOf as paintBase, type RGB, type Grad, type Shape, type Raster } from "./sceneKit";
const END = 0.8;
import { crayonLook } from "./looks/crayon";
import { colouredPencilLook } from "./looks/colouredPencil";
import { chalkboardLook } from "./looks/chalkboard";
import { woodblockLook } from "./looks/woodblock";
import { embroideryLook } from "./looks/embroidery";
import { collageLook } from "./looks/collage";
import { theatreLook } from "./looks/theatre";
import { scrapbookLook } from "./looks/scrapbook";
import { folkTaleLook } from "./looks/folkTale";
import { midCenturyLook } from "./looks/midCentury";
import { rubberHoseLook } from "./looks/rubberHose";
import { stippleLook } from "./looks/stipple";
import { mellanLook } from "./looks/mellan";
import { ballpointLook } from "./looks/ballpoint";
import { scratchboardLook } from "./looks/scratchboard";
import { pencilWatercolourLook, storybookLook, inkWashLook } from "./looks/watercolour";
// The styles drawn with their own film's tools (looks/*.ts); the rest use the techniques below.
const OWN: Record<string, (ctx: Ctx, f: number, env: Env) => void> = { "crayon": crayonLook, "coloured-pencil": colouredPencilLook,
  "pencil-watercolour": pencilWatercolourLook, "storybook": storybookLook, "ink-wash": inkWashLook, "chalkboard": chalkboardLook, "woodblock": woodblockLook, "embroidery": embroideryLook, "paper-collage": collageLook, "toy-theatre": theatreLook, "scrapbook": scrapbookLook, "folk-tale": folkTaleLook, "mid-century": midCenturyLook, "rubber-hose": rubberHoseLook, "stipple": stippleLook, "single-line-engraving": mellanLook, "ballpoint": ballpointLook, "scratchboard": scratchboardLook };

export type Look = {
  tech: "sketch" | "flat" | "cut" | "theatre" | "stipple" | "halftone" | "riso" | "pixel" | "brick" | "lowpoly" | "dabs" | "oil" | "spiral" | "hatch" | "scratch" | "blueprint" | "block" | "stitch";
  paper: string; tooth?: string; toothAlpha?: number;
  tone?: "keep" | "grey" | "mute" | "pastel" | "lift" | "sepia" | "warm" | "vivid";
  pen?: "pencil" | "ink" | "wax" | "chalk" | "marker" | "brush"; line?: string; lineW?: number;
  fill?: "scribble" | "pencil" | "wash" | "flat" | "glaze" | "smudge" | "marker" | "grain" | "ink";
  ink?: string; extra?: string;
};


const INK: Medium = { nib: 1.25, taper: 0.8, pressure: 0.9, retrace: false, wobble: 0.6, rough: 0.6 };
const WAX: Medium = { nib: 2.6, taper: 0.3, pressure: 0.6, retrace: true, wobble: 1.4, rough: 1.6 };
const CHALK: Medium = { nib: 2.2, taper: 0.4, pressure: 0.7, retrace: true, wobble: 1.2, rough: 1.9 };
const BRUSH: Medium = { nib: 2.4, taper: 1, pressure: 1, retrace: false, wobble: 0.7, rough: 0.7 };
const PENS: Record<string, Medium> = { pencil: PENCIL, ink: INK, wax: WAX, chalk: CHALK, marker: RISOLINE, brush: BRUSH };

// The 32 styles as looks. A new style picks a technique and sets its own paper, tools and colours (styles.json "scene").
export const LOOKS: Record<string, Look> = {
  "crayon": { tech: "sketch", paper: "#f6efdf", tooth: "paper", toothAlpha: 0.22, pen: "wax", lineW: 4.5, fill: "scribble", tone: "vivid" },
  "coloured-pencil": { tech: "sketch", paper: "#f4eee2", tooth: "pencilTooth", toothAlpha: 0.1, pen: "pencil", lineW: 3, fill: "pencil" },
  "pencil-watercolour": { tech: "sketch", paper: "#f7f3ea", tooth: "coldpress", toothAlpha: 0.2, pen: "pencil", line: "#4a4245", lineW: 2.6, fill: "wash" },
  "storybook": { tech: "sketch", paper: "#fbf6ec", tooth: "coldpress", toothAlpha: 0.16, pen: "pencil", line: "#5b4f4a", lineW: 2.4, fill: "wash", tone: "pastel" },
  "ink-wash": { tech: "sketch", paper: "#f5efe2", tooth: "coldpress", toothAlpha: 0.18, pen: "ink", line: "#1b1712", lineW: 3.4, fill: "wash", tone: "mute" },
  "chalkboard": { tech: "sketch", paper: "#26392f", tooth: "paper", toothAlpha: 0.25, pen: "chalk", line: "#f1efe6", lineW: 4, fill: "scribble", tone: "lift" },
  "charcoal": { tech: "sketch", paper: "#ebe6dc", tooth: "pencilTooth", toothAlpha: 0.14, pen: "chalk", line: "#1b1917", lineW: 4.6, fill: "smudge", tone: "grey" },
  "marker-comic": { tech: "sketch", paper: "#fbfaf6", tooth: "paper", toothAlpha: 0.06, pen: "marker", line: "#141416", lineW: 5.5, fill: "marker", tone: "vivid" },
  "dream-glaze": { tech: "sketch", paper: "#f6efe6", tooth: "coldpress", toothAlpha: 0.12, lineW: 0, fill: "glaze", tone: "pastel" },
  "sumi-e": { tech: "sketch", paper: "#f2ece0", tooth: "coldpress", toothAlpha: 0.2, pen: "brush", line: "#15130f", lineW: 4.4, fill: "ink", tone: "grey", extra: "seal" },
  "flat-vector": { tech: "flat", paper: "#f4f1ea", lineW: 0, fill: "flat", tone: "vivid" },
  "mid-century": { tech: "flat", paper: "#efe4cc", tooth: "paper", toothAlpha: 0.2, pen: "ink", line: "#2a2420", lineW: 2.2, fill: "grain", tone: "warm", extra: "offset" },
  "rubber-hose": { tech: "flat", paper: "#efe2c4", tooth: "paper", toothAlpha: 0.26, pen: "marker", line: "#161310", lineW: 6, fill: "flat", tone: "sepia", extra: "film" },
  "folk-tale": { tech: "flat", paper: "#f1e6cf", tooth: "paper", toothAlpha: 0.18, pen: "ink", line: "#2b2320", lineW: 2.4, fill: "grain", tone: "warm", extra: "dots" },
  "isometric": { tech: "flat", paper: "#eef0f2", lineW: 0, fill: "flat", extra: "depth" },
  "paper-collage": { tech: "cut", paper: "#e9e1d0", tooth: "paper", toothAlpha: 0.3 },
  "toy-theatre": { tech: "theatre", paper: "#2b2026", tooth: "paper", toothAlpha: 0.22, line: "#2a2124" },
  "scrapbook": { tech: "hatch", paper: "#e7d9bb", tooth: "paper", toothAlpha: 0.32, ink: "#4a3322", extra: "clipping" },
  "ballpoint": { tech: "hatch", paper: "#f6f4ee", tooth: "paper", toothAlpha: 0.08, ink: "#1f3c8c" },
  "scratchboard": { tech: "scratch", paper: "#111111", ink: "#f4f1ea" },
  "cyanotype": { tech: "blueprint", paper: "#1d3f7c", tooth: "blueMottle", toothAlpha: 0.5, ink: "#f3f6ff" },
  "single-line-engraving": { tech: "spiral", paper: "#f3eee3", tooth: "paper", toothAlpha: 0.1, ink: "#1b1a1f" },
  "stipple": { tech: "stipple", paper: "#f5f1e8", tooth: "paper", toothAlpha: 0.08, ink: "#1d1b1e" },
  "halftone": { tech: "halftone", paper: "#f3efe4", tooth: "paper", toothAlpha: 0.14 },
  "risograph": { tech: "riso", paper: "#f4efe3", tooth: "risoSpeck", toothAlpha: 0.35 },
  "pixel-art": { tech: "pixel", paper: "#1c1c24", tone: "vivid" },
  "toy-brick": { tech: "brick", paper: "#d9dcdf", tone: "vivid" },
  "low-poly": { tech: "lowpoly", paper: "#e9ecef" },
  "broken-colour": { tech: "dabs", paper: "#efe6d2", tooth: "coldpress", toothAlpha: 0.14 },
  "oil": { tech: "oil", paper: "#3b2a20", tooth: "coldpress", toothAlpha: 0.12 },
  "woodblock": { tech: "block", paper: "#efe5d0", tooth: "paper", toothAlpha: 0.3, ink: "#1f1c22", tone: "mute" },
  "embroidery": { tech: "stitch", paper: "#e6dccb", ink: "#2b2626" },
};
const LOOK: Look = { ...(LOOKS[SPEC.style] ?? LOOKS.crayon), ...(SPEC.look ?? {}) } as Look;

// ---------------------------------------------------------------- colour
const PAPER = rgbOf(LOOK.paper)!;
const TONES: Record<string, (c: RGB) => RGB> = {
  keep: (c) => c,
  grey: (c) => { const l = lum(c); return [l, l, l]; },
  mute: (c) => { const l = lum(c); return mixc(mixc(c, [l, l, l], 0.3), [242, 232, 214], 0.12); },
  pastel: (c) => mixc(c, [255, 252, 246], 0.28),
  lift: (c) => mixc(c, [255, 255, 255], 0.5),
  sepia: (c) => { const l = lum(c) / 255; return mixc([40 + l * 205, 30 + l * 190, 22 + l * 150], c, 0.35); },
  warm: (c) => { const l = lum(c); return mixc(mixc(c, [l, l, l], 0.18), [226, 150, 80], 0.1); },
  vivid: (c) => { const l = lum(c); return [l + (c[0] - l) * 1.18, l + (c[1] - l) * 1.18, l + (c[2] - l) * 1.18]; },
};
const tone = TONES[LOOK.tone ?? "keep"] ?? TONES.keep;
const paintOf = (c: Ctx, s: Shape, t = tone) => paintBase(c, s, t);
const lineOf = (s: Shape): string => LOOK.line ?? css(s.stroke ? tone(s.stroke) : mixc(tone(s.fill ?? [60, 60, 60]), [20, 16, 18], 0.62));

// ---------------------------------------------------------------- the scene file

// ---------------------------------------------------------------- time: thing after thing, then a hold
const U = (f: number) => f / (N - 1) + 0.012;
const winOf = (i: number, n: number): [number, number] => { const span = clamp(2.4 / Math.max(1, n), 0.07, 0.4); return [n <= 1 ? 0 : (i / (n - 1)) * (END - span), span]; };
const progs = (f: number, n: number) => Array.from({ length: n }, (_, i) => { const [a, s] = winOf(i, n); return clamp((U(f) - a) / s); });
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

// ---------------------------------------------------------------- the scene as pixels (built once)

// ---------------------------------------------------------------- drawing helpers
const logical = (c: Ctx, env: Env) => c.setTransform(env.scale, 0, 0, env.scale, 0, 0);
const ground = (ctx: Ctx, env: Env) => { logical(ctx, env); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = LOOK.paper; ctx.fillRect(0, 0, W, H); };
const clipTo = (c: Ctx, s: Shape, fn: () => void) => { c.save(); trace(c, s); c.closePath(); c.clip(s.rule); fn(); c.restore(); };
const scribble = (c: Ctx, box: number[], p: number, seed: number, width: number, gap: number, angle = -0.9) => {
  const [x0, y0, x1, y1] = box, r = rng(seed), a = angle + (r() - 0.5) * 0.3, ca = Math.cos(a), sa = Math.sin(a);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + width;
  const rows = Math.max(2, Math.ceil((2 * R) / gap)), upto = p * rows;
  c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath();
  for (let i = 0; i < Math.ceil(upto); i++) {
    const d = -R + i * gap + (r() - 0.5) * gap * 0.4, part = Math.min(1, upto - i), dir = i % 2 ? -1 : 1;
    const sx = cx - sa * d - ca * R * dir, sy = cy + ca * d - sa * R * dir;
    if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
    c.lineTo(sx + ca * 2 * R * dir * part, sy + sa * 2 * R * dir * part);
  }
  c.stroke();
};
const outline = (g: Gfx, s: Shape, p: number, o: { w?: number; color?: string; opacity?: number } = {}) => {
  if (p <= 0) return;
  s.poly.forEach((sub, j) => g.pen(sub, { w: o.w ?? LOOK.lineW ?? 3, color: o.color ?? lineOf(s), seed: 7 + s.i * 31 + j, progress: p, boil: 0.45, opacity: o.opacity ?? 0.96 }));
};
const lines = (s: Shape) => !s.big && (LOOK.lineW ?? 0) > 0;
const strokeOnly = (g: Gfx, s: Shape, p: number) => s.poly.forEach((sub, j) => g.pen(sub, { w: Math.max(1.2, s.sw / 2), color: css(tone(s.stroke!)), seed: 3 + s.i * 17 + j, progress: p, taper: 0.6 }));

// ---------------------------------------------------------------- techniques
const sketch = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const list = scene(), pr = progs(f, list.length), g = new Gfx(ctx, env, f, PENS[LOOK.pen ?? "pencil"]);
  const light = lum(PAPER) < 110;
  list.forEach((s, i) => {
    const p = pr[i]; if (p <= 0) return;
    if (!s.fill) { strokeOnly(g, s, ease(p)); return; }
    const lp = s.big || !lines(s) ? 0 : clamp(p / 0.4), fp = clamp((p - (lines(s) ? 0.3 : 0)) / (lines(s) ? 0.7 : 1));
    const col = css(tone(s.fill)), b = s.box;
    if (fp > 0) {
      const kind = LOOK.fill ?? "scribble";
      if (kind === "glaze" || kind === "smudge" || kind === "ink") {
        // soft media: the shape laid in as a blurred glaze (several for dream-glaze), on its own layer
        const passes = kind === "glaze" ? 3 : 1;
        for (let k = 0; k < passes; k++) g.group("plain", () => {
          const c = g.cur; g.touch(b[0] - 30, b[1] - 30, b[2] + 30, b[3] + 30); c.save(); c.translate((k - 1) * 4, (k - 1) * -3);
          if (!light) { c.globalAlpha = clamp(fp * 2) * (kind === "glaze" ? 0.5 : 0.85); c.fillStyle = LOOK.paper; trace(c, s); c.fill(s.rule); }
          c.globalAlpha = (kind === "glaze" ? 0.42 : kind === "ink" ? 0.8 : 0.9) * clamp(fp * 1.4) * s.alpha; c.fillStyle = s.grad ? paintOf(c, s) : col; trace(c, s); c.fill(s.rule); c.restore();
        }, { blur: kind === "glaze" ? 14 : kind === "ink" ? (s.big ? 10 : 2.5) : 5, textures: kind === "smudge" ? ["pencilTooth"] : kind === "ink" ? ["washGran"] : [] });
      } else {
        logical(ctx, env);
        clipTo(ctx, s, () => {
          // reserve the paper (the thing in front covers what is behind it), then colour it in
          ctx.globalAlpha = clamp(fp * 2.5) * s.alpha; ctx.fillStyle = LOOK.paper; ctx.fillRect(b[0] - 4, b[1] - 4, b[2] - b[0] + 8, b[3] - b[1] + 8);
          ctx.fillStyle = col; ctx.strokeStyle = s.grad ? paintOf(ctx, s) : col;
          if (kind === "wash") {
            ctx.fillStyle = s.grad ? paintOf(ctx, s) : col; const hh = (b[3] - b[1] + 8) * Math.min(1, fp * 1.5);
            ctx.globalAlpha = 0.78 * Math.min(1, 0.45 + fp) * s.alpha; ctx.fillRect(b[0] - 4, b[1] - 4, b[2] - b[0] + 8, hh);
            ctx.globalAlpha = 0.18 * clamp(fp * 2 - 1) * s.alpha; ctx.strokeStyle = col; ctx.lineWidth = 7; trace(ctx, s); ctx.stroke();   // pigment settles at the wet edge
          } else if (kind === "flat") { ctx.globalAlpha = s.alpha; ctx.fillStyle = s.grad ? paintOf(ctx, s) : col; ctx.fillRect(b[0] - 4, b[1] - 4, (b[2] - b[0] + 8) * fp, b[3] - b[1] + 8); }
          else if (kind === "marker") { ctx.globalAlpha = 0.9 * s.alpha; scribble(ctx, b, fp, 101 + i * 17, 22, 17, -0.25); ctx.globalAlpha = 0.25 * s.alpha; ctx.strokeStyle = css(mixc(tone(s.fill!), [0, 0, 0], 0.25)); scribble(ctx, b, clamp(fp * 1.2 - 0.2), 303 + i, 22, 40, -0.25); }
          else if (kind === "pencil") {
            ctx.globalAlpha = 0.72 * s.alpha; scribble(ctx, b, fp, 101 + i * 17, 3.2, 3.6, -0.95);
            ctx.globalAlpha = 0.32 * s.alpha; ctx.strokeStyle = css(mixc(tone(s.fill!), [30, 20, 40], 0.35)); scribble(ctx, [b[0], (b[1] + b[3]) / 2, b[2], b[3]], clamp(fp * 1.3 - 0.3), 211 + i, 2.6, 5, 0.6);
          } else { ctx.globalAlpha = (light ? 0.72 : 0.82) * s.alpha; scribble(ctx, b, fp, 101 + i * 17, light ? 7 : 8.5, light ? 9.5 : 9.5); }
        });
        ctx.globalAlpha = 1;
      }
    }
    if (lp > 0) outline(g, s, lp);
  });
  if (LOOK.extra === "seal") seal(ctx, env, f);
  if (LOOK.tooth) g.paper(LOOK.tooth, LOOK.toothAlpha ?? 0.15);
};
// a small red seal (sumi-e), stamped when the painting is done, in the lower right but inside the safe area
const seal = (ctx: Ctx, env: Env, f: number) => {
  const p = clamp((U(f) - END + 0.02) / 0.06); if (p <= 0) return;
  const s = Math.min(W, H) * 0.06, x = W * 0.9 - s, y = H * (H > W * 1.4 ? 0.78 : 0.9) - s;
  logical(ctx, env); ctx.globalAlpha = 0.85 * p; ctx.fillStyle = "#b5322a"; ctx.fillRect(x, y, s, s * 1.25);
  ctx.globalAlpha = 0.9 * p; ctx.strokeStyle = LOOK.paper; ctx.lineWidth = s * 0.08; const r = rng(5);
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + s * (0.2 + r() * 0.2), y + s * (0.2 + k * 0.25)); ctx.lineTo(x + s * (0.55 + r() * 0.25), y + s * (0.25 + k * 0.25)); ctx.stroke(); }
  ctx.globalAlpha = 1;
};

const flat = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const list = scene(), pr = progs(f, list.length), g = new Gfx(ctx, env, f, PENS[LOOK.pen ?? "ink"]), x = LOOK.extra;
  list.forEach((s, i) => {
    const p = pr[i]; if (p <= 0) return;
    if (!s.fill) { strokeOnly(g, s, ease(p)); return; }
    const e = ease(clamp(p * 1.4)), cx = (s.box[0] + s.box[2]) / 2, cy = (s.box[1] + s.box[3]) / 2;
    logical(ctx, env); ctx.save();
    // a thing pops in from its own middle (a wide backdrop wipes down instead)
    if (s.big) { ctx.beginPath(); ctx.rect(0, 0, W, s.box[1] + (s.box[3] - s.box[1] + 4) * e); ctx.clip(); }
    else { const k = 0.82 + 0.18 * e + Math.sin(e * Math.PI) * 0.04; ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); }
    ctx.globalAlpha = (s.big ? 1 : clamp(p * 3)) * s.alpha;
    if (x === "depth" && !s.big) { ctx.fillStyle = css(mixc(tone(s.fill), [10, 14, 30], 0.42)); for (let k = 12; k > 0; k -= 2) { ctx.save(); ctx.translate(k * 0.7, k); trace(ctx, s); ctx.fill(s.rule); ctx.restore(); } }
    ctx.fillStyle = paintOf(ctx, s); trace(ctx, s); ctx.fill(s.rule);
    if (x === "depth" && !s.big) { ctx.globalAlpha = 0.25; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; trace(ctx, s); ctx.stroke(); }
    if (x === "dots" && !s.big && (s.box[2] - s.box[0]) > 40) {
      ctx.save(); trace(ctx, s); ctx.clip(s.rule); ctx.fillStyle = css(mixc(tone(s.fill), [255, 248, 230], 0.45)); ctx.globalAlpha = 0.8;
      const r = rng(9 + i), gap = 18; for (let yy = s.box[1] + 9; yy < s.box[3]; yy += gap) for (let xx = s.box[0] + 9 + ((yy / gap) % 2) * 9; xx < s.box[2]; xx += gap) if (r() < 0.55) { ctx.beginPath(); ctx.arc(xx, yy, 2.4, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
    if (LOOK.fill === "grain") { logical(ctx, env); clipTo(ctx, s, () => { ctx.globalAlpha = 0.16 * e; ctx.strokeStyle = css(mixc(tone(s.fill!), [255, 250, 240], 0.5)); scribble(ctx, s.box, 1, 51 + i, 1.4, 6, 0.15); }); ctx.globalAlpha = 1; }
    if (lines(s)) outline(g, s, clamp(p * 1.6 - 0.4), x === "offset" ? { w: LOOK.lineW, opacity: 0.85 } : {});
  });
  if (x === "film") { logical(ctx, env); const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.62); gr.addColorStop(0, "rgba(40,28,16,0)"); gr.addColorStop(1, "rgba(40,28,16,0.55)"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (LOOK.tooth) g.paper(LOOK.tooth, LOOK.toothAlpha ?? 0.15);
};

// cut paper: each thing is a torn paper piece laid down with its shadow
const cut = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const list = scene(), pr = progs(f, list.length), g = new Gfx(ctx, env, f, PENCIL);
  list.forEach((s, i) => {
    const p = pr[i]; if (p <= 0) return;
    if (!s.fill) { strokeOnly(g, s, ease(p)); return; }
    const e = ease(p), r = rng(41 + i * 13), rot = s.big ? 0 : (r() - 0.5) * 0.04, cx = (s.box[0] + s.box[2]) / 2, cy = (s.box[1] + s.box[3]) / 2, lift = (1 - e) * 26;
    const place = (c: Ctx) => { c.translate(cx, cy - lift); c.rotate(rot); c.scale(1 + (1 - e) * 0.05, 1 + (1 - e) * 0.05); c.translate(-cx, -cy); };
    g.group("plain", () => { const c = g.cur; g.touch(s.box[0] - 30, s.box[1] - 40, s.box[2] + 30, s.box[3] + 30); c.save(); place(c); c.translate(4 + lift * 0.3, 6 + lift * 0.4); c.fillStyle = "#000"; trace(c, s); c.fill(s.rule); c.restore(); }, { blur: 5 + lift * 0.2, alpha: 0.28 * clamp(p * 3) });
    logical(ctx, env); ctx.save(); place(ctx); ctx.globalAlpha = clamp(p * 3) * s.alpha;
    if (!s.big) { ctx.strokeStyle = "#fbf7ef"; ctx.lineWidth = 5; ctx.lineJoin = "round"; trace(ctx, s); ctx.stroke(); }   // the torn white core of the paper
    ctx.fillStyle = paintOf(ctx, s); trace(ctx, s); ctx.fill(s.rule); ctx.restore(); ctx.globalAlpha = 1;
  });
  if (LOOK.tooth) g.paper(LOOK.tooth, LOOK.toothAlpha ?? 0.2);
};

// toy theatre: each top-level group is a flat that slides in and bobs, animated on twos
const theatre = (ctx: Ctx, f0: number, env: Env) => {
  const f = f0 - (f0 % 2); ground(ctx, env);
  const list = scene(), layers = Array.from(new Set(list.map((s) => s.layer))).sort((a, b) => a - b), L = Math.max(1, layers.length);
  const useLayers = L > 1, n = useLayers ? L : list.length, pr = progs(f, n), g = new Gfx(ctx, env, f, INK);
  list.forEach((s) => {
    const k = useLayers ? layers.indexOf(s.layer) : s.i, p = pr[k]; if (p <= 0) return;
    const e = ease(p), dir = k % 2 ? 1 : -1, dx = (1 - e) * W * 0.7 * dir, bob = k > 0 && e >= 1 ? Math.sin((f / FPS) * 2.1 + k) * 3 : 0;
    logical(ctx, env); ctx.save(); ctx.translate(dx, bob);
    if (s.fill) {
      ctx.save(); ctx.translate(5, 7); ctx.globalAlpha = 0.35; ctx.fillStyle = "#000"; trace(ctx, s); ctx.fill(s.rule); ctx.restore();
      ctx.globalAlpha = s.alpha; ctx.fillStyle = paintOf(ctx, s); trace(ctx, s); ctx.fill(s.rule);
      if (!s.big) { ctx.globalAlpha = 0.8; ctx.strokeStyle = LOOK.line ?? "#2a2124"; ctx.lineWidth = 2; trace(ctx, s); ctx.stroke(); }
    } else if (s.stroke) { ctx.strokeStyle = css(s.stroke); ctx.lineWidth = Math.max(1.5, s.sw); trace(ctx, s); ctx.stroke(); }
    ctx.restore();
  });
  // the proscenium: a dark frame around the stage
  logical(ctx, env); ctx.globalAlpha = 1; ctx.fillStyle = "#2b2026"; const m = Math.min(W, H) * 0.035;
  ctx.fillRect(0, 0, W, m); ctx.fillRect(0, H - m, W, m); ctx.fillRect(0, 0, m, H); ctx.fillRect(W - m, 0, m, H);
  ctx.strokeStyle = "#c9a45a"; ctx.lineWidth = 3; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  g.paper(LOOK.tooth ?? "paper", LOOK.toothAlpha ?? 0.2);
};

// ---- raster looks: marks placed over the scene's pixels, each belonging to the thing under it
type Mark = { x: number; y: number; s: number; t: number; c: RGB; a: number; b: number; k: number };
type Push = ((m: Mark) => void) & { list?: Mark[] };
const out0 = (push: Push) => push.list!;
const marks = (env: Env, key: string, make: (r: Raster, push: Push) => void): Mark[] => once(key, () => { const r = raster(env), out: Mark[] = []; const push: Push = (m) => { out.push(m); }; push.list = out; make(r, push); return out; });
// order cells by row within the part of each thing that shows (top down, or bottom up), so its first cell starts at once
const byRows = (ms: Mark[], up: boolean) => { const lo = new Map<number, number>(), hi = new Map<number, number>(); for (const m of ms) { lo.set(m.s, Math.min(lo.get(m.s) ?? 1e9, m.y)); hi.set(m.s, Math.max(hi.get(m.s) ?? -1e9, m.y)); } for (const m of ms) { const a = lo.get(m.s)!, b = hi.get(m.s)!; m.t = b > a ? (up ? (b - m.y) / (b - a) : (m.y - a) / (b - a)) : 0; } return ms; };
const shown = (pr: number[], m: Mark) => { const p = m.s >= 0 ? pr[m.s] : pr.length ? pr[0] : 1; return clamp((p - m.t * 0.85) / 0.15); };

const stipple = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const ms = marks(env, "stipple", (r, push) => { const q = rng(3), pitch = 3.1; for (let y = 0; y < H; y += pitch) for (let x = 0; x < W; x += pitch) { const xx = x + (q() - 0.5) * pitch, yy = y + (q() - 0.5) * pitch, d = 1 - lumAt(r, xx, yy); if (q() < Math.pow(d, 1.7) * 0.95 + 0.008) push({ x: xx, y: yy, s: idAt(r, xx, yy), t: q(), c: [0, 0, 0], a: 0.75 + d * 0.8, b: 0, k: 0 }); }
    // each thing's edge in close dots, so a light thing on a light ground still reads
    for (const s of scene()) if (!s.big) for (const sub of s.poly) for (let i = 0; i < sub.length; i++) push({ x: sub[i][0] + (q() - 0.5) * 1.2, y: sub[i][1] + (q() - 0.5) * 1.2, s: s.i, t: q(), c: [0, 0, 0], a: 1.2, b: 0, k: 0 }); });
  const pr = progs(f, scene().length); logical(ctx, env); ctx.fillStyle = LOOK.ink!; ctx.beginPath();
  for (const m of ms) { const v = shown(pr, m); if (v > 0) { ctx.moveTo(m.x + m.a * v, m.y); ctx.arc(m.x, m.y, m.a * v, 0, 6.2832); } }
  ctx.fill();
  if (LOOK.tooth) new Gfx(ctx, env, f, INK).paper(LOOK.tooth, LOOK.toothAlpha ?? 0.1);
};

const cmy = (c: RGB, i: number) => { const k = 1 - Math.max(...c) / 255; return k > 0.99 ? 0 : (1 - c[i] / 255 - k) / (1 - k); };
const halftone = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const INKS: [string, number, (c: RGB) => number][] = [
    ["#00a3d9", 15, (c) => cmy(c, 0)], ["#e6007e", 75, (c) => cmy(c, 1)], ["#ffe100", 0, (c) => cmy(c, 2)], ["#1a1a1a", 45, (c) => 0.85 * (1 - Math.max(...c) / 255)],
  ];
  const pr = progs(f, scene().length); logical(ctx, env); ctx.globalCompositeOperation = "multiply";
  INKS.forEach(([col, ang, amt], k) => {
    const ms = marks(env, "ht" + k, (r, push) => { const pitch = 8.5, a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), R = Math.hypot(W, H) / 2 + pitch, q = rng(11 + k); for (let u = -R; u <= R; u += pitch) for (let v = -R; v <= R; v += pitch) { const x = W / 2 + u * ca - v * sa, y = H / 2 + u * sa + v * ca; if (x < -pitch || y < -pitch || x > W + pitch || y > H + pitch) continue; const c = colAt(r, x, y), cov = clamp(amt(c)); if (cov > 0.04) push({ x, y, s: idAt(r, x, y), t: q(), c, a: pitch * 0.56 * Math.sqrt(cov), b: 0, k }); } });
    ctx.fillStyle = col; ctx.beginPath();
    for (const m of ms) { const v = shown(pr, m); if (v > 0) { const rr = m.a * v; ctx.moveTo(m.x + rr, m.y); ctx.arc(m.x, m.y, rr, 0, 6.2832); } }
    ctx.fill();
  });
  ctx.globalCompositeOperation = "source-over";
  if (LOOK.tooth) new Gfx(ctx, env, f, INK).paper(LOOK.tooth, LOOK.toothAlpha ?? 0.1);
};

// risograph: one ink at a time, each a grainy screen rolled down the sheet, slightly out of register
const riso = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const INKS: [string, (c: RGB) => number, P][] = [["#ffe800", (c) => 1 - c[2] / 255, [2, -1]], ["#ff48b0", (c) => 1 - c[1] / 255, [-3, 2]], ["#0078bf", (c) => 1 - c[0] / 255, [1, 3]]];
  logical(ctx, env); ctx.globalCompositeOperation = "multiply";
  INKS.forEach(([col, amt, off], k) => {
    const a0 = 0.01 + k * 0.26, p = clamp((U(f) - a0) / 0.28); if (p <= 0) return;
    const ms = marks(env, "riso" + k, (r, push) => { const q = rng(21 + k), pitch = 6, a = ((15 + k * 30) * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), R = Math.hypot(W, H) / 2 + pitch; for (let u = -R; u <= R; u += pitch) for (let v2 = -R; v2 <= R; v2 += pitch) { const x = W / 2 + u * ca - v2 * sa, y = H / 2 + u * sa + v2 * ca; if (x < -pitch || y < -pitch || x > W + pitch || y > H + pitch) continue; const v = clamp(amt(colAt(r, x, y)) * 0.95); if (v > 0.05) push({ x: x + (q() - 0.5) * 0.8, y: y + (q() - 0.5) * 0.8, s: 0, t: 0, c: [0, 0, 0], a: pitch * 0.6 * Math.sqrt(v) * (0.9 + q() * 0.2), b: 0, k }); } });
    const edge = ease(p) * (H + 60) - 30;
    ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.beginPath();
    for (const m of ms) if (m.y < edge) { const x = m.x + off[0], y = m.y + off[1]; ctx.moveTo(x + m.a, y); ctx.arc(x, y, m.a, 0, 6.2832); }
    ctx.fill(); ctx.globalAlpha = 1;
  });
  ctx.globalCompositeOperation = "source-over";
  if (LOOK.tooth) new Gfx(ctx, env, f, INK).paper(LOOK.tooth, LOOK.toothAlpha ?? 0.3);
};

// pixel art: the scene in big pixels of its own colours, each thing filled in row by row
const pixel = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const cell = Math.max(6, Math.round(Math.min(W, H) / 84)), pal = palette().map(tone), list = scene();
  const ms = marks(env, "pixel", (r, push) => { for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) { const s = idAt(r, x + cell / 2, y + cell / 2), b = s >= 0 ? list[s].box : [0, 0, W, H]; push({ x, y, s, t: 0, c: pal[nearest(tone(colAt(r, x + cell / 2, y + cell / 2)), pal)], a: 0, b: 0, k: 0 }); } byRows(out0(push), false); });
  const pr = progs(f, list.length); logical(ctx, env);
  for (const m of ms) if (shown(pr, m) > 0.5) { ctx.fillStyle = css(m.c); ctx.fillRect(m.x, m.y, cell + 0.5, cell + 0.5); }
  // a 1-pixel dark outline where one thing meets another, as sprites have
  ctx.fillStyle = "rgba(20,16,28,0.55)";
  const byXY = once("pixel:edge", () => { const r = raster(env), e: P[] = []; for (let y = cell; y < H; y += cell) for (let x = cell; x < W; x += cell) { const s = idAt(r, x + cell / 2, y + cell / 2); if (s >= 0 && !list[s].big && (idAt(r, x - cell / 2, y + cell / 2) !== s || idAt(r, x + cell / 2, y - cell / 2) !== s)) e.push([x, y]); } return e; });
  const r = raster(env); for (const [x, y] of byXY) { const s = idAt(r, x + cell / 2, y + cell / 2); if (pr[s] >= 1) ctx.fillRect(x, y, cell, cell * 0.22); }
};

// toy bricks: the scene built from plastic bricks with studs, bottom up
const brick = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const cell = Math.round(Math.min(W, H) / 34), list = scene(), pal = palette().map(tone);
  const ms = marks(env, "brick", (r, push) => { for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) { const s = idAt(r, x + cell / 2, y + cell / 2), b = s >= 0 ? list[s].box : [0, 0, W, H]; push({ x, y, s, t: 0, c: pal[nearest(tone(colAt(r, x + cell / 2, y + cell / 2)), pal)], a: 0, b: 0, k: 0 }); } byRows(out0(push), true); });
  const pr = progs(f, list.length); logical(ctx, env);
  for (const m of ms) {
    const v = shown(pr, m); if (v <= 0) continue;
    const dy = -(1 - ease(v)) * cell * 1.5, x = m.x, y = m.y + dy;
    ctx.globalAlpha = clamp(v * 2); ctx.fillStyle = css(mixc(m.c, [0, 0, 0], 0.3)); ctx.fillRect(x, y, cell, cell);
    ctx.fillStyle = css(m.c); ctx.fillRect(x + 1, y + 1, cell - 3, cell - 3);
    ctx.fillStyle = css(mixc(m.c, [0, 0, 0], 0.25)); ctx.beginPath(); ctx.arc(x + cell / 2 + 1.5, y + cell / 2 + 1.5, cell * 0.3, 0, 6.2832); ctx.fill();
    ctx.fillStyle = css(mixc(m.c, [255, 255, 255], 0.22)); ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * 0.28, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// low poly: each thing cut into flat facets inside its own outline, each facet lit a little differently
const lowpoly = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const grid = once("tris", () => {
    const g = Math.min(W, H) / 30, cols = Math.ceil(W / g) + 1, rows = Math.ceil(H / g) + 1, q = rng(17), v: P[][] = [], out: P[][] = [];
    for (let j = 0; j <= rows; j++) { v.push([]); for (let i = 0; i <= cols; i++) v[j].push([i * g + (i && i < cols ? (q() - 0.5) * g * 0.7 : 0), j * g + (j && j < rows ? (q() - 0.5) * g * 0.7 : 0)]); }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], d = v[j + 1][i]; out.push(...((q() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]) as P[][])); }
    return out;
  });
  const r = raster(env), list = scene(), pr = progs(f, list.length); logical(ctx, env); ctx.lineJoin = "round";
  list.forEach((s, i) => {
    const p = pr[i]; if (p <= 0) return;
    if (!s.fill) { ctx.globalAlpha = clamp(p * 2); ctx.strokeStyle = css(s.stroke!); ctx.lineWidth = Math.max(1.5, s.sw); trace(ctx, s); ctx.stroke(); return; }
    const q = rng(90 + i), b = s.box, base = s.grad ? null : s.fill;
    clipTo(ctx, s, () => {
      for (const t of grid) {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3, th = q();
        if (cx < b[0] - 40 || cx > b[2] + 40 || cy < b[1] - 40 || cy > b[3] + 40) continue;
        const v = clamp((p - th * 0.8) / 0.2); if (v <= 0) continue;
        const sh = 0.88 + fractal(5, cx, cy, 0.01, 0.01, 2) * 0.24 + (q() - 0.5) * 0.08, c = (base ?? colAt(r, cx, cy)).map((x) => x * sh) as RGB;
        ctx.globalAlpha = v * s.alpha; ctx.fillStyle = ctx.strokeStyle = css(c); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(...t[0]); ctx.lineTo(...t[1]); ctx.lineTo(...t[2]); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    });
  });
  ctx.globalAlpha = 1;
};

// painterly dabs: broken colour (small pure dabs side by side) and oil (an umber ground, a dark lay-in, then loaded strokes)
const small = (id: number) => id >= 0 && !scene()[id].big;
const dabs = (ctx: Ctx, f: number, env: Env, oil: boolean) => {
  ground(ctx, env);
  const passes = oil ? [[12, 30, 20, 0.12], [7, 17, 11, 0]] : [[11, 15, 6.5, 0], [6.5, 9, 3.8, 0]];
  const pr = progs(f, scene().length); logical(ctx, env); ctx.lineCap = "round";
  passes.forEach(([pitch, len, wd, dark], k) => {
    const ms = marks(env, (oil ? "oil" : "dab") + k, (r, push) => { const q = rng(31 + k); for (let y = -pitch; y < H + pitch; y += pitch) for (let x = -pitch; x < W + pitch; x += pitch) { const xx = x + (q() - 0.5) * pitch, yy = y + (q() - 0.5) * pitch, base = colAt(r, xx, yy), sp = oil ? 16 : 48; let c: RGB = [base[0] + (q() - 0.5) * sp, base[1] + (q() - 0.5) * sp, base[2] + (q() - 0.5) * sp]; if (!oil) c = TONES.vivid(TONES.vivid(c)); if (dark) c = mixc(c, [40, 26, 18], dark); push({ x: xx, y: yy, s: idAt(r, xx, yy), t: q() * 0.5 + k * 0.5, c, a: fractal(7, xx, yy, 0.004, 0.004, 2) * 6.3 + (q() - 0.5) * 0.5, b: len * (0.75 + q() * 0.5) * (small(idAt(r, xx, yy)) ? 0.5 : 1), k: wd * (0.8 + q() * 0.4) * (small(idAt(r, xx, yy)) ? 0.7 : 1) }); } });
    for (const m of ms) {
      const v = shown(pr, m); if (v <= 0) continue;
      const dx = Math.cos(m.a) * m.b * 0.5 * v, dy = Math.sin(m.a) * m.b * 0.5 * v;
      ctx.globalAlpha = 0.92; ctx.strokeStyle = css(m.c); ctx.lineWidth = m.k; ctx.beginPath(); ctx.moveTo(m.x - dx, m.y - dy); ctx.lineTo(m.x + dx, m.y + dy); ctx.stroke();
      if (oil && k === 1) { ctx.globalAlpha = 0.35; ctx.strokeStyle = css(mixc(m.c, [255, 246, 225], 0.45)); ctx.lineWidth = m.k * 0.28; ctx.beginPath(); ctx.moveTo(m.x - dx - m.k * 0.2, m.y - dy - m.k * 0.3); ctx.lineTo(m.x + dx - m.k * 0.2, m.y + dy - m.k * 0.3); ctx.stroke(); }
    }
  });
  ctx.globalAlpha = 1;
  if (LOOK.tooth) new Gfx(ctx, env, f, INK).paper(LOOK.tooth, LOOK.toothAlpha ?? 0.12);
};

// one spiral line whose thickness makes the picture (after Claude Mellan), unspooling from the middle
const spiral = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const segs = once("spiral", () => { const r = raster(env), out: number[] = [], gap = 5.2, R = Math.hypot(W, H) / 2; let th = 0.1; for (;;) { const rad = (gap * th) / (2 * Math.PI); if (rad > R) break; const x = W / 2 + Math.cos(th) * rad, y = H / 2 + Math.sin(th) * rad; out.push(x, y, x >= 0 && y >= 0 && x < W && y < H ? 0.25 + (1 - lumAt(r, x, y)) * 4.6 : 0); th += 3.2 / Math.max(rad, 3); } return out; });
  const n = segs.length / 3, upto = Math.floor(n * clamp(U(f) / END)), buckets = new Map<number, number[]>();
  for (let i = 1; i < upto; i++) { const w = Math.round(segs[i * 3 + 2] * 4) / 4; if (w <= 0.25) continue; let b = buckets.get(w); if (!b) { b = []; buckets.set(w, b); } b.push(segs[i * 3 - 3], segs[i * 3 - 2], segs[i * 3], segs[i * 3 + 1]); }
  logical(ctx, env); ctx.strokeStyle = LOOK.ink!; ctx.lineCap = "round";
  for (const [w, b] of buckets) { ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i < b.length; i += 4) { ctx.moveTo(b[i], b[i + 1]); ctx.lineTo(b[i + 2], b[i + 3]); } ctx.stroke(); }
  if (LOOK.tooth) new Gfx(ctx, env, f, INK).paper(LOOK.tooth, LOOK.toothAlpha ?? 0.1);
};

// hatching: tone from where the lines are (ballpoint, the scrapbook's engraving); scratchboard scratches the light out of black
type Run = { p: P[]; s: number; t: number };
const runsOf = (env: Env, key: string, levels: [number, number][], gap: number, dark: boolean, box = [0, 0, W, H]): Run[] => once(key, () => {
  const r = raster(env), q = rng(13), out: Run[] = [];
  levels.forEach(([th, ang], k) => { for (const run of hatchRuns({ x0: box[0], y0: box[1], x1: box[2], y1: box[3] }, ang, gap + k * 0.6, (x, y) => x >= box[0] && y >= box[1] && x <= box[2] && y <= box[3] && (dark ? lumAt(r, x, y) < th : lumAt(r, x, y) > th), 3, 7 + k)) { for (let i = 0; i < run.length - 1; i += 18) { const part = run.slice(i, i + 19).map(([x, y]) => [x + (q() - 0.5) * 0.8, y + (q() - 0.5) * 0.8] as P); if (part.length > 1) { const m = part[part.length >> 1]; out.push({ p: part, s: idAt(r, m[0], m[1]), t: q() }); } } } });
  return out;
});
const drawRuns = (ctx: Ctx, runs: Run[], pr: number[], w: number, color: string, alpha: number) => {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.globalAlpha = alpha; ctx.lineCap = "round"; ctx.beginPath();
  for (const r of runs) { const p = r.s >= 0 ? pr[r.s] : 1, v = clamp((p - r.t * 0.85) / 0.15); if (v <= 0) continue; const n = Math.max(2, Math.ceil(r.p.length * v)); ctx.moveTo(...r.p[0]); for (let i = 1; i < n; i++) ctx.lineTo(...r.p[i]); }
  ctx.stroke(); ctx.globalAlpha = 1;
};
const thinOutlines = (ctx: Ctx, pr: number[], w: number, color: string, alpha: number) => {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.globalAlpha = alpha; ctx.lineJoin = "round";
  for (const s of scene()) { if (s.big) continue; const p = clamp(pr[s.i] / 0.5); if (p <= 0) continue; ctx.beginPath(); for (const sub of s.poly) { const n = Math.max(2, Math.ceil(sub.length * p)); ctx.moveTo(...sub[0]); for (let i = 1; i < n; i++) ctx.lineTo(...sub[i]); } ctx.stroke(); }
  ctx.globalAlpha = 1;
};
const hatch = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const pr = progs(f, scene().length), clip = LOOK.extra === "clipping", m = Math.min(W, H) * 0.08, top = H > W * 1.4 ? H * 0.1 : m, bot = H > W * 1.4 ? H * 0.2 : m;
  logical(ctx, env);
  if (clip) {
    // a clipping taped into an old scrapbook: the card first, the engraving in it, the tape last
    const c0 = clamp(U(f) / 0.05); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.012); ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha = 0.3 * c0; ctx.fillStyle = "#3a2a18"; ctx.fillRect(m + 6, top + 9, W - 2 * m, H - top - bot);
    ctx.globalAlpha = c0; ctx.fillStyle = "#f4ead2"; ctx.fillRect(m, top, W - 2 * m, H - top - bot);
    ctx.beginPath(); ctx.rect(m + 10, top + 10, W - 2 * m - 20, H - top - bot - 20); ctx.clip();
  }
  const runs = runsOf(env, "hatch", [[0.82, 0.785], [0.62, -0.785], [0.42, 0], [0.24, 1.571]], LOOK.extra === "clipping" ? 5.2 : 5.8, true);
  drawRuns(ctx, runs, pr, clip ? 1.25 : 1.1, LOOK.ink!, clip ? 0.85 : 0.8);
  thinOutlines(ctx, pr, clip ? 1.6 : 1.4, LOOK.ink!, 0.9);
  if (clip) {
    ctx.restore(); const tp = clamp((U(f) - END + 0.04) / 0.05);
    if (tp > 0) { ctx.globalAlpha = 0.72 * tp; ctx.fillStyle = "#e9dfae"; for (const [x, y, a] of [[m + 10, top + 4, -0.6], [W - m - 10, top + 4, 0.6], [m + 10, H - bot - 4, 0.6], [W - m - 10, H - bot - 4, -0.6]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-48, -15, 96, 30); ctx.restore(); } ctx.globalAlpha = 1; }
  }
  if (LOOK.tooth) new Gfx(ctx, env, f, INK).paper(LOOK.tooth, LOOK.toothAlpha ?? 0.1);
};
const scratch = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const pr = progs(f, scene().length), runs = runsOf(env, "scratch", [[0.22, 0.785], [0.42, -0.785], [0.62, 0], [0.8, 1.571]], 5.4, false);
  logical(ctx, env); drawRuns(ctx, runs, pr, 1.3, LOOK.ink!, 0.92); thinOutlines(ctx, pr, 1.6, LOOK.ink!, 0.95);
};
const blueprint = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const g = new Gfx(ctx, env, f, INK), pr = progs(f, scene().length), m = Math.min(W, H) * 0.045;
  g.paper(LOOK.tooth ?? "blueMottle", LOOK.toothAlpha ?? 0.5);
  logical(ctx, env); const bp = clamp(U(f) / 0.06); ctx.strokeStyle = LOOK.ink!; ctx.globalAlpha = 0.85 * bp; ctx.lineWidth = 2.5; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); ctx.lineWidth = 1; ctx.strokeRect(m + 8, m + 8, W - 2 * m - 16, H - 2 * m - 16); ctx.globalAlpha = 1;
  const runs = runsOf(env, "bp", [[0.6, 0.785]], 9, false);
  drawRuns(ctx, runs, pr, 1, LOOK.ink!, 0.4);
  g.inkGroup(() => { for (const s of scene()) { const p = clamp(pr[s.i] / 0.6); if (p <= 0 || (s.big && s.fill)) continue; s.poly.forEach((sub, j) => g.pen(sub, { w: 2.2, color: LOOK.ink!, seed: 5 + s.i * 19 + j, progress: p, boil: 0.3 })); } }, { blur: 2, alpha: 0.35 });
};

// woodblock: one colour block printed after another (light to dark, a little out of register), then the key block
const block = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  const pal = palette(), order = pal.map((c, i) => i).sort((a, b) => lum(pal[b]) - lum(pal[a]));
  const masks = once("blocks", () => {
    const r = raster(env), grain = env.canvas(r.w, r.h);
    return order.map((pi, k) => {
      const L = env.canvas(r.w, r.h), img = L.ctx.createImageData(r.w, r.h), d = img.data, col = tone(pal[pi]);
      for (let p = 0; p < r.w * r.h; p++) { const c: RGB = [r.rgb[p * 4], r.rgb[p * 4 + 1], r.rgb[p * 4 + 2]]; if (nearest(c, pal) !== pi) continue; const x = p % r.w, y = (p / r.w) | 0, wood = fractal(61 + k, x * 0.12, y * 2.2, 0.08, 0.02, 3); d[p * 4] = col[0]; d[p * 4 + 1] = col[1]; d[p * 4 + 2] = col[2]; d[p * 4 + 3] = 255 * clamp(0.93 + (wood - 0.5) * 0.3); }
      L.ctx.putImageData(img, 0, 0); void grain; return L;
    });
  });
  const n = masks.length, q = rng(77);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
  masks.forEach((L, k) => {
    const a0 = 0.01 + (k / Math.max(1, n)) * 0.62, p = clamp((U(f) - a0) / 0.07), ox = (q() - 0.5) * 5, oy = (q() - 0.5) * 5; if (p <= 0) return;
    ctx.globalAlpha = 0.25 + 0.75 * ease(p); ctx.drawImage(L.canvas as CanvasImageSource, ox * env.scale, oy * env.scale, W * env.scale, H * env.scale);
  });
  ctx.globalAlpha = 1;
  const kp = clamp((U(f) - 0.66) / 0.08);
  if (kp > 0) { const g = new Gfx(ctx, env, f, BRUSH); g.group("plain", () => { for (const s of scene()) if (!s.big) { if (s.fill) s.poly.forEach((sub, j) => g.pen(sub, { w: 2.6, color: LOOK.ink!, seed: 3 + s.i * 7 + j, boil: 0, wobble: 0.6 })); else strokeOnly(g, s, 1); } }, { alpha: 0.9 * ease(kp), textures: ["pencilTooth"] }); }
  if (LOOK.tooth) new Gfx(ctx, env, f, INK).paper(LOOK.tooth, LOOK.toothAlpha ?? 0.3);
};

// embroidery: each thing stitched in satin stitch on linen, then outlined in backstitch; wide backdrops get seed stitches
const stitch = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env);
  logical(ctx, env);
  const weave = once("weave", () => { const L = env.canvas(64, 64), c = L.ctx; c.fillStyle = LOOK.paper; c.fillRect(0, 0, 64, 64); c.strokeStyle = "rgba(90,70,40,0.16)"; c.lineWidth = 1; for (let i = 0; i < 64; i += 4) { c.beginPath(); c.moveTo(i + 0.5, 0); c.lineTo(i + 0.5, 64); c.moveTo(0, i + 0.5); c.lineTo(64, i + 0.5); c.stroke(); } return L; });
  ctx.fillStyle = ctx.createPattern(weave.canvas as CanvasImageSource, "repeat")!; ctx.fillRect(0, 0, W, H);
  type St = { a: P; b: P; s: number; t: number; c: RGB };
  const sts = once("stitches", () => {
    const r = raster(env), q = rng(19), out: St[] = [];
    for (const s of scene()) {
      if (!s.fill) continue;
      const ang = s.big ? 0.3 : -0.6 + q() * 1.2, gap = s.big ? 5.5 : 3.4, len = s.big ? 14 : 26, col = tone(s.fill);
      for (const run of hatchRuns({ x0: s.box[0], y0: s.box[1], x1: s.box[2], y1: s.box[3] }, ang, gap, (x, y) => idAt(r, x, y) === s.i, 2.5, 3 + s.i)) {
        for (let i = 0; i < run.length - 1; i += s.big ? 8 : Math.max(2, Math.round(len / 2.5))) {
          const j = Math.min(run.length - 1, i + Math.max(1, Math.round((s.big ? len : len) / 2.5)));
          const c = s.grad ? colAt(r, run[i][0], run[i][1]) : col; out.push({ a: run[i], b: run[j], s: s.i, t: q(), c: mixc(tone(c), [0, 0, 0], (q() - 0.5) * 0.12) });
        }
      }
    }
    return out;
  });
  const pr = progs(f, scene().length); ctx.lineCap = "round";
  for (const st of sts) {
    const v = clamp((pr[st.s] - st.t * 0.85) / 0.15); if (v <= 0) continue;
    const bx = st.a[0] + (st.b[0] - st.a[0]) * v, by = st.a[1] + (st.b[1] - st.a[1]) * v;
    ctx.strokeStyle = css(mixc(st.c, [0, 0, 0], 0.3)); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(st.a[0] + 0.6, st.a[1] + 0.8); ctx.lineTo(bx + 0.6, by + 0.8); ctx.stroke();
    ctx.strokeStyle = css(st.c); ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(...st.a); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = css(mixc(st.c, [255, 255, 255], 0.35)); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(st.a[0] - 0.5, st.a[1] - 0.7); ctx.lineTo(bx - 0.5, by - 0.7); ctx.stroke();
  }
  // backstitch outlines
  ctx.strokeStyle = LOOK.ink!; ctx.lineWidth = 2.2; ctx.setLineDash([7, 3]);
  for (const s of scene()) { if (s.big) continue; const p = clamp((pr[s.i] - 0.75) / 0.25); if (p <= 0) continue; ctx.strokeStyle = s.fill ? LOOK.ink! : css(tone(s.stroke!)); ctx.beginPath(); for (const sub of s.poly) { const n = Math.max(2, Math.ceil(sub.length * p)); ctx.moveTo(...sub[0]); for (let i = 1; i < n; i++) ctx.lineTo(...sub[i]); } ctx.stroke(); }
  ctx.setLineDash([]);
};

const TECH: Record<Look["tech"], (ctx: Ctx, f: number, env: Env) => void> = {
  sketch, flat, cut, theatre, stipple, halftone, riso, pixel, brick, lowpoly,
  dabs: (c, f, e) => dabs(c, f, e, false), oil: (c, f, e) => dabs(c, f, e, true), spiral, hatch, scratch, blueprint, block, stitch,
};

export const sceneDraw: Film = {
  meta: { title: `FrameMotion scene · ${SPEC.style}`, W, H, fps: FPS, bpm: 120, durationFrames: N, kind: "drawing" },
  assets: { images: {} },
  shots: [{ id: "scene", start: 0, end: N, draw: (ctx, f, env) => { ((!SPEC.look && OWN[SPEC.style]) || TECH[LOOK.tech] || sketch)(ctx, f, env); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; } }],
};
