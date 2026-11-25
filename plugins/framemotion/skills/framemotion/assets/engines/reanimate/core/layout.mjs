// Placement helpers that measure a tree first (Reanimate.Svg.Constructors: center, aroundCenter,
// scaleToSize and friends). FrameCore Works' JavaScript port of reanimate/reanimate (public domain).

import {translate, scaleXY, scale, rotateAround} from './svg.mjs';
import {boundingBox} from './paths.mjs';

export function rotateAroundCenter(a, t) {
  const [x, y, w, h] = boundingBox(t);
  return rotateAround(a, [x + w / 2, y + h / 2], t);
}

export function aroundCenter(fn, t) {
  const [x, y, w, h] = boundingBox(t);
  const ox = -x - w / 2, oy = -y - h / 2;
  return translate(-ox, -oy, fn(translate(ox, oy, t)));
}
export function aroundCenterX(fn, t) {
  const [x, , w] = boundingBox(t);
  const ox = -x - w / 2;
  return translate(-ox, 0, fn(translate(ox, 0, t)));
}
export function aroundCenterY(fn, t) {
  const [, y, , h] = boundingBox(t);
  const oy = -y - h / 2;
  return translate(0, -oy, fn(translate(0, oy, t)));
}

export function scaleToSize(w, h, t) { const [, , w0, h0] = boundingBox(t); return scaleXY(w / w0, h / h0, t); }
export function scaleToWidth(w, t) { const [, , w0] = boundingBox(t); return scale(w / w0, t); }
export function scaleToHeight(h, t) { const [, , , h0] = boundingBox(t); return scale(h / h0, t); }

export function centerUsing(a, t) { const [x, y, w, h] = boundingBox(a); return translate(-x - w / 2, -y - h / 2, t); }
export const center = (t) => centerUsing(t, t);
export function centerX(t) { const [x, , w] = boundingBox(t); return translate(-x - w / 2, 0, t); }
export function centerY(t) { const [, y, , h] = boundingBox(t); return translate(0, -y - h / 2, t); }
