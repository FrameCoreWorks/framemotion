# Look: colour, light, texture and frame

When to use what: [decision table](decisions.md). Techniques: [techniques](techniques.md). Confirm values on a frame test.

**Colour.** Background, structure and accent roughly 60-30-10, at most three main hues; the accent is strongest when it appears in frame once. On a dark background make accents slightly less saturated than on a light one (same hue), and nearer planes lighter instead of using dark shadows. A background is never pure black.

**2.5D shadow.** Instead of one drop shadow use several layers: a tight dark contact shadow at the object, a medium directional one and a wide, very faint bounce. Shadow colour comes from the background (darker, cooler) in Multiply, never pure black. In SVG: `feOffset`, `feGaussianBlur`, `feColorMatrix`, `feMerge` instead of a grey CSS box-shadow.

**Texture.** Always the last layer, after colour correction. Grain moves (noise that changes over time), never a static frame. Halftone: screen rotated 45°, the dot edge smoothed (smoothstep) so it does not stair-step.

**Banding.** Compute gradients at higher precision and add dither or slight noise before writing 8 bits. Check dark gradients in a preview after MP4 compression.

**Depth.** Several planes plus aerial perspective (far planes have less contrast and take the colour of the air). Parallax comes from camera motion (closer is faster), not from sliding flat layers. A long lens flattens and looks graphic; a wide lens gives speed.

**Frame hierarchy.** One element clearly dominates. Test: blur the frame heavily and make it greyscale; one element must stay readable. Nothing sits "almost at the edge": either breathing room or a decisive bleed out of frame. For another format, rebuild the frame instead of cropping it.

**Combining assets (3D, generated, vector, video).** A shared colour correction, light wrap on the edges of inserts (the blurred background let in through the inverted alpha in Screen), and a shared grain over everything at the end. Generate images in neutral flat light on a clean background, then clean their alpha fringes.

**Style families to choose per film.** Tactile 3D (matte, soft light, rounded forms); flat with line boil; glass and aurora (background blur under UI, fluid shader blobs); risograph (offset colour channels, halftone); high-contrast editorial (giant type, variable-font axes); chrome and gloss (environment map, slow motion); spatial collage (cut-outs in pseudo-3D with depth of field and light wrap).

**What looks amateur.** Default easings, black shadows, banding, a cramped frame, oversaturated accents on black, no single point of focus, a dead hold (add a gentle drift), assets without a shared grain, hard insert edges, motion blur stronger than a 180° shutter, everything entering at once, a rainbow of colours, neon and gradient blobs without structure.

**Text contrast.** At least 4.5:1 against the background, large text at least 3:1; measure it.
