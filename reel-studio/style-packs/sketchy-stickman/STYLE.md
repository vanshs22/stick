# Sketchy Stickman

2D comedy and story shorts. The look is a clean vector cartoon: one outline weight (5 px) on everything, white round heads with big off-axis pupils and thick brows, noodle limbs, mitten hands, flat colour-block clothes, flat painted sets.

Engine: `StickScene` (SVG, deterministic): `components/StickScene.tsx`, rig `components/stick/rig.tsx`, sets `components/stick/sets.tsx`. Pose set: idle, wave, point, shrug, hold, head, cross, explain. Moods: neutral, smug, happy, worried, angry, shock, sad, deadpan, shout.

How to stage a shot: pick a set, cast with x positions (0 to 1) and one colour per character, pick the mood for the line (the logic critic checks it against the script emotion), set `speaker` so only that mouth moves, then alternate camera zoom 1 (wide two-shot) and 2.2 to 2.8 with a focus point on the face (punch-in). Cut on the line.

Measured and upgrade notes: `dna.json` from the reference analysis, `upgrade.json` (what is kept, improved and changed). The characters, sets, signs and jokes here are original; only the technique comes from the references.
