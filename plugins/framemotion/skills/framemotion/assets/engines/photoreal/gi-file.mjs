// Photoreal three.js engine: the baked-light file. A small header (magic, JSON manifest) and the
// per-vertex light of every lit mesh as half floats. Keys are the meshes' name paths, so a file
// baked from a scene applies to the same scene built again in the browser; a mesh whose key or
// vertex count changed is reported as stale and gets flat placeholder light.
// Format after room-at-dawn's gi.bin (MIT, Leon Lin, commit aab8be2); FrameCore Works code (Apache-2.0).

const MAGIC = 0x46474931; // "1IGF": FrameMotion GI, version 1

/** meshes: [{key, count, gi, gd}] -> ArrayBuffer. meta is any JSON (light setup, samples, seed). */
export function packBake(THREE, meshes, meta = {}) {
  const man = {version: 1, meta, meshes: []};
  let total = 0;
  for (const m of meshes) { man.meshes.push({key: m.key, count: m.count, off: total}); total += m.count * 6; }
  const json = new TextEncoder().encode(JSON.stringify(man));
  const pad = (4 - ((8 + json.length) % 4)) % 4;
  const buf = new ArrayBuffer(8 + json.length + pad + total * 2);
  const dv = new DataView(buf);
  dv.setUint32(0, MAGIC, true); dv.setUint32(4, json.length, true);
  new Uint8Array(buf, 8, json.length).set(json);
  const data = new Uint16Array(buf, 8 + json.length + pad, total);
  let o = 0;
  for (const m of meshes) for (const a of [m.gi, m.gd]) for (let i = 0; i < a.length; i++) data[o++] = THREE.DataUtils.toHalfFloat(Math.max(-60000, Math.min(60000, a[i])));
  return buf;
}

/** ArrayBuffer -> {meta, meshes: Map(key -> {count, gi, gd})}. Throws on a file that is not a bake. */
export function readBake(THREE, buf) {
  const dv = new DataView(buf);
  if (buf.byteLength < 8 || dv.getUint32(0, true) !== MAGIC) throw new Error('not a FrameMotion light bake');
  const jl = dv.getUint32(4, true);
  const man = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, jl)));
  const pad = (4 - ((8 + jl) % 4)) % 4;
  const data = new Uint16Array(buf, 8 + jl + pad);
  const meshes = new Map();
  for (const m of man.meshes) {
    const read = (from) => { const a = new Float32Array(m.count * 3); for (let i = 0; i < a.length; i++) a[i] = THREE.DataUtils.fromHalfFloat(data[from + i]); return a; };
    meshes.set(m.key, {count: m.count, gi: read(m.off), gd: read(m.off + m.count * 3)});
  }
  return {meta: man.meta, meshes};
}
