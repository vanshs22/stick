// Script writer (+ script editor). The user's own script is never rewritten unless a critic asks for it AND an AI key exists.
import { ask, issue, scoreOf } from './core.mjs';
import { direct } from '../director/director.mjs';
import { scorePlan } from '../director/score.mjs';
import { hints } from './learning.mjs';

export const clean = (t) => t.replace(/[*_#>`]/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const SYS = `You write spoken scripts for short vertical videos (Reels/Shorts). Return ONLY JSON: {"lines":["sentence", ...]}.
Rules: line 1 is a hook of at most 11 words (a question, a number, a rule or a surprise). One idea per line, each line at most 13 words, plain spoken English, no emojis, no hashtags, no stage directions.
Use only facts that are in the brief or the research titles. Never invent statistics, prices, names or claims. Build: hook, setup, 3 to 5 beats (steps or story turns), one concrete proof or twist, then an ending that makes people comment or replay.`;

export async function scriptWriter(job, fb) {
  const b = job.brief; let text = b.script ? clean(b.script) : '';
  if (!fb && text) return { text, by: 'user' };
  const words = Math.round(b.targetSec * 2.45), style = job.style?.id || '';
  const user = `Brief: ${b.text}\nTarget: about ${words} words (${b.targetSec} s). ${b.cta ? `End with: Comment ${b.cta}.` : ''}\nResearch titles (for angle only): ${(job.artifacts.research?.titles || []).join(' | ') || 'none'}\n${hints(style).notes.length ? 'The user said about earlier videos: ' + hints(style).notes.join(' / ') + '\n' : ''}${text ? `Current script:\n${text}\nProblems to fix: ${(fb?.issues || []).map((i) => i.msg).join('; ')}. Keep the meaning and facts. Return the improved script.` : ''}`;
  const j = await ask(job, SYS, user, 'script', (x) => Array.isArray(x.lines) && x.lines.length >= 4 && x.lines.every((l) => typeof l === 'string'));
  if (j) return { text: clean(j.lines.join('\n')), by: 'ai' };
  if (text) return { text, by: 'user (no AI available to improve it)' };
  throw new Error('No script given and no AI key set. Pass --script file.txt, or set FREELLM_API_KEY / OPENAI_API_KEY in studio.env.');
}

export async function scriptCritic(art, job) {
  const r = direct(art.text, 'safety-explainer'), s = scorePlan(r.plan, r.script, r.style), target = job.brief.targetSec * 2.45, I = [];
  if (!r.report.hook.ok) I.push(issue('weak-hook', `the first line "${r.report.hook.line}" is not a strong hook (question, number, rule or shock, 11 words or fewer)`, 'rewrite line 1'));
  if (!job.brief.script && Math.abs(r.report.words - target) / target > 0.4) I.push(issue('length', `${r.report.words} words for a ${job.brief.targetSec} s video (target about ${Math.round(target)})`, 'cut or extend', 10));
  if (r.report.beats < 6) I.push(issue('few-beats', `only ${r.report.beats} beats: add visual turns`, 'split ideas into more short lines', 10));
  if (job.brief.cta && !new RegExp(`comment\\s+["']?${job.brief.cta}`, 'i').test(art.text)) I.push(issue('no-cta', `the ending does not say "Comment ${job.brief.cta}"`, 'add the call to action', 10));
  return { score: Math.min(s.total + 8, scoreOf(I)), issues: I, viral: s.total };
}
