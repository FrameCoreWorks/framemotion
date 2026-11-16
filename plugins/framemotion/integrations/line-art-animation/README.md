# line-art-animation: the Line-art engine

Source: [JDhruv14/line-art-animation](https://github.com/JDhruv14/line-art-animation/tree/c43d698913cf0ad44f984c7ae14c5348010594d3), commit `c43d698913cf0ad44f984c7ae14c5348010594d3`, Copyright (c) 2026 JDhruv14, MIT ([licence](LICENSE)). Read at the source on 2026-11-16; none of its scripts was run.

Bundled unchanged in `skills/framemotion/assets/line-art-engine/`: the library, both examples, the references, the method (SKILL.md, renamed `docs/method.md`) and the two clip-measuring tools. Every file and its SHA-256 is in [source-manifest.json](source-manifest.json).

Left out: the preview media (7 MB), the upstream README and gallery page, `scripts/capture.ts` (it starts its own Chrome over the DevTools port; FrameMotion's renderer does the capture) and the Vite setup (FrameMotion bundles with its pinned esbuild).

FrameMotion's own code is the `lineart` builder in `skills/framemotion/assets/engines/kit/builders.mjs` (Apache-2.0): it uses upstream's `?debug` step mode, replays from zero to go back in time, and seeds `Math.random`, so every frame is a function of its time.
