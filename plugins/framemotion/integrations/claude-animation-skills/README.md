# claude-animation-skills attribution

[artemnovitckii/claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) by Artem Novitckii at `5dbea55c23aa6a5c93dc3cfb5583840513b56b94`, MIT. [LICENSE](LICENSE) is the unchanged upstream notice.

FrameMotion uses it in three places:

- **Reels engine** ([README](../../skills/framemotion/assets/reels-engine/README.md)): the kit and four reel styles (graph, map-route, minimalistic-graphics as `minimal-line-art`, zach-d-films as `what-if-3d`) are bundled unchanged except one line of the 3D example's `src/shots.js`, which makes shot 7 independent of the frames drawn before it. [source-manifest.json](source-manifest.json) lists every file with its upstream path and SHA-256, and the changed file's current hash. `install.sh` and `kit/setup.sh` are not bundled.
- **Stickman engine**: the method of its stick-figure reel (script shape, shot lengths, camera, short captions, sound under the voice), rewritten in FrameMotion's own words in [stickman explainer craft](../../skills/framemotion/references/stickman-explainer-craft.md#vertical-cartoon-reel) and as FrameMotion's own code in the [reel additions](../../skills/framemotion/assets/stickman-engine/framemotion/reel.js). No file of it is copied.
- **Cutaway teardown**: FrameMotion's teardown is rewritten after its breakdown template. No file of it is copied.
