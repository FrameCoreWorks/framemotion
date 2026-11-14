// Photoreal three.js engine: accumulation camera. Every frame is the average of n sub-frames,
// which gives anti-aliasing, thin-lens depth of field and a real shutter in one pass.
// Own FrameCore Works code (Apache-2.0); technique after Leonxlnx/room-at-dawn (MIT, Leon Lin).
import {subframePlan, shearProjection} from './lens.mjs';

const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const ADD_FS = 'precision highp float; varying vec2 vUv; uniform sampler2D tSrc; uniform float uWeight;'
  + ' void main(){ gl_FragColor = vec4(texture2D(tSrc, vUv).rgb * uWeight, 1.0); }';

/** A full-screen pass helper shared with the film grade. */
export function createQuad(THREE, material) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return {scene, camera, material};
}

/**
 * createAccumCamera({THREE, renderer, width, height})
 *   .render({scene, camera, frame, fps, samples, shutter, aperture, focus, duration, prepare})
 * prepare(t) moves the scene to sub-frame time t (the engine's seek). Returns the linear HDR
 * render target holding the averaged frame; the camera is restored afterwards.
 */
export function createAccumCamera({THREE, renderer, width, height}) {
  const options = {type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter};
  const frameTarget = new THREE.WebGLRenderTarget(width, height, {...options, depthBuffer: true});
  const accumTarget = new THREE.WebGLRenderTarget(width, height, {...options, depthBuffer: false});
  const add = createQuad(THREE, new THREE.ShaderMaterial({
    vertexShader: QUAD_VS, fragmentShader: ADD_FS,
    uniforms: {tSrc: {value: frameTarget.texture}, uWeight: {value: 1}},
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
  }));
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const basePosition = new THREE.Vector3();

  function render({scene, camera, frame, fps, samples = 16, shutter = 0.5, aperture = 0, focus = 1, duration = Infinity, prepare = () => {}}) {
    const plan = subframePlan(frame, {fps, samples, shutter, aperture, duration});
    const previous = {target: renderer.getRenderTarget(), autoClear: renderer.autoClear};
    renderer.setClearColor(0x000000, 1);
    renderer.setRenderTarget(accumTarget);
    renderer.clear();
    add.material.uniforms.uWeight.value = 1 / plan.length;
    for (const s of plan) {
      prepare(s.t);
      camera.updateMatrixWorld(true);
      basePosition.copy(camera.position);
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      up.setFromMatrixColumn(camera.matrixWorld, 1);
      camera.position.addScaledVector(right, s.lx).addScaledVector(up, s.ly);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      shearProjection(camera.projectionMatrix.elements, {...s, focus, width, height});
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      renderer.autoClear = true;
      renderer.setRenderTarget(frameTarget);
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.setRenderTarget(accumTarget);
      renderer.render(add.scene, add.camera);
      camera.position.copy(basePosition);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
    }
    renderer.autoClear = previous.autoClear;
    renderer.setRenderTarget(previous.target);
    return accumTarget;
  }

  return {render, target: accumTarget, dispose() { frameTarget.dispose(); accumTarget.dispose(); }};
}
