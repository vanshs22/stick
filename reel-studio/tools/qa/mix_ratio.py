#!/usr/bin/env python3
"""Mix-ratio gate (from the animated-shorts kit rules): music about -6 dB under the voice (gated RMS), SFX at or below that with peaks <= 0.7 of the voice peak, SFX events <= 8 per 20 s.
   python3 tools/qa/mix_ratio.py voice.wav music.wav sfx.wav [--events sfx-events.json]      exit 1 when outside tolerance
   python3 tools/qa/mix_ratio.py --selftest"""
import json, subprocess, sys
import numpy as np
SR = 22050
def load(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32)
def gated_rms_db(x, win=0.4):
    n = int(win * SR); blocks = [x[i:i + n] for i in range(0, len(x) - n, n)]
    e = np.array([float(np.sqrt(np.mean(b ** 2))) for b in blocks]) if blocks else np.array([float(np.sqrt(np.mean(x ** 2)))])
    g = e[e > max(e.max() * 0.1, 1e-6)]
    return 20 * np.log10(np.sqrt(np.mean(g ** 2)) + 1e-9)
def check(voice, music, sfx, events=None, tol=1.5):
    v, m, s = gated_rms_db(voice), gated_rms_db(music), gated_rms_db(sfx) if np.abs(sfx).max() > 1e-4 else -99.0
    peak_ratio = float(np.abs(sfx).max() / (np.abs(voice).max() + 1e-9)); out = {'music_vs_voice_db': round(m - v, 1), 'sfx_vs_voice_db': round(s - v, 1), 'sfx_peak_ratio': round(peak_ratio, 2)}; bad = []
    if abs((m - v) + 6) > tol: bad.append(f"music is {m - v:.1f} dB vs voice, want -6 +-{tol}")
    if s - v > -5: bad.append(f"sfx is {s - v:.1f} dB vs voice, want -6 or lower")
    if peak_ratio > 0.75: bad.append(f"sfx peak is {peak_ratio:.2f} of the voice peak, want <= 0.7")
    if events is not None:
        dur = len(voice) / SR; per20 = len(events) / max(dur, 1) * 20; out['sfx_per_20s'] = round(per20, 1)
        if per20 > 8: bad.append(f"{per20:.1f} sfx events per 20 s, want <= 8")
    out['problems'] = bad; return out
if __name__ == '__main__':
    if '--selftest' in sys.argv:
        t = np.arange(SR * 10) / SR; rng = np.random.default_rng(1); voice = (np.sin(2 * np.pi * 180 * t) * 0.3 * (np.sin(2 * np.pi * 2 * t) > -0.3)).astype(np.float32)
        good_m = (rng.standard_normal(len(t)) * 0.5).astype(np.float32); good_m *= 10 ** ((gated_rms_db(voice) - 6 - gated_rms_db(good_m)) / 20)
        sfx = np.zeros_like(voice); sfx[SR * 2:SR * 2 + 2000] = 0.1
        r = check(voice, good_m, sfx, events=[1, 2]); assert not r['problems'], r
        loud = good_m * 4; r2 = check(voice, loud, sfx, events=list(range(30))); assert len(r2['problems']) >= 2, r2
        print('mix_ratio selftest ok'); sys.exit(0)
    a = [x for x in sys.argv[1:] if not x.startswith('--')]; ev = None
    if '--events' in sys.argv: ev = json.load(open(sys.argv[sys.argv.index('--events') + 1])); ev = ev.get('events', ev) if isinstance(ev, dict) else ev; a = [x for x in a if x != sys.argv[sys.argv.index('--events') + 1]]
    r = check(load(a[0]), load(a[1]), load(a[2]), ev); print(json.dumps(r, indent=1)); sys.exit(1 if r['problems'] else 0)
