# Engine kit

The one contract every FrameMotion engine follows, bundled or our own. Rules and the checklist for adding an engine are in [the engine contract](../../../references/engine-contract.md).

`engine-kit.mjs` (original FrameCore Works code, no dependencies, no DOM, clock or network):

| Export | What it does |
|---|---|
| `createRng(seed)` | Seeded random numbers (mulberry32): `next()`, `range(min, max)`, `int(min, max)`, `pick(list)`. Replaces `Math.random`. |
| `halton(index, base)` | Low-discrepancy samples for sub-frames and lens positions. |
| `subframeTimes(frame, {fps, samples, shutter, duration})` | The times to average for one frame; `shutter: 0.5` is a 180° shutter. |
| `defineEngine({id, width, height, fps, duration, seek})` | Validates an engine and adds `totalFrames`, `timeAt(frame)` and `seekFrame(frame)`. |
| `bindToGsap(engine, gsap)` | One paused GSAP timeline whose seeking calls `engine.seek(t)`, so HyperFrames drives a canvas, three.js, pixi or p5 engine like any composition. |

`render-engine.mjs` renders any engine in [`engines.json`](../engines.json) in headless Chromium: it serves files to the page from the engines folder only (request routing, no HTTP server, all other network blocked), renders each frame twice and fails when the two differ, writes PNG frames with `--out`, and reports seconds per frame and pixel range. Use it in Node as `renderFrames(id, {frames, out, params, gpu})` or `openEngine(id)`.

An engine page sets `window.__framemotion = {engine, canvas, ready: true, checks}`: `engine` from `defineEngine`, `canvas` created with `preserveDrawingBuffer: true` (WebGL), `checks` optional functions its tests call.

Tests: `tests/engine-kit.test.mjs`, `tests/photoreal.test.mjs`, `tests/engines_registry_test.py`.
