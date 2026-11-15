#!/usr/bin/env node
// Production state + approval gates. The agent MUST use this so a gate can never be skipped by accident.
//   node tools/state.mjs init <projectDir> [--auto]     create state.json
//   node tools/state.mjs show <projectDir>              print every stage and its status
//   node tools/state.mjs start|done <projectDir> <stage>
//   node tools/state.mjs request <projectDir> <stage>   mark "awaiting your approval" (then STOP and ask the user)
//   node tools/state.mjs approve <projectDir> <stage>   only after the user said yes
//   node tools/state.mjs check <projectDir> <stage>     exit 1 if an earlier approval gate is still open
import fs from 'node:fs';
import path from 'node:path';

export const STAGES = ['intake', 'style', 'topic', 'research', 'script', 'script_critic', 'storyboard', 'storyboard_critic', 'voice_captions', 'assets', 'build', 'visual_critic', 'audio_critic', 'final', 'deliver'];
export const GATES = ['style', 'topic', 'research', 'script', 'storyboard', 'voice_captions', 'final'];   // the user approves these
const file = (dir) => path.join(dir, 'state.json'), now = () => new Date().toISOString();
export const load = (dir) => JSON.parse(fs.readFileSync(file(dir), 'utf8'));
const save = (dir, s) => fs.writeFileSync(file(dir), JSON.stringify(s, null, 1));

export function init(dir, auto = false) {
  fs.mkdirSync(dir, { recursive: true });
  const s = { project: path.basename(path.resolve(dir)), mode: auto ? 'auto' : 'ask', created: now(), stages: Object.fromEntries(STAGES.map((k) => [k, { status: 'pending' }])), revisions: [] };
  save(dir, s); return s;
}
export function set(dir, stage, status, extra = {}) {
  if (!STAGES.includes(stage)) throw new Error(`unknown stage "${stage}". Stages: ${STAGES.join(', ')}`);
  const s = load(dir); s.stages[stage] = { ...s.stages[stage], status, at: now(), ...extra }; save(dir, s); return s;
}
/** every gate before `stage` must be approved (in 'ask' mode). Returns the open gate or null. */
export function openGate(dir, stage) {
  const s = load(dir); if (s.mode === 'auto') return null;
  for (const k of STAGES.slice(0, STAGES.indexOf(stage))) if (GATES.includes(k) && s.stages[k].status !== 'approved') return k;
  return null;
}
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [cmd, dir, stage] = process.argv.slice(2);
  try {
    if (cmd === 'init') console.log(JSON.stringify(init(dir, process.argv.includes('--auto')).mode));
    else if (cmd === 'show') { const s = load(dir); console.log(`mode: ${s.mode}`); for (const k of STAGES) console.log(`${k.padEnd(18)} ${s.stages[k].status}${GATES.includes(k) ? '  (needs your approval)' : ''}`); }
    else if (cmd === 'start') set(dir, stage, 'in_progress');
    else if (cmd === 'done') set(dir, stage, 'done');
    else if (cmd === 'request') { set(dir, stage, 'awaiting_approval'); console.log(`STOP: ask the user to approve "${stage}" before doing anything else.`); }
    else if (cmd === 'approve') set(dir, stage, 'approved', { by: 'user' });
    else if (cmd === 'check') { const g = openGate(dir, stage); if (g) { console.error(`BLOCKED: "${g}" is not approved yet. Ask the user first.`); process.exit(1); } console.log('ok'); }
    else { console.error('commands: init show start done request approve check'); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
