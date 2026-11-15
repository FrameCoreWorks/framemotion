# Pixel engine

Pixel art effects drawn in code: fire, explosions, water, ice, lightning, sci-fi, melee hits with a character who winds up, freezes on contact and recovers, impacts, projectiles, spawn and death, arcane, holy, shadow, status, nature, weather, UI pops, pickups, screen transitions and critters. The engine is [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) 0.3.0 at `a84159688af3ca37a4be05a0d422b94451b2e24e` (MIT, Copyright (c) 2026 Patch and Hugo Duprez; [LICENSE](LICENSE), [NOTICE.md](NOTICE.md)), the commit FrameCore Works Toolbox reviewed, bundled unchanged in its own layout except one marked step in `method.md` (copy this folder instead of cloning the default branch). Its method is `method.md` (the upstream `SKILL.md`), `docs/AUTHORING.md` and `docs/CATALOG.md`; FrameMotion's summary of the craft is [pixel VFX craft](../../references/pixel-vfx-craft.md).

## Pick an effect

`docs/CATALOG.md` lists all 244 effects by category, and `node tools/list.mjs <words>` (run in this folder) searches them. Each effect is one file, `src/fx/<category>/<name>.js`, with its size, length, loop and options in its `meta`. Start from a ready effect with other options (a `palette`, a `seed`, `flip`, `angle`, `light` and the effect's own knobs) before drafting a new one.

The registry has four samples:

| Registry id | Effect | Film |
| --- | --- | --- |
| `pixel-torch` | `fire/torch`, a looping wall torch | 1:1, two loops |
| `pixel-big-explosion` | `explosions/big-explosion` on the stone floor backdrop | 16:9, one shot |
| `pixel-level-up` | `ui/level-up` | 9:16, one shot |
| `pixel-slash-wipe` | `transitions/slash-wipe`, a full-screen transition (frames 24 and 25 are one colour by design, listed as `flat_frames`) | 16:9 |

## Put an effect in a film

Register it in `engines/engines.json` like the `pixel-*` entries: `"build": {"tool": "pixel", "fx": "<category>/<name>"}`, `"adapter": "renderFrameAt"`, `"capture": "#c"`, `"duration": "page"`, and the film's `size` and `fps`. Optional `build` fields:

- `options`: the effect's options, as in upstream's `--opts` (`{"palette": ["#102", "#215", "#43a", "#8cf", "#fff"]}`).
- `seed`: another take of the same effect.
- `bg`: the backdrop, `dark` (default for most), `ground`, `sky`, `light`, `black`, or `none` for a transparent background.
- `actor`: `false` hides the stand-in character that acts the melee and status effects.
- `scale`: whole screen pixels per effect pixel. By default the effect fills about 60% of the film's height, and a full-screen transition fills the frame. A large effect (300 px high, such as the big explosion) gets only 2× that way, which reads small on a phone: set `scale` to 3 or more, as `pixel-big-explosion` does.
- `seconds`: the film's length. By default two loops of a looping effect, or a one-shot plus half a second. Every frame replays the effect from 0, so the work grows with the square of the length: a few seconds cost nothing, a 30-second loop takes minutes. For a long background loop, render one loop and repeat it when encoding.

Then render from the `engines` folder, a contact sheet first:

```bash
node kit/render-engine.mjs --engine pixel-torch --frames 0,15,30,45 --out frames
node kit/render-engine.mjs --engine pixel-torch --frames all --out frames
```

FrameMotion's player (`framemotion/player.js`) draws each frame as a pure function of its time: a fresh effect with the same seed, stepped at the effect's own frame rate from 0, over its backdrop, then scaled up with whole pixels and no smoothing. The motion is upstream's: the steps are the same as in its own renders.

## Sprite sheets, GIFs and new effects

Upstream's tools are bundled and need only Node (ffmpeg for GIF and MP4): run them in a workspace copy of this folder, as `method.md` says. `node tools/render.mjs fire/torch` writes a contact sheet, `node tools/sheets.mjs` sprite sheets with Aseprite-style JSON for Godot, Unity or Phaser, `node tools/check.mjs` checks an effect for spills, seams, unseeded randomness and slow frames, `node tools/new.mjs` starts a new effect. In FrameMotion, skip the first step of `method.md` (cloning the repository): this folder is that checkout at the reviewed commit. New effects go in the workspace copy, never in this folder.

## Rules

**Pixels stay pixels.** Keep whole-pixel scales; a film scaled by a fraction blurs or doubles some rows. A pixel effect over footage or a smooth film goes on its own layer at a whole scale.

**Words.** The effects' text (LEVEL UP, numbers) uses upstream's own 3×5 and 5×7 pixel fonts in `src/core/font.js`: capitals, digits and a few signs, no Polish letters. The builder stops when a text option has a letter the fonts lack (they would draw a space), so write Polish words in the film's own type, outside the effect.

**Licence.** The effects and their renders may be used commercially (MIT). The Patch Pixel font in upstream's gallery is Patch's own and is not bundled.

## What is here

| Path | What it is | State |
| --- | --- | --- |
| `LICENSE`, `NOTICE.md` | Upstream's MIT notice and its credits to Hugo Duprez (Sprite Fusion) and rehan-remade (Hollow Crown) | unchanged |
| `method.md` | The upstream `SKILL.md`, renamed so no host loads it as a skill | unchanged except step 1, marked by a FrameMotion comment |
| `docs/AUTHORING.md`, `docs/CATALOG.md` | How to make an effect, and the list of all 244 | unchanged |
| `src/` | The core (frames, painter, particles, simulation, actor, act, rig, fonts) and the effects in 21 categories | unchanged |
| `tools/` | Render, check, list, sheets, montage, compare and act tools | unchanged |
| `package.json` | Marks the folder as ES modules for Node | unchanged |
| `framemotion/` | FrameMotion's player (`player.html`, `player.js`) | ours, adapted from upstream's `tools/lib/fxlib.mjs` with credit |
| `README.md` (this file) | These notes | ours |

Not bundled: `gallery/` with the Patch Pixel font, `tools/build-gallery.mjs` and `tools/serve.mjs` (they build and serve that gallery), `docs/readme/` (12 MB of showcase GIFs), the upstream README, `package-lock.json` and `.claude-plugin/`. Every bundled file with its upstream path and SHA-256 is in [`integrations/pixelfx/source-manifest.json`](../../../../integrations/pixelfx/source-manifest.json).
