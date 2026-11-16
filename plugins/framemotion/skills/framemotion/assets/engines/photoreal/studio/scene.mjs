// Test scene for the procedural materials and props: the room test scene's shell (same window, sun
// and sky) dressed with them. Painted woodchip walls, an oak plank floor, a window unit with glazing
// bars that throw their shadow into the room, a light walnut table with satin steel legs, a cloth-bound book,
// a green lacquered box and a polished steel canister, and a brushed steel plaque with a mark on the
// back wall; a slow 16:9 push-in from the corner towards the window and the table. Sky and bounces are baked (studio.gi.bin).
// Original FrameCore Works teaching asset (Apache-2.0). Everything is a function of time.
import * as THREE from 'three';
import {createBakedDemo} from '../baked-demo.mjs';
import {createMaterials, metricUV} from '../proc-materials.mjs';
import {tableTop, windowUnit, logoPlaque, portalOf} from '../props.mjs';
import {buildRoom, ROOM, WINDOW, LIGHTS as ROOM_LIGHTS} from '../room/scene.mjs';

export const LOOK = Object.freeze({exposure: 2.2, vignette: 0.26, bloom: 0.2});
const FURNITURE = ['table', 'plate', 'sphere', 'cube'];

/** The studio's meshes. Same names and vertex counts in the bake and on the page; `logo` only on the page. */
export function buildStudio(T = THREE, {logo = null} = {}) {
  const root = buildRoom(T);
  root.name = 'studio';
  for (const name of FURNITURE) { const o = root.getObjectByName(name); o.parent.remove(o); }
  const M = createMaterials(T);
  const wall = M.wall(), ceiling = M.wall({color: [0.92, 0.92, 0.91], relief: 0.5});
  const floor = M.oakFloor();
  root.traverse((o) => {
    if (!o.isMesh || o.userData.gi === false) return;
    o.geometry = metricUV(o.geometry);
    o.material = o.name === 'floor' ? floor : o.name === 'ceiling' ? ceiling : wall;
  });

  const [wy0, wy1] = WINDOW.y, [wz0, wz1] = WINDOW.z;
  const glass = new T.MeshPhysicalMaterial({color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.08, depthWrite: false});
  const win = windowUnit(T, {width: wz1 - wz0, height: wy1 - wy0, panes: [2, 2], depth: 0.07, inset: 0.05,
    materials: {frame: M.lacquer({color: [0.93, 0.93, 0.91], roughness: 0.4, coatRoughness: 0.12}), glass, sill: M.plastic({color: [0.9, 0.9, 0.88], roughness: 0.3})}});
  win.rotation.y = Math.PI / 2;                     // room side (+z of the unit) towards +x
  win.position.set(ROOM.min[0], (wy0 + wy1) / 2, (wz0 + wz1) / 2);
  root.add(win);

  // table: walnut top, satin steel legs
  const table = new T.Group(); table.name = 'table'; root.add(table);
  const top = tableTop(T, {width: 1.5, depth: 0.85, thickness: 0.04, radius: 0.06, material: M.wood({tone: [0.6, 0.42, 0.28], tile: 1.2, contrast: 1.3})});
  top.position.y = 0.75; table.add(top);
  const legM = M.steel({finish: 'satin'});
  for (const [i, [lx, lz]] of [[-0.66, -0.34], [0.66, -0.34], [-0.66, 0.34], [0.66, 0.34]].entries()) {
    const leg = new T.Mesh(metricUV(new T.BoxGeometry(0.04, 0.71, 0.04, 1, 8, 1)), legM); leg.name = `leg${i}`; leg.position.set(lx, 0.355, lz); table.add(leg);
  }
  table.position.set(-0.2, 0, -0.6);

  // on the table
  const book = new T.Group(); book.name = 'book'; root.add(book);
  // hard covers in cloth on top, bottom and spine, the page block recessed 3 mm on the three open sides
  const cloth = M.fabric({color: [0.55, 0.16, 0.12], threads: 80, tile: 0.08}), paper = M.plastic({color: [0.93, 0.91, 0.85], roughness: 0.85});
  const [bw, bh, bd, ct] = [0.24, 0.034, 0.17, 0.003];
  for (const [name, size, at, m] of [
    ['cover-top', [bw, ct, bd], [0, bh / 2 - ct / 2, 0], cloth], ['cover-bottom', [bw, ct, bd], [0, -bh / 2 + ct / 2, 0], cloth],
    ['spine', [ct, bh, bd], [-bw / 2 + ct / 2, 0, 0], cloth], ['pages', [bw - ct - 0.003, bh - 2 * ct, bd - 0.006], [ct / 2 - 0.0015, 0, 0], paper],
  ]) {
    const mesh = new T.Mesh(metricUV(new T.BoxGeometry(...size, 6, 1, 4)), m); mesh.name = name; mesh.position.set(...at); book.add(mesh);
  }
  book.position.set(-0.55, 0.767, -0.5); book.rotation.y = 0.25;
  const lid = new T.Mesh(metricUV(new T.BoxGeometry(0.16, 0.1, 0.16, 4, 3, 4)), M.lacquer({color: [0.05, 0.24, 0.17], roughness: 0.4}));
  lid.name = 'box'; lid.position.set(0.28, 0.8, -0.82); lid.rotation.y = -0.4; root.add(lid);
  const can = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.2, 48, 4), M.steel({finish: 'polished'}));
  can.name = 'canister'; can.position.set(0.12, 0.85, -0.3); root.add(can);
  // UVs in metres: around the side by height, across on the caps
  { const p = can.geometry.attributes.position, n = can.geometry.attributes.normal, uv = can.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, p.getX(i), p.getZ(i));
      else uv.setXY(i, uv.getX(i) * 2 * Math.PI * 0.05, p.getY(i));
    } }

  // plaque with a mark on the back wall
  const plaque = logoPlaque(T, {width: 0.56, height: 0.26, logoSize: [0.2, 0.2], logo,
    materials: {plate: M.steel({finish: 'brushed', tile: 0.5}), pins: M.steel({finish: 'polished'}), logo: new T.MeshStandardMaterial({color: new T.Color().setRGB(0.05, 0.05, 0.055, T.SRGBColorSpace), roughness: 0.3})}});
  plaque.position.set(-0.2, 1.62, ROOM.min[2]);
  root.add(plaque);
  root.updateMatrixWorld(true);
  return root;
}

/** The bake's lights: the room's sky and sun, the portal from the window unit. */
export function studioLights(T, root) {
  return {...ROOM_LIGHTS, portals: [portalOf(T, root.getObjectByName('window'))]};
}

/** For bake-node.mjs: the meshes and the light. */
export function bakeSetup(T) { const root = buildStudio(T); return {root, lights: studioLights(T, root)}; }

/** A plain mark for the plaque: three stacked bars stepping right, in alpha (made here, so no image file). */
export function markTexture(T, size = 256) {
  const d = new Uint8Array(size * size * 4), aa = 1.5 / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + 0.5) / size - 0.5, v = (y + 0.5) / size - 0.5;
    let sdf = Infinity;
    for (let k = 0; k < 3; k++) {                    // rounded bars, each shorter and further right than the one above
      const cy = (k - 1) * 0.26, x0 = -0.42 + k * 0.14, x1 = 0.42, hw = 0.08;
      const qx = Math.max(x0 + hw - u, 0, u - (x1 - hw)), qy = Math.abs(v - cy);
      sdf = Math.min(sdf, Math.hypot(qx, Math.max(qy - 0, 0)) - hw);
    }
    const a = Math.min(1, Math.max(0, 0.5 - sdf / aa));
    const i = (y * size + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
  }
  const t = new T.DataTexture(d, size, size, T.RGBAFormat, T.UnsignedByteType);
  t.colorSpace = T.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = T.LinearMipmapLinearFilter; t.magFilter = T.LinearFilter; t.needsUpdate = true;
  return t;
}

export async function createStudioDemo({canvas, width = 960, height = 540, fps = 30, duration = 4, samples = 16, aperture = 0.004, bake = 'studio.gi.bin'}) {
  const root = buildStudio(THREE, {logo: markTexture(THREE)});
  const ease = (x) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
  return createBakedDemo({
    canvas, width, height, fps, duration, samples, aperture, id: 'photoreal-studio', root, lights: studioLights(THREE, root), look: LOOK,
    bakeUrl: new URL(bake, import.meta.url), box: ROOM, probe: [0, 1.4, 0.4],
    focus: root.getObjectByName('book'),
    place(t, camera) {
      const k = ease(t / (duration * 0.85));
      camera.position.set(1.55 - 0.35 * k, 1.42 - 0.08 * k, 1.25 - 0.3 * k);
      camera.lookAt(-0.85, 1.0, -0.75);
    },
  });
}
