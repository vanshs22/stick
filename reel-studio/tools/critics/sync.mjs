// Sound-sync critic: measures where each sound cue really starts in data/mix.wav (tools/audio/sfx_sync.py).
// Offset over 80 ms from cues.json is a major finding (40 ms a minor one); a cue with no onset standing out of the mix is minor (masked by voice or music).
import path from 'node:path';
import fs from 'node:fs';
import { Report } from './lib.mjs';
import { TK, PY, run as sh } from '../lib/pipeline.mjs';

export async function run(P) {
  const r = new Report(P, 'sync'); r.check('each sound cue starts within 40 ms of its time and can be heard');
  if (!fs.existsSync(path.join(P, 'data/mix.wav')) || !fs.existsSync(path.join(P, 'data/cues.json'))) { r.notes.push('No data/mix.wav or data/cues.json yet: sound sync not measured. Run build_cues.mjs and mix.py first.'); return r.finish(); }
  const x = sh(PY, [path.join(TK, 'tools/audio/sfx_sync.py'), P]); if (x.status) { r.add('minor', { problem: 'sound sync could not be measured', evidence: String(x.stderr || '').trim().slice(-200), expected: 'sfx_sync.py runs', fix_target: 'toolchain', fix: 'Install numpy and scipy' }); return r.finish(); }
  for (const c of JSON.parse(x.stdout).cues) {
    if (c.offset_ms == null || !c.heard) r.add('minor', { problem: `"${c.type}" cue at ${c.t}s is hard to hear`, evidence: `prominence ${c.prominence} (needs 4 or more)`, expected: 'a clear onset in the mix', fix_target: 'audio', fix: 'Raise the cue gain, or move it off a loud word', timestamp_sec: c.t });
    else if (Math.abs(c.offset_ms) > 80) r.add('major', { problem: `"${c.type}" cue lands ${c.offset_ms} ms off`, evidence: `cues.json says ${c.t}s`, expected: 'within 80 ms', fix_target: 'audio', fix: 'Rebuild cues (build_cues.mjs) and the mix; check the sound has no silent lead-in', timestamp_sec: c.t });
    else if (Math.abs(c.offset_ms) > 40) r.add('minor', { problem: `"${c.type}" cue is ${c.offset_ms} ms off`, evidence: `cues.json says ${c.t}s`, expected: 'within 40 ms', fix_target: 'audio', fix: 'Shift the cue offset', timestamp_sec: c.t });
  }
  r.notes.push('Onsets are measured in the 1 to 12 kHz band, so a deep boom can read as hard to hear. Whether the sound FITS the picture needs ears.');
  return r.finish();
}
