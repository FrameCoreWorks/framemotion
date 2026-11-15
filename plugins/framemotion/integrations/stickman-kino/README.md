# Stickman Kino attribution

The [Stickman engine](../../skills/framemotion/assets/stickman-engine/README.md) is [dsauce/stickman-kino](https://github.com/dsauce/stickman-kino) by Prerit Ahuja at `d3d665301c0b62f04c885785e6bd6044de0785c6`, MIT. [LICENSE](LICENSE) is the unchanged upstream notice. [source-manifest.json](source-manifest.json) lists every bundled file with its upstream path and SHA-256; the one changed file (`engine/sm-rig.js`, a `headScale` option) carries both the original and the current hash.

The bundled fonts keep their SIL Open Font License 1.1 text (`engine/fonts/OFL.txt`). GSAP is installed from npm by the engines folder's lockfile and never bundled. The command line, installers, voice and music tools and the upstream agent skills are not bundled or run.

The Toolbox catalog entry `stickman-kino` installs the original with its own command line.
