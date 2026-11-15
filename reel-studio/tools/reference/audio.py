"""Transcript + pacing + sound-effect density of a reference video, all local (Whisper + numpy, no credits).
usage: python audio.py <video> [...]  -> refs/<stem>.audio.json
Words/min and caption pace come from Whisper word times. SFX candidates = short loud bursts that fall OUTSIDE speech
(a whoosh/hit/pop between words) found by high-band spectral flux; music = energy between words/bursts."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from faster_whisper import WhisperModel

import os
OUT = Path(os.environ.get('REF_OUT', 'reference-analysis')); OUT.mkdir(parents=True, exist_ok=True)
import shutil
FF = shutil.which("ffmpeg") or "ffmpeg"
model = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=2)

def run(path):
    path = Path(path); wav = Path("/tmp") / (path.stem + ".wav")
    subprocess.run([FF, "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", "16000", str(wav)], check=True)
    sr, y = wavfile.read(wav); y = y.astype(np.float32) / 32768; dur = len(y) / sr
    segs, _ = model.transcribe(str(wav), word_timestamps=True, vad_filter=False, beam_size=1)
    words = [(w.word.strip(), round(w.start, 2), round(w.end, 2)) for s in segs for w in s.words]
    spoken = np.zeros(int(dur * 100) + 2, bool)
    for _, s, e in words: spoken[int(s * 100):int(e * 100) + 1] = True
    # 10 ms RMS and 4-8 kHz flux (16 kHz audio -> use difference signal as high-pass proxy)
    hop = 160; n = len(y) // hop
    hp = np.diff(y, prepend=0); rms = np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(1)); hrms = np.sqrt((hp[:n * hop].reshape(n, hop) ** 2).mean(1))
    base = np.median(hrms) + 1e-6; bursts = []
    for i in range(3, n - 3):
        if hrms[i] > base * 5 and hrms[i] == hrms[max(0, i - 25):i + 25].max() and not spoken[max(0, i - 8):i + 9].any():
            if not bursts or i / 100 - bursts[-1] > 0.4: bursts.append(round(i / 100, 2))
    gaps = ~spoken[:n]; music = float(rms[gaps].mean()) if gaps.any() else 0.0; voice = float(rms[spoken[:n]].mean()) if spoken[:n].any() else 1e-6
    r = subprocess.run([FF, "-i", str(path), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    lufs = float(r.split("I:")[-1].split("LUFS")[0]) if "I:" in r else None
    res = {"file": path.name, "duration": round(dur, 2), "words": len(words), "wpm": round(len(words) / dur * 60), "lufs": lufs,
           "music_to_voice_db": round(20 * np.log10(max(music, 1e-6) / voice), 1), "sfx_bursts": bursts,
           "sfx_per_10s": round(len(bursts) / dur * 10, 2), "pause_share": round(float(gaps.mean()), 2),
           "transcript": " ".join(w for w, _, _ in words), "word_times": words}
    (OUT / (path.stem + ".audio.json")).write_text(json.dumps(res, indent=1)); return res

for p in sys.argv[1:]:
    r = run(p); print(r["file"], r["duration"], "s", r["wpm"], "wpm", r["lufs"], "LUFS music/voice", r["music_to_voice_db"], "dB sfx/10s", r["sfx_per_10s"]); print("  ", r["transcript"][:300])
