#!/usr/bin/env node
// Asset selection evidence for the "assets" approval gate: every character, world, real capture, recreation, remocn block, voice, music and font the
// storyboard uses, with where it came from, its licence, the shots that use it and a picture where one exists.
//   node tools/assets_review.mjs <project>
// Writes assets/asset-selection.json and review/assets-sheet.jpg. Problems it reports (and the gate then refuses to be requested):
//   a "real" capture without source URL / capture date, a recreation that is not labelled as one, a missing file, an unlabelled evidence shot, a missing music file.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PY, run } from './lib/pipeline.mjs';

const P = path.resolve(process.argv[2] || '.'), rd = (f) => { try { return JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')); } catch { return null; } }, has = (f) => fs.existsSync(path.join(P, f));
if (!has('storyboard/storyboard.json')) { console.error('no storyboard/storyboard.json yet: the assets are chosen from the storyboard'); process.exit(1); }
const sb = rd('storyboard/storyboard.json'), warnings = [], cap = rd('assets/manifest.json') || { assets: [] }, plan = rd('audio/audio-plan.json') || {}, typo = rd('typography/typography.json') || {}, items = [], problems = [], used = new Map();
const use = (key, shot) => { used.set(key, [...(used.get(key) || []), shot]); };
const still = (id) => (has(`review/storyboard/${id}.png`) ? `review/storyboard/${id}.png` : null);
const h = (o) => crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 8);

// 1. real captures and recreations
const byPath = new Map(cap.assets.map((x) => [`assets/${x.path}`, x]));
for (const s of sb.shots) {
  const img = s.props?.image; if (img) use(img, s.id);
  if (s.props?.image && !has(img.startsWith('assets/') ? img : `remotion/public/${img}`)) problems.push(`${s.id}: image ${img} does not exist`);
  if (s.evidence?.required && !s.evidence.source_id && !s.evidence.asset_id) problems.push(`${s.id}: evidence is required but no source/asset is named`);
}
for (const s of sb.shots) if (s.bgImage?.src) {   // a real photo behind a shot: it must exist, be licensed (manifest) and not be stretched
  const src = s.bgImage.src, rel = src.replace(/^assets\//, ''), m = cap.assets.find((x) => x.path === rel); use(src, s.id);
  if (!has(src.startsWith('assets/') ? src : `remotion/public/${src}`)) problems.push(`${s.id}: bgImage ${src} does not exist`);
  else if (!m) problems.push(`${s.id}: bgImage ${src} is not in assets/manifest.json: fetch it with tools/assets/fetch.mjs or record its licence`);
  else if (!m.license || /^(unknown|none)$/i.test(m.license)) problems.push(`${s.id}: bgImage ${src} has no licence`);
  else if (/x([1-9]\d*\.\d+|[2-9]) to cover/.test(m.notes || '') && !/x(1\.0|1\.1[0-5]?|0\.\d+) to cover/.test(m.notes || '')) warnings.push(`${s.id}: bgImage ${src} is stretched (${(m.notes || '').match(/x[\d.]+ to cover/)?.[0]}): it will look soft; pick a bigger photo or add bgImage.blur`);
}
for (const s of sb.shots) {   // the ring must circle what the capture recorded: a stale or guessed region circles the wrong text
  const img = s.props?.image, h = s.props?.highlight; if (!img || !h || s.props?.highlight_manual) continue;
  const cj = rd(img.replace(/^assets\//, 'assets/').replace(/\/[^/]+$/, '/capture.json')); const rec = Object.values(cj?.highlights || {}); if (!rec.length) continue;
  if (!rec.some((r) => ['x', 'y', 'w', 'h'].every((k) => Math.abs(r[k] - h[k]) <= 0.02))) problems.push(`${s.id}: props.highlight ${JSON.stringify(h)} matches none of the regions the capture recorded (${rec.map((r) => JSON.stringify(r)).join(' | ')}): the ring would circle the wrong text. Copy a recorded region, or set props.highlight_manual: true`);
}
for (const x of cap.assets) {
  const file = `assets/${x.path}`, shots = sb.shots.filter((q) => JSON.stringify([q.props, q.evidence, q.bgImage]).includes(file) || JSON.stringify([q.props, q.evidence, q.bgImage]).includes(x.path) || q.evidence?.asset_id === x.path.split('/')[0]).map((q) => q.id), real = (x.kind || 'real') === 'real';
  if (!has(file)) problems.push(`${x.id}: file ${file} is missing`);
  if (real && !(x.source_url && x.captured_at)) problems.push(`${x.id}: a REAL capture needs source_url and captured_at (provenance)`);
  if (real && x.verification && x.verification.all_passed === false) problems.push(`${x.id}: the capture failed its own text checks (${(x.verification.expectations || []).filter((e) => !e.passed).map((e) => e.text).slice(0, 1)})`);
  if (!real) for (const sid of shots) { const s = sb.shots.find((q) => q.id === sid), t = `${s.props?.caption || ''} ${s.props?.source || ''} ${s.props?.title || ''} ${s.alt || ''}`; if (!/recreat|illustrat|mock|simulated|not a real/i.test(t)) problems.push(`${sid}: uses a RECREATION (${x.id}) but nothing on screen or in the alt text says so. Label it (props.source "RECREATION") so it is never taken for a real screenshot`); }
  if (!shots.length && has(file) && x.type !== 'audio') warnings.push(`${x.id}: captured but used by no shot (remove it or use it)`);
  items.push({ id: x.id, kind: real ? 'real-capture' : 'recreation', type: x.type, path: file, preview: has(file) ? file : null, provenance: { source_url: x.source_url || null, final_url: x.final_url || null, captured_at: x.captured_at || null, sha256: x.sha256 || null, text_verified: x.verification?.all_passed ?? null }, license: x.license || null, original: !!x.original, used_in: shots });
}
// 2. characters, worlds, props (3D shots)
const casts = new Map(), worlds = new Map();
for (const s of sb.shots.filter((q) => q.component === 'Stage3D')) {
  for (const c of s.props?.cast || []) { const k = `${c.kind}:${h(c.look || {})}`; if (!casts.has(k)) casts.set(k, { kind: c.kind, look: c.look || {}, shots: [] }); casts.get(k).shots.push(s.id); }
  const w = `${s.props?.world || 'default'}`; if (!worlds.has(w)) worlds.set(w, []); worlds.get(w).push(s.id);
}
let n = 0; for (const [k, v] of casts) items.push({ id: `char-${++n}`, kind: 'character', label: `${v.kind} (${Object.values(v.look).filter((x) => typeof x === 'string').slice(0, 3).join(', ') || 'default look'})`, source: 'toolkit rig (original design, procedural 3D)', license: 'original / part of the toolkit', original: true, preview: still(v.shots[0]), used_in: v.shots });
n = 0; for (const [w, v] of worlds) items.push({ id: `world-${++n}`, kind: 'world', label: w, source: 'toolkit world builder (procedural 3D)', license: 'original / part of the toolkit', original: true, preview: still(v[0]), used_in: v });
for (const s of sb.shots.filter((q) => q.component === 'RemocnBlock')) { const nm = s.props?.name, inst = has(`remotion/src/remocn/${nm}.tsx`); if (!inst) problems.push(`${s.id}: remocn block ${nm} is not installed`); items.push({ id: `remocn-${nm}`, kind: 'remocn-component', label: nm, source: 'remocn registry (open-source component)', license: 'see the remocn repository licence', original: false, preview: still(s.id), used_in: [s.id] }); }
// 3. audio and type
if (plan.voice) items.push({ id: 'voice', kind: 'voice', label: `${plan.voice.engine} ${plan.voice.voice || ''} x${plan.voice.speed || 1}`, source: plan.voice.engine === 'own-recording' ? 'user recording' : 'Kokoro (local, open model)', license: plan.voice.engine === 'own-recording' ? 'user-owned' : 'Apache-2.0 model', original: true, used_in: ['all'] });
const mus = plan.music || {}; if (mus.bed && mus.bed !== 'none') { const f = mus.file; if (mus.bed === 'file' && !(f && fs.existsSync(path.resolve(P, f)))) problems.push(`music file ${f || '(none named)'} does not exist`); items.push({ id: 'music', kind: 'music', label: mus.bed === 'file' ? f : `synthesised ${mus.bed} bed`, source: mus.bed === 'file' ? (cap.assets.find((x) => `assets/${x.path}` === f)?.source_url || 'user-supplied file') : 'toolkit synthesiser (no sample, no licence issue)', license: mus.bed === 'file' ? (mus.license || cap.assets.find((x) => `assets/${x.path}` === f)?.license || 'UNKNOWN: the user must confirm the licence') : 'original / generated', original: mus.bed !== 'file', used_in: ['all'] }); if (mus.bed === 'file' && !mus.license && !cap.assets.find((x) => `assets/${x.path}` === f)?.license) problems.push('music file has no licence note (audio-plan.music.license)'); }
if (typo.headline) items.push({ id: 'type', kind: 'font', label: `${typo.headline.font} / ${typo.supporting?.font || ''} / ${typo.ui?.font || ''}`, source: 'Google Fonts via @remotion/google-fonts', license: 'OFL / open font licences', original: false, used_in: ['all'] });
if (!items.length) problems.push('the storyboard uses no assets at all: nothing to approve');

const out = { generated_at: new Date().toISOString(), style_pack: sb.style_pack || null, items, problems, warnings, summary: items.reduce((a, i) => ({ ...a, [i.kind]: (a[i.kind] || 0) + 1 }), {}) };
fs.mkdirSync(path.join(P, 'assets'), { recursive: true }); fs.mkdirSync(path.join(P, 'review'), { recursive: true });
fs.writeFileSync(path.join(P, 'assets/asset-selection.json'), JSON.stringify(out, null, 1));
// contact sheet of everything that has a picture; text-only items are listed under it
const pics = items.filter((i) => i.preview && has(i.preview)).slice(0, 12), spec = path.join(P, 'review/.assets-sheet.json');
fs.writeFileSync(spec, JSON.stringify({ out: path.join(P, 'review/assets-sheet.jpg'), tiles: pics.map((i) => ({ file: path.join(P, i.preview), label: `${i.id}: ${i.label || i.kind}`.slice(0, 44), sub: `${i.kind}${i.used_in?.length ? ' · ' + i.used_in.slice(0, 3).join(',') : ''}` })), extra: items.filter((i) => !pics.includes(i)).map((i) => `${i.id} (${i.kind}): ${i.label || ''}`) }));
const r = run(PY, ['-c', `
import json,sys
from PIL import Image,ImageDraw
d=json.load(open(sys.argv[1])); T=d['tiles']; W=300; cols=4; rows=max(1,(len(T)+cols-1)//cols); ex=d['extra']
imgs=[]
for t in T:
    try: im=Image.open(t['file']).convert('RGB')
    except Exception: im=Image.new('RGB',(W,400),(60,60,60))
    im.thumbnail((W,420)); imgs.append(im)
H=max([i.height for i in imgs]+[200])+46
sheet=Image.new('RGB',(cols*(W+12)+12, rows*(H+8)+12+max(0,len(ex))*22+30),(24,24,30)); dr=ImageDraw.Draw(sheet)
for k,(t,im) in enumerate(zip(T,imgs)):
    x=12+(k%cols)*(W+12); y=12+(k//cols)*(H+8); sheet.paste(im,(x,y)); dr.text((x,y+im.height+4),t['label'],fill=(255,255,255)); dr.text((x,y+im.height+20),t['sub'],fill=(160,160,180))
y=12+rows*(H+8)
if ex:
    dr.text((12,y),'Also used (no picture):',fill=(255,200,120)); 
    for k,e in enumerate(ex): dr.text((12,y+22+k*20),e[:120],fill=(220,220,230))
sheet.save(d['out'],quality=88)
`, spec]); fs.rmSync(spec, { force: true });
if (r.status) { console.error(r.stderr.slice(-300)); process.exit(1); }
console.log(`assets/asset-selection.json: ${items.length} assets (${Object.entries(out.summary).map(([k, v]) => `${v} ${k}`).join(', ')}), ${problems.length} problem(s); review/assets-sheet.jpg`);
warnings.forEach((p) => console.log('  note    ' + p)); problems.forEach((p) => console.log('  PROBLEM ' + p)); process.exit(problems.length ? 1 : 0);
