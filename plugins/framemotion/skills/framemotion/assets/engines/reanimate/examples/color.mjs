// Reanimate's documentation examples for colour maps and colour components, ported from the
// doc_*.hs files of reanimate/reanimate (public domain, commit 583ee9f). Each entry returns an Animation.
// doc_parula is left out with the parula map (see core/colormap-data.mjs).

import * as R from '../core/index.mjs';

const still = (svg) => () => R.docEnv(R.animate(() => svg));
const map = (f) => still(R.showColorMap(f));
const YELLOW = [0xff, 0xff, 0x00];
const BLUE = [0x00, 0x00, 0xff];
const between = (comps) => map(R.interpolateRGB8(comps, YELLOW, BLUE));

export const COLOR_EXAMPLES = {
  // Colour maps (Reanimate.ColorMap)
  cividis: map(R.cividis),
  greyscale: map(R.greyscale),
  hsv: map(R.hsvColorMap),
  hsvMatlab: map(R.hsvMatlab),
  inferno: map(R.inferno),
  jet: map(R.jet),
  magma: map(R.magma),
  plasma: map(R.plasma),
  sinebow: map(R.sinebow),
  turbo: map(R.turbo),
  viridis: map(R.viridis),

  // Colour components (Reanimate.ColorComponents): yellow to blue through each space
  hsvComponents: between(R.hsvComponents),
  labComponents: between(R.labComponents),
  lchComponents: between(R.lchComponents),
  rgbComponents: between(R.rgbComponents),
  xyzComponents: between(R.xyzComponents),
};
