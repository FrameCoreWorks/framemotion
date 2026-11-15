/*!
 * FrameMotion teardown: a labelled exploded view of a flat, layered object (a phone, a watch, a tablet,
 * a card, a remote) from a JSON spec, on the cutaway kit (runSim, createStage and the pure-time helpers).
 * Original FrameCore Works code (Apache-2.0). It follows two methods, without their code: the cutaway
 * method of Nyxera0x/cutaway (MIT, every part its own camera, render(t) pure) and the exploded-view reel
 * of artemnovitckii/claude-animation-skills (MIT, layers lifting apart with numbered leader labels).
 *
 *   import {runTeardown} from '<path>/framemotion/teardown.js';
 *   import SPEC from './spec.json';
 *   runTeardown(SPEC);
 *
 * The spec (every field but layers is optional; see README.md):
 *   title, subtitle, accent ("#RRGGBB"), theme ("dark" | "light"), fps, hold (extra seconds at the end),
 *   shape {w, l, r}         the outline: width, length and corner radius in model units
 *   layers [{name, note, finish, face, color, h, inset}]   top layer first, 2 to 8 of them
 *       finish  glass | gloss | matte | metal
 *       face    plain | screen | frame | board | battery | ring
 *   focus ["<layer name>", ...]   layers that slide out in turn under their own camera
 *   screen {time, date}     what a "screen" face shows
 *   seed                    the board's traces and chips
 *   partsLabel              the word after the part count in the header ("parts")
 * The film: the object turning, the layers lifting apart top first, the labels drawing in, each focus
 * layer sliding out and back, then the layers closing with a small overshoot and a hold.
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
  s.layers = s.layers.map((L, i) => {
    const finish = L.finish ?? 'matte', face = L.face ?? 'plain';
    if (!FINISHES.includes(finish)) throw new Error(`teardown: layer ${i + 1} finish must be one of ${FINISHES.join(', ')}`);
    if (!FACES.includes(face)) throw new Error(`teardown: layer ${i + 1} face must be one of ${FACES.join(', ')}`);
    return {name: String(L.name ?? `Part ${i + 1}`), note: String(L.note ?? ''), finish, face,
      color: L.color ?? (finish === 'glass' ? '#BFD4E6' : '#2A2D33'), h: L.h ?? 0.12, inset: L.inset ?? 0};
  });
  const names = s.layers.map((L) => L.name);
  s.focus = (s.focus || []).map((n) => {
    const i = names.indexOf(n);
    if (i < 0) throw new Error(`teardown: focus names "${n}", which is not a layer`);
    return i;
  });
  return s;
}

/** Beat times in seconds for a normalised spec. Every motion in the film reads these. */
export function teardownBeats(s) {
  const n = s.layers.length;
  const explode = s.layers.map((_, i) => [1.0 + i * 0.16, 2.0 + i * 0.16]);
  const exploded = explode[n - 1][1];
  const labels = s.layers.map((_, i) => [exploded - 0.3 + i * 0.1, exploded + 0.15 + i * 0.1]);
  const focus = s.focus.map((layer, k) => {
    const a = exploded + 1.2 + k * 2.4;
    return {layer, out: [a, a + 0.7], back: [a + 1.85, a + 2.35]};
  });
  const A = (focus.length ? focus[focus.length - 1].back[1] : exploded + 1.6) + 0.5;
  const close = s.layers.map((_, i) => [A + (n - 1 - i) * 0.1, A + (n - 1 - i) * 0.1 + 0.8]);
  const closed = Math.max(...close.map((c) => c[1]));
  const duration = Math.ceil((closed + s.hold) * 10 - 1e-9) / 10;   // a tenth of a second: whole frames at 30 and 60 fps
  return {explode, exploded, labels, labelsOut: [A - 0.45, A - 0.05], focus, close, closed, duration};
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
  trace(outline, width, length, radius);
  if (rim > 0) {
    const hole = new THREE.Path();
    trace(hole, width - 2 * rim, length - 2 * rim, Math.max(0.05, radius - rim));
    outline.holes.push(hole);
  }
  return outline;
}

/**
 * A slab lying flat, thickness along +y from y = 0. Its caps keep the extrusion's own uvs, which are the
 * outline's coordinates; a face texture spans them through repeat and offset (spanCaps).
 */
function slab(w, l, r, h, hole = 0) {
  const edge = Math.min(0.03, h * 0.25);
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, l, r, hole),
    {depth: h, bevelEnabled: true, bevelSize: edge, bevelThickness: edge, bevelSegments: 2, curveSegments: 16});
  return geo.rotateX(-Math.PI / 2);
}

/** Outline coordinates (-w/2..w/2, -l/2..l/2) to texture space (0..1). */
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
  if (finish === 'glass') return new THREE.MeshPhysicalMaterial({...base, roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.3, depthWrite: false, envMapIntensity: 1.4});
  if (finish === 'gloss') return new THREE.MeshPhysicalMaterial({...base, roughness: 0.22, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.2});
  if (finish === 'metal') return new THREE.MeshStandardMaterial({...base, roughness: 0.3, metalness: 1});
  return new THREE.MeshStandardMaterial({...base, roughness: 0.62, metalness: 0.05});
}

const px = (w, l) => [Math.round(1024 * Math.min(1, w / l)), Math.round(1024 * Math.min(1, l / w))];

function screenTexture(s, L, w, l) {
  return spanCaps(painted(px(w, l), (x, cw, ch) => {
    const g = x.createLinearGradient(0, 0, cw, ch);
    g.addColorStop(0, L.color); g.addColorStop(1, '#05060A');
    x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    const glow = x.createRadialGradient(cw * 0.7, ch * 0.75, 0, cw * 0.7, ch * 0.75, cw * 0.9);
    glow.addColorStop(0, s.accent + 'CC'); glow.addColorStop(1, s.accent + '00');
    x.fillStyle = glow; x.fillRect(0, 0, cw, ch);
    x.fillStyle = '#FFFFFF'; x.textAlign = 'center';
    const k = Math.min(cw, ch);
    x.font = `700 ${Math.round(k * 0.22)}px Inter`; x.fillText(s.screen.time, cw / 2, ch * 0.3);
    if (s.screen.date) { x.font = `500 ${Math.round(k * 0.05)}px Inter`; x.globalAlpha = 0.8; x.fillText(s.screen.date, cw / 2, ch * 0.3 - k * 0.2); }
  }), w, l);
}

function boardTexture(s, L, w, l, rnd) {
  return spanCaps(painted(px(w, l), (x, cw, ch) => {
    x.fillStyle = L.color; x.fillRect(0, 0, cw, ch);
    x.strokeStyle = 'rgba(222,184,105,0.5)'; x.lineWidth = 2;
    for (let i = 0; i < 70; i++) {   // traces: right-angled runs with one 45 degree bend
      const x0 = rnd() * cw, y0 = rnd() * ch, run = 40 + rnd() * 220, d = (rnd() < 0.5 ? -1 : 1) * 30;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + run, y0); x.lineTo(x0 + run + Math.abs(d), y0 + d); x.lineTo(x0 + run * 1.6, y0 + d); x.stroke();
    }
    x.fillStyle = 'rgba(222,184,105,0.85)';
    for (let i = 0; i < 90; i++) x.fillRect(rnd() * cw, rnd() * ch, 6, 6);
  }), w, l);
}

function batteryTexture(s, L, w, l) {
  return spanCaps(painted(px(w, l), (x, cw, ch) => {
    x.fillStyle = L.color; x.fillRect(0, 0, cw, ch);
    const k = Math.min(cw, ch);
    x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 4; x.strokeRect(k * 0.06, k * 0.06, cw - k * 0.12, ch - k * 0.12);
    x.fillStyle = '#E8E6E1'; x.font = `700 ${Math.round(k * 0.1)}px Inter`; x.fillText(L.name, k * 0.12, k * 0.24);
    x.fillStyle = '#A3A7AE'; x.font = `600 ${Math.round(k * 0.06)}px "JetBrains Mono"`; x.fillText(L.note, k * 0.12, k * 0.34);
    x.fillStyle = s.accent; x.fillRect(k * 0.12, ch - k * 0.2, k * 0.16, k * 0.025);
  }), w, l);
}

/** One layer as a group: its slab, plus the details its face asks for. */
function buildLayer(s, L, i, env, rnd) {
  const {w: W0, l: L0, r: R0} = s.shape;
  const w = W0 - 2 * L.inset, l = L0 - 2 * L.inset, r = Math.max(0.05, R0 - L.inset);
  const g = new THREE.Group();
  g.name = L.name;
  const side = material(L.finish, L.color);
  let top = side;
  if (L.face === 'screen') top = material('gloss', L.color, screenTexture(s, L, w, l));
  if (L.face === 'board') top = material('matte', L.color, boardTexture(s, L, w, l, rnd));
  if (L.face === 'battery') top = material('matte', L.color, batteryTexture(s, L, w, l));
  const hole = L.face === 'frame' ? Math.min(w, l) * 0.06 : 0;
  const mesh = new THREE.Mesh(slab(w, l, r, L.h, hole), [top, side]);
  g.add(mesh);
  const chipMat = new THREE.MeshStandardMaterial({color: '#15171A', roughness: 0.4, metalness: 0.4});
  const shieldMat = new THREE.MeshStandardMaterial({color: '#B9BDC3', roughness: 0.3, metalness: 1});
  if (L.face === 'board') {   // chips and shields on a grid of free cells, so none overlap
    const cols = 4, rows = Math.max(3, Math.round(4 * l / w)), cw = (w * 0.8) / cols, ch = (l * 0.8) / rows;
    for (let c = 0; c < cols; c++) for (let rI = 0; rI < rows; rI++) {
      if (rnd() < 0.45) continue;
      const shield = rnd() < 0.35, sx = cw * (0.45 + rnd() * 0.4), sz = ch * (0.45 + rnd() * 0.4), sy = shield ? 0.07 : 0.04;
      const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), shield ? shieldMat : chipMat);
      b.position.set(-w * 0.4 + cw * (c + 0.5), L.h + sy / 2, -l * 0.4 + ch * (rI + 0.5));
      g.add(b);
    }
  }
  if (L.face === 'ring') {   // a charging coil and its magnet ring on the inner side
    const k = Math.min(w, l);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(k * 0.24, k * 0.012, 12, 72), shieldMat);
    ring.rotation.x = Math.PI / 2; ring.position.set(0, L.h + 0.01, l * 0.06); g.add(ring);
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(k * 0.19, k * 0.19, 0.03, 64), new THREE.MeshStandardMaterial({color: '#B5794A', roughness: 0.4, metalness: 0.9}));
    coil.position.set(0, L.h + 0.015, l * 0.06); g.add(coil);
  }
  if (L.face === 'frame') {   // two buttons on the long side
    for (const [z, len] of [[-l * 0.12, l * 0.1], [l * 0.06, l * 0.06]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, L.h * 0.5, len), side);
      b.position.set(w / 2 + 0.02, L.h * 0.5, z); g.add(b);
    }
  }
  g.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.envMap = env; });
  return {group: g, w, l, h: L.h, side};
}

// ------------------------------------------------------------ the page around the 3D
function overlay(app, s) {
  const css = document.createElement('style');
  const light = s.theme === 'light';
  css.textContent = `
    .td { position: absolute; inset: 0; pointer-events: none; font-family: Inter, sans-serif; color: ${light ? '#16171A' : '#F2F1EE'}; }
    .td-vig { position: absolute; inset: 0; background: linear-gradient(${light ? 'rgba(236,235,230,0.9)' : 'rgba(14,15,18,0.9)'} 0%, rgba(0,0,0,0) 17%), radial-gradient(ellipse at 42% 48%, rgba(0,0,0,0) 45%, ${light ? 'rgba(40,36,30,0.16)' : 'rgba(0,0,0,0.55)'} 100%); }
    .td-head { position: absolute; left: 6%; top: 5%; }
    .td-title { font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; }
    .td-sub { font-family: 'JetBrains Mono', monospace; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.6; margin-top: 0.5em; }
    .td-bar { height: 0.35em; width: 2.6em; background: ${s.accent}; margin-bottom: 0.9em; border-radius: 0.2em; }
    .td-lbl { position: absolute; left: 0; top: 0; white-space: nowrap; will-change: opacity; }
    .td-num { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: ${s.accent}; margin-right: 0.6em; }
    .td-name { font-weight: 700; }
    .td-note { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 0.78em; opacity: 0.6; margin-top: 0.3em; padding-left: 2.75em; }
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
    scene.add(key, new THREE.AmbientLight('#FFFFFF', 0.25));

    const rnd = rng(s.seed);
    const model = new THREE.Group();
    scene.add(model);
    const layers = s.layers.map((L, i) => buildLayer(s, L, i, env, rnd));
    // assembled: stacked from the bottom layer up; exploded: evenly spread around the stack's middle
    const n = layers.length;
    const rest = [];
    let y = 0;
    for (let i = n - 1; i >= 0; i--) { rest[i] = y; y += layers[i].h; }
    const stackH = y, gap = Math.max(s.shape.w, s.shape.l) * 0.12;
    const spread = layers.map((_, i) => stackH / 2 + ((n - 1) / 2 - i) * gap);
    for (const Lr of layers) model.add(Lr.group);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(s.shape.w * 1.8, s.shape.l * 1.5), new THREE.MeshBasicMaterial({
      map: painted([256, 256], (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }),
      transparent: true, depthWrite: false}));
    shadow.rotation.x = -Math.PI / 2;
    model.add(shadow);

    const app = document.getElementById('app');
    const ui = overlay(app, s);
    const svg = ui.querySelector('.td-svg');
    const NS = 'http://www.w3.org/2000/svg';
    const labels = s.layers.map((L) => {
      const el = document.createElement('div');
      el.className = 'td-lbl';
      el.innerHTML = '<div><span class="td-num"></span><span class="td-name"></span></div><div class="td-note"></div>';
      el.querySelector('.td-name').textContent = L.name;
      el.querySelector('.td-note').textContent = L.note;
      if (!L.note) el.querySelector('.td-note').remove();
      ui.appendChild(el);
      const line = document.createElementNS(NS, 'polyline');
      line.setAttribute('fill', 'none');
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('fill', s.accent);
      svg.append(line, dot);
      return {el, line, dot};
    });

    // ---- the pose for a time: every layer's offset and the turn, read from the beats only
    const focusOf = (t, i) => {
      let k = 0;
      for (const f of B.focus) if (f.layer === i) k = Math.max(k, prog(t, ...f.out) * (1 - prog(t, ...f.back)));
      return k;
    };
    const pose = (t) => {
      model.rotation.y = rad(-6 + 22 * t / B.duration);
      layers.forEach((Lr, i) => {
        const open = prog(t, ...B.explode[i]) * (1 - prog(t, ...B.close[i], (x) => x));
        const shut = B.close[i];
        // closing: an ease-out with a small overshoot past the rest height, then settle
        const c = clamp01((t - shut[0]) / (shut[1] - shut[0]));
        const settle = t > shut[0] ? Math.sin(c * Math.PI) * 0.06 * gap * (1 - c) : 0;
        const e = t > shut[0] ? 1 - easeInOutCubic(c) : open;
        const f = focusOf(t, i);
        Lr.group.position.set(-s.shape.w * 0.9 * f, lerp(rest[i], spread[i], e) - settle, 0);
        Lr.group.rotation.z = rad(8) * f;
        Lr.side.emissive?.set(s.accent);
        if (Lr.side.emissiveIntensity !== undefined) Lr.side.emissiveIntensity = 0.35 * f;
      });
      shadow.position.y = -0.02 - stackH * 0.02;
      shadow.material.opacity = 1 - 0.4 * clamp01(prog(t, B.explode[0][0], B.exploded) * (1 - prog(t, B.close[n - 1][0], B.closed)));
    };

    // ---- the camera: orbit values [az, el, dist, tx, ty, tz] fitted to the frame at load
    st.resize();   // the fits below measure the real frame
    const box = new THREE.Box3(), corners = [...Array(8)].map(() => new THREE.Vector3());
    const W = () => st.size.w, H = () => st.size.h;
    const wide = W() >= H();
    // the object's frame: with labels, the left part of a wide film or the upper left of a tall one; without, the middle
    const LABELLED = wide ? {x0: 0.06, x1: 0.58, y0: 0.16, y1: 0.9} : {x0: 0.05, x1: 0.6, y0: 0.18, y1: 0.86};
    const HERO = wide ? {x0: 0.18, x1: 0.82, y0: 0.2, y1: 0.86} : {x0: 0.08, x1: 0.92, y0: 0.26, y1: 0.8};
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
        const mid = (lo + hi) / 2;
        place([az, el, mid, ...target, ...centre]);
        if (fits(objs)) hi = mid; else lo = mid;
      }
      return [az, el, hi, ...target, ...centre];
    };
    const all = layers.map((Lr) => Lr.group);
    const mid = (i) => [0, spread[i] + layers[i].h / 2, 0];
    const hero = fit(0, 32, 30, [0, stackH / 2, 0], all, HERO);
    const opened = fit(B.exploded, 22, 36, [0, stackH / 2, 0], all);
    const keys = [[0, hero], [B.explode[0][0], hero], [B.exploded, opened]];
    B.focus.forEach((f, k) => {
      const t = f.out[1];
      const target = [-s.shape.w * 0.9 * 0.6, mid(f.layer)[1], 0];
      const close = fit(t, k % 2 ? -18 : 6, 34 + 8 * (k % 3), target, [layers[f.layer].group]);
      const pushed = [...close];
      pushed[2] *= 0.94;
      keys.push([f.out[0] + 0.1, opened], [f.out[1] + 0.1, close], [f.back[0], pushed], [f.back[1] + 0.1, opened]);
    });
    // the closed object at the end has turned further: fit it there, at the larger of the two distances
    const endA = fit(B.closed, 32, 30, [0, stackH / 2, 0], all, HERO), endB = fit(B.duration, 32, 30, [0, stackH / 2, 0], all, HERO);
    const end = endA[2] > endB[2] ? endA : endB;
    keys.push([B.close[n - 1][0], opened], [B.closed, end], [B.duration, end]);
    keys.sort((a, b) => a[0] - b[0]);

    // label numbers follow screen order in the opened view, top first, and stay fixed for the film
    pose(B.exploded); place(opened);
    const order = layers.map((Lr, i) => [i, st.project(new THREE.Vector3(...mid(i))).y]).sort((a, b) => a[1] - b[1]).map(([i]) => i);
    order.forEach((i, k) => { labels[i].el.querySelector('.td-num').textContent = String(k + 1).padStart(2, '0'); });

    const v = new THREE.Vector3();
    const anchor = (i) => {   // the edge point of a layer furthest towards the labels
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

    const resize = () => { st.resize(); };
    resize();
    return {
      resize,
      render(t) {
        pose(t);
        place(keyed(keys, t, easeInOutCubic));
        st.render();
        // labels: one row per layer in the right column, in screen order, never overlapping
        const u = Math.min(W(), H()) / 1080;
        const fs = (wide ? 26 : 32) * u;
        ui.style.fontSize = `${fs}px`;
        ui.querySelector('.td-title').style.fontSize = `${2.4 * fs}px`;
        // the label column starts at 64% (wide) or 60% (tall), further left when the longest label would leave the frame
        const longest = Math.max(...labels.map((L) => L.el.scrollWidth));
        const colX = Math.min((wide ? 0.64 : 0.6) * W(), W() * 0.96 - longest - 22 * u), rowH = (s.layers.some((L) => L.note) ? 2.9 : 1.7) * fs;
        const rows = order.map((i) => ({i, a: anchor(i)}));
        let yPrev = -Infinity;
        for (const r of rows) { r.y = Math.max(r.a.y, yPrev + rowH); yPrev = r.y; }
        const over = yPrev - H() * 0.92;
        if (over > 0) for (const r of rows) r.y -= over;
        const fade = 1 - prog(t, ...B.labelsOut);
        const anyFocus = B.focus.length ? Math.max(...layers.map((_, i) => focusOf(t, i))) : 0;
        for (const r of rows) {
          const L = labels[r.i], [a, b] = B.labels[r.i];
          const draw = smooth((t - a) / (b - a)) * fade;
          const lit = focusOf(t, r.i), dim = 1 - 0.8 * anyFocus * (1 - lit);
          const x1 = colX - 14 * u, len = Math.hypot(x1 - r.a.x, r.y - r.a.y) + 40 * u;
          L.line.setAttribute('points', `${r.a.x},${r.a.y} ${x1},${r.y} ${x1 + 26 * u},${r.y}`);
          L.line.setAttribute('stroke', lit > 0.5 ? s.accent : (s.theme === 'light' ? 'rgba(20,20,24,0.55)' : 'rgba(242,241,238,0.55)'));
          L.line.setAttribute('stroke-width', String(2 * u));
          L.line.setAttribute('stroke-dasharray', `${len}`);
          L.line.setAttribute('stroke-dashoffset', `${len * (1 - draw)}`);
          L.line.style.opacity = String(dim * (draw > 0 ? 1 : 0));
          L.dot.setAttribute('cx', r.a.x); L.dot.setAttribute('cy', r.a.y); L.dot.setAttribute('r', String(5 * u * clamp01(draw * 3)));
          L.dot.style.opacity = String(dim);
          const show = clamp01((draw - 0.6) / 0.4);
          // whole pixels, and labels kept on their own layer (will-change: opacity): a label then rasterises the same
          // whatever opacity or colour it had on the frame drawn before
          L.el.style.transform = `translate(${Math.round(colX + 22 * u + (1 - show) * 18 * u)}px, ${Math.round(r.y - 0.75 * fs)}px)`;
          L.el.style.opacity = String(show * dim);
          L.el.querySelector('.td-name').style.color = lit > 0.5 ? s.accent : '';
        }
        return {};
      },
    };
  });
}
