// Demo scene for the photoreal blocks: a steel plate and a glass-like sphere on an oak-toned
// table in low warm window light, a slow push-in and a small cube crossing fast (motion blur).
// Original FrameCore Works teaching asset (Apache-2.0). Everything is a function of time.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {defineEngine} from '../../kit/engine-kit.mjs';
import {createAccumCamera} from '../accum-camera.mjs';
import {createFilmGrade} from '../film-grade.mjs';

export const LOOK = Object.freeze({vignette: 0.3, bloom: 0.3});

export function createDemo({canvas, width = 540, height = 960, fps = 30, duration = 2, samples = 16, aperture = 0.012}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.02, 0.022, 0.028);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  scene.add(new THREE.HemisphereLight(0x9fb4d8, 0x2a1d12, 0.35));
  const sun = new THREE.DirectionalLight(0xffd2a1, 3.2);
  sun.position.set(-3, 4, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 12});
  scene.add(sun);

  const table = new THREE.Mesh(new THREE.BoxGeometry(4, 0.08, 3),
    new THREE.MeshPhysicalMaterial({color: 0x6b4a2e, roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.3}));
  table.position.y = -0.04; table.receiveShadow = true; scene.add(table);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.62),
    new THREE.MeshPhysicalMaterial({color: 0x1c1d20, metalness: 1, roughness: 0.32}));
  plate.position.set(0, 0.02, 0); plate.castShadow = true; plate.receiveShadow = true; scene.add(plate);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 64, 32),
    new THREE.MeshPhysicalMaterial({color: 0xe8eef2, roughness: 0.06, clearcoat: 1}));
  sphere.position.set(0.5, 0.18, 0.5); sphere.castShadow = true; scene.add(sphere);
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshStandardMaterial({color: 0xff5a1f, roughness: 0.4}));
  cube.castShadow = true; scene.add(cube);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 30);
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  function place(t) {
    const k = ease(t / (duration * 0.7));                       // push in, then hold
    camera.position.set(0.55, 1.9 - 0.45 * k, 3.6 - 1.1 * k);
    camera.lookAt(0.3, 0.08, 0.15);
    cube.position.set(-0.7 + 1.3 * Math.min(1, t / (duration * 0.8)), 0.06, -0.45);
    cube.rotation.y = t * 4;
  }

  const accum = createAccumCamera({THREE, renderer, width, height});
  const forward = new THREE.Vector3(), eye = new THREE.Vector3(), axis = new THREE.Vector3();   // focus along the view axis
  const grade = createFilmGrade({THREE, renderer, width, height});
  const engine = defineEngine({
    id: 'photoreal-demo', width, height, fps, duration,
    seek(t) {
      const frame = Math.min(Math.round(t * fps), Math.round(duration * fps) - 1);
      place(frame / fps);
      camera.updateMatrixWorld(true);
      const focus = forward.subVectors(plate.position, camera.getWorldPosition(eye)).dot(camera.getWorldDirection(axis));
      const hdr = accum.render({scene, camera, frame, fps, samples, shutter: 0.5, aperture, focus, duration, prepare: place});
      grade.render(hdr, LOOK, {seed: frame});
    },
  });
  const checks = {
    /** A flat linear colour through the grade shader, read back as 8-bit sRGB at pixel (x, y) of 8x8. */
    gradeParity(flat, look, {x = 4, y = 4} = {}) {
      const src = new THREE.WebGLRenderTarget(8, 8, {type: THREE.FloatType, depthBuffer: false});
      const out = new THREE.WebGLRenderTarget(8, 8);
      const before = new THREE.Color(); renderer.getClearColor(before);
      renderer.setRenderTarget(src);
      renderer.setClearColor(new THREE.Color().setRGB(...flat, THREE.LinearSRGBColorSpace), 1);
      renderer.clear();
      grade.render(src, look, {seed: 0, target: out});
      const px = new Uint8Array(4);
      renderer.readRenderTargetPixels(out, x, y, 1, 1, px);
      renderer.setClearColor(before, 1);
      src.dispose(); out.dispose();
      return [px[0], px[1], px[2]];
    },
    /** Average n sub-frames of a flat linear grey and read the sum back: accumulation drift. */
    accumPrecision(value, n, precision = 'auto') {
      const w = 16, h = 16;
      const probe = createAccumCamera({THREE, renderer, width: w, height: h, precision});
      const flat = new THREE.Scene(); flat.background = new THREE.Color().setRGB(value, value, value, THREE.LinearSRGBColorSpace);
      const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
      probe.render({scene: flat, camera: cam, frame: 0, fps: 30, samples: n});
      const half = probe.precision === 'half';
      const raw = half ? new Uint16Array(4) : new Float32Array(4);
      renderer.readRenderTargetPixels(probe.target, 8, 8, 1, 1, raw);
      const read = half ? THREE.DataUtils.fromHalfFloat(raw[0]) : raw[0];
      probe.dispose();
      return {precision: probe.precision, read, error: Math.abs(read - value) / value};
    },
  };
  return {engine, renderer, THREE, accum, grade, checks};
}
