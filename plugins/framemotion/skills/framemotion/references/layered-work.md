# Layered work

Owner rule (2026-11-17), mandatory for every reel, ad, film and repair. Build like a working motion designer: one layer at a time, each closed and checked before the next one starts. Never build the whole film in one pass. The layers happen inside the stages of the [reel workflow](reel-workflow.md): the plan stage is layer 1, the contact sheet and the 540p preview carry layers 2 to 6, and the full render with its checks is layer 7.

## The layers

| # | Layer | Closed when | Check after it |
| --- | --- | --- | --- |
| 1 | Plan and structure | Beats with one message each, motion language, styleframes and composition on stills, safe area, beat timings, blocking on plain grey blocks with no effects | Grey-block frames of every beat; timing read against the copy |
| 2 | Typography and content | Fonts, hierarchy, line masks, reading time from word count, spelling; copy locked before any motion | Stills of every text state at the intended viewing size |
| 3 | Base motion | Curves, stagger, weight (anticipation, overshoot by policy), camera; works with no effects at all | Contact sheet, at least three frames per scene, including mid-entrance and mid-exit |
| 4 | Depth and polish | Parallax, shadows, motion blur, follow-through, secondary action, texture; effects never hide weak motion from layer 3 | Same frames with layer 4 on and off |
| 5 | Colour and look | One conversion, correction, then one look; the finishing stack (grade, glow, vignette, grain) last | Frames against the style lock |
| 6 | Sound | Music and effects on the frames, picture accent 1 to 2 frames before the peak, mix, about -14 LUFS, true peak below -1 dB | Measured on the encoded preview MP4, not the WAV |
| 7 | Detail control and file QC | Close-up frame checks, then the exported file itself: size, fps, flashes, first and last frame | Automated frame review plus the sound measurement on the delivered file |

## Rules

- **Check after every layer.** A short look at frames (a contact sheet, at least three per scene) before the next layer. Say which layer you are on and what the check showed; the full render never replaces the per-layer checks.
- **A fix goes back to its own layer.** Wrong timing is a layer 3 fix, not a layer 4 effect. After the fix, check the layers above it again. Changing a lower layer after the upper ones are done is expensive, so settle structure and timing early.
- **Do not mix layers.** No colour while motion still changes; no sound on a scene whose timing is open; no copy edits after motion starts without going back to layer 2.
- **In code, a layer is its own function or file with a switch.** Write the build as `layer1_blocking`, `layer2_type`, `layer3_motion`, `layer4_depth`, `layer5_look`, `layer6_sound` (or one file each) behind flags, so a render can turn layers off and show the layer below without effects. Name the flags in the contract notes. Scene kinds from [motion scenes](../assets/motion-scenes/README.md) already separate layout from motion; keep effects out of the layout code.
- **Name the layer in the plan.** The storyboard says which layer each deliverable will be on at each review, and the plan states the exception when one is used.
- **Exception.** A very short, simple job (one title card, one colour change, one text fix) may pass the layers in a single pass. Write the reason into the plan.

Related: [reel workflow](reel-workflow.md), [process and render](workshop/process-and-render.md), [storyboard contract](../templates/motion-storyboard-contract.md#layer-plan).
