# Reference analysis

The repository contains four MP4 files, but two are byte-identical duplicates. The usable reference set has three unique videos:

- `Bro's Wife Started a Railway Drama`: 720×1280, 60 fps, about 12.2 seconds.
- `Bro Thought He Was Rich`: 720×1280, 24 fps, about 10.1 seconds.
- `Always Think Ahead`: 720×720, 24 fps, about 11.8 seconds.

Analysis artifacts:

- `report.json`: metadata, estimated cut times, motion scores, audio RMS and peak times.
- `transcripts.json`: local Whisper transcription and word timings.
- `*-contact.jpg`: half-second contact sheets covering each video.
- `details/`: full-size representative frames.

## Shared visual grammar

The references are 2D cartoon/comedy shorts, not sparse diagrammatic stick figures. They use:

- Very thick, clean black outlines.
- Large characters occupying roughly half to three-quarters of the frame height in portrait shots.
- Oversized expressive heads with readable eyes, brows, mouths, cheeks and hair/accessories.
- Strong pose changes: pointing, reaching, leaning, sitting, holding phones, gesturing with both arms, running, and face close-ups.
- Distinct character silhouettes and clothing colors. The first reference uses a yellow-dressed woman and a bearded man in a light blue hood; the second uses a curly-haired man in a black jacket and a small angry girl; the third uses bald white-headed characters in red/navy shirts with white cartoon hands.
- Full-color environments with architectural, furniture, or location details. The background establishes the place and persists through a beat; it is not an empty dark room.
- Alternation between wide establishing shots, medium two-shots, close face reactions, and object/detail inserts.
- Camera changes and punch-ins at jokes or reveals. The frames are not a single fixed camera with tiny limb motion.
- Exaggerated facial acting as the main motion carrier, followed by body gestures and prop movement.

## Differences between references

- `Bro's Wife...` uses speech bubbles and a yellow top hook card. It relies on pose changes, reaction close-ups, and a train-platform location. The cartoon characters have colored clothing, visible hair/beard, large eyes, and expressive mouths.
- `Bro Thought He Was Rich` uses clean white word-by-word subtitles at the bottom with a dark outline. It alternates a station wide shot with a phone call close-up, an office phone shot, and a short live-action meme insert at the end.
- `Always Think Ahead` uses simpler bald white heads, colored shirts, white glove-like hands, a kitchen set, and close face reactions. It uses a square frame rather than portrait and makes the wallet/box handoff the main prop action.

## Motion and edit findings

The railway reference has estimated changes around 2.0, 2.9, 5.0, 6.9, 7.5, 8.9, 10.1 and 10.6 seconds. The other portrait reference cuts around 1.5, 2.9, 7.0 and 8.9 seconds. The square reference cuts around 2.7, 5.2 and 7.1 seconds. These are story beats, not constant camera shakes.

Typical beat pattern:

1. Establish the place and the character's immediate problem.
2. Cut to a close-up when the key line or emotion lands.
3. Cut back to a two-shot for the reaction or reversal.
4. Use a prop handoff or pointed gesture to make the joke visible.
5. End on a held reaction or punchline, sometimes with a top card, bubble, or caption.

Motion is mostly pose-to-pose cartoon animation with camera punch-ins and lateral reframing. It is not physically continuous 3D animation. The important requirement is semantic motion: the hands, eyes, mouth, prop and camera must all change for a reason tied to the spoken line.

## Captions, dialogue and audio

- `Bro Thought He Was Rich` has readable bottom captions, usually one to three words, white with a dark outline, and the currently spoken word is easy to follow.
- `Bro's Wife...` uses speech bubbles and a yellow hook card instead of persistent bottom subtitles.
- `Always Think Ahead` has no persistent bottom caption in the sampled frames; dialogue is carried by the voice and faces.
- Transcripts are short dialogue exchanges with pauses and reaction timing. They are not dense explanatory narration.
- Audio RMS is highest around the visual joke or reaction peaks. The references use voice-first mixing with comedic accents; effects should land on object contacts, cuts and punchlines rather than a constant alarm bed.

## What the previous generated Stick Story missed

The previous output used a small anonymous black figure in a mostly flat elevator, repeated gold step cards, minimal face acting, no detailed character identities, and weak camera variation. That matches the supplied skill's sample engine but not the uploaded reference films.

To move closer, the new version must use larger painted-style 2D cartoon figures, distinct faces and clothing, richer illustrated backgrounds, close-up reaction shots, meaningful prop/hand contacts, timed camera punch-ins, and reference-style captions or dialogue bubbles. The gold step-card system should be removed from the comedy story route unless the user asks for instructional cards.

## Added style 5 and style 6 references

`style-5-japan.mp4` is a 30.1-second 1280×720, 30 fps explainer. Its sequence is deliberately storyboarded: an opening fire/character close-up, a sword and town establishing shot, an extended Japanese street move, an indoor seated writing/classroom sequence, a patrol outside, a parchment/detail insert, a merchant exchange, and a final calligraphy/desk-job close-up. The figures are intentionally simple white-headed period characters, but the world carries the depth: foreground walls and tables, middle characters, distant buildings, layered architecture, warm light, and camera movement between scales. The character motion is pose-to-pose with small hand, head, brush and walking changes; the high perceived motion comes from camera travel, cut rhythm, parallax, prop contacts and changing compositions rather than every pixel changing every frame.

`style-6-amber-noir-flow.mp4` is an 8-second 1280×720, 24 fps dark cinematic clip. It uses an orange-hooded faceless figure, deep plum shadows, amber shop light, strong foreground/background separation, and a lateral run. The camera tracks the runner while the storefront and street layers move at different apparent rates. The character has readable arm and leg cycles, a held phone/prop, and a strong silhouette instead of detailed facial animation. The audio is sparse and low-level with a short alarmed vocal opening and repeated panic vocal later.

The upgraded implementation should therefore use real 30 fps frame evaluation, not a frame-count illusion: interpolate pose states, animate gaze/blinks/mouth/shoulders/hands, add anticipation-contact-recovery phases, move props with the gripping hand, and move camera and background layers at different rates. A 2D painted/cel-shaded render with parallax, soft shadows and perspective is a better achievable target here than pretending to have full 3D geometry.
