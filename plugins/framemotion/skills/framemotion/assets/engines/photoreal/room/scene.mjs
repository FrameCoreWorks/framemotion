// Test scene for baked light: a plain room with one window, low sun through it, a table with a
// steel plate, a white sphere and an orange cube; a slow push-in. The sun's direct light is drawn
// by three.js (sharp shadow); the sky through the window and every bounce come from the bake
// (room.gi.bin, made with photoreal/bake-node.mjs from bakeSetup below).
// Original FrameCore Works teaching asset (Apache-2.0). Everything is a function of time.
import * as THREE from 'three';
import {defineEngine} from '../../kit/engine-kit.mjs';
import {createAccumCamera} from '../accum-camera.mjs';
import {createFilmGrade} from '../film-grade.mjs';
import {createGi} from '../gi-material.mjs';

export const ROOM = Object.freeze({min: [-2, 0, -2], max: [2, 2.8, 2]});
export const WINDOW = Object.freeze({y: [0.9, 2.1], z: [-0.7, 0.7], depth: 0.15});
const SUN_DIR = new THREE.Vector3(-1, 0.62, 0.42).normalize();          // towards the sun
export const LIGHTS = Object.freeze({
  sky: {zenith: [0.55, 0.72, 1.15], horizon: [1.5, 1.4, 1.25], ground: [0.22, 0.2, 0.17]},
  sun: {direction: SUN_DIR.toArray(), irradiance: [7.0, 5.4, 3.7], angle: 0.0047, direct: 'realtime'},
  portals: [{center: [ROOM.min[0] - WINDOW.depth, 1.5, 0], u: [0, 0, 0.7], v: [0, 0.6, 0]}],
  maxDepth: 5,
});
export const LOOK = Object.freeze({exposure: 1.35, vignette: 0.28, bloom: 0.22});

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({color, roughness: 0.85, ...o});

/** The room's meshes. Same names and vertex counts in the bake and on the page. */
export function buildRoom(T = THREE) {
  const root = new T.Group(); root.name = 'room';
  const plane = (name, w, h, sw, sh, material, place) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h, sw, sh), material); m.name = name; place(m); root.add(m); return m;
  };
  const [x0, y0, z0] = ROOM.min, [x1, y1, z1] = ROOM.max, W = x1 - x0, H = y1 - y0, D = z1 - z0;
  const wall = mat(0xd9d2c5), floorM = mat(0x7a5a3e, {roughness: 0.55}), ceil = mat(0xe8e4dc);
  wall.userData.albedo = [0.68, 0.64, 0.57];
  plane('floor', W, D, 64, 64, floorM, (m) => { m.rotation.x = -Math.PI / 2; m.position.y = y0; });
  plane('ceiling', W, D, 20, 20, ceil, (m) => { m.rotation.x = Math.PI / 2; m.position.y = y1; });
  plane('back', W, H, 48, 32, wall, (m) => { m.position.set(0, H / 2, z0); });
  plane('front', W, H, 24, 16, wall, (m) => { m.rotation.y = Math.PI; m.position.set(0, H / 2, z1); });
  plane('right', D, H, 48, 32, wall, (m) => { m.rotation.y = -Math.PI / 2; m.position.set(x1, H / 2, 0); });
  // left wall around the window opening, and the opening's four reveals
  const [wy0, wy1] = WINDOW.y, [wz0, wz1] = WINDOW.z, dep = WINDOW.depth;
  const left = (name, za, zb, ya, yb, sw, sh) => plane(name, zb - za, yb - ya, sw, sh, wall, (m) => { m.rotation.y = Math.PI / 2; m.position.set(x0, (ya + yb) / 2, (za + zb) / 2); });
  left('left-low', z0, z1, y0, wy0, 48, 12);
  left('left-high', z0, z1, wy1, y1, 48, 10);
  left('left-back', z0, wz0, wy0, wy1, 16, 14);
  left('left-front', wz1, z1, wy0, wy1, 16, 14);
  const reveal = (name, w, h, place) => plane(name, w, h, 6, 12, wall, place);
  reveal('sill', dep, wz1 - wz0, (m) => { m.rotation.set(-Math.PI / 2, 0, Math.PI / 2); m.position.set(x0 - dep / 2, wy0, 0); });
  reveal('lintel', dep, wz1 - wz0, (m) => { m.rotation.set(Math.PI / 2, 0, Math.PI / 2); m.position.set(x0 - dep / 2, wy1, 0); });
  reveal('jamb-back', dep, wy1 - wy0, (m) => { m.position.set(x0 - dep / 2, (wy0 + wy1) / 2, wz0); });
  reveal('jamb-front', dep, wy1 - wy0, (m) => { m.rotation.y = Math.PI; m.position.set(x0 - dep / 2, (wy0 + wy1) / 2, wz1); });
  // A thick black shell outside the walls, overlapping at the corners, so neither the bake's rays nor the
  // sun's shadow map slip through the seams between the wall planes, and a sub-pixel crack at a corner
  // shows black instead of the sky. It blocks light and is not lit by the bake.
  const shellM = new T.MeshBasicMaterial({color: 0x000000});
  shellM.userData.albedo = [0, 0, 0];
  const shell = (name, sx, sy, sz, px, py, pz) => {
    const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), shellM); m.name = name; m.position.set(px, py, pz); m.userData.gi = false; root.add(m);
  };
  const t = 0.3, ox = x0 - dep - t / 2;
  shell('shell-floor', W + 2, t, D + 2, 0, y0 - t / 2 - 0.001, 0);
  shell('shell-ceiling', W + 2, t, D + 2, 0, y1 + t / 2 + 0.001, 0);
  shell('shell-back', W + 2, H + 2, t, 0, H / 2, z0 - t / 2 - 0.001);
  shell('shell-front', W + 2, H + 2, t, 0, H / 2, z1 + t / 2 + 0.001);
  shell('shell-right', t, H + 2, D + 2, x1 + t / 2 + 0.001, H / 2, 0);
  shell('shell-left-low', t, wy0 + 1, D + 2, ox, (wy0 - 1) / 2, 0);
  shell('shell-left-high', t, y1 + 1 - wy1, D + 2, ox, (wy1 + y1 + 1) / 2, 0);
  shell('shell-left-back', t, wy1 - wy0, wz0 - z0 + 1, ox, (wy0 + wy1) / 2, (wz0 + z0 - 1) / 2);
  shell('shell-left-front', t, wy1 - wy0, z1 + 1 - wz1, ox, (wy0 + wy1) / 2, (wz1 + z1 + 1) / 2);

  // furniture
  const oak = mat(0xa27a52, {roughness: 0.5}); oak.userData.albedo = [0.42, 0.29, 0.18];
  const table = new T.Group(); table.name = 'table'; root.add(table);
  const top = new T.Mesh(new T.BoxGeometry(1.5, 0.05, 0.85, 24, 1, 14), oak); top.name = 'top'; top.position.y = 0.75; table.add(top);
  for (const [i, [lx, lz]] of [[-0.68, -0.36], [0.68, -0.36], [-0.68, 0.36], [0.68, 0.36]].entries()) {
    const leg = new T.Mesh(new T.BoxGeometry(0.05, 0.725, 0.05, 1, 8, 1), oak); leg.name = `leg${i}`; leg.position.set(lx, 0.3625, lz); table.add(leg);
  }
  table.position.set(-0.2, 0, -0.6);
  const steel = new T.MeshPhysicalMaterial({color: 0x9aa0a6, metalness: 1, roughness: 0.28}); steel.userData.albedo = [0.55, 0.56, 0.58];
  const plate = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.015, 48, 1), steel); plate.name = 'plate'; plate.position.set(-0.45, 0.785, -0.62); root.add(plate);
  const white = new T.MeshPhysicalMaterial({color: 0xeeeeea, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08});
  const sphere = new T.Mesh(new T.SphereGeometry(0.13, 48, 24), white); sphere.name = 'sphere'; sphere.position.set(0.05, 0.905, -0.5); root.add(sphere);
  const orange = mat(0xe8541c, {roughness: 0.45}); orange.userData.albedo = [0.75, 0.18, 0.04];
  const cube = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.16, 4, 4, 4), orange); cube.name = 'cube'; cube.position.set(0.32, 0.855, -0.78); cube.rotation.y = 0.5; root.add(cube);
  root.updateMatrixWorld(true);
  return root;
}

/** For bake-node.mjs: the meshes and the light. */
export function bakeSetup(T) { return {root: buildRoom(T), lights: LIGHTS}; }

export async function createRoomDemo({canvas, width = 540, height = 960, fps = 30, duration = 3, samples = 16, aperture = 0.004, bake = 'room.gi.bin'}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().setRGB(...LIGHTS.sky.horizon, THREE.LinearSRGBColorSpace);
  const room = buildRoom();
  scene.add(room);
  room.traverse((o) => { if (o.isMesh) { o.castShadow = o.name !== 'floor'; o.receiveShadow = !o.name.startsWith('shell'); } });
  const sun = new THREE.DirectionalLight(new THREE.Color().setRGB(1, LIGHTS.sun.irradiance[1] / LIGHTS.sun.irradiance[0], LIGHTS.sun.irradiance[2] / LIGHTS.sun.irradiance[0], THREE.LinearSRGBColorSpace), LIGHTS.sun.irradiance[0]);
  sun.position.copy(SUN_DIR).multiplyScalar(8).add(new THREE.Vector3(-2, 1, -0.3));
  sun.target.position.set(-1, 0.5, -0.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01;
  Object.assign(sun.shadow.camera, {left: -2.6, right: 2.6, top: 2.2, bottom: -2.2, near: 2, far: 16});
  scene.add(sun, sun.target);

  const gi = createGi(THREE);
  // same-origin only: the bake file next to this module.
  const res = await fetch(new URL(bake, import.meta.url));
  if (!res.ok) throw new Error(`light bake ${bake} not found (make it with photoreal/bake-node.mjs)`);
  const applied = gi.apply(room, await res.arrayBuffer());
  if (applied.stale.length) throw new Error(`light bake is stale for ${applied.stale.join(', ')}: bake the scene again`);
  gi.captureEnv(renderer, scene, {position: [0, 1.4, 0.4], boxMin: ROOM.min, boxMax: ROOM.max});

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 30);
  const sphere = room.getObjectByName('sphere');
  const ease = (x) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
  function place(t) {
    const k = ease(t / (duration * 0.85));
    camera.position.set(1.15 - 0.35 * k, 1.45 - 0.12 * k, 1.5 - 0.55 * k);
    camera.lookAt(-0.2, 0.8, -0.66);
  }
  const accum = createAccumCamera({THREE, renderer, width, height});
  const grade = createFilmGrade({THREE, renderer, width, height});
  const eye = new THREE.Vector3(), axis = new THREE.Vector3(), to = new THREE.Vector3();
  const engine = defineEngine({
    id: 'photoreal-room', width, height, fps, duration,
    seek(t) {
      const frame = Math.min(Math.round(t * fps), Math.round(duration * fps) - 1);
      place(frame / fps);
      camera.updateMatrixWorld(true);
      const focus = to.subVectors(sphere.position, camera.getWorldPosition(eye)).dot(camera.getWorldDirection(axis));
      const hdr = accum.render({scene, camera, frame, fps, samples, shutter: 0.5, aperture, focus, duration, prepare: place});
      grade.render(hdr, LOOK, {seed: frame});
    },
  });
  return {engine, renderer, scene, room, gi, applied};
}
