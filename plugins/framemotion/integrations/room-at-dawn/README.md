# room-at-dawn: techniques for the photoreal engine

Source: [Leonxlnx/room-at-dawn](https://github.com/Leonxlnx/room-at-dawn/tree/aab8be218aa051bbb2e22b82916962619c951747), commit `aab8be218aa051bbb2e22b82916962619c951747`, Copyright (c) 2026 Leon Lin, MIT ([licence](LICENSE)). Read at the source on 2026-11-14; nothing of it was run.

FrameMotion's photoreal blocks (`skills/framemotion/assets/engines/photoreal/`) are our own code written after its techniques: sub-frame accumulation with Halton pixel jitter, a thin-lens aperture and projection shear around the focus plane, a 180° shutter; and a grade with bloom from a mip pyramid, vignette before the curve, tonal-range tint, Uchimura's filmic curve, highlight-weighted grain and a dither. No file of it is copied.

Left out on purpose: its helper server (it runs ffmpeg with arguments sent from the browser page), the room scene and its geometry, the HDR10 path, and all sound (CC BY and public domain recordings). Baked per-vertex light and the material patch are planned for a later pack.
