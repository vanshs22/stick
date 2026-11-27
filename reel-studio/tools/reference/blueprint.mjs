#!/usr/bin/env node
// Turn an analysed reference into a BLUEPRINT you can write against: its cut grid, shot lengths, camera habits, caption zone, sound hits and palette,
// plus a time grid scaled to YOUR film's length. It describes the production language only; the content (script, characters, jokes) must be new.
//   node tools/reference/blueprint.mjs <project> <refName> [--duration 14]      -> references/<ref>/blueprint.json + blueprint.md
import fs from 'node:fs';
import path from 'node:path';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), name = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const dir = path.join(P, 'references', name || ''), f = path.join(dir, 'analysis.json');
if (!name || !fs.existsSync(f)) { console.error('usage: blueprint.mjs <project> <refName> [--duration 14]  (analyse the reference first: tools/reference/ingest.mjs)'); process.exit(2); }
const A = JSON.parse(fs.readFileSync(f, 'utf8')), brief = (() => { try { return JSON.parse(fs.readFileSync(path.join(P, 'brief.json'), 'utf8')); } catch { return {}; } })();
const D = Number(opt('duration', brief.duration_sec || A.duration)), k = D / A.duration, shots = (A.shots || []).map((s) => ({ n: s.n, start: s.start, end: s.end, length: s.length, camera: s.camera_motion || 'static' }));
const bands = (A.text?.persistent_bands || []).filter((b) => b.y_from >= 0.5), captionY = bands.length ? Math.round(bands[0].y_from * 1920) : null;
const grid = shots.map((s) => ({ slot: s.n, from: +(s.start * k).toFixed(2), to: +(s.end * k).toFixed(2), reference_length: s.length, camera: s.camera }));
// our film has more cuts than a 2-shot reference would suggest: a reference that holds a shot for 6 s is a format choice (one continuous scene), keep it only if it holds
const bp = { reference: name, source: A.source, duration: A.duration, cuts_per_10s: A.timing.cuts_per_10s, median_shot: A.timing.median_shot, shortest: A.timing.shortest, longest: A.timing.longest, camera_moves: A.camera.moves, static_share: A.camera.static_share, caption_y: captionY,
  loudness_lufs: A.audio?.loudness_lufs ?? null, sfx_onsets: (A.audio?.onset_times || []).map((t) => +(t * k).toFixed(2)), onsets_per_10s: A.audio?.onsets_per_10s ?? null, palette: (A.look?.palette || []).map((p) => p.hex), brightness: A.look?.brightness, saturation: A.look?.saturation,
  target_duration: D, scale: +k.toFixed(3), beat_grid: grid,
  keep: [`median shot about ${A.timing.median_shot} s (${A.timing.cuts_per_10s} cuts per 10 s)`, `camera: ${Object.keys(A.camera.moves || {}).join(', ') || 'static'}`, `loudness near ${A.audio?.loudness_lufs ?? '?'} LUFS`, `palette family ${(A.look?.palette || []).slice(0, 3).map((p) => p.hex).join(' ')}`],
  improve: ['a hook that lands in the first 2 s (the reference may start slowly)', 'an extra readable device the reference lacks (a proof card, a counter, a sticker on the key word)', 'sound tied to every visual event, with a hit on the reveal', 'a last line that loops to the first', 'captions with one highlighted word, kept clear of faces'] };
fs.writeFileSync(path.join(dir, 'blueprint.json'), JSON.stringify(bp, null, 1));
fs.writeFileSync(path.join(dir, 'blueprint.md'), `# Blueprint from "${name}" (production language only: write NEW content)\n\nReference ${A.duration} s, ${shots.length} shots, median ${A.timing.median_shot} s, ${A.timing.cuts_per_10s} cuts per 10 s. Your film: ${D} s (scale x${bp.scale}).\n\n## Time grid for your film\n${grid.map((g) => `- slot ${g.slot}: ${g.from}-${g.to} s (reference held ${g.reference_length} s, camera ${g.camera})`).join('\n')}\n\n## Keep\n${bp.keep.map((x) => '- ' + x).join('\n')}\n\n## Improve (your twist)\n${bp.improve.map((x) => '- ' + x).join('\n')}\n\n## Sound hits in the reference (scaled)\n${bp.sfx_onsets.join(', ') || 'none detected'}\n`);
console.log(`references/${name}/blueprint.json + blueprint.md: ${shots.length} slots over ${D} s, caption y ${captionY ?? 'none detected'}, ${bp.sfx_onsets.length} sound hits`);
