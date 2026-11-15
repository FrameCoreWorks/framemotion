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
    const dir = temp(entry.id);
    let sim;
    if (entry.build.spec) {
      // a teardown from its spec.json alone: the page's main.js is written here, so the spec can live anywhere
      const spec = path.resolve(enginesRoot, entry.build.spec);
      if (!fs.existsSync(spec)) throw new Error(`${entry.id}: no spec at ${spec}`);
      sim = path.join(dir, entry.id);
      fs.mkdirSync(sim);
      fs.copyFileSync(spec, path.join(sim, 'spec.json'));
      const teardown = JSON.stringify(path.join(engine, 'framemotion/teardown.js'));
      fs.writeFileSync(path.join(sim, 'main.js'), `import {runTeardown} from ${teardown};\nimport SPEC from './spec.json';\nrunTeardown(SPEC);\n`);
    } else {
      sim = path.resolve(enginesRoot, entry.build.sim);
    }
    if (!fs.existsSync(path.join(sim, 'main.js'))) throw new Error(`${entry.id}: no main.js in ${sim}`);
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
   * Launch engine (bundled Kimeur/motion-launch-videos): a style's film.html (its template, or the user's
   * own film folder holding film.html and assets/) with its fonts from this engines folder's @fontsource
   * packages, assembled into one offline page by the engine's own build.mjs. The page's renderFrame(n)
   * (a frame number, with its motion blur) is exposed as renderFrameAt(t) once the fonts and layout are ready.
   */
  async launch(entry, enginesRoot) {
    const engine = sibling(enginesRoot, 'launch-engine');
    const style = entry.build.style;
    const template = path.join(engine, 'styles', style ?? '', 'templates');
    if (!style || !fs.existsSync(path.join(template, 'film.html'))) throw new Error(`${entry.id}: unknown launch style "${style}" (see launch-engine/styles)`);
    const source = entry.build.film ? path.resolve(enginesRoot, entry.build.film) : template;
    if (!fs.existsSync(path.join(source, 'film.html'))) throw new Error(`${entry.id}: no film.html in ${source}`);
    const dir = temp(entry.id);
    const film = path.join(dir, 'film');
    fs.mkdirSync(path.join(film, 'src'), {recursive: true});
    if (fs.existsSync(path.join(source, 'assets'))) fs.cpSync(path.join(source, 'assets'), path.join(film, 'assets'), {recursive: true});
    let html = fs.readFileSync(path.join(source, 'film.html'), 'utf8');
    // letters beyond basic Latin (ą, ę, ł, ś, ż ...): each latin face gets its Latin Extended twin
    const extended = /[Ā-ɏḀ-ỿ]/.test(html);
    const fontsource = path.join(enginesRoot, 'node_modules', '@fontsource');
    const font = (pkg, file) => {
      const from = path.join(fontsource, pkg, 'files', file);
      if (!fs.existsSync(from)) throw new Error(`${entry.id}: font ${file} is not in @fontsource/${pkg}; add the package at an exact version to the engines folder's package.json`);
      fs.mkdirSync(path.join(film, 'fonts'), {recursive: true});
      fs.copyFileSync(from, path.join(film, 'fonts', file));
      fs.copyFileSync(path.join(fontsource, pkg, 'LICENSE'), path.join(film, 'fonts', `OFL-${pkg}.txt`));
    };
    html = html.replace(/@font-face\s*\{[^}]*__FONT:([a-z0-9-]+?)-latin-(\d+)-(normal|italic)\.woff2__[^}]*\}/g, (rule, pkg, weight, style) => {
      font(pkg, `${pkg}-latin-${weight}-${style}.woff2`);
      if (!extended) return rule;
      const ranges = JSON.parse(fs.readFileSync(path.join(fontsource, pkg, 'unicode.json'), 'utf8'))['latin-ext'];
      if (!ranges) return rule;
      font(pkg, `${pkg}-latin-ext-${weight}-${style}.woff2`);
      const twin = rule.replace(`-latin-${weight}-`, `-latin-ext-${weight}-`).replace(/\}$/, `;unicode-range:${ranges}}`);
      return `${rule}\n${twin}`;
    });
    for (const m of html.matchAll(/__FONT:([a-z0-9-]+?)-(latin-ext|latin|cyrillic|greek|vietnamese)-(\d+)-(normal|italic)\.woff2__/g)) {
      if (!fs.existsSync(path.join(film, 'fonts', m[0].slice(7, -2)))) font(m[1], m[0].slice(7, -2));
    }
    fs.writeFileSync(path.join(film, 'src', 'film.html'), html);
    const run = spawnSync(process.execPath, [path.join(engine, 'shared/scripts/build.mjs'), film], {encoding: 'utf8'});
    if (run.status !== 0) throw new Error(`Launch build failed: ${run.stderr || run.stdout}`);
    let page = fs.readFileSync(path.join(film, 'film.html'), 'utf8');
    const tail = page.lastIndexOf('</body>');
    page = page.slice(0, tail) + `<script>
    (function () {
      // the film's own renderFrame(n) takes a frame number and stays as it is (its critique calls it);
      // renderFrameAt(t) appears once the fonts and layout are ready
      window.ready.then(() => {
        window.FILM_INFO = {W: window.WIDTH, H: window.HEIGHT, FPS: window.FPS, frames: Math.round(window.DURATION * window.FPS)};
        window.renderFrameAt = (t) => { window.renderFrame(Math.round(t * window.FPS)); };
      });
    })();
  </script>
` + page.slice(tail);
    fs.writeFileSync(path.join(film, 'film.html'), page);
    const query = {capture: '1'};
    if (entry.build.format) query.format = String(entry.build.format).replace(':', 'x');
    return {dir, page: 'film/film.html', query};
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
  /**
   * Reels engine (bundled claude-animation-skills reel styles). A spec style (graph, map-route,
   * minimal-line-art) is filled and checked by the style's own build.py through framemotion/spec.py,
   * then its template gets the spec, the kit's fonts and GSAP or three.js from this engines folder
   * (upstream's setup.sh fetched them from a CDN). The what-if-3d style copies a three.js film folder
   * (the bundled example, or a user's copy) and points its import map at this folder's three.js.
   * Every page gets window.seek(t) and window.FILM_INFO.
   */
  async reels(entry, enginesRoot) {
    const engine = sibling(enginesRoot, 'reels-engine');
    const style = entry.build.style;
    const fps = entry.fps ?? 30;
    const nm = path.join(enginesRoot, 'node_modules');
    const link = (from, to) => { fs.mkdirSync(path.dirname(to), {recursive: true}); fs.copyFileSync(from, to); };
    const three = (dir, files) => {
      link(path.join(nm, 'three/build/three.module.js'), path.join(dir, 'vendor/three/three.module.js'));
      link(path.join(nm, 'three/build/three.core.js'), path.join(dir, 'vendor/three/three.core.js'));
      for (const f of files) link(path.join(nm, 'three/examples/jsm', f), path.join(dir, 'vendor/three/addons', f));
    };
    // The kit's fonts are basic Latin subsets. Copy with letters beyond it (ą, ę, ł, ś, ż …) gets each
    // face's Latin Extended twin from this folder's @fontsource packages, with its unicode-range.
    const FAMILY = {'Inter': 'inter', 'Inter Tight': 'inter-tight', 'Poppins': 'poppins', 'JetBrains Mono': 'jetbrains-mono', 'Cap': 'montserrat'};
    const extended = (text) => /[\u0100-\u024f\u1e00-\u1eff]/.test(text);
    const twins = (dir, html) => {
      let css = '';
      for (const m of html.matchAll(/@font-face\s*\{[^}]*font-family:\s*'([^']+)'[^}]*?font-weight:\s*(\d+)[^}]*\}|@font-face\s*\{[^}]*?font-weight:\s*(\d+)[^}]*font-family:\s*'([^']+)'[^}]*\}/g)) {
        const family = m[1] ?? m[4], weight = m[2] ?? m[3], pkg = FAMILY[family];
        if (!pkg) continue;
        const file = `${pkg}-latin-ext-${weight}-normal.woff2`;
        const ranges = JSON.parse(fs.readFileSync(path.join(nm, '@fontsource', pkg, 'unicode.json'), 'utf8'))['latin-ext'];
        link(path.join(nm, '@fontsource', pkg, 'files', file), path.join(dir, 'fonts', file));
        link(path.join(nm, '@fontsource', pkg, 'LICENSE'), path.join(dir, 'fonts', `OFL-${pkg}-npm.txt`));
        css += `@font-face{font-family:'${family}';font-weight:${weight};src:url(fonts/${file}) format('woff2');unicode-range:${ranges}}\n`;
      }
      return css ? html.replace('</style>', `${css}</style>`) : html;
    };
    const finish = (dir, html, seek, W, H, frames, query) => {
      const tail = html.lastIndexOf('</body>');
      // A module script runs after the page's own modules, so the film's clock exists by then.
      html = html.slice(0, tail) + `<script type="module">
    window.FILM_INFO = {W: ${W}, H: ${H}, FPS: ${fps}, frames: ${frames}};
    window.seek = ${seek};
  </script>
` + html.slice(tail);
      fs.writeFileSync(path.join(dir, 'index.html'), html);
      return {dir, page: 'index.html', ...(query ? {query} : {})};
    };
    if (style === 'what-if-3d') {
      const film = path.resolve(enginesRoot, entry.build.film ?? '../reels-engine/styles/what-if-3d/engine');
      const dir = temp(entry.id);
      fs.cpSync(film, dir, {recursive: true, filter: (p) => !p.includes(`${path.sep}node_modules`)});
      let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
      html = html.replace('./node_modules/three/build/three.module.js', './vendor/three/three.module.js')
        .replace('./node_modules/three/examples/jsm/', './vendor/three/addons/')
        .replace('node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff2', 'fonts/montserrat-latin-700-normal.woff2');
      link(path.join(nm, '@fontsource/montserrat/files/montserrat-latin-700-normal.woff2'), path.join(dir, 'fonts/montserrat-latin-700-normal.woff2'));
      link(path.join(nm, '@fontsource/montserrat/LICENSE'), path.join(dir, 'fonts/OFL-montserrat.txt'));
      // Copy every three.js addon the film's modules reach, following the addons' own relative imports.
      const jsm = path.join(nm, 'three/examples/jsm');
      const used = new Set();
      const visit = (file) => {
        for (const m of fs.readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)) {
          const s = m[1];
          let rel = null;
          if (s.startsWith('three/addons/')) rel = s.slice('three/addons/'.length);
          else if (/^\.\.?\//.test(s) && file.startsWith(jsm + path.sep)) rel = path.relative(jsm, path.resolve(path.dirname(file), s));
          if (rel && !used.has(rel)) { used.add(rel); visit(path.join(jsm, rel)); }
        }
      };
      for (const f of fs.readdirSync(path.join(dir, 'src'))) if (f.endsWith('.js')) visit(path.join(dir, 'src', f));
      three(dir, [...used]);
      html = twins(dir, html);
      return finish(dir, html.replace('<div id="hud"></div>', '<div id="hud" hidden></div>'),
        '(t) => { window.renderAt(t); }', 720, 1280, 'Math.floor(window.DURATION * ' + fps + ')', {render: '1'});
    }
    if (!['graph', 'map-route', 'minimal-line-art'].includes(style)) throw new Error(`Unknown reels style "${style}"`);
    const specFile = path.resolve(enginesRoot, entry.build.spec);
    const run = spawnSync('python3', ['-I', '-B', path.join(engine, 'framemotion/spec.py'), style, specFile], {encoding: 'utf8'});
    if (run.status !== 0) throw new Error(`${entry.id}: spec check failed: ${run.stderr || run.stdout}`);
    const {spec, duration} = JSON.parse(run.stdout.trim().split('\n').pop());
    const dir = temp(entry.id);
    const template = spec.template ? path.resolve(path.dirname(specFile), spec.template) : path.join(engine, 'styles', style, 'template.html');
    const data = JSON.stringify(spec).replace(/<\//g, '<\\/');
    let html = fs.readFileSync(template, 'utf8').replaceAll('__SPEC__', () => data).replaceAll('__DURATION__', duration.toFixed(3));
    for (const f of fs.readdirSync(path.join(engine, 'kit/fonts'))) link(path.join(engine, 'kit/fonts', f), path.join(dir, 'fonts', f));
    if (extended(data)) html = twins(dir, html);
    const frames = Math.round(duration * fps);
    if (style === 'map-route') {
      three(dir, ['environments/RoomEnvironment.js']);
      return finish(dir, html, "(t) => { window.__hfThreeTime = t; window.dispatchEvent(new CustomEvent('hf-seek', {detail: {time: t}})); }", 1080, 1920, frames);
    }
    link(path.join(nm, 'gsap/dist/gsap.min.js'), path.join(dir, 'vendor/gsap.min.js'));
    // GSAP records a `to` tween's start values the first time it renders, and when tweens on one
    // property overlap (the hopping ball's squash and settle), the one that wins depends on the
    // direction of the jump. So play the timeline once through, in small steps, to record every start
    // as a straight playback would, then reach each frame forward from 0: a frame no longer depends on
    // the frames drawn before it.
    const seek = '(t) => { const tl = window.__timelines.main; if (!window.__fmWarm) { window.__fmWarm = true; ' +
      'for (let s = 0; s <= tl.duration() + 1e-9; s += 1 / 240) tl.seek(s, false); } tl.seek(0, true); tl.seek(t, false); }';
    return finish(dir, html, seek, 1080, 1920, frames);
  },
  /**
   * Art engine (bundled huashu-art-motion): an era film (the speedrun, FrameMotion's gallery of the bundled
   * styles, or a demo) on index.html, or a parameterized clip on clip.html from a spec JSON. The engine folder
   * is copied as is; the page gets FrameMotion's font stand-ins (the Chinese and Japanese faces are not
   * bundled: their families draw with Latin faces that carry Polish letters), the spec, and renderFrameAt(t),
   * which awaits the engine's own prepare(t) and draws renderFrame(t) once the engine reports ready.
   */
  async art(entry, enginesRoot) {
    const engine = path.join(sibling(enginesRoot, 'art-engine'), 'scripts/engine');
    const dir = temp(entry.id);
    fs.cpSync(engine, dir, {recursive: true});
    const fps = entry.fps ?? 30;
    const standIn = {
      'PuHui-Medium': ['Inter-var.woff', {weight: '500'}], 'PuHui-Bold': ['Inter-var.woff', {weight: '700'}],
      'PuHui-Heavy': ['Inter-var.woff', {weight: '800'}], 'PuHui-Black': ['Inter-var.woff', {weight: '900'}],
      'NotoSansSC': ['Inter-var.woff', {weight: '100 900'}], 'NotoSerifSC': ['EBGaramond-400.woff', {}],
      'NotoSerifJP-600': ['EBGaramond-600.woff', {}], 'LXGWWenKai-500': ['Kalam-700.woff', {}],
    };
    const fonts = `<script src="lib/fonts.js"></script>
<script>
// FrameMotion: faces that are not bundled draw with a bundled Latin face (see the Art engine README).
window.FONT_FACES = window.FONT_FACES.map((f) => { const s = ${JSON.stringify(standIn)}[f.family];
  return s ? {family: f.family, url: 'lib/fonts/' + s[0], desc: s[1]} : f; });
</script>`;
    const ready = `<script>
(() => { const wait = () => {
  if (window.__bootFailed) { console.error('Art engine: ' + window.__bootFailed); return; }
  if (!window.__ready) { setTimeout(wait, 20); return; }
  const [W, H] = window.__size;
  window.FILM_INFO = {W, H, FPS: ${fps}, frames: Math.round(window.__total * ${fps})};
  window.renderFrameAt = async (t) => { await window.prepare(t); window.renderFrame(t); };
}; wait(); })();
</script>`;
    const page = entry.build.clip ? 'clip.html' : 'index.html';
    let html = fs.readFileSync(path.join(dir, page), 'utf8').replace('<script src="lib/fonts.js"></script>', () => fonts);
    const query = {};
    if (entry.build.clip) {
      const specFile = path.resolve(enginesRoot, entry.build.clip);
      const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
      // Pictures a spec names are relative to the spec file, as in upstream's render.py.
      fs.cpSync(path.dirname(specFile), path.join(dir, '_spec'), {recursive: true});
      const media = (v) => typeof v === 'string' && /\.(png|jpe?g|webp|gif|svg|mp4|webm)$/i.test(v) && !/^[a-z]+:/i.test(v) && !path.isAbsolute(v);
      const walk = (v) => Array.isArray(v) ? v.map(walk) : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : media(v) ? `_spec/${v}` : v;
      html = html.replace('<script src="clip.js"></script>', () =>
        `<script>window.CLIP_SPEC = ${JSON.stringify(walk(spec)).replace(/</g, '\\u003c')};</script>\n<script src="clip.js"></script>`);
    } else {
      const film = entry.build.film ?? 'speedrun';
      // The 2026 scene signs its painting with window.SIGNATURE, and upstream's fallback is a model's name: sign
      // with the entry's signature, or leave the corner blank.
      html = html.replace('<script src="engine.js"></script>', () =>
        `<script>window.SIGNATURE = ${JSON.stringify(entry.build.signature || ' ')};</script>\n<script src="engine.js"></script>`);
      if (film === 'gallery' || film === 'style_studies') {
        // FrameMotion's gallery: upstream's style gallery without the styles that are not bundled, and the four
        // Chinese corner labels in English (the Chinese faces are not bundled).
        const galleryLabels = {'20_dunhuang': 'Dunhuang mural · Tang', '34_shadowpuppet': 'Shadow puppetry · Song',
          '17_ink': 'Ink wash · Bada Shanren', '18_klimt': 'Klimt · golden phase'};
        const bundled = new Set(fs.readdirSync(path.join(dir, 'scenes')).map((f) => f.replace(/\.js$/, '')));
        fs.writeFileSync(path.join(dir, `eras_fm_${film}.js`), `document.write('<script src="eras_${film}.js"><\\/script>');
document.write('<script>window.ERAS = window.ERAS.filter((e) => ${JSON.stringify([...bundled])}.includes(e.id));' +
  'const EN = ${JSON.stringify(galleryLabels)};' +
  'for (const e of window.ERAS) if (EN[e.id] && e.counter && e.counter.label) e.counter.label.text = EN[e.id];<\\/script>');\n`);
        query.film = `fm_${film}`;
      } else if (film !== 'speedrun') query.film = film;
    }
    query.w = String(entry.size.width); query.h = String(entry.size.height);
    const tail = html.lastIndexOf('</body>');
    html = html.slice(0, tail) + ready + '\n' + html.slice(tail);
    fs.writeFileSync(path.join(dir, page), html);
    return {dir, page, query};
  },
};

export async function buildEntry(entry, enginesRoot) {
  const builder = BUILDERS[entry.build?.tool];
  if (!builder) throw new Error(`Unknown builder "${entry.build?.tool}" for ${entry.id}`);
  return builder(entry, enginesRoot);
}
