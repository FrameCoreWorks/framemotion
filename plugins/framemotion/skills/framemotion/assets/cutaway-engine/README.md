# Cutaway engine

Objects that take themselves apart in three.js, rendered frame by frame. Two ways in, one kit:

- **Teardown** (ours, fast): a labelled exploded view of a flat, layered object (a phone, a watch, a tablet, a card reader, a remote) from a JSON spec. The object turns, the layers lift apart top first, numbered leader labels draw in, chosen layers slide out under their own camera, and everything closes with a small overshoot. About 0.6 s a frame in software; no GPU needed.
- **Cutaway films** (bundled, heavy): [Nyxera0x/cutaway](https://github.com/Nyxera0x/cutaway) at `5d8f1c6efe0ed65a8fc7647a7a2a3ee9fbb4d20a` (MIT), unchanged: a robotic tarantula, piranha and wasp rebuilt in code from one picture each, with a page of buttons, cards and labels around them, a 60 fps film per object, a 10-second version, and a synthesised score on the same timeline. Each frame takes 20 to 50 s in software; render these on a machine with a graphics card (`--gpu`).

## What is here

| Path | What it is | State |
| --- | --- | --- |
| `sims/kit/` | The runtime (`runSim`, a pure `render(t)` with capture mode), the 3D stage with bloom, shader warm-up and helpers (`rng`, `keyed`, eases) | unchanged |
| `sims/<object>-shared/`, `-film/`, `-demo/` | The three objects, their full films and short versions; `timeline.json` holds each film's beats | unchanged |
| `sims/green/` | The page around every object and the green look, plus review tools | unchanged |
| `sims/build.mjs`, `sims/capture.mjs` | Bundles a sim folder into one offline page; the upstream frame capture to MP4 | unchanged |
| `sfx/`, `run_sfx.py`, `wave.mjs`, `sheet.mjs` | The sound engine (pure Python, 48 kHz, −14 LUFS) that scores a film from its timeline, 12 CC0 samples, and review helpers | unchanged |
| `docs/method.md`, `docs/*.md` | The upstream method: brief, checklist, prompts, lessons (`method.md` is its `SKILL.md`, renamed so no host loads it as a skill) | unchanged |
| `LICENSE`, `package.json`, `paths.mjs` | Upstream licence, package list and paths | unchanged |
| `README.md` (this file), `framemotion/teardown.js` | The teardown (Apache-2.0) and these notes | ours |
| `framemotion/teardown-phone/`, `framemotion/teardown-watch/` | Two samples: a 9:16 phone with Polish labels and a 16:9 watch in the light theme | ours |

Not bundled: the three preview GIFs (14 MB), the upstream landing-page README (this file replaces it) and the lockfile. three.js, esbuild and the fonts come from the engines folder's `package.json` (`npm ci` there), so nothing else is installed.

## Make a teardown

1. **Folder.** Copy `framemotion/teardown-phone` to a new folder next to it or in the workspace. `main.js` stays as it is; the film is `spec.json`.
2. **`spec.json`.** Top layer first, 2 to 8 layers:

   ```json
   {
     "title": "Pulse watch", "subtitle": "What is inside", "partsLabel": "parts",
     "accent": "#FF6A3D", "theme": "light",
     "shape": {"w": 4.0, "l": 4.6, "r": 1.1},
     "screen": {"time": "10:08", "date": "142 bpm"},
     "layers": [
       {"name": "Sapphire", "note": "scratch-proof", "finish": "glass", "h": 0.08},
       {"name": "Display", "note": "always on", "finish": "gloss", "face": "screen", "color": "#2A1E3A", "h": 0.1}
     ],
     "focus": ["Display"],
     "hold": 1.0
   }
   ```

   - `shape`: the outline, width `w`, length `l`, corner radius `r` in model units (a phone is about 7.2 × 15).
   - Each layer: `name` and `note` (the label, about 16 and 22 characters), `finish` (`glass`, `gloss`, `matte`, `metal`), `face` (`plain`, `screen` with `screen.time` and `screen.date`, `frame` for a hollow frame with two buttons, `board` for traces and chips, `battery` for a printed cell, `ring` for a charging coil), `color`, thickness `h`, and `inset` to make a layer smaller than the outline.
   - `focus`: layers that slide out in turn under their own camera (2.4 s each). Leave it empty for a short loop.
   - `theme` `dark` or `light`, one `accent` colour, `hold` seconds at the end, `seed` for the board.
3. **Register** it in `engines/engines.json`: `"build": {"tool": "cutaway", "sim": "<path to the folder>"}`, `"adapter": "renderFrame"`, `"kind": "three"`, `"screenshot": "#app"`, the size (`1080 × 1920`, `1920 × 1080`, `1080 × 1080`), `"fps": 30` and the duration. The page reports its length: 1 s of turn, the explode, 1.2 s with labels, 2.4 s per focus layer, the close and `hold`, rounded up to a tenth of a second; a wrong number in the registry stops the render with both values.
4. **Render** from the `engines` folder, a contact sheet first:

   ```bash
   node kit/render-engine.mjs --engine teardown-phone --frames 0,60,150,250 --out frames
   node kit/render-engine.mjs --engine teardown-phone --frames all --out frames
   ```

   Then encode the frames with sound as the [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound) says.

The labels number the layers in screen order, top first, and stay in a column on the right; their rows never overlap, and while a layer is out the others dim. Layout follows the frame: in a tall film the object sits in the upper left, in a wide one on the left, and the camera distances are fitted to the frame when the page loads, so any size works. Letters beyond basic Latin (ą, ę, ł, ś, ż …) use Latin Extended faces of Inter and JetBrains Mono, set up by the page.

**Picture first.** For a client's own product, measure its outline and layer order from a photo or a spec sheet, and match `shape`, colours and finishes to it. The teardown draws a clean product diagram, not a photoreal model; say so before promising a look.

## Render a cutaway film

`cutaway-piranha` renders the bundled piranha film (`1600 × 900`, 60 fps, 21.2 s). The tarantula and wasp films and the three short versions build the same way: register `"sim": "../cutaway-engine/sims/<name>"` with the size, `"fps": 60` and the `duration` from its `timeline.json` (a short version whose timeline has `"film"` plays its scene faster; register its `film` length only after checking a frame). A new object follows `docs/method.md` and `docs/JOB_DESCRIPTION.md`: one reference picture, a checklist, a still the user approves, then the film ported from the closest example. That is long work for a GPU machine; say so before starting.

The score: `python3 run_sfx.py sims/piranha-shared/score.py` (Python 3, standard library only) writes the film's sound from its own timeline. In FrameMotion the final mix and loudness follow the sound route (Earshot through Toolbox, or `sound.py`).

## How it is wired

The builder (`engines/kit/builders.mjs`, tool `cutaway`) runs the engine's own `sims/build.mjs` on the sim folder in a temporary folder, with three.js, esbuild and the fonts taken from the engines folder. It opens the page in capture mode, waits for the sim's setup and exposes the sim's pure `render(t)` as `window.renderFrame`. Every `render(t)` draws its frame from `t` alone (the kit's own rule), and a test draws teardown frames forwards and backwards and compares the bytes.

## Credit

Cutaway: MIT, Copyright (c) 2026 Nyxera0x and Copyright (c) 2026 whaleyxbt; its kit, capture, sound engine and review rules come from [whaleyxbt/claude-motion](https://github.com/whaleyxbt/claude-motion) (MIT); its recorded samples are CC0 1.0 from Freesound, trimmed by [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics) (MIT), with every source in `sfx/samples/SOURCES.md`. The teardown follows the exploded-view method of [claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) by Artem Novitckii (MIT, `skills/breakdown` at `5dbea55c23aa6a5c93dc3cfb5583840513b56b94`); no code from it is used. All are named in FrameMotion's `NOTICE`.
