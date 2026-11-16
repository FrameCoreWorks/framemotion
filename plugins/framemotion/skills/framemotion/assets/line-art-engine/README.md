# Line-art engine

Hand-inked line art in SVG: thin ink on paper, people and animals who walk, run, cycle and react, and scenes with wind, lit windows and a day-night cycle. Bundled from [JDhruv14/line-art-animation](https://github.com/JDhruv14/line-art-animation/tree/c43d698913cf0ad44f984c7ae14c5348010594d3) (MIT, Copyright (c) 2026 JDhruv14, commit `c43d698`), unchanged; the file list and hashes are in `integrations/line-art-animation/source-manifest.json`.

| Path | What it is |
| --- | --- |
| `lib/ink.ts` | The pen: open strokes, limbs, shapes, blots, the ink-edge filter, and `run(draw)`, the loop. |
| `lib/gait.ts` | Walking and running from foot plants: hips rise over each step, feet do not slide. |
| `lib/motion.ts` | Springs, pendulums, wobble, easing, seeded random, pointer wind. |
| `lib/daynight.ts` | Sky, paper and ink colours over a day. |
| `examples/walker/` | One figure in about 150 lines: the smallest complete example. |
| `examples/village/` | A full scene: a Japanese street by a canal from dawn to night, with villagers, a boat, a cat, birds and lit windows. |
| `docs/method.md` | Upstream's method (its SKILL.md, renamed so no host loads it as a skill): how people judge this work and the workflow. Read it before building. |
| `references/` | Style, motion, scenes, matching a reference clip, verification and video. |
| `scripts/clip.ts`, `scripts/frames.sh` | Tools for measuring a reference clip with ffmpeg (feet positions, frames with a grid). |

## Registered films

| Id | What | Size |
| --- | --- | --- |
| `lineart-walker` | The walker example: a man with a briefcase, 12 s. | 1920×1080, 30 fps |
| `lineart-village` | The village from 16:33 to about 21:00 in 20 s (`start=0.69`, `day=108`): sunset, lamps and windows come on. | 1920×1080, 30 fps |

## How FrameMotion renders it

The builder (`lineart` in `engines/kit/builders.mjs`) bundles an example's TypeScript entry with the esbuild already pinned in `assets/engines`, and loads the page with upstream's own `?debug` mode, which advances the scene in exact 1/60 s steps. `renderFrame(t)` steps forward to `t`; to go back it rebuilds the scene from zero and steps again. `Math.random` is a seeded generator while the scene runs, restarted with each rebuild, so the villagers, birds and ripples are the same in any frame order. Each frame is the scene's SVG drawn as one image into a canvas (`#fm-canvas`), and that canvas is what the renderer captures: a screenshot of the live page depended on which parts the browser had repainted before (up to a few thousand pixels of the canal water moved by a few levels), while one whole-image draw repeats byte for byte in any order and across runs.

- Framing: the scene fills the frame with `xMidYMid slice`. A 2:1 scene in 16:9 loses its sides, about 5.6% on each (in the village, the bath-house chimney at the right edge is cut). `build.fit: "meet"` keeps the whole scene, with empty (transparent, black in an MP4) bands above and below.
- `fps` must divide 60 (30 or 60).
- `build.query` passes upstream's own settings: `start` (time of day, 0 to 1, 0.5 is noon), `tau` (a fixed time), `day` (seconds per full day), `life` (people's pace).
- `build.seed` (a whole number from 1 to 2147483646) changes the random arrivals.
- Fonts: the village's shop signs (白梅酒, 茶, ゆ, 松湯 and others) use the computer's Japanese fonts (upstream names Hiragino Mincho, Yu Mincho and Noto Serif JP); none is bundled. On a Mac they come out in Hiragino, in a Linux container in whatever Japanese font is installed (a sans serif in the cloud test), and without any Japanese font as empty boxes. Check the signs in a control frame on the machine that renders the film, or replace them in your own scene.
- Time: the walker renders at about 0.6 s per frame, the village at about 1.5 to 4 s per frame at 1920×1080 in a cloud container with software rendering (2026-11-16). Going back in time costs a replay from zero. Graphics card and Mac: NOT_RUN.

## Upstream instructions in FrameMotion

`docs/method.md` and `references/` are upstream's text, unchanged. Where they name a tool that is not in this package, use the FrameMotion route:

| Upstream says | In FrameMotion |
| --- | --- |
| Copy `lib/` into a Vite + TypeScript project; `npm run dev`, `npm run build`, `npm run typecheck` | Nothing to set up: write the scene in `examples/<name>/`; the builder bundles it with esbuild (no type check). |
| `node scripts/capture.ts <url?debug> ...` for frames or a video | `node kit/render-engine.mjs --engine <id> --frames all --out DIR` from `assets/engines`, then ffmpeg (see `references/video.md` for the encode settings). |
| Download a reference clip from X through its CDN (`references/matching.md`) | Use a clip the user supplies; FrameMotion's reference-breakdown module reads it shot by shot. |
| `scripts/clip.ts` and `scripts/frames.sh` | Bundled and usable as they are: they read a local clip with ffmpeg and write nothing else. `clip.ts` needs Node 22.18 or later (it runs TypeScript directly); the engines need Node 20. |

## Your own scene

Copy `examples/walker/` to `examples/<name>/` (the imports `../../lib/*.ts` then still work), change the drawing, and register it with `"build": {"tool": "lineart", "example": "<name>", "mount": "#stage"}`. Follow `docs/method.md`: show one figure or corner first, then build the rest. Clicks and the pointer do nothing in a render, so a reaction that should be in the film has to be started from time.

The scenes carry no titles or captions (the village has its own Japanese shop signs); titles and captions come from another engine on the same timeline.
