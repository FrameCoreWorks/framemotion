# Stickman engine

Stick-figure explainers, short stories and faceless channel videos drawn as code: rigged figures with 58 poses, gaits and arm reach, 202 props, charts and diagrams, kinetic text and captions, camera moves, effects, transitions, eight themes and title presets. It is [Stickman Kino](https://github.com/dsauce/stickman-kino) by Prerit Ahuja (MIT) at `d3d665301c0b62f04c885785e6bd6044de0785c6`, bundled unchanged except for one option, plus FrameMotion's own additions: word timing from a real voice take, Polish and other Latin Extended letters, and the vertical cartoon reel look. How to direct a film with it: [stickman explainer craft](../../references/stickman-explainer-craft.md).

## What is here

| Path | What it is | State |
| --- | --- | --- |
| `engine/` | The engine scripts, `sm.css` and the fonts (Inter, Caveat, Permanent Marker, Latin subsets, with `fonts/OFL.txt`) | unchanged, except `engine/sm-rig.js` |
| `lib/film.mjs`, `lib/synth.mjs`, `lib/env.mjs` | `compose()`, which turns a film folder into one page, the sound-effect synthesiser it calls, and the path helpers it imports | unchanged |
| `schema/film.schema.json` | The `film.json` schema | unchanged |
| `samples/` | Eight finished films (`film.json` + `scenes.js`): `hello-stickman` (start here), `two-minute-rule` (9:16), `chorus`, `compound-interest`, `showcase`, `titles`, `recipes`, `gallery` | unchanged |
| `docs/api.md`, `docs/cookbook.md` | The engine's API sheet and its tested recipes (the upstream `skills/stickman-animator/references/` files; the `stickman` command they mention is not bundled) | unchanged |
| `LICENSE`, `THIRD_PARTY_NOTICES.md` | The upstream licence and notices | unchanged |
| `framemotion/reel.js` | FrameMotion's additions (Apache-2.0), listed in its header | ours |
| `framemotion/reel.css` | Latin Extended font faces and the text-layer fix below | ours |
| `framemotion/fonts/` | Latin Extended subsets of Inter (400 to 900) and Caveat (400, 700) from `@fontsource/inter` 5.2.8 and `@fontsource/caveat` 5.2.8, with their OFL texts | fonts unchanged, OFL 1.1 |
| `framemotion/reel-sample/` | A 40 s 9:16 cartoon reel in 11 set-ups that uses every addition | ours |

The one change: `engine/sm-rig.js` accepts `headScale` on a figure (`sc.figure({ headScale: 1.9 })`), marked by a comment line in the file. A bigger head grows upwards, so the figure is taller than its `size`. The [source manifest](../../../../integrations/stickman-kino/source-manifest.json) records the original hash and the new one; every other file matches the upstream byte for byte, and a test checks both.

Not bundled: the `stickman` command line, its set-up of Kokoro, ffmpeg and HyperFrames, its music and voice tools, and the upstream agent skills. In FrameMotion the voice, music and final mix follow FrameMotion's sound route (Earshot, or `sound.py`); the effects that `compose()` synthesises for the `sfx` entries of `film.json` are placeholders on the timeline.

## Make a film

1. **Folder.** Copy `framemotion/reel-sample` (vertical reel) or `samples/hello-stickman` (16:9) to a new folder.
2. **`film.json`.** Title, `format` (`16:9`, `9:16`, `1:1`, `4:5`, `4:3`), `theme` and `clips`, each with an `id`, a `vo` line, a `duration` (`"auto"` times it from the voice) and optional `sfx`, `voStart`, `tail`, `intro` or `outro`.
3. **`scenes.js`.** `const film = SM.film();` then one `film.scene(id, sc => { … })` per clip. Times are seconds inside the clip, every action returns its end time, and `sc.cue("word")` is the time a word is spoken. API: [docs/api.md](docs/api.md); recipes: [docs/cookbook.md](docs/cookbook.md); additions: the header of `framemotion/reel.js`.
4. **The real voice** (once the take exists):
   - `assets/audio.json`: `{"vo": {"<clip id>": {"file": "assets/vo/<clip id>.wav", "duration": 3.42}}}`, one take per clip. Clip lengths then follow the takes, and the takes play in the page.
   - `words.json`: the take's word times per clip, either `[{"word": "What", "start": 0.02, "end": 0.21}, …]` in seconds from the start of that clip's take, or Whisper's JSON for that take (`whisper <take> --word_timestamps True --output_format json`). `sc.cue()`, `sc.captions()` and `sc.reelCaptions()` then follow the voice instead of an estimate from the text (good to about 0.2 s).
5. **Register.** Add an entry to `engines/engines.json`: `"build": {"tool": "stickman", "film": "<path to the folder>"}`, `"adapter": "seek"`, `"kind": "svg"`, `"screenshot": "#root"`, the size, `"fps": 30` and `"duration": "page"` (the length the voice gives; a number instead is checked against the page).
6. **Render** from the `engines` folder (copied next to this one in the workspace, see [first setup](../../references/first-setup.md#runtimes)):

   ```bash
   node kit/render-engine.mjs --engine stickman-reel --frames all --out frames
   ```

   Look at a contact sheet first (`--frames` with a few numbers), then render all frames and encode them with the sound as the [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound) says.

The builder copies the folder to a temporary one, runs the engine's own `compose()` there (GSAP comes from `engines/node_modules`), adds `framemotion/`, the measured word times and a `seek(t)` that shows the clip playing at `t` and moves the film's one timeline. HyperFrames can render the composed page as it is (the timeline is `window.__timelines.stickman`).

## Frames are the same in any order

The engine already follows the [engine contract](../../references/engine-contract.md): one paused GSAP timeline, built at once, seeded randomness, no clock and no network. Two things made a frame depend on the frames drawn before it, and both are handled in FrameMotion's part: the engine marks text with `will-change`, which keeps a text layer rasterised at the scale it was first drawn at (`reel.css` turns it off), and the grain starts on its first pattern. A test draws frames forwards and backwards and compares the bytes.

## Letters

The bundled font files hold only the basic Latin set. `reel.css` adds Latin Extended faces of Inter and Caveat with a `unicode-range`, so ą, ę, ł, ś, ż and other accented letters use the same typeface. Permanent Marker (the display font of the `paper` theme) has no Latin Extended face; those letters fall back to Inter, so choose another theme for a Polish film with large display type.

## Credit

Stickman Kino: MIT, Copyright (c) 2026 Prerit Ahuja. Its fonts: Inter and Caveat under the SIL Open Font License 1.1; Permanent Marker is listed as OFL 1.1 by Stickman Kino and as Apache-2.0 by Fontsource and Google Fonts (both allowed; not checked at the font's own source). The vertical cartoon reel follows the stick-figure reel method of [claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) by Artem Novitckii (MIT) at `5dbea55c23aa6a5c93dc3cfb5583840513b56b94`; no code from it is used. All are named in FrameMotion's `NOTICE`.
