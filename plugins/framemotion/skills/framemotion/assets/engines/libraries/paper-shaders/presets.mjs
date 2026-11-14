// Settings for four Paper Shaders. The values are the library's own "Default" presets
// (@paper-design/shaders-react 0.0.82, Apache-2.0); the mapping to uniforms follows its React
// components. Only `look` keys listed here are accepted, so a typo fails instead of being ignored.

const OBJECT = {fit: 'contain', scale: 1, rotation: 0, offsetX: 0, offsetY: 0, originX: 0.5, originY: 0.5, worldWidth: 0, worldHeight: 0};
const PATTERN = {...OBJECT, fit: 'none'};

export const PRESETS = {
  'mesh-gradient': {fragment: 'meshGradientFragmentShader', look: {...OBJECT,
    colors: ['#e0eaff', '#241d9a', '#f75092', '#9f50d3'], distortion: 0.8, swirl: 0.1, grainMixer: 0, grainOverlay: 0}},
  'grain-gradient': {fragment: 'grainGradientFragmentShader', noise: true, shapes: 'GrainGradientShapes', look: {...OBJECT,
    colorBack: '#000000', colors: ['#7300ff', '#eba8ff', '#00bfff', '#2a00ff'], softness: 0.5, intensity: 0.5, noise: 0.25, shape: 'corners'}},
  warp: {fragment: 'warpFragmentShader', noise: true, shapes: 'WarpPatterns', look: {...PATTERN,
    colors: ['#121212', '#9470ff', '#121212', '#8838ff'], proportion: 0.45, softness: 1, distortion: 0.25, swirl: 0.8,
    swirlIterations: 10, shapeScale: 0.1, shape: 'checks'}},
  'god-rays': {fragment: 'godRaysFragmentShader', noise: true, look: {...OBJECT, offsetY: -0.55,
    colorBack: '#000000', colorBloom: '#0000ff', colors: ['#a600ff6e', '#6200fff0', '#ffffff', '#33fff5'],
    density: 0.3, spotty: 0.3, midIntensity: 0.4, midSize: 0.2, intensity: 0.8, bloom: 0.4}},
};

/** Turn a look into the shader's uniforms (colours to vec4, named shapes and fit to numbers). */
export function uniformsFor(paper, shader, look) {
  const preset = PRESETS[shader];
  const uniforms = {};
  for (const [key, value] of Object.entries(look)) {
    if (!(key in preset.look)) throw new RangeError(`${shader} has no look setting "${key}"`);
    const name = `u_${key}`;
    if (key === 'fit') uniforms[name] = paper.ShaderFitOptions[value];
    else if (key === 'shape') uniforms[name] = paper[preset.shapes][value];
    else if (key === 'colors') {
      if (!Array.isArray(value) || value.length < 1) throw new TypeError('colors must be a list of colours');
      uniforms.u_colors = value.map(paper.getShaderColorFromString);
      uniforms.u_colorsCount = value.length;
    } else if (key.startsWith('color')) uniforms[name] = paper.getShaderColorFromString(value);
    else uniforms[name] = value;
    if (uniforms[name] === undefined && key !== 'colors') throw new RangeError(`${shader}: bad ${key} "${value}"`);
  }
  if (preset.noise) uniforms.u_noiseTexture = paper.getShaderNoiseTexture();
  return uniforms;
}
