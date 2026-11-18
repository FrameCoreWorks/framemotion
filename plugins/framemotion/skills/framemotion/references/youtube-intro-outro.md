# YouTube intros, outros and channel packaging

Read this when a creator asks for a YouTube intro, a cold-open title, a logo sting or bumper, a stinger transition, a lower third for a channel, an outro or end-screen background, or a Shorts opener and loop ending. It holds the platform facts with their sources, ready beat-by-beat recipes, five example concepts and the way these pieces enter [layered work](layered-work.md). Where the piece sits in the finished edit (cold open, chapter marks, the last 20 seconds) is FrameCut's side: FrameCut `skills/framecut/references/youtube-intro-outro-edit.md`.

The numbers below were checked on 2026-11-18. Each row says whether it is an official YouTube rule, a measurement by a third party, a broadcast standard or our inference. Platform interfaces change: re-check a row that decides a deliverable when it is more than six months old, and say which date you relied on.

## What the evidence says

### Official YouTube rules

| Fact | Number | Source |
| --- | --- | --- |
| End screen window | Last 5 to 20 s of the video | [YouTube Help: Add end screens](https://support.google.com/youtube/answer/6388789) |
| Minimum video length for an end screen | 25 s | same |
| End-screen elements | Up to 4 on a 16:9 video; other aspect ratios may allow fewer | same |
| During the end screen | Card teasers and the channel watermark are hidden; viewers can hide the end screen | same |
| Where end screens never show | Made-for-kids videos, YouTube Music app, mobile web, 360 video | same |
| Info cards | Up to 5 per video, each at its own start time | [YouTube Help: Add info cards](https://support.google.com/youtube/answer/6140493) |
| Channel watermark "End of video" | Shows for the last 15 s; image at least 150 x 150 px, square, under 1 MB | [YouTube Help: Manage your channel branding](https://support.google.com/youtube/answer/10456525) |
| Retention "Intro" card | "A typical intro is about 30 seconds long"; videos with 50% or more of the audience still watching after 30 s are listed as above typical | [YouTube Help: Content tab analytics tips](https://support.google.com/youtube/answer/12942217) |
| Key moments report | Needs a video of at least 60 s with at least 100 views | [YouTube Help: Key moments for audience retention](https://support.google.com/youtube/answer/9314415) |
| Chapters | First timestamp 00:00, at least three in ascending order, each at least 10 s | [YouTube Help: Video chapters](https://support.google.com/youtube/answer/9884579) |
| Shorts | Square or vertical, up to 3 min | [YouTube Help: Get started creating Shorts](https://support.google.com/youtube/answer/10059070) |
| Shorts metric | "How many chose to view" = share of feed impressions that were watched instead of swiped away; engaged views exclude loops | [YouTube Help: Content tab analytics tips (Shorts)](https://support.google.com/youtube/answer/12942217) |
| Shorts to long form | A Short gets a "Related video" link, not an end screen; YouTube advises a verbal and visual call to action in the final 5 s | [YouTube Blog, 2026-07-14](https://blog.youtube/creator-and-artist-stories/youtube-related-videos-traffic-guide) |
| 16:9 sizes | 1920 x 1080 (1080p), 3840 x 2160 (4K); no baked-in black bars | [YouTube Help: Resolution and aspect ratios](https://support.google.com/youtube/answer/6375112) |
| Upload encoding | H.264 High, closed GOP of half the frame rate, frame rate as recorded, AAC-LC or Opus at 48 kHz, stereo 384 kbps | [YouTube Help: Recommended upload encoding](https://support.google.com/youtube/answer/1722171) |

What YouTube itself says about openings, in short: grab attention at once, make clear what the video is, tease the rest, and show channel branding later; "a flashy intro may look cool, but it's not the star of the video" ([YouTube Creator Playbook, first 15 seconds](https://blog.youtube/news-and-events/this-is-first-of-series-of-posts)). A later YouTube post adds three working openings: a question, branding that is integrated into the content with high energy, and saying within the first five seconds what the viewer will see ([Four tips to hook your viewers](https://blog.youtube/creator-and-artist-stories/four-tips-to-hook-your-viewers-on)). A 2025 post tells creators to look for steep retention drops during slow intros ([4 metrics](https://blog.youtube/creator-and-artist-stories/master-these-4-metrics/)).

### Measured by third parties (not published by YouTube)

| Fact | Number | Source |
| --- | --- | --- |
| Playback loudness | Videos louder than about -14 LUFS integrated are turned down to it; quieter ones are not turned up. Read from "Stats for nerds" (content loudness vs target) | [Umbrella Creators, 2026-10-20](https://umbrellacreators.com/blog/how-to-normalize-audio-for-youtube), [tuberlife, 2026](https://tuberlife.com/blog/youtube-and-reference-loudness-level), [QuickVeed, 2026-11-01](https://quickveed.com/blogs/loudness-lufs-for-youtube-and-podcasts) |
| End-screen element sizes on 1920 x 1080 | Video or playlist 620 x 349 to 862 x 485; subscribe, channel and link 296 x 296 (subscribe and channel as circles); no element closer than 44 px to the sides, 141 px to the top, 164 px to the bottom | [Mark Studios, 155 elements measured 2026-10-16](https://www.markstudios.com/tools/youtube-end-screen-template) |
| Organic Shorts interface on 1080 x 1920 | About 309 px covered at the top, 380 px at the bottom, 49 px each side | [Kreatli, measured 2026-10-16](https://kreatli.com/safe-zone-checker/youtube-safe-zone-checker) |
| Google's vertical ad safe zone (the only published diagram) | 288 px top, 672 px bottom, 48 px left, 192 px right on 1080 x 1920 | Google Ads Help 9128498, as read by [Outfeed, 2026-09-27](https://outfeed.ai/blog/youtube-shorts-dimensions/) and [Slice, 2026-10-02](https://tryslicemedia.com/data/social-video-specs-2026/youtube-shorts) |

### Broadcast standard used for 16:9 titles

| Fact | Number | Source |
| --- | --- | --- |
| Action safe | 3.5% from every edge (1853 x 1042 inner box on 1920 x 1080) | [EBU R95](https://tech.ebu.ch/docs/r/r095.pdf), same margins in [ITU-R BT.1848](https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1848-1-201510-I!!PDF-E.pdf) |
| Graphics (title) safe | 5% from every edge: x 96 to 1824, y 54 to 1026 on 1920 x 1080 | same |

YouTube has no title-safe rule; TVs and phones crop little, but the player's controls, progress bar and burned-in captions sit in the bottom tenth, so keep lower thirds and text inside graphics safe and above the bottom 10% (inference from the player layout).

### What we infer (label it as such when you tell a user)

- Most viewers who leave an intro leave in its first seconds, so a branded sequence before any content costs more than the same sequence after the hook (consistent with YouTube's own advice above; no public YouTube number isolates the sting).
- A returning-series audience tolerates a short sting better than new viewers from search or browse; new-viewer and returning-viewer retention can be compared in the key moments report, which is how a creator should test it.
- Viewers leave when an outro announces itself ("that's it for today"); start the end screen while the content is still giving something (a last tip, a teaser of the next video).

## Default lengths

| Piece | Length | Rule |
| --- | --- | --- |
| Hook / cold open (edited footage, FrameCut) | 5 to 15 s before any branding | The payoff or question first; YouTube's "Intro" card judges the first 30 s |
| Title sting after the cold open | 1.5 to 3 s | Channel or episode name readable for at least the reading-clock hold ([motion craft](motion-craft.md#readable-holds)) |
| Logo sting / bumper | 1 to 2 s | For a returning series or between segments; never the first thing a new viewer sees |
| Series title card | 3 to 5 s | Episode number and title; the title follows the reading clock |
| Stinger transition | 0.5 to 1.2 s | The frame that fully covers the picture is the cut point |
| Lower third | 3 to 7 s on screen | Hold from the [title formula](type-title-and-format-recipes.md) |
| End screen background | 15 to 20 s for full use, never under 5 s | The video must last at least 25 s |
| Shorts opener | 0 s of branding | The first frame is the hook; no sting |
| Shorts call to action | the final 5 s | Points at the Related video link |

Sound: a sting is 1 to 3 s, its hit 1 to 2 frames after the picture accent ([layered work](layered-work.md), layer 6), with a tail no longer than the hold. Mix the whole video to about -14 LUFS integrated, true peak at or below -1 dBTP, and measure the encoded file, not the WAV. A sting that is louder than the voice that follows makes viewers turn the volume down: keep its short-term loudness within about 2 LU of the speech (inference; check on the delivered file).

## Recipes, beat by beat

Times are seconds from the start of the piece. "Hold" means the element is fully legible and still (2 to 3% drift allowed, [motion craft](motion-craft.md)). Moves take 0.4 to 0.55 s; the camera pushes in and holds, never pulls back during a move. Build every recipe in the user's brand kit; with no kit, offer two or three looks first.

### 1. Cold open into a title sting (long-form default)

The edit opens on the strongest moment or the question (FrameCut). The sting follows:

| Beat | Time | What happens |
| --- | --- | --- |
| In | 0.00 | Cut on a sound accent; no fade from black |
| Build | 0.00 to 0.45 | Wordmark or episode title assembles (mask reveal, stroke draw or type-on), one lead action |
| Hold | 0.45 to 1.95 | Title still and readable (1.5 s, longer by the reading clock) |
| Exit | 1.95 to 2.40 | Exit into the first content shot: wipe, push-through or match cut on a shape |

Total 2.4 s. The first spoken word of the content starts after the sting's tail, at least 0.2 s after the hit.

### 2. Logo sting / bumper (1 to 2 s)

| Beat | Time | What happens |
| --- | --- | --- |
| Accent | 0.00 to 0.30 | One graphic gesture (a line, a dot, a block) |
| Resolve | 0.30 to 0.70 | Gesture becomes the logo or name |
| Hold | 0.70 to 1.70 | Logo still |
| Out | 1.70 to 2.00 | Hard cut or 6-frame dip |

Use it between segments of a long video, at the top of a returning series after the hook, and as the last frame of an outro.

### 3. Series title card (3 to 5 s)

Episode number lands first (0 to 0.45 s), title lines follow with one stagger (0.08 to 0.12 s per line), hold by the reading clock, exit in 0.4 s. A tutorial series may show the finished result behind the title; that is the "sneak peek" YouTube recommends for how-to videos.

### 4. Stinger transition (0.5 to 1.2 s)

A full-frame graphic covers the picture, the cut happens under it, the graphic clears. Deliver the cut-point frame number with the file (for example "full cover at frame 15 of 30"). Use it for chapter changes, not after every cut.

### 5. Channel lower third

Take the timing and sizes from the [name lower third](type-title-and-format-recipes.md#titles-and-lower-thirds-varg-title-design-9) recipe. YouTube specifics: inside graphics safe, above the bottom 10%, on the side away from the speaker's face; with burned-in captions, the lower third sits above them, never on the same line.

### 6. Outro with end screen (16:9)

| Beat | Time from outro start | What happens |
| --- | --- | --- |
| Bridge | 0 to 3 | Last spoken line names the next video and why (FrameCut edits it) |
| Layout in | 3 to 4 | The end-screen background builds: empty slots for the elements YouTube will draw |
| Slots hold | 4 to 20 | Background alive but quiet (slow drift, one secondary loop); nothing important under a slot |
| Out | last 0.5 | Logo bumper or hard end |

Slot layouts on 1920 x 1080 (inside the measured margins, not a YouTube template): either one large video slot 862 x 485 at x 900 to 1762, y 300 to 785, or two video slots 620 x 349 stacked at x 1150 to 1770, y 160 to 509 and y 545 to 894; in both, a subscribe circle 296 x 296 at x 200 to 496, y 600 to 896. Keep the speaker or b-roll in the left two thirds if they stay on screen. Stagger the real elements in YouTube Studio (next video first, subscribe 1 to 2 s later); draw no fake buttons, because YouTube may move or resize its elements and a viewer can hide them.

### 7. Shorts opener and loop ending (9:16, also 1:1)

No intro. Frame 0 shows the subject and the promise (text on the first frame, readable in under a second). Keep text inside the measured organic interface: below 309 px from the top, above 380 px from the bottom, 49 px from the left and 192 px from the right (the stricter right edge from Google's ad diagram covers the button column). This is stricter at the top than FrameMotion's general 9:16 safe area (10% top), so use it for YouTube Shorts. End on a frame that cuts cleanly back to frame 0 (same composition or the question again), and put the call to the related video in the final 5 s. A square 1:1 version keeps the same rules with the text block centred and 6% margins (inference).

## Patterns by genre (inference from practice, not YouTube data)

| Genre | Opening | Branding | Outro |
| --- | --- | --- | --- |
| Education / explainer | A question or a surprising number on screen in the first 5 s | 1.5 to 2.5 s title sting after the question | Recap of one idea, then the next lesson in a playlist slot |
| Tutorial / how-to | The finished result first (sneak peek) | Series card with episode number | "Next step" video slot, chapters in the description |
| Gaming | The best play or fail, cut hard | 1 s bumper, high energy, synced to a hit | Best-for-viewer slot plus the series playlist |
| Vlog / lifestyle | A moment from later in the day, then rewind | Lower third with place and date rather than a sting | Teaser of the next vlog under the slots |
| Business / brand | The outcome or claim with proof | Logo sting at the end, not the start | Link slot (Partner Program) and one video |
| Tech / reviews | The verdict teased or the product in hand | 1.5 to 2 s sting, product-shaped graphic | Comparison video slot plus subscribe |

## Common mistakes

- A 5 to 10 s logo animation before any content.
- Intro music louder than the voice that follows, or a sting that masks the first word.
- An end screen on a video under 25 s, or an outro shorter than 5 s, so nothing can be placed.
- Text, faces or the call to action under where YouTube will draw end-screen elements.
- Baked-in subscribe buttons or fake video thumbnails that do not match YouTube's real elements.
- Shorts that start with a title card or a black frame, or put text under the like and comment column.
- The same 10 s outro on every video, which teaches returning viewers to leave at its first frame.
- A lower third in the bottom 10%, where the progress bar and captions sit.

## Example concepts

Each concept names its "wow", its engine and its beats. Colours and fonts come from the user's brand kit; the looks below are examples only. Offer two or three of them, never one.

### Intro A: "One line becomes the name" (Hairline kit, 2.4 s)

Wow: the single bright stroke that draws the channel's object (a camera, a pan, a keyboard) peels off its last edge and writes the channel name. 0 to 0.45 s the object assembles in hairlines; 0.45 to 0.9 s the bright stroke leaves the object; 0.9 to 1.3 s it writes the name; 1.3 to 2.4 s hold, object dims to 40%. Fits education, cooking, tutorials. Build with the [Hairline kit](../assets/hairline/README.md).

### Intro B: "The graph signs its name" (Reels engine line graph, 3 s)

Wow: a number grows as a self-drawing line graph and the line, at its peak, bends into the underline of the wordmark. 0 to 1.2 s count-up with the line; 1.2 to 1.6 s line snaps under the title; 1.6 to 3.0 s hold. Fits business, finance, tech results. Build with the [Reels engine](../assets/reels-engine/README.md); the number must be real and supplied by the user.

### Intro C: "The sting you can see" (Iso Glow kit, 2 s, sound-driven)

Wow: an isometric device in hairlines lights up part by part on each hit of the sting, so the sound and the picture are one gesture. 0 to 0.2 s dark line art; 0.2 to 1.0 s three hits, three glows; 1.0 to 2.0 s full glow with the name. Fits gaming and tech. Build with the [Iso Glow kit](../assets/iso-glow/README.md) driven by [`audio_envelope.py`](../assets/motion-sync/audio_envelope.py).

### Outro A: "The shelf of next videos" (Hairline kit, 20 s)

Wow: the end-screen slots are drawn as frames on a hairline shelf, so YouTube's real elements look placed onto drawn furniture; the bright stroke points at the next-video frame while the host names it. 0 to 1 s shelf draws in; 1 to 20 s quiet hold with a slow drift; the subscribe circle is a drawn ring. Uses the slot layout from recipe 6.

### Outro B: "Recap that folds into a playlist" (kinetic type, 18 s)

Wow: the video's three takeaways appear as one-line cards (each held by the reading clock), then fold into a stack in the left third that sits beside the playlist slot. 0 to 7 s three cards; 7 to 8 s fold; 8 to 18 s hold with the stack breathing slightly. Build from the [type, title and format recipes](type-title-and-format-recipes.md).

## Entering layered work

Intro and outro pieces follow [layered work](layered-work.md) like any film, with these additions per layer:

1. **Plan and structure.** Pick the piece and length from the tables above; ask where it goes (after a hook, between segments, end) and whether the user has a brand kit. Draw overlays on the grey-block frames: graphics safe and the bottom 10% for 16:9, the end-screen slot boxes for an outro, the Shorts interface box for 9:16. Present two or three concepts with a named wow before building.
2. **Typography and content.** Lock channel name, episode title, call-to-action wording and the next video's title. Check every hold against the reading clock; a channel name must hold at least 1.5 s.
3. **Base motion.** One lead action per beat, moves of 0.4 to 0.55 s, push in and hold. For a stinger, mark the full-cover frame.
4. **Depth and polish.** Nothing may move inside an end-screen slot box.
5. **Colour and look.** Brand kit; test the sting against the first shot that follows it, not on a black slate.
6. **Sound.** Sting 1 to 3 s, hit 1 to 2 frames after the picture accent, about -14 LUFS for the whole video with true peak at or below -1 dBTP, measured on the encoded file; the sting tail ends before the first word.
7. **Detail control and file QC.** Frames every 0.5 s with the overlays from layer 1; first frame is not black (Shorts); an outro lasts at least 5 s inside a video of at least 25 s; deliverables named with their cut-point frames.

Deliverables to offer: the 16:9 master, a 9:16 variant when the channel posts Shorts, each with and without sound, a transparent overlay version only when the chosen engine renders alpha (otherwise say so and deliver on the plain background), and a one-line placement note for the editor (FrameCut or the user's editor).
