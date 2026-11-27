#!/usr/bin/env node
// Sound-sync critic on a synthetic mix: a cue with a click on time passes, a click 120 ms late is a major, a cue with no click is flagged as hard to hear.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, PY, run as sh } from './lib/pipeline.mjs';
import { run } from './critics/sync.mjs';

const P = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-')); fs.mkdirSync(path.join(P, 'data'), { recursive: true });
const gen = `
import numpy as np, sys
from scipy.io import wavfile
sr=48000; rng=np.random.default_rng(7); n=sr*6
bed=0.02*rng.standard_normal(n); b=np.cumsum(bed)*0.02; b-=np.convolve(b,np.ones(2000)/2000,'same')   # quiet low-frequency bed
x=b.copy()
def click(t):
    i=int(t*sr); m=int(0.03*sr); x[i:i+m]+=0.6*rng.standard_normal(m)*np.hanning(m)
for t in (1.0, 2.5, 3.32): click(t)
wavfile.write(sys.argv[1]+'/data/mix.wav', sr, (np.clip(x,-1,1)*32767).astype(np.int16))`;
const g = sh(PY, ['-c', gen, P]); if (g.status) { console.error(g.stderr); process.exit(1); }
fs.writeFileSync(path.join(P, 'data/cues.json'), JSON.stringify({ duration: 6, cues: [{ t: 1.0, type: 'pop' }, { t: 2.5, type: 'whoosh' }, { t: 3.2, type: 'hit' }, { t: 4.8, type: 'ding' }] }));
const log = console.log; console.log = () => {}; const r = await run(P); console.log = log;
const bad = [], has = (sev, re) => r.findings.some((f) => f.severity === sev && re.test(f.problem));
if (r.findings.some((f) => /"pop"|"whoosh"/.test(f.problem))) bad.push('on-time clicks must not be flagged: ' + r.findings.map((f) => f.problem).join('; '));
if (!has('major', /"hit" cue lands/)) bad.push('a click 120 ms late was not caught');
if (!has('minor', /"ding" cue .* hard to hear/)) bad.push('a cue with no click was not flagged');
const none = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-none-')); console.log = () => {}; const r2 = await run(none); console.log = log;
if (r2.findings.length) bad.push('no mix should be noted, not failed');
if (bad.length) { console.error('SYNC SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log('SYNC SELFTEST PASSED: on-time cues clean, a late cue is a major, a masked cue is flagged, a missing mix is only noted');
