---
name: visual-prompt-writer
description: Writes image, video-model and 3D/scene prompts for every shot with frozen character and style blocks so the look stays identical across shots. Use when the style needs generated or hand-built assets, and before any asset is made.
---

# Visual prompt writer

Goal: every shot's asset is described so that a different AI or person would produce the same look. Output `assets/prompts.json`.

## Four frozen blocks (written once per project, pasted verbatim into every prompt)
1. **STYLE block:** medium, line quality, palette (hex), lighting, lens, texture, what is never allowed (copy of any reference character, brand marks, text in the image).
2. **CHARACTER blocks:** one per character: silhouette, face construction, clothes, colours (hex), distinguishing mark, the emotion set (neutral, talking, explaining, pointing, thinking, surprised, approval, plus any story-specific).
3. **WORLD block:** set, time of day, materials, props that recur, scale.
4. **CAMERA language:** framing/angle/move vocabulary from `playbooks/camera` so the prompt says 'low angle, slow push-in' not 'cool shot'.

## Per-shot prompt
`{ shot_id, purpose, STYLE+CHARACTER+WORLD (by reference id, never paraphrased), action (one verb), emotion, framing, angle, move, duration, text_on_object (diegetic only), negative, seed_or_reference_image }`.

## Rules
Say what is visible, not what it means. One action per shot. Colours as hex, sizes as ratios. Characters are our originals (x, y or new), never the reference mascots. Text inside images is avoided; text is an overlay or a diegetic prop with the exact words listed. After the asset is made, look at it (contact sheet) and compare with the character block before using it.
