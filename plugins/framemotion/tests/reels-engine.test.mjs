// The bundled Reels engine through FrameMotion's builder: specs checked by the styles' own build.py,
// Polish letters from Latin Extended faces, and frames that do not depend on the order they are drawn in
// (what-if-3d frame 640, after the arrow's release, differed after frame 590 before FrameMotion's one-line fix).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {BUILDERS} from '../skills/framemotion/assets/engines/kit/builders.mjs';

const ENGINES = path.resolve(import.meta.dirname, '../skills/framemotion/assets/engines');
const SPEC = path.resolve(import.meta.dirname, '../skills/framemotion/assets/reels-engine/framemotion/spec.py');
let playwright = true;
try { await kit.loadPlaywright(); } catch { playwright = false; }
const browserSkip = playwright ? false : 'engines: Playwright is not installed';
const python = spawnSync('python3', ['--version']).status === 0;

test('a wrong spec stops with the style\'s own message', {skip: python ? false : 'python3 missing'}, () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fm-reels-')), 'bad.json');
  fs.writeFileSync(file, JSON.stringify({values: [5]}));
  const run = spawnSync('python3', ['-I', '-B', SPEC, 'graph', file], {encoding: 'utf8'});
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /"values" needs 2 or more numbers/);
});

test('the minimal style takes its length from the steps, as its build.py does', {skip: python ? false : 'python3 missing'}, () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fm-reels-')), 'min.json');
  fs.writeFileSync(file, JSON.stringify({steps: 3, hold: 0.5}));
  const out = JSON.parse(spawnSync('python3', ['-I', '-B', SPEC, 'minimal-line-art', file], {encoding: 'utf8'}).stdout);
  assert.equal(out.duration, 3.6);   // .42 + .5 x 1 + .58 + 1.6 + hold .5
  assert.deepEqual(out.spec.lines, ['every step feels small.', 'until you look back.']);
});

test('Polish copy gets Latin Extended faces, English copy does not', {skip: python ? false : 'python3 missing'}, async () => {
  const entries = JSON.parse(fs.readFileSync(path.join(ENGINES, 'engines.json'), 'utf8')).engines;
  for (const [id, ext] of [['reels-graph-pl', true], ['reels-graph', false]]) {
    const built = await BUILDERS.reels(entries.find((e) => e.id === id), ENGINES);
    const html = fs.readFileSync(path.join(built.dir, 'index.html'), 'utf8');
    assert.equal(/latin-ext-\d+-normal\.woff2\) format\('woff2'\);unicode-range/.test(html), ext, id);
    if (ext) assert.ok(fs.existsSync(path.join(built.dir, 'fonts/inter-tight-latin-ext-700-normal.woff2')));
    fs.rmSync(built.dir, {recursive: true, force: true});
  }
});

for (const [id, frames] of [['reels-minimal-line-art', [0, 45, 50, 57, 70, 113]], ['reels-map-route', [0, 60, 119]], ['reels-what-if-3d', [590, 640]],
  ['reels-hairline-tree', [0, 30, 100]], ['reels-voxel-build', [0, 60, 100]], ['reels-ps1-low-poly', [0, 40, 100]]]) {
  test(`${id}: a frame does not depend on the frames drawn before it`, {skip: browserSkip, timeout: 300000}, async () => {
    const first = await kit.renderFrames(id, {frames, once: true});
    const back = await kit.renderFrames(id, {frames: [...frames].reverse(), once: true});
    const hash = (r, f) => r.frames.find((x) => x.frame === f).hash;
    for (const f of frames) assert.equal(hash(first, f), hash(back, f), `frame ${f}`);
    const alone = await kit.renderFrames(id, {frames: [frames[frames.length >> 1]], once: true});
    assert.equal(hash(alone, frames[frames.length >> 1]), hash(first, frames[frames.length >> 1]), 'a frame drawn alone');
    assert.deepEqual(first.blocked, []);
  });
}

test('reels-hairline-tree: frame 0 is the start (a timeline already at 0 still redraws)', {skip: browserSkip, timeout: 300000}, async () => {
  // Drawn after the end of the film, frame 0 once kept the finished tree on screen.
  const run = await kit.renderFrames('reels-hairline-tree', {frames: [100, 0], once: true});
  const hash = (f) => run.frames.find((x) => x.frame === f).hash;
  const alone = await kit.renderFrames('reels-hairline-tree', {frames: [0], once: true});
  assert.equal(hash(0), alone.frames[0].hash);
  assert.notEqual(hash(0), hash(100));
});
