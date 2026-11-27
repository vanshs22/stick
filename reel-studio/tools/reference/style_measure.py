"""Measure the LOOK of one or more frames: what a person would call lighting, depth of field, colour grade, framing. Numbers only; the agent still has to LOOK.
  python style_measure.py out.json frame1.jpg [frame2.jpg ...]
Per frame and as a median across frames: palette roles, warm/cool balance, split-tone, contrast, vignette, background blur (depth of field), grain, key-light side,
face framing (OpenCV Haar: works on photos and many stylised faces, may find nothing on a cartoon: then it says so), skin and hair colour when a face is found.
"""
import json, sys
import cv2
import numpy as np


def hexof(bgr):
    b, g, r = [int(round(float(v))) for v in bgr]
    return '#%02X%02X%02X' % (r, g, b)


def palette(img, k=6):
    small = cv2.resize(img, (96, 96), interpolation=cv2.INTER_AREA).reshape(-1, 3).astype(np.float32)
    _, lab, cen = cv2.kmeans(small, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 12, 1.0), 3, cv2.KMEANS_PP_CENTERS)
    share = np.bincount(lab.ravel(), minlength=k) / len(lab)
    out = []
    for i in np.argsort(-share):
        hsv = cv2.cvtColor(np.uint8([[cen[i]]]), cv2.COLOR_BGR2HSV)[0, 0]
        out.append({'hex': hexof(cen[i]), 'share': round(float(share[i]), 3), 'hue': int(hsv[0]) * 2, 'sat': round(float(hsv[1]) / 255, 2), 'val': round(float(hsv[2]) / 255, 2)})
    return out


def roles(pal):
    dom = pal[0]
    acc = max(pal, key=lambda p: p['sat'] * (0.4 + p['val']) * (1.0 if p['share'] > 0.01 else 0.3))
    dark = min(pal, key=lambda p: p['val']); light = max(pal, key=lambda p: p['val'])
    return {'dominant': dom['hex'], 'accent': acc['hex'], 'darkest': dark['hex'], 'lightest': light['hex']}


def sharp(g):
    return float(cv2.Laplacian(g, cv2.CV_64F).var())


def measure(path):
    img = cv2.imread(path)
    if img is None:
        return None
    h, w = img.shape[:2]
    if max(h, w) > 1400:
        s = 1400 / max(h, w); img = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA); h, w = img.shape[:2]
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); L = g.astype(np.float32) / 255
    pal = palette(img)
    hue = hsv[..., 0].astype(np.float32) * 2; sat = hsv[..., 1] / 255.0; val = hsv[..., 2] / 255.0
    col = (sat > 0.18) & (val > 0.15); ncol = max(1, int(col.sum()))
    warm = float((((hue < 70) | (hue > 330)) & col).sum()) / ncol; cool = float(((hue > 170) & (hue < 290) & col).sum()) / ncol
    hi = L > np.percentile(L, 85); lo = L < np.percentile(L, 15)
    def tone(mask):
        m = img[mask].mean(0) if mask.any() else np.array([128, 128, 128]); hh = cv2.cvtColor(np.uint8([[m]]), cv2.COLOR_BGR2HSV)[0, 0]
        return {'hex': hexof(m), 'hue': int(hh[0]) * 2, 'sat': round(float(hh[1]) / 255, 2)}
    cx0, cx1, cy0, cy1 = int(w * .3), int(w * .7), int(h * .3), int(h * .7)
    center = float(L[cy0:cy1, cx0:cx1].mean()); corners = float(np.mean([L[:h // 6, :w // 6].mean(), L[:h // 6, -w // 6:].mean(), L[-h // 6:, :w // 6].mean(), L[-h // 6:, -w // 6:].mean()]))
    # depth of field: sharpness of the centre vs the outer ring (a blurred background = shallow DOF)
    sc = sharp(g[cy0:cy1, cx0:cx1]); ring = np.mean([sharp(g[:h // 4, :]), sharp(g[-h // 4:, :]), sharp(g[:, :w // 5]), sharp(g[:, -w // 5:])])
    # grain: noise in the flattest 10 percent of 16x16 blocks
    blocks = [g[y:y + 16, x:x + 16].astype(np.float32) for y in range(0, h - 16, 16) for x in range(0, w - 16, 16)]
    flat = sorted(blocks, key=lambda b: b.std())[:max(1, len(blocks) // 10)]; grain = float(np.mean([b.std() for b in flat]) / 255)
    left = float(L[:, :w // 2].mean()); right = float(L[:, w // 2:].mean()); top = float(L[:h // 2].mean()); bot = float(L[h // 2:].mean())
    out = {'size': [w, h], 'palette': pal, 'roles': roles(pal), 'brightness': round(float(L.mean()), 3), 'contrast_p5_p95': round(float(np.percentile(L, 95) - np.percentile(L, 5)), 3),
           'saturation': round(float(sat.mean()), 3), 'warm_share': round(warm, 3), 'cool_share': round(cool, 3), 'highlight_tone': tone(hi), 'shadow_tone': tone(lo),
           'vignette': round(max(0.0, (center - corners) / max(center, 1e-3)), 3), 'clipped_highlights': round(float((g > 250).mean()), 4), 'crushed_blacks': round(float((g < 8).mean()), 4),
           'centre_sharpness': round(sc, 1), 'edge_sharpness': round(float(ring), 1), 'background_blur_ratio': round(float(ring / max(sc, 1e-3)), 3), 'grain': round(grain, 4),
           'light_side': 'left' if left - right > 0.04 else 'right' if right - left > 0.04 else 'frontal/even', 'light_from_above': bool(top - bot > 0.04), 'left_right_diff': round(left - right, 3)}
    # faces (OpenCV Haar). A stylised or 3D face is often not found: that is reported, never guessed.
    faces = []
    if hasattr(cv2, 'CascadeClassifier'):   # OpenCV 5 dropped it: requirements pin opencv<5; without it the face is read by looking
        casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'); faces = casc.detectMultiScale(g, 1.1, 5, minSize=(max(40, w // 14), max(40, w // 14)))
    if len(faces):
        x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3]); share = fh / h
        out['face'] = {'found': True, 'count': int(len(faces)), 'height_share': round(float(share), 3), 'center': [round((x + fw / 2) / w, 3), round((y + fh / 2) / h, 3)],
                       'framing': 'extreme-close-up' if share > 0.55 else 'close-up' if share > 0.35 else 'medium-close-up' if share > 0.18 else 'medium' if share > 0.08 else 'wide'}
        sk = img[y + int(fh * .55):y + int(fh * .8), x + int(fw * .3):x + int(fw * .7)]; hr = img[max(0, y - int(fh * .25)):y + int(fh * .08), x + int(fw * .15):x + int(fw * .85)]
        if sk.size: out['face']['skin_hex'] = hexof(np.median(sk.reshape(-1, 3), 0))
        if hr.size: out['face']['hair_hex_guess'] = hexof(np.percentile(hr.reshape(-1, 3), 20, axis=0))
        fl = L[y:y + fh, x:x + fw // 2].mean(); fr = L[y:y + fh, x + fw // 2:x + fw].mean(); out['face']['key_side'] = 'left' if fl - fr > 0.03 else 'right' if fr - fl > 0.03 else 'frontal'
        out['face']['face_vs_background_luma'] = round(float(L[y:y + fh, x:x + fw].mean() - L.mean()), 3)
    else:
        out['face'] = {'found': False, 'note': 'no face found by the classifier (normal for stylised 3D or cartoon faces, or OpenCV 5 without Haar): read framing, skin and hair colour by LOOKING'}
    return out


def agg(frames):
    if len(frames) == 1:
        return frames[0]
    num = ['brightness', 'contrast_p5_p95', 'saturation', 'warm_share', 'cool_share', 'vignette', 'clipped_highlights', 'crushed_blacks', 'background_blur_ratio', 'grain']
    out = {k: round(float(np.median([f[k] for f in frames])), 4) for k in num}
    out['roles'] = frames[0]['roles']; out['palette'] = frames[0]['palette']; out['highlight_tone'] = frames[0]['highlight_tone']; out['shadow_tone'] = frames[0]['shadow_tone']
    sides = [f['light_side'] for f in frames]; out['light_side'] = max(set(sides), key=sides.count)
    ff = [f['face'] for f in frames if f['face'].get('found')]; out['face'] = ff[0] if ff else frames[0]['face']; out['frames_measured'] = len(frames)
    return out


if __name__ == '__main__':
    outp, files = sys.argv[1], sys.argv[2:]
    fr = [m for m in (measure(f) for f in files) if m]
    json.dump({'per_frame': fr, 'overall': agg(fr) if fr else None}, open(outp, 'w'), indent=1)
    print(f'measured {len(fr)} frame(s)')
