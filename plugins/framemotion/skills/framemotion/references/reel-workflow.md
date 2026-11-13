# Reel workflow

The standard order for every reel, ad or short motion film (owner decision 2026-11-13). It applies on every route that renders (HyperFrames, the Python renderer, GSAP, Remotion, the Animate engine). A route with its own check-ins (the Animate engine's story, look and storyboard) maps them onto these stages; it does not skip one.

## The four stages

1. **Plan, discussed with the user.** The idea, boards with time ranges, exact copy, format, length and the sound plan. Nothing is built before the user approves the plan. A direct, complete brief may approve the plan in the same message; say so in one line.
2. **Contact sheet.** The key frames of every board (at least the middle and the last frame of each, plus every reveal), as one image shown in the chat window, not only saved to disk. Wait for the user's acceptance. Changes at this stage are made to the frames, not to a video.
   - **Check text on the sheet before showing it.** Add a frame from the middle of every text entrance and exit (a word that slides or scales in is most often cut there), and check that no letter touches or crosses the frame edge or leaves the safe area: the Animate engine's `tools/textcheck.mjs` does it on its route; on other routes look at those frames at full size, not as thumbnails (owner test 2026-11-13: a headline cut at the top in the middle of its entrance looked fine on the sheet).
3. **Preview render at 540p.** After the contact sheet is accepted, render a real MP4 at 540p (540×960 for 9:16, 960×540 for 16:9, the same aspect for other formats) at the final frame rate, with sound when the film has sound, and show it in the chat to watch or download.
   - **Measure the sound on the encoded preview MP4**, not on the WAV: AAC raises the true peak by up to about 2 dB (owner test 2026-11-13: −1.5 dBTP in the WAV became −0.8 in the MP4). Mux with `assets/motion-sound/sound.py` (`deliver` trims the master when the file passes the ceiling) or measure the MP4 with `assets/sound-listen/listen.py`; a mix built another way is limited to about −2 dBTP before encoding. The preview must already meet the delivery level (about −14 LUFS, true peak at or below −1 dBTP).
   - **Corrections re-render only the changed part.** Render the changed frame range with the same settings, start and end on a board or cut boundary, splice it into the previous preview at those exact frames, and check the frames on both sides of each splice. Re-render the whole preview only when the change moves timing across the film (a new length, a retimed beat or music change).
4. **Full render after the preview is accepted** (with or without corrections): the delivery size and frame rate the brief asks for, for example 1080×1920 at 60 fps, given as a download in the chat. Run the frame review and the sound measurement on this file before delivery.

**Why:** full resolution takes many times longer than 540p, so a full render before acceptance is lost time at every correction.

## Rules that go with it

- The preview is a real MP4. No HTML mock-up stands in for it.
- Before showing any render, check its frames and its sound level, and say plainly what was not listened to.
- Paid generations (image, video, voice, music) only with the user's consent and the stated cost.
- A user who asks for the full render straight away gets it; say once that corrections will then cost a full render each.

## Sound for reels

Platforms (Pinterest, YouTube, TikTok, Instagram, Facebook) detect other people's music automatically and can mute a film or file a claim (Content ID), even when the track has a free licence such as CC BY: labels register their catalogues in the detection systems. Example: "Pixelland" by Kevin MacLeod (CC BY 4.0) was muted by Pinterest (owner report 2026-11-13).

1. **Music from code.** Compose the music bed in code (numpy, as [motion sound design](motion-sound-design.md) does), original and finished, instead of taking a track from a music library.
2. **Effects from code** when they sound convincing. CC0 samples only as a fallback when code cannot give a realistic sound.
3. **Someone else's track:** when the user wants one, warn them before using it that the platform may mute the film or file a claim; a licence alone does not guarantee that it will not.
4. **Level:** about −14 LUFS integrated, peak below −1 dB. Limit in numpy (the look-ahead limiter in `assets/motion-sound/synth.py`), not with FFmpeg's `alimiter`; measure the delivered file.
