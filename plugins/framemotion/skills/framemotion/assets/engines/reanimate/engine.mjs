// The Reanimate engine on FrameMotion's clock: an Animation (or a scene script) becomes an engine
// whose seek(t) draws the frame at t seconds as SVG in a page element. FrameCore Works code.
import {defineEngine} from '../kit/engine-kit.mjs';
import {frameAt, renderSvg} from './core/index.mjs';

/**
 * createReanimateEngine(animation, {id, width, height, fps, screen, mount}): `mount` is the element the
 * frame's SVG is written into; `screen` is the canvas in units ([16, 9] by default, [9, 16] for a reel).
 * seek(t) clamps t to the animation, like Reanimate's frameAt.
 */
export function createReanimateEngine(animation, {id = 'reanimate', width = 1920, height = 1080, fps = 30, screen, mount}) {
  let last = null;
  const draw = (t) => {
    const svg = renderSvg(frameAt(t, animation), {width, height, screen});
    if (svg !== last) { mount.innerHTML = svg; last = svg; }
  };
  return defineEngine({id, width, height, fps, duration: animation.duration, seek: draw});
}

/** The SVG text of the frame at `t` seconds (for tests and for comparing with Reanimate's own output). */
export const frameSvg = (animation, t, size = {}) => renderSvg(frameAt(t, animation), size);
