// Photoreal three.js engine: props built for baked light. A table top with rounded corners, a window
// unit (frame, glazing bars, glass, sill) that also gives the bake its window portal, and a plaque that
// carries a logo on stand-off pins. Each prop is a THREE.Group with named meshes, subdivided so the
// per-vertex bake has points to work with, and UVs in metres for the procedural materials
// (proc-materials.mjs). Geometry depends only on the numbers passed in, never on an image, so the bake
// in Node builds the same meshes as the page.
// Original FrameCore Works code (Apache-2.0).
import {metricUV} from './proc-materials.mjs';

function need(materials, names, prop) {
  for (const n of names) if (!materials?.[n]) throw new TypeError(`${prop}: materials.${n} is missing`);
}
// Coordinates from -L/2 to L/2: `corner` steps in each end zone of length r, the middle in steps of at most `cell`.
function axis(L, r, cell, corner = 4) {
  const out = [], mid = L - 2 * r, n = Math.max(1, Math.ceil(mid / cell));
  for (let i = 0; i < corner; i++) out.push(-L / 2 + (r * i) / corner);
  for (let i = 0; i <= n; i++) out.push(-L / 2 + r + (mid * i) / n);
  for (let i = corner - 1; i >= 0; i--) out.push(L / 2 - (r * i) / corner);
  return out;
}
function box(THREE, name, [sx, sy, sz], [px, py, pz], material, cell = 0.08) {
  const seg = (s) => Math.max(1, Math.ceil(s / cell));
  const m = new THREE.Mesh(metricUV(new THREE.BoxGeometry(sx, sy, sz, seg(sx), seg(sy), seg(sz))), material);
  m.name = name; m.position.set(px, py, pz);
  return m;
}

/**
 * tableTop(THREE, {width, depth, thickness, radius, cell, material}) -> Group 'table-top' with meshes
 * 'top', 'edge' and 'bottom'. The top surface is at y = 0 (place the group at the table's height),
 * centred on x and z, corners rounded with `radius`. `cell` is the largest grid step in metres.
 */
export function tableTop(THREE, {width = 1.4, depth = 0.8, thickness = 0.04, radius = 0.06, cell = 0.05, material, name = 'table-top'} = {}) {
  if (!material) throw new TypeError('tableTop: material is missing');
  if (!(radius > 0 && radius * 2 < Math.min(width, depth))) throw new RangeError('tableTop: radius must be above 0 and below half the shorter side');
  const xs = axis(width, radius, cell), zs = axis(depth, radius, cell), nx = xs.length, nz = zs.length;
  const ax = width / 2 - radius, az = depth / 2 - radius;
  // the grid, with each corner square pulled onto a quarter disc (its outer edges land on the arc)
  const grid = new Float32Array(nx * nz * 2);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    let x = xs[i], z = zs[j];
    const a = Math.abs(x) - ax, b = Math.abs(z) - az;
    if (a > 0 && b > 0) {
      const k = Math.max(a, b) / Math.hypot(a, b);
      x = Math.sign(x) * (ax + a * k); z = Math.sign(z) * (az + b * k);
    }
    grid[(j * nx + i) * 2] = x; grid[(j * nx + i) * 2 + 1] = z;
  }
  const face = (y, up) => {
    const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), idx = [];
    for (let v = 0; v < nx * nz; v++) { pos.set([grid[v * 2], y, grid[v * 2 + 1]], v * 3); nor[v * 3 + 1] = up ? 1 : -1; }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      if (up) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
    return metricUV(g);
  };
  // the edge band follows the grid's outline: two rings of the same points, one under the other
  const ring = [];
  for (let i = 0; i < nx; i++) ring.push(i);
  for (let j = 1; j < nz; j++) ring.push(j * nx + nx - 1);
  for (let i = nx - 2; i >= 0; i--) ring.push((nz - 1) * nx + i);
  for (let j = nz - 2; j > 0; j--) ring.push(j * nx);
  // start the band in the middle of a straight side and repeat that point at the end, so the texture's
  // u runs on to the full length there instead of jumping back to 0 across one segment
  const start = Math.floor(nx / 2);
  ring.push(...ring.splice(0, start));
  ring.push(ring[0]);
  const levels = [0, -thickness / 2, -thickness], R = ring.length, pos = new Float32Array(R * levels.length * 3), idx = [];
  levels.forEach((y, l) => ring.forEach((v, k) => pos.set([grid[v * 2], y, grid[v * 2 + 1]], (l * R + k) * 3)));
  for (let l = 0; l < levels.length - 1; l++) for (let k = 0; k < R - 1; k++) {
    const a = l * R + k, b = a + 1, c = a + R, d = b + R;
    idx.push(a, b, c, b, d, c);                                   // counter-clockwise seen from outside
  }
  const band = new THREE.BufferGeometry();
  band.setAttribute('position', new THREE.BufferAttribute(pos, 3)); band.setIndex(idx); band.computeVertexNormals();
  // outward horizontal normals (the smoothed ones lean at the top and bottom rows)
  const n = band.attributes.normal;
  for (let i = 0; i < n.count; i++) { const h = Math.hypot(n.getX(i), n.getZ(i)) || 1; n.setXYZ(i, n.getX(i) / h, 0, n.getZ(i) / h); }
  const edgeUV = new Float32Array(R * levels.length * 2);
  let run = 0; const along = [0];
  for (let k = 1; k < R; k++) { run += Math.hypot(grid[ring[k] * 2] - grid[ring[k - 1] * 2], grid[ring[k] * 2 + 1] - grid[ring[k - 1] * 2 + 1]); along.push(run); }
  levels.forEach((y, l) => along.forEach((s, k) => edgeUV.set([s, y], (l * R + k) * 2)));
  band.setAttribute('uv', new THREE.BufferAttribute(edgeUV, 2));

  const root = new THREE.Group(); root.name = name;
  for (const [n2, g] of [['top', face(0, true)], ['edge', band], ['bottom', face(-thickness, false)]]) {
    const m = new THREE.Mesh(g, material); m.name = n2; root.add(m);
  }
  return root;
}

/**
 * windowUnit(THREE, {width, height, depth, frame, bar, panes, sill, materials: {frame, glass, sill}})
 * -> Group 'window'. Built in the x-y plane, room side towards +z, centred on the opening; place the
 * group in a wall opening of width x height whose room-side face is at z = 0 of the group. panes =
 * [columns, rows] of glass; sill = {depth, thickness, overhang} or null. The glass lets the bake's
 * light through and casts no shadow. portalOf(group) gives the bake's portal in world space.
 */
export function windowUnit(THREE, {width = 1.4, height = 1.2, depth = 0.07, frame = 0.06, bar = 0.035, panes = [2, 1], inset = 0.05, sill = {depth: 0.2, thickness: 0.03, overhang: 0.04}, materials} = {}) {
  need(materials, ['frame', 'glass'].concat(sill ? ['sill'] : []), 'windowUnit');
  const [cols, rows] = panes;
  if (!(Number.isInteger(cols) && Number.isInteger(rows) && cols >= 1 && rows >= 1)) throw new RangeError('windowUnit: panes must be two whole numbers of at least 1');
  const root = new THREE.Group(); root.name = 'window';
  const z = -inset - depth / 2, W = width, H = height, M = materials.frame;
  root.add(box(THREE, 'frame-bottom', [W, frame, depth], [0, -H / 2 + frame / 2, z], M, 0.06));
  root.add(box(THREE, 'frame-top', [W, frame, depth], [0, H / 2 - frame / 2, z], M, 0.06));
  root.add(box(THREE, 'frame-left', [frame, H - 2 * frame, depth], [-W / 2 + frame / 2, 0, z], M, 0.06));
  root.add(box(THREE, 'frame-right', [frame, H - 2 * frame, depth], [W / 2 - frame / 2, 0, z], M, 0.06));
  const iw = W - 2 * frame, ih = H - 2 * frame;
  for (let c = 1; c < cols; c++) root.add(box(THREE, `bar-v${c}`, [bar, ih, depth * 0.8], [-iw / 2 + (iw * c) / cols, 0, z], M, 0.06));
  for (let r = 1; r < rows; r++) root.add(box(THREE, `bar-h${r}`, [iw, bar, depth * 0.8], [0, -ih / 2 + (ih * r) / rows, z], M, 0.06));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), materials.glass);
  glass.name = 'glass'; glass.position.set(0, 0, z); glass.castShadow = false;
  glass.userData.gi = false; glass.userData.occluder = false;
  root.add(glass);
  if (sill) {
    const {depth: sd, thickness: st, overhang: so} = sill;
    // on the reveal's floor in front of the frame, reaching into the room by depth - inset
    // a board on the reveal's floor in front of the frame (as wide as the opening), and its nose in the room,
    // wider by the overhang on each side
    root.add(box(THREE, 'sill', [W, st, inset], [0, -H / 2 + st / 2, -inset / 2], materials.sill, 0.05));
    if (sd > inset) root.add(box(THREE, 'sill-nose', [W + 2 * so, st, sd - inset], [0, -H / 2 + st / 2, (sd - inset) / 2], materials.sill, 0.05));
  }
  root.userData.portal = {center: [0, 0, -inset - depth - 0.01], u: [iw / 2, 0, 0], v: [0, ih / 2, 0]};
  return root;
}

/** The window's portal ({center, u, v} in world space) for the bake's lights. */
export function portalOf(THREE, windowGroup) {
  windowGroup.updateMatrixWorld(true);
  const p = windowGroup.userData.portal;
  if (!p) throw new TypeError('portalOf: not a windowUnit group');
  const at = (q) => new THREE.Vector3(...q).applyMatrix4(windowGroup.matrixWorld);
  const c = at(p.center);
  const u = at(p.center.map((x, i) => x + p.u[i])).sub(c), v = at(p.center.map((x, i) => x + p.v[i])).sub(c);
  const r = (x) => Math.round(x * 1e6) / 1e6 + 0;   // + 0 turns -0 into 0
  return {center: c.toArray().map(r), u: u.toArray().map(r), v: v.toArray().map(r)};
}

/**
 * logoPlaque(THREE, {width, height, thickness, standoff, logoSize, logo, materials: {plate, pins, logo?}})
 * -> Group 'plaque'. A plate held off the wall by four pins with caps; the wall is the group's z = 0
 * plane and the plaque faces +z. `logo` (a THREE.Texture, may be null in the bake) goes on a plane of
 * logoSize [w, h] metres just in front of the plate; its look comes from the texture's alpha.
 */
export function logoPlaque(THREE, {width = 0.6, height = 0.3, thickness = 0.01, standoff = 0.025, logoSize = null, logo = null, logoColor = [1, 1, 1], materials} = {}) {
  need(materials, ['plate', 'pins'], 'logoPlaque');
  const root = new THREE.Group(); root.name = 'plaque';
  const zc = standoff + thickness / 2;
  root.add(box(THREE, 'plate', [width, height, thickness], [0, 0, zc], materials.plate, 0.03));
  const inset = Math.min(width, height) * 0.12, pr = Math.min(0.009, inset * 0.4);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => {
    const x = sx * (width / 2 - inset), y = sy * (height / 2 - inset);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(pr * 0.6, pr * 0.6, standoff, 12, 1).rotateX(Math.PI / 2), materials.pins);
    pin.name = `pin${i}`; pin.position.set(x, y, standoff / 2); root.add(pin);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(pr, pr, 0.006, 16, 1).rotateX(Math.PI / 2), materials.pins);
    cap.name = `cap${i}`; cap.position.set(x, y, standoff + thickness + 0.003); root.add(cap);
  });
  const [lw, lh] = logoSize || [width * 0.62, height * 0.5];
  const mat = materials.logo ? materials.logo.clone() : new THREE.MeshStandardMaterial({color: new THREE.Color().setRGB(...logoColor, THREE.SRGBColorSpace), roughness: 0.35, metalness: 0});
  if (logo) { mat.map = logo; mat.alphaTest = 0.5; mat.needsUpdate = true; }
  mat.userData.albedo ??= [mat.color.r, mat.color.g, mat.color.b];   // three keeps colours linear
  const face = new THREE.Mesh(metricUV(new THREE.PlaneGeometry(lw, lh, 8, 4)), mat);
  // the logo spans the texture once: UVs 0..1 across the plane
  const uv = face.geometry.attributes.uv, p = face.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / lw + 0.5, p.getY(i) / lh + 0.5);
  face.name = 'logo'; face.position.set(0, 0, standoff + thickness + 0.0008);
  face.userData.occluder = false;
  root.add(face);
  return root;
}
