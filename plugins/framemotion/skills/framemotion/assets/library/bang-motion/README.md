# bang-motion in FrameMotion

Bang Tutorial's browser motion graphics skill, bundled in [`upstream/`](upstream/) at commit `c1aa65e921c970d858705fcb4a53a8294d1a4131`, skill version 1.19.0 (Copyright (c) 2026 Bang Tutorial, MIT, [licence](upstream/LICENSE)). Its text is Indonesian. Left out: the After Effects bridge for the paid Higgsfield service (`references/ae-bridge-higgsfield.md`, `scripts/ae/`); the exact list is in `integrations/bang-motion/source-manifest.json`.

## Merged into FrameMotion

Its laws are part of FrameMotion's [motion craft](../../../references/motion-craft.md) in English, joined with FrameMotion's own values: [a video, not a slide deck](../../../references/motion-craft.md#a-video-not-a-slide-deck), [style brief before code](../../../references/motion-craft.md#style-brief-before-code), [opener and promo concepts](../../../references/motion-craft.md#opener-and-promo-concepts), [transitions with depth](../../../references/motion-craft.md#transitions-with-depth), [background](../../../references/motion-craft.md#background-always-moving-never-louder-than-the-subject), living text and [traps](../../../references/motion-craft.md#traps-in-browser-builds). Read motion craft first; open the upstream files only for code.

| Upstream file | Use it for |
| --- | --- |
| [`assets/starter-opener.html`](upstream/assets/starter-opener.html) | openers, promos, bumpers, kinetic type as one HTML page: 1920 × 1080 stage, camera rig `#world`, stateful three.js scene, timeline helpers |
| `assets/starter-explainer*.html` | explainers: [continuous action](upstream/assets/starter-explainer.html), collage modes ([cartoon](upstream/assets/starter-explainer-kartun.html), [journalism](upstream/assets/starter-explainer-jurnalisme.html), [catalogue](upstream/assets/starter-explainer-katalog.html), [sketch](upstream/assets/starter-explainer-sketsa.html)) and the [staged cartoon](upstream/assets/starter-explainer-panggung.html) with jointed rigs |
| [`references/techniques.md`](upstream/references/techniques.md) | code recipes: split letters with directional blur, 3D pan per word, camera and shot sizes, transitions, light leaks, glow, WebGL backgrounds, grainy gradient, UI tiles, typing, video clips on the timeline |
| [`references/explainer.md`](upstream/references/explainer.md), [`kartun-panggung.md`](upstream/references/kartun-panggung.md) | explainer structure and the staged-cartoon laws (zoom 1.08–1.95, rigs turned by manual transforms, ten or more moving things per stage) |
| [`references/architecture.md`](upstream/references/architecture.md), [`anti-ppt.md`](upstream/references/anti-ppt.md) | the multi-file structure and the full table of slide-like failures with fixes |
| [`scripts/snap.mjs`](upstream/scripts/snap.mjs), [`vo-pauses.html`](upstream/scripts/vo-pauses.html), [`serve.py`](upstream/scripts/serve.py) | key-second stills, voice-over pause detection in a browser, a no-cache server while editing |

## What FrameMotion changes

1. **FrameMotion leads.** Brief, copy locks, rundown approval, motion contract, QA, sound and delivery are FrameMotion's; bang-motion's style brief is part of that brief.
2. **No Higgsfield, no After Effects.** Photos come from the user, the `framecore-open-assets` plugin or licensed stock; a generator only through a tool the user chose and approved.
3. **Render through FrameMotion.** For an MP4, paste [`framemotion-bridge.js`](framemotion-bridge.js) inline after the starter's script and render with FrameMotion's `capture-html.mjs` ([motion export](../../motion-export/README.md#hand-written-html-to-mp4-without-npm)) at the film's fps and size, with `?clean=1`. It drives the same `window.OPENER` seek the upstream export uses, but at any fps (also 30000/1001) and straight to FFmpeg, so no `npm i puppeteer` (unpinned) is needed. For FrameCut, conform as in [From frames to a FrameCut motion request](../../../references/engine-contract.md#from-frames-to-a-framecut-motion-request).
4. **Pinned libraries.** The starters load GSAP 3.12.5 and three.js 0.161.0 from jsDelivr at exact versions; that is acceptable for a web page. For a render without network, or to match FrameMotion's engines, use the local `gsap` 3.15.0 and `three` 0.187.0 and check the page still runs.
5. **Web deliverable.** When the user wants the page itself, keep the upstream defaults: one double-clickable `index.html` with inline CSS and JS, autoplay, loop, no visible player, `?debug=1` for scrubbing.
6. **Credit.** A delivered page built on a starter keeps the MIT notice in its source; name "bang-motion by Bang Tutorial (MIT)" in the project notes.
