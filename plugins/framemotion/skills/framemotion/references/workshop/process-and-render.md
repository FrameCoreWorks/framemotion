# Process, self-check and render

Working defaults for running a film from idea to delivery. Like the other workshop pages, they come from produced reels (2026-11) and were rewritten as general defaults: the user's brief and brand always win, and an exception is written in the plan with its reason.

## Order of work

This order gave the fewest revision rounds:

1. **The best idea for the subject, not the richest.** Before the first plan, judge what this subject does best in this format: a story through stages, changes of place, camera travel, a twist, or one strong idea. Test: does the plan use what the subject offers in this format? Typical failure: a showreel on one board where little happens; a journey through stages, each stage its own board with its own look, made it a story.
2. **Three pitches with a rubric** when the user has not fixed the idea. Score each against the brief; above 75 of 100 the best one may be proposed as the pick, and any one veto criterion (wrong message, unreadable, off brand) drops a pitch. Avoid repeats: when earlier films of the same user or series are known, the new one differs from each of the last ten in at least four of scene order, background, camera, tempo and sound.
3. **A frame sheet before any MP4, always.** At least three frames per scene (start, middle, payoff or end). No MP4 render, not even "in the background, just in case", before the sheet is approved; the same applies to revisions.
4. **A technique test must look like a finished piece** (light, camera, composition, music). A raw proof of a technique, such as a flat fold in three.js, gets rejected and takes the idea down with it.
5. **Partial render on revisions.** Render only the changed scene (from its start frame) and join it by frame number (trim plus concat) instead of rendering the whole film: a two-second fix took 42 s as a fragment against 8 minutes as a full render.
6. **Self-check before showing** (below), then an independent reviewer, then the user.
7. **After every correction from the user**, write one lesson at once: what was proposed, the user's words, the rule that follows. Read the lessons before the next film; when two lessons contradict, report it instead of choosing silently.

The user judges by watching: a quick version beats long questions, and questions come with ready options.

## Composition details

- Margins at least 90 px at 1080 wide; the frame is evenly filled, with no empty bottom.
- Check bounding boxes in every frame: elements never overlap each other or the main colour fields.
- Scenes are physically logical: vehicles drive the way they face, tools work correctly, a prop has one possible state.
- What orbits a figure hides behind it on the far side (depth order by orbit phase, smaller scale behind).
- Ground contact matches to the pixel in every frame; a figure walks with a leg cycle instead of hopping as a whole.
- A prop in a scene has its own action tied to the character (a bulb lights above the head, a rocket leaves with smoke), never a catalogue display.
- A chart or diagram in a demo fills the frame and is the action of the scene, not a background beside it.
- Read every contact between a figure and an object for double meanings before showing.
- A stage metaphor must make sense to the viewer.
- A mouse cursor travels smoothly (minimum-jerk path) and stops only to click; a typing caret appears together with its text.
- A rotating part of a logo is never also drawn as a static copy next to itself.
- A change of a character's style between boards is a visible transition (redraw by outline, then fill), never a colour swap.

## Self-check list

1. Depth and occlusion: what orbits hides behind.
2. Contrast of the figure's details against the background.
3. Ground contact, frame by frame.
4. Continuity of music and transitions; how the end card arrives (it grows out of the film's action, not a separate curtain or wipe).
5. Labels match what is on screen.
6. One-to-one close-ups: hands, limbs, text in frames, interpenetration, prop states.
7. The whole end card, with its echoes and ornaments, fits in the frame.

How to check:

- Judge motion on a strip of consecutive frames from the finished video (4 to 5 fps, tiled), not on single stills.
- Stills: start, middle and end of each scene, every cut ±1 frame, first and last frame; tiles at 360×640 for a phone view.
- Measure size, fps, frame count, audio codec, loudness and true peak, flashes (at most 3 per second) and freezes (under 2 s outside the last 5 s).
- Each check is pass, fail or unknown; no evidence means unknown, never pass. Listening stays with a person.
- **Independent reviewer:** another model or a fresh agent sees only the frames, the cues and the lessons, never the builder's report. At most two revision rounds, each verified from zero.

The user should not have to find these errors; detect them before showing.

## Graphics and sources

- Realistic objects and illustrations come from pictures (the client's, openly licensed ones, or an image model with a transparent background); code does the motion. Objects drawn in code or "3D from code" looked cheap and flat.
- Check background removals at close range (gaps in wheels and frames); a dirty cutout is replaced by a clean asset with a transparent background.
- A generated GIF works as a sprite sheet for a character loop on twos, not for final 60 fps shots (256 colours, banding).
- Colour someone else's monochrome graphics per part in muted tones.
- Directions that worked: a "physical mechanism" series (split-flap board, receipt printer, zoetrope, boarding pass), halftone collage with paper cutouts, paper cut-out on twos with a 60 fps camera.
- Blender Cycles for physical materials in close-up (paper, cloth, glass, liquid, food, product), the whole scene procedural in one `bpy` script: real scale in metres, low light powers, `visible_glossy=False` where reflections cheapen it, paper as Solidify 0.1 to 0.2 mm, AgX Medium High Contrast, a 50 mm camera at f/5.6. Without a GPU render only control frames in the cloud and the full film on a machine with one.

## Render lessons

- DOM engines: `seek(t)` plus a frame-by-frame browser capture; for smoother motion render at 120 fps and blend to 60 with ffmpeg `tmix`.
- **Check the GPU before a heavy render.** Read the browser's `gpu:` line: a cloud container without a GPU (SwiftShader) was about 80× slower than an Apple M4 with ANGLE Metal. Run heavy renders on a machine with a GPU.
- **macOS:** Playwright starts `chromium_headless_shell` by default, which falls back to SwiftShader (about 5 s per frame and timeouts). Point it to the full Chromium app in the Playwright cache and add `--use-angle=metal`, then check the `gpu:` line.
- A sandboxed agent session on macOS can block Chromium (`MachPortRendezvousServer ... Permission denied`); run the render as a normal process outside that sandbox, and a long one in the background with its log in a file.
- On a small system disk put `TMPDIR` and the browser cache on the working disk and write output to the project's render folder.
- A render script stops on a browser error (`set -e`); otherwise it mixes sound into an old video.
- Match the Playwright version to the installed Chromium build before rendering.
- Recording someone else's WebGL page: installing the page clock does not stop time; pause it with `page.clock.pauseAt(...)` and advance with `runFor`.
- A small 540p MP4 is the phone preview; the full render follows approval.

## What did not work

- Infinite zoom; image-to-video clips with ambiguous poses; a sticker collage so dense the frame could not breathe; a flat origami fold in three.js.
- A showreel assembled from old work; reusing scenes from earlier episodes of a series.
- Music and effects synthesized in code as the delivered sound (heard as metallic); real recordings are the default, synthesis only on request.
- An end card arriving separately (curtain, wipe) instead of from the film's action.
- Rendering the MP4 before the frame sheet was approved, and a full render for a small fix.
