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
    fs.copyFileSync(path.join(engine, 'framemotion/reel.js'), path.join(dir, '.sm/fm-reel.js'));
    const fps = entry.fps ?? 30;
    let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    html = html.replace('<script src="film.js"></script>', '<script src="film.js"></script>\n  <script src=".sm/fm-reel.js"></script>');
    html = html.replace('</body>', `<script>
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
</body>`);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return {dir, page: 'index.html'};
  },
};

export async function buildEntry(entry, enginesRoot) {
  const builder = BUILDERS[entry.build?.tool];
  if (!builder) throw new Error(`Unknown builder "${entry.build?.tool}" for ${entry.id}`);
  return builder(entry, enginesRoot);
}
