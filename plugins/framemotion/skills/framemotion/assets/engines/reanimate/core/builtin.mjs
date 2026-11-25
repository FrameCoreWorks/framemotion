// The animations Reanimate's own documentation is drawn with (Reanimate.Builtin.Documentation).
// FrameCore Works' JavaScript port of reanimate/reanimate (public domain).

import {mkAnimation, mapA} from './animation.mjs';
import {mkGroup, mkBackground, withFillOpacity, withStrokeWidth, withStrokeColor, mkRect, mkCircle, mkLine, translate, SCREEN_WIDTH, SCREEN_HEIGHT} from './svg.mjs';
import {partialSvg, pathify} from './paths.mjs';

/** rtfdBackgroundColor: the light grey of Reanimate's documentation pages, PixelRGBA8 252 252 252 255. */
export const RTFD_BACKGROUND = Object.freeze([252, 252, 252, 255]);

/** docEnv: white background, black 0.1 strokes and no fill, as every documentation example is drawn. */
export const docEnv = (ani) => mapA((svg) => mkGroup([
  mkBackground('white'),
  withFillOpacity(0, withStrokeWidth(0.1, withStrokeColor('black', mkGroup([svg])))),
]), ani);

export const drawBox = mkAnimation(2, (t) => partialSvg(t, pathify(mkRect(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2))));
export const drawCircle = mkAnimation(2, (t) => partialSvg(t, pathify(mkCircle(SCREEN_HEIGHT / 3))));
export const drawProgress = mkAnimation(2, (t) => {
  const widthP = 0.8;
  return mkGroup([
    mkLine([(-SCREEN_WIDTH / 2) * widthP, 0], [(SCREEN_WIDTH / 2) * widthP, 0]),
    translate((-SCREEN_WIDTH / 2) * widthP + SCREEN_WIDTH * widthP * t, 0, withFillOpacity(1, mkCircle(0.5))),
  ]);
});
