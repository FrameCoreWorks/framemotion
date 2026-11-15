// Builders that turn a bundled engine's project into one page the renderer can open.
// Each writes into a fresh temporary folder outside the plugin, never into the package.
// Original FrameCore Works code (Apache-2.0). Node only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

/**
 * A bundled engine's own folder, next to the engines folder (in the plugin's assets, or in the
 * workspace when first setup copied it there too). Missing: a clear error naming what to copy.
 */
function sibling(enginesRoot, name) {
  const dir = path.resolve(enginesRoot, '..', name);
  if (!fs.existsSync(dir)) {
    throw new Error(`This engine needs the folder "${name}" next to "${path.basename(enginesRoot)}" (${dir}). ` +
      `Copy assets/${name} from the FrameMotion skill there, as first setup's runtimes table says.`);
  }
  return dir;
}

const temp = (id) => fs.mkdtempSync(path.join(os.tmpdir(), `framemotion-${id}-`));

/**
 * Measured word times of a Stickman film, from words.json in its folder: per clip id, either a list of
 * {word, start, end} (seconds from the start of that clip's voice take) or Whisper's JSON for that take
 * ({segments: [{words: [...]}]}). Null when the film has none.
 */
function wordTimes(dir) {
  const file = path.join(dir, 'words.json');
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = {};
  for (const [clip, take] of Object.entries(raw)) {
    const list = Array.isArray(take) ? take : (take.segments ?? []).flatMap((s) => s.words ?? []);
    out[clip] = list.map((w) => ({word: String(w.word ?? w.text ?? '').trim(), start: +w.start, end: +w.end}))
      .filter((w) => w.word && Number.isFinite(w.start) && Number.isFinite(w.end));
  }
  return out;
}

export const BUILDERS = {
  /** Animate engine: copy a piece and assemble its single index.html with the engine's own build tool. */
  async animate(entry, enginesRoot) {
    const tool = path.join(sibling(enginesRoot, 'animate-engine'), 'tools/build.mjs');
    const piece = path.resolve(enginesRoot, entry.build.piece);
    const dir = temp(entry.id);
    fs.cpSync(piece, dir, {recursive: true});
    const run = spawnSync(process.execPath, [tool, dir], {encoding: 'utf8'});
    if (run.status !== 0) throw new Error(`Animate build failed: ${run.stderr || run.stdout}`);
    return {dir, page: 'index.html'};
  },
  /** Anatomy engine: its own page builder (studio.mjs buildPage) in svg, webgl or 3d mode. */
  async anatomy(entry, enginesRoot) {
    const studio = await import(pathToFileURL(path.join(sibling(enginesRoot, 'anatomy-engine'), 'studio.mjs')).href);
    const dir = temp(entry.id);
    fs.writeFileSync(path.join(dir, 'index.html'), studio.buildPage(entry.build.options));
    return {dir, page: 'index.html'};
  },
  /** A finished composition folder of the package (an example with its own copy of a kit), copied as is. */
  async folder(entry, enginesRoot) {
    const source = path.resolve(enginesRoot, entry.build.path);
    const assets = path.resolve(enginesRoot, '..');
    if (!source.startsWith(assets + path.sep)) throw new Error(`${entry.id}: build.path must stay inside the skill's assets`);
    sibling(enginesRoot, path.relative(assets, source).split(path.sep)[0]);
    const dir = temp(entry.id);
    fs.cpSync(source, dir, {recursive: true});
    return {dir, page: entry.build.page ?? 'index.html'};
  },
  /**
   * Cutaway engine (bundled Nyxera0x/cutaway plus FrameMotion's teardown): bundle a sim folder
   * (a main.js on the cutaway kit: an upstream film or a teardown spec) into one page with the
   * engine's own build tool, then expose its pure SIM.render(t) as renderFrame. three.js, esbuild
   * and the fonts come from this engines folder.
   */
  async cutaway(entry, enginesRoot) {
    const engine = sibling(enginesRoot, 'cutaway-engine');
    const sim = path.resolve(enginesRoot, entry.build.sim);
    if (!fs.existsSync(path.join(sim, 'main.js'))) throw new Error(`${entry.id}: no main.js in ${sim}`);
    const dir = temp(entry.id);
    const run = spawnSync(process.execPath, [path.join(engine, 'sims/build.mjs'), sim], {encoding: 'utf8', cwd: dir,
      env: {...process.env, CUTAWAY_DEPS: path.resolve(enginesRoot, 'node_modules'), CUTAWAY_OUT: dir}});
    if (run.status !== 0) throw new Error(`Cutaway build failed: ${run.stderr || run.stdout}`);
    const page = `dist/${path.basename(sim)}.html`;
    let html = fs.readFileSync(path.join(dir, page), 'utf8');
    // capture mode: the page draws only when asked; renderFrame waits for the sim's setup to finish
    html = html.replace('<script type="module">', () => '<script>window.__CAPTURE = true;</script>\n<script type="module">');
    const tail = html.lastIndexOf('</body>');
    html = html.slice(0, tail) + `<script>
    (function wait() {
      const sim = window.SIM;
      if (!sim || !sim.ready) return setTimeout(wait, 20);
      window.FILM_INFO = {W: innerWidth, H: innerHeight, FPS: sim.fps, frames: Math.round(sim.duration * sim.fps)};
      window.renderFrame = (t) => sim.render(t);
    })();
  </script>
` + html.slice(tail);
    fs.writeFileSync(path.join(dir, page), html);
    return {dir, page};
  },
  /**
   * kaventro/motion-designer film templates: shared/ plus one kind (blank, overlay, mobile, desktop,
   * story), assembled the way its new_film.sh does. The page draws on window.seek(t) with ?render.
   */
  async kaventro(entry, enginesRoot) {
    const templates = path.join(sibling(enginesRoot, 'kaventro-engine'), 'templates');
    const kind = entry.build.kind;
    if (!['blank', 'overlay', 'mobile', 'desktop', 'story'].includes(kind)) throw new Error(`Unknown kaventro kind "${kind}"`);
    const dir = temp(entry.id);
    fs.cpSync(path.join(templates, 'shared'), path.join(dir, 'src'), {recursive: true});
    fs.cpSync(path.join(templates, kind), path.join(dir, 'src'), {recursive: true});
    fs.mkdirSync(path.join(dir, 'audio'));   // the film's music goes here; a silent render needs none
    return {dir, page: 'src/index.html', query: {render: '1'}};
  },
  /**
   * Stickman engine (bundled Stickman Kino plus FrameMotion's reel additions): copy a film folder
   * (film.json + scenes.js), compose its page with the engine's own compose(), add the reel
   * additions and a seek(t) on the film's one paused timeline. GSAP comes from this engines folder.
   */
  async stickman(entry, enginesRoot) {
    const engine = sibling(enginesRoot, 'stickman-engine');
    const film = path.resolve(enginesRoot, entry.build.film);
    const dir = temp(entry.id);
    fs.cpSync(film, dir, {recursive: true});
    const script = `import {compose} from ${JSON.stringify(pathToFileURL(path.join(engine, 'lib/film.mjs')).href)};
      const r = compose(process.argv[1]); console.log(JSON.stringify({W: r.W, H: r.H, total: r.total}));`;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', script, dir], {
      encoding: 'utf8', env: {...process.env, NODE_PATH: path.join(enginesRoot, 'node_modules')}});
    if (run.status !== 0) throw new Error(`Stickman compose failed: ${run.stderr || run.stdout}`);
    const {W, H, total} = JSON.parse(run.stdout.trim().split('\n').pop());
    const ours = path.join(engine, 'framemotion');
    fs.copyFileSync(path.join(ours, 'reel.js'), path.join(dir, '.sm/fm-reel.js'));
    fs.copyFileSync(path.join(ours, 'reel.css'), path.join(dir, '.sm/fm-reel.css'));
    fs.cpSync(path.join(ours, 'fonts'), path.join(dir, '.sm/fm-fonts'), {recursive: true});
    const words = wordTimes(dir);
    const fps = entry.fps ?? 30;
    let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    html = html.replace('<link rel="stylesheet" href=".sm/sm.css">', '<link rel="stylesheet" href=".sm/sm.css">\n  <link rel="stylesheet" href=".sm/fm-reel.css">');
    html = html.replace('<script src="film.js"></script>', () => '<script src="film.js"></script>\n' +
      (words ? `  <script>window.SM_WORDS = ${JSON.stringify(words).replace(/</g, '\\u003c')};</script>\n` : '') +
      '  <script src=".sm/fm-reel.js"></script>');
    const tail = html.lastIndexOf('</body>');
    html = html.slice(0, tail) + `<script>
    window.FILM_INFO = {W: ${W}, H: ${H}, FPS: ${fps}, frames: ${Math.round(total * fps)}};
    // HyperFrames shows one clip section at a time from its data-start and data-duration; outside
    // HyperFrames the seek does the same, then moves the film's one timeline.
    window.seek = (t) => {
      const clips = [...document.querySelectorAll('section.clip')];
      const last = clips[clips.length - 1];
      for (const s of clips) {
        const a = +s.dataset.start, b = a + +s.dataset.duration;
        s.style.visibility = (t >= a && t < b) || (s === last && t >= b) ? 'visible' : 'hidden';
      }
      window.__timelines.stickman.seek(t);
    };
  </script>
` + html.slice(tail);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return {dir, page: 'index.html'};
  },
};

export async function buildEntry(entry, enginesRoot) {
  const builder = BUILDERS[entry.build?.tool];
  if (!builder) throw new Error(`Unknown builder "${entry.build?.tool}" for ${entry.id}`);
  return builder(entry, enginesRoot);
}
