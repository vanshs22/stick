#!/usr/bin/env node
// "What is missing on this computer?" Run it first. Prints what works, what does not, and the exact command to fix each item.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), run = (c, a) => spawnSync(c, a, { encoding: 'utf8' });
const has = (c, a = ['--version']) => { const r = run(c, a); return !r.error && r.status === 0; }, py = (m) => has('python3', ['-c', `import ${m}`]);
const HOME = process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'), PYH = process.env.REEL_HOME || process.env.FACELESS_HOME || path.join(os.homedir(), '.reel-studio'), items = [];
const add = (name, ok, fix, need = 'required') => items.push({ name, ok: !!ok, need, fix: ok ? '' : fix });
add('node >= 18', +process.versions.node.split('.')[0] >= 18, 'install Node 18+ (https://nodejs.org)');
add('ffmpeg + ffprobe', has('ffmpeg', ['-version']) && has('ffprobe', ['-version']), 'install ffmpeg (brew install ffmpeg | apt install ffmpeg)');
add('python3', has('python3'), 'install Python 3.10+');
add('python: numpy scipy', py('numpy') && py('scipy'), `python3 -m venv ${PYH}/venv && ${PYH}/venv/bin/pip install numpy scipy kokoro-onnx faster-whisper soundfile`);
add('kokoro-onnx (voice)', py('kokoro_onnx'), `${PYH}/venv/bin/pip install kokoro-onnx soundfile, then: python tools/audio/voice.py --download`);
add('faster-whisper (word timing)', py('faster_whisper'), `${PYH}/venv/bin/pip install faster-whisper`);
add('Kokoro model files', fs.existsSync(path.join(PYH, 'kokoro')), 'python tools/audio/voice.py --download (about 340 MB, once)');
add('Chrome / Chromium', ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app'].some(fs.existsSync) || fs.existsSync(path.join(os.homedir(), '.cache/ms-playwright')), 'install Chrome, or: npx playwright install chromium (Remotion also downloads its own)');
add('Playwright (real screenshots)', has('npx', ['--no-install', 'playwright', '--version']), 'npm i -D playwright && npx playwright install chromium', 'optional');
add('Agent-Reach (research)', has('agent-reach', ['--help']), 'pip install agent-reach  (HOME must be writable)', 'optional');
add('OpenCV (reference analysis)', py('cv2'), 'pip install opencv-python-headless', 'optional');
const skillDirs = [path.join(os.homedir(), '.claude/skills/reel-studio'), path.join(os.homedir(), '.config/opencode/skills/reel-studio'), path.join(os.homedir(), '.agents/skills/reel-studio'), '.claude/skills/reel-studio', '.opencode/skills/reel-studio', '.agents/skills/reel-studio'];
add('toolkit installed as a skill', skillDirs.some(fs.existsSync), `node ${TK}/scripts/install.mjs`, 'recommended');
add('official Remotion skills (remotion-dev/skills)', [path.join(HOME, 'remotion-skills/skills/remotion-best-practices/SKILL.md'), path.join(os.homedir(), '.agents/skills/remotion-best-practices/SKILL.md'), path.join(os.homedir(), '.claude/skills/remotion-best-practices/SKILL.md')].some(fs.existsSync), `node ${TK}/scripts/install_remotion_skills.mjs`);
console.log(`toolkit: ${TK}\n`); for (const i of items) console.log(`${i.ok ? 'OK     ' : i.need === 'required' ? 'MISSING' : 'missing'}  ${i.name.padEnd(34)} ${i.fix}`);
console.log('\nThe agent should be able to LOOK at images (contact sheets). If your model cannot, ask the user to look at review/*.jpg and rely on tools/qa/frame_stats.mjs.');
const bad = items.filter((i) => !i.ok && i.need === 'required'); process.exit(bad.length ? 1 : 0);
