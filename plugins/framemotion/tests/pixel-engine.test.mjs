// The bundled Pixel engine through FrameMotion's builder: a frame is a pure function of its time, an unknown
// effect stops at once, and the effect is scaled up with whole pixels.
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

test('an unknown or malformed effect id stops the build', async () => {
  const base = entries.find((e) => e.id === 'pixel-torch');
  for (const fx of ['fire/no-such-effect', '../fire/torch', 'fire']) {
    await assert.rejects(BUILDERS.pixel({...base, build: {tool: 'pixel', fx}}, ENGINES), /unknown pixelfx effect/);
  }
});

test('a text option with a letter the pixel fonts lack stops the build', async () => {
  const base = entries.find((e) => e.id === 'pixel-level-up');
  await assert.rejects(BUILDERS.pixel({...base, build: {tool: 'pixel', fx: 'ui/level-up', options: {text: 'POZIOM WYŻEJ'}}}, ENGINES),
    /no "Ż" for options\.text/);
  const built = await BUILDERS.pixel({...base, build: {tool: 'pixel', fx: 'ui/level-up', options: {text: 'Poziom 2!', palette: ['#102', '#fff']}}}, ENGINES);
  fs.rmSync(built.dir, {recursive: true, force: true});
});

for (const [id, frames] of [['pixel-torch', [0, 31, 77]], ['pixel-big-explosion', [12, 60, 140]], ['pixel-slash-wipe', [10, 30]], ['pixel-level-up', [5, 40, 100]]]) {
  test(`${id}: a frame does not depend on the frames drawn before it`, {skip: browserSkip, timeout: 300000}, async () => {
    const first = await kit.renderFrames(id, {frames, once: true});
    const back = await kit.renderFrames(id, {frames: [...frames].reverse(), once: true});
    const alone = await kit.renderFrames(id, {frames: [frames[1]], once: true});
    const hash = (r, f) => r.frames.find((x) => x.frame === f).hash;
    for (const f of frames) assert.equal(hash(first, f), hash(back, f), `frame ${f}`);
    assert.equal(hash(alone, frames[1]), hash(first, frames[1]), 'a frame drawn alone');
    assert.deepEqual(first.blocked, []);
  });
}
