---
name: remotion-production
description: Builds the video in Remotion (React) from the approved storyboard - project setup, components, animation rules, rendering stills and the final video. Use for the build stage, whenever a component must be created or fixed, and for rendering.
---

# Remotion production

Read the official `remotion-best-practices` skill too (installed with `npx skills add remotion-dev/skills`). The project is `$P/remotion/`.

## Setup
`cd $P/remotion && npm install` once. The timeline comes from `src/data/timeline.json` (built by `tools/timing/build_timeline.mjs`; never edit by hand). Style tokens are in `src/data/style.json`.

## Animation rules (these prevent flicker and wrong timing)
- Time comes ONLY from `useShotTime(shot)` (local seconds `lt`, film seconds `t`). Animate with `interpolate`, `spring`, and the helpers in `src/engine/anim.ts` (`p`, `sp`, `env`, `track`, `typed`).
- No CSS transitions or animations, no `setTimeout`/`Date.now`, no `Math.random` (use `rnd(i)` from anim.ts), no `useFrame()` from react-three-fiber.
- Time every entrance to a word: `atLocal(shot, 'anchorName')`. Never type a raw seconds value for something that is spoken about.
- Every element has an exit (fade, slide or mask) before the shot ends; two shots never fight for the screen.
- Layout within y 180-1380 (1080x1920). Fonts and colours come from `tokens.ts` (`F`, `C`), not inline hex values.
- Real screenshots: `<Img src={staticFile('assets/page.png')} />`; videos `<OffthreadVideo muted />` with a poster image underneath.

## Components
1. A shot's `component` is looked up in `src/components/registry.ts`. Build a missing one in `src/components/<Name>.tsx` (props documented at the top), add one registry line, make a still to check it.
2. Prefer composing existing components over new code. Reuse the library before inventing (see `remotion-template/src/components`; Milestone 2 adds many more).
3. A component must work for any text and any length: no hard-coded copy.

## Checks (cheap first)
- `npx tsc --noEmit` in `remotion/` must pass.
- One still per shot: `node $TK/tools/preview_shots.mjs $P` -> `review/storyboard/S*.png` and `review/storyboard.jpg`. Open and look.
- The red MISSING COMPONENT card means a name is not in the registry.
- Enable `--props='{"safeZones":true}'` to see the safe-zone overlay in a still.

## Render
- Preview: `npm run studio`. Draft: `npx remotion render src/index.ts Reel out/draft.mp4 --scale=0.5 --concurrency=2`.
- Final: `npx remotion render src/index.ts Reel out/final.mp4 --crf=16`, then audio is already in (the mix is `public/audio/mix.wav`). Copy to `$P/renders/<name>.mp4`.
- 3D shots on a computer without a GPU render with software GL: slower. Use `--concurrency=2` on small machines and tell the user the expected time first.

## Ready-made pieces (Milestone 2)
- Components live in `src/components/*.tsx` (text, uikit, data, evidence, Scene3D) and are documented in `manifest.json`. Transitions: `src/engine/Transition.tsx` (entrance chosen by the previous shot's `transition_out.type`). Atmosphere: `src/engine/Effects.tsx` (style.json `effects`: grain, vignette, bokeh, rain, halftone, paper). Captions: 6 presets in `src/engine/Captions.tsx`.
- `useEnter(shot, anchor, delay)` gives the standard entrance and exit (`a`, `vis`, `out`, `lt`): use it in every new component.
- Full test of the pipeline in one command: `bash $TK/scripts/e2e.sh <projectDir> [--no-voice] [--scale 0.5]` (project from `node $TK/tools/run_example.mjs <example> <name>`).
- Preview galleries: `node $TK/tools/gallery.mjs $P --kind styles|typography|captions` -> `review/gallery-<kind>.jpg`.
