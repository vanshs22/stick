#!/usr/bin/env node
// A first ink-plan.json from the project's storyboard and word timings, so an inkbeat-engine film starts from the SAME storyboard, script and voice as every other film.
//   node tools/ink/scaffold_plan.mjs <project> [--force] [--mood day]        -> <project>/ink-plan.json   (then improve it: skills/inkbeat, references/camera-and-editing.md)
// One ink shot per storyboard shot. The first shot starts at 0, each next one on the first word of its first line. Camera beats land on the shot's anchor words (alternating PUSH, ORBIT, MACRO, at least 0.9 s apart, at most 3 per shot).
// The framing preset cycles wide, medium, closeUp, heroLow (the shot ladder, docs/CAMERA-GRAMMAR.md). It is a SKELETON: sets, hero positions and acting are yours to design.
import fs from 'node:fs';
import path from 'node:path';
import { rd, TK } from '../lib/pipeline.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] ? a[i + 1] : d; };
const out = path.join(P, 'ink-plan.json'); if (!fs.existsSync(path.join(P, 'storyboard/storyboard.json'))) { console.error('usage: scaffold_plan.mjs <project> [--force] [--mood day]  (needs storyboard/storyboard.json and data/words.json)'); process.exit(2); }
if (fs.existsSync(out) && !a.includes('--force')) { console.error('ink-plan.json exists (use --force to overwrite)'); process.exit(1); }
const sb = rd(path.join(P, 'storyboard/storyboard.json')), sc = rd(path.join(P, 'script/script.json')), W = rd(path.join(P, 'data/words.json')), brief = rd(path.join(P, 'brief.json')), pack = rd(path.join(TK, 'style-packs', brief.style_pack, 'style.json'));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9'-]/g, ''), lineIx = (id) => sc.lines.findIndex((l) => l.id === id), nth = (li, word) => { let k = 0; for (const w of W) if (w.line === li && norm(w.w) === norm(word)) { k++; } let n = 0; for (const w of W) if (w.line === li && norm(w.w) === norm(word)) { n++; return [li, word, n]; } return null; };
const SPEC = pack.ink_look || null;   // a Studio-made look is DATA in the pack (docs/INKBEAT.md): the plan carries it and the renderer builds it
const LOOK = SPEC ? 'custom' : { 'kidsong-3d': 'kidsong', 'zackd-cutaway': 'zackd', 'anime-cinematic': 'anime', 'pixar-soft': 'pixar' }[pack.id] || 'den', DAY = SPEC ? 'c-' + Object.keys(SPEC.moods)[0] : { kidsong: 'kids-day', zackd: 'zd-studio', anime: 'anime-day', pixar: 'pixar-warm', den: 'day' }[LOOK];   // the set, the hero and the mood of the pack
const HERO0 = { kidsong: { at: [-0.3, 0, -1.4], yaw: 0.35 }, zackd: { at: [-1.35, 0, -2.0], yaw: 0.6 }, anime: { at: [0.5, 0, -2.0], yaw: -0.45 }, pixar: { at: [-0.7, 0, -1.7], yaw: 0.6 }, custom: { at: [-0.7, 0, -1.7], yaw: 0.6 }, den: { at: [-0.9, 0, -1.3], yaw: 0.7 } }[LOOK];
const PRE = ['wide', 'medium', 'closeUp', 'heroLow'], MOVES = ['PUSH', 'ORBIT_R', 'MACRO', 'PUSH', 'ORBIT_L'], mood = opt('mood', brief.ink?.mood || DAY);
const shots = sb.shots.map((s, i) => {
  const li = lineIx(s.line_ids[0]), first = W.find((w) => w.line === li), t0 = first?.s ?? 0, anchors = (s.anchors || []).map((x) => ({ w: x.word, line: lineIx(x.line) })).filter((x) => x.line >= 0), beats = []; let last = -9;
  for (const x of anchors) { const w = W.find((q) => q.line === x.line && norm(q.w) === norm(x.w)); if (!w || w.s - last < 0.9 || beats.length >= 3) continue; const at = nth(x.line, x.w); if (at) { beats.push({ at, move: MOVES[(beats.length + i) % MOVES.length] }); last = w.s; } }
  return { id: s.id, from: i === 0 || !first ? null : [li, first.w, 1], mood, note: s.visual_intent, hero: HERO0, cam: { preset: PRE[i % PRE.length], side: i % 2 ? 30 : -30, fov: 56 }, acts: [{ at: null, face: { brows: 'neutral', mouth: 'smile' } }], beats, show: {} };
});
fs.writeFileSync(out, JSON.stringify({ _doc: 'scaffolded from the storyboard by tools/ink/scaffold_plan.mjs: a skeleton to improve', title: brief.title, look: LOOK, ...(SPEC ? { lookSpec: SPEC } : {}), tailSec: 0.7, cadence: pack.cadence || 'beat-short', format: brief.aspect || '9:16', accent: [], shots }, null, 1));
console.log(`${out}: ${shots.length} shots, ${shots.reduce((n, s) => n + s.beats.length, 0)} beats. Next: node tools/ink/plan.mjs ink-plan.json data/words.json  (prints the pacing report), then look at stills.`);
