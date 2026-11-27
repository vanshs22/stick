#!/usr/bin/env node
// OPTIONAL: gives the agent real "ears" through earshot (https://github.com/Leonxlnx/earshot, CPU only): what the mix sounds like in words, a listening
// transcript with sync to the picture cuts, and a scorecard against professional films. If earshot is not installed this says how and exits 0 (never blocks a build).
//   node tools/audio/earshot.mjs <project> [--video renders/<name>.mp4]
// Install (needs uv and ffmpeg; ~1.1 GB of open models, downloaded once):  uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"  &&  earshot doctor --fetch
// Writes review/earshot/{describe,timeline,critique}.txt and sheet.png. TESTED against earshot 0.4.1 on a real film (describe, timeline, critique ran and found real problems).
// Needs a REAL ffprobe on PATH: set EARSHOT_PATH=<folder with ffprobe> (pip install static-ffmpeg gives one). With a venv: EARSHOT_PY=<venv>/bin/python EARSHOT_HOME=<model cache>.
import fs from 'node:fs';
import path from 'node:path';
import { finalVideo } from '../lib/pipeline.mjs';
import { spawnSync } from 'node:child_process';
const a = process.argv.slice(2), P = path.resolve(a[0] || '.'), PYV = process.env.EARSHOT_PY, bin = PYV || process.env.EARSHOT_BIN || 'earshot', pre = PYV ? ['-m', 'earshot'] : [];   // EARSHOT_PY = a python with earshot installed (venv)
process.env.PATH = (process.env.EARSHOT_PATH ? process.env.EARSHOT_PATH + path.delimiter : '') + process.env.PATH;   // EARSHOT_PATH: a folder with a REAL ffprobe (the toolkit's bundled one is a duration-only stand-in)
if (spawnSync(bin, [...pre, '--help'], { encoding: 'utf8' }).error) { console.log('earshot is not installed (optional). Without it, tools/audio/ears.py still measures the mix and prepares the listening checklist.\nInstall: uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot" && earshot doctor --fetch   (~1.1 GB models, CPU only)\nAs an MCP server for Claude Code: claude mcp add earshot --scope user -e EARSHOT_THREADS=3 -- earshot mcp'); process.exit(0); }
const mix = path.join(P, 'data/mix.wav'), cues = path.join(P, 'data/cues.json'), vi = a.includes('--video') ? a[a.indexOf('--video') + 1] : finalVideo(P);
if (!fs.existsSync(mix)) { console.error('no data/mix.wav: build the video first'); process.exit(1); }
const out = path.join(P, 'review/earshot'); fs.mkdirSync(out, { recursive: true });
const run = (name, args) => { const r = spawnSync(bin, [...pre, ...args], { cwd: P, encoding: 'utf8', timeout: 900000, env: process.env }); fs.writeFileSync(path.join(out, name), (r.stdout || '') + (r.stderr || '')); console.log(`${r.status === 0 ? 'ok  ' : 'FAIL'} earshot ${args[0]} -> review/earshot/${name}`); return r.status === 0; };
run('describe.txt', ['describe', mix]);
run('timeline.txt', ['timeline', mix, ...(vi ? ['--video', vi] : []), ...(fs.existsSync(cues) ? ['--cues', cues] : [])]);
run('sheet.log', ['sheet', mix, '-o', path.join(out, 'sheet.png')]);
if (vi) run('critique.txt', ['critique', vi]);
console.log('Read review/earshot/*.txt and look at sheet.png. Its scorecard compares against professional launch films: use it as evidence, not as taste.');
