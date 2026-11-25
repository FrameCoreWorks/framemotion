// Haskell's Data.Complex for the Reanimate engine's Fourier examples: [re, im] pairs with GHC's
// formulas, so sums and rotations round as in Reanimate. FrameCore Works code.

export const cx = (re, im = 0) => [re, im];
export const cneg = ([a, b]) => [-a, -b];
export const cadd = ([a, b], [c, d]) => [a + c, b + d];
export const cmul = ([x, y], [u, v]) => [x * u - y * v, x * v + y * u];
/** exp (x :+ y) = exp x * cos y :+ exp x * sin y */
export const cexp = ([x, y]) => { const e = Math.exp(x); return [e * Math.cos(y), e * Math.sin(y)]; };
/** magnitude: GHC scales by a power of two before squaring, which rounds as plain sqrt(x*x + y*y). */
export const magnitude = ([x, y]) => Math.sqrt(x * x + y * y);
/** sum: a left fold from 0 :+ 0. */
export const csum = (zs) => zs.reduce(cadd, [0, 0]);
/** scanl (+) 0 */
export const cscan = (zs) => { const out = [[0, 0]]; for (const z of zs) out.push(cadd(out[out.length - 1], z)); return out; };
/**
 * exp (k * 2 * pi * i * t) built the way Haskell evaluates `k * 2 * pi * i * t` on Complex Double
 * (each factor a complex number with a zero imaginary part, i = 0 :+ 1); k is complex, so
 * `negate (fromIntegral n)` is cneg(cx(n)) with its negative zero, as in Haskell.
 */
export function expTurn(k, t) {
  let z = cmul(cmul(k, cx(2)), cx(Math.PI));
  z = cmul(z, [0, 1]);
  return cexp(cmul(z, cx(t)));
}
