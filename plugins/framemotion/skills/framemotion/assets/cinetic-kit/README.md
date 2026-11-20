# cinetic kit: device book and HyperFrames motion kit

Material from [Leonxlnx/cinetic](https://github.com/Leonxlnx/cinetic) at commit `f4bbfc844877891fe92279d47b7874fb44d485ae`, MIT, Copyright (c) 2026 Leonxlnx ([LICENSE](LICENSE)). Everything in `upstream/` is an unchanged copy. It is merged into FrameMotion's launch films, not a new engine: the launch and kaventro engines stay the films you render, and this kit gives them a device book, copy rules and a timing kit for the HyperFrames path.

| Use | Files |
| --- | --- |
| **Device book**: 466 named devices (openings, type arrivals and exits, swaps, camera moves, cuts, data, product moments, end cards), each with its build, timing, use and avoid notes | [`upstream/references/technique-library.md`](upstream/references/technique-library.md) (the index) and the 27 files in `upstream/references/library/` |
| **Copy before picture** for launch and update films | [`upstream/references/copy-and-type.md`](upstream/references/copy-and-type.md) section 1, [`upstream/references/update-films.md`](upstream/references/update-films.md); FrameMotion's own check is [`../launch-copy/copy_check.py`](../launch-copy/README.md) |
| **Timing**: beat grid, pace, easing tokens and springs | [`upstream/references/timing-grid.md`](upstream/references/timing-grid.md), [`upstream/references/motion-tokens.md`](upstream/references/motion-tokens.md) |
| **HyperFrames path**: one paused timeline on a beat grid, pure functions of time | [`upstream/hyperframes-starter/`](upstream/hyperframes-starter/) (`motion.js`, `timeline.js`, `music.js`, `index.html`) and [`upstream/references/hyperframes-engine.md`](upstream/references/hyperframes-engine.md) |

## How FrameMotion uses it

- **Launch films** (`launch-*`, `kaventro-*`): before a style is picked, write the script and run `copy_check.py` on it. Pick one device per line from the book (the "Build" lines name upstream Remotion components such as `fx/Words`; read them as a description of the motion and build it in the chosen engine's own code). The devices' timing numbers are at 60 fps.
- **HyperFrames compositions** (FrameMotion's HyperFrames route): copy `upstream/hyperframes-starter/` into the project and take the timing kit from `motion.js` (pure functions, usable on its own). The starter page does not run by itself: its `index.html` needs GSAP at `vendor/gsap.min.js` and the Inter display font in `fonts/`, and neither is bundled here (GSAP has its own licence, not MIT, Apache or BSD). Add both in the user's HyperFrames project (its own GSAP and a font from FrameMotion's `fonts/` or `@fontsource`), with the user's consent and pinned versions, before the first preview. The upstream `package.json` and its `setup.mjs` postinstall are not bundled; the references' `npx hyperframes` commands are the user's own HyperFrames tool, run only with their consent and a pinned version.
- Links in the copied references that point to other upstream files (scripts, Remotion sources, other references) lead outside this kit; those files are left out.

## Left out

The Remotion starter, kit and seven templates (Remotion needs a paid company licence for teams over three people), the 23 Remotion type presets, `logos.mjs` and its logo lists (third-party brand marks), the music search and download, the audio pipeline, all other scripts (FrameMotion has its own checks: motion review, motion activity, the visible-text audit, sound), `techniques.json` (the book above is generated from it), docs, evaluations and the upstream `SKILL.md` (FrameMotion keeps one skill).
