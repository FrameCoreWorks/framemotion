# Reference breakdown

[`breakdown.py`](breakdown.py) turns a reference animation into a map you can build from, in one command. It is adapted from the breakdown script of [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) by alchaincyf (MIT, notice in [LICENSE.upstream](LICENSE.upstream)); the method around it is in [art-style and explainer motion direction](../../references/art-and-explainer-motion-direction.md#breaking-down-a-reference).

```sh
python3 breakdown.py --video reference.mp4 --out breakdown/
```

It needs FFmpeg, NumPy and Pillow (Studio's environment check reports whether they are present and how to install them) and writes:

| Output | Read it for |
| --- | --- |
| `cuts.json` | the first frame of every new shot, in frames and seconds; the grid the cuts fit (`start = t0 + k × step`, the worst residual, outliers) with BPM candidates if a step is an eighth or a quarter note; the moving area of each segment |
| `sheet_N.jpg` | contact sheets at 4 fps, 30 frames each: how many segments, what each one is |
| `transitions/TNN.jpg` | each cut from 2 frames before its start, every second frame, 15 cells: the transition mechanism, which a 4 fps sheet always flattens into "some wipe" |
| `motion-heatmap.jpg` | per segment, the largest per-pixel change in red over its first frame, with the moving share: what keeps a "still" scene alive |
| `keyframes.jpg`, `ref/segNN.png` | the last clean frame of each segment (3 frames before the next cut): the composition map and references |

A still segment has a mean frame difference under 2, a transition 10 to 40. The defaults (`--thresh 5`, `--debounce 12` frames) suit most edits; a large movement inside a shot can register as a cut, so the grid fit tolerates 20 % outliers and lists them. A cut grid is only a candidate tempo: confirm it on the soundtrack with [`beats.py`](../motion-sync/README.md#analysing-a-supplied-track). The video's own frame rate is kept, so frame numbers are the shared language of the spec.

Analyse only footage the user owns or may study. The output is for learning a mechanism and rebuilding it for a new subject; never copy the frames into a delivery.

Verified on 2026-10-18 in a Linux container (`tests/reference_breakdown_test.py`): on a synthetic 30 fps clip with 8 shots of 20 frames, all 7 cuts were found at their first frame, the grid fitted a 20-frame step with 0.03-frame residual (90 BPM if the step is a quarter note), and every output was written. Real reference films were not run during preparation.

## Shot-by-shot breakdown with rea-video

[`rea-video/`](rea-video/) is [rea-video](https://github.com/JuneYaooo/rea-video) by JuneYaooo (Apache-2.0, commit `751596967f58b8949124d291e59bdc40fc04486e`, version 0.1.0), bundled as a Python package next to `breakdown.py`. Where `breakdown.py` measures cuts, a grid and motion, rea-video takes a reference apart shot by shot: how each shot was most likely made (live action, AI video, code render or mixed), camera, framing, light, grade and editing per shot, on-screen text with its timing (OCR), faces, transitions, the soundtrack split into voice, music and effects, a report (`report.html`) and a VIDEO.md pack a model can read, and for code-rendered shots a first remake plan. Use it when the user wants to know how a film was made or to rebuild a reference's structure; use `breakdown.py` when cuts and timing are enough.

Install its dependencies once, after the user agrees (exact versions, all permissive licences), in a virtual environment:

```sh
python3 -m venv ~/.venvs/rea-video
~/.venvs/rea-video/bin/pip install \
  numpy==2.5.3 opencv-python-headless==4.14.0.94 \
  pillow==12.3.0 PyYAML==6.0.3 videomd==1.2.0 \
  onnxruntime==1.29.0 rapidocr==3.10.0
```

Run it from this folder, so the bundled package is the one imported, with FFmpeg on the PATH:

```sh
cd rea-video
~/.venvs/rea-video/bin/python -E -s -m rea_video \
  decompose reference.mp4 -o breakdown \
  --no-stems --no-asr --no-speakers --lang en
~/.venvs/rea-video/bin/python -E -s -m rea_video \
  summary breakdown
```

- **Models are downloaded, never bundled**, into `$REA_VIDEO_MODELS` (default `~/.cache/rea-video/models`), each checked against the SHA-256 pinned in its module before use. The face detector (YuNet, MIT, about 0.2 MB) is fetched on the first run; if it cannot be fetched the run goes on without faces. The stem split needs UVR MDX-Net (about 67 MB, licence not verified) and BandIt v2 (about 149 MB, weights CC BY-SA 4.0): keep `--no-stems` unless the user agrees to that download. Japanese and Korean OCR fetch one PP-OCR recognizer (Apache-2.0) each.
- **No speech recognition**: the `[asr]` extra installs an unpinned package, so FrameMotion always passes `--no-asr --no-speakers`. Read dialogue from the user's captions or from FrameCut's transcription instead.
- **No model call by default.** A VLM is used only when the user sets `REA_VLM_*` variables (an OpenAI-compatible endpoint and key); frames then go to that endpoint. Without them, `review` and `apply-review` let the host model look at the shots instead.
- **It writes** the output folder, the model cache and `~/.rea-video` (its preferences and the corrections the user gives with `correct`); change the last with `REA_VIDEO_HOME`.
- The capsule, remake-plan, remake-run, capsule-draft and eval commands are removed (they run paid generations through another product, or need an evaluation set that is not bundled); `remake` and `code-remake` stay, for code-rendered shots.

Analyse only footage the user owns or may study, as above. Verified on 2026-11-16 in a Linux container with the versions above, by hand and in `tests/rea_video_test.py` (its run check needs `REA_VIDEO_PYTHON` pointing at that environment): a synthetic 6-second clip with three shots gave exactly its three cuts, and OCR read its title between 0.5 and 3.5 s. The face model download was refused by the container's proxy and the run went on without faces. NOT_RUN: real reference films, the stem split, VLM review and macOS.
