#!/usr/bin/env python3
"""Cut the pose thumbnails of a character sheet into transparent PNGs.
  python3 tools/characters_extract.py <sheet.webp|png> [--out remotion-template/public/characters]
The sheet is 2 rows (x on top, y below) of 7 poses: neutral talking explaining pointing thinking surprised approval. The light panel and the pale blob
behind each pose are removed by flood fill from the border (the dark outline of the character stops it); poses are upscaled 2x (Lanczos) for crisp edges.
Ask for higher resolution sheets if a pose will be shown large: the files in public/characters/<name>/ can simply be replaced."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

A = sys.argv[1:]
if not A: sys.exit(__doc__)
SRC = Path(A[0]); OUT = Path(A[A.index('--out') + 1]) if '--out' in A else Path(__file__).resolve().parent.parent / 'remotion-template/public/characters'
POSES = ['neutral', 'talking', 'explaining', 'pointing', 'thinking', 'surprised', 'approval']
CX = [120, 320, 532, 720, 910, 1093, 1283]; HALF = [100, 100, 108, 100, 100, 100, 100]
ROWS = {'x': (522, 669), 'y': (706, 851)}
im = Image.open(SRC).convert('RGB')
for name, (y0, y1) in ROWS.items():
    d = OUT / name; d.mkdir(parents=True, exist_ok=True)
    for pose, cx, hw in zip(POSES, CX, HALF):
        c = im.crop((cx - hw, y0, cx + hw, y1)); a = np.array(c).astype(int)
        a = np.concatenate([a, np.zeros((2, a.shape[1], 3), int)], axis=0)   # a dark pad under the cut edge so the white shirt is not flooded through the bottom
        light = a.min(axis=2) > 188
        lab, n = ndi.label(light); border = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(border))
        fg = ~bg; lab2, n2 = ndi.label(fg); areas = ndi.sum(fg, lab2, range(1, n2 + 1)); main = areas.max() if n2 else 1
        for i, sl in enumerate(ndi.find_objects(lab2), 1):   # drop scraps of the neighbouring panel (thin strips, bits on the left, right or top edge); keep the yellow emphasis strokes
            h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start; edge = sl[1].start == 0 or sl[1].stop == fg.shape[1] or sl[0].start == 0
            yellow = (a[..., 0][lab2 == i].mean() > 200 and a[..., 2][lab2 == i].mean() < 120)
            if not yellow and (h < 8 or (edge and areas[i - 1] < 0.15 * main)): fg[lab2 == i] = False
        fg = fg[:-2]   # remove the dark pad
        alpha = Image.fromarray((fg * 255).astype('uint8')).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
        rgba = c.convert('RGBA'); rgba.putalpha(alpha)
        big = rgba.resize((rgba.width * 2, rgba.height * 2), Image.LANCZOS)
        bbox = big.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        if bbox: big = big.crop((max(0, bbox[0] - 6), max(0, bbox[1] - 6), min(big.width, bbox[2] + 6), big.height))
        big.save(d / f'{pose}.png', optimize=True)
        print(f'{name}/{pose}.png {big.size}')
