# Reels engine

Seven short vertical reel styles (9:16), rendered frame by frame by FrameMotion's shared renderer. The engine is [artemnovitckii/claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) at `5dbea55c23aa6a5c93dc3cfb5583840513b56b94` (MIT, Copyright (c) 2026 Artem Novitckii; [LICENSE](LICENSE)), bundled unchanged except one line (see [What is here](#what-is-here)). Three styles (voxel-build, ps1-low-poly, hairline-tree) come from upstream's 17 Nov 2026 update, commit `86f70106c9aeae1334184467da5776c533ada3bc`. Its two other reel engines already live elsewhere in FrameMotion: the stick-figure reel inside the [Stickman engine](../stickman-engine/README.md) and the breakdown inside the [cutaway teardown](../cutaway-engine/README.md).

## Pick a reel

| The reel needs | Registry id | How it is made |
| --- | --- | --- |
| One number that grows, shown as a smooth line that draws itself while the count follows the tip (4 s) | `reels-graph`, `reels-graph-pl` (Polish copy) | a spec |
| A route across a white 3D city: the line draws, a pin drops, the camera pulls back, an ETA card counts down (4 s) | `reels-map-route` | a spec |
| A quiet black-and-white line-art beat: a dot hops up the steps and lands one or two short lines (about 4 s) | `reels-minimal-line-art` | a spec |
| A line-art tree: one white dot on black grows into a tree that splits in two at every step, the tips light up, then one quiet line swaps to a second (about 4 s) | `reels-hairline-tree` | a spec |
| A blocky voxel build: a cottage drops together block by block, the chimney slams in, the windows light up, one big pixel word lands (4 s, three.js) | `reels-voxel-build` | a spec |
| A 1990s console-style low-poly scene: a dog waits on a station platform, a train passes and he is still there in the snow (4.8 s, three.js, your captions and station names) | `reels-ps1-low-poly` | a spec |
| A 3D cartoon "what if" explainer: a question, a misconception, a "But" turn, slow-motion impacts, 1 to 3 word captions (20 to 60 s) | `reels-what-if-3d` | a three.js film folder |

The six spec styles are single beats to cut into a longer reel. For a launch film with several scenes, use the [Launch engine](../launch-engine/README.md) (`launch-charts` for several charts in one film). For a cartoon explainer with stick figures, use the [Stickman engine](../stickman-engine/README.md).

## Make a spec reel (graph, map-route, minimal-line-art, hairline-tree, voxel-build, ps1-low-poly)

1. **Write a spec** (a small JSON file) in the workspace. Read `styles/<style>/method.md` for its fields and rules. The samples in `framemotion/samples/` are ready to copy. Every field is checked by the style's own `build.py` (through `framemotion/spec.py`) before anything renders, so a wrong field stops with upstream's own message.
2. **Register** it in `engines/engines.json`, copying the `reels-*` entry of that style and changing `id` and `"build": {"tool": "reels", "style": "<style>", "spec": "<file, from the engines folder>"}`. Keep `"adapter": "seek"`, `"screenshot": "#root"` and `"duration": "page"` (the builder works the length out from the spec as `build.py` does, plus an optional `"hold"` in seconds).
3. **Render** from the `engines` folder, a contact sheet first:

   ```bash
   node kit/render-engine.mjs --engine reels-graph --frames 0,40,80,119 --out frames
   node kit/render-engine.mjs --engine reels-graph --frames all --out frames
   ```

   Then encode with sound as the [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound) says.

A spec may name its own copy of a style's template with `"template": "<file next to the spec>"`, as upstream allows. Keep the graph's axis labels short: they are about 25 px high and read small on a phone. Do that for words baked into a template: the map's "Arrived", "min" and "to go", and the graph's English number format (`6.8`, `6,800`). For Polish numbers, keep the graph's `decimals` at 0 and its values under 1,000, as the `graph-pl` sample does, or change the format in a copy.

## Make a 3D "what if" reel

The example in `styles/what-if-3d/engine/` is a finished 29.5 s film ("Could ancient armour stop a bullet?", 9 shots, 720×1280). Make a new one as its `method.md` says, in a copy of the `engine` folder in the workspace: write the question and the turn, plan a shot every 2 to 4 s, edit `src/shots.js` (`CAPTIONS`, `FADES`, `DURATION` and one function per shot). Then register the copy with `"build": {"tool": "reels", "style": "what-if-3d", "film": "<folder, from the engines folder>"}`, `"adapter": "seek"`, `"screenshot": "#stage"` and `"duration": "page"`, and render it like any engine. A frame takes about 4 s without a GPU; pass `--gpu` when the machine has one.

The 3D style renders at upstream's 720×1280 only, to keep a frame's cost down. For a 1080×1920 delivery, scale the frames up when encoding (for example `-vf scale=1080:1920:flags=lanczos` in FFmpeg) and say so to the client; there is no native 1080×1920 entry yet.

Every shot's `update(t)` must depend on `t` alone, because a render can start anywhere. The example's shot 7 kept the arrow's release point from the frames drawn before it; FrameMotion's copy works it out from the same moment every time (the one changed line). Copy that pattern, not the original one.

In FrameMotion, skip these steps of `method.md`: `setup.sh`, `npm install` and `render.mjs` (the engines folder installs three.js, GSAP and the fonts at exact versions, and `render-engine.mjs` renders), the Kokoro voice (FrameMotion's sound route makes the voice) and `words.py` (word times come from the voice through Whisper, as in FrameCut or the sound route). `captions.py` still turns a word list into `CAPTIONS`. The example is silent: its voice is not bundled.

## Rules for every style

**Words and fonts.** The kit's fonts are basic Latin subsets. When a spec has letters beyond it (ą, ę, ł, ś, ż …), the builder adds each face's Latin Extended subset from the engines folder's `@fontsource` packages, with its OFL text; the 3D style always gets it for its captions. Cyrillic, Greek or Vietnamese copy falls back to a system font. Only the graph has a Polish sample (`reels-graph-pl`); the minimal style (Poppins) and the 3D captions (Montserrat) get the same Latin Extended faces, but no Polish sample checks them yet, so look at a contact sheet of Polish copy before a full render.

**Safe area.** Upstream keeps text inside Instagram's uncovered area (`kit/anim.py`: 220 px from the top, 420 px from the bottom of 1920). FrameMotion's rule is the same or stricter: no word in the top 10% or the bottom 20% of a 9:16 frame. The 3D style's captions sit at 76 to 80% of the height, just inside it; keep faces and key props out of that band.

**Truth.** Numbers, places and claims come from the user. The 3D style's people and props are generic cartoons: no real person's likeness, no other company's logo. "The style" means the format (a question, a misconception, a turn, building examples and a payoff), not another creator's look.

**Frames.** Every frame is drawn from its time alone, in any order. For the graph and minimal styles the builder plays the GSAP timeline through once in small steps and then reaches every frame forward from 0, because overlapping tweens on one property (the minimal ball's squash and settle) otherwise drew a different ball depending on the frames drawn before; the test checks the hop frames forward, backward and alone. Known limit: in `reels-graph` and `reels-graph-pl`, most frames drawn after other frames differ from the same frame drawn first by one grey level in up to a few antialiased edge pixels of the text (Chromium's glyph cache). Nothing a viewer can see, and nothing after compression, so the order test leaves the graph out.

## What is here

| Path | What it is | State |
| --- | --- | --- |
| `LICENSE` | Upstream's MIT notice | unchanged |
| `kit/anim.py`, `kit/words.py`, `kit/package.json` | Upstream's shared builder helpers (spec loading and checks, sheets), word timing and its package list, kept for reference and for `spec.py` | unchanged |
| `kit/fonts/` | Inter, Inter Tight, JetBrains Mono and Poppins subsets with their OFL texts | unchanged |
| `styles/graph/`, `styles/map-route/`, `styles/minimal-line-art/`, `styles/hairline-tree/` (was `dan-koe`), `styles/voxel-build/` (was `minecraft`), `styles/ps1-low-poly/` (was `low-poly`) | Each style's `method.md` (its `SKILL.md`, renamed so no host loads it as a skill), `build.py` and `template.html`; `minimal-line-art` was `minimalistic-graphics` | unchanged |
| `styles/what-if-3d/` | The 3D explainer style, renamed from a creator's name to what it makes: `method.md`, `engine/` (the example film, `render.mjs`, `captions.py`) | unchanged except `engine/src/shots.js`, one line in shot 7, marked by a FrameMotion comment |
| `framemotion/spec.py` | Fills and checks a spec with the style's own `build.py` and prints it with its length | ours |
| `framemotion/samples/` | Specs for the registry's samples, English and Polish | ours |
| `README.md` (this file) | These notes | ours |

Not bundled: the stick-figure and breakdown skills (merged elsewhere, see above), `zach-3d-films` (an alias of the what-if-3d skill) and `kurzgesagt` (the flat-space style is covered by the Art engine's `art-flat-science`), `install.sh` and `kit/setup.sh` (they fetch GSAP from a CDN and run `npx` installers), the lockfile, the preview image and the upstream README. Every bundled file, its upstream path and SHA-256, and the changed file's current hash are in [`integrations/claude-animation-skills/source-manifest.json`](../../../../integrations/claude-animation-skills/source-manifest.json).

## Credit

claude-animation-skills: MIT, Copyright (c) 2026 Artem Novitckii. The fonts are not covered by that licence: they are SIL Open Font License 1.1 faces (Inter, Inter Tight, JetBrains Mono, Poppins, Pixelify Sans for the voxel-build captions, and Montserrat for the 3D captions), each with its OFL text; the Latin Extended subsets come from `@fontsource` packages installed from npm. three.js (MIT) and GSAP (its standard licence, free to use) are installed from npm and never bundled. All are named in FrameMotion's `NOTICE`.

## Notes on the three newer styles

- **Names.** `voxel-build` is upstream's `/minecraft`; the engine uses its own 16x16 textures drawn in code, no Mojang assets, logos or characters. Keep it that way, and do not call a film "Minecraft" in client copy.
- **Captions.** `voxel-build` draws its words in Pixelify Sans, a basic Latin face, so Polish letters (ą, ę, ł, ś, ż) fall back to a system monospace face; use plain Latin words there, or draw the words in the film's own type. `ps1-low-poly` takes letters, digits, spaces, dots and dashes on the station sign (a tiny pixel font).
- **Time and speed.** Both 3D styles draw each frame from its time alone (`hf-seek`). They need WebGL; on a Mac with a GPU the render is much faster than in the cloud's software renderer.
- **Another scene.** Both methods say to copy `template.html` next to the spec and point `"template"` at it; the spec's `template` field works as for the other styles.
