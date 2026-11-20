# Anidoodle engine

Thirty-two hand-made style films from [alexgreensh/anidoodle](https://github.com/alexgreensh/anidoodle/tree/4ae27d2c281fcfd01bce87ab13dc5ad4df81a795) (commit `4ae27d2`, engine 0.10.1, Apache-2.0, Copyright 2026 Alex Greenshpun; `LICENSE` and `NOTICE` here), rendered by FrameMotion's engine kit. Each film is a pure function of its frame: the upstream page host (`src/hosts/page.ts`) exposes `window.FILM.seek(frame)`, which draws one frame synchronously, and FrameMotion's `anidoodle` builder wraps it as `renderFrame(t)`. Many films show the drawing being made (lines, then washes, then colour), so they double as drawing-process timelapses.

Thirteen are new looks:

| Engine | Film | Look |
| --- | --- | --- |
| `ad-broken-colour` | `brokenColour` | Impressionist dabs of pure colour side by side that shimmer, like a harbour at sunrise. (1080×1080, 15 s) |
| `ad-charcoal` | `charcoalErasure` | A charcoal drawing that is rubbed out and drawn again, so one picture changes through time (a tree in four seasons). (1080×1080, 18 s) |
| `ad-dream-glaze` | `dreamGlazeDraw` | Soft translucent glazes laid over each other until a dreamy painting appears. (1600×2000, 27 s) |
| `ad-embroidery` | `embroidery` | A picture stitched in thread on linen, stitch by stitch (a wreath and a bee). (1080×1080, 18 s) |
| `ad-folk-tale` | `folkTale` | A folk-tale picture book: a drawn hero walks through a decorated scene (a boy with a rooster). (1920×1080, 18 s) |
| `ad-halftone` | `halftone` | A picture printed in newspaper dots, with the dots moving as the light changes (a viaduct at golden hour). (1080×1080, 14 s) |
| `ad-scrapbook` | `scrapbook` | An old scrapbook page: clippings, engravings and notes taped in to explain a subject (how a honeybee finds flowers). (1080×1080, 17 s) |
| `ad-storybook` | `storybookDraw` | A children's-book character in pencil and soft watercolour, drawn before your eyes. (1080×1080, 15 s) |
| `ad-toy-brick` | `toyBrick` | A scene built from plastic toy bricks with a small action in it (a tug boat). (1080×1080, 18 s) |
| `ad-sumi-e` | `sumiE` | Japanese ink painting with a brush: bamboo bending in the wind. (1080×1080, 17 s) |
| `ad-marker-comic` | `koiDraw` | A comic panel drawn with markers, line then colour (koi fish). (1080×1080, 18 s) |
| `ad-chalkboard` | `moonPhasesDraw` | A lesson written and drawn in chalk on a blackboard (the phases of the moon). (1080×1080, 18 s) |
| `ad-ballpoint` | `pocketWatchDraw` | A ballpoint-pen sketch drawn line by line (a pocket watch). (1080×1080, 15 s) |

Nineteen are a second way of animating a look FrameMotion already had (registry field `method_of`; the menu lists them under that engine, never as engines of their own, by the owner's rule of 2026-11-20):

| Way | Film | Second way of |
| --- | --- | --- |
| `ad-crayon` | `balloonDraw` | `lemo-crayon-book`: a crayon picture drawn on stroke by stroke, then it comes alive (a hot-air balloon). |
| `ad-cyanotype` | `blueprint` | `lemo-blueprint`: a cyanotype drafting sheet where a machine is drawn, measured and set going (a train). |
| `ad-paper-collage` | `foxDraw` | `lemo-papercut-red`: cut-paper pieces laid down one by one into a picture (a fox at dusk). |
| `ad-toy-theatre` | `paperCraft` | `lemo-papercut-red`: a paper toy theatre with flats that slide and bob, animated on twos (a seaside town). |
| `ad-oil` | `paintedOil` | `lemo-impasto`: an oil still life painted stroke by stroke (pears and a copper pot). |
| `ad-woodblock` | `woodcut` | `lemo-ukiyoe`: a woodblock print pressed one colour block after another (herons on a bridge in rain). |
| `ad-scratchboard` | `scratchboard` | `lemo-engraving`: white lines scratched out of a black board (a lynx in moonlight). |
| `ad-single-line-engraving` | `mellanUnspool` | `lemo-engraving`: one spiral line whose thickness makes the picture, unspooling (a Mellan engraving). |
| `ad-stipple` | `stipple` | `lemo-engraving`: a pen-and-ink picture built from dots (a nautilus shell). |
| `ad-pixel-art` | `pixelArt` | `launch-pixel`: a pixel-art scene with a little character action (a cat's pounce). |
| `ad-flat-vector` | `flatVector` | `art-flat-science`: a flat vector illustration whose shapes move together (a sailing regatta). |
| `ad-isometric` | `isometric` | `lemo-iso-infographic`: a cutaway seen from an angle, where a small process runs inside (a night bakery). |
| `ad-coloured-pencil` | `colouredPencil` | `p5-brush`: a coloured-pencil drawing with a small story in it (a tin repairman). |
| `ad-pencil-watercolour` | `ranunculusDraw` | `p5-brush`: a pencil drawing that gets its watercolour washes (a ranunculus flower). |
| `ad-risograph` | `lighthouseDraw` | `lemo-risograph`: a small-press print built up one ink at a time (a lighthouse at sunset). |
| `ad-ink-wash` | `wrenDraw` | `lemo-urban-sketch`: an ink line drawing that washes in its tones (a wren on a twig). |
| `ad-mid-century` | `midCentury` | `lemo-midcentury-toon`: a 1950s gouache illustration with flat textured colour (a kite). |
| `ad-rubber-hose` | `rubberHose` | `lemo-rubber-hose`: a 1930s rubber-hose cartoon loop (a dancing coffee pot). |
| `ad-low-poly` | `lowPoly` | `lemo-lowpoly-island`: a flat low-poly picture whose facets shift with the light (a mountain lake at dawn). |

```bash
node ../engines/kit/render-engine.mjs --engine ad-embroidery --frames 0,270,530 --out frames
```

## How it builds

The `anidoodle` builder in `../engines/kit/builders.mjs` bundles the chosen film with the upstream page host using FrameMotion's own pinned esbuild into one offline page (`<canvas id="film">`). None of anidoodle's Node tools run. The page waits for `FILM.ready`, then seeks `round(t × fps)`. The opening `?adapter=` query keeps the upstream player still, so nothing plays on its own.

A new film in one of these styles: put a folder laid out like `src/` (a `canvas-core/<film>.ts` exporting `const <film>: Film`) in the workspace and set `build.folder` to it and `build.film` to the export name. Files there are found first, so the film can import the bundled kits (`./core`, `./film`, `./woodcutKit`, `./sumiEKit` and the others) as upstream films do. Read the matching upstream film first and keep its rules: every frame a function of the frame number, seeded randomness only, no clocks.

## What is here

- `upstream/engine/src/`: the 74 source files these films need (the films, their kits, the core, the page host and its probes), byte-identical; hashes in `integrations/anidoodle/source-manifest.json`.
- `upstream/engine/styles.gen.json`: upstream's style catalogue (medium, palette, nearest style, hero), the reference when a new film is written in one of these looks.
- `LICENSE`, `NOTICE`: upstream's, unchanged.

## Left out

- anidoodle's Node tools (`tools/`, build, render, review and gate scripts) and its skill text: FrameMotion's builder and renderer replace them.
- The three.js films and `src/three-core`, the launch, lesson, mascot, character and fixture films, and the worked example: not part of these style looks. A film that imports `three` fails the build with a clear message.
- Narration (ElevenLabs provider) and the optional sound pack (its OpenAIR rooms are CC BY 4.0): the films render silent; sound follows FrameMotion's own sound workflow.
- `assets/refs/` (a painting reference), `assets/brand`, `assets/narration`, the engine fonts and `vendor/` (three.js): not used by these films.

## Notes from the QA pass

- Sizes differ: most are 1080×1080, `ad-folk-tale` is 1920×1080 and `ad-dream-glaze` 1600×2000. Pick by format or reframe in the compose step.
- `ad-halftone` builds its dot screens on the first frame (about 18 s in software rendering); later frames are fast.
