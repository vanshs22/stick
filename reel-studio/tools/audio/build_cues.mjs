#!/usr/bin/env node
// Sound events -> data/cues.json (the format tools/audio/mix.py reads). Every effect is attached to a visual event, never to "a new scene starts".
//   node tools/audio/build_cues.mjs <projectDir>      (run after build_timeline.mjs; then: python tools/audio/mix.py .)
// Sources: storyboard shot.sfx[] (anchor = a named word anchor, or at start/end + offset) and shot.transition_out.sound (at the next cut).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const P = process.argv[2]; if (!P) { console.error('usage: build_cues.mjs <projectDir>'); process.exit(2); }
const rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')), tl = rd('data/timeline.json'), sb = rd('storyboard/storyboard.json');
const mixSrc = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'mix.py'), 'utf8');
const KNOWN = new Set([...mixSrc.match(/^FX = dict\(([\s\S]*?)\)\nLEVEL/m)[1].matchAll(/(\w+?)_?=/g)].map((m) => m[1])), errs = [], cues = [], DUR = { type: 1.2, count: 0.9, alarm: 1.2, whoosh: 0.38, swish: 0.3 };
sb.shots.forEach((s, k) => {
  const sh = tl.shots[k], add = (type, t, gain = 0.7, dur) => { if (!KNOWN.has(type)) { errs.push(`shot ${s.id}: unknown sound "${type}". Known: ${[...KNOWN].join(', ')}`); return; } cues.push({ t: +Math.max(0, t).toFixed(3), type, gain, ...((dur || DUR[type]) ? { dur: dur || DUR[type] } : {}) }); };
  (s.sfx || []).forEach((e) => { let t = e.at === 'end' ? sh.end : sh.start; if (e.anchor) { if (!(e.anchor in sh.anchors)) { errs.push(`shot ${s.id}: sfx "${e.type}" uses anchor "${e.anchor}" that the shot does not define`); return; } t = sh.anchors[e.anchor]; } add(e.type, t + (e.offset || 0), e.gain ?? 0.7, e.dur); });
  const tr = s.transition_out; if (tr?.sound && tr.sound !== 'none' && k + 1 < tl.shots.length) add(tr.sound, tl.shots[k + 1].start - 0.02, 0.6);
});
cues.sort((x, y) => x.t - y.t);
// guard rails: no pile-ups (more than 4 sounds in 1 s), no sound inside the last 0.2 s
for (let i = 0; i < cues.length; i++) { const n = cues.filter((c) => c.t >= cues[i].t && c.t < cues[i].t + 1).length; if (n > 4) { errs.push(`${n} sounds inside one second at ${cues[i].t}s: remove some`); break; } }
if (errs.length) { console.error('cues NOT built:\n- ' + errs.join('\n- ')); process.exit(1); }
fs.writeFileSync(path.join(P, 'data/cues.json'), JSON.stringify({ duration: tl.duration, cues }, null, 1)); console.log(`data/cues.json: ${cues.length} cues (${[...new Set(cues.map((c) => c.type))].join(', ')})`);
