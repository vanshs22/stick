// Caption micro-syntax for hand-written chunking. In script.json a line may carry
//   "caption": "TOTAL *MYTH | STUCK 7 *YEARS"
// `|` ends a caption chunk, `*word` marks the one accent word of the chunk. The words must repeat what is spoken, in order (punctuation and case are free).
// alignCaption() ties the chunks to the timed words of the line, so build_timeline.mjs can use them instead of the automatic chunker.
export const normWord = (w) => String(w).toLowerCase().replace(/[^a-z0-9']+/g, '');

export function parseCaption(text) {
  return String(text).split('|').map((c) => c.trim()).filter(Boolean).map((c) => c.split(/\s+/).map((t) => ({ w: t.replace(/^\*/, ''), hi: t.startsWith('*') })).filter((x) => normWord(x.w)));
}

/** words = timed words of ONE line [{w, s}]. Returns {chunks:[{t0, t1:0, words:[{w, t, hi, e?}]}]} or {error}. */
export function alignCaption(text, words, emoji = {}) {
  const parts = parseCaption(text), flat = parts.flat(), spoken = words.map((x) => normWord(x.w)).filter(Boolean);
  if (!flat.length) return { error: 'caption is empty' };
  const want = flat.map((x) => normWord(x.w));
  if (want.length !== spoken.length || want.some((w, i) => w !== spoken[i])) return { error: `caption words must repeat the spoken words in order. caption: "${want.join(' ')}" spoken: "${spoken.join(' ')}"` };
  for (const [i, c] of parts.entries()) if (c.filter((x) => x.hi).length > 1) return { error: `chunk ${i + 1} has more than one *accent word` };
  let k = 0; const chunks = [];
  for (const c of parts) {
    const ws = c.map((x) => { const t = words[k++], e = emoji[normWord(x.w)]; return { w: x.w, t: +t.s.toFixed(3), hi: x.hi, ...(e ? { e } : {}) }; });
    chunks.push({ t0: +(words[k - c.length].s - 0.04).toFixed(3), t1: 0, words: ws });
  }
  return { chunks };
}
