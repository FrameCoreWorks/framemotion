# manim-skill in FrameMotion

Yusuke Miyashita's Manim explainer skill, bundled in full in [`upstream/`](upstream/) at commit `a0048d9e265499038f34a9aa58ff16d306b5034c` (Copyright (c) 2025 Yusuke Miyashita, MIT, [licence](upstream/LICENSE)): the workflow [narration, TTS, code, render, mux, view](upstream/skills/manim-skill/SKILL.source.md), [`tts-generate.py`](upstream/skills/manim-skill/tools/tts-generate.py) (local Kokoro voice), [`lint-subtitles.py`](upstream/skills/manim-skill/tools/lint-subtitles.py) and the local [viewer](upstream/skills/manim-skill/tools/README.md).

## When FrameMotion uses it

Math, formulas, graphs, geometry and science explanations that need exact LaTeX and Manim scenes, as a whole film or as a clip inside a larger FrameMotion film. For a short beat inside another engine's film, the [Manim bridge](../../../references/motion-toolkit-runtime-cards.md#manim-local-clip-bridge) and [math explainer timing](../../../references/explainer-method-recipes.md#math-explainer) still decide the clip's length and hand-off; this skill's workflow builds the clip.

## What FrameMotion changes

1. **Environment, after the user's yes.** Manim Community and a working TeX installation must already be on the machine or installed with consent; check `manim --version` and `latex --version` before promising a render. Install exact versions, never the `>=` ranges of `upstream/pyproject.toml`: `manim==0.20.1` (FrameMotion's tested baseline; 0.21.0 needs Python 3.11+) in a project virtual environment, never system-wide.
2. **Voice.** The upstream turns voice-over on by default with Kokoro. FrameMotion asks first, as for any film with sound. Kokoro has no Polish voice: for Polish or another language it lacks, use a recorded voice-over or the user's chosen TTS and FrameMotion's word timing ([animate voice](../../animate-voice/README.md), `retime.py --language pl`), then feed the measured durations into the scene timing the way `tts-generate.py` writes `timestamps.json`. When Kokoro is used, pin it (`kokoro==0.9.4`, `soundfile`) in the same project environment.
3. **Frame rate and size.** Render at the film's fps and size (`-r W,H --frame_rate N`), not Manim's preset quality flags, so the clip drops onto the timeline without conversion; for FrameCut follow [From frames to a FrameCut motion request](../../../references/engine-contract.md#from-frames-to-a-framecut-motion-request).
4. **QA and sound.** After the upstream mux, run FrameMotion's frame QA on the encoded MP4 and its sound pass (Earshot or `sound.py`). The upstream viewer is optional and local; never publish its server beyond `localhost`.
5. **Session storage.** Keep the upstream session folders inside the project, not in the plugin folder.
