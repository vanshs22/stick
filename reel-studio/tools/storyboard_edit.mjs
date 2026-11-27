#!/usr/bin/env node
// Change one frame of the storyboard (camera, characters, environment, overlays, reference images) without touching the rest.
//   node tools/storyboard_edit.mjs <P> <shot> --alt B                                  apply an alternative from storyboard_alts.mjs
//   node tools/storyboard_edit.mjs <P> <shot> --set props.camera.framing=close-up --set props.world=workshop
//   node tools/storyboard_edit.mjs <P> <shot> --patch '{"props":{"cast":[{"id":"hero","pose":"cheer"}]}}'   (null deletes a key)
//   node tools/storyboard_edit.mjs <P> <shot> --reference <image> [--role composition|character|environment|typography|colour]
// Then: the critic runs, the frame is re-rendered, the frame goes back to "pending" (it needs the user's approval again) and a copy of the old storyboard is kept.
import fs from 'node:fs';
import path from 'node:path';
import { TK, run, rd, syncProject, timing, stills, deepMerge, setPath } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), id = a[1], all = (k) => a.flatMap((x, i) => (x === '--' + k ? [a[i + 1]] : [])), one = (k, d) => all(k)[0] ?? d;
if (!a[0] || !id) { console.error('usage: storyboard_edit.mjs <P> <shot> --alt X | --set path=value | --patch json | --reference image [--role r]'); process.exit(2); }
const f = path.join(P, 'storyboard/storyboard.json'), sb = rd(f), i = sb.shots.findIndex((s) => s.id === id); if (i < 0) { console.error(`no shot ${id}`); process.exit(1); }
fs.mkdirSync(path.join(P, 'storyboard/_history'), { recursive: true }); fs.copyFileSync(f, path.join(P, 'storyboard/_history', `storyboard-${Date.now()}.json`));
let shot = sb.shots[i], note = [];
if (one('alt')) { const alts = rd(path.join(P, 'review/alternatives', id + '.json')), al = alts.find((x) => x.letter === one('alt').toUpperCase()); if (!al) { console.error(`no alternative ${one('alt')}: ${alts.map((x) => x.letter).join(',')}`); process.exit(1); } shot = deepMerge(shot, al.patch); note.push(`alternative ${al.letter} (${al.name})`); }
if (one('patch')) { shot = deepMerge(shot, JSON.parse(one('patch'))); note.push('patch'); }
for (const kv of all('set')) { const [k, ...v] = kv.split('='); let val = v.join('='); try { val = JSON.parse(val); } catch { /* string */ } setPath(shot, k, val); note.push(`${k}`); }
if (one('reference')) { const src = path.resolve(one('reference')), role = one('role', 'composition'); if (!fs.existsSync(src)) { console.error(`no such file ${src}`); process.exit(1); } const dir = path.join(P, 'references'); fs.mkdirSync(dir, { recursive: true }); const dst = `${id}-${role}${path.extname(src)}`; fs.copyFileSync(src, path.join(dir, dst)); shot.reference = [...(shot.reference || []).filter((r) => r.role !== role), { role, file: `references/${dst}`, added: new Date().toISOString() }]; note.push(`reference ${role}`); }
sb.shots[i] = shot; fs.writeFileSync(f, JSON.stringify(sb, null, 1));
syncProject(P); timing(P);
const c = run('node', ['--no-warnings', path.join(TK, 'tools/check_cinematography.mjs'), P]); console.log(c.stdout.trim().split('\n').slice(-1)[0]); if (c.status) console.log(c.stdout.split('\n').slice(0, 12).join('\n'));
const r = stills(P, id); if (!r.ok) { console.error(r.out.slice(-500)); process.exit(1); }
if (fs.existsSync(path.join(P, 'state.json'))) run('node', [path.join(TK, 'tools/state.mjs'), 'frame', P, id, 'pending', '--note', `edited: ${note.join(', ')}`]);
console.log(`edited ${id} (${note.join(', ')}) -> review/storyboard/${id}.png ; the frame needs the user's approval again`);
