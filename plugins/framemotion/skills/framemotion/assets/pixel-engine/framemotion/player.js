// FrameMotion's player for one pixelfx effect: every frame is a pure function of its time.
// It follows upstream's tools/lib/fxlib.mjs renderFrames (pixelfx, MIT, Copyright (c) 2026 Patch): a fresh
// effect with the same seed, stepped 1/fps at a time from 0 to the frame, drawn over a backdrop with the
// stand-in actor, then scaled up with whole pixels (no smoothing) to the film's size.
import { createFrame, clearFrame, createFx, composite, painterFor, drawActor, stockActor, actorAlphaOf, backdrop } from '../src/core/index.js';

const SPEC = window.PIXEL_SPEC;   // {fx, options, seed, bg, actor, scale, seconds, width, height, fps}
const mod0 = await import(`../src/fx/${SPEC.fx}.js`);
const meta = { fps: 30, bg: 'dark', loop: false, duration: 1, tags: [], options: {}, ...mod0.meta };
const mod = { ...mod0, meta };
const [EW, EH] = meta.size, [OX, OY] = meta.origin;
const W = SPEC.width, H = SPEC.height;
// Whole-pixel scale: as given, or the largest that fits the effect in 60% of the height (a full-screen effect
// such as a transition fills the frame).
const screen = EW >= 320 && Math.abs(EW / EH - 16 / 9) < 0.05;
const k = SPEC.scale ?? Math.max(1, Math.floor(screen ? Math.min(W / EW, H / EH) : Math.min(W / EW, (H * 0.6) / EH)));
// The pixel grid covers the whole film: the effect sits in the middle, the backdrop fills the rest.
const w = Math.ceil(W / k), h = Math.ceil(H / k), mx = Math.floor((w - EW) / 2), my = Math.floor((h - EH) / 2);
const fps = meta.fps;   // the effect's own step, so the motion matches upstream's renders
const bg = (SPEC.bg ?? meta.bg) === 'none' ? null : backdrop(SPEC.bg ?? meta.bg, w, h, OY + my);
const shown = createFrame(w, h, -mx, -my);
const rgba = new Uint8ClampedArray(w * h * 4), img = new ImageData(rgba, w, h);
const small = new OffscreenCanvas(w, h), sg = small.getContext('2d');
const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;
const seconds = SPEC.seconds ?? (meta.loop ? meta.duration * 2 : meta.duration + 0.5);

window.FILM_INFO = { W, H, FPS: SPEC.fps, frames: Math.round(seconds * SPEC.fps) };
window.renderFrameAt = async (t) => {
  const steps = Math.round(Math.max(0, t) * fps);
  const inst = createFx(mod, { x: OX, y: OY, ...(SPEC.seed !== undefined ? { seed: SPEC.seed } : {}), ...(SPEC.options ?? {}) });
  for (let i = 0; i < steps; i++) inst.update(1 / fps);
  const actor = meta.actor && SPEC.actor !== false ? inst.options.actor ?? stockActor() : null;
  clearFrame(shown);
  inst.draw(shown, 'back');
  if (actor) drawActor(painterFor(shown).place(OX, OY, !!SPEC.options?.flip), actor,
    actorAlphaOf(mod, meta.loop ? inst.t % meta.duration : Math.min(inst.t, meta.duration), inst.options));
  inst.draw(shown, 'front');
  composite(shown, rgba, bg);
  sg.putImageData(img, 0, 0);
  g.clearRect(0, 0, W, H);
  g.drawImage(small, 0, 0, w * k, h * k);
};
window.__ready = true;
