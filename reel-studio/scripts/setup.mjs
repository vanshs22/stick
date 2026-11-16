#!/usr/bin/env node
// One installer for every OS (install.sh and install.ps1 call this).  node scripts/setup.mjs [--skip-models] [--no-venv] [--minimal] [--no-remotion-skills] [--into <project>]
//   --minimal      only what a video needs (no Whisper/OpenCV/yt-dlp)    --skip-models  do not download the 340 MB Kokoro voice files
// Safe to run again: every step checks first. Prints one line per step and a final doctor report.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), a = process.argv.slice(2), has = (f) => a.includes(f), win = process.platform === 'win32';
const sh = (c, args, o = {}) => spawnSync(c, args, { encoding: 'utf8', shell: win && /^(npm|npx)$/.test(c), ...o });
const ok = (m) => console.log(`  ok    ${m}`), warn = (m) => console.log(`  WARN  ${m}`), step = (m) => console.log(`\n== ${m}`);
const need = [];

step('1 Python');
const cand = win ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];
let py = null; for (const [c, pre] of cand) { const r = sh(c, [...pre, '-c', 'import sys;print(sys.version_info[0]*100+sys.version_info[1])']); if (!r.error && r.status === 0 && +r.stdout.trim() >= 309) { py = [c, pre]; break; } }
if (!py) { warn('Python 3.9+ not found. Voice, timing, critics and reference tools need it. Install it from https://python.org (Windows: check "Add to PATH"), then run this again.'); need.push('python'); }
const venv = path.join(TK, '.venv'), vpy = path.join(venv, win ? 'Scripts/python.exe' : 'bin/python');
let PYX = py ? [py[0], ...py[1]] : null;
if (py && !has('--no-venv')) {
  if (!fs.existsSync(vpy)) { const r = sh(py[0], [...py[1], '-m', 'venv', venv]); if (r.status) { warn(`could not create .venv: ${r.stderr.slice(-300)} (Debian/Ubuntu: apt install python3-venv)`); need.push('venv'); } }
  if (fs.existsSync(vpy)) { PYX = [vpy]; ok('.venv ready'); }
}
if (PYX) {
  const req = fs.readFileSync(path.join(TK, 'requirements.txt'), 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean).filter((l) => !has('--minimal') || !/whisper|opencv|yt-dlp/.test(l));
  const probe = (m) => sh(PYX[0], [...PYX.slice(1), '-c', `import ${m}`]).status === 0, mod = { numpy: 'numpy', scipy: 'scipy', pillow: 'PIL', soundfile: 'soundfile', onnxruntime: 'onnxruntime', 'kokoro-onnx': 'kokoro_onnx', 'faster-whisper': 'faster_whisper', 'opencv-python-headless': 'cv2', 'yt-dlp': 'yt_dlp', 'imageio-ffmpeg': 'imageio_ffmpeg' };
  const missing = req.filter((p) => !probe(mod[p] || p));
  if (!missing.length) ok('python packages already installed');
  else { console.log(`  installing: ${missing.join(' ')}`); sh(PYX[0], [...PYX.slice(1), '-m', 'pip', 'install', '--quiet', '--upgrade', 'pip']); for (const p of missing) { const r = sh(PYX[0], [...PYX.slice(1), '-m', 'pip', 'install', '--quiet', p]); r.status ? (warn(`pip install ${p} failed: ${r.stderr.trim().split('\n').pop()}`), need.push(p)) : ok(p); } }
}

step('2 ffmpeg and ffprobe');
const has2 = (c) => !sh(c, ['-version']).error && sh(c, ['-version']).status === 0;
if (has2('ffmpeg') && has2('ffprobe')) ok('system ffmpeg + ffprobe');
else if (PYX && sh(PYX[0], [...PYX.slice(1), '-c', 'import imageio_ffmpeg']).status === 0) {
  const exe = sh(PYX[0], [...PYX.slice(1), '-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).stdout.trim(), bin = path.join(TK, '.bin'); fs.mkdirSync(bin, { recursive: true });
  const ff = path.join(bin, win ? 'ffmpeg.exe' : 'ffmpeg'); if (!fs.existsSync(ff)) fs.copyFileSync(exe, ff); if (!win) fs.chmodSync(ff, 0o755);
  // ffprobe shim: only "-show_entries format=duration" (the one thing the toolkit asks of it). A real ffprobe is better: brew/apt/winget install ffmpeg.
  const shim = `import re,subprocess,sys\nf=sys.argv[-1];o=subprocess.run(['ffmpeg','-hide_banner','-i',f],capture_output=True,text=True).stderr\nm=re.search(r'Duration: (\\d+):(\\d+):([\\d.]+)',o);print(int(m[1])*3600+int(m[2])*60+float(m[3]) if m else 0)\n`;
  fs.writeFileSync(path.join(bin, 'ffprobe.py'), shim);
  if (win) fs.writeFileSync(path.join(bin, 'ffprobe.cmd'), `@echo off\r\n"${PYX[0]}" "%~dp0ffprobe.py" %*\r\n`); else { fs.writeFileSync(path.join(bin, 'ffprobe'), `#!/usr/bin/env bash\nexec "${PYX[0]}" "$(dirname "$0")/ffprobe.py" "$@"\n`); fs.chmodSync(path.join(bin, 'ffprobe'), 0o755); }
  ok(`no system ffmpeg: using the bundled one in .bin (ffprobe is a small stand-in, duration only). Better: ${win ? 'winget install ffmpeg' : 'brew/apt install ffmpeg'}`);
} else { warn('ffmpeg missing: install it (brew install ffmpeg | apt install ffmpeg | winget install ffmpeg)'); need.push('ffmpeg'); }

step('3 Node packages');
if (!fs.existsSync(path.join(TK, 'node_modules/playwright-core'))) { const r = sh('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: TK }); r.status ? (warn('npm install (toolkit) failed: ' + r.stderr.slice(-300)), need.push('npm')) : ok('toolkit packages (playwright-core)'); } else ok('toolkit packages');
const T = path.join(TK, 'remotion-template');
if (!fs.existsSync(path.join(T, 'node_modules/remotion'))) { console.log('  installing the Remotion template packages (about 600 MB, once, shared by every project)...'); const r = sh('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: T }); r.status ? (warn('npm install (template) failed: ' + r.stderr.slice(-300)), need.push('npm')) : ok('remotion template packages'); } else ok('remotion template packages');

step('4 Chrome for rendering and screenshots');
if (fs.existsSync(path.join(T, 'node_modules/@remotion/renderer'))) {
  const r = sh('npx', ['remotion', 'browser', 'ensure'], { cwd: T }); r.status ? warn('could not fetch Chrome Headless Shell (Remotion downloads it on the first render too): ' + (r.stderr || r.stdout).slice(-200)) : ok('Chrome Headless Shell (Remotion)');
}

step('5 voice models');
if (has('--skip-models')) warn('skipped (--skip-models). Later: python tools/audio/voice.py --download');
else if (PYX && fs.existsSync(path.join(process.env.REEL_HOME || path.join(os.homedir(), '.reel-studio'), 'kokoro/kokoro-v1.0.onnx'))) ok('Kokoro model files present');
else if (PYX) { console.log('  downloading Kokoro (about 340 MB, once)...'); const r = sh(PYX[0], [...PYX.slice(1), path.join(TK, 'tools/audio/voice.py'), '--download'], { stdio: 'inherit' }); r.status ? (warn('download failed: run it again later (python tools/audio/voice.py --download)'), need.push('kokoro-models')) : ok('Kokoro models'); }

step('5b remocn component index (optional)');
{ const r = sh('node', [path.join(TK, 'tools/remocn.mjs'), 'search', 'title', '--max', '1', '--refresh']); r.status ? warn('could not fetch the remocn index (needs network; remocn is optional, search works from the cache once fetched)') : ok('remocn index cached (900+ components, MIT)'); }

step('6 agent skills');
let r = sh('node', [path.join(TK, 'scripts/install.mjs'), ...(has('--into') ? ['--into', a[a.indexOf('--into') + 1]] : []), ...(has('--no-remotion-skills') ? ['--no-remotion'] : [])], { stdio: 'inherit' }); if (r.status) { warn('skill install failed'); need.push('skills'); }
if (!fs.existsSync(path.join(TK, '.env'))) { fs.copyFileSync(path.join(TK, '.env.example'), path.join(TK, '.env')); ok('.env created from .env.example (all optional)'); }

step('7 check');
r = sh('node', [path.join(TK, 'tools/doctor.mjs')], { stdio: 'inherit' });
console.log(need.length ? `\nFinished with gaps: ${[...new Set(need)].join(', ')}. See TROUBLESHOOTING.md. Re-running this installer is safe.` : '\nInstalled. Next: node tools/selftest.mjs   then read QUICKSTART.md');
process.exit(0);
