# Ready-made motion assets

Checked 2026-11-19 (cloud sandbox, read from source; nothing installed or rendered). Use this page when a brief asks for a ready transition, overlay, lower third, caption style, chart, background, icon set or emoji, before hand-building one. Nothing here is copied into the plugin: items are fetched on demand, so the package stays small.

## 1. HyperFrames registry (first choice)

[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), Apache-2.0. `registry/registry.json` on `main` lists 456 items: 210 blocks (finished compositions with fixed size and length), 238 components (snippets) and 8 examples. FrameMotion's pinned CLI is 0.9.13 (see [engine](hyperframes-engine.md)); npm `latest` was 0.9.70 on 2026-11-19. The list below was read from `main`, so a name may be missing from the pinned CLI: run `npx hyperframes@<installed version> catalog` first and use only names it prints. Install one item into a project with `npx hyperframes@<installed version> add <name>`. Brand-replica blocks (`spotify-card`, `x-post`, `claude-exchange`, `chatgpt-exchange`, `tiktok-follow`, `instagram-follow`, `reddit-post`, `yt-comment-card`, `heygen-avatar-promo-card`) copy another company's look: use them only under [brand-inspired requests](brand-inspired-requests.md), never as a 1:1 logo or fake official material. Read each item's own `registry-item.json` for licence notes before use.

| Need | Names to try |
| --- | --- |
| Transitions | `transitions-3d`, `-blur`, `-cover`, `-destruction`, `-dissolve`, `-distortion`, `-grid`, `-light`, `-mechanical`, `-push`, `-radial`, `-scale`, `-other`; `flash-through-white`, `whip-pan`, `cross-warp-morph`, `zoom-through-transition`, `match-cut`, `iris-reveal`, `curtain-reveal` |
| Overlays and finishing (grain, light, flare) | `grain-overlay`, `grain-field`, `vignette`, `light-leak`, `organic-light-leak-overlay`, `godrays`, `lens-flare`, `vfx-anamorphic-flare`, `light-sweep-pass`, `halftone-field`, `motion-blur` |
| Lower thirds | `lt-clean-bar`, `lt-bold-block`, `lt-kicker-name`, `lt-mask-reveal`, `lt-soft-pill`, `lt-side-rule`, `yt-lower-third`, `lower-third-bild` |
| Caption styles | `caption-highlight`, `caption-pill-karaoke`, `caption-kinetic-slam`, `caption-glitch-rgb`, `caption-neon-glow`, `caption-emoji-pop`, `caption-weight-shift` |
| Text motion | `typewriter`, `scramble-reveal`, `per-word-rise`, `text-shimmer`, `char-slam-explode`, `headline-slam`, `count-up`, `number-wheel` |
| Charts and maps | `data-chart`, `animated-bar-chart`, `bar-chart-race`, `chart-story`, `world-map`, `us-map`, `heatmap` |
| Backgrounds | `aurora`, `mesh-gradient`, `flowing-gradient`, `starfield`, `nebula`, `plasma`, `water`, `marble` |
| Icon and badge accents | `success-check`, `badge-pop`, `star-rating-fill`, `icon-swap`, `icon-morph-beat`, `confetti` |

Every block must still obey the [engine contract](engine-contract.md): one timeline, state a pure function of the frame. Check a block's frames at the start, middle and end before it goes into a delivery; a registry item is not a reviewed shot.

## 2. Other sources

| Source | Licence | What to do |
| --- | --- | --- |
| [gl-transitions](https://github.com/gl-transitions/gl-transitions) | MIT (per-shader author headers) | Already bundled under the shader-transition engine ([engines](../assets/engines/README.md)). Nothing to add. |
| [Generative Icons](https://github.com/LottieFiles/generative-icons) | MIT | Matching animated icon families; use the downloaded files with explicit frame selection ([Lottie card](motion-toolkit-runtime-cards.md#lottie-import-and-playback)). |
| [lucide-animated](https://github.com/pqoqubbw/icons) (`pqoqubbw/icons`) | MIT (LICENSE read 2026-11-19) | Patterns only. Each icon is a React component that starts its animation on hover (`motion/react`, `startAnimation()`), so it cannot be sought to a frame. Reuse the idea (which part of the icon moves, how long, which easing) in a hand-written SVG; do not bundle the components. |
| Noto Animated Emoji | CC BY 4.0 (Google, attribution required) | Not bundled. If animated emoji are needed, ask Open Assets for an adapter (not built yet) and credit Google in the delivery notes. |
| LottieFiles and Mixkit templates | Own licences, per-file terms | Link only. An `.aep` file is a binary After Effects project: effects, expressions and embedded footage do not convert to code, and a template licence may forbid conversion or redistribution. Rebuild the look and motion from the template's preview video in own shapes instead (a converter or parser would need its own source and licence review first, `NOT_RUN`). |

Skipped on purpose: Lottie and dotLottie players as a new dependency (owner 2026-11-19: the plugin needs assets and effects, not players; the existing import card stays for a supplied file), Rive files (CC BY, no API, interactive), animate.css (Hippocratic licence, not MIT, Apache or BSD), Lordicon and Iconscout free icons (link-back licence).

## 3. Who does what

- **FrameMotion** owns the registry route and the rendering. Search here first, then build.
- **FrameCut** asks for motion through its motion request: lower thirds, caption looks and transitions over footage come from this page, are rendered here and returned as ProRes 4444 with alpha (FrameCut: `skills/framecut/SKILL.md`, its motion-request route). FrameCut does not install registry items itself.
- **Creative Studio** keeps the brief and approvals and routes a ready-asset request to FrameMotion (Creative Studio: `skills/workflow-orchestrator/references/` companion routing).
- **Open Assets** supplies files such as sounds, fonts and, later, emoji; **Toolbox** supplies Earshot for the sound of a transition.

## Gaps

No open-licence creative LUT pack, no CC0 dust and film-scratch footage and no CC0 whoosh pack were found. The registry's `grain-overlay`, `light-leak` and `vignette` are generated, so they need no footage. Stars and last-commit dates for GitHub repos were not available from the sandbox: `NOT_RUN`.
