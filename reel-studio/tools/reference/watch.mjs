#!/usr/bin/env node
// Reference video -> frames + timestamped transcript in ~5 s per video (vendored MIT claude-watch-video, faster-whisper tiny.en, CPU).
//   node tools/reference/watch.mjs <video> [outdir]     writes <outdir>/frames/*.jpg, transcript.md, meta.json
// Needs: pip install faster-whisper 'av<19'; first run downloads the Whisper model (huggingface.co hosts must be reachable).
// Heavier, slower (~5 min/video): rea-video (JuneYaooo, Apache-2.0) gives SFX hits, stems, stickers; use tools/reference/deep_ingest.py on its output.
import path from 'node:path';
import { TK, PY, run } from '../lib/pipeline.mjs';
const [v, out] = process.argv.slice(2);
if (!v) { console.error('usage: watch.mjs <video> [outdir]'); process.exit(2); }
const r = run(PY, [path.join(TK, 'vendor/claude-watch-video/scripts/watch_video.py'), v, '--workdir', path.resolve(out || v.replace(/\.[^.]+$/, '') + '.watch'), '--model', 'tiny.en']);
process.stdout.write(r.stdout || ''); process.exit(r.status || 0);
