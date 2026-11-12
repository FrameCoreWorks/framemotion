# Changelog

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
