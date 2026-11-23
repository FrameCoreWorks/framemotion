// Reanimate engine page: it renders deterministic frames through the engine kit, takes a `screen`
// for reels and refuses one with the wrong proportions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLES} from '../skills/framemotion/assets/engines/reanimate/examples/index.mjs';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';

let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }

test('the engine page renders deterministic frames for several examples', {skip: playwright ? false : 'engines: Playwright is not installed', timeout: 300000}, async () => {
  assert.ok(Object.keys(EXAMPLES).length >= 57);
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
