// Reanimate's map-projection examples (examples/doc_*P.hs at commit 583ee9f): smallEarth redrawn in
// each projection and stretched over Reanimate's 16 x 9 screen, one still frame for one second.
// On another screen (a [9, 16] reel) that 16 x 9 picture is scaled to fit whole, centred, so the
// map keeps Reanimate's proportions instead of being cropped or stretched.
import * as R from '../core/index.mjs';

// These examples call `reanimate` directly, without docEnv.
const still = (p) => ({screen = [R.SCREEN_WIDTH, R.SCREEN_HEIGHT]} = {}) => {
  const k = Math.min(screen[0] / R.SCREEN_WIDTH, screen[1] / R.SCREEN_HEIGHT);
  const map = R.scaleToSize(R.SCREEN_WIDTH, R.SCREEN_HEIGHT, R.embedImageRGBA(R.project(R.smallEarth(), p())));
  const svg = k === 1 ? map : R.scale(k, map);
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
