# Hairline (web original) in FrameMotion

The original Hairline repository by Lucas Marques, bundled in full in [`upstream/`](upstream/) at commit `37d2e78dcb333ab30c3338e28ed4a690364ea014` (Copyright (c) 2026 Lucas Marques, MIT, [licence](upstream/LICENSE)): the `@lucasmarkes/hairline` 0.5.1 library ([`packages/hairline`](upstream/packages/hairline/)), the [create](upstream/skills/hairline-create/SKILL.source.md) skill (one figure as one HTML file, with `build.mjs`, `validate.mjs` and the `look.mjs` check) and the [adopt](upstream/skills/hairline-adopt/SKILL.source.md) skill (the library in an existing project), plus its registry and fixtures.

## Which Hairline

- **A figure in a video** (seekable, rendered to frames): FrameMotion's own [Hairline video kit](../../hairline/README.md). A planned tour replaces the pointer and every value is a function of time.
- **A figure on a web page** that answers the mouse pointer, or the library adopted in a site: this folder.

Both follow the same look rules ([`rules.md`](upstream/skills/hairline-create/rules.md), [`concepts.md`](upstream/skills/hairline-create/concepts.md)); read them for either.

## What FrameMotion changes

1. **Pinned browser for the check.** `look.mjs` installs `playwright-core@1` (an unpinned major) into a user cache on first run. Before running it, ask once, then install the exact version FrameMotion uses into a project folder and point the script there:
   ```bash
   npm install playwright-core@1.56.1 --prefix .hairline-look --no-audit --no-fund
   HAIRLINE_LOOK_CACHE="$PWD/.hairline-look" node look.mjs <name>.js --answer x,y,z --edge x,y,z
   ```
   Without a browser, use `validate.mjs` as the upstream says and report the look as not checked.
2. **Library version.** In a project, use the bundled 0.5.1: copy [`packages/hairline`](upstream/packages/hairline/) into the project, or install `@lucasmarkes/hairline@0.5.1` exactly when the registry has that version; a single figure needs only `kernel.js`, as the create skill does. Never `@latest`.
3. **Work in the project.** Copy `skills/hairline-create/` files into the user's project before building; never write into the plugin folder.
4. **Into a video.** When the web figure should also appear in a film, rebuild it with the video kit; do not screen-record a live page.
