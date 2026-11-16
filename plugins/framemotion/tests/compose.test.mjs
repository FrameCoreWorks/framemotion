// Films from several engines (film-plan/1): the plan check, the retiming, and one real three-engine film.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import * as kit from '../skills/framemotion/assets/engines/kit/render-engine.mjs';
import {validatePlan, frameMap, fitFilter, compose} from '../skills/framemotion/assets/engines/kit/compose.mjs';

const EXAMPLE = new URL('../skills/framemotion/assets/engines/kit/film-plan.example.json', import.meta.url);
const plan = (scenes, extra = {}) => ({schema: 'film-plan/1', fps: 30, size: {width: 540, height: 960}, scenes, ...extra});

let ready = true;
try { await kit.loadPlaywright(); await import('../skills/framemotion/assets/engines/node_modules/torph/dist/index.mjs'); } catch { ready = false; }
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
const skip = ready && hasFfmpeg ? false : 'engines: Playwright, the library packages or ffmpeg are not installed';

test('the example plan is valid and a broken plan says what is wrong in plain sentences', () => {
  assert.deepEqual(validatePlan(JSON.parse(fs.readFileSync(EXAMPLE, 'utf8'))), []);
  const errors = validatePlan({schema: 'film-plan/1', fps: 0, size: {width: 541, height: 960}, scenes: [
    {engine: 'no-such-engine', duration: 1},
    {engine: 'torph-text', duration: 1, transition_in: {type: 'spin', duration: 2}, fit: 'stretch'}]});
  for (const part of ['fps must be', 'size.width must be an even', 'unknown engine "no-such-engine"', 'transition_in.type must be one of',
    'shorter than both scenes', 'fit must be cover or contain']) {
    assert.ok(errors.some((e) => e.includes(part)), `${part}: ${errors.join(' | ')}`);
  }
  assert.ok(validatePlan(plan([{engine: 'torph-text', duration: 1, transition_in: {type: 'fade', duration: 0.2}}]))
    .some((e) => e.includes('first scene has no transition')));
  assert.ok(validatePlan(plan([{engine: 'photoreal-demo', start: 5, duration: 1}])).some((e) => e.includes('past the end')));
});

test('retiming takes the nearest engine frame and holds the last one', () => {
  assert.deepEqual(frameMap({duration: 0.1}, 30, 60, 100), [0, 2, 4]);
  assert.deepEqual(frameMap({duration: 0.2}, 30, 24, 100), [0, 1, 2, 2, 3, 4]);
  assert.deepEqual(frameMap({start: 1, duration: 0.1}, 30, 30, 32), [30, 31, 31]);
  assert.match(fitFilter('contain', 1080, 1920, '#101010'), /pad=1080:1920.*color=0x101010/);
  assert.match(fitFilter('cover', 1080, 1920), /crop=1080:1920/);
});

test('three engines with different clocks join into one film at the film size and frame rate', {skip}, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-compose-'));
  const out = path.join(dir, 'film.mp4');
  const report = await compose(plan([
    {engine: 'torph-text', duration: 0.5},
    {engine: 'paper-shader', duration: 0.5, transition_in: {type: 'fade', duration: 0.2}},
    {engine: 'launch-type', duration: 0.5, fit: 'contain'}], {background: '#101010'}), {out, work: path.join(dir, 'work')});
  assert.equal(report.scenes[2].engine_fps, 60);
  assert.equal(report.film.frames, 39);   // 15 + 15 + 15 frames, minus a 0.2 s (6 frame) crossfade
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height,r_frame_rate,nb_frames', '-of', 'json', out], {encoding: 'utf8'});
  const s = JSON.parse(probe.stdout).streams[0];
  assert.deepEqual([s.width, s.height, s.r_frame_rate, Number(s.nb_frames)], [540, 960, '30/1', 39]);
  assert.ok(report.scenes.every((sc) => sc.flat_frames.length === 0));
  fs.rmSync(dir, {recursive: true, force: true});
});
