# Mixed-media compositing: motion over stills, footage and AI video

How to join coded motion with three kinds of material: generated still assets (images from AI generators), real footage (a client's film, a person talking to camera) and generated video (clips from AI video generators). This page is the shared core: layer order, mattes, matching light and colour, text over moving pictures, AI artifacts, concepts and mistakes. Ingest and conform of footage (frame rate, variable frame rate, HDR, colour tags), stabilising client footage, cutting AI clips and the sound edit live in FrameCut (FrameCut: `skills/framecut/references/mixed-source-footage.md`); without FrameCut, the one conform command in [section 3](#3-conform-before-compositing) is enough for a single clip.

Owner request 2026-11-18. Facts with a number carry a source link; lines marked *(inferred)* are working judgement, not a published rule. Paid generators appear only as a source of material; every recipe here runs on tools without accounts or keys (ffmpeg, Python, the browser engines, Blender).

## Contents

1. [Three kinds of material](#1-three-kinds-of-material)
2. [The layer stack](#2-the-layer-stack)
3. [Conform before compositing](#3-conform-before-compositing)
4. [Mattes, keys and alpha](#4-mattes-keys-and-alpha)
5. [Text and graphics over moving pictures](#5-text-and-graphics-over-moving-pictures)
6. [Stabilise or track](#6-stabilise-or-track)
7. [2.5D parallax from a still](#7-25d-parallax-from-a-still)
8. [Making generated and real look like one shot](#8-making-generated-and-real-look-like-one-shot)
9. [AI video: artifacts and how to hide them](#9-ai-video-artifacts-and-how-to-hide-them)
10. [Sound and sync](#10-sound-and-sync)
11. [Export and frame QC](#11-export-and-frame-qc)
12. [Where it happens in layered work](#12-where-it-happens-in-layered-work)
13. [Three concepts with a named wow](#13-three-concepts-with-a-named-wow)
14. [Common mistakes](#14-common-mistakes)
15. [Sources](#15-sources)

## 1. Three kinds of material

| Material | Typical problem | First step | Built where |
| --- | --- | --- | --- |
| Generated still (product, prop, background plate, character) | Too clean and too sharp, wrong light direction, fake transparency, garbled text | [Generated cut-out assets](generated-motion-assets.md): one object per image, `asset_check.py check`, matte or key | Any engine; parallax in canvas/three.js or Blender |
| Real footage (talking head, client film, phone clip) | Variable frame rate, HDR from phones, shake, busy background behind text | Conform (section 3), then stabilise only if graphics must sit on it | FrameCut for the edit; FrameMotion builds the pieces that go on top |
| Generated video (text-to-video, image-to-video) | Flicker, identity drift, background swim, short clips at 24 fps | Pick the clean range first, then conform; never track graphics to a swimming background | FrameCut cuts it; FrameMotion covers the weak frames |

## 2. The layer stack

Build bottom to top, each layer its own element (or file) with a switch, so any layer can be turned off and checked. This is the compositing order inside one shot; [section 12](#12-where-it-happens-in-layered-work) says in which work layer each part is built.

| Order | Layer | What it holds |
| --- | --- | --- |
| 1 | Plate | The footage, AI clip or still background, conformed and, when needed, stabilised and deflickered |
| 2 | Clean-up | Paint-outs, a blurred or darkened region behind future text, a clean plate under a moved subject |
| 3 | Behind-subject graphics | Type, shapes or light that should pass behind the person or object |
| 4 | Subject holdout | The subject cut out with its matte and placed again over layer 3 (this creates "text behind the speaker") |
| 5 | Front graphics | Lower thirds, callouts, tracked labels, UI, arrows |
| 6 | Integration | Contact shadows, light wrap at matte edges, one grade over everything, grain, motion blur |
| 7 | Captions and safe overlays | Captions and anything the platform interface might cover, last and inside the safe area |

Sound is not a picture layer; it follows [section 10](#10-sound-and-sync).

## 3. Conform before compositing

Every source must share one frame rate, frame size and colour space before a single graphic is placed, or the overlay will drift, judder or shift colour. FrameCut owns the full ingest checklist and its recipes. For a single clip without FrameCut:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,avg_frame_rate,pix_fmt,color_transfer,color_primaries \
  -of default=nw=1 clip.mov
ffmpeg -i clip.mov -vf "fps=30,scale=1920:1080:flags=lanczos,setsar=1" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -ar 48000 clip_conformed.mp4
```

When `r_frame_rate` and `avg_frame_rate` differ the clip has a variable frame rate (phones record this by default, [Dolby](https://professionalsupport.dolby.com/s/article/Using-an-Apple-iPhone-12-captured-Dolby-Vision-content-as-a-source-in-a-Dolby-Vision-production?language=en_US)); `color_transfer=arib-std-b67` (HLG) or `smpte2084` (PQ) means HDR, which must be tone-mapped first (FrameCut's recipe), not just re-tagged.

## 4. Mattes, keys and alpha

Choose the matte route by the material, not by habit.

| Material | Route | Notes |
| --- | --- | --- |
| Generated still | `asset_check.py` (`check`, `key`, `matte`) from [generated cut-out assets](generated-motion-assets.md) | Difference matte for glass, hair, smoke; screen blend for light effects |
| Footage shot on a green screen | ffmpeg `chromakey` then `despill` | Start with `similarity` 0.10 to 0.15 and `blend` 0.05 to 0.10 *(inferred starting values)*; `similarity` 0.01 keys only the exact colour and 1.0 keys everything ([ffmpeg filters](https://ffmpeg.org/ffmpeg-filters.html#chromakey)) |
| A person on any background | A segmentation model run locally: MediaPipe Selfie Segmenter (person and background classes, 256 x 256 or 144 x 256 input, [Google](https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter)), SAM 2 for any object tracked through a clip (Apache-2.0, [repo](https://github.com/facebookresearch/sam2)) | Each needs a Python install and a model download: ask once, install nothing without the user's yes |
| One frame or a still, any subject | rembg with `-m isnet-general-use` or `-m u2net` (Apache-2.0 models), or BiRefNet (MIT, [repo](https://github.com/ZhengPeng7/BiRefNet)) | rembg's code is MIT but its default model since 2.0.80 is BRIA RMBG-2.0, non-commercial: always pass `-m` for client work ([rembg](https://github.com/danielgatis/rembg)) |

Green-screen key over a background, tested here with ffmpeg 6.1:

```bash
ffmpeg -i background.mp4 -i greenscreen.mp4 -filter_complex \
  "[1:v]chromakey=0x00FF00:0.12:0.06,despill=type=green[fg];\
   [0:v][fg]overlay=format=auto,format=yuv420p[v]" \
  -map "[v]" -map 0:a? -c:a copy keyed.mp4
```

**Matte hygiene.** A segmentation mask chatters from frame to frame on hair and hands. Choke it by about 1 px, feather 1 to 2 px and smooth it over 3 frames (ffmpeg `tmix=frames=3` on the mask stream) *(inferred)*; check the edge at 2x on the frames where the subject moves fastest. A hard binary mask loses hair detail that a soft alpha matte keeps ([Google Research on alpha matting](https://research.google/blog/accurate-alpha-matting-for-portrait-mode-selfies-on-pixel-6/)).

**Alpha conventions.** Only ProRes 4444 and 4444 XQ carry alpha among ProRes codecs, and their alpha is lossless ([Apple ProRes white paper](https://www.apple.com/final-cut-pro/docs/Apple_ProRes.pdf)). H.264 and HEVC from ffmpeg drop it silently. A transparent piece for an editor or for FrameCut is ProRes 4444 with straight alpha:

```bash
ffmpeg -framerate 30 -i frames/%05d.png \
  -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -alpha_bits 16 piece.mov
ffprobe -v error -show_entries stream=profile,pix_fmt -of csv=p=0 piece.mov
```

The check must print `4444` and a `yuva` pixel format; `yuv` means the alpha is gone. Remotion needs `--codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le` ([Remotion](https://www.remotion.dev/docs/transparent-videos)). Keep straight and premultiplied apart: a premultiplied piece placed as straight shows dark fringes; ffmpeg's `unpremultiply` and `premultiply` convert between them.

## 5. Text and graphics over moving pictures

- **Contrast.** Aim for at least 4.5:1 between text and what is behind it, 3:1 for large text, measured on the worst frame of the hold, not the first ([WCAG 2.2, 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Footage changes under the text; check the brightest and the busiest frame.
- **How to get contrast without a box.** In order of preference *(inferred)*: place text over a calm area the shot already has; a soft gradient scrim from the frame edge (black at 35 to 60 %); a local blur of the plate behind the text (layer 2); a soft shadow. A solid box is the last resort and reads as a template.
- **Safe areas.** For 16:9: essential action inside the central 93 %, text and graphics inside the central 90 % (at 1920 x 1080 that is 96 px from the sides and 54 px from top and bottom) ([EBU R95](https://tech.ebu.ch/docs/r/r095-2016_2.pdf)). For 9:16 platform zones use FrameCut's table (FrameCut: `skills/framecut/references/platform-caption-specs.md`). The project's own 9:16 rule (top 10 %, bottom 20 %) still applies on top of it.
- **Text behind the subject.** Layer 3 plus the holdout in layer 4. The matte must be clean on the frames where the text overlaps the head; check those at 2x.
- **Lower thirds on a talking head** sit on the side the person faces away from, never across the mouth or chin, and leave room for captions under them *(inferred)*.
- **Reading time** follows the [typography workshop](workshop/typography.md); footage behind text needs the longer end of the hold, because the eye also reads the picture.

## 6. Stabilise or track

Decide per element:

- **Screen-locked** (captions, lower thirds, logos): no tracking. Most graphics belong here.
- **World-locked** (a label on a product, a line drawn on a building): needs a track. If the camera is nearly still, stabilise the plate first and lock the graphic to the stabilised frame; that is simpler and steadier than tracking *(inferred)*.

Stabilising with vid.stab in ffmpeg (two passes). `shakiness` runs 1 to 10 (default 5), `accuracy` 1 to 15 (default 15); `smoothing=10` uses 21 frames (10 back, 10 forward); `optzoom=1` zooms just enough to hide the borders, and the docs recommend `unsharp` after it ([ffmpeg filters](https://ffmpeg.org/ffmpeg-filters.html#vidstabdetect)):

```bash
ffmpeg -i shaky.mp4 -vf vidstabdetect=shakiness=5:accuracy=15:result=t.trf -f null -
ffmpeg -i shaky.mp4 -vf "vidstabtransform=input=t.trf:smoothing=15:optzoom=1,\
unsharp=5:5:0.8:3:3:0.4" -c:a copy stable.mp4
```

For a real 2D track (a point or a plane through a moving shot), Blender's motion tracker runs locally without an account; export the track as keyframes and drive the graphic's position, scale and rotation from them. Add motion blur to a tracked graphic that matches the plate's blur ([section 8](#8-making-generated-and-real-look-like-one-shot)), or it looks pasted on. Never track a graphic to the background of an AI clip that swims ([section 9](#9-ai-video-artifacts-and-how-to-hide-them)).

## 7. 2.5D parallax from a still

A generated still becomes a camera move when it is split into depth planes that move at different speeds.

1. **Depth map.** Depth Anything V2 Small is Apache-2.0; its Base, Large and Giant models are CC-BY-NC-4.0, so they are not used for client work ([repo](https://github.com/DepthAnything/Depth-Anything-V2)). The same split holds for Video Depth Anything ([repo](https://github.com/DepthAnything/Video-Depth-Anything)). Install only after the user's yes.
2. **Planes.** Three to five planes (foreground, subject, middle, sky) *(inferred)*. Cut them from the depth map with thresholds, tested here:

   ```bash
   ffmpeg -i depth.png -vf "lutyuv=y='if(gte(val,170),255,0)',format=gray,boxblur=2" near_mask.png
   ffmpeg -i image.png -i near_mask.png -filter_complex "[0:v]format=rgba[c];[c][1:v]alphamerge" near.png
   ```

3. **Fill the holes.** Moving a near plane reveals what was behind it. Ask the generator for an edit of the same image "with the subject removed, same framing", or extend edges by blurring; a visible hole is the most common giveaway.
4. **Move small.** A push-in and a slight lateral drift, then a hold; near planes travel about 2 to 3 times as far as far planes, and the whole move stays within a few percent of the frame width over 3 to 5 s *(inferred)*. No zoom-out during the move (house motion rule).
5. **Build** as planes in canvas or three.js, or in Blender with the depth map as displacement on a subdivided plane.

## 8. Making generated and real look like one shot

Work in this order, each step checked on frames before the next:

1. **Black and white points.** Match the darkest and brightest values of the inserted element to the plate.
2. **White balance and saturation.** Neutral greys of both should line up; generated assets are usually more saturated than footage.
3. **Light direction.** The key light on the insert comes from the same side as in the plate; add a contact shadow where it touches a surface.
4. **Edges.** A little light wrap: the plate's light spilling over the insert's edge, which hides the hard edge of a cut-out ([Foundry Nuke, LightWrap](https://learn.foundry.com/nuke/content/reference_guide/draw_nodes/lightwrap.html)). Keep it subtle; a milky halo is worse than none.
5. **Softness.** Generated stills are often sharper than the footage; blur the insert slightly to the plate's sharpness.
6. **Motion blur.** Footage shot at a 180-degree shutter exposes each frame for half the frame time (1/48 s at 24 fps, 1/50 s at 25 fps), so a moving element blurs over half of its frame-to-frame travel ([RED](https://www.red.com/red-101/shutter-angle-tutorial)). Give moving graphics the same blur.
7. **Grain last.** One grain over the whole frame after the grade, at the values of the [look workshop](workshop/look.md), so inserts and footage share one texture.
8. **One grade over everything** at the end, never a separate look per layer.

## 9. AI video: artifacts and how to hide them

Generator specifications change fast; check the current documentation. On 2026-11-18: Veo 3.1 outputs 24 fps, 720p by default, 1080p and 4K only at 8 s, clips of 4, 6 or 8 s, with generated audio always on ([Google](https://ai.google.dev/gemini-api/docs/veo)); Runway Gen-4 outputs 24 fps, 1280 x 720 at 16:9, clips of 5 or 10 s ([Runway](https://help.runwayml.com/hc/en-us/articles/37327109429011-Creating-with-Gen-4-Video)). A 24 fps clip in a 30 fps edit therefore needs a decision (FrameCut's conform rules).

| Artifact | What it looks like | Fix in compositing |
| --- | --- | --- |
| Flicker | Brightness pulses frame to frame | `deflicker=size=5:mode=pm` (window 2 to 129 frames, default 5) ([ffmpeg](https://ffmpeg.org/ffmpeg-filters.html#deflicker)); then grain to unify |
| Identity drift | A face or product slowly becomes another | Use only the clean range before the drift; cut or cover the drift point with a graphic wipe or a cutaway |
| Morphing | An object merges into another for a few frames | Same: cut around it; a short clip with less motion drifts less ([8frame](https://www.8frame.co/blog/ai-video-artifacts-explained)) |
| Background swim | A static background warps | Keep graphics screen-locked; a soft blur or vignette on the background hides it |
| Garbled text, logos, hands | Letters change, fingers merge | Never use generated text: mask it and set real type; frame around hands |
| Plastic skin | Waxy faces | Grain and a slightly lower clarity after the grade; do not sharpen |

Start an image-to-video clip from an approved still, so the clip begins from the design and not from the model's guess ([8frame](https://www.8frame.co/blog/ai-video-artifacts-explained)). Generator audio is a draft: replace or check it (section 10).

## 10. Sound and sync

The sound edit, ducking and the mix belong to FrameCut (FrameCut: `skills/framecut/references/mixed-source-footage.md#sound-and-sync`) and, for designed sound, to [motion sound design](motion-sound-design.md). For motion pieces on footage: put picture accents 1 to 2 frames before the sound peak ([layered work](layered-work.md)), keep speech within the lip-sync limits FrameCut's page gives, and measure loudness on the encoded file.

## 11. Export and frame QC

1. **Handoff format.** A transparent piece: ProRes 4444 straight alpha in `.mov`; an opaque piece: H.264 in `.mp4` (the [FrameCut handoff contract](engine-contract.md#from-frames-to-a-framecut-motion-request)).
2. **File checks.** `ffprobe` for size, frame rate, frame count (`-count_frames`), pixel format and colour tags; the alpha check from section 4.
3. **Frame checks.** Frames every 0.5 s over the whole timeline; for every insert, its first frame, last frame and the frame where it is largest, cropped at 2x along the matte edge (fringe, halo, backing plate, chatter); text on the brightest and busiest frame of each hold; the AI clip's cut points for drift.
4. **Report** what was checked and what was not, with `NOT VERIFIED` where nobody watched the file.

## 12. Where it happens in layered work

| Work layer ([layered work](layered-work.md)) | Mixed-media work in it |
| --- | --- |
| 1 Plan and structure | Choose the material per beat, the clean ranges of AI clips, which graphics are screen- or world-locked; grey blocks over the conformed plate |
| 2 Typography and content | Copy, text placement on calm areas, contrast measured on the worst frame |
| 3 Base motion | Graphic motion against the plate's motion, tracks and stabilisation, parallax planes moving without effects |
| 4 Depth and polish | Holdout (text behind the subject), contact shadows, light wrap, motion blur matched to the plate |
| 5 Colour and look | Match black, white and balance of inserts, then one grade and grain over everything |
| 6 Sound | Accents on the frames, ducking under speech (FrameCut), loudness on the encoded preview |
| 7 Detail control and file QC | 2x edge crops, AI drift points, alpha and colour tags, frame count |

In FrameCut the same work falls into its editing layers; its page maps them.

## 13. Three concepts with a named wow

1. **"Behind the speaker."** A talking-head clip; the headline appears behind the person's head, the person leans into it, and the words wrap around the silhouette. *Wow:* the flat video suddenly has depth, and the type seems to live in the room. Build: person matte (MediaPipe or SAM 2), layers 3 and 4 of the stack, light wrap, the text's shadow falling on the wall behind.
2. **"The still breathes."** One generated product still becomes a slow push-in with three parallax planes, drifting particles between the planes and a label that sticks to the product. *Wow:* a single image turns into a camera move that looks filmed. Build: Depth Anything V2 Small, plane cut, clean plate from a generator edit, canvas or three.js.
3. **"Real to dream."** The client's real shot of a product match-cuts, through a graphic wipe that follows the product's edge, into a generated clip of the same product in an impossible place. *Wow:* the world changes but the product never jumps. Build: stabilised real plate, the AI clip started from a still of the real frame, the wipe placed exactly where the AI clip would start to drift, one grade and grain over both.

## 14. Common mistakes

- Placing graphics before conforming: overlays drift on variable-frame-rate phone clips.
- Treating HDR phone footage as SDR: washed-out, grey picture; tone-map first.
- Exporting a transparent piece as H.264 or ProRes 422: the alpha is silently lost.
- Mixing straight and premultiplied alpha: dark or bright fringes.
- A hard binary matte on hair: a cut-out look; use a soft matte and check at 2x.
- Using rembg's default model on client work: it is non-commercial.
- Text contrast checked on one frame only: unreadable on the bright frame.
- Tracking graphics to a swimming AI background: the graphic swims too.
- Keeping a generated clip past its drift point because the start looked good.
- Inserts sharper, more saturated and grain-free compared with the footage: they read as pasted.
- A separate look per layer instead of one grade at the end.
- Moving parallax planes so far that the holes behind them show.
- Using generated text or logos in the final frame.

## 15. Sources

Checked 2026-11-18: [ffmpeg filters](https://ffmpeg.org/ffmpeg-filters.html) (chromakey, despill, vidstab, deflicker, tonemap, zscale), [Apple ProRes white paper](https://www.apple.com/final-cut-pro/docs/Apple_ProRes.pdf), [Remotion transparent videos](https://www.remotion.dev/docs/transparent-videos), [WCAG 2.2 contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [EBU R95 safe areas](https://tech.ebu.ch/docs/r/r095-2016_2.pdf), [RED shutter angle](https://www.red.com/red-101/shutter-angle-tutorial), [Foundry LightWrap](https://learn.foundry.com/nuke/content/reference_guide/draw_nodes/lightwrap.html), [MediaPipe Image Segmenter](https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter), [SAM 2](https://github.com/facebookresearch/sam2), [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2), [BiRefNet](https://github.com/ZhengPeng7/BiRefNet), [rembg](https://github.com/danielgatis/rembg), [Veo in the Gemini API](https://ai.google.dev/gemini-api/docs/veo), [Runway Gen-4](https://help.runwayml.com/hc/en-us/articles/37327109429011-Creating-with-Gen-4-Video), [8frame on AI video artifacts](https://www.8frame.co/blog/ai-video-artifacts-explained). The commands in sections 3, 4, 6 and 7 ran on synthetic clips with ffmpeg 6.1 in the Claude cloud sandbox on 2026-11-18; they were not run on real client footage (`NOT_RUN`).
