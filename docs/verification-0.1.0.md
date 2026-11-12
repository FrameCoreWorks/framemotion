# Verification: FrameMotion 0.1.0 (2026-11-12)

Separate evidence scopes. Nothing here is a ChatGPT Work, Codex or Claude app result.

| Scope | Result |
| --- | --- |
| Repository check (`python3 tools/check.py`) | PASS: manifests and marketplace identity, shared contract SHA-256 `e7cc0f4e…897a`, captions copy hash, every local Markdown link, no stale Studio skill paths, 20 Python test files (fontTools 4.66.1 installed for the missing-glyph check), Node.js suites (104 pass, 10 browser tests skipped without a named browser); baseline Creative Studio `main` `9841769d` (1.177.0), reproducible archive without `node_modules` |
| Browser tests (`MOTION_REVIEW_BROWSER` set to the container's Chromium 1243) | NOT_RUN: in the cloud container every headless `--dump-dom` call hangs, even on a one-line page, so the frame-review and renderer-parity tests time out at 120 s for an environment reason; the CI runner and a desktop Chrome are the place to run them |
| `claude plugin validate --strict` (Claude Code 2.1.322) | PASS for `plugins/framemotion` and the marketplace |
| Claude Code install from the local marketplace in an empty config | PASS: `framemotion@framemotion` 0.1.0 installed and enabled |
| Headless Claude Code, plugin loaded with `--plugin-dir`, served by the session's configured model, read-only tools | 3 cases, 13 turns, about 47 s: (1) a Polish request for a 6-second 9:16 bakery logo animation answered in Polish with the brief method (logo first, then purpose, exact copy, sound; 2-3 concepts before the storyboard); (2) the bare `/framemotion:framemotion` gave the two-line introduction and the first standalone-brief question; (3) "strong glow on all text and crossfades between all scenes" loaded the skill, read the decision table and answered with its defaults (glow only from a light source, three layers; scenes grow out of each other, one dissolve only where it means passing time). Tokens: mostly cached input (about 190 k per case), under 2 k output |
| ChatGPT Work, Codex, Claude apps | NOT_RUN |
| A rendered film from the installed plugin | NOT_RUN in this release; the render, review and sound code paths are covered by the moved test suites |
