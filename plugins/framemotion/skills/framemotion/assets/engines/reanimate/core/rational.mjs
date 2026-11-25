// Haskell's Rational for the Reanimate engine's polygon code (Reanimate.Math.*), which computes with
// exact fractions: {n, d} BigInt pairs kept in lowest terms with d > 0, as Data.Ratio does, so equal
// values compare equal. fromDouble is exact (toRational) and toDouble rounds to the nearest double,
// ties to even (fromRational). FrameCore Works code.

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
function make(n, d) {
  if (d === 0n) throw new RangeError('Ratio has zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return g === 1n ? {n, d} : {n: n / g, d: d / g};
}

export const ZERO = Object.freeze({n: 0n, d: 1n});
export const ONE = Object.freeze({n: 1n, d: 1n});
export const qInt = (i) => ({n: BigInt(i), d: 1n});
export const qFrac = (n, d) => make(BigInt(n), BigInt(d));

const F64 = new Float64Array(1), U64 = new BigUint64Array(F64.buffer);
/**
 * toRational of a double: exact. As in GHC (decodeFloat), infinity becomes 2^1024 and NaN 1.5 * 2^1024
 * with its sign bit, so a division by zero upstream still gives a (huge) number, not an exception.
 */
export function fromDouble(x) {
  if (x === 0) return ZERO;
  F64[0] = x;
  const bits = U64[0];
  const sign = bits >> 63n ? -1n : 1n;
  const exp = Number((bits >> 52n) & 0x7ffn);
  let mant = bits & ((1n << 52n) - 1n);
  let e;
  if (exp === 0) e = -1074; else { mant |= 1n << 52n; e = exp - 1075; }
  return e >= 0 ? {n: sign * (mant << BigInt(e)), d: 1n} : make(sign * mant, 1n << BigInt(-e));
}

const bitLength = (x) => x.toString(2).length;
/** fromRational to Double: the nearest double, ties to even (normal range; tiny values flush through Number). */
export function toDouble({n, d}) {
  if (n === 0n) return 0;
  const neg = n < 0n;
  let a = neg ? -n : n;
  // scale so that the quotient has 55 bits: 53 kept, a guard bit and a sticky remainder
  const k = 55 - (bitLength(a) - bitLength(d));
  const num = k >= 0 ? a << BigInt(k) : a;
  const den = k >= 0 ? d : d << BigInt(-k);
  let q = num / den;
  const rest = num % den;
  let shift = bitLength(q) - 53;
  let kept = q >> BigInt(shift);
  const dropped = q - (kept << BigInt(shift));
  const half = 1n << BigInt(shift - 1);
  if (dropped > half || (dropped === half && (rest !== 0n || (kept & 1n)))) kept += 1n;   // ties to even
  const value = Number(kept) * 2 ** (shift - k);
  return neg ? -value : value;
}

export const add = (a, b) => (a.d === b.d ? make(a.n + b.n, a.d) : make(a.n * b.d + b.n * a.d, a.d * b.d));
export const sub = (a, b) => (a.d === b.d ? make(a.n - b.n, a.d) : make(a.n * b.d - b.n * a.d, a.d * b.d));
export const mul = (a, b) => make(a.n * b.n, a.d * b.d);
export const div = (a, b) => make(a.n * b.d, a.d * b.n);
export const neg = (a) => ({n: -a.n, d: a.d});
export const cmp = (a, b) => { const x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; };
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const isZero = (a) => a.n === 0n;
export const sign = (a) => (a.n < 0n ? -1 : a.n > 0n ? 1 : 0);
export const qMin = (a, b) => (cmp(a, b) <= 0 ? a : b);

// V2 Rational as [x, y]
export const v2FromDouble = ([x, y]) => [fromDouble(x), fromDouble(y)];
export const v2ToDouble = ([x, y]) => [toDouble(x), toDouble(y)];
export const v2Eq = (a, b) => eq(a[0], b[0]) && eq(a[1], b[1]);
export const v2Sub = (a, b) => [sub(a[0], b[0]), sub(a[1], b[1])];
/** linear's lerp alpha u v = alpha *^ u ^+^ (1 - alpha) *^ v */
export const v2Lerp = (alpha, u, v) => {
  const beta = sub(ONE, alpha);
  return [add(mul(alpha, u[0]), mul(beta, v[0])), add(mul(alpha, u[1]), mul(beta, v[1]))];
};
/** quadrance (a - b), exact */
export const distSquared = (a, b) => { const [x, y] = v2Sub(a, b); return add(mul(x, x), mul(y, y)); };
/** distance': sqrt of the exact squared distance rounded to a double. */
export const distanceD = (a, b) => Math.sqrt(toDouble(distSquared(a, b)));
