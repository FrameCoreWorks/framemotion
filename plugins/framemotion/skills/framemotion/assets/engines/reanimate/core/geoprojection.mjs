// Map projections in the Reanimate engine: the sphere drawn on a plane, as raster images and as paths.
// FrameCore Works' JavaScript port of Reanimate.GeoProjection (reanimate/reanimate, public domain,
// written by David Himmelstrup): the same forward and inverse formulas, the same pixel loops and the
// same rounding, so a projected image has the pixels Reanimate computes from the same source pixels.
//
// A projection maps longitude/latitude in radians (lon -pi..pi, lat -pi/2..pi/2) to x/y in 0..1 and
// back. An image is {width, height, data} with RGBA bytes, row by row from the top (JuicyPixels'
// Image PixelRGBA8). No DOM, clock or network.

import {haskellRound} from './color.mjs';
import {mapSvgLines} from './paths.mjs';
import {mkGroup, mkLinePath, None} from './svg.mjs';

const halfPi = Math.PI / 2, sqrtPi = Math.sqrt(Math.PI), sqrt2 = Math.SQRT2, epsilon = 1.0e-12, tau = Math.PI * 2;
const toRads = (dec) => dec / 180 * Math.PI;
const cot = (x) => 1 / Math.tan(x);
const fromToS = (from, to, t) => from + (to - from) * t;
const signum = (x) => (x > 0 ? 1 : x < 0 ? -1 : x);
/** Haskell's `round` to Int: GHC gives minBound for NaN, which no bounds check lets through. */
const roundI = (x) => (Number.isNaN(x) ? -(2 ** 63) : haskellRound(x));

/** A projection: a name, forward(lon, lat) -> [x, y] and inverse(x, y) -> [lon, lat]. */
export class Projection {
  constructor(label, forward, inverse) { this.label = label; this.forward = forward; this.inverse = inverse; }
}
/** LonLat and XYCoord as plain pairs; lonLat(degrees, degrees) is a convenience for the examples. */
export const lonLatDegrees = (lon, lat) => [toRads(lon), toRads(lat)];

/** An image: width x height RGBA pixels. */
export const newImage = (width, height) => ({width, height, data: new Uint8ClampedArray(width * height * 4)});
export const imageFromRGB = (width, height, rgb) => {
  const img = newImage(width, height);
  for (let i = 0, j = 0; i < width * height; i++, j += 3) img.data.set([rgb[j], rgb[j + 1], rgb[j + 2], 255], i * 4);
  return img;
};
export const pixelAt = (img, x, y) => Array.from(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

export const validLonLat = ([lam, phi]) => lam >= -Math.PI && lam <= Math.PI && phi >= -Math.PI / 2 && phi <= Math.PI / 2;

/** srcPixel: the source pixel under a longitude/latitude (nearest, Haskell rounding). */
function srcIndex(src, wMax, hMax, [lam, phi]) {
  const xPx = haskellRound(((lam + Math.PI) / tau) * wMax);
  const yPx = haskellRound((1 - ((phi + halfPi) / Math.PI)) * hMax);
  return (yPx * src.width + xPx) * 4;
}

/** project: an equirectangular (2:1) image redrawn in a projection, pixel by pixel through its inverse. */
export function project(src, p) {
  const {width: w, height: h} = src;
  const out = newImage(w, h);
  for (let yPx = 0; yPx < h; yPx++) {
    for (let xPx = 0; xPx < w; xPx++) {
      const lonlat = p.inverse(xPx / (w - 1), 1 - (yPx / (h - 1)));
      if (!validLonLat(lonlat)) continue;   // PixelRGBA8 0 0 0 0
      const i = srcIndex(src, w - 1, h - 1, lonlat);
      out.data.set(src.data.subarray(i, i + 4), (yPx * w + xPx) * 4);
    }
  }
  return out;
}

// interpP and interpBBP: every source point sampled through p1's and p2's inverse (at twice the
// resolution) is drawn where the blend of its two forward positions falls at t (0 = p1, 1 = p2).
function interpolateImage(src, p1, p2, inside1, inside2, t) {
  const {width: w, height: h} = src;
  const wMax = w - 1, hMax = h - 1, factor = 2;
  const img = newImage(w, h);
  const draw = (lonlat) => {
    if (!validLonLat(lonlat)) return;
    const i = srcIndex(src, wMax, hMax, lonlat);
    if (src.data[i + 3] === 0) return;
    const [x1, y1] = p1.forward(...lonlat), [x2, y2] = p2.forward(...lonlat);
    const x3 = roundI(fromToS(x1, x2, t) * wMax);
    const y3 = roundI((1 - fromToS(y1, y2, t)) * hMax);
    if (x3 >= 0 && x3 < w && y3 >= 0 && y3 < h) img.data.set(src.data.subarray(i, i + 4), (y3 * w + x3) * 4);
  };
  // Haskell's loopTo counts down: x from w*factor-1 to 0, and y inside it the same way.
  const pass = (p, inside) => {
    for (let x = w * factor - 1; x >= 0; x--) {
      for (let y = h * factor - 1; y >= 0; y--) {
        const xs = x / (wMax * factor), ys = y / (hMax * factor);
        if (inside(xs, ys)) draw(p.inverse(xs, ys));
      }
    }
  };
  if (t < 0.5) { pass(p1, inside1); pass(p2, inside2); } else { pass(p2, inside2); pass(p1, inside1); }
  return img;
}

/** interpP: an equirectangular (2:1) image between two projections at t; t = 0 and 1 are plain `project`. */
export function interpP(src, p1, p2, t) {
  if (t === 0) return project(src, p1);
  if (t === 1) return project(src, p2);
  const all = () => true;
  return interpolateImage(src, p1, p2, all, all, t);
}

/** interpBBP: interpP sampling only inside the boxes [x, y, w, h] (0..1) of p1 and p2. */
export function interpBBP(src, p1, p2, [fx, fy, fw, fh], [tx, ty, tw, th], t) {
  return interpolateImage(src, p1, p2,
    (x, y) => x >= fx && x <= fx + fw && y >= fy && y <= fy + fh,
    (x, y) => x >= tx && x <= tx + tw && y >= ty && y <= ty + th, t);
}

const eqDouble = (a, b) => Math.abs(a - b) < epsilon;
/** isValidP: inverse after forward returns every valid point of a 100 x 100 grid. */
export function isValidP(p) {
  for (let xPx = 0; xPx < 100; xPx++) {
    for (let yPx = 0; yPx < 100; yPx++) {
      const lonlat = p.inverse(xPx / 99, yPx / 99);
      if (!validLonLat(lonlat)) continue;
      const back = p.inverse(...p.forward(...lonlat));
      if (!(eqDouble(lonlat[0], back[0]) && eqDouble(lonlat[1], back[1]))) return false;
    }
  }
  return true;
}

/** moveBottomP: the lowest point of the projection moved up by `offset`. */
export const moveBottomP = (offset, p) => new Projection(p.label,
  (lon, lat) => { const [x, y] = p.forward(lon, lat); return [x, fromToS(offset, 1, y)]; },
  (x, y) => p.inverse(x, (y - offset) / (1 - offset)));
/** flipYAxisP: the projection upside down. */
export const flipYAxisP = (p) => new Projection(p.label,
  (lam, phi) => { const [x, y] = p.forward(lam, -phi); return [x, 1 - y]; },
  (x, y) => { const [lam, phi] = p.inverse(x, 1 - y); return [lam, -phi]; });
/** moveTopP: the highest point moved down by `offset`. */
export const moveTopP = (offset, p) => flipYAxisP(moveBottomP(offset, flipYAxisP(p)));
/** scaleP: x and y scaled about the centre. */
export const scaleP = (xScale, yScale, p) => new Projection(p.label,
  (lon, lat) => { const [x, y] = p.forward(lon, lat); return [(x - 0.5) * xScale + 0.5, (y - 0.5) * yScale + 0.5]; },
  (x, y) => p.inverse((x - 0.5) / xScale + 0.5, (y - 0.5) / yScale + 0.5));
/** mergeP: forward and inverse blended at t (may be discontinuous; interpP often looks better). */
export function mergeP(p1, p2, t) {
  const oob = (lon, lat) => lon < -Math.PI || lon > Math.PI || lat < -Math.PI / 2 || lat > Math.PI / 2;
  return new Projection(`${p1.label}/${p2.label}`,
    (lon, lat) => { const [x1, y1] = p1.forward(lon, lat), [x2, y2] = p2.forward(lon, lat); return [fromToS(x1, x2, t), fromToS(y1, y2, t)]; },
    (x, y) => {
      const [lon1, lat1] = p1.inverse(x, y), [lon2, lat2] = p2.inverse(x, y);
      return oob(lon1, lat1) && oob(lon2, lat2) ? [NaN, NaN] : [fromToS(lon1, lon2, t), fromToS(lat1, lat2, t)];
    });
}

// ---------------------------------------------------------------------------------------------
// Projections

export const equirectangularP = new Projection('equirectangular',
  (lam, phi) => [(lam + Math.PI) / tau, (phi + Math.PI / 2) / Math.PI],
  (x, y) => [fromToS(-Math.PI, Math.PI, x), fromToS(-Math.PI / 2, Math.PI / 2, y)]);

export const mercatorP = new Projection('mercator',
  (lam, phi) => [(lam + Math.PI) / tau, Math.min(1, Math.max(0, (Math.log(Math.tan(Math.PI / 4 + phi / 2)) + Math.PI) / tau))],
  (x, y) => [fromToS(-Math.PI, Math.PI, x), Math.atan(Math.sinh(fromToS(-Math.PI, Math.PI, y)))]);

// Mollweide's theta for each latitude, tabulated at 50001 points by Newton's method as Reanimate does.
const granularity = 50000;
const toIndex = (phi) => haskellRound((phi + halfPi) / Math.PI * granularity);
const fromIndex = (i) => fromToS(-halfPi, halfPi, i / granularity);
const granualize = (phi) => fromIndex(toIndex(phi));
function findThetaFast(phi) {
  if (Math.abs(phi) === Math.PI / 2) return signum(phi) * halfPi;
  let acc = phi;
  for (;;) {
    const c = Math.cos(acc + acc), s = Math.sin(acc + acc);
    const next = acc - (acc + acc + s - Math.PI * Math.sin(phi)) / (2.0 + c + c);
    if (Math.abs(next - acc) < epsilon) return next;
    acc = next;
  }
}
let thetaTable = null;
const thetas = () => (thetaTable ??= Float64Array.from({length: granularity + 1}, (_, i) => findThetaFast(fromIndex(i))));

export const mollweideP = new Projection('mollweide',
  (lam, phi) => {
    const theta = thetas()[toIndex(phi)];
    const x = (2 * sqrt2) / Math.PI * lam * Math.cos(theta), y = sqrt2 * Math.sin(theta);
    return [(x + sqrt2 * 2) / (4 * sqrt2), (y + sqrt2) / (2 * sqrt2)];
  },
  (x1, y1) => {
    const x = fromToS(-2 * sqrt2, 2 * sqrt2, x1), y = fromToS(-1, 1, y1);
    const theta = granualize(Math.asin(y));
    return [Math.PI * x / (2 * sqrt2 * Math.cos(theta)), Math.asin((2 * theta + Math.sin(2 * theta)) / Math.PI)];
  });

export const hammerP = new Projection('hammer',
  (lam, phi) => {
    const d = Math.sqrt(1 + Math.cos(phi) * Math.cos(lam / 2));
    const x = (2 * sqrt2 * Math.cos(phi) * Math.sin(lam / 2)) / d, y = (sqrt2 * Math.sin(phi)) / d;
    return [(x + sqrt2 * 2) / (4 * sqrt2), (y + sqrt2) / (2 * sqrt2)];
  },
  (x1, y1) => {
    const x = fromToS(-2 * sqrt2, 2 * sqrt2, x1), y = fromToS(-sqrt2, sqrt2, y1);
    const z = Math.sqrt(1 - (x / 4) ** 2 - (y / 2) ** 2);
    return [2 * Math.atan2(z * x, 2 * (2 * z ** 2 - 1)), Math.asin(z * y)];
  });

/** cylindricalEqualAreaP(phi0): the cylindrical equal-area family with standard parallel phi0. */
export function cylindricalEqualAreaP(phi0) {
  const cosPhi0 = Math.cos(phi0);
  return new Projection('lambert',
    (lam, phi) => [(lam + Math.PI) / tau, ((Math.sin(phi) / cosPhi0 + 1 / cosPhi0) / 2) / cosPhi0],
    (x1, y1) => [fromToS(-Math.PI, Math.PI, x1), Math.asin(fromToS(-1, 1, y1) * cosPhi0) / (Math.asin(cosPhi0) / halfPi)]);
}

export const lambertP = new Projection('lambert',
  (lam, phi) => [(lam + Math.PI) / tau, (Math.sin(phi) + 1) / 2],
  (x1, y1) => [fromToS(-Math.PI, Math.PI, x1), Math.asin(fromToS(-1, 1, y1))]);

/** bottomleyP(phi1). */
export function bottomleyP(phi1) {
  return new Projection('bottomley',
    (lam, phi) => {
      const rho = Math.PI / 2 - phi;
      const e = lam * Math.sin(phi1) * Math.sin(rho) / rho;
      const x = (rho * Math.sin(e)) / Math.sin(phi1), y = Math.PI / 2 - rho * Math.cos(e);
      return [(x + Math.PI) / tau, (y + Math.PI / 2) / Math.PI];
    },
    (x1, y1) => {
      const x = fromToS(-Math.PI, Math.PI, x1), y = fromToS(-Math.PI / 2, Math.PI / 2, y1);
      const xs = x * Math.sin(phi1), ys = Math.PI / 2 - y;
      const rho = Math.sqrt(xs * xs + ys * ys);
      const e = Math.atan2(xs, ys);
      return [(rho === 0 ? 1 : rho / Math.sin(rho)) * e / Math.sin(phi1), Math.PI / 2 - rho];
    });
}

export const sinusoidalP = new Projection('sinusoidal',
  (lam, phi) => [(lam * Math.cos(phi) + Math.PI) / tau, (phi + Math.PI / 2) / Math.PI],
  (x1, y1) => { const x = fromToS(-Math.PI, Math.PI, x1), y = fromToS(-Math.PI / 2, Math.PI / 2, y1); return [x / Math.cos(y), y]; });

export const wernerP = moveTopP(0.23, new Projection('werner',
  (lam, phi) => {
    const rho = Math.PI / 2 - phi;
    const e = rho === 0 ? rho : lam * Math.sin(rho) / rho;
    const x = rho * Math.sin(e), y = Math.PI / 2 - rho * Math.cos(e);
    return [(x + Math.PI) / tau, (y + Math.PI / 2) / Math.PI];
  },
  (x1, y1) => {
    const x = fromToS(-Math.PI, Math.PI, x1), y = fromToS(-Math.PI / 2, Math.PI / 2, y1);
    const rho = Math.sqrt(x ** 2 + (Math.PI / 2 - y) ** 2);
    const e = Math.atan2(x, Math.PI / 2 - y);
    return [e * rho / Math.sin(rho), Math.PI / 2 - rho];
  }));

/** bonneP(phi0); bonneP(0) is the sinusoidal projection. */
export function bonneP(phi0) {
  if (phi0 === 0) return sinusoidalP;
  const factor = Math.sin(phi0) / Math.sin(Math.PI / 4);
  const cotPhi0 = cot(phi0);
  return moveTopP(-0.17 * factor, scaleP(1, fromToS(1, 0.65, factor), new Projection('bonne',
    (lam, phi) => {
      const rho = cotPhi0 + phi0 - phi;
      const e = (lam * Math.cos(phi)) / rho;
      const x = rho * Math.sin(e), y = cotPhi0 - rho * Math.cos(e);
      return [(x + Math.PI) / tau, (y + halfPi) / Math.PI];
    },
    (x1, y1) => {
      const x = fromToS(-Math.PI, Math.PI, x1), y = fromToS(-Math.PI / 2, Math.PI / 2, y1);
      const rho = Math.sqrt(x * x + (cot(phi0) - y) ** 2);
      const phi = cotPhi0 + phi0 - rho;
      return [rho / Math.cos(phi) * Math.atan2(x, cotPhi0 - y), phi];
    })));
}

/** orthoP([lam0, phi0]): the globe seen from far away, centred on lam0/phi0, in a 16:9 frame. */
export function orthoP([lam0, phi0]) {
  const wrap = (lower, upper, v) => (v > upper ? v - upper + lower : v < lower ? v + upper - lower : v);
  return new Projection('ortho',
    (lam, phi) => {
      const x = Math.cos(phi) * Math.sin(lam - lam0);
      const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam - lam0);
      const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam - lam0);
      if (cosc < 0) {
        const ang = Math.atan2(y, x);
        return [7 / 32 + ((Math.cos(ang) + 1) / 2 * 9 / 16), (Math.sin(ang) + 1) / 2];
      }
      return [(x + (16 / 9)) / (16 / 9 * 2), (y + 1) / 2];
    },
    (x1, y1) => {
      const x = fromToS(-16 / 9, 16 / 9, x1), y = fromToS(-1, 1, y1);
      const rho = Math.sqrt(x * x + y * y);
      const c = Math.asin(rho);
      const lam = wrap(-Math.PI, Math.PI, lam0 + Math.atan2(x * Math.sin(c), rho * Math.cos(c) * Math.cos(phi0) - y * Math.sin(c) * Math.sin(phi0)));
      const phi = wrap(-Math.PI / 2, Math.PI / 2, Math.asin(Math.cos(c) * Math.sin(phi0) + (y * Math.sin(c) * Math.cos(phi0)) / rho));
      return [lam, phi];
    });
}

export const cassiniP = new Projection('cassini',
  (lam, phi) => [(Math.asin(Math.cos(phi) * Math.sin(lam)) + halfPi) / Math.PI, (Math.atan2(Math.tan(phi), Math.cos(lam)) + Math.PI) / tau],
  (x1, y1) => {
    const x = fromToS(-halfPi, halfPi, x1), y = fromToS(-Math.PI, Math.PI, y1);
    return [Math.atan2(Math.tan(x), Math.cos(y)), Math.asin(Math.sin(y) * Math.cos(x))];
  });

export const augustP = (() => {
  const xHi = 16 / 3, xLo = -xHi, yHi = 8 / 3, yLo = -yHi;
  return scaleP(0.70, 0.70, new Projection('august',
    (lam, phi) => {
      const tanPhi = Math.tan(phi / 2);
      const k = Math.sqrt(1 - tanPhi * tanPhi);
      const c = 1 + k * Math.cos(lam / 2);
      const x = Math.sin(lam / 2) * k / c, y = tanPhi / c;
      const x2 = x * x, y2 = y * y;
      const xPos = 4 / 3 * x * (3 + x2 - 3 * y2), yPos = 4 / 3 * y * (3 + 3 * x2 - y2);
      return [(xPos - xLo) / (xHi - xLo), (yPos - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      const x = fromToS(xLo, xHi, x1) * 3 / 8, y = fromToS(yLo, yHi, y1) * 3 / 8;
      const x2 = x * x, y2 = y * y;
      const s = 1 + x2 + y2;
      const sin3Eta = Math.sqrt((s - Math.sqrt(s * s - 4 * y * y)) / 2);
      const eta = Math.asin(sin3Eta) / 3;
      const xi = sin3Eta !== 0 ? Math.acosh(Math.abs(y / sin3Eta)) / 3 : Math.asinh(Math.abs(x)) / 3;
      const cosEta = Math.cos(eta), coshXi = Math.cosh(xi);
      const d = coshXi * coshXi - cosEta * cosEta;
      return [signum(x) * 2 * Math.atan2(Math.sinh(xi) * cosEta, 0.25 - d), signum(y) * 2 * Math.atan2(coshXi * Math.sin(eta), 0.25 + d)];
    }));
})();

export const collignonP = (() => {
  const yHi = sqrtPi, yLo = sqrtPi * (1 - sqrt2), xLo = -Math.PI * (2 / sqrtPi) * sqrt2, xHi = Math.PI * (2 / sqrtPi) * sqrt2;
  return new Projection('collignon',
    (lam, phi) => {
      const alpha = Math.sqrt(1 - Math.sin(phi));
      const x = (2 / sqrtPi) * lam * alpha, y = sqrtPi * (1 - alpha);
      return [(x - xLo) / (xHi - xLo), (y - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      const x = fromToS(xLo, xHi, x1), y = fromToS(yLo, yHi, y1);
      const l = (y / sqrtPi - 1) ** 2;
      return [l > 0 ? x * Math.sqrt(Math.PI / l) / 2 : 0, Math.asin(1 - l)];
    });
})();

export const eckert1P = (() => {
  const alpha = Math.sqrt(8 / (3 * Math.PI));
  const yLo = -alpha * halfPi, yHi = alpha * halfPi, xLo = -alpha * Math.PI, xHi = alpha * Math.PI;
  return new Projection('eckert1',
    (lam, phi) => {
      const x = alpha * lam * (1 - Math.abs(phi) / Math.PI), y = alpha * phi;
      return [(x - xLo) / (xHi - xLo), (y - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      const x = fromToS(xLo, xHi, x1), y = fromToS(yLo, yHi, y1);
      const phi = y / alpha;
      return [x / (alpha * (1 - Math.abs(phi) / Math.PI)), phi];
    });
})();

export const eckert3P = (() => {
  const k = Math.sqrt(Math.PI * (4 + Math.PI));
  const yHi = 4 / k * halfPi, yLo = -yHi, xHi = 4 / k * Math.PI, xLo = -xHi;
  return new Projection('eckert3',
    (lam, phi) => {
      const x = 2 / k * lam * (1 + Math.sqrt(1 - 4 * phi * phi / (Math.PI * Math.PI))), y = 4 / k * phi;
      return [(x - xLo) / (xHi - xLo), (y - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      const x = fromToS(xLo, xHi, x1), y = fromToS(yLo, yHi, y1);
      return [x * k / 2 / (1 + Math.sqrt(1 - y * y * (4 + Math.PI) / (4 * Math.PI))), y * k / 4];
    });
})();

export const eckert5P = (() => {
  const k = Math.sqrt(2 + Math.PI);
  const yHi = Math.PI / k, yLo = -yHi, xHi = tau / k, xLo = -xHi;
  return new Projection('eckert5',
    (lam, phi) => {
      const x = lam * (1 + Math.cos(phi)) / k, y = 2 * phi / k;
      return [(x - xLo) / (xHi - xLo), (y - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      const x = fromToS(xLo, xHi, x1), y = fromToS(yLo, yHi, y1);
      const phi = y * k / 2;
      return [k * x / (1 + Math.cos(phi)), phi];
    });
})();

export const faheyP = (() => {
  const faheyK = Math.cos(toRads(35));
  const yHi = 1 + faheyK, yLo = -yHi, xHi = Math.PI * faheyK * 16 / 9, xLo = -xHi;
  return new Projection('fahey',
    (lam, phi) => {
      const t = Math.tan(phi / 2);
      const x = lam * faheyK * Math.sqrt(1 - t * t), y = (1 + faheyK) * t;
      return [(x - xLo) / (xHi - xLo), (y - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      const x = fromToS(xLo, xHi, x1), y = fromToS(yLo, yHi, y1);
      const t = y / (1 + faheyK);
      return [x / (faheyK * Math.sqrt(1 - t * t)), 2 * Math.atan2(y, 1 + faheyK)];
    });
})();

export const foucautP = (() => {
  const yHi = sqrtPi * Math.tan(halfPi / 2), yLo = -yHi, xHi = tau / sqrtPi, xLo = -xHi;
  return new Projection('foucaut',
    (lam, phi) => {
      const k = phi / 2, cosk = Math.cos(k);
      const x = 2 * lam / sqrtPi * Math.cos(phi) * cosk * cosk, y = sqrtPi * Math.tan(k);
      return [(x - xLo) / (xHi - xLo), (y - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      const x = fromToS(xLo, xHi, x1), y = fromToS(yLo, yHi, y1);
      const k = Math.atan(y / sqrtPi), cosk = Math.cos(k), phi = 2 * k;
      return [x * sqrtPi / 2 / (Math.cos(phi) * cosk * cosk), phi];
    });
})();

export const lagrangeP = (() => {
  const yHi = 2, yLo = -yHi, xHi = 2, xLo = -xHi, n = 0.5;
  return new Projection('lagrange',
    (lam, phi) => {
      if (Math.abs(Math.abs(phi) - halfPi) < epsilon) return [0.5, phi < 0 ? 0 : 1];
      const sinPhi = Math.sin(phi);
      const v = ((1 + sinPhi) / (1 - sinPhi)) ** (n / 2);
      const c = 0.5 * (v + 1 / v) + Math.cos(lam * n);
      const x = 2 * Math.sin(lam * n) / c, y = (v - 1 / v) / c;
      return [(x - xLo) / (xHi - xLo), (y - yLo) / (yHi - yLo)];
    },
    (x1, y1) => {
      if (Math.abs(y1 - 1) < epsilon) return [100, 100];
      const x = fromToS(xLo, xHi, x1) / 2, y = fromToS(yLo, yHi, y1) / 2;
      const x2 = x * x, y2 = y * y;
      const t = 2 * y / (1 + x2 + y2);
      const t1 = ((1 + t) / (1 - t)) ** (1 / n);
      return [Math.atan2(2 * x, 1 - x2 - y2) / n, Math.asin((t1 - 1) / (t1 + 1))];
    });
})();

// ---------------------------------------------------------------------------------------------
// GeoJSON

/** renderGeometry: a GeoJSON geometry as line paths in lon/lat degrees (only the outer ring of a polygon). */
export function renderGeometry(shape) {
  switch (shape?.type) {
    case 'MultiPolygon': return mkGroup(shape.coordinates.map((coordinates) => renderGeometry({type: 'Polygon', coordinates})));
    case 'Polygon': return mkGroup([mkLinePath(shape.coordinates[0].map(([x, y]) => [x, y]))]);
    case 'LineString': return mkLinePath(shape.coordinates.map(([x, y]) => [x, y]));
    case 'MultiLineString': return mkGroup(shape.coordinates.map((coordinates) => renderGeometry({type: 'LineString', coordinates})));
    default: return None;
  }
}
/** drawFeatureCollection: every feature's geometry, passed through fn(properties, svg). */
export const drawFeatureCollection = (geo, fn) => mkGroup(geo.features.map((f) => fn(f.properties, renderGeometry(f.geometry))));

const dist = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by);
/**
 * applyProjection(p, svg, tolerance = 1e-2): every path point (lon/lat in radians; a latitude beyond
 * ±pi/2 throws) projected, with
 * straight segments split in halves until their projected ends are within `tolerance`.
 */
export function applyProjection(p, svg, tolerance = 1e-2) {
  const lowTolerance = tolerance * tolerance;
  const proj = ([lam, phi]) => {
    // Reanimate draws NaN for a point outside the sphere; here such a point (usually GeoJSON still in
    // degrees) is refused, since every projection expects radians.
    if (!(Math.abs(phi) <= Math.PI / 2)) {
      throw new RangeError(`applyProjection: latitude ${phi} is outside -pi/2..pi/2; give longitude and latitude in radians (degrees * pi / 180)`);
    }
    return p.forward(lam, phi);
  };
  const mkChunks = (a, b) => {
    const midway = [a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5];
    if (dist(proj(a), proj(b)) < tolerance || dist(a, b) < lowTolerance) return [a, b];
    return [...mkChunks(a, midway), ...mkChunks(midway, b).slice(1)];
  };
  const start = (cmds, i, out) => {
    if (i >= cmds.length || cmds[i].k !== 'move') return out;
    out.push({k: 'move', p: proj(cmds[i].p)});
    return worker(cmds[i].p, cmds, i + 1, out);
  };
  function worker(a, cmds, i, out) {
    for (;;) {
      if (i >= cmds.length) return out;
      const c = cmds[i];
      if (c.k === 'end' || (c.k === 'bezier' && c.ps.length === 1)) {
        const b = c.k === 'end' ? c.p : c.ps[0];
        const chunks = mkChunks(a, b).slice(1);
        const last = chunks.pop();
        for (const v of chunks) out.push({k: 'bezier', ps: [proj(v)]});
        if (c.k === 'end') { out.push({k: 'end', p: proj(last)}); return start(cmds, i + 1, out); }
        out.push({k: 'bezier', ps: [proj(last)]});
        a = last; i++;
      } else if (c.k === 'bezier') {
        out.push({k: 'bezier', ps: c.ps.map(proj)}); a = c.ps[c.ps.length - 1]; i++;
      } else if (c.k === 'move') {
        out.push({k: 'move', p: proj(c.p)}); a = c.p; i++;
      } else return out;
    }
  }
  return mapSvgLines((cmds) => start(cmds, 0, []), svg);
}
