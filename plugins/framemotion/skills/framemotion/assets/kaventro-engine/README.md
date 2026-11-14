# kaventro film templates (bundled engine)

Unchanged copies of the film templates of [kaventro/motion-designer](https://github.com/kaventro/motion-designer) at commit `7d0b8bb78ddd2c91c57db9d1e83fcf711304bdb8` (MIT, Copyright (c) 2026 kaventro; [LICENSE](LICENSE)). The hash of every file is in [`integrations/kaventro-motion-designer/source-manifest.json`](../../../../integrations/kaventro-motion-designer/source-manifest.json) and a test checks them. Do not edit these files: a film is a copy of them.

A film is `templates/shared/` plus one kind folder, the way upstream's `new_film.sh` assembles it: `blank` (titles, kinetic type, data), `overlay` (lower thirds and captions over footage), `mobile` (an app in an iPhone), `desktop` (an app window on a laptop) and `story` (hook, product, panels, end card). The page draws any time with `window.seek(t)` and reports its size and timing in `window.FILM_INFO`.

FrameMotion renders them through its shared renderer with the `seek` adapter (registry ids `kaventro-blank`, `kaventro-overlay`, `kaventro-mobile`, `kaventro-desktop`, `kaventro-story`):

```bash
node ../engines/kit/render-engine.mjs --engine kaventro-blank --frames 0,360,719 --out frames
```

The builder copies the templates into a temporary folder outside the plugin (`src/` and an empty `audio/`), so a silent render needs no music; add the edited track as `audio/edit.m4a` for the film's own player. For a real film, copy the two folders into the project, change `scenes.js` (copy, timing, shots) and `film.css` (colours, type), and keep the rest unchanged.

Left out on purpose: upstream's installers, music and voice generators, and its own render script (FrameMotion's renderer replaces it). The templates use the system's fonts; no font files are bundled.
