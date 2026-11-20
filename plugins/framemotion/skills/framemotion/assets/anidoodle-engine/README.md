# Anidoodle engine

Hand-drawn animation, one engine (`anidoodle`) in thirty-two styles, from [alexgreensh/anidoodle](https://github.com/alexgreensh/anidoodle/tree/4ae27d2c281fcfd01bce87ab13dc5ad4df81a795) (commit `4ae27d2`, engine 0.10.1, Apache-2.0, Copyright 2026 Alex Greenshpun; `LICENSE` and `NOTICE` here), rendered by FrameMotion's engine kit. Each film is a pure function of its frame: the upstream page host (`src/hosts/page.ts`) exposes `window.FILM.seek(frame)`, which draws one frame synchronously, and FrameMotion's `anidoodle` builder wraps it as `renderFrame(t)`. Many films show the drawing being made (lines, then washes, then colour), so they double as drawing-process timelapses.

It is FrameMotion's own hand-drawn animation engine (owner decision 2026-11-20): every style stays inside it, it is never split into other engines' ways, and it grows by new styles. The menu shows it once; the setting `style` picks the look. Each bundled style is the author's showcase film and draws its own subject (a fox, a balloon, a watch); your own subject needs a new style (below).

```bash
node ../engines/kit/render-engine.mjs --engine anidoodle --params '{"style":"chalkboard"}' --frames 0,270,530 --out frames
```

| Style | Film | Look |
| --- | --- | --- |
| `crayon` | `balloonDraw` | A crayon picture drawn on stroke by stroke, then it comes alive (a hot-air balloon). (1080×1080, 15 s) |
| `cyanotype` | `blueprint` | A cyanotype drafting sheet where a machine is drawn, measured and set going (a train). (1080×1080, 18 s) |
| `paper-collage` | `foxDraw` | Cut-paper pieces laid down one by one into a picture (a fox at dusk). (1080×1080, 16 s) |
| `toy-theatre` | `paperCraft` | A paper toy theatre with flats that slide and bob, animated on twos (a seaside town). (1080×1080, 13 s) |
| `oil` | `paintedOil` | An oil still life painted stroke by stroke (pears and a copper pot). (1080×1080, 18 s) |
| `woodblock` | `woodcut` | A woodblock print pressed one colour block after another (herons on a bridge in rain). (1080×1080, 14 s) |
| `scratchboard` | `scratchboard` | White lines scratched out of a black board (a lynx in moonlight). (1080×1080, 16 s) |
| `single-line-engraving` | `mellanUnspool` | One spiral line whose thickness makes the picture, unspooling (a Mellan engraving). (1080×1080, 8 s) |
| `stipple` | `stipple` | A pen-and-ink picture built from dots (a nautilus shell). (1080×1080, 15 s) |
| `pixel-art` | `pixelArt` | A pixel-art scene with a little character action (a cat's pounce). (1080×1080, 15 s) |
| `flat-vector` | `flatVector` | A flat vector illustration whose shapes move together (a sailing regatta). (1080×1080, 17.5 s) |
| `isometric` | `isometric` | A cutaway seen from an angle, where a small process runs inside (a night bakery). (1080×1080, 16 s) |
| `coloured-pencil` | `colouredPencil` | A coloured-pencil drawing with a small story in it (a tin repairman). (1080×1080, 18 s) |
| `pencil-watercolour` | `ranunculusDraw` | A pencil drawing that gets its watercolour washes (a ranunculus flower). (1080×1080, 15 s) |
| `risograph` | `lighthouseDraw` | A small-press print built up one ink at a time (a lighthouse at sunset). (1080×1080, 11 s) |
| `ink-wash` | `wrenDraw` | An ink line drawing that washes in its tones (a wren on a twig). (1080×1080, 18 s) |
| `mid-century` | `midCentury` | A 1950s gouache illustration with flat textured colour (a kite). (1080×1080, 18 s) |
| `rubber-hose` | `rubberHose` | A 1930s rubber-hose cartoon loop (a dancing coffee pot). (1080×1080, 14.5 s) |
| `low-poly` | `lowPoly` | A flat low-poly picture whose facets shift with the light (a mountain lake at dawn). (1080×1080, 15 s) |
| `broken-colour` | `brokenColour` | Impressionist dabs of pure colour side by side that shimmer, like a harbour at sunrise. (1080×1080, 15 s) |
| `charcoal` | `charcoalErasure` | A charcoal drawing that is rubbed out and drawn again, so one picture changes through time (a tree in four seasons). (1080×1080, 18 s) |
| `dream-glaze` | `dreamGlazeDraw` | Soft translucent glazes laid over each other until a dreamy painting appears. (1600×2000, 27 s) |
| `embroidery` | `embroidery` | A picture stitched in thread on linen, stitch by stitch (a wreath and a bee). (1080×1080, 18 s) |
| `folk-tale` | `folkTale` | A folk-tale picture book: a drawn hero walks through a decorated scene (a boy with a rooster). (1920×1080, 18 s) |
| `halftone` | `halftone` | A picture printed in newspaper dots, with the dots moving as the light changes (a viaduct at golden hour). (1080×1080, 14 s) |
| `scrapbook` | `scrapbook` | An old scrapbook page: clippings, engravings and notes taped in to explain a subject (how a honeybee finds flowers). (1080×1080, 17 s) |
| `storybook` | `storybookDraw` | A children's-book character in pencil and soft watercolour, drawn before your eyes. (1080×1080, 15 s) |
| `toy-brick` | `toyBrick` | A scene built from plastic toy bricks with a small action in it (a tug boat). (1080×1080, 18 s) |
| `sumi-e` | `sumiE` | Japanese ink painting with a brush: bamboo bending in the wind. (1080×1080, 17 s) |
| `marker-comic` | `koiDraw` | A comic panel drawn with markers, line then colour (koi fish). (1080×1080, 18 s) |
| `chalkboard` | `moonPhasesDraw` | A lesson written and drawn in chalk on a blackboard (the phases of the moon). (1080×1080, 18 s) |
| `ballpoint` | `pocketWatchDraw` | A ballpoint-pen sketch drawn line by line (a pocket watch). (1080×1080, 15 s) |

## Make a new style

A style is one film plus one row in [`styles.json`](styles.json); the engine core, the registry and the bundled films stay unchanged.

1. Make a folder laid out like `src/`: `<folder>/canvas-core/<film>.ts` exporting `const <film>: Film`. Start from [`examples/canvas-core/ownExample.ts`](examples/canvas-core/ownExample.ts) (the `own-example` style). Files in the folder are found before the bundled ones, so the film can import the bundled kits as `./core`, `./film`, `./scrapbookKit`, `./woodcutKit`, `./sumiEKit` and the others, as the bundled films do. Read the closest bundled film of the look you want, and `upstream/engine/styles.gen.json` (medium, palette, nearest style) for its rules.
2. Add a row to `styles.json`: `"<style name>": {"film": "<export name>", "folder": "<folder, from the engines folder>", "size": {"width": …, "height": …}, "fps": …, "duration": …, "about": "<one sentence>"}`. Size, fps and duration must equal the film's own `meta`; the renderer stops when they differ.
3. Render it with `--params '{"style":"<style name>"}'`, check frames in two orders (a frame must not depend on the frames drawn before it), and add the name to the `style` setting's description in `engines.json` when it is meant for everyone.

A user's style lives in their own workspace folder, never in the package: put the film in `<workspace>/my-styles/canvas-core/` and the rows in `<workspace>/my-styles/styles.json` (same shape, `"folder": "."`), then render with `FRAMEMOTION_STYLES=<workspace>/my-styles/styles.json`. Its rows are added to the bundled table (a row with a bundled name replaces it for that render), and each `folder` is read from that file's folder. A style added to FrameMotion itself goes under `examples/` or a new folder here with its test.

```bash
FRAMEMOTION_STYLES=~/work/my-styles/styles.json \
  node ../engines/kit/render-engine.mjs --engine anidoodle \
  --params '{"style":"my-style"}' --frames 0,60 --out frames
```

An unknown style or setting stops with one line naming the styles there are.

## Formats

Most films are 1080×1080; `folk-tale` is 1920×1080 and `dream-glaze` 1600×2000 (each style's own size is used unless `width` and `height` are given). Any `width` and `height` work: the film draws on its own canvas at its own size and the captured `#frame` fits it whole, centred, over a soft, darkened, blurred copy of itself. A square film in a 1080×1920 reel: `--params '{"width":1080,"height":1920}'`.

## How it builds

The `anidoodle` builder in `../engines/kit/builders.mjs` bundles the chosen film with the upstream page host using FrameMotion's own pinned esbuild into one offline page (`<canvas id="film">`). None of anidoodle's Node tools run. The page waits for `FILM.ready`, then seeks `round(t × fps)`. The opening `?adapter=` query keeps the upstream player still, so nothing plays on its own.

A new style is described in [Make a new style](#make-a-new-style).

FrameMotion's fix (`AD_FIXES` in the builder, applied while bundling; the bundled file is unchanged): in `scrapbookKit.ts` `staged()`, going back to an earlier step cleared the cached base and redrew it on the same canvas, whose drawing state was left from later steps, so a frame drawn after a later one differed slightly (about 10,500 values by 1 to 2 levels at frame 200 after 230; found by the 2026-11-20 review). The rebuilt base now starts on a fresh canvas: 0 differences in any order.

## What is here

- `upstream/engine/src/`: the 74 source files these films need (the films, their kits, the core, the page host and its probes), byte-identical; hashes in `integrations/anidoodle/source-manifest.json`.
- `upstream/engine/styles.gen.json`: upstream's style catalogue (medium, palette, nearest style, hero), the reference when a new film is written in one of these looks.
- `styles.json`: the style table (ours); `examples/canvas-core/ownExample.ts`: FrameMotion's own example film and the template for a new style (ours, MIT like FrameMotion).
- `LICENSE`, `NOTICE`: upstream's, unchanged.

## Left out

- anidoodle's Node tools (`tools/`, build, render, review and gate scripts) and its skill text: FrameMotion's builder and renderer replace them.
- The three.js films and `src/three-core`, the launch, lesson, mascot, character and fixture films, and the worked example: not part of these style looks. A film that imports `three` fails the build with a clear message.
- Narration (ElevenLabs provider) and the optional sound pack (its OpenAIR rooms are CC BY 4.0): the films render silent; sound follows FrameMotion's own sound workflow.
- `assets/refs/` (a painting reference), `assets/brand`, `assets/narration`, the engine fonts and `vendor/` (three.js): not used by these films.

## Notes from the QA pass

- Every film was rendered at three frames, and 30 of them in two frame orders, with identical frames (the order sweep, 2026-11-20).
- `oil` is dark and `ballpoint` and `stipple` are pale: check them on a phone screen before choosing.
- `halftone` builds its dot screens on the first frame (about 18 s in software rendering); later frames are fast.
