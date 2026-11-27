#!/usr/bin/env node
// Write twist.json for a reference: what to keep (measured), what to make better (measurable levers).
//   node tools/reference/twist.mjs <project> <refName> --idea "one sentence: what is better than the reference" [--shots 6] [--levers palette_shift,character_swap,set_swap,lighting_twist,camera_twist,format_twist,story_twist]
//   An IMAGE reference (or --levers) gets style levers: the film copies the look and changes the character, palette, set or story on purpose (tools/critics/style.mjs checks it).
import fs from 'node:fs';
import path from 'node:path';
import { makeTwist } from '../lib/twist.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), name = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const f = path.join(P, 'references', name || '', 'analysis.json');
if (!name || !fs.existsSync(f)) { console.error('usage: twist.mjs <project> <refName> --idea "..."   (the reference must be analysed first: tools/reference/ingest.mjs)'); process.exit(2); }
try { const tw = makeTwist(JSON.parse(fs.readFileSync(f, 'utf8')), opt('idea', ''), name, Number(opt('shots', 6)), (opt('levers', '') || '').split(',').filter(Boolean)); fs.writeFileSync(path.join(P, 'references', name, 'twist.json'), JSON.stringify(tw, null, 1)); console.log(`references/${name}/twist.json: keep ${tw.keep.map((k) => k.metric).join(', ')}; improve ${tw.improve.map((l) => l.id).join(', ') || '(style levers only)'}; style levers ${tw.style_levers.map((l) => l.id).join(', ') || 'none'}\nidea: ${tw.idea}`); } catch (e) { console.error(e.message); process.exit(1); }
