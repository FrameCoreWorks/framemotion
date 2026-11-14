# Engines

One folder for every engine FrameMotion renders frame by frame: our own engines and, as they are wired in, adapters for the bundled ones. Each follows [the engine contract](../../references/engine-contract.md), is listed in [`engines.json`](engines.json) and is rendered by the same tool, so engines share one clock, one dependency set and one test path.

| Path | What it is |
| --- | --- |
| `kit/` | [Engine kit](kit/README.md): time, seeded randomness, sub-frames, the GSAP/HyperFrames bridge and the renderer `render-engine.mjs` |
| `engines.json` | The registry: id, page, size, sources, reusable blocks |
| `package.json`, `package-lock.json` | The one dependency set of all engines, pinned exactly (three.js 0.187.0) |
| `photoreal/` | [Photoreal three.js blocks](photoreal/README.md): accumulation camera and film grade, with a demo scene |

## Run

Copy this folder to the workspace as `engines` (see [first setup](../../references/first-setup.md#runtimes)), then:

```bash
npm ci
node kit/render-engine.mjs --engine photoreal-demo --frames 0,30,59 --out frames
```

Add `--gpu` on a machine with a graphics card; without it Chromium renders in software (slow but identical in method). `--params '{"samples":32}'` passes settings to the engine page. The tool needs Playwright with Chromium (it also finds the Animate engine's pinned copy).
