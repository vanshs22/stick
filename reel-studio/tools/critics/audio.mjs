// Voice, music and sound-effect critics (three reports) from real measurements of data/narration.wav, data/mix.wav and data/cues.json.
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { TK, PY, run } from '../lib/pipeline.mjs';
export async function run_(P, o = {}) {
  const m = run(PY, [path.join(TK, 'tools/critics/audio_measure.py'), P, ...(o.noWhisper ? ['--no-whisper'] : [])], { env: process.env }); let A = {}; try { A = JSON.parse(m.stdout.trim().split('\n').pop()); } catch { /* handled below */ }
  const tl = tryRd(path.join(P, 'data/timeline.json')), out = [];
  // ── voice
  const v = new Report(P, 'voice'); v.check('narration exists');
  if (!A.voice) v.add('blocker', { problem: 'no narration audio', evidence: m.stderr.slice(-200), expected: 'data/narration.wav', fix: 'run the voice step', fix_target: 'audio' });
  else {
    v.check('no clipping'); if (A.voice.peak > 0.985) v.add('major', { problem: 'narration is clipping', evidence: `peak ${A.voice.peak}`, expected: 'below 0.98', fix: 'regenerate with lower gain', fix_target: 'audio' });
    v.check('no unplanned gaps'); for (const [a, b] of A.voice.silences_inside) v.add('minor', { timestamp_sec: a, problem: 'long silence inside the narration', evidence: `${a}-${b}s`, expected: 'pauses under 0.9 s unless planned (pause_after)', fix: 'shorten the gap', fix_target: 'audio' });
    v.check('pronunciation: what a speech recogniser hears vs the script (faster-whisper)');
    if (A.voice.mismatch_rate != null) { if (A.voice.mismatch_rate > 0.12) v.add('major', { problem: 'the narration is often not what the script says', evidence: `${Math.round(A.voice.mismatch_rate * 100)} percent of words differ`, expected: 'under 12 percent', fix: 'add pronunciations (tools/choose.mjs voice --pron "word=spoken form") and regenerate', fix_target: 'audio' }); for (const d of A.voice.mismatches.slice(0, 6)) v.add('minor', { timestamp_sec: d.at, problem: 'possible mispronunciation', evidence: `script "${d.script}" heard "${d.heard}"`, expected: 'same word', fix: 'add a pronunciation entry or reword', fix_target: 'audio' }); } else v.notes.push(`pronunciation not checked: ${A.voice.whisper || 'whisper unavailable'}`);
    v.notes.push('Whether the voice SOUNDS good (warmth, emphasis) needs a human ear: this critic checks clipping, gaps and intelligibility only.');
  } out.push(v.finish());
  // ── music
  const mu = new Report(P, 'music'); mu.check('mix exists');
  if (!A.mix) mu.add('blocker', { problem: 'no mix', evidence: '', expected: 'data/mix.wav', fix: 'run mix.py', fix_target: 'audio' });
  else {
    mu.check('headroom and clipping'); if (A.mix.clipped_samples > 0) mu.add('major', { problem: 'the mix clips', evidence: `${A.mix.clipped_samples} samples`, expected: 'none', fix: 'lower music/sfx gain', fix_target: 'audio' }); if (A.mix.peak_db > -0.3) mu.add('minor', { problem: 'almost no headroom', evidence: `${A.mix.peak_db} dB`, expected: 'below -0.5 dB', fix: 'lower gain', fix_target: 'audio' });
    mu.check('music ducks under the voice'); if (A.mix.voice_over_music_db != null) { if (A.mix.voice_over_music_db < 8) mu.add('major', { problem: 'music is too loud under the voice', evidence: `voice is only ${A.mix.voice_over_music_db} dB above the music`, expected: 'at least 8 dB', fix: 'set music gain_db lower in audio-plan', fix_target: 'audio' }); if (A.mix.voice_over_music_db > 30) mu.add('minor', { problem: 'music is almost inaudible', evidence: `${A.mix.voice_over_music_db} dB`, expected: '10-26 dB', fix: 'raise music gain', fix_target: 'audio' }); } else mu.notes.push('voice-over-music level not measurable (no quiet stretch in the narration)');
    mu.notes.push('Music taste (does it fit the mood?) needs a human ear. The beds are procedural: calm, upbeat or tension.');
  } out.push(mu.finish());
  // ── sfx
  const sx = new Report(P, 'sfx'); sx.check('cues exist');
  if (!A.cues) sx.add('minor', { problem: 'no cues.json', evidence: '', expected: 'cues from build_cues.mjs (or none by choice)', fix: 'run build_cues', fix_target: 'audio' });
  else {
    const cues = A.cues.cues; sx.check('every effect is tied to a visual or narrative event'); for (const c of cues) { if (!c.event || !c.shot) sx.add('major', { timestamp_sec: c.t, problem: `sound "${c.type}" has no event`, evidence: JSON.stringify(c).slice(0, 100), expected: 'shot + event (word anchor, reveal, transition) recorded by build_cues', fix: 'attach it to an anchor or remove it', fix_target: 'storyboard' }); const sh = tl?.shots.find((s) => s.id === c.shot); if (sh && (c.t < sh.start - 0.5 || c.t > sh.end + 0.3)) sx.add('major', { shot_id: c.shot, timestamp_sec: c.t, problem: `sound "${c.type}" plays outside its shot`, evidence: `${c.t}s, shot ${sh.start}-${sh.end}s`, expected: 'inside the shot (or just before a cut)', fix: 'fix the anchor/offset', fix_target: 'storyboard' }); }
    sx.check('no repetition'); for (let i = 2; i < cues.length; i++) if (cues[i].type === cues[i - 1].type && cues[i].type === cues[i - 2].type) sx.add('minor', { timestamp_sec: cues[i].t, problem: `"${cues[i].type}" three times in a row`, evidence: '', expected: 'varied or fewer effects', fix: 'drop one', fix_target: 'storyboard' });
    const tr = cues.filter((c) => /^transition/.test(c.event || '') && /whoosh|swish|slide/.test(c.type)); if (tr.length > Math.max(2, (tl?.shots.length || 6) * 0.5)) sx.add('major', { problem: 'transition whooshes on most cuts', evidence: `${tr.length} transition sounds in ${tl?.shots.length} shots`, expected: 'a transition sound only where the motion has weight', fix: 'set transition_out.sound to none on plain cuts', fix_target: 'storyboard' });
    const dens = cues.length / Math.max(1, A.cues.duration) * 10; if (dens > 9) sx.add('minor', { problem: 'effects are dense', evidence: `${dens.toFixed(1)} per 10 s`, expected: 'under 9 per 10 s', fix: 'thin them out', fix_target: 'storyboard' });
  } out.push(sx.finish()); return out;
}
