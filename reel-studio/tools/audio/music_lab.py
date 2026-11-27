#!/usr/bin/env python
"""Genre music beds for short-form and long-form films, written in code: real drum synthesis, bass, chords, plucks, reverb, side-chain ducking and an arc (intro, build, drop, outro).
   python tools/audio/music_lab.py <genre> <seconds> <out.wav> [--bpm N] [--key A] [--arc 0.3,0.6,1,1,0.8] [--seed N]       genres: lofi phonk trap corporate cinematic synthwave house
   from music_lab import make          make(genre, seconds, bpm=None, key='A', arc=None, seed=0) -> float array, mono, 44100 Hz, peak 0.9
What it is: a good, relevant, royalty-free bed that fits the field and the film's tempo and energy (take the bpm from a reference scan or a trend profile). What it is not: a human composer. For a hit track
use a licensed or CC0 track (tools/audio/library.mjs) and let mix.py carve room for the voice. Measured by tools/selftest_music.mjs (tempo error, beat strength, spectrum balance, no clipping)."""
import sys
import numpy as np
from scipy import signal

SR = 44100
G = {  # bpm range, scale, chord loop (scale degrees), swing, drum pattern per 16 steps (k=kick s=snare h=hat o=open hat c=clap/cowbell), sub-bass style, lead style, pad level
    'lofi':      dict(bpm=(78, 92), scale='dorian', chords=[(1, 3, 5, 7), (4, 6, 8, 10), (2, 4, 6, 8), (5, 7, 9, 11)], swing=0.16, k='x..x....x..x..x.', s='....x.......x...', h='x.x.x.x.x.x.x.xx', bass='sine', lead='pluck', pad=0.5, crackle=0.02, lp=5200),
    'phonk':     dict(bpm=(130, 145), scale='minor', chords=[(1, 3, 5), (1, 3, 5), (6, 8, 10), (5, 7, 9)], swing=0.0, k='x..x..x...x..x..', s='....x.......x..x', h='x.xxx.xxx.xxx.xx', bass='808', lead='cowbell', pad=0.2, crackle=0.0, lp=9000),
    'trap':      dict(bpm=(138, 150), scale='minor', chords=[(1, 3, 5), (6, 8, 10), (4, 6, 8), (5, 7, 9)], swing=0.0, k='x.....x...x.....', s='........x.......', h='xxxxxxxxxxxxxxxx', bass='808', lead='bell', pad=0.25, crackle=0.0, lp=9500),
    'corporate': dict(bpm=(100, 118), scale='major', chords=[(1, 3, 5), (5, 7, 9), (6, 8, 10), (4, 6, 8)], swing=0.0, k='x...x...x...x...', s='....x.......x...', h='..x...x...x...x.', bass='sine', lead='pluck', pad=0.55, crackle=0.0, lp=11000),
    'cinematic': dict(bpm=(60, 80), scale='minor', chords=[(1, 5, 8), (6, 8, 10), (4, 6, 8), (5, 7, 9)], swing=0.0, k='x...............', s='................', h='................', bass='drone', lead='bell', pad=0.9, crackle=0.0, lp=9000),
    'synthwave': dict(bpm=(100, 118), scale='minor', chords=[(1, 3, 5), (6, 8, 10), (3, 5, 7), (7, 9, 11)], swing=0.0, k='x...x...x...x...', s='....x.......x...', h='x.x.x.x.x.x.x.x.', bass='saw', lead='arp', pad=0.6, crackle=0.0, lp=10000),
    'house':     dict(bpm=(120, 128), scale='minor', chords=[(1, 3, 5, 7), (4, 6, 8, 10), (6, 8, 10, 12), (5, 7, 9, 11)], swing=0.04, k='x...x...x...x...', s='....c.......c...', h='..o...o...o...o.', bass='saw', lead='pluck', pad=0.4, crackle=0.0, lp=12000),
}
SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10]}
KEYS = {k: i for i, k in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}

def lp(x, f, o=2): b, a = signal.butter(o, min(f, SR / 2 - 200) / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def env(n, a=0.003, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def hz(root, deg, sc, octave=0):
    s = SCALES[sc]; i = deg - 1; return 440 * 2 ** ((KEYS[root] - 9 + s[i % 7] + 12 * (i // 7) + 12 * octave) / 12 + 0)
def kick(punch=1.0):
    n = int(0.32 * SR); t = np.arange(n) / SR; f = 45 + 110 * np.exp(-t / 0.035); ph = 2 * np.pi * np.cumsum(f) / SR; return (np.sin(ph) * np.exp(-t / 0.13) + 0.25 * punch * np.exp(-t / 0.004) * np.random.default_rng(1).standard_normal(n)) * 1.0
def snare():
    n = int(0.25 * SR); t = np.arange(n) / SR; r = np.random.default_rng(2); return (hp(r.standard_normal(n), 1500) * np.exp(-t / 0.07) * 0.8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.5)
def clap():
    n = int(0.22 * SR); t = np.arange(n) / SR; r = np.random.default_rng(3).standard_normal(n); e = sum(np.exp(-np.maximum(0, t - d) / 0.03) * (t >= d) for d in (0, 0.012, 0.026)) * 0.5 + np.exp(-t / 0.09) * 0.4; return hp(r, 900) * e
def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR); t = np.arange(n) / SR; return hp(np.random.default_rng(4).standard_normal(n), 7000) * np.exp(-t / (0.09 if open_ else 0.014)) * 0.5
def cowbell():
    n = int(0.3 * SR); t = np.arange(n) / SR; return (np.sign(np.sin(2 * np.pi * 562 * t)) + np.sign(np.sin(2 * np.pi * 845 * t))) * np.exp(-t / 0.08) * 0.18
def note(f, d, kind):
    n = int(d * SR); t = np.arange(n) / SR
    if kind == 'sine': return np.sin(2 * np.pi * f * t) * env(n, 0.01, d * 0.8)
    if kind == '808': fl = f * (1 + 0.25 * np.exp(-t / 0.05)); return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(fl) / SR)) * env(n, 0.004, d * 0.9) * 0.9
    if kind == 'saw': x = sum(signal.sawtooth(2 * np.pi * f * (1 + dt) * t) for dt in (-0.004, 0, 0.004)) / 3; return lp(x, 900 + 2500 * np.exp(-t / 0.15)[0] if False else 1400) * env(n, 0.006, d * 0.8)
    if kind == 'drone': return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.003 * t)) * np.minimum(1, t / 1.5) * 0.6
    if kind == 'pluck': x = signal.sawtooth(2 * np.pi * f * t) + 0.5 * signal.sawtooth(2 * np.pi * f * 1.004 * t); return lp(x, 2600) * env(n, 0.003, 0.22) * 0.5
    if kind == 'bell': return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t)) * env(n, 0.002, 0.6) * 0.4
    if kind == 'cowbell': return cowbell()
    if kind == 'arp': x = signal.square(2 * np.pi * f * t, 0.4) + 0.5 * signal.sawtooth(2 * np.pi * f * 1.006 * t); return lp(x, 3200) * env(n, 0.003, 0.14) * 0.3
    raise ValueError(kind)
def pad(freqs, d, a=0.4):
    n = int(d * SR); t = np.arange(n) / SR; x = sum(signal.sawtooth(2 * np.pi * f * (1 + dt) * t) for f in freqs for dt in (-0.005, 0.005)) / (2 * len(freqs)); return lp(x, 1800) * np.minimum(1, t / a) * np.minimum(1, (d - t) / 0.25)
def reverb(x, secs=1.3, mix=0.2):
    n = int(secs * SR); t = np.arange(n) / SR; ir = np.random.default_rng(5).standard_normal(n) * np.exp(-t / (secs / 4)); ir = lp(ir, 5500) / np.abs(ir).sum() * 40; return x * (1 - mix) + signal.fftconvolve(x, ir)[:len(x)] * mix

def make(genre, seconds, bpm=None, key='A', arc=None, seed=0):
    g = G[genre]; rng = np.random.default_rng(seed); bpm = bpm or int(np.mean(g['bpm'])); step = 60 / bpm / 4; bars = int(np.ceil(seconds / (step * 16))) + 1; N = int(seconds * SR); total = int(bars * 16 * step * SR) + SR * 2
    arc = arc or [0.35, 0.6, 1.0, 1.0, 0.85]; arcv = lambda b: float(np.interp(b / max(1, bars - 1), np.linspace(0, 1, len(arc)), arc))
    L = {k: np.zeros(total) for k in ('drums', 'bass', 'pad', 'lead', 'kickline')}
    def put(buf, x, t0, gain=1.0): i = int(t0 * SR); x = x[:max(0, total - i)]; buf[i:i + len(x)] += x * gain
    for b in range(bars):
        e = arcv(b); chord = g['chords'][(b // 1) % len(g['chords'])]; t_bar = b * 16 * step
        for s in range(16):
            sw = g['swing'] * step if s % 2 else 0; t = t_bar + s * step + sw; j = rng.uniform(-0.004, 0.004) if g['swing'] else 0
            if g['k'][s] == 'x' and e > 0.2: put(L['drums'], kick(), t + j, 0.9 * (0.6 + 0.4 * e)); put(L['kickline'], np.ones(int(0.22 * SR)), t)
            if g['s'][s] in 'xc' and e > 0.4: put(L['drums'], clap() if g['s'][s] == 'c' or genre in ('trap', 'house') else snare(), t + j, 0.7 * e)
            if g['h'][s] in 'xo' and e > 0.3: put(L['drums'], hat(g['h'][s] == 'o'), t + j, (0.45 if s % 4 == 0 else 0.3) * e * rng.uniform(0.8, 1.1))
        root = hz(key, chord[0], g['scale'], -2) if g['bass'] != 'drone' else hz(key, chord[0], g['scale'], -2)
        if g['bass'] in ('808', 'sine'): [put(L['bass'], note(root, step * (3 if g['bass'] == '808' else 2), g['bass']), t_bar + s * step, 0.8 * min(1, e + 0.2)) for s in range(16) if g['k'][s] == 'x']
        elif g['bass'] == 'saw': [put(L['bass'], note(root, step * 1.8, 'saw'), t_bar + s * step, 0.55 * min(1, e + 0.2)) for s in range(0, 16, 2)]
        else: put(L['bass'], note(root, step * 16, 'drone'), t_bar, 0.5)
        put(L['pad'], pad([hz(key, d, g['scale'], -1) for d in chord], step * 16 + 0.1), t_bar, g['pad'] * (0.5 + 0.5 * e))
        if g['lead'] in ('pluck', 'arp', 'bell', 'cowbell') and e > 0.5:
            pat = [0, 2, 4, 2] if g['lead'] == 'arp' else [0, 3, 5, 3, 7, 5]
            for n_, s in enumerate(range(0, 16, 2 if g['lead'] == 'arp' else 3)):
                if g['lead'] == 'cowbell' and s not in (0, 6, 12): continue
                f = hz(key, chord[pat[n_ % len(pat)] % len(chord)] + (7 if g['lead'] == 'arp' and n_ % 4 == 3 else 0), g['scale'], 0); put(L['lead'], note(f, 0.4, g['lead']), t_bar + s * step, 0.5 * e)
    duck = 1 - 0.55 * np.clip(lp(L['kickline'], 14, 1), 0, 1)   # side-chain: pad, bass and lead breathe around the kick
    mix = L["drums"] * 1.0 + (L["bass"] * 0.65 + L["pad"] * 0.8 + L["lead"] * 0.7) * duck
    if g['crackle']: mix += (rng.random(total) < 0.0009) * rng.standard_normal(total) * g['crackle'] * 4
    mix = reverb(lp(mix, g['lp']), 1.2, 0.16 + (0.2 if genre == 'cinematic' else 0)); mix = mix[:N]
    f = int(0.015 * SR); mix[:f] *= np.linspace(0, 1, f); o = int(1.2 * SR); mix[-o:] *= np.linspace(1, 0, o)
    mix = np.tanh(mix * 1.4) / np.tanh(1.4); return mix / (np.abs(mix).max() + 1e-9) * 0.9

if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]; opt = lambda k, d=None: sys.argv[sys.argv.index('--' + k) + 1] if '--' + k in sys.argv else d
    if len(a) < 3 or a[0] not in G: sys.exit(__doc__)
    from scipy.io import wavfile
    arc = [float(v) for v in opt('arc').split(',')] if opt('arc') else None
    x = make(a[0], float(a[1]), int(opt('bpm')) if opt('bpm') else None, opt('key', 'A'), arc, int(opt('seed', 0))); wavfile.write(a[2], SR, (x * 32767).astype(np.int16)); print(f'{a[2]}: {a[0]} {len(x) / SR:.1f} s')
