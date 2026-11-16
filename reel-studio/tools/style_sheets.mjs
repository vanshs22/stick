#!/usr/bin/env node
// The SAME script and evidence in every style pack, as storyboard contact sheets, so styles can be compared side by side.
//   node tools/style_sheets.mjs <sourceProject> [--styles a,b] [--out <dir>] [--work <dir>] [--no-render]
// <sourceProject> supplies brief, script, research, assets, audio plan and the base storyboard (Stage3D character shots + evidence shots).
// Per style it writes <out>/<style-id>/: storyboard-1.jpg, storyboard-2.jpg, overview.jpg, frames/S01.jpg.., storyboard.json, storyboard-index.md, critics.txt
//   3D packs  : the character shots get the pack's character kind, costume, world and look (from style.json defaults.stage3d)
//   2D packs  : the character shots become cards the pack prefers (TitleCard, KineticList, Highlight, Stamp, ProofCard, RouteMap ...)
//   legacy    : voxel-studio uses the old Scene3D component
import fs from 'node:fs';
import path from 'node:path';
import { TK, PY, run, rd, syncProject } from './lib/pipeline.mjs';

const a = process.argv.slice(2), src = path.resolve(a[0] || ''), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
if (!a[0] || !fs.existsSync(path.join(src, 'storyboard/storyboard.json'))) { console.error('usage: style_sheets.mjs <sourceProject> [--styles a,b] [--out dir] [--work dir] [--no-render]'); process.exit(2); }
const out = path.resolve(opt('out', path.join(TK, '../output'))), work = path.resolve(opt('work', path.join(path.dirname(src), 'style-sheets')));
const all = fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => fs.existsSync(path.join(TK, 'style-packs', d, 'style.json')) && d !== '_template').sort();
const styles = opt('styles') ? opt('styles').split(',') : all;
const base = rd(path.join(src, 'storyboard/storyboard.json')), clone = (x) => JSON.parse(JSON.stringify(x));
const CHAR_SHOTS = base.shots.filter((s) => s.component === 'Stage3D').map((s) => s.id);

// ---- 2D replacements for the character shots (ids refer to the base storyboard of the acceptance project) ----
const anc = (line, ...words) => words.map((w, i) => ({ name: `a${i}`, line, word: w }));
const cut = { type: 'cut', sound: 'none' };
const card = (id, lines, component, props, anchors, intent) => ({ id, line_ids: lines, visual_intent: intent, shot_type: 'typography', component, props, ...(anchors ? { anchors } : {}), transition_out: cut });
const TWO_D = {
  common: {
    S01: card('S01', ['L01'], 'TitleCard', { text: 'What if making a video was as simple as writing a web page?', accent: 'web page', anchor: 'a0' }, anc('L01', 'What'), 'the opening question as a headline'),
    S02: card('S02', ['L02'], 'KineticList', { items: ['No timeline', 'No dragging clips', 'Just code'], anchorPrefix: 'a' }, anc('L02', 'timeline', 'dragging', 'code'), 'three short statements pop in as they are spoken'),
    S05: card('S05', ['L05'], 'Highlight', { text: 'Change what you draw on each frame and you have an animation', mark: 'animation', anchor: 'a0' }, anc('L05', 'animation'), 'the sentence with the key word marked'),
    S09: card('S09', ['L09'], 'Typewriter', { text: 'video = f(frame)', mono: true, size: 84, anchor: 'a0' }, anc('L09', 'video'), 'the idea as a formula, typed'),
    S11: card('S11', ['L11'], 'Stamp', { text: 'SAVE IT', anchor: 'a0' }, anc('L11', 'Save'), 'a stamp for the save prompt'),
  },
  'editorial-notebook': { S02: card('S02', ['L02'], 'NotebookPage', { title: 'No timeline', bullets: ['No dragging clips', 'Just code'], anchorPrefix: 'a' }, [{ name: 'a0', line: 'L02', word: 'dragging' }, { name: 'a1', line: 'L02', word: 'code' }], 'a notebook page lists the point') },
  'editorial-sticker': {
    S02: card('S02', ['L02'], 'Versus', { left: 'Timeline editor', right: 'Code', badge: 'VS', anchor: 'a0' }, anc('L02', 'No'), 'old way against new way'),
    S05: card('S05', ['L05'], 'Checklist', { items: ['frame 0', 'frame 1', 'frame 2', 'an animation'], heading: 'EACH FRAME', anchorPrefix: 'a' }, anc('L05', 'Change', 'draw', 'frame', 'animation'), 'frames tick off one by one'),
  },
  'paper-atlas': {
    S02: card('S02', ['L02'], 'Timeline', { events: [{ date: 'Before', label: 'timeline + clips' }, { date: 'Now', label: 'just code' }], anchorPrefix: 'a' }, anc('L02', 'timeline', 'code'), 'before and now on a timeline'),
    S05: card('S05', ['L05'], 'EvidenceCard', { variant: 'case-file', title: 'Each frame differs', lines: ['frame 0', 'frame 1', 'frame 2'], stamp: 'ANIMATION', anchor: 'a0' }, anc('L05', 'Change'), 'a case file for the idea'),
    S06: card('S06', ['L06'], 'RouteMap', { title: 'What a video is', points: [{ x: 0.15, y: 0.8, label: 'width x height' }, { x: 0.4, y: 0.55, label: 'fps' }, { x: 0.65, y: 0.35, label: 'length' }, { x: 0.85, y: 0.15, label: 'whole video' }] }, null, 'the four properties as stops on a route'),
    S09: card('S09', ['L09'], 'Stamp', { text: 'A FUNCTION OF TIME', anchor: 'a0' }, anc('L09', 'function'), 'the verdict stamp'),
    S11: card('S11', ['L11'], 'TitleCard', { text: 'Save this for your next project', accent: 'next project', anchor: 'a0' }, anc('L11', 'Save'), 'closing line as a headline'),
  },
};
const PROOF = {   // real captures shown as ProofCard in the packs that prefer it
  S03: { image: 'assets/web/fundamentals/page.png', source: 'remotion.dev/docs: The core idea', caption: 'a frame number and a blank canvas', highlight: { x: 0.03, y: 0.53, w: 0.94, h: 0.16 }, anchor: 'a0' },
  S08: { image: 'assets/web/github/page.png', source: 'github.com/remotion-dev/remotion', caption: '73.5k stars', highlight: { x: 0.03, y: 0.5, w: 0.5, h: 0.08 }, anchor: 'a0' },
};
const proofShot = (id, orig) => ({ ...orig, component: 'ProofCard', props: PROOF[id], anchors: anc(orig.line_ids[0], id === 'S03' ? 'Remotion' : 'Over') });

function adapt(pack) {
  const sb = clone(base); sb.style_pack = pack.id; const d = pack.defaults || {}, st = d.stage3d, byId = (id) => sb.shots.findIndex((s) => s.id === id);
  if (st) {   // a 3D pack: same shots, this pack's character, costume, world and look
    const kind = Object.keys(st.cast)[0];
    for (const s of sb.shots) if (s.component === 'Stage3D') { s.props.world = st.world; s.props.worldOpts = st.worldOpts || {}; for (const c of s.props.cast) { c.kind = kind; c.look = clone(st.cast[kind]); } }
  } else if (d.scene3d || pack.id === 'voxel-studio') {   // legacy Scene3D pack
    const cam = { S01: { shot: 'medium', move: 'push' }, S02: { shot: 'close' }, S05: { shot: 'wide' }, S09: { shot: 'medium', move: 'push' }, S11: { shot: 'medium' } };
    for (const id of CHAR_SHOTS) { const i = byId(id), s = sb.shots[i]; sb.shots[i] = { ...s, component: 'Scene3D', props: { set: 'block-world', characters: [{ variant: 'voxel', pose: [[0, 'open'], [1.5, 'point']], mood: 'happy', skin: '#C98A5E', shirt: '#4B6FE0', hair: '#2A1B12' }], camera: cam[id] || { shot: 'medium' } } }; }
  } else {   // a 2D pack
    for (const id of CHAR_SHOTS) { const i = byId(id), r = TWO_D[pack.id]?.[id] || TWO_D.common[id]; if (r) sb.shots[i] = r; }
    for (const id of ['S06']) { const r = TWO_D[pack.id]?.[id]; if (r) sb.shots[byId(id)] = r; }
    if (['editorial-sticker', 'paper-atlas'].includes(pack.id)) for (const id of ['S03', 'S08']) { const i = byId(id); sb.shots[i] = proofShot(id, sb.shots[i]); }
  }
  return sb;
}

function copyDir(from, to) { if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true, dereference: true }); }
const summary = [];
for (const id of styles) {
  const pf = path.join(TK, 'style-packs', id, 'style.json'); if (!fs.existsSync(pf)) { console.error(`no style pack "${id}"`); process.exit(2); }
  const pack = rd(pf), P = path.join(work, id);
  fs.rmSync(P, { recursive: true, force: true }); fs.mkdirSync(path.join(P, 'storyboard'), { recursive: true });
  for (const d of ['script', 'research', 'audio', 'assets', 'topic', 'typography']) copyDir(path.join(src, d), path.join(P, d));
  for (const f of ['script/script.json']) { /* copied above */ }
  const brief = rd(path.join(src, 'brief.json')); brief.style_pack = id; fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify(brief, null, 1));
  const sb = adapt(pack); fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify(sb, null, 1));
  fs.mkdirSync(path.join(P, 'remotion'), { recursive: true });
  fs.cpSync(path.join(TK, 'remotion-template'), path.join(P, 'remotion'), { recursive: true, filter: (f) => !f.split(path.sep).includes('node_modules') });
  if (fs.existsSync(path.join(TK, 'remotion-template/node_modules'))) fs.symlinkSync(path.join(TK, 'remotion-template/node_modules'), path.join(P, 'remotion/node_modules'), 'dir');
  syncProject(P);
  console.log(`\n=== ${id} (${pack.name})`);
  const chk = run('node', [path.join(TK, 'tools/check_storyboard.mjs'), P]), crit = run('node', [path.join(TK, 'tools/critique.mjs'), P, 'storyboard']);
  const dest = path.join(out, id); fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(path.join(dest, 'frames'), { recursive: true });
  const ctext = `# Automatic critics for ${id} (they measure; they do not judge looks)\n\n## check_storyboard\n${(chk.stdout + chk.stderr).trim()}\n\n## storyboard critic\n${(crit.stdout + crit.stderr).trim()}\n`;
  fs.writeFileSync(path.join(dest, 'critics.txt'), ctext); console.log(ctext.split('\n').filter((l) => /pass|revise|fail|OK|ERROR|MAJOR|BLOCKER/.test(l)).slice(0, 6).join('\n'));
  if (a.includes('--no-render')) continue;
  const r = run('node', [path.join(TK, 'tools/storyboard_review.mjs'), P], { env: { ...process.env, REMOTION_GL: process.env.REMOTION_GL || 'angle' }, timeout: 1500000 });
  if (r.status) { console.error(`render failed for ${id}:\n${(r.stderr || r.stdout).slice(-800)}`); summary.push([id, 'render failed']); continue; }
  for (const n of [1, 2]) { const f = path.join(P, `review/storyboard-sheets/storyboard-${n}.jpg`); if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dest, `storyboard-${n}.jpg`)); }
  for (const s of sb.shots) { const f = path.join(P, 'review/storyboard', `${s.id}.jpg`); if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dest, 'frames', `${s.id}.jpg`)); }
  fs.copyFileSync(path.join(P, 'storyboard/storyboard.json'), path.join(dest, 'storyboard.json')); fs.copyFileSync(path.join(P, 'review/storyboard-index.md'), path.join(dest, 'storyboard-index.md'));
  const py = `
import sys, glob
from PIL import Image, ImageDraw
d, o = sys.argv[1], sys.argv[2]; fs = sorted(glob.glob(d + '/S*.jpg')); w, h = 216, 384
im = Image.new('RGB', (6 * w, 2 * h), (244, 241, 233)); dr = ImageDraw.Draw(im)
for i, f in enumerate(fs[:12]):
    t = Image.open(f).convert('RGB').resize((w, h)); x, y = (i % 6) * w, (i // 6) * h; im.paste(t, (x, y)); dr.rectangle([x, y, x + 44, y + 20], fill=(232, 81, 42)); dr.text((x + 6, y + 4), f.split('/')[-1][:3], fill=(255, 255, 255))
im.save(o, quality=88)`;
  run(PY, ['-c', py, path.join(dest, 'frames'), path.join(dest, 'overview.jpg')]);
  summary.push([id, 'ok']);
}
console.log('\n' + summary.map(([i, s]) => `${i}: ${s}`).join('\n'));
