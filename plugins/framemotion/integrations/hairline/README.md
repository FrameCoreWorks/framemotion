# hairline: decision map

Reviewed 2026-10-26 at [`37d2e78`](https://github.com/lucasmarkes/hairline/tree/37d2e78dcb333ab30c3338e28ed4a690364ea014) (package `@lucasmarkes/hairline` 0.5.1, MIT, Copyright (c) 2026 Lucas Marques, [licence](LICENSE)) after the owner sent the repository and chose option 3: a registry entry, the method restated, and a seekable video kit written for Studio. The repository was read as data; none of its scripts was run. No file of it is copied into the video kit except the licence. Since FrameMotion 0.4.0 the whole repository (the web original) is also bundled byte for byte in `skills/framemotion/assets/library/hairline/` for web figures (hashes in `source-manifest.json` here).

| Part | Decision | Where in Studio |
| --- | --- | --- |
| Ten drawing rules (fixed hit areas, stagger by distance, clamped reach, the stroke as the only highlight, a designed rest, honest paint order, sleeping loops, two clocks, rounded solids, no words in the figure) | adapted for video: the pointer becomes a planned tour; hit testing and sleeping loops have no video equivalent and are dropped | [Hairline kit README](../../skills/framemotion/assets/hairline/README.md), sections Draw it, Move it and Look questions |
| Concept method (an object, not a diagram; the features that give it away; one variable; rest as the thumbnail; empty states; the tour as a sentence) | adapted | [Hairline kit README](../../skills/framemotion/assets/hairline/README.md#find-the-figure-first) |
| Drawing kernel (`kernel.js`, `Cam`, `rings`, `prism`, springs and tweens on the frame loop) | not copied; rewritten | [`hairline-kit.js`](../../skills/framemotion/assets/hairline/hairline-kit.js): Studio's own rounded rings, hull and crease, and pure functions of time (closed-form spring step responses summed, ease-out redirected from the current value) |
| The 33 package figures and the two example figures | not adopted | Studio's example is an original object (a spice rack); a figure is designed per brief |
| `look.mjs`, `validate.mjs`, `read.mjs`, `build.mjs`, `bench.html` | not adopted | Studio checks frames through its motion review and the look questions; the original is bundled in `assets/library/hairline/` |
| `hairline-adopt` (a supplied SVG rebuilt as a figure) | not adapted | bundled in `assets/library/hairline/`; the rule that a logo belongs to its owner is kept in the kit README |
| Website, shadcn registry, CI, golden parity files | not adopted | not method |

The original was offered through the FrameCore Works Toolbox catalog (entry `hairline`, owner decision 2026-10-29) until Toolbox 1.17.0; since FrameMotion 0.4.0 it is bundled in `skills/framemotion/assets/library/hairline/`. Studio's review evidence: The pinned skills CLI listed both skills on 2026-10-26; no host installation was run.
