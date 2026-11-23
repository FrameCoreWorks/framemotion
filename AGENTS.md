# Repository maintenance

This repository publishes FrameMotion, the FrameCore Works motion graphics plugin. The editable plugin is `plugins/framemotion/`. Read this file and the newest `docs/handover-*.md` before writing.

## Rules

1. **Branches (owner 2026-11-18).** Every change goes on a branch or worktree, then a pull request to `main` with green CI, then merge; no direct push to `main`. Never force-push, never delete `main` or `gh-pages`, and leave branch deletion to the owner. The 2026-10-24 main-only rule is history.
2. **Checks.** Run `python3 tools/check.py` before every push (`--fast` skips the Node.js suites during an edit loop; a release runs the full check). A failed check blocks the push until it is fixed or reported.
3. **Releases.** Synchronize the version in `plugins/framemotion/plugin.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `capabilities.json` and `.claude-plugin/marketplace.json`, add a `plugins/framemotion/CHANGELOG.md` entry and tag `vX.Y.Z` after the push. Creative Studio pins the released commit in its own marketplace and companion registry.
4. **Evidence.** Source checks, GitHub publication, saved-plugin readback and fresh-client behaviour stay separate. Owner reports are `PASS_REPORTED`; anything not run is `NOT_RUN`.
5. **Language.** Repository files, documentation and code comments are in English. The skill answers in the user's language.
6. **Licences.** Only MIT, Apache-2.0, BSD (code), public-domain dedications such as the Unlicense (owner 2026-11-23, Reanimate) and OFL (fonts) material is incorporated, with its licence and pinned source in `integrations/<name>/` or beside the file, and a line in `plugins/framemotion/NOTICE`. No HyperFrames Pro content.
7. **One skill.** `skills/framemotion/SKILL.md` is the only skill. Grow through reference files, starters and scripts, not new skills. The Remotion route is `skills/framemotion/remotion/REMOTION.md`, deliberately not named `SKILL.md`.
8. **Product.** FrameMotion is a general product: no defaults personal to one user, client or brand. Brand kits are inputs. The motion workshop holds tested defaults; untested tools wait in `references/workshop/test-queue.md`.
9. **Standalone and companion.** FrameMotion must work without Creative Studio. Studio-only references are written as "Creative Studio: `path`" text, never as broken links. The shared contract `contracts/framecore-task.schema.json` stays byte-identical with Studio, Toolbox and Open Assets (its SHA-256 is pinned in `tools/check.py`).
10. **Copies.** `skills/framemotion/assets/captions/captions.py` is a hashed copy of Caption Studio's script; refresh it only together with its README hashes.
11. **Commits.** Messages say why. End them with the attribution lines your host requires.
12. **Tested host (owner 2026-11-16).** FrameMotion is built and tested for Claude only (Claude Code and the Claude apps). It stays installable in Codex and ChatGPT Work, but no tests, evaluations or installation checks are run there: motion graphics come out better in Claude, and tokens are not spent on hosts that are not expected to match it. Record those hosts as `NOT_TESTED (by policy)`, never as a pending task.
