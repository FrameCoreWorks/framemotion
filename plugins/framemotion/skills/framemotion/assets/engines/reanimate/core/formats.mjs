// Reel formats for the Reanimate engine (FrameMotion's addition; Reanimate itself draws 16 x 9 only).
// Each format is a frame size in pixels and the canvas in units with the same proportions, the short
// side 9 units as on Reanimate's screen, so a drawing keeps its unit sizes and strokes on every format.
import {mapA} from './animation.mjs';
import {scale, SCREEN_WIDTH, SCREEN_HEIGHT} from './svg.mjs';

export const REEL_FORMATS = Object.freeze({
  '16:9': Object.freeze({width: 1920, height: 1080, screen: Object.freeze([16, 9])}),
  '9:16': Object.freeze({width: 1080, height: 1920, screen: Object.freeze([9, 16])}),
  '1:1': Object.freeze({width: 1080, height: 1080, screen: Object.freeze([9, 9])}),
  '4:5': Object.freeze({width: 1080, height: 1350, screen: Object.freeze([9, 11.25])}),
});

/**
 * fitScreenA(ani, screen, mode): a drawing made for Reanimate's 16 x 9 screen, scaled about the centre
 * to another canvas: 'contain' shows all of the 16 x 9 picture (empty bands on a reel), 'cover' fills
 * the canvas and crops the sides, 'none' leaves it at its size (a reel then shows the middle 9 units).
 */
export function fitScreenA(ani, screen, mode = 'contain') {
  const kx = screen[0] / SCREEN_WIDTH, ky = screen[1] / SCREEN_HEIGHT;
  const k = mode === 'contain' ? Math.min(kx, ky) : mode === 'cover' ? Math.max(kx, ky) : mode === 'none' ? 1 : NaN;
  if (Number.isNaN(k)) throw new Error(`fitScreenA: mode must be 'contain', 'cover' or 'none', not ${JSON.stringify(mode)}`);
  return k === 1 ? ani : mapA((svg) => scale(k, svg), ani);
}
