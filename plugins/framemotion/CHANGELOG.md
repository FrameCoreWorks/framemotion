# Changelog

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
