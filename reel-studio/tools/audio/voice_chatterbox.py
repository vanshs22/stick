#!/usr/bin/env python
"""Chatterbox (MIT, Resemble AI): a free, local voice with REAL emotion control (exaggeration) and optional voice cloning from a short reference clip. CPU works (slow); a GPU is about 10x faster.
Runs in its own venv (.venv-voice) so torch never touches the Kokoro/vision environment. Used by tools/audio/voice.py when audio-plan.voice.engine is "chatterbox".
   .venv-voice/bin/python tools/audio/voice_chatterbox.py <jobs.json> <out_dir>
jobs.json: {"ref": "path/to/my-voice.wav" | null, "lines": [{"id": "g0", "text": "...", "emotion": "happy"}]}  -> <out_dir>/<id>.wav (24 kHz mono) and <out_dir>/report.json
Emotion -> (exaggeration, cfg_weight, temperature): exaggeration is how much the voice performs (0.25 flat .. 1.0 theatrical); a LOWER cfg_weight slows and loosens the delivery (good for sad, calm), a higher one tightens it.
Ideas that matter: a human reference clip of 6 to 15 s (your own voice, clean room, no music) makes the voice yours and removes the 'AI default' timbre; punctuation steers pacing; short sentences perform better than long ones."""
import json, os, sys, time
import numpy as np

EMO = {  # exaggeration, cfg_weight, temperature
    'neutral': (0.45, 0.5, 0.8), 'calm': (0.3, 0.6, 0.7), 'happy': (0.7, 0.4, 0.85), 'excited': (0.9, 0.3, 0.9), 'sad': (0.35, 0.7, 0.75), 'fear': (0.8, 0.3, 0.9),
    'shock': (0.9, 0.3, 0.9), 'anger': (0.85, 0.35, 0.85), 'sarcastic': (0.65, 0.45, 0.85), 'whisper': (0.25, 0.6, 0.7), 'determined': (0.6, 0.45, 0.8), 'curious': (0.6, 0.4, 0.85), 'proud': (0.6, 0.5, 0.8),
}
def main():
    jobs = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    import torch, torchaudio
    from chatterbox.tts import ChatterboxTTS
    dev = 'cuda' if torch.cuda.is_available() else 'mps' if getattr(torch.backends, 'mps', None) and torch.backends.mps.is_available() else 'cpu'
    t0 = time.time(); m = ChatterboxTTS.from_pretrained(device=dev); load = time.time() - t0; rep = {'device': dev, 'load_s': round(load, 1), 'sr': m.sr, 'lines': []}
    ref = jobs.get('ref') if jobs.get('ref') and os.path.exists(jobs['ref']) else None
    for ln in jobs['lines']:
        ex, cfg, temp = EMO.get(ln.get('emotion', 'neutral'), EMO['neutral']); t1 = time.time(); torch.manual_seed(int(ln.get('seed', 7)))
        w = m.generate(ln['text'], audio_prompt_path=ref, exaggeration=ex, cfg_weight=cfg, temperature=temp)
        x = w.squeeze(0).cpu().numpy() if hasattr(w, 'cpu') else np.asarray(w); import soundfile as sf
        sf.write(os.path.join(out, ln['id'] + '.wav'), x, m.sr); rep['lines'].append({'id': ln['id'], 'seconds_audio': round(len(x) / m.sr, 2), 'seconds_compute': round(time.time() - t1, 1), 'emotion': ln.get('emotion', 'neutral')}); print(ln['id'], rep['lines'][-1], flush=True)
    json.dump(rep, open(os.path.join(out, 'report.json'), 'w'), indent=1)
if __name__ == '__main__': main()
