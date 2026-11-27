// Viral-script critic: the rubric behind script/viral-plan.json. Measures what can be measured about a script that holds attention and gets shared.
// It cannot judge whether the idea is funny or true: the agent answers that in the plan (promise, share.reason) and a person approves the script.
import path from 'node:path';
import { Report, tryRd, wordsOf } from './lib.mjs';
const WPS = 2.6, norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9]/g, ''), content = (t) => (String(t || '').toLowerCase().match(/[a-z]{4,}/g) || []);
export const HOOKS = {
  'open-loop question': (t) => /\?/.test(t),
  'number + stake': (t) => /\d/.test(t) || /\b(one|two|three|five|ten|hundred|thousand|million|billion)\b/i.test(t),
  contradiction: (t) => /\b(wrong|lie|myth|not|never|stop|isn't|doesn't|don't|actually)\b/i.test(t),
  'accusation / you': (t) => /\b(you|your|you're)\b/i.test(t),
  'POV / cold open': (t) => /^(pov|last night|yesterday|imagine|picture this|it was|he |she |they |i )/i.test(t.trim()),
};
export const hookPattern = (t) => Object.entries(HOOKS).filter(([, f]) => f(t)).map(([k]) => k);
const WEAK = /\b(amazing|incredible|awesome|literally|basically|very|really|super|totally|just)\b/gi, FILLER = /^(so|okay|ok|well|um|uh|like|alright|anyway)\b[, ]/i, STAKES = /\b(or else|lose|risk|cost|mistake|wrong|never|stop|danger|scam|waste|steal|fake|trap|hack|stolen)\b/i;
export async function run(P) {
  const r = new Report(P, 'viral'), s = tryRd(path.join(P, 'script/script.json')), plan = tryRd(path.join(P, 'script/viral-plan.json')), b = tryRd(path.join(P, 'brief.json')) || {};
  if (!s) { r.add('blocker', { problem: 'no script', evidence: 'script/script.json missing', expected: 'a script', fix: 'write it', fix_target: 'script' }); return r.finish(); }
  const L = s.lines, W = L.map((l) => wordsOf(l.tts_text || l.text)), dur = W.map((w) => w.length / WPS), total = dur.reduce((a, d) => a + d, 0) || 1, first = L[0], last = L.at(-1);
  const at = (i) => dur.slice(0, i).reduce((a, d) => a + d, 0) / total;   // share of the film at which line i starts
  // ---- the plan file ----
  r.check('viral plan exists and is complete');
  if (!plan) r.add('major', { problem: 'no script/viral-plan.json', evidence: 'missing', expected: 'a filled viral plan: promise, hook options, beats, cta, loop, share reason', fix: 'node tools/script_studio.mjs new <P>, fill every field, then score again', fix_target: 'script' });
  else if (plan.waived && String(plan.waived).length >= 12) r.notes.push(`plan waived: ${plan.waived}`);
  else {
    const todo = JSON.stringify(plan).match(/TODO/g)?.length || 0; if (todo) r.add('major', { problem: 'the viral plan still has TODO placeholders', evidence: `${todo} placeholder(s)`, expected: 'every field written by you', fix: 'fill them (see skills/viral-script/SKILL.md)', fix_target: 'script' });
    for (const k of ['promise', 'format', 'hook', 'beats', 'cta', 'loop', 'share']) if (!plan[k]) r.add('major', { problem: `plan has no "${k}"`, evidence: k, expected: 'present', fix: `add ${k}`, fix_target: 'script' });
    const h = plan.hook; if (h) {
      if ((h.options || []).length < 3) r.add('major', { problem: 'fewer than 3 hook options written', evidence: `${(h.options || []).length}`, expected: 'three real options with different patterns, then one chosen', fix: 'write 3 hooks', fix_target: 'script' });
      const ch = h.options?.[h.chosen]; if (ch) { const a = new Set(content(ch.line)), ov = content(first.text).filter((w) => a.has(w)).length / Math.max(1, a.size); if (ov < 0.5) r.add('major', { line_id: first.id, problem: 'the chosen hook is not the first script line', evidence: `"${ch.line}" vs "${first.text}"`, expected: 'script line 1 = the chosen hook', fix: 'make them match', fix_target: 'script' }); }
    }
    const ids = new Set(L.map((l) => l.id)); for (const bt of plan.beats || []) for (const id of bt.lines || []) if (!ids.has(id)) r.add('minor', { problem: `plan beat "${bt.beat}" names a line that does not exist`, evidence: id, expected: 'real line ids', fix: 'fix the plan', fix_target: 'script' });
    if (plan.cta?.keyword && b.cta?.keyword && String(plan.cta.keyword).toUpperCase() !== String(b.cta.keyword).toUpperCase()) r.add('minor', { problem: 'plan CTA keyword differs from the brief', evidence: `${plan.cta.keyword} vs ${b.cta.keyword}`, expected: 'one keyword', fix: 'align them', fix_target: 'script' });
    if (plan.loop?.echo) { const e = norm(plan.loop.echo), has = (l) => wordsOf(l.text).some((w) => norm(w) === e); if (!has(first) || !has(last)) r.add('minor', { problem: 'the planned loop word is not in both the first and the last line', evidence: plan.loop.echo, expected: 'the echo word in line 1 and the last line', fix: 'reuse it', fix_target: 'script' }); }
  }
  // ---- the hook ----
  r.check('hook: lands in 3 s and uses a known pattern');
  if (dur[0] > 3.6) r.add(dur[0] > 4.2 ? 'major' : 'minor', { line_id: first.id, problem: 'the hook takes more than 3 seconds to say', evidence: `${W[0].length} words = ${dur[0].toFixed(1)} s`, expected: '8 to 9 words (3 s)', fix: 'cut it to the one surprising thing', fix_target: 'script' });
  if (!hookPattern(first.text).length && !/^(pov|imagine)/i.test(first.text)) r.add('minor', { line_id: first.id, problem: 'the hook matches no proven pattern (open-loop question, number + stake, contradiction, accusation, POV / cold open)', evidence: first.text.slice(0, 80), expected: 'one of the patterns in skills/viral-script', fix: 'rewrite it as one of them', fix_target: 'script' });
  if (FILLER.test(first.text)) r.add('major', { line_id: first.id, problem: 'the hook starts with filler', evidence: first.text.slice(0, 40), expected: 'the first word carries meaning', fix: 'cut the filler word', fix_target: 'script' });
  // ---- specificity and weak words ----
  r.check('specific, not vague');
  const spec = L.slice(0, 3).some((l) => /\d/.test(l.text) || /\b[A-Z][a-z]{2,}/.test(l.text.replace(/^\W*\w+/, ''))); if (!spec) r.add('minor', { problem: 'no number, name or concrete noun in the first three lines', evidence: L.slice(0, 3).map((l) => l.text).join(' / ').slice(0, 100), expected: 'a specific detail early (73,667 developers, the padlock, 3 a.m.)', fix: 'swap a vague word for a concrete one', fix_target: 'script' });
  const weak = (L.map((l) => l.text).join(' ').match(WEAK) || []); if (weak.length > 2) r.add('minor', { problem: 'filler intensifiers', evidence: [...new Set(weak.map((x) => x.toLowerCase()))].join(', '), expected: 'at most 2', fix: 'cut them; show the thing instead', fix_target: 'script' });
  // ---- information rhythm ----
  r.check('a new piece of information every 3 s');
  L.forEach((l, i) => { if (dur[i] > 4.2 && !(s.cast && l.speaker)) r.add('minor', { line_id: l.id, problem: 'a line carries one idea for over 4 seconds', evidence: `${W[i].length} words = ${dur[i].toFixed(1)} s`, expected: 'split it, or add a visual change inside it', fix: 'split the line', fix_target: 'script' }); });
  const avg = W.reduce((a, w) => a + w.length, 0) / L.length; if (avg > 13) r.add('minor', { problem: 'lines are long on average', evidence: `${avg.toFixed(1)} words`, expected: '12 or fewer', fix: 'shorter lines cut faster', fix_target: 'script' });
  // ---- stakes, payoff, loop, cta ----
  r.check('stakes early, payoff late, loop, one CTA');
  const fmt = plan?.format || ''; if (!/dialogue|comedy|story/.test(fmt) && !L.slice(0, Math.max(2, Math.ceil(L.length * 0.35))).some((l) => STAKES.test(l.text) || /\?/.test(l.text))) r.add('minor', { problem: 'no stakes or open question in the first third', evidence: 'nothing makes the viewer need the answer', expected: 'say what is lost or wrong, early', fix: 'add one stakes line', fix_target: 'script' });
  const payoff = L.findIndex((l) => ['proof', 'twist', 'mechanism'].includes(l.beat)); if (payoff >= 0 && at(payoff) < 0.3 && L.length > 5 && !/dialogue|comedy/.test(fmt)) r.add('minor', { line_id: L[payoff].id, problem: 'the payoff arrives in the first third', evidence: `at ${(at(payoff) * 100).toFixed(0)} percent`, expected: 'hold the answer until 55 to 80 percent', fix: 'move the reveal later; open another loop first', fix_target: 'script' });
  if (!content(first.text).some((w) => content(last.text).includes(w))) r.add('minor', { line_id: last.id, problem: 'the last line does not echo the first (no loop)', evidence: `"${first.text.slice(0, 40)}" / "${last.text.slice(0, 40)}"`, expected: 'reuse a word of the hook so the replay feels seamless', fix: 'echo a content word', fix_target: 'script' });
  const kw = b.cta?.keyword || plan?.cta?.keyword; if (kw) { const kre = new RegExp(`\\b${String(kw).replace(/[^A-Za-z0-9]/g, '')}\\b`, 'i'), ASK = /\b(comment|dm|type|reply|send|text|follow|subscribe|save)\b/i, idx = L.map((l, i) => (kre.test(l.text) && ASK.test(l.text) ? i : -1)).filter((i) => i >= 0); if (idx.length && Math.min(...idx) < L.length - 2) r.add('minor', { problem: 'the CTA keyword appears before the last two lines', evidence: `line ${idx[0] + 1} of ${L.length}`, expected: 'ask once, at the end', fix: 'move it', fix_target: 'script' }); }   // whole-word match: "hides" is not the keyword HIDE
  // ---- emotion ----
  r.check('emotional range');
  const emos = new Set(L.map((l) => l.emotion || 'neutral')), story = /dialogue|comedy|story/.test(fmt) || s.cast;
  if (story && emos.size < 3) r.add('minor', { problem: 'flat delivery for a story', evidence: `${emos.size} emotion(s)`, expected: 'three or more (curious, shock, fear, happy, sad, determined...)', fix: 'give lines emotions; the voice engine shapes speed, pitch and pauses from them', fix_target: 'script' });
  if (s.cast) for (const [n, c] of Object.entries(s.cast)) if (!L.some((l) => l.speaker === n)) r.add('minor', { problem: `cast member ${n} never speaks`, evidence: n, expected: 'every cast member has a line', fix: 'cut them or give them a line', fix_target: 'script' });
  r.notes.push('Judgement for the agent and the user (not measurable): is the promise specific, is the twist earned, would a stranger send this to a friend? The plan\'s share.reason must answer the last one.'); return r.finish();
}
