"""Ears for the agent, free and offline: turns data/mix.wav into evidence a model can read, and picks the few moments a HUMAN should actually listen to.

  python tools/audio/ears.py <project>

Writes review/ears/:
  timeline.md       one row per second: level (dBFS), speech yes/no, shot, sound cues; plus FLAGS (dead air, level jumps, late first word, cue/onset offsets)
  sheet.png         waveform + loudness curve + shot cuts + cue ticks + speech bands (an image the agent can look at)
  ears.json         the same numbers for tools
  listen/NN-*.mp3   3-4 s clips of the moments worth a human ear, and listen/CHECKLIST.md with the question for each

Honest limit: this MEASURES (levels, gaps, sync, masking). It cannot judge taste (is the voice pleasant, does the music fit the mood).
The checklist exists so that judgement costs a person about one minute.
"""
import json, subprocess, sys, os
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from PIL import Image, ImageDraw

_b = Path(__file__).resolve().parents[2] / '.bin'
if _b.exists(): os.environ['PATH'] = str(_b) + os.pathsep + os.environ['PATH']
P = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
rd = lambda f, d=None: json.loads((P / f).read_text()) if (P / f).exists() else d
mixf = P / 'data/mix.wav'
if not mixf.exists(): print('no data/mix.wav: build the video first (tools/build_video.mjs)'); sys.exit(1)
sr, x = wavfile.read(mixf); x = x.astype(np.float64) / (32768.0 if x.dtype == np.int16 else 1.0)
m = x.mean(1) if x.ndim > 1 else x; dur = len(m) / sr
tl = rd('data/timeline.json', {'shots': [], 'duration': dur}); cues = (rd('data/cues.json', {}) or {}).get('cues', []); words = rd('data/words.json', []) or []
mr = rd('data/mix-report.json', {}) or {}
db = lambda v: 20 * np.log10(v + 1e-9)
H = int(sr * 0.1); n = len(m) // H; rms = db(np.sqrt((m[:n * H].reshape(n, H) ** 2).mean(1)))            # 100 ms loudness frames
speech = np.zeros(n, bool)
for w in words:
    speech[int(w['s'] * 10):int(min(w['e'], dur) * 10) + 1] = True
shot_at = lambda t: next((s['id'] for s in tl['shots'] if s['start'] <= t < s['end']), '-')
flags = []
# 1. late first word / dead start
if words and words[0]['s'] > 0.7: flags.append({'t': 0, 'kind': 'late first word', 'detail': f"the narration starts at {words[0]['s']:.2f} s: the hook has dead air before it"})
# 2. dead air: more than 0.8 s under -50 dBFS inside the film
run = 0
for i, v in enumerate(rms):
    run = run + 1 if v < -50 else 0
    if run == 9: flags.append({'t': round((i - 8) / 10, 1), 'kind': 'dead air', 'detail': 'more than 0.8 s of near silence (no voice, no music)'})
# 3. level jumps between neighbouring seconds
sec = np.array([rms[i * 10:(i + 1) * 10].mean() for i in range(n // 10)])
for i in range(1, len(sec)):
    if abs(sec[i] - sec[i - 1]) > 9 and sec[i] > -45 and sec[i - 1] > -45: flags.append({'t': i, 'kind': 'level jump', 'detail': f'{sec[i - 1]:.0f} to {sec[i]:.0f} dBFS between seconds {i - 1} and {i}'})
# 4. cue sync: where does the energy actually rise near each cue?
# cue audibility: timing comes from the word anchors (exact by construction), so what can be MEASURED is whether the effect rises above what plays under it
cue_rows = []
seg_db = lambda a0, a1: db(np.sqrt((m[int(max(0, a0) * sr):int(min(dur, a1) * sr)] ** 2).mean() + 1e-12))
for c in cues:
    after, before = seg_db(c['t'], c['t'] + 0.25), seg_db(c['t'] - 0.4, c['t'] - 0.1); lift = after - before
    cue_rows.append({'t': c['t'], 'type': c['type'], 'shot': c.get('shot'), 'event': c.get('event'), 'lift_db': round(float(lift), 1)})
    if lift < 1.5 and after < -22: flags.append({'t': c['t'], 'kind': 'cue barely audible', 'detail': f"{c['type']} at {c['t']:.2f} s adds only {lift:+.1f} dB over what plays under it: it may be masked by the voice or music"})
# 5. masking
if mr.get('music_under_voice_db') is not None and mr['music_under_voice_db'] < 10: flags.append({'t': 0, 'kind': 'music close to the voice', 'detail': f"music is only {mr['music_under_voice_db']} dB under the voice while it speaks"})
if mr.get('master_gain_db', 0) < -8: flags.append({'t': 0, 'kind': 'hot mix', 'detail': f"the master stage turned the mix down {mr['master_gain_db']} dB: the parts add up too loud"})
if rms.max() > -1.0: flags.append({'t': float(np.argmax(rms)) / 10, 'kind': 'peak at full scale', 'detail': f'loudest frame {rms.max():.1f} dBFS'})

# ---------- files ----------
O = P / 'review/ears'; (O / 'listen').mkdir(parents=True, exist_ok=True)
rows = ['| t (s) | level dBFS | speech | shot | sound cues |', '|---|---|---|---|---|']
for i in range(int(np.ceil(dur))):
    seg = rms[i * 10:(i + 1) * 10]
    if not len(seg): break
    cs = ', '.join(f"{c['type']}@{c['t']:.2f}" for c in cues if i <= c['t'] < i + 1)
    rows.append(f"| {i} | {seg.mean():.0f} | {'voice' if speech[i * 10:(i + 1) * 10].mean() > 0.3 else '-'} | {shot_at(i + 0.5)} | {cs} |")
md = f"# Listening transcript (measured, not heard)\n\nlength {dur:.2f} s, mean level {rms[rms > -60].mean():.0f} dBFS, peak {rms.max():.1f} dBFS, speech {100 * speech.mean():.0f} percent of the time, {len(cues)} sound cues" + (f", music {mr['music_under_voice_db']} dB under the voice" if mr.get('music_under_voice_db') is not None else '') + '\n\n## Flags\n' + ('\n'.join(f"- @{f['t']} s **{f['kind']}**: {f['detail']}" for f in flags) or '- none') + '\n\n## Per second\n' + '\n'.join(rows) + '\n\n> This measures levels, gaps, sync and masking. It cannot judge taste: see listen/CHECKLIST.md for the moments a person should play.\n'
(O / 'timeline.md').write_text(md)
json.dump({'duration': round(dur, 2), 'flags': flags, 'cues': cue_rows, 'mix_report': mr, 'speech_share': round(float(speech.mean()), 3), 'peak_db': round(float(rms.max()), 1)}, open(O / 'ears.json', 'w'), indent=1)
# picture
W, Hh = 1500, 560; im = Image.new('RGB', (W, Hh), (18, 18, 24)); d = ImageDraw.Draw(im); L, R = 60, W - 20; px = lambda t: L + (R - L) * t / dur
for i, s in enumerate(speech):
    if s: d.rectangle([px(i / 10), 40, px((i + 1) / 10), 520], fill=(30, 40, 58))
cols = np.array_split(np.arange(len(m)), R - L)
for j, c in enumerate(cols):
    if len(c): d.line([L + j, 150 - 100 * np.abs(m[c]).max(), L + j, 150 + 100 * np.abs(m[c]).max()], fill=(120, 190, 255))
for i, v in enumerate(rms): d.rectangle([px(i / 10), 520 - (max(-60, min(0, v)) + 60) / 60 * 190, px((i + 1) / 10), 520], fill=(70, 150, 110))   # louder = taller
d.text((L, 22), 'waveform', fill=(180, 180, 190)); d.text((L, 300), 'loudness: top = 0 dBFS, bottom = -60', fill=(180, 180, 190)); d.text((R - 330, 22), 'shaded = narrator speaking', fill=(150, 160, 190))
for s in tl['shots']: d.line([px(s['start']), 40, px(s['start']), 540], fill=(255, 190, 80)); d.text((px(s['start']) + 3, 540), s['id'], fill=(255, 190, 80))
for c in cue_rows: d.line([px(c['t']), 240, px(c['t']), 290], fill=(255, 100, 140), width=2); d.text((px(c['t']) - 10, 226), c['type'], fill=(255, 140, 170))
for f in flags[:12]: d.polygon([(px(f['t']), 36), (px(f['t']) - 5, 28), (px(f['t']) + 5, 28)], fill=(255, 80, 80))
for t in range(0, int(dur) + 1, 2): d.text((px(t), 4), f'{t}s', fill=(130, 130, 140))
im.save(O / 'sheet.png')
# the moments worth a human ear
moments = [('hook', 0.0, 3.5, 'Is the first sentence clear and pleasant, and is the music out of its way?')]
firsts = {}
for c in cue_rows:
    if c['shot'] not in firsts: firsts[c['shot']] = c
for sid, c in list(firsts.items())[:3]: moments.append((f"cue-{sid}-{c['type']}", max(0, c['t'] - 1.2), 3.2, f"The {c['type']} is meant to land on: {c['event']}. Does it land on that moment and feel right, not random?"))
lo = int(np.argmax(sec)); moments.append(('loudest', max(0, lo - 0.5), 3.0, 'The loudest second: is anything harsh or fatiguing?'))
moments.append(('ending', max(0, dur - 3.5), 3.5, 'The ending: does it close cleanly (no cut-off word, no abrupt music stop)?'))
chk = ['# 1-minute listening checklist\n\nPlay each clip once. Tick or write one word. Only a person can judge these.\n']
for i, (name, a, ln, q) in enumerate(moments, 1):
    fn = f'{i:02d}-{name}.mp3'; subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.2f}', '-t', f'{ln:.2f}', '-i', str(mixf), '-b:a', '128k', str(O / 'listen' / fn)], capture_output=True)
    chk.append(f'{i}. `listen/{fn}` ({a:.1f}-{a + ln:.1f} s): {q}  [ ] good  [ ] fix: ________')
chk.append('\nAlso decide: voice (keep / change voice or speed), music (keep / quieter / none), effects (keep / fewer). Tell the agent in one line each: `tools/choose.mjs <P> voice ...`.')
(O / 'listen/CHECKLIST.md').write_text('\n'.join(chk) + '\n')
print(f"review/ears: {len(flags)} flag(s), {len(cue_rows)} cue(s) measured, {len(moments)} listening clips -> timeline.md, sheet.png, listen/CHECKLIST.md")
for f in flags[:8]: print(f"  FLAG @{f['t']}s {f['kind']}: {f['detail']}")
