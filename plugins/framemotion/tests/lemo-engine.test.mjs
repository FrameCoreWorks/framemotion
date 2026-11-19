// The bundled Lemo engine through FrameMotion's builder: an unknown style stops at once, the build serves the core
// from its own folder, a written film replaces the demo's, and a frame is a pure function of its time (2D and 3D).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {BUILDERS} from '../skills/framemotion/assets/engines/kit/builders.mjs';

const ENGINES = path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines');
const entries = JSON.parse(fs.readFileSync(path.join(ENGINES, 'engines.json'), 'utf8')).engines;
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const browserSkip = playwright ? false : 'engines: Playwright is not installed';
const base = entries.find((e) => e.id === 'lemo-art-deco');

test('an unknown or malformed style stops the build', async () => {
  for (const style of ['no-such-style', '../art-deco', 'Art-Deco', '']) {
    await assert.rejects(BUILDERS.lemo({...base, build: {tool: 'lemo', style}}, ENGINES), /unknown Lemo style/);
  }
});

test('the build serves the core from its own folder and adds the clock bridge', async () => {
  const built = await BUILDERS.lemo(base, ENGINES);
  try {
    const main = fs.readFileSync(path.join(built.dir, 'styles/art-deco/demo/main.js'), 'utf8');
    const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    for (const file of walk(built.dir).filter((f) => /\.(m?js|html|css)$/.test(f))) {
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /["'`(]\/core\//, file);
    }
    assert.ok(main.length > 0);
    const html = fs.readFileSync(path.join(built.dir, built.page), 'utf8');
    assert.match(html, /window\.renderFrameAt = async \(t\) =>/);
    assert.equal(built.page, 'styles/art-deco/demo/index.html');
  } finally { fs.rmSync(built.dir, {recursive: true, force: true}); }
});

test('the build copy drops the authors\' and model\'s credit line from every demo', async () => {
  const styles = fs.readdirSync(path.join(ENGINES, '..', 'lemo-engine', 'styles'));
  for (const style of styles) {
    const built = await BUILDERS.lemo({...base, build: {tool: 'lemo', style}}, ENGINES);
    try {
      const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
      for (const file of walk(built.dir).filter((f) => /\.(m?js|html)$/.test(f))) {
        assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /Claude Opus/, file);
      }
    } finally { fs.rmSync(built.dir, {recursive: true, force: true}); }
  }
});

test('Polish words in a film for a style whose faces lack them stop the build', async () => {
  const film = path.join(fs.mkdtempSync(path.join(ENGINES, '..', '..', '..', '..', 'tests', '.lemo-')), 'film.js');
  fs.writeFileSync(film, 'export const DUR = 2;\nexport const WORDS = "Zażółć gęślą jaźń";\n');
  try {
    await assert.rejects(BUILDERS.lemo({...base, build: {tool: 'lemo', style: 'glass-product', film: path.relative(ENGINES, film)}}, ENGINES), /no face of the glass-product style/);
    const built = await BUILDERS.lemo({...base, build: {tool: 'lemo', style: 'spy-titles', film: path.relative(ENGINES, film)}}, ENGINES);
    fs.rmSync(built.dir, {recursive: true, force: true});
  } finally { fs.rmSync(path.dirname(film), {recursive: true, force: true}); }
});

test('a film written for the style replaces the demo film; a missing one stops the build', async () => {
  const film = path.join(fs.mkdtempSync(path.join(ENGINES, '..', '..', '..', '..', 'tests', '.lemo-')), 'film.js');
  fs.writeFileSync(film, 'export const DUR = 2;\nexport function renderFilm(g, t) { g.fillStyle = "#123"; g.fillRect(0, 0, 1920, 1080); }\n');
  try {
    const built = await BUILDERS.lemo({...base, build: {tool: 'lemo', style: 'art-deco', film: path.relative(ENGINES, film)}}, ENGINES);
    assert.equal(fs.readFileSync(path.join(built.dir, 'styles/art-deco/demo/film.js'), 'utf8'), fs.readFileSync(film, 'utf8'));
    fs.rmSync(built.dir, {recursive: true, force: true});
    await assert.rejects(BUILDERS.lemo({...base, build: {tool: 'lemo', style: 'art-deco', film: 'no/such/film.js'}}, ENGINES), /not found/);
  } finally { fs.rmSync(path.dirname(film), {recursive: true, force: true}); }
});

// Frames the review found order-dependent or different on the first draw (papercut-red 367 and 1102, spy-titles 165 and 992).
for (const [id, frames] of [['lemo-art-deco', [30, 525, 1200]], ['lemo-one-line', [15, 1416, 600]], ['lemo-tilt-shift', [20, 684]],
  ['lemo-papercut-red', [367, 1102, 700]], ['lemo-spy-titles', [165, 992, 600]]]) {
  test(`${id}: a frame does not depend on the frames drawn before it`, {skip: browserSkip || (id === 'lemo-tilt-shift' && process.env.CI ? 'KNOWN-CI-ONLY (owner-approved 2026-11-18): differs on the GitHub runner, passes locally; fix tracked in its own PR. Runs everywhere else.' : false), timeout: 1500000}, async () => {
    const first = await kit.renderFrames(id, {frames, once: true});
    const back = await kit.renderFrames(id, {frames: [...frames].reverse(), once: true});
    const alone = await kit.renderFrames(id, {frames: [frames[1]], once: true});
    const hash = (r, f) => r.frames.find((x) => x.frame === f).hash;
    for (const f of frames) assert.equal(hash(first, f), hash(back, f), `frame ${f}`);
    assert.equal(hash(alone, frames[1]), hash(first, frames[1]), 'a frame drawn alone');
    assert.deepEqual(first.blocked, []);
  });
}
