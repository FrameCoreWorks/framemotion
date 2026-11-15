// Ready particle looks (ours), as tsParticles options. Colours and counts are a start; `options`
// in the settings replaces any part. Interactions (mouse, clicks) are off: a film has no pointer.
export const PRESETS = {
  /** Confetti falling and spinning across the frame. */
  confetti: {
    background: {color: '#0d0f14'},
    particles: {
      number: {value: 140},
      color: {value: ['#f97316', '#3b82f6', '#22c55e', '#e11d48', '#f8fafc']},
      shape: {type: ['square', 'circle', 'triangle']},
      size: {value: {min: 4, max: 9}},
      rotate: {value: {min: 0, max: 360}, direction: 'random', animation: {enable: true, speed: 30}},
      move: {enable: true, gravity: {enable: true, acceleration: 4, maxSpeed: 12}, speed: {min: 2, max: 6}, direction: 'bottom',
        outModes: {default: 'out'}, random: true},
    },
  },
  /** Soft dots drifting upwards, like dust in light. */
  drift: {
    background: {color: '#0d0f14'},
    particles: {
      number: {value: 90},
      color: {value: ['#fde68a', '#f8fafc', '#93c5fd']},
      shape: {type: 'circle'},
      size: {value: {min: 1, max: 4}},
      opacity: {value: {min: 0.2, max: 0.8}, animation: {enable: true, speed: 0.6, sync: false}},
      move: {enable: true, speed: {min: 0.3, max: 1.4}, direction: 'top', outModes: {default: 'out'}, random: true},
    },
  },
  /** A network of points joined by lines, slowly moving. */
  links: {
    background: {color: '#0d0f14'},
    particles: {
      number: {value: 60},
      color: {value: '#93c5fd'},
      links: {enable: true, distance: 140, color: '#93c5fd', opacity: 0.4, width: 1},
      size: {value: {min: 2, max: 4}},
      move: {enable: true, speed: 1.2, outModes: {default: 'bounce'}},
    },
  },
};
