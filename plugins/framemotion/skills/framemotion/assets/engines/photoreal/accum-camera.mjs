// Photoreal three.js engine: accumulation camera. Every frame is the average of n sub-frames,
// which gives anti-aliasing, thin-lens depth of field and a real shutter in one pass.
// Adapted from Leonxlnx/room-at-dawn (MIT, Copyright (c) 2026 Leon Lin, commit aab8be2), rewritten
// on the FrameMotion engine kit; see integrations/room-at-dawn/. Changes are FrameCore Works (Apache-2.0).
import {subframePlan, shearProjection} from './lens.mjs';

const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
// Each sub-frame is clamped before it is summed (as the film grade does), so one firefly in one
// sub-frame cannot dominate the average.
const ADD_FS = 'precision highp float; varying vec2 vUv; uniform sampler2D tSrc; uniform float uWeight;'
  + ' void main(){ gl_FragColor = vec4(min(texture2D(tSrc, vUv).rgb, vec3(60.0)) * uWeight, 1.0); }';

/** A full-screen pass helper shared with the film grade. */
export function createQuad(THREE, material) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return {scene, camera, material};
}

/**
 * Can this renderer add into a 32-bit float target? Half floats keep only ~11 bits, so 96
 * sub-frames summed into one drift by up to a few percent; 32-bit sums stay exact to < 0.01%.
 */
export function supportsFloatAccumulation(renderer) {
  const ext = renderer.extensions;
  return Boolean(renderer.capabilities?.isWebGL2 !== false && ext.has('EXT_color_buffer_float') && ext.has('EXT_float_blend'));
}

/**
 * createAccumCamera({THREE, renderer, width, height})
 *   .render({scene, camera, frame, fps, samples, shutter, aperture, focus, duration, prepare})
 * prepare(t) moves the scene to sub-frame time t (the engine's seek); after the last sub-frame
 * it is called once more with the frame time, so the scene is left at frame/fps. Returns the
 * linear HDR render target holding the averaged frame. The camera, render target, clear colour
 * and autoClear are restored even when a sub-frame throws. Works with a parented or scaled camera.
 * precision: 'auto' (32-bit float sums where the GPU can blend them, else half) or 'half'.
 */
export function createAccumCamera({THREE, renderer, width, height, precision: wanted = 'auto'}) {
  const precision = wanted === 'half' || !supportsFloatAccumulation(renderer) ? 'half' : 'float';
  const filter = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter};
  const frameTarget = new THREE.WebGLRenderTarget(width, height, {...filter, type: THREE.HalfFloatType, depthBuffer: true});
  const accumTarget = new THREE.WebGLRenderTarget(width, height, {...filter, depthBuffer: false,
    type: precision === 'float' ? THREE.FloatType : THREE.HalfFloatType});
  const add = createQuad(THREE, new THREE.ShaderMaterial({
    vertexShader: QUAD_VS, fragmentShader: ADD_FS,
    uniforms: {tSrc: {value: frameTarget.texture}, uWeight: {value: 1}},
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
  }));
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const basePosition = new THREE.Vector3();
  const world = new THREE.Vector3();
  const clearColor = new THREE.Color();

  function render({scene, camera, frame, fps, samples = 16, shutter = 0.5, aperture = 0, focus = 1, duration = Infinity, prepare = () => {}}) {
    if (!camera?.isPerspectiveCamera) throw new TypeError('The accumulation camera needs a THREE.PerspectiveCamera.');
    const plan = subframePlan(frame, {fps, samples, shutter, aperture, duration});
    const previous = {target: renderer.getRenderTarget(), autoClear: renderer.autoClear, alpha: renderer.getClearAlpha()};
    renderer.getClearColor(clearColor);
    let moved = false;
    try {
      renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(accumTarget);
      renderer.clear();
      add.material.uniforms.uWeight.value = 1 / plan.length;
      for (const s of plan) {
        prepare(s.t);
        camera.updateMatrixWorld(true);
        basePosition.copy(camera.position);
        moved = true;
        // Move across the aperture in world space along the camera's own right and up axes,
        // then express that point in the parent's space (it may be moved, rotated or scaled).
        right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
        camera.getWorldPosition(world).addScaledVector(right, s.lx).addScaledVector(up, s.ly);
        if (camera.parent) camera.parent.worldToLocal(world);
        camera.position.copy(world);
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
        moved = false;
        camera.updateMatrixWorld(true);
        camera.updateProjectionMatrix();
      }
    } finally {
      if (moved) { camera.position.copy(basePosition); camera.updateMatrixWorld(true); }
      camera.updateProjectionMatrix();
      renderer.autoClear = previous.autoClear;
      renderer.setClearColor(clearColor, previous.alpha);
      renderer.setRenderTarget(previous.target);
    }
    prepare(Math.min(frame / fps, duration));
    return accumTarget;
  }

  return {render, target: accumTarget, precision, dispose() { frameTarget.dispose(); accumTarget.dispose(); }};
}
