// The scene kit (ours, MIT like FrameMotion): the scene file read into shapes, the scene as pixels, light
// on each shape, and the draw-on clock. Every look (looks/*.ts) draws from these.
import { fractal, type Ctx, type Env, type P } from "./core";
import { clamp } from "./gallery";

export type RGB = [number, number, number];
export type Grad = { x1: number; y1: number; x2: number; y2: number; stops: [number, RGB][] };
export type Shape = { i: number; subs: P[][]; poly: P[][]; fill: RGB | null; grad: Grad | null; stroke: RGB | null; sw: number; alpha: number; rule: CanvasFillRule; layer: number; box: [number, number, number, number]; big: boolean };
export type Spec = { svg: string; style: string; look?: Record<string, unknown>; W: number; H: number };
export const SPEC: Spec = (globalThis as unknown as { __SCENE__?: Spec }).__SCENE__ ?? { svg: "<svg/>", style: "crayon", W: 1080, H: 1080 };
export const W = SPEC.W, H = SPEC.H, FPS = 30, N = 10 * FPS;
export const rgbOf = (c: string | null): RGB | null => {
  if (!c) return null;
  const h = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (h) { const x = h[1].length === 3 ? h[1].replace(/./g, "$&$&") : h[1]; return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)) as RGB; }
  const m = c.match(/-?\d+(\.\d+)?/g);
  return m && m.length >= 3 ? (m.slice(0, 3).map(Number) as RGB) : null;
};
export const css = (c: RGB, a = 1) => (a >= 1 ? `rgb(${c.map((v) => Math.round(clamp(v, 0, 255))).join(",")})` : `rgba(${c.map((v) => Math.round(clamp(v, 0, 255))).join(",")},${a})`);
export const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const lum = (c: RGB) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
export const avg = (g: Grad): RGB => { const a: RGB = [0, 0, 0]; g.stops.forEach(([, c]) => { a[0] += c[0]; a[1] += c[1]; a[2] += c[2]; }); return a.map((v) => v / g.stops.length) as RGB; };
let SHAPES: Shape[] | null = null;
export const scene = (): Shape[] => {
  if (SHAPES) return SHAPES;
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;left:-100000px;top:0;width:1px;height:1px;overflow:hidden";
  // The file is data: parsed as XML, with scripts, foreign HTML, links and event attributes removed before it is shown.
  const doc = new DOMParser().parseFromString(SPEC.svg, "image/svg+xml");
  doc.querySelectorAll("script,foreignObject,iframe,a,image,use,style").forEach((e) => e.remove());
  doc.querySelectorAll("*").forEach((e) => { for (const a of Array.from(e.attributes)) if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value) || /href$/i.test(a.name)) e.removeAttribute(a.name); });
  const root = doc.documentElement.tagName.toLowerCase() === "svg" ? (document.importNode(doc.documentElement, true) as unknown as SVGSVGElement) : null;
  const out: Shape[] = [];
  if (root) {
    const vb = root.viewBox?.baseVal, vw = vb && vb.width ? vb.width : parseFloat(root.getAttribute("width") || "") || W, vh = vb && vb.height ? vb.height : parseFloat(root.getAttribute("height") || "") || H;
    const vx = vb && vb.width ? vb.x : 0, vy = vb && vb.width ? vb.y : 0;
    root.setAttribute("width", String(vw)); root.setAttribute("height", String(vh));
    host.appendChild(root); document.body.appendChild(host);
    // The scene's own frame (viewBox) fills the film's frame, centred, whole (author it at the film's shape).
    const k = Math.min(W / vw, H / vh), ox = (W - vw * k) / 2, oy = (H - vh * k) / 2;
    const tops = Array.from(root.children);
    const gradOf = (v: string): Grad | null => {
      const id = v.match(/url\(["']?#([^"')]+)/)?.[1]; const g = id ? root.querySelector(`#${CSS.escape(id)}`) : null;
      if (!g) return null;
      const stops = Array.from(g.querySelectorAll("stop")).map((s) => { const st = getComputedStyle(s); return [parseFloat(s.getAttribute("offset") || "0") / (/%/.test(s.getAttribute("offset") || "") ? 100 : 1), rgbOf(st.stopColor) ?? [128, 128, 128]] as [number, RGB]; });
      if (!stops.length) return null;
      const n = (a: string, d: number) => { const t = g.getAttribute(a); return t == null ? d : parseFloat(t) / (/%/.test(t) ? 100 : 1); };
      return g.tagName.toLowerCase() === "lineargradient" ? { x1: n("x1", 0), y1: n("y1", 0), x2: n("x2", 1), y2: n("y2", 0), stops } : { x1: 0.5, y1: 0, x2: 0.5, y2: 1, stops };
    };
    for (const el of Array.from(root.querySelectorAll("path,circle,ellipse,rect,line,polyline,polygon"))) {
      if (el.closest("defs,clipPath,mask,pattern,linearGradient,radialGradient")) continue;
      const geo = el as SVGGeometryElement, len = geo.getTotalLength(), m = geo.getCTM();
      if (!len || !m) continue;
      const n = Math.max(16, Math.min(3000, Math.ceil(len / 2))), step = len / n, subs: P[][] = [];
      let cur: P[] = [], last: DOMPoint | null = null;
      for (let i = 0; i <= n; i++) {
        const q = geo.getPointAtLength(Math.min(len, i * step)).matrixTransform(m);
        if (last && Math.hypot(q.x - last.x, q.y - last.y) > step * 4 * Math.max(1, Math.abs(m.a) + Math.abs(m.b))) { if (cur.length > 1) subs.push(cur); cur = []; }
        cur.push([(q.x - vx) * k + ox, (q.y - vy) * k + oy]); last = q;
      }
      if (cur.length > 1) subs.push(cur);
      const cs = getComputedStyle(el), open = el.tagName === "line" || el.tagName === "polyline";
      const grad = !open && /url\(/.test(cs.fill) ? gradOf(cs.fill) : null;
      const none = (v: string) => !v || v === "none" || v === "transparent" || /^rgba\([^)]*,\s*0(\.0+)?\)$/.test(v);
      const fill = open || none(cs.fill) ? null : grad ? avg(grad) : rgbOf(cs.fill);
      const stroke = none(cs.stroke) || /url\(/.test(cs.stroke) ? null : rgbOf(cs.stroke);
      if (!fill && !stroke) continue;
      let top = el as Element; while (top.parentElement && top.parentElement !== (root as unknown as Element)) top = top.parentElement;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const sub of subs) for (const [x, y] of sub) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const op = parseFloat(cs.opacity || "1") * parseFloat((fill ? cs.fillOpacity : cs.strokeOpacity) || "1");
      out.push({ i: out.length, subs, poly: subs.map((s) => thin(s, 4)), fill, grad, stroke, sw: (parseFloat(cs.strokeWidth) || 1) * k * Math.hypot(m.a, m.b), alpha: isFinite(op) ? op : 1,
        rule: cs.fillRule === "evenodd" ? "evenodd" : "nonzero", layer: Math.max(0, tops.indexOf(top)), box: [x0, y0, x1, y1], big: (x1 - x0) * (y1 - y0) > 0.4 * W * H });
    }
    host.remove();
  }
  SHAPES = out;
  return out;
};
export const thin = (s: P[], d: number): P[] => { const o: P[] = [s[0]]; for (const p of s) { const q = o[o.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= d) o.push(p); } if (o.length < 2) o.push(s[s.length - 1]); return o; };
export type Raster = { rgb: Uint8ClampedArray; id: Int16Array; w: number; h: number; R: number };
export const cache = new Map<string, unknown>();
export const once = <T>(key: string, make: () => T): T => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key) as T; };
export const trace = (c: Ctx, s: Shape) => { c.beginPath(); for (const sub of s.subs) { sub.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); if (s.fill) c.closePath(); } };
const same = (c: RGB) => c;
export const paintOf = (c: Ctx, s: Shape, t: (c: RGB) => RGB = same): string | CanvasGradient => {
  if (!s.grad) return css(t(s.fill!));
  const [x0, y0, x1, y1] = s.box, g = c.createLinearGradient(x0 + s.grad.x1 * (x1 - x0), y0 + s.grad.y1 * (y1 - y0), x0 + s.grad.x2 * (x1 - x0), y0 + s.grad.y2 * (y1 - y0));
  s.grad.stops.forEach(([o, col]) => g.addColorStop(clamp(o), css(t(col))));
  return g;
};
export const raster = (env: Env): Raster => once("raster", () => {
  const R = 1, w = Math.round(W * R), h = Math.round(H * R), L = env.canvas(w, h), c = L.ctx, list = scene();
  c.setTransform(R, 0, 0, R, 0, 0); c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
  for (const s of list) {
    c.globalAlpha = s.alpha; trace(c, s);
    if (s.fill) { c.fillStyle = paintOf(c, s); c.fill(s.rule); }
    if (s.stroke && s.sw > 0) { c.strokeStyle = css(s.stroke); c.lineWidth = s.sw; c.lineCap = "round"; c.lineJoin = "round"; c.stroke(); }
  }
  c.globalAlpha = 1;
  const rgb = c.getImageData(0, 0, w, h).data;
  // which thing is on top at each pixel: a second pass in flat id colours, read without smoothing
  const I = env.canvas(w, h), d = I.ctx; d.setTransform(R, 0, 0, R, 0, 0); d.fillStyle = "#000"; d.fillRect(0, 0, W, H);
  for (const s of list) { const v = s.i + 1; trace(d, s); if (s.fill) { d.fillStyle = `rgb(${v >> 8},${v & 255},0)`; d.fill(s.rule); } if (s.stroke && s.sw > 0) { d.strokeStyle = `rgb(${v >> 8},${v & 255},0)`; d.lineWidth = Math.max(1.5, s.sw); d.stroke(); } }
  const raw = d.getImageData(0, 0, w, h).data, id = new Int16Array(w * h);
  for (let p = 0; p < w * h; p++) id[p] = Math.min(list.length, (raw[p * 4] << 8) | raw[p * 4 + 1]) - 1;
  return { rgb, id, w, h, R };
});
export const at = (r: Raster, x: number, y: number) => Math.max(0, Math.min(r.h - 1, Math.floor(y * r.R))) * r.w + Math.max(0, Math.min(r.w - 1, Math.floor(x * r.R)));
export const colAt = (r: Raster, x: number, y: number): RGB => { const p = at(r, x, y) * 4; return [r.rgb[p], r.rgb[p + 1], r.rgb[p + 2]]; };
export const idAt = (r: Raster, x: number, y: number) => r.id[at(r, x, y)];
export const lumAt = (r: Raster, x: number, y: number) => lum(colAt(r, x, y)) / 255;
// the scene's own colours (gradient stops too), for the styles that print or build from a set palette
export const palette = (): RGB[] => once("palette", () => { const out: RGB[] = []; for (const s of scene()) for (const c of s.grad ? s.grad.stops.map((t) => t[1]) : s.fill ? [s.fill] : []) if (!out.some((o) => Math.hypot(o[0] - c[0], o[1] - c[1], o[2] - c[2]) < 18)) out.push(c); return out.length ? out : [[128, 128, 128] as RGB]; });
export const nearest = (c: RGB, pal: RGB[]) => { let b = 0, d = 1e9; pal.forEach((p, i) => { const e = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (e < d) { d = e; b = i; } }); return b; };

// ---------------------------------------------------------------- regions and light
export type Region = { box: { x0: number; y0: number; x1: number; y1: number }; has: (x: number, y: number) => boolean };
// the part of a thing that shows (what is in front of it is left out), or its whole outline
export const shown = (env: Env, s: Shape): Region => { const r = raster(env); return { box: { x0: s.box[0], y0: s.box[1], x1: s.box[2], y1: s.box[3] }, has: (x, y) => idAt(r, x, y) === s.i }; };
export const insideShape = (s: Shape, x: number, y: number) => { let k = false; for (const pts of s.subs) for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) k = !k; } return k; };
export const whole = (s: Shape): Region => ({ box: { x0: s.box[0], y0: s.box[1], x1: s.box[2], y1: s.box[3] }, has: (x, y) => insideShape(s, x, y) });
export const outlineOf = (s: Shape): P[] => s.poly.reduce((a, b) => (b.length > a.length ? b : a), s.poly[0] ?? []);
// One light from the upper left (where a sun or moon would be). `side` grows toward the shade side of a
// thing (> 0.15 shade, > 0.75 deep shade); `hi` is the lit spot on the upper left. A backdrop is shaded by
// height instead: a sky darkens toward the top, the ground toward the bottom.
export type Lit = { side: (x: number, y: number) => number; hi: (x: number, y: number) => boolean; u: (x: number) => number; v: (y: number) => number };
export const lit = (s: Shape): Lit => {
  const [x0, y0, x1, y1] = s.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.max(6, (x1 - x0) / 2), ry = Math.max(6, (y1 - y0) / 2);
  const u = (x: number) => (x - cx) / rx, v = (y: number) => (y - cy) / ry, nz = (x: number, y: number) => fractal(9 + s.i, x, y, 0.02, 0.02, 2) - 0.5;
  if (s.big) { const sky = cy < H * 0.5, wave = (x: number, y: number) => fractal(19 + s.i, x, y, 0.004, 0.004, 2) - 0.5; return { u, v, side: (x, y) => (sky ? -v(y) : v(y)) * 0.9 + wave(x, y) * 0.9, hi: () => false }; }
  return { u, v, side: (x, y) => u(x) * 0.9 + v(y) * 0.8 + nz(x, y) * 0.35, hi: (x, y) => { const a = u(x) + 0.42, b = v(y) + 0.52; return a * a * 1.4 + b * b < 0.1 + nz(x, y) * 0.12; } };
};
export const fillOf = (s: Shape): RGB => s.fill ?? s.stroke ?? [90, 90, 90];
export const hex = (c: RGB) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
export const sizeOf = (s: Shape) => Math.min(s.box[2] - s.box[0], s.box[3] - s.box[1]);

// ---------------------------------------------------------------- the draw-on clock
// A look draws the whole picture as a list of marks in its own order, each asking the clock how far along
// it is (0 not yet, 1 done). A survey pass with a clock that answers 0 writes every mark down; the plan
// then gives each phase of the look ("lay", "fill", "shade", "line"...) its window of frames, and inside a
// window the marks follow one another by priority, then drawing order, each taking time by its cost.
// From DONE on the clock answers 1, so the hold is the finished picture, byte for byte.
export type Clock = { p: (kind: string, cost: number, prio?: number) => number };
export const DONE_ALL: Clock = { p: () => 1 };
type Plan = Map<number, [number, number]>;
export const drawOn = (key: string, f: number, phases: Record<string, [number, number]>, done: number, draw: (clk: Clock) => void) => {
  if (f >= done) { draw(DONE_ALL); return; }
  const plan = once("plan:" + key, (): Plan => {
    const marks: { i: number; k: string; c: number; pr: number }[] = []; let n = 0;
    draw({ p: (k, c, pr = 0) => { marks.push({ i: n++, k, c: Math.max(1, c), pr }); return 0; } });
    const out: Plan = new Map();
    for (const [k, [a, b]] of Object.entries(phases)) {
      const list = marks.filter((m) => m.k === k).sort((p, q) => p.pr - q.pr || p.i - q.i), tot = list.reduce((s, m) => s + m.c, 0) || 1; let acc = 0;
      list.forEach((m) => { const t0 = a + ((b - a) * acc) / tot; acc += m.c; out.set(m.i, [t0, a + ((b - a) * acc) / tot]); });
    }
    return out;
  });
  let i = 0;
  draw({ p: () => { const w = plan.get(i++); return w ? clamp((f - w[0]) / Math.max(1e-6, w[1] - w[0])) : 0; } });
};
export const lenOf = (pts: P[]) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
export const areaOf = (s: Shape) => Math.max(1, (s.box[2] - s.box[0]) * (s.box[3] - s.box[1]));
