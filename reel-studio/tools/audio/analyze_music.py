#!/usr/bin/env python
"""What does this track do? tempo, beat strength, energy per second, low/high balance, brightness, a genre GUESS mapped to tools/audio/music_lab.py genres.
   python tools/audio/analyze_music.py <audio-or-video> [more ...]      prints one JSON per file. A guess, not a verdict: it is used to pick a genre and a tempo for OUR bed or track."""
import json, subprocess, sys
import numpy as np
from scipy import signal
SR = 16000
def load(p, sec=75):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-t', str(sec), '-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True); return np.frombuffer(r.stdout, dtype=np.float32)
def analyze(p):
    x = load(p)
    if len(x) < SR * 4: return {'file': p, 'error': 'too short'}
    hop = 160; fr = np.lib.stride_tricks.sliding_window_view(x[:len(x) // hop * hop], 400)[::hop]; e = np.sqrt((fr ** 2).mean(axis=1)); on = np.maximum(0, np.diff(np.log(e + 1e-5))); on -= np.convolve(on, np.ones(20) / 20, mode='same'); on = np.maximum(on, 0)
    ac = np.correlate(on, on, 'full')[len(on) - 1:]; lo, hi = int(60 / 200 / (hop / SR)), int(60 / 60 / (hop / SR)); k = lo + int(np.argmax(ac[lo:hi])); bpm = 60 / (k * hop / SR)
    while bpm < 78: bpm *= 2
    while bpm > 170: bpm /= 2
    f, pw = signal.welch(x, SR, nperseg=2048); tot = pw.sum() + 1e-12; bass = pw[(f >= 30) & (f < 200)].sum() / tot; high = pw[(f >= 3000) & (f < 8000)].sum() / tot; cen = float((f * pw).sum() / tot)
    sec = [float(np.sqrt((x[i * SR:(i + 1) * SR] ** 2).mean())) for i in range(len(x) // SR)]; punch = float(ac[k] / (ac[0] + 1e-12))
    g = 'cinematic' if punch < 0.1 and bpm < 100 else 'phonk' if 125 <= bpm <= 150 and bass > 0.55 and high > 0.02 else 'trap' if bpm >= 135 and bass > 0.5 else 'house' if 119 <= bpm <= 132 and punch > 0.3 else 'lofi' if bpm < 98 and cen < 1100 else 'synthwave' if 98 <= bpm < 119 and cen > 900 else 'corporate' if bpm < 119 else 'house'
    return {'file': p, 'bpm': round(bpm, 1), 'beat_strength': round(punch, 2), 'bass_share': round(float(bass), 2), 'high_share': round(float(high), 3), 'centroid_hz': round(cen), 'energy_per_s': [round(v, 3) for v in sec[:75]], 'genre_guess': g}
if __name__ == '__main__':
    for p in sys.argv[1:]: print(json.dumps(analyze(p)))
