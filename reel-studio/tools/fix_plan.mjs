#!/usr/bin/env node
// Turns review/critics/*.json into a fix plan grouped by what must change, with the smallest re-run for each.
//   node tools/fix_plan.mjs <project> [--min major|minor]      (default: blocker + major)
import fs from 'node:fs';
import path from 'node:path';
const P = path.resolve(process.argv[2] || '.'), min = process.argv.includes('minor') ? 0 : 1, rank = { blocker: 2, major: 1, minor: 0 };
const dir = path.join(P, 'review/critics'), reps = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).filter((r) => r.findings) : [];
const items = reps.flatMap((r) => r.findings.filter((f) => rank[f.severity] >= min).map((f) => ({ ...f, critic: r.critic })));
if (!items.length) { console.log('No findings at this level. Nothing to fix.'); process.exit(0); }
const RERUN = {
  script: 'edit script/script.json, then: critique.mjs <P> script, then request the script gate again (approval is stale after an edit)',
  research: 'fix research/research.json (or add sources), then: critique.mjs <P> research',
  storyboard: 'edit storyboard/storyboard.json, then: check_storyboard.mjs <P> && critique.mjs <P> storyboard',
  audio: 'change audio/audio-plan.json (gain, pronunciations, direction), regenerate voice/mix, then: critique.mjs <P> audio',
  render: 're-render ONLY the shots named below: render_segments.mjs <P> --shots <ids> && assemble.mjs <P>',
  style: 'needs a human decision: show the contact sheet or the preview to the user',
  toolkit: 'a defect in the toolkit itself: report it, do not hide it',
};
const by = {}; for (const f of items) (by[f.fix_target || 'storyboard'] ||= []).push(f);
let out = '# Fix plan\n';
for (const [t, fs_] of Object.entries(by).sort((a, b) => Object.keys(RERUN).indexOf(a[0]) - Object.keys(RERUN).indexOf(b[0]))) {
  out += `\n## ${t}  (${fs_.length})\n${RERUN[t] || ''}\n`;
  for (const f of fs_) out += `- [${f.severity}] ${f.critic} ${f.shot_id || f.line_id || ''}${f.timestamp_sec != null ? ' @' + f.timestamp_sec + 's' : ''}: ${f.problem} -> ${f.fix}\n`;
}
const shots = [...new Set(items.filter((f) => ['storyboard', 'render'].includes(f.fix_target) && f.shot_id).map((f) => f.shot_id))];
if (shots.length) out += `\nShots to re-render: ${shots.join(',')}  (all other shots keep their cached render)\n`;
fs.writeFileSync(path.join(dir, 'FIX_PLAN.md'), out); console.log(out);
