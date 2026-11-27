#!/usr/bin/env python3
"""Video -> style-dna.json (schemas/style-dna.schema.json). Measures, never invents: what could not be measured goes in "unmeasured".
  python3 tools/reference/dna.py <video> [--out dna.json] [--no-ocr]
Stages: shots (PySceneDetect) -> per-shot camera motion (OpenCV feature tracking) + framing (face height) -> captions (Tesseract OCR) ->
palette (k-means, LAB-free RGB) -> audio (ffmpeg ebur128, librosa tempo/onsets) -> beats (heuristic)."""
import hashlib, json, re, subprocess, sys
from pathlib import Path
import numpy as np
import cv2

A = sys.argv[1:]
if not A:
    sys.exit(__doc__)
SRC = Path(A[0]); OUT = Path(A[A.index('--out') + 1]) if '--out' in A else SRC.with_suffix('.dna.json'); OCR = '--no-ocr' not in A
unmeasured = []
hexc = lambda bgr: '#%02X%02X%02X' % (int(bgr[2]), int(bgr[1]), int(bgr[0]))

cap = cv2.VideoCapture(str(SRC)); fps = cap.get(cv2.CAP_PROP_FPS) or 30.0; nf = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); W = cap.get(cv2.CAP_PROP_FRAME_WIDTH); H = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
dur = nf / fps; r = W / H
aspect = '9:16' if r < 0.7 else '4:5' if r < 0.9 else '1:1' if r < 1.15 else '16:9'
src_hash = hashlib.sha256(SRC.read_bytes()).hexdigest()[:16]

def frame_at(t):
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read(); return f if ok else None

# ---- shots
from scenedetect import detect, ContentDetector
cuts = detect(str(SRC), ContentDetector(threshold=27.0, min_scene_len=int(fps * 0.4)))
bounds = [(a.get_seconds(), b.get_seconds()) for a, b in cuts] or [(0.0, dur)]
bounds[0] = (0.0, bounds[0][1]); bounds[-1] = (bounds[-1][0], dur)

# ---- camera motion per shot (feature tracking between frames 1/6 s apart)
def motion(t0, t1):
    ts = np.arange(t0 + 0.05, t1 - 0.05, 1 / 6)
    if len(ts) < 3: return 'static', 0.0, 0.2
    small = lambda f: cv2.cvtColor(cv2.resize(f, (320, int(320 * H / W))), cv2.COLOR_BGR2GRAY)
    prev = None; sc, tx, ty, rot, inl = [], [], [], [], []
    for t in ts:
        f = frame_at(t)
        if f is None: continue
        g = small(f)
        if prev is not None:
            p0 = cv2.goodFeaturesToTrack(prev, 120, 0.01, 8)
            if p0 is not None and len(p0) >= 8:
                p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, p0, None); ok = st.ravel() == 1
                if ok.sum() >= 8:
                    M, mask = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=2.0)
                    if M is not None:
                        s = float(np.hypot(M[0, 0], M[1, 0])); c0 = np.array([g.shape[1] / 2, g.shape[0] / 2]); d = M[:, :2] @ c0 + M[:, 2] - c0   # motion of the frame centre, so a zoom is not read as a pan
                        sc.append(np.log(max(s, 1e-3)) * 6); tx.append(d[0] / 320 * 6); ty.append(d[1] / 320 * 6); rot.append(np.degrees(np.arctan2(M[1, 0], M[0, 0])) * 6); inl.append(float(mask.mean()))
        prev = g
    if len(sc) < 2: return 'static', 0.0, 0.2
    zoom, pan, shake, roll = np.mean(sc), np.hypot(np.mean(tx), np.mean(ty)), np.std(tx) + np.std(ty), abs(np.mean(rot))
    mag = float(max(abs(zoom), pan, shake))
    conf = round(float(np.mean(inl)) * min(1.0, len(sc) / 4), 2)
    if shake > 0.15 and shake > 2 * pan: kind = 'busy'   # content motion (UI animation, jump crops) the camera cannot be separated from
    elif shake > 0.06 and shake > 2 * pan: kind = 'handheld'
    elif abs(zoom) >= 0.04 and abs(zoom) >= pan: kind = 'push' if zoom > 0 else 'pull'
    elif pan >= 0.06: kind = 'pan'
    elif roll >= 3: kind = 'dutch'
    else: kind = 'static'
    return kind, round(mag, 3), max(0.05, min(1.0, conf))

face = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml') if hasattr(cv2, 'CascadeClassifier') else None
if face is None: unmeasured.append('framing (this OpenCV build has no face detector: use a vision read)')
def framing(t0, t1):
    if face is None: return 'unknown'
    hs = []
    for t in np.linspace(t0 + 0.1, t1 - 0.1, 3):
        f = frame_at(t)
        if f is None: continue
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); fs = face.detectMultiScale(g, 1.2, 5, minSize=(int(H * 0.04), int(H * 0.04)))
        if len(fs): hs.append(max(h for (_, _, _, h) in fs) / H)
    if not hs: return 'no-face'
    h = float(np.median(hs)); return 'close-up' if h >= 0.22 else 'medium' if h >= 0.1 else 'wide'

shots = []
for t0, t1 in bounds:
    kind, mag, conf = motion(t0, t1)
    shots.append({'t0': round(t0, 2), 't1': round(t1, 2), 'framing': framing(t0, t1), 'move': kind, 'move_mag': mag, 'confidence': conf})
lens = np.array([s['t1'] - s['t0'] for s in shots]); cuts_per_10s = round(len(shots) / dur * 10, 2) if dur else 0
mix = {}
for s in shots: mix[s['move']] = mix.get(s['move'], 0) + 1
move_mix = {k: round(v / len(shots), 2) for k, v in sorted(mix.items(), key=lambda x: -x[1])}
camera = {'space': '2d_pan_zoom', 'move_mix': move_mix, 'shot_len': {'min': round(float(lens.min()), 2), 'median': round(float(np.median(lens)), 2), 'max': round(float(lens.max()), 2)}, 'never_static': bool(move_mix.get('static', 0) < 0.15)}
unmeasured += ['camera angle (needs a vision read)', 'camera versus content motion on animated or UI shots ("busy" means they cannot be told apart)', 'captions versus card text (OCR counts both)', 'whether the scene is 2D, 3D or a sprite in 3D (needs a vision read)']

# ---- captions (OCR on the lower 70 percent, 2 frames per second, at most 100 frames)
captions = {}
if OCR:
    try:
        import pytesseract
        boxes, words_per, cases, fills = [], [], [], []
        for t in np.arange(0.25, dur, max(0.5, dur / 60)):
            f = frame_at(t)
            if f is None: continue
            sc_ = 720 / W; img = cv2.resize(f, (720, int(H * sc_))); d = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT, config='--psm 11')
            ws = [(d['text'][i], d['left'][i], d['top'][i], d['width'][i], d['height'][i]) for i in range(len(d['text'])) if d['text'][i].strip() and float(d['conf'][i]) > 60 and len(d['text'][i].strip()) >= 2 and re.search('[A-Za-z]', d['text'][i])]
            if not ws: continue
            ys = [(y + h / 2) / img.shape[0] for _, _, y, _, h in ws]
            low = [w for w, y in zip(ws, ys) if y > 0.3]
            if not low: continue
            ymed = float(np.median([(w[2] + w[4] / 2) / img.shape[0] for w in low])); boxes.append(ymed); words_per.append(len(low))
            txt = ' '.join(w[0] for w in low); cases.append('upper' if txt.upper() == txt else 'lower' if txt.lower() == txt else 'sentence')
            x, y, w_, h_ = low[0][1:]; roi = img[max(0, y):y + h_, max(0, x):x + w_]
            if roi.size: k = cv2.kmeans(roi.reshape(-1, 3).astype(np.float32), 2, None, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0), 2, cv2.KMEANS_PP_CENTERS)[2]; fills.append(roi.reshape(-1, 3)[0:0] if False else k[0 if np.sum(k[0]) > np.sum(k[1]) else 1])
        if len(boxes) >= 5:
            captions = {'y_pct': round(float(np.median(boxes)) * 100), 'words_visible_median': int(np.median(words_per)), 'case': max(set(cases), key=cases.count), 'coverage': round(len(boxes) / max(1, len(np.arange(0.25, dur, max(0.5, dur / 60)))), 2), 'fill': hexc(np.median(np.array(fills), axis=0)) if fills else None}
        else: unmeasured.append('captions (too little text found by OCR; the video may have none)')
    except Exception as e:
        unmeasured.append(f'captions (OCR failed: {str(e)[:60]})')
else: unmeasured.append('captions (OCR skipped)')
unmeasured += ['caption font, stroke and animation (needs a vision read)']

# ---- palette
px = []
for t in np.linspace(0.2, max(0.3, dur - 0.2), 24):
    f = frame_at(t)
    if f is not None: px.append(cv2.resize(f, (48, 48)).reshape(-1, 3))
P = np.concatenate(px).astype(np.float32); K = 6
_, lab, cen = cv2.kmeans(P, K, None, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3, cv2.KMEANS_PP_CENTERS)
cnt = np.bincount(lab.ravel(), minlength=K); order = np.argsort(-cnt); cen = cen[order]
hsv = cv2.cvtColor(cen.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_BGR2HSV).reshape(-1, 3)
acc = cen[int(np.argmax(hsv[:, 1].astype(float) * (hsv[:, 2] > 90)))]
palette = {'dominant': [hexc(c) for c in cen[:5]], 'accent': hexc(acc), 'bg': hexc(cen[0])}

# ---- audio
def sh(cmd): return subprocess.run(cmd, capture_output=True, text=True)
audio = {'lufs': -70.0}
e = sh(['ffmpeg', '-nostats', '-i', str(SRC), '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
m = re.findall(r'I:\s+(-?[\d.]+) LUFS', e.stderr); l = re.findall(r'LRA:\s+([\d.]+) LU', e.stderr)
if m: audio['lufs'] = float(m[-1])
if l: audio['lra'] = float(l[-1])
wav = Path('/tmp') / f'dna-{src_hash}.wav'
if sh(['ffmpeg', '-y', '-i', str(SRC), '-vn', '-ac', '1', '-ar', '22050', str(wav)]).returncode == 0 and wav.exists():
    try:
        import librosa
        y, sr = librosa.load(str(wav), sr=22050); tempo, beats = librosa.beat.beat_track(y=y, sr=sr); tempo = float(np.atleast_1d(tempo)[0])
        if 50 <= tempo <= 220: audio['bpm'] = round(tempo, 1); audio['beat_grid'] = [round(float(b), 2) for b in librosa.frames_to_time(beats, sr=sr)][:200]
        on = librosa.onset.onset_detect(y=y, sr=sr, units='time', backtrack=False); audio['sfx_onsets'] = [round(float(x), 2) for x in on][:300]
    except Exception as ex: unmeasured.append(f'tempo and onsets (librosa failed: {str(ex)[:50]})')
    wav.unlink(missing_ok=True)
unmeasured += ['speech rate (needs a transcript)', 'music mood and whether it fits (needs ears)', 'what each sound effect is (needs ears)']

# ---- beats (heuristic by position)
hook = min(3.0, dur * 0.12); tail = max(hook, dur * 0.88); mid = max(1, round((tail - hook) / 8))
beats = [{'t0': 0.0, 't1': round(hook, 2), 'type': 'hook', 'tag': 'heuristic: first 12 percent'}] + [{'t0': round(hook + i * (tail - hook) / mid, 2), 't1': round(hook + (i + 1) * (tail - hook) / mid, 2), 'type': 'beat', 'tag': 'heuristic: equal split'} for i in range(mid)] + [{'t0': round(tail, 2), 't1': round(dur, 2), 'type': 'cta' if dur > 20 else 'payoff', 'tag': 'heuristic: last 12 percent'}]
unmeasured += ['story beats (split by position, not by meaning)']

dna = {'schema_version': 1, 'meta': {'src_hash': src_hash, 'duration_s': round(dur, 2), 'fps': round(fps, 2), 'aspect': aspect, 'n_shots': len(shots)}, 'structure': {'beats': beats}, 'shots': shots, 'camera': camera, 'captions': captions, 'palette': palette, 'motion': {'cuts_per_10s': cuts_per_10s, 'zoom_events': int(sum(1 for s in shots if s['move'] in ('push', 'pull')))}, 'audio': audio, 'cast_hint': {}, 'world_hint': {}, 'vlm': [], 'unmeasured': unmeasured}
OUT.write_text(json.dumps(dna, indent=1)); print(f"{OUT}: {len(shots)} shots ({cuts_per_10s}/10 s), median {camera['shot_len']['median']} s, moves {move_mix}, palette {palette['dominant'][:3]}, {audio['lufs']} LUFS, captions {captions.get('y_pct', 'none')}")
