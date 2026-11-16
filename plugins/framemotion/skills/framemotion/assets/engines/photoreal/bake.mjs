// Photoreal three.js engine: baked light per vertex. A small CPU path tracer stores, for every
// vertex of the lit meshes, the diffuse light arriving there (irradiance / pi) and the direction it
// mostly comes from, so a frame needs no light computation beyond a texture read.
// Adapted from Leonxlnx/room-at-dawn (MIT, Copyright (c) 2026 Leon Lin, commit aab8be2: src/bake/,
// src/core/gi.js), rewritten for FrameMotion: any scene instead of one room, sun, area lights and
// several window portals, one seeded random stream per point (the result does not depend on how the
// points are split between workers), and no browser needed. Changes are FrameCore Works (Apache-2.0).
//
// Scene rules: a mesh is lit by the bake when its material has userData.gi !== false and
// mesh.userData.gi !== false; everything visible blocks light unless mesh.userData.occluder === false.
// material.userData.albedo ([r, g, b], linear) overrides the material colour for bounce light.

/** Light setup. Colours are linear RGB; a direction points from the surface towards the light. */
export const DEFAULT_LIGHTS = Object.freeze({
  sky: {zenith: [0.35, 0.5, 0.8], horizon: [0.8, 0.85, 0.9], ground: [0.12, 0.11, 0.1]},
  sun: null,          // {direction, irradiance: [r, g, b], angle: radians of the disc's radius, direct: 'baked' | 'realtime'}
  rects: [],          // area lights: {center, u, v (half sides), radiance: [r, g, b]}; they emit on the u x v side
  portals: [],        // openings the sky is seen through (windows): {center, u, v (half sides)}
  maxDepth: 5,
});

const EPS = 6e-4;
const INV_PI = 1 / Math.PI;

/** mulberry32 seeded by a seed and a point index: the same point always draws the same numbers. */
export function pointRandom(seed, index) {
  let s = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(index + 1, 0x85ebca6b)) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function halton(i, base) {
  let f = 1, r = 0;
  while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); }
  return r;
}

function visible(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
function firstMaterial(o) { return Array.isArray(o.material) ? o.material[0] : o.material; }

/** Meshes that carry baked light, in a stable order with stable keys (path of names + index). */
export function litMeshes(root) {
  const out = [], seen = new Map();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.gi === false) return;
    const m = firstMaterial(o);
    if (!m || m.userData?.gi === false || !visible(o)) return;
    let path = o.name || 'mesh';
    for (let p = o.parent; p && p !== root; p = p.parent) path = `${p.name || 'g'}/${path}`;
    const n = seen.get(path) || 0; seen.set(path, n + 1);
    out.push({mesh: o, key: `${path}#${n}`, count: o.geometry.attributes.position.count});
  });
  return out;
}

function albedoOf(THREE, mat) {
  const a = mat.userData?.albedo || (mat.color ? [mat.color.r, mat.color.g, mat.color.b] : [0.5, 0.5, 0.5]);
  const metal = mat.metalness ?? 0;
  // A metal reflects mirror-like and barely scatters diffusely; keep a little for rough metal.
  return a.map((x) => Math.min(0.92, x * (1 - 0.9 * metal)));
}

/**
 * Turn a scene into flat arrays a tracer can use: occluder triangles in world space with a material
 * per triangle, and one light sample per welded vertex (position, normal) with the mesh edges between
 * them for smoothing. Pure data, so it can be sent to workers.
 */
export function collectScene(THREE, root) {
  root.updateMatrixWorld(true);
  const occ = [];
  let nV = 0, nI = 0;
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !visible(o) || o.userData.occluder === false) return;
    const mat = firstMaterial(o);
    if (!mat) return;
    const g = o.geometry;
    occ.push(o); nV += g.attributes.position.count; nI += g.index ? g.index.count : g.attributes.position.count;
  });
  const pos = new Float32Array(nV * 3), idx = new Uint32Array(nI), triMat = new Uint16Array(nI / 3);
  const albedo = [], matId = new Map();
  const v = new THREE.Vector3();
  let vo = 0, io = 0;
  for (const o of occ) {
    const mat = firstMaterial(o);
    let mi = matId.get(mat);
    if (mi === undefined) { mi = albedo.length / 3; matId.set(mat, mi); albedo.push(...albedoOf(THREE, mat)); }
    const p = o.geometry.attributes.position, ind = o.geometry.index, base = vo;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); pos[vo * 3] = v.x; pos[vo * 3 + 1] = v.y; pos[vo * 3 + 2] = v.z; vo++; }
    const n = ind ? ind.count : p.count;
    for (let i = 0; i < n; i++) { idx[io] = base + (ind ? ind.getX(i) : i); if (i % 3 === 0) triMat[io / 3] = mi; io++; }
  }

  const list = litMeshes(root);
  const S = [], key = new Map(), edges = [];
  const n3 = new THREE.Matrix3(), nv = new THREE.Vector3();
  const sampleId = (px, py, pz, nx, ny, nz) => {
    const k = `${Math.round(px * 5000)},${Math.round(py * 5000)},${Math.round(pz * 5000)},${Math.round(nx * 24)},${Math.round(ny * 24)},${Math.round(nz * 24)}`;
    let id = key.get(k);
    if (id === undefined) { id = S.length / 6; key.set(k, id); S.push(px, py, pz, nx, ny, nz); }
    return id;
  };
  for (const e of list) {
    const o = e.mesh, g = o.geometry, p = g.attributes.position, nr = g.attributes.normal, ind = g.index;
    if (!nr) throw new Error(`${e.key}: a lit mesh needs vertex normals`);
    n3.getNormalMatrix(o.matrixWorld);
    // Pull each point a hair towards the middle of its triangles (in the surface plane), so a point
    // on a seam with another surface does not see through it.
    const wp = new Float32Array(p.count * 3), wn = new Float32Array(p.count * 3), pull = new Float32Array(p.count * 3), cnt = new Uint16Array(p.count);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); wp.set([v.x, v.y, v.z], i * 3);
      nv.fromBufferAttribute(nr, i).applyMatrix3(n3).normalize(); wn.set([nv.x, nv.y, nv.z], i * 3);
    }
    const nt = ind ? ind.count : p.count, at = (i) => (ind ? ind.getX(i) : i);
    for (let i = 0; i < nt; i += 3) {
      const tri = [at(i), at(i + 1), at(i + 2)];
      for (let c = 0; c < 3; c++) {
        const mid = (wp[tri[0] * 3 + c] + wp[tri[1] * 3 + c] + wp[tri[2] * 3 + c]) / 3;
        for (const q of tri) pull[q * 3 + c] += mid;
      }
      for (const q of tri) cnt[q]++;
    }
    e.ids = new Uint32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      let [px, py, pz] = [wp[i * 3], wp[i * 3 + 1], wp[i * 3 + 2]];
      const [nx, ny, nz] = [wn[i * 3], wn[i * 3 + 1], wn[i * 3 + 2]];
      if (cnt[i]) {
        let dx = pull[i * 3] / cnt[i] - px, dy = pull[i * 3 + 1] / cnt[i] - py, dz = pull[i * 3 + 2] / cnt[i] - pz;
        const dn = dx * nx + dy * ny + dz * nz; dx -= dn * nx; dy -= dn * ny; dz -= dn * nz;
        const dl = Math.hypot(dx, dy, dz);
        if (dl > 1e-6) { const s = Math.min(0.0025, dl * 0.3) / dl; px += dx * s; py += dy * s; pz += dz * s; }
      }
      e.ids[i] = sampleId(px, py, pz, nx, ny, nz);
    }
    for (let i = 0; i < nt; i += 3) {
      const [a, b, c] = [e.ids[at(i)], e.ids[at(i + 1)], e.ids[at(i + 2)]];
      if (a !== b) edges.push(a, b); if (b !== c) edges.push(b, c); if (c !== a) edges.push(c, a);
    }
  }
  return {pos, idx, triMat, albedo: new Float32Array(albedo), samples: new Float32Array(S), edges: new Uint32Array(edges), list};
}

/**
 * A tracer over the collected scene. MeshBVH comes from three-mesh-bvh. trace(samples, from, to)
 * returns [E/pi rgb, mean light direction xyz, valid] for points from..to-1; each point uses its own
 * random stream, seeded by (seed, index), so the result is the same however the work is split.
 */
export function createTracer({THREE, MeshBVH, scene, lights = DEFAULT_LIGHTS, spp = 128, seed = 1}) {
  const L = {...DEFAULT_LIGHTS, ...lights};
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(scene.pos, 3));
  g.setIndex(new THREE.BufferAttribute(scene.idx, 1));
  const bvh = new MeshBVH(g, {indirect: true});
  const {triMat, albedo} = scene;
  const ray = new THREE.Ray();
  const sun = L.sun ? {...L.sun, dir: norm(L.sun.direction), cosMax: Math.cos(L.sun.angle ?? 0.0047)} : null;
  const rects = (L.rects || []).map((r) => rectInfo(r));
  const portals = (L.portals || []).map((r) => rectInfo(r));
  const portalArea = portals.reduce((s, p) => s + p.area, 0);
  const H2 = Float64Array.from({length: spp}, (_, s) => halton(s + 1, 2));
  const H3 = Float64Array.from({length: spp}, (_, s) => halton(s + 1, 3));
  let rnd = Math.random;

  function sky(dx, dy, dz, out) {
    const s = L.sky;
    if (dy >= 0) { const t = Math.sqrt(dy); for (let c = 0; c < 3; c++) out[c] = s.horizon[c] + (s.zenith[c] - s.horizon[c]) * t; }
    else for (let c = 0; c < 3; c++) out[c] = s.ground[c];
  }
  let hit = null, hitBack = false;
  function cast(ox, oy, oz, dx, dy, dz, far = Infinity) {
    ray.origin.set(ox, oy, oz); ray.direction.set(dx, dy, dz);
    hit = bvh.raycastFirst(ray, THREE.DoubleSide, 0, far);
    if (!hit) return false;
    hitBack = hit.face.normal.x * dx + hit.face.normal.y * dy + hit.face.normal.z * dz > 0;
    return true;
  }
  const cd = [0, 0, 0];
  function cosineDir(nx, ny, nz, u1, u2) {
    const r = Math.sqrt(u1), ph = 2 * Math.PI * u2, x = r * Math.cos(ph), y = r * Math.sin(ph), z = Math.sqrt(Math.max(0, 1 - u1));
    let [tx, ty, tz] = Math.abs(nx) > 0.9 ? [0, 1, 0] : [1, 0, 0];
    let bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
    const bl = 1 / Math.hypot(bx, by, bz); bx *= bl; by *= bl; bz *= bl;
    tx = by * nz - bz * ny; ty = bz * nx - bx * nz; tz = bx * ny - by * nx;
    cd[0] = tx * x + bx * y + nx * z; cd[1] = ty * x + by * y + ny * z; cd[2] = tz * x + bz * y + nz * z;
  }
  // Solid-angle density of choosing direction d by sampling a point on the portals (0 if d misses them).
  function portalPdf(ox, oy, oz, dx, dy, dz) {
    let pdf = 0;
    for (const p of portals) {
      const den = dx * p.n[0] + dy * p.n[1] + dz * p.n[2];
      if (Math.abs(den) < 1e-9) continue;
      const t = ((p.c[0] - ox) * p.n[0] + (p.c[1] - oy) * p.n[1] + (p.c[2] - oz) * p.n[2]) / den;
      if (t <= 0) continue;
      const qx = ox + dx * t - p.c[0], qy = oy + dy * t - p.c[1], qz = oz + dz * t - p.c[2];
      if (Math.abs(qx * p.ue[0] + qy * p.ue[1] + qz * p.ue[2]) > p.hu || Math.abs(qx * p.ve[0] + qy * p.ve[1] + qz * p.ve[2]) > p.hv) continue;
      pdf += (t * t) / (portalArea * Math.abs(den));
    }
    return pdf;
  }
  const skyC = [0, 0, 0];
  // Light from the sun, the area lights and (through the portals) the sky at a point, as E/pi.
  // first: the first vertex, where a realtime sun is left to three.js. Adds to acc, returns luminance.
  const dirAcc = [0, 0, 0];
  function direct(ox, oy, oz, nx, ny, nz, first, acc, u1, u2) {
    let lum = 0;
    if (sun && !(first && sun.direct === 'realtime')) {
      // a direction inside the sun's disc (uniform in the cone)
      const ct = 1 - rnd() * (1 - sun.cosMax), st = Math.sqrt(1 - ct * ct), ph = 2 * Math.PI * rnd();
      const [a, b] = basis(sun.dir);
      const dx = sun.dir[0] * ct + (a[0] * Math.cos(ph) + b[0] * Math.sin(ph)) * st;
      const dy = sun.dir[1] * ct + (a[1] * Math.cos(ph) + b[1] * Math.sin(ph)) * st;
      const dz = sun.dir[2] * ct + (a[2] * Math.cos(ph) + b[2] * Math.sin(ph)) * st;
      const c = dx * nx + dy * ny + dz * nz;
      if (c > 0 && !cast(ox, oy, oz, dx, dy, dz)) {
        for (let k = 0; k < 3; k++) acc[k] += sun.irradiance[k] * c * INV_PI;
        const l = luma(sun.irradiance) * c * INV_PI; lum += l; if (first) addDir(dx, dy, dz, l);
      }
    }
    for (const r of rects) {
      const s = 2 * rnd() - 1, t = 2 * rnd() - 1;
      const qx = r.c[0] + r.u[0] * s + r.v[0] * t, qy = r.c[1] + r.u[1] * s + r.v[1] * t, qz = r.c[2] + r.u[2] * s + r.v[2] * t;
      let dx = qx - ox, dy = qy - oy, dz = qz - oz; const d2 = dx * dx + dy * dy + dz * dz, dl = Math.sqrt(d2);
      dx /= dl; dy /= dl; dz /= dl;
      const cs = dx * nx + dy * ny + dz * nz, cl = -(dx * r.n[0] + dy * r.n[1] + dz * r.n[2]);
      if (cs <= 0 || cl <= 0 || cast(ox, oy, oz, dx, dy, dz, dl - EPS)) continue;
      const f = cs * cl * r.area / d2 * INV_PI;
      for (let k = 0; k < 3; k++) acc[k] += r.radiance[k] * f;
      const l = luma(r.radiance) * f; lum += l; if (first) addDir(dx, dy, dz, l);
    }
    if (portals.length) {
      // pick a portal by area, a point on it, and weigh against cosine sampling (balance heuristic)
      let pick = rnd() * portalArea, p = portals[0];
      for (const q of portals) { if (pick < q.area) { p = q; break; } pick -= q.area; }
      const s = 2 * u1 - 1, t = 2 * u2 - 1;
      let dx = p.c[0] + p.u[0] * s + p.v[0] * t - ox, dy = p.c[1] + p.u[1] * s + p.v[1] * t - oy, dz = p.c[2] + p.u[2] * s + p.v[2] * t - oz;
      const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      const c = dx * nx + dy * ny + dz * nz;
      if (c > 1e-6 && !cast(ox, oy, oz, dx, dy, dz)) {
        const pp = portalPdf(ox, oy, oz, dx, dy, dz), pc = c * INV_PI;
        if (pp > 0) {
          sky(dx, dy, dz, skyC);
          const w = pc / (pp + pc);
          for (let k = 0; k < 3; k++) acc[k] += skyC[k] * w;
          const l = luma(skyC) * w; lum += l; if (first) addDir(dx, dy, dz, l);
        }
      }
    }
    return lum;
  }
  function addDir(dx, dy, dz, w) { dirAcc[0] += dx * w; dirAcc[1] += dy * w; dirAcc[2] += dz * w; }

  // One path from a point: E/pi estimate added to acc. Indirect light is the throughput times the
  // direct light at each further vertex, plus the sky when the path escapes.
  function path(ox, oy, oz, nx, ny, nz, u1, u2, acc) {
    let tr = 1, tg = 1, tb = 1;
    const tmp = [0, 0, 0];
    for (let depth = 0; depth < L.maxDepth; depth++) {
      tmp[0] = tmp[1] = tmp[2] = 0;
      direct(ox, oy, oz, nx, ny, nz, depth === 0, tmp, depth === 0 ? u1 : rnd(), depth === 0 ? u2 : rnd());
      acc[0] += tr * tmp[0]; acc[1] += tg * tmp[1]; acc[2] += tb * tmp[2];
      cosineDir(nx, ny, nz, depth === 0 ? (u1 + 0.5) % 1 : rnd(), depth === 0 ? (u2 + 0.5) % 1 : rnd());
      const [dx, dy, dz] = cd;
      if (!cast(ox, oy, oz, dx, dy, dz)) {
        sky(dx, dy, dz, skyC);
        let w = 1;
        if (portals.length) { const pp = portalPdf(ox, oy, oz, dx, dy, dz), pc = (dx * nx + dy * ny + dz * nz) * INV_PI; w = pp > 0 ? pc / (pc + pp) : 1; }
        acc[0] += tr * skyC[0] * w; acc[1] += tg * skyC[1] * w; acc[2] += tb * skyC[2] * w;
        if (depth === 0) addDir(dx, dy, dz, luma(skyC) * w);
        return 0;
      }
      if (depth === 0 && hitBack && hit.distance < 0.04) return 1;   // the point sits inside something
      if (hitBack) return 0;                                         // back faces absorb
      const m = triMat[hit.faceIndex] * 3;
      tr *= albedo[m]; tg *= albedo[m + 1]; tb *= albedo[m + 2];
      if (depth >= 2) { const q = Math.min(0.92, Math.max(tr, tg, tb)); if (rnd() > q) return 0; tr /= q; tg /= q; tb /= q; }
      nx = hit.face.normal.x; ny = hit.face.normal.y; nz = hit.face.normal.z;
      ox = hit.point.x + nx * EPS; oy = hit.point.y + ny * EPS; oz = hit.point.z + nz * EPS;
    }
    return 0;
  }

  function trace(S, from, to) {
    const out = new Float32Array((to - from) * 7), acc = [0, 0, 0];
    for (let i = from; i < to; i++) {
      rnd = pointRandom(seed, i);
      const [px, py, pz, nx, ny, nz] = S.subarray(i * 6, i * 6 + 6);
      const ox = px + nx * EPS * 1.5, oy = py + ny * EPS * 1.5, oz = pz + nz * EPS * 1.5;
      const j1 = rnd(), j2 = rnd();
      let er = 0, eg = 0, eb = 0, inside = 0;
      dirAcc[0] = dirAcc[1] = dirAcc[2] = 0;
      for (let s = 0; s < spp; s++) {
        acc[0] = acc[1] = acc[2] = 0;
        inside += path(ox, oy, oz, nx, ny, nz, (H2[s] + j1) % 1, (H3[s] + j2) % 1, acc);
        er += Math.min(acc[0], 30); eg += Math.min(acc[1], 30); eb += Math.min(acc[2], 30);
      }
      const o = (i - from) * 7, dl = Math.hypot(dirAcc[0], dirAcc[1], dirAcc[2]);
      out[o] = er / spp; out[o + 1] = eg / spp; out[o + 2] = eb / spp;
      if (dl > 1e-9) { out[o + 3] = dirAcc[0] / dl; out[o + 4] = dirAcc[1] / dl; out[o + 5] = dirAcc[2] / dl; }
      out[o + 6] = inside > spp * 0.35 ? 0 : 1;
    }
    return out;
  }
  return {trace};
}

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
function luma(c) { return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function basis(n) {
  const t = Math.abs(n[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0];
  const a = norm([n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]]);
  return [a, [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]]];
}
function rectInfo(r) {
  const hu = Math.hypot(...r.u), hv = Math.hypot(...r.v);
  const n = norm([r.u[1] * r.v[2] - r.u[2] * r.v[1], r.u[2] * r.v[0] - r.u[0] * r.v[2], r.u[0] * r.v[1] - r.u[1] * r.v[0]]);
  return {...r, c: r.center, n, hu, hv, ue: r.u.map((x) => x / hu), ve: r.v.map((x) => x / hv), area: 4 * hu * hv};
}

/**
 * Fill points that sat inside geometry from their neighbours, then smooth along the mesh edges
 * where neighbours face the same way and are similarly bright (keeps shadow edges).
 */
export function smoothResult(R, samples, edges, iterations = 2) {
  const n = samples.length / 6, E = new Float32Array(n * 3), D = new Float32Array(n * 3), ok = new Uint8Array(n);
  for (let i = 0; i < n; i++) { E.set(R.subarray(i * 7, i * 7 + 3), i * 3); D.set(R.subarray(i * 7 + 3, i * 7 + 6), i * 3); ok[i] = R[i * 7 + 6]; }
  const acc = new Float32Array(n * 6), w = new Float32Array(n);
  for (let pass = 0; pass < 8; pass++) {
    acc.fill(0); w.fill(0); let filled = 0;
    for (let k = 0; k < edges.length; k += 2) {
      const a = edges[k], b = edges[k + 1];
      for (const [x, y] of [[a, b], [b, a]]) if (!ok[x] && ok[y] === 1) { for (let c = 0; c < 3; c++) { acc[x * 6 + c] += E[y * 3 + c]; acc[x * 6 + 3 + c] += D[y * 3 + c]; } w[x]++; }
    }
    for (let i = 0; i < n; i++) if (!ok[i] && w[i] > 0) { for (let c = 0; c < 3; c++) { E[i * 3 + c] = acc[i * 6 + c] / w[i]; D[i * 3 + c] = acc[i * 6 + 3 + c] / w[i]; } ok[i] = 2; filled++; }
    for (let i = 0; i < n; i++) if (ok[i] === 2) ok[i] = 1;
    if (!filled) break;
  }
  const lum = (i) => 0.2126 * E[i * 3] + 0.7152 * E[i * 3 + 1] + 0.0722 * E[i * 3 + 2];
  for (let it = 0; it < iterations; it++) {
    acc.fill(0); w.fill(0);
    for (let k = 0; k < edges.length; k += 2) {
      const a = edges[k], b = edges[k + 1];
      const nd = samples[a * 6 + 3] * samples[b * 6 + 3] + samples[a * 6 + 4] * samples[b * 6 + 4] + samples[a * 6 + 5] * samples[b * 6 + 5];
      if (nd < 0.9) continue;
      const la = lum(a), lb = lum(b), d = (la - lb) / (0.15 * (la + lb) + 1e-4), ww = 1 / (1 + d * d);
      for (let c = 0; c < 3; c++) { acc[a * 6 + c] += ww * E[b * 3 + c]; acc[a * 6 + 3 + c] += ww * D[b * 3 + c]; acc[b * 6 + c] += ww * E[a * 3 + c]; acc[b * 6 + 3 + c] += ww * D[a * 3 + c]; }
      w[a] += ww; w[b] += ww;
    }
    for (let i = 0; i < n; i++) {
      if (w[i] <= 0) continue;
      const self = Math.max(1, w[i] * 0.6);
      for (let c = 0; c < 3; c++) { E[i * 3 + c] = (E[i * 3 + c] * self + acc[i * 6 + c]) / (self + w[i]); D[i * 3 + c] = (D[i * 3 + c] * self + acc[i * 6 + 3 + c]) / (self + w[i]); }
    }
  }
  return {E, D};
}

/** Per-mesh attribute arrays (gi = E/pi, gd = light direction) from the smoothed point results. */
export function meshAttributes(list, E, D) {
  return list.map((e) => {
    const gi = new Float32Array(e.count * 3), gd = new Float32Array(e.count * 3);
    for (let i = 0; i < e.count; i++) for (let c = 0; c < 3; c++) { gi[i * 3 + c] = E[e.ids[i] * 3 + c]; gd[i * 3 + c] = D[e.ids[i] * 3 + c]; }
    return {key: e.key, count: e.count, gi, gd};
  });
}

/** Bake in this thread (tests, small scenes). For a real scene use bake-node.mjs, which splits the points over workers. */
export function bakeHere({THREE, MeshBVH, root, lights, spp = 64, seed = 1, smooth = 2}) {
  const scene = collectScene(THREE, root);
  const R = createTracer({THREE, MeshBVH, scene, lights, spp, seed}).trace(scene.samples, 0, scene.samples.length / 6);
  const {E, D} = smoothResult(R, scene.samples, scene.edges, smooth);
  return {meshes: meshAttributes(scene.list, E, D), points: scene.samples.length / 6, raw: R};
}
