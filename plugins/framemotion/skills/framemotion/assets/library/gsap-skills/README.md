# gsap-skills in FrameMotion

GreenSock's official GSAP skills, bundled in full in [`upstream/`](upstream/) at commit `aed9cfd3277740755f6bfc1155c7aa645403b760` (Copyright (c) 2026 GreenSock, MIT, [licence](upstream/LICENSE)). Knowledge only: nothing to install or run.

## When FrameMotion reads it

Any GSAP build (HyperFrames compositions, the GSAP starter, engine scenes, web pages) whose topic the [frame summary](../../../references/gsap-and-threejs-for-frames.md) does not cover in full. Open the page for the topic, not all of them:

| Topic | Page |
| --- | --- |
| tweens, eases, defaults, `gsap.set`, `quickTo` | [gsap-core](upstream/skills/gsap-core/SKILL.source.md) |
| timelines, labels, position parameter, nesting | [gsap-timeline](upstream/skills/gsap-timeline/SKILL.source.md) |
| SplitText, MorphSVG, DrawSVG, Flip, MotionPath, CustomEase and other plugins | [gsap-plugins](upstream/skills/gsap-plugins/SKILL.source.md) |
| `gsap.utils` (mapRange, interpolate, wrap, snap, random with seeds) | [gsap-utils](upstream/skills/gsap-utils/SKILL.source.md) |
| frame rate, will-change, transforms, batching | [gsap-performance](upstream/skills/gsap-performance/SKILL.source.md) |
| ScrollTrigger (web deliverables only) | [gsap-scrolltrigger](upstream/skills/gsap-scrolltrigger/SKILL.source.md) |
| React, Vue, Svelte (web deliverables only) | [gsap-react](upstream/skills/gsap-react/SKILL.source.md), [gsap-frameworks](upstream/skills/gsap-frameworks/SKILL.source.md) |

[`llms.txt`](upstream/skills/llms.txt) is the upstream index of the same pages.

## What FrameMotion changes

1. **Seekable for video.** A timeline that becomes frames is built paused and driven by time (`tl.seek(t)` or `tl.progress()` from the renderer), never by `requestAnimationFrame`, `delay` chains outside the timeline, `onComplete` side effects or `Math.random` without a seed. Upstream examples that autoplay are for live pages.
2. **Pinned version.** FrameMotion's starters and engines use `gsap` 3.15.0 exactly (`assets/gsap-motion-starter/package.json`, `assets/engines/package.json`). All plugins, including SplitText and MorphSVG, are in that free package; never load GSAP from an unpinned CDN URL.
3. **Licence of GSAP itself.** The skills are MIT; the GSAP library is under GreenSock's no-charge licence, which forbids using it in a no-code visual animation builder that competes with Webflow. A client film or a page built in code is fine.
4. **Scroll and pointer topics** apply to a web deliverable. For a video, express the same motion as a function of time.
