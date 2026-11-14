// Photoreal three.js engine: sub-frame lens and shutter samples (pure math, no three.js).
// Adapted from Leonxlnx/room-at-dawn (MIT, Copyright (c) 2026 Leon Lin, commit aab8be2), rewritten on the
// FrameMotion engine kit; changes are FrameCore Works (Apache-2.0),
// see integrations/room-at-dawn/.
import {halton, subframeTimes} from '../kit/engine-kit.mjs';

/**
 * One output frame as n sub-frames. Each has a time inside the open shutter (stratified),
 * a pixel jitter in [-0.5, 0.5) for anti-aliasing (Halton 2, 3) and a point on a round
 * aperture of radius `aperture` metres (Halton 5, 7) for thin-lens depth of field.
 */
export function subframePlan(frame, {fps, samples = 16, shutter = 0.5, aperture = 0, duration = Infinity}) {
  if (!Number.isInteger(frame) || frame < 0) throw new RangeError('frame must be an integer >= 0.');
  if (!(fps > 0)) throw new RangeError('fps must be > 0.');
  if (!Number.isInteger(samples) || samples < 1) throw new RangeError('samples must be an integer >= 1.');
  if (!(shutter >= 0 && shutter <= 1)) throw new RangeError('shutter must be in [0, 1].');
  if (!(aperture >= 0)) throw new RangeError('aperture must be >= 0.');
  const times = subframeTimes(frame, {fps, samples, shutter, duration});
  return Array.from({length: samples}, (_, i) => {
    const k = i + 1;
    const t = times[Math.min(i, times.length - 1)];
    const jx = samples > 1 ? halton(k, 2) - 0.5 : 0;
    const jy = samples > 1 ? halton(k, 3) - 0.5 : 0;
    let lx = 0, ly = 0;
    if (aperture > 0 && samples > 1) {
      const angle = halton(k, 5) * 2 * Math.PI;
      const radius = Math.sqrt(halton(k, 7)) * aperture;
      lx = Math.cos(angle) * radius;
      ly = Math.sin(angle) * radius;
    }
    return {t, jx, jy, lx, ly};
  });
}

/**
 * Shear a column-major 4x4 perspective projection in place: shift the image by the pixel
 * jitter and keep the focus plane still while the camera moves (lx, ly) across the aperture.
 */
export function shearProjection(m, {jx, jy, lx, ly, focus, width, height}) {
  if (!(focus > 0)) throw new RangeError('focus must be > 0 metres.');
  m[8] += (2 * jx) / width - (m[0] * lx) / focus;
  m[9] += (2 * jy) / height - (m[5] * ly) / focus;
  return m;
}
