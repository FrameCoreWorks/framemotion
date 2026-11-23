// Reanimate's documentation examples for objects (Reanimate.Scene.Object), ported from the doc_*.hs
// files of reanimate/reanimate (public domain, commit 583ee9f). Each entry returns an Animation.

import * as R from '../core/index.mjs';

const doc = (make) => () => R.docEnv(make());
/** The documentation's text objects: filled glyphs without outline, centred and scaled. */
const word = (s, text, k) => s.oNew(R.withStrokeWidth(0, R.withFillOpacity(1, R.center(R.scale(k, R.latex(text))))));

export const OBJECT_EXAMPLES = {
  // Animators on LaTeX text (drawn with MathJax on the engine page)
  oDraw: doc(() => R.scene((s) => {
    const txt = word(s, 'oDraw', 4);
    s.oSet(txt, 'easing', (t) => t);
    s.oShowWith(txt, R.oDraw);
    s.wait(1);
    s.oHideWith(txt, R.oFadeOut);
  })),
  oGrow: doc(() => R.scene((s) => {
    const txt = word(s, 'oGrow', 3);
    s.oShowWith(txt, R.oGrow);
    s.wait(1); s.oHideWith(txt, R.oFadeOut);
  })),
  oHideWith: doc(() => R.scene((s) => {
    const txt = word(s, 'oScaleIn', 3);
    s.oShowWith(txt, R.oFadeIn);
  })),
  oScaleIn: doc(() => R.scene((s) => {
    const txt = word(s, 'oScaleIn', 3);
    s.oShowWith(txt, (svg) => R.adjustDuration((d) => d * 2, R.oScaleIn(svg)));
    s.wait(1); s.oHideWith(txt, R.oFadeOut);
  })),
  oScaleOut: doc(() => R.scene((s) => {
    const txt = word(s, 'oScaleOut', 3);
    s.oShowWith(txt, R.oFadeIn);
    s.oHideWith(txt, (svg) => R.adjustDuration((d) => d * 2, R.oScaleOut(svg)));
  })),
  latex: doc(() => R.animate(() => R.withStrokeWidth(0, R.withFillOpacity(1, R.scale(3, R.center(R.latex('$e^{i\\pi}+1=0$'))))))),
  latexAlign: doc(() => R.animate(() => R.withStrokeWidth(0, R.withFillOpacity(1, R.scale(3, R.center(R.latexAlign('R = \\frac{{\\Delta x}}{{kA}}'))))))),

  signalO: doc(() => R.scene((s) => {
    const objs = s.waitOn((w) => [0, 1, 2].map(() => w.run((r) => {
      const obj = r.newObject(R.mkCircle(1));
      r.oSet(obj, 'easing', (t) => t);
      r.oSet(obj, 'rightX', R.SCREEN_RIGHT);
      r.fork((f) => f.oShowWith(obj, R.oFadeIn));
      r.fork((f) => f.oTween(obj, 2, (t, d) => R.oOver(d, 'leftX', (origin) => R.fromToS(origin, R.SCREEN_LEFT)(t))));
      r.wait(1);
      r.oHideWith(obj, R.oFadeOut);
      r.wait(-1.5);
      return obj;
    })));
    const dur = s.queryNow();
    s.wait(-dur);
    for (const obj of objs) s.signalO(obj, dur, R.curveS(2));
  })),
  cameraAttach: doc(() => R.scene((s) => {
    const cam = s.newObject(new R.Camera());
    const circ = s.newObject(new R.Circle(2));
    s.oSet(circ, 'context', (svg) => R.withFillOpacity(1, R.withFillColor('blue', svg)));
    s.oShow(circ);
    s.cameraAttach(cam, circ);
    s.cameraZoom(cam, 2, 2);
    s.cameraZoom(cam, 2, 1);
  })),
  cameraFocus: doc(() => R.scene((s) => {
    const cam = s.newObject(new R.Camera());
    const circ = s.newObject(new R.Circle(2)); s.oShow(circ);
    s.oSet(circ, 'translate', [-3, 0]);
    const box = s.newObject(new R.Rectangle(4, 4)); s.oShow(box);
    s.oSet(box, 'translate', [3, 0]);
    s.cameraAttach(cam, circ);
    s.cameraAttach(cam, box);
    s.cameraFocus(cam, [-3, 0]);
    s.cameraZoom(cam, 2, 2);
    s.cameraZoom(cam, 2, 1);
    s.cameraFocus(cam, [3, 0]);
    s.cameraZoom(cam, 2, 2);
    s.cameraZoom(cam, 2, 1);
  })),
};
