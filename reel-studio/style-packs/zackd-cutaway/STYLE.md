# Zack D cutaway explainer (3d)

A curiosity-loop 3D explainer in a clean studio: semi-realistic clay-shaded characters on a seamless backdrop, and a layered cross-section of whatever the question is about (what happens when you swallow gum). A better variant: a fixed colour code for every cutaway (skin tan, fat yellow, muscle red, bone cream, the subject of the story in saturated pink), the cutaway is one object seen from outside and inside, and every cut answers the open question the previous line asked.

Cadence: `cutaway-short` (skills/camera-grammar). Formats: 9:16, 16:9. Looks (renderers/inkbeat/src/looks/looks.ts): zd-studio, zd-inside.

Rules:
- Script = curiosity loop: every sentence opens a question the next one closes; the hook is under 3 seconds (see skills/viral-script).
- Studio look: seamless lilac backdrop, neutral white key, clay shading with a warm bleed in the shade, no outlines, shallow focus for macros.
- The cutaway is the star: a face-on or sectioned object with layers in the fixed colour code, the story's subject glowing pink inside, one painted tag on the outside (STOMACH).
- Alternate wide establishing (character beside a giant organ for scale) and macro on the cutaway; a cut every 2-4 s, a punch-in zoom on every key beat.
- Characters are plain and readable (one outfit, big clear face); no gore: cutaways are clean, rounded, colourful.
- Facts are painted tags or numbers on the object; sound off must still tell the story.
- Loop the ending into the first frame when the answer returns to the question.

Pitfalls:
- A cutaway shown from the closed side reads as a blank wall: aim the cut face at the lens.
- Too much pastel makes the studio milky: keep exposure 0.8 and a lilac, not white, backdrop.
- Do not copy any channel's characters or backgrounds; this pack is a method, not a character set.

Look-dev: `node tools/ink/looks.mjs <outDir> --only zackd` (wide, medium, close in this look).
