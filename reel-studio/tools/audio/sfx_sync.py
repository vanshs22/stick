#!/usr/bin/env python3
"""Does each sound cue really start where cues.json says? Measures onsets in data/mix.wav around every cue.
  python3 tools/audio/sfx_sync.py <project> [--json]
Per cue: nearest strong onset within +-150 ms (band 1-12 kHz spectral flux), its offset in ms, and how much it stands out
from the local flux (prominence). Prints JSON {cues:[{t,type,offset_ms,prominence,heard}]}."""
import json, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
sr, x = wavfile.read(P / 'data/mix.wav')
x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
x = x.mean(axis=1) if x.ndim > 1 else x
cues = json.loads((P / 'data/cues.json').read_text())['cues']
f, t, Z = stft(x, fs=sr, nperseg=1024, noverlap=1024 - 128)
band = (f >= 1000) & (f <= 12000)
mag = np.log1p(np.abs(Z[band]) * 50)
flux = np.maximum(0, np.diff(mag, axis=1)).sum(axis=0)
tt = t[1:]
out = []
for c in cues:
    w = (tt >= c['t'] - 0.15) & (tt <= c['t'] + 0.15)
    if not w.any():
        out.append({'t': c['t'], 'type': c['type'], 'offset_ms': None, 'prominence': 0, 'heard': False}); continue
    i = np.where(w)[0][np.argmax(flux[w])]
    ctx = (tt >= c['t'] - 1.5) & (tt <= c['t'] + 1.5)
    prom = float(flux[i] / (np.median(flux[ctx]) + 1e-6))
    out.append({'t': c['t'], 'type': c['type'], 'offset_ms': round(float(tt[i] - c['t']) * 1000), 'prominence': round(prom, 1), 'heard': prom >= 4})
print(json.dumps({'sr': int(sr), 'cues': out}))
