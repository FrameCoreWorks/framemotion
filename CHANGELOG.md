# Repository changelog

The plugin's own changes are in [plugins/framemotion/CHANGELOG.md](plugins/framemotion/CHANGELOG.md).

## 2026-11-22

- FrameMotion 0.8.2: After Effects craft gains a keyframe-type table (six interpolation types, frame spacing, CSS/GSAP/Remotion forms) and the owner's key rules.

## 2026-11-20

- FrameMotion 0.8.1: anidoodle scenes keep a dark subject readable on a dark backdrop (figure-ground halo), toy-brick colours and sumi-e washes improved.
- FrameMotion 0.8.0: anidoodle draws any described scene in any of its 32 styles, each with its own film's tools (setting `scene`, a layered SVG the model writes from the description).
- FrameMotion 0.7.2: the motif film colours in black fills and shows dark pictures on the chalk board (found by the frame check of the FrameCore logo).
- FrameMotion 0.7.1: 3D scenes check Poly Haven's CC0 scans through Open Assets before building everything in code.
- FrameMotion 0.7.0: anidoodle draws the user's own logo or picture (style `motif`), opens at the first mark, fits a reel length, and has tone settings.
- FrameMotion 0.6.0: seven candidates from the X list (mg-styles films and ways, the anidoodle hand-drawn engine, three.quarks effects, motionmaxxing gates, cinetic device book and copy check, Blender kit, reference match and LottieFiles principles).

## 2026-11-18

- CI repair (no plugin change): runner pinned to ubuntu-24.04 with Chromium's sandbox allowed and DejaVu installed, the animate-engine test ignores CI-installed node_modules, `tools/check.py` prints each failing node test. Three render tests are skipped on CI only and still run locally (owner-approved 2026-11-18, KNOWN-CI-ONLY): `launch-type-pl` Polish letters (ink 977.6 > 976 with the runner's fallback font), `p5-brush` repeatable frames, `lemo-tilt-shift` order independence (times out on the runner). Their fixes follow in their own PR, then the skips come out.

## 2026-11-14

- FrameMotion 0.1.4: a fixed, owner-approved welcome on a bare invocation, with a byte-check test.

## 2026-11-13

- FrameMotion 0.1.3: text-cut check on the contact sheet, preview sound measured on the encoded MP4.
- FrameMotion 0.1.2: reel workflow, sound for reels, own runtime setup, links to FrameCut, first setup with the other FrameCore Works plugins; the repository check prints failing test output.

## 2026-11-12

- Repository created with the FrameMotion 0.1.0 plugin (0.1.1: standalone descriptions), a single-plugin marketplace, installation guide, repository check, reproducible package script and CI.
