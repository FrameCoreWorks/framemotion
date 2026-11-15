// Ready drawings (ours) for the p5.brush engine. Each returns the paper colour and items; an item
// is drawn from `from` to `to` (fractions of the film) with k going 0 to 1. Strokes are revealed by a
// clip that grows with k, so the stroke itself is always drawn whole and its grain stays put.

/** A stroke revealed left to right (or top to bottom) through a growing clip. */
function revealed(drawStroke, box, vertical = false) {
  return (b, k) => {
    const [x1, y1, x2, y2] = box;
    b.clip(vertical ? [x1, y1, x2, y1 + (y2 - y1) * k] : [x1, y1, x1 + (x2 - x1) * k, y2]);
    drawStroke(b);
    b.noClip();
  };
}

export const DRAWINGS = {
  /** A cup and a pear on a table: pencil lines, then watercolour fills and a hatched shadow. */
  'still-life'({width: w, height: h}) {
    const s = Math.min(w, h) / 540;
    const cx = 0, cy = 0;   // the standalone canvas has its origin in the middle, like p5's WEBGL mode
    return {paper: '#f6f1e8', items: [
      {from: 0.0, to: 0.25, draw: revealed((b) => { b.set('2B', '#2f2a26', 1.4 * s); b.line(cx - 230 * s, cy + 120 * s, cx + 230 * s, cy + 120 * s); },
        [cx - 240 * s, cy + 100 * s, cx + 240 * s, cy + 140 * s])},
      {from: 0.1, to: 0.45, draw: revealed((b) => { b.set('HB', '#2f2a26', 1.2 * s); b.noFill(); b.rect(cx - 160 * s, cy - 40 * s, 120 * s, 160 * s); },
        [cx - 170 * s, cy - 50 * s, cx - 30 * s, cy + 130 * s], true)},
      {from: 0.25, to: 0.6, draw: revealed((b) => { b.set('HB', '#2f2a26', 1.2 * s); b.noFill(); b.circle(cx + 90 * s, cy + 40 * s, 75 * s); },
        [cx + 5 * s, cy - 45 * s, cx + 175 * s, cy + 125 * s], true)},
      {from: 0.55, to: 0.85, draw: (b, k) => { b.noStroke(); b.fill('#c96f4a', 110 * k); b.fillBleed(0.2); b.rect(cx - 160 * s, cy - 40 * s, 120 * s, 160 * s); }},
      {from: 0.6, to: 0.9, draw: (b, k) => { b.noStroke(); b.fill('#a8b84a', 120 * k); b.fillBleed(0.25); b.circle(cx + 90 * s, cy + 40 * s, 75 * s); }},
      {from: 0.7, to: 1.0, draw: revealed((b) => { b.noFill(); b.noStroke(); b.hatchStyle('rotring', '#1f4b99', 0.6 * s); b.hatch(8 * s, 35); b.rect(cx - 40 * s, cy + 100 * s, 260 * s, 20 * s); b.noHatch(); },
        [cx - 40 * s, cy + 95 * s, cx + 225 * s, cy + 125 * s])},
    ]};
  },
};
