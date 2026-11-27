"""Is the picture SHARP where it must be? Fails exports where blur has eaten the props, the cards or the subject.
  python picture_quality.py <video.mp4> [--json out.json]

A film can have a deliberately soft background (depth of field, a blurred photo behind a card) and still be sharp where the viewer looks. What it must not have is a frame with
no crisp detail anywhere, or a centre that is mush. Per sampled frame (the long side reduced to 960 px, any aspect):
  detail_share   share of 24x24 blocks whose Laplacian variance shows real edges (text, outlines, texture)
  centre_share   the same, only in the central zone (x 12 to 88 percent, y 18 to 78 percent): where the subject, props and cards live
  mush           a frame whose centre_share is under the floor for its kind
Floors were set from the toolkit's own films (good) against the same films blurred (bad); see docs/STATUS.md.
"""
import json, sys
import cv2
import numpy as np

DETAIL_VAR = 14.0           # Laplacian variance of a block that shows real edges (after the 2x reduction)
FLOOR_CENTRE = 0.10         # a sampled frame is "mush" if less than 10 percent of its centre has crisp detail
FLOOR_FRAME = 0.07          # ... or less than 7 percent of the whole frame
MAX_MUSH_SHARE = 0.20       # more than 20 percent of sampled frames mush = the export fails


def frame_stats(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); h, w = g.shape; lap = cv2.Laplacian(g, cv2.CV_32F)
    bs = 24; ys, xs = h // bs, w // bs; v = np.zeros((ys, xs), np.float32)
    for j in range(ys):
        for i in range(xs): v[j, i] = lap[j * bs:(j + 1) * bs, i * bs:(i + 1) * bs].var()
    crisp = v > DETAIL_VAR; cx0, cx1, cy0, cy1 = int(xs * .12), int(xs * .88), int(ys * .18), int(ys * .78)
    return float(crisp.mean()), float(crisp[cy0:cy1, cx0:cx1].mean())


def measure(path, n=14):
    cap = cv2.VideoCapture(path); total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); out = []
    for k in range(n):
        idx = int((k + 0.5) * total / n); cap.set(cv2.CAP_PROP_POS_FRAMES, idx); ok, fr = cap.read()
        if not ok: continue
        k = 960 / max(fr.shape[:2]); fr = cv2.resize(fr, (round(fr.shape[1] * k), round(fr.shape[0] * k)), interpolation=cv2.INTER_AREA); a, c = frame_stats(fr)
        out.append({'t': round(idx / (cap.get(cv2.CAP_PROP_FPS) or 30), 2), 'detail_share': round(a, 3), 'centre_share': round(c, 3), 'mush': bool(c < FLOOR_CENTRE or a < FLOOR_FRAME)})
    cap.release(); mush = [f for f in out if f['mush']]
    return {'frames': out, 'mush_frames': len(mush), 'mush_share': round(len(mush) / max(1, len(out)), 2), 'median_centre_share': round(float(np.median([f['centre_share'] for f in out])), 3) if out else 0, 'pass': (len(mush) / max(1, len(out))) <= MAX_MUSH_SHARE, 'mush_at': [f['t'] for f in mush]}


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not a: print(__doc__); sys.exit(2)
    r = measure(a[0])
    if '--json' in sys.argv: json.dump(r, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1)
    print(f"picture {'OK' if r['pass'] else 'TOO SOFT'}: {r['mush_frames']} of {len(r['frames'])} sampled frames lack crisp detail (median centre detail {r['median_centre_share']})" + (f"; at {r['mush_at']} s" if r['mush_at'] else ''))
    sys.exit(0 if r['pass'] else 1)
