// Storyboard creator + scene writer + caption writer: runs the director (rules, plus ONE optional AI call), which produces beats, emotions, faces,
// poses, scenes, shots, cards, captions with highlight words, transitions and per-beat sound cues. Then applies the brand kit and learned preferences.
import fs from 'node:fs';
import path from 'node:path';
import { STUDIO, jdir, proj, sh, readJSON, writeJSON, issue, scoreOf } from './core.mjs';
import { applyPrefs } from './learning.mjs';
import { styleInfo } from './styler.mjs';

export async function storyboard(job) {
  fs.rmSync(proj(job), { recursive: true, force: true }); fs.mkdirSync(jdir(job), { recursive: true });
  const sf = path.join(jdir(job), 'script.txt'), b = job.brief; fs.writeFileSync(sf, job.artifacts.script + '\n');
  const args = [path.join(STUDIO, 'make.sh'), sf, '--style', job.style.id, '--name', job.id, '--stage', 'init', ...(b.video ? ['--video', b.video] : []), ...(b.voice ? ['--voice', b.voice] : []), ...(b.speed ? ['--speed', String(b.speed)] : [])];
  const r = sh('bash', args, { env: { STUDIO_NO_LLM: job.llm.calls >= job.llm.max ? '1' : '' } }); if (!r.ok) throw new Error('director failed:\n' + r.out.slice(-800));
  const P = proj(job), script = readJSON(path.join(P, 'script.json')), plan = readJSON(path.join(P, 'plan.json')), report = readJSON(path.join(P, 'report.json'));
  const info = styleInfo(script.style); job.style = { ...job.style, id: script.style, family: info.family || 'stick' };
  if (plan.llm && !plan.llm.cached) { job.llm.calls++; job.llm.by[plan.llm.provider] = (job.llm.by[plan.llm.provider] || 0) + 1; }
  // brand kit: same host, voice and look for every video of the channel
  const brand = readJSON(path.join(STUDIO, 'memory/brand.json'), {}), st = readJSON(path.join(P, 'style.json'));
  if (brand.presenter) st.presenter = { ...st.presenter, ...brand.presenter }; if (brand.accent) st.cardAccent = brand.accent; writeJSON(path.join(P, 'style.json'), st);
  job.prefs = applyPrefs(P, job.style.id);
  return { beats: plan.scenes.length, seconds: report.estimatedSeconds, viral: report.score.total, hook: report.hook, emotions: [...new Set(plan.scenes.map((s) => s.emotion))], cards: plan.scenes.map((s) => s.card?.kind).filter(Boolean),
    shots: plan.scenes.map((s) => s.shot.type), ai: plan.llm ? `${plan.llm.provider}${plan.llm.cached ? ' (cached)' : ''}` : 'rules only' };
}

export function storyboardCritic(s, job) {
  const I = [], run = (a) => { let m = 0, c = 0; a.forEach((x, i) => { c = i && a[i - 1] === x ? c + 1 : 1; m = Math.max(m, c); }); return m; };
  const explain = job.style?.kind === 'explainer' || job.style?.kind === 'facecam';
  if (!s.hook.ok) I.push(issue('weak-hook', `hook "${s.hook.line}" is weak`, 'rewrite the first line', explain ? 20 : 8));
  if (s.seconds < 15 || s.seconds > 62) I.push(issue('duration', `${s.seconds}s is outside 15 to 62 s`, 'cut or extend the script', 15));
  if (s.emotions.length < 3 && s.beats > 5) I.push(issue('flat-emotion', `only ${s.emotions.length} emotion(s)`, 'add a contrast beat', 10));
  if (explain && s.cards.length && new Set(s.cards).size < 3) I.push(issue('repetitive-cards', 'fewer than 3 kinds of explainer card', 'vary what each line shows', 10));
  if (explain && s.cards.length && run(s.cards) >= 4) I.push(issue('card-run', 'the same card kind 4 times in a row', 'vary the cards', 10));
  if (!s.cards.length && new Set(s.shots).size < 3) I.push(issue('shot-variety', 'fewer than 3 shot types', 'mix wide, medium and close', 10));
  if (s.viral < 65) I.push(issue('viral', `viral score ${s.viral}/100`, 'strengthen hook, specifics and ending', 10));
  return { score: scoreOf(I), issues: I };
}
