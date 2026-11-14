# Photoreal three.js blocks

Photographic image quality for any three.js engine, rendered in the browser on the same seekable clock as type and boards. Own FrameCore Works code; the techniques follow Leonxlnx/room-at-dawn (MIT, Leon Lin; see `integrations/room-at-dawn/`). This is pack 1 of the photoreal engine; baked light, material library and props come later (see the own-engines plan).

| Block | What it does |
| --- | --- |
| `lens.mjs` | `subframePlan(frame, {fps, samples, shutter, aperture})`: n sub-frames per frame, each with a time inside the open shutter (stratified), a pixel jitter (Halton 2, 3) and a point on a round aperture (Halton 5, 7). `shearProjection(m, ...)` shifts the image by the jitter and keeps the focus plane still while the camera crosses the aperture. |
| `accum-camera.mjs` | `createAccumCamera({THREE, renderer, width, height}).render({scene, camera, frame, fps, samples, shutter, aperture, focus, prepare})`: averages the sub-frames into one linear HDR target. That one loop gives anti-aliasing, thin-lens depth of field and a real shutter (motion blur). `prepare(t)` is the engine's seek. |
| `film-grade.mjs` | `createFilmGrade({THREE, renderer, width, height}).render(hdr, look, {seed, target})`: bloom from a mip pyramid, exposure and white balance, vignette before the curve, tint by tonal range, saturation, contrast around mid grey, Uchimura's filmic curve, grain weaker in the highlights and a dither. Grain is seeded by the frame. `gradePixel()` is the same grade in JavaScript; a test holds the shader to it within one 8-bit step. |
| `demo/` | A steel plate, a glossy sphere and a small cube on a table in warm low light: a push-in, then a hold. Registered as `photoreal-demo`. |

## Settings that matter

- `samples`: 16 for a preview, 32 to 64 for delivery, up to 96 for shallow focus. Time grows linearly with samples.
- `aperture` (metres, lens radius): 0 is a pinhole (everything sharp); 0.005 to 0.02 is product photography; focus is the distance to the subject along the view axis.
- `shutter`: 0.5 is a 180° shutter; 0 freezes motion.
- `look`: start from `DEFAULT_LOOK`; keep `grain` at or below 0.02 for social video (compression eats more).

## Limits

- Light is from three.js lights and an environment map; baked global illumination is a later pack.
- The demo is a technical test scene, not a style; a film takes its look from the brief.
- Measured on 2026-11-14 in a cloud container with software WebGL (SwiftShader): 540×960, 32 samples, about 3.5 s per frame. A graphics card is far faster: not measured yet (NOT_RUN).
