# Stickman and faceless explainer craft

How Studio makes stick-figure explainers, short stories and faceless channel videos (YouTube, Shorts, Reels,
TikTok): a narrator's voice, a simple figure acting out the idea, props and diagrams, captions and sound. Use it
with FrameMotion's built-in [Stickman engine](../assets/stickman-engine/README.md), with any HyperFrames, Remotion or
Animate engine composition, and for prompts to a video generator.

Written in FrameMotion's own words from reviews of [stickman-kino](https://github.com/dsauce/stickman-kino) by Prerit
Ahuja at `d3d665301c0b62f04c885785e6bd6044de0785c6` (1.0.0, MIT) and
[Stickman Video Director](https://github.com/kaomei/stickman-video-director) by kaomei at
`eb4bb378c4716a617f9ad7d98a60379b9d1fa54a` (MIT). No code or skill text was copied. Credit them when a piece
follows their method closely. The vertical cartoon reel below also follows the stick-figure reel method of
[claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) by Artem Novitckii at
`5dbea55c23aa6a5c93dc3cfb5583840513b56b94` (MIT), in FrameMotion's own words and code.

## Route

- **Built-in Stickman engine** (default where a shell, Node.js and a browser run): the bundled Stickman Kino engine,
  unchanged except one rig option, with FrameMotion's reel additions. A film is a folder with `film.json` (clips,
  voice lines, theme, format) and `scenes.js` (what happens in each clip, in clip seconds). It renders through the
  shared engine renderer like every other engine; see the [engine README](../assets/stickman-engine/README.md) for the
  API, the 58 poses, about 200 props and the samples. Its voice, music and final mix follow FrameMotion's sound route,
  not the engine's own tools. FrameMotion keeps the brief, script, copy locks, board plan and review.
- **Toolbox entry `stickman-kino` installed** (its skill is in this host's list): it is the same engine with its own
  command line, voice and music set-up. Use the built-in engine unless the user asks for the entry.
- **No shell:** plan the film (script, look, character sheet, `film.json` and the shots) and hand it over; nothing
  renders.
- **Video generator instead** (Veo, Kling, Gemini, Sora and similar): write the clips with
  video-prompt-architect (Creative Studio: `skills/video-prompt-architect/SKILL.md`) and apply the character and voice locks below.

## Pick a look

Offer at most three looks that fit the subject, then write the chosen one into the brief:

| Look | What it is | Good for |
| --- | --- | --- |
| Classic line | One black or white figure with a hollow round head on a flat white or black field, plus up to three bright accent colours on props and graphics only | Ideas, psychology, business lessons |
| Clean studio pop | A figure with one signature clothing item (a coloured cap, a shirt) on a bright white set with a faint floor grid and glassy blue interface panels | Tech and product explainers |
| Cozy story | White-headed figures with dark stick limbs in warm, full-colour cartoon places that change with each scene (cafe, street, room) | Life stories, habits, gentle narratives |
| Period cartoon | The same figure grammar in costume and cel-shaded settings of an era, with one era pack for the whole film | History |
| Hand-drawn minimal | Crayon-like line figures and props on paper or a light grid, captions in a handwriting face | Faceless channel explainers |
| Retro TV | Grey and white figures on a dark field, soft bloom, faint scanlines and vignette added after the picture and before clean captions | Lore, mysteries, retro topics |

Never copy a particular creator's or channel's character, colours or set design; a look is a general grammar,
not someone's identity. Any channel the user points to is a reference to learn from, not a template to reproduce.

## Lock the character

- Write one complete description of each figure (head, limbs, line weight, colour, the one clothing item, what the
  face may show) and freeze it after approval.
- In a code build, keep it as one component or rig used everywhere. For a video generator that takes no reference
  image, repeat the full frozen description word for word in every clip. "The same character" or a shortened
  description lets the generator drift.
- Keep the figure's design apart from what changes per shot: where it stands, its pose, which prop it holds and the
  state of that prop. A prop handed over in one shot stays handed over in the next.
- Two arms and two legs, one pose per limb at a time: a moving arm replaces its old position rather than adding a
  third arm.
- With several characters, freeze a card for each and name in every clip which ones are on screen.

## Rhythm

- Lead with the voice: record or generate the narration first, then time the pictures to the real speech and its
  pauses. Never slow the voice or stretch pauses to fit a planned length.
- Budget about 20 to 25 spoken words per 10 seconds (2 to 2.5 words a second) and check it with the
  VO budget (Creative Studio: `skills/copy-voice/SKILL.md`) before the voice is made.
- Something meaningful changes every 2 to 3 seconds: a new action, a prop entering, a cut or a diagram building.
  The main figure or object is never still for more than about 2.5 seconds unless the board marks a deliberate hold.
- Give each 10-second stretch three timed beats, and end each shot in a way that leads into the next one: the same
  action continuing, a prop carried across, the same screen direction or a planned cut.
- Open on the most surprising question or picture within the first 2 to 5 seconds. A useful order for an explainer:
  hook, the common belief, why it is wrong, what is really going on, the payoff and one question for the viewer. Use
  it as an option, not a rule: a short story ends on its punchline, not on a question.
- Do not invent statistics, quotes or results the source does not support.

## Sound

- Give every scene a quiet bed of its place (room tone, street, rain, wind) under the voice, unless the board
  marks a deliberate cut.
- A deliberate cut to silence is written into the plan with its reason and with what brings the sound back (a door
  slam, the narrator's next line). It mutes the bed, music and effects, never the narration.
- Effects follow the action on screen (a step, a door, a pen tap), matching the material, weight and distance; they
  never stand in for missing motion.
- Keep the voice on top. The audio direction (Creative Studio: `skills/audio-production-director/SKILL.md`) and Toolbox's Earshot
  measure loudness and place effects on the right frame.

## Vertical cartoon reel

A 9:16 reel of 30 to 45 s that answers one surprising question: a bright world, stick people with big white heads,
a camera that never stops, short captions and cartoon sound. In the Stickman engine it is theme `cartoon`, the
`bighead` character, `sc.drift()` for the moving camera and `sc.reelCaptions()` for the captions (the
`stickman-reel` sample shows all four).

- **Script.** About 110 to 120 words for 38 to 40 s, one idea per sentence, in this order: a "what if" question,
  what most people believe, a turn on "but", examples that build, one shot that shows how it works, and an ending
  that answers the opening question. Show the script before animating, and check every claim; hedge a theory.
- **Shots.** About 10 to 12 set-ups, most 2 to 4 s, the mechanism shot longer; a new idea gets a new set-up. Open
  mid-action on frame 1. Keep faces and key props clear of the caption band and inside the safe area of the platform
  the user names.
- **Camera.** A slow push with a little handheld drift in every shot, a whip pan with blur between topics, and an
  impact made of a burst, a short shake and a flash.
- **Captions.** One or two lowercase words at a time, popped in on the voice, without punctuation or dashes (digits
  and % stay). For this look that replaces the one-line rule below; every other piece keeps one-line captions.
- **Sound.** Effects sit under the voice, and the music is a quiet plucked bed ducked under it, never a loud loop at
  the start.

## Captions and checks

- Captions are one line: break at meaning and real speech pauses, never by word count and never by shrinking the
  text. Follow FrameCut's captions guide (FrameCut: `skills/framecut/captions/CAPTIONS.md`) for safe areas and check the encoded frames.
- Before delivery look at frames from the whole timeline (contact sheet), check that figures stand on the ground,
  nothing leaves the frame, every shot has visible motion and every caption is readable, then watch the render.
  Report what was checked and what is NOT_RUN.
