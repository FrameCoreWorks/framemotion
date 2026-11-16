# Engine kit

The one contract every FrameMotion engine follows, bundled or our own. Rules and the checklist for adding an engine are in [the engine contract](../../../references/engine-contract.md).

`engine-kit.mjs` (original FrameCore Works code, no dependencies, no DOM, clock or network):

| Export | What it does |
|---|---|
| `createRng(seed)` | Seeded random numbers (mulberry32): `next()`, `range(min, max)`, `int(min, max)`, `pick(list)`. Replaces `Math.random`. |
| `halton(index, base)` | Low-discrepancy samples for sub-frames and lens positions. |
| `subframeTimes(frame, {fps, samples, shutter, duration})` | The times to average for one frame: the open shutter centred on the frame, split into equal strata; `shutter: 0.5` is a 180° shutter. |
| `defineEngine({id, width, height, fps, duration, seek})` | Validates an engine and adds `totalFrames`, `timeAt(frame)` and `seekFrame(frame)`. |
| `bindToGsap(engine, gsap)` | One paused GSAP timeline whose seeking calls `engine.seek(t)`, so HyperFrames drives a canvas, three.js, pixi or p5 engine like any composition. The engine is drawn by a property setter, so a plain `seek(t)` (which suppresses GSAP callbacks) still draws; binding draws `t = 0`. Tested with real GSAP 3.15.0. |

`render-engine.mjs` renders any engine in [`engines.json`](../engines.json) in headless Chromium: it serves files to the page from the engines folder only (request routing for the whole browser context, no HTTP server; any other origin, every WebSocket and every host name are blocked), checks the settings against the entry's `params`, renders each frame twice and fails when the two differ, fails on a page error at any frame, flags a flat frame (exit 4 unless `--allow-flat`), writes PNG frames with `--out` (`--frames all` for every frame) and reports seconds per frame and pixel range. Use it in Node as `renderFrames(id, {frames, out, params, gpu, once})` or `openEngine(id)`.

`compose.mjs` joins scenes from different engines into one MP4 from a `film-plan/1` file ([example](film-plan.example.json)): each scene on its engine's own clock, retimed to the film's frame rate, fitted to its size, joined by cuts or ffmpeg crossfades, with optional audio under the whole film. The plan format and the per-scene engine choice are in [engine routing](../../../references/engine-routing.md).

`adapters.mjs`: `fromRenderFrame({id, renderFrame, width, height, fps, duration})` turns a page's own `renderFrame(seconds)` into a contract engine. `builders.mjs`: `animate` (copies a piece and runs the Animate engine's `tools/build.mjs`) and `anatomy` (the Anatomy engine's `studio.mjs` `buildPage`), each into a temporary folder that is removed after rendering; registry entries with `build` and `adapter: "renderFrame"` use them. Frames without a canvas (SVG) are captured as a screenshot of the `screenshot` element.

An engine page sets `window.__framemotion = {engine, canvas, ready: true, checks}`: `engine` from `defineEngine`, `canvas` created with `preserveDrawingBuffer: true` (WebGL), `checks` optional functions its tests call.

Tests: `tests/engine-kit.test.mjs`, `tests/photoreal.test.mjs`, `tests/engines_registry_test.py`.
