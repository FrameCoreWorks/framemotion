// Adapters that turn an engine's own frame API into the FrameMotion engine contract.
// Original FrameCore Works code (Apache-2.0). Runs in the browser and in Node.
import {defineEngine} from './engine-kit.mjs';

/**
 * A page that exposes renderFrame(seconds) (the bundled Animate and Anatomy engines do) becomes
 * a contract engine. renderFrame must draw synchronously and depend on its argument only.
 */
export function fromRenderFrame({id, renderFrame, width, height, fps, duration}) {
  if (typeof renderFrame !== 'function') throw new TypeError('renderFrame(seconds) is required.');
  return defineEngine({id, width, height, fps, duration, seek: (t) => { renderFrame(t); }});
}
