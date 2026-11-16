// The bundled Line-art engine through FrameMotion's builder: a missing page or a frame rate the 1/60 s
// loop cannot hit stops the build, and a frame is a pure function of its time (replay and seeded random).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {BUILDERS} from '../skills/framemotion/assets/engines/kit/builders.mjs';

const ENGINES = path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines');
const entries = JSON.parse(fs.readFileSync(path.join(ENGINES, 'engines.json'), 'utf8')).engines;
const esbuild = fs.existsSync(path.join(ENGINES, 'node_modules/esbuild/package.json'));
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const buildSkip = esbuild ? false : 'engines: esbuild is not installed (npm ci in assets/engines)';
const browserSkip = !esbuild ? buildSkip : playwright ? false : 'engines: Playwright is not installed';
const walker = entries.find((e) => e.id === 'lineart-walker');

test('the build stops on a missing example, a missing mount or a frame rate off the 1/60 s grid', {skip: buildSkip}, async () => {
  await assert.rejects(BUILDERS.lineart({...walker, build: {tool: 'lineart', example: 'no-such'}}, ENGINES), /no index\.html/);
  await assert.rejects(BUILDERS.lineart({...walker, build: {...walker.build, mount: '#nothing'}}, ENGINES), /no #nothing element/);
  await assert.rejects(BUILDERS.lineart({...walker, fps: 24}, ENGINES), /fps must divide 60/);
  const built = await BUILDERS.lineart(walker, ENGINES);
  const html = fs.readFileSync(path.join(built.dir, built.page), 'utf8');
  assert.doesNotMatch(html, /<script type="module"/);
  assert.match(html, /Math\.random = /);
  assert.equal(built.query.debug, '');
  fs.rmSync(built.dir, {recursive: true, force: true});
});

for (const [id, frames] of [['lineart-walker', [40, 300, 150]], ['lineart-village', [90, 540, 300]]]) {
  test(`${id}: a frame does not depend on the frames drawn before it`, {skip: browserSkip, timeout: 900000}, async () => {
    const first = await kit.renderFrames(id, {frames, once: true});
    const back = await kit.renderFrames(id, {frames: [...frames].reverse(), once: true});
    const hash = (r, f) => r.frames.find((x) => x.frame === f).hash;
    for (const f of frames) assert.equal(hash(first, f), hash(back, f), `frame ${f}`);
    assert.ok(first.frames.every((f) => !f.flat));
    assert.deepEqual(first.blocked, []);
  });
}
