"""Draft a new style preset from a measured reference video (no AI, no credits).
  python refs/new_style.py refs/<name>.measure.json my-style-id [--base cartoon-comedy] [--name "My Style"]
Writes styles/my-style-id.json: palette, pacing, saturation, vignette and aspect come from the measurements; character,
caption and camera blocks start from the base style. Open the file, tune the character/caption blocks by eye, then
`bash make.sh script.txt --style my-style-id`.
"""
import argparse, colorsys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(); ap.add_argument("measure"); ap.add_argument("id"); ap.add_argument("--base", default="cartoon-comedy"); ap.add_argument("--name")
a = ap.parse_args()
m = json.loads(Path(a.measure).read_text()); base = json.loads((ROOT / "styles" / f"{a.base}.json").read_text())
rgb = lambda h: tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
pal = sorted(m["palette"], key=lambda c: -c["share"]); cols = [c["hex"] for c in pal]
lum = lambda h: colorsys.rgb_to_hls(*rgb(h))[1]; sat = lambda h: colorsys.rgb_to_hls(*rgb(h))[2]
by_l = sorted(cols, key=lum); accent = max(cols, key=lambda h: sat(h) * (0.4 + lum(h)))
s = base
s["id"] = a.id; s["name"] = a.name or a.id.replace("-", " ").title(); s["refs"] = [m["file"]]; s["draft"] = True
s["description"] = f"Draft from {m['file']}: {m['aspect']}, {m['cuts_per_10s']} cuts/10s, saturation {m['saturation']}, brightness {m['brightness']}. Tune character/captions by eye."
s["sets"]["palette"] = {"sky": [by_l[-1], by_l[-2]], "wall": cols[1] if len(cols) > 1 else cols[0], "floor": by_l[1] if len(by_l) > 1 else by_l[0], "accent": accent}
s["sets"]["tod"] = "night" if m["brightness"] < 0.38 else "day"; s["sets"]["saturation"] = round(min(1.3, max(0.4, m["saturation"] / 0.35)), 2)
s["grade"]["vignette"] = round(max(0.15, 0.7 - m["brightness"] * 0.6), 2); s["grade"]["sat"] = s["sets"]["saturation"]
s["pacing"]["cutsPer10s"] = round(m["cuts_per_10s"], 1); s["camera"]["zoom"] = round(min(0.2, 0.06 + m["motion_mean"] / 200), 3)
s["captions"]["hi"] = accent
(ROOT / "styles" / f"{a.id}.json").write_text(json.dumps(s, indent=1) + "\n"); print("wrote styles/%s.json" % a.id, "accent", accent, "tod", s["sets"]["tod"])
