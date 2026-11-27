// Keyword scoring for captions (foundation/playbooks/caption.json, entry keyword-scoring): which word of a phrase carries the meaning.
// number or currency +3, negation +3, tool/brand/proper noun +2, change verb +2, absolute or superlative +2, first word of a sentence +1; stop words never.
const STOP = new Set('a an the and or but so to of in on at for with from by as is are was were be been it its this that these those i you he she we they me my your our their there here just very really then than also'.split(' '));
const NEG = /^(no|not|never|nobody|nothing|none|without|stop|don't|dont|can't|cant|won't|wont|isn't|isnt|doesn't|doesnt)$/;
const CHANGE = /^(fix|fixes|fixed|break|breaks|broke|cut|cuts|double|doubles|triple|boost|kill|kills|stop|steal|save|saves|win|wins|lose|loses|crash|build|built|automate|replace|remove|delete|find|finds|found|switch|connect|connects|install|scores?|rewrites?)$/;
const ABS = /^(free|every|everything|everyone|only|always|instantly|entire|whole|unlimited|zero|best|worst|fastest|official|completely|absolutely|billion|million|thousand|first|last)$/;
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9'$%.]/g, '').replace(/^\.+|\.+$/g, '');
export function scoreWords(text) {
  const raw = String(text).split(/\s+/).filter(Boolean);
  return raw.map((w, i) => {
    const n = norm(w), clean = w.replace(/[^A-Za-z0-9]/g, ''); let s = 0; const why = [];
    if (!n || STOP.has(n)) return { w, i, score: 0, why };
    if (/\d/.test(n) || /^\$/.test(n)) { s += 3; why.push('number'); }
    if (NEG.test(n)) { s += 3; why.push('negation'); }
    if (i > 0 && /^[A-Z][A-Za-z0-9]{2,}$/.test(clean) && !/[.!?]$/.test(raw[i - 1])) { s += 2; why.push('name'); }
    if (CHANGE.test(n)) { s += 2; why.push('change verb'); }
    if (ABS.test(n)) { s += 3; why.push('absolute'); }
    if (i === 0) { s += 1; why.push('first word'); }
    return { w, i, score: s, why };
  });
}
/** Caption string in the micro-syntax of tools/lib/chunker.mjs: chunks split with `|` (by phrase end, comma or maxWords), at most one `*accent` word per chunk, only when its score reaches `min`. */
export function autoCaption(text, { maxWords = 3, min = 3 } = {}) {
  const sc = scoreWords(text), chunks = []; let cur = [];
  sc.forEach((x, i) => { cur.push(x); const end = /[,.;:!?]$/.test(x.w) || cur.length >= maxWords || i === sc.length - 1; if (end) { chunks.push(cur); cur = []; } });
  return chunks.map((c) => { const best = c.reduce((b, x) => (x.score > b.score ? x : b), { score: 0 }); return c.map((x) => (x === best && best.score >= min ? '*' + x.w : x.w)).join(' '); }).join(' | ');
}
