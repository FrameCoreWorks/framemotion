# Reanimate engine

FrameMotion's own engine, ported module by module from the open project [Reanimate](https://github.com/reanimate/reanimate) (a Haskell library for vector and maths animation, public domain, commit `583ee9f`) and the parts of its Haskell dependencies it relies on (svg-tree's printer and colours, cubicbezier's Bézier code, Text.XML.Light's printer, random and splitmix's generator; all BSD-3-Clause). No Haskell, LaTeX or external program is needed, every frame is a pure function of time on [the engine contract](../../../references/engine-contract.md), and it prints the same SVG as Reanimate for every ported example that has a golden file.

Registry id `reanimate` ([`engines.json`](../engines.json)). All five packs (the core; objects, colours and TeX text; map projections; mathematics; morphs, films and reel formats); see [packs](#packs).

## What it draws

Clean vector strokes on Reanimate's canvas: 16 × 9 units, origin in the centre, y pointing up, strokes 0.05 units wide. Shapes draw themselves along their outline (`partialSvg`, `drawInE`), move, fade, slide and swap through transitions, and scenes place sprites and variables on a timeline.

## Use it

```bash
node kit/render-engine.mjs --engine reanimate --params '{"example":"chainT"}' --frames all --out frames/
```

`example` is one of the 136 ported examples (the `enum` in the registry entry, for example `drawCircle`, `pathify`, `chainT`, `slideLeftT`, `spriteE`, `unVar`). Frame 0 of the drawing examples is blank by design (nothing drawn yet).

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

### Reel formats

| Format | `width` × `height` | `screen` |
| --- | --- | --- |
| 16:9 | 1920 × 1080 | [16, 9] |
| 9:16 (reel, story) | 1080 × 1920 | [9, 16] |
| 1:1 | 1080 × 1080 | [9, 9] |
| 4:5 (feed) | 1080 × 1350 | [9, 11.25] |

In code they are `R.REEL_FORMATS['9:16']` and so on. Reanimate's examples are drawn for 16 × 9; the page setting `fit` puts one on another format:

- `contain` shows all of it; the bands above and below take the film's own background colour, frame by frame.
- `safe` does the same inside the 9:16 safe area (`R.SAFE_AREAS`: below the top 10 %, above the bottom 20 %, where the platforms draw their buttons and captions); on other formats it is `contain`.
- `cover` fills the frame and crops the sides. On 9:16 only the middle 32 % of the width stays, so text near the edges (the projection labels of `map_projection_distortion`) and anything moved sideways (the sphere in `showcase`) leave the frame: use it only for drawings that sit in the middle.
- `none` (the default) keeps unit sizes, so a reel shows the middle 9 units.

In code: `R.fitScreenA(animation, screen, 'safe')`.

```bash
node kit/render-engine.mjs --engine reanimate --frames all --out frames/ \
  --params '{"example":"map_projection_distortion","width":1080,"height":1920,"fit":"contain"}'
```

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
| `Complex Double`, `mkStdGen`, `randomRs`, `Rational` | [`core/complex.mjs`](core/complex.mjs) (`[re, im]` pairs, GHC's formulas), [`core/random.mjs`](core/random.mjs) (random 1.2.0 over SplitMix, BigInt), [`core/rational.mjs`](core/rational.mjs) (`{n, d}` BigInt fractions in lowest terms; `toDouble` rounds to nearest, ties to even) |
| `balloon`, `toShapes`, `Polygon`, `pParent`, `atPartial`, `nmToColor` | [`core/balloon.mjs`](core/balloon.mjs), [`core/polyshape.mjs`](core/polyshape.mjs), [`core/polygon.mjs`](core/polygon.mjs), [`core/paths.mjs`](core/paths.mjs), [`core/colorspace.mjs`](core/colorspace.mjs); cubicbezier's curve functions in [`core/cubicbezier.mjs`](core/cubicbezier.mjs) |
| `morph linear src dst`, `rawLinear`, `rotationalTrajectory`, `oTransform`, `Morph` | [`core/morph.mjs`](core/morph.mjs): `R.morph(R.linear, src, dst)` gives `(t) => svg`; `s.oTransform(a, b, d)` |
| the showcase film's POV-Ray sphere | [`core/sphere.mjs`](core/sphere.mjs): `R.renderSphere({texture, rotY, rotX})` draws a textured orthographic sphere as an RGBA image; `R.sphereLines` places texture curves on it |
| `project smallEarth mollweideP`, `interpP`, `orthoP (LonLat 0 0)`, `applyProjection`, `loadFeatureCollection` | [`core/geoprojection.mjs`](core/geoprojection.mjs): `R.project(R.smallEarth(), R.mollweideP)` gives an RGBA image for `R.embedImageRGBA`; `R.interpP(src, p1, p2, t)`; `R.orthoP([lon, lat])` in radians; `R.drawFeatureCollection(geojson, fn)` takes parsed GeoJSON |

## Checked against Reanimate

- `tests/reanimate-core.test.mjs` renders 10 frames of each of the 78 examples that Reanimate ships a golden file for and that draw no TeX (`tests/fixtures/reanimate-golden/`, unchanged from the repository) and requires the SVG text to match byte for byte (embedded PNGs pixel for pixel). All 78 do. It also renders every one of the 136 examples at its pinned length and checks that no frame has NaN or undefined values (the four that compute with TeX outlines are checked to refuse clearly without a TeX renderer).
- All examples were also compared with Reanimate's documentation GIFs at 320 × 180 (frame i at i / 25 s); the results, including the three examples without a golden file, are in the 0.9.0 entry of the [changelog](../../../../../CHANGELOG.md).
- `arcLength` follows cubicbezier's `arcLengthEstimate` step by step, but no golden file draws an asymmetric curve in part, so agreement there is read from the source rather than measured.
- The 20 projection examples have no golden file. They were compared with Reanimate's documentation GIFs (0.7 to 2.0 grey levels of 255, the GIF palette and the anti-aliased edge of the map). `tests/reanimate-geo.test.mjs` then pins the pixels of each projected image: that is a regression test that keeps them from changing unnoticed, not a proof of agreement with Reanimate. It also checks the blends, the helpers and the GeoJSON path bending.
- The mathematics examples (`fourier`, `fourier_draw`, `tut_glue_fourier`, `demo_tangent`, `demo_stars`, `balloon`) have no golden file and only `balloon` has a documentation GIF: compared with it, the mean grey difference is 3.25 of 255 (the TeX font's outline and the GIF palette; the shape grows from the same corner at the same pace). `tests/reanimate-math.test.mjs` pins three frames of each as a regression test and checks the pieces against known values: SplitMix's documented `mkStdGen 137`, Bézier-clipping roots, shortest paths around a corner, exact rounding of fractions, holes cut into outlines.
- Morphs (`tests/reanimate-morph.test.mjs`): `linear`, `rawLinear` and `rotationalTrajectory` against Reanimate's documentation GIFs differ by a mean of about 8 grey levels of 255, 6.4 of it already on the still X (LaTeX's and MathJax's X are not the same outline); the other morphing examples have no golden file or GIF and were checked by eye. `bug_quad` (a morph of quadratic curves) matches its golden file byte for byte. Three frames of each are pinned as a regression test. `intro_canvas`, `intro_canvas_square` and `latex_basic` have golden files drawn with LaTeX; their grid, brackets and dot positions were compared by eye. `fe_morph` has no golden file and was checked by eye. Three frames of each of the four are pinned (`latex_basic`'s golden file shows LaTeX source as text: Reanimate's own test run had no LaTeX).
- The films have no golden file or GIF in Reanimate's repository. They were checked by eye on contact sheets and by tests of their parts.
- `smallEarth` is Reanimate's `data/small_earth.jpg` decoded once with Pillow (libjpeg) and kept as pixels in [`core/earth-data.mjs`](core/earth-data.mjs); Reanimate decodes it with JuicyPixels, whose rounding can differ by a level here and there.
- The page renders through the engine kit: frames repeat exactly and are not blank.

Not in this engine on purpose: Reanimate's POV-Ray and Blender bridges and its command line, which run external programs. The showcase film's POV-Ray sphere is drawn by [`core/sphere.mjs`](core/sphere.mjs) instead (orthographic, POV-Ray's spherical uv mapping, ambient light only as the film's script sets it, 160 pixels per unit like the film's render and 2 × 2 samples per pixel for its `+A` antialiasing; POV-Ray's gamma and the exact brightness of its ambient light are not modelled; the wire-frame is the outline of each texture line, where potrace would join crossing outlines). The map-projection film's `sizes.hs` is not ported: its globe is a Blender render. Reanimate's `latex` runs LaTeX and dvisvgm; here the engine page draws the same TeX with MathJax 3.2.2 (an npm dependency of the engines, Apache-2.0), whose TeX fonts are Computer Modern outlines: the letters match, but each glyph's outline starts at another point and some contours come in another order, so `oDraw` traces a letter along a different route. Outside the page (Node), `latex` falls back to `mkText`, as Reanimate does without LaTeX, unless MathJax is plugged in with `useMathJaxNode()` from [`tex-mathjax-node.mjs`](tex-mathjax-node.mjs) (same MathJax, same settings, same outlines as the page). `fourier_draw`, `tut_glue_fourier`, `demo_tangent` and `balloon` compute with glyph outlines (the π, the s, the X), so without a TeX renderer they stop with a message saying so instead of drawing nothing. TeX problems are reported, not drawn: a letter MathJax cannot draw (Polish ą, ę, ł, also ç and other cedilla or ogonek letters, emoji; MathJax 3.2.2 has no `\l`, `\k` or `\c` in text) stops `latex` with the letters named, as LaTeX stops (draw such text with `mkText`); ó, ś, ć, ń, ź, ż and other accented Latin letters are written as TeX accents and drawn; TeX errors, undefined commands and equation tags (`\tag`) throw MathJax's message; and without MathJax on the page a frame that draws TeX fails with install instructions. `mkText` is SVG text in the browser's fonts, so its frames depend on the fonts installed (the GIF comparison differs by about 1 grey level there).

The colour map `parula` is left out: it is MathWorks' design and its licence is unclear (the morphing examples that colour with it use `viridis`). `doc_githubIcon`, `doc_haskellLogo` and `doc_svgLogo` are not ported: they draw the GitHub, Haskell and SVG logos, which are those projects' marks; for the same reason the films' `EndScene` (the GitHub logo) and the showcase's `introSVG` (the SVG logo) are left out. Embedded PNGs (colour maps) are written uncompressed; Reanimate's are compressed by its zlib, so the tests compare their pixels, which are identical.

### Kept as Reanimate does it

These look odd but are the original's behaviour (checked in the sources at the pinned commits) and are kept so the drawings match:

- `pause(0)`, and so `chainT(tr, [])`, throws "Animation duration (0) is not positive", because Reanimate's `pause d = mkAnimation d …` checks `d > 0` (Haskell throws when the value is used, JavaScript at once).
- `mkColor('none')` is no paint; an unknown colour name is aliceblue.
- `boundingBox` knows paths, circles, ellipses, lines, rectangles, polylines, images and nested SVG; anything else (a polygon, text) has the box `[0, 0, 0, 0]`. A path's box is sampled from its drawn points: a curve counts its start, but the point a move goes to is not counted when a straight segment follows it (`M 0 0 L 2 1` has the box of the single point (2, 1)).
- `mapTree` walks into groups and definitions only; clip paths, masks and nested SVG are passed to the function whole.
- `oDraw` draws each glyph's outline 0.05 units wide inside the glyph's own transformations, so text scaled by 4 is traced with a 0.2-unit line. Reanimate's documentation GIF of `oDraw` (made in 2020, before LaTeX output had its transformations lowered) shows a thinner line; the code at the pinned commit draws it as here.
- `applyE` reads the animation at `frameAt(d * t)`, as `Reanimate.Effect.applyE` does.
- Map projections, as in Reanimate's code: `isValidP` is false for `mollweideP` (its theta comes from a 50001-step table) and `augustP` (a series); `lagrangeP`'s inverse puts its top edge at the out-of-range point (100, 100); `cylindricalEqualAreaP(phi0)` with `phi0` other than 0 divides by cos(phi0) twice, so its north pole lands above the frame (y = 1.33 for 30°); `bottomleyP` gives NaN at the north pole (0 / 0); `orthoP`'s inverse is NaN at the exact centre of the frame (rho = 0), which leaves that one pixel empty; `interpP` with `t` = NaN draws an empty image. The map examples stretch the 2:1 image over Reanimate's 16 × 9 screen; on a reel screen that picture is fitted whole and centred (FrameMotion's addition), so it keeps its proportions with empty space above and below.
- Films and morphs, as in Reanimate's code: `distortion.hs` draws its land outlines and graticule with stroke colours whose alpha is 0, which the SVG printer drops (they are drawn opaque grey); its sphere sprite in `showcase` waits for its 11-second animation before the effects are added, so the solid sphere shows from the start and the fade-in effects act at 11 to 14 s; `newSpriteA` stretches that animation over the whole 23-second sprite. `rawLinear` keeps each target outline's own starting point: Reanimate's `linear` computes the closest rotation and then serializes the unrotated points, so its `linear` draws as `rawLinear` (their GIFs are identical). One difference on purpose: here `linear` applies the rotation, because MathJax's outlines start at different corners from LaTeX's and the unrotated morph tangles.
- Where the original fails or prints NaN: `showcase_latex` folds from `pause 0`, which Reanimate's `mkAnimation` refuses, so the feature fails there; here the fold starts from no animation and its first step is the blank 0.2 s it means. A pole line in Bottomley's projection is 0 / 0: Reanimate prints `NaN` in the path, which draws nothing; the films leave the line out. LaTeX's `\degree` (gensymb) and the text-mode `\LaTeX` logo are math-mode macros in MathJax, so they are set as `$^\circ$` and in math.
- One difference on purpose: `applyProjection` throws for a latitude outside ±π/2 (usually GeoJSON still in degrees) where Reanimate would draw NaN.
- Mathematics, as in Reanimate's code: `fourier_draw`'s label sits so high (y = 3.94) that the top of "Circles" is cut by the frame; `tut_glue_fourier` rotates 5 times although its comment says 15; at the end of `tut_glue_fourier` only the red dot is left (the reversed second part shrinks the circles to nothing); `rotateFourier` gives a lone last coefficient a zero partner; `atPartial` fails when the point falls on a closing segment (Reanimate's `lineCommandToBezier` has no case for it); `balloon` draws the cut between an outline and its hole as a seam, and at t = 0 an outline is the single start point.
- Three differences on purpose: Reanimate triangulates polygons with the hgeometry library and this port by ear clipping. The shortest-path tree that `balloon` uses is the same on any correct triangulation, but an outline with a hole is joined to it by a cut and touches itself, so the ear test handles the cut's repeated points, coordinates within 1e-9 count as equal there, and the ears' areas must add up to the polygon's exactly (checked on "e", "8" and 64 other letters and digits: the same distances from every start). Zero-width hairs in an outline (MathJax's "8" has one) are dropped before balloon. And a path command with no points (`mkLinePathClosed` of one point writes `L` with nothing after it) ends the path data, which browsers draw the same way, instead of writing invalid SVG.
- The wavelength tables of `nmToColor` are Reanimate's `data/*.csv` (rows up to 700 nm, as Reanimate loads them). Reanimate names no source for them; they are tables from the Colour & Vision Research Laboratory (cvrl.org): the CIE 2012 2° colour-matching functions (`lin2012xyz2e_1_7sf.csv`), their chromaticity coordinates (`cc2012xyz2_1_5dp.csv`) and the Stockman & Sharpe 2° cone fundamentals (`linss2_10e_1.csv`). CVRL states no licence for them.
- Numbers print with six decimals and trailing zeros removed (svg-tree's `ppD`); a `NaN` prints as `NaN`, as in the original, so a broken computation shows up in the SVG text rather than being hidden.

## Packs

1. **Core (done):** SVG tree, paths and partial drawing, time, signals, effects, transitions, scenes, variables and sprites.
2. **Objects, colours and text (done):** objects and their animators (`oNew`, `oDraw`, `oGrow`, `oScaleIn`, `oScaleOut`, `oHideWith`, `signalO`), the camera, colour spaces, components and maps, TeX text through MathJax. `oTransform` (morphing one object into another) came with the morphs in pack 5.
3. **Map projections (done):** all 20 projections Reanimate has (augustP to wernerP; bonne, bottomley, the equal-area cylinder and the orthographic globe take a parameter), each redrawing Reanimate's `smallEarth` pixel by pixel, the blend between two projections (`interpP`, `interpBBP`, `mergeP`), the projection helpers (`scaleP`, `flipYAxisP`, `moveTopP`, `moveBottomP`, `isValidP`) and GeoJSON outlines bent by a projection (`renderGeometry`, `drawFeatureCollection`, `applyProjection`). The country and land data of the `map-projection` film is not in Reanimate's repository; it comes with that film in pack 5.
4. **Mathematics (done):** the Fourier series examples (`fourier`: a square wave from 1 to 100 circles; `fourier_draw` and `tut_glue_fourier`: the letter π drawn by up to 501 circles), `demo_tangent` (tangent and normal along the letter s), `demo_stars` (1000 stars from Haskell's own random numbers, with 10 fading trail frames) and `balloon` (shapes inflated from one point, on exact polygons and their shortest paths), plus `nmToColor` and the wavelength tables. `tangent_and_normal` is commented out in Reanimate (it needs the diagrams library) and is not ported.
5. **Morphs, films and reel formats (done):** shape morphing (`morph` with `linear`, `rawLinear` and `rotationalTrajectory`, point and object correspondences, colour blending in L*a*b*, the `Morph` object and `oTransform`) with Reanimate's 11 morphology examples; the remaining examples with golden files (`bug_play1`–`3`, `bug_quad`, `counter`, `goo` with SVG filters, `intro_hello`, `raster`, the canvas introduction, `latex_basic`, `fe_morph`); the `map-projection` film (`map_projection_gif`: country borders morphing through five projections, `map_projection_distortion`: 59 s through 17 projections with the Earth's picture, land outlines and labels; on the page the picture is Natural Earth II at 1280 × 640 (`data/earth-ne2-1280.jpg`, public domain; Reanimate uses a large `earth-extreme.jpg` it does not ship), or with `earth: "small"` Reanimate's 300 × 150 `smallEarth`, which Node uses too; at 1280 × 640 a frame takes about 1.5 s to draw, so the 59 s film renders in roughly 45 minutes at 30 fps; borders and land from Natural Earth, public domain, [`core/natural-earth-data.mjs`](core/natural-earth-data.mjs)) and the showcase film (`showcase`, `showcase_latex`); reel formats 9:16, 1:1 and 4:5 with `fit`.

Credits: `integrations/reanimate-haskell`, `reanimate-svg`, `cubicbezier-haskell`, `xml-light-haskell`, `linear-haskell`, `colour-haskell`, `random-haskell`, `splitmix-haskell` and `d3-scale-chromatic` and `natural-earth-vector` (licences and pins), the `mathjax` entry of `integrations/sources.json`, and `NOTICE`.
