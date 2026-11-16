# Engine menu and engine choice per scene

FrameMotion's own engines are listed in [`assets/engines/engines.json`](../assets/engines/engines.json). Each entry names its `group` (one of ten), one plain sentence `about` for the user, `good_for` (logo, title, app, product, data, explainer, story, effect, transition, background) and `inputs` (none, text, image, screenshots, logo, clip, data). Never list engines from memory: run the menu script and translate its text.

## Picking from the menu

When the user wants to choose a kind of film:

1. Run `python3 assets/engines/menu.py` (from the skill folder) and show the ten groups as a numbered list, each with its sentence, in the user's language. Show no engine ids or technical names.
2. When the user picks a group, run `python3 assets/engines/menu.py <number>` and show its engines the same way: one sentence each and the default format. Mention that a slower render is marked (realistic 3D needs a light bake and a longer render).
3. When the user picks an engine, ask the first missing question of the [standalone brief](standalone-brief.md), then plan the scenes as below.

## Engine choice from materials or a description

When the user brings material (screenshots, photos, a logo, a clip, data) or describes the effect:

1. Split the film into scenes from the brief (a hook, the message, proof, an end card, or the user's own order).
2. For each scene, choose the engine whose `good_for` matches the scene's job and whose `inputs` the user actually supplied: screenshots to `app`, product photos to `product`, numbers to `data`, a logo to `logo`, words only to `title` or `story`. Prefer the engine whose `about` matches the requested look; when two fit, take the one whose default format matches the deliverable.
3. Show the plan before any render: per scene its job, the engine in plain words (its `about`, never the id), its length, and one line on why. Ask for approval; the user may swap any engine for another from the same group.
4. Realistic 3D (`gpu_recommended`) only when there is time for its light bake and slower render: say so in the plan.
5. Between scenes, a straight cut is the default; a transition (an engine whose `good_for` has `transition`, in any group) only where it suits the style.

## Rendering the film

Write the approved plan as a `film-plan/1` file ([example](../assets/engines/kit/film-plan.example.json)): `fps` and `size` for the whole film, an optional `background` (#rrggbb, for padding), and `scenes`, each with `engine`, `duration` in seconds, optional `start` (seconds into the engine's own film), `params`, `fit` (`cover` crops to fill, the default; `contain` pads) and `transition_in` (`{"type": "fade", "duration": 0.3}`, an ffmpeg crossfade; leave it out for a straight cut). An optional `audio` (`{"file": "mix.wav"}`, relative to the plan) is laid under the whole film.

Run `node kit/compose.mjs plan.json --out film.mp4` from `assets/engines` (Node, Playwright and ffmpeg; `npm ci` there first). It checks the plan and stops with plain sentences when something is wrong, renders each scene with its own engine at the engine's own size and frame rate, retimes it to the film's frame rate (nearest engine frame), fits it to the film's size, joins the scenes and prints a report (per scene: engine frame rate and size, frames, flat frames). A crossfade overlaps two scenes, so the film is shorter than the sum of the scenes by its length. Choose engines whose default format matches the film where possible: `cover` crops a 16:9 engine heavily in a 9:16 film. Review the film like any other render before delivery. Make the sound for the finished film with [Earshot in FrameMotion](motion-toolkit-routing.md#earshot-in-framemotion) or `sound.py`, then pass it as `audio` or mix it in afterwards.
