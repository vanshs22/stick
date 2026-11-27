#!/usr/bin/env node
// Storyboard frames for an inkbeat plan: 3 stills per shot (15 %, 50 %, 90 % of the shot, so the camera MOVE is visible) + one contact sheet with the shot id, time and the word on screen.
//   node tools/ink/stills.mjs <outDir> [--scale 0.5] [--quality master|fast|draft] [--per 3] [--only S01,S03] [--at 12.3,20.1]   (renderer: renderers/inkbeat, needs `npm install` there)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PY } from '../lib/pipeline.mjs';
import { renderStills } from './lib/stills.mjs';
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), R = path.join(TK, 'renderers/inkbeat'), a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const out = path.resolve(a[0] || 'review/ink'), scale = opt('scale', '0.5'), per = +opt('per', 3), only = opt('only') && new Set(opt('only').split(','));
if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error(`run "npm install" in ${R} first`); process.exit(1); }
const plan = fs.readFileSync(path.join(R, 'src/story/plan.gen.ts'), 'utf8'), P = JSON.parse(plan.slice(plan.indexOf('{'), plan.lastIndexOf('}') + 1));
fs.mkdirSync(out, { recursive: true });
const marks = []; // [id, label, t]
for (const s of P.shots) { if (only && !only.has(s.id)) continue; for (let k = 0; k < per; k++) { const u = per === 1 ? 0.5 : [0.15, 0.5, 0.9][k] ?? (k + 0.5) / per; marks.push([s.id, `${s.id} ${s.mood}`, s.t + (s.end - s.t) * u]); } }
if (opt('at')) for (const t of opt('at').split(',')) marks.push(['T', `t=${t}`, +t]);
const files = [];
const jobs = marks.map(([id, label, t]) => ({ id: 'Story', frame: Math.min(P.duration - 1, Math.round(t * P.fps)), out: path.join(out, `${id}_${t.toFixed(2)}.jpg`) }));
await renderStills(jobs, { scale: +scale, quality: opt('quality', 'master') });   // one browser for all of them
marks.forEach(([id, label, t], i) => { const w = P.words.filter((q) => q[1] <= t + 0.05).at(-1)?.[0] || ''; files.push({ f: jobs[i].out, label: `${label} ${t.toFixed(1)}s "${w}"` }); console.log(label, t.toFixed(2), 'frame', jobs[i].frame); });
fs.writeFileSync(path.join(out, 'sheet.json'), JSON.stringify(files));
const py = `import json,sys
from PIL import Image, ImageDraw
d=json.load(open(sys.argv[1])); per=int(sys.argv[3]); ims=[(Image.open(x['f']).convert('RGB'),x['label']) for x in d]
w,h=ims[0][0].size; w2,h2=w//2,h//2; cols=per*2 if per<=3 else per; rows=-(-len(ims)//cols)
S=Image.new('RGB',(cols*w2,rows*(h2+16)),(18,18,24)); dr=ImageDraw.Draw(S)
for i,(im,lb) in enumerate(ims):
    x,y=(i%cols)*w2,(i//cols)*(h2+16); S.paste(im.resize((w2,h2)),(x,y+16)); dr.text((x+3,y+2),lb,fill=(255,220,120))
S.save(sys.argv[2],quality=88)`;
const pr = spawnSync(PY, ['-c', py, path.join(out, 'sheet.json'), path.join(out, 'storyboard.jpg'), String(per)], { encoding: 'utf8' }); if (pr.status) console.error(pr.stderr); else console.log('sheet:', path.join(out, 'storyboard.jpg'));
