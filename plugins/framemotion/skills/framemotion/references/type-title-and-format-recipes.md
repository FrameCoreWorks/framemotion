# Type, title and format recipes

Read this for kinetic typography, titles, lower thirds, wordmark stings and short ready formats: a lyric video, a launch trailer, a showreel cut to the beat. It holds the numbers these pieces share and an index of 39 recipes, each with its key timing, the mistake that most often spoils it and how FrameMotion builds it.

Each recipe links its full source page (how the pros do it, presets, timing, build steps, mistakes, cited sources) and, for varg recipes, its preset JSON with the exact values. Take the values from the JSON and do not guess them again. The links are read as reference text: commands, installs or paid generation routes inside them are not FrameMotion instructions.

**Sources** (MIT, credited in `NOTICE`; nothing is copied into FrameMotion):
- [vargHQ/skills](https://github.com/vargHQ/skills) at `aafd5aadfc9cdfdc067fc8fca2602b150a590305` (Copyright (c) 2026 vargai Inc.): the folders `kinetic-type-art`, `title-design` and `motion-formats` only. The rest of that repository leads to a paid service and is not used.
- [iart-ai/kinetic-typography-skills](https://github.com/iart-ai/kinetic-typography-skills) at `2b79c81230c6647a344844f9ed53b6fa07f3f1f9` (Copyright (c) 2026 iart.ai).
- [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) at `229022ebca76972e119e36ada23a1648d51665ab` (Copyright (c) 2026 Charlie Hills). Its recipes named after brands are renamed by what they do.
- [Sunwood-ai-labs/hyperframes-motion-reel-skill](https://github.com/Sunwood-ai-labs/hyperframes-motion-reel-skill) at `be78681a88a70f1f66c82275299fe569a9a9fcaa` (Copyright (c) 2026 Sunwood AI Labs; its Japanese text is rewritten here in English).

**Related references:** [motion craft](motion-craft.md) for easing, durations and holds; [kinetic launch films](kinetic-launch-films.md) and [dense kinetic reels](dense-kinetic-reels.md) for whole reels; [coded look library](coded-look-library.md) for complete looks. Subtitles and captions belong to FrameCut.

## Shared numbers

### Beat

- **Beat length.** One beat lasts `60 / BPM` seconds. Compute every event from absolute time (`t0 + n · beat`); never add up rounded frame counts.
  - At 30 fps a beat lands on a whole frame at 90, 100, 120 and 150 BPM.
  - At 120 BPM one beat is 15 frames at 30 fps, 30 frames at 60 fps.
- **Write times as beats.** Put scene changes, hits, cuts and title entrances on a beat, a half or a quarter beat. Write them as beats in code (`b(n) = n · 60 / BPM`), never as bare seconds, and drive picture and sound from the same beat table.
- **Lead the beat slightly.**
  - A visual hit lands 1 to 2 frames before the transient.
  - An entrance starts 3 to 5 frames early.
  - A swap is a hard cut on frame 0 of a beat.
  - A rhythmic track whose tempo drifts uses analysed beat times, not a constant grid.

### Reading

- **Speed.** At most 20 characters per second on screen. One word per beat stays readable up to about 180 BPM. Show any text event for at least 25 frames at 30 fps.
- **Gaps.** A gap between text events is either 2 frames or at least 0.5 s, never in between.
- **Holds.**
  - FrameMotion's hold rule in [motion craft](motion-craft.md#readable-holds) is the minimum its checks apply.
  - A title or lower third that must be read twice (a name, a place) holds for `clamp(2 × max(words × 0.36, characters / 20), 3, 7)` seconds.
  - When the two rules differ, use the longer hold.
  - End a piece on a 1 to 1.5 s hold; a title at the end holds at least 2 s.

### Safe areas and type sizes

- **16:9.** Keep graphics 5% from each edge and action 3.5%.
- **9:16.** Keep text between 14% from the top and 35% from the bottom, 6% from the sides, and clear of the right-hand button rail. FrameMotion's own check lines (top 10%, bottom 20%) are the hard limit; these are the comfortable zone.
- **Type sizes by frame height:**

  | Role | Size |
  | --- | --- |
  | Display | 9 to 14% |
  | Chapter title | 6 to 8% |
  | Lower-third name | 4.5 to 5.5% |
  | Role line | 60 to 70% of the name |
  | Anything | never under 2% |

  For a full-screen view, a headline is at least 60 px and body text 20 px. For a phone feed, a headline is at least 90 px.

### Setting and moving type

- **Set the type first.** Motion cannot rescue bad type: fix line height (1.1 to 1.2 for display), tracking and weight, then animate.
- **Tracking.**
  - Caps: +0.05 to +0.12 em.
  - Display lowercase: -0.01 to -0.03 em.
  - Never letterspace lowercase.
  - Condensed slam caps: 0 to +0.02 em.
  - Changing numbers use tabular figures.
- **Enter and exit.**
  - Enter with `cubic-bezier(0.05, 0.7, 0.1, 1)` (about `expo.out`); exit with `cubic-bezier(0.3, 0, 0.8, 0.15)` (about `power2.in`).
  - Exits are about 35% shorter: 0.45 s in, 0.28 s out.
  - A premium enter is `cubic-bezier(0.16, 1, 0.3, 1)`, 0.4 to 0.6 s per fragment.
- **Stagger.**
  - Lines 60 to 100 ms, words 40 to 70 ms, letters 20 to 40 ms.
  - Keep a whole reveal near 0.8 s; on long copy, split by word or line instead of by letter.
  - Stagger with a fixed `each` delay, so a long wordmark waves at the same speed as a short one.
- **Glitch and decrypt.**
  - Glitches are discrete, seeded from (frame, glyph, seed), and come in bursts of 3 to 8 frames inside long clean holds. Keep a mark clean at least 70% of the time.
  - Digital damage comes in 8 or 16 px blocks.
  - An RGB split of 6 to 14 px decays to 0.
  - A scrambled glyph refreshes every 2 frames, which reads as computer noise; every frame reads as static.
- **Stepped animation ("on twos").** Animate on ones and step everything with one global quantiser, `floor(t × 12) / 12`, with no motion blur on stepped layers.
- **Effects resolve.** An effect is a transition and the information is the destination: every effect resolves to clean type that holds.

## Four reveals and how to split

| Reveal | How | When |
| --- | --- | --- |
| Mask rise | Each line clips its own box; the text rises from 100% below to 0 | The most robust headline reveal: no blur artefacts, cheap to render |
| Blur-in | Blur 12 px to 0 with opacity 0 to 1, about 0.7 s | A soft focus pull; costly, so keep the radius modest |
| Clip wipe | `clip-path: inset(0 100% 0 0)` to `inset(0)` | A direction without moving the glyphs |
| Letter stagger | Letters rise 0.4 em and fade in, 20 to 40 ms apart | Short strings only; it gets busy on long copy |

- **Split by line, word or letter.**
  - Lines are the calmest and most premium.
  - Words suit taglines and lyric hits.
  - Letters are the most playful, and only for short words.
- **Fonts first.** Split only after fonts have loaded (`document.fonts.ready`), or line breaks differ in the frozen frame.
- **Variable fonts.** Animate `font-variation-settings` (weight, width, slant, optical size), not `font-weight` and not a CSS variable that only feeds it. Check that the font really is variable and its axis range first.
- **Morphing words.** For one word turning into the next with shared letters sliding into place, use the built-in `torph-text` engine ([library engines](../assets/engines/libraries/README.md)).

## Kinetic type pieces (varg `kinetic-type-art`, 17)

Shared numbers for these pieces: [shared-type-craft](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/shared-type-craft.md).

**Two special rules:**
- **Didone faces** only work big, at their large optical size (opsz 96, weight 700 to 900).
- **Anime-style title cards** use a heavy serif squeezed to 0.55 to 0.75 of its width, not a condensed font.

**Two print looks:**
- **Riso:** #FF48B0, #3255A4 and #FFE800 multiplied with 1 to 3 px misregistration.
- **Photocopy:** desaturate, levels 41/214, speckle grain, a 1.7 px blur and horizontal streaks.

| Piece | What it is | Key timing | Most common mistake | Build in FrameMotion |
| --- | --- | --- | --- | --- |
| [One word per beat](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/red-beat-words.md) ([json](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/assets/presets/red-beat-words.json)) | Big condensed words, one per beat, full frame on one colour | Word i at frame `round(i · 15)` at 120 BPM; a cut or 3 f punch, no exit; width 86 to 92% of the frame; the last word holds 2 beats | Words that fade or drift between beats: slams are cuts | HyperFrames, one timeline |
| [Typeface strobe](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/typeface-strobe.md) | One word cut through many typefaces, landing on the brand face | One face per beat, or 2 to 3 f per face in strobe mode; cap height fixed at 28 to 35% of the frame height | Same font size for all faces: normalise cap height or the word jumps | HyperFrames |
| [Word corridor](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/word-corridor.md) | A word repeated on four walls of a corridor rushing at the camera | One word pitch per beat, double on the drop; 12 to 20 repeats per wall; CSS perspective 450 to 600 px | Flying the camera instead of moving the walls | HyperFrames, CSS 3D |
| [Perspective photo wall](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/perspective-photo-wall.md) | A masonry wall of photos and captions tilted back, sliding towards the camera in a loop | Travel exactly 3 to 5 row pitches per loop at 0.4 to 0.8 rows per second | Tiles popping in at the horizon: extend past the edge and fade into fog | HyperFrames, CSS 3D |
| [Type specimen grid](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/type-specimen-grid.md) | One word set many ways on a ruled Swiss grid, intercut with photos | One new cell per beat; axis morphs 12 to 18 f with 0.04 to 0.06 s letter stagger | 18 different fonts instead of one family's axes | HyperFrames; variable font |
| [Justified manifesto](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/justified-manifesto.md) | A manifesto set word by word into one justified column, photos opening in gaps | One word per beat; reflow slides 6 to 8 f; a photo gap opens to 30 to 45% of the height | Letterspacing to fill lines: space the words | HyperFrames |
| [Didone city title](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/didone-city-title.md) | A two-word place name in traced Didone caps that holds, then springs wide | Trace 36 f with 3 to 4 f stagger, fill 12 f, hold 36 f, anticipation 6 f | Scaling the whole word for the spring: stretch only the horizontal strokes | HyperFrames, SVG strokes |
| [Scanned-sheet glitch wordmark](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/scan-glitch-wordmark.md) | A wordmark on a scanned sheet that breaks up in short bursts and settles clean | 3 bursts of 3 to 8 f, 10 to 20 f apart; one new state per frame (`steps(1)`) | Smooth tweened jitter: a glitch is discrete | HyperFrames, or `pixi-filter` glitch |
| [Hyphen bridge wordmark](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/hyphen-bridge-wordmark.md) | Two words joined by a hyphen that grows, stands up and shrinks back | Anticipation 3 f, the bar grows to 45 to 60% of the width in 18 f `expo.out`, words lag 2 to 3 f | A dash glyph or a bar thicker than the hyphen: match its metrics | HyperFrames |
| [CRT decrypt title](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/crt-decrypt-title.md) | Two rows of glowing type decrypt on a side-angle CRT | Power-on 6 f; row 1 locks left to right over 24 to 30 f; row 2 starts 8 to 10 f later; glyphs refresh every 2 f | Unseeded scramble, or every letter locking at once | HyperFrames; `pixi-filter` crt for the screen |
| [Dot-burst particle title](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/particle-burst-title.md) | Typed titles where dots gather into one and burst into a coloured field | Dots gather 60 f, squeeze 3 f, burst at 600 to 1400 px/s with exponential drag 2.5 to 4 per s | One tween per particle: use one seeded painter | Seeded canvas painter, or `tsparticles` |
| [Anime command screen](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/anime-command-screen.md) | A squeezed serif title card inside a fictional command screen with counters and scanlines | Power-on 12 f; panels draw 6 to 10 f each; the title slams in after a 2 f flash; counters tick every 2 f | Panels with no job: give each one | HyperFrames |
| [Photocopy explainer](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/photocopy-explainer.md) | Explainer cards in photocopied paper and toner, a number grid, a highlighter | Cards slide 10 to 14 f with 0.5 to 1.5° tilt; highlighter `scaleX` 12 to 18 f per line | Toner grain on body text: keep type sharp | HyperFrames |
| [Echo stack over halftone portrait](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/echo-halftone-portrait.md) | Two words in stacked echoes over a dot-screened portrait, torn away | Five echoes at 0.06 s lag (opacity 0.8 to 0.12); dot cells at least 8 px at 1080p | Dots too small: the encoder smears them to grey | HyperFrames, canvas halftone |
| [Glyph-tracking terminal](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/glyph-tracking-terminal.md) | A virtual camera tracks the newest glyphs of a terminal in beat-timed shots | Shot starts at `round(i × 17.5)` f; move 6 to 8 f, then hold; zoom 1×, 2.2 to 3×, 4 to 6× | Following the caret every frame: move in shots, hold between | HyperFrames, real text (never a screenshot) |
| [Bitten word](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/bitten-word-title.md) | A word eaten letter by letter, one bite per beat | Anticipation 3 f, bite 1 f, recoil 6 to 8 f `elastic.out(1, 0.5)`; bites of 3 to 5 overlapping circles; seeded crumbs | One perfect circle: it must read as teeth | HyperFrames, SVG masks |
| [Liquid artwork reveal](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/kinetic-type-art/references/liquid-art-reveal.md) | An artwork appears through a liquid distortion that settles, then the title resolves | Distortion eases to 0 over 72 f `power3.out`; noise frequency 0.01 to 0.03 | Distortion that never fully settles | HyperFrames SVG displacement, or `pixi-filter` |

## Titles and lower thirds (varg `title-design`, 9)

Shared numbers for these titles: [title-craft-basics](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/title-craft-basics.md).

**Plates:**
- A dark plate is at least 60% opaque (default 75 to 85%).
- A light plate is at least 85% opaque, with #111 text.
- Lower thirds use the names, roles and places the user gives; never invent a credential.

| Title | What it is | Key numbers | Most common mistake |
| --- | --- | --- | --- |
| [Name lower third](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/name-lower-third.md) | Name and role on a speaker's first appearance | Plate in 0 to 0.45 s, name 0.10 to 0.55 s; 16:9 left edge 144 px, bottom 87 to 88% of the height, name 54 px, role 34 px | Covering the mouth or hugging the edge: mirror to the open side |
| [Place and date lower third](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/place-lower-third.md) | Where and when: a place over coordinates, a date or a local time | Coordinates count over 0.6 s `power3.out` with fixed decimals; format `38.7223° N · 9.1393° W` | Proportional digits that jump while counting |
| [Headline write-on](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/headline-write-on.md) | A headline written on by letter, word or line, then held | Letters 0.04 s apart; editorial lines 0.18 s apart; hold at least twice the reading time | The same 0.3 s ease on everything: decelerate in, accelerate out |
| [Show open](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/show-open-title.md) | A podcast or series open: name on the beat, guest plates typed on a panel | 10 s at 120 BPM; name at 12 to 14% of the height; one accent | Soft fades instead of cuts on the beat |
| [Speaker plates](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/speaker-plates.md) | One plate system for talking heads: two-line plate, ticker, caption bar, title card, corner tag | A crawl at 20 characters per second; caption bar at 80 to 84% of the height, at most 2 lines of 42 characters | Five plate styles in one video: one font, one accent, one in and out |
| [Block glitch title](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/block-glitch-title.md) | A title that snaps in through a heavy block glitch and settles clean | Slices in multiples of 8 or 16 px; bursts 2 to 4 f on, 3 to 8 f off; one seeded schedule for slices, split, flicker and sound | Glitch frames spread evenly through the clip |
| [CRT scanline title](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/crt-scanline-title.md) | A name and role crash onto a CRT, then clear to clean type | Scanline period 4 to 6 px at 1080p; RGB triads 3 px at 15 to 25%; curvature at most 0.04 | 1 px black lines every other row |
| [Chrome echo melt](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/chrome-echo-melt.md) | One chrome word melting into stepped echoes and a grainy halo | 6 to 10 echoes 2 frames apart at opacity 0.7^n; a halo blurred 24 to 48 px on its own layer | Glow on the type itself washing the letters out |
| [Stepped channel bumper](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/title-design/references/stepped-channel-bumper.md) | A channel bumper on twos: streak panels, a name plate, a topic card | 24 fps, stepped with one `floor(t × 12) / 12`; three panels at -14° | Each tween with its own `steps()`, so layers step out of phase |

## Ready formats

The first seven formats come from varg `motion-formats`. Shared rules for them:
- Every camera move needs a reason. Hide a seam in a 4 to 6 frame whip, never a dissolve.
- Degrade a picture with a signal model (tape damage, then downscale, then a CRT shader), not with overlays.
- Pixel art keeps integer scaling and whole-pixel moves.

| Format | What it is | Key numbers | Source |
| --- | --- | --- | --- |
| Kinetic lyric video | Lyrics in sync with the vocal, emphasis carried by size, weight and motion | Show mode chosen from vocal density (about 3.3 words per second is the ceiling); entrances on the sung onset minus 1 to 5 frames; never trust uncorrected transcript times | [varg](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/motion-formats/references/kinetic-lyric-video.md) |
| Wave-through wordmark | A 2 s sting: a crest of lift, weight or tilt runs through a wordmark and settles to the exact logo | Falloff window at least twice the per-letter delay | [varg](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/motion-formats/references/wave-wordmark.md) |
| Bouncing-logo screensaver | A 5 s sting: a logo bouncing at constant speed on worn tape, landing in a corner on cue | Position is a triangle wave `L − abs(((v·t + x0) mod 2L) − L)`, so any frame renders alone; a hard colour switch on each wall hit | [varg](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/motion-formats/references/vhs-bouncing-logo.md) |
| Import launch trailer | An 18 s feature film: files from other apps drop in and the timeline rebuilds on the beat | The product is on screen by 2 s and the logo goes last; a flooding shape overscales past the corners in about 0.3 s | [varg](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/motion-formats/references/import-launch-trailer.md) |
| Music-app timeline one-shot | One camera move over an arrangement view; a bracket locks onto every clip the playhead hits | The playhead stays linear at constant pixels per beat and the camera moves; zoom punches only on phrase downbeats and the drop | [varg](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/motion-formats/references/daw-timeline-one-shot.md) |
| Found-footage website trailer | A 25 s analog-horror teaser browsing a fictional site, escalating to a title | Keep the picture clean and degrade only on reveal beats; never show the threat clearly | [varg](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/motion-formats/references/found-footage-website-trailer.md) |
| Pixel-art runner on a CRT | An 18 s side-scrolling mini game ending on the logo | 60 fps; scroll 1 base pixel per frame; parallax 0.25, 0.5 and 1.0, floored to whole pixels; nearest-neighbour integer scaling | [varg](https://github.com/vargHQ/skills/blob/aafd5aadfc9cdfdc067fc8fca2602b150a590305/motion-formats/references/pixel-runner-crt.md); FrameMotion's [pixel VFX craft](pixel-vfx-craft.md) |
| Product launch video | 30 to 45 s: one sentence split across scenes, real product screens with slow camera moves, a typed prompt, a proof beat and a call to action | The prompt is typed live in one place only; no two beats share a layout | [charlie947](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/launch-video/SKILL.md); FrameMotion's [kinetic launch films](kinetic-launch-films.md) |
| Notch-to-widget desktop launch film | A thin menu bar and a black notch at the top centre that grows into widgets one scene at a time, over full-screen gradient wallpapers | 6 to 8 scenes of about 2.5 s; width and height spring on their own curves, opening soft and closing without overshoot; motion is worked out from the start of the film, so a notch reopening mid-close carries on from where it is | [charlie947](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/apple-launch-film/SKILL.md) (renamed) |
| Torn-paper documentary explainer | 30 to 60 s "why does this happen": torn paper, halftone texture, bold condensed type, motion on twos | The opening line promises the payoff, with the first surprise within 5 s; every spoken fact has a source in a facts file; score written in code under the voice | [charlie947](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/vox-explainer/SKILL.md) (renamed); FrameMotion's [art and explainer direction](art-and-explainer-motion-direction.md) |
| 3D title sequence | 8 to 15 s: a camera moves through a lit three.js scene (a rainy street with names as neon signs), then a title lands | Cards and objects moving in depth, never one line moving across; symmetrical grids; sound is part of it | [charlie947](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/title-sequence-3d/SKILL.md); FrameMotion's [photoreal blocks](../assets/engines/photoreal/README.md) |
| Newsletter promo | 12 to 20 s: a hook question, three proof frames from the edition, then the name and where to read it | Real frames from the edition, never filler | [charlie947](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/newsletter-promo/SKILL.md) |
| Same brief, three models | One motion brief given to three AI models, first tries only, rendered the same way and stacked | Same renderer and settings for all; a failure stays in; label each panel with the full model name on its own dark tile | [charlie947](https://github.com/charlie947/motion-graphics-skills/blob/229022ebca76972e119e36ada23a1648d51665ab/skills/model-showdown/SKILL.md) |

## Showreel cut to the beat

A method for a showreel-quality piece from a theme and a few materials, built in HyperFrames, after [Sunwood's motion-reel skill](https://github.com/Sunwood-ai-labs/hyperframes-motion-reel-skill/blob/be78681a88a70f1f66c82275299fe569a9a9fcaa/SKILL.md).

- **Defaults and grid.**
  - Defaults are 15 s at 120 BPM (one beat = 0.5 s) and 1920 × 1080, or 1080 × 1920 when vertical. 30 fps is FrameMotion's default; 60 fps is an option the user chooses.
  - Keep every constant in one config object at the top of the composition. The root's size and duration attributes are static HTML, so change them whenever the config changes.
  - Scene boundaries, hits, cuts and transitions are written as `b(n)` beats, never as bare seconds.
- **Design system first.** Before building, write a short design system from the theme and save it with the project: background, main and one accent colour, display and data fonts, grid, shape language, motion language and camera. The colours live as tokens that CSS and canvas both read.
- **Contrast in motion.**
  - Plan contrast: fast, then stop, then burst; dense, then released; 2D, then 3D. Never every scene at one speed.
  - Use anticipation, overshoot (`back.out(2)`), follow-through, springs (`elastic.out(1, 0.4)`), masks and parallax.
  - Keep linear easing for mechanical motion only.
  - Seed any random stagger order rather than using a library's random.
- **Transitions are transformations.** The shapes of one scene become the next, for example text, then a line, then a chart, then a 3D grid, then a tunnel, then the logo. Keep the elements that survive across scenes in one composition and tween them on; split into sub-compositions only at hard cuts.
- **Type as picture.** Use huge type, type bleeding off the frame, type broken apart, masked, rotated or stretched. Prefer short strong words over many small lines. Mark an intended bleed so the overflow check can tell it from a mistake.
- **Avoid:**
  - slide-show transitions or text that only slides left to right;
  - fade after fade;
  - meaningless gradients and template SaaS-ad layouts;
  - too many rounded cards;
  - type too small to read;
  - everything placed at the centre;
  - effects unrelated to the theme.
- **Sound from the same beat table.** A score can be synthesised in code with no samples: a kick as a sine with a falling pitch, a hi-hat as high noise, an impact as a low sine plus noise with a short decay. Place each sound from the same beat table as the picture, and mix it under a user's voice when there is one. For FrameMotion's sound route and its checks, see [motion sound design](motion-sound-design.md).

## Rights

Recipe names, numbers and method notes are used under the MIT licence, with credit in FrameMotion's `NOTICE`. The descriptions are FrameMotion's own. Cited third-party techniques (named designers, title sequences, films) are learnt as technique; never reproduce an artist's drawing, a film's title card or a brand's wordmark.
