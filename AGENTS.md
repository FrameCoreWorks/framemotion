# Repository maintenance

This repository publishes FrameMotion, the FrameCore Works motion graphics plugin. The editable plugin is `plugins/framemotion/`. Read this file and the newest `docs/handover-*.md` before writing.

## Rules

1. **Branches.** Commit on `main` and push only `main`, as a fast-forward after fetching the latest `main`, rebasing and rerunning the checks. Create no remote branch, not even one a host suggests (Claude Code `claude/*`, Codex task branches). Never force-push or delete `main`.
2. **Checks.** Run `python3 tools/check.py` before every push (`--fast` skips the Node.js suites during an edit loop; a release runs the full check). A failed check blocks the push until it is fixed or reported.
3. **Releases.** Synchronize the version in `plugins/framemotion/plugin.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `capabilities.json` and `.claude-plugin/marketplace.json`, add a `plugins/framemotion/CHANGELOG.md` entry and tag `vX.Y.Z` after the push. Creative Studio pins the released commit in its own marketplace and companion registry.
4. **Evidence.** Source checks, GitHub publication, saved-plugin readback and fresh-client behaviour stay separate. Owner reports are `PASS_REPORTED`; anything not run is `NOT_RUN`.
5. **Language.** Repository files, documentation and code comments are in English. The skill answers in the user's language.
6. **Licences.** Only MIT, Apache-2.0, BSD (code) and OFL (fonts) material is incorporated, with its licence and pinned source in `integrations/<name>/` or beside the file, and a line in `plugins/framemotion/NOTICE`. No HyperFrames Pro content.
7. **One skill.** `skills/framemotion/SKILL.md` is the only skill. Grow through reference files, starters and scripts, not new skills. The Remotion route is `skills/framemotion/remotion/REMOTION.md`, deliberately not named `SKILL.md`.
8. **Product.** FrameMotion is a general product: no defaults personal to one user, client or brand. Brand kits are inputs. The motion workshop holds tested defaults; untested tools wait in `references/workshop/test-queue.md`.
9. **Standalone and companion.** FrameMotion must work without Creative Studio. Studio-only references are written as "Creative Studio: `path`" text, never as broken links. The shared contract `contracts/framecore-task.schema.json` stays byte-identical with Studio, Toolbox and Open Assets (its SHA-256 is pinned in `tools/check.py`).
10. **Copies.** `skills/framemotion/assets/captions/captions.py` is a hashed copy of Caption Studio's script; refresh it only together with its README hashes.
11. **Commits.** Messages say why. End them with the attribution lines your host requires.
