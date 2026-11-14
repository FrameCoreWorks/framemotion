# gl-transitions

Source: [gl-transitions/gl-transitions](https://github.com/gl-transitions/gl-transitions/tree/5a8788c96c45966ce4667e206df6415d494917cc), commit `5a8788c96c45966ce4667e206df6415d494917cc`, Copyright (c) 2017-present gl-transitions contributors, MIT ([licence](LICENSE)). Read at the source on 2026-11-14; none of its scripts was run.

The 238 files of `transitions/` are copied unchanged to `skills/framemotion/assets/engines/gl-transitions/shaders/`; [source-manifest.json](source-manifest.json) lists each file's hash and licence, and a test checks them. Every shader keeps its header with its author and licence: 236 are MIT, `InvertedPageCurl.glsl` is BSD 3 Clause (Hewlett-Packard) and `StereoViewer.glsl` is BSD 2 Clause (Theodore K Schundler), with the full licence text in the file.

FrameMotion's own wrapper (`transition.mjs`, `index.html`, Apache-2.0) runs one shader between two pictures as a seekable engine. Left out: the players for other platforms (`packages/`, `crates/`, `android/`, `swift/`), the repository scripts and examples, and its agent skill.
