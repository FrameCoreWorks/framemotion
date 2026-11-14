# Engine kit

The one contract every FrameMotion engine follows, bundled or our own. Rules and the checklist for adding an engine are in [the engine contract](../../references/engine-contract.md).

`engine-kit.mjs` (original FrameCore Works code, no dependencies, no DOM, clock or network):

| Export | What it does |
|---|---|
| `createRng(seed)` | Seeded random numbers (mulberry32): `next()`, `range(min, max)`, `int(min, max)`, `pick(list)`. Replaces `Math.random`. |
| `halton(index, base)` | Low-discrepancy samples for sub-frames and lens positions. |
| `subframeTimes(frame, {fps, samples, shutter, duration})` | The times to average for one frame; `shutter: 0.5` is a 180° shutter. |
| `defineEngine({id, width, height, fps, duration, seek})` | Validates an engine and adds `totalFrames`, `timeAt(frame)` and `seekFrame(frame)`. |
| `bindToGsap(engine, gsap)` | One paused GSAP timeline whose seeking calls `engine.seek(t)`, so HyperFrames drives a canvas, three.js, pixi or p5 engine like any composition. |

Tests: `tests/engine-kit.test.mjs`.
