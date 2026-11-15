"""Prepare a face-cam clip for the facecam family (all local, no credits).
  python facecam_prep.py <project> <video> [--fps 30]
-> <project>/script.txt (Whisper transcript, one sentence per line, the director plans from it)
   <project>/data/src_audio.wav (the clip's own voice; words.py --audio turns it into narration.wav + word timings)
   <project>/data/face/00001.jpg ... (every frame, cropped to 1080x1920 cover) and data/face/meta.json {fps, frames}"""
import argparse, json, re, subprocess
from pathlib import Path

ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('video'); ap.add_argument('--fps', type=int, default=30); a = ap.parse_args()
P = Path(a.project); (P / 'data/face').mkdir(parents=True, exist_ok=True)
wav = P / 'data/src_audio.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vn', '-ac', '1', '-ar', '24000', str(wav)], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-an', '-vf', f'fps={a.fps},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-q:v', '3', str(P / 'data/face/%05d.jpg')], check=True)
n = len(list((P / 'data/face').glob('*.jpg'))); (P / 'data/face/meta.json').write_text(json.dumps({'fps': a.fps, 'frames': n}))
from faster_whisper import WhisperModel
import numpy as np
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(wav), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
segs, _ = WhisperModel('small.en', device='cpu', compute_type='int8').transcribe(np.frombuffer(raw, dtype=np.float32), vad_filter=False, beam_size=1)
text = ' '.join(s.text.strip() for s in segs)
text = re.sub(r'\s+', ' ', text).strip(); sentences = re.findall(r'[^.!?]+[.!?]+["\')]*|[^.!?]+$', text)
(P / 'script.txt').write_text('\n'.join(s.strip() for s in sentences if s.strip()) + '\n')
print(f'{n} frames @ {a.fps} fps, {len(sentences)} sentences -> script.txt')
