// The overlay brain: WHAT in a sentence deserves a picture, and WHICH device shows it (docs/OVERLAY-BRAIN.md). Learned from two reference reels (a game-HUD explainer and a "five skills" explainer):
// every concrete word (a number, a price, a date, a platform, a tool, an action, a list, a failure, a win) becomes a literal object, number or action on the word, inside ONE themed visual language.
import { propFor } from './concepts.mjs';
// Pure functions, no I/O: used by tools/overlay_director.mjs (plans overlays), tools/critics/storyboard.mjs (visual coverage) and the self-test.
export const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9'$%.]/g, '').replace(/^\.+|\.+$/g, '');
const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30, fifty: 50, hundred: 100, thousand: 1000, million: 1e6, billion: 1e9 };
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'], DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const PLATFORMS = { tiktok: 'TikTok', reels: 'Reels', shorts: 'Shorts', youtube: 'YouTube', instagram: 'Instagram', twitter: 'X', linkedin: 'LinkedIn', facebook: 'Facebook', snapchat: 'Snapchat', twitch: 'Twitch', spotify: 'Spotify', podcast: 'Podcast' };
const ACTIONS = { open: 'open', install: 'install', paste: 'paste', copy: 'copy', type: 'type', click: 'click', run: 'run', download: 'download', upload: 'upload', search: 'search', press: 'press', drag: 'drag', scroll: 'scroll', tap: 'tap', save: 'save', share: 'share', comment: 'comment', subscribe: 'subscribe', follow: 'follow', send: 'send', post: 'post', write: 'write', build: 'build', clone: 'clone', ask: 'ask', tell: 'tell', select: 'select', drop: 'drop' };
const FAIL = /^(nobody|nothing|never|flop|flops|flopped|flopping|fails|failing|fail|failed|struggle|struggling|wrong|mistake|mistakes|broken|broke|problem|problems|stuck|lost|forgets|forgot|kill|dead|worst|bad|scam|expensive|risk|crash)$/, WIN = /^(done|finished|ready|passed|works|working|win|wins|won|success|solved|perfect|best|easy|result|results|launched|shipped)$/;
const COST = /^(free|zero|\$0|nothing|cheap|gratis)$/, MONEY_WORD = /^(dollars?|bucks|money|cash|revenue|income|salary|paid|earn|earned|earning|profit|price|cost|million|billion|thousands?)$/, TIME_WORD = /^(seconds?|minutes?|hours?|days?|weeks?|months?|years?|instantly|overnight|yesterday|today|tomorrow|daily|monthly|weekly)$/;
const TOOLISH = (raw, i) => i > 0 && /^[A-Z][A-Za-z0-9]{2,}$/.test(raw.replace(/[^A-Za-z0-9]/g, '')) && !/^(I|The|This|That|And|But|So|Then|Next|First|Last|Now|Just|Every|Number|Step|Comment|Drop|Open|Copy|Paste|Click)$/.test(raw.replace(/[^A-Za-z0-9]/g, ''));
export const num = (t) => { const s = norm(t).replace(/[$,%]/g, ''); if (/^\d+(\.\d+)?$/.test(s)) return +s; return NUM_WORDS[s] ?? null; };

/** Every device a sentence could use, in the order they occur. Each: {i (token index), word, device, kind ('overlay' | 'card'), spec (overlay props or a card suggestion), why, priority 1..9}. */
export function detect(text, ctx = {}) {
  const raw = String(text).split(/\s+/).filter(Boolean), tk = raw.map(norm), out = [], add = (i, device, kind, spec, why, priority) => out.push({ i, word: raw[i].replace(/[^A-Za-z0-9$%.'-]/g, ''), device, kind, spec, why, priority });
  const skin = ctx.skin || {}, W = skin.words || {};
  for (let i = 0; i < tk.length; i++) {
    const t = tk[i], prev = tk[i - 1] || '', next = tk[i + 1] || '', next2 = tk[i + 2] || '';
    // 1. a number is a counter; a price or free is a tag; money gets falling bills
    const n = num(raw[i]);
    const afterName = i > 0 && (/^[A-Z]{2,}$/.test(raw[i - 1].replace(/[^A-Za-z]/g, '')) || (i > 1 && /^[A-Z][a-z]+$/.test(raw[i - 1].replace(/[^A-Za-z]/g, '')) && !/^(Number|Step|Only|About|Over|Just|Next|Last|First|Then|Under|Almost|Around)$/.test(raw[i - 1].replace(/[^A-Za-z]/g, ''))));   // 'GTA 6', 'iPhone 15', 'Windows 11': a name, not a quantity
    if (n != null && !afterName && /^\d/.test(norm(raw[i]).replace(/^\$/, '')) && !(MONTHS.includes(prev) && n <= 31) && !/^(st|nd|rd|th)$/.test(next)) {
      const money = /\$/.test(raw[i]) || MONEY_WORD.test(next) || /^(dollars?|bucks)$/.test(next), unit = next && !MONEY_WORD.test(next) && !/^(and|of|to|in|a|the|for|with)$/.test(next) ? raw[i + 1].replace(/[^A-Za-z]/g, '') : '';
      if (n === 0 && money) add(i, 'price-tag', 'overlay', { type: 'price-tag', text: '$0', sub: W.free || 'FREE' }, 'zero cost: a tag hung on the thing', 8);
      else if (n >= 3 || money) add(i, 'counter', 'overlay', { type: 'counter', to: n, prefix: money ? '$' : '', label: unit.toUpperCase(), dur: 1.4 }, `the number ${raw[i]} counts up to its word (a number said aloud is a number shown)`, 8);
    } else if (NUM_WORDS[t] && t !== 'one' && next && !/^(thousand|million|billion|hundred)$/.test(next) && !/^(and|of|to|in|a|the|for|with|or|but|is|are|was|that|it|more|than|as|you|they|we|i)$/.test(next) && !(prev === 'number' || prev === 'step') && !afterName) add(i, 'counter', 'overlay', { type: 'counter', to: NUM_WORDS[t], label: raw[i + 1].replace(/[^A-Za-z]/g, '').toUpperCase(), dur: 0.9 }, 'the spoken number "' + raw[i] + ' ' + raw[i + 1] + '" shown as a number with its unit (a number said aloud is a number shown)', 6);
    else if (NUM_WORDS[t] && next && /^(thousand|million|billion|hundred)$/.test(next)) add(i, 'counter', 'overlay', { type: 'counter', to: NUM_WORDS[t] * NUM_WORDS[next], label: '', dur: 1.4 }, 'a spoken big number', 7);
    if (/^(thousands?|millions?|billions?)$/.test(t) && /^(of)$/.test(next) && /^(dollars?|bucks)$/.test(next2)) add(i, 'rain', 'overlay', { type: 'rain', kind: 'bills', count: 22, dur: 2.2 }, 'thousands of dollars: bills fall (the amount made visible)', 8);
    if (((COST.test(t) && !/^(nothing)$/.test(t)) || (t === 'zero' && /^(dollars?|bucks|cost|costs)$/.test(next))) && !out.some((d) => d.device === 'price-tag')) add(i, 'price-tag', 'overlay', { type: 'price-tag', text: '$0', sub: W.free || 'FREE', color: skin.accent }, `"${raw[i]}" is a price: show the tag on the thing that is free`, 7);
    // 2. "no monthly fee", "no subscription": the cost is crossed out on a calendar
    if (t === 'no' && /^(monthly|yearly|subscription|fee|fees|cost|costs|charge|charges)$/.test(next)) add(i, 'crossed-calendar', 'overlay', { type: 'calendar', month: 'EVERY', day: '30', weekday: 'MONTHLY', crossed: true }, 'a recurring cost denied: a calendar crossed out', 8);
    // 3. a date or a day: a calendar page with the real date
    if (MONTHS.includes(t) && /^\d{1,2}(st|nd|rd|th)?$/.test(next)) { const mi = MONTHS.indexOf(t); add(i, 'calendar', 'overlay', { type: 'calendar', month: t.slice(0, 3).toUpperCase(), day: String(parseInt(next, 10)), weekday: '' }, 'a spoken date is a calendar page', 7); void mi; }
    else if (/^(today|tomorrow|yesterday)$/.test(t)) add(i, 'day-tag', 'overlay', { type: 'sticker', text: t.toUpperCase(), color: '#FFD84A', rotate: -4, size: 46 }, `"${t}" as a hanging day label`, 4);
    // 4. steps and ordinals: a step label or chip with n of N
    if (/^(first|next|then|last|finally|number|step)$/.test(t)) { const k = t === 'number' || t === 'step' ? num(raw[i + 1] || '') : null; add(i, 'step', 'overlay', { type: 'step-label', text: (W.step || 'STEP {n}/{N}').replace('{n}', k ?? '{n}').replace('{N}', '{N}'), n: k ?? undefined }, 'a numbered step: the viewer always knows where they are in the sequence', 6); }
    // 5. platforms: devices side by side (a list of 2+ platform words is one card, a single one a sticker)
    if (PLATFORMS[t] && !tk.slice(0, i).some((x) => PLATFORMS[x])) { const idx = tk.map((x, k) => (PLATFORMS[x] ? k : -1)).filter((k) => k >= 0); add(i, 'platform', 'card', { component: 'Devices', items: idx.map((k) => ({ label: PLATFORMS[tk[k]] })), anchorPrefix: 'd', item_tokens: idx }, idx.length > 1 ? 'where it goes: one phone per platform, each pops on its name' : 'where it goes: a device with the platform name', 6); }
    // 6. actions on a computer: a cursor and a terminal or window
    if (ACTIONS[t] && /^(it|claude|the|your|this|that|a|an|any|into|to|from|them|code)$/.test(next) || (ACTIONS[t] && next === '' && false)) add(i, 'action', 'overlay', { type: 'cursor', from: [300, 1000], to: [640, 800], dur: 0.7 }, `"${raw[i]}" is something the viewer should SEE done: a cursor performs it`, 4);
    // 7. failure and win: the verdict banner
    if (FAIL.test(t) && ctx.beat === 'hook' && !out.some((d) => d.device === 'verdict-bad')) add(i, 'verdict-bad', 'overlay', { type: 'verdict', text: W.fail || 'FAILED', tone: 'bad', retry: true }, `the problem stated in the hook ("${raw[i]}") as a failure banner`, 6);
    if (ctx.beat === 'cta' && t === 'no' && next === 'more' && FAIL.test(next2) && !out.some((d) => d.device === 'verdict-good')) add(i, 'verdict-good', 'overlay', { type: 'verdict', text: W.pass || 'PASSED', tone: 'good', sub: '' }, 'the failure from the hook is cancelled in the last line: the loop closes on a success banner', 7);
    if (WIN.test(t) && ctx.beat === 'cta' && !out.some((d) => d.device === 'verdict-good')) add(i, 'verdict-good', 'overlay', { type: 'verdict', text: W.pass || 'PASSED', tone: 'good', sub: '' }, `the result ("${raw[i]}") as a success banner`, 6);
    // 8. a tool, a brand, a product: a label plate on its card (capitalised mid-sentence word)
    if (ctx.keyword && raw[i].replace(/[^A-Za-z0-9]/g, '').toUpperCase() === String(ctx.keyword).toUpperCase() && ctx.beat === 'cta') add(i, 'cta-keyword', 'card', { component: 'CommentBox', keyword: String(ctx.keyword).toUpperCase() }, 'the comment keyword: the box types it and flips to Posted (one ask, one word)', 7);
    else if (TOOLISH(raw[i], i) && !PLATFORMS[t] && !WIN.test(t) && !FAIL.test(t) && !/^[A-Z]{3,}$/.test(raw[i].replace(/[^A-Za-z]/g, ''))) add(i, 'brand', 'overlay', { type: 'callout', text: raw[i].replace(/[^A-Za-z0-9]/g, ''), size: 36 }, `a named tool or brand ("${raw[i]}"): a label so the viewer can find it`, 3);
    // 9. time quantities: a clock sticker
    if (TIME_WORD.test(t) && n == null && /^\d/.test(prev)) add(i, 'time', 'overlay', { type: 'sticker', text: `${prev} ${t}`.toUpperCase(), color: '#FFD84A', size: 46, rotate: 4 }, 'a duration said with a number', 4);
    // 10. a question: a thinking bubble
    if (/\?$/.test(raw[i]) && i >= 2) add(i, 'question', 'overlay', { type: 'bubble', text: raw.slice(Math.max(0, i - 2), i + 1).join(' ').replace(/\?$/, '?'), emoji: '\u{1F914}', size: 32 }, 'a question the viewer is asked to hold', 3);
    // 15. speed and level words: a gauge whose needle sweeps on the word (playbook overlay/speed-dial)
    if ((/^(faster|quicker|speedier|speed|boost|turbo)$/.test(t) || /^\d+x$/.test(t)) && !out.some((d) => d.device === 'dial')) add(i, 'dial', 'overlay', { type: 'dial', label: /^\d+x$/.test(t) ? t.toUpperCase() : (W.fast || 'FASTER'), sub: 'SPEED', from: 0.12, to: 0.94, dur: 0.9 }, `"${raw[i]}" is a level: a gauge sweeps up on the word`, 6);
    // 11. warning words
    if (/^(careful|warning|danger|never|dont|don't|avoid|beware)$/.test(t)) add(i, 'warning', 'overlay', { type: 'warning', text: raw.slice(i, i + 5).join(' ').replace(/[.,!?]$/, '').toUpperCase() }, 'a warning in a plate', 5);
  }
  // 12. a LIST: "a, b, and c" (3 to 6 short items) is ONE card with one lit slot per spoken item, each on its own word
  const m = String(text).match(/((?:[A-Za-z][\w' -]{1,30},\s+){2,5})(?:and |or )?([A-Za-z][\w' -]{1,30})[.!?]?$/);
  if (m) { const chunks = [...m[1].split(/,\s+/).filter(Boolean), m[2]].map((s) => s.replace(/^(and|or)\s+/i, '').trim()), DET = /^(the|a|an|your|my|our|their|its|his|her|these|those|any|all|some|every)$/i, head = (s) => { const w = s.split(/\s+/), k = w.map((x) => DET.test(x)).lastIndexOf(true); return (k >= 0 ? w.slice(k + 1) : w.slice(-1)).filter((x) => !/^(and|or)$/i.test(x)).slice(0, 2).join(' '); }, items = chunks.map(head).filter(Boolean), platformy = items.filter((s) => PLATFORMS[norm(s.split(/\s+/).pop())]).length >= 2, ordinal = /^(first|next|then|last|finally|also|now|so)$/i.test(items[0] || '');
    if (!platformy && !ordinal && items.length >= 3 && items.length <= 6 && items.every((s) => s.split(/\s+/).length <= 2 && s.length <= 18)) { const tok = items.map((it) => { const w = it.split(/\s+/).pop().toLowerCase(); let k = -1; tk.forEach((x, j) => { if (x === w.replace(/[^a-z0-9'$%.]/g, '')) k = j; }); return k; }); if (tok.every((k) => k >= 0)) add(tok[0], 'list', 'card', { component: 'RadialMenu', items: items.map((s) => s.toUpperCase()), anchorPrefix: 'item', item_tokens: tok }, 'a list of options: ' + items.join(' / ') + ' (one wheel, each sector lights on its word)', 7); } }
  // 13. comparison: with / without, vs, instead of, than
  if (/\b(versus|vs\.?|instead of|rather than)\b/i.test(text) || (/\bwithout\b/i.test(text) && /\bwith\b/i.test(text))) add(tk.findIndex((x) => /^(versus|vs|instead|without|than)$/.test(x)), 'compare', 'card', { component: 'Versus' }, 'two things face to face', 6);
  // 14. a picture for any other concrete or abstract word (docs/OVERLAY-BRAIN.md, "Unusual ideas"): ONE prop candidate per line, the idea-metaphor first, then the rarest concrete noun
  if (!ctx.noProps && !out.some((d) => d.device === 'prop')) {
    const c = tk.map((t, i) => ({ i, p: propFor(raw[i]), t })).filter((x) => x.p && !PLATFORMS[x.t] && !(out.some((d) => d.i === x.i))).sort((a, b) => (b.p.abstract - a.p.abstract) || (b.t.length - a.t.length))[0];
    if (c) add(c.i, 'prop', 'overlay', { type: 'prop', emoji: c.p.emoji, anim: c.p.anim, size: 180 }, c.p.why, c.p.abstract ? 5 : 4);
  }
  return out.filter((d) => d.i >= 0);
}

/** words in the script that deserve a picture (what detect finds, as a count) */
export const worthy = (text, ctx) => detect(text, ctx).filter((d) => d.priority >= 4);

/** Visual beats of a built storyboard: film times of every overlay and card event (anchors). Returns sorted times. */
export function eventTimes(shots, timeline) {
  const out = []; const tl = Object.fromEntries((timeline?.shots || []).map((s) => [s.id, s]));
  for (const s of shots) { const t = tl[s.id]; if (!t) continue; out.push(+t.start.toFixed(2)); for (const o of s.overlays || []) { if (['label', 'step-label', 'backword'].includes(o.type)) continue; const at = o.anchor && t.anchors?.[o.anchor] != null ? t.anchors[o.anchor] : o.at != null ? t.start + o.at : null; if (at != null) out.push(+at.toFixed(2)); }
    const pa = s.props?.anchor; if (pa && t.anchors?.[pa] != null) out.push(+t.anchors[pa].toFixed(2)); const pre = s.props?.anchorPrefix; if (pre) for (const [k, v] of Object.entries(t.anchors || {})) if (k.startsWith(pre) && /\d+$/.test(k)) out.push(+v.toFixed(2)); }
  return [...new Set(out)].sort((a, b) => a - b);
}
/** gaps between visual beats: the reference reels renew the picture every 1.3 to 1.5 s (median) and never leave more than 4 to 6 s */
export function gaps(times, total) { const t = [0, ...times, total].sort((a, b) => a - b), g = []; for (let i = 1; i < t.length; i++) g.push({ from: t[i - 1], to: t[i], gap: +(t[i] - t[i - 1]).toFixed(2) }); return g; }
