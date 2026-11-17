# claude-video-styles

Reel style pack bundled in FrameMotion (moved from FrameCore Works Toolbox 1.16.0 on 2026-11-17). The files in `upstream/` are
byte-identical copies of the upstream repository at the reviewed commit; nothing in
them was edited. One rename: each upstream `SKILL.md` is stored as `SKILL.source.md`
so that no host registers these copies as extra skills of the FrameMotion plugin (links
inside the copies that say `SKILL.md` mean that file). `SHA256SUMS` lists every copied file.

- Upstream: https://github.com/ItsssssJack/claude-video-2
- Author: Claude Video Studio contributors (ItsssssJack)
- Licence: MIT (`upstream/LICENSE`; keep it with any copy)
- Commit: 18891e4996abb7ccc0085f2d43cef2fd7eff1dc8 (2026-10-21, no version (single commit))
- Copied on: 2026-11-12, owner request in the Toolbox thread ("wgraj do toolboxa ... dodatkowe asety"); moved to FrameMotion 2026-11-17 ("przeniósł wszystkie skille ... 1 do 1")
- Review: `reviews/claude-video-styles.md` in FrameCoreWorks/framecore-works-toolbox

## Copied

Everything at the commit (`SKILL.md` as `SKILL.source.md`, `README.md`, `questions.md`, `config.json`, `NOTION-PAGE.md`, `styles/` with 21 looks, `references/`, `templates/`, `examples/`, `scripts/`), completed on 2026-11-17.

## Left out

`gallery/` (61 MB of preview videos) and `scripts/higgsfield.py` (client for the paid Higgsfield service; never call it). Reference pieces load GSAP 3.14.2 from jsDelivr and fonts from Google Fonts at render time: for a render, install `gsap` 3.15.0 locally and use FrameMotion's bundled fonts.

## Attribution

When a delivered piece uses a template or preset from this pack, keep the MIT notice
with any copied code and credit "Claude Video Studio contributors (ItsssssJack), ItsssssJack/claude-video-2" in the project notes.
