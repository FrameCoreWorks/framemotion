# Install FrameMotion

This is the complete installation procedure for the assistant performing a user-requested installation. FrameMotion is one plugin with one skill, `framemotion`. Creative Studio, Toolbox and Open Assets are optional; FrameMotion never requires them.

## Paste this prompt

Paste the repository link into the agent with one sentence, in any language. The same sentence works in ChatGPT Work, Codex and Claude Code:

```text
Install FrameMotion for me from https://github.com/FrameCoreWorks/framemotion
Read its installation guide for this app first, then explain each step in plain words.
```

The request is the installation consent. The assistant follows the section for its host below, says in one plain sentence what each step does, shows no command unless asked, and after installing runs the [first check](#first-check).

## Before you install

1. Resolve `main` (or the requested release) once to a full commit and use that commit for every file.
2. Look for an existing FrameMotion installation first and update it instead of creating a second copy. A Creative Studio of version 1.177.0 or older still carries the same motion module as its own skill `hyperframes-workflow`; that is not a conflict, but say that the newer Studio hands motion to FrameMotion.
3. Keep the whole `plugins/framemotion/` folder together: the skill reads its references, starters, engines, fonts and scripts by relative paths. Never install only `SKILL.md`.

## Claude Code

```text
/plugin marketplace add FrameCoreWorks/framemotion
/plugin install framemotion@framemotion
```

The marketplace is named `framemotion` and holds exactly this plugin. When Creative Studio's marketplace (`framecore-works`) also lists FrameMotion, install it from one marketplace only; two installed copies both stay enabled, so remove one with `claude plugin uninstall`. A new session lists the skill as `framemotion:framemotion`.

## Claude apps (claude.ai, desktop)

Where the workspace supports repository marketplaces (Customize > Plugins), add `FrameCoreWorks/framemotion` and enable **FrameMotion**. The apps do not install plugin dependencies, so a Studio user enables FrameMotion by hand. Rendering needs the app's code execution; without it FrameMotion stays on the no-code route (storyboard and motion contract). App installation and rendering: NOT_RUN.

## Codex

Where Codex has its own plugin manager (`codex plugin marketplace --help` prints its commands):

```sh
codex plugin marketplace add FrameCoreWorks/framemotion
codex plugin add framemotion@framemotion
```

`codex plugin list` then shows FrameMotion `installed, enabled`; a new session loads the skill. Update with `codex plugin marketplace upgrade framemotion` and the same `codex plugin add`. Without a plugin manager, use the host's native plugin flow with the complete `plugins/framemotion` folder. Codex installation: NOT_RUN.

## ChatGPT Work

ChatGPT Work saves plugins only through OpenAI's **Plugin Creator** (side menu > Plugins > search `Plugin Creator` > the one by OpenAI > Install; then start a new Work conversation, type `@`, select **Plugin Creator** and paste the prompt). Without Plugin Creator's create and update tools in the conversation, save nothing and give the user these steps.

1. Search Plugin Creator's saved plugins for FrameMotion: none means a first installation, otherwise update that identity with its current release guard. Never create a duplicate.
2. List `plugins/framemotion/` recursively at the pinned commit through the GitHub connector; each entry carries its git blob `sha`. Write every file under `/mnt/data/framemotion/<path>` in code execution: text files as their exact text, binary files (fonts, `.glb`, images) from their base64 content. The `tests/` folder is not needed at run time and may be left out. Never ask the user to download or upload a ZIP, and treat a failed download in code execution as expected: copy the files through the connector instead.
3. Check every file against its git blob hash (`sha1(b'blob <size>\0' + bytes)`), re-read any mismatch, and zip the folder only when all match.
4. `create_plugin` (first installation) or `update_plugin` with the release guard, then read back the saved manifests and `skills/framemotion/SKILL.md`. Report the save, the file check and the first check separately.

The package is large (about 12 MB, 470 files), mostly the bundled engines and starters. ChatGPT Work installation: NOT_RUN.

## First check

In the installed plugin, the skill decides the route from the host: no code execution (storyboard and motion contract only), code execution (Python renderer), or a shell (HyperFrames, canvas, GSAP, Remotion). Ask it: "What can FrameMotion render here?" It probes `python3`, `ffmpeg`, `node` and a browser and names the route; installing an engine package needs the user's yes.

## First setup

Right after the first check, in the same conversation, the skill runs its [first setup](plugins/framemotion/skills/framemotion/references/first-setup.md): it asks once, as one numbered list, whether to add the FrameCore Works Toolbox plugins that extend FrameMotion (Earshot and reel style packs inside Toolbox, GSAP and three.js knowledge, art-style and transition methods, ready launch-film pipelines). Only the picked numbers are installed, through this host's plugin manager; FrameMotion works fully without any of them. Later the user can say "Configure FrameMotion". With Creative Studio running its own setup, Studio's list covers these plugins and FrameMotion does not ask again.

## With Creative Studio

Studio 1.178.0 and newer routes motion graphics to FrameMotion and no longer carries the module itself. Install FrameMotion beside Studio from either marketplace; Studio's installation guides add it in the companion setup.
