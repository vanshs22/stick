#!/usr/bin/env python3
"""rea-video breakdown.json -> small <id>.deep.json: speech script, SFX hits, loudness of voice/music/effects, stickers, cut-vs-SFX sync.
Sidecar to style-dna (kept separate so the strict dna schema is untouched). Usage: deep_ingest.py <rea-video out dir> <out.json>"""
import json, sys, statistics as st
d, out = sys.argv[1], sys.argv[2]
b = json.load(open(f'{d}/breakdown.json'))
sp = (b.get('speech') or {}).get('lines', [])
au = b.get('audio') or {}
sfx = (au.get('sfx') or {}).get('events', [])
stems = (b.get('stems') or {}).get('level_db', {})
stk = (b.get('packaging') or {}).get('stickers', [])
cuts = [s.get('start', s.get('t0')) for s in b.get('shots', [])][1:]
on_cut = sum(1 for e in sfx if (e.get('on') or {}).get('type') == 'cut')
rates = [l['prosody']['rate'] for l in sp if l.get('prosody', {}).get('rate')]
j = {
  'schema_version': 1, 'source': (b['source'].get('file') or b['source'].get('path')) if isinstance(b.get('source'),dict) else b.get('source'),
  'speech': {'engine': (b.get('speech') or {}).get('engine'), 'wpm': round(st.mean(rates) * 60) if rates else None,
             'lines': [{'t0': l['start'], 't1': l['end'], 'text': l['text'], 'rate': l.get('prosody', {}).get('rate')} for l in sp]},
  'voice': {'ratio': au.get('voice', {}).get('ratio'), 'gender': au.get('voice', {}).get('gender_hint'), 'f0_hz': au.get('voice', {}).get('f0_median_hz'),
            'source': ((b.get('sound_sources') or {}).get('voice') or {}).get('source')},
  'music': {'present': au.get('music', {}).get('present'), 'ratio': au.get('music', {}).get('ratio')},
  'levels_db': stems,
  'sfx': {'count': len(sfx), 'per_10s': round(len(sfx) / max(1, au.get('duration', 1)) * 10, 1), 'on_cut_share': round(on_cut / len(sfx), 2) if sfx else None,
          'types': {t: sum(1 for e in sfx if e.get('type') == t) for t in {e.get('type') for e in sfx}},
          'events': [{'t': e['t'], 'type': e.get('type'), 'db': e.get('level_db'), 'on': (e.get('on') or {}).get('type')} for e in sfx]},
  'stickers': [{'t0': s['t0'], 't1': s['t1'], 'bbox': s['bbox'], 'animated': s.get('animated')} for s in stk],
  'cuts': cuts,
}
json.dump(j, open(out, 'w'), indent=1)
print(f"{j['source']}: {len(sp)} lines, wpm {j['speech']['wpm']}, sfx {j['sfx']['count']} ({j['sfx']['per_10s']}/10s, {j['sfx']['on_cut_share']} on cuts)")
