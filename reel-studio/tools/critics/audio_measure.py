"""Measurements for the voice / music / sfx critics. Prints one JSON object.  python audio_measure.py <projectDir> [--no-whisper]"""
import os as _os, pathlib as _pl; _b = _pl.Path(__file__).resolve().parents[2] / '.bin'; _os.environ['PATH'] = (str(_b) + _os.pathsep + _os.environ['PATH']) if _b.exists() else _os.environ['PATH']  # installer's ffmpeg fallback
import json, re, sys, difflib, os, subprocess
from pathlib import Path
import numpy as np
from scipy.io import wavfile
P = Path(sys.argv[1]); out = {}
def load(f):
    sr, x = wavfile.read(f); x = x.astype(np.float32) / 32768; return sr, (x.mean(1) if x.ndim > 1 else x)
tts = json.loads((P / 'data/tts.json').read_text()) if (P / 'data/tts.json').exists() else None
if (P / 'data/narration.wav').exists():
    sr, v = load(P / 'data/narration.wav'); hop = int(0.02 * sr); n = len(v) // hop; rms = np.sqrt((v[:n * hop].reshape(n, hop) ** 2).mean(1)); thr = 0.02 * rms.max(); sp = rms > thr
    runs, s0 = [], None
    for i, q in enumerate(list(~sp) + [False]):
        if q and s0 is None: s0 = i
        if not q and s0 is not None:
            if (i - s0) * 0.02 > 0.9 and s0 > 25 and i < n - 25: runs.append((round(s0 * 0.02, 2), round(i * 0.02, 2)))
            s0 = None
    out['voice'] = {'duration': round(len(v) / sr, 2), 'peak': round(float(np.abs(v).max()), 3), 'silences_inside': runs, 'speech_ratio': round(float(sp.mean()), 3)}
    if '--no-whisper' not in sys.argv and tts:
        try:
            from faster_whisper import WhisperModel
            m = WhisperModel('small.en', device='cpu', compute_type='int8'); segs, _ = m.transcribe(str(P / 'data/narration.wav'), word_timestamps=True, language='en')
            heard = [(re.sub(r"[^a-z0-9']", '', w.word.lower()), round(w.start, 2)) for s in segs for w in s.words]; heard = [h for h in heard if h[0]]
            pron = tts.get('pron', {}); text = ' '.join(l['text'] for l in tts['lines'])
            for k, r in pron.items(): text = re.sub(r'\b' + re.escape(k) + r'\b', r, text)
            want = [re.sub(r"[^a-z0-9']", '', w.lower()) for w in text.split()]; want = [w for w in want if w]
            sm = difflib.SequenceMatcher(None, want, [h[0] for h in heard]); diffs = []
            for tag, a0, a1, b0, b1 in sm.get_opcodes():
                if tag != 'equal': diffs.append({'script': ' '.join(want[a0:a1]), 'heard': ' '.join(h[0] for h in heard[b0:b1]), 'at': heard[b0][1] if b0 < len(heard) else None})
            out['voice'].update(words_script=len(want), words_heard=len(heard), mismatch_rate=round(sum(max(a1 - a0, b1 - b0) for t, a0, a1, b0, b1 in sm.get_opcodes() if t != 'equal') / max(1, len(want)), 3), mismatches=diffs[:20])
        except Exception as e: out['voice']['whisper'] = f'not run: {e}'
if (P / 'data/mix.wav').exists():
    sr, m = load(P / 'data/mix.wav'); out['mix'] = {'peak_db': round(20 * np.log10(np.abs(m).max() + 1e-9), 2), 'rms_db': round(20 * np.log10(np.sqrt((m ** 2).mean()) + 1e-9), 2), 'clipped_samples': int((np.abs(m) > 0.999).sum())}
    if 'voice' in out and (P / 'data/narration.wav').exists():
        sr2, v = load(P / 'data/narration.wav')
        if sr2 != sr:
            from scipy.signal import resample_poly; from math import gcd; g = gcd(sr, sr2); v = resample_poly(v, sr // g, sr2 // g).astype(np.float32)
        n = min(len(m), len(v)); m, v = m[:n], v[:n]
        a = float((m * v).sum() / ((v * v).sum() + 1e-12)); res = m - a * v  # least-squares: the voice's share of the mix; the residual is music + sfx under it
        hop = int(0.05 * sr); k = n // hop; vr = np.sqrt((v[:k * hop].reshape(k, hop) ** 2).mean(1)); rr = np.sqrt((res[:k * hop].reshape(k, hop) ** 2).mean(1)); mr = np.sqrt((m[:k * hop].reshape(k, hop) ** 2).mean(1)); talk = vr > 0.03 * vr.max()
        if talk.sum() > 6:
            out['mix']['music_under_voice_db'] = round(float(20 * np.log10(np.median(rr[talk]) + 1e-9)), 2); out['mix']['voice_level_db'] = round(float(20 * np.log10(np.median(a * vr[talk]) + 1e-9)), 2); out['mix']['voice_over_music_db'] = round(out['mix']['voice_level_db'] - out['mix']['music_under_voice_db'], 1)
if (P / 'data/cues.json').exists(): out['cues'] = json.loads((P / 'data/cues.json').read_text())
print(json.dumps(out, default=lambda o: o.item() if hasattr(o, "item") else str(o)))
