#!/usr/bin/env node
// Originality gate: a style pack's upgrade.json must differ from its reference on at least 4 of 6 axes
// (structure, opening, signature shot, camera path, score shape, ending), and say what is kept, improved and changed.
//   node tools/upgrade_check.mjs <upgrade.json>      exit 1 if the pack is too close to the reference
import fs from 'node:fs';
import { check, loadSchema } from './validate.mjs';

const same = (a, b) => { const n = (x) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(), A = new Set(n(a).split(' ')), B = new Set(n(b).split(' ')); const i = [...A].filter((w) => B.has(w)).length; return n(a) === n(b) || i / Math.max(1, Math.min(A.size, B.size)) >= 0.8; };
export function judge(u) {
  const errs = check(loadSchema('upgrade'), u); if (errs.length) return { ok: false, problems: errs };
  const axes = Object.entries(u.axes), differ = axes.filter(([, v]) => !same(v.ref, v.ours)).map(([k]) => k), problems = [];
  if (differ.length < 4) problems.push(`only ${differ.length} of 6 axes differ from the reference (${differ.join(', ') || 'none'}); need at least 4`);
  if (u.change.some((c) => /^(none|n\/a|same)/i.test(c))) problems.push('"change" must name real changes');
  return { ok: !problems.length, differ, problems };
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv[2]) {
  const r = judge(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
  if (!r.ok) { console.error('upgrade check FAILED:\n- ' + r.problems.join('\n- ')); process.exit(1); }
  console.log(`upgrade ok: ${r.differ.length} of 6 axes differ (${r.differ.join(', ')})`);
}
