// Reanimate.Builtin.Images' smallEarth for the Reanimate engine (FrameCore Works' port; reanimate/reanimate,
// public domain): the 300 x 150 equirectangular Earth that the map-projection examples redraw.
import {SMALL_EARTH_WIDTH, SMALL_EARTH_HEIGHT, SMALL_EARTH_RGB_BASE64} from './earth-data.mjs';
import {imageFromRGB} from './geoprojection.mjs';

let earth = null;
/** smallEarth(): the image as {width, height, data} RGBA (opaque); decoded once, a fresh copy each call. */
export function smallEarth() {
  if (!earth) {
    const bin = atob(SMALL_EARTH_RGB_BASE64);
    const rgb = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    earth = imageFromRGB(SMALL_EARTH_WIDTH, SMALL_EARTH_HEIGHT, rgb);
  }
  return {width: earth.width, height: earth.height, data: earth.data.slice()};
}
