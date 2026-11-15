#!/usr/bin/env node
// The Director. One video request goes through a fixed team, each worker followed by its critic, with a human approval gate before the expensive render:
//   research -> script -> style -> storyboard -> sound -> prepare (voice, timing, mix, preview) -> preview check -> APPROVAL -> render -> final check -> learn
// Every stage is saved in jobs/<id>/job.json, so a stopped job resumes where it was.
//   node studio.mjs new "brief text" [--script file] [--style auto|id] [--face synth|video --video clip.mp4] [--sec 40] [--cta WORD] [--preset full|fast|turbo] [--auto]
//   node studio.mjs status <id> | list | approve <id> | revise <id> "notes" | feedback <id> good|bad "notes"
import fs from 'node:fs';
import path from 'node:path';
import { JOBS, PROJECTS, loadJob, saveJob, jdir, proj, say, withCritic, readJSON, writeJSON } from './agents/core.mjs';
import { trendResearcher } from './agents/research.mjs';
import { scriptWriter, scriptCritic } from './agents/writer.mjs';
import { pickStyle } from './agents/styler.mjs';
import { storyboard, storyboardCritic } from './agents/storyboard.mjs';
import { chooseSound, soundCritic } from './agents/sound.mjs';
import { prepare, render } from './agents/editor.mjs';
import { previewCritic, finalCritic } from './agents/critics.mjs';
import { record, feedback } from './agents/learning.mjs';

const STAGES = ['research', 'script', 'style', 'storyboard', 'sound', 'prepare', 'preview', 'approval', 'render', 'final', 'learn'];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24).replace(/-$/, '') || 'video';

export function newJob(brief) {
  const id = `${slug(brief.topic || brief.text)}-${Date.now().toString(36).slice(-4)}`;
  const job = { id, created: new Date().toISOString(), status: 'running', stage: 'research', brief: { targetSec: 40, preset: 'fast', ...brief }, artifacts: {}, stages: {}, log: [], llm: { calls: 0, max: +(process.env.STUDIO_LLM_MAX || 6), by: {} } };
  fs.mkdirSync(jdir(job), { recursive: true }); saveJob(job); return job;
}

const WORK = {
  async research(job) { if (job.brief.script) return say(job, 'research', 'skipped: you gave a script'); job.artifacts.research = await trendResearcher(job); say(job, 'research', `${job.artifacts.research.titles.length} competitor titles${job.artifacts.research.skipped.length ? ' (' + job.artifacts.research.skipped[0] + ')' : ''}`); },
  async script(job) {
    const { art, rep } = await withCritic(job, 'script', (fb) => scriptWriter(job, fb || (job.revisions?.length ? { issues: [{ msg: job.brief.notes }] } : null)), (a) => scriptCritic(a, job), { max: 2, pass: 72 });
    job.artifacts.script = art.text; say(job, 'script', `by ${art.by}, viral ${rep.viral}/100`);
  },
  async style(job) { job.style = pickStyle(job, job.artifacts.script); say(job, 'style', `${job.style.id} (${job.style.why})`); },
  async storyboard(job) {
    let last = null; const work = async (fb) => { if (fb) { const w = await scriptWriter(job, fb); if (w.text === job.artifacts.script) return null; job.artifacts.script = w.text; } const sb = await storyboard(job); last = { ...sb, scriptText: job.artifacts.script }; return last; };
    let { art, rep } = await withCritic(job, 'storyboard', async (fb) => (await work(fb)) || last, (s) => storyboardCritic(s, job), { max: 2, pass: 78 });
    if (art.scriptText !== job.artifacts.script) { job.artifacts.script = art.scriptText; art = { ...(await storyboard(job)), scriptText: art.scriptText }; }   // the better attempt was the first one: rebuild it
    job.artifacts.storyboard = art; say(job, 'storyboard', `${art.beats} beats, ${art.seconds}s, planner: ${art.ai}, style ${job.style.id}/${job.style.family}`);
  },
  async sound(job) { job.artifacts.sound = chooseSound(job); say(job, 'sound', `music ${job.artifacts.sound.music}, sfx x${job.artifacts.sound.sfx} (${job.artifacts.sound.why})`); },
  async prepare(job) { job.artifacts.prepared = prepare(job); const r = soundCritic(job); job.stages.sound = { ...job.stages.sound, score: r.score, issues: r.issues, stats: r.stats }; say(job, 'prepare', `sheet ${job.artifacts.prepared.sheet}; sound check ${r.score}/100 ${JSON.stringify(r.stats)}`); },
  async preview(job) { const r = await previewCritic(job); job.stages.preview = { score: r.score, issues: r.issues, stats: r.stats }; say(job, 'preview', `${r.score}/100 ${r.stats ? JSON.stringify(r.stats) : r.note || r.issues.map((i) => i.code)}`); },
  async approval(job) {
    if (job.approval === 'approved') return say(job, 'approval', 'approved by you');
    const scores = Object.fromEntries(Object.entries(job.stages).map(([k, v]) => [k, v.score]).filter(([, v]) => v != null)), ok = Object.values(scores).every((v) => v >= 70);
    const req = { status: 'pending', sheet: job.artifacts.prepared.sheet, scores, style: job.style.id, seconds: job.artifacts.storyboard.seconds, music: job.artifacts.sound.music, script: job.artifacts.script.split('\n').slice(0, 3).join(' / ') + ' ...', ask: `Approve the plan and render the ${job.brief.preset} video?` };
    if (job.brief.auto && ok) { req.status = 'approved'; req.by = 'auto (all critics >= 70)'; say(job, 'approval', req.by); }
    writeJSON(path.join(jdir(job), 'approval.json'), req); job.approval = req.status;
    if (req.status !== 'approved') { job.status = 'waiting_approval'; say(job, 'approval', `waiting for you. Look at ${req.sheet}\n  approve: node studio.mjs approve ${job.id}\n  change : node studio.mjs revise ${job.id} "make it shorter, style editorial-explainer"`); return 'wait'; }
  },
  async render(job) { const t0 = Date.now(), r = render(job); job.artifacts.render = r; job.seconds = Math.round((Date.now() - t0) / 1000); say(job, 'render', `${r.video} in ${r.seconds}s`); },
  async final(job) { const rep = finalCritic(job.artifacts.render, job); job.stages.final = { score: rep.score, issues: rep.issues }; say(job, 'final', `${rep.score}/100 ${rep.issues.map((i) => i.code).join(', ') || 'QA passed'}`); if (rep.score < 60) throw new Error('final check failed: ' + rep.issues.map((i) => i.msg).join('; ')); },
  async learn(job) { record(job); say(job, 'learn', 'run saved to memory/runs.jsonl'); },
};

export async function run(job) {
  job.status = 'running';
  for (let i = STAGES.indexOf(job.stage); i < STAGES.length; i++) {
    job.stage = STAGES[i]; saveJob(job);
    try { if ((await WORK[job.stage](job)) === 'wait') { saveJob(job); return job; } }
    catch (e) { job.status = 'failed'; job.error = String(e.message || e).slice(0, 1500); say(job, job.stage, 'FAILED: ' + job.error); saveJob(job); return job; }
  }
  job.status = 'done'; job.stage = 'done'; saveJob(job);
  console.log(`\nDONE ${job.artifacts.render.video}\nLLM calls: ${job.llm.calls}/${job.llm.max} ${JSON.stringify(job.llm.by)}\nRate it: node studio.mjs feedback ${job.id} good|bad "what to change"`);
  return job;
}

/** apply plain-language notes to the brief, then redo from the storyboard (or script) */
export function revise(job, notes) {
  const n = notes.toLowerCase(), b = job.brief, style = n.match(/style[:= ]+([a-z0-9-]+)/)?.[1];
  if (style) b.style = style; if (/shorter|cut it|too long/.test(n)) b.targetSec = Math.max(20, Math.round(b.targetSec * 0.75)); if (/longer|too short/.test(n)) b.targetSec = Math.min(60, Math.round(b.targetSec * 1.25));
  if (/no music/.test(n)) b.music = 'none'; const cta = n.match(/cta[:= ]+([a-z0-9]+)/)?.[1]; if (cta) b.cta = cta.toUpperCase();
  job.stage = /shorter|longer|too long|too short|hook|rewrite|ending|cta/.test(n) ? 'script' : style ? 'style' : 'storyboard';
  job.revisions = [...(job.revisions || []), notes]; b.notes = notes; job.approval = null; job.status = 'running'; return job;
}

// ---- CLI ----
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [cmd, ...a] = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
  const pos = []; for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { if (a[i] !== '--auto') i++; } else pos.push(a[i]); }
  const get = (id) => loadJob(id) || (console.error('no such job: ' + id), process.exit(2));
  if (cmd === 'new') {
    const text = pos[0]; if (!text) { console.error('usage: studio.mjs new "what the video is about" [--script file.txt] [--style id] [--sec 40] [--cta WORD] [--preset full|fast|turbo] [--auto]'); process.exit(2); }
    const sf = opt('script'); const job = newJob({ text, topic: opt('topic', text), script: sf ? fs.readFileSync(sf, 'utf8') : undefined, style: opt('style', 'auto'), face: opt('face'), video: opt('video'), targetSec: +opt('sec', 40), cta: opt('cta'), preset: opt('preset', 'fast'), music: opt('music'), voice: opt('voice'), auto: a.includes('--auto') });
    await run(job);
  } else if (cmd === 'approve') { const j = get(pos[0]); const f = path.join(jdir(j), 'approval.json'), ap = readJSON(f, {}); ap.status = 'approved'; ap.by = 'you'; writeJSON(f, ap); j.approval = 'approved'; await run(j); }
  else if (cmd === 'revise') { await run(revise(get(pos[0]), pos[1] || '')); }
  else if (cmd === 'feedback') { const j = get(pos[0]); console.log('learned:', JSON.stringify(feedback(j, pos[1] || 'good', pos[2] || ''))); }
  else if (cmd === 'status') { const j = get(pos[0]); console.log(JSON.stringify({ id: j.id, status: j.status, stage: j.stage, style: j.style?.id, scores: Object.fromEntries(Object.entries(j.stages).map(([k, v]) => [k, v.score])), llm: j.llm, video: j.artifacts.render?.video, error: j.error }, null, 1)); }
  else if (cmd === 'list') fs.readdirSync(JOBS).filter((d) => fs.existsSync(path.join(JOBS, d, 'job.json'))).forEach((d) => { const j = loadJob(d); console.log(d.padEnd(34), j.status.padEnd(17), j.stage.padEnd(10), j.style?.id || ''); });
  else console.log('commands: new · status · list · approve · revise · feedback');
}
