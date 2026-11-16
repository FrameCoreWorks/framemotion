// Photoreal three.js engine: bake a scene's light in Node, spread over worker threads.
//   node photoreal/bake-node.mjs --scene photoreal/room/scene.mjs --out photoreal/room/room.gi.bin [--spp 256] [--seed 1] [--workers 4]
// The scene module exports bakeSetup(THREE) -> {root, lights}: the same meshes, with the same names,
// that the page builds, and the light setup (see DEFAULT_LIGHTS in bake.mjs). The result does not
// depend on the number of workers: each point has its own random stream.
// FrameCore Works code (Apache-2.0); the method is adapted from room-at-dawn (see bake.mjs).
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {collectScene, createTracer, smoothResult, meshAttributes} from './bake.mjs';
import {packBake} from './gi-file.mjs';

const CHUNK = 512;

if (!isMainThread) {
  const {scene, lights, spp, seed} = workerData;
  const tracer = createTracer({THREE, MeshBVH, scene, lights, spp, seed});
  parentPort.on('message', ({from, to}) => {
    const out = tracer.trace(scene.samples, from, to);
    parentPort.postMessage({from, out}, [out.buffer]);
  });
}

/** Bake a scene module to a file. Returns {points, seconds, file, bytes}. */
export async function bakeScene({scene: modulePath, out, spp = 256, seed = 1, workers = Math.max(1, os.availableParallelism() - 1), smooth = 2, log = () => {}}) {
  const t0 = Date.now();
  const mod = await import(pathToFileURL(path.resolve(modulePath)).href);
  const {root, lights} = mod.bakeSetup(THREE);
  const scene = collectScene(THREE, root);
  const n = scene.samples.length / 6;
  log(`[bake] ${scene.list.length} lit meshes, ${n} points, ${scene.idx.length / 3} triangles, ${spp} samples, ${workers} workers`);
  const data = {pos: scene.pos, idx: scene.idx, triMat: scene.triMat, albedo: scene.albedo, samples: scene.samples};
  const R = new Float32Array(n * 7);
  const jobs = [];
  for (let s = 0; s < n; s += CHUNK) jobs.push({from: s, to: Math.min(n, s + CHUNK)});
  let next = 0, done = 0;
  await new Promise((resolve, reject) => {
    const pool = Array.from({length: Math.min(workers, jobs.length) || 1}, () => new Worker(fileURLToPath(import.meta.url), {workerData: {scene: data, lights, spp, seed}}));
    if (!jobs.length) { pool.forEach((w) => w.terminate()); resolve(); return; }
    const give = (w) => { if (next < jobs.length) w.postMessage(jobs[next++]); };
    for (const w of pool) {
      w.on('error', (e) => { pool.forEach((x) => x.terminate()); reject(e); });
      w.on('message', ({from, out: part}) => {
        R.set(part, from * 7); done++;
        if (done % 20 === 0) log(`[bake] ${Math.round((100 * done) / jobs.length)}%`);
        if (done === jobs.length) { pool.forEach((x) => x.terminate()); resolve(); } else give(w);
      });
      give(w);
    }
  });
  const {E, D} = smoothResult(R, scene.samples, scene.edges, smooth);
  const buf = packBake(THREE, meshAttributes(scene.list, E, D), {spp, seed, smooth, lights, points: n});
  if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true}); fs.writeFileSync(out, Buffer.from(buf)); }
  const seconds = (Date.now() - t0) / 1000;
  log(`[bake] done in ${seconds.toFixed(1)} s`);
  return {points: n, seconds, file: out, bytes: buf.byteLength, buffer: buf};
}

if (isMainThread && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : def; };
  const scene = arg('scene'), out = arg('out');
  if (!scene || !out) { console.error('Usage: node photoreal/bake-node.mjs --scene <module> --out <file.gi.bin> [--spp 256] [--seed 1] [--workers N] [--smooth 2]'); process.exit(2); }
  const r = await bakeScene({scene, out, spp: Number(arg('spp', 256)), seed: Number(arg('seed', 1)), smooth: Number(arg('smooth', 2)),
    workers: Number(arg('workers', Math.max(1, os.availableParallelism() - 1))), log: (m) => console.log(m)});
  console.log(JSON.stringify({points: r.points, seconds: r.seconds, file: r.file, bytes: r.bytes}));
}
