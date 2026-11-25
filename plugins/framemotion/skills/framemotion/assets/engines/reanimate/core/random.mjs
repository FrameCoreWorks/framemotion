// Haskell's pseudo-random numbers for the Reanimate engine: StdGen of random 1.2.0 over SplitMix
// (splitmix 0.1.0.4), the versions in Reanimate's Stackage resolver lts-18.15, ported to JavaScript
// with BigInt so mkStdGen and randomRs give the same numbers as in Reanimate's examples.
// random and splitmix are BSD-3-Clause (see integrations/random-haskell and splitmix-haskell).

const MASK = (1n << 64n) - 1n;
const GOLDEN_GAMMA = 0x9e3779b97f4a7c15n;
const shiftXor = (n, w) => w ^ (w >> BigInt(n));
const shiftXorMultiply = (n, k, w) => (shiftXor(n, w) * k) & MASK;
const mix64 = (z) => shiftXor(33, shiftXorMultiply(33, 0xc4ceb9fe1a85ec53n, shiftXorMultiply(33, 0xff51afd7ed558ccdn, z)));
const mix64variant13 = (z) => shiftXor(31, shiftXorMultiply(27, 0x94d049bb133111ebn, shiftXorMultiply(30, 0xbf58476d1ce4e5b9n, z)));
const popCount = (w) => { let n = 0; for (let x = w; x; x >>= 1n) n += Number(x & 1n); return n; };
function mixGamma(z) {
  const z1 = mix64variant13(z) | 1n;
  return popCount(z1 ^ (z1 >> 1n)) >= 24 ? z1 : z1 ^ 0xaaaaaaaaaaaaaaaan;
}

/** SplitMix's generator: {seed, gamma}, both Word64 as BigInt. */
export const mkSMGen = (s) => ({seed: mix64(BigInt.asUintN(64, BigInt(s))), gamma: mixGamma((BigInt.asUintN(64, BigInt(s)) + GOLDEN_GAMMA) & MASK)});
/** nextWord64: [word, next generator]. */
export function nextWord64({seed, gamma}) {
  const s = (seed + gamma) & MASK;
  return [mix64(s), {seed: s, gamma}];
}
/** mkStdGen: random 1.2.0's StdGen from an Int (a JavaScript integer or BigInt). */
export const mkStdGen = (n) => mkSMGen(BigInt.asUintN(64, BigInt(n)));

const WORD64_MAX = Number(MASK);   // fromIntegral (maxBound :: Word64) :: Double, that is 2^64
/** randomR (l, h) for Double: [value, next generator] (uniformDouble01M, then x*l + (1-x)*h). */
export function randomRDouble([l, h], g) {
  if (l === h) return [l, g];
  const [w, g1] = nextWord64(g);
  const x = Number(w) / WORD64_MAX;
  return [x * l + (1 - x) * h, g1];
}
/** randomRs (l, h) g for Double: the first `count` values. */
export function randomRsDouble(range, g, count) {
  const out = [];
  for (let i = 0, gen = g; i < count; i++) { const [v, next] = randomRDouble(range, gen); out.push(v); gen = next; }
  return out;
}
