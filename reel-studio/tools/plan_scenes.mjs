#!/usr/bin/env node
// Scene planner CLI (style 2): script -> storyboard with full takes, staging, set dressing, transitions, ledger.
//   node tools/plan_scenes.mjs <script.json> <out-dir> [--ink 0.8]     writes <out-dir>/storyboard.json and <out-dir>/ledger.md
import fs from 'node:fs';
import path from 'node:path';
import { planScenes, checkLedger } from './lib/scene_planner.mjs';
const [sf, out, ...a] = process.argv.slice(2); if (!sf || !out) { console.error('usage: plan_scenes.mjs <script.json> <out-dir> [--ink n]'); process.exit(2); }
const script = JSON.parse(fs.readFileSync(sf, 'utf8')), ink = a.includes('--ink') ? +a[a.indexOf('--ink') + 1] : 0.8, { shots, ledger, choreo } = planScenes(script, { ink, durations: a.includes('--lines') ? Object.fromEntries(JSON.parse(fs.readFileSync(a[a.indexOf('--lines') + 1], 'utf8')).map((x) => [x.id, x.end - x.start])) : null }), problems = [...checkLedger(ledger), ...choreo];
fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'storyboard.json'), JSON.stringify({ style_pack: 'stickman-world', shots }, null, 1) + '\n');
fs.writeFileSync(path.join(out, 'ledger.md'), `# Ledger: ${script.title}\n\n| shot | place | time | purpose | start framing | angle | subject | take | transition | cast | hero |\n|---|---|---|---|---|---|---|---|---|---|---|\n` + ledger.map((r) => `| ${r.shot} | ${r.place} | ${r.time} | ${r.purpose} | ${r.framing} | ${r.angle} | ${r.subject} | ${r.move} | ${r.transition} | ${r.cast} | ${r.hero} |`).join('\n') + `\n\n${problems.length ? 'PROBLEMS:\n' + problems.map((p) => '- ' + p).join('\n') : 'Ledger check: neighbours differ, place changes dissolve, a hero object is shown.'}\n`);
console.log(`${shots.length} shots -> ${out}/storyboard.json`); problems.forEach((p) => console.log('  ! ' + p)); process.exit(problems.length ? 1 : 0);
