// FrameMotion's motif film (ours, MIT like FrameMotion): draws the user's own picture by hand in one of
// five media. The anidoodle builder hands it window.__MOTIF__ = {kind, medium, svg?} and, for a raster
// picture, the image as the asset "motif".
//   SVG (a logo, an icon, line art): every shape's outline is drawn on with the bundled kit's pen, in the
//   order of the file, then each filled shape is coloured in (scribbled, or washed for ink), then a hold.
//   PNG or JPG (a photo, a sketch): the picture is revealed by hand strokes of the medium, then a hold.
// Every frame is drawn from its number alone (no state carried between frames), so any order renders the same.
import { Gfx, PENCIL, RISOLINE, rng, type Ctx, type Env, type Medium, type P } from "./core";
import type { Film } from "./film";
import { clamp } from "./gallery";

type Spec = { kind: "svg" | "image"; medium: string; svg?: string; title?: string };
type Shape = { subs: P[][]; fill: string | null; stroke: string | null; length: number };
type Look = { paper: string; tooth: string; toothAlpha: number; line: string; w: number; pen: Medium; fill: "scribble" | "wash" | "flat"; fillAlpha: number; stroke: number; gap: number; light?: boolean };

const SPEC: Spec = (globalThis as unknown as { __MOTIF__?: Spec }).__MOTIF__ ?? { kind: "svg", medium: "pencil" };
const INK: Medium = { nib: 1.25, taper: 0.8, pressure: 0.9, retrace: false, wobble: 0.6, rough: 0.6 };
const WAX: Medium = { nib: 2.6, taper: 0.3, pressure: 0.6, retrace: true, wobble: 1.4, rough: 1.6 };
const CHALK: Medium = { nib: 2.2, taper: 0.4, pressure: 0.7, retrace: true, wobble: 1.2, rough: 1.9 };
const LOOKS: Record<string, Look> = {
  pencil: { paper: "#f4eee2", tooth: "paper", toothAlpha: 0.16, line: "#3d3437", w: 4, pen: PENCIL, fill: "scribble", fillAlpha: 0.6, stroke: 4, gap: 6.5 },
  ink: { paper: "#f7f3ea", tooth: "coldpress", toothAlpha: 0.18, line: "#16130f", w: 5, pen: INK, fill: "wash", fillAlpha: 0.7, stroke: 0, gap: 0 },
  crayon: { paper: "#f6efdf", tooth: "paper", toothAlpha: 0.2, line: "#2e2a26", w: 5, pen: WAX, fill: "scribble", fillAlpha: 0.8, stroke: 9, gap: 11 },
  chalk: { paper: "#24392f", tooth: "paper", toothAlpha: 0.22, line: "#f1efe6", w: 5, pen: CHALK, fill: "scribble", fillAlpha: 0.7, stroke: 7, gap: 10, light: true },
  marker: { paper: "#fbfaf6", tooth: "paper", toothAlpha: 0.08, line: "#1d1d1f", w: 6, pen: RISOLINE, fill: "flat", fillAlpha: 0.92, stroke: 16, gap: 11 },
};
const LOOK = LOOKS[SPEC.medium] ?? LOOKS.pencil;
const W = 1080, H = 1080, FPS = 30, N = 8 * FPS;
const LINES: [number, number] = [-0.03, 0.5], FILLS: [number, number] = [0.42, 0.85];

const colourOf = (v: string | null): string | null => (!v || v === "none" || /rgba?\([^)]*,\s*0\)$/.test(v) ? null : v);
// Chalk on a dark board: a dark colour from the file would vanish, so it is lifted toward the chalk.
const forBoard = (c: string) => { const m = c.match(/\d+(\.\d+)?/g); if (!m || !LOOK.light) return c; const [r, g, b] = m.map(Number); const k = 0.55; return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`; };

let shapes: Shape[] | null = null;
const parse = (): Shape[] => {
  if (shapes) return shapes;
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;left:-100000px;top:0;width:1px;height:1px;overflow:hidden";
  // The file is data: parsed as XML, with scripts, foreign HTML and event attributes removed before it is shown.
  const doc = new DOMParser().parseFromString(SPEC.svg ?? "<svg/>", "image/svg+xml");
  doc.querySelectorAll("script,foreignObject,iframe,a").forEach((e) => e.remove());
  doc.querySelectorAll("*").forEach((e) => { for (const a of Array.from(e.attributes)) if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) e.removeAttribute(a.name); });
  const svg = doc.documentElement.tagName.toLowerCase() === "svg" ? (document.importNode(doc.documentElement, true) as unknown as SVGSVGElement) : null;
  if (svg) host.appendChild(svg);
  document.body.appendChild(host);
  const raw: { subs: P[][]; fill: string | null; stroke: string | null }[] = [];
  if (svg) for (const el of Array.from(svg.querySelectorAll("path,circle,ellipse,rect,line,polyline,polygon"))) {
    const geo = el as SVGGeometryElement, len = geo.getTotalLength(), m = geo.getCTM();
    if (!len || !m) continue;
    const n = Math.max(12, Math.min(2400, Math.ceil(len / 2))), step = len / n, subs: P[][] = [];
    let cur: P[] = [], last: DOMPoint | null = null;
    for (let i = 0; i <= n; i++) {
      const q = geo.getPointAtLength(Math.min(len, i * step)).matrixTransform(m);
      // A jump far longer than one step is a new subpath (a letter's counter, a second part of an icon).
      if (last && Math.hypot(q.x - last.x, q.y - last.y) > step * 4 * Math.max(1, Math.abs(m.a) + Math.abs(m.b))) { if (cur.length > 1) subs.push(cur); cur = []; }
      cur.push([q.x, q.y]); last = q;
    }
    if (cur.length > 1) subs.push(cur);
    const cs = getComputedStyle(el);
    raw.push({ subs, fill: el.tagName === "line" || el.tagName === "polyline" ? null : colourOf(cs.fill), stroke: colourOf(cs.stroke) });
  }
  host.remove();
  // Fit the whole drawing into the middle 76% of the frame.
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of raw) for (const sub of s.subs) for (const [x, y] of sub) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const k = Math.min((W * 0.76) / Math.max(1, x1 - x0), (H * 0.76) / Math.max(1, y1 - y0)), ox = (W - (x1 - x0) * k) / 2 - x0 * k, oy = (H - (y1 - y0) * k) / 2 - y0 * k;
  shapes = raw.map((s) => {
    const subs = s.subs.map((sub) => sub.map(([x, y]) => [x * k + ox, y * k + oy] as P));
    const length = subs.reduce((a, sub) => a + sub.reduce((b, p, i) => (i ? b + Math.hypot(p[0] - sub[i - 1][0], p[1] - sub[i - 1][1]) : 0), 0), 0);
    return { ...s, subs, length };
  });
  return shapes;
};

const phase = (f: number, [a, b]: [number, number]) => clamp((f / (N - 1) - a) / (b - a));

// A scribble across a box: back-and-forth strokes at an angle, the first `p` of them (and the last one partly).
const scribble = (c: Ctx, box: [number, number, number, number], p: number, seed: number, width: number, gap: number) => {
  const [x0, y0, x1, y1] = box, r = rng(seed), a = -0.9 + (r() - 0.5) * 0.3, ca = Math.cos(a), sa = Math.sin(a);
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

const paper = (ctx: Ctx, env: Env) => { ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = LOOK.paper; ctx.fillRect(0, 0, W, H); };

const drawSvg = (ctx: Ctx, f: number, env: Env) => {
  const list = parse(), g = new Gfx(ctx, env, f, LOOK.pen), total = list.reduce((a, s) => a + s.length, 0) || 1;
  // 1. Outlines, drawn on in the file's order at one even speed.
  let done = phase(f, LINES) * total;
  list.forEach((s, i) => s.subs.forEach((sub, j) => {
    const len = sub.reduce((b, p, k) => (k ? b + Math.hypot(p[0] - sub[k - 1][0], p[1] - sub[k - 1][1]) : 0), 0);
    const p = clamp(done / Math.max(1, len)); done -= len;
    if (p <= 0) return;
    const col = s.stroke ?? LOOK.line;
    g.pen(sub, { w: LOOK.w, color: LOOK.light ? forBoard(col) : col, seed: 7 + i * 31 + j, closed: false, progress: p, boil: 0.45 });
  }));
  // 2. Fills, one shape after another, under the outlines' colour but over the paper.
  const fills = list.filter((s) => s.fill), fp = phase(f, FILLS) * fills.length;
  fills.forEach((s, i) => {
    const p = clamp(fp - i); if (p <= 0) return;
    const col = LOOK.light ? forBoard(s.fill!) : s.fill!;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const sub of s.subs) for (const [x, y] of sub) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
    ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
    ctx.beginPath(); for (const sub of s.subs) { sub.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
    ctx.clip("evenodd");
    ctx.globalCompositeOperation = LOOK.light ? "source-over" : "multiply";
    ctx.globalAlpha = LOOK.fillAlpha; ctx.strokeStyle = col; ctx.fillStyle = col;
    if (LOOK.fill === "scribble") scribble(ctx, [bx0, by0, bx1, by1], p, 101 + i * 17, LOOK.stroke, LOOK.gap);
    else if (LOOK.fill === "flat") scribble(ctx, [bx0, by0, bx1, by1], p, 101 + i * 17, LOOK.stroke, LOOK.gap);
    else { ctx.globalAlpha = LOOK.fillAlpha * Math.min(1, 0.4 + p); ctx.fillRect(bx0 - 4, by0 - 4, bx1 - bx0 + 8, (by1 - by0 + 8) * Math.min(1, p * 1.6)); }   // ink: a wash flooded down the shape, settling darker
    ctx.restore();
  });
  // The outlines once more over the fills, at full length (a fill never covers the line it sits in).
  if (fp > 0) list.forEach((s, i) => s.subs.forEach((sub, j) => {
    const col = s.stroke ?? LOOK.line;
    g.pen(sub, { w: LOOK.w, color: LOOK.light ? forBoard(col) : col, seed: 7 + i * 31 + j, progress: 1, boil: 0.45, opacity: clamp(fp) * 0.96 });
  }));
  g.paper(LOOK.tooth, LOOK.toothAlpha);
};

const drawImage = (ctx: Ctx, f: number, env: Env) => {
  const img = env.image?.("motif") as (CanvasImageSource & { width: number; height: number }) | undefined;
  if (!img) return;
  const k = Math.min((W * 0.8) / img.width, (H * 0.8) / img.height), w = img.width * k, h = img.height * k, x = (W - w) / 2, y = (H - h) / 2;
  const p = phase(f, [0, 0.8]), key = "motif:layer:" + env.scale;
  const L = (env.cache.get(key) as ReturnType<Env["canvas"]> | undefined) ?? env.canvas(Math.round(W * env.scale), Math.round(H * env.scale)), c = L.ctx;
  env.cache.set(key, L);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, L.canvas.width, L.canvas.height);
  c.setTransform(env.scale, 0, 0, env.scale, 0, 0); c.strokeStyle = "#000"; c.globalAlpha = 1;
  scribble(c, [x, y, x + w, y + h], p, 211, 46, 26);   // wide overlapping strokes, so no paper shows between them at the end
  c.globalCompositeOperation = "source-in"; c.drawImage(img, x, y, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (LOOK.light) ctx.globalCompositeOperation = "source-over"; else ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(L.canvas as CanvasImageSource, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  new Gfx(ctx, env, f, LOOK.pen).paper(LOOK.tooth, LOOK.toothAlpha);
};

export const motifDraw: Film = {
  meta: { title: SPEC.title ?? "FrameMotion motif · your picture drawn by hand", W, H, fps: FPS, bpm: 120, durationFrames: N, kind: "drawing" },
  assets: { images: SPEC.kind === "image" ? { motif: "motif" } : {} },
  shots: [{ id: "motif", start: 0, end: N, draw: (ctx, f, env) => { paper(ctx, env); (SPEC.kind === "image" ? drawImage : drawSvg)(ctx, f, env); } }],
};
