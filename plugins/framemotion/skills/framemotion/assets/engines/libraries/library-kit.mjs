// Small helpers shared by the library engines in this folder (ours, MIT like FrameMotion).
import {createRng} from '../kit/engine-kit.mjs';

/** Settings from ?params, as every engine page reads them. */
export const readParams = () => JSON.parse(new URLSearchParams(location.search).get('params') || '{}');

/**
 * Run fn with Math.random replaced by a seeded generator, for library code that draws its own
 * random numbers. The same seed gives the same numbers; Math.random is restored even on error.
 * Only synchronous code inside fn sees the seeded generator.
 */
export function withSeededRandom(seed, fn) {
  const rng = createRng(seed >>> 0);
  const original = Math.random;
  Math.random = rng.next;
  try { return fn(); } finally { Math.random = original; }
}

/** Wait for n animation frames (layout, fonts and observers settle). */
export const frames = (n = 1) => new Promise((resolve) => {
  const step = () => (--n <= 0 ? resolve() : requestAnimationFrame(step));
  requestAnimationFrame(step);
});
