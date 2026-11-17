# varg motion styles in FrameMotion

Seven local motion skills from vargHQ/skills (vargai Inc., MIT), bundled in full in [`upstream/`](upstream/) at commit `ff940b67bc03a85d03f0fe33591ac59239eb8b84`; provenance, file hashes and what was left out are in [UPSTREAM.md](UPSTREAM.md) and [SHA256SUMS](SHA256SUMS).

| Need | Skill | Presets |
| --- | --- | --- |
| kinetic typography as art (type that moves with meaning) | [kinetic-type-art](upstream/kinetic-type-art/SKILL.source.md) | `assets/presets/` |
| seven complete formats (analog-horror site trailer, VHS bouncing logo, pixel runner on a CRT, wave wordmark, DAW one-shot music video, launch trailer, kinetic lyric video) | [motion-formats](upstream/motion-formats/SKILL.source.md) | `assets/presets/` |
| titles, lower thirds, end cards | [title-design](upstream/title-design/SKILL.source.md) | `assets/presets/` |
| beat transitions between shots | [transition-craft](upstream/transition-craft/SKILL.source.md) | `assets/presets/` |
| eight effects on existing footage as ffmpeg chains with HyperFrames and Remotion equivalents (glow, glitch, CRT, chromatic aberration, halftone, photocopy, zoom blur, wave) | [footage-effects](upstream/footage-effects/SKILL.source.md) | `assets/presets/` |
| maps, routes, globes and data charts in motion | [maps-and-data-motion](upstream/maps-and-data-motion/SKILL.source.md) | `assets/presets/` |
| animated captions | [caption-styles](upstream/caption-styles/SKILL.source.md) | `assets/presets/` |

FrameMotion's [type, title and format recipes](../../../references/type-title-and-format-recipes.md) and [transition, effect and data recipes](../../../references/transition-effect-and-data-recipes.md) summarise these skills for frame rendering; open the skill here when you need its full page or an exact preset.

## What FrameMotion changes

1. **Presets are values, not code to paste.** Read a preset's values (timings, eases, sizes, colours) into FrameMotion's motion contract and build with FrameMotion's engines or the HyperFrames and Remotion routes, at the film's fps and size.
2. **No varg.ai.** Every step runs locally. Ignore instructions to call varg.ai, its MCP servers or generators.
3. **Captions on a cut.** For subtitles on edited footage, FrameCut owns captions; these caption presets are for captions that are part of a motion piece.
4. **Footage effects on a cut** belong in FrameCut's edit when the user edits there; FrameMotion makes the motion layer and hands it over as in [From frames to a FrameCut motion request](../../../references/engine-contract.md#from-frames-to-a-framecut-motion-request).
