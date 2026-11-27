// Voice direction: an emotional arc and a natural pause map for a script, so a narration is never read flat.
// Used automatically by build_tts_input.mjs when a script has no emotions (the author's own `emotion` always wins) and by tools/audio/direct_voice.mjs to write them into the script.
export const EMOTIONS = ['neutral', 'happy', 'excited', 'sad', 'fear', 'shock', 'anger', 'calm', 'sarcastic', 'whisper', 'determined', 'curious', 'proud'];
const BEAT = { hook: 'curious', stakes: 'determined', setup: 'calm', step: 'determined', mechanism: 'calm', proof: 'proud', objection: 'curious', twist: 'shock', cta: 'happy', save: 'happy' };
const ALT = { curious: 'excited', determined: 'calm', calm: 'curious', proud: 'happy', shock: 'curious', happy: 'excited' };
const RISK = /\b(lose|lost|risk|danger|scam|steal|stolen|fake|trap|hack|breach|leak|attack|mistake|wrong|never|cost|expensive|worst)\b/i;
const SAD = /\b(sadly|unfortunately|failed|gone|miss|regret|too late|nobody)\b/i;
/** one emotion per line from its beat, its punctuation and its words; never the same emotion three times in a row; at least three different ones in a film of 5+ lines */
export function autoDirect(lines) {
  const out = []; let prev = null, run = 0;
  lines.forEach((l, i) => {
    const t = String(l.text || ''); let e = BEAT[l.beat] || (i === 0 ? 'curious' : i === lines.length - 1 ? 'happy' : 'calm');
    if (/\?!|!\?/.test(t) || (/^(wait|no way|what)\b/i.test(t) && t.length < 25)) e = 'shock';
    else if (/\.\.\.|…$/.test(t)) e = SAD.test(t) ? 'sad' : 'fear';
    else if (SAD.test(t)) e = 'sad';
    else if (RISK.test(t) && ['stakes', 'objection', 'hook'].includes(l.beat || (i === 0 ? 'hook' : ''))) e = i === 0 ? 'curious' : 'fear';
    else if (/!\s*$/.test(t) && e !== 'happy') e = 'excited';
    if (e === prev && run >= 2) e = ALT[e] || 'calm';
    run = e === prev ? run + 1 : 1; prev = e; out.push(e);
  });
  const kinds = new Set(out); if (lines.length >= 5 && kinds.size < 3) { const mid = Math.floor(lines.length / 2); out[mid] = out[mid] === 'proud' ? 'excited' : 'proud'; if (new Set(out).size < 3) out[1] = out[1] === 'curious' ? 'determined' : 'curious'; }
  return out;
}
/** pause after each line (seconds): shaped by the line's ending and its job in the story, with a small deterministic jitter so no two pauses are equal */
export function pauseMap(lines, base = 0.25) {
  return lines.map((l, i) => {
    const t = String(l.text || '').trim(); let g = base;
    if (/\?\s*$/.test(t)) g = 0.46; else if (/(\.\.\.|…)\s*$/.test(t)) g = 0.5; else if (/!\s*$/.test(t)) g = 0.3; else if (/,\s*$/.test(t)) g = 0.12; else if (/:\s*$/.test(t)) g = 0.35;
    if (l.beat === 'hook') g += 0.14; if (l.beat === 'twist') g += 0.12; if (l.beat === 'proof') g += 0.06; if (l.beat === 'cta' || l.beat === 'save') g -= 0.06;
    if (i === lines.length - 1) g = 0.4;
    let h = 0; for (const c of String(l.id || i)) h = (h * 31 + c.charCodeAt(0)) % 997; g += ((h % 9) - 4) * 0.01;
    return +Math.max(0.08, Math.min(0.8, g)).toFixed(2);
  });
}
