// folk-tale: a scene painted the way the bundled folk-tale film paints its storybook spread (anidoodle
// folkTaleKit.ts, Apache-2.0, Copyright 2026 Alex Greenshpun: pencil, sketch, gouache with dry-brush drags,
// mottle and a settled rim, the brush-front reveal, far() haze and the sheet are the kit's). Depth is the
// medium: the same paint is opaque and rich in front, thin and pale in the middle distance, and at the back
// the thing is left as a bare graphite drawing on the cream sheet. The whole picture is drawn in HB pencil
// first, then painted back to front with the wet brush front sweeping across each thing, the shade side
// in a darker body colour and the lit side dragged lighter, then a few pencil accents in front.
import { Gfx, PENCIL, type Ctx, type Env, type P } from "../core";
import { GRAPH, PAPER, darken, far, gouache, lighten, pencil, reveal, sheet, stroke, type Box } from "../folkTaleKit";
import { checkOps, schedule, staged, type Op } from "../brokenColourKit";
import { W, H, scene, lit, fillOf, hex, sizeOf, outlineOf, areaOf, shown, type Shape } from "../sceneKit";

// depth from the scene's order: the backdrop and the first groups are far, the last groups near
const depthOf = (s: Shape, maxL: number) => (s.big ? 0.55 : Math.max(0, Math.min(1, 1 - s.layer / Math.max(1, maxL))) * 0.95);
const boxOf = (s: Shape): Box => [s.box[0] - 6, s.box[1] - 6, s.box[2] + 6, s.box[3] + 6];
const clipTo = (c: Ctx, s: Shape, fn: () => void) => { c.save(); c.beginPath(); for (const sub of s.subs) { sub.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); } c.clip(s.rule); fn(); c.restore(); };

const build = (env: Env): Op[] => {
  const list = scene(), maxL = Math.max(...list.map((s) => s.layer)), ops: Op[] = [];
  const add = (marks: ((ctx: Ctx, env: Env, p: number) => void)[], f0: number, f1: number, dur: number) => { if (!marks.length) return; const t = schedule(marks.length, f0, f1, dur); marks.forEach((d, i) => ops.push({ ...t[i], draw: d })); };
  const L2 = (ctx: Ctx, e: Env) => ctx.setTransform(e.scale, 0, 0, e.scale, 0, 0);
  // 1 · the pencil drawing of everything, the near things pressed firmer
  add(list.filter((s) => !s.big).map((s) => (ctx: Ctx, e: Env, p: number) => { L2(ctx, e); const d = depthOf(s, maxL); (s.fill ? [outlineOf(s)] : s.poly).forEach((pts, j) => pencil(ctx, { pts: pts.filter((_, k, a) => k % 2 === 0 || k === a.length - 1), seed: 10 + s.i * 7 + j, w: 1.1 - 0.4 * d, a: 0.72 - 0.25 * d, closed: !!s.fill, per: 3 }, p)); }), 2, 82, 9);
  // 2 · paint, back to front, the wet front sweeping across each thing
  add(list.filter((s) => s.fill).map((s) => (ctx: Ctx, e: Env, p: number) => {
    L2(ctx, e); const d = depthOf(s, maxL), col = hex(fillOf(s)), L = lit(s), e0 = outlineOf(s), sz = sizeOf(s), bx = boxOf(s);
    if (d > 0.88 && !s.big) return reveal(ctx, bx, 0.3, p, 40 + s.i, () => gouache(ctx, e0, far(col, d), { seed: 40 + s.i, a: 0.25, wob: 2 }));   // the far back: a breath of colour over the drawing
    reveal(ctx, bx, s.big ? Math.PI / 2 : 0.25, p, 40 + s.i, () => {
      const a = s.big ? 0.8 : 1 - 0.55 * d, base = far(col, d * 0.9);
      if (s.grad) { clipTo(ctx, s, () => { const g = ctx.createLinearGradient(0, s.box[1], 0, s.box[3]); s.grad!.stops.forEach(([o, cc]) => g.addColorStop(Math.max(0, Math.min(1, o)), far(hex(cc), d * 0.9))); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(s.box[0], s.box[1], s.box[2] - s.box[0], s.box[3] - s.box[1]); ctx.globalAlpha = 1; }); }
      else gouache(ctx, e0, base, { seed: 40 + s.i, a, wob: s.big ? 0 : 2.5, tex: d < 0.6 ? { cols: [lighten(base, 0.25), darken(base, 0.15)], n: Math.min(220, Math.round(areaOf(s) / 900)), len: Math.max(8, Math.min(40, sz * 0.3)), w: Math.max(3, Math.min(9, sz * 0.06)), ang: L.side(s.box[0], s.box[1]) > 0 ? 0.2 : -0.4, a: 0.35 } : undefined, mottle: d < 0.5 && !s.big ? { cols: [darken(base, 0.18), lighten(base, 0.2)], n: Math.min(60, Math.round(areaOf(s) / 2500)), r: Math.max(2, Math.min(10, sz * 0.05)) } : undefined, rim: d < 0.7 ? darken(base, 0.3) : undefined, rimW: 1.6, rimA: 0.35 });
      if (!s.big && d < 0.7 && sz > 24) clipTo(ctx, s, () => {   // the shade side in a darker body colour, the lit side dragged lighter
        const reg = shown(e, s); ctx.lineCap = "round";
        for (let y = s.box[1]; y < s.box[3]; y += 3.5) for (let x = s.box[0]; x < s.box[2]; x += 3.5) { if (!reg.has(x, y)) continue; const sd = L.side(x, y); if (sd > 0.25) { ctx.globalAlpha = Math.min(0.5, (sd - 0.25) * 0.8) * (1 - d); ctx.fillStyle = darken(base, 0.3); ctx.fillRect(x, y, 3.6, 3.6); } else if (L.hi(x, y)) { ctx.globalAlpha = 0.35 * (1 - d); ctx.fillStyle = lighten(base, 0.4); ctx.fillRect(x, y, 3.6, 3.6); } }
        ctx.globalAlpha = 1;
      });
    });
  }), 84, 236, 14);
  // thin things painted as brush strokes of body colour
  add(list.filter((s) => !s.fill).map((s) => (ctx: Ctx, e: Env, p: number) => { L2(ctx, e); const d = depthOf(s, maxL); s.poly.forEach((sub) => stroke(ctx, sub.filter((_, k, a) => k % 3 === 0 || k === a.length - 1), Math.max(1.2, s.sw * 0.55), Math.max(0.8, s.sw * 0.4), far(hex(s.stroke!), d * 0.8), 1 - 0.4 * d, p)); }), 200, 240, 8);
  // 3 · the drawing showing through the thin paint of the middle distance, and pencil accents in front on the shade side
  add(list.filter((s) => s.fill && !s.big && depthOf(s, maxL) >= 0.35).map((s) => (ctx: Ctx, e: Env, p: number) => { L2(ctx, e); const d = depthOf(s, maxL); pencil(ctx, { pts: outlineOf(s).filter((_, k, a) => k % 2 === 0 || k === a.length - 1), seed: 70 + s.i, w: 0.9, a: 0.25 + 0.4 * d, closed: true, per: 3, retrace: false }, p); }), 236, 262, 6);
  add(list.filter((s) => s.fill && !s.big && depthOf(s, maxL) < 0.35).map((s) => (ctx: Ctx, e: Env, p: number) => { L2(ctx, e); const L = lit(s), pts = outlineOf(s).filter(([x, y]) => L.side(x, y) > 0.1); if (pts.length > 2) pencil(ctx, { pts, seed: 90 + s.i, w: 1.3, a: 0.8, col: GRAPH, per: 3, retrace: false }, p); }), 238, 264, 6);
  ops.sort((a, b) => a.t1 - b.t1);
  return checkOps(ops, 270);
};

let O: Op[] | null = null;
export const folkTaleLook = staged("scene-folk", () => (O ??= build({} as Env)),
  (c, e) => { const g = new Gfx(c, e, 0, PENCIL); sheet(g, [[W * 0.18, H * 0.16, Math.min(W, H) * 0.7, "#f7d98a"]]); },
  (c, e) => { const g = new Gfx(c, e, 0, PENCIL); g.paper("paper", 0.1); g.paper("coldpress", 0.12); });
void PAPER; void ({} as P);
