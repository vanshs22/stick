#!/usr/bin/env node
// Production state + approval gates. Approval is a recorded act by the USER, never a default.
//   node tools/state.mjs init <dir> [--test]                    create state.json (--test needs REEL_TEST_MODE=1 and brands every output as a TEST)
//   node tools/state.mjs show <dir>                             every stage, its status, who approved it and when
//   node tools/state.mjs start|done <dir> <stage>
//   node tools/state.mjs request <dir> <stage> [--artifacts a,b] [--question "..."] [--choices "1=...;2=..."]
//                                                               stage -> awaiting_approval; writes review/approvals/<stage>.md; then STOP and ask the user
//   node tools/state.mjs approve <dir> <stage> --quote "<the user's own words>" [--choice N]
//                                                               only from awaiting_approval, only with a quote; fingerprints the artifacts
//   node tools/state.mjs reject <dir> <stage> --note "<what the user wants changed>"
//   node tools/state.mjs frame <dir> <shotId> approve|reject|replace [--note ...]     per-frame storyboard decisions
//   node tools/state.mjs change <dir> <kind> [--shot S03] --note "..."                final-edit requests (replace-shot, music, captions, transition, pacing, fix)
//   node tools/state.mjs check <dir> <stage>                    exit 1 if an earlier gate is open, rejected or STALE (its files changed after approval)
//   node tools/state.mjs seal <dir> <video.mp4>                 writes <video>.approval.json with the whole approval chain (TEST projects get a TEST receipt)
// Honest limit: nothing can stop an agent from editing state.json by hand. This makes the legitimate path explicit, auditable and
// tamper-evident (quotes + file fingerprints), and `seal` refuses to certify a video whose gates are not all approved.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

export const STAGES = ['intake', 'style', 'topic', 'research', 'script', 'script_critic', 'storyboard', 'storyboard_critic', 'audio', 'typography', 'captions', 'assets', 'production', 'build', 'visual_critic', 'audio_critic', 'final', 'deliver'];
// Gates a user may hand over by saying e.g. "run through to the storyboard contact sheet". Everything that shapes what they will SEE or HEAR stays personal.
export const DELEGABLE = ['intake', 'style', 'topic', 'research', 'script', 'script_critic'];
export const GATES = ['intake', 'style', 'topic', 'research', 'script', 'script_critic', 'storyboard', 'audio', 'typography', 'captions', 'production', 'final'];
export const ARTIFACTS = {
  intake: ['brief.json'], style: ['style-selection.json'], topic: ['topic/topic.json'], research: ['research/research.json'], script: ['script/script.json'],
  script_critic: ['script/script.json', 'review/script-critic.json'], storyboard: ['storyboard/storyboard.json'], audio: ['audio/audio-plan.json', 'audio/voice-choice.json'],
  typography: ['typography/typography.json'], captions: ['typography/captions.json'], production: ['storyboard/storyboard.json', 'audio/audio-plan.json', 'typography/typography.json', 'typography/captions.json'], final: [],
};
const file = (dir) => path.join(dir, 'state.json'), now = () => new Date().toISOString();
export const load = (dir) => JSON.parse(fs.readFileSync(file(dir), 'utf8'));
const save = (dir, s) => fs.writeFileSync(file(dir), JSON.stringify(s, null, 1));
const sha = (dir, f) => { const p = path.join(dir, f); return fs.existsSync(p) ? crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16) : 'missing'; };

export function init(dir, opt = false) {
  const test = typeof opt === 'object' ? !!opt.test : !!opt; fs.mkdirSync(dir, { recursive: true });
  const s = { project: path.basename(path.resolve(dir)), mode: test ? 'test' : 'ask', created: now(), stages: Object.fromEntries(STAGES.map((k) => [k, { status: 'pending' }])), revisions: [] };
  save(dir, s); return s;
}
export function set(dir, stage, status, extra = {}) {
  if (!STAGES.includes(stage)) throw new Error(`unknown stage "${stage}". Stages: ${STAGES.join(', ')}`);
  const s = load(dir); s.stages[stage] = { ...s.stages[stage], status, at: now(), ...extra }; save(dir, s); return s;
}
/** the first gate before `stage` that is not validly approved: { gate, why } or null */
export function openGate(dir, stage) {
  const s = load(dir); if (s.mode === 'test') return null;
  for (const k of STAGES.slice(0, STAGES.indexOf(stage))) {
    if (!GATES.includes(k)) continue; const st = s.stages[k];
    if (st.status !== 'approved') return { gate: k, why: st.status === 'changes_requested' ? 'the user asked for changes that are not done yet' : `status is ${st.status}` };
    for (const [f, h] of Object.entries(st.fingerprints || {})) if (sha(dir, f) !== h) return { gate: k, why: `${f} changed after the user approved it: show it again and get a new approval` };
  }
  return null;
}
const opt = (a, k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const a = process.argv.slice(2), [cmd, dir, stage] = a;
  try {
    if (cmd === 'init') {
      const test = a.includes('--test') || a.includes('--auto'); if (test && process.env.REEL_TEST_MODE !== '1') { console.error('--test is only for toolkit self-tests (set REEL_TEST_MODE=1). A real project needs real approvals.'); process.exit(2); }
      console.log(JSON.stringify(init(dir, { test }).mode));
    } else if (cmd === 'show') {
      const s = load(dir); console.log(`${s.project}  mode: ${s.mode}${s.mode === 'test' ? '  (TEST PROJECT: nothing here is approved by a user)' : ''}`);
      for (const k of STAGES) { const st = s.stages[k]; console.log(`${k.padEnd(18)} ${String(st.status).padEnd(18)}${GATES.includes(k) ? (st.status === 'approved' ? `approved${st.by === "user-delegation" ? " [DELEGATED]" : ""} ${st.at} ${st.quote ? `"${st.quote.slice(0, 50)}"` : ''}` : '(needs your approval)') : ''}`); }
      const fr = s.stages.storyboard.frames; if (fr) console.log('storyboard frames: ' + Object.entries(fr).map(([k, v]) => `${k}=${v.status}`).join(' '));
    } else if (cmd === 'start') set(dir, stage, 'in_progress');
    else if (cmd === 'done') set(dir, stage, 'done');
    else if (cmd === 'request') {
      if (!GATES.includes(stage)) throw new Error(`"${stage}" is not an approval gate. Gates: ${GATES.join(', ')}`);
      const arts = (opt(a, 'artifacts', '') ? opt(a, 'artifacts').split(',') : ARTIFACTS[stage] || []), missing = arts.filter((f) => !fs.existsSync(path.join(dir, f)));
      if (missing.length) { console.error(`cannot ask for approval of "${stage}": these files do not exist yet: ${missing.join(', ')}`); process.exit(1); }
      const fingerprints = Object.fromEntries(arts.map((f) => [f, sha(dir, f)])), q = opt(a, 'question', `Do you approve "${stage}"?`), ch = (opt(a, 'choices', '') || '').split(';').filter(Boolean);
      set(dir, stage, 'awaiting_approval', { fingerprints, artifacts: arts, question: q });
      const md = `# Approval needed: ${stage}\n\n${q}\n\nFiles to look at:\n${arts.map((f) => `- ${f}`).join('\n') || '- (none)'}\n\n${ch.length ? 'Choices:\n' + ch.map((c) => `- ${c}`).join('\n') + '\n\n' : ''}Reply with a number, "yes", or what to change.\n`;
      fs.mkdirSync(path.join(dir, 'review/approvals'), { recursive: true }); fs.writeFileSync(path.join(dir, 'review/approvals', `${stage}.md`), md);
      console.log(`STOP: ask the user to approve "${stage}" (see review/approvals/${stage}.md) and wait for their answer. Do not continue.`);
    } else if (cmd === 'approve') {
      const deleg = a.includes('--delegated'); if (deleg && !DELEGABLE.includes(stage)) { console.error(`"${stage}" cannot be delegated: the user must approve it themselves. Delegable: ${DELEGABLE.join(', ')}`); process.exit(1); }
      const s = load(dir), st = s.stages[stage]; if (!st) throw new Error(`unknown stage "${stage}"`);
      if (st.status !== 'awaiting_approval') { console.error(`"${stage}" is ${st.status}: it must be shown to the user with "request" first.`); process.exit(1); }
      const quote = opt(a, 'quote', ''); if (quote.trim().length < 2) { console.error('approve needs --quote "<what the user actually said>"'); process.exit(1); }
      if (stage === 'storyboard') { const fr = st.frames || {}, sb = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard/storyboard.json'), 'utf8')), open = sb.shots.filter((x) => fr[x.id]?.status !== 'approved').map((x) => x.id); if (open.length) { console.error(`storyboard frames not approved one by one: ${open.join(', ')}. Use: state.mjs frame <dir> <shot> approve`); process.exit(1); } }
      for (const [f, h] of Object.entries(st.fingerprints || {})) if (sha(dir, f) !== h) { console.error(`${f} changed since it was shown to the user: request approval again.`); process.exit(1); }
      set(dir, stage, 'approved', { by: deleg ? 'user-delegation' : 'user', quote, choice: opt(a, 'choice', null) });   // delegated = the user said "run through to X" and the quote is that instruction
    } else if (cmd === 'reject') {
      const note = opt(a, 'note', ''); if (!note) { console.error('reject needs --note "what to change"'); process.exit(1); }
      const s = load(dir); s.revisions.push({ at: now(), stage, kind: 'rejected', note }); s.stages[stage] = { ...s.stages[stage], status: 'changes_requested', at: now(), note }; save(dir, s);
    } else if (cmd === 'frame') {
      const [, , shot, verb] = a; if (!['approve', 'reject', 'replace', 'pending'].includes(verb)) { console.error('frame <dir> <shot> approve|reject|replace|pending [--note]'); process.exit(2); }
      const s = load(dir), sb = s.stages.storyboard; sb.frames = sb.frames || {}; sb.frames[shot] = { status: verb === 'approve' ? 'approved' : verb === 'reject' ? 'rejected' : verb === 'pending' ? 'pending' : 'replace_requested', at: now(), note: opt(a, 'note', '') };
      if (verb !== 'approve') { if (verb === 'pending') { s.revisions.push({ at: now(), stage: 'storyboard', kind: 'frame-edited', shot, note: opt(a, 'note', '') }); if (sb.status === 'approved') sb.status = 'changes_requested'; save(dir, s); process.exit(0); } s.revisions.push({ at: now(), stage: 'storyboard', kind: `frame-${verb}`, shot, note: opt(a, 'note', '') }); if (sb.status === 'approved' || sb.status === 'awaiting_approval') sb.status = 'changes_requested'; }
      save(dir, s);
    } else if (cmd === 'change') {
      const kind = stage, note = opt(a, 'note', ''); if (!['replace-shot', 'music', 'captions', 'transition', 'pacing', 'fix'].includes(kind) || !note) { console.error('change <dir> replace-shot|music|captions|transition|pacing|fix [--shot S03] --note "..."'); process.exit(2); }
      const s = load(dir); s.revisions.push({ at: now(), stage: 'final', kind, shot: opt(a, 'shot', null), note }); s.stages.final = { ...s.stages.final, status: 'changes_requested', at: now(), note }; save(dir, s);
    } else if (cmd === 'check') {
      const g = openGate(dir, stage); if (g) { console.error(`BLOCKED: "${g.gate}" is not validly approved (${g.why}). Ask the user first.`); process.exit(1); }
      console.log(load(dir).mode === 'test' ? 'ok (TEST project)' : 'ok');
    } else if (cmd === 'seal') {
      const video = a[2] || stage; const s = load(dir), open = openGate(dir, 'deliver'), finalOk = s.mode === 'test' || s.stages.final.status === 'approved';
      if (s.mode !== 'test' && (open || !finalOk)) { console.error(`cannot certify: ${open ? `"${open.gate}" is not approved (${open.why})` : '"final" is not approved'}`); process.exit(1); }
      const receipt = { video: path.basename(video), sealed_at: now(), test_project: s.mode === 'test', approvals: Object.fromEntries(GATES.map((k) => [k, { status: s.stages[k].status, at: s.stages[k].at, quote: s.stages[k].quote || null, by: s.stages[k].by || null, choice: s.stages[k].choice || null }])), revisions: s.revisions.length };
      fs.writeFileSync(video.replace(/\.[^.]+$/, '') + (s.mode === 'test' ? '.TEST.approval.json' : '.approval.json'), JSON.stringify(receipt, null, 1)); console.log(s.mode === 'test' ? 'TEST receipt written (this video was NOT approved by a user)' : 'approval receipt written');
    } else { console.error('commands: init show start done request approve reject frame change check seal'); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
