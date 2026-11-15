# SFX library (CC0 recordings)

260 short recorded effects for launch videos and UI motion, ready to lay on frames with [`place_sfx.py`](../sound-listen/README.md#place-samples-on-the-frames). They are unchanged copies of the library in [latent-spaces/brag](https://github.com/latent-spaces/brag) at commit `669ab9286aa28b6c3ee30e75f181ee74319d012a` (`skills/brag/assets/sfx/`). The hashes of every file are in `integrations/brag/source-manifest.json`, and a test checks them. Its music (CC BY 4.0 by Sascha Ende) is left out on purpose.

| Folder | Files | Source and licence |
| --- | --- | --- |
| `casino/` | 51 cards, chips, dice | [Kenney, Casino Audio](https://kenney.nl/assets/casino-audio), CC0 |
| `impact/` | 109 soft, heavy, metal, wood, glass and plate hits | [Kenney, Impact Sounds](https://kenney.nl/assets/impact-sounds), CC0 |
| `interface/` | 20 clicks, switches, drops, glitches, errors | [Kenney, Interface Sounds](https://kenney.nl/assets/interface-sounds), CC0 |
| `ui/` | 48 clicks, switches, rollovers | [Kenney, UI Audio](https://kenney.nl/assets/ui-audio), CC0 |
| `keyboard/` | 32 single key presses | [Keyboard Soundpack #1](https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes) by unicae_games, CC0 |
| `sfx-analysis.md`, `sfx-analysis.json` | brightness, high-frequency risk, envelope and safest picks per use | brag (MIT, [LICENSE.brag](LICENSE.brag)) |

Licences were checked on the source pages on 2026-11-14. CC0 needs no credit; we name the sources anyway.

## Use

1. Read `sfx-analysis.md` first (it covers 228 of the 260 files; `keyboard/` is not analysed, as upstream): it lists the safest picks per use (a hard transition, a reveal, a button press) and flags bright, fatiguing files. Prefer low or medium high-frequency risk for anything repeated.
2. Write a cue file (`t` or `frame`, `file`, `align`, `gain_db`) and run `place_sfx.py` on the silent render. For typing, vary across the 32 key presses so repeated letters do not sound mechanical.
3. Designed sound stays the default for a FrameMotion film ([motion sound](../motion-sound/README.md)); these recordings are for a launch or UI film that wants real clicks and hits, or a user who asks for them. Measure the delivered file as usual.
