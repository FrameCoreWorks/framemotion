// FrameMotion's Stickman additions: word times from a voice take, reel captions text, and frames that do
// not depend on the order they are drawn in.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

const ENGINE = path.resolve(import.meta.dirname, '../skills/framemotion/assets/stickman-engine');
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const browserSkip = playwright ? false : 'engines: Playwright is not installed';

/** The engine core and FrameMotion's reel.js in a bare context: enough for the voice cues. */
function loadSM() {
  const context = vm.createContext({console});
  context.globalThis = context;
  vm.runInContext(fs.readFileSync(path.join(ENGINE, 'engine/sm-core.js'), 'utf8'), context);
  context.SM.characters = {};
  vm.runInContext(fs.readFileSync(path.join(ENGINE, 'framemotion/reel.js'), 'utf8'), context);
  return context.SM;
}

test('measured word times replace the estimate, in order, with gaps filled', () => {
  const SM = loadSM();
  const vo = new SM.VoCues({vo: 'Zażółć gęślą jaźń, dzisiaj!', voStart: 0.2, voDuration: 2});
  const hits = SM.applyWordTimes(vo, [
    {word: ' Zażółć', start: 0.1, end: 0.5}, {word: 'gęślą', start: 0.6, end: 0.9}, {word: 'dzisiaj', start: 1.6, end: 2.1}]);
  assert.equal(hits, 3);
  assert.ok(Math.abs(vo.cue('gęślą') - 0.8) < 1e-9, 'a cue is the take time plus the voice start');
  assert.ok(Math.abs(vo.cue('dzisiaj') - 1.8) < 1e-9);
  const jazn = vo.cue('jaźń');
  assert.ok(jazn > vo.cue('gęślą') && jazn < vo.cue('dzisiaj'), 'an unmatched word sits between its neighbours');
  const chunks = vo.chunks(2);
  assert.ok(Math.abs(chunks[0].a - 0.3) < 1e-9 && Math.abs(chunks[0].b - 1.1) < 1e-9, 'captions follow the take');
});

test('reel caption text is lowercase, without punctuation or dashes, and keeps digits and Polish letters', () => {
  const SM = loadSM();
  assert.equal(SM.reelCaptionText('ŁÓDŹ — 25% „taniej”, naprawdę!'), 'łódź 25% taniej naprawdę');
});

test('a stickman frame does not depend on the frames drawn before it', {skip: browserSkip, timeout: 240000}, async () => {
  const first = await kit.renderFrames('stickman-reel', {frames: [0, 15, 30, 400], once: true});
  const back = await kit.renderFrames('stickman-reel', {frames: [400, 30, 0], once: true});
  const hash = (r, f) => r.frames.find((x) => x.frame === f).hash;
  for (const f of [0, 30, 400]) assert.equal(hash(first, f), hash(back, f), `frame ${f}`);
});
