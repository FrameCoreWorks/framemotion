// Photoreal three.js engine: film grade. Linear HDR in, graded 8-bit sRGB out:
// bloom from a mip pyramid, exposure and white balance, vignette in light (before the curve),
// tint by tonal range, saturation, contrast around mid grey, a filmic curve, grain that is
// weaker in the highlights, and a dither against banding. Grain is seeded by the frame, so
// every frame renders the same way twice.
// Adapted from Leonxlnx/room-at-dawn (MIT, Copyright (c) 2026 Leon Lin, commit aab8be2), rewritten
// on the FrameMotion engine kit; see integrations/room-at-dawn/. Changes are FrameCore Works (Apache-2.0).
// The curve is Hajime Uchimura's published filmic tone curve (CEDEC 2017). The grain hash is
// "Hash without Sine" by David Hoskins (MIT, shadertoy.com/view/4djSRW).
// Pixels brighter than MAX_LINEAR are clamped first, so one hot pixel cannot flood the bloom.
import {createQuad} from './accum-camera.mjs';

export const DEFAULT_LOOK = Object.freeze({
  exposure: 1, whiteBalance: [1, 1, 1], bloom: 0.25, bloomThreshold: 0, vignette: 0.25, highlightRolloff: 1,
  shadowTint: [0.97, 1.0, 1.04], midTint: [1, 1, 1], highTint: [1.03, 1.0, 0.96],
  saturation: 1, contrast: 1, fade: 1, grain: 0.012, dither: true, peak: 1,
});

/** Brightest linear value the grade accepts; larger values (a sun glint, a NaN-free inf) are clamped. */
export const MAX_LINEAR = 60;

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Uchimura curve: toe, linear section, shoulder that reaches `peak` smoothly. */
export function uchimura(x, peak = 1) {
  const a = 1, m = 0.22, l = 0.4, c = 1.33, b = 0;
  const l0 = ((peak - m) * l) / a, s0 = m + l0, s1 = m + a * l0;
  const c2 = (a * peak) / (peak - s1), cp = -c2 / peak;
  const w0 = 1 - smoothstep(0, m, x), w2 = x >= m + l0 ? 1 : 0, w1 = 1 - w0 - w2;
  const toe = m * Math.pow(Math.max(x, 0) / m, c) + b;
  const lin = m + a * (x - m);
  const shoulder = peak - (peak - s1) * Math.exp(cp * (x - s0));
  return toe * w0 + lin * w1 + shoulder * w2;
}

const encodeSrgb = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055);

export function vignetteFactor(u, v, aspect, amount) {
  const x = (u - 0.5) * aspect * 0.82, y = v - 0.5;
  return 1 + (1 - smoothstep(0.25, 1.05, Math.hypot(x, y)) - 1) * amount;
}

/**
 * Reference grade of one linear pixel, matching the shader. Returns sRGB in [0, 1] before
 * grain and dither (pass noise in [-0.5, 0.5) to include them). bloom is the glow already
 * normalised by the number of bloom levels, as the shader receives it.
 */
export function gradePixel(rgb, look = DEFAULT_LOOK, {u = 0.5, v = 0.5, aspect = 1, bloom = [0, 0, 0], noise = null} = {}) {
  const L = {...DEFAULT_LOOK, ...look};
  let c = rgb.map((x, i) => (Math.min(x, MAX_LINEAR) + bloom[i] * L.bloom) * L.exposure * L.whiteBalance[i]);
  const vig = vignetteFactor(u, v, aspect, L.vignette);
  c = c.map((x) => x * vig);
  const l0 = luma(c);
  const sh = 1 - smoothstep(0, 0.25, l0), hi = smoothstep(0.35, 1.6, l0);
  c = c.map((x, i) => {
    const low = L.midTint[i] + (L.shadowTint[i] - L.midTint[i]) * sh;
    return x * (low + (L.highTint[i] - low) * hi);
  });
  const l1 = luma(c);
  c = c.map((x) => l1 + (x - l1) * L.saturation);
  c = c.map((x) => Math.pow(Math.max(x, 0) / 0.18, L.contrast) * 0.18 * L.fade);
  const l2 = Math.max(luma(c), 1e-5), lt = uchimura(l2, L.peak);
  c = c.map((x) => 0.5 * x * (lt / l2) + 0.5 * uchimura(x, L.peak));
  const white = Math.max(...c), roll = smoothstep(1, 8, l2) * L.highlightRolloff;   // very bright light burns to white
  c = c.map((x) => x + (white - x) * roll);
  c = c.map((x) => encodeSrgb(Math.min(1, Math.max(0, x))));
  if (noise !== null) {
    const amp = L.grain * (1 - 0.6 * luma(c)) + (L.dither ? 1 / 255 : 0);
    c = c.map((x) => x + noise * amp);
  }
  return c.map((x) => Math.min(1, Math.max(0, x)));
}

const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

const DOWN_FS = /* glsl */`precision highp float;
varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold;
void main(){
  vec2 d = uTexel;
  vec3 a = texture2D(tSrc, vUv + vec2(-d.x, -d.y)).rgb + texture2D(tSrc, vUv + vec2(d.x, -d.y)).rgb
         + texture2D(tSrc, vUv + vec2(-d.x, d.y)).rgb + texture2D(tSrc, vUv + vec2(d.x, d.y)).rgb;
  a = min(a * 0.25, vec3(${MAX_LINEAR}.0));
  if (uThreshold > 0.0) { float l = max(a.r, max(a.g, a.b)); a *= smoothstep(uThreshold * 0.5, uThreshold * 2.0, l); }
  gl_FragColor = vec4(a, 1.0);
}`;

const UP_FS = /* glsl */`precision highp float;
varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel;
void main(){
  vec2 d = uTexel;
  vec3 s = texture2D(tSrc, vUv).rgb * 4.0
    + (texture2D(tSrc, vUv + vec2(-d.x, 0.0)).rgb + texture2D(tSrc, vUv + vec2(d.x, 0.0)).rgb
     + texture2D(tSrc, vUv + vec2(0.0, -d.y)).rgb + texture2D(tSrc, vUv + vec2(0.0, d.y)).rgb) * 2.0
    + texture2D(tSrc, vUv + vec2(-d.x, -d.y)).rgb + texture2D(tSrc, vUv + vec2(d.x, -d.y)).rgb
    + texture2D(tSrc, vUv + vec2(-d.x, d.y)).rgb + texture2D(tSrc, vUv + vec2(d.x, d.y)).rgb;
  gl_FragColor = vec4(s / 16.0, 1.0);
}`;

export const GRADE_FS = /* glsl */`precision highp float;
varying vec2 vUv;
uniform sampler2D tColor; uniform sampler2D tBloom;
uniform float uExposure, uBloom, uVignette, uGrain, uDither, uSat, uContrast, uFade, uPeak, uAspect, uRoll;
uniform vec2 uSeed;
uniform vec3 uWB, uShadowTint, uMidTint, uHighTint;
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float uchimura(float x, float P){
  const float a = 1.0, m = 0.22, l = 0.4, c = 1.33, b = 0.0;
  float l0 = ((P - m) * l) / a, s0 = m + l0, s1 = m + a * l0, c2 = (a * P) / (P - s1), cp = -c2 / P;
  float w0 = 1.0 - smoothstep(0.0, m, x), w2 = step(m + l0, x), w1 = 1.0 - w0 - w2;
  float toe = m * pow(max(x, 0.0) / m, c) + b, lin = m + a * (x - m), sh = P - (P - s1) * exp(cp * (x - s0));
  return toe * w0 + lin * w1 + sh * w2;
}
vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec3 c = (min(texture2D(tColor, vUv).rgb, vec3(${MAX_LINEAR}.0)) + texture2D(tBloom, vUv).rgb * uBloom) * uExposure * uWB;
  vec2 q = vUv - 0.5; q.x *= uAspect * 0.82;
  c *= mix(1.0, 1.0 - smoothstep(0.25, 1.05, length(q)), uVignette);
  float l = luma(c);
  float shw = 1.0 - smoothstep(0.0, 0.25, l), hiw = smoothstep(0.35, 1.6, l);
  c *= mix(mix(uMidTint, uShadowTint, shw), uHighTint, hiw);
  l = luma(c);
  c = mix(vec3(l), c, uSat);
  c = pow(max(c, 0.0) / 0.18, vec3(uContrast)) * 0.18 * uFade;
  float ll = max(luma(c), 1e-5), lt = uchimura(ll, uPeak);
  c = 0.5 * c * (lt / ll) + 0.5 * vec3(uchimura(c.r, uPeak), uchimura(c.g, uPeak), uchimura(c.b, uPeak));
  c = mix(c, vec3(max(c.r, max(c.g, c.b))), smoothstep(1.0, 8.0, ll) * uRoll);
  c = srgb(clamp(c, 0.0, 1.0));
  float n = hash(gl_FragCoord.xy + uSeed) - 0.5;
  c += n * (uGrain * (1.0 - 0.6 * luma(c)) + uDither / 255.0);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

/**
 * A small per-frame offset for the grain hash. Large offsets lose float precision in the
 * shader and the grain turns into stripes, so the seed is folded into [0, 256) on each axis.
 */
export function grainOffset(seed) {
  const s = Math.abs(Math.trunc(seed));
  return [((s * 37) % 251) + 0.31, ((s * 61) % 241) + 0.73];
}

/**
 * createFilmGrade({THREE, renderer, width, height, levels})
 *   .render(sourceTarget, look, {seed, target}) draws the graded frame to target (null = canvas).
 */
export function createFilmGrade({THREE, renderer, width, height, levels = 5}) {
  const opts = {type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false};
  const mips = [];
  for (let i = 0, w = width, h = height; i < levels; i++) {
    w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
    mips.push(new THREE.WebGLRenderTarget(w, h, opts));
  }
  const pass = (fragmentShader, uniforms, blending = THREE.NoBlending) => createQuad(THREE, new THREE.ShaderMaterial({
    vertexShader: QUAD_VS, fragmentShader, uniforms, blending, depthTest: false, depthWrite: false, transparent: blending !== THREE.NoBlending,
  }));
  const down = pass(DOWN_FS, {tSrc: {value: null}, uTexel: {value: new THREE.Vector2()}, uThreshold: {value: 0}});
  const up = pass(UP_FS, {tSrc: {value: null}, uTexel: {value: new THREE.Vector2()}}, THREE.AdditiveBlending);
  const v3 = (a) => new THREE.Vector3(...a);
  const grade = pass(GRADE_FS, {
    tColor: {value: null}, tBloom: {value: null}, uExposure: {value: 1}, uBloom: {value: 0}, uVignette: {value: 0},
    uGrain: {value: 0}, uDither: {value: 1}, uSeed: {value: new THREE.Vector2()}, uRoll: {value: 1}, uSat: {value: 1}, uContrast: {value: 1}, uFade: {value: 1},
    uPeak: {value: 1}, uAspect: {value: width / height}, uWB: {value: v3([1, 1, 1])},
    uShadowTint: {value: v3([1, 1, 1])}, uMidTint: {value: v3([1, 1, 1])}, uHighTint: {value: v3([1, 1, 1])},
  });

  function bloom(source, threshold) {
    const autoClear = renderer.autoClear;
    renderer.autoClear = true;
    let prev = source;
    mips.forEach((mip, i) => {
      down.material.uniforms.tSrc.value = prev.texture;
      down.material.uniforms.uTexel.value.set(1 / prev.width, 1 / prev.height);
      down.material.uniforms.uThreshold.value = i === 0 ? threshold : 0;
      renderer.setRenderTarget(mip); renderer.render(down.scene, down.camera);
      prev = mip;
    });
    renderer.autoClear = false;
    for (let i = mips.length - 1; i > 0; i--) {
      up.material.uniforms.tSrc.value = mips[i].texture;
      up.material.uniforms.uTexel.value.set(1 / mips[i].width, 1 / mips[i].height);
      renderer.setRenderTarget(mips[i - 1]); renderer.render(up.scene, up.camera);
    }
    renderer.autoClear = autoClear;
    return mips[0];
  }

  function render(source, look = {}, {seed = 0, target = null} = {}) {
    const L = {...DEFAULT_LOOK, ...look};
    const previous = renderer.getRenderTarget();
    const glow = bloom(source, L.bloomThreshold);
    const u = grade.material.uniforms;
    u.tColor.value = source.texture; u.tBloom.value = glow.texture;
    u.uExposure.value = L.exposure; u.uBloom.value = L.bloom / levels; u.uVignette.value = L.vignette;
    u.uGrain.value = L.grain; u.uDither.value = L.dither ? 1 : 0; u.uSeed.value.set(...grainOffset(seed));
    u.uRoll.value = L.highlightRolloff;
    u.uSat.value = L.saturation; u.uContrast.value = L.contrast; u.uFade.value = L.fade; u.uPeak.value = L.peak;
    u.uWB.value.set(...L.whiteBalance); u.uShadowTint.value.set(...L.shadowTint);
    u.uMidTint.value.set(...L.midTint); u.uHighTint.value.set(...L.highTint);
    renderer.setRenderTarget(target); renderer.render(grade.scene, grade.camera);
    renderer.setRenderTarget(previous);
  }

  return {render, dispose() { mips.forEach((m) => m.dispose()); }};
}
