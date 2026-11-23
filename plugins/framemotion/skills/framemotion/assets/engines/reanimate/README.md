# Reanimate engine

FrameMotion's own engine, ported module by module from the open project [Reanimate](https://github.com/reanimate/reanimate) (a Haskell library for vector and maths animation, public domain, commit `583ee9f`) and the parts of its Haskell dependencies it relies on (svg-tree's printer and colours, cubicbezier's Bézier code, Text.XML.Light's printer; all BSD-3-Clause). No Haskell, LaTeX or external program is needed, every frame is a pure function of time on [the engine contract](../../../references/engine-contract.md), and it prints the same SVG as Reanimate for every ported example that has a golden file.

Registry id `reanimate` ([`engines.json`](../engines.json)). Packs 1 to 3 of 5 (the core; objects, colours and TeX text; map projections); see [what comes next](#packs).

## What it draws

Clean vector strokes on Reanimate's canvas: 16 × 9 units, origin in the centre, y pointing up, strokes 0.05 units wide. Shapes draw themselves along their outline (`partialSvg`, `drawInE`), move, fade, slide and swap through transitions, and scenes place sprites and variables on a timeline.

## Use it

```bash
node kit/render-engine.mjs --engine reanimate --params '{"example":"chainT"}' --frames all --out frames/
```

`example` is one of the 103 ported documentation examples (the `enum` in the registry entry, for example `drawCircle`, `pathify`, `chainT`, `slideLeftT`, `spriteE`, `unVar`). Frame 0 of the drawing examples is blank by design (nothing drawn yet).

In code, build an animation and give it to `createReanimateEngine`:

```js
import * as R from './core/index.mjs';
import {createReanimateEngine} from './engine.mjs';

const film = R.scene((s) => {
  const circle = s.fork((f) => f.newSpriteA(R.drawCircle));   // draws itself over 2 s
  s.wait(1);
  s.spriteTween(circle, 1, (v, svg) => R.translate(4 * v, 0, svg));
});
const engine = createReanimateEngine(film, {width: 1080, height: 1920, fps: 30, screen: [9, 16], mount: stage});
```

`screen` is FrameMotion's one addition: the canvas in units, so `[9, 16]` gives a vertical reel without stretching. Reanimate itself always uses `[16, 9]`. On the page (`index.html`) the setting `screen` is optional: without it the short side is 9 units, and a `screen` whose proportions differ from `width` × `height` by more than 1 % is refused, since it would stretch the picture.

## How the Haskell maps to JavaScript

| Reanimate | Here |
| --- | --- |
| `Animation`, `seqA`, `parA`, `andThen`, `signalA`, `pauseAtEnd`, … | the same names in [`core/animation.mjs`](core/animation.mjs); an animation is `{duration, gen(t ∈ [0, 1])}` |
| `curveS`, `bellS`, `powerS`, `cubicBezierS`, … | the same signals, `(t) => value` |
| `Effect`, `fadeInE`, `drawInE`, `overBeginning`, `applyE` | effects are `(duration, t) => (svg) => svg` |
| `Transition`, `fadeT`, `overlapT`, `chainT`, `slideLeftT` | `(a, b) => animation`; `overlapT(0.5, fadeT)(a, b)` |
| SVG trees and `withStrokeColor`, `translate`, `mkCircle`, … | [`core/svg.mjs`](core/svg.mjs): plain node objects, the tree is the last argument as in Haskell |
| `pathify`, `partialSvg`, `toLineCommands`, `boundingBox` | [`core/paths.mjs`](core/paths.mjs) |
| `center`, `aroundCenter`, `scaleToSize` | [`core/layout.mjs`](core/layout.mjs) |
| `scene $ do …` with `fork`, `wait`, `newSprite`, `newVar`, `tweenVar`, `spriteE`, `spriteZ`, … | [`core/scene.mjs`](core/scene.mjs): `R.scene((s) => { … })`, the builder `s` has the same methods; a branch is `s.fork((f) => …)` |
| `unVar v`, `spriteT`, `spriteDuration` in a sprite | the sprite's function receives `f` with `f.get(v)`, `f.t`, `f.d` |
| `newSpriteA' SyncFreeze` | `s.newSpriteA_(R.Sync.Freeze, ani)` |
| `oNew`, `oModify`, `oShowWith obj oDraw`, `oTween`, lenses such as `oLeftX .= x` | [`core/object.mjs`](core/object.mjs): `s.oNew(svg)`, `s.oModify(o, fn)`, `s.oShowWith(o, R.oDraw)`, `s.oTween(o, d, (t, data) => data)`, `s.oSet(o, 'leftX', x)`; `R.oGet` / `R.oSet` / `R.oOver` on the data |
| `Circle`, `Rectangle`, `Camera`, `cameraZoom`, `cameraFocus` | `new R.Circle(r)`, `new R.Rectangle(w, h)`, `new R.Camera()`, `s.cameraZoom(cam, d, k)`, … |
| colour maps (`viridis`, `turbo`, …), `interpolateRGB8 labComponents`, `showColorMap` | [`core/color.mjs`](core/color.mjs): `R.viridis(t)` gives `[r, g, b]`; `R.hsvColorMap` is Reanimate's `hsv` map |
| `latex`, `latexAlign`, math between `$` | [`core/latex.mjs`](core/latex.mjs): `R.latex('oDraw')`, `R.math('e^{i\\pi}')`, `R.latexAlign(...)` |
| `project smallEarth mollweideP`, `interpP`, `orthoP (LonLat 0 0)`, `applyProjection`, `loadFeatureCollection` | [`core/geoprojection.mjs`](core/geoprojection.mjs): `R.project(R.smallEarth(), R.mollweideP)` gives an RGBA image for `R.embedImageRGBA`; `R.interpP(src, p1, p2, t)`; `R.orthoP([lon, lat])` in radians; `R.drawFeatureCollection(geojson, fn)` takes parsed GeoJSON |

## Checked against Reanimate

- `tests/reanimate-core.test.mjs` renders 10 frames of each of the 70 examples that Reanimate ships a golden file for (`tests/fixtures/reanimate-golden/`, unchanged from the repository) and requires the SVG text to match byte for byte (embedded PNGs pixel for pixel). All 70 do. It also renders every one of the 83 examples at its pinned length and checks that no frame has NaN or undefined values.
- All examples were also compared with Reanimate's documentation GIFs at 320 × 180 (frame i at i / 25 s); the results, including the three examples without a golden file, are in the 0.9.0 entry of the [changelog](../../../../../CHANGELOG.md).
- `arcLength` follows cubicbezier's `arcLengthEstimate` step by step, but no golden file draws an asymmetric curve in part, so agreement there is read from the source rather than measured.
- The 20 projection examples have no golden file. `tests/reanimate-geo.test.mjs` pins the pixels of each projected image (they match Reanimate's documentation GIFs within 0.7 to 2.0 grey levels of 255, the GIF palette and the anti-aliased edge of the map) and checks the blends, the helpers and the GeoJSON path bending.
- `smallEarth` is Reanimate's `data/small_earth.jpg` decoded once with Pillow (libjpeg) and kept as pixels in [`core/earth-data.mjs`](core/earth-data.mjs); Reanimate decodes it with JuicyPixels, whose rounding can differ by a level here and there.
- The page renders through the engine kit: frames repeat exactly and are not blank.

Not in this engine on purpose: Reanimate's POV-Ray and Blender bridges and its command line, which run external programs. Reanimate's `latex` runs LaTeX and dvisvgm; here the engine page draws the same TeX with MathJax 3.2.2 (an npm dependency of the engines, Apache-2.0), whose TeX fonts are Computer Modern outlines: the letters match, but each glyph's outline starts at another point and some contours come in another order, so `oDraw` traces a letter along a different route. Outside the page (Node), `latex` falls back to `mkText`, as Reanimate does without LaTeX. TeX problems are reported, not drawn: a letter the TeX fonts lack (Polish ą, ę, ł, emoji) stops `latex` with the letters named, as LaTeX stops (draw such text with `mkText`); ó, ś, ć, ń, ź, ż and other accented Latin letters are written as TeX accents and drawn; TeX errors, undefined commands and equation tags (`\tag`) throw MathJax's message; and without MathJax on the page a frame that draws TeX fails with install instructions. `mkText` is SVG text in the browser's fonts, so its frames depend on the fonts installed (the GIF comparison differs by about 1 grey level there).

The colour map `parula` is left out: it is MathWorks' design and its licence is unclear. Embedded PNGs (colour maps) are written uncompressed; Reanimate's are compressed by its zlib, so the tests compare their pixels, which are identical.

### Kept as Reanimate does it

These look odd but are the original's behaviour (checked in the sources at the pinned commits) and are kept so the drawings match:

- `pause(0)`, and so `chainT(tr, [])`, throws "Animation duration (0) is not positive", because Reanimate's `pause d = mkAnimation d …` checks `d > 0` (Haskell throws when the value is used, JavaScript at once).
- `mkColor('none')` is no paint; an unknown colour name is aliceblue.
- `boundingBox` knows paths, circles, ellipses, lines, rectangles, polylines, images and nested SVG; anything else (a polygon, text) has the box `[0, 0, 0, 0]`. A path's box is sampled from its drawn points: a curve counts its start, but the point a move goes to is not counted when a straight segment follows it (`M 0 0 L 2 1` has the box of the single point (2, 1)).
- `mapTree` walks into groups and definitions only; clip paths, masks and nested SVG are passed to the function whole.
- `oDraw` draws each glyph's outline 0.05 units wide inside the glyph's own transformations, so text scaled by 4 is traced with a 0.2-unit line. Reanimate's documentation GIF of `oDraw` (made in 2020, before LaTeX output had its transformations lowered) shows a thinner line; the code at the pinned commit draws it as here.
- `applyE` reads the animation at `frameAt(d * t)`, as `Reanimate.Effect.applyE` does.
- `isValidP` is false for `mollweideP` (its theta comes from a 50001-step table) and `augustP` (a series), as in Reanimate; `lagrangeP`'s inverse puts its top edge at the out-of-range point (100, 100), and the map examples stretch the 2:1 image over the 16:9 (or reel) screen.
- Numbers print with six decimals and trailing zeros removed (svg-tree's `ppD`); a `NaN` prints as `NaN`, as in the original, so a broken computation shows up in the SVG text rather than being hidden.

## Packs

1. **Core (done):** SVG tree, paths and partial drawing, time, signals, effects, transitions, scenes, variables and sprites.
2. **Objects, colours and text (done):** objects and their animators (`oNew`, `oDraw`, `oGrow`, `oScaleIn`, `oScaleOut`, `oHideWith`, `signalO`), the camera, colour spaces, components and maps, TeX text through MathJax. `oTransform` (morphing one object into another) comes with the morphs in pack 5.
3. **Map projections (done):** all 20 projections Reanimate has (augustP to wernerP; bonne, bottomley, the equal-area cylinder and the orthographic globe take a parameter), each redrawing Reanimate's `smallEarth` pixel by pixel, the blend between two projections (`interpP`, `interpBBP`, `mergeP`), the projection helpers (`scaleP`, `flipYAxisP`, `moveTopP`, `moveBottomP`, `isValidP`) and GeoJSON outlines bent by a projection (`renderGeometry`, `drawFeatureCollection`, `applyProjection`). The country and land data of the `map-projection` film is not in Reanimate's repository; it comes with that film in pack 5.
4. Maths: Fourier drawing, tangents, stars and the other larger examples.
5. Films: `map-projection` and the showcase, then shape morphing; reel formats.

Credits: `integrations/reanimate-haskell`, `reanimate-svg`, `cubicbezier-haskell`, `xml-light-haskell`, `linear-haskell`, `colour-haskell` and `d3-scale-chromatic` (licences and pins), the `mathjax` entry of `integrations/sources.json`, and `NOTICE`.
