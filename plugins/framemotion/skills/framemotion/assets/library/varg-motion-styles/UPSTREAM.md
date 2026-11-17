# varg-motion-styles

Reel style pack bundled in FrameMotion (moved from FrameCore Works Toolbox 1.16.0 on 2026-11-17). The files in `upstream/` are
byte-identical copies of the upstream repository at the reviewed commit; nothing in
them was edited. One rename: each upstream `SKILL.md` is stored as `SKILL.source.md`
so that no host registers these copies as extra skills of the FrameMotion plugin (links
inside the copies that say `SKILL.md` mean that file). `SHA256SUMS` lists every copied file.

- Upstream: https://github.com/vargHQ/skills
- Author: vargai Inc. (vargHQ)
- Licence: MIT (`upstream/LICENSE`; keep it with any copy)
- Commit: ff940b67bc03a85d03f0fe33591ac59239eb8b84 (2026-11-11, plugin 2.17.0)
- Copied on: 2026-11-12, owner request in the Toolbox thread ("wgraj do toolboxa ... dodatkowe asety"); moved to FrameMotion 2026-11-17 ("przeniósł wszystkie skille ... 1 do 1")
- Review: `reviews/varg-motion-styles.md` in FrameCoreWorks/framecore-works-toolbox

## Copied

`LICENSE` and the complete folders (SKILL.md as `SKILL.source.md`, README, references, all assets, examples, evals) of the seven local motion skills: `kinetic-type-art`, `motion-formats`, `title-design`, `transition-craft`, `caption-styles`, `footage-effects` and `maps-and-data-motion` (the last two added on 2026-11-17).

## Left out

Every other upstream skill (most route to the paid varg.ai service or to image and video generators), the hosted MCP servers in `.mcp.json` and the repository-level agent files. Links in the copied files to `varg-ai` or other varg skills point at files that are not here; use the upstream repository at the commit above for them. Never call varg.ai from these packs. In `maps-and-data-motion`, the satellite flyover needs map imagery: use only imagery whose licence allows it and record it in the asset notes.

## Attribution

When a delivered piece uses a template or preset from this pack, keep the MIT notice
with any copied code and credit "vargai Inc. (vargHQ), vargHQ/skills" in the project notes.
