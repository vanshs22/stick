#!/usr/bin/env node
// Look-dev sheet for the four 3D styles (kidsong, zackd, anime, pixar): wide / medium / close in each look, one row per style.
//   node tools/ink/looks.mjs <outDir> [--scale 0.5] [--only anime,pixar] [--layout L,P]    L = 16:9 landscape, P = 9:16 portrait (default both: every style works in both)      (needs `npm install` in renderers/inkbeat)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PY, defaultGL } from '../lib/pipeline.mjs';
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), R = path.join(TK, 'renderers/inkbeat'), a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const LAYS = opt('layout', 'L,P').split(','), out = path.resolve(a[0] || 'review/looks'), scale = opt('scale', '0.5'), only = opt('only', 'kidsong,zackd,anime,pixar').split(',');
if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error(`run "npm install" in ${R} first`); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const gl = defaultGL(), sh = (args) => spawnSync('npx', args, { cwd: R, encoding: 'utf8', shell: process.platform === 'win32', env: { ...process.env, REMOTION_GL: gl } });
const bundle = path.join(out, '.bundle'); fs.rmSync(bundle, { recursive: true, force: true });
let r = sh(['remotion', 'bundle', 'src/index.ts', `--out-dir=${bundle}`]); if (r.status) { console.error((r.stderr || r.stdout).slice(-800)); process.exit(1); }
const files = {};
for (const ly of LAYS) for (const st of only) for (const fr of ['wide', 'medium', 'close']) {
  const f = path.join(out, `${st}-${fr}-${ly}.jpg`), x = sh(['remotion', 'still', bundle, `Look-${st}-${fr}-${ly}`, f, '--frame=0', `--scale=${scale}`, '--gl=' + gl, '--timeout=240000']);
  if (x.status) { console.error(`${st}-${fr}-${ly} failed:\n${(x.stderr || x.stdout).slice(-500)}`); continue; } (files[ly] ||= []).push(`${st} ${fr}=${f}`); console.log(st, fr, ly);
}
const py = `import sys
from PIL import Image, ImageDraw
items=[a.split('=',1) for a in sys.argv[2:]]; H=420; rows={}
for l,f in items:
    im=Image.open(f).convert('RGB'); im=im.resize((round(im.width*H/im.height),H)); rows.setdefault(l.split()[0],[]).append((im,l))
W=max(sum(i.width for i,_ in r)+8*len(r) for r in rows.values()); S=Image.new('RGB',(W,len(rows)*(H+18)),(18,18,24)); d=ImageDraw.Draw(S)
for n,r in enumerate(rows.values()):
    x=0
    for im,l in r: S.paste(im,(x,n*(H+18)+18)); d.text((x+3,n*(H+18)+3),l,fill=(255,220,120)); x+=im.width+8
S.save(sys.argv[1],quality=88); print(S.size)`;
for (const ly of Object.keys(files)) { const pr = spawnSync(PY, ['-c', py, path.join(out, `looks-${ly === 'L' ? 'landscape' : 'portrait'}.jpg`), ...files[ly]], { encoding: 'utf8' }); console.log(pr.status ? pr.stderr : 'sheet: ' + path.join(out, `looks-${ly === 'L' ? 'landscape' : 'portrait'}.jpg`)); }
