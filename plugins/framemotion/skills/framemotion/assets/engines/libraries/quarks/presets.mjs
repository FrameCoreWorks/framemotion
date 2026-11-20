// Ready effects for the three.quarks engine (ours, MIT like FrameMotion). Each preset returns layered
// ParticleSystem settings built from three.quarks' own classes, plus the colour of the light it casts on the
// stage. Units: the camera sees about 50 units of height at the emitter; `k` scales sizes and speeds.
export function makePresets(Q, THREE, tex) {
  const {ConstantValue, IntervalValue, ConstantColor, Vector4, Vector3, Gradient, ColorOverLife, SizeOverLife,
    PiecewiseBezier, Bezier, ConeEmitter, SphereEmitter, CircleEmitter, ApplyForce, Noise, OrbitOverLife,
    RotationOverLife, RenderMode} = Q;
  const mat = (blending, map = tex.dot) => new THREE.MeshBasicMaterial({map, blending, transparent: true, depthWrite: false, side: THREE.DoubleSide});
  const add = THREE.AdditiveBlending, normal = THREE.NormalBlending;
  const grad = (stops, alpha) => new Gradient(stops.map(([r, g, b, at]) => [new Vector3(r, g, b), at]), alpha);
  const curve = (a, b, c, d) => new PiecewiseBezier([[new Bezier(a, b, c, d), 0]]);
  const iv = (a, b) => new IntervalValue(a, b), cv = v => new ConstantValue(v);
  const white = a => new ConstantColor(new Vector4(1, 1, 1, a));
  const base = {duration: 1, looping: true, worldSpace: true, renderMode: RenderMode.BillBoard};

  // fire: a wide glow, a hot core, flame tongues stretched upward, embers that rise and drift, faint smoke on top
  const fire = (k) => {
    const y = -16 * k;
    return [
      {system: {...base, startLife: iv(0.5, 0.8), startSpeed: iv(1 * k, 2 * k), startSize: iv(26 * k, 34 * k), startColor: white(0.12),
        maxParticle: 30, emissionOverTime: cv(10), shape: new SphereEmitter({radius: 1 * k}), material: mat(add)},
       behaviours: [new ColorOverLife(grad([[1, 0.55, 0.15, 0], [1, 0.35, 0.05, 1]], [[0, 0], [1, 0.4], [0, 1]]))], at: [0, y + 5 * k, 0]},
      {system: {...base, startLife: iv(0.3, 0.55), startSpeed: iv(5 * k, 9 * k), startSize: iv(2.5 * k, 4 * k), startColor: white(0.28),
        maxParticle: 300, emissionOverTime: cv(45), shape: new ConeEmitter({radius: 2.2 * k, angle: 0.15}), material: mat(add)},
       behaviours: [new ColorOverLife(grad([[1, 0.9, 0.62, 0], [1, 0.62, 0.2, 0.5], [1, 0.35, 0.06, 1]], [[1, 0], [0.8, 0.6], [0, 1]])),
         new SizeOverLife(curve(1, 0.9, 0.6, 0.2))], at: [0, y, 0]},
      {system: {...base, startLife: iv(0.7, 1.3), startSpeed: iv(11 * k, 18 * k), startSize: iv(3 * k, 5.5 * k), startColor: white(0.42),
        maxParticle: 500, emissionOverTime: cv(120), shape: new ConeEmitter({radius: 3.4 * k, angle: 0.1}), material: mat(add),
        renderMode: RenderMode.StretchedBillBoard, speedFactor: 0.16},
       behaviours: [new ColorOverLife(grad([[1, 0.8, 0.35, 0], [1, 0.42, 0.06, 0.35], [0.8, 0.12, 0.03, 0.75], [0.2, 0.03, 0.01, 1]], [[0.9, 0], [0.7, 0.45], [0, 1]])),
         new SizeOverLife(curve(0.8, 1, 0.65, 0.1)), new Noise(cv(2.2), cv(4 * k))], at: [0, y, 0]},
      {system: {...base, startLife: iv(1.6, 3.2), startSpeed: iv(8 * k, 16 * k), startSize: iv(0.35 * k, 0.75 * k), startColor: new ConstantColor(new Vector4(1, 0.7, 0.3, 1)),
        maxParticle: 200, emissionOverTime: cv(28), shape: new ConeEmitter({radius: 3 * k, angle: 0.35}), material: mat(add),
        renderMode: RenderMode.StretchedBillBoard, speedFactor: 0.05},
       behaviours: [new Noise(cv(1.2), cv(9 * k)), new ApplyForce(new Vector3(0, -1, 0), cv(2 * k)),
         new ColorOverLife(grad([[1, 0.85, 0.5, 0], [1, 0.4, 0.1, 0.6], [0.6, 0.1, 0.02, 1]], [[1, 0], [1, 0.75], [0, 1]]))], at: [0, y + 2 * k, 0]},
      {system: {...base, startLife: iv(2.5, 3.5), startSpeed: iv(4 * k, 6 * k), startSize: iv(5 * k, 8 * k), startColor: new ConstantColor(new Vector4(0.42, 0.38, 0.36, 0.14)),
        maxParticle: 120, emissionOverTime: cv(10), shape: new ConeEmitter({radius: 2 * k, angle: 0.12}), material: mat(normal, tex.puff)},
       behaviours: [new ColorOverLife(grad([[1, 1, 1, 0], [1, 1, 1, 1]], [[0, 0], [1, 0.3], [0, 1]])), new SizeOverLife(curve(0.6, 1.1, 1.6, 2.1)),
         new Noise(cv(0.5), cv(2 * k)), new RotationOverLife(iv(-0.4, 0.4))], at: [0, y + 18 * k, 0]},
    ];
  };

  // smoke: a dense column lit warm from below (by an unseen fire) that cools to grey, and a lighter drift above
  const smoke = (k) => {
    const y = -20 * k;
    return [
      {system: {...base, startLife: iv(3, 4.5), startSpeed: iv(4 * k, 6 * k), startSize: iv(7 * k, 11 * k), startColor: white(0.55),
        maxParticle: 260, emissionOverTime: cv(24), shape: new ConeEmitter({radius: 3.5 * k, angle: 0.22}), material: mat(normal, tex.puff)},
       behaviours: [new ColorOverLife(grad([[0.85, 0.6, 0.45, 0], [0.55, 0.5, 0.5, 0.35], [0.42, 0.42, 0.45, 1]], [[0, 0], [0.7, 0.3], [0.8, 0.6], [0, 1]])),
         new SizeOverLife(curve(0.9, 1.5, 2.2, 2.9)), new Noise(cv(0.45), cv(2.5 * k)), new RotationOverLife(iv(-0.35, 0.35)),
         new ApplyForce(new Vector3(1, 0, 0.3), cv(1.6 * k))], at: [0, y, 0]},
      {system: {...base, startLife: iv(3, 4), startSpeed: iv(3 * k, 4 * k), startSize: iv(10 * k, 14 * k), startColor: white(0.25),
        maxParticle: 120, emissionOverTime: cv(9), shape: new ConeEmitter({radius: 5 * k, angle: 0.3}), material: mat(normal, tex.puff)},
       behaviours: [new ColorOverLife(grad([[0.78, 0.78, 0.82, 0], [0.62, 0.62, 0.66, 1]], [[0, 0], [1, 0.3], [0, 1]])),
         new SizeOverLife(curve(0.8, 1.5, 2.2, 3)), new Noise(cv(0.3), cv(2 * k)), new RotationOverLife(iv(-0.25, 0.25)),
         new ApplyForce(new Vector3(1, 0, 0.3), cv(2.2 * k))], at: [0, y + 10 * k, 0]},
    ];
  };

  // sparks: a burst on a sphere that falls under gravity, with a short flash at the centre
  const sparks = (k) => [
    {system: {...base, duration: 2, startLife: iv(0.9, 1.8), startSpeed: iv(18 * k, 34 * k), startSize: iv(0.5 * k, 1.1 * k),
      startColor: new ConstantColor(new Vector4(1, 0.85, 0.45, 1)), maxParticle: 600, emissionOverTime: cv(0),
      emissionBursts: [{time: 0, count: cv(200), cycle: 1, interval: 0.01, probability: 1}],
      shape: new SphereEmitter({radius: 0.5 * k}), material: mat(add), renderMode: RenderMode.StretchedBillBoard, speedFactor: 0.06},
     behaviours: [new ApplyForce(new Vector3(0, -1, 0), cv(30 * k)),
       new ColorOverLife(grad([[1, 1, 0.8, 0], [1, 0.6, 0.2, 0.6], [0.9, 0.2, 0.05, 1]], [[1, 0], [1, 0.7], [0, 1]]))], at: [0, 4 * k, 0]},
    {system: {...base, duration: 2, startLife: iv(0.25, 0.35), startSpeed: cv(0), startSize: iv(18 * k, 22 * k), startColor: white(0.8),
      maxParticle: 4, emissionOverTime: cv(0), emissionBursts: [{time: 0, count: cv(1), cycle: 1, interval: 0.01, probability: 1}],
      shape: new SphereEmitter({radius: 0.1}), material: mat(add)},
     behaviours: [new ColorOverLife(grad([[1, 0.9, 0.6, 0], [1, 0.5, 0.15, 1]], [[1, 0], [0, 1]])), new SizeOverLife(curve(0.6, 1, 1.1, 1.2))], at: [0, 4 * k, 0]},
  ];

  // magic: motes born on a ring lying flat in the scene, orbiting and rising into a swirling dome
  const magic = (k) => [
    {system: {...base, startLife: iv(1.5, 2.5), startSpeed: iv(0.2 * k, 0.8 * k), startSize: iv(0.8 * k, 2 * k), startColor: white(1), worldSpace: false,
      maxParticle: 600, emissionOverTime: cv(140), shape: new CircleEmitter({radius: 12 * k, thickness: 0.15}), material: mat(add)},
     behaviours: [new OrbitOverLife(cv(2.2)), new SizeOverLife(curve(0.2, 1, 1, 0)),
       new ColorOverLife(grad([[0.75, 0.55, 1, 0], [0.35, 0.85, 1, 0.5], [1, 0.6, 0.95, 1]], [[0, 0], [1, 0.2], [0, 1]])),
       new ApplyForce(new Vector3(0, 1, 0), cv(1.2 * k))], at: [0, -10 * k, 0], flat: true},
  ];

  return {
    fire: {layers: fire, light: 0xff7a2a, glow: 1.2, loops: true},
    smoke: {layers: smoke, light: 0xffa060, glow: 0.5, loops: true},
    sparks: {layers: sparks, light: 0xffb050, glow: 1, loops: false},
    magic: {layers: magic, light: 0x9a7cff, glow: 1, loops: true},
  };
}
