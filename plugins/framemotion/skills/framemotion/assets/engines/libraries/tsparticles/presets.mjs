// Ready particle looks (ours), as tsParticles 4 options. Sizes, speeds and distances are written for
// a 540-pixel frame and multiplied by k (shorter side / 540); counts by a (frame area / 540×960), so a
// 1080×1920 reel looks like the 540×960 preview. `options` in the settings replaces any part, in
// pixels of the real frame. Colours are tsParticles 4's `paint.color`. Interactions are off: a film
// has no pointer.
export const PRESETS = {
  /** Confetti falling and spinning across the frame. */
  confetti: (k, a) => ({
    particles: {
      number: {value: Math.round(140 * a)},
      paint: {color: {value: ['#f97316', '#3b82f6', '#22c55e', '#e11d48', '#f8fafc']}},
      shape: {type: ['square', 'circle', 'triangle']},
      size: {value: {min: 4 * k, max: 9 * k}},
      rotate: {value: {min: 0, max: 360}, direction: 'random', animation: {enable: true, speed: 30}},
      move: {enable: true, gravity: {enable: true, acceleration: 4 * k, maxSpeed: 12 * k}, speed: {min: 2 * k, max: 6 * k},
        direction: 'bottom', outModes: {default: 'out'}, random: true},
    },
  }),
  /** Soft dots drifting upwards, like dust in light. */
  drift: (k, a) => ({
    particles: {
      number: {value: Math.round(90 * a)},
      paint: {color: {value: ['#fde68a', '#f8fafc', '#93c5fd']}},
      shape: {type: 'circle'},
      size: {value: {min: 1 * k, max: 4 * k}},
      opacity: {value: {min: 0.2, max: 0.8}, animation: {enable: true, speed: 0.6, sync: false}},
      move: {enable: true, speed: {min: 0.3 * k, max: 1.4 * k}, direction: 'top', outModes: {default: 'out'}, random: true},
    },
  }),
  /** A network of points joined by lines, slowly moving. */
  links: (k, a) => ({
    particles: {
      number: {value: Math.round(60 * a)},
      paint: {color: {value: '#93c5fd'}},
      links: {enable: true, distance: 140 * k, color: '#93c5fd', opacity: 0.4, width: 1 * k},
      size: {value: {min: 2 * k, max: 4 * k}},
      move: {enable: true, speed: 1.2 * k, outModes: {default: 'bounce'}},
    },
  }),
};
