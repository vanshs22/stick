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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { check, loadSchema } from './validate.mjs';

// FIVE approval gates, the decisions only a person can make. Everything else is checked automatically by tools and critics (and refused if it fails), never asked of the user:
//   direction (brief, style, topic, research angle) -> script_review -> storyboard_review (frames one by one + assets) -> sound_review (voice, music, type, captions) -> final
export const STAGES = ['intake', 'style', 'topic', 'research', 'direction', 'script', 'script_critic', 'script_review', 'visual_concept', 'storyboard', 'storyboard_critic', 'assets', 'storyboard_review', 'audio', 'typography', 'captions', 'sound_review', 'production', 'build', 'visual_critic', 'audio_critic', 'editorial_critic', 'final', 'deliver'];
// Gates a user may hand over by saying e.g. "run through to the storyboard contact sheet". Everything that shapes what they will SEE or HEAR stays personal.
export const DELEGABLE = ['direction', 'script_review'];
export const GATES = ['direction', 'script_review', 'storyboard_review', 'sound_review', 'final'];
export const GATE_LABEL = { direction: 'Direction (brief, style, topic, research angle)', script_review: 'Script', storyboard_review: 'Storyboard frames and assets', sound_review: 'Voice, music, type and captions', final: 'Final film' };
const exists = (dir, f) => fs.existsSync(path.join(dir, f)), ls = (dir, d, re) => (exists(dir, d) ? fs.readdirSync(path.join(dir, d)).filter((f) => re.test(f)).sort().map((f) => `${d}/${f}`) : []);
const newest = (dir, d, re) => { const l = ls(dir, d, re).map((f) => [f, fs.statSync(path.join(dir, f)).mtimeMs]).sort((x, y) => y[1] - x[1]); return l[0]?.[0]; };
/** the files the user is shown for each gate. A function = computed when approval is requested (the final video and the stills only exist by then). */
export const ARTIFACTS = {
  direction: (dir) => ['brief.json', 'style-selection.json', 'topic/topic.json', 'research/research.json', ...ls(dir, 'review', /^styles?.*\.jpe?g$/)],
  script_review: ['script/script.json', 'script/viral-plan.json', 'review/critics/script.json', 'review/critics/viral.json', 'review/critics/research.json'],
  storyboard_review: (dir) => ['storyboard/storyboard.json', 'storyboard/visual-concept.json', 'assets/asset-selection.json', 'review/assets-sheet.jpg', ...ls(dir, 'review/storyboard-sheets', /\.jpe?g$/), ...ls(dir, 'review/storyboard', /^S\d+\.png$/)],
  sound_review: ['audio/audio-plan.json', 'audio/voice-choice.json', 'typography/typography.json', 'typography/captions.json'],
  final: (dir, a = []) => { const v = (a.includes('--video') && a[a.indexOf('--video') + 1]) || newest(dir, 'renders', /^(?!.*\.raw\.mp4$).*\.mp4$/); if (!v) return []; const base = path.basename(v).replace(/\.mp4$/, ''), vv = v.includes('/') ? v : `renders/${v}`; return [vv, `renders/${base}.qa.json`, newest(dir, 'review', /^final.*\.jpe?g$/), 'typography/captions.json', 'data/timeline.json', 'renders/report.md'].filter(Boolean); },
};
const file = (dir) => path.join(dir, 'state.json'), now = () => new Date().toISOString();
export const load = (dir) => JSON.parse(fs.readFileSync(file(dir), 'utf8'));
const save = (dir, s) => fs.writeFileSync(file(dir), JSON.stringify(s, null, 1));
const shotHash = (dir, id) => { try { const sb = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard/storyboard.json'), 'utf8')), sh = sb.shots.find((x) => x.id === id); return sh ? crypto.createHash('sha256').update(JSON.stringify(sh)).digest('hex').slice(0, 16) : 'missing'; } catch { return 'missing'; } };
const sha = (dir, f) => { const p = path.join(dir, f); return fs.existsSync(p) ? crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16) : 'missing'; };

/** Tamper evidence: every approval is signed over the previous approval, its quote, time and file fingerprints. Editing state.json by hand breaks the chain.
 *  This is evidence, not security: a determined agent could recompute it. It stops the casual shortcut (setting "approved" in the JSON) and the receipt says which approvals were made through `approve`. */
export const sigOf = (prev, stage, st) => crypto.createHash('sha256').update([prev, stage, st.at, st.by, st.quote, JSON.stringify(st.fingerprints || {})].join('|')).digest('hex').slice(0, 20);
const prevSig = (s, stage) => { const i = GATES.indexOf(stage); for (let k = i - 1; k >= 0; k--) if (s.stages[GATES[k]]?.sig) return s.stages[GATES[k]].sig; return ''; };
export function init(dir, opt = false) {
  const test = typeof opt === 'object' ? !!opt.test : !!opt; fs.mkdirSync(dir, { recursive: true });
  const s = { project: path.basename(path.resolve(dir)), mode: test ? 'test' : 'ask', sig_version: 1, created: now(), stages: Object.fromEntries(STAGES.map((k) => [k, { status: 'pending' }])), revisions: [] };
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
    if (s.sig_version && st.sig !== sigOf(prevSig(s, k), k, st)) return { gate: k, why: 'its approval record does not match its signature: state.json was edited by hand. Show the stage to the user and approve it with tools/state.mjs approve' };
    for (const [f, h] of Object.entries(st.fingerprints || {})) if (sha(dir, f) !== h) return { gate: k, why: `${f} changed after the user approved it: show it again and get a new approval` };
  }
  return null;
}
/** a gate may only be put to the user when its evidence exists and is not self-evidently bad */
function evidenceProblems(dir, stage, arts) {
  const out = [], rd = (f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } };
  const crit = (n) => { const c = rd(`review/critics/${n}.json`); return c; }, noMajor = (n, label) => { const c = crit(n); if (!c) out.push(`the ${label} critic has not run (node tools/critique.mjs <P> ${n})`); else if (c.verdict === 'fail' || (c.findings || []).some((f) => f.severity === 'blocker' || f.severity === 'major')) out.push(`the ${label} critic still has ${(c.findings || []).filter((f) => ['blocker', 'major'].includes(f.severity)).length} blocker/major finding(s): fix them first, the user is not asked to judge what a tool can refuse`); };
  if (stage === 'direction') { const b = rd('brief.json'); if (!b) out.push('no brief.json'); else { const errs = check(loadSchema('production-brief'), b); if (errs.length) out.push(`brief.json does not match its schema: ${errs.slice(0, 3).join(' | ')}`); } noMajor('research', 'research'); }
  if (stage === 'script_review') { noMajor('script', 'script'); noMajor('research', 'research'); const pl = rd('script/viral-plan.json'); if (!pl) out.push('no script/viral-plan.json (node tools/script_studio.mjs new <P>)'); else if (!pl.waived) noMajor('viral', 'viral-script'); }
  if (stage === 'storyboard_review') {
    if (!arts.some((f) => /^review\/storyboard\/S\d+\.png$/.test(f))) out.push('no preview stills in review/storyboard/ (run tools/preview_shots.mjs: the user approves IMAGES, not JSON)'); if (!arts.some((f) => /storyboard-sheets\/.*\.jpe?g$/.test(f))) out.push('no contact sheet in review/storyboard-sheets/ (run tools/storyboard_review.mjs)');
    const m = rd('assets/asset-selection.json'); if (m && !(m.items || []).length) out.push('assets/asset-selection.json lists no assets'); if (m && m.problems?.length) out.push(`asset-selection.json reports problems: ${m.problems.slice(0, 2).join(' | ')}`);
    const vc = rd('storyboard/visual-concept.json'); if (!vc || vc.status !== 'ready') out.push('storyboard/visual-concept.json is missing or not "ready"'); noMajor('storyboard', 'storyboard'); noMajor('visual', 'visual-intent');
  }
  if (stage === 'sound_review') {
    const pl = rd('audio/audio-plan.json'); if (!pl || /DRAFT/.test(pl.status || '')) out.push('the audio plan is still a DRAFT: choose voice and music (node tools/choose.mjs <P> voice ...)');
    if (pl && /music/.test(pl.mode || '') && (!pl.music || /^none$/i.test(pl.music.bed || '') || /^none$/i.test(pl.music.direction || ''))) out.push(`audio mode is "${pl.mode}" but the plan has no background music: choose a bed, or declare mode "narrated" on purpose`);
    const vc = rd('audio/voice-choice.json'); if (vc && vc.sfx === 'none' && !vc.sfx_reason) out.push('sound effects are switched off with no reason (voice-choice.json "sfx_reason"): sound effects are part of the film');
  }
  if (stage === 'final') {
    const v = arts.find((f) => /\.mp4$/.test(f)), q = arts.find((f) => /\.qa\.json$/.test(f)); if (!v) out.push('no final MP4 in renders/'); if (!q) out.push('no <video>.qa.json: the final QA did not run');
    if (!arts.some((f) => /^review\/final.*\.jpe?g$/.test(f))) out.push('no contact sheet review/final*.jpg (run tools/qa/contact_sheet.mjs)'); if (!arts.includes('renders/report.md')) out.push('no renders/report.md (run tools/package_post.mjs)');
    const qa = q && rd(q); if (qa && !qa.pass) out.push('final QA FAILED: ' + qa.checks.filter((c) => !c.ok && c.level !== 'warn').map((c) => c.name).join(', ')); if (qa?.preview) out.push('the video is a PREVIEW (half-size or --estimate): render it at scale 1 with the real voice before final approval');
    const sb = rd('state.json'); if (sb && ['visual_critic', 'audio_critic', 'editorial_critic'].some((k) => !rd(`review/critics/${{ visual_critic: 'video', audio_critic: 'voice', editorial_critic: 'final' }[k]}.json`))) out.push('the video/voice/final critic reports are missing (tools/critique.mjs <P> all)');
  }
  return out;
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
      const arts = (opt(a, 'artifacts', '') ? opt(a, 'artifacts').split(',') : typeof ARTIFACTS[stage] === 'function' ? ARTIFACTS[stage](dir, a) : ARTIFACTS[stage] || []), missing = arts.filter((f) => !fs.existsSync(path.join(dir, f)));
      const evidence = evidenceProblems(dir, stage, arts); if (evidence.length) { console.error(`cannot ask for approval of "${stage}": ${evidence.join('; ')}`); process.exit(1); }
      if (missing.length) { console.error(`cannot ask for approval of "${stage}": these files do not exist yet: ${missing.join(', ')}`); process.exit(1); }
      const fingerprints = Object.fromEntries(arts.map((f) => [f, sha(dir, f)])), q = opt(a, 'question', `Do you approve "${stage}"?`), ch = (opt(a, 'choices', '') || '').split(';').filter(Boolean);
      set(dir, stage, 'awaiting_approval', { fingerprints, artifacts: arts, question: q });
      const md = `# Approval needed: ${stage}\n\n${q}\n\nFiles to look at:\n${arts.map((f) => `- ${f}`).join('\n') || '- (none)'}\n\n${ch.length ? 'Choices:\n' + ch.map((c) => `- ${c}`).join('\n') + '\n\n' : ''}Reply with a number, "yes", or what to change.\n`;
      fs.mkdirSync(path.join(dir, 'review/approvals'), { recursive: true }); fs.writeFileSync(path.join(dir, 'review/approvals', `${stage}.md`), md);
      console.log(`STOP: ask the user to approve "${stage}" (see review/approvals/${stage}.md) and wait for their answer. Do not continue.`);
    } else if (cmd === 'approve') {
      const deleg = a.includes('--delegated'); if (deleg && !DELEGABLE.includes(stage)) { console.error(`"${stage}" cannot be delegated: the user must approve it themselves. Delegable: ${DELEGABLE.join(', ')}`); process.exit(1); }
      const s = load(dir), st = s.stages[stage]; if (!st) throw new Error(`unknown stage "${stage}"`);
      if (st.status === 'approved') { console.error(`"${stage}" is already approved (${st.at}). Nothing to do. To change it, edit the files and run "request" again.`); process.exit(1); }
      if (st.status !== 'awaiting_approval') { console.error(`"${stage}" is ${st.status}: it must be shown to the user with "request" first.`); process.exit(1); }
      const quote = opt(a, 'quote', ''); if (quote.trim().length < 2) { console.error('approve needs --quote "<what the user actually said>"'); process.exit(1); }
      if (stage === 'storyboard_review') { const fr = s.stages.storyboard.frames || {}, sb = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard/storyboard.json'), 'utf8')), open = sb.shots.filter((x) => fr[x.id]?.status !== 'approved' || fr[x.id].shot_sha !== shotHash(dir, x.id) || fr[x.id].image_sha !== sha(dir, fr[x.id].image)).map((x) => x.id); if (open.length) { console.error(`storyboard frames not approved one by one, or changed since their approval (shot or still differs): ${open.join(', ')}. Use: state.mjs frame <dir> <shot> approve`); process.exit(1); } }
      for (const [f, h] of Object.entries(st.fingerprints || {})) if (sha(dir, f) !== h) { console.error(`${f} changed since it was shown to the user: request approval again.`); process.exit(1); }
      { const rec = { at: now(), by: deleg ? 'user-delegation' : 'user', quote, fingerprints: st.fingerprints }; set(dir, stage, 'approved', { by: rec.by, quote, choice: opt(a, 'choice', null), at: rec.at, ...(s.sig_version ? { sig: sigOf(prevSig(s, stage), stage, rec) } : {}) }); }   // delegated = the user said "run through to X" and the quote is that instruction
    } else if (cmd === 'bundle') {
      // ONE question for the blueprint: storyboard frames + assets (storyboard_review) AND voice, music, type, captions (sound_review). Each gate is still requested and approved on its own with the user's own words,
      // through the same code path (signed chain, fingerprints, stale detection): the user just answers once. `bundle <dir> request [--question ..]` / `bundle <dir> approve --quote ".." [--all-frames]`
      const BUNDLE = ['storyboard_review', 'sound_review'], verb = a[2], self = fileURLToPath(import.meta.url), call = (...x) => spawnSync('node', [self, ...x], { encoding: 'utf8' });
      if (verb === 'request') { const q = opt(a, 'question', 'Here are the frames, the assets, the voice, the music, the type and the captions: is this the film you want me to build? (answer once: yes, or what to change)'); let md = `# Blueprint approval (one answer)\n\n${q}\n\n`; for (const g of BUNDLE) { const r = call('request', dir, g, '--question', q); if (r.status) { console.error((r.stderr || r.stdout).trim()); process.exit(1); } md += `## ${GATE_LABEL[g]}\n${(s0 => (s0.stages[g].artifacts || []).map((f) => `- ${f}`).join('\n'))(load(dir))}\n\n`; } fs.writeFileSync(path.join(dir, 'review/approvals/blueprint.md'), md); console.log('STOP: ask the user the ONE blueprint question (review/approvals/blueprint.md) and wait. Do not continue.'); }
      else if (verb === 'approve') { const quote = opt(a, 'quote', ''); if (quote.trim().length < 2) { console.error('approve needs --quote "<what the user actually said>"'); process.exit(1); }
        if (a.includes('--all-frames')) { const sb = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard/storyboard.json'), 'utf8')); for (const x of sb.shots) { const r = call('frame', dir, x.id, 'approve', '--note', `blueprint: ${quote}`); if (r.status) { console.error((r.stderr || r.stdout).trim()); process.exit(1); } } }   // only when the user's answer covers every frame they were shown
        for (const g of BUNDLE) { const r = call('approve', dir, g, '--quote', quote); if (r.status) { console.error((r.stderr || r.stdout).trim()); process.exit(1); } } console.log(`blueprint approved (${BUNDLE.join(' + ')}) with: "${quote}"`); }
      else { console.error('usage: state.mjs bundle <dir> request|approve [--question ..] [--quote ..] [--all-frames]'); process.exit(2); }
    } else if (cmd === 'reject') {
      const note = opt(a, 'note', ''); if (!note) { console.error('reject needs --note "what to change"'); process.exit(1); }
      const s = load(dir); s.revisions.push({ at: now(), stage, kind: 'rejected', note }); s.stages[stage] = { ...s.stages[stage], status: 'changes_requested', at: now(), note }; save(dir, s);
    } else if (cmd === 'frame') {
      const [, , shot, verb] = a; if (!['approve', 'reject', 'replace', 'pending'].includes(verb)) { console.error('frame <dir> <shot> approve|reject|replace|pending [--note]'); process.exit(2); }
      const s = load(dir), sb = s.stages.storyboard, gate = s.stages.storyboard_review; sb.frames = sb.frames || {}; const img = `review/storyboard/${shot}.png`;
      if (verb === 'approve' && !fs.existsSync(path.join(dir, img))) { console.error(`${img} does not exist: the user can only approve a frame they have SEEN. Run tools/preview_shots.mjs first.`); process.exit(1); }
      if (verb === 'approve' && shotHash(dir, shot) === 'missing') { console.error(`shot ${shot} is not in storyboard.json`); process.exit(1); }
      sb.frames[shot] = { status: verb === 'approve' ? 'approved' : verb === 'reject' ? 'rejected' : verb === 'pending' ? 'pending' : 'replace_requested', at: now(), note: opt(a, 'note', ''), ...(verb === 'approve' ? { image: img, image_sha: sha(dir, img), shot_sha: shotHash(dir, shot), quote: opt(a, 'quote', '') } : {}) };
      if (verb !== 'approve') { if (verb === 'pending') { s.revisions.push({ at: now(), stage: 'storyboard', kind: 'frame-edited', shot, note: opt(a, 'note', '') }); if (gate.status === 'approved') gate.status = 'changes_requested'; save(dir, s); process.exit(0); } s.revisions.push({ at: now(), stage: 'storyboard', kind: `frame-${verb}`, shot, note: opt(a, 'note', '') }); if (gate.status === 'approved' || gate.status === 'awaiting_approval') gate.status = 'changes_requested'; }
      save(dir, s);
    } else if (cmd === 'change') {
      const kind = stage, note = opt(a, 'note', ''); if (!['replace-shot', 'music', 'captions', 'transition', 'pacing', 'fix'].includes(kind) || !note) { console.error('change <dir> replace-shot|music|captions|transition|pacing|fix [--shot S03] --note "..."'); process.exit(2); }
      const s = load(dir); s.revisions.push({ at: now(), stage: 'final', kind, shot: opt(a, 'shot', null), note }); s.stages.final = { ...s.stages.final, status: 'changes_requested', at: now(), note }; save(dir, s);
    } else if (cmd === 'check') {
      const g = openGate(dir, stage); if (g) { console.error(`BLOCKED: "${g.gate}" is not validly approved (${g.why}). Ask the user first.`); process.exit(1); }
      console.log(load(dir).mode === 'test' ? 'ok (TEST project)' : 'ok');
    } else if (cmd === 'seal') {
      if (!a[2]) { console.error('usage: state.mjs seal <projectDir> <renders/video.mp4>   (the video the user approved as "final")'); process.exit(2); }
      const video = a[2], vrel = path.relative(dir, path.resolve(video)).split(path.sep).join('/'), s = load(dir), open = openGate(dir, 'deliver'), test = s.mode === 'test', fin = s.stages.final;
      if (!fs.existsSync(video)) { console.error(`cannot certify: ${video} does not exist`); process.exit(1); }
      if (!test) {
        if (open || fin.status !== 'approved') { console.error(`cannot certify: ${open ? `"${open.gate}" is not approved (${open.why})` : '"final" is not approved'}`); process.exit(1); }
        if (!(vrel in (fin.fingerprints || {}))) { console.error(`cannot certify: the final approval did not cover ${vrel}. It covered: ${Object.keys(fin.fingerprints || {}).join(', ') || 'nothing'}. Request final approval again with this video.`); process.exit(1); }
        const qj = (() => { try { return JSON.parse(fs.readFileSync(video.replace(/\.mp4$/, '.qa.json'), 'utf8')); } catch { return null; } })();
        if (!qj || !qj.pass || qj.preview) { console.error('cannot certify: the final QA report is missing, failed, or the video is a preview'); process.exit(1); }
      }
      const full = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'), qaf = video.replace(/\.mp4$/, '.qa.json');
      const receipt = { video: path.basename(video), video_sha256: full(video), qa: fs.existsSync(qaf) ? { file: path.basename(qaf), sha256: full(qaf), ...(({ pass, preview, delivery_ready, measured }) => ({ pass, preview, delivery_ready, measured }))(JSON.parse(fs.readFileSync(qaf, 'utf8'))) } : null,
        sealed_at: now(), test_project: test, approved_artifacts: fin.fingerprints || {},
        approvals: Object.fromEntries(GATES.map((k) => [k, { status: s.stages[k].status, at: s.stages[k].at, quote: s.stages[k].quote || null, by: s.stages[k].by || null, choice: s.stages[k].choice || null, fingerprints: s.stages[k].fingerprints || {} }])), revisions: s.revisions.length };
      fs.writeFileSync(video.replace(/\.[^.]+$/, '') + (test ? '.TEST.approval.json' : '.approval.json'), JSON.stringify(receipt, null, 1)); console.log(test ? 'TEST receipt written (this video was NOT approved by a user)' : 'approval receipt written (bound to the video sha256, the QA report and every file the user was shown)');
    } else { console.error('commands: init show start done request approve reject frame change check seal'); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
