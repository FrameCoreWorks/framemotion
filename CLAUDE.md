# Claude Code instructions

Read [AGENTS.md](AGENTS.md) before writing: commit on `main`, push only `main`, run `python3 tools/check.py`, keep one skill, English repository text. In a Claude Code cloud session the stop hook may report unpushed commits on the session branch; once `origin/main` carries them, run `git fetch --prune origin` and leave the session branch unpushed.
