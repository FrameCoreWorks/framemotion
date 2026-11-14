# gl-transitions engine

236 ready transitions between two pictures (wipes, dissolves, zooms, page curls, glitches, shapes), each a pure function of time. The shaders in [`shaders/`](shaders/) are unchanged copies of [gl-transitions](https://github.com/gl-transitions/gl-transitions) at commit `5a8788c` (MIT, two BSD; every file names its author and licence; see `integrations/gl-transitions/`). [`transition.mjs`](transition.mjs) and [`index.html`](index.html) are FrameMotion's wrapper.

## Use it

```bash
node ../kit/render-engine.mjs --engine gl-transition \
  --params '{"transition":"BandWipe","settings":{"bands":6},"length":0.8,"from":"pics/a.jpg","to":"pics/b.jpg"}' \
  --frames all --out frames
```

| Setting | Meaning |
| --- | --- |
| `transition` | A file name in `shaders/` without `.glsl` (default `BandWipe`). The first lines of each file describe it and list its tags. |
| `settings` | The shader's own values by name, such as `{"bands": 6, "vertical": true}`; each `uniform … // = default` line in the file is one. An unknown name fails. |
| `hold`, `length` | Seconds on each picture before and after (0.25), and seconds the transition takes (1). The engine lasts `2 × hold + length`. |
| `ease` | `inOut` (default) or `linear` progress. |
| `from`, `to` | Pictures inside the engines folder, scaled to cover the frame. Without them two built-in pictures are drawn in code. |
| `width`, `height`, `fps` | Frame size (1080 × 1920) and rate (30). |

Inside a HyperFrames composition, import `createTransition` from `transition.mjs`, pass two canvases or images and the shader source, and register `bindToGsap(made.engine, gsap)`. Each shader's settings become constants, so a frame is exact and seeks in any order.

## Limits

- `DisplacementMap` and `LumaWipe` need an extra texture (a displacement or luma map); they are not wired yet and fail with a clear message.
- `DreamyZoom` and a few others pass through a bright flash at mid-point by design; check a contact sheet before choosing.
- A test compiles all 236 in software WebGL and renders the first, middle and last frames.
