// FrameMotion's vertical cartoon reel sample for the Stickman engine (original FrameCore Works code, Apache-2.0).
// Uses framemotion/reel.js: theme "cartoon", the "bighead" character, sc.drift and sc.reelCaptions.
const film = SM.film();

film.scene("hook", sc => {
  sc.env.clouds({ n: 3 });
  sc.ground({ style: "grass" });
  const baker = sc.figure({ x: sc.W * 0.42, size: 520, character: "bighead", hat: "chef" });
  baker.blinks(0, sc.dur);
  const kernel = sc.prop("popcorn", { x: sc.W * 0.68, y: sc.groundY - 520, size: 220, hidden: true });
  kernel.pop(sc.cue("kernel") - 0.1);
  baker.point(sc.W * 0.68, sc.groundY - 520, sc.cue("kernel"));
  baker.emote("surprised", sc.cue("pressure"));
  sc.drift(0, sc.dur, { x: sc.W * 0.55, y: sc.H * 0.5, push: 1.08 });
  sc.reelCaptions();
});

film.scene("turn", sc => {
  sc.ground();
  const water = sc.prop("drop", { x: sc.W * 0.62, y: sc.groundY - 640, size: 200, hidden: true });
  const heat = sc.prop("fire", { x: sc.W * 0.62, y: sc.groundY - 220, size: 300, hidden: true });
  const baker = sc.figure({ x: sc.W * 0.24, size: 460, character: "bighead", hat: "chef" });
  water.pop(sc.cue("water"));
  heat.pop(sc.cue("heat"));
  baker.think(sc.cue("drop"), 1.2);
  sc.fx.puff(sc.W * 0.62, sc.groundY - 640, sc.cue("steam"));
  sc.camera.whip(sc.W * 0.5, sc.H * 0.55, 0, 0.45);
  sc.drift(0.45, sc.dur, { x: sc.W * 0.5, y: sc.H * 0.55, push: 1.1 });
  sc.reelCaptions();
});

film.scene("payoff", sc => {
  sc.ground({ style: "grass" });
  const baker = sc.figure({ x: sc.W * 0.36, size: 520, character: "bighead", hat: "chef" });
  const kernel = sc.prop("popcorn", { x: sc.W * 0.68, y: sc.groundY - 300, size: 260 });
  sc.fx.burst(sc.W * 0.68, sc.groundY - 360, sc.cue("bursts"));
  sc.camera.shake(sc.cue("bursts"), 0.35, 10);
  kernel.spin(sc.cue("flips"), 0.6, 1);
  baker.celebrate(sc.cue("inside"));
  sc.drift(0, sc.dur, { x: sc.W * 0.52, y: sc.H * 0.52, push: 1.06 });
  sc.reelCaptions();
});
