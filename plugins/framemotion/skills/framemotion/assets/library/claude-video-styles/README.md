# Claude Video styles in FrameMotion

The complete Claude Video Studio skill by ItsssssJack (MIT), bundled in [`upstream/`](upstream/) at commit `18891e4996abb7ccc0085f2d43cef2fd7eff1dc8`: its [skill](upstream/SKILL.source.md) and [questions](upstream/questions.md), 21 film looks in [`styles/`](upstream/styles/) (each with `STYLE.md`, most with a reference `index.html`), [references](upstream/references/) (motion craft, loops, HyperFrames, media, hacks), [templates](upstream/templates/), [examples](upstream/examples/) and the local check [scripts](upstream/scripts/) (`loop_check.py`, `pacing_check.py`). Provenance and hashes: [UPSTREAM.md](UPSTREAM.md), [SHA256SUMS](SHA256SUMS).

## When FrameMotion uses it

A named look for the whole film (swiss-grid, risograph, paper-cut, blueprint, poster-pop, ink-line, midnight-grid and the others). FrameMotion's [coded look library](../../../references/coded-look-library.md) summarises the same 21 looks; open the look's `STYLE.md` and reference page here for its exact rules and values.

## What FrameMotion changes

1. **FrameMotion's flow, not the upstream interview.** The brief, copy locks, board and approval come from FrameMotion; use the upstream `questions.md` only to fill a gap in the brief.
2. **Local and pinned.** Reference pages load GSAP 3.14.2 from jsDelivr and fonts from Google Fonts. For a render, use the local `gsap` 3.15.0 of FrameMotion's starters and its bundled fonts (or fonts the user supplies), so the render needs no network.
3. **No paid service.** `scripts/higgsfield.py` was left out; never call Higgsfield or another generator from this pack.
4. **Checks.** `loop_check.py` and `pacing_check.py` may run on a render; FrameMotion's frame QA still decides.
