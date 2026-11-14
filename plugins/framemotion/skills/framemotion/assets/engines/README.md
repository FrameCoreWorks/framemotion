# Engines

One folder for every engine FrameMotion renders frame by frame: our own engines and, as they are wired in, adapters for the bundled ones. Each follows [the engine contract](../../references/engine-contract.md), is listed in [`engines.json`](engines.json) and is rendered by the same tool, so engines share one clock, one dependency set and one test path.

| Path | What it is |
| --- | --- |
| `kit/` | [Engine kit](kit/README.md): time, seeded randomness, sub-frames, the GSAP/HyperFrames bridge and the renderer `render-engine.mjs` |
| `engines.json` | The registry: id, page, size, sources, reusable blocks |
| `package.json`, `package-lock.json` | The one dependency set of all engines, pinned exactly (three.js 0.187.0) |
| `photoreal/` | [Photoreal three.js blocks](photoreal/README.md): accumulation camera and film grade, with a demo scene |
| `gl-transitions/` | [gl-transitions engine](gl-transitions/README.md): 236 transitions between two pictures (unchanged shaders, our wrapper) |

Registered engines:

| Id | Engine | How it is wired |
| --- | --- | --- |
| `photoreal-demo` | Our [photoreal blocks](photoreal/README.md) on a demo scene | own page |
| `gl-transition` | [gl-transitions](gl-transitions/README.md), any of 236 shaders | own page, unchanged shaders |
| `animate-starter` | The bundled [Animate engine](../animate-engine/ENGINE.md), its starter piece | builder `animate`, adapter `renderFrame` |
| `anatomy-svg` | The bundled [Anatomy engine](../anatomy-engine/README.md), its SVG fixture | builder `anatomy`, adapter `renderFrame` |
| `kaventro-blank`, `-overlay`, `-mobile`, `-desktop`, `-story` | The bundled [kaventro film templates](../kaventro-engine/README.md) | builder `kaventro`, adapter `seek` |
| `hairline-spice-rack` | The [Hairline](../hairline/README.md) example | builder `folder`, adapter `renderFrame` |

Bundled engines stay byte-identical in their own folders (a test checks their hashes); a builder in `kit/builders.mjs` makes their page in a temporary folder and an adapter wraps the page's own clock (`window.renderFrame(seconds)` or `window.seek(t)`). Any Animate piece, Anatomy page or kaventro film renders the same way: add an entry with its piece folder, page options or template kind. A page may list files that are allowed to be missing in `optional` (a film's music in a silent render); any other missing file fails the render, and outside requests are blocked and listed in the report.

## Run

Copy this folder to the workspace as `engines` (see [first setup](../../references/first-setup.md#runtimes)), then:

```bash
npm ci
node kit/render-engine.mjs --engine photoreal-demo --frames 0,30,59 --out frames
```

Add `--gpu` on a machine with a graphics card; without it Chromium renders in software (slow but identical in method). `--params '{"samples":32}'` passes settings to the engine page. The tool needs Playwright with Chromium (it also finds the Animate engine's pinned copy). The engine tests also use GSAP 3.15.0, a dev dependency installed by `npm ci` and never bundled. From frames to an MP4 with sound: [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound).
