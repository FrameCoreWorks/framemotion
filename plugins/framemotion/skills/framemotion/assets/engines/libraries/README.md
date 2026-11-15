# Library engines

Open-source animation libraries on FrameMotion's clock. The libraries are npm packages installed at exact versions in the parent folder (`npm ci` in `assets/engines`), never copied into the plugin; each page here is ours and drives its library so that `seek(t)` alone decides the picture. Credits and pins: `NOTICE` and `integrations/sources.json`.

| Engine | Library | What it gives | Settings |
| --- | --- | --- | --- |
| `paper-shader` | Paper Shaders (Apache-2.0, Paper; Powered by Paper Shaders, shaders.paper.design) | moving backgrounds: mesh gradient, grain gradient, warp, god rays | `shader`, `look` (the library's own preset values, overridable), `speed`, `start` |
| `pixi-filter` (experimental) | PixiJS filters on PixiJS 8 (MIT) | effects over a picture: shockwave, god rays with bloom, CRT screen, glitch; for now over its own test picture | `effect`, `seed`, `title` |
| `css-doodle` | css-doodle (MIT, Yuan Chuan) | CSS pattern grids with random values fixed by a seed: turning tiles, breathing rings, or your own rules | `doodle`, `rules`, `seed` |
| `torph-text` | torph (MIT, Lochie Axon) | words that morph into each other letter by letter (shared letters slide, the rest fade) | `words` (a list, up to 50 texts of 60 characters), `hold`, `morph` (at most `hold`), `size` |
| `tsparticles` | tsParticles slim (MIT, Matteo Bruni) | confetti, drifting dust, a network of linked points, on a colour or as a transparent overlay | `preset`, `options` (tsParticles 4 options, colours under `paint.color`), `seed`, `steps`, `background` |
| `p5-brush` (experimental) | p5.brush standalone (MIT, Alejandro Campos Uribe); p5.js is not used or installed | a drawing that builds itself: pencil lines, watercolour fills, hatching; one ready drawing so far | `drawing`, `seed` |

## How each stays exact

- **Paper Shaders**: the shader's own loop is off (speed 0); `seek(t)` sets its time to `start + t·1000·speed` ms. The first frame waits until the canvas has its final size.
- **PixiJS**: the ticker never runs; `seek(t)` sets every time-driven value from `t` and renders once. Random glitch slices and CRT noise come from `seed` (`withSeededRandom` in `library-kit.mjs`) and change 12 and 24 times a second, counted from the frame number.
- **css-doodle**: random values come from the `seed` attribute. The page waits until the grid stops rebuilding, then `seek(t)` pauses every CSS animation, in the doodle's shadow root too, and sets it to `t`. The registry marks it `"css_animations": "seeked"`, so the renderer does not jump those animations to their end when it takes the screenshot. Your own `rules` must animate with CSS animations only; css-doodle functions that load fonts or files from the web cannot work offline (the renderer blocks them and fails the render).
- **torph**: one change at a time is rebuilt from scratch on every seek (previous word drawn at once, then the update), its Web Animations paused and set to the time since the change began.
- **tsParticles**: a simulation, so the library's frame loop is replaced by ours and its random numbers come from the seed; `seek(t)` steps it from the start in fixed steps (`steps` per frame) and a backwards seek starts it over. The library draws into our own OffscreenCanvas, which `seek` copies onto the page's canvas over the background it paints, so nothing waits for a page update (checked: frame 61 the same in 16 of 16 parallel renders).
- **Sizes**: every engine scales its pixel sizes with the frame (shorter side / 540): a 1080×1920 reel looks like the 540×960 preview, with more particles in tsParticles.
- **p5.brush**: every seek clears the paper and draws the whole picture again from the same seed; strokes are revealed by a clip that grows along them, so a stroke's grain never changes while it is drawn.

## Limits

- Measured in a cloud container with software WebGL (2026-11-15): 0.05 to 1.1 s per frame at 540×960, 0.9 to 3.4 s at 1080×1920. On a graphics card: NOT_RUN.
- `pixi-filter` works on its own test picture and `p5-brush` has one drawing: both are experimental until the scene plan feeds them pictures and drawings from other engines.
- css-doodle `rings`: a frame can depend slightly on the frames drawn before it in the same browser (20 to 117 edge pixels of 518,400, up to 2 brightness steps; Chromium rasterisation of transformed borders; rebuilding the doodle did not help). Invisible to the eye, but render a delivery in order from frame 0: then every run gives the same frames. `tiles` has no such limit.
- tsParticles: rendering frame 300 alone costs 300 frames of simulation (frame 599 in 1.7 s); render in order for long films.
- `p5-brush` and css-doodle `tiles` start blank at frame 0 by design (registry `flat_frames`); the renderer does not count that as a failed draw.
- Install with `npm ci --ignore-scripts`: `.npmrc` (`legacy-peer-deps`) keeps p5.js, a peer of p5.brush that the standalone build does not use, out of `node_modules`.
- Fonts are the system's (`DejaVu Sans` in the cloud); a delivery renders on one machine.
