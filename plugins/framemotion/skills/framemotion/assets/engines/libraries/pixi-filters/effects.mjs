// Four effect stacks from pixi-filters. Each returns its filters and at(t), which sets every
// time-driven value from t alone (no state carried between frames).

const smooth = (x) => { const c = Math.min(Math.max(x, 0), 1); return c * c * (3 - 2 * c); };

export const EFFECTS = {
  /** A ring of distortion from the centre, twice. */
  shockwave(F, {width, height}) {
    const wave = new F.ShockwaveFilter({center: {x: width / 2, y: height / 2}, amplitude: 28, wavelength: 140,
      brightness: 1.15, speed: 420, radius: -1});
    return {filters: [wave], at(t) { wave.time = t % 2; }};   // the ring leaves the frame in about 1.2 s
  },
  /** Light rays that drift, with a soft bloom. */
  godrays(F) {
    const rays = new F.GodrayFilter({angle: 25, gain: 0.55, lacunarity: 2.6, parallel: true, time: 0, alpha: 1});
    const bloom = new F.AdvancedBloomFilter({threshold: 0.6, bloomScale: 0.6, brightness: 1, blur: 6, quality: 6});
    return {filters: [rays, bloom], at(t) { rays.time = t * 0.6; }};
  },
  /** An old screen: lines, curvature, noise and a slow roll. */
  crt(F) {
    const crt = new F.CRTFilter({curvature: 3, lineWidth: 2, lineContrast: 0.35, noise: 0.25, noiseSize: 1.2,
      vignetting: 0.35, vignettingAlpha: 0.8, vignettingBlur: 0.3});
    return {filters: [crt], at(t) { crt.time = t * 4; crt.seed = (Math.floor(t * 24) * 0.618) % 1; }};
  },
  /** Digital glitch slices with a colour split that builds and settles. */
  glitch(F) {
    const glitch = new F.GlitchFilter({slices: 12, offset: 0, direction: 0, fillMode: 2, average: false,
      red: {x: 0, y: 0}, green: {x: 0, y: 0}, blue: {x: 0, y: 0}});
    return {filters: [glitch], at(t) {
      const amount = smooth(t / 1.2) * (1 - smooth((t - 2.6) / 1.2));
      glitch.offset = 60 * amount;
      glitch.red = {x: -8 * amount, y: 2 * amount};
      glitch.blue = {x: 8 * amount, y: -2 * amount};
      glitch.refresh();   // new random slices; Math.random is seeded by the caller
    }};
  },
};
