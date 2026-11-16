# Critic summary

| critic | verdict | score | blocker | major | minor | looked at pixels? |
|---|---|---|---|---|---|---|
| frames | pass | 100 | 0 | 0 | 0 | measured only |

Automatic critics measure; they do not judge taste or story. Vision critics (character, environment, camera, composition, typography, ui, transitions) run only when the agent really opens the images: see `critique.mjs <project> vision --packet <name>`.

## Not covered
- frames: frames taken from the rendered film (e2e-test.mp4), one per shot
- frames: Looks good? Is the composition beautiful? Those need eyes: tools/critique.mjs vision --packet composition
