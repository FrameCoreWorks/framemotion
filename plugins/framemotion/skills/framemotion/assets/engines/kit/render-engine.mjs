#!/usr/bin/env node
// Render frames of any registered FrameMotion engine in headless Chromium and check them.
// Files reach the page through Playwright's request routing from this engines folder only:
// there is no HTTP server, and nothing a page sends can run a command or read outside it.
//
//   node kit/render-engine.mjs --engine photoreal [--frames 0,30,59] [--out DIR]
//                              [--params '{"samples":16}'] [--gpu]
//
// The engine page must set window.__framemotion = {engine, canvas, ready: true, checks?}
// where engine comes from defineEngine() and canvas is what it draws on. Every frame is
// rendered twice and must match byte for byte (the engine is a pure function of time).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ENGINES_ROOT = path.resolve(here, '..');
const ORIGIN = 'http://framemotion.local';
const TYPES = {'.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.bin': 'application/octet-stream'};

export function registry() {
  return JSON.parse(fs.readFileSync(path.join(ENGINES_ROOT, 'engines.json'), 'utf8'));
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
  const rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
  const file = path.resolve(root, rel);
  return file.startsWith(root + path.sep) ? file : null;
}

export async function openEngine(id, {params = {}, gpu = false} = {}) {
  const entry = registry().engines.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown engine "${id}"; see engines.json.`);
  const {chromium} = await loadPlaywright();
  const args = gpu ? ['--ignore-gpu-blocklist'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await chromium.launch({args});
  const {width, height} = {...entry.size, ...params};
  const page = await browser.newPage({viewport: {width, height}});
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route(`${ORIGIN}/**`, async (route) => {
    const file = resolveInside(ENGINES_ROOT, new URL(route.request().url()).pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({status: 404, body: ''});
    return route.fulfill({status: 200, contentType: TYPES[path.extname(file)] ?? 'application/octet-stream', body: fs.readFileSync(file)});
  });
  await page.route((url) => !url.href.startsWith(ORIGIN), (route) => route.abort());   // no network at render time
  const query = new URLSearchParams({params: JSON.stringify({width, height, ...params})});
  await page.goto(`${ORIGIN}/${entry.page}?${query}`);
  await page.waitForFunction(() => window.__framemotion?.ready === true, null, {timeout: 120000}).catch(() => {});
  if (errors.length) { await browser.close(); throw new Error(`Engine page errors: ${errors.join(' | ')}`); }
  const ready = await page.evaluate(() => window.__framemotion?.ready === true);
  if (!ready) { await browser.close(); throw new Error('Engine page never set window.__framemotion.ready'); }
  return {entry, browser, page, errors};
}

const capture = (page, frame) => page.evaluate((f) => {
  const fm = window.__framemotion;
  fm.engine.seekFrame(f);
  return fm.canvas.toDataURL('image/png');
}, frame);

export async function renderFrames(id, {frames, out = null, params = {}, gpu = false} = {}) {
  const {entry, browser, page} = await openEngine(id, {params, gpu});
  try {
    const info = await page.evaluate(() => { const e = window.__framemotion.engine; return {id: e.id, fps: e.fps, totalFrames: e.totalFrames, width: e.width, height: e.height}; });
    if (info.id !== entry.id) throw new Error(`Page engine id ${info.id} differs from registry id ${entry.id}`);
    const list = frames ?? [0, Math.floor(info.totalFrames / 2), info.totalFrames - 1];
    const report = {engine: info, frames: []};
    for (const frame of list) {
      const t0 = Date.now();
      const first = await capture(page, frame);
      const seconds = (Date.now() - t0) / 1000;
      const second = await capture(page, frame);
      const stats = await page.evaluate(() => {
        const c = window.__framemotion.canvas, ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = c.width; ctx.canvas.height = c.height; ctx.drawImage(c, 0, 0);
        const px = ctx.getImageData(0, 0, c.width, c.height).data;
        let sum = 0, min = 255, max = 0;
        for (let i = 0; i < px.length; i += 4) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += l; if (l < min) min = l; if (l > max) max = l; }
        return {mean: +(sum / (px.length / 4)).toFixed(2), min, max};
      });
      report.frames.push({frame, seconds, deterministic: first === second, ...stats});
      if (out) {
        fs.mkdirSync(out, {recursive: true});
        fs.writeFileSync(path.join(out, `${entry.id}-${String(frame).padStart(5, '0')}.png`), Buffer.from(first.split(',')[1], 'base64'));
      }
    }
    return report;
  } finally {
    await browser.close();
  }
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (key === 'gpu') { o.gpu = true; continue; }
    const value = argv[++i];
    if (key === 'frames') o.frames = value.split(',').map(Number);
    else if (key === 'params') o.params = JSON.parse(value);
    else o[key] = value;
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const o = parseArgs(process.argv.slice(2));
  if (!o.engine) { console.error('Usage: node kit/render-engine.mjs --engine <id> [--frames 0,30] [--out DIR] [--params JSON] [--gpu]'); process.exit(2); }
  const report = await renderFrames(o.engine, o);
  console.log(JSON.stringify(report, null, 2));
  if (!report.frames.every((f) => f.deterministic)) process.exit(3);
}
