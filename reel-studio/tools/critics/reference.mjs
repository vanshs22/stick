// Reference similarity critic: measures how close the render's production language is to the analysed references, and guards against being TOO close.
import fs from 'node:fs';
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { analyseRender } from './render_analysis.mjs';
export async function run_(P) {
  const r = new Report(P, 'reference'), R = analyseRender(P), dir = path.join(P, 'references'), refs = fs.existsSync(dir) ? fs.readdirSync(dir).map((d) => ({ d, a: tryRd(path.join(dir, d, 'analysis.json')) })).filter((x) => x.a?.kind === 'video') : [];
  if (!R) { r.add('blocker', { problem: 'no rendered video to compare', evidence: '', expected: 'renders/*.mp4', fix: 'render', fix_target: 'render' }); return r.finish(); }
  if (!refs.length) { r.notes.push('No video references in this project: nothing to compare. (Add one with tools/reference/ingest.mjs.)'); return r.finish(); }
  const A = R.analysis, rows = [];
  r.check('pace, camera habits, look, caption zone, loudness vs each reference');
  for (const { d, a } of refs) {
    const m = [['cuts per 10 s', A.timing.cuts_per_10s, a.timing.cuts_per_10s, 0.6], ['median shot (s)', A.timing.median_shot, a.timing.median_shot, 0.6], ['camera static share', A.camera.static_share, a.camera.static_share, 0.5], ['brightness', A.look.brightness, a.look.brightness, 0.4], ['saturation', A.look.saturation, a.look.saturation, 0.5], ['loudness (LUFS)', A.audio?.loudness_lufs, a.audio?.loudness_lufs, 0.2]].filter((x) => x[1] != null && x[2] != null);
    const rel = m.map(([n, x, y, tol]) => ({ n, mine: x, ref: y, diff: Math.abs(x - y) / (Math.abs(y) || 1) <= tol ? 'close' : x > y ? 'higher' : 'lower', closeness: Math.max(0, 1 - Math.abs(x - y) / (Math.max(Math.abs(y), 0.05) * 2)) })), sim = rel.reduce((s, x) => s + x.closeness, 0) / rel.length; rows.push({ ref: d, similarity: +sim.toFixed(2), metrics: rel });
    if (sim > 0.92) r.add('major', { problem: `the render is almost identical to reference "${d}" in pace, look and sound`, evidence: `similarity ${sim.toFixed(2)}`, expected: 'learn the language, add your own twist (new character, world, framing, wording)', fix: 'change the design, not just the words', fix_target: 'style' });
  }
  const best = rows.sort((x, y) => y.similarity - x.similarity)[0]; r.notes.push(`closest reference: ${best.ref} (${best.similarity}). ${best.metrics.map((m) => `${m.n}: mine ${m.mine} vs ${m.ref} (${m.diff})`).join('; ')}`);
  r.notes.push('Visual similarity of character/world/typography needs eyes: tools/critique.mjs vision --packet reference. Deviation from a reference is allowed: the director decides per shot.'); fs.mkdirSync(path.join(P, 'review/critics'), { recursive: true }); fs.writeFileSync(path.join(P, 'review/critics/reference-table.json'), JSON.stringify(rows, null, 1)); return r.finish();
}
