# earshot: attribution and the bundled launcher

Earshot 0.4.0 by Leon Lin ([Leonxlnx/earshot](https://github.com/Leonxlnx/earshot), MIT, [licence](LICENSE)) is FrameMotion's sound engine.

- **Bundled launcher (pack P11, 2026-11-16).** `skills/framemotion/assets/earshot/` (launcher, task envelope, contract check, source-record importers, hash-locked requirements, upstream pins, licence and notice), `skills/framemotion/references/earshot/` (instructions) and `tests/earshot/` are copied from FrameCore Works Toolbox 1.15.1, commit `1e82404aba0ddb41369a4cca843a11d8c704b974` (FrameCoreWorks/framecore-works-toolbox, MIT launcher by FrameCore Works). [`source-manifest.json`](source-manifest.json) lists every file with its Toolbox path and hash; files marked `changed` are adapted to FrameMotion (plugin root, version source, provider `framemotion`, message prefix `framemotion/earshot:`, paths), every other file is byte-identical. `tests/earshot_copy_test.py` checks this.
- **Engine.** No Earshot source is bundled. The launcher downloads the pinned upstream snapshot and hash-locked wheels only after the user accepts its plan, into the runtime root shared with Toolbox (`~/.framecore-works/earshot`): light about 470 MB, full about 1.5 GB plus about 1.1 GB of models. `llm` (audio upload) and `mcp` stay refused.
- **Own tools.** `listen.py` and `place_sfx.py` in `skills/framemotion/assets/sound-listen/` adapt definitions and measurements from earshot, rewritten in FrameMotion's own code.

Updating Earshot is a deliberate change in both repositories: Toolbox first, then a new copy here with a new manifest.
