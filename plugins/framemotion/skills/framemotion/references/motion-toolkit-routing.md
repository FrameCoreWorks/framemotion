# Motion toolkit routing

Use this extension inside the existing [code motion workflow](code-based-motion-graphics.md), in the shell column of the [runtime map](runtime-map.md). It adds implementation choices for an approved storyboard. It does not add a workflow owner, shared state, mode or approval gate. Preserve the current interaction mode, work pace, source locks and remaining QA budget.

## Choose by the required result

| Required result | Tool and responsibility | Existing implementation owner | Starting point |
| --- | --- | --- | --- |
| Typography, simple logo motion, diagrams and lightweight vector scenes | HTML/SVG with frame functions or a paused GSAP timeline; HyperFrames when available | Motion Graphics | [GSAP motion starter](../assets/gsap-motion-starter/README.md) or the dependency-free [frame starter](../assets/code-motion-starter/README.md) |
| Many graphic objects, masks, particles, filters or custom 2D effects | PixiJS draws the scene; the project frame selects every visible state | Motion Graphics, or Remotion Video when a React composition is selected from the brief or existing project | [Canvas toolkit](../assets/motion-toolkit/README.md) and [PixiJS card](motion-toolkit-runtime-cards.md#pixijs-2d-scenes) |
| Charts, data diagrams and numeric transitions | D3 computes data geometry and interpolation; Canvas, SVG or React draws it | Keep the chosen Motion Graphics or Remotion owner | [D3 card](motion-toolkit-runtime-cards.md#d3-data-motion) |
| Explanatory isometric geometry, mechanisms, SVG/WebGL layers and articulated 3D groups | Bundled Anatomy kit with React adapters, geometry audits and one explicit frame clock | Motion Graphics; Graphic Design for requested static/vector diagrams | [Complete Anatomy engine](../assets/anatomy-engine/README.md) |
| 3D geometry, materials, lights and camera choreography | Three.js and React Three Fiber through `@remotion/three` | Remotion Video | [Three motion example](../remotion/assets/three-motion-example/README.md) |
| Procedural material treatment with explicit time | Optional Paper Shaders; selected frame drives milliseconds | Keep the current Motion Graphics or Remotion owner | [Material adapter](../assets/motion-quality/README.md) |
| Synthesized timed sound accents | FrameMotion's [motion sound engine](../assets/motion-sound/README.md) designs and mixes them from the cue frames; optional Tone.js Offline in a browser project | Motion Graphics (Audio Production for songs, voice and external tools) | [Sound adapter](../assets/motion-quality/README.md) |
| A video file from an existing Canvas scene | Mediabunny encodes supplied frames and writes a compatible container | Keep the scene's existing implementation owner | [Canvas export card](motion-toolkit-runtime-cards.md#mediabunny-canvas-export) |
| Mathematical or geometric explanations | An available local Manim route renders a clip for the existing composition | Existing discoverable local Manim skill, then the selected Motion Graphics or Remotion owner | [Manim bridge](motion-toolkit-runtime-cards.md#manim-local-clip-bridge) |
| A ready transition, overlay (grain, light leak, vignette), lower third, caption style, chart or background | Search the HyperFrames registry first; other sources and exclusions on one page | Motion Graphics | [Ready-made motion assets](ready-made-motion-assets.md) |
| A supplied animation in Lottie JSON or a dotLottie archive | A compatible player renders the approved asset at an explicit frame | Keep the selected Motion Graphics or Remotion owner | [Lottie import card](motion-toolkit-runtime-cards.md#lottie-import-and-playback) |

Apply the shared [runtime selection policy](code-based-motion-graphics.md#runtime-selection). The rows describe suitable combinations, not automatic selection or installed availability. Prefer the project's working runtime. Add a library only for an observable requirement it satisfies. A small title does not need a 3D renderer; an existing Remotion scene normally keeps Remotion's export. Combining tools is appropriate when their roles are explicit, for example D3 geometry drawn by PixiJS and encoded by Mediabunny.

## Capability check before implementation

Record the actual host, available file access, shell, browser or preview, package versions, renderer and output access. Discover an existing skill through the host's real catalog before using it. A local Manim skill, shell, GPU or browser encoder available on one computer is not automatically available in ordinary ChatGPT, Work or another Codex session.

Use the example's package manifest and README as its execution contract. Copy it into an authorized project directory before installing dependencies; keep the installed plugin package free of `node_modules`, caches and rendered outputs. Preserve an existing project's lockfile and compatible versions. Missing dependencies require authorized installation; loading this reference or viewing the welcome menu grants none. Do not infer provider activation, upload, deployment or external rendering authorization from a toolkit selection.

If execution is unavailable, provide the requested complete source and edit instructions, and report preview/export as NOT VERIFIED. State the specific missing capability. If a simpler route can satisfy the same approved result, propose it with the relevant tradeoff; do not silently change locked delivery properties.

## One clock and one handoff

Keep integer frame count `N`, positive FPS, frames `0..N-1`, and half-open scene intervals from the existing motion contract. The scene's state is a function of the requested frame, approved assets and fixed configuration. Playback only selects frames. Pixi tickers, GSAP playback, Lottie autoplay, D3 timers and 3D real-time loops must not create competing time authorities.

For an imported clip, explicitly map master frames to clip timestamps and document any FPS conversion or retiming. Await assets, fonts, renderer initialization and the requested frame's completed draw before capture. Recheck forward, replay, backward and direct seeks using [toolkit acceptance](../templates/motion-toolkit-acceptance.md) within the existing [motion QA record](../templates/motion-qa-record.md).

Research supplies current API/rights evidence; existing copy, storyboard, asset, output-review and delivery owners keep their responsibilities. Record the chosen tool and limitations in the current motion contract and Project State. Do not create an additional registry or state machine.

## Evidence boundary

The reference cards describe supported implementation patterns. Release verification and the actual project's QA record state which paths were executed, on which host and with what result. Bundled source, static checks, a displayed canvas and a completed encoded file are separate evidence. None establishes the others. See [sources and adaptation](motion-toolkit-sources.md).

## Motion library

First check FrameMotion's built-in library engines ([library engines](../assets/engines/libraries/README.md), one renderer, exact frames): a moving gradient, grain or light-ray background is `paper-shader`; an effect over a picture (shockwave, CRT, glitch, god rays) is `pixi-filter`; a pattern grid is `css-doodle`; one word turning into the next is `torph-text`; confetti, dust or a point network is `tsparticles` (also as a transparent overlay); a drawing that draws itself is `p5-brush`. `pixi-filter` and `p5-brush` are experimental: they work on their own demo picture and drawing until scenes from other engines can feed them.

Every motion graphics source FrameMotion uses is inside it (owner request 2026-11-17: all motion skills, packs and repositories from FrameCore Works Toolbox moved into FrameMotion 1:1, with FrameMotion's own layer on top). Toolbox 1.17.0 no longer lists any of them, and none needs another plugin. The [motion library](../assets/library/README.md) holds the full upstream sources byte for byte, each with a README that says what FrameMotion changes; **where that README and the upstream text differ, the README wins**. FrameMotion keeps the brief, concept, copy locks, board, motion contract, QA, sound and delivery; a library source does only the step it is good at.

| Request | FrameMotion's route | Full source in the library | What the full source adds |
| --- | --- | --- | --- |
| Any GSAP build (HyperFrames, web pages) | GSAP starter, [motion craft](motion-craft.md), [GSAP and three.js for frames](gsap-and-threejs-for-frames.md) | [gsap-skills](../assets/library/gsap-skills/README.md) | GreenSock's full API pages (plugins, utils, timelines; scroll and React for web deliverables) |
| Any three.js or `@remotion/three` scene | Remotion three example, Anatomy kit, [GSAP and three.js for frames](gsap-and-threejs-for-frames.md) | [threejs-skills](../assets/library/threejs-skills/README.md) | the full r186 API pages (loaders, shaders, post-processing, R3F) |
| Transitions between scenes or clips in Remotion or HyperFrames | the transition grammar in [motion craft](motion-craft.md#transition-grammar), the [transition, effect and data recipes](transition-effect-and-data-recipes.md), FrameCut `transition_style`; for a shader transition between two pictures, FrameMotion's built-in `gl-transition` engine (236 shaders, [engines](../assets/engines/README.md)) needs no Toolbox entry | built in | no other source needed |
| Opener, bumper, promo, lower thirds, kinetic type as one autoplaying page | HyperFrames route | [bang-motion](../assets/library/bang-motion/README.md) | a second method with ready video-like grammar and seven starters; compare, do not replace |
| App or product launch film with real UI in a device frame, cut to music | the built-in [Launch engine](../assets/launch-engine/README.md) (twelve styles and the kaventro templates, one chooser), [kinetic launch films](kinetic-launch-films.md), [product films](product-films.md) | built in | no other source needed |
| A 9:16 reel beat: a growing number as a line graph, a route on a 3D city map, a minimal line-art beat, or a 3D cartoon "what if" explainer | the built-in [Reels engine](../assets/reels-engine/README.md) (four styles, a spec or a film folder) | built in | no other source needed |
| A quick launch video of a project just built, no full production | the reel starters | built in | no other source needed |
| Explainers and histories in illustrated looks (cut paper, ink, riso, sketchbook) | [Animate engine](animate-engine.md) in FrameMotion | built in | no other source needed |
| Cut-paper explainer reel from a link | The [cut-paper method](explainer-method-recipes.md#cut-paper-explainer) as its own composition (the Animate cut-paper style is a separate look with its own rules) | [papercut-explainer](../assets/library/papercut-explainer/README.md) | the nine-stage pipeline with its Remotion template, kit, backdrops, SFX and beds |
| Painter or tradition looks, Vox, Kurzgesagt, 3Blue1Brown grammars | the built-in [Art engine](../assets/art-engine/README.md) (its art styles, painter studies and explainer clips) and [art-style and explainer direction](art-and-explainer-motion-direction.md); a whole 16:9 film in one of 24 illustrated or 3D looks (art deco, risograph, blueprint, ukiyo-e, tilt-shift) is the [Lemo engine](../assets/lemo-engine/README.md). Rubber hose and shadow puppets are in both: Lemo for a complete 16:9 film with its own story, Art (`33_rubberhose`, `34_shadowpuppet`) for a short clip or a style study inside an explainer | built in | no other source needed |
| Rebuild the technique of a supplied reference video | [reference breakdown](../assets/reference-breakdown/README.md) | built in | no other source needed |
| Math, formulas, graphs, geometry | [Manim bridge](motion-toolkit-runtime-cards.md#manim-local-clip-bridge), [math explainer timing](explainer-method-recipes.md#math-explainer) | [manim-skill](../assets/library/manim-skill/README.md) | exact LaTeX and Manim scenes with narration, subtitle lint and mux |
| Stick figures, faceless explainers | the built-in [Stickman engine](../assets/stickman-engine/README.md) with [stickman explainer craft](stickman-explainer-craft.md); hand-inked line-art figures that really walk (planted feet, swinging clothes) in a living street, park or shop with a day-night cycle is the [Line-art engine](../assets/line-art-engine/README.md) | built in | no other source needed |
| Technical product as an isometric figure | [Anatomy engine](../assets/anatomy-engine/README.md) | built in | no other source needed |
| Isometric line figures on a web page | [Hairline video kit](../assets/hairline/README.md) for video | [hairline](../assets/library/hairline/README.md) (web original) | interactive pointer-driven figures and the library for a site |
| A product taking itself apart: an exploded view with labels, a part-by-part cutaway | the built-in [Cutaway engine](../assets/cutaway-engine/README.md): the teardown for a flat layered object (phone, watch, tablet), the bundled cutaway films for a machine rebuilt from one picture (GPU); Anatomy cutaways for diagrams | built in | no other source needed |
| Pixel effects, game juice, sprite sheets | [pixel VFX craft](pixel-vfx-craft.md) | built in | no other source needed |
| Sound effects, loudness, hits on cuts | Earshot, bundled in FrameMotion ([Earshot in FrameMotion](#earshot-in-framemotion)); without its engine the motion sound engine | none needed | Toolbox carries the same Earshot launcher; both share one runtime |
| A ready reel look with exact presets (kinetic type, formats, titles, lower thirds, beat transitions, footage effects, maps and data, animated captions) | [type, title and format recipes](type-title-and-format-recipes.md), [transition, effect and data recipes](transition-effect-and-data-recipes.md), [motion styles](../assets/motion-styles/README.md) | [varg-motion-styles](../assets/library/varg-motion-styles/README.md) | the full style pages and presets, byte for byte |
| A named look for the whole film (swiss-grid, risograph, paper-cut, blueprint, poster-pop and others) | [coded look library](coded-look-library.md), [motion styles](../assets/motion-styles/README.md) | [claude-video-styles](../assets/library/claude-video-styles/README.md) | the full look pages, reference pages and checks |
| Whiteboard draw-on, isometric 2.5D, animated diagrams, year-in-review recaps, narrated explainers | [explainer method and recipes](explainer-method-recipes.md), [art-style and explainer direction](art-and-explainer-motion-direction.md) | [iart-explainer-styles](../assets/library/iart-explainer-styles/README.md) | the full method pages and verify scripts |

Read a library source when the request needs it, not by default: open its README first, then only the upstream page for the step. Knowledge sources (`gsap-skills`, `threejs-skills`) need nothing installed. Pipelines (`papercut-explainer`, `bang-motion`, `manim-skill`, `hairline`) need a shell and their runtime; the README names the exact versions and replaces every upstream installer. Without that runtime, say so in one line and keep FrameMotion's route.

### Toolbox for what is not motion

FrameCore Works Toolbox still lists helpers outside motion graphics. Offer one only when it clearly improves this result, once, in the user's terms:

| Request | Toolbox entry | Why |
| --- | --- | --- |
| Moodboards and style, type or composition references | the brief's references | `pinterest-references` | public pins found by keyword, each saved with its pin link |
| A website that carries the motion piece | `taste-skill`, `hallmark`, `nateherk-design` | page design around the film; FrameMotion still makes the film |

### Using and installing a Toolbox entry

FrameMotion needs no other plugin; this works the same with or without Creative Studio. Hosts list the same skill under different names: Claude and Codex plugins `toolbox:toolbox` and `<entry>:<skill>` for an entry, Codex from Toolbox's older installer `toolbox`, ChatGPT Work a private plugin named after the entry. Any of these names in the skill list means it is installed. When it is there, say in one line that FrameMotion uses it for this step, read its skill and follow it for that step only; FrameMotion keeps the brief, copy, plan and review and checks the result like any other engine.

When the right entry or Toolbox itself is missing, offer it once, say what will be written, and install only on the user's yes, through this host's route ([Toolbox installation](https://github.com/FrameCoreWorks/framecore-works-toolbox/blob/main/plugins/toolbox/skills/toolbox/references/installation.md)):

- **Claude Code:** `claude plugin marketplace add FrameCoreWorks/framecore-works-toolbox` once, then `claude plugin install toolbox@framecore-works-toolbox` and, for an entry, `claude plugin install <entry>@framecore-works-toolbox`; a new conversation lists the skill.
- **Claude apps:** the user adds the marketplace `FrameCoreWorks/framecore-works-toolbox` under Customize > Plugins and turns the plugin on.
- **Codex:** `codex plugin marketplace add FrameCoreWorks/framecore-works-toolbox`, then `codex plugin add <name>@framecore-works-toolbox`.
- **ChatGPT Work:** Plugin Creator saves the entry as a private plugin following Toolbox's Work route in that installation page, from files read as text, never a ZIP from the user.

### Earshot in FrameMotion

Earshot (sound analysis, procedural effects, sound kits and the bank of 252 effects) is bundled: FrameMotion carries the launcher from FrameCore Works Toolbox 1.15.1 in [`assets/earshot/`](../assets/earshot/UPSTREAM.md) (provenance and changed files: `integrations/earshot/`). Toolbox is not needed for sound. Read [Earshot in FrameMotion](earshot/earshot.md) and run `python3 ../assets/earshot/scripts/runtime.py status --json` (paths from this folder); a caller's task goes through `assets/earshot/scripts/envelope.py` and comes back as a `framecore-task-result/1` ([shared contract](../../../contracts/framecore-task.schema.json)). Toolbox and FrameMotion use the same runtime root (`~/.framecore-works/earshot`), so an engine installed by either is found by both and never downloaded twice. The full engine is offered once at [first setup](first-setup.md) (owner decision 2026-11-16: most films have sound); when it is still missing at a sound task, first run `python3 ../assets/sound-setup/earshot_offer.py check`: when `declined` is true, use `sound.py` without asking (the user said not now; ask again only when they ask for Earshot, then `earshot_offer.py reset`); when `python312` is null, the engine first needs Python 3.12, so say that in the question. Otherwise ask once: full (about 2.6 GB, chooses sounds by listening), light (about 470 MB, makes and measures sounds but does not choose them by listening) or now with FrameMotion's own `sound.py`; install nothing before the answer; on not now run `earshot_offer.py decline`. Without the engine use `sound.py` and `listen.py`, and name the engine that actually ran.
