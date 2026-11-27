// Shared camera/pacing grammar: profiles in skills/camera-grammar/profiles.json, one per cadence a style pack can name.
//   profileOf(TK, pack)           -> the profile object (or null)
//   paceCheck(profile, shots, total, events?) -> warning strings. shots = [{id, start, end}] (seconds); events = camera events if the style counts them (beats + cuts)
import fs from 'node:fs';
import path from 'node:path';
export const profiles = (TK) => JSON.parse(fs.readFileSync(path.join(TK, 'skills/camera-grammar/profiles.json'), 'utf8'));
export const profileOf = (TK, pack) => { const all = profiles(TK), id = pack?.cadence; return id && all[id] ? { id, ...all[id] } : null; };
export function paceCheck(p, shots, total, events) {
  if (!p) return [];
  const w = [], [lo, hi] = p.shot_len, long = shots.filter((s) => s.end - s.start > hi * 1.5), mean = total / Math.max(1, shots.length);
  for (const s of long) w.push(`${s.id}: ${(s.end - s.start).toFixed(1)} s on one picture; the "${p.id}" cadence holds ${lo}-${hi} s (max_hold ${p.max_hold} s without a camera event)`);
  if (mean < lo * 0.8) w.push(`mean shot ${mean.toFixed(1)} s is faster than "${p.id}" (${lo}-${hi} s)`);
  if (mean > hi * 1.2) w.push(`mean shot ${mean.toFixed(1)} s is slower than "${p.id}" (${lo}-${hi} s)`);
  if (p.events_per_min && events != null) { const per = events / (total / 60); if (per < p.events_per_min[0] * 0.85 || per > p.events_per_min[1] * 1.15) w.push(`${per.toFixed(0)} camera events/min; "${p.id}" targets ${p.events_per_min[0]}-${p.events_per_min[1]}`); }
  return w;
}
