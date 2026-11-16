// Photoreal three.js engine: materials lit by the baked light. A MeshStandardMaterial or
// MeshPhysicalMaterial keeps its own colour, roughness, metalness, maps and real-time lights; the
// patch adds the baked diffuse light per vertex (shaded through the normal map by the baked light
// direction), drops the environment's diffuse part (the bake already holds it) and box-projects the
// environment's reflections onto the room, so a reflection lines up with the walls it shows.
// Adapted from Leonxlnx/room-at-dawn (MIT, Copyright (c) 2026 Leon Lin, commit aab8be2: src/core/gi.js),
// rewritten for FrameMotion: the patch is per material (three's shared shader chunks stay untouched),
// it stops with an error when three.js changed the code it edits, and each scene has its own uniforms.
// Changes are FrameCore Works (Apache-2.0).
import {litMeshes} from './bake.mjs';
import {readBake} from './gi-file.mjs';

const VERT_DECL = `
attribute vec3 gi; attribute vec3 gd;
varying vec3 vGi; varying vec3 vGd; varying vec3 vGiW;`;
const VERT_MAIN = `
{ vec4 giW = modelMatrix * vec4( transformed, 1.0 ); vGiW = giW.xyz; vGi = gi; vGd = ( viewMatrix * vec4( gd, 0.0 ) ).xyz; }`;
const FRAG_DECL = `
varying vec3 vGi; varying vec3 vGd; varying vec3 vGiW;
uniform float giScale; uniform float giNormalK; uniform float giSpecOcc; uniform vec3 giFloor;
uniform vec3 giBoxMin; uniform vec3 giBoxMax; uniform vec3 giProbePos; uniform float giBoxOn;`;
const BOX_FN = `
vec3 giBoxProject( vec3 v ) {
	if ( giBoxOn < 0.5 ) return v;
	vec3 r1 = ( giBoxMax - vGiW ) / v; vec3 r2 = ( giBoxMin - vGiW ) / v; vec3 rm = max( r1, r2 );
	float d = min( min( rm.x, rm.y ), rm.z );
	return normalize( vGiW + v * d - giProbePos );
}
`;
const GI_LIGHT = `
{
	vec3 gF = vGi;
	if ( dot( vGd, vGd ) > 1e-6 ) {
		// the normal map shades the baked light: compare the bumped and the flat normal with the light direction
		float ga = dot( normal, vGd ); float gb = dot( nonPerturbedNormal, vGd );
		gF *= clamp( ( 1.0 + giNormalK * ga ) / max( 0.3, 1.0 + giNormalK * gb ), 0.0, 2.5 );
	}
	gF = gF * giScale + giFloor;
	irradiance += gF * PI;
	#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	radiance *= smoothstep( 0.0, giSpecOcc, dot( gF, vec3( 0.3333 ) ) );
	#endif
}
`;

function edit(source, find, replace, what) {
  if (!source.includes(find)) throw new Error(`gi-material: three.js changed ${what}; the baked-light patch needs updating`);
  return source.replace(find, replace);
}

/**
 * createGi(THREE) -> {uniforms, patch(material), apply(root, buffer), placeholder(root), captureEnv(renderer, scene, opts), guard(renderer)}
 * uniforms: giScale (bake brightness), giNormalK (normal-map strength on baked light), giSpecOcc
 * (reflections fade where the bake is darker than this), giFloor (light added everywhere).
 */
export function createGi(THREE) {
  const uniforms = {
    giScale: {value: 1}, giNormalK: {value: 1.6}, giSpecOcc: {value: 0.012}, giFloor: {value: new THREE.Color(0, 0, 0)},
    giBoxMin: {value: new THREE.Vector3(-1, -1, -1)}, giBoxMax: {value: new THREE.Vector3(1, 1, 1)}, giProbePos: {value: new THREE.Vector3()}, giBoxOn: {value: 0},
  };
  const C = THREE.ShaderChunk;
  const maps = edit(C.lights_fragment_maps, 'iblIrradiance += getIBLIrradiance( geometryNormal );', '', 'lights_fragment_maps');
  let envPars = edit(C.envmap_physical_pars_fragment, 'vec3 getIBLRadiance(', `${BOX_FN}\n\tvec3 getIBLRadiance(`, 'envmap_physical_pars_fragment');
  envPars = edit(envPars, 'reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );',
    'reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );\n\t\t\treflectVec = giBoxProject( reflectVec );', 'getIBLRadiance');

  /** Patch a Standard or Physical material in place. */
  function patch(material) {
    if (!material.isMeshStandardMaterial) throw new TypeError('gi-material patches MeshStandardMaterial or MeshPhysicalMaterial');
    const previous = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      previous?.call(material, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = edit(shader.vertexShader, '#include <common>', `#include <common>${VERT_DECL}`, 'the vertex shader');
      shader.vertexShader = edit(shader.vertexShader, '#include <project_vertex>', `#include <project_vertex>${VERT_MAIN}`, 'the vertex shader');
      shader.fragmentShader = edit(shader.fragmentShader, '#include <common>', `#include <common>${FRAG_DECL}`, 'the fragment shader');
      shader.fragmentShader = edit(shader.fragmentShader, '#include <envmap_physical_pars_fragment>', envPars, 'the fragment shader');
      shader.fragmentShader = edit(shader.fragmentShader, '#include <lights_fragment_maps>', maps + GI_LIGHT, 'the fragment shader');
    };
    // keep the material's own program key, so two materials with different onBeforeCompile hooks of their own
    // do not share one compiled program
    const ownKey = Object.prototype.hasOwnProperty.call(material, 'customProgramCacheKey') ? material.customProgramCacheKey : null;
    const prevSource = previous ? previous.toString() : '';
    material.customProgramCacheKey = () => `framemotion-gi|${ownKey ? ownKey.call(material) : prevSource}`;
    material.userData.giPatched = true;
    material.needsUpdate = true;
    return material;
  }

  function setAttributes(mesh, gi, gd) {
    mesh.geometry.setAttribute('gi', new THREE.BufferAttribute(gi, 3));
    mesh.geometry.setAttribute('gd', new THREE.BufferAttribute(gd, 3));
  }
  /** Flat light on every lit mesh (before a bake exists, or for a stale mesh). */
  function placeholder(root, level = 0.06) {
    for (const e of litMeshes(root)) setAttributes(e.mesh, new Float32Array(e.count * 3).fill(level), new Float32Array(e.count * 3));
  }
  /** Apply a bake file to the scene: patches the lit meshes' materials and sets their attributes. */
  function apply(root, buffer) {
    const bake = readBake(THREE, buffer);
    let applied = 0;
    const stale = [];
    for (const e of litMeshes(root)) {
      const mat = Array.isArray(e.mesh.material) ? e.mesh.material[0] : e.mesh.material;
      if (!mat.userData.giPatched) patch(mat);
      const m = bake.meshes.get(e.key);
      if (!m || m.count !== e.count) { stale.push(e.key); setAttributes(e.mesh, new Float32Array(e.count * 3).fill(0.06), new Float32Array(e.count * 3)); continue; }
      setAttributes(e.mesh, m.gi, m.gd); applied++;
    }
    return {applied, stale, meta: bake.meta};
  }
  /**
   * Render the scene into a cube map from one point and use it for reflections, projected onto the
   * box [boxMin, boxMax] (the room's inside). Call it once after apply(); the light is baked, so the
   * reflections stay right for every frame unless something large moves.
   */
  function captureEnv(renderer, scene, {position, boxMin, boxMax, size = 256, near = 0.03, far = 100}) {
    const rt = new THREE.WebGLCubeRenderTarget(size, {type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter});
    const cam = new THREE.CubeCamera(near, far, rt);
    cam.position.fromArray(position);
    const before = scene.environment; scene.environment = null;
    uniforms.giBoxOn.value = 0;
    cam.update(renderer, scene);
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromCubemap(rt.texture).texture;
    pm.dispose(); rt.dispose();
    if (before && before !== env) before.dispose?.();
    scene.environment = env;
    uniforms.giProbePos.value.fromArray(position); uniforms.giBoxMin.value.fromArray(boxMin); uniforms.giBoxMax.value.fromArray(boxMax);
    uniforms.giBoxOn.value = 1;
    return env;
  }
  /**
   * Make a shader that fails to compile stop the render. The patch checks that the code it edits is
   * there, but a renamed variable (three.js renaming irradiance or nonPerturbedNormal) only breaks the
   * compile, which three.js reports in the console and then draws nothing. Call it before the first
   * render, then renderer.compile(scene, camera) to compile everything up front.
   */
  function guard(renderer) {
    renderer.debug.checkShaderErrors = true;
    renderer.debug.onShaderError = (gl, program, vs, fs) => {
      const log = [gl.getProgramInfoLog(program), gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs)].filter(Boolean).join(' | ').trim();
      throw new Error(`gi-material: a patched shader did not compile; the baked-light patch needs updating for this three.js (${log.slice(0, 400)})`);
    };
  }
  return {uniforms, patch, apply, placeholder, captureEnv, guard};
}
