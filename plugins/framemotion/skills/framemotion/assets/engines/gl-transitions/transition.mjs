// gl-transitions as a FrameMotion engine: one shader from shaders/ (unchanged copies of
// gl-transitions/gl-transitions, MIT, two shaders BSD; authors in each file's header) between
// two pictures, drawn as a pure function of time. Our wrapper code is FrameCore Works (Apache-2.0).
//
// A shader's settings are its `uniform T name; // = default` lines. The wrapper turns each one
// into a constant with the default or the value passed in `settings`, so every frame is exact.
import {defineEngine} from '../kit/engine-kit.mjs';

const UNIFORM = /^\s*uniform\s+(bool|int|float|vec2|vec3|vec4|ivec2|ivec3|ivec4)\s+(\w+)\s*;?\s*(?:\/\/\s*=\s*(.+?)\s*;?\s*$|\/\*\s*=\s*(.+?)\s*\*\/\s*;?\s*$)/;
const SAMPLER = /^\s*uniform\s+sampler2D\s+(\w+)/m;

/** The settings a shader declares: {name: {type, default}} in source order. */
export function shaderSettings(source) {
  const out = {};
  for (const line of source.split('\n')) {
    const m = line.match(UNIFORM);
    if (m) out[m[2]] = {type: m[1], default: (m[3] ?? m[4]).replace(/;$/, '').trim()};
  }
  return out;
}

/** A GLSL literal of `type` for a JSON value (number, boolean or array). */
export function glslValue(type, value) {
  if (typeof value === 'string') return value;
  const num = (v, int) => {
    if (!Number.isFinite(v)) throw new TypeError(`setting values must be finite numbers, got ${v}`);
    return int ? String(Math.round(v)) : (Number.isInteger(v) ? `${v}.0` : String(v));
  };
  if (type === 'bool') return value ? 'true' : 'false';
  if (type === 'int') return num(value, true);
  if (type === 'float') return num(value, false);
  const int = type.startsWith('i');
  const n = Number(type.at(-1));
  const list = Array.isArray(value) ? value : Array(n).fill(value);
  if (list.length !== n) throw new RangeError(`${type} needs ${n} values`);
  return `${type}(${list.map((v) => num(v, int)).join(', ')})`;
}

/**
 * A default as a GLSL constant of its type. The upstream player sets uniforms from JavaScript, so a
 * file may write `float x; // = 1`; a constant needs `1.0`, so plain numbers are retyped.
 */
export function defaultLiteral(type, literal) {
  if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(literal)) return glslValue(type, Number(literal));
  return literal;
}

/** The full fragment shader: the gl-transitions wrapper around an unchanged transition source. */
export function buildFragment(source, settings = {}) {
  if (SAMPLER.test(source)) throw new Error('This transition needs an extra texture (a displacement or luma map); it is not supported yet.');
  const declared = shaderSettings(source);
  for (const key of Object.keys(settings)) {
    if (!declared[key]) throw new RangeError(`unknown setting "${key}" (known: ${Object.keys(declared).join(', ') || 'none'})`);
  }
  const body = source.split('\n').map((line) => {
    const m = line.match(UNIFORM);
    if (!m) return line;
    const value = Object.hasOwn(settings, m[2]) ? glslValue(m[1], settings[m[2]]) : defaultLiteral(m[1], (m[3] ?? m[4]).replace(/;$/, '').trim());
    return `const ${m[1]} ${m[2]} = ${value};`;
  }).join('\n');
  return `precision highp float;
uniform sampler2D uFrom, uTo;
uniform float progress, ratio;
varying vec2 vUv;
vec4 getFromColor(vec2 uv) { return texture2D(uFrom, uv); }
vec4 getToColor(vec2 uv) { return texture2D(uTo, uv); }
${body}
void main() { gl_FragColor = transition(vUv); }`;
}

const VERTEX = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }';
const easings = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
};

/** Two built-in pictures, drawn in code, so the engine needs no files: warm discs and cool bands. */
export function drawDefaultPicture(canvas, which) {
  const g = canvas.getContext('2d');
  const {width: w, height: h} = canvas;
  const grad = g.createLinearGradient(0, 0, w, h);
  if (which === 'from') {
    grad.addColorStop(0, '#f2a65a'); grad.addColorStop(1, '#a8323e');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255, 244, 228, 0.85)';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * (0.2 + 0.15 * i), h * (0.35 + 0.08 * (i % 2)), Math.min(w, h) * (0.05 + 0.02 * i), 0, Math.PI * 2); g.fill(); }
  } else {
    grad.addColorStop(0, '#1f4e79'); grad.addColorStop(1, '#5ec4b6');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(232, 248, 255, 0.8)';
    for (let i = 0; i < 6; i++) g.fillRect(0, h * (0.12 + 0.13 * i), w * (0.35 + 0.1 * i), h * 0.045);
  }
  return canvas;
}

/**
 * createTransition({canvas, transition, source, settings, width, height, fps, hold, length, ease, from, to})
 * Holds the first picture for `hold` seconds, runs the transition over `length` seconds, holds the second.
 */
export function createTransition({canvas, transition, source, settings = {}, width = 1080, height = 1920, fps = 30,
  hold = 0.25, length = 1, ease = 'inOut', from, to}) {
  if (!easings[ease]) throw new RangeError(`ease must be one of ${Object.keys(easings).join(', ')}`);
  canvas.width = width; canvas.height = height;
  const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false});
  if (!gl) throw new Error('WebGL is not available');
  const compile = (type, text) => {
    const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`${transition}: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, buildFragment(source, settings)));
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`${transition}: ${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const texture = (unit, image) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  };
  texture(0, from); texture(1, to);
  gl.uniform1i(gl.getUniformLocation(program, 'uFrom'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'uTo'), 1);
  gl.uniform1f(gl.getUniformLocation(program, 'ratio'), width / height);
  const uProgress = gl.getUniformLocation(program, 'progress');
  const duration = hold * 2 + length;
  const progressAt = (t) => easings[ease](Math.min(1, Math.max(0, (t - hold) / length)));
  const engine = defineEngine({
    id: 'gl-transition', width, height, fps, duration,
    seek(t) {
      gl.viewport(0, 0, width, height);
      gl.uniform1f(uProgress, progressAt(t));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.finish();
    },
  });
  return {engine, canvas, progressAt};
}
