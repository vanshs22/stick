// Numeric compare of two style-dna files (a reference and a render of our own): the closed loop of "make it like this".
//   export compare(ref, ours) -> {pass, rows:[{metric, ref, ours, tol, ok}], fixes:[...]}
// Thresholds: cuts per 10 s +-20 %, median shot +-25 %, loudness +-1.5 LU, tempo +-8 %, caption height +-5 points of frame height, move-mix L1 distance <= 0.3, palette: each of the reference's top 3 colours has one of ours within RGB distance 60.
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));
export function compare(ref, ours) {
  const rows = [], add = (metric, r, o, tol, ok) => rows.push({ metric, ref: r, ours: o, tol, ok }), rel = (r, o) => (r ? Math.abs(o - r) / Math.abs(r) : o === 0 ? 0 : 1);
  add('cuts per 10 s', ref.motion.cuts_per_10s, ours.motion.cuts_per_10s, '+-20%', rel(ref.motion.cuts_per_10s, ours.motion.cuts_per_10s) <= 0.2);
  add('median shot (s)', ref.camera.shot_len.median, ours.camera.shot_len.median, '+-25%', rel(ref.camera.shot_len.median, ours.camera.shot_len.median) <= 0.25);
  add('loudness (LUFS)', ref.audio.lufs, ours.audio.lufs, '+-1.5', Math.abs(ref.audio.lufs - ours.audio.lufs) <= 1.5);
  if (ref.audio.bpm && ours.audio.bpm) add('tempo (bpm)', ref.audio.bpm, ours.audio.bpm, '+-8%', rel(ref.audio.bpm, ours.audio.bpm) <= 0.08);
  if (ref.captions?.y_pct != null && ours.captions?.y_pct != null) add('caption height (% of frame)', ref.captions.y_pct, ours.captions.y_pct, '+-5', Math.abs(ref.captions.y_pct - ours.captions.y_pct) <= 5);
  const keys = new Set([...Object.keys(ref.camera.move_mix), ...Object.keys(ours.camera.move_mix)]), l1 = [...keys].reduce((a, k) => a + Math.abs((ref.camera.move_mix[k] || 0) - (ours.camera.move_mix[k] || 0)), 0);
  add('camera move mix (L1 distance)', 0, +l1.toFixed(2), '<=0.3', l1 <= 0.3);
  ref.palette.dominant.slice(0, 3).forEach((c, i) => { const best = Math.min(...ours.palette.dominant.map((o) => dist(c, o))); add(`palette colour ${i + 1} ${c}`, c, ours.palette.dominant.slice().sort((a, b) => dist(c, a) - dist(c, b))[0], 'RGB distance <= 60', best <= 60); });
  const FIX = { 'cuts per 10 s': 'change the shot lengths in the storyboard / camera.json shot_len', 'median shot (s)': 'change the shot lengths in the storyboard / camera.json shot_len', 'loudness (LUFS)': 'rebuild the mix at the target loudness (mix.py target_lufs)', 'tempo (bpm)': 'pick music at the reference tempo (mood_pick.mjs / audio-plan query)', 'caption height (% of frame)': 'set caption position.y_pct in the caption-style file', 'camera move mix (L1 distance)': 'rebalance moves in camera.json move_mix', palette: 'adjust the pack palette tokens toward the reference colours' };
  const fixes = rows.filter((r) => !r.ok).map((r) => `${r.metric}: ${FIX[r.metric] || FIX.palette} (ref ${r.ref}, ours ${r.ours}, tolerance ${r.tol})`);
  return { pass: rows.every((r) => r.ok), rows, fixes };
}
