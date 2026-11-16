// Photoreal three.js engine: procedural materials. Painted woodchip wall, oak floor planks, wood,
// lacquer, steel, woven fabric and plastic for MeshStandardMaterial / MeshPhysicalMaterial, with every
// texture computed from seeded noise when the material is made (no image files), the same in the
// browser and in Node. Each material carries userData.albedo, its average linear colour, which the
// light bake uses for bounce light; a textured material is otherwise baked by its plain colour.
// Textures are laid out in metres: give a mesh UVs in metres (metricUV below, or your own) and a
// texture repeats every `tile` metres.
// Adapted from Leonxlnx/room-at-dawn (MIT, Copyright (c) 2026 Leon Lin, commit aab8be2:
// src/scene/materials.js, src/core/tex.js, src/core/rng.js): the noise (mulberry32, lattice hash,
// tiling value noise and fbm), the height-to-normal step and the recipes for woodchip paper, plank
// grain with growth rings and pores, wood streaks, orange-peel lacquer and plain weave. Rewritten for
// FrameMotion: one library object per scene, THREE passed in so the bake can build the same scene in
// Node, sizes scaled by `quality`, simpler floor (no knots, no stagger solver), steel and plastic
// added, no shader hooks. Changes are FrameCore Works (Apache-2.0).

// ---------------------------------------------------------------- noise (seeded, tiling)
export function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash2(ix, iy, seed) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Value noise 0..1 that tiles every px cells along x and py along y (whole numbers). */
export function pnoise(x, y, seed, px, py) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  let x0 = ix % px, y0 = iy % py; if (x0 < 0) x0 += px; if (y0 < 0) y0 += py;
  const x1 = x0 + 1 === px ? 0 : x0 + 1, y1 = y0 + 1 === py ? 0 : y0 + 1;
  const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed), c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Fractal sum of pnoise, tiling px x py base cells. */
export function pfbm(x, y, oct, seed, px, py) {
  let a = 0.5, s = 0, n = 0, f = 1;
  for (let i = 0; i < oct; i++) { s += a * pnoise(x * f, y * f, seed + i * 17, px * f, py * f); n += a; a *= 0.5; f *= 2; }
  return s / n;
}
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** Height field -> RGBA8 tangent-space normals, wrapping. sx, sy: 1 / texel size in the height's unit, per axis. */
export function normalBytes(H, w, h, sx = 1, sy = sx) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const ym = (y === 0 ? h - 1 : y - 1) * w, yp = (y === h - 1 ? 0 : y + 1) * w, yo = y * w;
    for (let x = 0; x < w; x++) {
      const dx = (H[yo + (x === w - 1 ? 0 : x + 1)] - H[yo + (x === 0 ? w - 1 : x - 1)]) * 0.5 * sx;
      const dy = (H[yp + x] - H[ym + x]) * 0.5 * sy;
      const il = 1 / Math.sqrt(dx * dx + dy * dy + 1), i = (yo + x) * 4;
      out[i] = (-dx * il * 0.5 + 0.5) * 255 + 0.5; out[i + 1] = (-dy * il * 0.5 + 0.5) * 255 + 0.5;
      out[i + 2] = (il * 0.5 + 0.5) * 255 + 0.5; out[i + 3] = 255;
    }
  }
  return out;
}

/**
 * UVs in metres for a mesh built from flat faces (planes, boxes, the props): each vertex takes the two
 * position axes across its normal's main axis, times `scale`. Replaces the geometry's uv attribute.
 */
export function metricUV(geometry, scale = 1) {
  const p = geometry.attributes.position, n = geometry.attributes.normal;
  if (!n) throw new Error('metricUV needs vertex normals');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ax >= ay && ax >= az ? [p.getZ(i), p.getY(i)] : ay >= az ? [p.getX(i), p.getZ(i)] : [p.getX(i), p.getY(i)];
    uv[i * 2] = u * scale; uv[i * 2 + 1] = v * scale;
  }
  geometry.setAttribute('uv', new geometry.attributes.position.constructor(uv, 2));
  return geometry;
}

// ---------------------------------------------------------------- the library
/**
 * createMaterials(THREE, {quality}) -> {wall, oakFloor, wood, lacquer, steel, fabric, plastic}.
 * quality 1 makes 512 px textures (1024 for the floor); 0.5 halves them (faster in a bake), 2 doubles
 * them. Colours are sRGB triples 0..1. The same arguments give the same material object (cached).
 */
export function createMaterials(THREE, {quality = 1} = {}) {
  if (!(quality > 0 && quality <= 4)) throw new RangeError('proc-materials: quality must be above 0 and at most 4');
  const size = (n) => 2 ** Math.round(Math.log2(Math.max(64, n * quality)));
  const cache = new Map();
  const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
  const srgb = (c) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);

  function tex(data, w, h, {color = false, tile = 1} = {}) {
    const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    t.anisotropy = 8;
    t.repeat.set(1 / tile, 1 / tile);
    t.needsUpdate = true;
    return t;
  }
  const grey = (F, w, h, o) => { const b = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) { const g = clamp(F[i]) * 255 + 0.5; b[i * 4] = b[i * 4 + 1] = b[i * 4 + 2] = g; b[i * 4 + 3] = 255; } return tex(b, w, h, o); };
  const average = (bytes) => {
    const s = [0, 0, 0]; let n = 0;
    for (let i = 0; i < bytes.length; i += 4 * 7) { s[0] += toLinear(bytes[i] / 255); s[1] += toLinear(bytes[i + 1] / 255); s[2] += toLinear(bytes[i + 2] / 255); n++; }
    return s.map((x) => Math.round((x / n) * 1e4) / 1e4);
  };
  const finish = (m, albedo, name) => { m.userData.albedo = albedo; m.userData.proc = name; m.name = name; return m; };

  /** Roller-painted woodchip paper: small flakes under paint. tile 0.9 m. */
  function wall({color = [0.86, 0.84, 0.8], tile = 0.9, roughness = 0.92, relief = 1} = {}) {
    return once(`wall|${color}|${tile}|${roughness}|${relief}`, () => {
      const N = size(512), H = new Float32Array(N * N), rnd = mulberry32(4711), px = (tile * 1000) / N;   // mm per texel
      const flakes = Math.round(13000 * (tile / 0.9) ** 2);                              // same density per square metre
      for (let i = 0; i < flakes; i++) {
        const cx = rnd() * N, cy = rnd() * N, ang = rnd() * Math.PI, s = rnd(), big = s > 0.93;
        const a = (big ? 3.4 + rnd() * 2 : 1.2 + s * 2.5) / px, b = (big ? 1.3 + rnd() * 0.8 : 0.75 + rnd() * 0.75) / px;
        const hgt = (big ? 0.5 : 0.25 + s * 0.16) * (0.7 + rnd() * 0.6), ca = Math.cos(ang), sa = Math.sin(ang), r = Math.ceil(a) + 1;
        const x0 = Math.floor(cx), y0 = Math.floor(cy);
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          const ox = x0 + dx + 0.5 - cx, oy = y0 + dy + 0.5 - cy, lu = (ox * ca + oy * sa) / a, lv = (oy * ca - ox * sa) / b, q = 1 - lu * lu - lv * lv;
          if (q <= 0) continue;
          const k = (((y0 + dy) % N + N) % N) * N + (((x0 + dx) % N + N) % N), hv = hgt * sm(q / 0.6);
          if (hv > H[k]) H[k] = hv;
        }
      }
      // paint fills the gaps a little and the roller leaves a soft orange peel
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) H[y * N + x] += (pfbm((x / N) * 24, (y / N) * 24, 3, 9, 24, 24) - 0.5) * 0.12;
      const m = new THREE.MeshStandardMaterial({color: srgb(color), roughness, normalMap: tex(normalBytes(H, N, N, (relief * 1) / px), N, N, {tile})});
      return finish(m, color.map(toLinear), 'wall');
    });
  }

  /** Oak planks laid along u: own tone and ring pattern per plank, a micro-bevel on every edge. */
  function oakFloor({plank = [1.2, 0.19], rows = 8, lengths = 3, tone = [0.784, 0.679, 0.543], gloss = 0.3, seed = 77} = {}) {
    return once(`oak|${plank}|${rows}|${lengths}|${tone}|${gloss}|${seed}`, () => {
      const [PL, PW] = plank, TW = rows * PW, TL = lengths * PL, N = size(1024);
      const H = new Float32Array(N * N), R = new Float32Array(N * N), col = new Uint8Array(N * N * 4), rnd = mulberry32(seed);
      const off = Array.from({length: rows}, (_, r) => (r * 0.38 + rnd() * 0.2) % 1);     // end joints stepped across rows
      const P = Array.from({length: rows * lengths}, () => ({
        ox: rnd() * 256, oy: rnd() * 256, lum: (rnd() - 0.5) * 0.14, warm: rnd() * 2 - 1,
        c0: rnd() < 0.6 ? 0.03 + rnd() * 0.13 : -0.5 + rnd() * 0.38, h0: rnd() * 0.05, k: (rnd() * 0.08) * (rnd() < 0.5 ? -1 : 1),
        rw: 0.0048 + rnd() * 0.0037, ring: 0.07 + rnd() * 0.06, gloss: (rnd() - 0.5) * 0.06,
      }));
      for (let y = 0; y < N; y++) {
        const t0 = (y / N) * TW, row = Math.min(rows - 1, Math.floor(t0 / PW)), t = t0 - row * PW;   // across the plank (m)
        for (let x = 0; x < N; x++) {
          const vv = (x / N) * lengths + off[row], fl = Math.floor(vv), s = (vv - fl) * PL, p = P[row * lengths + (fl % lengths)];
          const a0 = t - p.c0, b0 = p.h0 + p.k * (s - PL / 2);
          const w1 = pnoise(s * 2.6 + p.ox, t * 22 + p.oy, 3, 4096, 4096), fa = pnoise(s * 7 + p.ox, t * 260 + p.oy, 5, 4096, 4096);
          const r = Math.sqrt(a0 * a0 + b0 * b0) + (w1 - 0.5) * 0.016, ph = r / p.rw, f = ph - Math.floor(ph);
          const pore = (f < 0.14 ? f / 0.14 : 1) * (1 - sm((f - 0.18) / 0.6)) * (0.45 + fa);
          const g = (fa - 0.5) * 0.11 + (w1 - 0.5) * 0.09 - pore * p.ring;
          const edge = Math.min(t, PW - t, s, PL - s), bev = edge < 0.0017 ? sm((0.0017 - edge) / 0.0013) : 0;
          const L = (1 + p.lum) * (1 + g) * (1 - 0.42 * bev), dk = g < 0 ? -g : 0, i = y * N + x;
          col[i * 4] = clamp(tone[0] * L * (1 + 0.012 * p.warm)) * 255 + 0.5;
          col[i * 4 + 1] = clamp(tone[1] * L * (1 - 0.1 * dk)) * 255 + 0.5;
          col[i * 4 + 2] = clamp(tone[2] * L * (1 - 0.28 * dk - 0.03 * p.warm)) * 255 + 0.5;
          col[i * 4 + 3] = 255;
          H[i] = -0.32 * bev - 0.05 * pore;                                                 // mm
          R[i] = clamp(gloss + p.gloss + pore * 0.045 + bev * 0.35 + (fa - 0.5) * 0.05, 0.12, 1);
        }
      }
      // the texture is square but covers TL x TW metres: stretch the repeat per axis
      const mk = (t) => { t.repeat.set(1 / TL, 1 / TW); return t; };
      const m = new THREE.MeshStandardMaterial({
        map: mk(tex(col, N, N, {color: true})), normalMap: mk(tex(normalBytes(H, N, N, N / (TL * 1000), N / (TW * 1000)), N, N)),
        roughnessMap: mk(grey(R, N, N)), roughness: 1,
      });
      return finish(m, average(col), 'oak-floor');
    });
  }

  /** Wood for furniture: rings and streaks along u, open pores. tone sRGB; tile 1 m. */
  function wood({tone = [0.62, 0.45, 0.3], tile = 1, contrast = 1, seed = 5, roughness = 0.5} = {}) {
    return once(`wood|${tone}|${tile}|${contrast}|${seed}|${roughness}`, () => {
      const N = size(512), H = new Float32Array(N * N), R = new Float32Array(N * N), col = new Uint8Array(N * N * 4);
      const fr = 22, fs = 140, fp = 700;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N;
        const warp = pfbm(u * 3, v * 5, 3, seed, 3, 5), rings = Math.sin((v * fr + warp * 5) * Math.PI * 2);
        const streak = pfbm(u * 4, v * fs, 3, seed + 3, 4, fs), pores = pnoise(u * 90, v * fp, seed + 7, 90, fp);
        const g = clamp(0.5 + (0.22 * rings * warp + (streak - 0.5) * 0.6) * contrast), dark = pores > 0.82 ? (pores - 0.82) * 2 : 0;
        const k = 0.8 + g * 0.3 - dark * 0.45, i = y * N + x;
        H[i] = (g - 0.5) * 0.2 - dark * 0.4; R[i] = clamp(roughness + (0.5 - g) * 0.14 + dark * 0.3);
        col[i * 4] = clamp(tone[0] * k) * 255 + 0.5; col[i * 4 + 1] = clamp(tone[1] * k) * 255 + 0.5; col[i * 4 + 2] = clamp(tone[2] * k) * 255 + 0.5; col[i * 4 + 3] = 255;
      }
      const m = new THREE.MeshStandardMaterial({map: tex(col, N, N, {color: true, tile}), normalMap: tex(normalBytes(H, N, N, 1.6 * N / 1024), N, N, {tile}), roughnessMap: grey(R, N, N, {tile}), roughness: 1});
      return finish(m, average(col), 'wood');
    });
  }

  // fine orange peel, shared by lacquer and plastic
  const peel = () => once('peel', () => {
    const N = size(256), H = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) H[y * N + x] = pfbm((x / N) * 32, (y / N) * 32, 3, 21, 32, 32);
    return normalBytes(H, N, N, 1.4 * N / 512);
  });
  const peelTex = (tile) => { const N = size(256); return tex(peel(), N, N, {tile}); };

  /** Lacquered or painted surface under a clear coat: base colour, satin base, glossy coat with orange peel. */
  function lacquer({color = [0.12, 0.13, 0.14], roughness = 0.45, coat = 1, coatRoughness = 0.06, metallic = 0} = {}) {
    return once(`lacq|${color}|${roughness}|${coat}|${coatRoughness}|${metallic}`, () => {
      const m = new THREE.MeshPhysicalMaterial({
        color: srgb(color), roughness, metalness: metallic, clearcoat: coat, clearcoatRoughness: coatRoughness,
        clearcoatNormalMap: peelTex(0.08), clearcoatNormalScale: new THREE.Vector2(0.15, 0.15),
      });
      return finish(m, color.map(toLinear), 'lacquer');
    });
  }

  /** Steel: 'brushed' (streaks along u, anisotropic highlight), 'satin' or 'polished'. */
  function steel({finish: kind = 'brushed', tone = [0.78, 0.78, 0.79], tile = 0.3, seed = 13} = {}) {
    if (!['brushed', 'satin', 'polished'].includes(kind)) throw new RangeError(`proc-materials: steel finish "${kind}" is not brushed, satin or polished`);
    return once(`steel|${kind}|${tone}|${tile}|${seed}`, () => {
      const base = {brushed: 0.3, satin: 0.42, polished: 0.08}[kind];
      const p = {color: srgb(tone), metalness: 1, roughness: base};
      if (kind !== 'polished') {
        const N = size(512), H = new Float32Array(N * N), R = new Float32Array(N * N), cross = kind === 'brushed' ? 400 : 60;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const u = x / N, v = y / N, line = pnoise(u * 3, v * cross, seed, 3, cross), smear = pfbm(u * 4, v * 4, 3, seed + 5, 4, 4);
          H[y * N + x] = line * 0.6 + smear * 0.2;
          R[y * N + x] = clamp(base + (line - 0.5) * 0.12 + (smear - 0.5) * 0.1);
        }
        Object.assign(p, {roughness: 1, roughnessMap: grey(R, N, N, {tile}), normalMap: tex(normalBytes(H, N, N, 0.6 * N / 512), N, N, {tile}), normalScale: new THREE.Vector2(0.3, 0.3)});
        if (kind === 'brushed') Object.assign(p, {anisotropy: 0.6, anisotropyRotation: 0});
      }
      return finish(new THREE.MeshPhysicalMaterial(p), tone.map(toLinear), `steel-${kind}`);
    });
  }

  /** Plain-weave cloth with sheen. threads per tile; slub roughens the threads like linen. */
  function fabric({color = [0.35, 0.38, 0.45], threads = 96, tile = 0.12, slub = 0.3, sheen = 0.4} = {}) {
    return once(`fab|${color}|${threads}|${tile}|${slub}|${sheen}`, () => {
      const N = size(512), H = new Float32Array(N * N), T = threads;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const fxT = (x / N) * T, fyT = (y / N) * T, ix = Math.floor(fxT), iy = Math.floor(fyT), fx = fxT - ix, fy = fyT - iy, over = (ix + iy) & 1;
        const wx = 0.75 + slub * (hash2(ix, 7, 1) - 0.5) * 1.6, wy = 0.75 + slub * (hash2(3, iy, 2) - 0.5) * 1.6;
        const tx = Math.max(0, 1 - Math.abs(fx - 0.5) * 2 / wx), ty = Math.max(0, 1 - Math.abs(fy - 0.5) * 2 / wy);
        const warp = Math.sqrt(tx) * (over ? 1 : 0.55) * (0.6 + 0.4 * Math.sin(fy * Math.PI));
        const weft = Math.sqrt(ty) * (over ? 0.55 : 1) * (0.6 + 0.4 * Math.sin(fx * Math.PI));
        H[y * N + x] = Math.max(warp, weft) + (pnoise((x / N) * 40, (y / N) * 40, 4, 40, 40) - 0.5) * 0.25 * slub;
      }
      const c = srgb(color);
      const m = new THREE.MeshPhysicalMaterial({
        color: c, roughness: 0.95, normalMap: tex(normalBytes(H, N, N, 2 * N / 512), N, N, {tile}), normalScale: new THREE.Vector2(0.8, 0.8),
        sheen, sheenRoughness: 0.6, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.5),
      });
      return finish(m, color.map(toLinear), 'fabric');
    });
  }

  /** Moulded plastic with a faint orange peel. */
  function plastic({color = [0.9, 0.9, 0.89], roughness = 0.38} = {}) {
    return once(`plastic|${color}|${roughness}`, () => {
      const m = new THREE.MeshStandardMaterial({color: srgb(color), roughness, normalMap: peelTex(0.05), normalScale: new THREE.Vector2(0.08, 0.08)});
      return finish(m, color.map(toLinear), 'plastic');
    });
  }

  return {wall, oakFloor, wood, lacquer, steel, fabric, plastic};
}
