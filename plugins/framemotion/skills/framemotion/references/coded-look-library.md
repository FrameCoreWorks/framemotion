# Coded look library (21 looks with exact numbers)

Read this when a brief needs a complete look for a short motion piece (an app demo, a data beat, a type sting, a calm paper story) and the user has no brand look of their own, or wants one of these. Each look is a short, strict spec: palette in hex, one accent, fonts, easing in names and seconds, motion rules, signature moves and a ban list. FrameMotion describes each one here in its own words. The full spec of a look is its linked `STYLE.md`. Most looks also link a working HTML reference piece.

The looks come from [claude-video-2](https://github.com/ItsssssJack/claude-video-2) (MIT, Copyright (c) 2026 Claude Video Studio contributors), reviewed at commit `18891e4996abb7ccc0085f2d43cef2fd7eff1dc8`. No file of it is copied into FrameMotion. Its Higgsfield route (paid AI clips) is not used.

**Related libraries:**
- [film style library](film-style-library.md): 66 longer film looks (painting, East Asian traditions, documentary).
- [`motion-styles`](../assets/motion-styles/README.md): 11 token sets that the motion contract uses directly.
- [type, title and format recipes](type-title-and-format-recipes.md) and [transition, effect and data recipes](transition-effect-and-data-recipes.md): single moves rather than whole looks.

## How to use a look

1. **Use one look per piece, and stick to it.** Paste its spec into the brief. Its colours become tokens at the top of the composition, and no colour is typed anywhere else. A fixed look is what stops the drift between shots towards the default AI look of a dark background, glow and a purple gradient.
2. **Brand comes first.** Brand colours replace a look's colours while its rules stay. A look never overrides the brand's type or marks: when the brand has a strong look of its own, use `brand-native` in [motion styles](../assets/motion-styles/README.md) instead.
3. **Write the brief in numbers.** Give the size and length, hex colours, easing as names and seconds (`expo.out`, 0.6 s, never "smooth"), one hero move per shot with its start time, and the ban list.
4. **Describe how a reference was made, not how it feels.** When the user brings their own reference instead of a look, write a new spec in the same shape: palette in hex, type, easing numbers, motion rules, signature moves and bans. Describe the making, such as masked text, a slow camera or long holds, and show it in five lines before building.
5. **Build it on the [engine contract](engine-contract.md).** One clock, every value a function of time, randomness seeded, fonts loaded before frame 0.
6. **Check frames, not code.** Take three stills about 0.6 s after each shot change, once things have landed, and score composition, motion, type, colour and idea. Fix the worst three before rendering. After the render, apply the pacing rule below and the usual [reel workflow](reel-workflow.md) review.

**Default ban list, always on.** Where a look's own signature conflicts with it (a sun's glow, a centred widget), the look wins, because its reference piece is the proof:
- no hue-shifting gradients;
- no glow, bloom or lens flares;
- no linear easing on anything the eye follows;
- no layout with everything centred;
- nothing scales up from zero (start at 0.6 to 0.9 with opacity);
- at most one accent colour;
- at most six words on screen at once;
- no fake chrome effects.

**Pacing rule:** no dead gap over 1 s, and nothing on screen for under 0.3 s.

**Looks that show an app** (the app-UI looks below) never use a real product's name, logo or brand colours. They build a believable generic app in its place.

## Type and posters

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Swiss grid](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/swiss-grid/STYLE.md) | Calm, exact, loud type on white | Titles, product facts, launch cards | ground #FFFFFF, accent #E4002B (one thing per shot), Inter 900 at -0.04em, land `expo.out` 0.6 s; 9 s loop | A word swaps in its row mask like a conveyor; the red full stop hops to the end of the new word and squashes on landing |
| [Swiss kinetic](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/swiss-kinetic/STYLE.md) | A printed Swiss poster dancing on the beat | Kinetic type, music promos, title sequences, stings | ground #F1EEE6 with grain, ink #111111, accent #E63022; Inter Tight 700 sized to grid cells; slams `expo.out` 0.36 s with 34 px motion blur clearing in 0.24 s; 120 BPM; 6 × 4 grid drawn first | One red dot becomes a circle, a full stop, the dot of an i and an empty puzzle slot; the hero word is sliced into three shearing bands and snaps back |
| [Poster pop](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/poster-pop/STYLE.md) | A loud gig poster: huge condensed type, flat colour, hard cuts | Hooks, Shorts, big claims, countdowns, "three things" lists | ground #FFD400, ink #111111 is the only accent, League Gothic caps at line height 0.85; 12 s loop | Hero words at 80 to 150% of the frame height, cropped off two edges; letters slam in 0.033 s apart and stop dead |
| [Risograph](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/risograph/STYLE.md) | Two-ink print, grainy and a little off register | Playful promos, events, music, culture | paper #F5F0E6, Archivo Black caps; 12 s loop | The stamp: scale 1.12 to 1 with a 1 to 2° rotate settle while the second plate thumps 4 to 7 px off and settles; a halftone copy lands far off register, then snaps to 18 px off |

## Data, explainers and diagrams

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Data story](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/data-story/STYLE.md) | A newspaper chart that comes alive, calm and exact, with one blue truth | Retention charts, growth stats, before and after | ground #FFF1E5, ink #1A1A1A, accent #0F5499; Bodoni Moda title 88 px, hero number 316 px; line draw `sine.inOut` 2.5 s, count `expo.out` 1.0 s | The camera moves by changing the axis range, never by scaling pixels, so ticks reflow and stay sharp; a blue line peels out of the ink line and the gap fills with blue hatch |
| [Editorial paper](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/editorial-paper/STYLE.md) | A newspaper graphic: warm paper, black ink, one blue | Data, charts, "what the numbers say" | ground #FFF1E5, accent #0F5499, Playfair Display 700/900 tabular, Inter 500 labels; land `power3.out` 0.7 s, line draw `power2.inOut` 1.2 to 2 s | One bar turns blue and grows past the rest while its number counts; a smooth re-rank where the blue row climbs |
| [Explainer diagram](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/explainer-diagram/STYLE.md) | A crisp living system diagram where every step is a blue packet arriving | Pipelines, systems, product flows | white with a 38 px dot grid, navy #14213D, accent #2B7EF9; Switzer 800, one word per card; card land `power3.out` 0.55 s; packets with a 220 px comet trail | The camera always travels between cards (no cuts), then pulls out to the whole machine; one planted mistake is shown, then fixed by a note riding a wire back |
| [Blueprint](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/blueprint/STYLE.md) | A technical drawing that builds itself line by line | How things work, product parts, engineering | ground #0E3A66, lines #CFE3F7 at 2 px, accent #FFD23F; IBM Plex Mono caps; strokes `power1.inOut` 0.6 to 1.2 s; 24 and 120 px grids | Construction lines shoot across first and the real strokes trace over them; an exploded view slides parts apart along one axis with inner parts lagging |
| [Midnight grid](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/midnight-grid/STYLE.md) | Deep navy, a quiet dot grid, one blue doing the talking | Tech and AI explainers, flows | ground #0B1220, accent #3D8BFF on the active thing only, Inter 700; land `power3.out` 0.5 s; 12 s loop | A blue pulse rides the tip of each wire as it draws, then hands the blue to the node it reaches |
| [Growing city](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/growing-city/STYLE.md) | A pastel toy-town island that builds itself, then lights up at dusk | Growth over time, yearly recaps, milestones | sea #BFE3E0, accent coral #F27D72 on a few roofs and one car; Inter 700 month at 156 px; tiles drop `back.out(1.3)` 0.42 s | The island lays in like tiles falling into a tray, centre first; the month and the count tick up together while the skyline climbs |
| [Time travel](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/time-travel/STYLE.md) | One camera on one endless timeline, each era in its own period style | History of an idea, then and now, origin stories | ground ink #15120F; 17 s | A match-cut chain through the eras (cave drawing, vase, zoetrope, film, TV, pixels, code), each frame in that era's drawing style |

## App and product demos

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Graphite UI](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/graphite-ui/STYLE.md) | A calm product film: dark graphite, crisp UI, slow precise camera | Software launches, app demos, feature reveals | ground #0E0F12, accent #3DD68C (the button, the cursor, the "done"), Inter 600; land `cubic-bezier(0.16, 1, 0.3, 1)` 0.6 s; 12 s loop | The app sits on a 3D camera: tilted wide, then flat and close, then turned away to make room for a headline; one green cursor clicks one green button and a check draws in |
| [Video editor demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/editor-ui/STYLE.md) | A calm dark editor where an AI cursor makes a real edit, then the app flies apart | "AI edits my video", workflow explainers, before and after | app #121212, panels #1D1D1D at radius 8, accent clay #D97757; Switzer 800; pushes `power3.inOut` 0.45 s to scale 1.4 to 2.1, then a 2 to 3% linear drift hold; perspective 2600 px | A camera tilt from its own speed (0.0016° per px/s, at most 3°); the cursor never teleports and each click drops a 44 px ring; panels fly past the camera along the line from the centre |
| [Music app demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/audio-app-ui/STYLE.md) | A dark music app where an AI cursor marks the cuts, locks the tempo and writes the music | Audio tool launches, beat-sync explainers | desk #0A0A0B, accent clay #D97757, Switzer 750 tabular; 120 BPM, every cut on a beat | Tempo lock: the BPM is dragged from 96 to 120 and the grid flows, overshoots and snaps onto the markers; at the finish every beat punches the picture (scale +1.8%) and every cut harder (+3%) |
| [Design tool demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/design-app-ui/STYLE.md) | A bright canvas tool with live collaborators where an AI builds a thumbnail | Design tool launches, layout explainers, A/B variant stories | canvas #EAEAE7 with a dot grid, white panels, accent clay #D97757, winner ring red #E5402A used once; Switzer 800 caps | Overlays are counter-scaled by 1 over the canvas zoom so they stay app-sized; snapping with clay guides and distance pills; the winner lifts out of the app as a feed card |
| [Motion tool demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/motion-app-ui/STYLE.md) | A dark motion app where an AI cursor sets keyframes and bends the curve | Keyframe and easing explainers, title tool launches | app #121212, accent clay #D97757, Switzer 800 | Linear becomes ease: evenly spaced dots along the path, then the graph editor where both handles are dragged and the dots bunch at the ends |
| [Keynote widget](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/weather-widget/STYLE.md) | One polished widget lives through a whole day without a cut | Product UI promos, state changes, dashboards | accent sun yellow #FFC94A; Inter 200 number at 300 px, tabular; land `expo.out` 1.1 s from scale 0.9; ends on the frame it began | A wide soft shadow plus a tight contact shadow, a lit top edge and a sheen; the sun's light spills past the widget and warms its corner |

## Paper, ink and particles

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Paper cut](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/paper-cut/STYLE.md) | A pop-up book: layered cut paper with soft shadows and real depth | Stories, travel, nature, gentle brand moments, loops | accent dusk rose #D98C7A on one small thing | Sheets land one by one from far to near, each held 4% big with a wide shadow, then set down; in a hold the sheets lift a little and settle in turn |
| [Paper world](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/paper-world/STYLE.md) | A pop-up book builds itself, then day turns to dusk; no words | Story openers, places, a day in, kids and book promos | paper #F2E8D5, accent #D98C7A; big sheets slide up from 820 px with `back.out(0.7)` 0.55 s | Hand-cut edges in 6 to 13 px facets nudged by seeded noise; a 2.4 px sunlit rim, grain and fibres, and a soft plus a tight contact shadow on every sheet |
| [Ink line](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/ink-line/STYLE.md) | One brush line that never lifts, turning into the next thing; no words | Brand stings, calm intros, logo reveals | washi #F4EFE6, vermilion seal #D23C2A used once at the end; bloom zoom `expo.out` 0.9 s | Six ink tones with a two-level bleed halo and feathered edges; dry-brush gaps and spatter on the heavy start of the final circle |
| [Particle field](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/particle-field/STYLE.md) | Smoke made of light that condenses into calm, clear forms at night; no words | AI and data openers, abstract intros, logo builds | ground #0A0F1C, accent cyan #6FD3E8 on exactly 5% of the points; form to form `power2.inOut` 0.9 s per point | The same 5% of points stay on the middle of every form, so one cyan thread runs through the whole piece |

The [film style library](film-style-library.md) has related but longer looks: Chinese Ink Wash and One-line Drawing near **Ink line**, Red Paper-cut near **Paper cut**. Offer the one that fits the length: these 21 are tuned for 9 to 17 s pieces.

## Building a look in FrameMotion

- **Composition.** Build in HyperFrames (one paused GSAP timeline) or as an own engine page with `seek(t)`. Every reference piece runs on one clock (`render(t)` from time alone), so it maps to the [engine contract](engine-contract.md) directly.
- **Reference pieces.** Read a reference piece to learn the look, then write the composition from the brief's copy, sizes and timing. Never ship a reference piece with its words swapped: the layouts carry the author's own copy and coordinates.
- **Built-in engines.**
  - Paper grain and soft gradients: `paper-shader` (`grain-gradient`, `mesh-gradient`).
  - Riso misregistration and halftone: `pixi-filter`, or CSS blend layers.
  - Particle forms: `tsparticles` or a seeded canvas painter.
  - Self-drawing sketches: `p5-brush`.
  - All of these are in the [library engines](../assets/engines/libraries/README.md).
- **Fonts.** The looks name free Google Fonts (Inter, Inter Tight, Switzer, League Gothic, Archivo Black, Bodoni Moda, Playfair Display, IBM Plex Mono). Load each one offline from a local file, or swap it for a bundled font in `assets/fonts` that has the same role. A render never fetches fonts from the web.

## Making a piece loop

A loop is seamless only when the frame at the end is exactly the frame at the start.

1. **No entrance.** Frame 0 is a finished, good-looking frame. Move the build-in later, or start the clock in the middle of a hold.
2. **One clock.** Nothing reads real time.
3. **Whole cycles.** Every wave, sway, bob or rotation completes a whole number of cycles over the length: `sin(2π · n · t / D)` with whole `n`. A drift like `x = t · speed` becomes a sway or a wrap.
4. **Out and back.** Every one-off change (colour, morph, zoom, count) returns to its start value. Snap to the exact end value when a move finishes.
5. **Wrap the noise.** Grain, flicker and particle frames indexed by frame use `frame % totalFrames`.
6. **Reset while hidden.** Anything that must jump back does so off screen or covered.
7. **Keep moving at the seam.** Something big crosses the loop point, so it never reads as a pause.
8. **Prove it.** Frame 0 and the last frame are identical, and the step from the last frame back to the first is no bigger than a normal frame step. FrameMotion's renderer reports the hash of each frame. Compare frame 0 with the frame at the full length, rendered as frame `D · fps` with the loop wrap switched off.

## Rights

The look names, palettes and numbers are used under the MIT licence, with credit in FrameMotion's `NOTICE`. The descriptions here are FrameMotion's own. A delivery built on a look needs no on-screen credit.
