// Director critic: every shot has a purpose and a reason, the camera fits the purpose, neighbours differ in length, the cut rate fits the style (foundation/playbooks/camera.json).
//   purpose  each shot names one purpose from the director's list and says why (skills/reel-director)
//   fit      hook is not a wide shot, emotion is a close-up, payoff is wide or pulls back, reveal moves or holds
//   rhythm   neighbouring shots differ by at least 25 %; the cut rate is within 40 % of the style's measured rate; no framing + angle three times in a row
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { PURPOSES, cutsPer10 } from '../lib/director.mjs';

const WIDE = /wide|establish|ws\b|full/i, CLOSE = /close|cu\b|ecu|macro|face/i;
export async function run(P) {
  const r = new Report(P, 'director'), sb = tryRd(path.join(P, 'storyboard/storyboard.json')), sc = tryRd(path.join(P, 'script/script.json')), tl = tryRd(path.join(P, 'data/timeline.json'));
  if (!sb) { r.add('blocker', { problem: 'storyboard missing', evidence: '', expected: 'storyboard/storyboard.json', fix: 'create it' }); return r.finish(); }
  const words = (s) => (s.line_ids || []).reduce((n, id) => n + ((sc?.lines?.find((l) => l.id === id)?.text || '').split(/\s+/).filter(Boolean).length), 0);
  const dur = (s) => { const t = tl?.shots?.find((x) => x.id === s.id); return t ? t.end - t.start : Math.max(0.8, words(s) / 3.3); };
  r.check('purpose: every shot names a purpose and a reason');
  const withP = sb.shots.filter((s) => s.purpose).length;
  if (!withP) r.add('major', { problem: 'no shot names its purpose', evidence: `${sb.shots.length} shots without "purpose"`, expected: `purpose per shot: ${PURPOSES.join(', ')}`, fix: 'Run node tools/direct_shots.mjs <project> --write, then refine by hand' });
  else for (const s of sb.shots) {
    if (!PURPOSES.includes(s.purpose)) r.add('major', { shot_id: s.id, problem: `shot has no valid purpose ("${s.purpose ?? 'none'}")`, evidence: '', expected: PURPOSES.join(', '), fix: `Set purpose on ${s.id}` });
    else if (!s.why || String(s.why).length < 12) r.add('minor', { shot_id: s.id, problem: 'the director gave no reason for this shot', evidence: `purpose ${s.purpose}, why empty`, expected: 'a sentence: why this framing, move and length', fix: `Write why on ${s.id}` });
  }
  r.check('fit: the camera fits the shot purpose');
  for (const s of sb.shots) {
    const f = String(s.camera?.framing || s.props?.camera?.framing || ''), mv = String(s.camera?.movement || '');
    if (s.purpose === 'hook' && WIDE.test(f)) r.add('major', { shot_id: s.id, problem: 'the hook opens on a wide shot', evidence: `framing "${f}"`, expected: 'close or medium-close with a push', fix: 'Start closer on the subject' });
    if (s.purpose === 'emotion' && f && !CLOSE.test(f)) r.add('major', { shot_id: s.id, problem: 'an emotion beat is not a close-up', evidence: `framing "${f}"`, expected: 'close or extreme close-up on eyes and brows', fix: 'Cut in to the face' });
    if (s.purpose === 'payoff' && f && mv && !WIDE.test(f) && !/pull|crane|top|rise|back/i.test(mv)) r.add('minor', { shot_id: s.id, problem: 'the payoff neither goes wide nor pulls back', evidence: `framing "${f}", movement "${mv}"`, expected: 'wide, top-down or a pull-back so the consequence is visible', fix: 'Pull back on the last image' });
  }
  r.check('rhythm: shot lengths vary, cut rate fits the style, framings vary');
  const ds = sb.shots.map(dur), total = ds.reduce((a, b) => a + b, 0), style = sb.style_pack;
  let same = 0; for (let i = 1; i < ds.length; i++) { same = Math.abs(ds[i] - ds[i - 1]) / Math.max(ds[i], ds[i - 1]) < 0.25 ? same + 1 : 0; if (same >= 3) { r.add('minor', { shot_id: sb.shots[i].id, problem: 'four shots in a row have almost the same length', evidence: ds.slice(i - 3, i + 1).map((x) => x.toFixed(1)).join(', ') + ' s', expected: 'neighbouring shots differ by at least 25 %', fix: 'Lengthen or shorten one of them' }); same = 0; } }
  const want = cutsPer10(style); if (want && total > 6) { const got = (sb.shots.length / total) * 10; if (Math.abs(got - want) / want > 0.4 && sb.shots.length > 3) r.add('minor', { problem: `cut rate ${got.toFixed(1)} per 10 s, the style's references use ${want}`, evidence: `${sb.shots.length} shots in ${total.toFixed(0)} s`, expected: `${(want * 0.6).toFixed(1)}-${(want * 1.4).toFixed(1)} per 10 s`, fix: got > want ? 'Merge shots or hold longer with in-frame changes' : 'Cut more often or add reveals inside the shots' }); }
  let rep = 0; for (let i = 1; i < sb.shots.length; i++) { const k = (s) => `${s.camera?.framing || ''}|${s.camera?.angle || ''}`, a = k(sb.shots[i]); rep = a !== '|' && a === k(sb.shots[i - 1]) ? rep + 1 : 0; if (rep >= 2) { r.add('minor', { shot_id: sb.shots[i].id, problem: 'same framing and angle three shots in a row', evidence: a, expected: 'change the angle when the meaning changes', fix: 'Vary framing or angle' }); rep = 0; } }
  r.notes.push('Taste (is this camera choice the best one?) needs eyes: watch the render frames (tools/reference/watch.mjs) and the vision critics.');
  return r.finish();
}
