# Reanimate engine

FrameMotion's own engine inspired by the open project [Reanimate](https://github.com/reanimate/reanimate) (a Haskell library for vector and maths animation, public domain, commit `583ee9f`). It is a line-by-line JavaScript rewrite: no Haskell, LaTeX or external program is needed, every frame is a pure function of time on [the engine contract](../../../references/engine-contract.md), and it prints the same SVG as Reanimate for every ported example.

Registry id `reanimate` ([`engines.json`](../engines.json)). Pack 1 of 5 (the core); see [what comes next](#packs).

## What it draws

Clean vector strokes on Reanimate's canvas: 16 × 9 units, origin in the centre, y pointing up, strokes 0.05 units wide. Shapes draw themselves along their outline (`partialSvg`, `drawInE`), move, fade, slide and swap through transitions, and scenes place sprites and variables on a timeline.

## Use it

```bash
node kit/render-engine.mjs --engine reanimate --params '{"example":"chainT"}' --frames all --out frames/
```

`example` is one of the 57 ported documentation examples (the `enum` in the registry entry, for example `drawCircle`, `pathify`, `chainT`, `slideLeftT`, `spriteE`, `unVar`). Frame 0 of the drawing examples is blank by design (nothing drawn yet).

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

`screen` is FrameMotion's one addition: the canvas in units, so `[9, 16]` gives a vertical reel without stretching. Reanimate itself always uses `[16, 9]`.

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

## Checked against Reanimate

- `tests/reanimate-engine.test.mjs` renders 10 frames of each of the 54 examples that Reanimate ships a golden file for (`tests/fixtures/reanimate-golden/`, unchanged from the repository) and requires the SVG text to match byte for byte. All 54 do.
- The three examples without a golden file (`powerS`, `signalS`, `spriteScope`) were compared with Reanimate's documentation GIFs at 320 × 180, as were all the others; see the pack's QA note in the changelog.
- The page renders through the engine kit: frames repeat exactly and are not blank.

Not in this engine on purpose: Reanimate's LaTeX, POV-Ray and Blender bridges and its command line, which run external programs. Text is SVG text in the browser's fonts.

## Packs

1. **Core (this pack):** SVG tree, paths and partial drawing, time, signals, effects, transitions, scenes, variables and sprites.
2. Objects (`oNew`, `oDraw`, `oGrow`, `oScaleIn`, `oHideWith`), colour maps and the remaining drawing helpers.
3. Maps: GeoJSON land outlines, the 25 map projections and morphs between them.
4. Maths: Fourier drawing, tangents, stars and the other larger examples.
5. Films: `map-projection` and the showcase, then shape morphing; reel formats.

Credits: [integrations/reanimate-haskell](../../../../../integrations/reanimate-haskell/source-manifest.json) and [integrations/reanimate-svg](../../../../../integrations/reanimate-svg/source-manifest.json), and `NOTICE`.
