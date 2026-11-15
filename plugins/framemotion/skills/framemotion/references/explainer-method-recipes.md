# Explainer method and recipes

Read this for a narrated explainer, a how-it-works or onboarding film, a whiteboard or cut-paper explainer, an isometric or diagram build, a personalised recap made from a data table, a math explainer, or a short film drawn entirely in code. It holds the story and timing method these share, a storyboard written as data, the hook, and seven explainer recipes with their key numbers, the mistake that most often spoils each, and how FrameMotion builds it.

Each recipe links its full source page. Use those pages as reference text only. Commands, installs, paid services and folder layouts in them are not FrameMotion instructions. FrameMotion builds on its own engines and its own renderer.

**Sources** (MIT, credited in `NOTICE` with the licence texts in `integrations/`; no file is copied into FrameMotion):
- [iart-ai/explainer-video-skills](https://github.com/iart-ai/explainer-video-skills) at `3c13a1bc360c08503f24f9c9a99fda6d3d35de56` (Copyright (c) 2026 iart.ai): explainer, whiteboard, isometric, diagram and recap methods. Its Remotion parts are rewritten for FrameMotion's engines.
- [iart-ai/javascript-animation-skills](https://github.com/iart-ai/javascript-animation-skills) at `060f7467a6e5ae5b57c90c9cb1b3508c13b88e49` (Copyright (c) 2026 iart.ai): films drawn in code, the storyboard as data, drawing techniques and the code-written score.
- [0xS4N4TG/papercut-explainer](https://github.com/0xS4N4TG/papercut-explainer) at `ff8223abc8136cc09e8d7e9b62ecb5d080c389e1` (Copyright (c) 2026 sanat): the cut-paper method and the three-layer hook. Method only: no Remotion code, no generated backdrops and no fonts copied.
- [Yusuke710/manim-skill](https://github.com/Yusuke710/manim-skill) at `a0048d9e265499038f34a9aa58ff16d306b5034c` (Copyright (c) 2025 Yusuke Miyashita): narration-first timing for math explainers.

**Related references:**
- [Art-style and explainer direction](art-and-explainer-motion-direction.md) for which grammar fits which section, the camera, and the rules that hold across grammars.
- [Motion craft](motion-craft.md) for easing, durations and holds.
- [Stickman and faceless explainer craft](stickman-explainer-craft.md) for figure-led explainers.
- [Data-led motion](data-motion-and-feedback.md) for charts that must hold up to scrutiny.
- [Motion sound design](motion-sound-design.md) for the score and effects.
- Voice-over recording and captions belong to FrameCut; FrameMotion supplies the timing they follow.

## Story before pictures

- **One core idea.** Write the one sentence the viewer should be able to repeat afterwards. If it needs two sentences, the film has no spine yet: cut scope until it fits. Material that does not serve the idea is dropped, not shrunk.
- **The voice is the spine.** Write and time the voice-over before the storyboard. Pictures illustrate the line being spoken and never lead it. Cutting a sentence is cheap; cutting a built scene is not.
- **Earn the mechanism.** Make the cost of the problem felt before showing the fix. The tension is why the viewer stays for the solution.
- **One analogy, kept.** Borrow the metaphor from daily life (waiting in line, a heating dial, a factory belt) rather than from the field being explained, and let it shape both the pictures and the script. If the analogy needs its own explanation, it is the wrong one. Switching analogies mid-film resets understanding.

| Stage | Job | Share of the film | Pace |
| --- | --- | --- | --- |
| Problem and stakes | Name the pain in the viewer's words and show what it costs | about 20% | brisk, short holds |
| Solution | The fix in one plain sentence | about 15% | one clear hold |
| How it works | The mechanism in 1 to 3 concrete steps, one step per scene | about 45% | slowest: hold each step |
| Payoff and call to action | The after-state and one next action | about 20% | confident; hold the end card |

### Timing from the voice

- **Speaking rate.** Friendly narration runs at about 2.3 words per second (140 per minute); technical or number-heavy lines at about 2.0. A local synthetic voice can run faster (one source measured about 2.5): time the real take, not the plan.
- **Word budgets** at 2.3 words per second: 30 s holds about 69 words, 60 s about 138, 90 s about 207. Cut the script to the budget before building anything.
- **Scene length** = the line's words divided by the rate, plus about 0.4 s of breathing room. A beat with no voice still needs at least 1.0 s.
- **FrameMotion's hold rule** in [motion craft](motion-craft.md#readable-holds) is the minimum its checks apply. When a source number is shorter, use the longer hold.
- **Narration-first budgets.** Generate or record the voice first, measure each line, and give every line its own segment with exactly that duration. Inside a segment, the animations plus the waits must add up to the line's length; check the sum by simulation before rendering (the Manim source does this with a stub that only counts time).

## The hook in three layers

A short explainer opens with three separate layers. None may be left implied, and all three are written before the script.

| Layer | Rule |
| --- | --- |
| **Show** (frame 0 and the first 2 s) | Start inside the action, on its most striking moment: nothing that sets the scene first, no fade up, no empty set. Muted, it still has to make sense. |
| **Write** (the title on frame 0) | 2 to 5 words, a number when possible, readable in full for about 2 to 3 s. It completes the question the voice opens, in different words. |
| **Say** (the first spoken line) | Opens a gap within about 10 words, says who it is for, brings the stake or the number early, and does not answer itself. No anonymous news framing (a line that opens on an unnamed "somebody" who did something). |

- **Alignment.** The three layers share one subject and only the wording changes. Hide any two of them and the one left should still point at that subject.
- **Five variants, scored.** Write five hooks from different patterns (address the viewer, then give a figure; a single object with a figure and a surprise; a shocking price; a pain point; a verdict or a clash). Give each a point for every yes:
  1. Is there an open question within the first ten or so words?
  2. Is the audience or the stake named?
  3. Is there something concrete: a figure, an object, a surprise?
  4. Is the answer held back?
  5. Do the first frame and title work without sound?
  6. Does every claim match the facts list?

  Keep the best score; drop any variant that fails question 6.
- **Leave the hook moving.** A hook that ends on a held pose drops the attention it earned. Over its final ten or so frames, pull back a touch and then push in faster and faster; start the next scene with something landing on its main object and let the camera settle back from there. Lift the title away during the push so it does not cover the next scene. In a dense kinetic reel skip the pull-back and keep only the push, since those reels never pull the zoom out mid-move ([dense kinetic reels](dense-kinetic-reels.md)).

## The storyboard as data

Keep the beat grid, shot list and blocking as data the scenes, camera and score all read, so image and sound cannot drift apart. In FrameMotion that data is the [motion contract](motion-contract-json.md) (`motion-score.json`): the beat grid, shots and sound events live there, the composition reads them, and the storyboard is still shown and approved from that file before the build. Do not keep a second copy of these tables in the composition or in a document.

- **Beat grid first.** Pick a tempo from the mood and a section shape:
  - escalation (intro, build, peak, break, payoff) for comedy and reveals;
  - steady (one texture that breathes, no drop) for ambient pieces, lullabies and poems;
  - steps (a short motif per step, a pause between, a resolve) for explainers;
  - verse and return (a theme, a contrast, the theme again) for stories.

  Cuts and visible actions all land on beats or half beats. If the piece builds to a payoff, a brief silence just before it is worth keeping.
- **Shot length by form:**

  | Form | Typical shot |
  | --- | --- |
  | Comedy, hype | 1 to 3 s |
  | Story | 2 to 5 s |
  | Explainer | 3 to 6 s, a single idea each |
  | Lullaby, ambient, poem | 5 to 10 s, with slow dissolves |

- **One row per shot:** time in beats, framing, camera move, the action, where everyone stands, the beat the action lands on, its sound and its transition. Vary framing (wide, medium, close, extreme close) and transitions (hard cut, match cut, a push into or out of an object such as a screen or window). Keep a dip to a plain colour for chapter breaks.
- **One world, many cameras.** For a story or an explainer, place the whole cast and every prop in a single world, each with its own track on the film's clock (where it is, its pose, its face); shots are just cameras pointed at that world. A cut then cannot break continuity. A title sequence, a type film or a showreel holds together by rhythm instead and may cut between worlds.
- **Continuity still needs care:** let something pass through each cut (one object seen on both sides, or a push into a detail that opens the next scene); keep left-to-right motion going the same way; objects held, the lighting and the hour stay as they were.
- **Believable staging:** objects sit on something, feet touch the ground, and only a joke floats. A person working at a screen is clearest from behind their shoulder, the screen facing us.
- **Cause and effect.** Each beat follows from the previous one (A makes B happen, rather than A and then B by chance). Draw the metaphor onto the object that stands for it; a label beside an unexplained picture does not land. A punchline gets its own shot: the reveal, then the reaction, cut on a beat.
- **One event list, two readers.** Every visible action with a sound goes into one list of `[time, sound, argument]`. The scene triggers the action and the score plays the sound from the same entry.
- **Check the picture against the rows.** Once the first render exists, grab one still per shot at its action beat and compare it with that shot's row: does the character stand where the plan puts them and do what the row describes, and is it clear what just happened?

### Forms

| Form | Structure |
| --- | --- |
| Story | Open on a 2 to 4 s title, let the middle change something, and close on an ending that settles: all motion stops before the final line shows. One specific human detail beats general adjectives. |
| Explainer | Open on the question, not the answer; one mechanism step per scene; show cause, not labels (things fall, fill and count because of the previous thing). A meter or counter that stays on screen from scene to scene links the steps into one chain. Close with a single-line recap. Each on-screen fact needs a named source. |
| Poem or ambient | No story: one mood carried by 2 or 3 images that transform into one another, 6 to 10 s each, slow crossfades and almost no words. |
| Loop | First and last frame are identical: build every motion from functions periodic in the loop length, and compare frame 0 with the last frame. |

## Seven explainer recipes

| Recipe | What it is | Key numbers | Most common mistake | Build in FrameMotion |
| --- | --- | --- | --- | --- |
| [Narrated explainer](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/explainer-video/SKILL.md) ([workflow](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/explainer-video/references/script-to-screen-workflow.md)) | A 30 to 90 s product, onboarding or concept film from script to delivery | Shares 20/15/45/20; 2.3 words per second; scene = words / rate + 0.4 s; one type scale, one colour grammar and one ease locked before scene 2 | A feature tour with no argument; changing easing or transitions between scenes so it reads as a montage of experiments | HyperFrames, one paused timeline; captions and voice from FrameCut on the same timing table |
| [Whiteboard draw-on](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/whiteboard-animation/SKILL.md) ([recipes](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/whiteboard-animation/references/draw-on-recipes.md)) | A hand draws pictures and handwriting stroke by stroke while the voice explains | Linear or very gentle ease on long strokes; hold 0.4 to 1.0 s after each element; writing starts about 0.5 s after its phrase begins and a named label finishes as its word is spoken | The pen tip drifting off the stroke, or sliding across blank board between strokes | HyperFrames SVG; see [whiteboard](#whiteboard-draw-on) |
| [Isometric build](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/isometric-animation/SKILL.md) ([recipes](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/isometric-animation/references/isometric-recipes.md)) | Stacked layers, extruded blocks and exploded views in 2.5D | True iso axes at ±30°, 2:1 dimetric at about 26.57°; layer build `back.out(1.4)`, 0.12 s apart; explode 0.7 to 1 s `power3.inOut`; drift 6 to 12 s, a few degrees | Perspective sneaking in (far things shrink), or scaling to fake height | Built-in [Hairline](../assets/hairline/README.md) or [Iso Glow](../assets/iso-glow/README.md), or the Animate engine's isometric look (so far only its demo; say so); see [isometric](#isometric-build) |
| [Diagram and chart reveal](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/diagram-animation/SKILL.md) ([recipes](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/diagram-animation/references/diagram-and-chart-recipes.md)) | Flows, architectures and charts that build one idea per beat | Nodes, then edges, then labels; hold each step 0.5 to 1.5 s; node pop 0.8 to 1 scale `back.out(1.5)`; edges 0.4 to 0.7 s; bars 0.06 s apart; lines 0.8 to 1.2 s; inactive parts at 35% | Everything on screen at once; a colour meaning that changes mid-piece | HyperFrames SVG; [transition, effect and data recipes](transition-effect-and-data-recipes.md) for data and maps |
| [Year-in-review recap](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/wrapped-video/SKILL.md) ([scenes](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/wrapped-video/references/scene-grammar.md), [batch](https://github.com/iart-ai/explainer-video-skills/blob/3c13a1bc360c08503f24f9c9a99fda6d3d35de56/skills/wrapped-video/references/batch-pipeline.md)) | One template and a data table become one personalised vertical film per row | 5 to 7 scene types of 2.5 to 4 s; each frame reads in under 2 s; the share card holds still at least 2 s; 9:16 type clear of the top 12% and bottom 18% (the source's value: check the current safe area of the named platform before relying on it) | Opening on the biggest number, so the rest feels like a comedown; copy that would read the same for two people | One engine page whose parameters are the row; see [recap](#year-in-review-recap) |
| [Cut-paper explainer](https://github.com/0xS4N4TG/papercut-explainer/blob/ff8223abc8136cc09e8d7e9b62ecb5d080c389e1/skills/papercut-explainer/SKILL.md) ([style](https://github.com/0xS4N4TG/papercut-explainer/blob/ff8223abc8136cc09e8d7e9b62ecb5d080c389e1/skills/papercut-explainer/references/style-guide.md)) | A 20 to 45 s vertical explainer in layered construction paper: a taped headline per beat, word-by-word torn-paper captions | Scenes 1.5 to 5 s (about 2.8 s on average); 2 to 4 visual events per scene, one on each stressed word every 0.4 to 0.8 s; camera push 1.00 to 1.06–1.12 per scene | Smooth paper with outlines and gradients; the world camera shaking instead of only the labels boiling | Its own engine page or HyperFrames composition with the rules below (the Animate engine's cut-paper look is a separate style with its own rules); see [cut paper](#cut-paper-explainer) |
| [Math explainer](https://github.com/Yusuke710/manim-skill/blob/a0048d9e265499038f34a9aa58ff16d306b5034c/skills/manim-skill/SKILL.md) | Formulas, graphs and geometry narrated line by line | One scene class per chapter; each narration line one segment with its measured duration; every animation given an explicit run time | Animations that overrun their line, so voice and picture drift | The [Manim bridge](motion-toolkit-runtime-cards.md#manim-local-clip-bridge) for a rendered clip, or the Animate engine's math look (one or two finished pieces so far; say so); see [math](#math-explainer) |

### Whiteboard draw-on

- **Draw by dash offset.** A path reveals itself when its dash offset runs from its length to 0. Give each path `pathLength="1"` so one 0-to-1 value is the draw progress on any path, and compute it from time in `seek(t)`, never with a running transition.
- **The pen sits on the tip.** Place the hand at the point at the same progress along the path (`getPointAtLength(length × progress)`), offset by the measured nib point of the hand drawing, not its corner. Lift it (hide it, jump to the next start) between strokes.
- **Drawable art.** Single open strokes in the order a hand would draw them, long lines broken only where a pen would lift. A coloured area draws its outline first, then the fill appears behind it. Handwriting is drawn glyph by glyph in reading order, or swept by a mask with the pen on the mask edge.
- **One thing at a time.** The eye and the single hand follow one tip: one drawing per beat of the voice, then a hold, then the next. Clear the board between sections with one consistent grammar (always a wipe in one direction, or reverse drawing).
- **Pace from the voice.** A drawing takes about as long as the line it illustrates. Slow the hand on emphasis, speed up minor connecting strokes, and when a drawing is done but the voice is still talking, move the hand away or start the next drawing.

### Isometric build

- **One projection, never mixed.** True isometric for vector and 3D work (ground axes at ±30°); 2:1 dimetric for pixel and tile scenes, where a tile at column c, row r sits at `((c − r) · w/2, (c + r) · w/4)`. No perspective: far things keep their size.
- **Shade by face from one fixed light:** top lightest, left middle, right darkest. This is the trick that makes blocks read as solid.
- **Height is a lift along Z,** never a scale. Build in physical order (bottom layer first), not in markup order. An exploded view rests pulled apart and assembles by closing one shared gap value.
- **Camera drift is tiny and slow** (a few degrees or pixels over 6 to 12 s); a big move shows that the drawing is flat.
- **Real occlusion or shadows** need real geometry under an orthographic camera with equal x, y and z position (see [GSAP and three.js for frames](gsap-and-threejs-for-frames.md)).
- **In FrameMotion,** a calm object explained by one choice is Hairline; something live that glows on the beat is Iso Glow; an illustrated scene is the Animate engine's isometric look, which has only carried its own demo so far, so tell the user before choosing it. Write a new projection only when none of the three fits.

### Year-in-review recap

- **Data drives everything.** Every name, number, headline and colour comes from the row; a scene that cannot be filled from the row does not belong. In FrameMotion the row is the engine's parameters, validated against its schema before rendering, so one template renders one film per row.
- **Designed for the pause.** Each scene reads in under 2 s and looks good frozen, because the frozen frame is what gets shared.
- **Scene types:** intro ("your year"), big number, top-five list, persona or superlative, comparison or percentile, busiest time, share card. Pick 5 to 7.
- **Rising stakes.** Rank the stats by how big, rare and flattering they are, and play them smallest first. The biggest number is the climax, held largest and longest.
- **It is about the viewer.** The name and a personal accent colour in the first 2 s, every line in the second person, about what this viewer did. Decide the share card first: the headline restated, the name and handle, the mark and one short call to action, completely still for at least 2 s.
- **Counters.** Drive the count from time with an ease or spring and tabular figures, so digits do not change width as they roll.

### Cut-paper explainer

- **Six non-negotiables.**
  1. Everything is paper: one flat colour, fibre grain, an edge that is not quite straight and a soft shadow underneath; never a stroke outline or a gradient.
  2. Shading comes from stacked cut pieces (a darker strip under, a lighter strip on top), not from blends.
  3. Two voices of type: bold capitals on a taped strip for each beat's point, and a rounded heavy serif on ripped tags for the words being spoken.
  4. Every set is a paper world that illustrates the words of its line; real product screens sit inside the set as rough paper rebuilds.
  5. Never fully still.
  6. Saturation is earned: muted backgrounds, colour only on characters, captions and signals.
- **Three tracks per beat.** The voice tells the story, the banner adds a hard fact the voice skips (read alone, the banners make a fact sheet), and the set illustrates the voice's words.
- **Two motion layers, never mixed.** The world camera moves smoothly and continuously (a push of about 0.6 to 1% scale per second towards the focal object, essentially no jitter). Only screen-space paper (the banner, labels) boils: it holds 2 frames, then jumps by about ±1 to 2 px at 1080p with a seeded offset. Everything else runs on ones.
- **Material recipe.** Grain multiplied at 8 to 15%; a 1 to 2 px pale rim along the upper and left sides; edge displacement of 1.5 to 3 px; a drop shadow of 3 to 6 px down with 6 to 10 px blur at 25 to 40% black; torn edges only on the banner and tags; 2 to 4% film grain over the frame; light from the top left.
- **Drawing.** Build from simple shapes, front-on or side-on only, 2 or 3 tones per object, details as separate stacked pieces, nothing meaningful under about 12 px at 1080 wide. One base creature for the whole cast, told apart by accessories and a name pill; expressions are part swaps.
- **Timings at 30 fps:**

  | Motion | Frames | Feel |
  | --- | --- | --- |
  | Prop pop-in | 6 to 9 | spring: scale 0, 1.08, 1 with a ±4° settle |
  | Caption word pop | 3 to 5 | scale 0.6, 1.05, 1 and 8 px rise, no fade |
  | Slide-in | 8 to 12 | strong ease-out with 4 to 8% overshoot |
  | State change | 1 to 2 | hard swap plus a small sparkle burst |
  | Typing | about 2 per character | block caret |
  | Transition | 6 to 12 | each with its own sound |

- **Camera and cuts.** Give each scene its own named camera move, and use a simple push-in for no more than a third of them. Cut straight on most banner changes, whip-pan on two or three changes of topic, allow one page turn or rip in the whole reel, and enter the call to action with a strip of tape pulled away or a whip.
- **Proof once.** Show the real source once: a genuine screenshot taped to a paper card, with a red marker ring drawn around the line that matters. All other screens remain loose paper versions. Shortly before the call to action, return once to a set seen earlier.
- **Sound budget.** Whooshes and whips average no more than one per 2.5 s of film; things arriving make a contact sound (a pop, a thud, a stamp) or none at all.
- **In FrameMotion** this method is its own composition: an engine page or a HyperFrames composition on one paused timeline, with the backgrounds made in code (no generated backdrops). It is not the Animate engine's cut-paper style, which follows its own rules (everything on twos including the camera, torn edges, crayon and a pattern on every shape; `assets/animate-engine/styles/cut-paper/STYLE.md`). Pick one of the two per film and never mix their rules: this method for a vertical reel built on voice, banners and a smooth camera; the Animate style for a warm collage history or a character piece.

### Math explainer

- **Narration first.** Write only the spoken lines, generate or record them, measure each one, then write one segment per line with that exact duration. Each segment ends with a wait for whatever time is left.
- **Exact type.** Formulas are typeset (LaTeX), not drawn as plain text; prose uses the typeset text object too, because some plain-text renderers space letters oddly.
- **Check the timing before rendering.** Simulate the scene timeline: overlapping captions, animations that run past their line, and lines that run past the scene's end are errors. A simulation is not proof of sync: inspect the rendered frames and the muxed audio afterwards.
- **Iterate by chapter.** One scene per chapter so a fix re-renders only that chapter; extract the exact frame a comment points at before changing code.
- **In FrameMotion** a Manim render is a clip handed to the master timeline through the [Manim bridge](motion-toolkit-runtime-cards.md#manim-local-clip-bridge), with its version, frame count and hash recorded. Without Manim, the Animate engine's math look draws formulas and geometry in the browser on FrameMotion's own clock; it has carried only one or two finished pieces, so tell the user before choosing it ([Animate engine](animate-engine.md)).

## Films drawn entirely in code

A short film where every pixel is computed: no images, no loaded fonts, no libraries. It fits a personal story, an explainer, a poem, a loop or a lullaby. In FrameMotion it is an engine page whose `seek(t)` draws the frame from time alone.

- **Derive the look from the subject,** never from a previous piece: a film about tides might be drawn as pale ink on blue paper; one about bread might be warm marker on cream. Two subjects should not come out alike. When the user shows someone else's film as a reference, take the drawing methods and leave its characters, plot and layouts.
- **Pure function of time.** Each frame is calculated from `t` and a seed alone: nothing carried over between animation frames, no CSS animation, no physics summed step by step, no random without a seed.
- **A hand-drawn line boils, it does not jitter.** Re-roll the wobble on every fourth frame (about 7.5 times a second at 30 fps); re-rolling on every frame turns into flicker.
- **Rounded forms for bodies.** Ellipses and rounded rectangles; low-point polygons look like icons (a five-sided hand, a box for a chest). Choose the camera angle that makes the pose obvious, and paint from the back forward: hair behind, then body, neck, face and the hair in front.
- **A recurring character is designed once, alone,** on one sheet of its expressions and poses, before any scene. It is one function with options, and it exposes anchor points (mouth, hands) that props attach to, so a held object stays in the hand when the character moves.
- **From the user's photos:** keep the 3 to 5 features that make the person themselves, exaggerate those and simplify the rest, take real colours and objects from the photos, and stay clearly stylised. Photos stay local and never go into anything published.
- **Text never collides.** Register every text box and key object, and place moving labels in the first free spot; FrameMotion's text checks then catch the rest.

**Drawing techniques** ([source with code](https://github.com/iart-ai/javascript-animation-skills/blob/060f7467a6e5ae5b57c90c9cb1b3508c13b88e49/skills/javascript-animation/references/techniques.md); the source marks which were used across whole films and which were only checked as stills):

| Technique | How | Tested in the source |
| --- | --- | --- |
| Ink line | A path stroked through two-frequency noise, twice (a full pass and a fainter thin one); 1 to 2.5 px wobble; hatching 6 to 12 px apart at 20 to 40% | whole films |
| Picture-book shapes | Base fill, a darker rim towards the bottom right, a few lighter brush strokes, an outline in a darker tint of the fill (never black), soft cheeks or glows | a whole film |
| Flat masses and blueprint | Shapes with a shadow side and no outline; dashed construction lines that fade as the real thing appears; line widths kept constant under zoom | a whole film |
| Spot-colour print | Each ink on its own layer, knocked slightly out of register, grained, then multiplied, so overlaps make new colours; two or three inks | stills only |
| Single-line engraving | One continuous spiral whose width follows a brightness field, never wider than the gap between turns | stills only |
| Words as the shape | A phrase repeated to fill a region, or set along a path, so the word and the picture merge (a repeated line of words becomes the outline of a hill) | stills only |
| Marker fill | Wide parallel strokes that overlap, each tint varied a little, partly transparent, with rounded ends | stills only |

- **Depth without 3D** (a road, a river, a corridor): assign every passing object a depth `d` that cycles from 0 to 1; draw it at height `horizon + (height − horizon) · d²` with a size that also follows `d²`. Squaring the depth is what sells the perspective.
- **Canvas pitfalls:** create a gradient after the transform it lives in (otherwise it is offset twice and draws nothing); monospace fonts silently swap missing glyphs (`≈` became `=`), so check the stills; write `-(x ** y)`, since `-x ** y` is a syntax error.

### A score written in code

FrameMotion's [sound design](motion-sound-design.md) owns the score and the mix. These rules from the same source add to it when the score is written in code for one film:

- **A tempo map per scene,** with every scene lasting a whole number of bars so cuts fall on downbeats; list cuts inside a scene among the cues as well.
- **Mark cuts with harmony, not volume.** Walk each scene home to the dominant and arrive on the tonic at the cut. A jump of more than about 6 dB into a cut, against the second before, reads as a jump scare; a rise of 3 to 5 dB together with a chord change feels like a clean cut. Add no extra accent on the cut's downbeat.
- **Bring layers in one or two per bar.** In the source's measurements, kick and bass arriving at once after a soft intro jumped 11 dB; one bar apart, 3.5 dB.
- **A silent bar right before the payoff** hits harder than any accent in a short film.
- **Check it.** A cut more than about 100 ms (3 frames) from a strong onset is off the beat; a deliberate stinger is the only accepted startle.
- **Limits.** Code synthesis suits music boxes, plucks, pads, bells and soft percussion; realistic voices, orchestras and genre production need a supplied or licensed track, and then the picture follows the music.

## Checks before delivery

Add these to FrameMotion's frame review for any explainer:

- **Every scene reads in one second** from its thumbnail; no blank frames except intended dips at cuts.
- **The still at each shot's action beat matches its storyboard row,** and the metaphor reads cold, without explanation.
- **Shapes read as what they are,** nothing floats (heads on necks, props in hands), draw order is right, and a recurring character looks the same in every scene.
- **Pace fits the form,** framing varies with at least one push in or pull out, and no shot is dead (a drift, a breath or a change of light keeps it alive).
- **Every visible action has its sound** in the event list, and every cut is on the beat without a startle.
- **Endings hold** after motion settles; a loop's first and last frames match.
- **Each fact shown is traceable** to a source listed with the piece; made-up figures are labelled as illustrative.
- **Private material** (family photos, names) stays local.

## Rights

Method notes, timings and recipe names are used under the MIT licence, with credit in FrameMotion's `NOTICE`; the descriptions are written for FrameMotion, with short technical phrases and all values following the sources, and each source's licence text is in `integrations/`. The examples in this file are FrameMotion's own; the sources' worked examples (products, companies, numbers, characters, film subjects) are not reused. Named products and apps are referred to by what they do.
