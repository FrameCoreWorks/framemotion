# First setup

FrameMotion is complete on its own and needs no other plugin. Plugins from FrameCore Works Toolbox can add knowledge and ready pipelines to it; they are offered once, as a question, and installed only on the user's answer (owner decision 2026-11-12: the plugins stay standalone and complement each other when installed together; none requires another).

## When to run it

- In the conversation that installed FrameMotion, as the installation guide's last step.
- When the user asks to configure FrameMotion ("Configure FrameMotion", in their language), or the host runs the plugin's setup action.
- Not on a bare invocation, a greeting or a direct task: those start the brief or the task. A direct task in the installing message is done first; setup is offered after it.
- **With Creative Studio**: when `framecore-work-creative-studio` is in the skill list and its own first setup runs in this conversation, Studio's setup already shows the Toolbox list; skip step 2 here and say in one line that the motion plugins are in that list.

## Steps

The user is assumed to know nothing about plugins or terminals: say in one plain sentence what each step does, show no command unless asked, and report each result in one line.

1. **Route check.** Say what FrameMotion can render on this host: no code execution (storyboard and motion contract), code execution (Python renderer) or a shell (HyperFrames, canvas, GSAP, Remotion). Probe `python3`, `ffmpeg`, `node` and a browser where code runs.
2. **Toolbox motion plugins, one question.** Check the skill list for Toolbox (`toolbox:toolbox`, in Codex also `toolbox`) and each entry below under any of its [names by host](motion-toolkit-routing.md#using-and-installing-a-toolbox-entry). Show the ones that are not installed as one numbered list, short enough to read on a phone, one line each on what it adds to FrameMotion, then ask: "Which numbers do you want? You can say all, none, or ask about one number." Say in the same message what will be written: the chosen plugins through this host's plugin manager, Toolbox first when an entry needs it; programs (Node packages, a browser, Python packages) only when a task first needs them; nothing is uploaded. When everything is installed, say so in one line and skip the question.
3. **Install what was picked**, one by one, through the host routes in [using and installing a Toolbox entry](motion-toolkit-routing.md#using-and-installing-a-toolbox-entry), and report each as installed, waiting for the user's step (Claude apps, Work without Plugin Creator) or not available on this host. Earshot's engine is a separate step: after Toolbox is installed, relay Toolbox's own tier question ([Earshot through Toolbox](motion-toolkit-routing.md#earshot-through-toolbox)). A new conversation lists newly installed skills.
4. **Done.** Say in one line that setup is finished and how to start: describe the film, or call FrameMotion for its brief.

The picked numbers are the consent for those items only. Never install anything that was not picked, never repeat a declined offer in later conversations unless the user asks, and keep FrameMotion's own route for every step whose plugin is missing.

## The list

Grouped as the user sees it; names and pins come from [Toolbox's catalog](https://github.com/FrameCoreWorks/framecore-works-toolbox/blob/main/plugins/toolbox/skills/toolbox/SKILL.md#catalog), checked against Toolbox 1.14.0. Keep this list in step with the [Toolbox motion entries](motion-toolkit-routing.md#toolbox-motion-entries) table.

**Toolbox itself** (the catalog plus what is built into it):
- `toolbox`: Earshot for sound (effects, sound kits, loudness and hits on the cuts) and four reel style packs: `varg-motion-styles` (56 reel styles with exact presets), `claude-video-styles` (21 film looks), `animation-skills-styles` (five 9:16 reel engines from a spec), `iart-explainer-styles` (explainer methods and recipes).

**Knowledge for the build** (no runtime):
- `gsap-skills`: current GSAP API (timelines, SplitText, MorphSVG, Flip, ScrollTrigger).
- `threejs-skills`: current three.js r186 API for 3D scenes.

**Looks and methods:**
- `huashu-art-motion`: 36 art styles and 9 explainer grammars.
- `gl-transitions`: licensed GLSL shader transitions between scenes.
- `pixelfx`: 244 pixel effects and sprite sheets.
- `anatomy`: detailed isometric figures of a technical product.
- `hairline`: interactive isometric line figures for a web page.
- `manim-skill`: math and science explainers in Manim.
- `pinterest-references`: moodboards from public pins, each with its link.

**Ready pipelines** (need a shell, Node.js and a browser):
- `motion-designer`, `motion-launch-videos`: app and product launch films.
- `bang-motion`: openers, promos, lower thirds as one autoplaying page.
- `animate`: illustrated explainers and histories in seven styles.
- `papercut-explainer`: cut-paper explainer reels from a link.
- `stickman-kino`: stick-figure explainers with a ready rig.
- `cutaway`: a product or machine taking itself apart, from one picture.
- `brag`: a quick launch video of a finished project.

## Evidence

Record what ran on which host. The question and installs on Claude apps, Codex and ChatGPT Work are NOT_RUN until a run on that host is reported.
