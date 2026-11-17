# iart explainer styles in FrameMotion

The complete explainer-video-skills repository by iart-ai (MIT), bundled in [`upstream/`](upstream/): five methods, [explainer-video](upstream/skills/explainer-video/SKILL.source.md), [whiteboard-animation](upstream/skills/whiteboard-animation/SKILL.source.md), [isometric-animation](upstream/skills/isometric-animation/SKILL.source.md), [diagram-animation](upstream/skills/diagram-animation/SKILL.source.md) and [wrapped-video](upstream/skills/wrapped-video/SKILL.source.md) (year-in-review recaps), with their references, plus the verify scripts in [`scripts/`](upstream/scripts/README.md) (`seek-shot.sh`, `contact-sheet.sh`, `probe-mp4.sh`). Provenance and hashes: [UPSTREAM.md](UPSTREAM.md), [SHA256SUMS](SHA256SUMS).

## When FrameMotion uses it

Whiteboard draw-on, isometric 2.5D, animated diagrams, recaps and narrated explainers. FrameMotion's [explainer method and recipes](../../../references/explainer-method-recipes.md) and [art-style and explainer direction](../../../references/art-and-explainer-motion-direction.md) summarise them; the Art engine renders the painted looks. Open the method here for its full steps and references.

## What FrameMotion changes

1. **Pinned GSAP.** Recipes that import `gsap/+esm` from jsDelivr without a version use the local `gsap` 3.15.0 instead.
2. **Remotion and Manim tiers** follow FrameMotion's [Remotion route](../../../remotion/REMOTION.md) and the bundled [manim-skill](../manim-skill/README.md).
3. **Verification.** The upstream scripts are welcome as quick checks (`probe-mp4.sh` asserts size, codec, fps and duration); FrameMotion's frame QA and sound pass still run on the encoded file.
4. **No account.** Links to iart.ai are promotional; nothing here needs it.
