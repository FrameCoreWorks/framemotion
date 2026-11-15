# Engines

One folder for every engine FrameMotion renders frame by frame: our own engines and, as they are wired in, adapters for the bundled ones. Each follows [the engine contract](../../references/engine-contract.md), is listed in [`engines.json`](engines.json) and is rendered by the same tool, so engines share one clock, one dependency set and one test path.

| Path | What it is |
| --- | --- |
| `kit/` | [Engine kit](kit/README.md): time, seeded randomness, sub-frames, the GSAP/HyperFrames bridge and the renderer `render-engine.mjs` |
| `engines.json` | The registry: id, page, size, sources, reusable blocks |
| `package.json`, `package-lock.json` | The one dependency set of all engines, pinned exactly (three.js 0.187.0) |
| `photoreal/` | [Photoreal three.js blocks](photoreal/README.md): accumulation camera and film grade, with a demo scene |
| `gl-transitions/` | [gl-transitions engine](gl-transitions/README.md): 236 transitions between two pictures (unchanged shaders, our wrapper) |
| `libraries/` | [Library engines](libraries/README.md): Paper Shaders, PixiJS filters, css-doodle, torph, tsParticles and p5.brush on our clock (npm packages, not copied) |

Registered engines:

| Id | Engine | How it is wired |
| --- | --- | --- |
| `photoreal-demo` | Our [photoreal blocks](photoreal/README.md) on a demo scene | own page |
| `gl-transition` | [gl-transitions](gl-transitions/README.md), any of 236 shaders | own page, unchanged shaders |
| `animate-starter` | The bundled [Animate engine](../animate-engine/ENGINE.md), its starter piece | builder `animate`, adapter `renderFrame` |
| `anatomy-svg` | The bundled [Anatomy engine](../anatomy-engine/README.md), its SVG fixture | builder `anatomy`, adapter `renderFrame` |
| `kaventro-blank`, `-overlay`, `-mobile`, `-desktop`, `-story` | The bundled [kaventro film templates](../kaventro-engine/README.md) | builder `kaventro`, adapter `seek` |
| `hairline-spice-rack` | The [Hairline](../hairline/README.md) example | builder `folder`, adapter `renderFrame` |
| `paper-shader`, `pixi-filter`, `css-doodle`, `torph-text`, `tsparticles`, `p5-brush` | [Library engines](libraries/README.md) | own page, library from `node_modules` |
| `stickman-hello`, `stickman-vertical`, `stickman-reel` | The bundled [Stickman engine](../stickman-engine/README.md): two of its sample films and FrameMotion's vertical cartoon reel | builder `stickman` (the engine's own `compose`), adapter `seek`; `"duration": "page"` takes the film's length from its voice lines |
| `launch-type`, `-shapes`, `-cartoon`, `-3d`, `-charts`, `-pixel`, `-particles`, `-ui`, `-ui-vertical`, `-photo`, `-overlays`, `-globe`, `-story` | The bundled [Launch engine](../launch-engine/README.md): twelve launch-film styles on one core, any format from one film (its chooser also covers the kaventro templates) | builder `launch` (fonts from `@fontsource`, the engine's own `build.mjs`), adapter `renderFrameAt`, `"duration": "page"`, its own check `"critique"` |
| `reels-graph`, `-graph-pl`, `-map-route`, `-minimal-line-art`, `-what-if-3d` | The bundled [Reels engine](../reels-engine/README.md): three 9:16 reel beats from a small spec and a 3D cartoon explainer from a film folder | builder `reels` (the style's own `build.py` checks the spec; GSAP, three.js and fonts from this folder), adapter `seek`, `"duration": "page"` |
| `teardown-phone`, `teardown-watch`, `cutaway-piranha` | The [Cutaway engine](../cutaway-engine/README.md): FrameMotion's labelled exploded views from a spec (fast, software is fine) and the bundled piranha film (60 fps, a GPU) | builder `cutaway` (the engine's own `sims/build.mjs`), adapter `renderFrame` |

Launch film or kaventro? A designed short loop with motion blur and several formats from one film is a `launch-*` style; the user's own screenshots or screen recording in a device, or a film edited as HTML and CSS, is a `kaventro-*` template ([chooser](../launch-engine/README.md#pick-a-launch-film)).

Bundled engines stay byte-identical in their own folders (a test checks their hashes); a builder in `kit/builders.mjs` makes their page in a temporary folder and an adapter wraps the page's own clock (`window.renderFrame(seconds)` or `window.seek(t)`). Any Animate piece, Anatomy page, kaventro film, Stickman film folder, cutaway sim folder, launch film folder or reel spec renders the same way: add an entry with its piece folder, page options or template kind. A page may list files that are allowed to be missing in `optional` (a film's music in a silent render); any other missing file fails the render, and outside requests are blocked and listed in the report.

## Run

Copy this folder to the workspace as `engines` (see [first setup](../../references/first-setup.md#runtimes)), then:

```bash
npm ci --ignore-scripts   # .npmrc keeps unused peer packages (p5.js) out
node kit/render-engine.mjs --engine photoreal-demo --frames 0,30,59 --out frames
```

Add `--gpu` on a machine with a graphics card; without it Chromium renders in software (slow but identical in method). `--params '{"samples":32}'` passes settings to the engine page. The tool needs Playwright with Chromium (it also finds the Animate engine's pinned copy). GSAP 3.15.0 is installed by `npm ci` and never bundled: the Stickman films load it from `node_modules`, and the engine tests use it too. esbuild 0.28.1 and the Inter and JetBrains Mono font packages are there for the cutaway builder, which bundles a sim folder with three.js into one page. From frames to an MP4 with sound: [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound).
