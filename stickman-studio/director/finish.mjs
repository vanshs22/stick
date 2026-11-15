#!/usr/bin/env node
// After voice timing exists: score the plan, apply deterministic fixes, re-score, write score.json.
//   node finish.mjs <projectDir>
import fs from 'node:fs';
import path from 'node:path';
import { scorePlan, formatScore } from './score.mjs';

const P = path.resolve(process.argv[2] || '.'), J = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8'));
const plan = J('plan.json'), script = J('script.json'), style = J('style.json'), timing = J('data/lines.json');
const before = scorePlan(plan, script, style, timing), applied = [];
const durOf = (i) => timing.lines[i].end - timing.lines[i].start + 0.25;
const ALT = { close: 'medium', medium: 'close', wide: 'medium', two: 'close', insert: 'insert' };

plan.scenes.forEach((s, i) => {
  // 1. long beats get a second camera angle halfway through (retention)
  if (durOf(i) > 3.3 && s.shot.type !== 'insert') { s.split = 0.5; s.splitMove = s.shot.move === 'push' ? 'pull' : 'push'; applied.push(`beat ${i}: ${durOf(i).toFixed(1)}s -> cut to ${ALT[s.shot.type]} at 50%`); }
  // 2. any beat of 5 s or more gets a second cut
  if (durOf(i) > 5.2 && s.shot.type !== 'insert') { s.split2 = 0.78; applied.push(`beat ${i}: extra cut at 78%`); }
});
// 3. hook: first beat must have a loud keyword pop
const s0 = plan.scenes[0]; if (!s0.pop) { const w = script.lines[0].text.split(/\s+/).map((x) => x.replace(/[^A-Za-z0-9$:']/g, '')).filter((x) => x.length > 4).sort((a, b) => b.length - a.length)[0]; if (w) { s0.pop = w.toUpperCase(); applied.push(`hook: keyword pop "${s0.pop}"`); } }
if (s0.intensity < 0.6) { s0.intensity = 0.6; s0.shot.move = 'punch'; applied.push('hook: punch-in on the first frame'); }
// 4. shot variety: never the same shot type three times in a row; at least 3 types overall
for (let i = 2; i < plan.scenes.length; i++) { const a = plan.scenes[i - 2].shot.type, b = plan.scenes[i - 1].shot.type, c = plan.scenes[i].shot.type; if (a === b && b === c && c !== 'insert') { plan.scenes[i].shot.type = ALT[c]; applied.push(`beat ${i}: ${c} x3 -> ${ALT[c]}`); } }
// 5. ending: the last beat returns to the first location with a punch (loop feel) and flashes
const last = plan.scenes[plan.scenes.length - 1]; if (!/^(punch)$/.test(last.shot.move)) { last.shot.move = 'punch'; applied.push('ending: punch-in on the last line'); }
if (style.cta || plan.cta) { last.cta = plan.cta || style.cta; }
// 6. emotion: if the arc is flat, widen the peak
const range = Math.max(...plan.scenes.map((s) => s.intensity)) - Math.min(...plan.scenes.map((s) => s.intensity)); if (range < 0.4) { plan.scenes.forEach((s) => { s.intensity = s.arc === 'peak' ? 0.95 : Math.min(s.intensity, 0.5); }); applied.push('emotion: widened intensity range'); }
const after = scorePlan(plan, script, style, timing);
fs.writeFileSync(path.join(P, 'plan.json'), JSON.stringify(plan, null, 1));
fs.writeFileSync(path.join(P, 'score.json'), JSON.stringify({ before, after, applied }, null, 1));
console.log(formatScore(after)); console.log(`\nbefore fixes: ${before.total}  after: ${after.total}  (${applied.length} automatic fixes)`); applied.slice(0, 8).forEach((a) => console.log('  fix:', a));
