# threejs-skills in FrameMotion

Thirteen three.js skills by CloudAI-X, bundled in full in [`upstream/`](upstream/) at commit `0e181866f095b5f06d005133876e926515390d95` (Copyright (c) 2026 CloudAI-X, MIT, [licence](upstream/LICENSE)). Written for three.js r186. Knowledge only: nothing to install or run.

## When FrameMotion reads it

Any three.js scene in an engine (Anatomy, Cutaway, Lemo, Reels and others), a HyperFrames composition or the Remotion `@remotion/three` route, when the topic goes beyond the [frame summary](../../../references/gsap-and-threejs-for-frames.md). Open the one page you need:

| Topic | Page |
| --- | --- |
| renderer, scene, camera, colour management | [threejs-fundamentals](upstream/skills/threejs-fundamentals/SKILL.source.md) |
| geometry, instancing | [threejs-geometry](upstream/skills/threejs-geometry/SKILL.source.md) |
| materials, PBR, textures | [threejs-materials](upstream/skills/threejs-materials/SKILL.source.md), [threejs-textures](upstream/skills/threejs-textures/SKILL.source.md) |
| lights and shadows | [threejs-lighting](upstream/skills/threejs-lighting/SKILL.source.md) |
| animation mixer, skinned models | [threejs-animation](upstream/skills/threejs-animation/SKILL.source.md) |
| GLTF, Draco, KTX2 | [threejs-loaders](upstream/skills/threejs-loaders/SKILL.source.md), [threejs-asset-pipeline](upstream/skills/threejs-asset-pipeline/SKILL.source.md) |
| shaders, post-processing | [threejs-shaders](upstream/skills/threejs-shaders/SKILL.source.md), [threejs-postprocessing](upstream/skills/threejs-postprocessing/SKILL.source.md) |
| performance | [threejs-performance](upstream/skills/threejs-performance/SKILL.source.md) |
| pointer and raycasting (web only), React Three Fiber | [threejs-interaction](upstream/skills/threejs-interaction/SKILL.source.md), [threejs-react-three-fiber](upstream/skills/threejs-react-three-fiber/SKILL.source.md) |

## What FrameMotion changes

1. **Version.** FrameMotion's engines pin `three` 0.187.0 (`assets/engines/package.json`); the pages describe r186. Before following an API detail, check it against the version the project actually installs.
2. **Time, not the clock.** For a video, render one frame per time value: no `THREE.Clock`, `setAnimationLoop` or `mixer.update(delta)` from wall time; set `mixer.setTime(t)` and every uniform from `t`, with seeded randomness, so frame N is the same on every run.
3. **No live network.** Models, textures and HDRIs come from the project or a licensed source recorded in the asset notes, never from a hot-linked URL at render time.
4. **React Three Fiber** is for web deliverables or an existing R3F project; FrameMotion's engines are plain three.js.
