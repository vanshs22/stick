// Style selector: which look fits this script? Rules first, nudged by what the user liked before. A style id given by the user always wins.
import fs from 'node:fs';
import path from 'node:path';
import { STUDIO, readJSON } from './core.mjs';
import { bestStyle } from './learning.mjs';

const ALL = Object.fromEntries(fs.readdirSync(path.join(STUDIO, 'styles')).filter((f) => f.endsWith('.json')).map((f) => { const s = readJSON(path.join(STUDIO, 'styles', f)); return [s.id, s]; }));
export const styleInfo = (id) => ALL[id];
export function kindOf(t) {
  const steps = (t.match(/\b(step|first|second|third|install|type|run|folder|open source|how to|prompt|free|command|app|tool)\b/gi) || []).length, quotes = (t.match(/["]/g) || []).length, qs = (t.match(/\?/g) || []).length;
  if (steps >= 4) return 'explainer'; if (quotes >= 4 || qs >= 3) return 'dialogue'; return 'story';
}
export function pickStyle(job, text) {
  const b = job.brief; if (b.style && b.style !== 'auto') return { id: b.style, kind: kindOf(text), why: 'chosen by you' };
  if (b.face === 'synth') return { id: 'facecam-avatar', kind: 'facecam', why: 'generated presenter' };
  if (b.face === 'video') return { id: 'facecam-explainer', kind: 'facecam', why: 'your own clip' };
  const kind = kindOf(text), liked = bestStyle(kind), dflt = { explainer: 'editorial-explainer', dialogue: 'lowpoly-office', story: 'auto' }[kind];
  return { id: liked || dflt, kind, why: liked ? `you rated it best for ${kind} videos` : `${kind} script` };
}
