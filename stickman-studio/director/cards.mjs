// Explainer cards: decides, per beat, WHICH on-screen visual explains the sentence (terminal, big number, phone, chart, doc,
// versus, stamp, checklist, step number, comment-CTA, or a big keyword). Rule based and free; the optional LLM can overwrite
// kind/value per beat (llm.mjs) but this always provides a complete answer, so a missing or bad LLM reply changes nothing.
export const CARD_KINDS = ['step', 'terminal', 'cta', 'versus', 'stat', 'chart', 'doc', 'phone', 'stamp', 'list', 'keyword'];

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
const clean = (s) => s.replace(/[.,!?;:"“”]+$/g, '').trim();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
/** "forty thousand" -> "40K", "three hundred" -> "300", "ten million" -> "10M"; null when the sentence has no spelled-out number */
export function spokenNumber(text) {
  const m = text.toLowerCase().match(/\b((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]*)+)(hundred|thousand|million|billion)\b/); if (!m) return null;
  const n = m[1].trim().split(/[\s-]+/).reduce((a, w) => a + (UNITS[w] || 0), 0); return n + ({ hundred: '', thousand: 'K', million: 'M', billion: 'B' }[m[2]]) + (m[2] === 'hundred' ? '00' : '');
}
const STOP = new Set('the a an and or of to in on for with is are it its this that you your i my we our they their be was were as at by from so but not just very can will'.split(' '));

/** candidate cards for one sentence, best first */
export function candidates(text) {
  const t = text.trim(), low = t.toLowerCase(), out = [];
  const cta = low.match(/\bcomment\s+["“'\u2018]?([a-z0-9]{2,12})/i);
  if (cta) out.push({ kind: 'cta', value: cta[1].toUpperCase(), label: 'comment' });
  const step = low.match(/^(?:step\s+)?(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth|sixth)\b[,.:]?\s/i);
  const term = t.match(/["“`]([^"”`]{3,38})["”`]/);
  const isTerm = /\b(type|run|install|command|prompt|paste|terminal|folder|clone|npm|pip|open (?:my|the|a|your)|claude code)\b/.test(low);
  if (isTerm) out.push({ kind: 'terminal', value: clean(term ? term[1] : t.replace(/^[A-Za-z]+,\s*/, '')).slice(0, 40), label: /\binstall\b/.test(low) ? 'install' : /\bfolder\b/.test(low) ? 'files' : 'terminal', ...(step ? { step: NUM_WORDS[step[1]] || +step[1] } : {}) });
  if (step && !isTerm) out.push({ kind: 'step', value: NUM_WORDS[step[1]] || +step[1] });
  const vs = low.match(/\b(?:alternative to|instead of|versus|vs\.?|better than)\s+([a-z0-9 ]{2,18}?)(?:[.,!?]|\s+and\b|\s+that\b|$)/);
  if (vs) out.push({ kind: 'versus', value: cap(clean(vs[1])), label: 'free', other: 'FREE' });
  const sp = spokenNumber(t);
  const num = sp ? [sp, sp, (t.match(/\b(?:thousand|million|billion|hundred)\s+([A-Za-z]+)/i) || [])[1]] : t.match(/(\$\s?\d[\d,]*(?:\.\d+)?\s?[kKmM]?|\d[\d,]*(?:\.\d+)?\s?(?:%|x|k|m|K|M)?)(?:\s+([A-Za-z]+(?:\s+[A-Za-z]+)?))?/);
  if (num && !step) { const nm = num[1].replace(/\s+/g, ''); const unit = (num[2] || '').toLowerCase().split(' ').filter((w) => !STOP.has(w)).join(' '); out.push({ kind: /\b(grew|growth|followers|views|subscribers|stars|revenue|rose|up|more|increase)\b/.test(low) ? 'chart' : 'stat', value: nm, label: unit || 'in total' }); }
  if (/\b(grew|growth|followers|views|subscribers|revenue|earn|profit|rose|increase|stars)\b/.test(low) && !out.some((c) => c.kind === 'chart')) out.push({ kind: 'chart', value: num ? num[1].replace(/\s+/g, '') : '', label: 'growth' });
  if (/\b(docs?|documents?|files?|plan|brief|spec|prd|readme|notes|schema)\b/.test(low)) out.push({ kind: 'doc', value: (low.match(/\b(prd|trd|readme|plan|brief|schema|spec|design)\b/) || [0, 'notes'])[1].toUpperCase() + '.md', label: 'document' });
  if (/\b(phone|app|reel|video|post|instagram|tiktok|youtube|short|clip|account)\b/.test(low)) out.push({ kind: 'phone', value: cap(clean(t)).slice(0, 44), label: /\b(tiktok|reel|instagram|short)\b/.test(low) ? 'reel' : 'app' });
  if (/\b(never|no one|nobody|guarantee|warning|danger|careful|banned|fake|scam|mistake|stop)\b/.test(low)) out.push({ kind: 'stamp', value: /\bguarantee\b/.test(low) ? 'NOT A GUARANTEE' : /\b(never|nobody|no one)\b/.test(low) ? 'NEVER' : /\b(stop|mistake|scam|fake)\b/.test(low) ? 'STOP' : 'CAREFUL' });
  const items = t.split(/,\s*|\s+and\s+/).map(clean).filter((s) => s.split(' ').length <= 5 && s.length > 2);
  if (items.length >= 3 && /,/.test(t)) out.push({ kind: 'list', items: items.slice(0, 4).map(cap) });
  // fallback: the most meaningful word, big
  const ws = t.split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9$%']/g, '')).filter((w) => w && !STOP.has(w.toLowerCase())).sort((a, b) => b.length - a.length);
  out.push({ kind: 'keyword', value: (ws[0] || t.split(' ')[0] || '').toUpperCase() });
  return out;
}

/** attach card / label / bg to every scene (mutates plan.scenes); style.cards decides if this runs at all */
export function addCards(plan, style) {
  const sc = plan.scenes, n = sc.length, bgList = style.bg || ['paper'];
  let prev = null, stepCount = 0, seg = 0, lastBgBeat = 0;
  sc.forEach((s, i) => {
    const c = candidates(s.text); let pick = c.find((x) => x.kind !== prev || x.kind === 'step' || x.step) || c[0];
    if (pick.kind === 'step' || pick.step) stepCount = pick.step || pick.value;
    if (s.arc === 'end' && !c.some((x) => x.kind === 'cta') && style.endCta) pick = { kind: 'cta', value: style.endCta, label: 'comment' };
    prev = pick.kind; s.card = pick;
    const topic = s.arc === 'hook' ? 'the result first' : s.arc === 'peak' ? 'the proof' : s.arc === 'end' ? 'get it' : pick.kind === 'step' || pick.step ? `step ${pick.step || pick.value}` : pick.kind === 'terminal' ? 'type one line' : pick.kind === 'versus' ? 'the alternative' : stepCount ? `step ${stepCount} · it works` : 'how it works';
    s.label = { left: `// ${String(i + 1).padStart(2, '0')} · ${topic}`, right: pick.kind === 'stat' || pick.kind === 'chart' ? (pick.value || '').toUpperCase() : pick.kind === 'versus' ? 'PRICE FREE' : pick.kind === 'step' || pick.step ? `STEP ${pick.step || pick.value}` : '' };
    // background colour: a new section (hook, a versus/stamp beat, the peak, the end) switches colour; otherwise it holds
    const switchHere = i === 0 || s.arc === 'peak' || s.arc === 'end' || pick.kind === 'versus' || pick.kind === 'stamp' || (i - lastBgBeat >= 4 && /[.!?]$/.test(sc[i - 1].text));
    if (switchHere && i > 0) { seg++; lastBgBeat = i; }
    s.bg = bgList[(style.bgPinned ? 0 : seg) % bgList.length];
  });
  return plan;
}
