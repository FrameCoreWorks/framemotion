// Procedural materials and props for the photoreal engine, and the studio test scene that uses them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const engines = fileURLToPath(new URL('../skills/framemotion/assets/engines/', import.meta.url));
const installed = fs.existsSync(path.join(engines, 'node_modules/three-mesh-bvh/package.json'));
const skip = installed ? false : 'engines: three is not installed (npm ci in assets/engines)';
const three = () => import(pathToFileURL(path.join(engines, 'node_modules/three/build/three.module.js')).href);
const mod = (p) => import(`../skills/framemotion/assets/engines/photoreal/${p}`);

test('the materials are seeded, cached, carry their bounce colour and check their arguments', {skip}, async () => {
  const THREE = await three();
  const {createMaterials} = await mod('proc-materials.mjs');
  const a = createMaterials(THREE, {quality: 0.25}), b = createMaterials(THREE, {quality: 0.25});
  for (const name of ['wall', 'oakFloor', 'wood', 'lacquer', 'steel', 'fabric', 'plastic']) {
    const m = a[name]();
    assert.equal(a[name](), m, `${name} is cached`);
    assert.ok(m.isMeshStandardMaterial, name);
    assert.equal(m.userData.albedo.length, 3, name);
    for (const c of m.userData.albedo) assert.ok(c > 0 && c < 1, `${name} albedo ${c}`);
    for (const key of ['map', 'normalMap', 'roughnessMap']) {
      if (!m[key]) continue;
      assert.deepEqual(Buffer.from(m[key].image.data), Buffer.from(b[name]()[key].image.data), `${name}.${key} is the same in a second library`);
    }
  }
  const oak = a.oakFloor();
  assert.equal(oak.map.colorSpace, THREE.SRGBColorSpace);
  assert.equal(oak.normalMap.colorSpace, THREE.NoColorSpace);
  assert.ok(Math.abs(oak.map.repeat.x - 1 / 3.6) < 1e-9 && Math.abs(oak.map.repeat.y - 1 / 1.52) < 1e-9, 'floor texture covers 3 plank lengths by 8 widths');
  assert.equal(a.wood({tile: 2}).map.repeat.x, 0.5);
  assert.notEqual(a.wood({tone: [0.3, 0.2, 0.1]}), a.wood());
  assert.equal(a.steel({finish: 'brushed'}).anisotropy, 0.6);
  assert.equal(a.steel({finish: 'polished'}).normalMap, null);
  assert.throws(() => a.steel({finish: 'chrome'}), /brushed, satin or polished/);
  assert.throws(() => createMaterials(THREE, {quality: 0}), /quality/);
  assert.throws(() => a.fabric({threads: 81}), /even whole number/);
  assert.equal(oak.map.image.width, 2 * oak.map.image.height, 'floor texels are about square: twice as long as wide');
});

test('the default textures match the pinned hash (a Node or V8 change that alters them shows here)', {skip}, async () => {
  const THREE = await three();
  const crypto = await import('node:crypto');
  const {createMaterials} = await mod('proc-materials.mjs');
  const a = createMaterials(THREE, {quality: 0.25}), h = crypto.createHash('sha256');
  for (const n of ['wall', 'oakFloor', 'wood', 'lacquer', 'steel', 'fabric', 'plastic']) {
    const m = a[n]();
    for (const k of ['map', 'normalMap', 'roughnessMap', 'clearcoatNormalMap']) if (m[k]) h.update(m[k].image.data);
  }
  // pinned 2026-11-16 with Node 22 in a cloud container; if it changes on purpose, rebake the scenes that use the library
  assert.equal(h.digest('hex'), '168fd98be9b3961e4d3584b23dfaa89b91a63b90c5166b8f2d22124d28f4bd06');
});

test('metric UVs follow the mesh size, and a textured mesh warns only without an albedo', {skip}, async () => {
  const THREE = await three();
  const {metricUV} = await mod('proc-materials.mjs');
  const {collectScene} = await mod('bake.mjs');
  const g = metricUV(new THREE.PlaneGeometry(3, 2));
  const uv = g.attributes.uv.array;
  assert.deepEqual([Math.min(...uv.filter((_, i) => i % 2 === 0)), Math.max(...uv.filter((_, i) => i % 2 === 0))], [-1.5, 1.5]);
  const box = metricUV(new THREE.BoxGeometry(1, 2, 4));
  const u = box.attributes.uv.array, top = [];
  for (let i = 0; i < box.attributes.normal.count; i++) if (box.attributes.normal.getY(i) > 0.5) top.push(u[i * 2], u[i * 2 + 1]);
  assert.deepEqual([...new Set(top.map(Math.abs))].sort(), [0.5, 2], 'the top face is mapped by x and z');
  const root = new THREE.Group();
  const plain = new THREE.MeshStandardMaterial({map: new THREE.DataTexture(new Uint8Array(4), 1, 1)});
  root.add(new THREE.Mesh(new THREE.PlaneGeometry(), plain));
  assert.match(collectScene(THREE, root).warnings.join(' '), /without userData\.albedo/);
  plain.userData.albedo = [0.5, 0.5, 0.5];
  assert.deepEqual(collectScene(THREE, root).warnings, []);
});

test('the table top stays inside its rounded outline and its edge is closed', {skip}, async () => {
  const THREE = await three();
  const {tableTop} = await mod('props.mjs');
  const material = new THREE.MeshStandardMaterial();
  const W = 1.2, D = 0.7, r = 0.08, T = 0.04;
  const g = tableTop(THREE, {width: W, depth: D, radius: r, thickness: T, material});
  assert.deepEqual(g.children.map((m) => m.name), ['top', 'edge', 'bottom']);
  const top = g.getObjectByName('top').geometry.attributes.position;
  let onArc = 0;
  for (let i = 0; i < top.count; i++) {
    const x = Math.abs(top.getX(i)), z = Math.abs(top.getZ(i));
    assert.ok(x <= W / 2 + 1e-6 && z <= D / 2 + 1e-6);   // float32 positions
    const a = x - (W / 2 - r), b = z - (D / 2 - r);
    if (a > 1e-6 && b > 1e-6) { const d = Math.hypot(a, b); assert.ok(d <= r + 1e-6, `corner point outside the arc: ${d}`); if (Math.abs(d - r) < 1e-6) onArc++; }
    assert.equal(top.getY(i), 0);
  }
  assert.ok(onArc >= 4 * 4, `corner arcs have points: ${onArc}`);
  const edge = g.getObjectByName('edge').geometry;
  const n = edge.attributes.normal, p = edge.attributes.position;
  for (let i = 0; i < n.count; i++) {
    assert.ok(Math.abs(n.getY(i)) < 1e-9, 'edge normals are horizontal');
    assert.ok(n.getX(i) * p.getX(i) + n.getZ(i) * p.getZ(i) > 0, 'edge normals point outwards');
  }
  assert.equal(Math.min(...p.array.filter((_, i) => i % 3 === 1)), Math.fround(-T));
  // the edge's u runs on around the band: no step longer than a grid cell (a seam squeezing the texture
  // into one segment would jump by the whole perimeter)
  const eu = edge.attributes.uv;
  for (let i = 0; i < edge.index.count; i += 3) {
    const us = [0, 1, 2].map((k) => eu.getX(edge.index.getX(i + k)));
    assert.ok(Math.max(...us) - Math.min(...us) < 0.06, `edge triangle ${i / 3} spans ${Math.max(...us) - Math.min(...us)} m of texture`);
  }
  // every triangle faces the way its vertex normals point (front faces are drawn and baked)
  for (const mesh of g.children) {
    const geo = mesh.geometry, P = geo.attributes.position, N = geo.attributes.normal, I = geo.index;
    const v = (i) => new THREE.Vector3().fromBufferAttribute(P, I.getX(i));
    for (let i = 0; i < I.count; i += 3) {
      const f = new THREE.Vector3().subVectors(v(i + 1), v(i)).cross(new THREE.Vector3().subVectors(v(i + 2), v(i)));
      if (f.lengthSq() < 1e-14) continue;
      assert.ok(f.dot(new THREE.Vector3().fromBufferAttribute(N, I.getX(i))) > 0, `${mesh.name}: triangle ${i / 3} faces against its normals`);
    }
  }
  assert.throws(() => tableTop(THREE, {material, radius: 0.5, width: 0.8, depth: 0.8}), /radius/);
  assert.throws(() => tableTop(THREE, {}), /material is missing/);
});

test('the window passes light, gives its portal in world space, and the plaque does not depend on the logo image', {skip}, async () => {
  const THREE = await three();
  const {windowUnit, portalOf, logoPlaque} = await mod('props.mjs');
  const {litMeshes, collectScene} = await mod('bake.mjs');
  const m = new THREE.MeshStandardMaterial();
  const win = windowUnit(THREE, {width: 1.4, height: 1.2, panes: [3, 2], materials: {frame: m, glass: m, sill: m}});
  const glass = win.getObjectByName('glass');
  assert.equal(glass.userData.gi, false); assert.equal(glass.userData.occluder, false);
  assert.ok(win.getObjectByName('bar-v2') && win.getObjectByName('bar-h1') && !win.getObjectByName('bar-v3'));
  // the sill stays inside the opening in the reveal; only its nose in the room is wider
  const sill = new THREE.Box3().setFromObject(win.getObjectByName('sill')), nose = new THREE.Box3().setFromObject(win.getObjectByName('sill-nose'));
  assert.ok(sill.max.x <= 0.7 + 1e-6 && sill.max.z <= 1e-6 && nose.min.z >= -1e-6 && nose.max.x > 0.7);
  assert.ok(!litMeshes(win).some((e) => e.mesh === glass));
  win.rotation.y = Math.PI / 2; win.position.set(-2, 1.5, 0);
  const portal = portalOf(THREE, win);
  assert.deepEqual(portal.center, [-2.13, 1.5, 0]);
  assert.deepEqual(portal.u, [0, 0, -0.64]);
  assert.deepEqual(portal.v, [0, 0.54, 0]);
  assert.throws(() => windowUnit(THREE, {panes: [0, 1], materials: {frame: m, glass: m, sill: m}}), /panes/);
  assert.throws(() => windowUnit(THREE, {materials: {frame: m, glass: m}}), /materials\.sill/);
  const make = (logo) => logoPlaque(THREE, {logo, logoSize: [0.2, 0.1], materials: {plate: m, pins: m, logo: new THREE.MeshStandardMaterial({color: 0x111111})}});
  const tex = new THREE.DataTexture(new Uint8Array(16), 2, 2);
  const a = collectScene(THREE, make(null)), b = collectScene(THREE, make(tex));
  assert.equal(a.hash, b.hash, 'the plaque has the same geometry with and without the logo image');
  const shared = new THREE.MeshStandardMaterial();
  logoPlaque(THREE, {logo: tex, materials: {plate: m, pins: m, logo: shared}});
  assert.equal(shared.map, null, 'the material passed in is not changed (it may be shared)');
  const plaque = make(tex), face = plaque.getObjectByName('logo');
  assert.equal(face.material.map, tex); assert.equal(face.material.alphaTest, 0.5);
  assert.ok(Math.abs(face.material.userData.albedo[0] - new THREE.Color(0x111111).r) < 1e-9);
  const uv = face.geometry.attributes.uv.array;
  assert.deepEqual([Math.min(...uv), Math.max(...uv)].map((x) => Math.round(x * 1e6) / 1e6 + 0), [0, 1]);
});

test('a patched material keeps its own program key', {skip}, async () => {
  const THREE = await three();
  const {createGi} = await mod('gi-material.mjs');
  const gi = createGi(THREE);
  const plain = gi.patch(new THREE.MeshStandardMaterial()), plain2 = gi.patch(new THREE.MeshStandardMaterial());
  const hooked = new THREE.MeshStandardMaterial();
  hooked.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('void main() {', 'void main() { /* wall */'); };
  gi.patch(hooked);
  const keyed = new THREE.MeshStandardMaterial();
  keyed.customProgramCacheKey = () => 'mine';
  gi.patch(keyed);
  assert.equal(plain.customProgramCacheKey(), plain2.customProgramCacheKey());
  assert.notEqual(hooked.customProgramCacheKey(), plain.customProgramCacheKey());
  assert.equal(keyed.customProgramCacheKey(), 'framemotion-gi|mine');
});

test('the shipped studio bake matches the studio scene', {skip}, async () => {
  const THREE = await three();
  const {buildStudio, studioLights, markTexture} = await mod('studio/scene.mjs');
  const {createGi} = await mod('gi-material.mjs');
  const {collectScene} = await mod('bake.mjs');
  const file = fs.readFileSync(path.join(engines, 'photoreal/studio/studio.gi.bin'));
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const studio = buildStudio(THREE, {logo: markTexture(THREE, 32)});
  const result = createGi(THREE).apply(studio, buffer);
  assert.deepEqual(result.stale, []);
  assert.ok(result.applied >= 40);
  assert.equal(result.meta.scene, collectScene(THREE, buildStudio(THREE)).hash, 'the studio scene changed since studio.gi.bin was baked: bake it again');
  assert.deepEqual(result.meta.lights, JSON.parse(JSON.stringify(studioLights(THREE, buildStudio(THREE)))), 'the studio lights changed since studio.gi.bin was baked: bake it again');
  assert.equal(collectScene(THREE, buildStudio(THREE)).warnings.length, 0);
});

test('the studio renders the same frame in any order', {skip, timeout: 900000}, async (t) => {
  const kit = await import('../skills/framemotion/assets/engines/kit/render-engine.mjs');
  try { await kit.loadPlaywright(); } catch { t.skip('engines: Playwright is not installed'); return; }
  const params = {samples: 4, width: 270, height: 480};
  const first = await kit.renderFrames('photoreal-studio', {frames: [10, 100], params});
  const back = await kit.renderFrames('photoreal-studio', {frames: [100, 10], params, once: true});
  assert.ok(first.frames.every((f) => f.deterministic && f.max - f.min > 40));
  for (const f of first.frames) assert.equal(back.frames.find((b) => b.frame === f.frame).hash, f.hash, `frame ${f.frame}`);
});

test('the room window reveal lines the opening', {skip}, async () => {
  const THREE = await three();
  const {buildRoom, WINDOW, ROOM} = await mod('room/scene.mjs');
  const room = buildRoom(THREE);
  for (const [name, y, ny] of [['sill', WINDOW.y[0], 1], ['lintel', WINDOW.y[1], -1]]) {
    const o = room.getObjectByName(name), b = new THREE.Box3().setFromObject(o);
    assert.ok(Math.abs(b.min.y - y) < 1e-6 && Math.abs(b.max.y - y) < 1e-6, `${name} is flat at the opening's height`);
    assert.ok(b.min.x >= ROOM.min[0] - WINDOW.depth - 1e-6 && b.max.x <= ROOM.min[0] + 1e-6, `${name} stays in the wall's depth`);
    assert.ok(Math.abs(b.min.z - WINDOW.z[0]) < 1e-6 && Math.abs(b.max.z - WINDOW.z[1]) < 1e-6, `${name} spans the opening`);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(o.quaternion);
    assert.ok(Math.abs(n.y - ny) < 1e-9, `${name} faces into the opening`);
  }
});

test('the sun shadow map frames the whole room, and the left wall is one mesh around the opening', {skip}, async () => {
  const THREE = await three();
  const {shadowFit} = await mod('baked-demo.mjs');
  const {ROOM, LIGHTS, WINDOW, buildRoom} = await mod('room/scene.mjs');
  const dir = new THREE.Vector3(...LIGHTS.sun.direction);
  const fit = shadowFit(THREE, dir, ROOM, {margin: 0.5});
  const cam = new THREE.OrthographicCamera(fit.frustum.left, fit.frustum.right, fit.frustum.top, fit.frustum.bottom, fit.frustum.near, fit.frustum.far);
  cam.position.copy(fit.position); cam.lookAt(fit.target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? ROOM.max[0] : ROOM.min[0], i & 2 ? ROOM.max[1] : ROOM.min[1], i & 4 ? ROOM.max[2] : ROOM.min[2]).project(cam);
    assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && Math.abs(p.z) < 1, `room corner ${i} inside the shadow map`);
  }
  const toSun = new THREE.Vector3().subVectors(fit.position, fit.target).normalize();
  assert.ok(toSun.angleTo(dir.normalize()) < 1e-6, 'the shadow comes from the bake\'s sun direction');
  const left = buildRoom(THREE).getObjectByName('left');
  assert.ok(left && !buildRoom(THREE).getObjectByName('left-low'));
  // grid lines through the opening's edges
  const zs = new Set(), p = left.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) zs.add(Math.round(-p.getX(i) * 1e4) / 1e4);
  for (const z of WINDOW.z) assert.ok(zs.has(z), `a grid line at z = ${z}`);
});
