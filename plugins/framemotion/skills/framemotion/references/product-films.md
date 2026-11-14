# Product films

A product film shows a real product working: its screens inside a phone or a window, one step at a time, with every move timed. Studio builds it from the user's own screenshots with the [`device` scene kind](../assets/motion-scenes/README.md#device-scenes), so it runs in every renderer (preview, Python renderer, Remotion) and needs no access to the app's code. The rules are adapted from [kaventro/motion-designer](kaventro-motion-designer-adaptation.md), which rebuilds interfaces in HTML instead.

## Materials

- **Screenshots of the real product**, one per state the film shows (before and after an action, a detail, a result), at the device's native size or larger. PNG or JPEG; a data URI in the contract keeps the film self-contained and is required for the browser export. Record each in `assets` with `src`, `width`, `height`, `alt`, `source` and `status`.
- **Fictional data on screen.** Names, amounts, files and people in the screenshots are invented and plausible; no real customer data, even blurred. Card numbers show only fictional last digits. Label illustrative numbers ("Example data") when they could be read as claims.
- **Real features only.** Show what the product does, the way it does it: opt-in features as the user turning them on, never as defaults; nothing about speed, accuracy, privacy or on-device processing that the product does not support.
- Ask only for what is missing: the screenshots, the format and length, the features that must appear and claims to avoid. Studio does not invent a product's interface.

## Story

1. **Hook in the first two seconds:** the strongest action or result, or the problem it solves.
2. **One flow per scene,** in the product's own words: a screen, the action (a screen change), the result held long enough to read.
3. **The biggest result on the reveal** (on the drop when there is music), then a pull-back.
4. **End card:** name, one line in the product's voice, where to get it; the last frame can rhyme with the first.

Plan the order as moment roles (FrameCut: `skills/framecut/references/moment-roles-and-clips.md`) (hook, setup, proof, turn, payoff, cta) so cutdowns reuse the same windows. **A film from a pull request or changelog** (added 2026-11-04): read the diff, commits and description for one user-visible change; show it as before and after in the product's real screens, the code only as a short supporting beat; claims stay inside what the change does, checked with the author.

## Rules for the frame

- **The device is always there.** A phone keeps both side edges and its island in frame; a window keeps its title bar and controls in frame. Never show the interface full-bleed. Keep camera focus at about 1.5× or less and aim it so the island or title bar stays visible.
- **Show the cause.** A tap marker (`taps`) presses the control 3–5 frames before the next screen arrives; a viewer then sees what was touched. Never tap something in the same beat it appears.
- **Web apps in a browser.** `frame: 'browser'` adds an address field; its `url` copy is interface chrome, so keep it out of the scene's `copy` list and expect a small-text warning in vertical formats.
- **One action per beat, then a hold.** A screen change takes the transition (12 frames by default); its result holds 1–2 s before the next action. Camera moves happen between actions, never during one.
- **Captions beside the device, never over it.** The `device` kind puts the caption on the free side in landscape and above the device in vertical formats.
- **Motion comes from the product.** Screen changes push like the product's own navigation; no crossfades between scenes, glow, 3D flips or particles on the interface.
- **Readable on a phone.** Text that matters is at least about 20 px on the 1080-short-side stage; move the camera in rather than shrinking the film, and review at phone size.

## App Store previews

App Review Guideline 2.3.4 allows only captures of the app itself (with narration and text overlays) in an App Store app preview, and 2.3.7 asks not to show prices. A Studio product film with drawn device frames is for websites, social posts, press and launch pages. For an App Store preview, record the app itself and say so.

## Contract example

[`examples/app-film.motion-score.json`](../assets/motion-scenes/examples/app-film.motion-score.json) shows a phone with a tap, two screens with a push between them, a camera focus on the new row and a caption, a browser window with an address and a caption on the other side, an end card, and a 9:16 variant. Its screenshots are original and show fictional example data.

## Launch film from a project folder

A short film (15 to 25 s) made from a project the user built, a site or an app, with no brief beyond "make a launch video". The flow is restated from [brag](https://github.com/latent-spaces/brag) by Shunit Haviv Hakimi (MIT; `integrations/brag/`).

1. **Inspect.** Read the page, its styles, the README and the package description, and walk the main user flow. Answer nine questions in writing: what the product does in one sentence, its strongest claim, the visual hook, which real screen to show, the shortest film that lands, the tone, what the sound should feel like, the share caption, and the two or three steps of using it worth showing. Take colours and fonts from the project itself.
2. **Plan.** One page: the angle (why this film could only be about this project), the hook in the first two seconds, two or three concrete moments from the product, the flow as the centrepiece, the ending line before the logo. No implementation details yet.
3. **Compose.** Turn the plan into the usual storyboard and motion contract, then build (HyperFrames, or the `kaventro-mobile`, `kaventro-desktop` and `kaventro-story` templates in [engines](../assets/engines/README.md)). Lock the reveal on a strong beat of the music; ground every on-screen claim in the project's own text.
4. **Deliver.** Render and review as usual. Pick the poster at the strongest settled beat, never mid-transition, and make it frame 0 so every platform's thumbnail shows it. Write the share caption in the film's tone.

**Nothing secret on screen.** Whatever is read in step 1 can end up in a public video: never carry keys, tokens, internal addresses, real customer names, emails or other personal data into the plan, the film or the caption. Replace real data in the UI with plausible stand-ins and say so.

For real clicks, key presses and hits, the [SFX library](../assets/sfx-library/README.md) holds 260 CC0 recordings placed with `place_sfx.py`; FrameMotion's designed sound stays the default.
