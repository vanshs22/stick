#!/usr/bin/env node
// Make the shareable zip (what you hand to another agent):  node scripts/pack.mjs <out.zip> [--output <dir of finished films>]
// Leaves out everything that is rebuilt by the installer (node_modules, .venv, .bin, caches, reports, .env). Layout inside the zip (same as before): setup.md at the top for a first-time reader, reel-studio/ (the toolkit), output/acceptance/ (finished films).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), a = process.argv.slice(2), out = path.resolve(a[0] || 'reel-studio.zip'), films = a.includes('--output') ? path.resolve(a[a.indexOf('--output') + 1]) : null;
const filesOnly = a.includes('--films-only') ? path.resolve(a[a.indexOf('--films-only') + 1]) : null;
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-pack-')), dst = path.join(stage, 'reel-studio');
if (!filesOnly) fs.cpSync(TK, dst, { recursive: true, filter: (f) => !/[\\/](node_modules|\.venv|\.venv-blender|\.venv-voice|\.syslibs|\.bin|reel-projects|\.git|renders|__pycache__|\.cache)([\\/]|$)|install-report|[\\/]\.env$/.test(f.slice(TK.length)) });
if (!filesOnly) fs.copyFileSync(path.join(TK, 'setup.md'), path.join(stage, 'setup.md'));
if (filesOnly) fs.cpSync(filesOnly, path.join(stage, 'output/acceptance'), { recursive: true, filter: (f) => !/[\\/]frames([\\/]|$)/.test(f) });
else if (films) fs.cpSync(films, path.join(stage, 'output/acceptance'), { recursive: true, filter: (f) => !/[\\/]frames([\\/]|$)/.test(f) });
const py = `import zipfile,os,sys\nz=zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED,compresslevel=9)\nfor r,_,fs in os.walk(os.path.dirname(sys.argv[1])):\n  for f in sorted(fs):\n    p=os.path.join(r,f);z.write(p,os.path.relpath(p,os.path.dirname(sys.argv[1])))\nz.close()`;
fs.rmSync(out, { force: true }); const r = spawnSync(process.env.REEL_PY || 'python3', ['-c', py, dst, out], { encoding: 'utf8' }); if (r.status) { console.error(r.stderr); process.exit(1); }
fs.rmSync(stage, { recursive: true, force: true }); console.log(`${out}: ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
