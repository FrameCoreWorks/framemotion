# Changelog

## 0.4.5 (2026-11-18)

- **YouTube intros, outros and channel packaging** (owner request 2026-11-18: research and add refined knowledge about intros and outros for YouTube creators). New `references/youtube-intro-outro.md` and one SKILL.md routing bullet: platform facts with sources and their status (official YouTube Help rules: end screen in the last 5 to 20 s of a video of at least 25 s, up to 4 elements on 16:9, 5 cards, watermark in the last 15 s, the 30 s "Intro" retention card, chapters, Shorts up to 3 min with a Related video link; measured: about -14 LUFS turn-down, end-screen element sizes, Shorts interface margins; standard: EBU R95 action and graphics safe; inferences labelled), default lengths, seven beat-by-beat recipes (cold open into a title sting, logo bumper, series card, stinger, channel lower third, outro with end-screen slot layouts, Shorts opener and loop ending), genre patterns, common mistakes, three intro and two outro concepts with a named wow on the Hairline, Reels and Iso Glow engines and kinetic type, and additions per layer for layered work. Own wording; no third-party text or template copied. FrameCut 0.1.7 adds the editing side.
- Evidence: source checks in the Claude cloud sandbox. `tools/check.py` stops on `tests/photoreal.test.mjs` "bundled engines render deterministic frames" (hairline-spice-rack frame 0); the same test fails on the unchanged 0.4.4 tree in this sandbox, so it is a pre-existing sandbox failure, not caused by this documentation change. All Python suites and the other 226 Node tests pass. No intro or outro was rendered (`NOT_RUN`); Codex and ChatGPT Work `NOT_TESTED (by policy)`.

## 0.4.4 (2026-11-18)

- **Brand names are style references** (tester report 2026-11-18, owner rule): "Minecraft" and "Clawd" were refused first and only then answered with a substitute. New `references/brand-inspired-requests.md` and one SKILL.md bullet: the reply opens with the inspired version (own characters, blocks, textures, palette), no refusal or lecture, one short note at most. Hard limits only for 1:1 logos, faithful redraws of protected characters and fake official material. Clawd is explicitly allowed as a mascot style. Four example replies (Minecraft, Clawd, Pokémon, Mario). Wording that read as a refusal was softened in `generated-motion-assets.md`, `reference-style-rebuild.md` and `stickman-explainer-craft.md`. Test: `tests/brand_inspired_test.py`. FrameCut has no such rule (checked by search).
- Evidence: source checks in the Claude cloud sandbox; Codex and ChatGPT Work `NOT_TESTED (by policy)`. Model behavior with the new wording is `NOT_RUN` until a real prompt is tried.

## 0.4.3 (2026-11-17)

- **Rubber hose build patterns** (owner request 2026-11-17, review of finktheartist/rubber-hose-ui, MIT, commit 9608c12): `references/film-style-library.md` gets a short section with three patterns in our own words (time-driven clock, one spring for every landing, painted body with limbs in code and the join rules). Pattern source only: no upstream code or art copied.
- Evidence: source checks in the Claude cloud sandbox; Codex and ChatGPT Work `NOT_TESTED (by policy)`.

## 0.4.2 (2026-11-17)

- **Layered work** (owner rule 2026-11-17, mandatory): a reel or film is built one layer at a time (plan and grey-block blocking, typography and content, base motion without effects, depth and polish, colour and look, sound, detail control and QC of the exported file) with a frame check after each. A fix returns to its own layer and the layers above it are checked again; in code each layer is its own function or file with a switch; only a very short simple job may take one pass, with the reason in the plan. New `references/layered-work.md`, step 5 of `SKILL.md`, a section in `references/reel-workflow.md`, a pointer in the workshop's process note, a "Layer plan" block in the storyboard contract template and `tests/layers_test.py`.
- Evidence: source checks in the Claude cloud sandbox; Codex and ChatGPT Work `NOT_TESTED (by policy)`.

## 0.4.1 (2026-11-17)

- **Three more reel styles in the Reels engine** (owner request 2026-11-17: evaluate the five new skills of artemnovitckii/claude-animation-skills and "Startujemy", then "wydaj"): `voxel-build` (a blocky cottage builds itself block by block; upstream's `/minecraft`), `ps1-low-poly` (a 1990s console-style platform scene with a waiting dog, a passing train and snow; upstream's `/low-poly`) and `hairline-tree` (one dot grows into a hairline tree; upstream's `/dan-koe`), bundled byte for byte from upstream commit `86f70106c9aeae1334184467da5776c533ada3bc` (MIT), under descriptive names, with registry entries `reels-voxel-build`, `reels-ps1-low-poly`, `reels-hairline-tree`, samples, source-manifest hashes, a NOTICE line and Pixelify Sans (OFL) for the voxel captions. Left out: `zach-3d-films` (an alias of the what-if-3d skill) and `kurzgesagt` (covered by the Art engine's `art-flat-science`).
- **Fix: frame 0 of a GSAP reel style that draws in `onUpdate`.** A timeline already at 0 did not redraw, so `hairline-tree` frame 0 showed the finished tree instead of the starting dot. The reels builder now steps through 1 ms first; a test covers it.
- Evidence: source checks and the reels render tests passed in the Claude cloud sandbox; a full mp4 with sound, a Mac GPU render and Codex/ChatGPT Work were not run (`NOT_RUN`). Polish letters in `voxel-build` captions fall back to a system face (Pixelify Sans is Latin only).

## 0.4.0 (2026-11-17)

- **Motion library: every motion source from Toolbox, 1:1** (owner request 2026-11-17: "przeniósł wszystkie skille lub paczki lub repo, które odpowiadają za motion graphics 1 do 1 ... z nadpisanym naszym kodem"). FrameMotion summarised these sources but the full pages, pipelines and presets lived in Toolbox. They are now bundled byte for byte at their reviewed commits in `skills/framemotion/assets/library/`: `gsap-skills`, `threejs-skills`, `manim-skill`, `papercut-explainer` (with its Remotion template and lockfile, kit, backdrops, SFX and beds), `hairline` (the web original), `bang-motion`, and the `varg-motion-styles`, `claude-video-styles` and `iart-explainer-styles` packs, now complete (the Claude Video skill, scripts and examples, the iart verify scripts, varg `footage-effects` and `maps-and-data-motion`). Left out: preview media, host manifests and the clients of paid services (Higgsfield, varg.ai). Upstream `SKILL.md`, `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` are stored as `*.source.md`, so FrameMotion stays one skill. All MIT; NOTICE, `integrations/sources.json` and per-source manifests record pins and hashes, and `tools/check.py` now fails when a library file changes or a `SKILL.md` appears there.
- **FrameMotion's layer on top**: each source has a README that overrides its upstream text: no upstream installer runs (`install.sh`, `npx skills add`, unpinned `playwright-core@1`, `npm i puppeteer`), exact versions instead (Remotion 4.0.530 from the bundled lockfile with `npm ci`, `playwright-core` 1.56.1, `manim` 0.20.1, `gsap` 3.15.0), frames as functions of time, FrameMotion's QA, sound and FrameCut delivery, no paid services, and parallel scene agents only on request.
- **Duplicates merged** (owner request 2026-11-17: duplicates are merged into one improved unit with credit notes): bang-motion's laws (a video, not a slide deck; the style brief; 19 opener concepts; transitions with depth; the background menu; living text; browser traps) are adapted in English into [motion craft](skills/framemotion/references/motion-craft.md), without its After Effects bridge for the paid Higgsfield service. FrameMotion's summaries (GSAP and three.js, coded looks, type and transition recipes, explainer methods, the Manim bridge, the cut-paper method) now link 160 times to the bundled full pages instead of GitHub, so each topic has one entry point.
- **bang-motion renders through FrameMotion**: [`framemotion-bridge.js`](skills/framemotion/assets/library/bang-motion/framemotion-bridge.js) exposes a bang-motion page's timeline as `window.renderFrame(t)`, so `capture-html.mjs` renders it at any fps. Tested in a Claude Code cloud container: the opener starter rendered 50 frames at 25 fps, 1920 x 1080, with frames that change over time.
- **Routing and setup**: the routing table is now the [motion library](skills/framemotion/references/motion-toolkit-routing.md#motion-library); first setup offers only the other FrameCore Works plugins and Toolbox helpers outside motion (Pinterest references, website skills). Stale offers of removed Toolbox entries (`anatomy`, `huashu-art-motion`, `hairline`, `iso-glow`) are gone from `SKILL.md`.

## 0.3.2 (2026-11-17)

- **Toolbox offers follow Toolbox 1.16.0** (owner decision 2026-11-17, "Usuń 12 silników z toolbox"): Toolbox no longer lists the twelve tools FrameMotion bundles as its own engines (`animate`, `anatomy`, `motion-designer`, `gl-transitions`, `brag`, `stickman-kino`, `cutaway`, `motion-launch-videos`, `huashu-art-motion`, `pixelfx`, `rea-video` and the `animation-skills-styles` pack). First setup no longer offers them, the toolkit routing table names FrameMotion's own engine for those rows, and the Remotion route's examples name entries that remain.

## 0.3.1 (2026-11-17)

- **FrameCut handoff formats** (owner approval 2026-11-17 after the FrameMotion, Studio and FrameCut cooperation test of 2026-11-17): a WebM with VP9 alpha was offered for overlays, but FrameCut reads no VP9 alpha, so `attach-motion` refused it. `SKILL.md`, the launch overlays README and the Remotion notes now deliver `alpha: "straight"` to FrameCut as ProRes 4444 in a .mov and `opaque` as H.264, never WebM.
- **From engine frames to a FrameCut request**: the engines render at their own frame rate and size (launch films at 60 FPS) and `compose.mjs` writes whole frame rates and opaque H.264 only, with no route to the request's FPS (including `30000/1001`), frame count and alpha. The [engine contract](skills/framemotion/references/engine-contract.md#from-frames-to-a-framecut-motion-request) now gives the one-step ffmpeg conform (nearest frame, size, held last frame, exact frame count, BT.709 tags) and the ffprobe check. Tested in a Claude Code cloud container: `launch-overlays` frames conformed to 25 and 30000/1001 FPS, bound by FrameCut 0.1.3 `attach-motion` with straight alpha and composited over footage.
- **FrameCut offered when it is missing** (owner request 2026-11-17 to check the dependencies between the plugins): FrameMotion routed a full edit of supplied footage to FrameCut "when it is installed" but said nothing when it was not. The routing table in `SKILL.md` now sends footage editing to `framecut:framecut` when readable and otherwise offers FrameCut once while FrameMotion keeps building the motion pieces.

## 0.3.0 (2026-11-16)

- **Own engines** (owner plan of 2026-11-14, packs P1 to P11, each reviewed and fixed before the next): FrameMotion renders every engine frame by frame on the shared clock of the [engine contract](skills/framemotion/references/engine-contract.md), with the sources pinned in `integrations/sources.json` and credited in `NOTICE`.
  - Photoreal three.js engine (P1, P5, P10): blocks, accumulation camera, film grade, baked light, procedural materials, props and a studio test scene.
  - Light and library engines (P2, P6): Paper Shaders, PixiJS filters, css-doodle, torph, tsParticles and p5.brush.
  - Knowledge (P3, P4): three FrameMotion references rewritten from the knowledge packs, cut-paper rules and `bindToGsap` examples.
  - Stickman (P7a), Cutaway with FrameMotion's teardown (P7b), Launch (P8a), Reels (P8b), Art (P8c), Pixel (P9a), Lemo film styles (P9b), the rea-video shot-by-shot breakdown (P9c) and Line-art (P9d).
- **Earshot bundled** (P11): the local sound engine ships inside FrameMotion (copied from Toolbox 1.15.1, `integrations/earshot/source-manifest.json`); first setup offers the full engine once, remembers "not now" and reuses a runtime Toolbox already installed.
- **Welcome with two starts** and ten engine groups built from the registry (`assets/engines/menu.py`, `references/engine-routing.md`); the approved Polish welcome is embedded in `SKILL.md` next to the English one.
- **Films from several engines** (W4, W5): `kit/compose.mjs` joins scenes from different engines into one film from a `film-plan/1` plan (shared fps and size, fit, xfade transitions, optional audio).
- **Testing:** FrameMotion is tested in Claude only; ChatGPT Work and Codex stay installable but are untested there.

## 0.2.0 (2026-11-14)

- **Engine foundation** (owner decision 2026-11-14, "Startujemy", first pack of the own-engines plan): the [engine contract](skills/framemotion/references/engine-contract.md) every engine follows (a pure function of time, seeded randomness, one HyperFrames timeline, JSON input, sub-frames, local and safe, credited), and the dependency-free [engine kit](skills/framemotion/assets/engines/kit/README.md) (`createRng`, `halton`, `subframeTimes`, `defineEngine`, `bindToGsap`) with `tests/engine-kit.test.mjs`. Per the owner's choice of 2026-11-14, upstream engines enter as 1:1 copies with an adapter, and only the photoreal three.js blocks, stickman-kino and cutaway are rewritten.
- **Source register:** `integrations/sources.json` lists all 34 sources of the plan with a full pinned commit, licence, copyright, pack and conditions (licence files read at each pin on 2026-11-14; lemo-opuscar's code is MIT, its Markdown and prompts CC BY-NC and never bundled). `tests/sources_test.py` refuses an unpinned or non-permitted source and checks that bundled or adapted material is credited in `NOTICE`.
- `tools/check.py` prints the archive's file count and size.

## 0.1.4 (2026-11-14)

- **Fixed welcome on a bare invocation** (owner request and approval 2026-11-14): `skills/framemotion/assets/startup-welcome.en.md` holds the approved English text (what FrameMotion makes, six capabilities, storyboard approval before the build, optional materials, three numbered examples, closing question; no link to another plugin). `SKILL.md` embeds the same text in a "Welcome" section: output it alone, copied exactly in English or translated in full, then ask the first missing standalone-brief question after the answer. `tests/welcome_test.py` checks the embedded copy is byte-identical to the asset.

## 0.1.3 (2026-11-13)

- **Reel workflow checks from the owner's end-to-end test**: the contact sheet adds a frame from the middle of every text entrance and exit and is checked at full size for letters cut by the frame edge; the 540p preview's sound is measured on the encoded MP4 (AAC raised a −1.5 dBTP WAV to −0.8 dBTP), through `sound.py deliver` or `listen.py`, and must already meet the delivery level.

## 0.1.2 (2026-11-13)

- **Reel workflow** (owner decision 2026-11-13): every reel follows [plan, contact sheet, 540p preview, full render](skills/framemotion/references/reel-workflow.md); the plan and the contact sheet are approved before anything renders, corrections to the preview re-render only the changed part, and the full render follows the accepted preview.
- **Sound for reels** (owner decision 2026-11-13): music and effects from code by default, a warning before using someone else's track (platforms mute or claim even CC BY music), about −14 LUFS with the peak below −1 dB. `place_sfx.py` now limits in numpy instead of FFmpeg's `alimiter`.
- **Runtimes without Creative Studio:** first setup has its own [runtime section](skills/framemotion/references/first-setup.md#runtimes) (Animate engine, GSAP and Remotion starters, motion toolkit, copied from this plugin into the shared workspace and installed from their lockfiles); the Animate, HyperFrames and runtime-map references point to it instead of Studio's environment check.
- **First setup** also offers FrameCut, Open Assets and Creative Studio, with their install routes, and Toolbox's `rea-video` (checked against Toolbox 1.15.0).
- **Captions and editing links** point to FrameCut (`skills/framecut/...`) instead of Creative Studio paths that no longer exist; the captions copy names FrameCut as the script's home, and the capability card's captions rows belong to FrameMotion.
- Installation guide: FrameMotion's only marketplace is `framemotion`; how to replace an older `framemotion@framecore-works` copy.
- Repository check prints the end of a failing test's output.

## 0.1.1 (2026-11-12)

- Descriptions present FrameMotion as a complete standalone plugin and no longer as a part taken out of another plugin (owner decision 2026-11-12).
- First setup (owner decision 2026-11-12): after installation, or on "Configure FrameMotion", a route check and one numbered question offering the FrameCore Works Toolbox plugins that extend FrameMotion; only picked items are installed. The manifests name the skill as the onboarding skill.
- Toolbox links work without Creative Studio: skill names by host, install routes for Toolbox and its entries, Earshot through Toolbox, and rows for the four built-in reel style packs and `pinterest-references` (checked against Toolbox 1.14.0).
- Data-led motion and revision-bound feedback is now a FrameMotion reference instead of a link into Creative Studio.
- Two workshop pages from the FrameCore Works Motion knowledge that was not in 0.1.0: [process and render](skills/framemotion/references/workshop/process-and-render.md) (order of work with three pitches and a frame-sheet gate, partial render, self-check list, independent reviewer, lesson log, composition details, render lessons including the GPU check and macOS Chromium with Metal, what did not work) and [delivery, web motion and hooks](skills/framemotion/references/workshop/delivery-web-and-hooks.md) (loudness norms, export settings, web motion and handoff, hooks, readability, current APIs).

## 0.1.0 (2026-11-12)

First release of FrameMotion as a complete standalone plugin, which Creative Studio can also use as its motion companion.

- One skill, `framemotion`, with all references, templates, starters and engines (Animate, Anatomy, motion toolkit, motion review, render, sound, sync, variants and the rest), and a Remotion route under `skills/framemotion/remotion/`.
- Standalone brief, mode rules (standalone or Studio companion) and the motion workshop with its decision table, written as general defaults.
- Bundled fonts (OFL) and its own hashed copy of `captions.py`, so FrameMotion needs no other plugin.
- Shared `framecore-task-result/1` contract schema, byte-identical with Studio, Toolbox and Open Assets.
- Tests: 22 motion test files plus repository checks for manifests, links, the contract hash and the captions copy.
- Links to Studio files read "Creative Studio: `path`" and apply only when Studio is installed.
