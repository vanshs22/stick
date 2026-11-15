"""Measure a reference video into numbers a style preset can reuse (no AI, no credits).
usage: python analyze_style.py <video.mp4> [more.mp4 ...]   -> reference-analysis/styles/<name>.measure.json + <name>.sheet.jpg
"""
import json, math, subprocess, sys
from pathlib import Path
import cv2, numpy as np

OUT = Path(__file__).parent; OUT.mkdir(parents=True, exist_ok=True)
FFMPEG = "/projects/sandbox/ffmpeg-tools/node_modules/ffmpeg-static/ffmpeg"

def palette(frames, k=6):
    px = np.concatenate([cv2.resize(f, (48, 48)).reshape(-1, 3) for f in frames]).astype(np.float32)
    _, labels, centers = cv2.kmeans(px, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.5), 3, cv2.KMEANS_PP_CENTERS)
    share = np.bincount(labels.ravel(), minlength=k) / len(labels)
    order = np.argsort(-share)
    return [{"hex": "#%02X%02X%02X" % tuple(int(v) for v in centers[i][::-1]), "share": round(float(share[i]), 3)} for i in order]

def measure(path):
    cap = cv2.VideoCapture(str(path)); fps = cap.get(cv2.CAP_PROP_FPS) or 24; n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)); dur = n / fps
    step = max(1, int(fps // 6)); prev = None; diffs = []; cuts = []; keep = []; sat = []; val = []; edge = []; i = 0
    while True:
        ok, f = cap.read()
        if not ok: break
        if i % step == 0:
            g = cv2.cvtColor(cv2.resize(f, (108, 192)), cv2.COLOR_BGR2GRAY)
            if prev is not None:
                d = float(cv2.absdiff(g, prev).mean()); diffs.append(d)
                if d > 22 and (not cuts or i / fps - cuts[-1] > 0.3): cuts.append(round(i / fps, 2))
            prev = g
            hsv = cv2.cvtColor(cv2.resize(f, (96, 96)), cv2.COLOR_BGR2HSV); sat.append(hsv[..., 1].mean() / 255); val.append(hsv[..., 2].mean() / 255)
            edge.append(float((cv2.Canny(cv2.cvtColor(cv2.resize(f, (270, 480)), cv2.COLOR_BGR2GRAY), 80, 160) > 0).mean()))
            if len(keep) < 40 and i % (step * 6) == 0: keep.append(f)
        i += 1
    cap.release()
    d = np.array(diffs) if diffs else np.zeros(1)
    # contact sheet
    cap = cv2.VideoCapture(str(path)); thumbs = []
    for t in np.linspace(0.3, max(0.4, dur - 0.3), 24):
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read()
        if ok:
            s = 200 / f.shape[1]; th = cv2.resize(f, (200, int(f.shape[0] * s))); cv2.putText(th, f"{t:.1f}s", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, .6, (0, 255, 255), 2); thumbs.append(th)
    cap.release()
    cols = 6; rows = math.ceil(len(thumbs) / cols); ch = max(t.shape[0] for t in thumbs); sheet = np.zeros((rows * ch, cols * 200, 3), np.uint8)
    for j, th in enumerate(thumbs): y, x = divmod(j, cols); sheet[y * ch:y * ch + th.shape[0], x * 200:(x + 1) * 200] = th
    name = path.stem
    cv2.imwrite(str(OUT / f"{name}.sheet.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    # audio loudness + speech presence
    wav = OUT / f"{name}.wav"
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
    import soundfile as sf
    a, sr = sf.read(wav); wav.unlink(missing_ok=True)
    blk = sr // 10; rms = np.array([np.sqrt(np.mean(a[j:j + blk] ** 2)) for j in range(0, len(a) - blk, blk)]) if len(a) > blk else np.zeros(1)
    m = {"file": path.name, "size": [w, h], "aspect": "9:16" if h > w else "16:9" if w > h * 1.5 else "1:1", "fps": round(fps, 2), "duration": round(dur, 2),
         "cuts_per_10s": round(len(cuts) / dur * 10, 2), "cut_times": cuts, "motion_mean": round(float(d.mean()), 2), "motion_p90": round(float(np.quantile(d, .9)), 2),
         "saturation": round(float(np.mean(sat)), 3), "brightness": round(float(np.mean(val)), 3), "edge_density": round(float(np.mean(edge)), 4),
         "palette": palette(keep or [np.zeros((48, 48, 3), np.uint8)]), "audio_rms": round(float(rms.mean()), 4), "audio_active_share": round(float((rms > rms.max() * 0.08).mean()), 2)}
    (OUT / f"{name}.measure.json").write_text(json.dumps(m, indent=2) + "\n")
    return m

if __name__ == "__main__":
    for p in sys.argv[1:]:
        m = measure(Path(p)); print(json.dumps({k: m[k] for k in ("file", "size", "fps", "duration", "cuts_per_10s", "motion_mean", "saturation", "brightness", "edge_density", "audio_active_share")}), [c["hex"] for c in m["palette"][:5]])
