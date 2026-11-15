from pathlib import Path
import hashlib
import json
import math
import subprocess
import tempfile

import cv2
import numpy as np
import soundfile as sf

ROOT = Path(__file__).parent
OUT = ROOT / "reference-analysis"
OUT.mkdir(exist_ok=True)
FFMPEG = Path("/projects/sandbox/ffmpeg-tools/node_modules/ffmpeg-static/ffmpeg")

videos = sorted(ROOT.glob("*.mp4"))
seen = {}
unique = []
for path in videos:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest not in seen:
        seen[digest] = path.name
        unique.append((path, digest))


def annotated(frame, label, width=220):
    h, w = frame.shape[:2]
    scale = width / w
    out = cv2.resize(frame, (width, round(h * scale)), interpolation=cv2.INTER_AREA)
    cv2.rectangle(out, (0, 0), (width, 34), (0, 0, 0), -1)
    cv2.putText(out, label, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 1, cv2.LINE_AA)
    return out

reports = []
for path, digest in unique:
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = count / fps
    samples = []
    previous = None
    diffs = []
    frame_index = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (96, 170), interpolation=cv2.INTER_AREA)
        if previous is not None:
            diffs.append((frame_index / fps, float(cv2.absdiff(small, previous).mean())))
        previous = small
        frame_index += 1
    cap.release()

    # Capture a readable half-second contact sheet.
    cap = cv2.VideoCapture(str(path))
    times = np.arange(0.25, duration, 0.5)
    for t in times:
        cap.set(cv2.CAP_PROP_POS_MSEC, float(t * 1000))
        ok, frame = cap.read()
        if ok:
            samples.append(annotated(frame, f"{t:05.2f}s"))
    cap.release()
    if samples:
        cols = 8
        rows = math.ceil(len(samples) / cols)
        cell_h = max(x.shape[0] for x in samples)
        cell_w = max(x.shape[1] for x in samples)
        sheet = np.zeros((rows * cell_h, cols * cell_w, 3), dtype=np.uint8)
        for i, img in enumerate(samples):
            y, x = divmod(i, cols)
            sheet[y * cell_h:y * cell_h + img.shape[0], x * cell_w:x * cell_w + img.shape[1]] = img
        safe = ''.join(c if c.isalnum() else '_' for c in path.stem)[:70]
        cv2.imwrite(str(OUT / f"{safe}-contact.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])

    dvals = np.array([d for _, d in diffs], dtype=float)
    threshold = max(7.0, float(np.quantile(dvals, 0.985)) if len(dvals) else 7.0)
    cuts = []
    for i in range(1, len(diffs) - 1):
        t, value = diffs[i]
        if value >= threshold and value >= diffs[i - 1][1] and value >= diffs[i + 1][1]:
            if not cuts or t - cuts[-1] > 0.25:
                cuts.append(round(t, 3))

    wav = OUT / f"{path.stem}.wav"
    subprocess.run([str(FFMPEG), "-y", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
    audio, sr = sf.read(wav)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    block = max(1, round(sr * 0.1))
    rms = np.array([np.sqrt(np.mean(np.square(audio[i:i + block]))) for i in range(0, len(audio), block)])
    peaks = np.argsort(rms)[-min(12, len(rms)):][::-1]
    report = {
        "file": path.name,
        "sha256": digest,
        "width": int(cv2.VideoCapture(str(path)).get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cv2.VideoCapture(str(path)).get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "fps": round(float(fps), 3),
        "frames": count,
        "duration": round(duration, 3),
        "estimated_cuts": cuts,
        "motion_mean": round(float(dvals.mean()), 3),
        "motion_p50": round(float(np.quantile(dvals, 0.5)), 3),
        "motion_p95": round(float(np.quantile(dvals, 0.95)), 3),
        "audio_rms_mean": round(float(rms.mean()), 6),
        "audio_rms_p95": round(float(np.quantile(rms, 0.95)), 6),
        "audio_peak_times": [round(float(x * 0.1), 2) for x in peaks],
        "contact_sheet": str(next(OUT.glob(f"{''.join(c if c.isalnum() else '_' for c in path.stem)[:70]}-contact.jpg"), "")),
    }
    reports.append(report)
    wav.unlink(missing_ok=True)

(OUT / "report.json").write_text(json.dumps({"unique_videos": len(unique), "duplicates_removed": len(videos) - len(unique), "videos": reports}, indent=2) + "\n")
print(json.dumps({"unique_videos": len(unique), "duplicates_removed": len(videos) - len(unique), "reports": len(reports), "output": str(OUT)}, indent=2))
