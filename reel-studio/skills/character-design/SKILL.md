---
name: character-design
description: Design, lock and check characters for a film: silhouette, face, emotions, voice, consistency. Use before the storyboard of any film with a character, host or dialogue, and whenever a character looks wrong or emotions do not read.
---
# Character design
Read `docs/CHARACTER-BIBLE.md` (all of it: it is the spec). Library: `characters/*.json` (maya, leo, dr-ito, sam, rex, nova), schema `schemas/character.schema.json`.
1. Role first, silhouette second (hair style + one feature differ between characters), then face (eyeScale, glasses, beard), palette, voice (gender and tone).
2. Copy a library file, change it, `node tools/validate.mjs character characters/<id>.json`.
3. Prove it acts: `node tools/character_sheet.mjs characters/<id>.json` (every emotion, measured against calm), then OPEN the sheet and run the vision critic `faces`.
4. Use the same `look` object in every shot; give each character its own voice and `emotion` per line (at least three emotions per story).
Never copy a character from a reference. Never put a stylised character in a photoreal set.
