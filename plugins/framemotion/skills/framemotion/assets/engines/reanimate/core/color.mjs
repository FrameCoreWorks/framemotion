// Colour in the Reanimate engine: colour spaces, colour components, colour maps and raster images.
// FrameCore Works' JavaScript port of Reanimate.ColorComponents, Reanimate.ColorMap and the image
// parts of Reanimate.Raster and Reanimate.Builtin.Documentation (reanimate/reanimate, public domain),
// with the colour arithmetic they rely on ported from the Haskell package colour 2.3.6
// (Russell O'Connor, MIT): sRGB transfer, CIE XYZ, CIE L*a*b* and HSV. The turbo and cividis
// polynomials and the sinebow formula come, through Reanimate.ColorMap, from d3-scale-chromatic 3.1.0
// (Mike Bostock, ISC); turbo is Anton Mikhailov's scheme (Google LLC, Apache-2.0). No DOM, clock or network.
//
// A colour is linear sRGB [r, g, b] (Data.Colour stores the same). Matrices are the exact rational
// results of colour's rgb2xyz for sRGB primaries and D65, rounded once to doubles, as fromRational does.

import {VIRIDIS, MAGMA, INFERNO, PLASMA} from './colormap-data.mjs';
import {mkImage, flipYAxis, SCREEN_WIDTH, SCREEN_HEIGHT} from './svg.mjs';
import {center, scaleToSize} from './layout.mjs';

/** Haskell's `round`: halves go to the even neighbour. */
export function haskellRound(x) {
  const f = Math.floor(x), d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}
/**
 * Haskell's `round` to a machine integer: GHC turns NaN into minBound, which is 0 as a Word8 and 0
 * after clamping to 0..255, so a NaN component (an lch hue of grey) quantizes to 0 as in Reanimate.
 */
const roundW = (x) => (Number.isNaN(x) ? 0 : haskellRound(x));
/** fromIntegral to Word8: the integer taken modulo 256. */
const word8 = (n) => ((n % 256) + 256) % 256;
/** Data.Fixed.mod' */
const modF = (n, d) => n - Math.floor(n / d) * d;
/** Haskell's `sum` over three numbers: a left fold from 0. */
const sum3 = (a, b, c) => ((0 + a) + b) + c;
const mult = (m, [x, y, z]) => m.map((row) => sum3(x * row[0], y * row[1], z * row[2]));

const RGB_TO_XYZ = [
  [0.4123865632529917, 0.35759149092062537, 0.18045049120356368],
  [0.21263682167732384, 0.7151829818412507, 0.07218019648142547],
  [0.019330620152483987, 0.11919716364020845, 0.9503725870054354],
];
const XYZ_TO_RGB = [
  [3.2410032329763587, -1.5373989694887855, -0.4986158819963629],
  [-0.9692242522025166, 1.875929983695176, 0.041554226340084724],
  [0.055639419851975444, -0.20401120612390997, 1.0571489771875335],
];
/** The D65 white point as Data.Colour.CIE.Illuminant.d65 (chromaticity x, y). */
export const D65 = [0.31271, 0.32902];

// --- Data.Colour.SRGB
const transferFunction = (lin) => (lin === 1 ? 1 : lin <= 0.0031308 ? 12.92 * lin : (1 + 0.055) * lin ** (1 / 2.4) - 0.055);
const invTransferFunction = (v) => (v === 1 ? 1 : v <= 0.04045 ? v / 12.92 : ((v + 0.055) / (1 + 0.055)) ** 2.4);
/** sRGB: a colour from gamma-encoded components in [0, 1]. */
export const sRGB = (r, g, b) => [invTransferFunction(r), invTransferFunction(g), invTransferFunction(b)];
/** toSRGB: gamma-encoded components. */
export const toSRGB = (c) => c.map(transferFunction);
/** quantize: clamp, then Haskell round. */
const quantize = (x) => (x <= 0 ? 0 : 255 <= x ? 255 : roundW(x));
/** toSRGBBounded (Word8): [r, g, b] in 0..255. */
export const toSRGB24 = (c) => toSRGB(c).map((v) => quantize(255 * v));
/** sRGB24: a colour from 0..255 components. */
export const sRGB24 = (r, g, b) => sRGB(r / 255, g / 255, b / 255);

// --- Data.Colour.CIE
export const cieXYZ = (x, y, z) => mult(XYZ_TO_RGB, [x, y, z]);
export const cieXYZView = (c) => mult(RGB_TO_XYZ, c);
const chromaColour = ([cx, cy], y) => { const s = y / cy; return cieXYZ(s * cx, y, s * (1 - cx - cy)); };
const cube = (x) => (x * x) * x;   // GHC's x ^ 3
const LAB_EPS = cube(6 / 29);
export function lightness(white, c) {
  const y = cieXYZView(c)[1] / cieXYZView(chromaColour(white, 1.0))[1];
  return LAB_EPS < y ? 116 * y ** (1 / 3) - 16 : cube(29 / 3) * y;
}
export function cieLABView(white, c) {
  const [x, y, z] = cieXYZView(c);
  const [xn, yn, zn] = cieXYZView(chromaColour(white, 1.0));
  const f = (v) => (LAB_EPS < v ? v ** (1 / 3) : (841 / 108) * v + 4 / 29);
  const fx = f(x / xn), fy = f(y / yn), fz = f(z / zn);
  return [lightness(white, c), 500 * (fx - fy), 200 * (fy - fz)];
}
export function cieLAB(white, l, a, b) {
  const [xn, yn, zn] = cieXYZView(chromaColour(white, 1.0));
  const fy = (l + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const delta = 6 / 29;
  const transform = (fa) => (fa > delta ? cube(fa) : (fa - 16 / 116) * 3 * (delta * delta));
  return cieXYZ(xn * transform(fx), yn * transform(fy), zn * transform(fz));
}

// --- Data.Colour.RGB and Data.Colour.RGBSpace.HSV (on gamma-encoded [r, g, b])
function hslsv([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx === mn) return [0, 0, mx, 0, mx];
  const l = (mx + mn) / 2;
  const s = l <= 0.5 ? (mx - mn) / (mx + mn) : (mx - mn) / (2 - (mx + mn));
  const s0 = (mx - mn) / mx;
  const list = [r, g, b, r, g];
  const o = [r, g, b].indexOf(mx);
  const [, y, z] = list.slice(o, o + 3);
  const h0 = (60 * (y - z)) / (mx - mn) + 120 * o;
  return [h0 < 0 ? h0 + 360 : h0, s, l, s0, mx];
}
export const hsvView = (rgb) => { const [h, , , s, v] = hslsv(rgb); return [h, s, v]; };
const mod1 = (x) => { const pf = x - Math.trunc(x); return pf < 0 ? pf + 1 : pf; };
/** hsv: gamma-encoded [r, g, b] from hue in degrees, saturation and value. */
export function hsv(h, s, v) {
  const hi = ((Math.floor(h / 60) % 6) + 6) % 6;
  const f = mod1(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
}

// --- Reanimate.ColorComponents: [unpack(colour) -> [a, b, c], pack(a, b, c) -> colour]
export const rgbComponents = {unpack: (c) => toSRGB(c), pack: sRGB};
export const hsvComponents = {unpack: (c) => hsvView(toSRGB(c)), pack: (a, b, c) => sRGB(...hsv(a, b, c))};
export const labComponents = {unpack: (c) => cieLABView(D65, c), pack: (l, a, b) => cieLAB(D65, l, a, b)};
export const xyzComponents = {unpack: cieXYZView, pack: cieXYZ};
const toRad = (deg) => (deg / 180) * Math.PI;
const toDeg = (rad) => (rad / Math.PI) * 180;
export const lchComponents = {
  unpack(color) {
    const [l, a, b] = cieLABView(D65, color);
    const c = Math.sqrt(a * a + b * b);
    const h = modF(toDeg(Math.atan2(b, a)) + 360, 360);
    return [l, c, haskellRound(c * 10000) === 0 ? NaN : h];
  },
  pack: (l, c, h) => cieLAB(D65, l, Math.cos(toRad(h)) * c, Math.sin(toRad(h)) * c),
};
/** interpolate: blend two colours through a component space, d from 0 to 1. */
export function interpolate(comps, from, to) {
  const [a1, b1, c1] = comps.unpack(from), [a2, b2, c2] = comps.unpack(to);
  return (d) => comps.pack(a1 + (a2 - a1) * d, b1 + (b2 - b1) * d, c1 + (c2 - c1) * d);
}
/** interpolateRGB8: the same on [r, g, b] pixels in 0..255. */
export const interpolateRGB8 = (comps, from, to) => {
  const f = interpolate(comps, sRGB24(...from), sRGB24(...to));
  return (d) => toSRGB24(f(d));
};
/** interpolateRGBA8: RGB through the components, alpha by fromToS and round. */
export const interpolateRGBA8 = (comps, from, to) => {
  const f = interpolateRGB8(comps, from.slice(0, 3), to.slice(0, 3));
  return (t) => [...f(t), roundW(from[3] + (to[3] - from[3]) * t)];
};

// --- Reanimate.ColorMap: t in [0, 1] -> [r, g, b] in 0..255
const hexTable = (s) => Array.from({length: s.length / 6}, (_, i) => [0, 2, 4].map((k) => parseInt(s.slice(6 * i + k, 6 * i + k + 2), 16)));
const ramp = (table) => (t) => table[Math.max(0, Math.min(table.length - 1, roundW(t * (table.length - 1))))];
const clampTrunc = (n) => Math.min(255, Math.max(0, n));
export const viridis = ramp(hexTable(VIRIDIS));
export const magma = ramp(hexTable(MAGMA));
export const inferno = ramp(hexTable(INFERNO));
export const plasma = ramp(hexTable(PLASMA));
export const turbo = (t) => [
  clampTrunc(roundW(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))))),
  clampTrunc(roundW(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))))),
  clampTrunc(roundW(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))),
];
export function sinebow(t) {
  const x = (0.5 - t) * Math.PI;
  const piThird = Math.PI / 3, twoPiThirds = (Math.PI * 2) / 3;
  return [x, x + piThird, x + twoPiThirds].map((v) => word8(roundW(255 * Math.sin(v) ** 2)));
}
export const cividis = (t) => [
  clampTrunc(roundW(-4.54 - t * (35.34 - t * (2381.73 - t * (6402.7 - t * (7024.72 - t * 2710.57)))))),
  clampTrunc(roundW(32.49 + t * (170.73 + t * (52.82 - t * (131.46 - t * (176.58 - t * 67.37)))))),
  clampTrunc(roundW(81.24 + t * (442.36 - t * (2482.43 - t * (6167.24 - t * (6614.94 - t * 2475.67)))))),
];
export function jet(t) {
  const trunc = (v) => word8(roundW(Math.min(255, Math.max(0, v * 255))));
  return [trunc(Math.min(4 * t - 1.5, -4 * t + 4.5)), trunc(Math.min(4 * t - 0.5, -4 * t + 3.5)), trunc(Math.min(4 * t + 0.5, -4 * t + 2.5))];
}
const hsvMap = (deg) => (t) => hsv(t * deg, 1, 1).map((v) => word8(roundW(v * 255)));
export const hsvColorMap = hsvMap(360);
export const hsvMatlab = hsvMap(330);
export const greyscale = (t) => { const v = word8(roundW(t * 255)); return [v, v, v]; };

// --- Raster images: a PNG (8-bit RGB) as a data URI, the way Reanimate.Raster.embedImage embeds one.
// Reanimate's PNGs come from JuicyPixels and zlib; this encoder writes the same image with stored
// (uncompressed) deflate blocks, so the pixels match while the compressed bytes may differ.

const CRC_TABLE = Array.from({length: 256}, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function adler32(bytes) {
  let a = 1, b = 0;
  for (const x of bytes) { a = (a + x) % 65521; b = (b + a) % 65521; }
  return ((b << 16) | a) >>> 0;
}
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
function chunk(type, data) {
  const head = [...type].map((ch) => ch.charCodeAt(0));
  return [...u32(data.length), ...head, ...data, ...u32(crc32([...head, ...data]))];
}
function zlibStored(raw) {
  const out = [0x78, 0x01];
  for (let i = 0; i < raw.length || i === 0; i += 65535) {
    const block = raw.slice(i, i + 65535);
    const last = i + 65535 >= raw.length ? 1 : 0;
    out.push(last, block.length & 255, block.length >>> 8, ~block.length & 255, (~block.length >>> 8) & 255, ...block);
    if (raw.length === 0) break;
  }
  return [...out, ...u32(adler32(raw))];
}
/** encodePng: an 8-bit RGB PNG (or RGBA with channels = 4) from a pixel function (x, y) -> bytes. */
export function encodePng(width, height, pixel, channels = 3) {
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      const px = pixel(x, y);
      if (px.length !== channels || !px.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) {
        throw new Error(`encodePng: pixel (${x}, ${y}) is [${px}], not ${channels === 4 ? 'four' : 'three'} bytes 0..255`);
      }
      for (const v of px) raw.push(v);
    }
  }
  const ihdr = [...u32(width), ...u32(height), 8, channels === 4 ? 6 : 2, 0, 0, 0];
  return [137, 80, 78, 71, 13, 10, 26, 10, ...chunk('IHDR', ihdr), ...chunk('IDAT', zlibStored(raw)), ...chunk('IEND', [])];
}
const base64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.slice(i, i + 8192));
  return btoa(s);
};
/** embedPng: an image node `w` x `h` units centred on the origin, y flipped as Reanimate does. */
export const embedPng = (w, h, bytes) =>
  flipYAxis(mkImage({x: -w / 2, y: -h / 2, width: w, height: h, href: `data:image/png;base64,${base64(bytes)}`}));
/** embedImage: an RGB image given by its pixel function. */
export const embedImage = (width, height, pixel) => embedPng(width, height, encodePng(width, height, pixel));
/** embedImageRGBA: an RGBA image {width, height, data} (JuicyPixels' Image PixelRGBA8), one unit per pixel. */
export const embedImageRGBA = (img) => embedPng(img.width, img.height,
  encodePng(img.width, img.height, (x, y) => Array.from(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4)), 4));

/** showColorMap (Reanimate.Builtin.Documentation): a colour map as a 256 x 1 image filling the screen. */
export const showColorMap = (f) => center(scaleToSize(SCREEN_WIDTH, SCREEN_HEIGHT, embedImage(256, 1, (x) => f(x / 255))));
