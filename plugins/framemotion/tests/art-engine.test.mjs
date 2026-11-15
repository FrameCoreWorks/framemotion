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
