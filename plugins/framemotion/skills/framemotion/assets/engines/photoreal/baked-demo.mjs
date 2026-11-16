// Photoreal three.js engine: the page side of a baked-light scene, shared by the room and studio test
// scenes. Builds the renderer, a real-time sun with a shadow map (the bake leaves the sun's direct
// light to it), applies the bake file, captures the reflection probe and wires the accumulation camera
// and the film grade into a seekable engine. Everything is a function of time.
// Original FrameCore Works code (Apache-2.0).
import * as THREE from 'three';
import {defineEngine} from '../kit/engine-kit.mjs';
import {createAccumCamera} from './accum-camera.mjs';
import {createFilmGrade} from './film-grade.mjs';
import {createGi} from './gi-material.mjs';

/**
 * createBakedDemo({canvas, id, root, lights, look, bakeUrl, box, probe, shadow, place, focus, width, height,
 * fps, duration, samples, aperture, fov}): `root` is the scene's group (the same meshes the bake saw),
 * `lights` the bake's lights (its sun becomes a real-time light), `box` the room's {min, max} for the
 * box-projected reflections, `probe` the reflection probe's position, `shadow` optional {margin, distance}
 * (the shadow map frames the whole box grown by margin, 0.5 m by default), `place(t, camera)` the camera move and `focus`
 * the object kept sharp.
 */
export async function createBakedDemo({canvas, id, root, lights, look, bakeUrl, box, probe, shadow = {}, place, focus,
  width = 540, height = 960, fps = 30, duration = 3, samples = 16, aperture = 0.004, fov = 42}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().setRGB(...lights.sky.horizon, THREE.LinearSRGBColorSpace);
  scene.add(root);
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = o.name !== 'floor' && o.userData.occluder !== false;   // glass and decals cast no shadow
    o.receiveShadow = !o.name.startsWith('shell');
  });
  const {sun: S} = lights, dir = new THREE.Vector3(...S.direction).normalize();
  const sun = new THREE.DirectionalLight(new THREE.Color().setRGB(1, S.irradiance[1] / S.irradiance[0], S.irradiance[2] / S.irradiance[0], THREE.LinearSRGBColorSpace), S.irradiance[0]);
  // the shadow camera looks along the bake's sun direction at the middle of the room and frames the whole
  // room (grown by `shadow.margin` for the walls' outer shell), so no wall is left outside the shadow map,
  // where three.js would light it fully
  const margin = shadow.margin ?? 0.5, distance = shadow.distance ?? 10;
  const fit = shadowFit(THREE, dir, box, {margin, distance});
  sun.target.position.copy(fit.target);
  sun.position.copy(fit.position);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01;
  Object.assign(sun.shadow.camera, fit.frustum);
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);

  const gi = createGi(THREE);
  gi.guard(renderer);
  // same-origin only: the bake file next to the scene module.
  const res = await fetch(bakeUrl);
  if (!res.ok) throw new Error(`light bake ${bakeUrl} not found (make it with photoreal/bake-node.mjs)`);
  const applied = gi.apply(root, await res.arrayBuffer());
  if (applied.stale.length) throw new Error(`light bake is stale for ${applied.stale.join(', ')}: bake the scene again`);
  gi.captureEnv(renderer, scene, {position: probe, boxMin: box.min, boxMax: box.max});

  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.05, 30);
  renderer.compile(scene, camera);   // compile up front; a broken patched shader stops the page through the guard at the latest on the first frame
  const accum = createAccumCamera({THREE, renderer, width, height});
  const grade = createFilmGrade({THREE, renderer, width, height});
  const eye = new THREE.Vector3(), axis = new THREE.Vector3(), to = new THREE.Vector3(), target = new THREE.Vector3();
  const prepare = (t) => place(t, camera);
  const engine = defineEngine({
    id, width, height, fps, duration,
    seek(t) {
      const frame = Math.min(Math.round(t * fps), Math.round(duration * fps) - 1);
      prepare(frame / fps);
      camera.updateMatrixWorld(true);
      focus.getWorldPosition(target);
      const dist = to.subVectors(target, camera.getWorldPosition(eye)).dot(camera.getWorldDirection(axis));
      const hdr = accum.render({scene, camera, frame, fps, samples, shutter: 0.5, aperture, focus: dist, duration, prepare});
      grade.render(hdr, look, {seed: frame});
    },
  });
  return {engine, renderer, scene, root, gi, applied};
}

/**
 * The sun's shadow camera for a room: placed `distance` along the sun direction `dir` from the middle of
 * `box`, looking at it, with an orthographic frustum that holds the whole box grown by `margin`.
 * Returns {target, position, frustum: {left, right, top, bottom, near, far}}.
 */
export function shadowFit(T, dir, box, {margin = 0.5, distance = 10} = {}) {
  const lo = new T.Vector3(...box.min), hi = new T.Vector3(...box.max), mid = lo.clone().add(hi).multiplyScalar(0.5);
  const position = new T.Vector3().copy(dir).normalize().multiplyScalar(distance).add(mid);
  const view = new T.Matrix4().lookAt(position, mid, new T.Vector3(0, 1, 0)).setPosition(position).invert();
  const f = {left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity, near: Infinity, far: -Infinity};
  for (let i = 0; i < 8; i++) {
    const p = new T.Vector3(i & 1 ? hi.x + margin : lo.x - margin, i & 2 ? hi.y + margin : lo.y - margin, i & 4 ? hi.z + margin : lo.z - margin).applyMatrix4(view);
    f.left = Math.min(f.left, p.x); f.right = Math.max(f.right, p.x); f.bottom = Math.min(f.bottom, p.y); f.top = Math.max(f.top, p.y);
    f.near = Math.min(f.near, -p.z); f.far = Math.max(f.far, -p.z);
  }
  if (!(f.near > 0)) throw new RangeError('shadowFit: the box reaches behind the sun; raise distance');
  return {target: mid, position, frustum: f};
}
