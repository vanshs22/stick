#!/usr/bin/env node
// The director's first draft for every shot (skills/reel-director): purpose, camera by purpose, acting by sentence function, and the reason.
//   node tools/direct_shots.mjs <project> [--write]
// Fills only what is missing (camera.framing/movement, cast pose, presenter pose); always sets purpose, why and acting. Refine by hand, then run critique.mjs <project> director.
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE, GESTURE, PURPOSE_OF_FUNCTION, RECIPE, functionOf, LABEL } from './lib/director.mjs';

const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export function direct(P) {
  const sb = rd(path.join(P, 'storyboard/storyboard.json')), sc = rd(path.join(P, 'script/script.json')), eng = ENGINE[sb.style_pack] || '2d-flat', vocab = eng === '3d' ? 'sdf' : 'stick', n = sc.lines.length;
  const byId = Object.fromEntries(sc.lines.map((l, i) => [l.id, { ...l, i }]));
  const rows = sb.shots.map((s, k) => {
    const l = byId[s.line_ids[0]] || { text: '', i: k }, fn = functionOf(l.text, l.i, n, l.beat);
    let purpose = PURPOSE_OF_FUNCTION[fn]; if (k === 0) purpose = 'hook'; if (k === sb.shots.length - 1 && /cta|follow|comment|link|send/i.test(`${l.beat} ${l.text}`)) purpose = 'cta';
    if (['3d', 'sprite-in-3d'].includes(eng) && k === 1 && sb.shots.length >= 6 && !sb.shots.some((x) => x.purpose === 'establish')) purpose = 'establish';
    if (/^(shock|fear|anger|sad)$/.test(l.emotion || '') && !['hook', 'cta', 'payoff'].includes(purpose)) purpose = 'emotion';
    const rc = RECIPE[purpose];
    return { s, fn, purpose, rc, l, why: `${purpose}: ${rc.framing} + ${rc.movement}, about ${rc.dur[0]}-${rc.dur[1]} s (playbook camera/${rc.entry}); the line works as "${fn}"${l.emotion ? `, ${l.emotion}` : ''}` };
  });
  return { sb, eng, rows, vocab };
}
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [P, ...a] = process.argv.slice(2); if (!P) { console.error('usage: direct_shots.mjs <project> [--write]'); process.exit(2); }
  const { sb, rows, vocab, eng } = direct(P);
  for (const { s, fn, purpose, rc, l, why } of rows) {
    s.purpose = purpose; s.why = why; s.acting = { function: fn, gesture: GESTURE[fn][vocab], expression: l.emotion || 'neutral' };
    s.camera = { ...(s.camera || {}) }; if (!s.camera.framing) s.camera.framing = rc.framing; if (!s.camera.movement) s.camera.movement = rc.movement;
    for (const c of s.props?.cast || []) if (!c.pose && c.id === s.props.speaker) c.pose = GESTURE[fn].stick;
    if (s.props?.presenter && !s.props.presenter.pose) s.props.presenter.pose = GESTURE[fn].sprite;
    console.log(`${s.id} ${purpose.padEnd(10)} ${fn.padEnd(11)} ${s.camera.framing}/${s.camera.movement}  ${s.acting.gesture}`);
  }
  if (a.includes('--write')) { fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify(sb, null, 1) + '\n'); console.error(`written. engine ${eng}, style label ${LABEL[sb.style_pack] || sb.style_pack}`); }
}
