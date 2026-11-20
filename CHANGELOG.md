# Repository changelog

The plugin's own changes are in [plugins/framemotion/CHANGELOG.md](plugins/framemotion/CHANGELOG.md).

## 2026-11-20

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
