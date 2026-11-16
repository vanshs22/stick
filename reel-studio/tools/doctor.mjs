#!/usr/bin/env node
// "What is missing on this computer?" Prints what works, what does not, and the exact command to fix each item. Exit 1 if a REQUIRED item is missing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, PY, run } from './lib/pipeline.mjs';   // PY = the toolkit's .venv python when it exists; PATH already includes .bin

const has = (c, a = ['--version']) => { const r = run(c, a); return !r.error && r.status === 0; }, py = (m) => has(PY, ['-c', `import ${m}`]);
const HOME = process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'), items = [], win = process.platform === 'win32';
const add = (name, ok, fix, need = 'required') => items.push({ name, ok: !!ok, need, fix: ok ? '' : fix });
const T = path.join(TK, 'remotion-template/node_modules'), setup = `${win ? '.\\install.ps1' : 'bash install.sh'}`;
add('node >= 18', +process.versions.node.split('.')[0] >= 18, 'install Node 22 LTS (https://nodejs.org)');
add('ffmpeg + ffprobe', has('ffmpeg', ['-version']) && has('ffprobe', ['-version']), `${setup} (uses a bundled ffmpeg), or: brew/apt/winget install ffmpeg`);
add('python 3.9+', has(PY, ['-c', 'import sys;sys.exit(sys.version_info<(3,9))']), 'install Python 3.9+ from https://python.org, then ' + setup);
add('python: numpy scipy pillow', py('numpy') && py('scipy') && py('PIL'), setup);
add('kokoro-onnx (free local voice)', py('kokoro_onnx'), setup);
add('Kokoro model files (~340 MB)', fs.existsSync(path.join(HOME, 'kokoro/kokoro-v1.0.onnx')), 'python tools/audio/voice.py --download');
add('faster-whisper (word timing, pronunciation check)', py('faster_whisper'), setup, 'recommended');
add('Remotion template packages', fs.existsSync(path.join(T, 'remotion')), `${setup}  (or: cd remotion-template && npm install)`);
add('Chrome Headless Shell (render, screenshots)', fs.existsSync(path.join(T, '.remotion')) || fs.existsSync(path.join(os.homedir(), '.cache/puppeteer')) || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].some(fs.existsSync), 'cd remotion-template && npx remotion browser ensure');
add('playwright-core (real website screenshots)', fs.existsSync(path.join(TK, 'node_modules/playwright-core')), 'npm install   (in the toolkit folder)', 'recommended');
add('Playwright recording ffmpeg (screen recordings of real sites)', (() => { try { const d = path.join(HOME, 'ms-playwright'); return fs.existsSync(d) && fs.readdirSync(d).some((x) => /^ffmpeg-/.test(x)); } catch { return false; } })(), `${setup} (step 4b) or: PLAYWRIGHT_BROWSERS_PATH=${path.join(HOME, 'ms-playwright')} node node_modules/playwright-core/cli.js install ffmpeg`, 'optional');
add('OpenCV (reference video analysis)', py('cv2'), setup, 'optional');
add('yt-dlp (download reference videos)', py('yt_dlp') || has('yt-dlp'), setup, 'optional');
add('Agent-Reach (research without keys)', has(process.env.AGENT_REACH_BIN || 'agent-reach', ['--help']), 'pip install git+https://github.com/Panniantong/Agent-Reach   (optional: the research stage works with web search or by hand)', 'optional');
const skillDirs = [path.join(os.homedir(), '.claude/skills/reel-studio'), path.join(os.homedir(), '.config/opencode/skills/reel-studio'), path.join(os.homedir(), '.agents/skills/reel-studio'), '.claude/skills/reel-studio', '.opencode/skills/reel-studio', '.agents/skills/reel-studio'];
add('toolkit installed as a skill', skillDirs.some(fs.existsSync), `node ${path.join(TK, 'scripts/install.mjs')}   (or point your agent at AGENTS.md)`, 'recommended');
add('official Remotion skills (remotion-dev/skills)', [path.join(HOME, 'remotion-skills/skills/remotion-best-practices/SKILL.md'), path.join(os.homedir(), '.agents/skills/remotion-best-practices/SKILL.md'), path.join(os.homedir(), '.claude/skills/remotion-best-practices/SKILL.md')].some(fs.existsSync), `node ${path.join(TK, 'scripts/install_remotion_skills.mjs')}`, 'recommended');
const ok = (n) => !!items.find((i) => i.name.startsWith(n))?.ok;
// what each missing item takes away: the agent must not promise a capability that is not installed
const capabilities = [
  ['render videos (Remotion + Chrome)', ok('Remotion template') && ok('Chrome Headless') && ok('ffmpeg'), 'bash install.sh'],
  ['narration (Kokoro voice)', ok('python 3.9') && ok('kokoro-onnx') && ok('Kokoro model'), 'bash install.sh (without --skip-models)'],
  ['exact word timing for captions (faster-whisper)', ok('faster-whisper'), 'bash install.sh; without it caption times are spread inside each line'],
  ['real website evidence (Playwright capture)', ok('playwright-core') && ok('Chrome Headless'), 'npm install in the toolkit folder'],
  ['reference video analysis (OpenCV + ffmpeg)', ok('OpenCV') && ok('ffmpeg'), 'bash install.sh'],
  ['download reference videos (yt-dlp)', ok('yt-dlp'), 'bash install.sh'],
  ['autonomous competitor/topic research (Agent-Reach)', ok('Agent-Reach'), 'optional: bash install.sh --with-agent-reach. Without it: web search tools of your IDE, or import exports by hand (research skill)'],
  ['agent skills visible to the IDE', ok('toolkit installed as a skill'), `node ${path.join(TK, 'scripts/install.mjs')}`],
  ['official Remotion skills', ok('official Remotion skills'), `node ${path.join(TK, 'scripts/install_remotion_skills.mjs')}`],
];
if (process.argv.includes('--json')) { const o = { checked_at: new Date().toISOString(), platform: `${process.platform} ${process.arch}`, node: process.versions.node, toolkit: TK, python: PY, items, capabilities: capabilities.map(([name, available, fix]) => ({ name, available, fix: available ? '' : fix })), ready_to_produce: !items.some((i) => !i.ok && i.need === 'required') }; console.log(JSON.stringify(o, null, 1)); process.exit(o.ready_to_produce ? 0 : 1); }
console.log(`toolkit: ${TK}\npython : ${PY}\n`);
for (const i of items) console.log(`${i.ok ? 'OK     ' : i.need === 'required' ? 'MISSING' : i.need === 'recommended' ? 'missing' : 'optional'}  ${i.name.padEnd(48)} ${i.fix}`);
console.log('\nCapabilities:'); for (const [n, a, f] of capabilities) console.log(`  ${a ? 'available  ' : 'UNAVAILABLE'} ${n}${a ? '' : '   -> ' + f}`);
console.log('\nThe agent should be able to LOOK at images (contact sheets). If your model cannot, vision critics report "not performed" and you review review/*.jpg yourself.\nNo GPU? Set REMOTION_GL=swangle in .env (slow but works).');
process.exit(items.some((i) => !i.ok && i.need === 'required') ? 1 : 0);
