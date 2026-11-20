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
const engine = entries.find((e) => e.id === 'anidoodle');
const embroidery = kit.resolveStyle(engine, {style: 'embroidery'}, ENGINES);

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
    assert.match(html, /<canvas id="frame">/);
    assert.match(html, /window\.renderFrame = async/);
    assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)/);
    assert.deepEqual(built.query, {adapter: 'framemotion'});
  } finally { fs.rmSync(built.dir, {recursive: true, force: true}); }
});

test('anidoodle embroidery: a frame does not depend on the frames drawn before it', {skip: browserSkip, timeout: 900000}, async () => {
  const seen = new Map();
  for (const frames of [[400, 60, 250], [250, 400, 60], [250]]) {
    const r = await kit.renderFrames('anidoodle', {frames, once: true, params: {style: 'embroidery'}});
    assert.deepEqual(r.blocked, []);
    for (const f of r.frames) {
      assert.ok(!f.flat, `frame ${f.frame} is flat`);
      if (seen.has(f.frame)) assert.equal(f.hash, seen.get(f.frame), `frame ${f.frame} after ${frames.join(', ')}`);
      else seen.set(f.frame, f.hash);
    }
  }
});

test('one anidoodle engine: the setting "style" picks a film and its size, and a new style is one row', () => {
  const folk = kit.resolveStyle(engine, {style: 'folk-tale'}, ENGINES);
  assert.deepEqual([folk.build.film, folk.size.width, folk.size.height], ['folkTale', 1920, 1080]);
  assert.equal(kit.resolveStyle(engine, {}, ENGINES).build.film, 'embroidery');
  assert.throws(() => kit.resolveStyle(engine, {style: 'nope'}, ENGINES), /no style "nope"/);
  const own = kit.resolveStyle(engine, {style: 'own-example'}, ENGINES);
  assert.deepEqual([own.build.film, own.build.folder], ['ownExample', '../anidoodle-engine/examples']);
  assert.equal(entries.filter((e) => e.method_of === 'anidoodle' || e.id.startsWith('ad-')).length, 0);
});

test('a new film in the user\'s own folder builds against the bundled kits and renders', {skip: browserSkip, timeout: 300000}, async () => {
  const folder = path.resolve(ENGINES, '../anidoodle-engine/examples');
  const built = await BUILDERS.anidoodle({...embroidery, build: {tool: 'anidoodle', film: 'ownExample', folder}}, ENGINES);
  fs.rmSync(built.dir, {recursive: true, force: true});
  const {chromium} = await kit.loadPlaywright();
  const browser = await chromium.launch();
  try {
    const again = await BUILDERS.anidoodle({...embroidery, build: {tool: 'anidoodle', film: 'ownExample', folder}}, ENGINES);
    const page = await browser.newPage({viewport: {width: 540, height: 540}});
    await page.goto('file://' + path.join(again.dir, again.page) + '?adapter=framemotion');
    const out = await page.evaluate(async () => { await window.renderFrame(4); const c = document.getElementById('frame'); return {w: c.width, title: window.FILM.meta.title, px: Array.from(c.getContext('2d').getImageData(540, 540, 1, 1).data)}; });
    assert.equal(out.w, 1080);
    assert.match(out.title, /FrameMotion example/);
    assert.deepEqual(out.px.slice(0, 3), [0x1f, 0x3a, 0x5f]);
    fs.rmSync(again.dir, {recursive: true, force: true});
  } finally { await browser.close(); }
});

// The scrapbook style drew frame 200 differently after frame 230 until the builder's AD_FIXES (2026-11-20 review).
test('anidoodle scrapbook: going back to an earlier step gives the same frame', {skip: browserSkip, timeout: 900000}, async () => {
  const seen = new Map();
  for (const frames of [[200], [230, 200], [400, 60, 200]]) {
    const r = await kit.renderFrames('anidoodle', {frames, once: true, params: {style: 'scrapbook'}});
    for (const f of r.frames) {
      if (seen.has(f.frame)) assert.equal(f.hash, seen.get(f.frame), `frame ${f.frame} after ${frames.join(', ')}`);
      else seen.set(f.frame, f.hash);
    }
  }
});

test('a square film fits whole into a 9:16 frame', {skip: browserSkip, timeout: 300000}, async () => {
  const r = await kit.renderFrames('anidoodle', {frames: [400], once: true, params: {style: 'embroidery', width: 1080, height: 1920}});
  assert.deepEqual(r.blocked, []);
  assert.ok(!r.frames[0].flat);
});
