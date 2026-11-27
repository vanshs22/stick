// Overlay timing critic (needs data/timeline.json for the time checks): an overlay must land on a real spoken word, stay on screen long enough to read, and a number graphic must sit on a number.
//   anchor     the overlay names an anchor the shot defines
//   window     the anchor falls inside its shot and the overlay stays visible at least 0.9 s + 0.28 s per word of its text
//   fit        a price tag lands on a number word (within 2 words of the anchor)
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { norm } from '../lib/overlay_brain.mjs';

const NUMBER = /^\d|^(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|percent|dollars?|free|half|double|twice)$/;
const QUIET = new Set(['label', 'step-label', 'backword', 'cursor']);
const textOf = (o) => [o.text, o.title, o.left, o.right, o.value, o.label].filter((x) => typeof x === 'string').join(' ');
export async function run(P) {
  const r = new Report(P, 'overlays'), sb = tryRd(path.join(P, 'storyboard/storyboard.json')), sc = tryRd(path.join(P, 'script/script.json')), tl = tryRd(path.join(P, 'data/timeline.json'));
  if (!sb) { r.add('blocker', { problem: 'storyboard missing', evidence: '', expected: 'storyboard/storyboard.json', fix: 'create it' }); return r.finish(); }
  r.check('anchor: every anchored overlay names an anchor its shot defines');
  r.check('window: the anchor is inside its shot and the overlay is on screen long enough to read');
  r.check('fit: a price tag sits on a number word');
  for (const s of sb.shots) {
    const names = new Map((s.anchors || []).map((a) => [a.name, a])), t = tl?.shots?.find((x) => x.id === s.id);
    for (const o of s.overlays || []) {
      if (!o.anchor) continue;
      const a = names.get(o.anchor);
      if (!a) { r.add('blocker', { shot_id: s.id, problem: `overlay "${o.type}" uses anchor "${o.anchor}" that the shot does not define`, evidence: `anchors: ${[...names.keys()].join(', ') || 'none'}`, expected: 'an anchor with {name, line, word}', fix: `Add the anchor to shot ${s.id}, or fix the name` }); continue; }
      if (t) {
        const at = t.anchors?.[o.anchor];
        if (at == null) r.add('major', { shot_id: s.id, problem: `anchor "${o.anchor}" has no time in the timeline`, evidence: 'timeline.anchors lacks it', expected: 'a resolved word time', fix: 'Re-run build_timeline.mjs; check the anchor word is spoken in its line' });
        else {
          if (at < t.start - 0.05 || at > t.end + 0.05) r.add('blocker', { shot_id: s.id, problem: `overlay "${o.type}" lands outside its shot`, evidence: `anchor at ${at}s, shot ${t.start}-${t.end}s`, expected: 'the anchor word is spoken inside the shot', fix: `Move the anchor to a word spoken in ${s.id}` });
          else if (!QUIET.has(o.type)) { const room = t.end - at, words = textOf(o).split(/\s+/).filter(Boolean).length, need = 0.9 + 0.28 * words, vis = Math.min(o.dur ?? room, room); if (vis + 0.02 < need) r.add('major', { shot_id: s.id, problem: `overlay "${o.type}" is on screen ${vis.toFixed(2)} s, too short to read`, evidence: `${words} word(s) need ${need.toFixed(2)} s; ${room.toFixed(2)} s left in the shot`, expected: 'at least 0.9 s + 0.28 s per word', fix: 'Anchor it on an earlier word, lengthen the shot, or shorten the text' }); }
        }
      }
      if (o.type === 'price-tag' && sc) {
        const ln = sc.lines.find((l) => l.id === a.line); if (!ln) continue; const toks = ln.text.split(/\s+/).map(norm), i = toks.findIndex((w) => w === norm(a.word));
        if (i >= 0 && !toks.slice(Math.max(0, i - 2), i + 3).some((w) => NUMBER.test(w))) r.add('major', { shot_id: s.id, line_id: ln.id, problem: `price tag sits on "${a.word}", which is not a number`, evidence: `words near it: ${toks.slice(Math.max(0, i - 2), i + 3).join(' ')}`, expected: 'the anchor is a number, price or quantity word', fix: `Anchor the price tag on the number word, or use another device` });
      }
    }
  }
  if (!tl) r.notes.push('No data/timeline.json yet: the on-screen-time check was skipped. Run it again after build_timeline.mjs.');
  r.notes.push('Does the picture say what the word says? That needs eyes: vision critic composition. Overlay over a face needs rendered frames (frames and layout critics).');
  return r.finish();
}
