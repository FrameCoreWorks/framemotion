# Blender kit

Thirteen of the 28 Blender guides from [EL4CTEO/blender-skills](https://github.com/EL4CTEO/blender-skills) at commit `9e7e04a603c125a0d17447ab97112fa70a865067` (release 1.3.2), MIT, Copyright (c) 2026 EL4CTEO ([LICENSE](LICENSE)), with their `bpy` scripts. Each guide's text and scripts are unchanged; only the file name `SKILL.md` became `GUIDE.md`, so they are reference pages read by FrameMotion's one skill and never register as skills of their own. They target Blender 5.x.

Use it for the Blender route in [3D and Blender](../../references/workshop/3d.md): a hero shot whose realism three.js does not give (glass, fabric, liquid, a product in close-up, contact shadows, depth of field), or a stylised toon look. Text and end cards stay in code; the Blender frames are composited with FFmpeg or under an HTML page.

| Guide | For |
| --- | --- |
| [`blender-core`](upstream/blender-core/GUIDE.md) | Running Blender headless from a script, the execution model every other guide assumes; start here |
| [`blender-workflow-recipes`](upstream/blender-workflow-recipes/GUIDE.md) | End-to-end recipes (product turntable, hero shot, stylised scene) that chain the others |
| [`blender-scene-setup`](upstream/blender-scene-setup/GUIDE.md) | Real-world scale, units, collections and a scene audit |
| [`blender-animation`](upstream/blender-animation/GUIDE.md) | Keyframes, curves, constraints, cameras on paths, and a loop check |
| [`blender-lighting-lookdev`](upstream/blender-lighting-lookdev/GUIDE.md) | Light rigs, HDRI, cameras, depth of field, look-dev |
| [`blender-pbr-materials`](upstream/blender-pbr-materials/GUIDE.md), [`blender-texturing`](upstream/blender-texturing/GUIDE.md) | Physically based and procedural materials |
| [`blender-rendering`](upstream/blender-rendering/GUIDE.md) | Cycles, EEVEE or Workbench; presets, denoising, colour management (AgX, Khronos PBR Neutral), output |
| [`blender-stylized-npr`](upstream/blender-stylized-npr/GUIDE.md) | Toon shading, outlines, Grease Pencil looks |
| [`blender-geometry-nodes`](upstream/blender-geometry-nodes/GUIDE.md) | Procedural geometry, instancing, simulation zones |
| [`blender-simulation`](upstream/blender-simulation/GUIDE.md) | Rigid bodies, cloth, fluids, particles |
| [`blender-time-of-day`](upstream/blender-time-of-day/GUIDE.md), [`blender-weather-fx`](upstream/blender-weather-fx/GUIDE.md) | Sky, sun, atmosphere and moods; rain, snow, fog, wet surfaces |

## Running it

Blender is not part of FrameMotion and is not installed by it. Render on the user's Mac, where Blender is installed (the Creative Studio environment), through the render queue or a terminal:

```bash
blender -b --factory-startup --python upstream/blender-rendering/scripts/render_batch.py -- --preset preview --frames 1-48 --out //render/preview
```

Each script's own help (`-- --help`) lists its options; the guides give the calls. The scripts make no network requests and write only where they are told to. Where a guide suggests downloading an HDRI or textures, fetch them only with the user's yes and a recorded licence (Open Assets does this), never from inside a script. A cloud session without Blender cannot render or test this route: say so (NOT_RUN) instead of claiming a result. Render a preview (`--preset preview`, Workbench or EEVEE) and a contact sheet before a final Cycles render, which is slow.

## Left out

The other 15 guides (rigging, clothing, hair, sculpting, retopology, baking, facial shape keys, hard-surface modelling, environment kits, game optimisation, export pipelines, add-on development, pipeline automation, asset QA, video editing: editing belongs to FrameCut), the upstream installers, tests and tools. The mg-styles `04-3d-render` film is not included: it needs Blender to make its frames, which no cloud session here can run or check, and an HDRI whose source upstream does not record. It can follow on the Mac, rebuilt on this kit.
