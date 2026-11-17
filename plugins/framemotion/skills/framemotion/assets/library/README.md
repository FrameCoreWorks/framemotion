# Motion library: full upstream sources inside FrameMotion

Since FrameMotion 0.4.0 every motion graphics skill, pipeline and style pack that FrameCore Works Toolbox used to list is bundled here in full, byte for byte at its reviewed commit (owner request 2026-11-17: "przeniósł wszystkie skille ... 1 do 1 ... z nadpisanym naszym kodem"). Toolbox 1.17.0 no longer lists them. Nothing here needs another plugin.

Each folder has the same shape:

- `upstream/`: the upstream files, unchanged. Each upstream `SKILL.md`, `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` is stored as `*.source.md`, so no host registers a second skill or loads it as instructions; a link that says `SKILL.md` means `SKILL.source.md` here. The exact file list, hashes and what was left out are in `integrations/<name>/source-manifest.json` (the three style packs: `SHA256SUMS` beside their `upstream/`).
- `README.md`: FrameMotion's layer on top. It says when FrameMotion uses the source, what to read first, and which upstream steps FrameMotion replaces. **Where the README and the upstream text differ, the README wins.**

| Folder | What it is | FrameMotion uses it for | Its own route next to it |
| --- | --- | --- | --- |
| [gsap-skills](gsap-skills/README.md) | GreenSock's official GSAP skills (MIT) | every GSAP topic the [frame summary](../../references/gsap-and-threejs-for-frames.md) leaves out | GSAP starter, motion craft |
| [threejs-skills](threejs-skills/README.md) | 13 three.js r186 skills (MIT) | full three.js API pages for engine and Remotion 3D scenes | Anatomy, Cutaway, Remotion three example |
| [manim-skill](manim-skill/README.md) | Manim explainer skill with subtitle lint and local TTS tools (MIT) | math, formulas, graphs and geometry as exact Manim clips | [Manim bridge](../../references/motion-toolkit-runtime-cards.md#manim-local-clip-bridge) |
| [papercut-explainer](papercut-explainer/README.md) | nine-stage cut-paper explainer pipeline in Remotion with its kit, backdrops, SFX and beds (MIT; Remotion itself under its own licence, never bundled) | a vertical cut-paper explainer reel from a link | the [cut-paper method](../../references/explainer-method-recipes.md#cut-paper-explainer), the Animate cut-paper style |
| [hairline](hairline/README.md) | the original Hairline library and its create and adopt skills (MIT) | interactive pointer-driven isometric figures on a web page | the [Hairline video kit](../hairline/README.md) for seekable video |
| [varg-motion-styles](varg-motion-styles/README.md) | 56 reel styles with exact presets from vargHQ/skills (MIT) | the full style pages and presets behind the [type, title and format recipes](../../references/type-title-and-format-recipes.md) | motion styles |
| [claude-video-styles](claude-video-styles/README.md) | 21 film looks from claude-video-2 (MIT) | the full look pages behind the [coded look library](../../references/coded-look-library.md) | motion styles |
| [iart-explainer-styles](iart-explainer-styles/README.md) | explainer methods (whiteboard, isometric, diagram, recap) from iart (MIT) | the full source pages behind the [explainer method and recipes](../../references/explainer-method-recipes.md) | Art engine |

## Rules for every folder

1. **FrameMotion leads.** The brief, concept, copy locks, board, motion contract, frame QA, sound and delivery stay FrameMotion's. An upstream skill does only the step it is good at, inside that plan.
2. **No upstream installer runs.** No `install.sh`, `npx skills add`, `git clone` of a default branch, user-wide skill links or writes to `~/.config` from these sources. Each README names the pinned replacement. Packages install only at the exact versions the README or the upstream lockfile gives, after the user's yes.
3. **Frames, not live pages.** A piece that ends in a video follows the engine time contract: every value is a function of time, rendered at the requested fps and size, checked on frames. Live-page topics (scroll, pointer, React state) are for web deliverables only.
4. **Delivery is FrameMotion's.** Renders go through FrameMotion's export and QA; a piece for FrameCut follows [From frames to a FrameCut motion request](../../references/engine-contract.md#from-frames-to-a-framecut-motion-request) (ProRes 4444 for straight alpha, H.264 otherwise, exact fps and frame count).
5. **Credit.** Keep the upstream licence with any copied code and name the source in the project notes when a delivered piece uses its template, preset or asset.
