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

## Toolbox motion entries

FrameCore Works Toolbox lists reviewed third-party motion tools. FrameMotion keeps the brief, concept, copy locks, board, motion language and review; an entry only does the step it is good at ([using and installing an entry](#using-and-installing-a-toolbox-entry)). Check this host's skill list for the entry first; when it is there, say in one line that FrameMotion uses it for this step and read its skill. When it is not, FrameMotion's own route below does the job; offer the entry once, in the user's terms, only when it clearly improves this result, and install nothing before the user agrees. Names, pins and host support are in [Toolbox's catalog](https://github.com/FrameCoreWorks/framecore-works-toolbox/blob/main/plugins/toolbox/skills/toolbox/SKILL.md#catalog); this table is FrameMotion's routing judgment, checked against Toolbox 1.14.0.

| Request | FrameMotion's own route | Toolbox entry worth offering | Why the entry helps |
| --- | --- | --- | --- |
| Any GSAP build (HyperFrames, web pages) | GSAP starter, [motion craft](motion-craft.md) | `gsap-skills` | current GSAP API and plugin options (SplitText, MorphSVG, Flip, ScrollTrigger); knowledge only, no runtime |
| Any three.js or `@remotion/three` scene | Remotion three example, Anatomy kit | `threejs-skills` | current three.js r186 API and outdated patterns to avoid; knowledge only |
| Transitions between scenes or clips in Remotion or HyperFrames | the transition grammar in [motion craft](motion-craft.md#transition-grammar), FrameCut `transition_style` | `gl-transitions` | licensed GLSL shader transitions (page curl, glitch, zoom, morph-like wipes) with exact wiring |
| Opener, bumper, promo, lower thirds, kinetic type as one autoplaying page | HyperFrames route | `bang-motion` | a second method with ready video-like grammar; compare, do not replace |
| App or product launch film with real UI in a device frame, cut to music | [kinetic launch films](kinetic-launch-films.md), [product films](product-films.md) | `motion-designer`, `motion-launch-videos` | finished launch pipelines with their own render scripts |
| A quick launch video of a project just built, no full production | the reel starters | `brag` | one command, when the user wants speed over a designed film |
| Explainers and histories in illustrated looks (cut paper, ink, riso, sketchbook) | [Animate engine](animate-engine.md) in FrameMotion | `animate` | the upstream engine with seven styles and check-ins |
| Cut-paper explainer reel from a link | Animate engine's paper look | `papercut-explainer` | a ready cut-paper style with its own nine-stage pipeline |
| Painter or tradition looks, Vox, Kurzgesagt, 3Blue1Brown grammars | [art-style and explainer direction](art-and-explainer-motion-direction.md) | `huashu-art-motion` | 36 art styles and 9 explainer grammars with shot-list checks |
| Math, formulas, graphs, geometry | [Manim bridge](motion-toolkit-runtime-cards.md#manim-local-clip-bridge) | `manim-skill` | exact LaTeX and Manim scenes |
| Stick figures, faceless explainers | [stickman explainer craft](stickman-explainer-craft.md) | `stickman-kino` | a ready rig with 58 poses and about 190 props on HyperFrames |
| Technical product as an isometric figure | [Anatomy engine](../assets/anatomy-engine/README.md) | `anatomy` | the upstream skill for detailed interactive figures |
| Isometric line figures on a web page | [Hairline kit](../assets/hairline/README.md) | `hairline` | interactive pointer-driven figures for web, not video |
| A product or machine taking itself apart from one picture | Anatomy cutaways for diagrams | `cutaway` | a rendered three.js exploded view matched to a picture, best with a GPU |
| Pixel effects, game juice, sprite sheets | [pixel VFX craft](pixel-vfx-craft.md) | `pixelfx` | 244 ready pixel effects and sprite-sheet export |
| Sound effects, loudness, hits on cuts | the motion sound engine | Earshot, built into Toolbox | models, a bank of 252 sound effects and listening checks ([Earshot through Toolbox](#earshot-through-toolbox)) |
| A ready reel look with exact presets (kinetic type, VHS or analog-horror formats, titles, lower thirds, beat transitions, animated captions) | [motion styles](../assets/motion-styles/README.md), [motion craft](motion-craft.md) | `varg-motion-styles`, built into Toolbox | 56 reel styles with exact values |
| A named look for the whole film (swiss-grid, risograph, paper-cut, blueprint, poster-pop and others) | [motion styles](../assets/motion-styles/README.md) | `claude-video-styles`, built into Toolbox | 21 looks, each with palette, type, easing, motion rules and a ban list |
| A 9:16 reel from data or a spec (line graph, line art, 3D map route, phone exploded view, 3D cartoon explainer) | [motion scenes](../assets/motion-scenes/README.md), the reel starters | `animation-skills-styles`, built into Toolbox | five ready 9:16 engines driven by a JSON spec |
| Whiteboard draw-on, isometric 2.5D, animated diagrams, year-in-review recaps, narrated explainers | [art-style and explainer direction](art-and-explainer-motion-direction.md) | `iart-explainer-styles`, built into Toolbox | explainer methods and recipes |
| Moodboards and style, type or composition references | the brief's references | `pinterest-references` | public pins found by keyword, each saved with its pin link |

Knowledge entries (`gsap-skills`, `threejs-skills`) are worth reading whenever they are installed and the build uses that library. Pipeline entries (`motion-designer`, `motion-launch-videos`, `papercut-explainer`, `stickman-kino`, `cutaway`, `brag`, `bang-motion`) bring their own render and need a shell, Node and a browser; without them, say so and keep FrameMotion's route. The four style packs are inside Toolbox (`capabilities/reel-styles/<pack>/` of the `toolbox` plugin): with Toolbox readable, open the pack's README and use its presets as values for the motion contract. Never present an entry as required: FrameMotion works without Toolbox.

### Using and installing a Toolbox entry

FrameMotion needs no other plugin; this works the same with or without Creative Studio. Hosts list the same skill under different names: Claude and Codex plugins `toolbox:toolbox` and `<entry>:<skill>` for an entry, Codex from Toolbox's older installer `toolbox`, ChatGPT Work a private plugin named after the entry. Any of these names in the skill list means it is installed. When it is there, say in one line that FrameMotion uses it for this step, read its skill and follow it for that step only; FrameMotion keeps the brief, copy, plan and review and checks the result like any other engine.

When the right entry or Toolbox itself is missing, offer it once, say what will be written, and install only on the user's yes, through this host's route ([Toolbox installation](https://github.com/FrameCoreWorks/framecore-works-toolbox/blob/main/plugins/toolbox/skills/toolbox/references/installation.md)):

- **Claude Code:** `claude plugin marketplace add FrameCoreWorks/framecore-works-toolbox` once, then `claude plugin install toolbox@framecore-works-toolbox` and, for an entry, `claude plugin install <entry>@framecore-works-toolbox`; a new conversation lists the skill.
- **Claude apps:** the user adds the marketplace `FrameCoreWorks/framecore-works-toolbox` under Customize > Plugins and turns the plugin on.
- **Codex:** `codex plugin marketplace add FrameCoreWorks/framecore-works-toolbox`, then `codex plugin add <name>@framecore-works-toolbox`.
- **ChatGPT Work:** Plugin Creator saves the entry as a private plugin following Toolbox's Work route in that installation page, from files read as text, never a ZIP from the user.

### Earshot through Toolbox

Earshot (sound analysis, procedural effects, sound kits and the bank) comes only through FrameCore Works Toolbox: there is no separate Earshot plugin. With `toolbox:toolbox` readable and code running, read its Earshot reference and run its launcher `capabilities/earshot/scripts/runtime.py status --json` from the Toolbox plugin folder; a task goes through `capabilities/earshot/scripts/envelope.py` and comes back as a `framecore-task-result/1` ([shared contract](../../../contracts/framecore-task.schema.json)). When the engine is missing, relay Toolbox's own tier question (full about 2.6 GB, light about 470 MB, or not now) and install nothing before the answer. Without Toolbox, offer it once as above and meanwhile use FrameMotion's own `sound.py` and `listen.py`, and name the engine that actually ran.
