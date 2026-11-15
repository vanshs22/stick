# Roadmap

## Milestone 1 - the brain and the skeleton (this branch, done)
Main skill + 15 stage skills, JSON contracts, approval-gate state machine, timing core (word-anchored), cue builder, audio tools, QA tools,
reference and research tools, Playwright capture, Remotion template (router, captions, safe zones, anim helpers, 2 starter components), installer, doctor.
NOT yet run end to end: nothing here has rendered a video. Milestone 2 ends with the first full test.

## Milestone 2 - the hands (done, not yet rendered)
Type-checks with `tsc` (0 errors). Audio chain, timeline, cues and storyboard checks smoke-tested on all four examples with estimated timing. NOT yet rendered: run `scripts/e2e.sh` first.

Original plan:
- Component library: text (rolling headline, typewriter, counters, stamps, highlighter), UI (browser, terminal, window swing, phone, chat, notebook, comment box),
  data (charts, timelines, checklists, versus, maps), evidence (case file, polaroid, ticket, redaction, annotations), captions (typewriter, karaoke, phrase), transitions, effects.
- three.js modules: characters (stick, voxel, low-poly, blocky, noir human, creature), environments, lighting rigs, camera moves.
- Style packs with rules, tokens, previews: editorial-notebook, noir-3d, voxel-explainer, stickman-3d, roblox-inspired, stylized-3d-presenter, paper-atlas, minimal-ui.
- Preview galleries: styles, typography, captions.
- Reference analyses of the supplied videos as shot libraries.
- One example project per style, then the end-to-end tests in Claude Code and OpenCode (free model) with three different videos.

## Design pass (after milestone 2)
Studied the reference frames again and added what was missing: an illustrated host (SVG, lip-sync, gestures), 14 overlay graphics (step chips and labels, stickers, tags, cursor with motion lines, scribbles, hearts, calendar, waveform, warning bar, progress card), sticker and glass window looks, per-shot background colours, headline and dialogue captions, repo, profile, ledger, file-list and end cards, a chart wall set, arch-eyed creatures, a close presenter camera, fine dot paper texture, coloured bokeh, and two more style packs (editorial-sticker, voxel-studio). Type-checks clean; nothing rendered yet.
