// cyanotype: a scene drafted on blueprint stock the way the bundled cyanotype film drafts its going
// train (anidoodle blueprintKit.ts and blueprint.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: the sheet
// that never exposed evenly, the ruling pen that is never quite straight, the ink group that blooms, the
// chain line, section lining that starts and stops inside a part, the linear dimension and the border are
// the kit's; the title box is ported from the film). White ink on Prussian blue: the border ruled and
// zone-marked, construction lines thin and dim, then every thing's outline in the ruling pen, section
// lining over the darker parts, a dimension or two on the subject, the title block last.
import { Gfx, type Ctx, type Env, type P } from "../core";
import { CYAN, DIM, DRAFT, border, cut, kit, sheet, stagger, tooth, type Kit } from "../blueprintKit";
import { W, H, N, scene, fillOf, outlineOf, areaOf, sizeOf, visibleRuns, drawOn, lenOf, type Clock } from "../sceneKit";

const lumOf = (c: number[]) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
const picture = (ctx: Ctx, env: Env, clk: Clock) => {
  const g = new Gfx(ctx, env, 0, DRAFT), k: Kit = kit(g), list = scene();
  sheet(k);
  border(k, clk.p("border", 80));
  // construction: a centre line through each sizeable thing, thin and dim, left on the sheet
  k.ink(() => list.filter((s) => s.fill && !s.big && sizeOf(s) > 60).forEach((s, i) => { const q = clk.p("construct", 30), [x0, y0, x1, y1] = s.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; if (q <= 0) return; k.chain([x0 - 14, cy], [x1 + 14, cy], 0.8, { color: DIM, opacity: 0.7, seed: 50 + i, progress: q }); k.chain([cx, y0 - 14], [cx, y1 + 14], 0.8, { color: DIM, opacity: 0.7, seed: 60 + i, progress: q }); }));
  // the outlines in the ruling pen: what shows of every thing; a backdrop only where it meets the sheet's horizon
  k.ink(() => list.forEach((s) => {
    if (!s.fill) { s.poly.forEach((p, j) => visibleRuns(env, s, p).forEach((run, m) => { const q = clk.p("line", lenOf(run) ** 0.8 + 6, s.i); if (q > 0) k.pen(run.filter((_, i, a) => i % 2 === 0 || i === a.length - 1), Math.max(1.2, Math.min(3, s.sw * 0.35)), { seed: 200 + s.i * 9 + j * 3 + m, progress: q }); })); return; }
    // a backdrop's edge only where it meets another thing, not along the frame
    const runs = s.big ? visibleRuns(env, s).flatMap((run) => { const out: P[][] = []; let cur: P[] = []; run.forEach((p) => { if (p[0] < 4 || p[1] < 4 || p[0] > W - 4 || p[1] > H - 4) { if (cur.length > 3) out.push(cur); cur = []; } else cur.push(p); }); if (cur.length > 3) out.push(cur); return out; }) : visibleRuns(env, s);
    runs.forEach((run, m) => { const q = clk.p("line", lenOf(run) ** 0.8 + 6, s.i); if (q > 0) k.pen(run.filter((_, i, a) => i % 2 === 0 || i === a.length - 1), areaOf(s) > 0.01 * W * H ? 2.4 : 1.7, { seed: 300 + s.i * 9 + m, progress: q }); });
  }));
  // section lining over the darker parts, at 45 degrees, closer for the darkest
  k.ink(() => list.filter((s) => s.fill && !s.big && lumOf(fillOf(s)) < 0.55 && sizeOf(s) > 18).forEach((s) => { const q = clk.p("hatch", Math.sqrt(areaOf(s)) * 0.6 + 8, s.i); if (q > 0) k.hatch(outlineOf(s).filter((_, i, a) => i % 3 === 0 || i === a.length - 1), Math.PI / 4, lumOf(fillOf(s)) < 0.25 ? 6 : 10, 0.9, 400 + s.i, { progress: q }); }));
  // dimensions on the subject: its width under it, its height beside it, in drafting order
  const subj = list.filter((s) => s.fill && !s.big && areaOf(s) > 0.004 * W * H).reduce<typeof list[0] | null>((a, s) => (!a || s.layer > a.layer || (s.layer === a.layer && areaOf(s) > areaOf(a)) ? s : a), null);
  if (subj) k.ink(() => { const [x0, y0, x1, y1] = subj.box, q = clk.p("dim", 60); k.dim([x0, y1], [x1, y1], 26, String(Math.round((x1 - x0) / 4)), 700, cut(q, 0, 0.6)); k.dim([x1, y0], [x1, y1], -26, String(Math.round((y1 - y0) / 4)), 710, cut(q, 0.4, 1)); });
  // the title block, bottom right
  k.ink(() => { const q = clk.p("title", 60), x1 = W - 54, y1 = H - 54, x0 = x1 - Math.min(376, W * 0.35), y0 = y1 - 136, s2 = stagger(cut(q, 0, 0.6), 2, 0.8); [[0, 2.6], [5, 1.1]].forEach(([m, w], j) => { const c: P[] = [[x0 + m, y0 + m], [x1 - m, y0 + m], [x1 - m, y1 - m], [x0 + m, y1 - m]]; const q4 = stagger(s2(j), 4, 0.4); c.forEach((a, i) => k.ln(a, c[(i + 1) % 4], w, { seed: 800 + j * 4 + i, taper: 0.15, progress: q4(i) })); }); const lq = cut(q, 0.5, 1); k.ln([x0 + 5, y0 + 62], [x1 - 5, y0 + 62], 1.2, { seed: 812, progress: cut(lq, 0, 0.5) }); k.ln([x0 + 5, y0 + 99], [x1 - 5, y0 + 99], 1, { seed: 813, color: CYAN, progress: cut(lq, 0.3, 0.8) }); [x0 + 128, x0 + 252].forEach((x, i) => k.ln([x, y0 + 62], [x, y1 - 5], 1, { seed: 814 + i, color: CYAN, progress: cut(lq, 0.5, 1) })); k.text("PLATE I", x0 + 16, y0 + 22, { cap: 14, seed: 820, progress: cut(lq, 0.6, 1) }); });
  tooth(g);
};
const PHASES: Record<string, [number, number]> = { border: [1, 40], construct: [42, 70], line: [72, 190], hatch: [192, 232], dim: [234, 252], title: [252, 266] };
export const cyanotypeLook = (ctx: Ctx, f: number, env: Env) => drawOn("cyanotype", Math.min(f, N), PHASES, 268, (clk) => picture(ctx, env, clk));
