"""Measure how ALIVE a narration is, not how clean: pitch movement, loudness dynamics, pause variety, speaking-rate variation.
  python prosody.py <narration.wav> [lines.json]      -> prints a table and a verdict; --json writes the numbers

A flat text-to-speech read has: pitch moving by only a few semitones, a constant loudness, equal pauses and an even speaking rate. A directed read moves.
Reference ranges (working values from measured human explainer narration and from this toolkit's own before/after tests, not a standard):
  pitch_range_st   (p90-p10 of voiced pitch, semitones)   flat < 4.5   alive >= 6.5
  pitch_std_st                                            flat < 1.9   alive >= 2.6
  loudness_std_db  (speech frames, 50 ms)                 flat < 3.0   alive >= 4.5
  pause_cv         (std/mean of pauses >= 120 ms)         flat < 0.35  alive >= 0.55
  rate_cv          (std/mean of words per second by line) flat < 0.07  alive >= 0.12
"""
import json, sys
import numpy as np
from scipy.io import wavfile


def f0_track(x, sr, lo=70, hi=330, win=0.04, hop=0.01):
    n, h = int(win * sr), int(hop * sr); out = []
    for i in range(0, len(x) - n, h):
        f = x[i:i + n] * np.hanning(n)
        if np.sqrt(np.mean(f ** 2)) < 0.01: out.append(0.0); continue
        ac = np.correlate(f, f, 'full')[n - 1:]; ac = ac / (ac[0] + 1e-12)
        a, b = int(sr / hi), int(sr / lo); seg = ac[a:b]
        if not len(seg): out.append(0.0); continue
        k = int(np.argmax(seg)) + a
        out.append(sr / k if ac[k] > 0.45 else 0.0)
    return np.array(out)


def measure(path, lines=None):
    sr, x = wavfile.read(path); x = x.astype(np.float64) / 32768.0
    if x.ndim > 1: x = x.mean(1)
    f0 = f0_track(x, sr); v = f0[f0 > 0]
    st = 12 * np.log2(v / np.median(v)) if len(v) > 20 else np.array([0.0])
    hop = int(0.05 * sr); n = len(x) // hop; rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)]); sp = rms > 0.02 * (rms.max() + 1e-9)
    db = 20 * np.log10(rms[sp] + 1e-9); quiet = ~sp; pauses = []; run = 0
    for q in quiet:
        if q: run += 1
        elif run: pauses.append(run * 0.05) if run * 0.05 >= 0.12 else None; run = 0
    r = {'pitch_range_st': round(float(np.percentile(st, 90) - np.percentile(st, 10)), 2), 'pitch_std_st': round(float(st.std()), 2), 'loudness_std_db': round(float(db.std()), 2) if len(db) else 0.0,
         'pause_cv': round(float(np.std(pauses) / (np.mean(pauses) + 1e-9)), 2) if len(pauses) > 2 else 0.0, 'pauses': len(pauses)}
    if lines:
        L = json.load(open(lines))['lines']; wps = [len(l['text'].split()) / max(0.2, l['end'] - l['start']) for l in L]
        r['rate_cv'] = round(float(np.std(wps) / (np.mean(wps) + 1e-9)), 2)
    return r


FLAT = {'pitch_range_st': 4.5, 'pitch_std_st': 1.9, 'loudness_std_db': 3.0, 'pause_cv': 0.35, 'rate_cv': 0.07}
ALIVE = {'pitch_range_st': 6.5, 'pitch_std_st': 2.6, 'loudness_std_db': 4.5, 'pause_cv': 0.55, 'rate_cv': 0.12}


def verdict(r):
    score = []
    for k, flat in FLAT.items():
        if k not in r: continue
        s = 0.0 if r[k] <= flat else 1.0 if r[k] >= ALIVE[k] else (r[k] - flat) / (ALIVE[k] - flat); score.append(s)
    return round(float(np.mean(score)), 2), [k for k, flat in FLAT.items() if k in r and r[k] <= flat]


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not a: print(__doc__); sys.exit(2)
    r = measure(a[0], a[1] if len(a) > 1 else None); s, flat = verdict(r)
    print(json.dumps({**r, 'aliveness': s, 'flat_in': flat}) if '--json' in sys.argv else f"aliveness {s:.2f} (0 = flat read, 1 = directed read)  " + '  '.join(f'{k}={v}' for k, v in r.items()) + (f"\nflat in: {', '.join(flat)}" if flat else ''))
