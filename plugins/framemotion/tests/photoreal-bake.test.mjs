// Baked light for the photoreal engine: the tracer against cases with a known answer, the file
// format, the material patch and the room test scene.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const engines = fileURLToPath(new URL('../skills/framemotion/assets/engines/', import.meta.url));
const installed = fs.existsSync(path.join(engines, 'node_modules/three-mesh-bvh/package.json'));
const skip = installed ? false : 'engines: three-mesh-bvh is not installed (npm ci in assets/engines)';
const load = async () => {
  const THREE = await import(pathToFileURL(path.join(engines, 'node_modules/three/build/three.module.js')).href);
  const {MeshBVH} = await import(pathToFileURL(path.join(engines, 'node_modules/three-mesh-bvh/build/index.module.js')).href);
  const bake = await import('../skills/framemotion/assets/engines/photoreal/bake.mjs');
  return {THREE, MeshBVH, ...bake};
};
const UNIFORM = {zenith: [1, 1, 1], horizon: [1, 1, 1], ground: [0, 0, 0]};
const DARK = {zenith: [0, 0, 0], horizon: [0, 0, 0], ground: [0, 0, 0]};

function floor(THREE) {
  const root = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 4, 4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: 0x808080}));
  m.name = 'floor'; root.add(m);
  return root;
}
// A closed box room with a 1 x 1 m window in the -x wall.
function boxRoom(THREE) {
  const root = new THREE.Group();
  const add = (w, h, d, x, y, z, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 3, 3, 3), new THREE.MeshStandardMaterial({color: 0xb0b0b0}));
    m.position.set(x, y, z); m.name = name; root.add(m);
  };
  add(4, 0.1, 4, 0, -0.05, 0, 'floor'); add(4, 0.1, 4, 0, 3.05, 0, 'ceiling'); add(0.1, 3, 4, 2.05, 1.5, 0, 'right');
  add(4, 3, 0.1, 0, 1.5, 2.05, 'front'); add(4, 3, 0.1, 0, 1.5, -2.05, 'back');
  add(0.1, 1, 4, -2.05, 0.5, 0, 'left-low'); add(0.1, 1, 4, -2.05, 2.5, 0, 'left-high');
  add(0.1, 1, 1.5, -2.05, 1.5, 1.25, 'left-front'); add(0.1, 1, 1.5, -2.05, 1.5, -1.25, 'left-back');
  return root;
}
const mean = (m) => { let s = 0; for (let i = 0; i < m.count; i++) s += m.gi[i * 3]; return s / m.count; };

test('an open floor under an even sky receives exactly the sky; a sun at 45 degrees gives E cos / pi', {skip}, async () => {
  const {THREE, MeshBVH, bakeHere} = await load();
  const sky = bakeHere({THREE, MeshBVH, root: floor(THREE), lights: {sky: UNIFORM}, spp: 16});
  for (const v of sky.meshes[0].gi) assert.ok(Math.abs(v - 1) < 1e-6, `sky ${v}`);
  const sun = bakeHere({THREE, MeshBVH, root: floor(THREE), lights: {sky: DARK, sun: {direction: [0, 1, 1], irradiance: [3, 3, 3]}}, spp: 8});
  for (const v of sun.meshes[0].gi) assert.ok(Math.abs(v - (3 * Math.SQRT1_2) / Math.PI) < 2e-3, `sun ${v}`);
  // a realtime sun is left out of the first bounce: an open floor then gets nothing from it
  const real = bakeHere({THREE, MeshBVH, root: floor(THREE), lights: {sky: DARK, sun: {direction: [0, 1, 1], irradiance: [3, 3, 3], direct: 'realtime'}}, spp: 8});
  for (const v of real.meshes[0].gi) assert.equal(v, 0);
});

test('an area light gives the irradiance of a small square overhead', {skip}, async () => {
  const {THREE, MeshBVH, bakeHere} = await load();
  // 0.1 m square at 2 m, radiance 100, facing down (u x v points down): E/pi = L * A / (pi d^2) at the point below
  const lights = {sky: DARK, rects: [{center: [0, 2, 0], u: [0.05, 0, 0], v: [0, 0, 0.05], radiance: [100, 100, 100]}]};
  const r = bakeHere({THREE, MeshBVH, root: floor(THREE), lights, spp: 64, smooth: 0});
  const f = r.meshes[0], centre = 12;   // vertex at the middle of a 4 x 4 plane
  const expected = (100 * 0.01) / (Math.PI * 4);
  assert.ok(Math.abs(f.gi[centre * 3] - expected) / expected < 0.01, `${f.gi[centre * 3]} vs ${expected}`);
});

test('sky through a window portal agrees with plain path tracing, with far fewer samples', {skip, timeout: 300000}, async () => {
  const {THREE, MeshBVH, bakeHere} = await load();
  const portal = {center: [-2.05, 1.5, 0], u: [0, 0, 0.5], v: [0, 0.5, 0]};
  const plain = bakeHere({THREE, MeshBVH, root: boxRoom(THREE), lights: {sky: UNIFORM}, spp: 1024, smooth: 0});
  const viaPortal = bakeHere({THREE, MeshBVH, root: boxRoom(THREE), lights: {sky: UNIFORM, portals: [portal]}, spp: 128, smooth: 0});
  for (const key of ['floor#0', 'back#0', 'ceiling#0']) {
    const a = mean(plain.meshes.find((m) => m.key === key)), b = mean(viaPortal.meshes.find((m) => m.key === key));
    assert.ok(Math.abs(a - b) / a < 0.05, `${key}: plain ${a} portal ${b}`);
  }
});

test('the bake does not depend on the number of workers, and the file reads back', {skip, timeout: 300000}, async () => {
  const {THREE} = await load();
  const {bakeScene} = await import('../skills/framemotion/assets/engines/photoreal/bake-node.mjs');
  const {readBake} = await import('../skills/framemotion/assets/engines/photoreal/gi-file.mjs');
  const scene = path.join(engines, 'photoreal/room/scene.mjs');
  const one = await bakeScene({scene, spp: 4, workers: 1});
  const three = await bakeScene({scene, spp: 4, workers: 3});
  assert.deepEqual(Buffer.from(one.buffer), Buffer.from(three.buffer));
  const back = readBake(THREE, one.buffer);
  assert.equal(back.meta.spp, 4);
  assert.ok(back.meshes.get('floor#0').gi.length > 0);
  assert.throws(() => readBake(THREE, new ArrayBuffer(16)), /not a FrameMotion light bake/);
});

test('the shipped room bake matches the room scene, and a changed mesh is reported as stale', {skip}, async () => {
  const {THREE} = await load();
  const {buildRoom} = await import('../skills/framemotion/assets/engines/photoreal/room/scene.mjs');
  const {createGi} = await import('../skills/framemotion/assets/engines/photoreal/gi-material.mjs');
  const file = fs.readFileSync(path.join(engines, 'photoreal/room/room.gi.bin'));
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const room = buildRoom(THREE);
  const result = createGi(THREE).apply(room, buffer);
  assert.deepEqual(result.stale, []);
  assert.ok(result.applied >= 20);
  assert.ok(room.getObjectByName('floor').material.userData.giPatched);
  const changed = buildRoom(THREE);
  changed.getObjectByName('cube').geometry = new THREE.BoxGeometry(0.16, 0.16, 0.16, 2, 2, 2);
  assert.deepEqual(createGi(THREE).apply(changed, buffer).stale, ['cube#0']);
});

test('the material patch stops when three.js changed the shader code it edits', {skip}, async () => {
  const {THREE} = await load();
  const {createGi} = await import('../skills/framemotion/assets/engines/photoreal/gi-material.mjs');
  const patched = createGi(THREE).patch(new THREE.MeshPhysicalMaterial());
  const shader = {uniforms: {}, vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader};
  patched.onBeforeCompile(shader);
  assert.match(shader.fragmentShader, /giBoxProject\( reflectVec \)/);
  assert.match(shader.fragmentShader, /irradiance \+= gF \* PI/);
  assert.doesNotMatch(shader.fragmentShader, /iblIrradiance \+= getIBLIrradiance/);
  const broken = {...THREE, ShaderChunk: {...THREE.ShaderChunk, lights_fragment_maps: '/* changed */'}};
  assert.throws(() => createGi(broken), /three\.js changed lights_fragment_maps/);
  assert.throws(() => createGi(THREE).patch(new THREE.MeshBasicMaterial()), /MeshStandardMaterial/);
});

test('the baked-light room renders the same frame in any order', {skip, timeout: 900000}, async (t) => {
  const kit = await import('../skills/framemotion/assets/engines/kit/render-engine.mjs');
  try { await kit.loadPlaywright(); } catch { t.skip('engines: Playwright is not installed'); return; }
  const params = {samples: 4, width: 270, height: 480};
  const first = await kit.renderFrames('photoreal-room', {frames: [10, 80], params});
  const back = await kit.renderFrames('photoreal-room', {frames: [80, 10], params, once: true});
  assert.ok(first.frames.every((f) => f.deterministic && f.max - f.min > 40));
  for (const f of first.frames) assert.equal(back.frames.find((b) => b.frame === f.frame).hash, f.hash, `frame ${f.frame}`);
});
