# papercut-explainer in FrameMotion

The cut-paper explainer pipeline by sanat (0xS4N4TG), bundled in full in [`upstream/`](upstream/) at commit `ff8223abc8136cc09e8d7e9b62ecb5d080c389e1`, library 0.1.0 (Copyright (c) 2026 sanat, MIT, [licence](upstream/LICENSE), [third-party notes](upstream/THIRD_PARTY.md)): nine stage skills ([overview](upstream/skills/papercut-explainer/SKILL.source.md): strategy, hook, script, voice, storyboard, build, QA, setup), the scene agent brief, the Remotion [template](upstream/library/papercut/template/) with its exact lockfile, the [kit](upstream/library/papercut/kit/), 24 backdrops, generated textures, OFL font subsets, SFX and music beds ([audio catalog](upstream/library/audio/CATALOG.md)), the voice and timing tools and two example episodes.

## When FrameMotion uses it

A vertical cut-paper explainer reel (layered paper props, taped banners, stop-motion boil), usually from a link, 22 to 30 s. FrameMotion's own [cut-paper method](../../../references/explainer-method-recipes.md#cut-paper-explainer) stays the route for a cut-paper beat inside another film, a 16:9 piece or a machine without Node and Chrome; the Animate engine's cut-paper style is a different look with its own rules.

Run modes, intake and stages are the upstream ones; FrameMotion's brief, copy locks and board approval come first, and FrameMotion's QA and delivery come last.

## What FrameMotion changes

1. **Setup without the installer.** Never run `install.sh`, `papercut-setup`'s clone of the default branch, `harnesses.sh` or `npx skills add remotion-dev/skills` (unpinned, user-wide links, writes to `~/.config`). Instead, after one question that names the download (about 0.7 GB with Remotion's browser):
   ```bash
   export PAPERCUT_LIB="<this folder>/upstream/library"
   export PAPERCUT_CONFIG="$PWD/.papercut/config.env"   # keeps config in the project
   bash "$PAPERCUT_LIB/new_episode.sh" <series-dir> NN-slug CompId
   cd <series-dir>/episodes/NN-slug/papercut && npm ci   # exact versions from the bundled lockfile
   ```
   `new_episode.sh` copies the template and the kit into the project and never writes into the plugin folder. When its own `npm i` fallback already ran, run `npm ci` once to match the lockfile. Python tools (numpy, Pillow, soundfile) go in a project virtual environment named by `PAPERCUT_PY`.
2. **Remotion.** The template pins Remotion 4.0.530. Remotion is not bundled and is source-available under its own licence: free for individuals and small teams, a paid company licence above its size threshold. Say so once before the first render for a company. Instead of the Remotion best-practices skill, follow FrameMotion's [Remotion route](../../../remotion/REMOTION.md).
3. **No parallel scene agents by default.** `papercut-build` sends scenes to parallel subagents. Build the scenes in this conversation one by one, unless the user asks for parallel agents and accepts the cost.
4. **Voice.** The full mode downloads Qwen3-TTS (2.3 to 4.2 GB). Ask first; the default is the user's recorded voice or the placeholder voice. For Polish, use FrameMotion's word timing ([animate voice](../../animate-voice/README.md)) and check the captions on the contact sheet.
5. **Sound and QA.** The bundled SFX and beds are MIT and may be used; FrameMotion's sound pass (Earshot or `sound.py`) measures loudness on the encoded MP4. After `papercut-qa`, run FrameMotion's frame QA. For FrameCut, conform as in [From frames to a FrameCut motion request](../../../references/engine-contract.md#from-frames-to-a-framecut-motion-request).
6. **Backdrops.** Sixteen of the 24 backdrops were made with an image model (see the third-party notes): usable, but their copyright may not be enforceable. Mention it when a client needs exclusive rights.
