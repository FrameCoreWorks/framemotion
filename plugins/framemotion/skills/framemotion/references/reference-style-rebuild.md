# Rebuilding a reference's style

How Studio learns from a reference video the user brings ("make it like this one") without copying someone else's work. Written 2026-11-04 after reviewing HyperFrames' `reverse-any-video` and `style-sampling` (Apache-2.0, v0.9.13) and the viral-clone guide of the HyperFrames app (no licence; nothing copied). It applies the ready templates (Creative Studio: `skills/pipeline-core/references/ideation-method.md`) rule: third-party creator work is linked and adapted, never copied.

## What may be taken

- **Technique, yes:** cut rhythm, shot lengths, how text enters and leaves, camera moves, transitions, layout grid, colour logic, sound cues.
- **The work itself, no:** the creator's footage, artwork, exact on-screen text, music, logo, characters or a shot-by-shot copy of their film. A user who asks for an exact copy of someone else's video gets one short line and, in the same reply, the same technique carrying their own content; a named brand, game or mascot is a style to work in, see [brand-inspired requests](brand-inspired-requests.md).
- **The user's own video:** may be rebuilt exactly (for an edit, a new language, a new format), because the user holds the rights.
- **A client's reel rebuilt 1:1** (the client owns the reference or commissions the copy; own or fictional characters, generated start frames and clips, new voices, cut on the reference's times) is an edit: it follows FrameCut's [rebuilding a client's reel](https://github.com/FrameCoreWorks/framecut/blob/main/plugins/framecut/skills/framecut/references/reference-reel-rebuild.md) (FrameCut: `skills/framecut/references/reference-reel-rebuild.md`). FrameMotion adds only what is coded there: designed titles or caption layers, composited after any RIFE pass, never generated inside a clip. No real person's likeness and no logo copied 1:1; each paid generation only after the user's yes with its cost (owner's client handover 2026-11-27).

## Method

1. **Measure.** Cut points and shot lengths, text on screen and its timing, motion per shot (direction, speed, easing), framing, palette, type families, sound hits. With a shell, `hyperframes measure` and `hyperframes audio` give these in film time; otherwise extract frames at every cut and read them.
2. **Write a technique card:** structure (which moment roles (FrameCut: `skills/framecut/references/moment-roles-and-clips.md`) in which order), pacing numbers, type and motion rules, what makes it recognisable. No asset of the original goes into it.
3. **Build the user's version** from the card with the user's content, brand and copy, as a HyperFrames composition or through Studio's other routes.
4. **Compare.** Put matching moments side by side (`hyperframes compare` or a contact sheet) and check the technique carried over while the content is the user's. `hyperframes diff` scores frame closeness; for a third-party reference a very high score is a warning, not a goal. Without HyperFrames, [`match.py`](../assets/reference-breakdown/README.md#checking-a-rebuild-against-the-reference) measures the motion: offset, start, end, peak and activity centre within 0.08 s, and the frames that differ most; for a third-party reference use its motion mode (timing and easing), never the pixel mode, so the content stays the user's.

## Requirements

- `reverse-any-video` opens its run through HeyGen and parts of it are **HyperFrames Pro**; `style-sampling` templates need a **Pro** subscription and sign-in. Both are optional: steps 1 to 4 work with the free CLI or with frame extraction alone ([skill map](hyperframes-skill-map.md)).
- Reference files stay in the project and are listed in the reference pack (Creative Studio: `skills/reference-pack-curator/SKILL.md`) as inspiration, not as canonical assets.

## Evidence

Source review only (2026-11-04). Not yet run through Studio: NOT_RUN.
