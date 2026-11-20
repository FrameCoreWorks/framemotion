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

/**
 * FrameMotion's fixes to bundled mg-styles films, as [file, upstream text, fixed text], applied by the mgstyles
 * builder to the built copy. 10-synthwave: the car mask target is cleared without a render, so a multisampled
 * target keeps the last frame's mask, and the title flash never reaches exactly zero; together a frame depended
 * on the frames drawn before it (6 pixels, one level; found by the 2026-11-20 review). Rendering an empty scene
 * after the clear resolves the target; a flash under 0.001 is zero.
 */
const MG_FIXES = {
  '10-synthwave': [
    ['index.html', 'renderer.setRenderTarget(maskRT); renderer.setClearColor(0x000000, 1); renderer.clear();',
      'renderer.setRenderTarget(maskRT); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(new THREE.Scene(), ocam);'],
    ['index.html', '  V.uFlash.value = fr >= FS ? .34 * Math.exp(-uS * 20) : 0;\n',
      '  V.uFlash.value = fr >= FS ? .34 * Math.exp(-uS * 20) : 0;\n  if (V.uFlash.value < .001) V.uFlash.value = 0;\n'],
  ],
  // 12-aurora-glass: a card's 2D canvas kept drawing state (text alignment, letter spacing, line style) from
  // the last frame that drew it, so a card frame drawn after another one differed (2,016 pixels by up to 2
  // levels at frame 120 after 60; found by FrameMotion's order sweep, 2026-11-20). reset() before each card.
  '12-aurora-glass': [
    ['main.js', '    c.draw(c, t); upload(c.tex, c.cv, true);', '    c.g.reset(); c.draw(c, t); upload(c.tex, c.cv, true);'],
  ],
};

/**
 * FrameMotion's fixes to bundled anidoodle files, as {path under src/: [[upstream text, fixed text]]}, applied by
 * the anidoodle builder while bundling. scrapbookKit.ts staged(): going back to an earlier step cleared the cached
 * base and drew it again on the same canvas, whose drawing state (line dash, filter, shadow and the rest) was left
 * from later steps, so a frame drawn after a later one differed slightly (2026-11-20 review: frame 200 after 230).
 * A fresh canvas starts every rebuilt base from the default state.
 */
const AD_FIXES = {
  'canvas-core/scrapbookKit.ts': [[
    'if (c.k > k) { c.L.ctx.setTransform(1, 0, 0, 1, 0, 0); c.L.ctx.clearRect(0, 0, DW, DH); c.k = 0; }',
    'if (c.k > k) { c = { k: 0, L: env.canvas(DW, DH) }; env.cache.set(key, c); }',
  ]],
};

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
   * minimal-line-art, hairline-tree, voxel-build, ps1-low-poly) is filled and checked by the style's own build.py through framemotion/spec.py,
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
    if (!['graph', 'map-route', 'minimal-line-art', 'voxel-build', 'ps1-low-poly', 'hairline-tree'].includes(style)) throw new Error(`Unknown reels style "${style}"`);
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
    if (style === 'voxel-build' || style === 'ps1-low-poly') {
      // Plain three.js scenes (no addons); each draws one frame per hf-seek event.
      three(dir, []);
      return finish(dir, html, "(t) => { window.__hfThreeTime = t; window.dispatchEvent(new CustomEvent('hf-seek', {detail: {time: t}})); }", 1080, 1920, frames);
    }
    if (style === 'map-route') {
      three(dir, ['environments/RoomEnvironment.js']);
      return finish(dir, html, "(t) => { window.__hfThreeTime = t; window.dispatchEvent(new CustomEvent('hf-seek', {detail: {time: t}})); }", 1080, 1920, frames);
    }
    link(path.join(nm, 'gsap/dist/gsap.min.js'), path.join(dir, 'vendor/gsap.min.js'));
    // GSAP records a `to` tween's start values the first time it renders, and when tweens on one
    // property overlap (the hopping ball's squash and settle), the one that wins depends on the
    // direction of the jump. So play the timeline once through, in small steps, to record every start
    // as a straight playback would, then reach each frame forward from 0: a frame no longer depends on
    // the frames drawn before it. (Frame 0 goes through 1 ms first: a timeline already at 0 does not
    // fire onUpdate, so a style that draws in onUpdate, like hairline-tree, would keep its last picture.)
    const seek = '(t) => { const tl = window.__timelines.main; if (!window.__fmWarm) { window.__fmWarm = true; ' +
      'for (let s = 0; s <= tl.duration() + 1e-9; s += 1 / 240) tl.seek(s, false); } tl.seek(0, true); if (t === 0) tl.seek(1e-3, false); tl.seek(t, false); }';
    return finish(dir, html, seek, 1080, 1920, frames);
  },
  /**
   * Art engine (bundled huashu-art-motion): an era film (the speedrun, FrameMotion's gallery of the bundled
   * styles, or a demo) on index.html, or a parameterized clip on clip.html from a spec JSON. The engine folder
   * is copied as is; the page gets FrameMotion's font stand-ins (the Chinese and Japanese faces are not
   * bundled: their families draw with Latin faces that carry Polish letters), the spec, and renderFrameAt(t),
   * which awaits the engine's own prepare(t) and draws renderFrame(t) once the engine reports ready.
   */
  /**
   * Pixel engine (bundled pixelfx): one effect from src/fx, played by FrameMotion's player as a pure function of
   * time and scaled up with whole pixels. build: {fx: "fire/torch", options, seed, bg, actor, scale, seconds}.
   */
  async pixel(entry, enginesRoot) {
    const engine = sibling(enginesRoot, 'pixel-engine');
    const fx = entry.build.fx;
    if (typeof fx !== 'string' || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(fx) || !fs.existsSync(path.join(engine, 'src/fx', fx + '.js'))) {
      throw new Error(`${entry.id}: unknown pixelfx effect "${fx}" (see pixel-engine/docs/CATALOG.md)`);
    }
    // The effects draw words with upstream's two pixel fonts, which skip a letter they lack (ż became a space):
    // stop on such a letter instead, so a word is never drawn with a hole in it.
    const {FONTS} = await import(pathToFileURL(path.join(engine, 'src/core/font.js')).href);
    const has = (ch) => ch === ' ' || Object.values(FONTS).every((F) => F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()]);
    for (const [key, value] of Object.entries(entry.build.options ?? {})) {
      if (typeof value !== 'string' || /^#[0-9a-f]{3,8}$/i.test(value)) continue;
      const missing = [...new Set([...value].filter((ch) => !has(ch)))];
      if (missing.length) {
        throw new Error(`${entry.id}: the pixel fonts have no ${missing.map((c) => `"${c}"`).join(', ')} for options.${key} ` +
          `("${value}"); use capitals A-Z, digits and + - ! ? . , : / % * ' ( ) < > = #, or set the words in the film's own type`);
      }
    }
    const dir = temp(entry.id);
    for (const part of ['src', 'framemotion', 'package.json']) fs.cpSync(path.join(engine, part), path.join(dir, part), {recursive: true});
    const {tool, ...spec} = entry.build;
    const data = JSON.stringify({...spec, width: entry.size.width, height: entry.size.height, fps: entry.fps ?? 30}).replace(/</g, '\\u003c');
    const page = 'framemotion/player.html';
    const html = fs.readFileSync(path.join(dir, page), 'utf8')
      .replace('<script type="module"', () => `<script>window.PIXEL_SPEC = ${data};</script>\n<script type="module"`);
    fs.writeFileSync(path.join(dir, page), html);
    return {dir, page, query: {}};
  },
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
      // Only the files the spec names are copied, so a spec in a large workspace folder does not copy the folder.
      const media = (v) => typeof v === 'string' && /\.(png|jpe?g|webp|gif|svg|mp4|webm)$/i.test(v) && !/^[a-z]+:/i.test(v) && !path.isAbsolute(v);
      const named = (v) => Array.isArray(v) ? v.flatMap(named) : v && typeof v === 'object' ? Object.values(v).flatMap(named) : media(v) ? [v] : [];
      // Each one gets a numbered name in _spec/, so a path that leaves the spec folder (../) works too.
      const copied = new Map();
      fs.mkdirSync(path.join(dir, '_spec'));
      for (const rel of new Set(named(spec))) {
        const name = `${copied.size}${path.extname(rel).toLowerCase()}`, from = path.resolve(path.dirname(specFile), rel);
        if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dir, '_spec', name));
        copied.set(rel, name);
      }
      const walk = (v) => Array.isArray(v) ? v.map(walk) : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : media(v) ? `_spec/${copied.get(v)}` : v;
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
        // The style studies draw their painter's name in Chinese with the system font: draw it in English with
        // Inter (bundled as the NotoSansSC stand-in), so the label is the same on every machine.
        const studyNames = {'乔托': 'Giotto', '皮耶罗': 'Piero', '拉斐尔': 'Raphael', '米开朗基罗': 'Michelangelo',
          '瓜尔迪': 'Guardi', '洛伦采蒂': 'Lorenzetti', '科尔托纳': 'Cortona', '雷诺阿': 'Renoir', '毕沙罗': 'Pissarro',
          '西斯莱': 'Sisley', '高更': 'Gauguin', '马远': 'Ma Yuan', '波斯细密画': 'Persian miniature', '敦煌壁画': 'Dunhuang mural'};
        const bundled = new Set(fs.readdirSync(path.join(dir, 'scenes')).map((f) => f.replace(/\.js$/, '')));
        fs.writeFileSync(path.join(dir, `eras_fm_${film}.js`), `document.write('<script src="eras_${film}.js"><\\/script>');
document.write('<script>window.ERAS = window.ERAS.filter((e) => ${JSON.stringify([...bundled])}.includes(e.id));' +
  'const EN = ${JSON.stringify(galleryLabels)};' +
  'for (const e of window.ERAS) if (EN[e.id] && e.counter && e.counter.label) e.counter.label.text = EN[e.id];' +
  'const NAMES = ${JSON.stringify(studyNames)};' +
  'for (const e of window.ERAS) if (e.counter && typeof e.counter.draw === "function") { const draw = e.counter.draw; e.counter.draw = (c) => {' +
  ' const fill = c.fillText; c.fillText = (s, ...a) => { if (NAMES[s]) { c.font = c.font.replace("sans-serif", "NotoSansSC"); s = NAMES[s]; } return fill.call(c, s, ...a); };' +
  ' try { draw(c); } finally { delete c.fillText; } }; }<\\/script>');\n`);
        query.film = `fm_${film}`;
      } else if (film !== 'speedrun') query.film = film;
    }
    query.w = String(entry.size.width); query.h = String(entry.size.height);
    const tail = html.lastIndexOf('</body>');
    html = html.slice(0, tail) + ready + '\n' + html.slice(tail);
    fs.writeFileSync(path.join(dir, page), html);
    return {dir, page, query};
  },
  /**
   * Lemo engine (bundled Lemo-Opuscar styles): one style's demo page with the shared core, as upstream lays them out.
   * build: {style: "art-deco", film?: "path/to/film.js", scene?: "file.fn"}. The demo draws a frame with
   * window.render(t) once window.READY is set; FrameMotion's clock calls it for every frame.
   */
  async lemo(entry, enginesRoot) {
    const engine = sibling(enginesRoot, 'lemo-engine');
    const style = entry.build.style;
    if (typeof style !== 'string' || !/^[a-z0-9-]+$/.test(style) || !fs.existsSync(path.join(engine, 'styles', style, 'demo/index.html'))) {
      throw new Error(`${entry.id}: unknown Lemo style "${style}" (see lemo-engine/README.md)`);
    }
    const dir = temp(entry.id);
    fs.cpSync(path.join(engine, 'core'), path.join(dir, 'core'), {recursive: true});
    fs.cpSync(path.join(engine, 'styles', style), path.join(dir, 'styles', style), {recursive: true});
    const demo = path.join(dir, 'styles', style, 'demo');
    if (entry.build.film) {
      // A film written for this style replaces the demo's own film.js; it imports the style's modules as the demo does.
      const film = path.resolve(enginesRoot, entry.build.film);
      if (!fs.existsSync(film)) throw new Error(`${entry.id}: film "${entry.build.film}" not found`);
      // None of these styles' faces has the Polish letters (checked 2026-11-16 with fontTools); the browser would fill
      // them from another font, or Whiteboard's stroke font would write "?". Stop rather than render that.
      const noPolish = ['backrooms', 'glass-product', 'impasto', 'lowpoly-island', 'ukiyoe', 'whiteboard'];
      const letters = fs.readFileSync(film, 'utf8').match(/[ąćęłńśźżĄĆĘŁŃŚŹŻ]/gu);
      if (letters && noPolish.includes(style)) {
        throw new Error(`${entry.id}: the film has ${[...new Set(letters)].join('')}, which no face of the ${style} style draws; ` +
          'choose a style whose faces have Polish letters (lemo-engine/README.md) or write the words without them');
      }
      fs.copyFileSync(film, path.join(demo, 'film.js'));
    }
    // Upstream serves the library from its own root, so pages ask for /core/...; here the build folder is /_build/.
    const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    for (const file of walk(dir).filter((f) => /\.(m?js|html|css)$/.test(f))) {
      const text = fs.readFileSync(file, 'utf8');
      // The demos sign their end cards with the authors' and a model's name; a client film carries neither,
      // so the build copy drops that credit line (with the separator before it). Upstream files stay unchanged.
      const moved = text.replace(/(["'`(])\/core\//g, '$1/_build/core/')
        .replace(/(\s*(?:·|\\u00b7|&nbsp;·&nbsp;|-)\s*)?LemoLab\s+(?:×|\\u00d7)\s+Claude Opus 5\.5/g, '');
      if (moved !== text) fs.writeFileSync(file, moved);
    }
    const fps = entry.fps ?? 30;
    // A fixed-size body, so a page that layers a three.js canvas and an overlay canvas can be captured as one element.
    const ready = `<style>html, body { width: 1920px; height: 1080px; position: relative; }</style>
<script>
(() => { const wait = () => {
  if (window.READY !== true || typeof window.render !== 'function') { setTimeout(wait, 20); return; }
  window.FILM_INFO = {W: 1920, H: 1080, FPS: ${fps}, frames: Math.round((window.DUR || 1) * ${fps})};
  // A style whose first draw of some words or ink differs from every repeat (One-line: its end card and ink halo)
  // sets build.warm: the first call draws the film once a second, so a frame is the same however the render starts.
  // build.warm: true steps one second; a number sets the step in seconds (a slow 3D style warms at a few times).
  let warm = ${entry.build.warm ? 'false' : 'true'};
  const step = ${typeof entry.build.warm === 'number' && entry.build.warm > 0 ? entry.build.warm : 1};
  window.renderFrameAt = async (t) => {
    if (!warm) { warm = true; for (let s = 0; s <= (window.DUR || 1); s += step) await window.render(s); }
    await window.render(t);
  };
}; wait(); })();
</script>`;
    const page = `styles/${style}/demo/index.html`;
    let html = fs.readFileSync(path.join(dir, page), 'utf8');
    // Math.random at load (three.js GTAO's noise texture in Tilt-Shift) differed on every page load, so a frame
    // depended on which load drew it: here it is a fixed-seed generator, the same on every load.
    const seeded = `<script>(() => { let a = 0x9e3779b9; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();</script>`;
    {
      const head = html.search(/<head[^>]*>/);
      const at = head < 0 ? 0 : head + html.slice(head).indexOf('>') + 1;
      html = html.slice(0, at) + seeded + html.slice(at);
    }
    if (entry.kind === 'three') {
      // three.js computes a geometry's bounds on its first draw and culls by them after, so instances and dynamic
      // geometry that move later (Tilt-Shift's traffic, trails and lights) vanished or not depending on the first
      // frame drawn. Never cull: every frame shows what its own time places in it. Runs before the page's modules.
      const noCull = `<script type="module">import * as THREE from 'three';
Object.defineProperty(THREE.Object3D.prototype, 'frustumCulled', {get: () => false, set() {}, configurable: true});</script>`;
      const body = html.search(/<body[^>]*>/);
      if (body < 0) throw new Error(`${entry.id}: the style page has no <body>`);
      const at = body + html.slice(body).indexOf('>') + 1;
      html = html.slice(0, at) + noCull + html.slice(at);
    }
    const tail = html.lastIndexOf('</body>');
    html = tail < 0 ? html + ready : html.slice(0, tail) + ready + '\n' + html.slice(tail);
    fs.writeFileSync(path.join(dir, page), html);
    const query = entry.build.scene ? {scene: String(entry.build.scene)} : {};
    return {dir, page, query};
  },
  /**
   * Line-art engine (bundled JDhruv14/line-art-animation): an example (or the user's own folder with an
   * index.html and its TypeScript entry) bundled by esbuild into one page. The upstream loop already has a
   * ?debug mode that steps the scene in exact 1/60 s steps; renderFrame(t) steps forward to t, and to go
   * back it rebuilds the scene from zero. Math.random is a seeded generator while the scene runs, reset at each
   * rebuild, so the villagers, birds and ripples come out the same in any frame order. Each frame is the SVG
   * drawn as one image into a canvas (#fm-canvas), which the renderer captures. Every rebuild leaves the old
   * scene's listeners and its 14 s hint timer behind; they draw nothing.
   */
  async lineart(entry, enginesRoot) {
    const engine = sibling(enginesRoot, 'line-art-engine');
    const source = entry.build.example ? path.join(engine, 'examples', entry.build.example) : path.resolve(enginesRoot, entry.build.folder ?? '');
    const htmlFile = path.join(source, 'index.html');
    if (!fs.existsSync(htmlFile)) throw new Error(`${entry.id}: no index.html in ${source}`);
    let html = fs.readFileSync(htmlFile, 'utf8');
    const tag = html.match(/<script type="module" src="\.\/([\w.-]+\.ts)"><\/script>/);
    if (!tag) throw new Error(`${entry.id}: index.html needs <script type="module" src="./entry.ts">`);
    const mount = entry.build.mount ?? '#stage';
    if (!html.includes(`id="${mount.slice(1)}"`)) throw new Error(`${entry.id}: no ${mount} element in index.html`);
    const fps = entry.fps;
    if (60 % fps) throw new Error(`${entry.id}: the line-art loop steps 1/60 s, so fps must divide 60 (got ${fps})`);
    const {build} = await import(pathToFileURL(path.join(enginesRoot, 'node_modules/esbuild/lib/main.js')).href);
    const out = await build({entryPoints: [path.join(source, tag[1])], bundle: true, write: false, format: 'iife', target: 'es2020', logLevel: 'silent'});
    const code = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
    const seed = entry.build.seed ?? 11;
    if (!Number.isInteger(seed) || seed < 1 || seed > 2147483646) throw new Error(`${entry.id}: build.seed must be a whole number from 1 to 2147483646`);
    const fit = entry.build.fit === 'meet' ? 'xMidYMid meet' : 'xMidYMid slice';
    const page = `<style>
  /* FrameMotion capture: the card fills the frame, without the page around it */
  html, body { overflow: hidden !important; }
  body { display: block !important; }
  .card { width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important; border-radius: 0 !important; box-shadow: none !important; }
  .hud, #hint { display: none !important; }
</style>
<script>
(function () {
  // the scene's own random stream, in use only while the scene runs: any other script on the page
  // that calls Math.random between frames must not move it
  let s = 1;
  const seeded = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const native = Math.random;
  function scene() {
${code}
  }
  const stage = document.querySelector(${JSON.stringify(mount)});
  let steps = -1;
  function boot() {
    s = ${seed};
    for (let i = 0; i < 8; i++) seeded();   // a small seed's first numbers sit near zero
    stage.replaceChildren();
    scene();
    stage.querySelector('svg')?.setAttribute('preserveAspectRatio', ${JSON.stringify(fit)});
    steps = 0;
  }
  // The frame is the scene's SVG drawn as one image into a canvas. A screenshot of the live page
  // depended on which parts the browser repainted before (the ink filter over the canal water moved
  // up to a few thousand pixels by a few levels); one whole-image draw repeats byte for byte.
  const canvas = document.createElement('canvas');
  canvas.id = 'fm-canvas';
  canvas.width = innerWidth; canvas.height = innerHeight;
  canvas.style.cssText = 'position:fixed;inset:0;z-index:10';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  // the page's rules for elements inside the SVG (".pp" paper fills), rewritten to start at the svg
  const rules = [];
  for (const sheet of document.styleSheets) for (const r of sheet.cssRules) {
    if (!r.selectorText) continue;
    const parts = r.selectorText.split(',').map((p) => p.trim()).map((p) => p.slice(p.indexOf('svg'))).filter((p) => p.startsWith('svg') && p !== 'svg');
    if (parts.length) rules.push(parts.join(',') + '{' + r.style.cssText + '}');
  }
  async function paint() {
    const svg = stage.querySelector('svg');
    const copy = svg.cloneNode(true);
    copy.setAttribute('width', canvas.width); copy.setAttribute('height', canvas.height);
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = rules.join(' ');
    copy.insertBefore(style, copy.firstChild);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], {type: 'image/svg+xml'}));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } finally { URL.revokeObjectURL(url); }
  }
  window.renderFrame = (t) => {
    const want = Math.round(t * 60);
    Math.random = seeded;
    try {
      if (steps < 0 || want < steps) boot();
      if (want > steps) { window.__step((want - steps) / 60); steps = want; }
    } finally { Math.random = native; }
    return paint();
  };
})();
</script>`;
    html = html.replace(tag[0], () => page);
    const dir = temp(entry.id);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    const query = {debug: '', capture: '', ...Object.fromEntries(Object.entries(entry.build.query ?? {}).map(([k, v]) => [k, String(v)]))};
    return {dir, page: 'index.html', query};
  },
  /**
   * MG styles engine (bundled Vincentwei1021/mg-styles-15): one of its style films, a page that draws any
   * moment with window.renderAt(t) (the same contract as ours). The film's folder is copied into the layout
   * its absolute paths expect (/demos/<film>/, /assets/...), and those paths are rewritten to the build folder;
   * /node_modules/ stays on the engines folder (three.js, simplex-noise, opentype.js, d3, topojson-client, pinned there). The fonts
   * the upstream repository leaves out come from the engine's fonts/ folder (OFL files; brand faces that are
   * not open get an open stand-in, listed in STAND_IN), and the grain plate is FrameMotion's own. A bridge sets
   * renderFrame = renderAt once the page reports __ready.
   */
  async mgstyles(entry, enginesRoot, params = {}) {
    const engine = sibling(enginesRoot, 'mg-styles-engine');
    // build.folder: the user's own copy of a film (a film folder with its index.html, rewritten for their
    // copy and colours), relative to the engines folder; otherwise build.film names a bundled film.
    const from = entry.build.folder ? path.resolve(enginesRoot, entry.build.folder) : path.join(engine, 'upstream', 'demos', entry.build.film ?? '');
    const film = entry.build.film ?? (entry.build.folder ? path.basename(from) : undefined);
    if (!film || !fs.existsSync(path.join(from, 'index.html'))) throw new Error(`${entry.id}: no mg-styles film "${film}"`);
    const dir = temp(entry.id);
    fs.cpSync(from, path.join(dir, 'demos', film), {recursive: true});
    fs.cpSync(path.join(engine, 'upstream', 'assets'), path.join(dir, 'assets'), {recursive: true});
    fs.mkdirSync(path.join(dir, 'assets', 'textures', 'grain'), {recursive: true});
    fs.copyFileSync(path.join(engine, 'textures', 'grain_fine_2048.png'), path.join(dir, 'assets', 'textures', 'grain', 'grain_fine_2048.png'));
    fs.cpSync(path.join(engine, 'fonts'), path.join(dir, 'assets', 'fonts', 'files'), {recursive: true});
    // Files the films load by their upstream font path, served from the engine's fonts/ folder.
    const byPath = {
      'cjk/lxgwmarkergothic/LXGWMarkerGothic-Regular.ttf': 'LXGWMarkerGothic-Regular.subset.ttf',
      [`../../demos/07-liquid/assets/Fraunces-Liquid-72-900-Soft.ttf`]: 'Fraunces-Liquid-72-900-Soft.ttf',
      [`../../demos/08-morph/assets/fonts/Outfit-SemiBold.ttf`]: 'Outfit-SemiBold.ttf',
      [`../../demos/10-synthwave/assets/fonts/MrDafoe-Regular.ttf`]: 'MrDafoe-Regular.ttf',
      [`../../demos/03-isometric/assets/fonts/Unbounded-800-static.ttf`]: 'Unbounded-800-static.ttf',
      'cjk/alimamashuheiti/AlimamaShuHeiTi-Bold.ttf': 'NotoSansSC-Black.subset.ttf',   // read by opentype.js: a static black cut
    };
    for (const [rel, file] of Object.entries(byPath)) {
      if (rel.startsWith('../../demos/') && !rel.startsWith(`../../demos/${film}/`)) continue;
      const to = path.resolve(dir, 'assets', 'fonts', rel);
      fs.mkdirSync(path.dirname(to), {recursive: true});
      fs.copyFileSync(path.join(engine, 'fonts', file), to);
    }
    const face = (family, file, extra = 'font-weight: 1 1000; font-style: normal;') =>
      `@font-face { font-family: '${family}'; src: url('/_build/assets/fonts/files/${file}') format('truetype'); ${extra} font-display: block; }`;
    const STAND_IN = {   // brand faces that are not open fonts: an OFL face of the same kind takes their place
      'HarmonyOS Sans SC': 'NotoSansSC-VF.subset.ttf', 'Alimama ShuHeiTi': 'NotoSansSC-VF.subset.ttf',
      'Douyin Sans': 'NotoSansSC-VF.subset.ttf', 'Alibaba PuHuiTi': 'NotoSansSC-VF.subset.ttf',
      'Resource Han Rounded': 'NotoSansSC-VF.subset.ttf',
    };
    const css = [
      face('Caveat', 'Caveat-VF.ttf', 'font-weight: 400 700; font-style: normal;'),
      face('Long Cang', 'LongCang-Regular.subset.ttf'),
      face('LXGW Marker Gothic', 'LXGWMarkerGothic-Regular.subset.ttf'),
      face('Inter', 'Inter-VF.ttf', 'font-weight: 100 900; font-style: normal;'),
      face('Noto Serif SC', 'NotoSerifSC-VF.subset.ttf', 'font-weight: 200 900; font-style: normal;'),
      face('Noto Sans SC', 'NotoSansSC-VF.subset.ttf', 'font-weight: 100 900; font-style: normal;'),
      face('Instrument Serif', 'InstrumentSerif-Regular.ttf'),
      face('Instrument Serif', 'InstrumentSerif-Italic.ttf', 'font-weight: 1 1000; font-style: italic;'),
      face('IBM Plex Mono', 'IBMPlexMono-Medium.ttf', 'font-weight: 400 700; font-style: normal;'),
      face('Michroma', 'Michroma-Regular.ttf'),
      face('Archivo', 'Archivo-Italic-VF.ttf', 'font-weight: 100 900; font-style: italic; font-stretch: 62% 125%;'),
      face('VT323', 'VT323-Regular.ttf'),
      face('Fredoka', 'Fredoka-VF.ttf', 'font-weight: 300 700; font-style: normal; font-stretch: 75% 125%;'),
      face('Cormorant Garamond', 'CormorantGaramond-VF.ttf', 'font-weight: 300 700; font-style: normal;'),
      face('Unbounded', 'Unbounded-VF.ttf', 'font-weight: 200 900; font-style: normal;'),
      face('Poppins', 'Poppins-Black.ttf', 'font-weight: 900; font-style: normal;'),
      face('Poppins', 'Poppins-SemiBold.ttf', 'font-weight: 600; font-style: normal;'),
      face('Press Start 2P', 'PressStart2P-Regular.ttf'),
      face('Fusion Pixel 12', 'FusionPixel12-zh_hans.subset.ttf'),
      face('Chakra Petch', 'ChakraPetch-SemiBold.ttf', 'font-weight: 600; font-style: normal;'),
      face('JetBrains Mono', 'JetBrainsMono-VF.ttf', 'font-weight: 100 800; font-style: normal;'),
      face('Rajdhani', 'Rajdhani-Bold.ttf', 'font-weight: 700; font-style: normal;'),
      face('Rajdhani', 'Rajdhani-SemiBold.ttf', 'font-weight: 600; font-style: normal;'),
      ...Object.entries(STAND_IN).map(([family, file]) => face(family, file, 'font-weight: 100 900; font-style: normal;')),
    ].join('\n');
    fs.writeFileSync(path.join(dir, 'assets', 'fonts', 'fonts.css'), `/* FrameMotion mg-styles fonts (generated by the builder) */\n${css}\n`);
    // Absolute upstream paths point into the build folder; /node_modules/ stays on the engines folder.
    const rewrite = (file) => {
      const text = fs.readFileSync(file, 'utf8');
      const next = text.replace(/(['"`(])\/(demos|assets)\//g, '$1/_build/$2/');
      if (next !== text) fs.writeFileSync(file, next);
    };
    const walk = (d) => { for (const e of fs.readdirSync(d, {withFileTypes: true})) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (/\.(html|m?js|css)$/.test(e.name)) rewrite(p);
    } };
    walk(path.join(dir, 'demos', film));
    // FrameMotion fixes, applied to the built copy (the bundled files stay byte-identical to upstream).
    for (const [file, from, to] of MG_FIXES[film] ?? []) {
      const f = path.join(dir, 'demos', film, file), text = fs.readFileSync(f, 'utf8');
      if (!text.includes(from)) throw new Error(`${entry.id}: FrameMotion fix no longer matches ${film}/${file}`);
      fs.writeFileSync(f, text.replace(from, to));
    }
    // Your own words: params.replace maps a sample text of the film (exactly as written in its code, see the
    // engine README) to yours. Every sample text named must be found, or the build stops.
    const swaps = Object.entries({...(entry.build.replace ?? {}), ...(params.replace ?? {})});
    if (swaps.length) {
      const found = new Set();
      const swapIn = (d) => { for (const e of fs.readdirSync(d, {withFileTypes: true})) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { swapIn(p); continue; }
        if (!/\.(html|m?js|json)$/.test(e.name)) continue;
        let text = fs.readFileSync(p, 'utf8'), changed = false;
        for (const [from, to] of swaps) {
          for (const q of ["'", '"', '`']) {
            if (text.includes(q + from + q)) { text = text.split(q + from + q).join(q + String(to).split(q).join('\\' + q) + q); changed = true; found.add(from); }
          }
        }
        if (changed) fs.writeFileSync(p, text);
      } };
      swapIn(path.join(dir, 'demos', film));
      const missing = swaps.map(([from]) => from).filter((from) => !found.has(from));
      if (missing.length) throw new Error(`${entry.id}: no sample text ${missing.map((m) => JSON.stringify(m)).join(', ')} in ${film} (the engine README lists them)`);
    }
    const page = path.join('demos', film, 'index.html');
    let html = fs.readFileSync(path.join(dir, page), 'utf8');
    const bridge = `<script>(function wait() {
  if (window.__ready === true && typeof window.renderAt === 'function') { window.renderFrame = (t) => window.renderAt(t); return; }
  setTimeout(wait, 20);
})();</script>`;
    const tail = html.lastIndexOf('</body>');
    html = tail < 0 ? html + bridge : html.slice(0, tail) + bridge + '\n' + html.slice(tail);
    fs.writeFileSync(path.join(dir, page), html);
    return {dir, page, query: {}};
  },
  /**
   * Anidoodle engine (bundled alexgreensh/anidoodle, the 2-D style films): FrameMotion's own esbuild bundles
   * one film with the upstream page host (src/hosts/page.ts) into a single page; none of anidoodle's Node
   * tools run. build.film names an exported film of upstream/engine/src/canvas-core; build.folder (optional)
   * is the user's own folder laid out like src/ (canvas-core/<film>.ts), looked up first, so a new film can
   * import the bundled kits as "./core" or "./woodcutKit". The page's FILM.seek(frame) draws one frame
   * synchronously; renderFrame(t) waits for FILM.ready (assets decoded), then seeks round(t * fps).
   * Three.js films are not bundled: a film that imports "three" fails the build with a clear error.
   */
  async anidoodle(entry, enginesRoot) {
    const engineSrc = path.join(sibling(enginesRoot, 'anidoodle-engine'), 'upstream/engine/src');
    const film = String(entry.build.film ?? '');
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(film)) throw new Error(`${entry.id}: build.film must be a film's export name`);
    const roots = [...(entry.build.folder ? [path.resolve(enginesRoot, entry.build.folder)] : []), engineSrc];
    const EXT = ['', '.ts', '.js', '/index.ts'];
    const find = (p) => EXT.map((e) => p + e).find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) ?? null;
    if (!roots.some((r) => find(path.join(r, 'canvas-core', film)))) throw new Error(`${entry.id}: no film "${film}" in canvas-core`);
    const overlay = {
      name: 'framemotion-anidoodle',
      setup(b) {
        b.onResolve({filter: /^three$/}, () => ({errors: [{text: 'this film draws with three.js, which the FrameMotion anidoodle bundle leaves out: use a 2-D film'}]}));
        b.onResolve({filter: /\.(ttf|otf|woff2)$/i}, (a) => ({errors: [{text: `font file ${a.path}: the FrameMotion anidoodle bundle carries no font files`}]}));
        // FrameMotion fixes (AD_FIXES), applied while bundling: the bundled files stay byte-identical.
        b.onLoad({filter: /canvas-core[\\/]\w+\.ts$/}, (a) => {
          const fixes = a.path.startsWith(engineSrc + path.sep) ? AD_FIXES[path.relative(engineSrc, a.path).split(path.sep).join('/')] : null;
          if (!fixes) return undefined;
          let text = fs.readFileSync(a.path, 'utf8');
          for (const [from, to] of fixes) {
            if (!text.includes(from)) throw new Error(`FrameMotion fix no longer matches ${a.path}`);
            text = text.replace(from, to);
          }
          return {contents: text, loader: 'ts'};
        });
        b.onResolve({filter: /^\.\.?\//}, (a) => {
          const want = path.resolve(a.resolveDir, a.path);
          const root = roots.find((r) => want === r || want.startsWith(r + path.sep));
          if (!root) return undefined;
          const rel = path.relative(root, want);
          for (const r of roots) { const f = find(path.join(r, rel)); if (f) return {path: f}; }
          return undefined;
        });
      },
    };
    const {build} = await import(pathToFileURL(path.join(enginesRoot, 'node_modules/esbuild/lib/main.js')).href);
    const out = await build({
      stdin: {contents: `import { ${film} } from "../canvas-core/${film}"; import { mountFilm } from "./page"; mountFilm(${film});`,
        resolveDir: path.join(engineSrc, 'hosts'), loader: 'ts'},
      bundle: true, write: false, format: 'iife', target: 'es2020', logLevel: 'silent', plugins: [overlay],
    });
    const code = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
    const dir = temp(entry.id);
    // The film draws on its own canvas (#film, its native size); #frame is what the renderer captures, at the
    // size asked for. A film whose shape differs from the frame (a square film in a 9:16 reel) is fitted whole
    // and centred, over a soft, darkened, blurred copy of itself that fills the frame.
    fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}#film{display:none}#frame{display:block;width:100vw;height:100vh}</style></head>
<body><canvas id="film"></canvas><canvas id="frame"></canvas><script>window.__ASSETS__={};window.__BAKE_SRC__={};</script>
<script>${code}</script>
<script>(() => {
  const q = JSON.parse(new URLSearchParams(location.search).get('params') || '{}');
  const film = document.getElementById('film'), frame = document.getElementById('frame'), g = frame.getContext('2d');
  window.renderFrame = async (t) => {
    const F = window.FILM; await F.ready;
    F.seek(Math.max(0, Math.min(F.meta.durationFrames - 1, Math.round(t * F.meta.fps))));
    const W = q.width ?? F.meta.W, H = q.height ?? F.meta.H, fw = film.width, fh = film.height;
    if (frame.width !== W || frame.height !== H) { frame.width = W; frame.height = H; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
    const fit = Math.min(W / fw, H / fh), dw = Math.round(fw * fit), dh = Math.round(fh * fit);
    if (dw !== W || dh !== H) {
      const cover = Math.max(W / fw, H / fh), cw = fw * cover, ch = fh * cover;
      g.filter = 'blur(' + Math.round(Math.min(W, H) / 24) + 'px) brightness(0.7)';
      g.drawImage(film, (W - cw) / 2, (H - ch) / 2, cw, ch);
      g.filter = 'none';
    }
    g.imageSmoothingQuality = 'high';
    g.drawImage(film, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
  };
})();</script></body></html>`);
    return {dir, page: 'index.html', query: {adapter: 'framemotion'}};
  },
};

export async function buildEntry(entry, enginesRoot, params = {}) {
  const builder = BUILDERS[entry.build?.tool];
  if (!builder) throw new Error(`Unknown builder "${entry.build?.tool}" for ${entry.id}`);
  return builder(entry, enginesRoot, params);
}
