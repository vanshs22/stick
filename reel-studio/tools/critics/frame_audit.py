"""Per-frame technical audit of still images (OpenCV). python frame_audit.py <png> [<png> ...]  -> JSON list."""
import os as _os, pathlib as _pl; _b = _pl.Path(__file__).resolve().parents[2] / '.bin'; _os.environ['PATH'] = (str(_b) + _os.pathsep + _os.environ['PATH']) if _b.exists() else _os.environ['PATH']  # installer's ffmpeg fallback
import json, sys
from pathlib import Path
import cv2, numpy as np
def boxes(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); h, w = g.shape; grad = cv2.morphologyEx(g, cv2.MORPH_GRADIENT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    _, bw = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU); bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (max(9, w // 22), 3))); out = []
    for c in cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        x, y, bw_, bh = cv2.boundingRect(c)
        if bw_ > w * 0.08 and 0.012 * h < bh < 0.12 * h and bw_ / max(1, bh) > 2.2 and cv2.contourArea(c) / (bw_ * bh) > 0.35: out.append([round(x / w, 3), round(y / h, 3), round(bw_ / w, 3), round(bh / h, 3)])
    return out
res = []
for f in sys.argv[1:]:
    img = cv2.imread(f)
    if img is None: res.append({'file': f, 'error': 'unreadable'}); continue
    img = cv2.resize(img, (540, int(540 * img.shape[0] / img.shape[1]))); g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); e = cv2.Canny(g, 80, 160); h, w = g.shape
    q = lambda a: float(a.mean())
    res.append({'file': Path(f).name, 'mean_luma': round(q(g) / 255, 3), 'contrast': round(float(g.std()) / 128, 3), 'saturation': round(q(hsv[..., 1]) / 255, 3), 'edge_density': round(float((e > 0).mean()), 4), 'clipped_highlights': round(q(g > 250), 4), 'crushed_blacks': round(q(g < 6), 4),
                'text_boxes': boxes(img), 'right_margin_ink': round(float((e[:, int(w * 0.89):] > 0).mean()), 4), 'top_strip_ink': round(float((e[:int(h * 0.04)] > 0).mean()), 4),
                'quadrant_luma': [round(float(g[:h // 2, :w // 2].mean() / 255), 2), round(float(g[:h // 2, w // 2:].mean() / 255), 2), round(float(g[h // 2:, :w // 2].mean() / 255), 2), round(float(g[h // 2:, w // 2:].mean() / 255), 2)]})
print(json.dumps(res))
