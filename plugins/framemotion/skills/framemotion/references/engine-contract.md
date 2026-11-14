# Engine contract

Every engine in FrameMotion, whether a bundled copy or our own code, follows this contract so HyperFrames can render it frame-exactly. The helpers are in [the engine kit](../assets/engine-kit/README.md).

## Rules

1. **A pure function of time.** `seek(t)` draws the state at `t` seconds. No wall clock, no `requestAnimationFrame` loop that carries state, no state from the previous frame. Forward, backward and direct seeks give the same picture.
2. **Seeded randomness.** Use `createRng(seed)`; never `Math.random`. Simulations are precomputed or rebuilt deterministically before seeking.
3. **One clock.** In HyperFrames, register the timeline from `bindToGsap(engine, gsap)`; never run a second clock.
4. **Input as JSON.** Copy, colours, fonts, assets and timing come in one JSON object the brief fills; no brand is built in.
5. **Sub-frames.** Motion blur, anti-aliasing and depth of field average `subframeTimes(...)`; the shutter is a setting, not a hard-coded value.
6. **Local and safe.** No network at render time, no account or key, and no server that runs commands sent from a browser page. Frames are written by the renderer (Playwright or a Node process).
7. **Credited.** Every third-party source is listed in `integrations/sources.json` with its full commit and licence; material in the package also has its `integrations/<name>/` folder (licence text, source manifest) and a line in `NOTICE`. Only MIT, Apache-2.0 and BSD code; OFL fonts with their licence text.

## How an engine enters the package

- **Copy 1:1 (default).** The upstream files stay byte-identical at the pinned commit, with a `source-manifest.json` of hashes and a test that checks them (as the Animate and Anatomy engines do). Our adapter beside the copy maps the engine's own clock to `seek(t)`.
- **Rewrite (only where needed).** When the code has to change deeply (the photoreal three.js blocks, stickman-kino, cutaway), we write our own code on the engine kit and keep the upstream's licence text and credit.

## Checklist for a new engine

1. Recheck the licence at the commit pinned in `sources.json`.
2. Copy or write the engine; add its adapter on the engine kit.
3. Add a smoke test: two seconds at the engine's size, every frame seeks twice to the same result, and a contact sheet for the frame review.
4. Add the credit (`integrations/<name>/`, `NOTICE`) and set its status in `sources.json`.
5. Measure the package: `python3 tools/check.py` prints the archive size.
