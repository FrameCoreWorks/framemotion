# Kinetic typography and readability

Motion in general: [motion](motion.md). Exceptions: [decision table](decisions.md).

**Techniques: when to use them and when not.**
- Letters with physics (mass, gravity, collisions): a hero word, never text to be read. Simulate with a fixed step (Verlet or GSAP Physics2D) instead of hand-made bounces that break the logic of gravity.
- A letter morphing into an icon or object: logos and identities. Paths with different point counts must be matched (GSAP MorphSVG), or the shape twists.
- Variable-font axes (wght, wdth, slnt, opsz): "breathing" and accents instead of scale. Only real variable fonts and smooth interpolation, never a jump between classes.
- Split, slice, shard: energy, music videos, promos; not for a serious subject.
- Typographic masks (image inside letters, letters as a shape): editorial, fashion, titles; not with thin typefaces.
- Text on a path and handwriting: always draw linearly at a constant pen speed (time proportional to path length).
- Scale contrast (one word across half the frame plus small text): a poster in motion. The big word either has breathing room or deliberately leaves the frame.
- Echo and repetition of a word: an action verb, rhythm.
- Reflowing layout (text pushes text, FLIP technique): UI and grids; a spring without wobble.
- Procedural waves and distortion: backgrounds, identities; not where hitting the beat matters.

**Letters that survive compression.** MP4 stores colour at half resolution (4:2:0), so thin text in a saturated colour on a dark background smears. Accent text needs a heavier weight and contrast of lightness, not only of hue. No hairline typefaces. Tighten tracking when scaling up (or use the opsz axis). No faux bold or italic. Load fonts before the animation starts (`document.fonts.ready`). Scale from the point matching the text alignment.

**Readability.** Up to about 17 characters per second is comfortable and 20 is the upper limit; at most 42 characters per line and two lines; exposure at least about 1 s and at most about 7 s per card. Conversion: 120 BPM is two beats per second, one word per beat is two words per second. The reading clock stays the default: hold for the longer of `max(96, ceil((words / 3 + 0.3) * 60))` frames at 60 fps and 13 characters per second + 0.5 s, with at most three new words per second. Utility text (data, labels) enters quickly without a long ease. Break lines by the sense of the phrase. Minimum sizes at 1080 px wide: headline 72 px, body 42 px, small print 36 px.

**RSVP (the exception to the reading clock).** Fast single words on the beat, always centred, no camera motion or sliding. Only in a music video or hype film, never for content the viewer must remember, because comprehension drops at speed.

**Sync with music.** The picture accent lands 1-2 frames before the sound hit (a slightly late sound is tolerated better than an early one), with anticipation a few frames before the drop.

**Fonts with commercial licences (OFL or Apache).** Space Grotesk, Bricolage Grotesque (variable, opsz), Space Mono, JetBrains Mono, Inter, Familjen Grotesk, Sora, Roboto Flex, Bebas Neue, Red Hat Display, Hubot Sans, Oswald, Montserrat; Fontshare faces (Cabinet Grotesk, Clash Display) are under the ITF Free Font licence. Pairing: a characterful display face large and tight with a mono small and loose. Record the licence with the film. The [bundled fonts](../../assets/fonts/README.md) work without any download.
