// The bundled Art engine through FrameMotion's builder: Polish words stay whole, faces that are not bundled
// get stand-ins, the gallery leaves out what is not bundled, and frames do not depend on the order they are drawn in.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {BUILDERS} from '../skills/framemotion/assets/engines/kit/builders.mjs';

const ENGINES = path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines');
const LIB = path.resolve(import.meta.dirname, '../skills/framemotion/assets/art-engine/scripts/engine/lib');
const entries = JSON.parse(fs.readFileSync(path.join(ENGINES, 'engines.json'), 'utf8')).engines;
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const browserSkip = playwright ? false : 'engines: Playwright is not installed';

test('a wrapped Polish line breaks between words, never inside one', () => {
  const ctx = {measureText: (s) => ({width: [...s].length * 10}), save() {}, restore() {}, font: ''};
  const window = {};
  const context = vm.createContext({window, U: {clamp: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp: (a, b, t) => a + (b - a) * t}});
  vm.runInContext(fs.readFileSync(path.join(LIB, 'typo.js'), 'utf8'), context);
  const lines = window.TY.wrap(ctx, 'godzin oszczędzonych w miesiącu', 150);
  assert.deepEqual([...lines], ['godzin', 'oszczędzonych w', 'miesiącu']);
  assert.deepEqual([...window.TY.wrap(ctx, '一句话换来的代码', 40)], ['一句话换', '来的代码'], 'Chinese still breaks between characters');
});

test('the builder gives stand-ins to faces that are not bundled and filters the gallery', async () => {
  const built = await BUILDERS.art(entries.find((e) => e.id === 'art-gallery'), ENGINES);
  const html = fs.readFileSync(path.join(built.dir, 'index.html'), 'utf8');
  assert.match(html, /"PuHui-Bold":\["Inter-var\.woff"/);
  assert.equal(built.query.film, 'fm_gallery');
  const list = fs.readFileSync(path.join(built.dir, 'eras_fm_gallery.js'), 'utf8');
  assert.ok(list.includes('01_cave') && !list.includes('25_ghibli'));
  assert.match(html, /window\.SIGNATURE = " "/);
  fs.rmSync(built.dir, {recursive: true, force: true});
});

for (const [id, frames] of [['art-gallery', [200, 500]], ['art-kinetic-type-pl', [30, 200]]]) {
  test(`${id}: a frame does not depend on the frames drawn before it`, {skip: browserSkip, timeout: 300000}, async () => {
    const first = await kit.renderFrames(id, {frames, once: true});
    const back = await kit.renderFrames(id, {frames: [...frames].reverse(), once: true});
    const hash = (r, f) => r.frames.find((x) => x.frame === f).hash;
    for (const f of frames) assert.equal(hash(first, f), hash(back, f), `frame ${f}`);
    assert.deepEqual(first.blocked, []);
  });
}

test('the kinetic clip\'s page turns are listed flat, and the frames around them are not', {skip: browserSkip, timeout: 300000}, async () => {
  const report = await kit.renderFrames('art-kinetic-type-pl', {frames: [74, 75, 128, 129], once: true});
  const flat = Object.fromEntries(report.frames.map((f) => [f.frame, [f.flat, Boolean(f.flatExpected)]]));
  assert.deepEqual(flat, {74: [false, false], 75: [true, true], 128: [true, true], 129: [false, false]});
});

test('the style studies name each painter in English with a bundled face', async () => {
  const built = await BUILDERS.art(entries.find((e) => e.id === 'art-style-studies'), ENGINES);
  const list = fs.readFileSync(path.join(built.dir, 'eras_fm_style_studies.js'), 'utf8');
  assert.ok(list.includes('"乔托":"Giotto"') && list.includes('NotoSansSC'));
  fs.rmSync(built.dir, {recursive: true, force: true});
});

test('a clip copies only the pictures its spec names, also from outside the spec folder', async () => {
  const root = fs.mkdtempSync(path.join(ENGINES, '.tmp-art-'));
  try {
    fs.mkdirSync(path.join(root, 'work/specs'), {recursive: true});
    fs.mkdirSync(path.join(root, 'work/shots'));
    fs.copyFileSync(path.join(LIB, '../examples/assets/营收图_竖屏.png'), path.join(root, 'work/shots/chart.png'));
    fs.writeFileSync(path.join(root, 'work/specs/unrelated.bin'), 'x');
    const spec = JSON.parse(fs.readFileSync(path.join(ENGINES, entries.find((e) => e.id === 'art-keynote-ui').build.clip), 'utf8'));
    spec.cues = [{...spec.cues[0], image: '../shots/chart.png'}, ...spec.cues.slice(1)];
    fs.writeFileSync(path.join(root, 'work/specs/spec.json'), JSON.stringify(spec));
    const entry = {...entries.find((e) => e.id === 'art-keynote-ui'), build: {tool: 'art', clip: path.relative(ENGINES, path.join(root, 'work/specs/spec.json'))}};
    const built = await BUILDERS.art(entry, ENGINES);
    assert.deepEqual(fs.readdirSync(path.join(built.dir, '_spec')), ['0.png']);
    assert.match(fs.readFileSync(path.join(built.dir, 'clip.html'), 'utf8'), /"image":"_spec\/0\.png"/);
    fs.rmSync(built.dir, {recursive: true, force: true});
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
