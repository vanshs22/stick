#!/usr/bin/env node
// Critic runner.  node tools/critique.mjs <project> <critic|all|stage:<stage>|vision ...>
//   critics: research script storyboard visual captions audio frames video reference     (audio gives voice+music+sfx, video gives video+final)
//   stages : research script storyboard captions audio render (frames+video+reference)
//   vision : vision --packet|--submit|--unavailable <character|environment|camera|composition|typography|ui|transitions|frames|video|reference> [--file f.json] ["why"]
// Writes review/critics/<critic>.json and review/critics/SUMMARY.md. Exit 1 if any blocker, 2 on usage.
import fs from 'node:fs';
import path from 'node:path';
const [, , proj, what = 'all', ...rest] = process.argv;
if (!proj) { console.error('usage: critique.mjs <project> <critic|all|stage:x|vision ...>'); process.exit(2); }
const P = path.resolve(proj);
const MOD = { research: 'research', script: 'script', storyboard: 'storyboard', visual: 'visual', captions: 'captions', audio: 'audio', frames: 'frames', video: 'video', final: 'video', reference: 'reference' };
const STAGE = { research: ['research'], script: ['script'], storyboard: ['storyboard', 'visual'], captions: ['captions'], audio: ['audio'], render: ['frames', 'video', 'reference'] };
const load = async (m) => { const x = await import(`./critics/${m}.mjs`); return x.run_ || x.run; };
if (what === 'vision') { const f = await load('vision'); await f(P, rest); process.exit(0); }
const names = what === 'all' ? ['research', 'script', 'storyboard', 'visual', 'captions', 'audio', 'frames', 'video', 'reference'] : what.startsWith('stage:') ? STAGE[what.slice(6)] : [what];
if (!names || names.some((n) => !MOD[n])) { console.error(`unknown critic/stage "${what}"`); process.exit(2); }
const seen = new Set(), reports = [];
for (const n of names) {
  if (seen.has(MOD[n])) continue; seen.add(MOD[n]);
  try { const r = await (await load(MOD[n]))(P, { noWhisper: rest.includes('--no-whisper') }); reports.push(...[].concat(r)); } catch (e) { console.error(`critic ${n} crashed: ${e.stack || e}`); reports.push({ critic: n, verdict: 'fail', score: 0, findings: [{ severity: 'blocker', problem: `the critic itself crashed: ${e.message}`, evidence: '', expected: '', fix: 'fix the critic', fix_target: 'toolkit' }], checks_run: [] }); }
}
const sev = (r, s) => r.findings.filter((f) => f.severity === s).length;
let md = `# Critic summary\n\n| critic | verdict | score | blocker | major | minor | looked at pixels? |\n|---|---|---|---|---|---|---|\n`;
for (const r of reports) md += `| ${r.critic} | ${r.verdict} | ${r.score} | ${sev(r, 'blocker')} | ${sev(r, 'major')} | ${sev(r, 'minor')} | ${r.assessment === 'vision' ? 'yes (agent)' : 'measured only'} |\n`;
md += `\nAutomatic critics measure; they do not judge taste or story. Vision critics (character, environment, camera, composition, typography, ui, transitions) run only when the agent really opens the images: see \`critique.mjs <project> vision --packet <name>\`.\n`;
const notes = reports.flatMap((r) => (r.notes || []).map((n) => `- ${r.critic}: ${n}`)); if (notes.length) md += `\n## Not covered\n${notes.join('\n')}\n`;
const out = path.join(P, 'review/critics'); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
process.exit(reports.some((r) => sev(r, 'blocker')) ? 1 : 0);
