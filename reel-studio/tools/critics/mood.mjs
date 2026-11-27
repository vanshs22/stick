// Music mood critic: each beat's music mood (audio-plan.json music_by_beat) fits the emotions written on that beat's script lines.
// Valence gap of 1.1 or more is a major finding, 0.8 or more a minor one. Missing plan or missing beat mapping is noted, not failed.
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { EMO } from '../lib/spatial.mjs';

export async function run(P) {
  const r = new Report(P, 'mood'), ap = tryRd(path.join(P, 'audio/audio-plan.json')), sc = tryRd(path.join(P, 'script/script.json'));
  r.check('music mood fits the emotion of the lines in each beat');
  const beats = ap?.music_by_beat;
  if (!beats?.length || !sc) { r.notes.push('No music_by_beat in audio/audio-plan.json: music is chosen by direction text only, so mood fit is not measured.'); return r.finish(); }
  const seen = new Set(beats.map((b) => b.beat_id));
  for (const b of beats) {
    const va = EMO.music_moods[b.mood], lines = sc.lines.filter((l) => l.beat === b.beat_id && l.emotion && EMO.emotions[l.emotion]);
    if (!lines.length) { r.add('minor', { problem: `music beat "${b.beat_id}" matches no script line with an emotion`, evidence: `script beats: ${[...new Set(sc.lines.map((l) => l.beat))].join(', ')}`, expected: 'beat_id equal to a script line beat', fix_target: 'audio', fix: 'Fix the beat_id, or give those lines an emotion' }); continue; }
    const v = lines.reduce((a, l) => a + EMO.emotions[l.emotion][0], 0) / lines.length, gap = Math.abs(v - va[0]);
    if (gap >= 1.1) r.add('major', { problem: `"${b.mood}" music under "${b.beat_id}" lines that read ${lines.map((l) => l.emotion).join(', ')}`, evidence: `valence gap ${gap.toFixed(2)} (lines ${v.toFixed(2)}, music ${va[0]})`, expected: 'music on the same side of positive and negative as the lines', fix_target: 'audio', fix: `Pick another mood for ${b.beat_id} (see emotion-data.json music_moods)` });
    else if (gap >= 0.8) r.add('minor', { problem: `"${b.mood}" music is a weak fit for "${b.beat_id}"`, evidence: `valence gap ${gap.toFixed(2)}`, expected: 'closer mood', fix_target: 'audio', fix: 'Try a closer mood' });
  }
  const un = [...new Set(sc.lines.map((l) => l.beat))].filter((x) => x && !seen.has(x)); if (un.length) r.notes.push(`Beats with no music plan (they keep the previous bed): ${un.join(', ')}`);
  r.notes.push('Mood is matched on valence only; energy, tempo and taste need ears.');
  return r.finish();
}
