# Critic summary

| critic | verdict | score | blocker | major | minor | looked at pixels? |
|---|---|---|---|---|---|---|
| research | fail | 75 | 1 | 0 | 0 | measured only |
| script | pass | 98 | 0 | 0 | 1 | measured only |
| storyboard | pass | 100 | 0 | 0 | 0 | measured only |
| visual | pass | 100 | 0 | 0 | 0 | measured only |
| captions | pass | 100 | 0 | 0 | 0 | measured only |
| voice | pass | 100 | 0 | 0 | 0 | measured only |
| music | pass | 100 | 0 | 0 | 0 | measured only |
| sfx | revise | 90 | 0 | 1 | 0 | measured only |
| frames | pass | 100 | 0 | 0 | 0 | measured only |
| video | pass | 96 | 0 | 0 | 2 | measured only |
| final | pass | 100 | 0 | 0 | 0 | measured only |
| reference | pass | 100 | 0 | 0 | 0 | measured only |

Automatic critics measure; they do not judge taste or story. Vision critics (character, environment, camera, composition, typography, ui, transitions) run only when the agent really opens the images: see `critique.mjs <project> vision --packet <name>`.

## Not covered
- script: Judgement rubric for the agent (not measurable): is the hook specific and surprising? does every line move the story? is it original (not a rewrite of a reference)? would a stranger share it? Put the answers in review/critics/script.agent.json via tools/critique.mjs --agent.
- storyboard: Does each frame look good? That needs eyes: run the vision critics (tools/critique.mjs vision --packet composition|character|environment).
- visual: Does the picture actually look right and explain the line? That needs eyes: run the vision critics (tools/critique.mjs <P> vision --packet composition).
- voice: Whether the voice SOUNDS good (warmth, emphasis) needs a human ear: this critic checks clipping, gaps and intelligibility only.
- music: Music taste (does it fit the mood?) needs a human ear. The beds are procedural: calm, upbeat or tension.
- frames: frames taken from the rendered film (accept-software-demo.mp4), one per shot
- frames: Looks good? Is the composition beautiful? Those need eyes: tools/critique.mjs vision --packet composition
- video: Is the edit coherent and moving? Count the measurable things here, then look at the contact sheet yourself (tools/critique.mjs vision --packet video).
- final: TEST project: nothing here was approved by a user.
- reference: No video references in this project: nothing to compare. (Add one with tools/reference/ingest.mjs.)
