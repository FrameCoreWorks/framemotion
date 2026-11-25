// Reanimate engine page: it renders deterministic frames through the engine kit, takes a `screen`
// for reels and refuses one with the wrong proportions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/index.mjs';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }

test('the engine page renders deterministic frames for several examples', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 300000}, async () => {
  assert.equal(Object.keys(EXAMPLES).length, 136);
  for (const example of ['drawCircle', 'spriteZ', 'chainT']) {
    const r = await kit.renderFrames('reanimate', {params: {width: 320, height: 180, example}, frames: [10, 25, 40]});
    assert.ok(r.frames.every((f) => f.deterministic && !f.flat), example);
    assert.notEqual(r.frames[0].hash, r.frames[2].hash, `${example} moves`);
  }
});

test('the engine page draws reels and refuses a stretched screen', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 120000}, async () => {
  const reel = await kit.renderFrames('reanimate', {params: {width: 180, height: 320, example: 'drawCircle'}, frames: [30]});
  assert.ok(reel.frames.every((f) => f.deterministic && !f.flat));
  const given = await kit.renderFrames('reanimate', {params: {width: 180, height: 320, screen: [9, 16], example: 'drawCircle'}, frames: [30]});
  assert.equal(given.frames[0].hash, reel.frames[0].hash, 'the default reel screen is [9, 16]');
  await assert.rejects(kit.renderFrames('reanimate', {params: {width: 180, height: 320, screen: [16, 9], example: 'drawCircle'}, frames: [30]}));
  await assert.rejects(kit.renderFrames('reanimate', {params: {width: 320, height: 180, example: 'constructor'}, frames: [0]}));
});

test('the engine page draws LaTeX text as glyph outlines with MathJax', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 120000}, async () => {
  const {page, close} = await kit.openEngine('reanimate', {params: {width: 320, height: 180, example: 'oDraw'}});
  try {
    const svg = await page.evaluate(() => { window.__framemotion.engine.seek(2); return document.querySelector('#stage').innerHTML; });
    assert.ok(!svg.includes('<text'), 'no fallback text');
    assert.ok((svg.match(/<path /g) ?? []).length >= 5, 'one outline per glyph of "oDraw"');
  } finally { await close(); }
  const r = await kit.renderFrames('reanimate', {params: {width: 320, height: 180, example: 'latexAlign'}, frames: [0]});
  assert.ok(r.frames.every((f) => f.deterministic && !f.flat));
});

test('on the page, TeX examples have glyph-by-glyph durations and TeX problems throw', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 120000}, async () => {
  const {page, close} = await kit.openEngine('reanimate', {params: {width: 320, height: 180, example: 'latex'}});
  try {
    const r = await page.evaluate(async () => {
      const {EXAMPLES: ex} = await import('./examples/index.mjs');
      const R = await import('./core/index.mjs');
      const err = (f) => { try { f(); return null; } catch (e) { return e.message; } };
      const durations = Object.fromEntries(['oDraw', 'oGrow', 'oHideWith', 'oScaleIn', 'oScaleOut', 'latex', 'latexAlign']
        .map((k) => [k, ex[k]().duration]));
      return {
        durations,
        accents: R.renderSvg(R.latex('źródło'.replace('ł', 'l'))).match(/<path /g).length,
        missing: err(() => R.latex('zażółć')),
        brace: err(() => R.math('\\frac{1}{')),
        undefinedCommand: err(() => R.math('\\foo x')),
        tag: err(() => R.latexAlign('x &= 1 \\tag{1}')),
      };
    });
    assert.deepEqual(r.durations, {oDraw: 3.8, oGrow: 3, oHideWith: 1, oScaleIn: 3.3, oScaleOut: 2.4, latex: 1, latexAlign: 1});
    assert.equal(r.accents, 8, 'six letters and the accents of ź and ó');
    assert.match(r.missing, /no glyph for "ł"/);
    assert.match(r.brace, /Missing close brace/);
    assert.match(r.undefinedCommand, /Undefined control sequence/);
    assert.match(r.tag, /tags/);
  } finally { await close(); }
});

test('the engine page draws a map projection as a still image, also in a reel', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 120000}, async () => {
  const wide = await kit.renderFrames('reanimate', {params: {width: 320, height: 180, example: 'mollweideP'}, frames: [0, 20]});
  assert.ok(wide.frames.every((f) => f.deterministic && !f.flat));
  assert.equal(wide.frames[0].hash, wide.frames[1].hash, 'a still');
  const reel = await kit.renderFrames('reanimate', {params: {width: 180, height: 320, example: 'orthoP'}, frames: [0]});
  assert.ok(reel.frames.every((f) => f.deterministic && !f.flat));
  // In a 180 x 320 reel the 16 x 9 map is fitted whole: full width, 9/16 of it high, centred.
  const {page, close} = await kit.openEngine('reanimate', {params: {width: 180, height: 320, example: 'equirectangularP'}});
  try {
    const box = await page.evaluate(() => {
      window.__framemotion.engine.seek(0);
      const stage = document.querySelector('#stage').getBoundingClientRect();
      const r = document.querySelector('#stage image').getBoundingClientRect();
      return {x: r.x - stage.x, y: r.y - stage.y, w: r.width, h: r.height};
    });
    assert.ok(Math.abs(box.x) < 0.5 && Math.abs(box.w - 180) < 0.5, `full width: ${JSON.stringify(box)}`);
    assert.ok(Math.abs(box.h - 180 * 9 / 16) < 0.5 && Math.abs(box.y - (320 - box.h) / 2) < 0.5, `centred: ${JSON.stringify(box)}`);
  } finally { await close(); }
});
