// Reanimate.ColorSpace: colour-matching tables by wavelength and nmToColor, FrameCore Works'
// JavaScript port from reanimate/reanimate (public domain). The tables (core/colorspace-data.mjs) keep
// wavelengths up to 700 nm, as Reanimate does when it loads them.
import {CIE_XYZ, CIE_xyz, CONE_LMS} from './colorspace-data.mjs';
import {cieXYZ} from './color.mjs';

const table = (text) => {
  const m = new Map();
  for (const line of text.trim().split('\n')) {
    const [nm, a, b, c] = line.split(',');
    m.set(Number(nm), [Number(a), Number(b), c === '' ? 0 : Number(c)]);
  }
  return m;
};
let big = null, light = null, cones = null;
/** bigXYZCoordinates: (big) XYZ values for each wavelength in nm. */
export const bigXYZCoordinates = () => (big ??= table(CIE_XYZ));
/** lightXYZCoordinates: (small) xyz chromaticity for each wavelength in nm. */
export const lightXYZCoordinates = () => (light ??= table(CIE_xyz));
/** coneSensitivity: long, medium and short cone sensitivity for each wavelength in nm. */
export const coneSensitivity = () => (cones ??= table(CONE_LMS));
/** nmToColor: the colour of light of one wavelength (390 to 700 nm), or null outside the table. */
export function nmToColor(nm) {
  const xyz = bigXYZCoordinates().get(nm);
  return xyz ? cieXYZ(...xyz) : null;
}
