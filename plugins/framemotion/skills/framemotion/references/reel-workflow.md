# Reel workflow

The standard order for every reel, ad or short motion film (owner decision 2026-11-13, version 2 on 2026-11-19). It applies on every route that renders (HyperFrames, the Python renderer, GSAP, Remotion, the Animate engine). A route with its own check-ins (the Animate engine's story, look and storyboard) maps them onto these stages; it does not skip one. Changes to this process apply from the next project, never in the middle of one.

## A team of three

Work as three professionals at once: a **motion designer**, a **film editor** and a **composer and sound designer**. Each one checks every stage against their own list in the [quality loop](#quality-loop) before the user sees it.

The user sees four stages for acceptance, plus the final render on request. Everything in between (layers, sketches, stems, frame checks) is your own work, done one layer at a time ([layered work](layered-work.md)): layout and timing, typography, motion, depth and effects, colour, sound, control.

## The stages

### Stage 1. Idea and look (one package)

- **The hook** that stops the scroll in the first second.
- **A short scene plan with times.** The times must be firm: the music in stage 2 is composed to them, and the music's grid becomes the cut.
- **Two or three fully finished key frames (styleframes):** light, shadow, texture, typography and grain as they will look in the film. A key frame is the target; the build still goes layer by layer and reaches that look in layer 5.
- **The music direction:** genre, tempo (BPM), mood and instruments, following the user's [music profile](#music-profile) when one exists.
- **Ask for one reference:** a reel or a track the user likes.
- **How many concepts.** An ad or showcase piece without a ready idea: two or three concepts, each with one key frame and a named "wow" (no flat shape-plus-headline ideas). A precise brief: exactly that one concept; extras only as a proposal. An open topic: two or three directions, each with one key frame.
- Shots last at least about 2 s with their effect: the entrance plus a hold of 1 to 1.5 s. Push in and hold; no zoom-out during a shot. When the asked length does not fit the plan, propose a longer one before building.

Nothing is built before the user accepts this stage. A direct, complete brief may approve it in the same message; say so in one line.

### Stage 2. Music (an MP3)

- **Full length, composed to the times of the plan,** with accents on the beats where scenes change.
- **Sound effects only sketched, or none yet.**
- **About −14 LUFS integrated, true peak below −1 dBTP,** measured on the MP3 itself.
- **Original music or CC0, never a library with Content ID** ([sound for reels](#sound-for-reels)). Real instrument timbres: compose in code and play the parts with recorded CC0 instruments ([where the music comes from](#where-the-music-comes-from)).
- **When in doubt, two variants.** Before the preview the user has listened to the music once (this MP3 is that sample).

The picture will be cut to this music: its bar and beat grid is the timing grid for every later stage.

### Stage 3. Contact sheet on the beats

- **At least three frames per scene,** at times taken from the grid of the accepted music (the beat a scene starts on, its peak, its last frame), plus a frame from the middle of every text entrance and exit, as one image shown in the chat window, not only saved to disk.
- **Optionally an animatic:** the frames as a slideshow over the music.
- **Name the weakest scenes** yourself.
- **Check text on the sheet before showing it.** No letter may touch or cross the frame edge or leave the text safe zone (9:16, owner rule 2026-11-19: no text in the top 14% or the bottom 35%, margins at least 90 px; other content keeps the platform zone of the engine, top 240 and bottom 420 px). The Animate engine's bundled checker warns from its own zone, so for text also check the frames against 14% and 35% (on that route pass `review.safe = { top: 269, bottom: 672, right: 140 }` in the piece when it holds text only in the middle band): the Animate engine's `tools/textcheck.mjs` does it on its route; on other routes look at those frames at full size, not as thumbnails (owner test 2026-11-13: a headline cut at the top in the middle of its entrance looked fine on the sheet).

**Acceptance is the picture lock.** After it, scene lengths do not change. Changes at this stage are made to the frames, not to a video.

### Stage 4. Preview at 540p with sound

- **The full animation,** rendered as a real MP4 at 540p (540×960 for 9:16, 960×540 for 16:9, the same aspect for other formats) at the final frame rate, shown in the chat to watch or download. No HTML mock-up stands in for it.
- **Full sound effects on their frames and the final mix.**
- **The music or the animation may still change here,** inside the picture lock: the music's sound, instruments and mix may change on the same grid. A change to the grid (length, tempo, accents) goes back to stage 2 and then stage 3.
- **Measure the sound on the encoded preview MP4**, not on the WAV: AAC raises the true peak by up to about 2 dB (owner test 2026-11-13: −1.5 dBTP in the WAV became −0.8 in the MP4). Mux with `assets/motion-sound/sound.py` (`deliver` trims the master when the file passes the ceiling) or measure the MP4 with `assets/sound-listen/listen.py`; a mix built another way is limited to about −2 dBTP before encoding. The preview already meets the delivery level.
- **Corrections re-render only the changed part.** Render the changed frame range with the same settings, start and end on a board or cut boundary, splice it into the previous preview at those exact frames, and check the frames on both sides of each splice. Re-render the whole preview only when a change moves timing across the film.

### Stage 5. Render at 1080×1920

Only on the user's explicit request: the delivery size and frame rate the brief asks for (for example 1080×1920 at 60 fps), given as a download in the chat. Run the frame review and the sound measurement on this file before delivery. When the user sends corrections to a delivered render, change the code and show the changed frame; render again only when asked.

**Why:** full resolution takes many times longer than 540p, so a full render before acceptance is lost time at every correction. A user who asks for the full render straight away gets it; say once that corrections will then cost a full render each.

## Rules for corrections

- **Collect the user's notes into one message per stage** and apply them all at once.
- **At most two rounds of the user's corrections per stage.** When a third is needed, go back to stage 1: the idea or the plan is wrong, not the details.
- **These rounds are the user's.** The passes of the [quality loop](#quality-loop) are yours (at most three per stage) and are counted separately.
- **Every note from the user becomes a correction of an existing rule** in the user's own rule file (in the user's project folder, never in the plugin); notes about music go into the [music profile](#music-profile). A rule that holds for everyone reaches the plugin only through a normal change to this repository.
- **Changes to the process apply from the next project,** not during the current one.

## Quality loop

Before showing any stage, run the loop:

1. Make the stage.
2. Check it against the list of each profession below.
3. Fix only what did not pass.
4. Repeat, at most three passes.

Run the checks in this order: the automatic checks with their thresholds first, then the [brief check](#quality-loop), then the fresh reviewer.

If something still fails after three passes, show the stage and name the weak spot plainly. When showing a stage, add one sentence: what the loop fixed and what the weakest spot is.

**The motion designer checks**

- Frame strips of every scene at 4 to 5 frames per second, in close-up: text whole and readable, nothing overlapping or passing through anything, hands, faces and poses logical. Run the automatic checks on every frame of the strip (`textcheck`, `motion-review`, `motion activity`); look at the strips as one grid per scene, and at full size only at text entrances and exits and at the cuts, so the loop stays affordable.
- Visible motion in every shot.
- Agreement with the key frame: light, texture, typography.
- Whether it looks more expensive than the previous reel (the [reel log](#reel-log)).

**The film editor checks**

- Cuts and entrances land on the music's beats, to the frame.
- Every shot lasts long enough to read (at least about 2 s with its effect).
- The first second stops the scroll.
- Smooth transitions, and the first and last frame.

**The composer and sound designer checks** (by measurement, because the model cannot hear)

- About −14 LUFS integrated, true peak below −1 dBTP, no clipping (`listen.py measure` on the delivered file).
- The hits sit on the BPM grid (`listen.py sync`, `sound.py` timing status).
- Bass and treble balance (the spectrum from `listen.py measure`).
- Mono fold-down, as on a phone: downmix (`ffmpeg -i in.mp4 -af "pan=mono|c0=0.5*c0+0.5*c1" mono.wav`) and measure again; wide effects that vanish or a level drop of more than about 3 dB are findings.
- Comparison with the reference and with the user's music profile.

**The brief check** (after the automatic checks, before the fresh reviewer)

A pass that reads only the brief and the stage, as the client would: delivery format and size, length, logo, brand colours, required lines and everything the brief forbids. Any mismatch is a finding, however good the craft (a 9:16 reel for a brief that asked for 16:9 in 4K fails here). Show the stage only when the automatic checks and this check pass.

**The fresh reviewer** (at the end of each pass)

A separate agent gets only the brief, the frames and the measurements, without your explanations. It scores the stage 1 to 10 and names the three weakest spots. Below 8: fix and check again, inside the limit of three passes. Where no separate agent is available, run a separate pass that reads only those inputs, and say that the review was not fully independent.

## Music profile

A short file in the user's project folder (for example `music-profile.md`), never in the plugin: liked and disliked genres, tempos, instruments and references, and every note the user has given about music, newest last. Read it in stage 1 and stage 2; add to it after each note. When none exists, create it after the first note about music. Template: [music profile](../templates/music-profile.md).

## Reel log

A short record in the user's project folder of the last reel: its key frames, the reviewer's score and its weakest spots. The motion designer compares the new reel with it ("more expensive than the previous reel"). When there is no log yet, start one with this reel.

## Layers inside the stages

Inside these stages the work goes one layer at a time (owner rule 2026-11-17): plan and blocking, typography, base motion, depth and polish, colour and look, sound, then detail control and QC of the exported file, with a frame check after each. Stage 1 carries layer 1 (and the key frames as stills), stage 2 is the music part of layer 6, stage 3 checks layers 2 and 3, stage 4 carries layers 4 to 6, and stage 5 is layer 7. See [layered work](layered-work.md).

## Rules that go with it

- Before showing any render, check its frames and its sound level, and say plainly what was not listened to.
- Paid generations (image, video, voice, music) only with the user's consent and the stated cost.
- A render queue, if the user has one, is the user's own environment; this workflow does not depend on it.

## Sound for reels

Platforms (Pinterest, YouTube, TikTok, Instagram, Facebook) detect other people's music automatically and can mute a film or file a claim (Content ID), even when the track has a free licence such as CC BY: labels register their catalogues in the detection systems. Example: "Pixelland" by Kevin MacLeod (CC BY 4.0) was muted by Pinterest (owner report 2026-11-13).

1. **Music: original or CC0, never a library with Content ID** ([where the music comes from](#where-the-music-comes-from)).
2. **Effects for real objects are recordings of that object** (a cup, a door, keys: CC0 recordings from the [SFX library](../assets/sfx-library/README.md) or Open Assets, laid on the frames with `place_sfx.py`); effects from code only for abstract accents (whooshes on graphics, UI blips, risers, hits on type).
3. **Someone else's track:** when the user wants one, warn them before using it that the platform may mute the film or file a claim; a licence alone does not guarantee that it will not.
4. **Level:** about −14 LUFS integrated, peak below −1 dB. Limit in numpy (the look-ahead limiter in `assets/motion-sound/synth.py`), not with FFmpeg's `alimiter`; measure the delivered file.

## Where the music comes from

In this order (owner rulings 2026-11-19: real instruments first, then code with real timbres, never Content ID libraries; a short sample to listen to before the preview):

1. **A CC0 recording with real instruments** when one fits the plan's times and mood (Open Assets, CC0 only, licence recorded in the asset ledger): cut it to the plan's grid with [`beats.py` and `music_edit.py`](../assets/motion-sync/README.md#analysing-a-supplied-track) and put the scene changes on its beats.
2. **Composed in code, played by real instruments** (the usual stage 2 route, because it lands on the grid exactly). `sound.py plan` composes the parts to the plan's times; `--set lead=real-piano`, `--set pad=real-strings`, `--set bass=real-pizz-bass` (and the other instruments `samples.py list` shows: harp, marimba, glock, flute, cello) play them from recorded CC0 instruments. `sound.py mix` fetches only the instruments the recipe uses into a local cache; nothing is bundled and nothing needs an account ([real instruments](../assets/motion-sound/README.md#real-instruments)).
3. **Synthesized instruments** when the recordings cannot be fetched (offline) or for a quick sketch: the same notes on the same grid; the mix says which parts were synthesized.
4. **A paid music generator** only when the user asks for it, with the cost stated first. It is harder to land on the frame; cut it to the grid with `music_edit.py` afterwards.
