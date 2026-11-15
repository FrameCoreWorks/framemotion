# motion-launch-videos attribution

The [Launch engine](../../skills/framemotion/assets/launch-engine/README.md) bundles [Kimeur/motion-launch-videos](https://github.com/Kimeur/motion-launch-videos) at `5092579bc9aaeb0e3547ded0980a93404d2dc906`, MIT, Copyright (c) 2026 Marouane Gazouzi. [LICENSE](LICENSE) is the unchanged upstream notice. [source-manifest.json](source-manifest.json) lists every bundled file with its upstream path and SHA-256. Every file is byte-identical. Each style's `SKILL.md` is bundled as `styles/<style>/method.md`, so no host loads it as a skill; each style keeps its synced copies of `shared/` files, as upstream ships it.

Not bundled: the captions style (captioned clips belong to FrameCut), the story style's example voice recording and its `voice.mjs` (it runs unpinned `npx hyperframes` commands), the rendered examples (109 MB), and the upstream README, CI and repository tools.

The fonts the films name are SIL Open Font License 1.1 faces from Fontsource. The engines folder installs them from npm at exact versions, and the build embeds each one with its OFL text. The globe's map is made from Natural Earth (public domain) through world-atlas (ISC) and sane-topojson (MIT).

The launch engine and the [kaventro templates](../kaventro-motion-designer/) form one launch-film family in FrameMotion: one chooser in the engine's README, one renderer, and separate upstream code under each licence.
