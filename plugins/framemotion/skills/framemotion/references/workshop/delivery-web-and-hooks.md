# Delivery, web motion and hooks

Researched defaults (checked against primary sources on 2026-11-08) for loudness, export, web motion, hooks and text readability. Platform numbers drift: when a delivery depends on one, check the current specification on the day and say which date it was checked.

## Loudness

- Social (Instagram, TikTok, Facebook, Shorts) has no official norm; the working target is −14 LUFS integrated, −1 dBTP.
- TV Europe EBU R128: −23 LUFS ±0.5, −1 dBTP. TV USA ATSC A/85: −24 LKFS, −2 dBTP. Netflix: −27 LKFS measured on dialogue, −2 dBTP. Spotify −14 (true peak −2 for louder masters).
- A TV or DOOH version with sound is its own mix, not the −14 file turned down.
- Under one minute measure only integrated loudness and true peak (LRA means little). Set loudness first, then the true-peak limiter.
- A mono downmix is about 3 dB quieter and wide out-of-phase effects vanish on a phone speaker: always listen in mono.
- Instagram, Facebook feeds and the web start muted: the story must work in picture and text. On TikTok sound measurably helps.

## Export

- YouTube SDR 1080p: about 8 Mb/s at 24 to 30 fps, 12 Mb/s at 48 to 60 fps, BT.709 only (BT.2020 without HDR gets flattened), MP4 without edit lists.
- Vimeo 1080p: 10 to 20 Mb/s or CRF 18 or lower, 10-bit if possible, two-pass VBR, AAC 48 kHz 320 kb/s.
- Instagram Reels always recompress: exactly 1080×1920, H.264 about 8 to 10 Mb/s, upload at the app's highest quality. TikTok keeps quality better from a web upload than from the app.
- Smooth 8-bit gradients get a dither or light grain before export, or they band after recompression.
- 4:2:0 halves colour resolution: thin coloured lines and small red text on dark need at least 2 to 3 px at 1080 and contrast in brightness, not hue alone.
- 60 fps only when the motion needs it: Instagram and TikTok have a fixed bit budget. Motion blur from accumulated subframes (render 120, `tmix` to 60) also helps the encoder.
- Client package: a 10-bit master (ProRes 422 HQ or H.265 10-bit), per-channel H.264 versions at their exact sizes, and a README with loudness, true peak, fps and BT.709.
- Colour: sRGB and Rec.709 share a gamut with different curves; social and web are SDR BT.709. On the web, neon accents may use `color(display-p3 …)` with an sRGB fallback under `@media (color-gamut: p3)`.

## Motion on web pages

- Simple scroll effects without JavaScript: CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`, Baseline since late 2026). State and page changes: View Transitions, with a plain change as fallback. Complex sequences and ScrollTrigger: GSAP (all plugins free since 3.13).
- Always honour `prefers-reduced-motion`: a version without motion or with a fade only.
- Animate `transform` and `opacity`, never layout properties.
- Springs in pure CSS: Motion's `spring(visualDuration, bounce)` generates a `linear()` easing.
- Formats for a web designer: icons and simple loops as SVG or CSS; timeline animations as dotLottie (smaller than Lottie JSON); interactive state machines as Rive (check its runtime and editor licence before an offer); 3D as glTF/GLB; background video as AV1/AVIF with an MP4 fallback, short, looping, silent.
- Handoff pack: the file and its size, loop yes or no, trigger (hover, scroll, load), duration and easing as tokens, the reduced-motion version, the file weight. Motion tokens in the DTCG format (`duration`, `cubicBezier`) serve design and code from one file (models: Material 3, Carbon, Atlassian).
- Browser simulations (WebGPU): headless in the cloud needs SwiftShader flags and Vulkan packages, screenshots come out black (read the buffer or use a virtual display); a fixed simulation step and checkpoints keep `seek(t)` deterministic. Heavy fluids for a reel stay in Blender.

## Hooks and length

- Up to about 47 % of a video ad's value lands in the first 3 s and 74 % in 10 s (Meta and Nielsen). The first frame works as a poster: never empty or black.
- Brand within 2 s and the product central for the first 10 s (Kantar). On YouTube and Instagram 15 s performs like 30 s; on TV 30 s wins.
- TikTok: the proposition in 3 s, the hook within 6 s, three to five clearly different creatives to test.
- Meta for conversion: one or two moving elements in the first 3 s, 5 to 10 s long, one benefit, a call to action and an end card.
- Make opening variants with a partial render of the first scene ([process and render](process-and-render.md)).

## Text readability

- Subtitles (Netflix): at most 42 characters per line, two lines, 5/6 s to 7 s on screen, 17 to 20 characters per second; break before a conjunction and never between a first and last name.
- BBC: 160 to 180 words per minute, at least about 0.3 s per word, a line no wider than 68 % of a 16:9 frame, text inside the middle 90 % vertically and 75 % horizontally.
- Two words per second in kinetic type is a safe margin.

## Motion identity and current APIs

- A brand's motion identity is three to five rules plus tokens (durations, curves, springs); models: Material 3, Carbon, DixonBaxi, Spotify.
- three.js r186: `RGBELoader` is `HDRLoader` (since r180), `PostProcessing` is `RenderPipeline` (since r183), `Timer` replaces `Clock`; in a WebGPU `RenderPipeline` with FXAA or a LUT set `outputColorTransform = false` and call `renderOutput()` yourself. Upgrade at most ten releases at a time.
- Remotion `spring()` defaults: mass 1, damping 10, stiffness 100; state stiffness explicitly. A negative bounce in Motion's spring means no overshoot.
- Blender 5.x offers a working space choice (Linear Rec.709, Rec.2020, ACEScg) and ACES views; stay on Linear Rec.709 with AgX unless the client's pipeline is ACES.
- Generated video: per-second prices change monthly, so check on the day; cheap models for drafts, a premium model for the final; a hybrid takes the first and last frame from code. Check the provider's commercial licence and label AI content where the law requires it (EU AI Act, article 50).
