// FrameMotion's own example of a new film written against the bundled anidoodle kits (ours, MIT like
// FrameMotion). Render it with the anidoodle builder: build.folder = this examples folder, build.film =
// "ownExample". It reuses the scrapbook kit's step runner: every step draws from its own progress p
// (0 to 1), so a frame is a function of its number and the film can be rendered in any order.
import type { Film } from "./film";
import { staged, ease } from "./scrapbookKit";

const N = 150;
const steps = [
  { id: "paper", start: -1, end: 0, draw: (c: CanvasRenderingContext2D, env: { W: number; H: number; scale: number }) => {
    c.setTransform(env.scale, 0, 0, env.scale, 0, 0); c.fillStyle = "#f3ead8"; c.fillRect(0, 0, env.W, env.H);
  } },
  { id: "circle", start: 10, end: 70, draw: (c: CanvasRenderingContext2D, env: { W: number; H: number; scale: number }, p: number) => {
    c.setTransform(env.scale, 0, 0, env.scale, 0, 0); c.lineWidth = 14; c.lineCap = "round"; c.strokeStyle = "#c2412d";
    c.beginPath(); c.arc(env.W / 2, env.H / 2, env.W * 0.28, -Math.PI / 2, -Math.PI / 2 + ease(p) * Math.PI * 2); c.stroke();
  } },
  { id: "dot", start: 70, end: 110, draw: (c: CanvasRenderingContext2D, env: { W: number; H: number; scale: number }, p: number) => {
    c.setTransform(env.scale, 0, 0, env.scale, 0, 0); c.fillStyle = "#1f3a5f";
    c.beginPath(); c.arc(env.W / 2, env.H / 2, env.W * 0.12 * ease(p), 0, Math.PI * 2); c.fill();
  } },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const draw = staged("ownExample", steps as any);
export const ownExample: Film = {
  meta: { title: "FrameMotion example · a circle drawn on paper", W: 1080, H: 1080, fps: 30, bpm: 120, durationFrames: N, kind: "drawing" },
  assets: { images: {} },
  shots: [{ id: "ownExample", start: 0, end: N, draw }],
};
