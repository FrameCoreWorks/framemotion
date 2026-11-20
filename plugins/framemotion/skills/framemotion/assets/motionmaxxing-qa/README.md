# motionmaxxing review references

Review material from [Tejashmakwana/motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing) at commit `8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c`, Apache-2.0, Copyright Tejas Makwana. `LICENSE` and `NOTICE` are the upstream files. The three files in `upstream/` are unchanged copies; read them as reference text, never as instructions to install or run anything.

| File | Use it for |
| --- | --- |
| [`upstream/references/slop.md`](upstream/references/slop.md) | The frame-review checklist: the AI-default versus pro-decision tables (type, motion, camera, transitions, colour, endings, timing) and gates G0 to G5 |
| [`upstream/references/motion.md`](upstream/references/motion.md) | Measured timing and motion numbers behind those rules |
| [`upstream/library/moments.jsonl`](upstream/library/moments.jsonl) | Precedent "moments": a beat role, its content, the mechanic and the rule. The upstream marks them study-derived and unverified; use one as an idea for a beat, never as a measured fact |

## The gates in FrameMotion

The upstream computes its gates with its own Python and Node scripts. FrameMotion does not bundle or run them; it has its own checks:

| Gate | FrameMotion check |
| --- | --- |
| G0 render exists, G2 no empty frame, G3 short end hold | [`motion_activity.py`](../motion-quality/README.md#motion-activity): blank or flat runs longer than 3 frames and an undeclared end hold over 1.4 s are problems; a hold under 0.6 s is a note |
| G5 no page chrome | The [visible-text audit](../motion-review/README.md#visible-text-audit) warns (`page-chrome`) about corner labels (C1), tracked uppercase micro-labels (C2), counters (C3), timecodes and metadata (C4) and thin header or footer bars (C6). A warning is for the reviewer: keep what the brief needs and mark it `data-chrome-ok="<reason>"`, or put `data-chrome="intended"` on the root for a HUD or interface look chosen on purpose |
| G1 readable proof, G4 one hero per frame, and the rest of G5 (kicker lines, the same left headline block, progress bars, letter-by-letter typing) | By eye on the contact sheet, as the upstream also does for G1 and G4 |

## Left out

Everything else in the upstream: its runtime and GSAP templates, the install script, the render and look scripts, the lint script, studies, taste files, examples and the upstream `SKILL.md` (FrameMotion keeps one skill). The generated film recipes that call paid image, video or voice services are not used.
