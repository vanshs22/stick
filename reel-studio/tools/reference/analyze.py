"""Reference analysis with OpenCV (+ FFmpeg for audio): measurements an agent cannot eyeball, plus a packet for the vision pass.

  python analyze.py <video|image> --out DIR [--fps 6]

Writes DIR/analysis.json, DIR/keyframes/shot_NN.jpg and DIR/contact_sheet.jpg.
Measured here: metadata, shot boundaries, shot lengths, per-shot camera motion (global optical flow: pan/tilt/zoom/orbit/static),
object motion, palette, brightness, saturation, edge density, face size where a real face exists, persistent text bands (caption zone,
text height), black and frozen stretches, audio loudness, silences, onsets (sound-effect-like transients), tempo, speech ratio.
NOT measured here (the agent must LOOK at contact_sheet.jpg and the key frames): shot size words, angles, character and environment design,
lighting, typography identity, transitions' meaning, storytelling. analysis.json has a `vision` block with status "pending" for that.
"""
import argparse, json, os, subprocess, sys
from pathlib import Path
import cv2, numpy as np

def pal(img, k=5):
    px = cv2.resize(img, (48, 48)).reshape(-1, 3).astype(np.float32); crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 12, 1.0)
    _, lab, cen = cv2.kmeans(px, k, None, crit, 3, cv2.KMEANS_PP_CENTERS); cnt = np.bincount(lab.flatten(), minlength=k); o = np.argsort(-cnt)
    return [{'hex': '#%02X%02X%02X' % (int(cen[i][2]), int(cen[i][1]), int(cen[i][0])), 'share': round(float(cnt[i] / cnt.sum()), 3)} for i in o]

def stats(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); e = cv2.Canny(g, 80, 160)
    return {'brightness': round(float(g.mean() / 255), 3), 'contrast': round(float(g.std() / 128), 3), 'saturation': round(float(hsv[..., 1].mean() / 255), 3), 'edge_density': round(float((e > 0).mean()), 4),
            'clipped_highlights': round(float((g > 250).mean()), 4), 'crushed_blacks': round(float((g < 6).mean()), 4)}

def text_boxes(img):
    """text-like regions: thin, wide clusters of strong horizontal gradients (captions, headlines, UI labels). Returns normalised boxes."""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); h, w = g.shape; grad = cv2.morphologyEx(g, cv2.MORPH_GRADIENT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    _, bw = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU); bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (max(9, w // 22), 3)))
    out = []
    for c in cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        x, y, bw_, bh = cv2.boundingRect(c)
        if bw_ > w * 0.12 and 0.012 * h < bh < 0.12 * h and bw_ / max(1, bh) > 2.2 and cv2.contourArea(c) / (bw_ * bh) > 0.35: out.append((x / w, y / h, bw_ / w, bh / h))
    return out

def faces(gray, scale=1.2, nb=5):
    """real-face boxes if this OpenCV build has the Haar cascade (OpenCV 5 removed it): returns None when unavailable, never guesses"""
    try: return list(cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml').detectMultiScale(gray, scale, nb))
    except Exception: return None

def flow_motion(a, b):
    fl = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 2, 15, 2, 5, 1.1, 0); h, w = a.shape; yy, xx = np.mgrid[0:h, 0:w]; cx, cy = w / 2, h / 2
    dx, dy = float(fl[..., 0].mean()), float(fl[..., 1].mean()); div = float(((xx - cx) * fl[..., 0] + (yy - cy) * fl[..., 1]).mean() / (w * h / 4)); curl = float(((xx - cx) * fl[..., 1] - (yy - cy) * fl[..., 0]).mean() / (w * h / 4))
    resid = float(np.hypot(fl[..., 0] - dx, fl[..., 1] - dy).mean()); return dx / w, dy / h, div, curl, resid / w

def label(dx, dy, div, curl):
    m = {'pan': abs(dx), 'tilt': abs(dy), 'zoom': abs(div) * 1.2, 'roll/orbit': abs(curl) * 1.2}; k = max(m, key=m.get)
    if m[k] < 0.0006: return 'static'
    return {'pan': 'pan ' + ('left' if dx > 0 else 'right'), 'tilt': 'tilt ' + ('up' if dy > 0 else 'down'), 'zoom': 'push in' if div > 0 else 'pull out', 'roll/orbit': 'orbit/roll'}[k]

def audio_stats(path, tmp):
    wav = tmp / 'a.wav'
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(path), '-vn', '-ac', '1', '-ar', '16000', str(wav)], capture_output=True, text=True)
    if r.returncode or not wav.exists() or wav.stat().st_size < 4000: return {'present': False, 'note': 'no audio stream (or ffmpeg missing)'}
    from scipy.io import wavfile
    sr, x = wavfile.read(wav); x = x.astype(np.float32) / 32768; n = len(x) / sr
    l = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    import re; I = re.findall(r'I:\s+(-?[\d.]+) LUFS', l); tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', l)
    hop = int(0.02 * sr); nf = len(x) // hop; fr = x[:nf * hop].reshape(nf, hop); rms = np.sqrt((fr ** 2).mean(1)) + 1e-9; sil = rms < 0.004
    spec = np.abs(np.fft.rfft(fr * np.hanning(hop), axis=1)); flux = np.maximum(0, np.diff(spec, axis=0)).sum(1); flux = flux / (flux.max() + 1e-9)
    thr = flux.mean() + 2.2 * flux.std(); on = [i for i in range(1, len(flux) - 1) if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]; on_t = [round((i + 1) * 0.02, 2) for i in on][:80]
    ac = np.correlate(flux - flux.mean(), flux - flux.mean(), 'full')[len(flux) - 1:]; lo, hi = int(0.3 / 0.02), int(1.0 / 0.02); lag = lo + int(np.argmax(ac[lo:hi])) if len(ac) > hi else None
    freqs = np.fft.rfftfreq(hop, 1 / sr); band = (freqs > 300) & (freqs < 3400); share = float(spec[:, band].sum() / (spec.sum() + 1e-9)); flat = float(np.exp(np.log(spec + 1e-9).mean(1)).mean() / (spec.mean(1).mean() + 1e-9))
    return {'present': True, 'duration': round(n, 2), 'loudness_lufs': float(I[-1]) if I else None, 'true_peak_db': float(tp[-1]) if tp else None, 'silence_ratio': round(float(sil.mean()), 3), 'onsets_per_10s': round(len(on) / n * 10, 1), 'onset_times': on_t, 'tempo_bpm_estimate': round(60 / (lag * 0.02)) if lag else None, 'speech_band_share': round(share, 3), 'spectral_flatness': round(flat, 3), 'heuristic': 'onsets/tempo/speech share are estimates, not transcription: listen or run faster-whisper for words'}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('--out', required=True); ap.add_argument('--fps', type=float, default=6); a = ap.parse_args()
    out = Path(a.out); (out / 'keyframes').mkdir(parents=True, exist_ok=True); src = Path(a.src); res = {'source': str(src), 'tool': 'opencv ' + cv2.__version__}
    img = cv2.imread(str(src)) if src.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp', '.bmp') else None
    if img is not None:
        h, w = img.shape[:2]; g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); gx = cv2.Sobel(g, cv2.CV_32F, 1, 0); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1); mag = np.hypot(gx, gy); ys, xs = np.mgrid[0:h, 0:w]; wgt = mag / (mag.sum() + 1e-9)
        res.update(kind='image', size=[w, h], aspect=round(w / h, 3), palette=pal(img), **stats(img), visual_centroid=[round(float((xs * wgt).sum() / w), 3), round(float((ys * wgt).sum() / h), 3)], text_like_boxes=[[round(v, 3) for v in b] for b in text_boxes(img)][:12],
                   faces=(None if (fc := faces(g)) is None else len(fc)))
        cv2.imwrite(str(out / 'keyframes/image.jpg'), cv2.resize(img, (540, int(540 * h / w))))
        res['vision'] = {'status': 'pending', 'look_at': [str(out / 'keyframes/image.jpg')]}
        (out / 'analysis.json').write_text(json.dumps(res, indent=1)); print(f'image analysed -> {out}/analysis.json'); return
    cap = cv2.VideoCapture(str(src)); fps = cap.get(cv2.CAP_PROP_FPS) or 30; nf = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)); dur = nf / fps
    if not nf: print('cannot read video', file=sys.stderr); sys.exit(1)
    step = max(1, int(round(fps / a.fps))); frames = []; i = 0
    while True:
        ok = cap.grab()
        if not ok: break
        if i % step == 0:
            ok, f = cap.retrieve()
            if ok: s = 320 / f.shape[1]; frames.append((i / fps, cv2.resize(f, None, fx=s, fy=s), cv2.resize(f, (540, int(540 * H / W)))))
        i += 1
    ts = [t for t, _, _ in frames]; small = [f for _, f, _ in frames]
    hist = [cv2.calcHist([cv2.cvtColor(f, cv2.COLOR_BGR2HSV)], [0, 1], None, [24, 16], [0, 180, 0, 256]) for f in small]; [cv2.normalize(h_, h_) for h_ in hist]
    d = np.array([cv2.compareHist(hist[k - 1], hist[k], cv2.HISTCMP_BHATTACHARYYA) for k in range(1, len(hist))]); thr = max(0.22, float(d.mean() + 2.2 * d.std())) if len(d) else 1
    pd = np.array([np.abs(small[k].astype(np.int16) - small[k - 1].astype(np.int16)).mean() for k in range(1, len(small))]); pthr = float(pd.mean() + 3.0 * pd.std()) if len(pd) else 1e9   # a cut moves BOTH the colour histogram and the pixels
    cuts = [0.0] + [round(ts[k + 1], 2) for k in range(len(d)) if (d[k] > thr and pd[k] > pd.mean() + 0.8 * pd.std()) or pd[k] > pthr * 1.6]; cuts = [c for j, c in enumerate(cuts) if j == 0 or c - cuts[j - 1] >= 0.3]
    bounds = cuts + [round(dur, 2)]; shots = []
    for si in range(len(cuts)):
        t0, t1 = bounds[si], bounds[si + 1]; idx = [k for k, t in enumerate(ts) if t0 <= t < t1] or [min(len(ts) - 1, int(t0 * a.fps))]; mid = idx[len(idx) // 2]
        g = [cv2.cvtColor(small[k], cv2.COLOR_BGR2GRAY) for k in idx]; mv = [flow_motion(cv2.resize(g[k], (160, 284)), cv2.resize(g[k + 1], (160, 284))) for k in range(len(g) - 1)] if len(g) > 1 else []
        m = np.mean(mv, axis=0) if mv else np.zeros(5); st = stats(frames[mid][1]); face = faces(cv2.cvtColor(small[mid], cv2.COLOR_BGR2GRAY), 1.2, 6) or []
        fh = round(float(max([f_[3] for f_ in face]) / small[mid].shape[0]), 3) if len(face) else None; cv2.imwrite(str(out / f'keyframes/shot_{si + 1:02d}.jpg'), frames[mid][2], [cv2.IMWRITE_JPEG_QUALITY, 85])
        shots.append({'n': si + 1, 'start': t0, 'end': t1, 'length': round(t1 - t0, 2), 'camera_motion': label(*m[:4]), 'motion': {'dx': round(float(m[0]), 4), 'dy': round(float(m[1]), 4), 'zoom': round(float(m[2]), 4), 'roll': round(float(m[3]), 4)}, 'object_motion': round(float(m[4]), 4), 'palette': pal(small[mid], 4), **st, 'face_height_ratio': fh, 'keyframe': f'keyframes/shot_{si + 1:02d}.jpg'})
    # persistent text bands: where does text-like content sit, how often, how tall
    heat = np.zeros(20); hs = []
    for k in range(0, len(small), 2):
        for (x, y, w_, h_) in text_boxes(small[k]): heat[min(19, int(y * 20)):min(20, int((y + h_) * 20) + 1)] += 1; hs.append(h_)
    heat = heat / max(1, (len(small) + 1) // 2); bands = [{'y_from': round(i / 20, 2), 'y_to': round((i + 1) / 20, 2), 'presence': round(float(heat[i]), 2)} for i in range(20) if heat[i] > 0.25]
    lum = np.array([cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).mean() for f in small]); dif = np.array([np.abs(small[k].astype(np.int16) - small[k - 1].astype(np.int16)).mean() for k in range(1, len(small))])
    def runs(mask, min_s):
        o, s0 = [], None
        for k, v in enumerate(list(mask) + [False]):
            if v and s0 is None: s0 = k
            if not v and s0 is not None:
                if (k - s0) / a.fps >= min_s: o.append([round(ts[s0], 2), round(ts[min(k, len(ts) - 1)], 2)])
                s0 = None
        return o
    lens = np.array([s['length'] for s in shots])
    res.update(kind='video', size=[W, H], aspect=round(W / H, 3), fps=round(fps, 2), duration=round(dur, 2), frames=nf, shots=shots, timing={'shots': len(shots), 'cuts_per_10s': round((len(shots) - 1) / dur * 10, 2), 'median_shot': round(float(np.median(lens)), 2), 'shortest': round(float(lens.min()), 2), 'longest': round(float(lens.max()), 2), 'shots_over_3s': int((lens > 3).sum())},
               camera={'static_share': round(sum(1 for s in shots if s['camera_motion'] == 'static') / len(shots), 2), 'moves': {k: sum(1 for s in shots if s['camera_motion'] == k) for k in sorted({s['camera_motion'] for s in shots})}},
               look={'palette': pal(np.mean([f for f in small[::max(1, len(small) // 40)]], axis=0).astype(np.uint8) if False else small[len(small) // 2], 6), 'brightness': round(float(lum.mean() / 255), 3), 'saturation': round(float(np.mean([s['saturation'] for s in shots])), 3), 'edge_density': round(float(np.mean([s['edge_density'] for s in shots])), 4)},
               text={'persistent_bands': bands, 'median_text_height_norm': round(float(np.median(hs)), 3) if hs else None, 'estimated_font_px_at_1920': round(float(np.median(hs)) * 1920 * 0.8) if hs else None, 'note': 'bands are where text-like shapes persist (captions, HUD, titles); identify the typeface by looking'},
               qa={'black_frames': runs(lum < 8, 0.2), 'frozen': runs(np.r_[False, dif < 0.15], 1.0)}, audio=audio_stats(src, out))
    cols = 8; th = [cv2.resize(f, (216, int(216 * H / W))) for _, _, f in [(t, 0, fr) for (t, _, fr) in frames[::max(1, int(len(frames) / 48))]]][:48]; tt = ts[::max(1, int(len(frames) / 48))][:48]
    for k, im in enumerate(th): cv2.putText(im, f'{tt[k]:.1f}s', (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 3); cv2.putText(im, f'{tt[k]:.1f}s', (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    rows = -(-len(th) // cols); sheet = np.zeros((rows * th[0].shape[0], cols * 216, 3), np.uint8)
    for k, im in enumerate(th): sheet[(k // cols) * im.shape[0]:(k // cols + 1) * im.shape[0], (k % cols) * 216:(k % cols + 1) * 216] = im
    cv2.imwrite(str(out / 'contact_sheet.jpg'), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    res['vision'] = {'status': 'pending', 'look_at': ['contact_sheet.jpg'] + [s['keyframe'] for s in shots[:24]], 'to_fill': ['shot_sizes', 'camera_angles', 'camera_movement_confirmed', 'character_design', 'environment', 'lighting', 'composition', 'typography', 'ui_overlays', 'transitions', 'animation', 'music_and_sfx', 'storytelling']}
    (out / 'analysis.json').write_text(json.dumps(res, indent=1)); print(f"{src.name}: {dur:.1f}s, {len(shots)} shots ({res['timing']['cuts_per_10s']} cuts/10s), camera static in {int(res['camera']['static_share'] * 100)}% of shots -> {out}/analysis.json")

main()
