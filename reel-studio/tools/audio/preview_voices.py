"""Voice previews: the same lines in several Kokoro voices/speeds, so the user can HEAR the choice.
  python preview_voices.py --out DIR --text "..." --voices am_michael,af_heart --speeds 1.0,1.1
Writes DIR/voice-<voice>-<speed>.wav and prints duration + what each voice is good for."""
import argparse, os, sys, re
from pathlib import Path
import numpy as np
from scipy.io import wavfile
sys.path.insert(0, str(Path(__file__).parent))
import voice as V

ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('--text', required=True); ap.add_argument('--voices', default='am_michael,af_heart,bm_george,af_bella'); ap.add_argument('--speeds', default='1.0'); ap.add_argument('--pron', default='')
a = ap.parse_args(); V.ensure_models()
from kokoro_onnx import Kokoro
k = Kokoro(str(V.KDIR / 'kokoro-v1.0.onnx'), str(V.KDIR / 'voices-v1.0.bin')); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
pron = dict(x.split('=', 1) for x in a.pron.split(';') if '=' in x)
text = a.text
for w, r in pron.items(): text = re.sub(r'\b' + re.escape(w) + r'\b', r, text)
for v in a.voices.split(','):
    for sp in a.speeds.split(','):
        x = V.trim(np.asarray(k.create(text, voice=v, speed=float(sp), lang='en-gb' if v.startswith('b') else 'en-us')[0], dtype=np.float64)); x = x / (np.abs(x).max() + 1e-9) * 0.9
        f = out / f'voice-{v}-{sp}.wav'; wavfile.write(f, V.SR, (x * 32767).astype(np.int16)); print(f'{f.name} {len(x) / V.SR:.2f}s  {V.GOOD.get(v, "")}')
