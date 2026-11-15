// Learning agent: remembers every run and every piece of user feedback, and turns them into (a) small numeric preferences per style
// that the next run applies automatically, (b) hints for the writer prompt, (c) a style bias when the style is picked automatically.
// Everything is plain JSON in memory/ so it can be read, edited or deleted by hand.
import fs from 'node:fs';
import path from 'node:path';
import { MEMORY, readJSON, writeJSON } from './core.mjs';

const RUNS = path.join(MEMORY, 'runs.jsonl'), PREFS = path.join(MEMORY, 'prefs.json');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LIMITS = { speed: [-0.2, 0.2], exposure: [-0.5, 0.8], cap: [-0.3, 0.5], sfx: [-0.6, 0.4], music: [-9, 6] };
// words in feedback -> numeric nudges
const RULES = [[/too fast|slow(er)? down|rushed/i, { speed: -0.06 }], [/too slow|drag|speed (it )?up|faster/i, { speed: 0.06 }], [/too dark|can.?t see|hard to see|dim/i, { exposure: 0.2 }], [/too bright|washed|blown/i, { exposure: -0.15 }],
  [/captions?[^.]*(small|tiny|hard to read)|small captions?/i, { cap: 0.12 }], [/captions?[^.]*(big|huge|large)/i, { cap: -0.1 }], [/music[^.]*(loud|too much|overpower)|loud music/i, { music: -3 }], [/more music|music[^.]*(quiet|low)/i, { music: 2 }],
  [/(too many|too much|annoying)[^.]*(sound|sfx|effects)|sfx[^.]*loud/i, { sfx: -0.15 }], [/more (sound|sfx|effects)/i, { sfx: 0.15 }]];

export const prefs = (style) => ({ speed: 0, exposure: 0, cap: 0, sfx: 0, music: 0, ...(readJSON(PREFS, {})[style] || {}) });
function nudge(style, delta) { const all = readJSON(PREFS, {}), p = { ...prefs(style) }; for (const [k, v] of Object.entries(delta)) p[k] = clamp(+(p[k] + v).toFixed(3), ...LIMITS[k]); all[style] = p; writeJSON(PREFS, all); return p; }

/** apply a style's learned preferences to a project (call after the director has written script.json / style.json) */
export function applyPrefs(projDir, styleId) {
  const p = prefs(styleId), sf = path.join(projDir, 'style.json'), jf = path.join(projDir, 'script.json'), st = readJSON(sf), sc = readJSON(jf); if (!st || !sc) return p;
  if (p.exposure) st.grade = { ...st.grade, exposure: +((st.grade?.exposure ?? 1) + p.exposure).toFixed(2) };
  if (p.cap) st.captions.size = Math.round(st.captions.size * (1 + p.cap));
  if (p.sfx) st.audio.sfx = clamp(+((st.audio.sfx ?? 1) + p.sfx).toFixed(2), 0.2, 1.4);
  if (p.speed) sc.speed = clamp(+(sc.speed + p.speed).toFixed(3), 0.85, 1.3);
  if (p.music) sc.musicDb = p.music;
  writeJSON(sf, st); writeJSON(jf, sc); return p;
}

/** user feedback on a finished job: rating good|bad + free text. Returns the nudges it caused. */
export function feedback(job, rating, notes = '') {
  const applied = {}; for (const [re, d] of RULES) if (re.test(notes)) for (const [k, v] of Object.entries(d)) applied[k] = (applied[k] || 0) + v;
  const style = job.style?.id; if (style && Object.keys(applied).length) nudge(style, applied);
  record(job, { feedback: { rating, notes, applied } }); return applied;
}

export function record(job, extra = {}) {
  fs.mkdirSync(MEMORY, { recursive: true });
  fs.appendFileSync(RUNS, JSON.stringify({ at: new Date().toISOString(), id: job.id, style: job.style?.id, family: job.style?.family, kind: job.style?.kind, topic: job.brief.topic || job.brief.text.slice(0, 60),
    scores: Object.fromEntries(Object.entries(job.stages).map(([k, v]) => [k, v.score]).filter(([, v]) => v != null)), issues: Object.values(job.stages).flatMap((s) => (s.issues || []).map((i) => i.code)), llmCalls: job.llm.calls, seconds: job.seconds, ...extra }) + '\n');
}
const runs = () => { try { return fs.readFileSync(RUNS, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };

/** short strings the writer/storyboard prompts can include: what the user said last time, what the critics keep flagging */
export function hints(style) {
  const r = runs().filter((x) => x.style === style), notes = r.filter((x) => x.feedback?.notes).slice(-3).map((x) => x.feedback.notes), count = {};
  r.flatMap((x) => x.issues || []).forEach((c) => { count[c] = (count[c] || 0) + 1; });
  return { notes, recurring: Object.entries(count).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c) };
}
/** among styles of one kind, the one the user liked most (needs >= 2 rated runs), else null */
export function bestStyle(kind) {
  const by = {}; runs().filter((x) => x.kind === kind && x.feedback).forEach((x) => { const b = (by[x.style] ||= { n: 0, good: 0 }); b.n++; if (x.feedback.rating === 'good') b.good++; });
  const top = Object.entries(by).filter(([, b]) => b.n >= 2).sort((a, b) => b[1].good / b[1].n - a[1].good / a[1].n)[0]; return top && top[1].good / top[1].n >= 0.5 ? top[0] : null;
}
