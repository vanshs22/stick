"""Narration for $0 on this computer: Kokoro-82M text-to-speech (Apache-2.0) via kokoro-onnx. No account, no API.

  scripts/py scripts/voice.py <project>          script.json -> data/narration.wav + data/lines.json (exact line times)
  scripts/py scripts/voice.py --list             voices that narrate well
  scripts/py scripts/voice.py --download         only fetch the model files (~340 MB, once)

script.json: { "voice": "am_michael", "speed": 1.05, "lead": 0.45, "outro": 0.9, "gap": 0.32,
               "lines": [ { "text": "What if you swallow gum?", "caps": "...", "gap": 0.3 }, ... ] }
One line = one CUT, not one sentence: a sentence can run across several lines ("It slides down your throat and lands
in your stomach," / "where acid gets to work on it."). Lines are grouped into whole sentences and each sentence is
spoken in ONE pass, so the intonation flows naturally; then every cut inside a sentence is found in the audio (snapped
to the nearest pause, else placed by length). "gap" (on a sentence's last line) = the pause after that sentence.
Write numbers the way they're SAID. Then run words.py for the word timings.
"""
import argparse, json, os, re, sys, urllib.request, zlib
from pathlib import Path
import numpy as np
from scipy.io import wavfile

HOME = Path(os.environ.get('REEL_HOME') or os.environ.get('FACELESS_HOME') or Path.home() / '.reel-studio')
KDIR = HOME / 'kokoro'
FILES = {
    'kokoro-v1.0.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
}
GOOD = {
    'am_michael': 'US male, steady explainer (default)', 'am_puck': 'US male, lively, playful', 'am_fenrir': 'US male, deeper',
    'am_onyx': 'US male, low', 'af_heart': 'US female, warm (best overall)', 'af_bella': 'US female, bright',
    'af_nicole': 'US female, soft and close', 'bm_george': 'UK male, documentary', 'bm_fable': 'UK male, storyteller',
    'bf_emma': 'UK female, calm',
}
SR = 24000
# Delivery presets. Kokoro has no emotion control, so emotion is prosody we CAN shape: speed, pitch, level, pauses, tremor, edge.
#            speed pitch gain  pause_before pause_after tremor drive
EMOTION = {
    'neutral':    (1.00, 1.00, 1.00, 0.00, 0.00, 0.00, 0.0),
    'happy':      (1.10, 1.04, 1.05, 0.00, 0.00, 0.00, 0.0),
    'excited':    (1.17, 1.06, 1.15, 0.00, 0.00, 0.00, 1.4),
    'sad':        (0.82, 0.95, 0.82, 0.15, 0.30, 0.00, 0.0),
    'fear':       (1.14, 1.06, 0.92, 0.00, 0.10, 0.07, 0.0),
    'shock':      (0.92, 1.05, 1.15, 0.28, 0.20, 0.00, 1.3),
    'anger':      (1.08, 0.96, 1.20, 0.00, 0.05, 0.00, 2.2),
    'calm':       (0.90, 0.98, 0.92, 0.00, 0.10, 0.00, 0.0),
    'sarcastic':  (0.90, 0.97, 1.00, 0.05, 0.15, 0.00, 0.0),
    'whisper':    (0.90, 1.00, 0.50, 0.05, 0.15, 0.00, 0.0),
    'determined': (0.95, 0.97, 1.08, 0.00, 0.10, 0.00, 1.2),
    'curious':    (1.06, 1.04, 1.00, 0.00, 0.05, 0.00, 0.0),
    'proud':      (0.91, 0.99, 1.08, 0.05, 0.12, 0.00, 0.0),
}


def deliver(x, emo):
    """level, tremor (a shaking voice) and edge (soft saturation for shouting) applied to one spoken sentence"""
    _, _, gain, _, _, tremor, drive = EMOTION[emo]
    if tremor: x = x * (1 - tremor + tremor * np.sin(2 * np.pi * 6.5 * np.arange(len(x)) / SR))
    if drive: x = np.tanh(drive * x / (np.abs(x).max() + 1e-9)) / np.tanh(drive) * np.abs(x).max()
    return x * gain


def ensure_models():
    KDIR.mkdir(parents=True, exist_ok=True)
    for name, url in FILES.items():
        p = KDIR / name
        if p.exists() and p.stat().st_size > 1_000_000: continue
        print(f'downloading {name} (once)...', flush=True)
        tmp = p.with_suffix('.part'); urllib.request.urlretrieve(url, tmp); tmp.rename(p)


def trim(x, thr=0.008):
    """cut leading/trailing silence so line start/end times are exact"""
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx): return x
    a = max(0, idx[0] - int(0.01 * SR)); b = min(len(x), idx[-1] + int(0.03 * SR)); return x[a:b]


def silences(x, thr=0.012, min_len=0.06):
    """pauses inside speech: [(start_s, end_s)] where the 10 ms RMS stays under thr for >= min_len"""
    hop = int(0.01 * SR); n = len(x) // hop
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1)); quiet = rms < thr * np.abs(x).max()
    out, st = [], None
    for f, q in enumerate(quiet):
        if q and st is None: st = f
        if (not q or f == n - 1) and st is not None:
            if (f - st) * 0.01 >= min_len: out.append((st * 0.01, f * 0.01))
            st = None
    return out


def chatterbox_main(P, S):
    """engine "chatterbox": one generation per script line (exact line times, no estimation), emotion -> exaggeration, optional reference voice (S['ref'], S['refs'][voice])"""
    import subprocess, sys as _s
    TKD = Path(__file__).resolve().parents[2]; py = TKD / ('.venv-voice/Scripts/python.exe' if os.name == 'nt' else '.venv-voice/bin/python')
    if not py.exists(): raise SystemExit('voice engine "chatterbox" needs its own environment: bash install.sh --with-voice2 (about 2.5 GB, once)')
    work = P / 'data/chatterbox'; work.mkdir(parents=True, exist_ok=True)
    jobs = {'ref': S.get('ref'), 'lines': [{'id': f'l{i:03d}', 'text': respell_text(ln['text'], S.get('pron', {})), 'emotion': ln.get('emotion', 'neutral'), 'ref': (S.get('refs') or {}).get(ln.get('voice'))} for i, ln in enumerate(S['lines'])]}
    (work / 'jobs.json').write_text(json.dumps(jobs))
    r = subprocess.run([str(py), str(Path(__file__).with_name('voice_chatterbox.py')), str(work / 'jobs.json'), str(work)], text=True)
    if r.returncode: raise SystemExit('chatterbox failed (see above)')
    from scipy.io import wavfile as _wf
    t = float(S.get('lead', 0.4)); out = [np.zeros(int(t * SR))]; lines = []
    for i, ln in enumerate(S['lines']):
        sr_, x = _wf.read(work / f'l{i:03d}.wav'); x = x.astype(np.float64) / (32768.0 if x.dtype == np.int16 else 1.0)
        if sr_ != SR:
            from scipy.signal import resample_poly; x = resample_poly(x, SR, sr_)
        x = trim(x); x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.1   # equal loudness line to line
        emo = ln.get('emotion', 'neutral'); pre = EMOTION.get(emo, EMOTION['neutral'])[3]; out.append(np.zeros(int(pre * SR))); t += pre
        lines.append({'i': i, 'text': ln['text'], 'start': round(t, 3), 'end': round(t + len(x) / SR, 3), **({'voice': ln['voice']} if ln.get('voice') else {}), **({'emotion': emo} if emo != 'neutral' else {})}); print(f'{i:2d} {lines[-1]["start"]:6.2f}-{lines[-1]["end"]:6.2f}  {ln["text"]}', flush=True)
        gap = np.zeros(int((float(ln.get('gap', S.get('gap', 0.3))) + EMOTION.get(emo, EMOTION['neutral'])[4]) * SR)); out += [x, gap]; t += (len(x) + len(gap)) / SR
    out.append(np.zeros(int(float(S.get('outro', 0.9)) * SR))); y = np.concatenate(out); y = y / (np.abs(y).max() + 1e-9) * 0.9
    (P / 'data').mkdir(exist_ok=True); wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
    (P / 'data/lines.json').write_text(json.dumps({'duration': round(len(y) / SR, 3), 'voice': 'chatterbox', 'speed': 1.0, 'lines': lines}, indent=1)); print(f'data/narration.wav ({len(y) / SR:.2f} s, chatterbox) + data/lines.json. Next: words.py')

def respell_text(text, pron):
    for w, r in pron.items(): text = re.sub(r'\b' + re.escape(w) + r'\b', r, text)
    return text

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project', nargs='?'); ap.add_argument('--list', action='store_true'); ap.add_argument('--download', action='store_true')
    ap.add_argument('--voice'); ap.add_argument('--speed', type=float)
    a = ap.parse_args()
    if a.list:
        for k, v in GOOD.items(): print(f'{k:12s} {v}')
        return
    if a.project and a.project != 'x' and (Path(a.project) / os.environ.get('TTS_SCRIPT', 'script.json')).exists() and json.loads((Path(a.project) / os.environ.get('TTS_SCRIPT', 'script.json')).read_text()).get('engine') == 'chatterbox':
        return chatterbox_main(Path(a.project), json.loads((Path(a.project) / os.environ.get('TTS_SCRIPT', 'script.json')).read_text()))
    ensure_models()
    if a.download: return
    if not a.project: ap.error('project folder missing')
    from kokoro_onnx import Kokoro
    P = Path(a.project); S = json.loads((P / os.environ.get('TTS_SCRIPT', 'script.json')).read_text())
    voice = a.voice or S.get('voice', 'am_michael'); speed = a.speed or S.get('speed', 1.0)
    k = Kokoro(str(KDIR / 'kokoro-v1.0.onnx'), str(KDIR / 'voices-v1.0.bin'))
    lang = 'en-gb' if voice.startswith('b') else 'en-us'
    pron = S.get('pron', {})   # spoken respelling only (e.g. {"GPU": "G P U"}); captions keep the real spelling
    def respell(text):
        for w, r in pron.items(): text = re.sub(r'\b' + re.escape(w) + r'\b', r, text)
        return text
    from scipy.signal import resample_poly
    def say(text, v=None, emo='neutral'):
        v = v or voice; sp, pitch = EMOTION[emo][0], EMOTION[emo][1]
        x = np.asarray(k.create(respell(text), voice=v, speed=min(2.0, max(0.5, speed * sp * (1 + ((zlib.crc32(text.encode()) % 13) - 6) * 0.006) / pitch)), lang='en-gb' if v.startswith('b') else 'en-us')[0], dtype=np.float64)
        if pitch != 1.0: x = resample_poly(x, 1000, int(round(1000 * pitch)))   # speak slower, then play faster: higher pitch at the same length (and the reverse)
        return deliver(trim(x), emo)
    # group the lines into whole sentences (a line ending in . ? ! closes one; "break": true forces a close). A new speaker or emotion always starts a new group.
    groups, cur = [], []
    key = lambda ln: (ln.get('voice'), ln.get('emotion', 'neutral'))
    for i, ln in enumerate(S['lines']):
        cur.append(i)
        last = i == len(S['lines']) - 1
        if re.search(r'[.?!]["\')]*$', ln['text'].strip()) or ln.get('break') or last or key(S['lines'][i + 1]) != key(ln): groups.append(cur); cur = []
    out = [np.zeros(int(S.get('lead', 0.4) * SR))]; t = len(out[0]) / SR; lines = [None] * len(S['lines'])
    for g in groups:
        gv, ge = S['lines'][g[0]].get('voice'), S['lines'][g[0]].get('emotion', 'neutral')
        if ge not in EMOTION: raise SystemExit(f'unknown emotion "{ge}". Known: {", ".join(EMOTION)}')
        pre = EMOTION[ge][3]; out.append(np.zeros(int(pre * SR))); t += pre
        x = say(' '.join(S['lines'][i]['text'] for i in g), gv, ge)
        cuts = [0.0]
        if len(g) > 1:                                    # find each cut inside the sentence
            lens = np.array([len(say(S['lines'][i]['text'], gv, ge)) for i in g], dtype=float)
            pauses = silences(x)
            for c in np.cumsum(lens)[:-1] / lens.sum() * len(x) / SR:
                near = [p for p in pauses if abs((p[0] + p[1]) / 2 - c) < 0.4]
                if near: p = min(near, key=lambda p: abs((p[0] + p[1]) / 2 - c)); cuts.append((p[0], p[1]))
                else: cuts.append((c, c))
        n = len(x) / SR
        for j, i in enumerate(g):
            a = 0.0 if j == 0 else cuts[j][1]; b = n if j == len(g) - 1 else cuts[j + 1][0]
            lines[i] = {'i': i, 'text': S['lines'][i]['text'], 'start': round(t + a, 3), 'end': round(t + b, 3), **({'voice': gv} if gv else {}), **({'emotion': ge} if ge != 'neutral' else {})}
            print(f'{i:2d} {lines[i]["start"]:6.2f}-{lines[i]["end"]:6.2f}  {S["lines"][i]["text"]}', flush=True)
        gap = np.zeros(int((float(S['lines'][g[-1]].get('gap', S.get('gap', 0.3))) + EMOTION[ge][4]) * SR))
        out += [x, gap]; t += (len(x) + len(gap)) / SR
    outro = np.zeros(int(float(S.get('outro', 0.9)) * SR)); out.append(outro)
    y = np.concatenate(out); y = y / (np.abs(y).max() + 1e-9) * 0.9
    (P / 'data').mkdir(exist_ok=True)
    wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
    dur = len(y) / SR
    (P / 'data/lines.json').write_text(json.dumps({'duration': round(dur, 3), 'voice': voice, 'speed': speed, 'lines': lines}, indent=1))
    print(f'data/narration.wav ({dur:.2f} s, {voice} x{speed}) + data/lines.json. Next: words.py')


if __name__ == '__main__':
    main()
