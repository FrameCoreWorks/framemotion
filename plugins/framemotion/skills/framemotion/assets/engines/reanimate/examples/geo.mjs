// Reanimate's map-projection examples (examples/doc_*P.hs at commit 583ee9f): smallEarth redrawn in
// each projection and stretched over the screen, one still frame for one second.
import * as R from '../core/index.mjs';

// These examples call `reanimate` directly, without docEnv.
const still = (p) => () => {
  const svg = R.scaleToSize(R.SCREEN_WIDTH, R.SCREEN_HEIGHT, R.embedImageRGBA(R.project(R.smallEarth(), p())));
  return R.animate(() => svg);
};
const deg = (d) => d / 180 * Math.PI;

export const GEO_EXAMPLES = {
  augustP: still(() => R.augustP),
  bonneP: still(() => R.bonneP(deg(45))),
  bottomleyP: still(() => R.bottomleyP(deg(30))),
  cassiniP: still(() => R.cassiniP),
  collignonP: still(() => R.collignonP),
  cylindricalEqualAreaP: still(() => R.cylindricalEqualAreaP(0)),
  eckert1P: still(() => R.eckert1P),
  eckert3P: still(() => R.eckert3P),
  eckert5P: still(() => R.eckert5P),
  equirectangularP: still(() => R.equirectangularP),
  faheyP: still(() => R.faheyP),
  foucautP: still(() => R.foucautP),
  hammerP: still(() => R.hammerP),
  lagrangeP: still(() => R.lagrangeP),
  lambertP: still(() => R.lambertP),
  mercatorP: still(() => R.mercatorP),
  mollweideP: still(() => R.mollweideP),
  orthoP: still(() => R.orthoP([0, 0])),
  sinusoidalP: still(() => R.sinusoidalP),
  wernerP: still(() => R.wernerP),
};
