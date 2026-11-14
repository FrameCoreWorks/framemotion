// FrameMotion engine kit: the one contract every bundled or own engine follows.
// Original FrameCore Works code (Apache-2.0). No DOM, clock, network or process access.
//
// An engine is a pure function of time: seek(t) draws the state at t seconds and
// returns nothing it needs later. The same t always gives the same picture, so a
// renderer may seek frames in any order and average sub-frames for motion blur.

const ID = /^[a-z0-9][a-z0-9-]*$/;

/** Seeded pseudo-random numbers (mulberry32). Never use Math.random in an engine. */
export function createRng(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('seed must be an integer in [0, 2^32).');
  }
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: (list) => list[Math.floor(next() * list.length)],
  };
}

/** Radical inverse in a prime base: low-discrepancy sub-frame and lens samples. */
export function halton(index, base) {
  if (!Number.isInteger(index) || index < 1) throw new RangeError('index must be an integer >= 1.');
  if (!Number.isInteger(base) || base < 2) throw new RangeError('base must be an integer >= 2.');
  let f = 1;
  let r = 0;
  for (let i = index; i > 0; i = Math.floor(i / base)) {
    f /= base;
    r += f * (i % base);
  }
  return r;
}

/**
 * Times (seconds) to sample for one output frame. shutter is the open fraction of
 * the frame (0.5 = 180 degrees); samples are centred on the frame and clamped to [0, duration].
 */
export function subframeTimes(frame, {fps, samples = 1, shutter = 0.5, duration = Infinity}) {
  if (!Number.isInteger(frame) || frame < 0) throw new RangeError('frame must be an integer >= 0.');
  if (!(fps > 0)) throw new RangeError('fps must be > 0.');
  if (!Number.isInteger(samples) || samples < 1) throw new RangeError('samples must be an integer >= 1.');
  if (!(shutter >= 0 && shutter <= 1)) throw new RangeError('shutter must be in [0, 1].');
  const t0 = frame / fps;
  if (samples === 1 || shutter === 0) return [Math.min(t0, duration)];
  const open = shutter / fps;
  return Array.from({length: samples}, (_, i) => {
    const t = t0 + (halton(i + 1, 2) - 0.5) * open;
    return Math.min(Math.max(t, 0), duration);
  });
}

/** Validate an engine definition and add frame helpers. */
export function defineEngine(def) {
  const {id, width, height, fps, duration, seek} = def ?? {};
  if (typeof id !== 'string' || !ID.test(id)) throw new TypeError('id must be lowercase kebab-case.');
  for (const [key, value] of Object.entries({width, height})) {
    if (!Number.isInteger(value) || value < 16) throw new RangeError(`${key} must be an integer >= 16.`);
  }
  if (!(fps > 0 && fps <= 240)) throw new RangeError('fps must be in (0, 240].');
  if (!(duration > 0)) throw new RangeError('duration must be > 0 seconds.');
  if (typeof seek !== 'function') throw new TypeError('seek(t) must be a function.');
  const totalFrames = Math.round(duration * fps);
  return Object.freeze({
    ...def,
    totalFrames,
    timeAt: (frame) => {
      if (!Number.isInteger(frame) || frame < 0 || frame >= totalFrames) {
        throw new RangeError('frame must be an integer in [0, totalFrames).');
      }
      return frame / fps;
    },
    seekFrame(frame) {
      return seek(this.timeAt(frame));
    },
  });
}

/**
 * Drive an engine from one paused GSAP timeline, the way HyperFrames seeks a
 * composition. Pass the page's gsap; register the returned timeline as the
 * composition timeline. Seeking the timeline calls engine.seek(time).
 */
export function bindToGsap(engine, gsap) {
  if (!gsap || typeof gsap.timeline !== 'function') throw new TypeError('gsap with timeline() is required.');
  const clock = {t: 0};
  const timeline = gsap.timeline({paused: true});
  timeline.to(clock, {
    t: engine.duration,
    duration: engine.duration,
    ease: 'none',
    onUpdate: () => engine.seek(clock.t),
  }, 0);
  return timeline;
}
