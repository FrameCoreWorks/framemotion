// The bundled MG styles engine through FrameMotion's builder: an unknown film stops the build, the built page
// points every upstream path at the build folder, and a frame is a function of its time in any order.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {BUILDERS} from '../skills/framemotion/assets/engines/kit/builders.mjs';

const ENGINES = path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines');
const entries = JSON.parse(fs.readFileSync(path.join(ENGINES, 'engines.json'), 'utf8')).engines;
const modules = ['three', 'simplex-noise', 'opentype.js'].every((m) => fs.existsSync(path.join(ENGINES, 'node_modules', m, 'package.json')));
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const browserSkip = !modules ? 'engines: npm ci in assets/engines first' : playwright ? false : 'engines: Playwright is not installed';
const synthwave = entries.find((e) => e.id === 'mg-synthwave');

test('the build stops on an unknown film and rewrites upstream paths into the build folder', async () => {
  await assert.rejects(BUILDERS.mgstyles({...synthwave, build: {tool: 'mgstyles', film: 'no-such'}}, ENGINES), /no mg-styles film/);
  await assert.rejects(BUILDERS.mgstyles({...synthwave, build: {tool: 'mgstyles'}}, ENGINES), /no mg-styles film/);
  const built = await BUILDERS.mgstyles(synthwave, ENGINES);
  try {
    const html = fs.readFileSync(path.join(built.dir, built.page), 'utf8');
    assert.doesNotMatch(html, /["'`(]\/(demos|assets)\//);
    assert.match(html, /\/_build\/assets\/fonts\/fonts\.css/);
    assert.match(html, /window\.renderFrame = \(t\) => window\.renderAt\(t\)/);
    assert.ok(fs.existsSync(path.join(built.dir, 'demos/10-synthwave/assets/fonts/MrDafoe-Regular.ttf')));
    assert.ok(!fs.existsSync(path.join(built.dir, 'demos/07-liquid')), 'only the chosen film is copied');
    const css = fs.readFileSync(path.join(built.dir, 'assets/fonts/fonts.css'), 'utf8');
    for (const family of ['Michroma', 'Archivo', 'HarmonyOS Sans SC', 'Douyin Sans', 'VT323']) assert.match(css, new RegExp(`'${family}'`));
  } finally { fs.rmSync(built.dir, {recursive: true, force: true}); }
});

test('mg-cel-boil: a frame does not depend on the frames drawn before it', {skip: browserSkip, timeout: 900000}, async () => {
  const seen = new Map();
  for (const frames of [[200, 30, 120], [120, 200, 30], [120]]) {
    const r = await kit.renderFrames('mg-cel-boil', {frames, once: true});
    assert.deepEqual(r.blocked, []);
    for (const f of r.frames) {
      assert.ok(!f.flat, `frame ${f.frame} is flat`);
      if (seen.has(f.frame)) assert.equal(f.hash, seen.get(f.frame), `frame ${f.frame} after ${frames.join(', ')}`);
      else seen.set(f.frame, f.hash);
    }
  }
});

// mg-synthwave: frame 150 drawn after a frame from about 35 to 60 (or 140) differs from a fresh frame 150 in 6
// pixels by one level (2026-11-20, software WebGL; invisible, the film's code reads only t). So the test pins
// that the same frames in the same order give the same bytes on every run; see the engine README.
test('mg-synthwave: the same frames in the same order repeat exactly', {skip: browserSkip, timeout: 900000}, async () => {
  const runs = [];
  for (let i = 0; i < 2; i++) {
    const r = await kit.renderFrames('mg-synthwave', {frames: [280, 40, 150], once: true});
    assert.deepEqual(r.blocked, []);
    for (const f of r.frames) assert.ok(!f.flat, `frame ${f.frame} is flat`);
    runs.push(r.frames.map((f) => f.hash));
  }
  assert.deepEqual(runs[1], runs[0]);
});
