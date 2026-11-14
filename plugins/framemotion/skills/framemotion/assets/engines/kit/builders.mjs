// Builders that turn a bundled engine's project into one page the renderer can open.
// Each writes into a fresh temporary folder outside the plugin, never into the package.
// Original FrameCore Works code (Apache-2.0). Node only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const temp = (id) => fs.mkdtempSync(path.join(os.tmpdir(), `framemotion-${id}-`));

export const BUILDERS = {
  /** Animate engine: copy a piece and assemble its single index.html with the engine's own build tool. */
  async animate(entry, enginesRoot) {
    const tool = path.resolve(enginesRoot, '../animate-engine/tools/build.mjs');
    const piece = path.resolve(enginesRoot, entry.build.piece);
    const dir = temp(entry.id);
    fs.cpSync(piece, dir, {recursive: true});
    const run = spawnSync(process.execPath, [tool, dir], {encoding: 'utf8'});
    if (run.status !== 0) throw new Error(`Animate build failed: ${run.stderr || run.stdout}`);
    return {dir, page: 'index.html'};
  },
  /** Anatomy engine: its own page builder (studio.mjs buildPage) in svg, webgl or 3d mode. */
  async anatomy(entry, enginesRoot) {
    const studio = await import(pathToFileURL(path.resolve(enginesRoot, '../anatomy-engine/studio.mjs')).href);
    const dir = temp(entry.id);
    fs.writeFileSync(path.join(dir, 'index.html'), studio.buildPage(entry.build.options));
    return {dir, page: 'index.html'};
  },
  /** A finished composition folder of the package (an example with its own copy of a kit), copied as is. */
  async folder(entry, enginesRoot) {
    const source = path.resolve(enginesRoot, entry.build.path);
    const assets = path.resolve(enginesRoot, '..');
    if (!source.startsWith(assets + path.sep)) throw new Error(`${entry.id}: build.path must stay inside the skill's assets`);
    const dir = temp(entry.id);
    fs.cpSync(source, dir, {recursive: true});
    return {dir, page: entry.build.page ?? 'index.html'};
  },
  /**
   * kaventro/motion-designer film templates: shared/ plus one kind (blank, overlay, mobile, desktop,
   * story), assembled the way its new_film.sh does. The page draws on window.seek(t) with ?render.
   */
  async kaventro(entry, enginesRoot) {
    const templates = path.resolve(enginesRoot, '../kaventro-engine/templates');
    const kind = entry.build.kind;
    if (!['blank', 'overlay', 'mobile', 'desktop', 'story'].includes(kind)) throw new Error(`Unknown kaventro kind "${kind}"`);
    const dir = temp(entry.id);
    fs.cpSync(path.join(templates, 'shared'), path.join(dir, 'src'), {recursive: true});
    fs.cpSync(path.join(templates, kind), path.join(dir, 'src'), {recursive: true});
    fs.mkdirSync(path.join(dir, 'audio'));   // the film's music goes here; a silent render needs none
    return {dir, page: 'src/index.html', query: {render: '1'}};
  },
};

export async function buildEntry(entry, enginesRoot) {
  const builder = BUILDERS[entry.build?.tool];
  if (!builder) throw new Error(`Unknown builder "${entry.build?.tool}" for ${entry.id}`);
  return builder(entry, enginesRoot);
}
