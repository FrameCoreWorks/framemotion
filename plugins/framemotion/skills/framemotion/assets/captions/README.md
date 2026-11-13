# Captions script (copy)

`captions.py` reads and burns subtitle cues (SRT, VTT, the contract's caption track). FrameMotion uses it to duck music under captions ([sound for supplied footage](../motion-sound/README.md#sound-for-supplied-footage)) and to burn captions with the [motion renderer](../motion-render/README.md).

The script is maintained in FrameCut (FrameCut: `skills/framecut/assets/captions/captions.py`, [FrameCoreWorks/framecut](https://github.com/FrameCoreWorks/framecut)). This folder holds a copy so FrameMotion works on its own; it was made from the source below:

| Field | Value |
| --- | --- |
| Source | `plugins/framecore-work-creative-studio/skills/caption-studio/assets/captions/captions.py`, Creative Studio main `9841769d` |
| Source SHA-256 | `03766f17c34fec4144a93f50e4e73f789d84029c5552565f250fabd172d12b97` |
| Change | one added render path candidate, `../motion-render/render.py`, so the copy finds FrameMotion's renderer |
| This copy SHA-256 | `6fa3a3c716fa54db387b3bf99b1fb5adc2fccec6a8a50ca3522501dba47f2d96` |

A test compares this file with the recorded hash. When the owner's script changes, copy it again, re-apply the one change and update both hashes.
