// Reanimate's documentation examples for objects (Reanimate.Scene.Object), ported from the doc_*.hs
// files of reanimate/reanimate (public domain, commit 583ee9f). Each entry returns an Animation.

import * as R from '../core/index.mjs';

const doc = (make) => () => R.docEnv(make());

export const OBJECT_EXAMPLES = {
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
