#!/usr/bin/env node
// The storyboard as FRAMES the user can approve or reject one by one: a numbered sheet (6 shots per page) with the narration line,
// camera/framing, the reason for any camera move and the approval status of every frame, plus the cinematography critic result.
//   node tools/storyboard_review.mjs <P> [--only S01,S02] [--no-render]
// After the user decides:  state.mjs frame <P> S03 approve|reject|replace   ·   storyboard_alts.mjs <P> S03   ·   storyboard_edit.mjs <P> S03 ...
import fs from 'node:fs';
import path from 'node:path';
import { TK, run, rd, syncProject, timing, stills, thumb, copyPublic, log, defaultGL } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !fs.existsSync(path.join(P, 'storyboard/storyboard.json'))) { console.error('usage: storyboard_review.mjs <projectDir> [--only S01,S02] [--no-render]'); process.exit(2); }
const R = path.join(P, 'remotion'); syncProject(P); timing(P);
const crit = run('node', ['--no-warnings', path.join(TK, 'tools/check_cinematography.mjs'), P]); console.log(crit.stdout.trim().split('\n').slice(-1)[0]);
if (!a.includes('--no-render')) { const s = stills(P, opt('only')); if (!s.ok) { console.error(s.out.slice(-600)); process.exit(1); } }
const sb = rd(path.join(P, 'storyboard/storyboard.json')), script = rd(path.join(P, 'script/script.json')), lines = Object.fromEntries(script.lines.map((l) => [l.id, l.text]));
let st = {}; try { st = rd(path.join(P, 'state.json')).stages.storyboard.frames || {}; } catch { /* no state yet */ }
const out = path.join(P, 'review/storyboard-sheets'); fs.mkdirSync(out, { recursive: true });
const cam = (s) => { const c = s.props?.camera; if (!c) return `${s.component}${s.props?.camera ? '' : ''}`; const m = c.movement?.type && c.movement.type !== 'static' ? ` + ${c.movement.type}` : ' (locked)'; return `${c.framing} / ${c.angle || 'eye-level'}${m}`; };
const items = sb.shots.map((s) => { const png = path.join(P, 'review/storyboard', s.id + '.png'), j = thumb(png, path.join(P, 'review/storyboard', s.id + '.jpg')), pub = path.join(R, 'public/gallery'), name = `sb-${s.id}${path.extname(j)}`; fs.mkdirSync(pub, { recursive: true }); if (fs.existsSync(j)) fs.copyFileSync(j, path.join(pub, name)); return { id: s.id, img: `gallery/${name}`, lines: s.line_ids.map((l) => lines[l]).join(' '), cam: `${s.component === 'Stage3D' ? cam(s) : s.component}`, why: s.props?.camera?.movement?.why || s.visual_intent, status: st[s.id]?.status || 'pending' }; });
const pages = []; for (let i = 0; i < items.length; i += 6) pages.push(items.slice(i, i + 6));
const env = { ...process.env, REMOTION_GL: defaultGL() }; const files = [];
pages.forEach((it, k) => { const f = path.join(out, `props-${k + 1}.json`); fs.writeFileSync(f, JSON.stringify({ kind: 'storyboard', title: `Storyboard ${k + 1}/${pages.length}`, subtitle: 'Approve, reject or replace each frame by its number.', items: it })); const png = path.join(out, `storyboard-${k + 1}.png`); const r = run('npx', ['remotion', 'still', 'src/index.ts', 'Sheet', png, `--props=${f}`], { cwd: R, env }); if (r.status) { console.error(r.stderr.slice(-500)); process.exit(1); } files.push(thumb(png, path.join(out, `storyboard-${k + 1}.jpg`), 1080)); });
fs.writeFileSync(path.join(P, 'review/storyboard-index.md'), `# Storyboard frames\n\n${items.map((i) => `- **${i.id}** [${i.status}] "${i.lines}"  \n  ${i.cam}  \n  ${i.why}`).join('\n')}\n\nSheets: ${files.map((f) => path.relative(P, f)).join(', ')}\n`);
console.log(`${files.join('\n')}\nframes: ${items.map((i) => `${i.id}=${i.status}`).join(' ')}`);
