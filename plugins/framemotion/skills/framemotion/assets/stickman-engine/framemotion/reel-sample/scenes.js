// FrameMotion's vertical cartoon reel sample for the Stickman engine (original FrameCore Works code, Apache-2.0).
// 11 set-ups of 2 to 4 s timed from the voice lines in film.json; uses framemotion/reel.js throughout:
// theme "cartoon", the "bighead" characters, sc.reelGround, sc.drift, sc.reelCaptions, sc.hit, sc.shadow, sc.reelLook.
const film = SM.film();

// Big heads: no lookAt (it bends the neck under a large head); turn the figure with face() instead.
// One recipe for every set-up: the raised ground, the moving camera, the captions and the frame look.
function shot(id, build, cam) {
  film.scene(id, sc => {
    sc.reelGround();
    build(sc);
    sc.drift(0, sc.dur, Object.assign({ x: sc.W * 0.5, y: sc.H * 0.5, push: 1.1, hold: 0 }, cam || {}));
    sc.reelCaptions();
    sc.reelLook();
  });
}
const chef = (sc, x, o) => { const f = sc.figure(Object.assign({ x, size: 600, character: "bighead", hat: "chef" }, o)); sc.shadow(f); f.blinks(0, sc.dur); return f; };
const kid = (sc, x, o) => { const f = sc.figure(Object.assign({ x, size: 470, character: "bigheadCap" }, o)); sc.shadow(f); f.blinks(0, sc.dur); return f; };
const chest = (sc, f) => sc.groundY - f.H * 0.42;

// 1. Hook: in action on frame 1, the kid runs in with a kernel that ticks like a bomb.
shot("hook", sc => {
  const k = kid(sc, -200);
  k.runTo(sc.W * 0.36, 0, { d: 0.9 });
  const kernel = sc.prop("popcorn", { x: sc.W * 0.7, y: sc.groundY - 210, size: 260, hidden: true });
  sc.shadow(kernel, { x: sc.W * 0.7, w: 170 });
  kernel.pop(0.5); kernel.wobble(1.0, 1.0, 8);
  const bomb = sc.prop("bomb", { x: sc.W * 0.7, y: sc.groundY - 520, size: 170, hidden: true });
  bomb.pop(sc.cue("bomb") - 0.1);
  k.surprise(sc.cue("bomb"));
});

// 2. The common belief: the chef shrugs over a flame.
shot("belief", sc => {
  const c = chef(sc, sc.W * 0.3);
  const fire = sc.prop("fire", { x: sc.W * 0.72, y: sc.groundY - 150, size: 280 });
  fire.wobble(0, sc.dur, 5);
  c.shrug(sc.cue("cooks") - 0.2);
});

// 3. The turn on "but": a whip to a giant kernel, a water drop appears inside.
shot("turn", sc => {
  sc.camera.whip(sc.W * 0.5, sc.H * 0.5, 0, 0.4);
  const kernel = sc.prop("popcorn", { x: sc.W * 0.5, y: sc.groundY - 330, size: 520 });
  sc.shadow(kernel, { x: sc.W * 0.5, w: 330 });
  const drop = sc.prop("drop", { x: sc.W * 0.5, y: sc.groundY - 380, size: 150, hidden: true });
  drop.pop(sc.cue("drop") - 0.05);
  sc.fx.emphasis(sc.W * 0.5, sc.groundY - 380, sc.cue("water"));
}, { push: 1.14, hold: 0.6 });

// 4. Heat turns water into steam: flame under the kernel, puffs rise.
shot("steam", sc => {
  const fire = sc.prop("fire", { x: sc.W * 0.5, y: sc.groundY - 120, size: 300, hidden: true });
  fire.pop(0.05); fire.wobble(0.3, sc.dur, 6);
  const kernel = sc.prop("popcorn", { x: sc.W * 0.5, y: sc.groundY - 420, size: 380 });
  kernel.shake(sc.cue("steam"), 0.6, 6);
  sc.fx.puff(sc.W * 0.5, sc.groundY - 600, sc.cue("steam"));
  sc.fx.puff(sc.W * 0.44, sc.groundY - 640, sc.cue("steam") + 0.3);
});

// 5. Nowhere to go: the kid looks for a way out, sweating.
shot("trapped", sc => {
  const k = kid(sc, sc.W * 0.5);
  k.face(-1, 0.3);
  k.face(1, sc.cue("nowhere"));
  sc.fx.sweat(k.headPos().x + 60, k.headPos().y, sc.cue("go"));
  k.emote("worried", sc.cue("nowhere"));
}, { push: 1.12 });

// 6. The hard shell: the chef knocks on a shield, it holds.
shot("shell", sc => {
  const c = chef(sc, sc.W * 0.28);
  const shield = sc.prop("shield", { x: sc.W * 0.7, y: chest(sc, c), size: 300 });
  c.tap(sc.W * 0.62, chest(sc, c), sc.cue("hard") - 0.1);
  shield.shake(sc.cue("holds"), 0.3, 8);
  c.nod(sc.cue("holds") + 0.2, 2);
});

// 7. Pressure climbs: a gauge-like chart and a growing kernel.
shot("pressure", sc => {
  const kernel = sc.prop("popcorn", { x: sc.W * 0.36, y: sc.groundY - 260, size: 300 });
  kernel.scaleTo(1.35, 0.2, sc.dur - 0.4, "power2.in");
  kernel.shake(sc.dur - 1.2, 1.0, 10);
  const up = sc.prop("chartup", { x: sc.W * 0.74, y: sc.groundY - 330, size: 260, hidden: true });
  up.pop(sc.cue("climbs"));
  up.pulse(sc.cue("higher"), 1.15, 0.3);
}, { push: 1.16 });

// 8. The burst: the impact (burst, shake and flash) on "gives".
shot("burst", sc => {
  const kernel = sc.prop("popcorn", { x: sc.W * 0.5, y: sc.groundY - 330, size: 420 });
  kernel.shake(0, sc.cue("gives"), 6);
  kernel.popOut(sc.cue("gives"), 0.15);
  sc.hit(sc.W * 0.5, sc.groundY - 330, sc.cue("gives"));
  sc.fx.confetti(sc.W * 0.5, sc.groundY - 400, sc.cue("gives") + 0.05);
  const popped = sc.prop("popcorn", { x: sc.W * 0.5, y: sc.groundY - 360, size: 560, hidden: true });
  popped.pop(sc.cue("gives") + 0.12, 0.3);
});

// 9. The mechanism (the longest set-up): starch foams and the kernel flips inside out.
shot("mechanism", sc => {
  const k = kid(sc, sc.W * 0.2);
  const shell = sc.prop("popcorn", { x: sc.W * 0.62, y: sc.groundY - 280, size: 260 });
  shell.scaleTo(1.6, sc.cue("puffs"), 0.5, "back.out(2)");
  sc.fx.puff(sc.W * 0.62, sc.groundY - 300, sc.cue("foam"));
  shell.spin(sc.cue("flips"), 0.6, 1);
  sc.fx.sparkle(sc.W * 0.62, sc.groundY - 420, sc.cue("inside") + 0.2);
  k.surprise(sc.cue("flips") + 0.1);
}, { push: 1.1, hold: 0.8 });

// 10. Dry kernels barely pop: a small hop and a disappointed chef.
shot("dry", sc => {
  const c = chef(sc, sc.W * 0.3);
  const old = sc.prop("popcorn", { x: sc.W * 0.72, y: sc.groundY - 110, size: 180 });
  old.arcTo(sc.W * 0.72, sc.groundY - 110, sc.cue("barely"), 0.4, 40);
  c.facepalm(sc.cue("barely") + 0.3);
});

// 11. Payoff: both cheer as a full bucket lands with an impact.
shot("payoff", sc => {
  const c = chef(sc, sc.W * 0.24);
  const k = kid(sc, sc.W * 0.78, { facing: -1 });
  const bucket = sc.prop("popcorn", { x: sc.W * 0.51, y: sc.groundY - 230, size: 300, hidden: true });
  bucket.dropIn(sc.cue("tiny") - 0.25, 0.25);
  sc.hit(sc.W * 0.51, sc.groundY - 230, sc.cue("bomb"), { flash: 0.4 });
  c.cheer(sc.cue("bomb") + 0.1); k.celebrate(sc.cue("bomb") + 0.15);
}, { hold: 0.8 });
