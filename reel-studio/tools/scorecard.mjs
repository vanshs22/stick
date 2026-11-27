#!/usr/bin/env node
// Score-and-alter loop: rolls the critic reports into one scorecard per stage and says what to do next.
//   node tools/scorecard.mjs <project> [--json]
// Stage score = lowest critic score in the stage (one blocker anywhere fails it). Overall = weighted mean of the stages that ran,
// weights renormalised. A stage that fails 3 rounds, or gains less than 5 points over two rounds, is escalated to the user.
// Writes review/SCORECARD.json (schemas/scorecard.schema.json) and review/scorecard-history.json. Exit 1 unless every stage passes.
import fs from 'node:fs';
import path from 'node:path';
import { check, loadSchema } from './validate.mjs';

export const STAGES = {
  script: { critics: ['script', 'viral'], weight: 10, pass: 85 },
  storyboard: { critics: ['storyboard', 'logic', 'visual'], weight: 25, pass: 85, noBlocker: true },
  audio: { critics: ['voice', 'music'], weight: 10, pass: 80 },
  captions: { critics: ['captions'], weight: 10, pass: 90 },
  sfx: { critics: ['sfx'], weight: 10, pass: 85 },
  overlays: { critics: ['layout', 'frames'], weight: 20, pass: 85 },
  final: { critics: ['video', 'final'], weight: 15, pass: 90 },
};
export const MAX_ROUNDS = 3, OVERALL_PASS = 88;

export function score(reports, history = []) {
  const stages = [];
  for (const [stage, def] of Object.entries(STAGES)) {
    const rs = def.critics.map((c) => reports[c]).filter(Boolean); if (!rs.length) continue;
    const sc = Math.min(...rs.map((r) => r.score)), blockers = rs.flatMap((r) => r.findings.filter((f) => f.severity === 'blocker').map((f) => `${r.critic}${f.shot_id ? ' ' + f.shot_id : ''}: ${f.problem}`));
    const prior = history.map((h) => h.stages?.[stage]).filter((x) => x != null), failedBefore = prior.filter((s) => s < def.pass).length;
    const ok = sc >= def.pass && !(def.noBlocker && blockers.length);
    const round = ok ? failedBefore : Math.min(failedBefore + 1, MAX_ROUNDS + 1);
    const last2 = [...prior.slice(-1), sc], thrash = !ok && prior.length >= 2 && sc - prior[prior.length - 2] < 5;
    const status = ok ? 'pass' : round > MAX_ROUNDS || thrash ? 'escalate' : sc < 50 ? 'fail' : 'revise';
    stages.push({ stage, score: sc, weight: def.weight, pass_at: def.pass, round: Math.min(round, 4), status, blockers });
    void last2;
  }
  const w = stages.reduce((a, s) => a + s.weight, 0) || 1, overall = Math.round((stages.reduce((a, s) => a + s.score * s.weight, 0) / w) * 10) / 10;
  const status = stages.length && stages.every((s) => s.status === 'pass') && overall >= OVERALL_PASS ? 'pass' : stages.some((s) => s.status === 'escalate') ? 'escalate' : 'revise';
  return { schema_version: 1, stages, overall, status };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1])) && process.argv[2]) {
  const P = path.resolve(process.argv[2]), dir = path.join(P, 'review/critics'), reports = {};
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) { try { const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (r.critic) reports[r.critic] = r; } catch { /* skip */ } }
  const hf = path.join(P, 'review/scorecard-history.json'); let history = []; try { history = JSON.parse(fs.readFileSync(hf, 'utf8')); } catch { /* first run */ }
  const sc = score(reports, history), errs = check(loadSchema('scorecard'), sc); if (errs.length) { console.error('scorecard invalid: ' + errs[0]); process.exit(2); }
  fs.mkdirSync(path.join(P, 'review'), { recursive: true }); fs.writeFileSync(path.join(P, 'review/SCORECARD.json'), JSON.stringify(sc, null, 1));
  fs.writeFileSync(hf, JSON.stringify([...history, { at: new Date().toISOString(), overall: sc.overall, stages: Object.fromEntries(sc.stages.map((s) => [s.stage, s.score])) }].slice(-40), null, 1));
  if (process.argv.includes('--json')) console.log(JSON.stringify(sc, null, 1));
  else { for (const s of sc.stages) console.log(`${s.status.toUpperCase().padEnd(8)} ${s.stage.padEnd(11)} ${String(s.score).padStart(3)}/${s.pass_at} (round ${s.round}, weight ${s.weight})${s.blockers.length ? '  blockers: ' + s.blockers.slice(0, 2).join('; ') : ''}`); console.log(`overall ${sc.overall} (pass at ${OVERALL_PASS}) -> ${sc.status}${sc.status === 'escalate' ? '  (stop fixing: ask the user)' : sc.status === 'revise' ? '  (run fix_plan.mjs, change only storyboard/caption/audio-plan fields, re-run the critics)' : ''}`); }
  process.exit(sc.status === 'pass' ? 0 : 1);
}
