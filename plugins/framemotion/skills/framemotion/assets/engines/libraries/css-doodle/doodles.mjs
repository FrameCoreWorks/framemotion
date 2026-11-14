// Ready doodles (ours). Each is css-doodle rules text; --w and --h are the frame size.
// Rules may use @rand/@pick (fixed by the seed) and must animate with CSS animations only.
export const DOODLES = {
  /** A grid of tiles that turn and fade in waves from the centre. */
  tiles: `
    @grid: 9x16 / var(--w) var(--h);
    @place-cell: center;
    background: @pick(#3b82f6, #f97316, #22c55e, #e11d48, #f8fafc);
    clip-path: @pick(polygon(0 0, 100% 0, 0 100%), circle(48%), inset(18% round 4px), polygon(50% 0, 100% 100%, 0 100%));
    transform: scale(0.82) rotate(@pick(0, 90, 180, 270)deg);
    opacity: 0.15;
    animation: turn 1.6s cubic-bezier(.2,.7,.2,1) both;
    animation-delay: calc(@dist(@x, @y, 5, 8.5) * 0.12s);
    @keyframes turn {
      0% { transform: scale(0.2) rotate(-90deg); opacity: 0; }
      60% { opacity: 1; }
      100% { transform: scale(0.82) rotate(@pick(0, 90, 180, 270)deg); opacity: 0.9; }
    }
  `,
  /** Rings of dots that breathe out of step. */
  rings: `
    @grid: 1x24 / var(--w) var(--h);
    @place-cell: center;
    @size: calc(@i * 4.2%) auto;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 2px dotted @pick(#f8fafc, #93c5fd, #fda4af);
    animation: breathe @r(2.4s, 3.6s) ease-in-out infinite alternate;
    animation-delay: calc(@i * -0.15s);
    @keyframes breathe {
      from { transform: scale(0.9) rotate(0deg); opacity: 0.35; }
      to { transform: scale(1.06) rotate(@r(-40, 40)deg); opacity: 1; }
    }
  `,
};
