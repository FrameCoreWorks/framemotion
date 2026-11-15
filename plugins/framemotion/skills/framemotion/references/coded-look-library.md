# Coded look library (21 looks with exact numbers)

Read this when a brief needs a complete look for a short motion piece (an app demo, a data beat, a type sting, a calm paper story) and the user has no brand look of their own, or wants one of these. Each look is a short, strict spec: palette in hex, one accent, fonts, easing in names and seconds, motion rules, signature moves and a ban list. FrameMotion describes each one here in its own words. The full spec of a look is its linked `STYLE.md`. Most looks also link a working HTML reference piece. The full specs are not in FrameMotion's package: a host without web access works from the numbers on this page.

The looks come from [claude-video-2](https://github.com/ItsssssJack/claude-video-2) (MIT, Copyright (c) 2026 Claude Video Studio contributors), reviewed at commit `18891e4996abb7ccc0085f2d43cef2fd7eff1dc8`. No file of it is copied into FrameMotion. Its Higgsfield route (paid AI clips) is not used.

**Related libraries:**
- [film style library](film-style-library.md): 66 longer film looks (painting, East Asian traditions, documentary).
- [`motion-styles`](../assets/motion-styles/README.md): 11 token sets that the motion contract uses directly.
- [type, title and format recipes](type-title-and-format-recipes.md) and [transition, effect and data recipes](transition-effect-and-data-recipes.md): single moves rather than whole looks.

## How to use a look

1. **Use one look per piece, and stick to it.** Paste its spec into the brief. Its colours become tokens at the top of the composition, and no colour is typed anywhere else. A fixed look is what stops the drift between shots towards the default AI look of a dark background, glow and a purple gradient.
2. **Brand comes first.** Brand colours replace a look's colours while its rules stay. A look never overrides the brand's type or marks: when the brand has a strong look of its own, use `brand-native` in [motion styles](../assets/motion-styles/README.md) instead.
3. **Write the brief in numbers.** Give the size and length, hex colours, easing written as a curve name and a duration (`expo.out`, 0.6 s; a word like "smooth" is not a value), the single main move of each shot and when it starts, and the ban list.
4. **Describe how a reference was made, not how it feels.** When the user brings their own reference instead of a look, write a new spec in the same shape: palette in hex, type, easing numbers, motion rules, signature moves and bans. Describe the making, such as masked text, a slow camera or long holds, and show it in five lines before building.
5. **Build it on the [engine contract](engine-contract.md).** One clock, every value a function of time, randomness seeded, fonts loaded before frame 0.
6. **Check frames, not code.** Take three stills about 0.6 s after each shot change, once things have landed, and score composition, motion, type, colour and idea. Fix the worst three before rendering. After the render, apply the pacing rule below and the usual [reel workflow](reel-workflow.md) review.

**Default ban list, always on.** Avoid everything below. Where a look's own signature needs one of them (a sun's glow, a centred widget), the look wins, because its reference piece is the proof:
- gradients that slide through hues;
- glow, bloom and lens flares;
- linear motion on whatever the viewer is watching;
- compositions where everything sits on the centre line;
- growing from scale 0 (begin at 0.6 to 0.9 and fade in instead);
- more than one accent colour;
- more than six words on screen at once;
- fake chrome effects.

**Pacing rule:** never more than 1 s in which nothing happens, and nothing that is visible for less than 0.3 s.

**Looks that show an app** (the app-interface looks below) invent a plausible app of their own: no real product's name, logo or brand colours appear.

**Colours and names in the tables are the source's values.** A user's brand colours replace them. Some come close to well-known brands (the warm clay accent of the app looks, the salmon page with deep blue of the editorial looks): use them only as starting points, never to imitate a brand.

## Type and posters

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Swiss grid](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/swiss-grid/STYLE.md) | Strict and quiet, with one heavy line of type on white | Titles, product facts, launch cards | ground #FFFFFF, accent #E4002B (one thing per shot), Inter 900 at -0.04em, land `expo.out` 0.6 s; 9 s loop | Words change inside a masked row, sliding through like goods on a belt; the red full stop jumps to the end of each new word and flattens as it lands |
| [Swiss kinetic](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/swiss-kinetic/STYLE.md) | A grid poster in the Swiss tradition, moving in time with music | Kinetic type, music promos, title sequences, stings | ground #F1EEE6 with grain, ink #111111, accent #E63022; Inter Tight 700 sized to grid cells; slams `expo.out` 0.36 s with 34 px motion blur clearing in 0.24 s; 120 BPM; 6 × 4 grid drawn first | A single red dot keeps changing role (a ring, a full stop, the dot over an i, a missing puzzle piece); the main word splits into three slices that slide against each other and lock back |
| [Poster pop](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/poster-pop/STYLE.md) | Concert-flyer energy: towering narrow capitals on one flat colour, cut hard | Hooks, Shorts, big claims, countdowns, "three things" lists | ground #FFD400, ink #111111 is the only accent, League Gothic caps at line height 0.85; 12 s loop | Key words sized at 80 to 150% of the frame height so two edges cut them; letters hit one after another 0.033 s apart with no settle |
| [Risograph](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/risograph/STYLE.md) | Two inks printed slightly out of line, with visible grain | Playful promos, events, music, culture | paper #F5F0E6, Archivo Black caps; 12 s loop | A stamped entrance (scale 1.12 to 1, settling 1 to 2° of rotation) while the second ink lands 4 to 7 px out and drifts home; a dotted halftone copy arrives badly misaligned and then jumps to an 18 px offset |

## Data, explainers and diagrams

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Data story](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/data-story/STYLE.md) | A broadsheet graph set in motion: quiet, precise, one blue line carrying the point | Retention charts, growth stats, before and after | ground #FFF1E5, ink #1A1A1A, accent #0F5499; Bodoni Moda title 88 px, hero number 316 px; line draw `sine.inOut` 2.5 s, count `expo.out` 1.0 s | Zooming means changing the axis limits rather than enlarging the picture, so tick marks re-space and stay crisp; a blue line separates from the black one and the space between them is hatched in blue |
| [Editorial paper](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/editorial-paper/STYLE.md) | Print-newspaper infographic: warm stock, black type, a single blue | Data, charts, "what the numbers say" | ground #FFF1E5, accent #0F5499, Playfair Display 700/900 tabular, Inter 500 labels; land `power3.out` 0.7 s, line draw `power2.inOut` 1.2 to 2 s | A single bar goes blue and outgrows its neighbours as its figure counts up; rows reorder smoothly as the blue one rises |
| [Explainer diagram](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/explainer-diagram/STYLE.md) | A sharp diagram of a system at work: each step is shown by a blue packet reaching its node | Pipelines, systems, product flows | white with a 38 px dot grid, navy #14213D, accent #2B7EF9; Switzer 800 (see fonts below), one word per card; card land `power3.out` 0.55 s; packets with a 220 px comet trail | No cuts: the camera glides from card to card and finally backs out to show everything; one deliberate error appears and is corrected by a note sent back along a wire |
| [Blueprint](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/blueprint/STYLE.md) | An engineering plan that draws itself stroke by stroke | How things work, product parts, engineering | ground #0E3A66, lines #CFE3F7 at 2 px, accent #FFD23F; IBM Plex Mono caps; strokes `power1.inOut` 0.6 to 1.2 s; 24 and 120 px grids | Faint guide lines streak across before the drawing follows them; in the exploded view the parts separate along a single axis, the inner ones a little late |
| [Midnight grid](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/midnight-grid/STYLE.md) | Dark navy with a faint dot grid, where only the blue element matters | Tech and AI explainers, flows | ground #0B1220, accent #3D8BFF on the active thing only, Inter 700; land `power3.out` 0.5 s; 12 s loop | Each wire draws with a blue spark at its leading end; when it arrives, the node it meets turns blue |
| [Growing city](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/growing-city/STYLE.md) | A small pastel island town assembling itself, then switching its lights on at evening | Growth over time, yearly recaps, milestones | sea #BFE3E0, accent coral #F27D72 on a few roofs and one car; Inter 700 month at 156 px; tiles drop `back.out(1.3)` 0.42 s | Tiles drop into place from the middle outwards; month and total count up in step as the buildings rise |
| [Time travel](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/time-travel/STYLE.md) | A single continuous camera along an unending timeline, every period drawn its own way | History of an idea, then and now, origin stories | ground ink #15120F; 17 s | Shape-matched cuts carry one form from age to age (cave painting, pottery, zoetrope, film, television, pixels, code), each frame drawn the way that age drew |

## App and product demos

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Graphite UI](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/graphite-ui/STYLE.md) | A quiet software film: near-black graphite ground, sharp interface, an unhurried exact camera | Software launches, app demos, feature reveals | ground #0E0F12, accent #3DD68C (the button, the cursor, the "done"), Inter 600; land `cubic-bezier(0.16, 1, 0.3, 1)` 0.6 s; 12 s loop | A 3D camera frames the app: wide and tilted, then square-on and near, then angled aside to leave space for a headline; a single green pointer presses a single green button and a tick draws on |
| [Video editor demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/editor-ui/STYLE.md) | A muted dark editing app in which an AI pointer performs a genuine edit before the interface breaks apart | "AI edits my video", workflow explainers, before and after | app #121212, panels #1D1D1D at radius 8, accent clay #D97757; Switzer 800; pushes `power3.inOut` 0.45 s to scale 1.4 to 2.1, then a 2 to 3% linear drift hold; perspective 2600 px | The camera leans with its own speed (0.0016° for each px/s, capped at 3°); the pointer always travels, never jumps, and every click leaves a 44 px ring; panels rush outward past the lens, each along its own ray from the middle |
| [Music app demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/audio-app-ui/STYLE.md) | A dark audio app in which an AI pointer places the cuts, fixes the tempo and composes the track | Audio tool launches, beat-sync explainers | desk #0A0A0B, accent clay #D97757, Switzer 750 tabular; 120 BPM, every cut on a beat | The tempo is pulled from 96 to 120 BPM and the grid slides, passes its target and clicks onto the markers; in the finale each beat bumps the frame (scale +1.8%) and each cut bumps it more (+3%) |
| [Design tool demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/design-app-ui/STYLE.md) | A light design canvas with other people's cursors visible, where an AI assembles a thumbnail | Design tool launches, layout explainers, A/B variant stories | canvas #EAEAE7 with a dot grid, white panels, accent clay #D97757, winner ring red #E5402A used once; Switzer 800 caps | Overlays are scaled by the inverse of the canvas zoom so they keep the app's own size; alignment guides and spacing labels in the accent appear as things snap; the chosen design rises out of the app as a social post |
| [Motion tool demo](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/motion-app-ui/STYLE.md) | A dark animation app where an AI pointer places keyframes and shapes the curve | Keyframe and easing explainers, title tool launches | app #121212, accent clay #D97757, Switzer 800 | From linear to eased: dots spaced evenly along the path, then the curve editor, where pulling both handles crowds the dots towards the ends |
| [Day-cycle widget](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/weather-widget/STYLE.md) | A single refined widget followed from morning to night in one unbroken shot | Product UI promos, state changes, dashboards | accent sun yellow #FFC94A; Inter 200 number at 300 px, tabular; land `expo.out` 1.1 s from scale 0.9; returns to its opening shape (not a seamless loop) | Two shadows (one broad and soft, one small and close), a bright upper edge and a gloss; the sun's light spills past the widget and warms its corner |

## Paper, ink and particles

| Look | Feel | Suits | Key numbers | Signature move |
| --- | --- | --- | --- | --- |
| [Paper cut](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/paper-cut/STYLE.md) | A pop-up storybook: stacked paper cut-outs, gentle shadows, genuine depth | Stories, travel, nature, gentle brand moments, loops | accent dusk rose #D98C7A on one small thing | Layers arrive back to front, each hovering 4% oversized on a broad shadow before it is laid down; during holds they rise slightly and settle one after another |
| [Paper world](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/paper-world/STYLE.md) | A fold-out paper scene that unfolds by itself while daylight fades to evening; wordless | Story openers, places, a day in, kids and book promos | paper #F2E8D5, accent #D98C7A; big sheets slide up from 820 px with `back.out(0.7)` 0.55 s | Edges cut as small 6 to 13 px facets, jittered with seeded noise; a 2.4 px bright rim where the sun hits, paper grain and fibres, and both a broad and a close shadow under each layer |
| [Ink line](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/ink-line/STYLE.md) | A single unbroken brush stroke that keeps becoming the next image; wordless | Brand stings, calm intros, logo reveals | washi #F4EFE6, vermilion seal #D23C2A used once at the end; bloom zoom `expo.out` 0.9 s | Six shades of ink, each spreading into a soft two-step halo with feathered edges; where the last circle starts heavy, the brush skips and spatters |
| [Particle field](https://github.com/ItsssssJack/claude-video-2/blob/18891e4996abb7ccc0085f2d43cef2fd7eff1dc8/styles/particle-field/STYLE.md) | Glowing haze in the dark that gathers into still, legible shapes; wordless | AI and data openers, abstract intros, logo builds | ground #0A0F1C, accent cyan #6FD3E8 on exactly 5% of the points; form to form `power2.inOut` 0.9 s per point | One fixed 5% of the dots always lands in the centre of each shape, drawing a single cyan line through the film |

The [film style library](film-style-library.md) has related but longer looks: Chinese Ink Wash and One-line Drawing near **Ink line**, Red Paper-cut and Paper-cut Lightbox near **Paper cut**, Risograph Print near **Risograph**, Blueprint near **Blueprint**, and Swiss Motion Graphics near **Swiss grid** and **Swiss kinetic**. Offer the one that fits the length: these 21 are tuned for 9 to 17 s pieces.

## Building a look in FrameMotion

- **Composition.** Build in HyperFrames (one paused GSAP timeline) or as an own engine page with `seek(t)`. Every reference piece draws each frame from time alone (`render(t)`), so it fits the [engine contract](engine-contract.md) as it is.
- **Reference pieces.** Study a reference piece to understand the look, then build the composition from the brief's own words, sizes and timing. Do not deliver a reference piece with only its text replaced: its layout is built around the author's copy and positions.
- **What the built-in [library engines](../assets/engines/libraries/README.md) can do today:**
  - Paper grain and soft moving gradients: `paper-shader` (`grain-gradient`, `mesh-gradient`), as a background.
  - Confetti, drifting dust or a point network, also as a transparent overlay: `tsparticles`. It does not form shapes or numbers; dots that gather into a form are a seeded canvas painter written for the piece.
  - Shockwave, god rays, CRT and glitch: `pixi-filter`, experimental. It works on its own test picture only and takes no other picture or values yet, so it cannot treat a scene from another engine.
  - `p5-brush` is experimental and draws its own demo drawing only.
  - Riso misregistration, halftone and self-drawing sketches are built in the composition: CSS blend layers and SVG for print looks, stroke draw-on for sketches.
- **Fonts.** Most looks name fonts from Google Fonts under the OFL (Inter, Inter Tight, League Gothic, Archivo Black, Bodoni Moda, Playfair Display, IBM Plex Mono). Switzer, used by five looks (the four app demos and Explainer diagram), comes from Fontshare under its own licence, not the OFL, and the source loads it from Fontshare's site: FrameMotion does not bundle it and replaces it with the bundled Inter unless the user supplies a font file they may use. Load every font from a local file; the bundled families in [`assets/fonts`](../assets/fonts/README.md) cover the common roles. A render never fetches fonts from the web.

## Making a piece loop

The seam disappears only when the final frame and frame 0 show exactly the same picture.

1. **Begin finished.** Frame 0 must already look complete and good; move any build-up later, or start the clock part-way through a hold.
2. **Time only.** Every value comes from the composition's clock, never from the system time.
3. **Complete cycles.** Periodic motion fits a whole number of periods into the length `D`: `sin(2π · n · t / D)` with a whole number `n`. Replace an endless drift (`x = t · speed`) with a sway or a wrap-around.
4. **Return home.** Whatever changes once (a colour, a shape, a zoom, a number) comes back to its starting value, and lands exactly on its end value when the move stops.
5. **Noise repeats with the loop.** Index grain, flicker and particle frames by `frame % totalFrames`.
6. **Hide the reset.** Anything that has to jump back does it out of frame or behind another element.
7. **No pause at the join.** Keep a large movement running through the loop point.
8. **Test it.** In FrameMotion, frame 0 and the state at `t = D` must be identical: call `seek(D)` in the page and compare the picture with frame 0 (the renderer itself stops at frame `D · fps − 1`). The step from the last frame to frame 0 must also be no larger than an ordinary step between two neighbouring frames; the renderer's per-frame hashes help compare.

## Rights

The look names, palettes and numbers are used under the MIT licence, with credit and the licence text in FrameMotion's `NOTICE` and `integrations/`. The descriptions are written for FrameMotion; short technical phrases and all values follow the source. A delivery built on a look needs no on-screen credit.
