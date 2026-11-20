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
  // Timing and tone: the render opens at the style's first mark, `length` fits the drawing, tone multiplies.
  const crayon = kit.resolveStyle(engine, {style: 'crayon'}, ENGINES, '');
  assert.ok(crayon.build.from > 0 && crayon.build.rate === 1 && crayon.duration === 15 - crayon.build.from);
  const reel = kit.resolveStyle(engine, {style: 'crayon', length: 6, from: 1}, ENGINES, '');
  assert.equal(reel.duration, 6);
  assert.equal(reel.build.rate, (15 - crayon.build.from - 1) / 6);
  assert.equal(kit.resolveStyle(engine, {style: 'crayon', blank_start: true}, ENGINES, '').build.from, 0);
  assert.throws(() => kit.resolveStyle(engine, {style: 'crayon', from: 30}, ENGINES, ''), /nothing is left/);
  assert.equal(kit.resolveStyle(engine, {style: 'oil', brightness: 1.2}, ENGINES, '').build.brightness, 1.25 * 1.2);
  // A user's own styles file (FRAMEMOTION_STYLES) adds rows; its folder is read from that file's folder.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-styles-'));
  try {
    const file = path.join(dir, 'styles.json');
    fs.writeFileSync(file, JSON.stringify({styles: {'my-style': {film: 'myFilm', folder: '.', size: {width: 1080, height: 1920}, fps: 30, duration: 4}}}));
    const mine = kit.resolveStyle(engine, {style: 'my-style'}, ENGINES, file);
    assert.deepEqual([mine.build.film, mine.build.folder, mine.size.height], ['myFilm', dir, 1920]);
    assert.equal(kit.resolveStyle(engine, {style: 'folk-tale'}, ENGINES, file).build.film, 'folkTale');
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
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
    // Frame 0 already shows the start of the line (no blank first frame).
    const first = await page.evaluate(async () => { await window.renderFrame(0); const c = document.getElementById('frame'); return Array.from(c.getContext('2d').getImageData(548, 238, 1, 1).data); });
    assert.ok(first[0] > 150 && first[1] < 120, `frame 0 should show red line, got ${first}`);
    const out = await page.evaluate(async () => { await window.renderFrame(4); const c = document.getElementById('frame'); return {w: c.width, title: window.FILM.meta.title, px: Array.from(c.getContext('2d').getImageData(540, 540, 1, 1).data)}; });
    assert.equal(out.w, 1080);
    assert.match(out.title, /FrameMotion example/);
    assert.deepEqual(out.px.slice(0, 3), [0x1f, 0x3a, 0x5f]);
    fs.rmSync(again.dir, {recursive: true, force: true});
  } finally { await browser.close(); }
});

test('the motif style draws the user\'s own SVG by hand, and the file stays data', {skip: browserSkip, timeout: 300000}, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-motif-'));
  const svg = path.join(dir, 'logo.svg');
  fs.writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="window.__xss=1"><rect x="10" y="10" width="80" height="80" fill="#e4572e"/><script>window.__xss=2</script></svg>');
  const motif = kit.resolveStyle(engine, {style: 'motif'}, ENGINES, '');
  assert.equal(motif.build.film, 'motifDraw');
  await assert.rejects(BUILDERS.anidoodle(motif, ENGINES, {}), /needs "motif"/);
  await assert.rejects(BUILDERS.anidoodle(motif, ENGINES, {motif: path.join(dir, 'a.gif')}), /not found/);
  const built = await BUILDERS.anidoodle(motif, ENGINES, {motif: svg, medium: 'marker'});
  const {chromium} = await kit.loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport: {width: 540, height: 540}});
    await page.goto('file://' + path.join(built.dir, built.page) + '?adapter=framemotion');
    const out = await page.evaluate(async () => {
      const g = document.getElementById('frame').getContext('2d');
      await window.renderFrame(0); const first = Array.from(g.getImageData(540, 540, 1, 1).data);
      await window.renderFrame(7.9); const last = Array.from(g.getImageData(540, 540, 1, 1).data);
      return {first, last, xss: window.__xss ?? null};
    });
    assert.equal(out.xss, null);
    assert.ok(out.first[0] > 240 && out.first[1] > 240, `frame 0 is paper in the middle, got ${out.first}`);
    assert.ok(out.last[0] > 180 && out.last[1] < 130, `the end is coloured in, got ${out.last}`);
  } finally { await browser.close(); fs.rmSync(built.dir, {recursive: true, force: true}); fs.rmSync(dir, {recursive: true, force: true}); }
});

// FrameCore logo check on the Mac (2026-11-20): a black fill was read as "none" ("rgb(0, 0, 0)" ends in ", 0)")
// and chalk turned its hex line colour into NaN, so a black logo showed outlines only and vanished on the board.
test('motif: a black fill is coloured in, and on chalk it is lifted to show on the board', {skip: browserSkip, timeout: 300000}, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-motif-black-'));
  const svg = path.join(dir, 'black.svg');
  fs.writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#000000"/></svg>');
  const motif = kit.resolveStyle(engine, {style: 'motif'}, ENGINES, '');
  const {chromium} = await kit.loadPlaywright();
  const centre = async (medium) => {
    const built = await BUILDERS.anidoodle(motif, ENGINES, {motif: svg, medium});
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({viewport: {width: 540, height: 540}});
      await page.goto('file://' + path.join(built.dir, built.page) + '?adapter=framemotion');
      return await page.evaluate(async () => {
        const g = document.getElementById('frame').getContext('2d');
        await window.renderFrame(7.9);
        const d = g.getImageData(440, 440, 200, 200).data; let sum = 0;
        for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
        return sum / (d.length / 4);
      });
    } finally { await browser.close(); fs.rmSync(built.dir, {recursive: true, force: true}); }
  };
  try {
    const marker = await centre('marker');
    assert.ok(marker < 110, `a black square in marker is filled dark, mean ${marker}`);
    const chalk = await centre('chalk');
    assert.ok(chalk > 75, `a black square on the chalk board is lifted above the board (about 45), mean ${chalk}`);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
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

// A scene from words (2026-11-20): a layered SVG drawn in any of the 32 styles, at the frame size asked for.
const SCENE = path.resolve(import.meta.dirname, '../skills/framemotion/assets/anidoodle-engine/scene/examples/cat-on-roof.svg');
test('scene: any style draws the scene film at the size asked for; motif and unknown looks are refused', () => {
  const s = kit.resolveStyle(engine, {style: 'woodblock', scene: SCENE, width: 1080, height: 1920, length: 6}, ENGINES, '');
  assert.equal(s.build.film, 'sceneDraw');
  assert.equal(s.build.sceneStyle, 'woodblock');
  assert.deepEqual(s.size, {width: 1080, height: 1920});
  assert.equal(s.duration, 6);
  assert.throws(() => kit.resolveStyle(engine, {style: 'motif', scene: SCENE}, ENGINES, ''), /not in "motif"/);
  assert.throws(() => kit.resolveStyle(engine, {style: 'own-example', scene: SCENE}, ENGINES, ''), /no scene look|no style/);
});

test('scene: drawn thing after thing, the same frame in any order, the file stays data', {skip: browserSkip, timeout: 900000}, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-scene-'));
  const svg = path.join(dir, 'scene.svg');
  fs.writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="window.__xss=1"><rect width="100" height="100" fill="#1b2a4a"/><circle cx="50" cy="50" r="25" fill="#f2d24b"/><script>window.__xss=2</script></svg>');
  try {
    for (const style of ['crayon', 'woodblock', 'stipple', 'pixel-art', 'embroidery']) {
      const seen = new Map();
      for (const frames of [[150], [280, 150]]) {
        const r = await kit.renderFrames('anidoodle', {frames, once: true, params: {style, scene: svg}});
        assert.deepEqual(r.blocked, []);
        for (const f of r.frames) {
          if (seen.has(f.frame)) assert.equal(f.hash, seen.get(f.frame), `${style}: frame ${f.frame} after ${frames.join(', ')}`);
          else seen.set(f.frame, f.hash);
          assert.ok(!f.flat, `${style}: frame ${f.frame} is not empty`);
        }
      }
    }
    const e = kit.resolveStyle(engine, {style: 'flat-vector', scene: svg}, ENGINES, '');
    const built = await BUILDERS.anidoodle(e, ENGINES, {style: 'flat-vector', scene: svg});
    const {chromium} = await kit.loadPlaywright();
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({viewport: {width: 540, height: 540}});
      await page.goto('file://' + path.join(built.dir, built.page) + '?adapter=framemotion');
      const out = await page.evaluate(async () => {
        const g = document.getElementById('frame').getContext('2d');
        await window.renderFrame(9.5); return {mid: Array.from(g.getImageData(540, 540, 1, 1).data), corner: Array.from(g.getImageData(40, 40, 1, 1).data), xss: window.__xss ?? null};
      });
      assert.equal(out.xss, null);
      assert.ok(out.mid[0] > 200 && out.mid[2] < 120, `the yellow circle is in the middle at the end, got ${out.mid}`);
      assert.ok(out.corner[2] > out.corner[0], `the dark blue backdrop is in the corner, got ${out.corner}`);
    } finally { await browser.close(); fs.rmSync(built.dir, {recursive: true, force: true}); }
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
