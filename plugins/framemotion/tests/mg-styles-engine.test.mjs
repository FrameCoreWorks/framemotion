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

// mg-synthwave and mg-aurora-glass had frames that depended on the frames drawn before them; the builder's
// MG_FIXES remove both causes (2026-11-20), so they get the ordinary any-order test.
for (const [id, orders] of [['mg-synthwave', [[40, 150], [140, 150], [280, 40, 150], [150]]], ['mg-aurora-glass', [[60, 120], [240, 120], [120]]],
  ['mg-morph', [[200, 90], [90]]], ['mg-line-art', [[200, 90], [90]]], ['mg-pixel', [[200, 90], [90]]], ['mg-flat-vector', [[200, 90], [90]]]]) {
  test(`${id}: a frame does not depend on the frames drawn before it`, {skip: browserSkip, timeout: 900000}, async () => {
    const seen = new Map();
    for (const frames of orders) {
      const r = await kit.renderFrames(id, {frames, once: true});
      assert.deepEqual(r.blocked, []);
      for (const f of r.frames) {
        assert.ok(!f.flat, `frame ${f.frame} is flat`);
        if (seen.has(f.frame)) assert.equal(f.hash, seen.get(f.frame), `frame ${f.frame} after ${frames.join(', ')}`);
        else seen.set(f.frame, f.hash);
      }
    }
  });
}

test('mg-synthwave: replace swaps a sample text, and an unknown one stops the build', async () => {
  const synth = entries.find((e) => e.id === 'mg-synthwave');
  const built = await BUILDERS.mgstyles(synth, ENGINES, {replace: {'NEON DRIVE': 'ZAŻÓŁĆ'}});
  try {
    const html = fs.readFileSync(path.join(built.dir, 'demos/10-synthwave/index.html'), 'utf8');
    assert.match(html, /'ZAŻÓŁĆ'/);
    assert.doesNotMatch(html, /'NEON DRIVE'/);
    assert.match(html, /renderer\.clear\(\); renderer\.render\(new THREE\.Scene\(\), ocam\);/);
  } finally { fs.rmSync(built.dir, {recursive: true, force: true}); }
  await assert.rejects(BUILDERS.mgstyles(synth, ENGINES, {replace: {'NO SUCH TEXT': 'x'}}), /no sample text "NO SUCH TEXT"/);
});

test('every default replacement in the registry still matches its film', async () => {
  for (const e of entries.filter((x) => x.build?.tool === 'mgstyles' && x.build.replace)) {
    const built = await BUILDERS.mgstyles(e, ENGINES);
    fs.rmSync(built.dir, {recursive: true, force: true});
  }
});

test('an engine renders its ways with the setting "way"', () => {
  const all = JSON.parse(fs.readFileSync(path.join(path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines'), 'engines.json'), 'utf8')).engines;
  const {entry, params} = kit.resolveWay(all, 'launch-pixel', {way: 'mg-pixel', width: 540});
  assert.equal(entry.id, 'mg-pixel');
  assert.deepEqual(params, {width: 540});
  assert.equal(kit.resolveWay(all, 'launch-pixel', {way: 'default'}).entry.id, 'launch-pixel');
  assert.equal(kit.resolveWay(all, 'launch-pixel', {}).entry.id, 'launch-pixel');
  assert.throws(() => kit.resolveWay(all, 'launch-pixel', {way: 'mg-hud'}), /no way "mg-hud"/);
  for (const way of all.filter((e) => e.method_of)) assert.equal(kit.resolveWay(all, way.method_of, {way: way.id}).entry, way);
});
