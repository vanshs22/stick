# What a project folder contains
```
reel-projects/<name>/
  state.json            stage status and approvals (tools/state.mjs)
  brief.json            production-brief
  research/             research.json, reference analyses, evidence notes
  script/script.json    script
  storyboard/           storyboard.json, new-components.md
  audio/audio-plan.json audio-plan (+ own recording or music file)
  assets/               captures, images, fonts, manifest.json (asset-manifest)
  data/                 tts.json, lines.json, words.json, narration.wav, cues.json, mix.wav, timeline.json (all generated)
  remotion/             the Remotion project (src/data/timeline.json + style.json are generated)
  review/               critic reports, stills, contact sheets
  renders/              raw, final, cover, post.txt, sources.md, production-report.md
```
Generated files are never edited by hand: fix the source (script, storyboard, audio plan) and rebuild.
