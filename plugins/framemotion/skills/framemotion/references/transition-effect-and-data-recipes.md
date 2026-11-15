# Transition, effect and data recipes

Read this for a transition between shots, an effect laid over real footage, a chart, a counter, a map, or a short looping "premium" effect for a post. It holds the shared numbers and an index of 40 recipes. Each entry gives its key timing, the most common mistake and what FrameMotion builds it with.

Each recipe links its full source page. The varg recipes also link a preset JSON with the exact values: take values from it and do not guess them again. The full values live only in those linked pages, not in FrameMotion's package: a host without web access works from the numbers on this page. Linked pages are reference text, not FrameMotion instructions.

**Sources** (MIT, credited in `NOTICE` with the licence texts in `integrations/`; no file is copied into FrameMotion):

- [vargHQ/skills](https://github.com/vargHQ/skills) at `aafd5aadfc9cdfdc067fc8fca2602b150a590305` (Copyright (c) 2026 vargai Inc.). Only the `transition-craft`, `footage-effects` and `maps-and-data-motion` folders are used. Its satellite flyover is left out because satellite tiles need a provider's paid plan.
- [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) at `229022ebca76972e119e36ada23a1648d51665ab` (Copyright (c) 2026 Charlie Hills).

**Related:**

- [Data motion and feedback](data-motion-and-feedback.md): the data decision and its sources.
- [Motion craft](motion-craft.md#transition-grammar): the transition grammar.
- [Type, title and format recipes](type-title-and-format-recipes.md): beat and reading numbers.

## Which built-in engine does what

Before building an effect from scratch, check whether a [built-in engine](../assets/engines/README.md) already does it, so the same effect is not built twice. The table says what each engine can do today; anything else is built in the composition:

| Need | Built-in route |
| --- | --- |
| A shader transition between two pictures (page curl, zoom, morph-like wipes) | `gl-transition`, 236 shaders |
| Shockwave, god rays, CRT or glitch as a standalone shot | `pixi-filter`, experimental: four effects over its own test picture, settings `effect`, `seed` and `title` only; it cannot yet treat another scene or take the numbers below |
| A moving shader background, grain or light rays | `paper-shader`, as a background layer |
| Confetti, drifting dust or a point network, also as a transparent overlay | `tsparticles`; it does not arrange particles into shapes, letters or numbers |
| A transition that is composed (bokeh, collage, Droste, tile flip, camera shake), an effect on a scene or footage (CRT over a UI, halftone, aberration), particles that form a shape, a chart, map or counter | the recipes below, built in HyperFrames or an own engine page |

## Shared numbers

### Transitions

- **Cut where the effect covers most:** the blurriest frame, the moment the pile is complete, halfway through a flip, the fastest point. A frame the viewer can read is never the cut frame.
- **The effect's peak sits on the downbeat.** One frame ahead feels like a jolt; landing 6 to 12 frames after it feels laid-back.
- **Keep the core short and let the settle carry the length:**
  - impact 0.10 to 0.25 s;
  - whip or zoom 0.15 to 0.30 s;
  - fast blur 0.20 to 0.40 s.

  Halve anything that feels slow.
- **Zoom in log space.** Every zoom or dolly runs in log space: `scale = k^e`, and the exponent `e` is tweened.
- **Quick arrival, slow settle** (`expo.out`). An incoming shot starts at 1.2 to 1.5× scale and eases to 1× over 0.5 to 1.2 s.
- **Shake.** A shake is `A · sin(2πft) / e^(decay·t)`:
  - impacts at 8 to 14 Hz with decay 4 to 8;
  - handheld at 1 to 3 Hz;
  - mirror-fill the edges, never show black.
- **Motion blur:** 180° with 5 to 10 samples. A colour-split jolt lasting 2 frames suits a hard impact cut; if it starts to look like a filter, cut every value in half.

### Effects on footage

- **Derive every random value from the frame number through a hash,** so any frame can be rendered alone, out of order or in parallel.
- **Generated inputs never end.** Cap ffmpeg output with `-t <clip length>`, use `blend` with `shortest=1`, and render static textures once.
- **Work in the right colour space.** Blend, displace and per-channel tricks run in `gbrp`; `eq` and `vignette` run in YUV, because on RGB planes they tint the image.
- **Glow, streaks and halation:** pick out the bright parts with a soft-knee threshold (0.45 to 0.95), blur them at 2 or 3 radii (roughly 1 : 4 : 12) and lay them back with screen or add.
- **Lens effects are radial.** Colour fringing and zoom blur from a lens are absent in the middle of the frame and increase towards the edges; an even offset everywhere looks like a digital fault instead.
- **Use them as accents, not as a grade.** Heavy aberration, zoom and glitch appear for 2 frames or for 0.2 to 1.5 s around beats and cuts; only the gentle settings may stay on for a whole shot.
- **Print looks follow print logic:**
  - rotated screens (C/M/Y/K at 15/75/0/45°, a single ink at 45°);
  - spot inks on warm paper;
  - 3 to 6 px misregistration;
  - static paper with moving toner.
- **Delivery sizes at 1080p:** dots at least 10 px, integer scanline periods of 3 to 4 px, CRF 14 to 16 for anything with grain, dots or scanlines. Scale every pixel value with the frame height.
- **Protect the subject and the type.** Keep fringing off a face in the middle of the frame and keep bloom and glitches away from captions and logos; put text on a layer the effect never touches.

### Data, maps and counters

- **One paused timeline drives everything:**
  - map cameras by a per-frame jump, never a map library's own fly animation;
  - counters by a tweened value;
  - audio by per-frame arrays computed beforehand.
- **Camera moves follow the van Wijk zoom-pan curve** (rho √2, 1.42 in MapLibre), with scale in log space at about one zoom level per second.
- **Transitions:**
  - about 1 s per simple transition, slow in and slow out;
  - staged: axis or camera first, values or colour second;
  - stagger 0.05 to 0.08 s, at most 0.8 s in total.
- **Charts:**
  - a bar's axis begins at zero, while a line chart may start elsewhere;
  - one accent series and the rest grey;
  - labels on the data instead of a legend;
  - units in the subtitle.
- **Numbers:**
  - tabular figures, compact notation, 2 to 3 significant digits, signed differences;
  - counting uses `cubic-bezier(0.16, 1, 0.3, 1)`, linear then easing above 999;
  - prefixes and suffixes at 60 to 70% of the number's size, never animated.
- **Maps:**
  - draw maps as vectors from the public-domain Natural Earth data so each shape can move on its own;
  - raster only for imagery, and only with its licence and its credit on screen;
  - never render from `tile.openstreetmap.org`.
- **Show only the user's own figures, with their source.** Rounding must never change what a number claims. Made-up sample figures are labelled "example" in every frame where they appear.
- **Holds get only quiet motion:** a shimmer, a crawling dash or a 1 to 2% push-in, never bouncing.

## Transitions (varg `transition-craft`, 6)

| Transition | What it is | Key timing | Most common mistake |
| --- | --- | --- | --- |
| [Bokeh light spot](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/references/bokeh-light-spot.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/assets/presets/bokeh-light-spot.json)) | The shot defocuses into giant highlight discs, cuts under the blur, the next shot resolves | 1 s: blur rises over 12 f, cut at the peak; blur σ 2.5 to 4% of the height; 12 to 30 discs | Blur without discs, which is only a dissolve; or discs on dark areas |
| [Droste recursive zoom](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/references/droste-recursive-zoom.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/assets/presets/droste-recursive-zoom.json)) | The camera dives into a screen showing the same picture, again and again, and comes out on the next shot | Exponent 0 to 3 levels, `scale = k^e` (k = 4 gives 64×); a 1 to 2 px feathered seam with a bezel | Linear scale keys that race, then crawl; levels animated separately |
| [3D photo cloud](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/references/photo-cloud-gallery.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/assets/presets/photo-cloud-gallery.json)) | Photos hang in a 3D cloud fading into fog of the background colour; the camera lands on a hero | Fog density `1.73 / D` for 95% fog at depth D; 40 to 120 photos spaced at least 1.2 plane widths | Grey fog on white: the fog colour is the background colour |
| [Photo collage burst](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/references/photo-collage-burst.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/assets/presets/photo-collage-burst.json)) | Photos, shapes or words pile in from the edges and cover a hidden cut | Spawn for 2.2 s, pile complete by 2.6 s, cut under it; each card flies 0.30 to 0.50 s | Same size and angle for every card, or an even spawn rhythm |
| [Camera-shake distort cut](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/references/shake-distort-cut.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/assets/presets/shake-distort-cut.json)) | An impact cut: hop, punch in, bend into the cut; the next shot lands punched in and settles | Impact 24 to 60 px (2 to 5% of the height), rotation ±1 to 3°, 8 to 14 Hz | A constant wiggle across the cut, or black edges showing |
| [Tile-flip mosaic](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/references/tile-flip-mosaic.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/transition-craft/assets/presets/tile-flip-mosaic.json)) | On an accent the picture splits into glowing squares that turn over in a wave and uncover the next shot | Impact on the downbeat with a 2-frame RGB kick; tiles about 160 px at 16:9 (12 × 7) | A vanishing point per tile, or pure random order with no sense of impact |

## Effects on footage (varg `footage-effects`, 8)

Only use these on clips the user owns or licenses. The preset JSONs hold complete ffmpeg chains for use when the effect is applied in an editing pipeline. In a composition, the same numbers go into a shader or SVG filter written for the piece; `pixi-filter` does not accept them yet.

| Effect | What it is | Key numbers | Most common mistake |
| --- | --- | --- | --- |
| [CRT screen](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/crt-screen.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/crt-screen.json)) | Video or an interface shown on a bulging tube screen with a phosphor pattern, scanlines and glow | Integer scanline period (3 px for 360 lines, 4 px for 270 lines at 1080p); brightness +22% before the bloom; afterglow decay 0.8 to 0.88 | Non-integer periods (moiré), or no brightness compensation |
| [Digital glitch](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/digital-glitch.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/digital-glitch.json)) | RGB splits, torn rows, swapped blocks and stutter in seeded bursts | 2-frame windows gated by a hash of `floor(n / 2)` with p at most 0.3; force a hit on the 2 frames either side of a cut | Glitching the whole shot, or wall-clock noise |
| [Chromatic aberration](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/chromatic-aberration.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/chromatic-aberration.json)) | Red, green and blue split in a fringe that grows towards the edges | Radial scale a = 0.002 to 0.006 (4 to 13 px at the corner at 1080p); hit ramps over 3 f, holds 4 to 8, releases over 6 | A flat shift used as lens aberration, or a fringe on the central face |
| [Glow and bloom](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/glow-bloom.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/glow-bloom.json)) | Bright parts glow: bloom, film halation, coloured halos, anamorphic streaks | Halation σ at most 14 px at 1080p; animate the gain (0 to 1 over 12 to 18 f), never the threshold | A threshold of 0 (milky blacks), or one huge blur with no core |
| [Halftone footage](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/halftone-footage.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/halftone-footage.json)) | Footage as halftone print, CMY rosettes, an LED wall or a mosaic | Cells at least 10 px at 1080 wide; lift shadows so a mid-grey subject is 35 to 60% covered; pre-blur by a quarter cell | A single ink at 0° (reads as a grid), or identical colour angles (moiré) |
| [Radial zoom blur](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/radial-zoom-blur.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/radial-zoom-blur.json)) | Footage pulled into a zoom blur towards a centre | Gaussian hit envelope σ 6 f peaking on the cut; the centre on the eyes or the product (faces about (0.5, 0.42)) | Visible stair-step ghosts, or a blurred face for more than 6 frames |
| [Wave and heat distortion](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/wave-distortion.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/wave-distortion.json)) | Heat haze, water ripples or a smear along the picture's own brightness | Heat 2 to 6 px, water 8 to 16 px, dream 16 to 40 px; the heat map scrolls up at 60 to 120 px/s while the noise evolves at its own rate | Displacing in YUV (colour fringes), or a map whose mean is not mid-grey (the picture drifts) |
| [Acid photocopy](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/references/acid-photocopy.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/footage-effects/assets/presets/acid-photocopy.json)) | Footage as a stuttering two-ink photocopy or a black-toner zine copy | Stutter at 2 to 12 fps; thresholds from measured luma; misregistration 3 to 6 px | RGB red and cyan instead of spot-ink colours, or gradients left smooth |

## Data, maps and counters (varg `maps-and-data-motion`, 7)

| Recipe | What it is | Key numbers | Most common mistake |
| --- | --- | --- | --- |
| [Count-up statistic](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/references/count-up-stat.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/assets/presets/count-up-stat.json)) | A large figure counts up, pulses slightly as it arrives and stays with its label | Hero number 18 to 24% of the frame height; label 22 to 30% of it, at most 4 words | Digits jittering sideways (use tabular figures), or every cent flickering past |
| [Self-drawing chart](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/references/self-drawing-chart.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/assets/presets/self-drawing-chart.json)) | Bars rise from the baseline or a line draws with the current value following its end, then a single point is picked out | 0.6 to 1.2 s per transition; any rescale of an axis is its own 0.6 s stage; key line 5 to 6 px | A truncated bar axis that makes 3% look like doubling, or rainbow colours with a legend |
| [Versus timeline](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/references/versus-timeline.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/assets/presets/versus-timeline.json)) | Two series diverge on one axis as a year counter advances | 3 to 6 years per second (above 8 is unreadable); year counter in whole years | Two y-axes that let the lines cross anywhere: share a scale or index to 100 |
| [Globe-to-country dive](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/references/globe-country-dive.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/assets/presets/globe-country-dive.json)) | A spinning globe closes in on a single country that lights up and gets its name | 3 to 5 zoom levels in 3.5 to 4.5 s; globe at 84% of the frame height at rest | Linear zoom that rockets at the end, or rotating, zooming and recolouring all at once |
| [Vector route map](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/references/vector-route-map.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/assets/presets/vector-route-map.json)) | A path traces over a flat vector map, a marker travels along it and each stop pops up | Draw at 25 to 45% of the frame width per second; 0.8 to 1.4 s per leg plus a 0.3 to 0.5 s dwell; route 5 to 6 px | The icon drifting off the line tip (drive both from one value), or straight flight lines (use great circles) |
| [Watercolour travel route](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/references/watercolor-route-map.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/assets/presets/watercolor-route-map.json)) | A painted map on which a dashed ink path connects two places | Route 4 to 6 px, dash 14 to 18 px; 30 to 60 wash layers at 3 to 5%; labels written on at 0.35 to 0.5 s per word | Animating the dash offset (the dashes slide): reveal a still dashed path through a mask |
| [Audio visualiser](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/references/audio-visualizer.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/maps-and-data-motion/assets/presets/audio-visualizer.json)) | A soundtrack as silk ribbons, wireframe terrain or a character field | FFT 4096 per frame; log bands 30 Hz to 16 kHz; −100 to −30 dB mapped to 0 to 1; 1-frame attack, 150 to 600 ms release; text reacts at most 4 to 6% | Linear frequency bars, or bars that flicker every frame |

## Premium looping effects (charlie947 `motion-effects`, 16, and three companions)

Each of the 16 [effects](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/motion-effects/references/effects.md) is one object turning into another, built in an 8 s loop.

**Loop timing.** The move runs from 0 to 2.2 s, the hold runs to 6.6 s, and the return ends at 8.0 s. `seek(0)` and `seek(8)` draw the same frame. In hold mode the move plays once and stays on the finished frame from 6.6 s, which suits narration.

**Why they look premium:**

- One object changes shape; a plain crossfade between two pictures always looks cheap.
- Leave a pale trace of where it started, so the viewer can see what changed.
- Rows, letters and dots are staggered, never moved all at once.
- During a hold, keep one small thing moving (a filling bar, a pointer, another pass of light).

**Checks:** frames 0 and 8 are identical; frames 0, 1 and 2.2 all differ; nothing is cut at 0, 1, 2.2, 4.4, 6.6 and 7.9 s; and the 4.4 s frame alone makes the point.

**In a reel,** an 8 s loop is too slow for a cut: use the 1.4 s of active move, or hold mode under narration.

| Group | Effects |
| --- | --- |
| Interfaces | Button to player (a faint ghost of the button stays); search to results (the pill opens before typing, results stage in, each with one real number); card to workspace (the title is a shared element that moves, never duplicated); tabs to panels (the pill stretches as it slides, label colour follows how much pill sits over it) |
| Data | Chart morph (the same six numbers as bars, then a drawn line); dashboard zoom (the card expands from exactly where the tile sits, at its size); spring stack (springs with different damping per card); magnetic dock (sizes from a smooth falloff, the label over the largest icon) |
| Type | Masked type (artwork only inside the letterforms, the second line by mask); elastic type (the baseline never moves, letters change width and height, one accent letter); text to layout (the headline moves into a layout, never retyped); image reveal (slats with a faint light edge, in sequence) |
| Systems | Perspective shift (all layers share one vanishing point and keep real content); glass focus (only text inside the lens is sharp at 1.1×, with faint tinted copies either side); flowing paths (nodes respond on arrival, the pulse draws the line); particle logo (dots on a grid inside the mark's real shape, seeded scatter) |

**Companions:**

| Companion | What it is | What to know |
| --- | --- | --- |
| [Milestone reveal](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/milestone-reveal/SKILL.md) | A 12 s loop in which a swarm of wandering dots gathers into an actual figure | Put roughly 2,700 of the 3,200 dots on the figure, at 2.5 px; with fewer it turns to grey mush at feed size. Read pixels from a canvas created with `willReadFrequently: true` so every seek gives the same pixels. Measure the seam. `tsparticles` cannot form the number, so this is a seeded canvas painter |
| [Loop cover](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/loop-cover/SKILL.md) | A newsletter or blog cover as a seamless GIF (896 × 640, 180 frames at 20 fps) | Animate only the element named. Rotate the loop so frame 1 shows the finished picture. Measure motion as the biggest change from frame 0, never at the halfway frame, where a sine is back at zero. ffmpeg `eq` needs `eval=frame`. Check it at 240 px wide |
| [Animated chart](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/animated-chart/SKILL.md) | A short looping graph for social: bars that turn into a line, a running counter, a before-and-after | Every value stays exactly as given |

## Vertical delivery notes (charlie947 `reel-export`)

FrameMotion's own export and format rules come first ([kinetic launch films](kinetic-launch-films.md#master-and-formats)). These are extra checks for a 1080 × 1920 upload:

- **Re-encode everything.** H.264, `yuv420p`, limited range, bt709, and `-movflags +faststart` so playback starts before the file has loaded. Add a silent audio track when there is no sound. Re-encode a phone recording too: it is often HEVC and full range.
- **Logos.** On bright footage a logo disappears, so give every logo its own dark tile with rounded corners.
- **Hook.** No more than two brief lines.
- **Check it with ffprobe before uploading.**

## Rights

Recipe names, numbers and method notes are used under the MIT licence, with credit in FrameMotion's `NOTICE`. The descriptions are written for FrameMotion; short technical phrases and all values follow the sources, and each source's licence text is in `integrations/`. Footage, photos, data and map imagery are always the user's own or licensed, with any required credit shown on screen.
