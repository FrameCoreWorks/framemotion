# Engine contract

Every engine in FrameMotion, whether a bundled copy or our own code, follows this contract so HyperFrames can render it frame-exactly. The helpers are in [the engine kit](../assets/engines/kit/README.md).

## Rules

1. **A pure function of time.** `seek(t)` draws the state at `t` seconds, for any `t` in `[0, duration]`. No wall clock, no `requestAnimationFrame` loop that carries state, no state from the previous frame. Forward, backward and direct seeks give the same picture, byte for byte, whatever frames were drawn before: a state the timeline sets at `t = 0` is already the page's starting state, and nothing keeps a layer rasterised at an earlier scale (no `will-change` on text). Test it by drawing a frame after a later one, as the Stickman test does. Frames are `0 … totalFrames − 1` and frame `f` shows `t = f / fps`, so `t = duration` is the end state but never a frame of its own; a motion-blur sample may still land on it.
2. **Seeded randomness.** Use `createRng(seed)`; never `Math.random`. Simulations are precomputed or rebuilt deterministically before seeking.
3. **One clock.** In HyperFrames, register the timeline from `bindToGsap(engine, gsap)`; never run a second clock.
4. **Input as JSON.** Copy, colours, fonts, assets and timing come in one JSON object the brief fills; no brand is built in.
5. **Sub-frames.** Motion blur, anti-aliasing and depth of field average `subframeTimes(...)`: the open shutter is centred on the frame time and split into equal strata, one sample in the middle of each. The shutter is a setting, not a hard-coded value. The photoreal lens plan uses exactly these times.
6. **Local and safe.** No network at render time, no account or key, and no server that runs commands sent from a browser page. Frames are written by the renderer (Playwright or a Node process).
7. **Credited.** Every third-party source is listed in `integrations/sources.json` with its full commit and licence; material in the package also has its `integrations/<name>/` folder (licence text, source manifest) and a line in `NOTICE`. Only MIT, Apache-2.0 and BSD code; OFL fonts with their licence text.

## Where engines live and how they fit together

- All engines live in `assets/engines/` ([overview](../assets/engines/README.md)): one folder per engine, the shared [kit](../assets/engines/kit/README.md), and one `package.json` with exact versions for every engine. A new engine adds its dependency there, never its own `package.json`, so all three.js engines run the same three.js.
- [`engines.json`](../assets/engines/engines.json) registers each engine: id (the same as in `defineEngine`), page, size, sources (names from `integrations/sources.json`) and reusable blocks.
- Each engine has a page that sets `window.__framemotion = {engine, canvas, ready: true, checks}`; `render-engine.mjs` renders any registered engine the same way and fails a frame that does not repeat exactly.
- Engines reuse each other's blocks by relative import (a stickman scene can use the photoreal film grade). A block is a module with no global state, created per renderer.
- Settings an engine accepts are declared under `params` in its registry entry (type `integer`, `number`, `boolean`, `string`, `object` or `array`; default, min, max, `enum` for a fixed list of names, `items`, `minItems`, `maxItems` and `maxLength` for a list; `timing: true` when the setting changes the film's length); the renderer refuses unknown or out-of-range settings before a browser starts, and an error the page throws while starting ends the render at once.
- Other registry fields a page may need: `"css_animations": "seeked"` when its seek pauses and places CSS animations itself (otherwise the screenshot jumps them to their end); `"transparent": true` for an overlay captured with alpha (screenshot pages; a canvas keeps its own alpha); `flat_frames` for frames that are one colour by design (a drawing that starts on blank paper); `optional` files that may be missing; `allowed_blocked` outside requests an unchanged bundled page makes that are refused without failing.
- Engine code never reaches the network or starts a process; a test scans `.mjs`, `.js` and `.html` for it. At render time the renderer also blocks every request outside the engines origin, every WebSocket and every host name, so a slip in engine code fails instead of reaching out.

## From frames to an MP4 with sound

1. Render every frame: `node kit/render-engine.mjs --engine <id> --frames all --out frames/` (add `--once` for a long final render after a checked preview; add `--gpu` on a machine with a GPU). The command fails on a page error, a frame that does not repeat, or a flat frame.
2. Encode the PNG sequence with the same frame rate, and add the designed sound in the same step:

   ```bash
   ffmpeg -framerate 30 -i frames/<id>-%05d.png -i sound.wav \
     -c:v libx264 -pix_fmt yuv420p -crf 16 -c:a aac -b:a 192k -shortest out.mp4
   ```

3. Review the encoded MP4, not the PNGs: the usual frame QA, and loudness measured on the encoded file as [the sound reference](motion-sound-design.md) says (−14 LUFS for social, true peak at most −1 dBTP).

## How an engine enters the package

- **Copy 1:1 (default).** The upstream files stay byte-identical at the pinned commit, with a `source-manifest.json` of hashes and a test that checks them (as the Animate and Anatomy engines do). Our adapter maps the engine's own clock to `seek(t)`: an engine that exposes `renderFrame(seconds)` needs only a builder in `kit/builders.mjs` and a registry entry with `adapter: "renderFrame"`; nothing in the copy changes.
- **Rewrite (only where needed).** When the code has to change deeply (the photoreal three.js blocks, stickman-kino, cutaway), we write our own code on the engine kit and keep the upstream's licence text and credit.

## Checklist for a new engine

1. Recheck the licence at the commit pinned in `sources.json`.
2. Copy or write the engine in `assets/engines/<id>/`; add its adapter on the engine kit and its page.
3. Add its dependencies, pinned exactly, to `assets/engines/package.json` and refresh the lockfile.
4. Register it in `engines.json`.
5. Add a test that renders it through `render-engine.mjs` (frames repeat exactly, frames are not blank) and look at a contact sheet of the frames.
6. Add the credit (`integrations/<name>/`, `NOTICE`) and set its status in `sources.json`.
7. Run `python3 tools/check.py`; it prints the archive size.
