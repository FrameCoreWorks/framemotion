// gl-transitions engine: the unchanged shaders, our wrapper, and every shader compiling in a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {shaderSettings, glslValue, buildFragment, defaultLiteral} from '../skills/framemotion/assets/engines/gl-transitions/transition.mjs';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

const dir = fileURLToPath(new URL('../skills/framemotion/assets/engines/gl-transitions/shaders/', import.meta.url));
const names = fs.readdirSync(dir).filter((f) => f.endsWith('.glsl')).map((f) => f.slice(0, -5)).sort();
const NEEDS_TEXTURE = ['DisplacementMap', 'LumaWipe'];
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }

test('every shader names its author and an allowed licence', () => {
  assert.equal(names.length, 238);
  for (const name of names) {
    const head = fs.readFileSync(path.join(dir, `${name}.glsl`), 'utf8').split('\n').slice(0, 20).join('\n');
    assert.match(head, /\/\/ Author: \S/, name);
    assert.match(head, /\/\/ License: (MIT|BSD 2 Clause|BSD 3 Clause)\b/, name);
  }
});

test('settings are read from the uniform lines and become constants', () => {
  const src = fs.readFileSync(path.join(dir, 'BandWipe.glsl'), 'utf8');
  assert.deepEqual(shaderSettings(src), {bands: {type: 'int', default: '8'}, vertical: {type: 'bool', default: 'false'},
    smoothness: {type: 'float', default: '0.02'}, stagger: {type: 'float', default: '0.1'}});
  const frag = buildFragment(src, {bands: 12, vertical: true});
  assert.match(frag, /const int bands = 12;/);
  assert.match(frag, /const bool vertical = true;/);
  assert.match(frag, /const float smoothness = 0\.02;/);
  assert.doesNotMatch(frag, /uniform int bands/);
  assert.ok(frag.includes(src.split('\n').find((l) => l.startsWith('float bandMask'))), 'the shader body is unchanged');
  assert.throws(() => buildFragment(src, {band: 3}), /unknown setting "band"/);
  assert.equal(glslValue('vec3', [1, 0.5, 0]), 'vec3(1.0, 0.5, 0.0)');
  assert.equal(glslValue('ivec2', [10, 4]), 'ivec2(10, 4)');
  assert.equal(glslValue('float', 2), '2.0');
  assert.throws(() => glslValue('vec2', [1]), RangeError);
  assert.equal(defaultLiteral('float', '1'), '1.0', 'an integer default of a float becomes a float constant');
  assert.equal(defaultLiteral('int', '3'), '3');
  assert.equal(defaultLiteral('vec2', 'vec2(1, 2)'), 'vec2(1, 2)');
  assert.throws(() => glslValue('float', NaN), TypeError);
  for (const name of NEEDS_TEXTURE) assert.throws(() => buildFragment(fs.readFileSync(path.join(dir, `${name}.glsl`), 'utf8')), /extra texture/);
});

test('every shader compiles and draws in the browser', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 600000}, async () => {
  const {page, close} = await kit.openEngine('gl-transition', {params: {width: 64, height: 64}});
  try {
    const failures = await page.evaluate((list) => window.__framemotion.checks.compileAll(list), names);
    assert.deepEqual(failures.map((f) => f.split(':')[0]).sort(), NEEDS_TEXTURE, failures.join('\n'));
  } finally { await close(); }
});

test('a transition renders deterministic frames that start on one picture and end on the other', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 300000}, async () => {
  const base = {width: 108, height: 192};
  const a = await kit.renderFrames('gl-transition', {params: base, frames: [0, 22, 44]});
  assert.ok(a.frames.every((f) => f.deterministic && !f.flat));
  assert.notEqual(a.frames[0].hash, a.frames[2].hash);
  const b = await kit.renderFrames('gl-transition', {params: {...base, transition: 'Fade'}, frames: [0, 22, 44]});
  assert.equal(b.frames[0].hash, a.frames[0].hash, 'every transition starts on the same first picture');
  assert.equal(b.frames[2].hash, a.frames[2].hash, 'and ends on the same second picture');
  assert.notEqual(b.frames[1].hash, a.frames[1].hash, 'the middle differs by transition');
  const c = await kit.renderFrames('gl-transition', {params: {...base, settings: {bands: 3}}, frames: [22]});
  assert.notEqual(c.frames[0].hash, a.frames[1].hash, 'a shader setting changes the picture');
  const long = await kit.renderFrames('gl-transition', {params: {...base, length: 2}, frames: [74]});
  assert.equal(long.engine.duration, 2.5, 'a timing setting retimes the engine');
  await assert.rejects(kit.renderFrames('gl-transition', {params: {...base, transition: 'NoSuchWipe'}, frames: [0]}), /404/);
});

test('settings given as text must be plain GLSL literals', () => {
  assert.throws(() => glslValue('float', '1.0; } void main(){ /*'), TypeError);
  assert.throws(() => glslValue('vec3', 'vec3(sin(1.0), 0.0, 0.0)'), TypeError);
  assert.equal(glslValue('float', '2'), '2.0');
  assert.equal(glslValue('vec4', 'vec4(0.0, 0.5, 1.0, 1.0)'), 'vec4(0.0, 0.5, 1.0, 1.0)');
  assert.equal(glslValue('bool', 'true'), 'true');
  assert.equal(glslValue('float', 1e21), '1e+21', 'a large number stays a valid float literal');
});

test('a default followed by a second comment is read without it', () => {
  const read = (name) => shaderSettings(fs.readFileSync(path.join(dir, `${name}.glsl`), 'utf8'));
  assert.equal(read('FadeColor').colorPhase.default, '0.4');
  assert.equal(read('FadeGrayscale').intensity.default, '0.3');
  for (const name of names) {
    for (const [key, s] of Object.entries(read(name))) assert.doesNotMatch(s.default, /\/\/|;/, `${name}.${key}`);
  }
});
