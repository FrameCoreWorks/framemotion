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

The builder (`lineart` in `engines/kit/builders.mjs`) bundles an example's TypeScript entry with the esbuild already pinned in `assets/engines`, and loads the page with upstream's own `?debug` mode, which advances the scene in exact 1/60 s steps. `renderFrame(t)` steps forward to `t`; to go back it rebuilds the scene from zero and steps again. `Math.random` is replaced by a seeded generator that restarts with each rebuild, so the villagers, birds and ripples are the same in any frame order. The card fills the frame (`xMidYMid slice`, so a 2:1 scene loses a little at the top and bottom in 16:9; `build.fit: "meet"` keeps it whole), and the clock and hint are hidden.

- `fps` must divide 60 (30 or 60).
- `build.query` passes upstream's own settings: `start` (time of day, 0 to 1, 0.5 is noon), `tau` (a fixed time), `day` (seconds per full day), `life` (people's pace).
- `build.seed` changes the random arrivals.
- The entries set `"raster": "cpu"`: without a GPU, Chromium otherwise switches the ink strokes between its emulated-GPU and CPU rasterisers depending on what it drew before, which moves edge pixels between frame orders.
- Time: the walker renders at about 0.6 s per frame, the village at about 4 s per frame at 1920×1080 in a cloud container with software rendering (2026-11-16). Going back in time costs a replay from zero. Graphics card and Mac: NOT_RUN.

## Your own scene

Copy `examples/walker/` to `examples/<name>/` (the imports `../../lib/*.ts` then still work), change the drawing, and register it with `"build": {"tool": "lineart", "example": "<name>", "mount": "#stage"}`. Follow `docs/method.md`: show one figure or corner first, then build the rest. Clicks and the pointer do nothing in a render, so a reaction that should be in the film has to be started from time.

The scenes carry no titles or captions (the village has its own Japanese shop signs); titles and captions come from another engine on the same timeline.
