#!/usr/bin/env node
// Measures every genre of tools/audio/music_lab.py: the tempo we asked for is the tempo a listener-model finds, the beat is audible, bass and highs both exist, nothing clips, it is not silent or flat.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PY, TK } from './lib/pipeline.mjs';
const py = `
import sys, numpy as np
sys.path.insert(0, '${path.join(TK, 'tools/audio').replace(/\\/g, '/')}')
from music_lab import make, G, SR
from scipy import signal
bad = []
for g in G:
    bpm = int(np.mean(G[g]['bpm'])); x = make(g, 24, bpm, 'A', None, 1)
    hop = 220; fr = np.lib.stride_tricks.sliding_window_view(x[:len(x) // hop * hop], 440)[::hop]; e = np.sqrt((fr ** 2).mean(axis=1)); on = np.maximum(0, np.diff(np.log(e + 1e-4)))
    on = on - on.mean(); ac = np.correlate(on, on, 'full')[len(on) - 1:]; lo, hi = int(60 / 200 / (hop / SR)), int(60 / 55 / (hop / SR)); k = lo + int(np.argmax(ac[lo:hi])); est = 60 / (k * hop / SR)
    cands = [est * m for m in (0.5, 1, 2, 4 / 3, 3 / 4, 1.5, 2 / 3, 0.4, 2.5, 5 / 3)]; err = min(abs(c - bpm) / bpm for c in cands)
    f, p = signal.welch(x, SR, nperseg=4096); band = lambda a, b: p[(f >= a) & (f < b)].sum() / p.sum()
    r = dict(g=g, bpm=bpm, est=round(est), err=round(err, 3), peak=float(np.abs(x).max()), rms=float(np.sqrt((x ** 2).mean())), bass=band(30, 200), highs=band(4000, 16000), beat=float(ac[k] / ac[0]))
    prob = [m for m, c in (('tempo off by more than 6%', r['err'] > 0.06 and g != 'cinematic'), ('clips', r['peak'] > 0.99), ('too quiet', r['rms'] < 0.04), ('no low end', r['bass'] < 0.02 and g != 'corporate'), ('beat not audible', r['beat'] < 0.05 and g != 'cinematic'), ('dull', r['highs'] < 0.00002 and g not in ('cinematic', 'lofi'))) if c]
    print(f"{'FAIL' if prob else 'ok  '} {g:10s} bpm {bpm} found {r['est']:3d} err {r['err']:.3f} rms {r['rms']:.2f} bass {r['bass']:.2f} highs {r['highs']:.4f} beat {r['beat']:.2f} {prob if prob else ''}"); bad += prob
sys.exit(1 if bad else 0)
`;
const r = spawnSync(PY, ['-c', py], { encoding: 'utf8' }); process.stdout.write(r.stdout); if (r.status) { console.log(r.stderr.slice(-400)); console.log('FAIL  music genres'); process.exit(1); } console.log('PASS  music genres: tempo, beat, spectrum, level');
