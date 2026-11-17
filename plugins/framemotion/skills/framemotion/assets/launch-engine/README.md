# Launch engine

Short launch and social films drawn on one canvas, in twelve styles, rendered frame by frame by FrameMotion's shared renderer. The engine is [Kimeur/motion-launch-videos](https://github.com/Kimeur/motion-launch-videos) at `5092579bc9aaeb0e3547ded0980a93404d2dc906` (MIT, Copyright (c) 2026 Marouane Gazouzi; [LICENSE](LICENSE)), bundled unchanged. It is one of FrameMotion's two launch-film families. The other is the [kaventro templates](../kaventro-engine/README.md), and the chooser below picks between them.

Every film is one HTML page. A `FILM` config holds the copy, palette, beats and formats. It sits on one shared core: closed-form springs on a 120 BPM grid, real motion blur, loops checked at the seam, any aspect ratio laid out rather than cropped, and fonts embedded so nothing loads at runtime. On top of the core, each style has its own engine. `seek(t)` draws any moment from `t` alone, which is the same contract FrameMotion's engines keep.

## Pick a launch film

| The film needs | Registry id | Family |
| --- | --- | --- |
| A launch bumper or identity sting in big type | `launch-type`, `launch-type-pl` (Polish copy, 9:16) | launch |
| Flat icons, draw-ons, a logo that draws itself, a feature loop | `launch-shapes` | launch |
| A mascot that says hi and shows the name | `launch-cartoon` | launch |
| 3D type or a 3D logo with a moving camera | `launch-3d` | launch |
| Numbers from a launch post: counters, bars, lines, donuts | `launch-charts` | launch |
| A retro 8-bit teaser | `launch-pixel` | launch |
| A name that forms from a swarm | `launch-particles` | launch |
| An app flow on a drawn device with callouts, square or vertical | `launch-ui`, `launch-ui-vertical` | launch |
| A product reel from the user's own photos | `launch-photo` | launch |
| A lower third or end card for an editor, with alpha | `launch-overlays` | launch |
| A network on a globe, routes and counting cards | `launch-globe` | launch |
| A 9:16 second-person story short that ends on a choice | `launch-story` (its demo is a crime story to replace with the user's own; its pacing follows a voice that is not bundled, so it is long and silent until the voice is added) | launch |
| The user's real screenshots or screen recording inside an iPhone or a laptop | `kaventro-mobile`, `kaventro-desktop` | kaventro |
| Hook, product, panels and an end card built in HTML and CSS | `kaventro-story` | kaventro |
| Titles over footage built in HTML and CSS | `kaventro-overlay`, `kaventro-blank` | kaventro |

Choose the launch family for a designed short loop (8 to 15 s) with motion blur, a checked loop and several formats from one film. Choose kaventro when the picture is the user's own UI capture, or when the film should be edited as HTML and CSS. Both families render through the same renderer, so one reel can use both, scene by scene.

## Make a film

1. **Start from a style.** Copy `styles/<style>/templates/` (its `film.html`, plus `assets/` for the photo style) to a folder in the workspace. Read `styles/<style>/method.md` and the style's `reference/` for its rules. The shared rules are in `shared/reference/`: brief, springs, loops, fonts, audio and video types.
2. **Edit the `FILM` config** at the top of `film.html`. It holds the title, copy (at most four words a beat, every claim traced to the product's own pages), palette, beats and, for the photo style, the user's images as `__ASSET:assets/<file>__`. Keep the engine code below the config unchanged.
3. **Register** the folder in `engines/engines.json`: `"build": {"tool": "launch", "style": "<style>", "film": "<folder, from the engines folder>"}`. Add `"format": "9:16"` (or `16:9`, `4:5`, `1:1`) for another aspect ratio, together with the matching `size`. Also set `"adapter": "renderFrameAt"`, `"capture": "#c"`, `"duration": "page"`, `"critique": "critique"` and the `fps` from `FILM`. A wipe that fills the frame with one colour makes a flat frame on purpose: list its frame numbers in `flat_frames` (the render names them when it stops on one).
4. **Render** from the `engines` folder. Make a contact sheet first:

   ```bash
   node kit/render-engine.mjs --engine launch-ui --frames 0,150,300,450 --out frames
   node kit/render-engine.mjs --engine launch-ui --frames all --out frames
   ```

   Every render first runs the film's own check (`critique`): letter gaps, margins, contrast, the palette and the loop. A FAIL stops the command (exit 5) with the engine's own advice, for example pairs to open up two letters; fix the film, or pass `--allow-critique` for a draft only.

   Then encode with sound as the [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound) says.

The builder (`engines/kit/builders.mjs`, tool `launch`) copies the film into a temporary folder and takes every font the page names from the engines folder's `@fontsource` packages (installed by `npm ci` there, never bundled), each with its OFL text. Then it runs the engine's own `shared/scripts/build.mjs`. When the copy has letters beyond basic Latin (ą, ę, ł, ś, ż …), each face also gets its Latin Extended subset. The page opens in capture mode, and `renderFrameAt(t)` draws frame `round(t × fps)` through the film's own `renderFrame(n)`, with its motion blur (the film's own functions stay untouched, so its check sees the same frames).

Upstream's own tools are kept unchanged for reference: `shared/scripts/fonts.mjs`, which fetches fonts from the npm registry, and `render.mjs`, whose checks are doctor, stills, loopcheck, render and verify. In FrameMotion, the engines folder and `render-engine.mjs` replace both. `render.mjs` still works on its own when a project wants its loop and colour checks, and it needs `playwright-core` and ffmpeg.

**Sound.** A launch film's `FILM.audio` describes its music and the cue effects the core synthesises from the film's accents. In FrameMotion, the final mix and loudness follow the sound route (Earshot, or `sound.py`). The story style's `method.md` tells you to run `voice.mjs`, and every `method.md` to run `npm install` and `render.mjs doctor`: in FrameMotion, skip those steps (the engines folder and the sound route replace them). The story style is silent here: its example voice and `voice.mjs` (which runs unpinned `npx` tools) are not bundled, so a story's voice-over is made through the sound route and its word times go into `assets/timing.json`.

**Polish and other accented copy.** Uppercase letters with accents (Ś, Ź, Ż, Ć, Ń) need more room between lines than the English demos leave. FrameMotion's sample `framemotion/type-pl` opens the pairs the check flagged (KA, AŻ, RA) and moves the second line of its last pair down by 40 px for the accent of Ś. Check every accented line on a still. The builder adds only Latin Extended faces: Cyrillic, Greek or Vietnamese copy falls back to a system font, so pick a face and subset that covers it.

**Overlays** are drawn on a transparent canvas, and their first and last frames are empty by design. The PNG frames keep the alpha. Encode them with an alpha codec (ProRes 4444 in a .mov, or VP9 in a .webm for a browser), never to H.264. For FrameCut and other editors use ProRes 4444 only: FrameCut does not read VP9 alpha. Conform the frames to a FrameCut request with [the FrameCut recipe](../../references/engine-contract.md#from-frames-to-a-framecut-motion-request).

**Taste and truth.** The rules come from the engine. Every word on screen is the product's own and traced in a brief. Nothing appears that is not the user's to use: no other company's logo or character. A demo for a fictional product says so on screen. Use one accent and four words a beat.

**Check before delivery.** Look at a contact sheet of the first, middle and last frames in every format you deliver. Check that the loop closes on the first frame, that no word is cut at any edge, and that every word is readable at phone size. In a 9:16 film, keep every word out of the top 10% and the bottom 20% of the frame, where a phone's interface sits. The engine's own check allows more, so look. The upstream `launch-ui-vertical` demo puts its callouts at 9.6% from the top and is a known exception; a client film moves them down. FrameMotion's `type-pl` sample lifts its small print above the bottom 20% and sets it at 40 px.

## What is here

| Path | What it is | State |
| --- | --- | --- |
| `shared/core.js` | The runtime every style shares (springs, loops, motion blur, type layout, critique, the page API) | unchanged |
| `shared/scripts/` | `build.mjs` (one offline page), `fonts.mjs`, `render.mjs`, `cmap.mjs` | unchanged |
| `shared/reference/`, `shared/templates/BRIEF.md` | The shared method: brief, core, springs, loops, fonts, audio, render, video types | unchanged |
| `shared/world/world-data.js` | The globe's map (Natural Earth, public domain) | unchanged |
| `styles/<style>/method.md` | The style's upstream `SKILL.md`, renamed so no host loads it as a skill | unchanged |
| `styles/<style>/reference/`, `scripts/`, `templates/` | The style's own engine and craft docs (with its copies of the shared ones and scripts), its `film.html` demo (a fictional product), `DESIGN.md` and assets | unchanged |
| `README.md` (this file) | These notes | ours |
| `framemotion/type-pl/film.html` | FrameMotion's sample: the kinetic type template with Polish copy, opened letter pairs, one 9:16 baseline moved for accents and its small print lifted and enlarged for phones (registry `launch-type-pl`) | ours, from the MIT template |

Not bundled: the captions style (captioned clips belong to FrameCut), the story's example voice recording and `voice.mjs`, the 109 MB of rendered examples, and the upstream README, CI and repository tools. Each style keeps its own synced copies of the shared docs and scripts, as upstream ships it, so its links work. Every bundled file and its upstream path and SHA-256 are in [`integrations/motion-launch-videos/source-manifest.json`](../../../../integrations/motion-launch-videos/source-manifest.json).

## Credit

motion-launch-videos: MIT, Copyright (c) 2026 Marouane Gazouzi. The fonts are not covered by that licence: they are SIL Open Font License 1.1 faces from Fontsource, installed from npm, and the build embeds each one with its OFL text. The globe's map is Natural Earth (public domain), through world-atlas (ISC) and sane-topojson (MIT). All are named in FrameMotion's `NOTICE`.
