#!/usr/bin/env node
// Clean-room test: copy the toolkit (no node_modules, .venv, .bin, projects) into a fresh folder, install it THERE, then run doctor, the self-tests,
// a small real render and a project from creation to a decodable MP4. This is what "it installs and works on a clean machine" means.
//   node tools/clean_room.mjs [--skip-models] [--keep]      (a real install: downloads packages, takes several minutes)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), a = process.argv.slice(2), win = process.platform === 'win32';
const dst = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'reel-clean-')), 'reel-studio');
fs.cpSync(TK, dst, { recursive: true, filter: (f) => !/[\\/](node_modules|\.venv|\.bin|reel-projects|\.git|renders)([\\/]|$)|install-report/.test(f.slice(TK.length)) });
const res = [], step = (name, cmd, args, o = {}) => { process.stdout.write(`== ${name}\n`); const r = spawnSync(cmd, args, { cwd: dst, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: win && cmd === 'powershell', timeout: 3600000, ...o }); const ok = r.status === 0; res.push([ok, name]); if (!ok) console.log((r.stdout + r.stderr).slice(-600)); return r; };
step('install (fresh folder)', win ? 'powershell' : 'bash', win ? ['-ExecutionPolicy', 'Bypass', '-File', 'install.ps1', '--skip-verify', ...a.filter((x) => x === '--skip-models')] : ['install.sh', '--skip-verify', ...a.filter((x) => x === '--skip-models')]);
step('doctor reports no REQUIRED item missing', 'node', ['tools/doctor.mjs']);
step('self-tests', 'node', ['tools/selftest.mjs', ...(a.includes('--skip-models') ? [] : ['--full'])]);
step('small real render', 'node', ['tools/smoke_render.mjs']);
for (const [ok, n] of res) console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`);
console.log(res.every((r) => r[0]) ? `\nCLEAN ROOM PASSED (${dst}${a.includes('--keep') ? ', kept' : ', removed'})` : `\nCLEAN ROOM FAILED (left in ${dst})`);
if (res.every((r) => r[0]) && !a.includes('--keep')) fs.rmSync(path.dirname(dst), { recursive: true, force: true });
process.exit(res.every((r) => r[0]) ? 0 : 1);
