# MG styles engine

Eleven motion-design style films from [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15/tree/8fab7eb49cc60590c518d1a932dfff753697fce7) (commit `8fab7eb`, MIT, Copyright (c) 2026 Vincentwei1021), rendered by FrameMotion's engine kit. Every film is a web page that draws any moment with `window.renderAt(t)`, the same contract FrameMotion's own engines follow, so a frame is a function of its time.

| Engine | Film | Look |
| --- | --- | --- |
| `mg-cel-boil` | `05-cel-boil` | Frame-by-frame cel animation on paper, drawn on twos, lines that boil (24 fps) |
| `mg-liquid` | `07-liquid` | A drop that splashes, pools and flows into a word |
| `mg-morph` | `08-morph` | One shape that turns into icon after icon and lands as the wordmark |
| `mg-synthwave` | `10-synthwave` | 1980s synthwave: neon grid road, chrome title, glowing script, VHS wear |
| `mg-aurora-glass` | `12-aurora-glass` | Aurora gradient light behind frosted glass cards |

Six more films are a second way of animating a look FrameMotion already had (registry field `method_of`; the menu lists them under that engine, never as engines of their own, by the owner's rule of 2026-11-20):

| Way | Film | Second way of |
| --- | --- | --- |
| `mg-flat-vector` | `01-flat-vector` | `launch-shapes`: one bouncing dot builds a flat-colour world |
| `mg-line-art` | `02-line-art` | `lemo-one-line`: a fine ink line draws the scenes and the title |
| `mg-isometric` | `03-isometric` | `lemo-iso-infographic`: a 2.5D city builds block by block |
| `mg-bauhaus` | `09-bauhaus` | `lemo-swiss-motion`: Bauhaus shapes in primary colours on a beat grid |
| `mg-pixel` | `20-pixel` | `launch-pixel`: a pixel hero runs a short level to the title |
| `mg-hud` | `22-hud` | `lemo-hologram-hud`: cyberpunk HUD with a 3D globe and target lock |

```bash
node ../engines/kit/render-engine.mjs --engine mg-synthwave --frames 0,150,290 --out frames
```

## What is here

- `upstream/demos/<film>/`: the eleven films, byte-identical (hashes in `integrations/mg-styles-15/source-manifest.json`). Their `audio.py` and `tools/` scripts are kept as reference; FrameMotion does not run them (they need upstream's sample library).
- `upstream/prompts/`: the prompt and style notes of all 15 styles (Chinese and English). The `Signature features` section of each is the style's checklist; the 3D render style waits for the Blender pack (its picture is rendered in Blender).
- `upstream/assets/textures/paper/Paper001_4K_color.jpg`: ambientCG Paper001 (CC0), the paper of the morph and Bauhaus films.
- `fonts/`: the open fonts the films name, from google/fonts (OFL 1.1, texts in `fonts/licences/`). CJK faces are subset to the films' characters plus Latin and Polish letters; Fraunces and Outfit are static instances. Fusion Pixel 12 comes from its own release (TakWolf/fusion-pixel-font 2026.11.10, OFL, subset). Five brand faces that are not open fonts (HarmonyOS Sans SC, Alimama ShuHeiTi, Douyin Sans, Alibaba PuHuiTi, Resource Han Rounded) are drawn with Noto Sans SC instead, so those lines look a little different from upstream's films.
- `upstream/demos/22-hud/assets/land-50m.json`: world map outlines the HUD film reads (upstream records Natural Earth map data, public domain).
- `textures/grain_fine_2048.png`: FrameMotion's own grain plate (`tools/make_grain.py`), in place of upstream's, whose source is not recorded.

## How it renders

The `mgstyles` builder in `../engines/kit/builders.mjs` copies one film into the folder layout its absolute paths expect, points `/demos/` and `/assets/` at the build folder, writes a `fonts.css` for the fonts above and sets `renderFrame = renderAt` once the page reports `__ready`. three.js, simplex-noise, opentype.js, d3 and topojson-client come from the engines folder (`npm ci`), pinned there; the films were made with three.js 0.186.1 and FrameMotion has 0.187.0.

Checked 2026-11-20 in software WebGL (no GPU): all eleven films render with no outside requests, and a frame is the same in any frame order (the order sweep in the 2026-11-20 handover). Liquid and isometric are slow without a graphics card (70 to 110 s for the first frame; registry `gpu_recommended`).

FrameMotion's fix (`MG_FIXES` in the builder, applied to the built copy; the bundled file is unchanged): in 10-synthwave the car mask target was cleared without a render, so its multisampled target kept the previous frame's mask, and the title flash never reached exactly zero. A frame drawn after certain others differed in 6 pixels by one level. The builder renders an empty scene after the clear and sets a flash under 0.001 to zero; found by the 2026-11-20 review, fixed with 0 differences in any order. In 12-aurora-glass each card's 2D canvas kept drawing state from the last frame that drew it (2,016 pixels by up to 2 levels at frame 120 after frame 60, found by FrameMotion's order sweep); the builder resets the card canvas before each draw, 0 differences after.

## Formats

Every film is laid out for 16:9 (1920×1080). There is no vertical version: do not offer these films for a 9:16 reel.

## Your own words

These are the author's showcase films. The `replace` setting swaps a sample text, exactly as written in the film's code, for yours; a sample text that is not found stops the build. Polish letters work (the open fonts carry Latin Extended-A). The registry already replaces the Chinese lines it can with English defaults (`build.replace`); yours win over those.

| Film | Sample texts you can replace | Notes |
| --- | --- | --- |
| `mg-synthwave` | `NEON DRIVE` (default title), `Midnight` (script), `SUMMER 1986  ·  IN HI-FI STEREO` | checked: `{"replace": {"NEON DRIVE": "FRAMECORE"}}` |
| `mg-liquid` | `drop` (the wordmark), `万物始于一滴` (tagline; default English) | the wordmark must keep four letters (one per bead); checked with `kawa` |
| `mg-hud` | `TARGET`, `LOCKED`, `目标锁定` (default `LOCK ON`) | checked |
| `mg-cel-boil` | `一帧一帧`, `亲手点亮` (tagline), `星火牌`, `安 全 火 柴` (matchbox) | `HAND MADE` and the big `手作` are lettered stroke by stroke: not replaceable |
| `mg-line-art` | `始于一线` (tagline; default `one line`) | |
| `mg-isometric` | `让城市自己生长` (tagline; default `A city grows`), `CITY OS · 144 TILES · ONLINE` | |
| `mg-pixel` | `欢迎来到像素世界！`, `神秘宝箱 像素冒险` (dialogue; English defaults) | the `PIXEL QUEST` logo is built letter by letter: not replaceable |
| `mg-flat-vector`, `mg-morph`, `mg-bauhaus`, `mg-aurora-glass` | none | letters are choreographed one by one; new words need an edited copy of the film (`build.folder`) |

## Left out

Photo-based films (06 collage, 18 variety captions, 19 sticker explainer): upstream does not record where their photos come from. They return when they run on the user's own photos. Also left out: the rendered videos, the showcase site, upstream's Puppeteer renderer and its 56 MB instrument library (CC0); the films render silent here and get their sound from FrameMotion's sound workflow.
