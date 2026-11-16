# Lemo engine

Twenty-four complete film styles from [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) by Lemomo (LemoLab), bundled at commit `3a7132b996be0241c1ea0ab180d519f06e6f10b6` (2.0.0) under the MIT licence. Each style is a demo film written in code on a small shared toolkit (`core/`): a page that draws any frame with `window.render(t)` once `window.READY` is set. FrameMotion renders it with its own engine kit, so a frame is a pure function of its time and every frame repeats byte for byte in any order.

The styles, the shared core and the fonts sit in upstream's own layout (`core/`, `styles/<slug>/style.json`, `styles/<slug>/demo/`), so each demo keeps its relative paths. Only code, data, configuration and fonts are bundled, unchanged except one marked file (below): no Markdown, no prompts, no films, stills, voices or music. The file list with upstream paths and SHA-256 is in [the source manifest](../../../../integrations/lemo-opuscar/source-manifest.json).

## Styles

Registry id `lemo-<slug>`; all are 1920×1080. "3D" pages use the engines folder's shared three.js and are captured as a screenshot of the page; the others are captured from their canvas.

| Slug | Look | Suits | Faces without Polish letters |
| --- | --- | --- | --- |
| `art-deco` | Black lacquer, gold line and stepped geometry; bulbs switch on one by one | Luxury, hospitality, invitations | Italiana |
| `ascii-crt` | Everything drawn as characters on a glowing monochrome terminal | Developer tools, sci-fi, tech | none |
| `backrooms` (3D) | Camcorder footage of endless empty yellow rooms, timecode and grain | Horror, mystery, game teasers | not checked (WOFF2) |
| `blueprint` | White technical drawing on blueprint blue, drawn and dimensioned live | Engineering, hardware, tech explainers | B612, B612 Mono |
| `crayon-book` | Wax crayon on rough paper, a wash uncovering what the crayon resisted | Picture books, kids' learning | Gaegu, Gochi Hand, Short Stack, Sniglet |
| `engraving` | Copperplate hatching and cross-hatching, then lettering and a light wash | Museums, science, brand heritage | none |
| `glass-product` (3D) | A product in clear and frosted glass, strip lights and caustics | Product launches, consumer tech, beauty | not checked (WOFF2) |
| `hologram-hud` | A wireframe scan with lock-on boxes and rolling read-outs | Spec walkthroughs, launches, trade shows | Share Tech Mono |
| `impasto` | Thick palette-knife paint under raking light | Music videos, art and culture, emotional ads | not checked (WOFF2) |
| `iso-infographic` | A flat three-tone isometric diorama that opens to show a process | Process explainers, supply chains, reports | none |
| `lowpoly-island` (3D) | A faceted little island world under an orthographic lens | Game trailers, world building, calm content | not checked (WOFF2) |
| `midcentury-toon` | 1950s flat colour off a broken ink line, colour-block rooms | Set-up guides, help centres, how-to | Oleo Script |
| `one-line` | One unbroken line draws each scene and morphs into the next | Brand stories, milestones, minimal ads | none |
| `papercut-red` | Jointed red paper-cuts where the holes let the light through | Festive greetings, folk tales | Ma Shan Zheng (Chinese titles) |
| `risograph` | Two or three spot inks, halftone dots, plates slightly off register | Indie brands, zines, lifestyle | none |
| `rubber-hose` | A black-and-white 1930s cartoon on twos, every object alive | Food and drink, retro ads, kids | none |
| `shadow-puppet` | Coloured leather puppets pressed to a lamp-lit screen | Myths, heritage, festivals | Ma Shan Zheng (Chinese titles) |
| `spy-titles` | 1960s cut-paper titles, silhouettes moving through sets of type | Title sequences, openers, trailers | none |
| `stained-glass` | A window in a dark hall, alive only where the sun touches it | Legends, heritage, holiday stories | none |
| `swiss-motion` | A modular grid, one typeface, one signal colour, exact movement | Brand identity, events, design education | Unifraktur Maguntia |
| `tilt-shift` (3D) | A place from high above with a tilted focus band, so it reads as a model | City promos, real estate, transport | none |
| `ukiyoe` | A woodblock print come alive, unrolled like a scroll | Travel, Japanese culture, poetry | not checked (WOFF2) |
| `urban-sketch` | Sepia fineliner drawn on location, loose watercolour off the lines | City and travel, architecture, lifestyle | none |
| `whiteboard` | Marker written stroke by stroke on a board, a camera travelling across | Explainers, courses, science | none |

The [film style library](../../references/film-style-library.md) describes all 66 upstream looks in FrameMotion's words; the 24 above are the ones that can be rendered from this folder.

## Use

- `node kit/render-engine.mjs --engine lemo-art-deco --frames 0,300,525` renders the style's own demo film (its length comes from the page's `window.DUR`).
- A registry entry or a workspace copy may set `build.film` to a film module written for the style (a path from the engines folder); it replaces the demo's `film.js` in the build folder and imports the style's modules exactly as the demo's film does. Start from the demo's `film.js`, keep its exports (`renderFilm`, `DUR`, optional `init` and `events`) and change the story, words, timing and colours.
- `build.scene: "file.fn"` renders one scene function on its own, as upstream's `?scene=` does.
- Words go through the style's own faces. Where the table names a face without Polish letters, set Polish words in one of the style's other faces, or check the frame: the browser fills a missing letter from another font.
- Lemo's own guides (STYLE.md, DEMO.md) are not bundled (CC BY-NC 4.0); read them on GitHub for the look's rules, and write the direction in FrameMotion's own words.

## Not bundled

Every Markdown file and the image prompts (CC BY-NC 4.0); the demo films, posters, stills and subtitles (CC BY 4.0); all voice, music and mix files; Clawd (Anthropic's character) and the Mascot Screencast style; core/render, core/audio, core/tts, core/image and core/assets; each demo's tools and build scripts. The other 77 styles are left out because they use third-party footage, photos, maps, data or models, need upstream's fetched asset packs (voice, HDRI, instruments), subset their fonts with a script, render in Python, draw Chinese characters as their main effect (Chinese Ink Wash), imitate a known television franchise (Sci-Fi Sitcom Toon), or repeat what FrameMotion already covers (Stickman, Cutaway, Teardown, Pixel, Launch and Art engines).

## Changes

One upstream file is changed, marked by a FrameMotion comment and recorded with both hashes in the manifest: `styles/tilt-shift/demo/sky.js` renders its environment map from the current frame's sky every time (upstream cached it per half degree of sun height from whichever frame got there first, so a frame depended on the frames drawn before it). FrameMotion's builder (`lemo` in `engines/kit/builders.mjs`) copies `core/` and one style into a temporary folder, rewrites the absolute `/core/` paths there to the build folder, fixes the page body at 1920×1080 so a layered three.js page captures as one element, makes `Math.random` a fixed-seed generator (Tilt-Shift's ambient-occlusion noise was new on every page load), turns off three.js frustum culling on 3D pages (bounds computed on the first frame culled traffic that moved later), and adds the clock bridge (`window.FILM_INFO`, `window.renderFrameAt`). One-line and Risograph set `build.warm`: their first draw of some words and ink differs from every repeat, so the first call draws the film once a second before the asked frame, and every frame is the same in any order. Three.js comes from the engines folder (0.187.0; upstream pins ^0.170).

## Licence and credit

Code, data and small assets: MIT, Copyright (c) 2026 Lemomo (LemoLab); [LICENSE](LICENSE) and [REUSE.toml](REUSE.toml) are upstream's, unchanged, with the licence texts in `LICENSES/`. Fonts: SIL Open Font License 1.1, each named with its source in the style's `demo/CREDITS` and `OFL-*.txt`; fonts that upstream fetches at build time came from the pinned URLs recorded in the manifest. Credit: "Lemo-Opuscar by Lemomo (LemoLab)", https://github.com/lemomo-ai/lemo-opuscar, MIT, selected files bundled unchanged. Films you make with these styles are yours.
