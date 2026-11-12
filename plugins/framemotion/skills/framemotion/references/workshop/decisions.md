# Decision table: default and when another tool is allowed

Use the default unless the condition in the third column holds; record each exception and its reason in the film's plan. Frame counts are at 60 fps unless stated.

| Tool | Default | When it is allowed |
|---|---|---|
| Scene transition | The next scene grows out of the previous one (morph, mask, match cut, zoom through an element) | Dissolve 12-30 frames when it means passing time, a memory or a change of mood in a calm film; dip to black 0.5-1.5 s at the end of a chapter; dip to white 12-40 frames for a flash or reveal. Never in a fast sequence and never instead of an idea |
| Hard cut | None; the change is carried by motion on the hit | Smash cut on a drop or punchline when motion carries the eye through the cut; always cut on motion, never on a still frame; expressive editing (music video, rock, advertising) is chosen once for the whole film |
| Glow, bloom | No decoration | When the scene has a light source (neon, screen, fire, lamp, energy): a stack of three layers of about 10 / 40-50 / 150-200 px in Screen/Add, only on chosen colours |
| Lens flare | None | A real light source in frame, rarely, at most once |
| Particles | None | When they have a cause: sparks from an impact, dust from a landing, a logo assembled from particles, an object falling apart |
| RGB split, glitch | None | 2-6 frames on a cut or beat when the subject is digital |
| Camera shake | At most one strong hit per film | Music video or rock: short decaying micro-shakes on chorus downbeats; otherwise only one big one |
| Overshoot | Spring 260/26 (about 1.5%) | 10-15% with a 10-15 frame settle for objects and characters with personality or an impact; never on logos, text, UI or data |
| Squash and stretch | Only on impact | Blobs, characters and rubbery objects freely (volume about 1); almost never on a brand mark |
| Counters, HUD | Nothing parked in corners | A counter or chart when data is the content: tabular figures, ease-out, hold on the value |
| Grain | None | 0.5-0.8% at the end of the stack whenever there are gradients (H.264 banding); 8-15% opacity only in a film or retro style |
| Drift in a hold | None | 2-3% movement so the frame does not freeze; it does not count as pace, and the 0.6 s rule still applies |
| Sound | Real recordings | Synthesis for abstract accents (UI, digital ticks) or when the user asks |
| Generative video (image-to-video) | Motion in code | Optional when it beats code: backgrounds, texture loops, smoke, fluid, fire, transition elements, live-footage shots; then composition, text and end card in code. Characters and contact with objects only after checking frames for ambiguous poses. Art-direct the still first, then animate. Cost and the user's consent before generating |
| Text hold | The reading clock | Take the longer of `max(96, ceil((words / 3 + 0.3) * 60))` frames and 13 characters per second + 0.5 s |
| Engine | Canvas or HyperFrames | PixiJS for many objects or filters; D3 for data; three.js for 3D; Remotion for React or 3D, with its licence warning (paid for companies above three people); Manim for mathematics; Lottie for ready animations; Blender for photorealism |

Other exceptions: RSVP (single words for 5-10 frames in the centre, no motion) instead of the reading clock only in a music video or hype film ([typography](typography.md)); look and 3D: [look](look.md), [3D](3d.md).

Pace rule behind the table: apart from text holds and the end card, nothing in frame stands still longer than 0.6 s; after a gag a 1-1.5 s hold is allowed. A transformation takes 5-12 frames, a breath 12-24 frames, and a scene at least 3-4 s.
