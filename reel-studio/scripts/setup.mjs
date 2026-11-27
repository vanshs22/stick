#!/usr/bin/env node
// One installer for every OS (install.sh and install.ps1 call this).  node scripts/setup.mjs [--skip-models] [--no-venv] [--minimal] [--no-remotion-skills] [--into <project>]
//   --with-agent-reach  also install Agent-Reach (competitor/topic research without keys)   --skip-verify  do not run the self-tests and the small render
//   --with-photoreal  Blender Cycles plates (about 400 MB)   --with-voice2  Chatterbox emotional voice (about 2.5 GB)
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
// Prefer a Python the voice and Whisper wheels exist for (3.10 to 3.13). The newest Python on a machine (py -3, python3) often has no onnxruntime/av wheel yet.
const cand = win ? [['py', ['-3.12']], ['py', ['-3.11']], ['py', ['-3.10']], ['py', ['-3.13']], ['py', ['-3']], ['python', []], ['python3', []]] : [['python3.12', []], ['python3.11', []], ['python3.10', []], ['python3.13', []], ['python3', []], ['python', []]];
let py = null, fallback = null;
for (const [c, pre] of cand) { const r = sh(c, [...pre, '-c', 'import sys;print(sys.version_info[0]*100+sys.version_info[1])']); if (r.error || r.status !== 0) continue; const v = +r.stdout.trim(); if (v >= 310 && v <= 313) { py = [c, pre]; break; } if (v >= 309 && !fallback) fallback = [c, pre, v]; }
if (!py && fallback) { py = [fallback[0], fallback[1]]; warn(`Python ${(fallback[2] / 100) | 0}.${fallback[2] % 100} found, but the voice (onnxruntime) and Whisper (av) packages are built for 3.10 to 3.13. If a pip install fails below, install Python 3.12 from https://python.org and run this again.`); }
if (!py) { warn('Python 3.9+ not found. Voice, timing, critics and reference tools need it. Install it from https://python.org (Windows: check "Add to PATH"), then run this again.'); need.push('python'); }
const venv = path.join(TK, '.venv'), vpy = path.join(venv, win ? 'Scripts/python.exe' : 'bin/python');
let PYX = py ? [py[0], ...py[1]] : null;
if (py && !has('--no-venv')) {
  if (!fs.existsSync(vpy)) { const r = sh(py[0], [...py[1], '-m', 'venv', venv]); if (r.status) { warn(`could not create .venv: ${r.stderr.slice(-300)} (Debian/Ubuntu: apt install python3-venv)`); need.push('venv'); } }
  if (fs.existsSync(vpy)) {
    PYX = [vpy]; ok(`.venv ready (${(sh(vpy, ['-c', 'import sys,platform;print(platform.python_version(), platform.machine(), "64bit" if sys.maxsize > 2**32 else "32bit")']).stdout || '?').trim()})`);
    // some distros (Debian/Ubuntu, minimal pyenv) create a venv WITHOUT pip, so every package below would silently fail
    if (sh(vpy, ['-m', 'pip', '--version']).status) { const r = sh(vpy, ['-m', 'ensurepip', '--upgrade']); r.status ? (warn('the .venv has no pip and ensurepip failed: ' + (r.stderr || '').trim().split('\n').pop() + ' (Debian/Ubuntu: apt install python3-venv)'), need.push('pip')) : ok('pip added to .venv (ensurepip)'); }
  }
}
if (PYX) {
  const req = fs.readFileSync(path.join(TK, 'requirements.txt'), 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean).filter((l) => !has('--minimal') || !/whisper|opencv|yt-dlp/.test(l));
  const probe = (m) => sh(PYX[0], [...PYX.slice(1), '-c', `import ${m}`]).status === 0, mod = { numpy: 'numpy', scipy: 'scipy', pillow: 'PIL', soundfile: 'soundfile', onnxruntime: 'onnxruntime', 'kokoro-onnx': 'kokoro_onnx', 'faster-whisper': 'faster_whisper', 'opencv-python-headless': 'cv2', 'yt-dlp': 'yt_dlp', 'imageio-ffmpeg': 'imageio_ffmpeg', 'static-ffmpeg': 'static_ffmpeg' };
  const base = (p) => p.replace(/[<>=!~].*$/, ''), missing = req.filter((p) => !probe(mod[base(p)] || base(p)));   // "opencv-python-headless<5" -> module cv2
  if (!missing.length) ok('python packages already installed');
  else { console.log(`  installing: ${missing.join(' ')}`); sh(PYX[0], [...PYX.slice(1), '-m', 'pip', 'install', '--quiet', '--upgrade', 'pip']); for (const p of missing) { const r = sh(PYX[0], [...PYX.slice(1), '-m', 'pip', 'install', '--quiet', p]); r.status ? (warn(`pip install ${p} failed: ${r.stderr.trim().split('\n').filter((l) => /ERROR|from versions|requires|Could not/.test(l)).slice(-3).join(' | ') || r.stderr.trim().split('\n').pop()}`), need.push(p)) : ok(p); } }
}

step('2 ffmpeg and ffprobe');
const has2 = (c) => !sh(c, ['-version']).error && sh(c, ['-version']).status === 0;
if (has2('ffmpeg') && has2('ffprobe')) ok('system ffmpeg + ffprobe');
else if (PYX && sh(PYX[0], [...PYX.slice(1), '-c', 'import static_ffmpeg']).status === 0 && (() => { const bin = path.join(TK, '.bin'); fs.mkdirSync(bin, { recursive: true }); const r = sh(PYX[0], [...PYX.slice(1), '-c', 'import static_ffmpeg.run as r,shutil,sys,os\nfor x in r.get_or_fetch_platform_executables_else_raise(): shutil.copy(x, os.path.join(sys.argv[1], os.path.basename(x)))', bin]); if (r.status) return false; if (!win) for (const f of ['ffmpeg', 'ffprobe']) try { fs.chmodSync(path.join(bin, f), 0o755); } catch { /* ok */ } return fs.existsSync(path.join(bin, win ? 'ffprobe.exe' : 'ffprobe')); })()) ok('no system ffmpeg: installed a real ffmpeg + ffprobe into .bin (static-ffmpeg)');
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

step('4b Playwright recording support (small ffmpeg build for screen recordings)');
{ const pw = path.join(TK, 'node_modules/playwright-core/cli.js'), dst = path.join(process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'), 'ms-playwright');
  if (!fs.existsSync(pw)) warn('playwright-core is not installed, so screenshots and recordings of real sites are unavailable');
  else if (fs.existsSync(dst) && fs.readdirSync(dst).some((d) => /^ffmpeg-/.test(d))) ok('Playwright recording ffmpeg present');
  else { const r = sh('node', [pw, 'install', 'ffmpeg'], { env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: dst } }); r.status ? warn('could not download Playwright\'s ffmpeg (needs network). Screenshots still work; screen recordings do not: ' + (r.stderr || '').trim().split('\n').pop()) : ok('Playwright recording ffmpeg installed'); } }

step('5 voice models');
if (has('--skip-models')) warn('skipped (--skip-models). Later: python tools/audio/voice.py --download');
else if (PYX && fs.existsSync(path.join(process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'), 'kokoro/kokoro-v1.0.onnx'))) ok('Kokoro model files present');
else if (PYX) { console.log('  downloading Kokoro (about 340 MB, once)...'); const r = sh(PYX[0], [...PYX.slice(1), path.join(TK, 'tools/audio/voice.py'), '--download'], { stdio: 'inherit' }); r.status ? (warn('download failed: run it again later (python tools/audio/voice.py --download)'), need.push('kokoro-models')) : ok('Kokoro models'); }

step('5b remocn component index (optional)');
{ const r = sh('node', [path.join(TK, 'tools/remocn.mjs'), 'search', 'title', '--max', '1', '--refresh']); r.status ? warn('could not fetch the remocn index (needs network; remocn is optional, search works from the cache once fetched)') : ok('remocn index cached (900+ components, MIT)'); }

step('6 agent skills');
let r = sh('node', [path.join(TK, 'scripts/install.mjs'), ...(has('--into') ? ['--into', a[a.indexOf('--into') + 1]] : []), ...(has('--no-remotion-skills') ? ['--no-remotion'] : [])], { stdio: 'inherit' }); if (r.status) { warn('skill install failed'); need.push('skills'); }
if (!fs.existsSync(path.join(TK, '.env'))) { fs.copyFileSync(path.join(TK, '.env.example'), path.join(TK, '.env')); ok('.env created from .env.example (all optional)'); }

step('6b Agent-Reach (optional)');
if (!has('--with-agent-reach')) warn('not installed (optional). Research then uses your IDE\'s web search or manual imports. To add it: bash install.sh --with-agent-reach');
else if (PYX) { const r0 = sh(PYX[0], [...PYX.slice(1), '-m', 'pip', 'install', '--quiet', 'git+https://github.com/Panniantong/Agent-Reach']); r0.status ? warn('Agent-Reach install failed (optional): ' + (r0.stderr || '').trim().split('\n').pop()) : ok('Agent-Reach installed'); }

if (has('--with-photoreal')) {
  step('6c photoreal engine (Blender Cycles, optional)');
  const bv = path.join(TK, '.venv-blender'), bpy = path.join(bv, win ? 'Scripts/python.exe' : 'bin/python');   // a SEPARATE venv: bpy pins its own numpy and would break Kokoro and OpenCV in the main one
  if (!PYX) warn('no Python: cannot install the photoreal engine');
  else {
    if (!fs.existsSync(bpy)) { const r = sh(PYX[0], [...PYX.slice(1), '-m', 'venv', bv]); if (r.status) warn(`could not create .venv-blender: ${(r.stderr || '').slice(-200)}`); }
    if (fs.existsSync(bpy)) {
      const r = sh(bpy, ['-m', 'pip', 'install', '--quiet', 'bpy', 'pillow']); r.status ? warn(`bpy did not install (Blender needs Python 3.11 for bpy 5.x; ${(r.stderr || '').trim().split('\n').pop()}). Use python3.11 for the venv.`) : ok('bpy (Blender as a Python module) installed in .venv-blender');
      if (process.platform === 'linux') { const t = sh(bpy, ['-c', 'import bpy']); if (t.status) { console.log('  a system library is missing: fetching the few needed ones (no root needed)'); const f = sh(PYX[0], [...PYX.slice(1), path.join(TK, 'scripts/fetch_syslibs.py')]); f.status ? warn('fetch_syslibs failed: ' + (f.stderr || '').slice(-200)) : ok('system libraries in .syslibs'); } }
      const d = sh('node', [path.join(TK, 'tools/photoreal.mjs'), 'doctor']); d.status === 0 ? ok(d.stdout.trim()) : warn((d.stderr || d.stdout).trim().slice(-300));
    }
  }
}
if (has('--with-inkbeat')) {
  step('6e inkbeat 3D toon engine (optional, about 300 MB)');
  const r = sh('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: path.join(TK, 'renderers/inkbeat') }); r.status ? warn('npm install in renderers/inkbeat failed: ' + (r.stderr || '').slice(-300)) : ok('renderers/inkbeat packages installed');
}
if (has('--with-voice2')) {
  step('6d Chatterbox voice (emotion control, voice cloning; optional, about 2.5 GB)');
  const vv = path.join(TK, '.venv-voice'), vp = path.join(vv, win ? 'Scripts/python.exe' : 'bin/python');
  if (!PYX) warn('no Python: cannot install the second voice');
  else {
    if (!fs.existsSync(vp)) sh(PYX[0], [...PYX.slice(1), '-m', 'venv', vv]);
    if (fs.existsSync(vp)) {
      const cpu = !fs.existsSync('/dev/nvidia0') && process.platform !== 'darwin', t = sh(vp, ['-m', 'pip', 'install', '--quiet', 'torch==2.6.0', 'torchaudio==2.6.0', ...(cpu ? ['--index-url', 'https://download.pytorch.org/whl/cpu'] : [])]);
      if (t.status) warn('torch did not install: ' + (t.stderr || '').trim().split('\n').pop()); else { const c = sh(vp, ['-m', 'pip', 'install', '--quiet', 'chatterbox-tts', 'soundfile']); c.status ? warn('chatterbox-tts did not install: ' + (c.stderr || '').trim().split('\n').pop()) : ok('chatterbox-tts installed in .venv-voice (the model downloads on first use)'); }
    }
  }
}
step('7 check');
r = sh('node', [path.join(TK, 'tools/doctor.mjs')], { stdio: 'inherit' });
// 8: prove it works: self-tests, then a small real render. Skipped only on request, never silently.
const report = { at: new Date().toISOString(), platform: `${process.platform} ${process.arch}`, node: process.versions.node, gaps: [...new Set(need)], verify: {} };
if (has('--skip-verify')) { warn('verification skipped (--skip-verify): nothing was tested after install'); report.verify.skipped = true; }
else {
  step('8 self-tests'); r = sh('node', [path.join(TK, 'tools/selftest.mjs'), ...(has('--skip-models') ? [] : ['--full'])], { stdio: 'inherit' }); report.verify.selftest = r.status === 0 ? 'passed' : 'FAILED'; if (r.status) need.push('selftest');
  step('9 small real render'); r = sh('node', [path.join(TK, 'tools/smoke_render.mjs')], { stdio: 'inherit' }); report.verify.smoke_render = r.status === 0 ? 'passed' : 'FAILED'; if (r.status) need.push('smoke-render');
}
const dj = sh('node', [path.join(TK, 'tools/doctor.mjs'), '--json']); try { Object.assign(report, { doctor: JSON.parse(dj.stdout) }); } catch { report.doctor = null; }
report.gaps = [...new Set(need)]; fs.writeFileSync(path.join(TK, 'install-report.json'), JSON.stringify(report, null, 1));
fs.writeFileSync(path.join(TK, 'install-report.md'), `# Install report (${report.at})\n\n- platform: ${report.platform}, node ${report.node}\n- self-tests: ${report.verify.selftest || (report.verify.skipped ? 'SKIPPED' : '?')}\n- small real render: ${report.verify.smoke_render || (report.verify.skipped ? 'SKIPPED' : '?')}\n- gaps: ${report.gaps.join(', ') || 'none'}\n\n## Capabilities\n${(report.doctor?.capabilities || []).map((c) => `- ${c.available ? 'available' : 'UNAVAILABLE'}: ${c.name}${c.available ? '' : ' (' + c.fix + ')'}`).join('\n')}\n\n## Items\n${(report.doctor?.items || []).map((i) => `- ${i.ok ? 'ok' : i.need.toUpperCase()}: ${i.name}${i.ok ? '' : ' -> ' + i.fix}`).join('\n')}\n`);
console.log('\ninstall report: install-report.md');
console.log(need.length ? `\nFinished with gaps: ${[...new Set(need)].join(', ')}. See TROUBLESHOOTING.md. Re-running this installer is safe.` : '\nInstalled. Next: node tools/selftest.mjs   then read QUICKSTART.md');
process.exit(need.length ? 1 : 0);
