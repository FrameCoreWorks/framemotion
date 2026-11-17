# iart-explainer-styles

Reel style pack bundled in FrameMotion (moved from FrameCore Works Toolbox 1.16.0 on 2026-11-17). The files in `upstream/` are
byte-identical copies of the upstream repository at the reviewed commit; nothing in
them was edited. One rename: each upstream `SKILL.md` is stored as `SKILL.source.md`
so that no host registers these copies as extra skills of the FrameMotion plugin (links
inside the copies that say `SKILL.md` mean that file). `SHA256SUMS` lists every copied file.

- Upstream: https://github.com/iart-ai/explainer-video-skills
- Author: iart.ai
- Licence: MIT (`upstream/LICENSE`; keep it with any copy)
- Commit: 3c13a1bc360c08503f24f9c9a99fda6d3d35de56 (2026-11-11, plugin 0.1.0)
- Copied on: 2026-11-12, owner request in the Toolbox thread ("wgraj do toolboxa ... dodatkowe asety"); moved to FrameMotion 2026-11-17 ("przeniósł wszystkie skille ... 1 do 1")
- Review: `reviews/iart-explainer-styles.md` in FrameCoreWorks/framecore-works-toolbox

## Copied

Everything at the commit: `LICENSE`, `README.md`, `showcase.html`, `scripts/` (the seek-shot, contact-sheet and MP4 probe helpers) and `skills/` (`explainer-video`, `whiteboard-animation`, `isometric-animation`, `diagram-animation`, `wrapped-video` with their references), completed on 2026-11-17.

## Left out

`showcase.gif` (3.3 MB preview) and the plugin manifests. Some recipes import `gsap/+esm` from jsDelivr without a version: use the local `gsap` 3.15.0. Promotional links to iart.ai stay as upstream wrote them; the skills render locally and need no iart.ai account.

## Attribution

When a delivered piece uses a template or preset from this pack, keep the MIT notice
with any copied code and credit "iart.ai, iart-ai/explainer-video-skills" in the project notes.
