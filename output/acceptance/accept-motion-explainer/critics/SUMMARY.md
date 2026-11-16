# Critic summary

| critic | verdict | score | blocker | major | minor | looked at pixels? |
|---|---|---|---|---|---|---|
| voice | pass | 100 | 0 | 0 | 0 | measured only |
| music | pass | 100 | 0 | 0 | 0 | measured only |
| sfx | pass | 100 | 0 | 0 | 0 | measured only |

Automatic critics measure; they do not judge taste or story. Vision critics (character, environment, camera, composition, typography, ui, transitions) run only when the agent really opens the images: see `critique.mjs <project> vision --packet <name>`.

## Not covered
- voice: Whether the voice SOUNDS good (warmth, emphasis) needs a human ear: this critic checks clipping, gaps and intelligibility only.
- music: Music taste (does it fit the mood?) needs a human ear. The beds are procedural: calm, upbeat or tension.
