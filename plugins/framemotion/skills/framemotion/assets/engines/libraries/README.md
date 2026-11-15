# Library engines

Open-source animation libraries on FrameMotion's clock. The libraries are npm packages installed at exact versions in this folder's parent (`npm ci` in `assets/engines`), never copied into the plugin; each page here is ours and drives the library so that `seek(t)` alone decides the picture. Credits and pins: `NOTICE` and `integrations/sources.json`.

| Engine | Library | What it gives | Settings |
| --- | --- | --- | --- |
| `paper-shader` | Paper Shaders (Apache-2.0, Paper; Powered by Paper Shaders, shaders.paper.design) | moving backgrounds: mesh gradient, grain gradient, warp, god rays | `shader`, `look` (the library's own preset values, overridable), `speed`, `start` |
| `pixi-filter` | PixiJS filters on PixiJS 8 (MIT) | effects over a picture: shockwave, god rays with bloom, CRT screen, glitch | `effect`, `seed`, `title` |

Still to come in this pack: css-doodle (CSS pattern grids; its page is here but not registered yet), torph (text morphing), tsParticles (particles stepped from the start), p5.brush (natural brush strokes; its standalone build needs no p5.js).

## How each stays exact

- Paper Shaders: the shader's own animation loop is off (speed 0); `seek(t)` sets its time to `start + t·1000·speed` ms. The first frame waits until the canvas has its final size.
- PixiJS: the ticker never runs; `seek(t)` sets every time-driven value from `t` and renders once. The glitch's random slices come from `seed` through `withSeededRandom` (`library-kit.mjs`) and change 12 times a second.

## Limits

- Measured in a cloud container with software WebGL (2026-11-15). On a graphics card: NOT_RUN.
- `pixi-filter` works on its own test picture for now; putting it over a scene from another engine comes with the scene plan.
