"""Inside Out soundtrack: narration + soft procedural sound effects + a quiet music bed, all made here with numpy.
No samples, no AI audio, no downloads.

  python3 tools/mix.py [project=.]          → data/mix.wav (48 kHz stereo)

Reads data/cues.json (node tools/capture.mjs cues), data/narration.wav if it exists (voice.py or words.py --audio),
and script.json "music": "bed" (the procedural score, default) · "none" · "audio/your-track.mp3" (your own royalty-free
track, any format ffmpeg reads). The music ducks under the voice.

Sound rules (STYLE.md): every effect is soft and rounded, nothing above ~5 kHz, no ticks / hats / glitches / beeps.
Cue types: whoosh slide pop plop gulp boing bubbles sizzle sparkle thud slam tock zip alarm  (+ gain, dur)
"""
import os as _os, pathlib as _pl; _b = _pl.Path(__file__).resolve().parents[2] / '.bin'; _os.environ['PATH'] = (str(_b) + _os.pathsep + _os.environ['PATH']) if _b.exists() else _os.environ['PATH']  # installer's ffmpeg fallback
import sys as _sys; from pathlib import Path as _P; _sys.path.insert(0, str(_P(__file__).parent))
import json, os, subprocess, sys
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile

P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SR = 48000
rng = np.random.default_rng(11)
cj = json.loads((P / 'data/cues.json').read_text())
script = json.loads((P / os.environ.get('TTS_SCRIPT', 'script.json')).read_text())
DUR = float(cj['duration'])
N = int(DUR * SR) + SR // 10


def lp(x, f, o=2): b, a = signal.butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, f0, f1, o=2): b, a = signal.butter(o, [f0 / (SR / 2), f1 / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def db(x): return 10 ** (x / 20)
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=None):
    """attack a seconds then exponential release over the rest"""
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    rest = n - na; e[na:] = np.exp(-np.linspace(0, r or 5, rest)) if rest > 0 else 1; return e
def sweep(f0, f1, d, shape='exp'):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d) if shape == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def noise(d): return rng.standard_normal(int(d * SR))


# ---------- the effects ----------
def whoosh(d=0.38, **_):
    n = noise(d); lo, hi = lp(n, 500), lp(n, 2200)
    k = np.sin(np.pi * np.linspace(0, 1, len(n))); x = (lo * (1 - k) + hi * k) * k ** 1.5
    return x / (np.abs(x).max() + 1e-9) * 0.5
def slide(d=1.0, **_):
    n = lp(noise(d), 700); e = np.sin(np.pi * np.linspace(0, 1, len(n))) ** 2
    return n / (np.abs(n).max() + 1e-9) * e * 0.35 + sweep(260, 120, d) * e * 0.08
def pop(**_): x = sweep(560, 240, 0.11) * env(int(0.11 * SR), 0.002, 6); return lp(x, 3000) * 0.7
def plop(**_): x = sweep(700, 180, 0.14) * env(int(0.14 * SR), 0.002, 5); return lp(x, 2500) * 0.6
def gulp(**_):
    a = sweep(320, 140, 0.16) * env(int(0.16 * SR), 0.01, 4); b = sweep(240, 90, 0.2) * env(int(0.2 * SR), 0.01, 4)
    x = np.concatenate([a, np.zeros(int(0.04 * SR)), b]); return lp(x, 1800) * 0.8
def boing(**_):
    d = 0.42; t = tt(d); f = 200 * (1 + 0.6 * t / d) * (1 + 0.08 * np.sin(2 * np.pi * 18 * t))
    return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.004, 4), 2000) * 0.55
def bubbles(d=2.0, **_):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * 7)):
        st = rng.integers(0, max(1, len(x) - int(0.08 * SR))); f = rng.uniform(380, 900); b = sweep(f, f * 1.6, 0.06) * env(int(0.06 * SR), 0.003, 5)
        x[st:st + len(b)] += b * rng.uniform(0.2, 0.5)
    return lp(x, 2500) * 0.5
def sizzle(d=1.0, **_):
    n = bp(noise(d), 1800, 4500); crack = (rng.random(len(n)) < 0.002).astype(float); crack = lp(crack, 300) * 40
    e = np.minimum(1, np.linspace(0, 6, len(n))) * np.linspace(1, 0.2, len(n)); return n * (0.4 + crack) * e * 0.12
def sparkle(d=1.2, **_):
    notes = [784, 880, 1047, 1175, 1319, 1568]; x = np.zeros(int(d * SR) + SR // 2)
    for k, f in enumerate(notes):
        st = int(k * d / len(notes) * SR); n = int(0.4 * SR); t = tt(0.4)
        x[st:st + n] += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(n, 0.004, 6) * 0.22
    return lp(x, 4500)
def thud(**_):
    d = 0.35; t = tt(d); x = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * env(len(t), 0.002, 7)
    return x * 0.9 + lp(noise(d), 220) * env(len(t), 0.001, 12) * 0.3
def slam(**_):
    d = 0.5; t = tt(d); x = np.sin(2 * np.pi * (60 + 60 * np.exp(-t * 25)) * t) * env(len(t), 0.002, 6)
    return np.tanh(1.6 * (x + lp(noise(d), 1200) * env(len(t), 0.001, 10) * 0.6)) * 0.9
def tock(**_): d = 0.09; t = tt(d); return (np.sin(2 * np.pi * 420 * t) + 0.3 * np.sin(2 * np.pi * 840 * t)) * env(len(t), 0.001, 9) * 0.35
def zip_(**_):
    d = 0.32; n = bp(noise(d), 400, 3000); k = np.linspace(0, 1, len(n))
    return (n / (np.abs(n).max() + 1e-9) * 0.35 + sweep(300, 1100, d) * 0.12) * np.sin(np.pi * k) ** 1.2
def alarm(d=2.0, **_):
    x = np.zeros(int(d * SR)); one = np.sin(2 * np.pi * 150 * tt(0.22)) * env(int(0.22 * SR), 0.02, 5)
    for st in np.arange(0, d - 0.25, 0.5): i = int(st * SR); x[i:i + len(one)] += one
    return lp(x, 900) * 0.55

def inhale(d=1.0, **_):
    n = bp(noise(d), 300, 2600); k = np.linspace(0, 1, len(n)); e = np.sin(np.pi * np.minimum(1, k * 1.15)) ** 1.5 * (0.6 + 0.4 * k)
    return n / (np.abs(n).max() + 1e-9) * e * 0.5
def heartbeat(**_):
    one = lambda d, f: np.sin(2 * np.pi * f * tt(d)) * env(int(d * SR), 0.004, 7)
    x = np.concatenate([one(0.16, 58), np.zeros(int(0.09 * SR)), one(0.2, 52) * 0.75]); return lp(x, 300) * 1.0

# ---- explainer-family sounds (soft, short; no beeps above 5 kHz) ----
def swish(d=0.3, **_):
    n = bp(noise(d), 700, 3800); k = np.linspace(0, 1, len(n)); e = np.sin(np.pi * k) ** 2 * (0.35 + 0.65 * k)
    return n / (np.abs(n).max() + 1e-9) * e * 0.55 + sweep(500, 1500, d) * np.sin(np.pi * k) ** 2 * 0.06
def tick(**_): d = 0.07; t = tt(d); return (np.sin(2 * np.pi * 1500 * t) * 0.5 + np.sin(2 * np.pi * 900 * t) * 0.5) * env(len(t), 0.0008, 11) * 0.4
def stamp(**_):
    d = 0.4; t = tt(d); x = np.sin(2 * np.pi * (95 + 55 * np.exp(-t * 40)) * t) * env(len(t), 0.001, 8)
    return np.tanh(1.8 * (x + lp(noise(d), 1500) * env(len(t), 0.0008, 16) * 0.7)) * 0.85
def type_(d=1.0, **_):
    x = np.zeros(int(d * SR) + int(0.1 * SR)); k = 0.0
    while k < d - 0.05:
        c = bp(noise(0.03), 1200, 4200) * env(int(0.03 * SR), 0.0006, 14) * rng.uniform(0.5, 1.0); i = int(k * SR); x[i:i + len(c)] += c; k += rng.uniform(0.055, 0.12)
    return x
def ding(**_):
    d = 0.9; t = tt(d); x = (np.sin(2 * np.pi * 1175 * t) + 0.4 * np.sin(2 * np.pi * 1760 * t) + 0.15 * np.sin(2 * np.pi * 2349 * t)) * env(len(t), 0.002, 5)
    return lp(x, 4800) * 0.5
def count(d=0.9, **_):
    x = np.zeros(int(d * SR) + int(0.1 * SR)); k = 0.0; step = 0.11
    while k < d:
        c = tick() * (0.6 + 0.4 * k / d); i = int(k * SR); x[i:i + len(c)] += c; k += step; step = max(0.045, step * 0.93)
    return x

def riser(d=1.2, **_):
    """a rising noise + tone sweep that ends at its loudest: put it so it ENDS on the reveal word (the cue time is its start)"""
    t = tt(d); k = (t / d) ** 2.2; n = noise(d); x = bp(n, 300, 5200) * k * 0.5 + np.sin(2 * np.pi * (180 + 900 * (t / d) ** 2) * t) * k * 0.25
    return x / (np.abs(x).max() + 1e-9) * 0.6
def boom(**_):
    d = 1.1; t = tt(d); x = np.sin(2 * np.pi * (46 + 70 * np.exp(-t * 14)) * t) * env(len(t), 0.003, 3.2) + lp(noise(d), 300) * env(len(t), 0.001, 7) * 0.35
    return np.tanh(1.4 * x) * 0.9
def zap(d=0.45, **_):
    t = tt(d); x = np.sin(2 * np.pi * (2400 * np.exp(-t * 5) + 260) * t) * env(len(t), 0.001, 6) * 0.5 + hp(noise(d), 3000) * env(len(t), 0.001, 12) * 0.25
    return lp(x, 7000) * 0.7
def blip(**_): d = 0.1; t = tt(d); return (np.sin(2 * np.pi * 880 * t) + 0.25 * np.sin(2 * np.pi * 1320 * t)) * env(len(t), 0.001, 10) * 0.35

FX = dict(inhale=inhale, heartbeat=heartbeat, whoosh=whoosh, slide=slide, pop=pop, plop=plop, gulp=gulp, boing=boing, bubbles=bubbles, sizzle=sizzle,
          sparkle=sparkle, thud=thud, slam=slam, tock=tock, zip=zip_, alarm=alarm, swish=swish, tick=tick, stamp=stamp, type=type_, ding=ding, count=count, riser=riser, boom=boom, zap=zap, blip=blip)
LEVEL = dict(inhale=-15, heartbeat=-8, whoosh=-17, slide=-19, pop=-14, plop=-15, gulp=-11, boing=-15, bubbles=-21, sizzle=-18, sparkle=-17,
             thud=-11, slam=-9, tock=-18, zip=-14, alarm=-17, swish=-15, tick=-17, stamp=-9, type=-20, ding=-18, count=-20, riser=-19, boom=-10, zap=-17, blip=-19)


# ---------- the music bed: soft pad + plucked arpeggio, 100 BPM, I–vi–IV–V ----------
def music_bed():
    bpm = 100; beat = 60 / bpm; bar = beat * 4
    chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    x = np.zeros(N)
    nb = int(np.ceil(DUR / bar)) + 1
    for b in range(nb):
        ch = chords[b % 4]; st = int(b * bar * SR); n = int(bar * SR)
        if st >= N: break
        t = tt(bar); e = np.minimum(1, t / 0.4) * np.minimum(1, (bar - t) / 0.4)
        pad = sum(np.sin(2 * np.pi * f / 2 * t) + 0.25 * np.sin(2 * np.pi * f * t) for f in ch) * e * 0.10
        x[st:st + n] += pad[:max(0, min(n, N - st))]
        for k in range(8):                                                       # eighth-note pluck arpeggio
            f = ch[[0, 1, 2, 1, 2, 0, 1, 2][k]] * (2 if k % 4 == 2 else 1); ps = st + int(k * beat / 2 * SR); pn = int(0.5 * SR)
            if ps + pn >= N: continue
            pt = tt(0.5); pl = (np.sin(2 * np.pi * f * pt) + 0.35 * np.sin(4 * np.pi * f * pt)) * env(pn, 0.003, 7) * 0.12
            x[ps:ps + pn] += pl
    x = lp(x, 3200)
    fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade

def music_tension():
    """low drone + slow minor pulse, for mysterious / tense explainers (script.json "music": "tension")"""
    t = np.arange(N) / SR; x = np.zeros(N)
    for f, g in [(55, 0.5), (82.4, 0.3), (110, 0.2), (130.8, 0.12)]: x += np.sin(2 * np.pi * f * t + np.sin(t * 0.3) * 0.5) * g
    x *= 0.55 + 0.45 * np.sin(2 * np.pi * t / 8) ** 2
    beat = 60 / 84; ping = lambda f: (np.sin(2 * np.pi * f * tt(1.2)) + 0.3 * np.sin(4 * np.pi * f * tt(1.2))) * env(int(1.2 * SR), 0.01, 5)
    seq = [220.0, 261.6, 196.0, 174.6]
    for k in range(int(DUR / (beat * 2))):
        i = int(k * beat * 2 * SR); pg = ping(seq[(k // 2) % 4]) * 0.35
        if i + len(pg) < N: x[i:i + len(pg)] += pg
    x = lp(x, 2200); fade = np.ones(N); fo = int(1.5 * SR); fade[-fo:] = np.linspace(1, 0, fo); fi = int(0.8 * SR); fade[:fi] *= np.linspace(0, 1, fi)
    return x / (np.abs(x).max() + 1e-9) * fade

def music_upbeat():
    """editorial explainer bed: 112 BPM, soft pluck groove over a warm pad, light shaker. Quiet by design (it sits under the voice)."""
    bpm = 112; beat = 60 / bpm; bar = beat * 4; x = np.zeros(N)
    prog = [[220.0, 261.6, 329.6], [196.0, 246.9, 293.7], [174.6, 220.0, 261.6], [196.0, 246.9, 311.1]]; bass = [110.0, 98.0, 87.3, 98.0]
    for b in range(int(np.ceil(DUR / bar)) + 1):
        ch = prog[b % 4]; st = int(b * bar * SR)
        if st >= N: break
        n = int(bar * SR); t = tt(bar); e = np.minimum(1, t / 0.3) * np.minimum(1, (bar - t) / 0.3)
        seg_ = sum(np.sin(2 * np.pi * f * t) * 0.5 + np.sin(2 * np.pi * f / 2 * t) * 0.3 for f in ch) * e * 0.07
        x[st:st + n] += seg_[:max(0, min(n, N - st))]
        for k in range(8):                                                      # off-beat pluck pattern
            if k in (1, 3, 4, 6, 7):
                f = ch[[0, 1, 2, 1, 2, 0, 1, 2][k]] * 2; ps = st + int(k * beat / 2 * SR); pn = int(0.32 * SR)
                if ps + pn < N: pt = tt(0.32); x[ps:ps + pn] += (np.sin(2 * np.pi * f * pt) + 0.3 * np.sin(4 * np.pi * f * pt)) * env(pn, 0.002, 9) * 0.1
        for k in range(4):                                                      # soft bass on the beat
            ps = st + int(k * beat * SR); pn = int(0.4 * SR)
            if ps + pn < N and k % 2 == 0: pt = tt(0.4); x[ps:ps + pn] += np.sin(2 * np.pi * bass[b % 4] * pt) * env(pn, 0.004, 5) * 0.2
        for k in range(8):                                                      # shaker
            ps = st + int(k * beat / 2 * SR); pn = int(0.05 * SR)
            if ps + pn < N: x[ps:ps + pn] += bp(noise(0.05), 3500, 4900) * env(pn, 0.001, 12) * (0.05 if k % 2 else 0.03)
    x = lp(x, 4200); fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade

def load_audio(f):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(out, dtype=np.float32).reshape(-1, 2).astype(np.float64); return a


mix = np.zeros((N, 2)); music_stem = None; voice_stem = None; fx_stem = np.zeros((N, 2))
# voice
vf = P / 'data/narration.wav'
voice = None
if vf.exists():
    v = load_audio(vf)[:N]; voice = np.zeros((N, 2)); voice[:len(v)] = v
    rms = np.sqrt(np.mean(voice ** 2) + 1e-12); voice *= db(-19) / rms
    mix += voice; voice_stem = voice.copy()
# music
mus = script.get('music', 'bed')
if mus and mus != 'none':
    m = music_bed() if mus == 'bed' else music_tension() if mus == 'tension' else music_upbeat() if mus == 'upbeat' else None
    _gn = mus.replace('genre:', '').split('@')[0]
    if m is None and _gn in __import__('music_lab').G:   # a genre bed (lofi, phonk, trap, corporate, cinematic, synthwave, house), optionally 'phonk@140': built for THIS film's length, with a build and a drop
        _ml = __import__('music_lab'); m = _ml.make(_gn, DUR + 1.5, int(mus.split('@')[1]) if '@' in mus else None, script.get('musicKey', 'A'), script.get('musicArc'), int(script.get('musicSeed', 0)))[:N]; m = np.pad(m, (0, max(0, N - len(m)))); mus = 'bed'   # then treated like a built-in bed (no file carving needed)
    if m is None:
        a = load_audio(P / mus)[:N]; m = np.zeros(N); m[:len(a)] = a.mean(1); m /= np.abs(m).max() + 1e-9
        _fi, _fo = int(0.5 * SR), int(1.6 * SR); m[:_fi] *= np.linspace(0, 1, _fi); _end = min(N, len(a)); m[max(0, _end - _fo):_end] *= np.linspace(1, 0, min(_fo, _end))   # a file track fades in and out: it must never start or stop with a click
    # stereo: bass below 200 Hz stays centred, everything above is spread with a 9 ms delay on the right (earshot measured the mono mix as 'nearly mono')
    if mus not in ('bed', 'tension', 'upbeat'):   # a real music FILE: carve room for the voice (cut 2.2 kHz) and add body (low shelf at 100 Hz). earshot measured these as the usual faults of free tracks: honky mids and a thin bottom
        def _bq(x, kind, f0, g, q):
            A = 10 ** (g / 40); w0 = 2 * np.pi * f0 / SR; al = np.sin(w0) / (2 * q); c = np.cos(w0)
            if kind == 'peak': b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
            else: s_ = 2 * np.sqrt(A) * al; b = [A * ((A + 1) - (A - 1) * c + s_), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - s_)]; a = [(A + 1) + (A - 1) * c + s_, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - s_]
            return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)
        m = _bq(_bq(m, 'peak', 2200, -3.5, 0.9), 'low', 100, 2.5, 0.8); m = m / (np.abs(m).max() + 1e-9)
    lo_ = lp(m, 200); hi_ = m - lo_; m = np.stack([m, lo_ + np.roll(hi_, int(0.009 * SR))], 1) * db((-14 if voice is not None else -20) + float(script.get('musicDb', 0)))
    if voice is not None:                                                        # duck under the voice
        lev = np.abs(voice.mean(1)); lev = signal.lfilter([1 - 0.9995], [1, -0.9995], lev); lev /= lev.max() + 1e-9
        m *= (1 - 0.55 * np.clip(lev * 3, 0, 1))[:, None]
    mix += m; music_stem = m.copy()
# effects
for c in cj['cues']:
    if c['type'].startswith('file:'):   # a real recorded sound from the library (tools/audio/library.mjs): path relative to the project
        try: x = load_audio(P / c['type'][5:]).mean(1); x = x[:int(min(len(x), (c.get('dur') or 3.0) * SR))]; x = x / (np.abs(x).max() + 1e-9) * db(-14) * c.get('gain', 1.0); i = int(c['t'] * SR); n = min(len(x), N - i); mix[i:i + n, 0] += x[:n]; mix[i:i + n, 1] += x[:n]; fx_stem[i:i + n, 0] += x[:n]; fx_stem[i:i + n, 1] += x[:n]
        except Exception as e: print('sound file skipped:', c['type'], e)
        continue
    fn = FX.get(c['type'])
    if not fn: print('unknown cue type, skipped:', c['type']); continue
    x = fn(**({'d': c['dur']} if c.get('dur') else {}))
    x = lp(x, 5000) * db(LEVEL[c['type']]) * c.get('gain', 1.0) / (np.abs(x).max() + 1e-9) * 0.9
    if c['type'] in ('thud', 'slam', 'boom', 'stamp'): x = x + 0.45 * np.sin(2 * np.pi * 52 * np.arange(len(x)) / SR) * np.exp(-np.arange(len(x)) / SR / 0.16) * np.abs(x).max()   # a sub layer under impacts (no low end = thin)
    if c['type'] in ('whoosh', 'swish', 'zip', 'slide') and 'pan' not in c: _k = globals().get('_mv', 0); c['pan'] = (-0.35, 0.35)[_k % 2]; globals()['_mv'] = _k + 1   # moving sounds alternate sides
    i = int(c['t'] * SR); n = min(len(x), N - i)
    if n > 0 and i >= 0: pan = c.get('pan', 0.0); mix[i:i + n, 0] += x[:n] * (1 - max(0, pan)); mix[i:i + n, 1] += x[:n] * (1 + min(0, pan)); fx_stem[i:i + n, 0] += x[:n] * (1 - max(0, pan)); fx_stem[i:i + n, 1] += x[:n] * (1 + min(0, pan))
# measured BEFORE the master stage: does the music mask the voice, and would the sum have clipped?
def _rms_db(x, mask=None):
    y = x[mask] if mask is not None else x
    return float(20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-9)) if len(y) else None
_report = {'mode': 'voice+music' if (voice_stem is not None and music_stem is not None) else 'voice' if voice_stem is not None else 'music' if music_stem is not None else 'effects-only', 'cues': len(cj['cues']), 'pre_master_peak_db': float(20 * np.log10(np.abs(mix).max() + 1e-9)), 'pre_master_samples_over_0dbfs': int((np.abs(mix) > 1.0).sum())}
if voice_stem is not None:
    sp = np.abs(voice_stem.mean(1)) > 0.02                                   # frames where the narrator is speaking
    _report['voice_rms_db'] = _rms_db(voice_stem, sp)
    if music_stem is not None:
        _report['music_rms_db_during_speech'] = _rms_db(music_stem, sp); _report['music_under_voice_db'] = round(_report['voice_rms_db'] - _report['music_rms_db_during_speech'], 1)
    _report['fx_rms_db_during_speech'] = _rms_db(fx_stem, sp & (np.abs(fx_stem.mean(1)) > 1e-4)) if (np.abs(fx_stem).max() > 0) else None
# master: loud syllables used to hit the tanh soft-clipper (audible distortion). Turn the WHOLE mix down so the peak sits at 0.85, then the soft-clip stays in its linear range.
_pk = float(np.abs(mix).max()); _g = min(1.0, 0.85 / (_pk + 1e-9)); mix *= _g; _report['master_gain_db'] = round(float(20 * np.log10(_g)), 2)
json.dump(_report, open(P / 'data/mix-report.json', 'w'), indent=1)
# gentle soft-clip as a last safety net, peak -1 dBFS (final QA re-normalises loudness to the delivery target)
mix = np.tanh(mix * 1.2) / 1.2
mix *= db(-1) / (np.abs(mix).max() + 1e-9)
wavfile.write(P / 'data/mix.wav', SR, (mix * 32767).astype(np.int16))
print(f"data/mix.wav: {DUR:.2f} s · voice: {'yes' if voice is not None else 'NO (captions-only)'} · music: {mus} · {len(cj['cues'])} cues")
