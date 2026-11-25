// Reel formats for the Reanimate engine (FrameMotion's addition; Reanimate itself draws 16 x 9 only).
// Each format is a frame size in pixels and the canvas in units with the same proportions, the short
// side 9 units as on Reanimate's screen, so a drawing keeps its unit sizes and strokes on every format.
import {mapA} from './animation.mjs';
import {mkGroup, mkRect, scale, translate, SCREEN_WIDTH, SCREEN_HEIGHT} from './svg.mjs';

export const REEL_FORMATS = Object.freeze({
  '16:9': Object.freeze({width: 1920, height: 1080, screen: Object.freeze([16, 9])}),
  '9:16': Object.freeze({width: 1080, height: 1920, screen: Object.freeze([9, 16])}),
  '1:1': Object.freeze({width: 1080, height: 1080, screen: Object.freeze([9, 9])}),
  '4:5': Object.freeze({width: 1080, height: 1350, screen: Object.freeze([9, 11.25])}),
});

/**
 * Safe areas, as fractions of the frame height kept clear of the platforms' own interface (FrameMotion's
 * reel rule: in 9:16 the top 10 % and the bottom 20 %). Other formats have none.
 */
export const SAFE_AREAS = Object.freeze({'9:16': Object.freeze({top: 0.10, bottom: 0.20})});
const safeAreaOf = (screen) => {
  for (const [name, area] of Object.entries(SAFE_AREAS)) {
    const [w, h] = REEL_FORMATS[name].screen;
    if (Math.abs(screen[0] / screen[1] - w / h) < 1e-6) return area;
  }
  return {top: 0, bottom: 0};
};

/** The film's own background (Reanimate's mkBackground: a 16 x 9 rectangle at the screen's corner, not transformed). */
function backgroundOf(svg) {
  if (!svg || svg.attrs?.transform?.length) return null;
  if (svg.kind === 'rect') {
    const {x, y, width, height} = svg;
    return width === SCREEN_WIDTH && height === SCREEN_HEIGHT && x === -SCREEN_WIDTH / 2 && y === -SCREEN_HEIGHT / 2 ? svg : null;
  }
  if (svg.kind !== 'group') return null;
  for (const child of svg.children) {
    const found = backgroundOf(child);
    if (found) return found;
  }
  return null;
}

/**
 * fitScreenA(ani, screen, mode): a drawing made for Reanimate's 16 x 9 screen, scaled about the centre
 * to another canvas. 'contain' shows all of the 16 x 9 picture; 'safe' does the same inside the format's
 * safe area (9:16: below the top 10 %, above the bottom 20 %); in both the bands around it take the film's
 * own background colour, frame by frame. 'cover' fills the canvas and crops the sides (a 9:16 reel keeps
 * only the middle 32 % of the width, so text near the edges is lost). 'none' leaves it at its size (a reel
 * then shows the middle 9 units).
 */
export function fitScreenA(ani, screen, mode = 'contain') {
  const kx = screen[0] / SCREEN_WIDTH, ky = screen[1] / SCREEN_HEIGHT;
  if (mode === 'none') return ani;
  if (mode === 'cover') { const k = Math.max(kx, ky); return k === 1 ? ani : mapA((svg) => scale(k, svg), ani); }
  if (mode !== 'contain' && mode !== 'safe') {
    throw new Error(`fitScreenA: mode must be 'contain', 'safe', 'cover' or 'none', not ${JSON.stringify(mode)}`);
  }
  const {top, bottom} = mode === 'safe' ? safeAreaOf(screen) : {top: 0, bottom: 0};
  const k = Math.min(kx, ky * (1 - top - bottom)), dy = screen[1] * (bottom - top) / 2;
  if (k === 1 && dy === 0) return ani;
  return mapA((svg) => {
    const bg = backgroundOf(svg);
    const picture = translate(0, dy, scale(k, svg));
    if (!bg) return picture;
    const bands = {...mkRect(screen[0], screen[1]), attrs: bg.attrs};
    return mkGroup([bands, picture]);
  }, ani);
}
