"""Make a text-to-speech narration sound like a person in a room instead of a clean synthetic signal. Timing is NEVER changed (captions, anchors and cuts stay in sync).
  python voice_polish.py <project>          data/narration.wav -> polished data/narration.wav (the original is kept as data/narration.raw.wav)

Default steps (each one MEASURED with earshot's realness model on the same narration; the raw synthetic read scored 0.775):
  chain     high-pass 80 Hz, warmth +1.5 dB at 180 Hz, presence +2.5 dB at 3.2 kHz, air +1.5 dB at 10 kHz, a little saturation        -> 0.82
  emphasis  words the script marks as `emphasis` get +2.2 dB and +3 dB presence over their span (a person leans on the key word)       -> 0.81 with chain
Opt-in steps, OFF by default because the same measurement said they made it sound LESS real: compress (1.6:1), breath (a soft breath before a long line), room (a 0.2 s reflection).
  POLISH_STEPS=chain,emphasis,breath python voice_polish.py <project>
"""
import json, os, re, shutil, sys, zlib
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile


def biquad(kind, f0, gain_db, q, sr):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / sr; al = np.sin(w) / (2 * q); c = np.cos(w)
    if kind == 'peak': b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind == 'lowshelf': s = 2 * np.sqrt(A) * al; b = [A * ((A + 1) - (A - 1) * c + s), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - s)]; a = [(A + 1) + (A - 1) * c + s, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - s]
    else: s = 2 * np.sqrt(A) * al; b = [A * ((A + 1) + (A - 1) * c + s), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - s)]; a = [(A + 1) - (A - 1) * c + s, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - s]
    return np.array(b) / a[0], np.array(a) / a[0]


def chain(x, sr):
    hp = signal.butter(2, 80 / (sr / 2), 'high', output='sos'); x = signal.sosfilt(hp, x)
    for kind, f, g, q in [('peak', 180, 1.5, 0.8), ('peak', 3200, 2.5, 0.7), ('highshelf', 10000, 1.5, 0.7)]:
        b, a = biquad(kind, f, g, q, sr); x = signal.lfilter(b, a, x)
    return x


def compress(x, sr, thr_db=-24, ratio=1.6, atk=0.008, rel=0.09):
    env = np.abs(x); ca = np.exp(-1 / (atk * sr)); cr = np.exp(-1 / (rel * sr)); sm = np.zeros_like(env); e = 0.0
    for i, v in enumerate(env[::16]):   # envelope at 1/16 rate: fast enough for speech, cheap in numpy
        e = ca * e + (1 - ca) * v if v > e else cr * e + (1 - cr) * v; sm[i * 16:(i + 1) * 16] = e
    lv = 20 * np.log10(sm + 1e-9); over = np.maximum(lv - thr_db, 0); gain = 10 ** (-(over * (1 - 1 / ratio)) / 20)
    gain = signal.lfilter([0.02], [1, -0.98], gain)   # smooth
    return x * np.clip(gain, 0.25, 1.0)


def norm(w): return re.sub(r'[^a-z0-9]', '', w.lower())


def main(P):
    P = Path(P); wav = P / 'data/narration.wav'; raw = P / 'data/narration.raw.wav'
    if not wav.exists(): print('no data/narration.wav: nothing to polish'); return
    if raw.exists() is False: shutil.copy(wav, raw)
    sr, x = wavfile.read(raw); x = x.astype(np.float64) / 32768.0
    if x.ndim > 1: x = x.mean(1)
    peak0 = np.abs(x).max() + 1e-9; rms0 = np.sqrt(np.mean(x ** 2)) + 1e-9
    STEPS = set((os.environ.get('POLISH_STEPS') or 'chain,emphasis').split(','))   # measured with earshot's realness model on the same narration: chain 0.775 -> 0.82, chain+emphasis 0.81; adding compress 0.76, breath 0.78, room 0.75 each LOWERED it, so they are opt-in (POLISH_STEPS=chain,emphasis,breath)
    y = chain(x, sr) if 'chain' in STEPS else x.copy()
    # emphasis: boost the marked words (timings from Whisper words.json)
    W = json.loads((P / 'data/words.json').read_text()) if (P / 'data/words.json').exists() else None
    T = json.loads((P / 'data/tts.json').read_text()) if (P / 'data/tts.json').exists() else {'lines': []}
    words = W['words'] if isinstance(W, dict) and 'words' in W else (W or [])
    pres = np.zeros_like(y); b, a = biquad('peak', 3000, 5.0, 0.8, sr); bright = signal.lfilter(b, a, y)
    gain = np.ones_like(y); n_emph = 0
    emph = {i: {norm(e) for e in (ln.get('emphasis') or []) for e in e.split()} for i, ln in enumerate(T.get('lines', []))}
    for w in words:
        li = w.get('line'); t = norm(str(w.get('w', w.get('word', ''))))
        if 'emphasis' not in STEPS or li is None or t == '' or t not in emph.get(li, set()): continue
        s0, e0 = int(max(0, w.get('s', w.get('start', 0)) - 0.02) * sr), int(min(len(y), (w.get('e', w.get('end', 0)) + 0.04) * sr))
        if e0 - s0 < 200: continue
        env = np.ones(e0 - s0); r = min(int(0.03 * sr), (e0 - s0) // 2); env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
        gain[s0:e0] *= 1 + (10 ** (2.2 / 20) - 1) * env; pres[s0:e0] = env; n_emph += 1
    y = (y * (1 - pres * 0.6) + bright * pres * 0.6) * gain
    if 'compress' in STEPS: y = compress(y, sr)
    # breaths in the pause before a long line
    lines = json.loads((P / 'data/lines.json').read_text())['lines'] if (P / 'data/lines.json').exists() else []
    rng = np.random.RandomState(zlib.crc32(str(P.name).encode()) & 0xFFFF); nb = 0
    for k in range(1, len(lines)):
        gap = lines[k]['start'] - lines[k - 1]['end']
        if 'breath' in STEPS and gap >= 0.28 and len(lines[k]['text'].split()) >= 6:
            ln = int(rng.uniform(0.16, 0.22) * sr); br = signal.sosfilt(signal.butter(2, [450 / (sr / 2), 4200 / (sr / 2)], 'band', output='sos'), rng.randn(ln))
            env = np.minimum(1, np.arange(ln) / (0.045 * sr)) * np.exp(-np.arange(ln) / (0.09 * sr)); br = br * env; br *= (rms0 * 10 ** (-33 / 20)) / (np.sqrt(np.mean(br ** 2)) + 1e-9)
            i0 = int((lines[k]['start'] - 0.07) * sr) - ln
            if i0 > int(lines[k - 1]['end'] * sr): y[i0:i0 + ln] += br; nb += 1
    # a small room
    ir_n = int(0.2 * sr); ir = rng.randn(ir_n) * np.exp(-np.arange(ir_n) / (0.045 * sr)); ir = signal.sosfilt(signal.butter(2, 7000 / (sr / 2), 'low', output='sos'), ir); ir[0] = 0; ir /= np.abs(ir).sum() + 1e-9
    wet = signal.fftconvolve(y, ir)[:len(y)]
    if 'room' not in STEPS: wet = wet * 0
    y = y + 0.9 * wet * (np.sqrt(np.mean(y ** 2)) / (np.sqrt(np.mean(wet ** 2)) + 1e-9)) * 0.05 / 0.9
    y = np.tanh(1.1 * y) / 1.1 if 'chain' in STEPS else y
    y *= peak0 / (np.abs(y).max() + 1e-9); wavfile.write(wav, sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
    (P / 'data/.polished').write_text(f'{n_emph} emphasised words, {nb} breaths\n'); print('voice polished: steps ' + ','.join(sorted(STEPS)) + f', {n_emph} emphasised word(s), {nb} breath(s). Original kept as data/narration.raw.wav')


if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    main(sys.argv[1])
