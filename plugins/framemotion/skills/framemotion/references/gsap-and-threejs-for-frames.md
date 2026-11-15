# GSAP and three.js for frame rendering

Read this before writing GSAP or three.js code for a FrameMotion composition or engine. Both libraries are written for live web pages, where a running clock drives the animation. FrameMotion renders frames: each one is drawn by `seek(t)` from time alone, in any order, in a fresh browser. This page keeps the parts of the current API that matter for that and lists the outdated patterns models still reach for.

The versions FrameMotion pins are `gsap@3.15.0` (the [GSAP starter](../assets/gsap-motion-starter/README.md) and the engines package) and `three@0.187.0` (the engines package). The three.js notes were checked against r186 by their source; check anything marked as recent against the installed version before relying on it.

**Sources** (MIT, credited in `NOTICE` with the licence texts in `integrations/`; no file is copied into FrameMotion):
- [greensock/gsap-skills](https://github.com/greensock/gsap-skills) at `aed9cfd3277740755f6bfc1155c7aa645403b760` (Copyright (c) 2026 GreenSock). GSAP itself is a dependency under its own standard licence, which is free for commercial use but excludes building a no-code visual animation tool; FrameMotion does not build one.
- [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) at `0e181866f095b5f06d005133876e926515390d95` (Copyright (c) 2026 CloudAI-X).

**Related references:** the [engine contract](engine-contract.md) (seek, seed, one clock); [After Effects craft](after-effects-craft.md) for the frame-function rule underneath; [photoreal blocks](../assets/engines/photoreal/README.md) for anti-aliasing, depth of field, motion blur and the film grade in three.js; [library engines](../assets/engines/libraries/README.md).

## GSAP on a frame clock

Full API pages: [core](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-core/SKILL.md), [timeline](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-timeline/SKILL.md), [plugins](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-plugins/SKILL.md), [utilities](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-utils/SKILL.md), [performance](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-performance/SKILL.md).

### One paused timeline

- **One master timeline, created paused.** The renderer seeks it; nothing plays it. In an own engine that uses GSAP inside, keep one paused master timeline and have `seek(t)` call `master.seek(t)`. To place that engine in HyperFrames, register the timeline returned by `bindToGsap(engine, gsap)`: it is a new timeline that calls `engine.seek(t)`, not a way to attach an existing one ([engine contract](engine-contract.md)). Either way there is only one clock.
- **Place tweens with the position parameter,** not with `delay`: an absolute time (`1.5`), a label (`"reveal"`, `"reveal+=0.3"`), or relative to the previous tween (`"<"` same start, `">"` its end, `"<0.2"` 0.2 s after its start, `"-=0.2"` overlapping its end). Name sections with `addLabel()` and compute beat times from the beat table, so a change of tempo moves everything together.
- **Shared values as timeline defaults:** `gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: "power2.out" } })`. A timeline's length comes from its children; there is no timeline duration to set.
- **Nest timelines** for scenes (`master.add(scene, "scene2")`) and keep each scene's tweens local to it.
- **Finite repeats only.** `repeat: -1` has no end state to seek to; repeat a whole number of times that fills the scene, or write the loop as a function of time.

### State that survives any seek

- **Never put visual state in callbacks.** `onStart`, `onComplete` and `onUpdate` are for live pages: `seek()` skips callbacks by default, while `time()`, `progress()` and `totalTime()` fire them unless `suppressEvents` is passed, so a class added in `onComplete` may or may not be there depending on how the frame was reached. Put every visible change in a tween or a `set` at its time on the timeline.
- **`from()` and `fromTo()` apply their start values when they are created.** When several of them animate the same property of the same element, give the later ones `immediateRender: false`, or the first tween's end state is overwritten before it plays. A `from()` reads the element's current state as its end, so set the resting state in CSS first.
- **Relative values (`"+=20"`) and function values** are read once, the first time the tween renders. GSAP renders earlier tweens in order on a fresh seek, so this usually works, but absolute values computed from the parameters are easier to check: prefer them.
- **No unseeded randomness.** `gsap.utils.random()`, `gsap.utils.shuffle()`, a stagger with `from: "random"` and the random type of CustomWiggle use the browser's random, so two renders differ. Draw the values from FrameMotion's seeded random once, before building the timeline, and pass them as a function stagger (`stagger: i => order[i] * 0.05`) or as explicit values.
- **Fonts before measuring.** Wait for `document.fonts.ready` before splitting text (SplitText) or measuring anything, or line breaks differ between the preview and the render.

### Values and properties

- **Transform aliases** (`x`, `y`, `xPercent`, `yPercent`, `scale`, `rotation`, `rotationX`, `rotationY`, `skewX`) instead of a raw `transform` string: GSAP applies them in a fixed order (translation, scale, rotationX and rotationY, skew, then rotation last). Move with `x` and `y`, never with `left`, `top`, `width` or `height`, which force layout every frame.
- **`autoAlpha`** instead of `opacity` for fades: at 0 it also hides the element, so nothing invisible is left drawn.
- **CSS variables** animate directly (`"--hue": 180`), which lets one tween drive CSS and a canvas that reads the same variable.
- **SVG.** `svgOrigin` rotates or scales several SVG elements around one point in the SVG's own coordinates; use it or `transformOrigin`, never both. Rotation suffixes choose the direction: `"_short"`, `"_cw"`, `"_ccw"`.
- **Eases.** The built-in families (`power1` to `power4`, `back`, `elastic`, `expo`, `circ`, `sine`, `bounce`, each `.in`, `.out` or `.inOut`, and `"none"` for linear). For an exact curve from a design, CustomEase takes a cubic-bezier string or an SVG path. FrameMotion's own easing values are in [motion craft](motion-craft.md).
- **Helpers that are pure and safe:** `clamp`, `mapRange`, `normalize`, `interpolate` (numbers, colours, objects), `snap`, `wrap` and `wrapYoyo`. Omit the value to get a reusable function.

### Plugins

All GSAP plugins are free, including for commercial use, with no membership, key or private registry; register each one once with `gsap.registerPlugin()` before use.

| Plugin | Use in a render | Note |
| --- | --- | --- |
| SplitText | Split by line, word or character for reveals | After fonts load; splitting by line is the calmest ([type recipes](type-title-and-format-recipes.md)) |
| ScrambleText | Decrypt and scramble effects | Its characters are random: check two renders match, or write the scramble from a seeded function |
| DrawSVG | Stroke draw-on | Same result as a dash offset on `pathLength="1"` |
| MorphSVG | Shape morphs | Handles different point counts and the starting vertex, so shapes do not twist |
| MotionPath | Move along a path, optionally rotating with it | A camera or object path written once as SVG |
| CustomEase, CustomBounce, CustomWiggle | Exact eases, bounces and wiggles as curves | Keep the wiggle to its seedless types or check two renders match |
| Flip | Animating between two layouts | It measures the page: record both states before building the timeline, never during a seek |
| ScrollTrigger, ScrollSmoother, Observer, Draggable, Inertia, `quickTo` | Live interaction only | Not used in a render |

- **Check any plugin that measures or randomises** with the fresh-browser frame comparison FrameMotion's library tests use: render the same frames in two fresh browsers and in reverse order, and require identical pixels.
- **Accessibility belongs to web pages.** `gsap.matchMedia()` with `prefers-reduced-motion` shapes a live page; a rendered video always plays its full motion.

## three.js on a frame clock

Full API pages: [fundamentals](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-fundamentals/SKILL.md), [animation](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-animation/SKILL.md), [materials](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-materials/SKILL.md), [lighting](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-lighting/SKILL.md), [textures](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-textures/SKILL.md), [post-processing](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-postprocessing/SKILL.md), [shaders](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-shaders/SKILL.md), [geometry](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-geometry/SKILL.md), [loaders](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-loaders/SKILL.md), [performance](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-performance/SKILL.md).

### Time comes from `seek(t)`

- **No animation loop in a render.** `renderer.setAnimationLoop()` and the `Timer` class (which replaced the deprecated `Clock` in r183) are for live pages. In an engine, `seek(t)` sets every position, rotation, uniform and camera from `t` and the parameters, then calls `renderer.render()` once. A live preview may run a loop that calls the same `seek`.
- **Clips seek too.** For glTF or keyframe animation, set the mixer's absolute time (`mixer.setTime(t)`, or `action.time` within one clip) instead of adding frame deltas with `update(delta)`. Procedural changes to a bone go after the mixer has written its pose, because the mixer overwrites what was set before it.
- **Shader time is a uniform you set from `t`.** Under WebGPU, the built-in TSL `time` node advances with the live clock; for a render, feed a uniform from `seek(t)` instead.
- **Compile before the first frame.** Shaders build the first time a material is drawn under new conditions, which stalls that frame. Call `await renderer.compileAsync(scene, camera)` once after loading, and keep settings that are compiled into shaders (`transparent`, `side`, `blending`, `flatShading`, `vertexColors`) fixed during the film.
- **Reading pixels.** Create the renderer with `preserveDrawingBuffer: true` when the renderer copies the canvas after drawing; FrameMotion's photoreal blocks read their own render targets instead.
- **WebGPU.** `await renderer.init()` once, then render synchronously; the async render methods are deprecated since r181. Engines in FrameMotion use `WebGLRenderer` unless a brief needs WebGPU.

### Modules and loading

- **ES modules only.** Since r161 there is no `three.min.js`; import `three` as a module and addons from `three/addons/...` (not `three/examples/jsm/...`, which the standard import map does not resolve). FrameMotion engines load both from the pinned local package, never from a CDN at render time.
- **Renamed classes:** `HDRLoader` (was `RGBELoader`, r180), `USDLoader` (was `USDZLoader`, r179), `RenderPipeline` (was `PostProcessing`, r183).
- **Cloning a skinned model** needs `SkeletonUtils.clone(model)`; a plain `clone()` shares the skeleton, so every copy follows the original's bones.
- **Wait for every asset** (models, textures, environment, fonts) before reporting ready; use `loadAsync` and a loading manager.

### Colour and light

- **Colour spaces.** The output is sRGB by default (`renderer.outputColorSpace`; the old `outputEncoding` no longer exists). Colour textures need `texture.colorSpace = THREE.SRGBColorSpace`, or they render washed out. Data textures (normal, roughness, metalness, ambient occlusion, alpha, displacement) keep the default `NoColorSpace`.
- **Physical light units are always on.** Point and spot lights are in candela with inverse-square falloff, so useful values are in the hundreds (`new THREE.PointLight(0xffffff, 100, 20)`); an old intensity of 1 gives almost nothing. The `physicallyCorrectLights` and `useLegacyLights` switches are gone.
- **Environment light.** Load an HDR with `HDRLoader`, set `mapping = THREE.EquirectangularReflectionMapping`, and assign it to `scene.environment` (and `scene.background` if it should show); without the mapping it draws as a flat picture. The renderer prefilters it, so a manual PMREM step adds nothing. Dim it with `scene.environmentIntensity`; a material's `envMapIntensity` scales only its own map.
- **Shadows.** `THREE.PCFShadowMap` (already soft); `PCFSoftShadowMap` is removed in r187 (it only logs a warning and falls back). Tighten a directional light's shadow camera around the subject. A contact shadow under a product is a soft blob texture on a plane; three.js has no contact-shadow class.
- **Reflections from a cube camera:** hide the reflective mesh while the cube camera renders, or it reflects itself.

### Post-processing

- **Pass order.** Effects work in linear light; `OutputPass` applies tone mapping, exposure and the output colour space and ends the chain (it replaces the old gamma-correction pass). FXAA goes after `OutputPass` (it needs sRGB input); SMAA goes before it.
- **One render per frame.** A second `renderer.render()` after `composer.render()` clears the composer's result. Selective bloom uses a second composer and mixes its texture in.
- **Size the composer, not the pass.** `UnrealBloomPass` takes the full size and is resized by `composer.setSize()`. `FilmPass` takes `(intensity, grayscale)`; `SMAAPass` and `HalftonePass` take no size arguments since r175.
- **Film looks in FrameMotion** come from the photoreal [film grade](../assets/engines/photoreal/README.md) (bloom, filmic curve, grain seeded by the frame) rather than `FilmPass`, whose grain follows its own time value and is not tied to FrameMotion's seed.

### Geometry, materials and performance

- **Orthographic for isometric.** `OrthographicCamera` with equal x, y and z position gives a true isometric view; a perspective camera never does.
- **Thick lines** need `Line2` with `LineGeometry` and `LineMaterial`; `LineBasicMaterial.linewidth` is always 1 px in WebGL.
- **Stencil** settings on materials are ignored unless the renderer is created with `stencil: true`. Multiply and subtract blending need `premultipliedAlpha: true`.
- **A map added after the first render** stays invisible until `material.needsUpdate = true`.
- **Layers.** `layers.enable(1)` adds a layer; `layers.set(1)` replaces the mask and removes the object from layer 0, where the default camera and lights are.
- **Fewer draw calls:** merge static meshes that share a material, `InstancedMesh` for one geometry drawn many times, `BatchedMesh` for many geometries with one material. A transparent double-sided material draws each mesh twice; `forceSinglePass: true` makes it one.
- **Seed every placement.** Scatter instances with FrameMotion's seeded random, never `Math.random`, so every render places them the same way.
- **Dispose** geometries, materials and textures explicitly when an engine rebuilds a scene; disposing the object alone frees none of them.

## Rights

API facts and the outdated-pattern lists are used under the MIT licence, with credit in FrameMotion's `NOTICE`; the wording and the frame-rendering rules are written for FrameMotion, and each source's licence text is in `integrations/`. GSAP and three.js are dependencies at pinned versions, never copied into the package.
