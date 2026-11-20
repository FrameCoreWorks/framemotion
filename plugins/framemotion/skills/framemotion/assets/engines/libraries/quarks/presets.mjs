// Ready effects for the three.quarks engine (ours, MIT like FrameMotion). Each preset returns the
// ParticleSystem settings and behaviours for one effect, built from three.quarks' own classes.
// Units: the camera sees about 40 units of height at the emitter; `k` scales sizes and speeds.
export function makePresets(Q, THREE, texture, puff = texture) {
  const {ConstantValue, IntervalValue, ConstantColor, Vector4, Vector3, Gradient, ColorOverLife, SizeOverLife,
    PiecewiseBezier, Bezier, ConeEmitter, SphereEmitter, CircleEmitter, ApplyForce, Noise, OrbitOverLife,
    RotationOverLife, RenderMode} = Q;
  const mat = (blending, map = texture) => new THREE.MeshBasicMaterial({map, blending, transparent: true, depthWrite: false, side: THREE.DoubleSide});
  const grad = (stops, alpha) => new Gradient(stops.map(([r, g, b, at]) => [new Vector3(r, g, b), at]), alpha);
  const curve = (a, b, c, d) => new PiecewiseBezier([[new Bezier(a, b, c, d), 0]]);
  return {
    fire: (k) => [{
      system: {duration: 1, looping: true, startLife: new IntervalValue(0.8, 1.6), startSpeed: new IntervalValue(8 * k, 14 * k),
        startSize: new IntervalValue(3 * k, 6 * k), startColor: new ConstantColor(new Vector4(1, 1, 1, 0.55)), worldSpace: true,
        maxParticle: 400, emissionOverTime: new ConstantValue(60), shape: new ConeEmitter({radius: 2.5 * k, angle: 0.12}),
        material: mat(THREE.AdditiveBlending), renderMode: RenderMode.BillBoard},
      behaviours: [new ColorOverLife(grad([[1, 0.85, 0.45, 0], [1, 0.45, 0.08, 0.3], [0.75, 0.1, 0.03, 0.7], [0.15, 0.02, 0.01, 1]], [[0.8, 0], [0.6, 0.4], [0, 1]])),
        new SizeOverLife(curve(0.7, 1, 0.7, 0.15)), new Noise(new ConstantValue(1.6), new ConstantValue(2.5 * k)),
        new RotationOverLife(new IntervalValue(-1.5, 1.5))],
      at: [0, -14 * k, 0]}],
    smoke: (k) => [{
      system: {duration: 1, looping: true, startLife: new IntervalValue(2.5, 4), startSpeed: new IntervalValue(3 * k, 5 * k),
        startSize: new IntervalValue(5 * k, 8 * k), startColor: new ConstantColor(new Vector4(0.7, 0.7, 0.74, 0.35)), worldSpace: true,
        maxParticle: 300, emissionOverTime: new ConstantValue(18), shape: new ConeEmitter({radius: 3 * k, angle: 0.3}),
        material: mat(THREE.NormalBlending, puff), renderMode: RenderMode.BillBoard},
      behaviours: [new ColorOverLife(grad([[1, 1, 1, 0], [1, 1, 1, 1]], [[0, 0], [1, 0.15], [0, 1]])),
        new SizeOverLife(curve(0.6, 1.2, 1.8, 2.4)), new Noise(new ConstantValue(0.5), new ConstantValue(2 * k)),
        new RotationOverLife(new IntervalValue(-0.5, 0.5)), new ApplyForce(new Vector3(1, 0, 0), new ConstantValue(1.5 * k))],
      at: [0, -16 * k, 0]}],
    sparks: (k) => [{
      system: {duration: 1.5, looping: true, startLife: new IntervalValue(0.8, 1.6), startSpeed: new IntervalValue(18 * k, 32 * k),
        startSize: new IntervalValue(0.5 * k, 1.1 * k), startColor: new ConstantColor(new Vector4(1, 0.85, 0.45, 1)), worldSpace: true,
        maxParticle: 600, emissionOverTime: new ConstantValue(0),
        emissionBursts: [{time: 0, count: new ConstantValue(160), cycle: 1, interval: 0.01, probability: 1}],
        shape: new SphereEmitter({radius: 0.5 * k}), material: mat(THREE.AdditiveBlending),
        renderMode: RenderMode.StretchedBillBoard, speedFactor: 0.06},
      behaviours: [new ApplyForce(new Vector3(0, -1, 0), new ConstantValue(30 * k)),
        new ColorOverLife(grad([[1, 1, 0.8, 0], [1, 0.6, 0.2, 0.6], [0.9, 0.2, 0.05, 1]], [[1, 0], [1, 0.7], [0, 1]]))],
      at: [0, 4 * k, 0]}],
    magic: (k) => [{
      system: {duration: 1, looping: true, startLife: new IntervalValue(1.5, 2.5), startSpeed: new IntervalValue(1 * k, 3 * k),
        startSize: new IntervalValue(1 * k, 2.5 * k), startColor: new ConstantColor(new Vector4(1, 1, 1, 1)), worldSpace: false,
        maxParticle: 500, emissionOverTime: new ConstantValue(110), shape: new CircleEmitter({radius: 10 * k, thickness: 0.15}),
        material: mat(THREE.AdditiveBlending), renderMode: RenderMode.BillBoard},
      behaviours: [new OrbitOverLife(new ConstantValue(2.2)), new SizeOverLife(curve(0.2, 1, 1, 0)),
        new ColorOverLife(grad([[0.75, 0.55, 1, 0], [0.35, 0.85, 1, 0.5], [1, 0.6, 0.95, 1]], [[0, 0], [1, 0.2], [0, 1]])),
        new ApplyForce(new Vector3(0, 1, 0), new ConstantValue(2 * k))],
      at: [0, 0, 0], facing: true}],
  };
}
