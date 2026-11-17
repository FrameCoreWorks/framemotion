# First setup

FrameMotion is complete on its own and needs no other plugin. Since FrameMotion 0.4.0 every motion skill, pipeline and style pack that FrameCore Works Toolbox used to list is built in ([motion library](../assets/library/README.md)). The other FrameCore Works plugins and a few Toolbox helpers outside motion can add to it; they are offered once, as a question, and installed only on the user's answer (owner decision 2026-11-12: the plugins stay standalone and complement each other when installed together; none requires another).

## When to run it

- In the conversation that installed FrameMotion, as the installation guide's last step.
- When the user asks to configure FrameMotion ("Configure FrameMotion", in their language), or the host runs the plugin's setup action.
- Not on a bare invocation, a greeting or a direct task: those start the brief or the task. A direct task in the installing message is done first; setup is offered after it.
- **With Creative Studio**: when `framecore-work-creative-studio` is in the skill list and its own first setup runs in this conversation, Studio's setup already shows the Toolbox list; skip step 3 here and say in one line that the motion plugins are in that list.

## Steps

The user is assumed to know nothing about plugins or terminals: say in one plain sentence what each step does, show no command unless asked, and report each result in one line.

1. **Route check.** Say what FrameMotion can render on this host: no code execution (storyboard and motion contract), code execution (Python renderer) or a shell (HyperFrames, canvas, GSAP, Remotion). Probe `python3`, `ffmpeg`, `node` and a browser where code runs. Where a shell runs, name the [runtimes](#runtimes) the user's routes will need and install them only on the user's yes.
2. **Sound engine, one question** (owner decision 2026-11-16: most films have sound). Where code runs, run `python3 assets/sound-setup/earshot_offer.py check` (from the skill folder; it includes the launcher's readiness). When `full_ready` and `models_cached` are true (also when Toolbox installed it: one shared runtime), say in one line that sound is ready and skip the question; when `declined` is true, skip it silently. The engine needs Python 3.12: when `python312` is null, say so in the question and offer to install Python 3.12 first through this host's usual route (on a Mac with Homebrew `brew install python@3.12`), only on the same yes. Ask once: "Most films have sound. Shall I install Earshot, FrameMotion's sound engine that makes, measures and chooses sound effects by listening? It downloads about 2.6 GB once (Python packages and models, into `~/.framecore-works/earshot`), takes several minutes and sends nothing out. Yes, the smaller version without listening (about 470 MB), or not now?" On yes run the launcher's `install --tier full` plan and then `--yes`, then `fetch-models --yes` (an Intel Mac gets light only; say so); on light, `install --tier light --yes`; on not now, run `earshot_offer.py decline`, make sound with `sound.py` and do not ask again unless the user asks for Earshot ([Earshot in FrameMotion](motion-toolkit-routing.md#earshot-in-framemotion)). Report what actually installed. Without code execution, skip this step.
3. **Plugins that add to FrameMotion, one question.** Check the skill list for the other FrameCore Works plugins, Toolbox (`toolbox:toolbox`, in Codex also `toolbox`) and each entry below under any of its [names by host](motion-toolkit-routing.md#using-and-installing-a-toolbox-entry). Show the ones that are not installed as one numbered list, short enough to read on a phone, one line each on what it adds to FrameMotion, then ask: "Which numbers do you want? You can say all, none, or ask about one number." Say in the same message what will be written: the chosen plugins through this host's plugin manager, Toolbox first when a Toolbox helper is picked; programs (Node packages, a browser, Python packages) only when a task first needs them; nothing is uploaded. When everything is installed, say so in one line and skip the question.
4. **Install what was picked**, one by one, through the host routes in [using and installing a Toolbox entry](motion-toolkit-routing.md#using-and-installing-a-toolbox-entry) (the other FrameCore Works plugins: [their routes](#other-framecore-works-plugins)), and report each as installed, waiting for the user's step (Claude apps, Work without Plugin Creator) or not available on this host. A new conversation lists newly installed skills.
5. **Done.** Say in one line that setup is finished and how to start: describe the film, or call FrameMotion for its brief.

The picked numbers are the consent for those items only. Never install anything that was not picked, never repeat a declined offer in later conversations unless the user asks, and keep FrameMotion's own route for every step whose plugin is missing.

## Runtimes

FrameMotion installs its own runtimes; it needs no other plugin for them. Where a shell runs (Claude Code, Codex, a local project), the starters and engines that need Node.js packages are copied from this plugin into one workspace folder and installed from their lockfiles, only when a route needs them and the user agrees (say the folder and the download before asking):

| Folder in the workspace | Copied from (this skill) | Used by |
| --- | --- | --- |
| `animate-engine` | `assets/animate-engine` | the [Animate engine](animate-engine.md); then `npx playwright@1.56.1 install chromium` in that folder |
| `gsap-motion-starter` | `assets/gsap-motion-starter` | HTML/GSAP builds |
| `motion-toolkit` | `assets/motion-toolkit` | Three.js, PixiJS, D3, Lottie and Mediabunny examples |
| `engines` | `assets/engines` | FrameMotion's own engines ([engines](../assets/engines/README.md)), starting with the photoreal three.js blocks; Playwright with Chromium renders them |
| `anatomy-engine`, `kaventro-engine`, `hairline`, `stickman-engine`, `cutaway-engine`, `launch-engine`, `reels-engine`, `art-engine` | `assets/<same name>` | the engines in `engines` that build from these folders (`anatomy-svg`, the `kaventro-*` films, `hairline-spice-rack`, the `stickman-*` films, `cutaway-piranha`, the `teardown-*` films, the `launch-*` films, the `reels-*` reels and the `art-*` films and clips); they must sit next to `engines`, like `animate-engine` |
| `kinetic-type-starter`, `three-motion-example`, `gltf-turntable` | `remotion/assets/<name>` | the [Remotion route](../remotion/REMOTION.md) |

The workspace is `~/.framecore-studio/workspace` (or `FRAMECORE_STUDIO_WORKSPACE`), the same folder older Creative Studio installations used, so an existing copy is reused: compare its `package-lock.json` with the plugin's and reinstall (`npm ci`) only when they differ. HyperFrames runs through `npx hyperframes` and needs Node.js 22, FFmpeg and Chrome. When Creative Studio is installed, its environment check reports the same tools; either may install them, never both at once.

## The list

Grouped as the user sees it. Keep this list in step with the [motion library](motion-toolkit-routing.md#motion-library) and [Toolbox for what is not motion](motion-toolkit-routing.md#toolbox-for-what-is-not-motion), checked against Toolbox 1.17.0.

**Other FrameCore Works plugins:**
- `framecut`: editing your own footage with a FrameMotion piece placed on its timeline, captions, subtitles and the mix.
- `framecore-open-assets`: free photos, footage, music and effects with verified licences, for the pictures a film needs.
- `framecore-work-creative-studio`: briefs, scripts, copy, storyboards and campaigns around the film; with it, Studio leads the project and FrameMotion builds the motion.

**From Toolbox** (not motion; FrameMotion has everything for motion built in):
- `pinterest-references`: moodboards from public pins, each with its link.
- `taste-skill`, `hallmark` or `nateherk-design`: a website around the film.

Built in, never offered as a plugin: the motion library (GSAP and three.js API pages, Manim explainers, the papercut pipeline, bang-motion starters, the Hairline web library, the varg, Claude Video and iart style packs), every engine and Earshot.

### Other FrameCore Works plugins

Each lives in its own marketplace: add it once, then install. Claude Code: `claude plugin marketplace add FrameCoreWorks/framecut` and `claude plugin install framecut@framecut`; `FrameCoreWorks/framecore-open-assets` and `framecore-open-assets@framecore-open-assets`; `FrameCoreWorks/framecore-works-creative-studio` and `framecore-work-creative-studio@framecore-works` (it needs the Toolbox, FrameMotion and FrameCut marketplaces added first and then brings those plugins itself). Claude apps: the user adds the repository as a marketplace under Customize > Plugins and turns the plugin on. Codex: `codex plugin marketplace add <owner/repo>`, then `codex plugin add <name>@<marketplace>` with the same names. ChatGPT Work: Plugin Creator saves the plugin from files read as text through the GitHub connector, following that repository's installation guide, never a ZIP from the user.

## Evidence

Record what ran on which host. FrameMotion is tested in Claude only (owner decision 2026-11-16); on Codex and ChatGPT Work it installs but is untested there, which the record says in those words.
