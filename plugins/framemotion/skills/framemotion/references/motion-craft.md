# Motion craft: concrete starting values

Use this reference when designing or implementing motion, after the brief and storyboard define what must be communicated. The numbers are Studio starting heuristics for a first pass, not platform rules or proof of quality. Adjust them to the approved style, viewing size and actual playback, and record the chosen values in the motion contract. Public standards cited here are named; everything else is craft guidance to verify by watching the result.

Since FrameMotion 0.4.0 this page is also the merged home of [bang-motion](../assets/library/bang-motion/README.md) by Bang Tutorial ([github.com/bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) at `c1aa65e921c970d858705fcb4a53a8294d1a4131`, MIT): its laws against slide-like motion, the style brief, the opener concepts, the transition and background menus and its traps are adapted below in English and joined with FrameMotion's own values. Its After Effects bridge for the paid Higgsfield service is not part of FrameMotion. The original Indonesian text and its HTML starters stay byte for byte in the library for code recipes.

## Principles that decide most results

1. **One focal point per moment.** At any frame the viewer should know where to look. Stage secondary elements after the focal element settles, not at the same time.
2. **Motion explains a change.** Every movement should reveal, connect, compare, emphasize or transition. If it does none of these, remove it or make it quieter.
3. **Enter fast, settle slowly.** Entrances use ease-out, exits use ease-in, moves between two rest states use ease-in-out. Linear motion only for constant processes (progress bars, scrolling tickers, rotation that never stops).
4. **Consistent direction and origin.** Keep one direction of progress (left to right or bottom to top for left-to-right languages) and grow elements from a meaningful origin (the button, the data point, the previous element), not from the centre by default.
5. **Contrast in energy.** Alternate active passages with readable rests. A sequence where everything moves all the time reads as noise.
6. **Hold the result.** The final state of each idea needs a readable hold before the next change; the end card needs the longest hold.

## A video, not a slide deck

Adapted from bang-motion's structural tests (Bang Tutorial, MIT). Check the code and the frames, not the feeling; one failed test means rework before the user sees it.

1. **Scenes change because the world or the camera moves**, not because a section fades out and the next fades in. Three or more scenes switched on and off by opacity are a slide deck. Exception: a staged cartoon, where each stage is fully alive (ten or more things acting) and stages cut or slide about 96 px.
2. **One visual thread survives the whole film:** one subject in continuous action, or one collage, paper or white world the camera travels through. Full-bleed photos that replace each other with no shared world are slides; so is one picture plus one sentence per scene, even with a moving camera. An explainer scene carries three to five elements that enter phrase by phrase.
3. **At most two levels of text per moment:** one large number or sentence plus one label in the world. Kicker plus title plus body is three. A document, stamp or date block of up to three short lines counts as an object.
4. **Every second has motion from the chosen background language** (below). A slow push on a photo as the only motion is a slide.
5. **Transitions vary with the boundary.** Fade, scale bump and light leak on every cut is a template; use whips to another angle, cuts to an instrument (map, gauge, profile) or a push-through where they mean something.
6. **No miniature world.** A camera zoom under about 1.08 that leaves houses thumb-sized and half the frame empty is a slide even when everything moves. Break the world into frame-sized stages.
7. **No template skeleton.** First scene a word that grows and exits left, three feature tiles in a row, a typed search box, hook then feature then feature then promise then logo then call to action: two or more of these without a reason in the concept means the skeleton is a template. Choose again from the [opener concepts](#opener-and-promo-concepts).

## Style brief before code

From bang-motion (MIT), merged with the brief FrameMotion already keeps. Before any code, write these lines and show them with the rundown; changing a rundown is cheap, changing code is not.

- Theme or product and three adjectives for the feeling it should leave.
- For an opener or promo: three candidate [concepts](#opener-and-promo-concepts), one chosen with a reason from the product, and its fingerprint (concept, number of scenes, main object per scene, opening, ending).
- Palette: one main colour from the brand itself (logo, app icon, site, packaging), one background, one accent, each with hex and source; a colour not from the brand is written "derived: reason".
- A display face with character for that feeling (not Poppins, Inter, Roboto, Montserrat or Arial) and a companion; a product UI keeps its own UI font.
- Text emphasis: none, or one named form. Word highlights are optional, never a default.
- Background language per segment (menu below) and the plan for any background change with its visible trigger.
- One signature move (an object wipe, a 3D roll per word, flying paper, a line that draws, a colour block hitting the edge): it moves objects or text, not the background.
- Background surface of at least two layers (gradient, light, texture, grainy gradient), never one flat colour.
- One render family for objects (flat, clay, glossy, glass, isometric, realistic, neon line).
- Photos, when the concept uses people, places or products: the source is asked, never assumed (the user's photos, the `framecore-open-assets` plugin or licensed stock; an image generator only through a tool the user chose and approved).
- Which boundaries need a designed transition and which a cut.
- One special moment where the most expensive effect is spent, once.

Rules that go with it: a starter is architecture, not style, so no grey placeholder, system font or default background may survive; a reference gives rhythm (shot length, transition types, order of attention, energy), never its skin (palette, fonts, textures, layout, sentences, unique moments), and copying a supplied reference's skin is declined in one sentence with a theme-born version offered; two different products differ in at least three of palette, font, background language and signature move, and in their skeleton; backgrounds are not dark by default; and when two options both pass these rules, choose the bolder one.

| Style direction | Background | Type | Signature motion | Suits |
| --- | --- | --- | --- | --- |
| Dark cinematic | near-black gradient, particles or nebula, bloom on objects only | clean bold grotesque | push-through, light across the lens | creative tools, gaming, technology |
| Poster colour block | large solid fields changing per scene | very bold display, giant letters cut by the edge | block wipes, type hitting the frame edge | consumer apps, music, events |
| Bright editorial | white or cream, wide space, hairlines | display serif with a small grotesque | gentle slides, lines that draw, calm camera | productivity, finance, SaaS |
| Paper and print | paper texture, collage cut-outs, stamps, tape | handwriting with a serif | objects fly in and land, tilted angles | education, community, food |
| Retro analog | faded colour, grain, scan lines, VHS frame | 70s to 90s geometric | controlled glitch, rough zoom, freeze | nostalgia, music, entertainment |
| Mono brutalist | black and white, hard grid, ruled boxes | monospace with condensed | hard cuts, shifting blocks, blinking cursor | developer tools, technical |
| Cheerful pastel | layered pastels, large round shapes | bold rounded sans | elastic bounce, shapes that bloom | children, health, lifestyle |
| Dark luxury | black with gold or bronze, soft shadows, sheen | tall wide-spaced serif | slow moves, sweeping light, depth | fashion, automotive, property |
| Flat pop with photos | bright neutral alternating with solid brand fields; flat shapes and stickers from the logo's geometry | bold rounded geometric sans, giant words cut by the edge | cut-out people from below, stickers popping, fields snapping on the beat | consumer apps, fintech, e-commerce, youth brands |
| Grainy gradient | deep base, saturated 2 to 3 colour shapes glowing from inside, fine grain over the frame | small clean grotesque or minimal bold display | shape layers opening or turning slowly, camera through a hole in a shape | tech, AI, music, creative launches |

Two openers in a row on the same row of this table is a warning: choose another or combine two rows in a new way.

## Easing presets

Use the project's installed APIs. Equivalent values across runtimes:

| Purpose | CSS / cubic-bezier | GSAP | Remotion |
| --- | --- | --- | --- |
| Standard entrance | `cubic-bezier(0.33, 1, 0.68, 1)` (ease-out cubic) | `power2.out` | `Easing.out(Easing.cubic)` or `Easing.bezier(0.33, 1, 0.68, 1)` |
| Confident, crisp entrance | `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out quart) | `power3.out` | `Easing.bezier(0.25, 1, 0.5, 1)` |
| Dramatic reveal, fast start and long settle | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out expo) | `expo.out` | `Easing.bezier(0.16, 1, 0.3, 1)` |
| Move between two rest states | `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out cubic) | `power2.inOut` | `Easing.inOut(Easing.cubic)` |
| Exit | `cubic-bezier(0.32, 0, 0.67, 0)` (ease-in cubic) | `power2.in` | `Easing.in(Easing.cubic)` |
| Constant process | `linear` | `none` | `Easing.linear` |

GSAP `power1`–`power4` correspond to quad, cubic, quart and quint curves. For a physical settle in Remotion, `spring({frame, fps, config: {damping: 200}})` gives a smooth approach without overshoot; lower damping adds bounce. Check the installed version's signature before use. Use overshoot or bounce only when the brief calls for playful character, and never on body text.

## Durations in frames

Values for 30 FPS; double them for 60 FPS and scale proportionally for other rates. Shorter values feel snappy and technical, longer values feel calm and premium. Pick one tempo family per project and keep it.

| Element | Typical range at 30 FPS | Notes |
| --- | --- | --- |
| Small label, icon or UI detail entering | 8–12 frames | |
| Headline line reveal | 12–20 frames | Mask reveals read best around 15 frames |
| Hero title or logo resolve | 20–45 frames | Protected logos keep geometry; animate approved parts only |
| Move or scale between rest states | 20–40 frames | Longer distance needs longer duration |
| Scene transition (push, wipe, mask) | 10–20 frames | |
| Dissolve | 6–15 frames | Longer dissolves look unintentional |
| Exit | 60–75% of the entry duration | Exits should not compete with the next entrance |
| Per-word stagger | 2–4 frames | |
| Per-line or per-item stagger | 4–8 frames | |
| Per-letter stagger | 1–2 frames | Only for a short display word, never for sentences |

Keep the total stagger of a group shorter than its own entry duration so the group reads as one gesture.

## Readable holds

A hold begins when the whole phrase is legible, not when its animation starts. Starting heuristic: about 13 characters per second plus 0.5 seconds to settle, with a minimum of 1 second. Example: a 26-character line needs about 2.5 seconds, 75 frames at 30 FPS. A second check counts words: half a second plus a third of a second per word, from the moment the last word has landed and stopped moving (kaventro/motion-designer); use the longer of the two, at least 1 second. `check-score.mjs` and the craft critique (`critique.py`) apply exactly this rule. Increase it for small viewing sizes, dense layouts, secondary languages or data that must be compared. Confirm by watching at the intended size; the heuristic is not a reading standard.

## Vocabulary and signature

Name moves by feel and keep one set per video (adapted from [kaventro/motion-designer](kaventro-motion-designer-adaptation.md)):

| Feel | How | Scene engine |
| --- | --- | --- |
| arrive | ease-out, from below or from what caused it | `entryEasing` (`easeOutCubic`, `easeOutQuart`) |
| settle | a calm landing for panels, cards and end cards | `resolveEasing` (`easeOutExpo`) |
| depart | ease-in, faster than the arrival; last in, first out | `exitEasing` (`easeInCubic`), `exitFrames` about 60–75% of `entryFrames` |
| snap | quick state changes: a list shifting, a value updating | short `entryFrames` (8–12) |
| glide | camera-like moves over 0.8–1.2 s | `easeInOutCubic` (the sweep line) |
| drift | 2–3% movement during a hold so a still frame is not frozen | custom code; the engine holds still |

- **One relay object.** A small element (a dot, a line, a shape from the logo) travels through the video and returns at the end, so the first and last frames rhyme.
- **An accent with one meaning.** The accent marks now or just changed; new values arrive in it. Do not spend it on decoration.
- **One signature per video.** One move or effect the video is remembered by carries more than five. Name it in the brief; [motion styles](../assets/motion-styles/README.md) each name one.
- **Effects mark moments.** A glitch on a cut, a shake on a drop; constant textures stay quiet (film grain at about 8–15% opacity). Effects never hide text that must be read.

## Rhythm and music

- Frames per beat = FPS × 60 / BPM. Example: 120 BPM at 30 FPS = 15 frames per beat; 128 BPM at 30 FPS = 14.0625.
- Compute every cue from the master timeline as `round(beatIndex × FPS × 60 / BPM)` instead of adding rounded beat lengths, so rounding errors do not accumulate.
- Put major events on downbeats or bar starts, and let smaller accents fall between. Cutting on every beat flattens the rhythm: something may move on a beat, but scenes change on bar lines.
- Land the biggest reveal on the music's drop. Put the drop in the beat map first and plan backwards from it; when the story needs more or less time, change the holds, never the music's speed.
- Land the visual impact on the cue frame; start the motion before it so the peak arrives with the sound.
- Leave silence or a sustained note under the final hold when the message needs attention.
- The [sync tool](../assets/motion-sync/README.md) records the grid in the contract, reports where scenes and holds fall on it and imports voice-over subtitles as captions.
- Flashes and strobes: at most 3 full-frame flashes in any second (a flash is a pair of opposite brightness changes). A beat-driven pulse on full-frame brightness counts as a flash; let the beat move an accent instead, and keep a pulsing word at 3–6 % scale. Screen the render with [`flash_check.py`](../assets/motion-quality/README.md) (screening, not conformance).

## Transition grammar

| Transition | Use when | Avoid when |
| --- | --- | --- |
| Hard cut | Ideas are separate, energy is high, or the beat demands it | The viewer needs to track one object across scenes |
| Match cut or shape continuity | A shape, colour or position carries meaning into the next scene | The shapes do not genuinely relate |
| Mask or wipe | Revealing a new layer of the same idea, or a clear direction of progress | Several wipes in different directions in one sequence |
| Push or slide | Moving through a sequence, list or timeline | The content is not ordered |
| Scale-through or zoom | Going deeper into a detail or pulling out to context | Used as decoration without a deeper or wider subject |
| Morph | One state truly becomes another (before and after, data change) | The two states have unrelated structure |
| Dissolve | Time passing or a soft change of mood | Fast, informational sequences |

Choose two or three transition types per project and repeat them consistently. Consistency is not one wipe everywhere: where scenes belong together, let an element carry the change (a product, a search field, a selection mark); keep a full-frame wipe or mask for a real break. Three or more identical full-frame wipes read as slides, and the critique flags them ([commercial motion](commercial-motion.md#2-prove-the-picture-on-real-frames-first)).

The transition is the exit: do not fade or shrink the outgoing scene before a wipe, mask or push that covers it, or the frame goes empty before the cut.

### Transitions with depth

From bang-motion's transition menu (MIT). In one film use at least two kinds, at least one with depth, and a full-frame wipe at most twice. Rejected as defaults: a flat colour rectangle sweeping the frame, a thin line sweeping, and one transition repeated on every cut.

| Transition | How | Feel |
| --- | --- | --- |
| 3D push-through | camera through layers at different depths (perspective about 1400 px), front layers pass faster | diving into the world |
| Card or object turning in | the next object arrives from depth turning `rotateY` from about -35° to 0, the old one leaves the opposite way | premium, tactile |
| Object with thickness past the lens | an extruded logo, glass card or 3D tile grows 1 to 2.5 times with directional blur, closing the frame for a moment | cinematic |
| Light sweep | light covers 40–60 % of the frame at the cut, never 100 % | soft |
| Mask through a brand shape | the new scene shows through a growing logo or letter hole (`clip-path`, mask) | strong brand |
| Whip with directional blur | the world shifts 120–200 px with about 18 px blur for about 0.3 s, alternating direction; never far enough to show the stage edge | energetic |
| Rack focus | the old scene blurs and recedes, the new one arrives sharp from the front | narrative |
| Overlapping choreography | old elements leave fast while new ones already enter, the camera keeps breathing | flowing |
| Background change behind any of the above | a dark to light or colour field change happens while the frame is covered | new segment |

Transitions carried by an object, with no cut (the next scene's object becomes the wipe, a shape match with a change of render style, a pull back that reveals the destination, a container that blooms and shrinks, a result that recedes into the next sentence), are listed in bang-motion's [object-carried transition menu](../assets/library/bang-motion/upstream/references/opener-konsep.md). A palette field that becomes the next segment's background, with the logo staying in place and flipping colour at the field's edge, is allowed at most twice per film. Spin, yaw or roll jolts with blur on every cut are video-editor presets, not motion design.

## Video types

Starting shapes for common requests (adapted from kaventro/motion-designer). A social cut of any type runs 15–25 s in 1080 × 1920 and shows its strongest moment in the first two seconds.

| Type | For | Length · format | Scene kinds |
| --- | --- | --- | --- |
| Title or sting | an intro, outro, logo or channel open | 3–10 s · any, often looping | `logo-reveal`, `end-card`, one signature move |
| Interview or testimonial | a person speaks on camera or in a supplied clip | 15–60 s · any | `lower-third` for the name and role, captions, `quote` for the line that matters |
| Kinetic type | a quote, manifesto or announcement | 10–40 s · vertical or square | `line-reveal`, `quote`, a line per beat |
| Explainer | a topic or an idea, often with voice-over | 30–90 s · landscape or vertical | `item-stagger`, `counter`, `bar-chart`, `line-chart`, captions |
| Data video | a statistic or result | 8–30 s · any | `counter`, `item-stagger`; sourced numbers only |
| Feature cards | several features quickly | 15–30 s · vertical or square | `line-reveal` headline per feature, `end-card` |
| Product film | a product's real interface at work | 20–60 s · landscape, square or vertical | `device` with screenshots, `end-card`; see [product films](product-films.md) |
| Overlay on footage | lower thirds, captions, end cards over a recording | the footage's length and format | custom code over the user's footage |

## Opener and promo concepts

From bang-motion's concept menu (MIT). Write three candidates, choose one from what the product is; two may combine, but the skeleton comes from one. Details and code for each are in bang-motion's [concept page](../assets/library/bang-motion/upstream/references/opener-konsep.md) (Indonesian) and its [opener starter](../assets/library/bang-motion/upstream/assets/starter-opener.html).

| # | Concept | Premise and shape | Camera and transitions | Suits |
| --- | --- | --- | --- | --- |
| 1 | One continuous shot | one space or object, 4–6 moments, text on the world's surfaces | the camera keeps moving; a new moment is a new place reached | creative tools, hardware, spaces |
| 2 | Pure type | words build, break and rebuild into the logo | rhythm from the audio, words from five or more directions | strong taglines, events, releases |
| 3 | Problem then gone | chaos peaks, one product action sweeps it clean, logo | chaos shakes and piles up; one big sweeping move | productivity, utilities |
| 4 | Before and after | split frame or a moving divider; each slide one feature | the divider is the transition | editors, filters, optimisers |
| 5 | Journey inside the UI | the camera flies through a giant interface; buttons are platforms | fly-through, parallax UI layers | apps with a distinctive UI |
| 6 | Product macro | 4–6 extreme close details, the whole product only at the end | rack focus, slow turn, light over surfaces | hardware, packaging, food, fashion |
| 7 | Object metaphor | one real object (key, seed, bridge) transforms through the film into the logo | the morph is the transition | security, cloud, finance |
| 8 | Living number | one big number changes; each change reveals context | the number stays, the world behind changes | milestones, performance |
| 9 | One feature, fully shown | input, process, satisfying result; other features only as flashes | follows the hand or cursor, cut-ins to detail | apps with one clear strength |
| 10 | Question answered in the world | a question written in the world, answered by a product action | the camera moves from question to answer | AI, search, support |
| 11 | Rhythmic collage | 12–20 fragments of 0.3–0.8 s, a motif returning every four beats | cut on the beat, shape match cuts | music, lifestyle, events |
| 12 | Logo as the stage | every scene happens inside the logo's geometry; at the end the camera pulls out | the camera enters the logo's openings | brands with a strong logo shape |
| 13 | Object relay | one object travels through the service's stages to the receiver, 4–6 stages, no text but the brand on the object | each transition is carried by the object | e-commerce, delivery, marketplaces |
| 14 | Brand system parade | logo, symbol, mascot, stickers, type and palette introduced as one family, 8–12 short beats, loops back to the logo | each beat born from the previous one; two full colour fields as chapter marks | launches, rebrands, agencies |
| 15 | Claim, how, result | short claim, the UI used by a cursor, the result blooming from the UI, repeated per feature | no cuts; the UI container blooms into the result and shrinks to where the next claim appears | new features, generative AI, SaaS |
| 16 | Living UI ecosystem | scattered tools tidied by the product icon, the UI assembled and used, results, integrations, call to action, 12–16 beats | carried by the UI; at most two hard cuts as chapter marks | B2B SaaS, AI assistants, dashboards |
| 17 | Flat pop with photos | real cut-out people, flat shapes and brand fields alternating fast, 15–18 beats | almost every beat changes the background with a trigger; photo montage on the beat | consumer apps, fintech, youth campaigns |
| 18 | Through gradient shapes | one brand shape layered and glowing; the camera or a light orb passes layer by layer | no cuts; each beat entered through the previous shape | tech, AI, music, premium launches |
| 19 | Product tour with claims | the real UI toured, pausing every few seconds on a short claim on a brand field | carried by the UI (dimming, lifted cards, split screen); one or two cuts | SaaS, CRM, dashboards |

An app or SaaS film has at least one living UI passage (assembled, used, producing) built from the product's own components, not a still screenshot being zoomed; important clicks are followed by the camera (close in at 1.4–2.2 times over 0.6–0.9 s, click, pull back), not every click.

## Background: always moving, never louder than the subject

From bang-motion (MIT). The background never stands still and never competes with the text.

- **Text pocket.** Under text, the background is dark (at most 25 % luminance) or light (at least 80 %), never busy mid-tone; background elements in the pocket take the dark side of the palette at opacity 0.35 or less, with no more than about 40 bright elements visible. Outside the pocket the background is rich: at least two layers, never one flat colour, never pure black or white. Check a frame in greyscale: nothing behind the text is as bright as the letters.
- **Titles stay clean:** full-strength text with a thin drop shadow; glow is for objects, not headlines.
- **Background colour may change** whenever the segment, mood or brand rhythm calls for it, but always with a visible trigger (a wipe, an object covering the lens, a UI action, a push into a colour field, a cut on the beat), never an unmotivated cross-fade.
- **One background language per film** (two when segments change), chosen in the brief and different from the previous project:

| # | Background language | Feel | Note |
| --- | --- | --- | --- |
| 1 | Textured surface, breathing camera and one slow change (tint, light, grain) | calm, expensive | the quietest valid choice |
| 2 | A large 2–3 colour gradient moving or turning slowly | soft, modern | tween over 8–15 s |
| 3 | 2–4 floating blurred colour blobs | friendly | drift about ±60 px over 4–6 s |
| 4 | Living grain or paper texture | organic, print | offset from time, never random noise |
| 5 | One light sweep per segment | premium | not a continuous sweep |
| 6 | Large geometric or negative-logo shapes turning once per 20–40 s, two parallax layers | brand, strong | shapes from the logo or theme |
| 7 | Particles rising slowly (dust, bubbles, sparks) | warm | not horizontal |
| 8 | A breathing grid or pattern (scale or opacity 1.0 to 1.04 over 6–10 s) | technical, precise | no scrolling |
| 9 | Giant ghost text drifting behind | editorial | low contrast, one style |
| 10 | A theme photo or illustration with slow push and two-layer parallax | narrative | needs a dark gradient on the text side |
| 11 | Horizontal flow (streaks, lanes) | speed, data | only when the theme is speed or flow, never two projects in a row |
| 12 | Alternating palette fields snapping in 0.15–0.3 s on an object, UI action or beat | pop, energetic | each field carries moving flat shapes |

## Typography in motion

- **Line mask reveal:** each line rises from below its own clipping box with an ease-out entrance of 12–18 frames. Reliable default for headlines. A mask about 1.3 times the font size keeps descenders whole; the scene engine's 1.1 is tight, so check `g`, `j`, `p`, `q` and `y` at rest.
- **Word stagger:** words enter 2–4 frames apart with small offsets (about 20–40 px at 1080p) and opacity. Good for short statements.
- **Emphasis:** change colour, weight, underline or scale (about 1.04–1.08) of one key word after the line is readable. Emphasize one idea per line.
- **Living text** (from bang-motion, MIT): sentence case at weight 500–600; bold capitals for one emphasis scene only. Titles, claims and short phrases have no full stop by default; punctuation only when it changes meaning or rhythm (a real question, a deliberate pair of short sentences), decided once in the brief. Two consecutive scenes never share text size, entry direction and position. Order of attention: the sentence, then the main object, then supporting detail.
- **Directional blur** on every text entrance and exit, along the direction of travel.
- **Counters:** animate integers with tabular figures so width does not jitter; hold the final value and show the unit and source.
- **Voiceover sync:** derive word timing from the actual transcript or audio analysis, not from estimated speech rates, and mark estimates as designed timing.
- Use real font files and wait for them to load. Test the longest string and diacritics at the smallest intended viewing size.
- Right-to-left and complex scripts (Arabic, Hebrew, Persian, Devanagari, Thai): mirror the reveal direction but keep the film's timeline running left to right; isolate Latin names and numbers so they keep their order; add no letter spacing and no slant to Arabic, whose letters join; animate by word, never by letter, which breaks shaping. Render a test frame with the real font before promising the look.

## Layout and legibility

- Starting margins: keep text at least 5–8% of the frame width from the edges. Platform interface overlays and safe zones change; check current platform documentation when the delivery placement is named, and do not invent them.
- Contrast: WCAG 2.x success criterion 1.4.3 asks for 4.5:1 for normal text and 3:1 for large text. Use it as a floor for on-screen text, and check the darkest and brightest frames behind moving text.
- Size: on a 1080 × 1920 vertical frame, body text below about 40 px is hard to read on a phone; headlines usually work from about 80 px. On a 1920 × 1080 stage watched on a phone, nothing goes below 30 px (body at least 44, labels 34, credits 30; from bang-motion). Verify at actual size.
- Fill the vertical frame: sizes are authored for the 1080 px short side, so a 9:16 format often looks empty. Set `tokens.contentScale` (1.2 to 1.3) in that format's tokens before enlarging single params; the critique reports a vertical hold whose content fills too little of the frame.
- Real type: a style with `fonts` (or the user's licensed brand fonts declared the same way) gives the preview and the MP4 the same typeface; see the [renderer's fonts](../assets/motion-render/README.md#fonts).
- Use a grid for the whole film and keep recurring elements in the same positions so the viewer learns the layout.

## Common defects to remove before review

- Everything animates at once, or every element uses the same duration and easing.
- Text moves while it should be read, or disappears before its hold ends.
- Bounce or overshoot on serious, corporate or data content.
- Decorative particles, glow, grain or HUD labels filling empty space without meaning.
- Transitions in many different directions with no logic.
- Jitter from fractional positions, unloaded fonts or numbers changing width. Round the resting positions of type to whole pixels; keep fractions for motion only.
- An ending without a stable final frame.
- A few pixels of drift standing in for pacing: drift keeps pixels moving but adds no information, so a long drifting hold is still a still stretch.
- A word cut by a mask, a box or the frame edge while it should be read, including decorative background words; a container that fits does not prove its text fits.
- A photograph's own background showing as a rectangle on a different scene colour.

### Traps in browser builds

From bang-motion's traps (MIT), for HyperFrames and HTML builds:

- A low bloom threshold turns the screen white; additive nebula layers pile up through bloom.
- A more specific CSS selector beats the initial `opacity: 0`, so an element appears before its animation; set initial states where the timeline sets them.
- A browser caches JavaScript modules, so an edit "does nothing": serve with `Cache-Control: no-store` while editing.
- A flat 3D object turned a full 360° on Y becomes a line edge-on; rock it, do not spin it.
- The default SVG filter box clips the tail of a blur; widen the filter's `x`, `y`, `width` and `height`.
- A video clip with `autoplay` or `loop` runs on its own clock; drive it from the timeline (bang-motion's `clip()` helper, or the engine's seek) inside an animated container.
- No `Date.now()` or `Math.random()` in the render path; numbers that change every frame use `font-variant-numeric: tabular-nums` with a minimum width.

## Recording the choices

Add the selected tempo family, easing presets, transition set and hold values to the motion contract's motion system so implementation and review use the same numbers. Starters in this package read them from the shared `motion-score.json` format; see [the Remotion kinetic type starter](../remotion/assets/kinetic-type-starter/README.md) and [the GSAP starter](../assets/gsap-motion-starter/README.md).
