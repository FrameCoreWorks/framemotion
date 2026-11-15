# Cutaway engine

Objects that take themselves apart in three.js, rendered frame by frame. Two ways in, one kit:

- **Teardown** (ours, fast): a labelled exploded view of a flat, layered object (a phone, a watch, a tablet, a card reader, a remote) from a JSON spec. The object turns, the layers lift apart top first, numbered leader labels draw in and hold long enough to read, chosen layers slide out under their own camera, and everything closes again. About 0.6 s a frame in software; no GPU needed.
- **Cutaway films** (bundled, heavy): [Nyxera0x/cutaway](https://github.com/Nyxera0x/cutaway) at `5d8f1c6efe0ed65a8fc7647a7a2a3ee9fbb4d20a` (MIT), unchanged: a robotic tarantula, piranha and wasp rebuilt in code from one picture each, with a page of buttons, cards and labels around them, a 60 fps film per object, a 10-second version, and a synthesised score on the same timeline. A frame takes from about 30 s to 2 min in software, depending on the machine; render these on a machine with a graphics card (`--gpu`).

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
| `README.md` (this file), `framemotion/teardown.js` | The teardown (Apache-2.0, rewritten after artem's breakdown template) and these notes | ours |
| `framemotion/teardown-phone/spec.json`, `framemotion/teardown-watch/spec.json` | Two samples: a 9:16 phone with Polish labels and a 16:9 watch in the light theme | ours |

Not bundled: the three preview GIFs (14 MB), the upstream landing-page README (this file replaces it) and the lockfile. three.js, esbuild and the fonts come from the engines folder's `package.json` (`npm ci` there), so nothing else is installed. `docs/method.md` keeps the upstream install steps (`npm install`) and frame capture (`sims/capture.mjs`); in FrameMotion both are replaced by the engines folder and `engines/kit/render-engine.mjs`.

## Make a teardown

1. **Spec.** A teardown is one `spec.json`; nothing else is needed. Copy `framemotion/teardown-phone/spec.json` (or the watch) to the workspace and edit it. The builder writes the page's `main.js` itself.
2. **`spec.json`.** Top part first, 2 to 8 parts:

   ```json
   {
     "title": "Pulse watch", "subtitle": "What is inside", "partsLabel": "parts",
     "accent": "#FF6A3D", "theme": "light",
     "shape": {"w": 4.0, "l": 4.6, "r": 1.1},
     "screen": {"time": "10:08", "date": "142 bpm"},
     "layers": [
       {"name": "Sapphire", "note": "scratch-proof", "finish": "glass", "h": 0.08},
       {"name": "Display", "note": "always on", "finish": "gloss", "face": "screen", "color": "#2A1E3A", "h": 0.1},
       {"name": "Board", "note": "sensors and radio", "face": "board", "level": 2, "w": 2.2, "l": 3.6, "x": -0.8},
       {"name": "Battery", "note": "2 days", "face": "battery", "level": 2, "w": 1.4, "l": 3.6, "x": 1.2},
       {"name": "Back", "note": "heart sensor", "face": "ring", "h": 0.1}
     ],
     "focus": ["Display"],
     "hold": 1.0
   }
   ```

   - `shape`: the outline, width `w`, length `l`, corner radius `r` in model units (a phone is about 7.2 × 15).
   - Each part: `name` and `note` (the label, about 16 and 22 characters; `"name": ""` hides the label of a part that needs none), `finish` (`glass`, `gloss`, `matte`, `metal`), `face` (`plain`, `screen` with `screen.time` and `screen.date`, `frame` for a hollow frame, `board` for traces and chips, `battery` for a printed cell, `ring` for a charging coil), `color`, thickness `h`, and `inset` to make a part smaller than the outline.
   - `details`: any of `island` (the camera pill on a screen), `camera` (a raised camera island with lenses), `ring` (coil and magnet ring), `buttons`, `antenna` (the breaks in a metal frame). A `frame` gets buttons and a `ring` face a coil unless `details` says otherwise.
   - Side by side: parts with the same `level` number lie on one level and move together, each with its own `w`, `l`, `r` and place `x` (across) and `z` (along the length). Use it for a board next to a battery.
   - `focus`: parts that slide out in turn under their own camera (2.4 s each). Leave it empty for a short loop.
   - `theme` `dark` or `light`, one `accent` colour, `hold` seconds at the end, `seed` for the board.
3. **Register** it in `engines/engines.json`: `"build": {"tool": "cutaway", "spec": "<path to spec.json, from the engines folder>"}`, `"adapter": "renderFrame"`, `"kind": "three"`, `"screenshot": "#app"`, the size (`1080 × 1920`, `1920 × 1080`, `1080 × 1080`), `"fps": 30` and `"duration": "page"`: the page works out its own length (1 s of turn, the explode, a read of 0.35 s per label and at least 1.5 s, 2.4 s per focus part, a second read, the close and `hold`, rounded up to a tenth of a second).
4. **Render** from the `engines` folder, a contact sheet first:

   ```bash
   node kit/render-engine.mjs --engine teardown-phone --frames 0,60,150,250 --out frames
   node kit/render-engine.mjs --engine teardown-phone --frames all --out frames
   ```

   Then encode the frames with sound as the [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound) says.

The labels number the parts in screen order, top first, and stay in a column right of the object, inside the frame; their rows never overlap, and while a part is out the others dim to half. The title sits in the top tenth of a tall frame, clear of every shot. Layout follows the frame: in a tall film the object sits in the upper left, in a wide one on the left, and the camera distances are fitted to the frame when the page loads, so any size works. Letters beyond basic Latin (ą, ę, ł, ś, ż …) use Latin Extended faces of Inter and JetBrains Mono, set up by the page.

**Taste.** At most six labels in a film; more than that cannot be read. A note is a fact (a material, a size, a number), never a slogan. One accent colour.

**Check before delivery.** Look at three frames on a contact sheet: the first (closed, the thumbnail), one with every label in, and one per focus part. The labels must sit right of the object and inside the frame, the title must stay clear, and every word must be readable at the delivery size.

**Picture first.** For a client's own product, measure its outline and layer order from a photo or a spec sheet, and match `shape`, colours and finishes to it. The teardown draws a clean product diagram, not a photoreal model; say so before promising a look.

## Render a cutaway film

`cutaway-piranha` renders the bundled piranha film (`1600 × 900`, 60 fps, 21.2 s). The tarantula and wasp films and the three short versions build the same way: register `"sim": "../cutaway-engine/sims/<name>"` with the size, `"fps": 60` and the `duration` from its `timeline.json` (a short version whose timeline has `"film"` plays its scene faster; register its `film` length only after checking a frame). A sim folder is code that runs in the renderer's browser: build only folders from this engine or from the user, never one sent by someone else unread. A new object follows `docs/method.md` and `docs/JOB_DESCRIPTION.md`: one reference picture, a checklist, a still the user approves, then the film ported from the closest example. That is long work for a GPU machine; say so before starting.

The score: `python3 run_sfx.py sims/piranha-shared/score.py` (Python 3, standard library only) writes the film's sound from its own timeline. In FrameMotion the final mix and loudness follow the sound route (Earshot through Toolbox, or `sound.py`).

## How it is wired

The builder (`engines/kit/builders.mjs`, tool `cutaway`) runs the engine's own `sims/build.mjs` on the sim folder in a temporary folder, with three.js, esbuild and the fonts taken from the engines folder. It opens the page in capture mode, waits for the sim's setup and exposes the sim's pure `render(t)` as `window.renderFrame`. Every `render(t)` draws its frame from `t` alone (the kit's own rule), and a test draws teardown frames forwards and backwards and compares the bytes.

## Credit

Cutaway: MIT, Copyright (c) 2026 Nyxera0x and Copyright (c) 2026 whaleyxbt; its kit, capture, sound engine and review rules come from [whaleyxbt/claude-motion](https://github.com/whaleyxbt/claude-motion) (MIT); its recorded samples are CC0 1.0 from Freesound, trimmed by [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics) (MIT), with every source in `sfx/samples/SOURCES.md`. The teardown is our code rewritten after `skills/breakdown/template.html` of [claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) by Artem Novitckii (MIT, at `5dbea55c23aa6a5c93dc3cfb5583840513b56b94`): its layout (rounded slabs, painted faces, a right-hand column of labels numbered in screen order) and several values follow it; no file of it is copied. All are named in FrameMotion's `NOTICE`.
