/*!
 * FrameMotion teardown: a labelled exploded view of a flat, layered object (a phone, a watch, a tablet,
 * a card, a remote) from a JSON spec, on the cutaway kit (runSim, createStage and the pure-time helpers).
 * FrameCore Works code (Apache-2.0), rewritten after skills/breakdown/template.html of
 * artemnovitckii/claude-animation-skills (MIT, Copyright (c) 2026 Artem Novitckii, commit
 * 5dbea55c23aa6a5c93dc3cfb5583840513b56b94): the layout (rounded slabs, painted faces, labels in a right-hand
 * column numbered in screen order) and several values follow it; no file of it is copied. It also follows the
 * cutaway method of Nyxera0x/cutaway (MIT): every part its own camera, render(t) a pure function of time.
 *
 * The cutaway builder makes the page from a spec.json alone ("build": {"tool": "cutaway", "spec": ...}).
 * The spec (every field but layers is optional; see README.md):
 *   title, subtitle, partsLabel, accent ("#RRGGBB"), theme ("dark" | "light"), fps, hold, seed
 *   shape {w, l, r}         the outline: width, length and corner radius in model units
 *   screen {time, date}     what a "screen" face shows
 *   layers [...]            top first, 2 to 8 parts:
 *       name, note          the label ("" as name hides it)
 *       finish              glass | gloss | matte | metal
 *       face                plain | screen | frame | board | battery | ring
 *       details             any of camera, ring, antenna, buttons, island
 *       color, h, inset     colour, thickness, how much smaller than the outline
 *       w, l, r, x, z       an own size and place (for parts that share a level)
 *       level               parts with the same level number lie side by side and move together
 *   focus ["<name>", ...]   parts that slide out in turn under their own camera
 * The film: the object turning, the levels lifting apart top first, the labels drawing in and holding long
 * enough to read, each focus part sliding out and back, a second read, the levels closing, a hold.
 */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {runSim} from 'cutaway-kit/runtime.js';
import {createStage} from 'cutaway-kit/stage3d.js';
import {clamp01, lerp, prog, keyed, rng, smooth, easeInOutCubic} from 'cutaway-kit/util.js';
import interExt from '@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2';
import monoExt from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-ext-600-normal.woff2';

const EXT_RANGE = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';
const FINISHES = ['glass', 'gloss', 'matte', 'metal'];
const FACES = ['plain', 'screen', 'frame', 'board', 'battery', 'ring'];
const DETAILS = ['camera', 'ring', 'antenna', 'buttons', 'island'];
const rad = (d) => (d * Math.PI) / 180;

/** Check a spec and fill its defaults; throws a plain message on a wrong field. */
export function normalizeSpec(spec) {
  const s = JSON.parse(JSON.stringify(spec || {}));
  if (!Array.isArray(s.layers) || s.layers.length < 2 || s.layers.length > 8) throw new Error('teardown: layers needs 2 to 8 entries, top layer first');
  s.title = s.title ?? 'Object';
  s.subtitle = s.subtitle ?? 'Exploded view';
  s.accent = /^#[0-9a-f]{6}$/i.test(s.accent ?? '') ? s.accent : '#3D8BFF';
  s.theme = s.theme === 'light' ? 'light' : 'dark';
  s.fps = s.fps ?? 30;
  s.hold = Math.max(0, s.hold ?? 1.2);
  s.seed = s.seed ?? 7;
  s.partsLabel = s.partsLabel ?? 'parts';
  s.shape = {w: 7.2, l: 15, r: 1.0, ...(s.shape || {})};
  s.screen = {time: '9:41', date: '', ...(s.screen || {})};
  const keys = [];
  s.layers = s.layers.map((L, i) => {
    const finish = L.finish ?? 'matte', face = L.face ?? 'plain';
    if (!FINISHES.includes(finish)) throw new Error(`teardown: layer ${i + 1} finish must be one of ${FINISHES.join(', ')}`);
    if (!FACES.includes(face)) throw new Error(`teardown: layer ${i + 1} face must be one of ${FACES.join(', ')}`);
    const details = L.details ?? (face === 'frame' ? ['buttons'] : face === 'ring' ? ['ring'] : []);
    for (const d of details) if (!DETAILS.includes(d)) throw new Error(`teardown: layer ${i + 1} details must be among ${DETAILS.join(', ')}`);
    const inset = L.inset ?? 0;
    const key = L.level === undefined ? `auto${i}` : `level${L.level}`;
    if (!keys.includes(key)) keys.push(key);
    return {name: L.name === undefined ? `Part ${i + 1}` : String(L.name), note: String(L.note ?? ''), finish, face, details,
      color: L.color ?? (finish === 'glass' ? '#BFD4E6' : '#2A2D33'), h: L.h ?? 0.12,
      w: L.w ?? s.shape.w - 2 * inset, l: L.l ?? s.shape.l - 2 * inset, r: L.r ?? Math.max(0.05, s.shape.r - inset),
      x: L.x ?? 0, z: L.z ?? 0, level: keys.indexOf(key)};
  });
  s.levels = keys.length;
  if (s.levels < 2) throw new Error('teardown: the parts need at least two levels');
  const names = s.layers.map((L) => L.name);
  s.focus = (s.focus || []).map((n) => {
    const i = names.indexOf(n);
    if (i < 0 || !n) throw new Error(`teardown: focus names "${n}", which is not a named layer`);
    return i;
  });
  return s;
}

/** Beat times in seconds for a normalised spec. Every motion in the film reads these. */
export function teardownBeats(s) {
  const n = s.levels;
  const explode = [...Array(n)].map((_, j) => [1.0 + j * 0.16, 2.0 + j * 0.16]);
  const exploded = explode[n - 1][1];
  const shown = s.layers.map((L, i) => i).filter((i) => s.layers[i].name);
  const labels = s.layers.map(() => null);
  shown.forEach((i, k) => { labels[i] = [exploded - 0.3 + k * 0.1, exploded + 0.15 + k * 0.1]; });
  const drawn = exploded + 0.15 + Math.max(0, shown.length - 1) * 0.1;
  // time to read every label: 0.35 s a label, at least 1.5 s; once after they draw, again before they go
  const read = Math.max(1.5, 0.35 * shown.length);
  const focus = s.focus.map((layer, k) => {
    const a = drawn + read + k * 2.4;
    return {layer, out: [a, a + 0.7], back: [a + 1.85, a + 2.35]};
  });
  const A = focus.length ? focus[focus.length - 1].back[1] + Math.max(1.2, 0.2 * shown.length) : drawn + read;
  const close = [...Array(n)].map((_, j) => [A + 0.1 + (n - 1 - j) * 0.1, A + 0.9 + (n - 1 - j) * 0.1]);
  const closed = A + 0.9 + (n - 1) * 0.1;
  const duration = Math.ceil((closed + s.hold) * 10 - 1e-9) / 10;   // a tenth of a second: whole frames at 30 and 60 fps
  return {explode, exploded, labels, drawn, read, labelsOut: [A - 0.35, A + 0.05], focus, close, closed, duration};
}

// ------------------------------------------------------------ shapes, textures, materials
function roundedRect(width, length, radius, rim = 0) {
  // one rounded rectangle traced corner by corner; a rim > 0 cuts the same outline, smaller, as a hole
  const trace = (path, wd, ln, rd) => {
    const x = wd / 2, z = ln / 2;
    path.moveTo(-x + rd, -z);
    path.lineTo(x - rd, -z);
    for (const [cx, cz, ex, ez, nx, nz] of [[x, -z, x, -z + rd, x, z - rd], [x, z, x - rd, z, -x + rd, z],
      [-x, z, -x, z - rd, -x, -z + rd], [-x, -z, -x + rd, -z, null, null]]) {
      path.quadraticCurveTo(cx, cz, ex, ez);
      if (nx !== null) path.lineTo(nx, nz);
    }
  };
  const outline = new THREE.Shape();
  trace(outline, width, length, Math.min(radius, width / 2, length / 2));
  if (rim > 0) {
    const hole = new THREE.Path();
    trace(hole, width - 2 * rim, length - 2 * rim, Math.max(0.05, Math.min(radius, width / 2, length / 2) - rim));
    outline.holes.push(hole);
  }
  return outline;
}

/**
 * A slab lying flat, exactly h thick from y = 0 to y = h. The bevel grows on both sides of the extrusion, so
 * the straight part is h - 2 x bevel and the whole is lifted by one bevel. Its caps keep the extrusion's
 * own uvs (the outline's coordinates); a face texture spans them through repeat and offset (spanCaps).
 */
function slab(w, l, r, h, hole = 0) {
  const edge = Math.min(0.03, h * 0.2);
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, l, r, hole),
    {depth: h - 2 * edge, bevelEnabled: true, bevelSize: edge, bevelThickness: edge, bevelSegments: 2, curveSegments: 16});
  return geo.rotateX(-Math.PI / 2).translate(0, edge, 0);
}

/**
 * Outline coordinates (-w/2..w/2, -l/2..l/2) to texture space (0..1). The top of the picture lands at the far
 * end of the part, so it reads upright from the front three-quarter view.
 */
function spanCaps(texture, w, l) {
  texture.repeat.set(1 / w, 1 / l);
  texture.offset.set(0.5, 0.5);
  return texture;
}

/** A texture painted once at load by draw(ctx, width, height). */
function painted(size, draw) {
  const [cw, ch] = size;
  const surface = Object.assign(document.createElement('canvas'), {width: cw, height: ch});
  draw(surface.getContext('2d'), cw, ch);
  return Object.assign(new THREE.CanvasTexture(surface), {colorSpace: THREE.SRGBColorSpace, anisotropy: 4});
}

function material(finish, color, map = null) {
  const base = {color: new THREE.Color(map ? '#FFFFFF' : color), map};
  if (finish === 'glass') return new THREE.MeshPhysicalMaterial({...base, roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.15, depthWrite: false, envMapIntensity: 0.9});
  if (finish === 'gloss') return new THREE.MeshPhysicalMaterial({...base, roughness: 0.22, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.2});
  if (finish === 'metal') return new THREE.MeshStandardMaterial({...base, roughness: 0.3, metalness: 1});
  return new THREE.MeshStandardMaterial({...base, roughness: 0.62, metalness: 0.05});
}

const px = (w, l) => [Math.round(1024 * Math.min(1, w / l)), Math.round(1024 * Math.min(1, l / w))];

function screenTexture(s, L) {
  return spanCaps(painted(px(L.w, L.l), (x, cw, ch) => {
    const g = x.createLinearGradient(0, 0, cw, ch);
    g.addColorStop(0, L.color); g.addColorStop(1, '#05060A');
    x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    const glow = x.createRadialGradient(cw * 0.3, ch * 0.7, 0, cw * 0.3, ch * 0.7, cw * 1.1);
    glow.addColorStop(0, s.accent + 'DD'); glow.addColorStop(1, s.accent + '00');
    x.fillStyle = glow; x.fillRect(0, 0, cw, ch);
    const k = Math.min(cw, ch);
    if (L.details.includes('island')) {   // the camera pill at the top of the screen
      x.fillStyle = '#000000';
      const pw = k * 0.3, ph = k * 0.085, py = k * 0.06;
      x.beginPath(); x.roundRect(cw / 2 - pw / 2, py, pw, ph, ph / 2); x.fill();
    }
    x.fillStyle = '#FFFFFF'; x.textAlign = 'center';
    x.font = `700 ${Math.round(k * 0.22)}px Inter`; x.fillText(s.screen.time, cw / 2, ch * 0.3);
    if (s.screen.date) { x.font = `500 ${Math.round(k * 0.055)}px Inter`; x.globalAlpha = 0.85; x.fillText(s.screen.date, cw / 2, ch * 0.3 - k * 0.2); }
  }), L.w, L.l);
}

function boardTexture(s, L, rnd) {
  return spanCaps(painted(px(L.w, L.l), (x, cw, ch) => {
    x.fillStyle = L.color; x.fillRect(0, 0, cw, ch);
    x.strokeStyle = 'rgba(222,184,105,0.5)'; x.lineWidth = 2;
    for (let i = 0; i < 70; i++) {   // traces: right-angled runs with one 45 degree bend
      const x0 = rnd() * cw, y0 = rnd() * ch, run = 40 + rnd() * 220, d = (rnd() < 0.5 ? -1 : 1) * 30;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + run, y0); x.lineTo(x0 + run + Math.abs(d), y0 + d); x.lineTo(x0 + run * 1.6, y0 + d); x.stroke();
    }
    x.fillStyle = 'rgba(222,184,105,0.85)';
    for (let i = 0; i < 90; i++) x.fillRect(rnd() * cw, rnd() * ch, 6, 6);
  }), L.w, L.l);
}

function batteryTexture(s, L) {
  return spanCaps(painted(px(L.w, L.l), (x, cw, ch) => {
    x.fillStyle = L.color; x.fillRect(0, 0, cw, ch);
    const k = Math.min(cw, ch);
    x.strokeStyle = 'rgba(255,255,255,0.14)'; x.lineWidth = 4; x.strokeRect(k * 0.06, k * 0.06, cw - k * 0.12, ch - k * 0.12);
    // the print runs along the long side, large enough to read in a close-up
    x.save();
    if (ch > cw) { x.translate(cw, 0); x.rotate(Math.PI / 2); }
    const long = Math.max(cw, ch), short = Math.min(cw, ch);
    x.fillStyle = '#E8E6E1'; x.font = `700 ${Math.round(short * 0.2)}px Inter`; x.fillText(L.name, long * 0.08, short * 0.4);
    x.fillStyle = '#B4B8BE'; x.font = `600 ${Math.round(short * 0.12)}px "JetBrains Mono"`; x.fillText(L.note, long * 0.08, short * 0.62);
    x.fillStyle = s.accent; x.fillRect(long * 0.08, short * 0.75, short * 0.3, short * 0.04);
    x.restore();
  }), L.w, L.l);
}

/** One part as a group: its slab, plus the details it asks for. Details sit clearly above the top face. */
function buildLayer(s, L, env, rnd) {
  const {w, l, r, h} = L;
  const g = new THREE.Group();
  g.name = L.name;
  const side = material(L.finish, L.color);
  let top = side;
  if (L.face === 'screen') {   // a lit screen: its picture glows through the glass from the first frame
    top = material('gloss', L.color, screenTexture(s, L));
    top.emissive = new THREE.Color('#FFFFFF'); top.emissiveMap = top.map; top.emissiveIntensity = 0.8;
  }
  if (L.face === 'board') top = material('matte', L.color, boardTexture(s, L, rnd));
  if (L.face === 'battery') top = material('matte', L.color, batteryTexture(s, L));
  const hole = L.face === 'frame' ? Math.min(w, l) * 0.06 : 0;
  const geo = slab(w, l, r, h, hole);
  g.add(new THREE.Mesh(geo, [top, side]));
  if (L.finish === 'glass') {   // a thin bright edge, so the glass reads as a part and not as fog
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), new THREE.LineBasicMaterial({color: '#FFFFFF', transparent: true, opacity: 0.45}));
    g.add(edges);
  }
  const k = Math.min(w, l), lift = 0.004;
  const chipMat = new THREE.MeshStandardMaterial({color: '#15171A', roughness: 0.4, metalness: 0.4});
  const shieldMat = new THREE.MeshStandardMaterial({color: '#B9BDC3', roughness: 0.3, metalness: 1});
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };
  if (L.face === 'board') {   // chips and shields on a grid of free cells, so none overlap
    const cols = 4, rows = Math.max(2, Math.round(4 * l / w)), cw = (w * 0.8) / cols, ch = (l * 0.8) / rows;
    for (let c = 0; c < cols; c++) for (let rI = 0; rI < rows; rI++) {
      if (rnd() < 0.45) continue;
      const shield = rnd() < 0.35, sx = cw * (0.45 + rnd() * 0.4), sz = ch * (0.45 + rnd() * 0.4), sy = shield ? 0.07 : 0.04;
      add(new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), shield ? shieldMat : chipMat), -w * 0.4 + cw * (c + 0.5), h + lift + sy / 2, -l * 0.4 + ch * (rI + 0.5));
    }
  }
  if (L.details.includes('ring')) {   // a charging coil and its magnet ring on the inner side
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(k * 0.19, k * 0.19, 0.03, 64), new THREE.MeshStandardMaterial({color: '#B5794A', roughness: 0.4, metalness: 0.9}));
    add(coil, 0, h + lift + 0.015, l * 0.06);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(k * 0.24, k * 0.014, 12, 72), shieldMat);
    ring.rotation.x = Math.PI / 2;
    add(ring, 0, h + lift + 0.014, l * 0.06);
  }
  if (L.details.includes('camera')) {   // a raised camera island with lenses in the top left corner
    const isl = k * 0.42, ih = 0.07;
    const plate = new THREE.Mesh(slab(isl, isl, isl * 0.22, ih), material('gloss', L.color));
    add(plate, -w / 2 + isl * 0.62, h + lift, -l / 2 + isl * 0.62);
    const barrel = new THREE.MeshStandardMaterial({color: '#2B2E33', roughness: 0.35, metalness: 0.8});
    const glass = new THREE.MeshPhysicalMaterial({color: '#05070A', roughness: 0.05, clearcoat: 1});
    for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22]]) {
      const cx = -w / 2 + isl * (0.62 + dx), cz = -l / 2 + isl * (0.62 + dz);
      add(new THREE.Mesh(new THREE.CylinderGeometry(isl * 0.17, isl * 0.17, 0.08, 40), barrel), cx, h + lift + ih + 0.04, cz);
      add(new THREE.Mesh(new THREE.CylinderGeometry(isl * 0.11, isl * 0.11, 0.01, 40), glass), cx, h + lift + ih + 0.085, cz);
    }
  }
  if (L.details.includes('buttons')) {   // two buttons on the long side
    for (const [z, len] of [[-l * 0.12, l * 0.1], [l * 0.06, l * 0.06]]) add(new THREE.Mesh(new THREE.BoxGeometry(0.06, h * 0.5, len), side), w / 2 + 0.02, h * 0.5, z);
  }
  if (L.details.includes('antenna')) {   // the dark antenna breaks across both long sides
    const band = new THREE.MeshStandardMaterial({color: '#2A2C30', roughness: 0.6});
    for (const z of [-l * 0.38, l * 0.38]) for (const sgn of [-1, 1]) add(new THREE.Mesh(new THREE.BoxGeometry(0.03, h * 1.002, 0.06), band), sgn * (w / 2 - 0.005), h / 2, z);
  }
  g.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.envMap = env; });
  return {group: g, w, l, h, side, L};
}

// ------------------------------------------------------------ the page around the 3D
function overlay(app, s, wide) {
  const css = document.createElement('style');
  const light = s.theme === 'light';
  css.textContent = `
    .td { position: absolute; inset: 0; pointer-events: none; font-family: Inter, sans-serif; color: ${light ? '#16171A' : '#F2F1EE'}; }
    .td-vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 42% 48%, rgba(0,0,0,0) 45%, ${light ? 'rgba(40,36,30,0.16)' : 'rgba(0,0,0,0.55)'} 100%); }
    .td-head { position: absolute; left: 6%; top: ${wide ? 6 : 10}%; }
    .td-title { font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; }
    .td-sub { font-family: 'JetBrains Mono', monospace; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.7; margin-top: 0.5em; }
    .td-bar { height: 0.35em; width: 2.6em; background: ${s.accent}; margin-bottom: 0.9em; border-radius: 0.2em; }
    .td-lbl { position: absolute; left: 0; top: 0; white-space: nowrap; will-change: opacity; }
    .td-num { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: ${s.accent}; margin-right: 0.6em; }
    .td-name { font-weight: 700; }
    .td-note { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 0.8em; opacity: 0.75; margin-top: 0.3em; padding-left: 2.7em; }
    .td-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }`;
  document.head.appendChild(css);
  const root = document.createElement('div');
  root.className = 'td';
  root.innerHTML = '<div class="td-vig"></div><svg class="td-svg"></svg><div class="td-head"><div class="td-bar"></div><div class="td-title"></div><div class="td-sub"></div></div>';
  root.querySelector('.td-title').textContent = s.title;
  root.querySelector('.td-sub').textContent = `${s.subtitle} · ${String(s.layers.length).padStart(2, '0')} ${s.partsLabel}`;
  app.appendChild(root);
  return root;
}

// ------------------------------------------------------------ the film
export function runTeardown(spec) {
  const s = normalizeSpec(spec);
  const B = teardownBeats(s);
  const defaults = {duration: B.duration, fps: s.fps, theme: s.theme === 'light' ? 'light' : 'dark', accent: s.accent,
    seed: s.seed, hud: {enabled: false, title: s.title, subtitle: ''}, director: {enabled: false}};
  runSim(defaults, async ({canvas, capture}) => {
    // Latin Extended faces join the families the build inlines (Latin only), so Polish and other accented letters match.
    for (const [family, data, weight] of [['Inter', interExt, '100 900'], ['JetBrains Mono', monoExt, '600']]) {
      const f = new FontFace(family, `url(data:font/woff2;base64,${data})`, {weight, unicodeRange: EXT_RANGE});
      document.fonts.add(f);
      await f.load().catch(() => {});
    }
    await Promise.all(['700 20px Inter', '500 20px Inter', '600 20px "JetBrains Mono"'].map((f) => document.fonts.load(f, 'Aąę'))).catch(() => {});
    const bg = s.theme === 'light' ? '#ECEBE6' : '#0E0F12';
    const st = createStage(canvas, {viewport: () => ({top: 0, bottom: 0})}, {bg, fov: 30, capture, exposure: 1.05});
    st.bloomPass.enabled = false;
    const {renderer, scene, camera} = st;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    const key = new THREE.DirectionalLight('#FFFFFF', 1.6);
    key.position.set(-6, 12, 9);
    const rim = new THREE.DirectionalLight('#FFFFFF', 1.3);   // a counter light from behind picks out the edges
    rim.position.set(8, 6, -12);
    scene.add(key, rim, new THREE.AmbientLight('#FFFFFF', 0.25));

    const rnd = rng(s.seed);
    const model = new THREE.Group();
    scene.add(model);
    const layers = s.layers.map((L) => buildLayer(s, L, env, rnd));
    // assembled: levels stacked from the bottom up, each as thick as its thickest part; exploded: evenly spread
    const n = s.levels;
    const levelH = [...Array(n)].map((_, j) => Math.max(...s.layers.filter((L) => L.level === j).map((L) => L.h)));
    const rest = [];
    let y = 0;
    for (let j = n - 1; j >= 0; j--) { rest[j] = y; y += levelH[j]; }
    // a tall frame has room for a taller stack, so its levels spread further apart and overlap less
    const stackH = y, gap = Math.max(s.shape.w, s.shape.l) * (innerHeight > innerWidth ? 0.2 : 0.13);
    const spread = [...Array(n)].map((_, j) => stackH / 2 + ((n - 1) / 2 - j) * gap);
    for (const Lr of layers) model.add(Lr.group);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(s.shape.w * 1.8, s.shape.l * 1.5), new THREE.MeshBasicMaterial({
      map: painted([256, 256], (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }),
      transparent: true, depthWrite: false}));
    shadow.rotation.x = -Math.PI / 2;
    model.add(shadow);

    st.resize();   // the layout and the fits below measure the real frame
    const W = () => st.size.w, H = () => st.size.h;
    const wide = W() >= H();
    const app = document.getElementById('app');
    const ui = overlay(app, s, wide);
    const title = ui.querySelector('.td-title');
    const svg = ui.querySelector('.td-svg');
    const NS = 'http://www.w3.org/2000/svg';
    const labels = s.layers.map((L) => {
      if (!L.name) return null;
      const el = document.createElement('div');
      el.className = 'td-lbl';
      el.innerHTML = '<div><span class="td-num"></span><span class="td-name"></span></div><div class="td-note"></div>';
      const name = el.querySelector('.td-name');
      name.textContent = L.name;
      el.querySelector('.td-note').textContent = L.note;
      if (!L.note) el.querySelector('.td-note').remove();
      ui.appendChild(el);
      const line = document.createElementNS(NS, 'polyline');
      line.setAttribute('fill', 'none');
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('fill', s.accent);
      svg.append(line, dot);
      return {el, name, num: el.querySelector('.td-num'), line, dot};
    });

    // ---- the pose for a time: every part's offset and the turn, read from the beats only
    const focusOf = (t, i) => {
      let k = 0;
      for (const f of B.focus) if (f.layer === i) k = Math.max(k, prog(t, ...f.out) * (1 - prog(t, ...f.back)));
      return k;
    };
    const slide = s.shape.w * 0.9;
    const pose = (t) => {
      model.rotation.y = rad(-26 + 30 * t / B.duration);
      layers.forEach((Lr, i) => {
        const j = Lr.L.level;
        const e = prog(t, ...B.explode[j]) * (1 - prog(t, ...B.close[j]));
        const f = focusOf(t, i);
        Lr.group.position.set(Lr.L.x - slide * f, lerp(rest[j], spread[j], e), Lr.L.z);
        Lr.group.rotation.z = rad(8) * f;
        Lr.group.scale.setScalar(1 + 0.12 * f);
        Lr.side.emissive?.set(s.accent);
        if (Lr.side.emissiveIntensity !== undefined) Lr.side.emissiveIntensity = 0.35 * f;
      });
      shadow.position.y = -0.02 - stackH * 0.02;
      shadow.material.opacity = 1 - 0.4 * clamp01(prog(t, B.explode[0][0], B.exploded) * (1 - prog(t, B.close[n - 1][0], B.closed)));
    };

    // ---- the camera: orbit values [az, el, dist, tx, ty, tz, cx, cy] fitted to the frame at load
    const box = new THREE.Box3(), corners = [...Array(8)].map(() => new THREE.Vector3());
    // The object's frame keeps clear of the header, the bottom fifth of a tall film and the label column.
    // With labels it is the left part of the frame; the closed object at the start and end sits in the middle,
    // a little looser, so opening the stack does not pull the camera far back.
    const LABELLED = wide ? {x0: 0.06, x1: 0.58, y0: 0.25, y1: 0.92} : {x0: 0.05, x1: 0.58, y0: 0.22, y1: 0.8};
    const HERO = wide ? {x0: 0.3, x1: 0.7, y0: 0.3, y1: 0.86} : {x0: 0.2, x1: 0.8, y0: 0.3, y1: 0.76};
    let area = LABELLED;
    const place = (o) => {
      const [az, el, dist, tx, ty, tz, cx, cy] = o;
      camera.position.set(tx + dist * Math.cos(rad(el)) * Math.sin(rad(az)), ty + dist * Math.sin(rad(el)), tz + dist * Math.cos(rad(el)) * Math.cos(rad(az)));
      camera.lookAt(tx, ty, tz);
      // the target sits in the middle of the object's frame, not the middle of the picture
      camera.setViewOffset(W(), H(), (0.5 - cx) * W(), (0.5 - cy) * H(), W(), H());
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    };
    const fits = (objs) => {
      model.updateMatrixWorld(true);
      for (const o of objs) {
        box.setFromObject(o);
        const {min, max} = box;
        corners.forEach((c, k) => c.set(k & 1 ? max.x : min.x, k & 2 ? max.y : min.y, k & 4 ? max.z : min.z));
        for (const c of corners) {
          const p = st.project(c);
          if (p.x < area.x0 * W() || p.x > area.x1 * W() || p.y < area.y0 * H() || p.y > area.y1 * H()) return false;
        }
      }
      return true;
    };
    const fit = (t, az, el, target, objs, frame = LABELLED) => {
      pose(t);
      area = frame;
      const centre = [(frame.x0 + frame.x1) / 2, (frame.y0 + frame.y1) / 2];
      let lo = 1, hi = 400;
      for (let k = 0; k < 40; k++) {
        const d = (lo + hi) / 2;
        place([az, el, d, ...target, ...centre]);
        if (fits(objs)) hi = d; else lo = d;
      }
      return [az, el, hi, ...target, ...centre];
    };
    const all = layers.map((Lr) => Lr.group);
    const centreOf = (i) => [layers[i].L.x, spread[layers[i].L.level] + layers[i].h / 2, layers[i].L.z];
    const middle = [0, stackH / 2, 0];
    const hero = fit(0, 32, 30, middle, all, HERO);
    const opened = fit(B.exploded, 22, 32, middle, all);
    const keys = [[0, hero], [B.explode[0][0], hero], [B.exploded, opened], [B.drawn + B.read, [...opened.slice(0, 2), opened[2] * 0.97, ...opened.slice(3)]]];
    // A focus part slides out and the camera turns towards it, with the whole stack kept inside the frame, so
    // nothing runs over the title or the labels.
    B.focus.forEach((f, k) => {
      const [x, yc, z] = centreOf(f.layer);
      const close = fit(f.out[1], k % 2 ? -12 : 8, 34 + 6 * (k % 3), [lerp(x - slide, 0, 0.5), lerp(yc, stackH / 2, 0.4), z], all);
      const pushed = [...close];
      pushed[2] *= 0.97;
      keys.push([f.out[0] + 0.05, keys[keys.length - 1][1]], [f.out[1] + 0.1, close], [f.back[0], pushed], [f.back[1] + 0.1, opened]);
    });
    // the closed object at the end has turned further: fit it there, at the larger of the two distances
    const endA = fit(B.closed, 32, 30, middle, all, HERO), endB = fit(B.duration, 32, 30, middle, all, HERO);
    const end = endA[2] > endB[2] ? endA : endB;
    keys.push([B.close[n - 1][0], keys[keys.length - 1][1]], [B.closed, end], [B.duration, end]);
    keys.sort((a, b) => a[0] - b[0]);

    // label numbers follow screen order in the opened view, top first, and stay fixed for the film
    pose(B.exploded); place(opened);
    const order = layers.map((Lr, i) => [i, st.project(new THREE.Vector3(...centreOf(i))).y])
      .filter(([i]) => labels[i]).sort((a, b) => a[1] - b[1]).map(([i]) => i);
    order.forEach((i, k) => { labels[i].num.textContent = String(k + 1).padStart(2, '0'); });

    const v = new THREE.Vector3();
    const anchor = (i) => {   // the edge point of a part furthest towards the labels
      const Lr = layers[i];
      let best = null;
      for (const [x, z] of [[Lr.w / 2, 0], [-Lr.w / 2, 0], [0, Lr.l / 2], [0, -Lr.l / 2]]) {
        v.set(x, Lr.h, z);
        Lr.group.localToWorld(v);
        const p = st.project(v);
        if (!best || p.x > best.x) best = p;
      }
      return best;
    };

    // type sizes follow the frame; the longest label is measured once per size
    let sized = null, fs = 0, longest = 0;
    const layout = () => {
      if (sized === `${W()}x${H()}`) return;
      sized = `${W()}x${H()}`;
      fs = (wide ? 34 : 42) * Math.min(W(), H()) / 1080;
      ui.style.fontSize = `${fs}px`;
      title.style.fontSize = `${2.2 * fs}px`;
      longest = Math.max(0, ...labels.filter(Boolean).map((L) => L.el.scrollWidth));
    };
    const ink = s.theme === 'light' ? 'rgba(20,20,24,0.6)' : 'rgba(242,241,238,0.6)';
    return {
      resize: () => { st.resize(); },
      render(t) {
        pose(t);
        place(keyed(keys, t, easeInOutCubic));
        st.render();
        layout();
        const u = fs / (wide ? 34 : 42);
        // labels: one row per named part in the right column, in screen order, inside the object's band, never overlapping
        const colX = Math.min((wide ? 0.62 : 0.6) * W(), W() * 0.96 - longest - 22 * u), rowH = (s.layers.some((L) => L.note) ? 2.5 : 1.6) * fs;
        const top = LABELLED.y0 * H() + 0.75 * fs, bottom = LABELLED.y1 * H() - 1.5 * fs;
        const rows = order.map((i) => ({i, a: anchor(i)}));
        const step = rows.length > 1 ? Math.min(rowH, (bottom - top) / (rows.length - 1)) : rowH;
        let yPrev = -Infinity;
        for (const r of rows) { r.y = Math.max(r.a.y, top, yPrev + step); yPrev = r.y; }
        const over = yPrev - bottom;
        if (over > 0) for (const r of rows) r.y -= over;
        const fade = 1 - prog(t, ...B.labelsOut);
        const anyFocus = B.focus.length ? Math.max(...layers.map((_, i) => focusOf(t, i))) : 0;
        for (const r of rows) {
          const L = labels[r.i], [a, b] = B.labels[r.i];
          const draw = smooth((t - a) / (b - a));
          const lit = focusOf(t, r.i), dim = (1 - 0.5 * anyFocus * (1 - lit)) * fade;
          const x1 = colX - 14 * u, len = Math.hypot(x1 - r.a.x, r.y - r.a.y) + 40 * u;
          L.line.setAttribute('points', `${r.a.x},${r.a.y} ${x1},${r.y} ${x1 + 26 * u},${r.y}`);
          L.line.setAttribute('stroke', lit > 0.5 ? s.accent : ink);
          L.line.setAttribute('stroke-width', String(2 * u));
          L.line.setAttribute('stroke-dasharray', `${len}`);
          L.line.setAttribute('stroke-dashoffset', `${len * (1 - draw)}`);
          L.line.style.opacity = String(draw > 0 ? dim : 0);   // the line goes with its label
          L.dot.setAttribute('cx', r.a.x); L.dot.setAttribute('cy', r.a.y); L.dot.setAttribute('r', String(5 * u * clamp01(draw * 3)));
          L.dot.style.opacity = String(dim);
          const show = clamp01((draw - 0.6) / 0.4);
          // whole pixels, and labels kept on their own layer (will-change: opacity): a label then rasterises the same
          // whatever opacity or colour it had on the frame drawn before
          L.el.style.transform = `translate(${Math.round(colX + 22 * u + (1 - show) * 18 * u)}px, ${Math.round(r.y - 0.75 * fs)}px)`;
          L.el.style.opacity = String(show * dim);
          L.name.style.color = lit > 0.5 ? s.accent : '';
        }
        return {};
      },
    };
  });
}
