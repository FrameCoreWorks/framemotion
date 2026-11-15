# Art engine

Paintings that move, drawn in code on one canvas, and parameterized explainer clips, rendered frame by frame by FrameMotion's shared renderer. The engine is [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) 1.3.0 at `1468196505a51728686db118d52561aa27a25124` (MIT, Copyright (c) 2026 alchaincyf; [LICENSE](LICENSE)), bundled in its own layout, unchanged except marked changes in nine files (see [What is here](#what-is-here)). Its method is `method.md` (the upstream `SKILL.md`) and `references/`, both in Chinese; FrameMotion's English summary of the direction method is [art-style and explainer direction](../../references/art-and-explainer-motion-direction.md).

## Pick a film or a clip

| The film needs | Registry id | Made from |
| --- | --- | --- |
| One beat in each of 27 art styles, from cave painting, Egyptian and Greek to Klimt, Bauhaus, pop art, 8-bit and vaporwave | `art-gallery` | the upstream gallery without the styles that are not bundled |
| One room travelling through fifteen eras, each with its own transition, on a 128 BPM grid | `art-speedrun` | `scripts/engine/eras.js` |
| Six-second studies of fourteen painters and traditions (Giotto, Piero, Raphael, Michelangelo, Guardi, Lorenzetti, Cortona, Renoir, Pissarro, Sisley, Gauguin, Ma Yuan, Persian miniature, Dunhuang) | `art-style-studies` | the upstream style studies without the ones that are not bundled |
| Kinetic type: a counting number, big words with a highlighter, numbered pages | `art-kinetic-type-pl` (Polish, 9:16) | a clip spec (`y5_kinetic_type`) |
| A finance chart: bars or lines that build to one highlighted result, with unit and source | `art-finance-chart-pl` (Polish, example data) | a clip spec (`t3_finance_chart`) |
| A flat science explainer: a centre subject, points around it, a zoom in | `art-flat-science` | a clip spec (`y1_kurzgesagt`) |
| A presentation look: counting numbers, cards with icons or the user's screenshots, a highlight box | `art-keynote-ui` | a clip spec (`t2_keynote_ui`) |

The clip grammars carry upstream's names, which point at well-known channels and formats. In FrameMotion they mean the format only: `t1_3b1b` is a maths explainer with formulas, `y1_kurzgesagt` a flat science explainer, `y2_vox` an editorial explainer with cards, `y3_whiteboard` a whiteboard drawing, `y4_storytime` a narrated story with a character, `y5_kinetic_type` kinetic type, `t2_keynote_ui` a presentation look and `t3_finance_chart` a finance chart. Never copy a channel's own characters, logos, music or footage. `y4_storytime` needs a library of character frames (see `references/10-角色.md`); without one, use another grammar.

For a launch film with several scenes, use the [Launch engine](../launch-engine/README.md); for a single 9:16 reel beat, the [Reels engine](../reels-engine/README.md). Choose this engine when the look is an art style or an explainer grammar.

## Make a clip

1. **Write a spec** in the workspace: `grammar`, `duration`, `fps`, `width`, `height`, `theme` and timed `cues`, as in `scripts/engine/examples/*.json` and FrameMotion's samples in `framemotion/samples/`. `scripts/engine/clip_schema.json` and `references/09-视频动画语法.md` list every field. Pictures a spec names are relative to the spec file.
2. **Register** it in `engines/engines.json` like the `art-*` clip entries: `"build": {"tool": "art", "clip": "<spec, from the engines folder>"}`, `"adapter": "renderFrameAt"`, `"capture": "#c"`, `"duration": "page"`, and a `size` and `fps` equal to the spec's.
3. **Render** from the `engines` folder, a contact sheet first:

   ```bash
   node kit/render-engine.mjs --engine art-kinetic-type-pl --frames 0,60,120,224 --out frames
   node kit/render-engine.mjs --engine art-kinetic-type-pl --frames all --out frames
   ```

   Then encode with sound as the [engine contract](../../references/engine-contract.md#from-frames-to-an-mp4-with-sound) says. Upstream renders its films at 60 fps; the registry samples use 30 to keep checks quick.

## Make an art film

A film is a list of segments (`ERAS`): each names a scene from `scripts/engine/scenes/`, a length on the beat grid (`eighths`) or in seconds (`dur`), a transition and a corner counter. Start from `eras.js` or `eras_gallery.js`, follow `method.md` and `references/04-纯代码绘制.md` for new scenes, and keep every scene a function of time (its random numbers come from seeds). To render a new film, save it as `scripts/engine/eras_<name>.js` in a workspace copy of the engine and add a registry entry with `"build": {"tool": "art", "film": "<name>"}`. `"film": "gallery"` and `"style_studies"` take upstream's lists without the styles that are not bundled. The 2026 scene signs its painting from `"signature"` in `build` (blank when unset).

In FrameMotion, skip the steps of `method.md` that install or run upstream's own tools (`uv run`, `render.py`, `qa.py`, `deliver.py`, the voice and image scripts): the engines folder and `render-engine.mjs` render, and sound follows FrameMotion's sound route.

## Rules

**Styles that are not here.** FrameMotion leaves out twelve scenes that imitate a studio or a franchise (Ghibli, Pixar, South Park, Rick and Morty, Marvel's Jack Kirby), a living artist (Kusama, Shinkai), or an artist whose work is still protected (Dalí, Hopper, Haring, Picasso, Chagall), and their recipe cards; the lines of `method.md` and the references that invited them are replaced by FrameMotion comments. Do not rebuild those looks for a client, even when a reference still names one as the origin of a technique (watercolour wash, hard cel shadows, split light). `eras_gallery.js` and `eras_style_studies.js` still list the removed ids as upstream ships them; the builder keeps only the bundled scenes. The styles that are here are art movements, traditions and painters whose work is in the public domain. The 8-bit scene is a generic pixel style: its HUD reads STAGE 01, not a well-known game's level name; keep it free of another game's characters and marks.

**No likeness of a real person.** The author's caricature rig (`lib/rig_huashu.js`) and promotional page are not bundled. The clip grammars still mention `HUASHU.build` in their API lists: it is not there, so draw characters with `lib/rig.js`, `lib/toon.js` or a library of character frames.

**Fonts and letters.** The bundled faces are Latin (with Polish letters, except Gochi Hand, Lilita One, Rye and UnifrakturMaguntia). The Chinese and Japanese faces are not bundled: their font families draw with Inter, EB Garamond or Kalam, which carry Polish letters, and Chinese text in a scene falls back to a system font. FrameMotion's gallery shows the four Chinese corner labels in English, and its style studies the painters' names in English with Inter. `lib/fonts/LICENSES.md` is upstream's list and still names the faces that are not bundled. Two marked lines in `lib/typo.js` keep Polish words whole when a line wraps and leave room for descenders under a rising word.

**Truth.** Numbers, sources and claims come from the user. The finance sample says on screen that its data is an example.

**Frames.** Every frame is drawn from its time alone, in any order; FrameMotion's renderer keeps the 2D canvas on the CPU without a GPU so that holds byte for byte. Page turns in the clips pass through a black frame on purpose: the registry lists those frames as `flat_frames`, so a full render does not stop on them. A new spec needs its own list: render it with `--frames all --allow-flat` once and copy the frames the report marks flat.

**Safe area.** In the 9:16 kinetic sample the small page counter sits at about 92% of the height, inside the band a reel app covers. It is decoration; for a reel, keep the words that matter between 10% and 80% of the height.

## What is here

| Path | What it is | State |
| --- | --- | --- |
| `LICENSE` | Upstream's MIT notice | unchanged |
| `method.md` | The upstream `SKILL.md`, renamed so no host loads it as a skill | unchanged except the marked lines below |
| `references/` | The method: breakdown, mechanisms, pure-code drawing, rhythm, explainer grammars, characters, style recipe cards, palettes, shot language | unchanged except the marked lines below |
| `scripts/engine/` | `engine.js`, `index.html`, `clip.html`, `clip.js`, `transitions.js`, the film lists, `scenes/`, `clips/`, `examples/`, five demos, upstream's `render.py` and audit tools | unchanged except the marked lines below |
| `scripts/engine/lib/` | Drawing, camera, type, chart, interface, rig and finish libraries, `three.min.js` (MIT, `THREE_LICENSE.txt`) and the Latin faces with `OFL.txt` and `LICENSES.md` | unchanged except `typo.js` (two lines, each marked by a FrameMotion comment) |
| Marked changes elsewhere | `scripts/engine/index.html` (no `rig_huashu.js`), `scenes/14_8bit.js` (STAGE 01), `transitions.js` (the pointillist transition clears its reused canvases, so its frames repeat), `method.md`, `references/风格配方/INDEX.md`, `references/角色精细度.md`, `references/16-风格演示95分协议.md`, `references/10-角色.md` (the lines about the removed cards, rig and author page) | each change marked by a FrameMotion comment |
| `framemotion/samples/` | FrameMotion's clip specs, Polish and English | ours |
| `README.md` (this file) | These notes | ours |

Not bundled: `reference_films/` (recreations of a TV show and a company's launch, and the Arphic font), the twelve scenes above and their recipe cards, the Chinese and Japanese faces (12.5 MB), the author's likeness (`lib/rig_huashu.js`, `demos/_shared` and the demos that use it) and promotional page (`references/about-author.md`), the 49 MB of showcase media, and the scripts outside `scripts/engine`. Every bundled file, its upstream path and SHA-256, and the changed file's current hash are in [`integrations/huashu-art-motion/source-manifest.json`](../../../../integrations/huashu-art-motion/source-manifest.json).

## Credit

huashu-art-motion: MIT, Copyright (c) 2026 alchaincyf. The fonts are not covered by that licence: they are SIL Open Font License 1.1 faces, listed with their copyrights in `scripts/engine/lib/fonts/LICENSES.md`. three.js is MIT. All are named in FrameMotion's `NOTICE`.
