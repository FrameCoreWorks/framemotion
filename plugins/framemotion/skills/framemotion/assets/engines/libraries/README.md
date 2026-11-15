# Library engines

Open-source animation libraries on FrameMotion's clock. The libraries are npm packages installed at exact versions in the parent folder (`npm ci` in `assets/engines`), never copied into the plugin; each page here is ours and drives its library so that `seek(t)` alone decides the picture. Credits and pins: `NOTICE` and `integrations/sources.json`.

| Engine | Library | What it gives | Settings |
| --- | --- | --- | --- |
| `paper-shader` | Paper Shaders (Apache-2.0, Paper; Powered by Paper Shaders, shaders.paper.design) | moving backgrounds: mesh gradient, grain gradient, warp, god rays | `shader`, `look` (the library's own preset values, overridable), `speed`, `start` |
| `pixi-filter` | PixiJS filters on PixiJS 8 (MIT) | effects over a picture: shockwave, god rays with bloom, CRT screen, glitch | `effect`, `seed`, `title` |
| `css-doodle` | css-doodle (MIT, Yuan Chuan) | CSS pattern grids with random values fixed by a seed: turning tiles, breathing rings, or your own rules | `doodle`, `rules`, `seed` |
| `torph-text` | torph (MIT, Lochie Axon) | words that morph into each other letter by letter (shared letters slide, the rest fade) | `words`, `hold`, `morph`, `size` |
| `tsparticles` | tsParticles slim (MIT, Matteo Bruni) | confetti, drifting dust, a network of linked points | `preset`, `options`, `seed`, `steps` |
| `p5-brush` | p5.brush standalone (MIT, Alejandro Campos Uribe); p5.js is not used | a drawing that builds itself: pencil lines, watercolour fills, hatching | `drawing`, `seed` |

## How each stays exact

- **Paper Shaders**: the shader's own loop is off (speed 0); `seek(t)` sets its time to `start + t·1000·speed` ms. The first frame waits until the canvas has its final size.
- **PixiJS**: the ticker never runs; `seek(t)` sets every time-driven value from `t` and renders once. Random glitch slices come from `seed` (`withSeededRandom` in `library-kit.mjs`) and change 12 times a second.
- **css-doodle**: random values come from the `seed` attribute. The page waits until the grid stops rebuilding, then `seek(t)` pauses every CSS animation, in the doodle's shadow root too, and sets it to `t`. The registry marks it `"css_animations": "seeked"`, so the renderer does not jump those animations to their end when it takes the screenshot. Your own `rules` must animate with CSS animations only; css-doodle functions that load fonts or files from the web cannot work offline (the renderer blocks them and fails the render).
- **torph**: one change at a time is rebuilt from scratch on every seek (previous word drawn at once, then the update), its Web Animations paused and set to the time since the change began.
- **tsParticles**: a simulation, so the library's frame loop is replaced by ours and its random numbers come from the seed; `seek(t)` steps it from the start in fixed steps (`steps` per frame) and a backwards seek starts it over. tsParticles draws through an OffscreenCanvas, so each seek waits two page updates (four after a restart) before the picture is read.
- **p5.brush**: every seek clears the paper and draws the whole picture again from the same seed; strokes are revealed by a clip that grows along them, so a stroke's grain never changes while it is drawn.

## Limits

- Measured in a cloud container with software WebGL (2026-11-15): 0.05 to 1.1 s per frame. On a graphics card: NOT_RUN.
- `pixi-filter` works on its own test picture; laying it over a scene from another engine comes with the scene plan.
- css-doodle `rings`: after a jump backwards a frame can differ from the first render of the same frame by one brightness step in a few anti-aliased edge pixels (Chromium rasterisation of transformed borders). Frames rendered in order repeat exactly.
- tsParticles: rendering frame 300 alone costs 300 frames of simulation (fast, but not free); render in order for long films.
- Fonts are the system's (`DejaVu Sans` in the cloud); a delivery renders on one machine.
