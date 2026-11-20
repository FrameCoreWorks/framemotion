// The bundled anidoodle engine through FrameMotion's builder: a bad or missing film stops the build, a three.js
// film is refused, the user's own folder is looked up first, and a frame is a function of its number in any order.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {BUILDERS} from '../skills/framemotion/assets/engines/kit/builders.mjs';

const ENGINES = path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines');
const entries = JSON.parse(fs.readFileSync(path.join(ENGINES, 'engines.json'), 'utf8')).engines;
const hasEsbuild = fs.existsSync(path.join(ENGINES, 'node_modules/esbuild/package.json'));
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const buildSkip = hasEsbuild ? false : 'engines: npm ci in assets/engines first';
const browserSkip = buildSkip || (playwright ? false : 'engines: Playwright is not installed');
const embroidery = entries.find((e) => e.id === 'ad-embroidery');

test('the build refuses a bad, missing or three.js film and bundles one offline page', {skip: buildSkip}, async () => {
  await assert.rejects(BUILDERS.anidoodle({...embroidery, build: {tool: 'anidoodle', film: '../x'}}, ENGINES), /export name/);
  await assert.rejects(BUILDERS.anidoodle({...embroidery, build: {tool: 'anidoodle', film: 'noSuchFilm'}}, ENGINES), /no film/);
  const own = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-ad-own-'));
  try {
    fs.mkdirSync(path.join(own, 'canvas-core'));
    fs.writeFileSync(path.join(own, 'canvas-core/needsThree.ts'), 'import * as THREE from "three";\nexport const needsThree = THREE;\n');
    await assert.rejects(BUILDERS.anidoodle({...embroidery, build: {tool: 'anidoodle', film: 'needsThree', folder: own}}, ENGINES), /three\.js/);
  } finally { fs.rmSync(own, {recursive: true, force: true}); }
  const built = await BUILDERS.anidoodle(embroidery, ENGINES);
  try {
    const html = fs.readFileSync(path.join(built.dir, built.page), 'utf8');
    assert.match(html, /<canvas id="film">/);
    assert.match(html, /window\.renderFrame = async/);
    assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)/);
    assert.deepEqual(built.query, {adapter: 'framemotion'});
  } finally { fs.rmSync(built.dir, {recursive: true, force: true}); }
});

test('ad-embroidery: a frame does not depend on the frames drawn before it', {skip: browserSkip, timeout: 900000}, async () => {
  const seen = new Map();
  for (const frames of [[400, 60, 250], [250, 400, 60], [250]]) {
    const r = await kit.renderFrames('ad-embroidery', {frames, once: true});
    assert.deepEqual(r.blocked, []);
    for (const f of r.frames) {
      assert.ok(!f.flat, `frame ${f.frame} is flat`);
      if (seen.has(f.frame)) assert.equal(f.hash, seen.get(f.frame), `frame ${f.frame} after ${frames.join(', ')}`);
      else seen.set(f.frame, f.hash);
    }
  }
});
