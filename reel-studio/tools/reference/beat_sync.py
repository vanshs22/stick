#!/usr/bin/env python
"""How often does the picture get a NEW thing, and does it land on the spoken word?
   python tools/reference/beat_sync.py <video.mp4> <words.json> [--stage 0.62]       words.json = [[word, start, end], ...] (faster-whisper word times, or data/words.json of a project)
Visual beat = a rise in the frame difference of the STAGE region (the top share of the frame; the host or captions below are ignored) above 2.2x its running median, at most one per 0.35 s.
Prints beats per minute, the median gap, the share of beats within 0.18 s AFTER a word onset, and the same share expected by chance (so 'sync x' = how many times better than random). Writes <video>.beats.json."""
import json, sys, subprocess
import numpy as np, cv2
a = [x for x in sys.argv[1:] if not x.startswith('--')]; stage = float(sys.argv[sys.argv.index('--stage') + 1]) if '--stage' in sys.argv else 0.62
if len(a) < 2: sys.exit(__doc__)
a = a[:2]
W = json.load(open(a[1])); W = [(w[0], w[1], w[2]) if isinstance(w, list) else (w['w'], w['s'], w['e']) for w in W]
cap = cv2.VideoCapture(a[0]); fps = cap.get(cv2.CAP_PROP_FPS) or 30; N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); step = max(1, int(round(fps / 12))); prev = None; d = []; ts = []
for fi in range(0, N, step):
    cap.set(cv2.CAP_PROP_POS_FRAMES, fi); ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (160, 284)), cv2.COLOR_BGR2GRAY)[: int(284 * stage)].astype('float32')
    if prev is not None: d.append(float(np.abs(g - prev).mean())); ts.append(fi / fps)
    prev = g
d = np.array(d); med = np.convolve(d, np.ones(24) / 24, mode='same') + 0.15; beats = []; last = -9
for i, (t, v) in enumerate(zip(ts, d)):
    if v > 2.2 * med[i] and v > 1.2 and t - last > 0.35: beats.append(round(t, 2)); last = t
dur = N / fps; onsets = np.array([w[1] for w in W]); win = 0.18
hit = lambda t: bool(np.any((t - onsets >= -0.04) & (t - onsets <= win)))
sync = sum(hit(t) for t in beats) / max(1, len(beats)); grid = np.arange(0, dur, 0.05); chance = float(np.mean([hit(t) for t in grid]))
gaps = np.diff(beats) if len(beats) > 1 else np.array([0.0])
res = {'file': a[0].split('/')[-1], 'duration': round(dur, 1), 'beats': len(beats), 'beats_per_min': round(len(beats) / dur * 60, 1), 'median_gap_s': round(float(np.median(gaps)), 2), 'longest_gap_s': round(float(gaps.max()), 2), 'on_word_pct': round(sync * 100), 'chance_pct': round(chance * 100), 'sync_x': round(sync / max(chance, 1e-6), 2), 'words_per_min': round(len(W) / dur * 60), 'times': beats}
json.dump(res, open(a[0].replace('.mp4', '') + '.beats.json', 'w')); print({k: v for k, v in res.items() if k != 'times'})
