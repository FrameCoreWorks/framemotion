#!/usr/bin/env node
// Join scenes from different engines into one film (film-plan/1), on one clock, size and frame rate.
//
//   node kit/compose.mjs plan.json --out film.mp4 [--work DIR] [--gpu]
//
// Each scene is rendered by its own engine at the engine's size and frame rate, then retimed to the
// film's frame rate (output frame k shows the engine frame nearest to start + k / fps), fitted to the
// film's size (cover crops, contain pads with the film's background) and encoded. Scenes are joined
// with a straight cut, or a short ffmpeg crossfade (transition_in) where the plan asks for one. An
// optional audio file is laid under the whole film. Nothing is downloaded; ffmpeg must be on PATH.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registry, renderFrames, ENGINES_ROOT} from './render-engine.mjs';

export const SCHEMA = 'film-plan/1';
// ffmpeg xfade names allowed for transition_in (a straight cut needs no entry).
export const TRANSITIONS = ['fade', 'fadeblack', 'fadewhite', 'dissolve', 'wipeleft', 'wiperight', 'wipeup', 'wipedown',
  'slideleft', 'slideright', 'slideup', 'slidedown', 'circleopen', 'circleclose', 'smoothleft', 'smoothright'];

/** Problems with a plan, as plain sentences; an empty list means it can be rendered. */
export function validatePlan(plan, reg = registry()) {
  const errors = [];
  const ids = new Map(reg.engines.map((e) => [e.id, e]));
  if (plan?.schema !== SCHEMA) errors.push(`schema must be "${SCHEMA}"`);
  if (!Number.isInteger(plan?.fps) || plan.fps < 1 || plan.fps > 120) errors.push('fps must be a whole number from 1 to 120');
  const {width, height} = plan?.size ?? {};
  for (const [k, v] of [['width', width], ['height', height]]) {
    if (!Number.isInteger(v) || v < 16 || v > 7680 || v % 2) errors.push(`size.${k} must be an even whole number from 16 to 7680`);
  }
  if (plan?.background !== undefined && !/^#[0-9a-fA-F]{6}$/.test(plan.background)) errors.push('background must be #rrggbb');
  if (!Array.isArray(plan?.scenes) || !plan.scenes.length) errors.push('scenes must list at least one scene');
  (plan?.scenes ?? []).forEach((s, i) => {
    const where = `scene ${i + 1}`;
    const entry = ids.get(s?.engine);
    if (!entry) { errors.push(`${where}: unknown engine "${s?.engine}"`); return; }
    if (!(s.duration > 0)) errors.push(`${where}: duration must be more than 0 seconds`);
    if (s.start !== undefined && !(s.start >= 0)) errors.push(`${where}: start must be 0 or more seconds`);
    if (typeof entry.duration === 'number' && (s.start ?? 0) >= entry.duration) {
      errors.push(`${where}: start ${s.start} s is past the end of ${s.engine} (${entry.duration} s)`);
    }
    if (s.fit !== undefined && !['cover', 'contain'].includes(s.fit)) errors.push(`${where}: fit must be cover or contain`);
    if (s.params !== undefined && (typeof s.params !== 'object' || Array.isArray(s.params))) errors.push(`${where}: params must be an object`);
    const t = s.transition_in;
    if (t !== undefined) {
      if (i === 0) errors.push(`${where}: the first scene has no transition in`);
      if (!TRANSITIONS.includes(t?.type)) errors.push(`${where}: transition_in.type must be one of ${TRANSITIONS.join(', ')}`);
      const prev = plan.scenes[i - 1];
      if (!(t?.duration > 0) || t.duration >= Math.min(s.duration ?? 0, prev?.duration ?? 0)) {
        errors.push(`${where}: transition_in.duration must be more than 0 and shorter than both scenes`);
      }
    }
  });
  if (plan?.audio !== undefined && typeof plan.audio?.file !== 'string') errors.push('audio.file must name a sound file');
  return errors;
}

/** Engine frame shown at each film frame of a scene (nearest frame, held at the end). */
export function frameMap(scene, filmFps, engineFps, engineFrames) {
  const n = Math.round(scene.duration * filmFps);
  const start = scene.start ?? 0;
  return Array.from({length: n}, (_, k) => Math.min(engineFrames - 1, Math.round((start + k / filmFps) * engineFps)));
}

/** ffmpeg filter that fits a picture into the film's size. */
export function fitFilter(fit, width, height, background = '#000000') {
  const bg = background.replace('#', '0x');
  return fit === 'contain'
    ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${bg},setsar=1`
    : `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`;
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {encoding: 'utf8'});
  if (r.error) throw new Error(`ffmpeg is not available: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.trim().slice(-800)}`);
}

/** Render a plan to an MP4. Returns a report with each scene's engine, frames and timing. */
export async function compose(plan, {out, work = null, gpu = false, root = ENGINES_ROOT, planDir = process.cwd()} = {}) {
  const reg = registry(root);
  const errors = validatePlan(plan, reg);
  if (errors.length) throw new Error(`The film plan is not valid:\n- ${errors.join('\n- ')}`);
  const dir = work ?? fs.mkdtempSync(path.join(os.tmpdir(), 'framemotion-film-'));
  const {fps, size: {width, height}} = plan;
  const report = {film: {fps, width, height}, scenes: []};
  const clips = [];
  for (const [i, scene] of plan.scenes.entries()) {
    const sceneDir = path.join(dir, `scene-${String(i + 1).padStart(2, '0')}`);
    fs.mkdirSync(sceneDir, {recursive: true});
    // Probe the engine's real clock (bundled engines take theirs from the page) with one frame.
    const probe = await renderFrames(scene.engine, {frames: [0], params: scene.params ?? {}, gpu, root, once: true});
    const {fps: efps, totalFrames} = probe.engine;
    const map = frameMap(scene, fps, efps, totalFrames);
    const unique = [...new Set(map)];
    const rendered = await renderFrames(scene.engine, {frames: unique, out: sceneDir, params: scene.params ?? {}, gpu, root, once: true});
    const bad = rendered.frames.filter((f) => f.flat && !f.flatExpected).map((f) => f.frame);
    const seq = path.join(sceneDir, 'seq');
    fs.mkdirSync(seq, {recursive: true});
    map.forEach((f, k) => fs.copyFileSync(path.join(sceneDir, `${scene.engine}-${String(f).padStart(5, '0')}.png`),
      path.join(seq, `${String(k).padStart(5, '0')}.png`)));
    const clip = path.join(dir, `scene-${String(i + 1).padStart(2, '0')}.mp4`);
    ffmpeg(['-framerate', String(fps), '-i', path.join(seq, '%05d.png'), '-vf', fitFilter(scene.fit ?? 'cover', width, height, plan.background),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-r', String(fps), clip]);
    clips.push(clip);
    report.scenes.push({engine: scene.engine, engine_fps: efps, engine_size: [probe.engine.width, probe.engine.height],
      frames: map.length, engine_frames: unique.length, flat_frames: bad, transition_in: scene.transition_in ?? null});
  }
  // Join: a chain of cuts and crossfades. Each crossfade overlaps the two scenes, so the film is
  // shorter than the sum of the scenes by the transitions' lengths.
  const inputs = clips.flatMap((c) => ['-i', c]);
  let filter = '';
  let last = '[0:v]';
  let offset = plan.scenes[0].duration;
  plan.scenes.slice(1).forEach((s, j) => {
    const i = j + 1;
    const t = s.transition_in;
    const label = `[v${i}]`;
    if (t) {
      offset -= t.duration;
      filter += `${last}[${i}:v]xfade=transition=${t.type}:duration=${t.duration}:offset=${offset.toFixed(4)}${label};`;
    } else {
      filter += `${last}[${i}:v]concat=n=2:v=1:a=0${label};`;
    }
    offset += s.duration;
    last = label;
  });
  const video = path.join(dir, 'video.mp4');
  if (clips.length === 1) fs.copyFileSync(clips[0], video);
  else ffmpeg([...inputs, '-filter_complex', filter.replace(/;$/, ''), '-map', last, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-r', String(fps), video]);
  fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
  if (plan.audio) {
    const audio = path.resolve(planDir, plan.audio.file);
    ffmpeg(['-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', out]);
  } else {
    fs.copyFileSync(video, out);
  }
  report.film.duration = offset;
  report.film.frames = Math.round(offset * fps);
  report.out = path.resolve(out);
  report.work = dir;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const planPath = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out' && args[args.indexOf(a) - 1] !== '--work');
  const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  if (!planPath || !opt('out')) { console.error('Usage: node kit/compose.mjs plan.json --out film.mp4 [--work DIR] [--gpu]'); process.exit(2); }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const errors = validatePlan(plan);
  if (errors.length) { console.error(`The film plan is not valid:\n- ${errors.join('\n- ')}`); process.exit(3); }
  const report = await compose(plan, {out: opt('out'), work: opt('work'), gpu: args.includes('--gpu'), planDir: path.dirname(path.resolve(planPath))});
  console.log(JSON.stringify(report, null, 2));
  if (report.scenes.some((s) => s.flat_frames.length)) console.error('Some scene frames are flat (one colour): check them before delivery.');
}
