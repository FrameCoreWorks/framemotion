# MG styles engine

Five motion-design style films from [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15/tree/8fab7eb49cc60590c518d1a932dfff753697fce7) (commit `8fab7eb`, MIT, Copyright (c) 2026 Vincentwei1021), rendered by FrameMotion's engine kit. Every film is a web page that draws any moment with `window.renderAt(t)`, the same contract FrameMotion's own engines follow, so a frame is a function of its time.

| Engine | Film | Look |
| --- | --- | --- |
| `mg-cel-boil` | `05-cel-boil` | Frame-by-frame cel animation on paper, drawn on twos, lines that boil (24 fps) |
| `mg-liquid` | `07-liquid` | A drop that splashes, pools and flows into a word |
| `mg-morph` | `08-morph` | One shape that turns into icon after icon and lands as the wordmark |
| `mg-synthwave` | `10-synthwave` | 1980s synthwave: neon grid road, chrome title, glowing script, VHS wear |
| `mg-aurora-glass` | `12-aurora-glass` | Aurora gradient light behind frosted glass cards |

```bash
node ../engines/kit/render-engine.mjs --engine mg-synthwave --frames 0,150,290 --out frames
```

## What is here

- `upstream/demos/<film>/`: the five films, byte-identical (hashes in `integrations/mg-styles-15/source-manifest.json`). Their `audio.py` and `tools/` scripts are kept as reference; FrameMotion does not run them (they need upstream's sample library).
- `upstream/prompts/`: the prompt and style notes of all 15 styles (Chinese and English). The `Signature features` section of each is the style's checklist; the seven styles FrameMotion already has engines for (flat vector, line art, isometric, 3D render, Bauhaus, pixel, HUD) are improved in those engines from these notes, not added a second time.
- `upstream/assets/textures/paper/Paper001_4K_color.jpg`: ambientCG Paper001 (CC0), the paper of the morph film.
- `fonts/`: the open fonts the films name, from google/fonts (OFL 1.1, texts in `fonts/licences/`). CJK faces are subset to the films' characters plus Latin and Polish letters; Fraunces and Outfit are static instances. Four brand faces that are not open fonts (HarmonyOS Sans SC, Alimama ShuHeiTi, Douyin Sans, Alibaba PuHuiTi) are drawn with Noto Sans SC instead, so those lines look a little different from upstream's films.
- `textures/grain_fine_2048.png`: FrameMotion's own grain plate (`tools/make_grain.py`), in place of upstream's, whose source is not recorded.

## How it renders

The `mgstyles` builder in `../engines/kit/builders.mjs` copies one film into the folder layout its absolute paths expect, points `/demos/` and `/assets/` at the build folder, writes a `fonts.css` for the fonts above and sets `renderFrame = renderAt` once the page reports `__ready`. three.js, simplex-noise and opentype.js come from the engines folder (`npm ci`), pinned there; the films were made with three.js 0.186.1 and FrameMotion has 0.187.0.

Checked 2026-11-20 in software WebGL (no GPU): all five films render with no outside requests; cel boil repeats byte for byte in any frame order. Synthwave repeats byte for byte run to run, but one frame drawn right after another can differ in a handful of pixels by one level (6 pixels at frame 150 after a frame from about 35 to 60; cause not found), invisible in the film. Liquid, morph and aurora: three frames each looked at, order not tested (slow in software).

## Left out

Photo-based films (06 collage, 18 variety captions, 19 sticker explainer): upstream does not record where their photos come from. They return when they run on the user's own photos. Also left out: the rendered videos, the showcase site, upstream's Puppeteer renderer and its 56 MB instrument library (CC0); the films render silent here and get their sound from FrameMotion's sound workflow.
