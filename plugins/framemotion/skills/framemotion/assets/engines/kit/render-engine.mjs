#!/usr/bin/env node
// Render frames of any registered FrameMotion engine in headless Chromium and check them.
// Files reach the page through Playwright's request routing from this engines folder only:
// there is no HTTP server, and nothing a page sends can run a command or read outside it.
//
//   node kit/render-engine.mjs --engine photoreal-demo [--frames 0,30,59] [--out DIR]
//                              [--params '{"samples":16}'] [--gpu] [--allow-flat] [--once]
//   --frames all renders every frame (for an MP4); --once skips the repeat check (half the time).
//
// The engine page must set window.__framemotion = {engine, canvas, ready: true, checks?}
// where engine comes from defineEngine() and canvas is what it draws on. Every frame is
// rendered twice and must match byte for byte (the engine is a pure function of time).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {buildEntry} from './builders.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ENGINES_ROOT = path.resolve(here, '..');
const ORIGIN = 'http://framemotion.local';
const TYPES = {'.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.hdr': 'image/vnd.radiance',
  '.ktx2': 'image/ktx2', '.bin': 'application/octet-stream'};
// Chromium flags that keep a page offline even if a request slipped past routing: every host name
// resolves to nothing, and no proxy or background service may reach out.
const OFFLINE_ARGS = ['--host-resolver-rules=MAP * ~NOTFOUND', '--no-proxy-server', '--disable-background-networking',
  '--disable-component-update', '--disable-domain-reliability', '--disable-sync', '--no-pings',
  '--force-webrtc-ip-handling-policy=disable_non_proxied_udp'];   // no WebRTC over UDP: routes cover HTTP and WebSockets only
/** Bundled engines' own clock functions, by registry adapter name. */
const ADAPTERS = {renderFrame: 'renderFrame', seek: 'seek'};
const SOFTWARE_GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/** True only for the engines folder's own origin: scheme, host and port must all match. */
export function isEngineUrl(url) {
  try { return new URL(url).origin === ORIGIN; } catch { return false; }
}

/** The engine registry of an engines folder (this one by default; tests pass their own). */
export function registry(root = ENGINES_ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, 'engines.json'), 'utf8'));
}

/** Playwright from this folder, a global install (NODE_PATH) or the Animate engine's pinned copy. */
export async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  const candidates = [path.join(ENGINES_ROOT, 'package.json'), path.resolve(ENGINES_ROOT, '../animate-engine/package.json')];
  for (const from of candidates) {
    try { return createRequire(from)('playwright'); } catch {}
  }
  try { return createRequire(import.meta.url)('playwright'); } catch {}
  throw new Error('Playwright is not installed: install it (see the engines README) or run npm ci in assets/animate-engine.');
}

/** Resolve a request path inside the engines folder, or null when it would leave it. */
export function resolveInside(root, urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return null; }   // malformed escapes are a 404
  if (rel.includes('\0')) return null;
  const base = fs.realpathSync(root);
  const file = path.resolve(base, rel.replace(/^\/+/, ''));
  if (!file.startsWith(base + path.sep)) return null;
  if (!fs.existsSync(file)) return file;
  const real = fs.realpathSync(file);                               // a symlink may not lead outside
  return real.startsWith(base + path.sep) ? real : null;
}

/**
 * Check settings against the entry's declared params. width and height are always allowed;
 * an entry without params accepts any JSON object (bundled engines read their own settings).
 */
export function validateParams(entry, params) {
  if (params === null || typeof params !== 'object' || Array.isArray(params)) throw new TypeError('params must be a JSON object.');
  for (const key of ['width', 'height']) {
    if (key in params && !(Number.isInteger(params[key]) && params[key] >= 16 && params[key] <= 8192)) {
      throw new RangeError(`${key} must be an integer in [16, 8192].`);
    }
  }
  if (!entry.params) return params;
  for (const [key, value] of Object.entries(params)) {
    if (key === 'width' || key === 'height') continue;
    const spec = entry.params[key];
    if (!spec) throw new RangeError(`${entry.id} has no setting "${key}" (known: ${Object.keys(entry.params).join(', ')}).`);
    const ok = {integer: Number.isInteger(value), number: Number.isFinite(value), boolean: typeof value === 'boolean', string: typeof value === 'string',
      object: value !== null && typeof value === 'object' && !Array.isArray(value)}[spec.type];
    if (!ok) throw new TypeError(`${entry.id}.${key} must be ${spec.type}.`);
    if ((spec.min !== undefined && value < spec.min) || (spec.max !== undefined && value > spec.max)) {
      throw new RangeError(`${entry.id}.${key} must be in [${spec.min ?? '-inf'}, ${spec.max ?? 'inf'}].`);
    }
  }
  return params;
}

export async function openEngine(id, {params = {}, gpu = false, root = ENGINES_ROOT} = {}) {
  const entry = registry(root).engines.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown engine "${id}"; see engines.json.`);
  validateParams(entry, params);
  // Build first: a failed build (a missing folder) must not leave a browser running.
  const built = entry.build ? await buildEntry(entry, root) : null;
  const {chromium} = await loadPlaywright();
  const args = [...OFFLINE_ARGS, '--ignore-gpu-blocklist', ...(gpu ? [] : SOFTWARE_GL)];
  const browser = await chromium.launch({args});
  const {width, height} = {...entry.size, ...params};
  const context = await browser.newContext({viewport: {width, height}, serviceWorkers: 'block', acceptDownloads: false});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // Missing files are reported by the router below with their path; the browser's own
  // "Failed to load resource" line carries no path, so it is not counted twice.
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  const optional = new Set(entry.optional ?? []);
  const blocked = new Set();   // outside requests the page tried; they never leave, the report lists them
  // One handler for every request of the whole context (pages, workers, iframes): the engines
  // origin is served from disk, everything else is refused. WebSockets are closed at once.
  await context.routeWebSocket(() => true, (ws) => ws.close({code: 1008, reason: 'offline'}));
  await context.route(() => true, async (route) => {
    const url = route.request().url();
    if (!isEngineUrl(url)) { if (!url.startsWith('data:')) blocked.add(url); return route.abort('blockedbyclient'); }
    const urlPath = new URL(url).pathname;
    const file = built && urlPath.startsWith('/_build/')
      ? resolveInside(built.dir, urlPath.slice('/_build'.length))
      : resolveInside(root, urlPath);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      const rel = built && urlPath.startsWith('/_build/') ? urlPath.slice('/_build/'.length) : urlPath.slice(1);
      if (!optional.has(rel)) errors.push(`404 ${urlPath}`);
      return route.fulfill({status: 404, body: ''});
    }
    return route.fulfill({status: 200, contentType: TYPES[path.extname(file)] ?? 'application/octet-stream', body: fs.readFileSync(file)});
  });
  const query = new URLSearchParams({...(built?.query ?? {}), params: JSON.stringify({width, height, ...params})});
  const pagePath = built ? `_build/${built.page}` : entry.page;
  await page.goto(`${ORIGIN}/${pagePath}?${query}`);
  if (ADAPTERS[entry.adapter]) {
    const fn = ADAPTERS[entry.adapter];
    await page.waitForFunction((name) => typeof window[name] === 'function', fn, {timeout: 120000}).catch(() => {});
    // A page may report its own size and timing (kaventro films set window.FILM_INFO); the
    // adapter uses those, so the runner's registry check catches a registry that disagrees.
    await page.addScriptTag({type: 'module', content: `
      import {fromRenderFrame} from '/kit/adapters.mjs';
      const info = window.FILM_INFO;
      const spec = info ? {id: ${JSON.stringify(entry.id)}, width: info.W, height: info.H, fps: info.FPS, duration: info.frames / info.FPS}
        : ${JSON.stringify({id: entry.id, width, height, fps: entry.fps, duration: entry.duration})};
      const canvas = ${JSON.stringify(entry.capture ?? null)} ? document.querySelector(${JSON.stringify(entry.capture ?? 'canvas')}) : null;
      window.__framemotion = {engine: fromRenderFrame({...spec, renderFrame: window[${JSON.stringify(fn)}]}), canvas, element: ${JSON.stringify(entry.screenshot ?? null)}, ready: true};
    `});
  }
  await page.waitForFunction(() => window.__framemotion?.ready === true, null, {timeout: 120000}).catch(() => {});
  const close = async () => { await browser.close(); if (built) fs.rmSync(built.dir, {recursive: true, force: true}); };
  if (errors.length) { await close(); throw new Error(`Engine page errors: ${errors.join(' | ')}`); }
  // Web fonts and the first layout must settle before frame 0, or frame 0 differs from its repeat.
  await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));
  const ready = await page.evaluate(() => window.__framemotion?.ready === true);
  if (!ready) { await close(); throw new Error('Engine page never set window.__framemotion.ready'); }
  if (entry.transparent) {
    // A film made to lie over footage: drop every background (a template's preview checkerboard
    // too) and capture with an alpha channel. Only screenshot pages can do this.
    if (!entry.screenshot) { await close(); throw new Error(`${entry.id}: transparent needs a screenshot element`); }
    await page.addStyleTag({content: `html, body, ${entry.screenshot} { background: transparent !important; }`});
    transparentPages.add(page);
  }
  return {entry, browser, page, errors, blocked, close};
}

/**
 * Draw a frame and measure it in the page: a hash of every pixel (FNV-1a over RGBA), and the mean,
 * min and max brightness. The PNG travels to Node only when it is saved (PNG encoding is slow).
 * Pages without a canvas are captured as a screenshot of their element.
 */
const warmed = new WeakSet();
const transparentPages = new WeakSet();   // pages captured with an alpha channel
/** A short stable id of a frame's pixels (canvas pages hash in the page; screenshots are hashed here). */
const hashOf = (h) => (h.length <= 16 ? h : crypto.createHash('sha256').update(h).digest('hex').slice(0, 16));

async function capture(page, frame, {png = false} = {}) {
  const result = await page.evaluate(async ({f, png}) => {
    const fm = window.__framemotion;
    await fm.engine.seekFrame(f);   // a page's seek may be async (fonts, images); the frame is drawn when it settles
    if (!fm.canvas) return null;
    const c = fm.canvas;
    const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true});
    ctx.canvas.width = c.width; ctx.canvas.height = c.height; ctx.drawImage(c, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    let h = 0x811c9dc5, sum = 0, min = 255, max = 0;
    const words = new Uint32Array(px.buffer, px.byteOffset, px.byteLength >> 2);
    for (let i = 0; i < words.length; i++) {
      h = Math.imul(h ^ words[i], 16777619) >>> 0;
      const v = words[i], l = ((v & 255) + ((v >>> 8) & 255) + ((v >>> 16) & 255)) / 3;
      sum += l; if (l < min) min = l; if (l > max) max = l;
    }
    return {hash: h.toString(16), mean: +(sum / words.length).toFixed(2), min, max, png: png ? c.toDataURL('image/png') : null};
  }, {f: frame, png});
  if (result) return result;
  const selector = await page.evaluate(() => window.__framemotion.element || 'body');
  const target = page.locator(selector).first();
  // The first screenshot and the first canvas the page makes for measuring change how Chromium
  // rasterises the page afterwards (anti-aliasing of SVG strokes, seen on the Hairline example),
  // so one throwaway screenshot and measurement come first and frame 0 repeats like every other.
  const measure = (buffer) => page.evaluate(async (url) => {
    const img = new Image(); img.src = url; await img.decode();
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = img.width; ctx.canvas.height = img.height; ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, img.width, img.height).data;
    let sum = 0, min = 255, max = 0;
    for (let i = 0; i < px.length; i += 4) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += l; if (l < min) min = l; if (l > max) max = l; }
    return {mean: +(sum / (px.length / 4)).toFixed(2), min, max};
  }, `data:image/png;base64,${buffer.toString('base64')}`);
  const shotOptions = {animations: 'disabled', omitBackground: transparentPages.has(page)};
  if (!warmed.has(page)) {
    warmed.add(page);
    await measure(await target.screenshot(shotOptions));
    await page.evaluate((f) => window.__framemotion.engine.seekFrame(f), frame);
  }
  const shot = await target.screenshot(shotOptions);
  const dataUrl = `data:image/png;base64,${shot.toString('base64')}`;
  const stats = await measure(shot);
  return {hash: shot.toString('base64'), ...stats, png: png ? dataUrl : null};
}

/** Spread of a frame below this (0..255 brightness) counts as flat: nothing was drawn. */
export const FLAT_SPREAD = 1;

/**
 * Render and check frames. Throws when the page reports an error at any point or when the
 * page's engine differs from its registry entry (id, size, fps). Each frame records whether it
 * repeated byte for byte (deterministic) and whether it is flat (one colour, usually a failed draw).
 */
export async function renderFrames(id, {frames, out = null, params = {}, gpu = false, root = ENGINES_ROOT, once = false} = {}) {
  const {entry, page, errors, blocked, close} = await openEngine(id, {params, gpu, root});
  const fail = (where) => { if (errors.length) throw new Error(`Engine page errors ${where}: ${errors.join(' | ')}`); };
  try {
    const info = await page.evaluate(() => { const e = window.__framemotion.engine; return {id: e.id, fps: e.fps, totalFrames: e.totalFrames, width: e.width, height: e.height, duration: e.duration}; });
    const retimed = Object.keys(params).some((key) => entry.params?.[key]?.timing);
    const expected = {id: entry.id, fps: retimed ? undefined : entry.fps, duration: retimed ? undefined : entry.duration,
      width: params.width ?? entry.size?.width, height: params.height ?? entry.size?.height};
    for (const [key, value] of Object.entries(expected)) {
      if (value !== undefined && info[key] !== value) throw new Error(`Page engine ${key} ${info[key]} differs from registry ${value}`);
    }
    const list = frames === 'all' ? Array.from({length: info.totalFrames}, (_, i) => i)
      : frames ?? [0, Math.floor(info.totalFrames / 2), info.totalFrames - 1];
    const report = {engine: info, frames: []};
    for (const frame of list) {
      const t0 = Date.now();
      const first = await capture(page, frame, {png: Boolean(out)});
      const seconds = (Date.now() - t0) / 1000;
      fail(`at frame ${frame}`);
      const second = once ? first : await capture(page, frame);
      fail(`at frame ${frame} (repeat)`);
      const {hash, png, ...stats} = first;
      report.frames.push({frame, seconds, hash: hashOf(hash), deterministic: once ? null : hash === second.hash, flat: stats.max - stats.min < FLAT_SPREAD, ...stats});
      if (out) {
        fs.mkdirSync(out, {recursive: true});
        fs.writeFileSync(path.join(out, `${entry.id}-${String(frame).padStart(5, '0')}.png`), Buffer.from(png.split(',')[1], 'base64'));
      }
    }
    // A blocked request may change the picture (a missing library, font or image), so it fails
    // the render unless the registry entry lists it as known and harmless (allowed_blocked).
    report.blocked = [...blocked];
    const allowed = new Set(entry.allowed_blocked ?? []);
    const unexpected = report.blocked.filter((url) => !allowed.has(url));
    if (unexpected.length) {
      throw new Error(`${entry.id} asked for files outside the engines folder (blocked, the picture may be wrong): ` +
        `${unexpected.join(', ')}. Bundle them, or list a harmless one in the entry's allowed_blocked.`);
    }
    return report;
  } finally {
    await close();
  }
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    const flags = {gpu: 'gpu', 'allow-flat': 'allowFlat', once: 'once'};
    if (key in flags) { o[flags[key]] = true; continue; }
    const value = argv[++i];
    if (key === 'frames') o.frames = value === 'all' ? 'all' : value.split(',').map(Number);
    else if (key === 'params') o.params = JSON.parse(value);
    else o[key] = value;
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const o = parseArgs(process.argv.slice(2));
  if (!o.engine) { console.error('Usage: node kit/render-engine.mjs --engine <id> [--frames 0,30] [--out DIR] [--params JSON] [--gpu] [--allow-flat] [--once]'); process.exit(2); }
  const report = await renderFrames(o.engine, o);
  console.log(JSON.stringify(report, null, 2));
  if (report.frames.some((f) => f.deterministic === false)) process.exit(3);
  if (!o.allowFlat && report.frames.some((f) => f.flat)) {
    console.error('A frame is flat (one colour). Pass --allow-flat when that is intended, such as a fade from black.');
    process.exit(4);
  }
}
