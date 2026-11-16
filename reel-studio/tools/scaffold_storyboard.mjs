#!/usr/bin/env node
// A VALID first draft of the storyboard from the script, the style pack and the captures you already have. It passes check_storyboard and the
// cinematography critic, so you start from something that works and spend your effort making each shot good, not on JSON syntax.
//   node tools/scaffold_storyboard.mjs <project> [--force]
// One shot per script line. Character beats become a pack character shot (3D packs) or a text card (2D packs); evidence beats take the next real capture
// from assets/manifest.json; commands become a Terminal; the CTA becomes an EndCard. Every shot is marked "draft": improve it (poses, framing, a remocn
// component, anchors), look at the stills, and delete the "draft" flag.
import fs from 'node:fs';
import path from 'node:path';
import { TK, rd } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), out = path.join(P, 'storyboard/storyboard.json');
if (!a[0] || !fs.existsSync(path.join(P, 'script/script.json')) || !fs.existsSync(path.join(P, 'brief.json'))) { console.error('usage: scaffold_storyboard.mjs <project> [--force]   (needs brief.json and script/script.json)'); process.exit(2); }
if (fs.existsSync(out) && !a.includes('--force')) { console.error(`${out} already exists: use --force to overwrite it, or edit it.`); process.exit(1); }
const brief = rd(path.join(P, 'brief.json')), script = rd(path.join(P, 'script/script.json')), pack = rd(path.join(TK, 'style-packs', brief.style_pack, 'style.json'));
const man = fs.existsSync(path.join(P, 'assets/manifest.json')) ? rd(path.join(P, 'assets/manifest.json')) : { assets: [] };
const research = fs.existsSync(path.join(P, 'research/research.json')) ? rd(path.join(P, 'research/research.json')) : { claims: [], sources: [] }, srcUrl = Object.fromEntries((research.sources || []).map((x) => [x.id, String(x.url || '')])), claimSrc = Object.fromEntries((research.claims || []).map((c) => [c.id, c.source_ids || []]));
const shots3d = pack.defaults?.stage3d, caps = (man.assets || []).filter((x) => x.kind === 'real' && /\.(png|jpe?g)$/i.test(x.path || '') && x.verification?.all_passed !== false).map((x) => ({ image: `assets/${x.path}`, title: x.page_title || x.source_url || '', url: String(x.source_url || '').replace(/^https?:\/\//, ''), full: String(x.source_url || ''), id: String(x.id || '') , used: false }));
const capForLine = (l) => { for (const cid of l.claims || []) for (const sid of claimSrc[cid] || []) { const c = caps.find((x) => !x.used && (x.id.startsWith(sid + '-') || x.id === sid || (srcUrl[sid] && x.full.split('#')[0].replace(/\/$/, '') === srcUrl[sid].split('#')[0].replace(/\/$/, '')))); if (c) return c; } return null; };
const HOOK = new Set(['hook', 'stakes', 'objection', 'twist', 'save']), EVID = new Set(['setup', 'mechanism', 'proof', 'step']);
const POSE = { hook: [[0, 'idle'], [0.6, 'explain-wide']], stakes: [[0, 'shrug'], [1.6, 'cheer']], objection: [[0, 'think']], twist: [[0, 'think'], [2.2, 'point']], save: [[0, 'wave']], setup: [[0, 'explain-wide']], step: [[0, 'explain-wide']], mechanism: [[0, 'explain-wide']], proof: [[0, 'point']], cta: [[0, 'point']] };
const MOOD = { hook: [[0, 'curious'], [1.8, 'happy']], stakes: [[0, 'relieved'], [1.6, 'happy']], objection: 'curious', twist: [[0, 'curious'], [2.2, 'smirk']], save: 'happy' };
const CAM = [{ framing: 'medium', az: -14 }, { framing: 'medium-wide', az: -48 }];   // alternate framing AND azimuth (one side of the subject, 34 degrees apart): no jump cuts, no axis crossing
const words = (t) => t.replace(/[^\w'\s-]/g, ' ').split(/\s+/).filter(Boolean);
const cmdOf = (t) => {
  const tick = t.match(/`([^`]+)`/); if (tick) return tick[1];
  const m = t.match(/\b((?:npx|npm|pip|python3?|git|node|docker|brew|cd|ls)(?:\s+[\w@./:=-]+){1,5})/); if (!m) return null;
  const STOP = new Set(['turns', 'the', 'and', 'into', 'to', 'then', 'with', 'for', 'that', 'which', 'it', 'a', 'is', 'will', 'can', 'so', 'by', 'in', 'on', 'from', 'you', 'we', 'turn', 'makes', 'gives', 'lets']), tok = m[1].split(/\s+/), keep = [tok[0]];
  for (const w of tok.slice(1)) { if (STOP.has(w.toLowerCase())) break; keep.push(w); } return keep.length > 1 ? keep.join(' ') : null;
};
const shots = []; let usedCap = 0, char = 0, twoD = 0; const cut = { type: 'cut', sound: 'none' };
script.lines.forEach((l, i) => {
  const id = `S${String(i + 1).padStart(2, '0')}`, key = (l.emphasis?.[0] || words(l.text).sort((x, y) => y.length - x.length)[0] || '').replace(/[^\w'-]/g, ''), first = words(l.text)[0], base = { id, line_ids: [l.id], draft: true, transition_out: cut };
  const intent = (what) => `DRAFT: ${what} (${l.beat})`;
  if (l.beat === 'cta') { shots.push({ ...base, visual_intent: intent('end card with the call to action'), shot_type: 'typography', component: 'EndCard', props: { headline: brief.title || l.text, accent: words(brief.title || '').slice(-1)[0] || key, ...(brief.cta?.keyword ? { cta: `Comment ${brief.cta.keyword}` } : {}) } }); return; }
  const cap = EVID.has(l.beat) ? capForLine(l) : null;
  if (cap) {
    const c = cap; c.used = true; usedCap++; shots.push({ ...base, visual_intent: intent(`the real page: ${c.title}`), shot_type: 'evidence', component: 'BrowserWindow', props: { url: c.url, title: c.title.slice(0, 60), image: c.image, anchor: 'swing' }, anchors: [{ name: 'swing', line: l.id, word: first }], sfx: [{ type: 'pop', anchor: 'swing', gain: 0.3 }] }); return;
  }
  const cmd = cmdOf(l.text); if (EVID.has(l.beat) && cmd) { shots.push({ ...base, visual_intent: intent(`the command: ${cmd}`), shot_type: 'screen-demo', component: 'Terminal', props: { lines: [cmd], anchor: 'go' }, anchors: [{ name: 'go', line: l.id, word: words(cmd)[0] }], sfx: [{ type: 'type', anchor: 'go', dur: 1.2 }] }); return; }
  if (shots3d && (HOOK.has(l.beat) || EVID.has(l.beat))) {
    const kind = Object.keys(shots3d.cast)[0], cam = CAM[char++ % 2];
    shots.push({ ...base, visual_intent: intent('the character says it to us'), shot_type: 'character', component: 'Stage3D', props: { world: shots3d.world, worldOpts: shots3d.worldOpts || {}, cast: [{ id: 'hero', kind, look: JSON.parse(JSON.stringify(shots3d.cast[kind])), at: [-0.1, 0.2], rotY: 0.25, pose: POSE[l.beat] || POSE.step, mood: MOOD[l.beat] || 'happy', speaks: true }], props3d: [], camera: { ...cam, angle: 'three-quarter', subject: 'hero', offset: [0.05, 0], focus: { target: 'hero', aperture: 0.004 }, movement: { type: 'static' } } } }); return;
  }
  const c2 = twoD++ % 2 === 0 && l.beat === 'hook' ? ['TitleCard', { text: l.text.replace(/[?.!]+$/, '?').length < 90 ? l.text : words(l.text).slice(0, 12).join(' '), accent: key, anchor: 'a0' }] : ['Highlight', { text: l.text, mark: key, anchor: 'a0', size: 80 }];
  shots.push({ ...base, visual_intent: intent('the sentence as a card with the key word marked'), shot_type: 'typography', component: c2[0], props: c2[1], anchors: [{ name: 'a0', line: l.id, word: key || first }] });
});
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify({ style_pack: brief.style_pack, shots }, null, 1));
console.log(`draft storyboard: ${shots.length} shots -> ${out}\n  ${shots.map((s) => `${s.id} ${s.component}`).join(', ')}\n  real captures used: ${usedCap} of ${caps.length}\nnext: node ${TK}/tools/check_storyboard.mjs ${P}   then   node ${TK}/tools/storyboard_review.mjs ${P}   and OPEN the sheets. Improve every shot; this is a baseline, not the result.`);
