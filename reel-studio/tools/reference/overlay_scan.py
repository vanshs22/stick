#!/usr/bin/env python
"""Measure how a reference video uses OVERLAYS, CUTS, CAMERA and MUSIC, so the numbers (not impressions) drive our own design.
   python tools/reference/overlay_scan.py <video.mp4> [more.mp4 ...] [--out dir] [--step 0.2]
Writes <out>/<name>.scan.json per video and prints one summary line each. What it measures:
  overlays   flat text-bearing plates and text bands found per sample: count on screen, share of the frame they cover, vertical band (top / middle / bottom), appear and disappear events, how long each stays, how it enters (grows in place = pop, moves = slide)
  cuts       hard cuts by histogram jump: cuts per minute, shot lengths (median, p10, p90), the longest hold
  camera     per shot: still / drift / move from dense optical flow, and zoom direction (push or pull) from the flow's divergence
  music      tempo (onset autocorrelation), how many cuts land within 90 ms of a beat, loudness curve (rms per second), where the energy peaks
It does NOT read the words (no OCR) and does not judge taste: it tells you the rhythm and the geometry, which is what an imitation must beat."""
import json, os, subprocess, sys
import cv2, numpy as np

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = lambda k, d: sys.argv[sys.argv.index('--' + k) + 1] if '--' + k in sys.argv else d
STEP = float(opt('step', 0.2)); OUT = opt('out', 'review/reference-scan'); os.makedirs(OUT, exist_ok=True)
args = [a for a in args if a != OUT and a != opt('step', '')]

def boxes(g, W, H):
    """flat plates and text bands: strong local gradient (text) merged horizontally, plus flat bright or dark rectangles"""
    sx = cv2.Sobel(g, cv2.CV_16S, 1, 0); sy = cv2.Sobel(g, cv2.CV_16S, 0, 1); m = (cv2.convertScaleAbs(sx) + cv2.convertScaleAbs(sy)) > 90
    m = m.astype(np.uint8) * 255; m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (max(9, W // 18), max(3, H // 140))))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (max(5, W // 40), 2)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); out = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if w / max(1, h) >= 2.2 and 0.016 * H <= h <= 0.12 * H and w >= 0.10 * W and a / (w * h) > 0.18:
            crop = g[y:y + h, x:x + w]; hist = np.bincount((crop // 16).ravel(), minlength=16) / crop.size; dom = int(hist.argmax()); far = hist[np.abs(np.arange(16) - dom) >= 5].sum()
            if hist[max(0, dom - 1):dom + 2].sum() >= 0.55 and far >= 0.04: out.append((x / W, y / H, w / W, h / H))   # a PLATE: one dominant tone with strongly contrasting marks (text) on it; textures and photos fail
    return out

def iou(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1]); x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3]); i = max(0, x1 - x0) * max(0, y1 - y0)
    return i / (a[2] * a[3] + b[2] * b[3] - i + 1e-9)

def audio(path):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True)
    return np.frombuffer(p.stdout, dtype=np.float32), 16000

def tempo(x, sr):
    if len(x) < sr * 4: return None, []
    hop = 160; fr = np.lib.stride_tricks.sliding_window_view(x[:len(x) // hop * hop], 400)[::hop]; e = np.sqrt((fr ** 2).mean(axis=1)) if len(fr) else np.array([0.0])
    on = np.maximum(0, np.diff(np.log(e + 1e-5))); on = on - np.convolve(on, np.ones(20) / 20, mode='same'); on = np.maximum(on, 0)
    ac = np.correlate(on, on, 'full')[len(on) - 1:]; lo, hi = int(60 / 200 / (hop / sr)), int(60 / 60 / (hop / sr)); k = lo + int(np.argmax(ac[lo:hi])); bpm = 60 / (k * hop / sr)
    while bpm < 80: bpm *= 2
    while bpm > 170: bpm /= 2
    period = 60 / bpm; best = None
    for off in np.arange(0, period, 0.01):   # the beat grid phase that explains the most onset energy
        idx = (np.arange(off, len(on) * hop / sr, period) * sr / hop).astype(int); idx = idx[idx < len(on)]; sc = on[idx].sum()
        if best is None or sc > best[0]: best = (sc, off)
    return float(bpm), [float(t) for t in np.arange(best[1], len(x) / sr, period)]

for path in args:
    name = os.path.splitext(os.path.basename(path))[0][:40]; cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 30; N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); dur = N / fps
    W0, H0 = int(cap.get(3)), int(cap.get(4)); sc = 480 / W0; W, H = 480, int(H0 * sc); stepf = max(1, int(round(STEP * fps)))
    prev_g = prev_h = None; samples = []; cuts = []; flows = []; shot_flow = []; last_cut = 0.0
    for fi in range(0, N, stepf):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi); ok, f = cap.read()
        if not ok: break
        f = cv2.resize(f, (W, H)); g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); t = fi / fps; h = cv2.calcHist([cv2.cvtColor(f, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256]); h = cv2.normalize(h, h).flatten()
        cut = prev_h is not None and cv2.compareHist(prev_h.astype('float32'), h.astype('float32'), cv2.HISTCMP_BHATTACHARYYA) > 0.42
        if cut:
            cuts.append(round(t, 2)); shot_flow = []
        elif prev_g is not None:
            fl = cv2.calcOpticalFlowFarneback(prev_g, g, None, 0.5, 2, 15, 2, 5, 1.2, 0); mag = float(np.linalg.norm(fl, axis=2).mean()); yy, xx = np.mgrid[0:H, 0:W]; div = float((fl[..., 0] * (xx - W / 2) + fl[..., 1] * (yy - H / 2)).mean() / (W * H / 4) * 100); flows.append((t, mag, div))
        samples.append((t, boxes(g, W, H))); prev_g, prev_h = g, h
    # ---- overlays: track boxes between samples -> events with a start, an end and a way of entering
    tracks = []; active = []
    for t, bx in samples:
        nxt = []
        for b in bx:
            m = max(active, key=lambda a: iou(a['last'], b), default=None)
            if m and iou(m['last'], b) > 0.4 and m not in nxt: m['last'] = b; m['end'] = t; m['n'] += 1; nxt.append(m); continue
            a = {'start': t, 'end': t, 'first': b, 'last': b, 'n': 1}; tracks.append(a); nxt.append(a)
        active = nxt
    ev = [a for a in tracks if a['n'] >= 2]; band = lambda y: 'top' if y < 0.22 else 'bottom' if y > 0.62 else 'middle'
    cover = [sum(b[2] * b[3] for b in bx) for _, bx in samples]; cnt = [len(bx) for _, bx in samples]
    life = [a['end'] - a['start'] + STEP for a in ev]; bands = {k: sum(1 for a in ev if band(a['first'][1] + a['first'][3] / 2) == k) for k in ('top', 'middle', 'bottom')}
    # ---- cuts and shots
    edges = [0.0] + cuts + [dur]; shots = [b - a for a, b in zip(edges, edges[1:]) if b - a > 0.15]
    # ---- camera: per shot mean flow magnitude -> still / drift / move; divergence sign -> push / pull
    mags = np.array([m for _, m, _ in flows]) if flows else np.array([0.0]); divs = np.array([d for *_, d in flows]) if flows else np.array([0.0])
    cam = {'still_share': float((mags < 0.25).mean()), 'drift_share': float(((mags >= 0.25) & (mags < 1.2)).mean()), 'move_share': float((mags >= 1.2).mean()), 'push_share': float((divs > 0.05).mean()), 'pull_share': float((divs < -0.05).mean())}
    # ---- music and sync
    x, sr = audio(path); bpm, beats = tempo(x, sr) if len(x) else (None, []); rms = [float(np.sqrt((x[i * sr:(i + 1) * sr] ** 2).mean())) for i in range(int(len(x) / sr))] if len(x) else []
    sync = (sum(1 for c in cuts if beats and min(abs(c - b) for b in beats) < 0.09) / len(cuts)) if cuts and beats else None
    res = {'file': os.path.basename(path), 'duration': round(dur, 1), 'size': [W0, H0], 'fps': round(fps, 1),
           'overlays': {'avg_on_screen': round(float(np.mean(cnt)), 2), 'max_on_screen': int(max(cnt)), 'frame_cover_pct': round(float(np.mean(cover)) * 100, 1), 'events': len(ev), 'events_per_min': round(len(ev) / dur * 60, 1), 'life_median_s': round(float(np.median(life)), 2) if life else None, 'life_p10_p90_s': [round(float(np.percentile(life, 10)), 2), round(float(np.percentile(life, 90)), 2)] if life else None, 'band_events': bands, 'median_size_pct': {'w': round(float(np.median([a['first'][2] for a in ev])) * 100) if ev else None, 'h': round(float(np.median([a['first'][3] for a in ev])) * 100, 1) if ev else None}},
           'cuts': {'count': len(cuts), 'per_min': round(len(cuts) / dur * 60, 1), 'shot_median_s': round(float(np.median(shots)), 2), 'shot_p10_p90_s': [round(float(np.percentile(shots, 10)), 2), round(float(np.percentile(shots, 90)), 2)], 'longest_hold_s': round(max(shots), 1), 'times': cuts},
           'camera': {k: round(v, 2) for k, v in cam.items()}, 'music': {'bpm': round(bpm, 1) if bpm else None, 'cuts_on_beat_pct': round(sync * 100) if sync is not None else None, 'loudness_curve_rms_per_s': [round(v, 3) for v in rms[:90]]}}
    json.dump(res, open(os.path.join(OUT, name + '.scan.json'), 'w'), indent=1)
    o, c, m = res['overlays'], res['cuts'], res['music']
    print(f"{name[:22]:22s} {dur:5.1f}s  overlays {o['avg_on_screen']:.1f} on screen ({o['frame_cover_pct']}% of frame), {o['events_per_min']}/min, stay {o['life_median_s']}s, top/mid/bottom {bands['top']}/{bands['middle']}/{bands['bottom']} | cuts {c['per_min']}/min, shot median {c['shot_median_s']}s | camera still {cam['still_share']:.0%} drift {cam['drift_share']:.0%} move {cam['move_share']:.0%} push {cam['push_share']:.0%} | music {m['bpm']} bpm, {m['cuts_on_beat_pct']}% of cuts on a beat")
