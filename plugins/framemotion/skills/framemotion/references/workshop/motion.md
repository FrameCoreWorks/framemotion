# Motion: process, language, curves and values

Exceptions: [decision table](decisions.md). Values are starting points at 60 fps; confirm them on a frame test.

**Process.** Brief, style frames, animatic, blocking (poses and timing), curves, polish, sound and render. Timing is set in blocking before final shapes exist; motion must work on grey rectangles, effects come in polish.

**Plan before code (motion contract).** A list of beats with one message per beat and the beat's main action; a motion language of two or three named curves (enter, exit, travel), a timing scale in frames, one stagger, an overshoot policy, two or three transition types, one signature move, and a relay object (a shape that returns at the end so the last frame rhymes with the first).

**Principles.** One point of attention at a time; motion explains change; enter fast, land long; one direction of progress; contrast of energy (active against calm); elements come from a fixed place, not from the centre. An accent colour has one meaning.

**Curves.** Enter power2/3.out, `cubic-bezier(.33,1,.68,1)` or `(.25,1,.5,1)`; dramatic reveal expo.out `(.16,1,.3,1)`; travel between states `(.65,0,.35,1)`; exit `(.32,0,.67,0)` at 60-75% of the enter time. Linear only for constant processes. After Effects' Easy Ease `(.333,0,.667,1)` is too soft.

**Durations at 60 fps.** Label 16-24 frames, headline line 24-40, logo or title 40-90, travel 40-80, scene transition 20-40. Stagger: letters 2-4, words 4-8, lines or blocks 8-16. The whole cascade is shorter than the move itself.

**Weight.** Anticipation 4-6 frames (5-10% of the travel); overshoot by the [decision table](decisions.md); inertial bounce `v/ω·sin(ωt)·e^(-5t)`; follow-through 3-5 frames; squash keeps volume; never overshoot and bounce on the same property. Logo: enter 200-400 ms, reveal 400-800, settle 200-400, hold 1-2 s. Springs: snap 260/26, stretch 120/20; zoom is interpolated in log space.

**Meaningful stagger order.** Reading order, from the centre (burst), from the point of contact, from the base (bars from the axis).

**Type in motion.** A line mask about 1.3 times the font height (descenders g j p y stay whole); accent a word after the line is read (colour, weight, scale 1.04-1.08); numbers in tabular figures; rest positions on whole pixels.

**Camera.** One push-in per beat, 0.4-0.55 s, no zoom-out during it; parallax of two or three planes, the camera travels (dolly) instead of the lens zooming; the camera moves slower than the elements.

**Effects and order.** Masks, then effects, then transforms; a blur above a scaled layer keeps its radius; in code nesting decides (an outer filter applies after an inner transform). Finishing stack: grade, glow, aberration or distortion, vignette, grain. Motion blur: 180° shutter, samples from -90° to +90°. Fractal noise: animate evolution, not the seed. Morph: the same number of points and the same first vertex (flubber, MorphSVG). Gooey: blur 20-40 px plus an `feColorMatrix` alpha row `0 0 0 18 -7`.

**Rhythm.** Frames per beat = fps × 60 / BPM; cue = round(beat × fps × 60 / BPM) from zero. The picture accent lands 1-2 frames before the sound peak. Big changes on the downbeat or bar, the biggest reveal on the drop. At most three full-frame flashes per second.

**Defects to catch.** Everything at once or all with the same timing; text moving while it is read; a word cut by a mask; drift instead of pace; no stable last frame; a photo's background rectangle; jitter from fractional positions.
