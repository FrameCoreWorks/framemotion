# Stickman engine

Stick-figure explainers, short stories and faceless channel videos drawn as code: rigged figures with 58 poses, gaits and arm reach, 202 props, charts and diagrams, kinetic text and captions, camera moves, effects, transitions, eight themes and title presets. It is [Stickman Kino](https://github.com/dsauce/stickman-kino) by Prerit Ahuja (MIT) at `d3d665301c0b62f04c885785e6bd6044de0785c6`, bundled unchanged except for one option, plus FrameMotion's own reel additions. How to direct a film with it: [stickman explainer craft](../../references/stickman-explainer-craft.md).

## What is here

| Path | What it is | State |
| --- | --- | --- |
| `engine/` | The engine scripts, `sm.css` and the fonts (Inter, Caveat, Permanent Marker, with `fonts/OFL.txt`) | unchanged, except `engine/sm-rig.js` |
| `lib/film.mjs`, `lib/synth.mjs`, `lib/env.mjs` | `compose()`, which turns a film folder into one page, the sound-effect synthesiser it calls, and the path helpers it imports | unchanged |
| `schema/film.schema.json` | The `film.json` schema | unchanged |
| `samples/` | Eight finished films (`film.json` + `scenes.js`): `hello-stickman` (start here), `two-minute-rule` (9:16), `chorus`, `compound-interest`, `showcase`, `titles`, `recipes`, `gallery` | unchanged |
| `docs/api.md`, `docs/cookbook.md` | The engine's API sheet and its tested recipes (the upstream `skills/stickman-animator/references/` files) | unchanged |
| `LICENSE`, `THIRD_PARTY_NOTICES.md` | The upstream licence and notices | unchanged |
| `framemotion/reel.js` | FrameMotion's additions (Apache-2.0): theme `cartoon`, characters `bighead` and `bigheadCap`, `sc.drift(t0, t1, o)` and `sc.reelCaptions(o)` | ours |
| `framemotion/reel-sample/` | A 17 s 9:16 cartoon reel that uses all of them | ours |

The one change: `engine/sm-rig.js` accepts `headScale` on a figure (`sc.figure({ headScale: 1.6 })`), so a big head keeps its face, hat and neck in proportion. The [source manifest](../../../../integrations/stickman-kino/source-manifest.json) records the original hash and the new one; every other file matches the upstream byte for byte, and a test checks both.

Not bundled: the `stickman` command line, its set-up of Kokoro, ffmpeg and HyperFrames, its music and voice tools, and the upstream agent skills. In FrameMotion the voice, music and final mix follow FrameMotion's sound route (Earshot through Toolbox, or `sound.py`); the sound effects that `compose()` synthesises for the `sfx` entries of `film.json` are placeholders on the timeline.

## A film

A film is a folder with two files:

- `film.json`: title, `format` (`16:9`, `9:16`, `1:1`, `4:5`, `4:3`), `theme`, and `clips`, each with an `id`, a `vo` line, a `duration` (`"auto"` times it from the voice: the recorded take when there is one, otherwise 2.55 words a second) and optional `sfx`, `intro` or `outro`.
- `scenes.js`: `const film = SM.film();` then one `film.scene(id, sc => { … })` per clip. Times are seconds inside the clip, every action returns its end time, and `sc.cue("word")` gives the time a word is spoken. API: [docs/api.md](docs/api.md); recipes: [docs/cookbook.md](docs/cookbook.md).

The engine already follows the [engine contract](../../references/engine-contract.md): one paused GSAP timeline, built at once, seeded randomness, no clock and no network. HyperFrames renders the composed page as it is (the timeline is registered as `window.__timelines.stickman`).

## Render

Copy this folder next to the `engines` folder in the workspace ([first setup](../../references/first-setup.md#runtimes)). Add an entry to `engines/engines.json` with `"build": {"tool": "stickman", "film": "<path to the film folder>"}`, `"adapter": "seek"` and the film's size, fps and length, or use one of the three that are there:

```bash
node kit/render-engine.mjs --engine stickman-reel --frames 0,150,300 --out frames
```

The builder copies the film folder to a temporary folder, runs the engine's own `compose()` there (GSAP comes from `engines/node_modules`), adds `framemotion/reel.js`, and gives the page a `seek(t)` that shows the clip playing at `t` and moves the timeline. The registry's length must match the film's (`frames / fps`); the renderer reports a mismatch.

## Credit

Stickman Kino: MIT, Copyright (c) 2026 Prerit Ahuja; its fonts are under the SIL Open Font License 1.1. The vertical cartoon reel follows the stick-figure reel method of [claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) by Artem Novitckii (MIT) at `5dbea55c23aa6a5c93dc3cfb5583840513b56b94`; no code from it is used. Both are named in FrameMotion's `NOTICE`.
