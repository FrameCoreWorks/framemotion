# Changelog

## 0.1.0 (2026-11-12)

First release. The Motion Graphics module of FrameCore Works Creative Studio 1.177.0 moved into its own plugin (owner decision 2026-11-12: the whole module, standalone and as Studio's companion).

- One skill, `framemotion`: the former `hyperframes-workflow` skill with all references, templates, starters and engines (Animate, Anatomy, motion toolkit, motion review, render, sound, sync, variants and the rest), and the former `remotion-video-production` skill as the Remotion route under `skills/framemotion/remotion/`.
- New: standalone brief, mode rules (standalone or Studio companion) and the motion workshop with its decision table, taken from the FrameCore Works Motion project and rewritten as general defaults.
- Bundled fonts (OFL) and a hashed copy of Caption Studio's `captions.py`, so the module runs without Studio.
- Shared `framecore-task-result/1` contract schema, byte-identical with Toolbox and Open Assets.
- Tests: 22 motion test files moved from Studio, plus repository checks for manifests, links, the contract hash and the captions copy.
- Links to Studio files now read "Creative Studio: `path`" and apply only when Studio is installed.
