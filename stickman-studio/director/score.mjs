// Virality + editing scorecard. Rubric follows what clip tools (OpusClip, ClipForge) score: hook, retention, emotion, clarity,
// shareability, loop, plus editing quality (variety, audio, captions). Every low score maps to a fix the pipeline applies itself.
//   scorePlan(plan, script, style, timing?) -> { total, grade, dims: {name: {score, note}}, fixes: [...] }
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const words = (t) => t.split(/\s+/).filter(Boolean);
const lin = (x, lo, hi) => clamp(((x - lo) / (hi - lo)) * 100);              // 0 at lo, 100 at hi
const band = (x, a, b, soft) => clamp(100 - Math.max(0, a - x, x - b) / soft * 100);   // 100 inside [a,b], falls off outside

export function scorePlan(plan, script, style, timing) {
  const S = plan.scenes, n = S.length, lines = script.lines.map((l) => l.text);
  const dur = timing?.lines ? timing.lines.map((l) => l.end - l.start) : S.map((s) => s.nWords / 2.6);
  const total = timing?.duration || dur.reduce((a, b) => a + b, 0) + n * 0.25, wc = lines.reduce((a, l) => a + words(l).length, 0);
  const t0 = timing?.lines ? timing.lines.map((l) => l.start) : (() => { let c = 0; return dur.map((d) => { const s = c; c += d + 0.25; return s; }); })();
  const first = lines[0], fw = words(first).length, last = lines[n - 1], dims = {}, fixes = [];
  const add = (k, score, note, fix) => { dims[k] = { score: Math.round(clamp(score)), note }; if (score < 70 && fix) fixes.push({ dim: k, score: Math.round(score), fix }); };

  // 1. HOOK (first 3 s): short, a question/shock/number/you/rule, and visually loud
  const hookWords = /\b(never|nobody|secret|why|what|how|last|first|only|rule|stop|warning|don't|dont|worst|best|shocking|truth)\b/i, hookSig = [/\?/.test(first), hookWords.test(first), /\d/.test(first), /\byou\b/i.test(first), S[0].intensity >= 0.5 || !!S[0].pop].filter(Boolean).length;
  add('hook', 0.5 * band(fw, 4, 11, 8) + 0.5 * lin(hookSig, 0, 3), `${fw} words, ${hookSig}/5 hook signals`, fw > 11 ? 'shorten the first line to 11 words or fewer' : 'open with a question, a number, a rule or a shock word');

  // 2. RETENTION: a visible change at least every 3.2 s, beats 1.6-3.2 s, no long holds
  const gaps = []; S.forEach((s, i) => { const d = dur[i] || 2.5, subs = Math.max(1, Math.ceil(d / 3.2)); for (let k = 0; k < subs; k++) gaps.push(d / subs); });
  const longest = Math.max(...gaps), avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  add('retention', 0.55 * band(avg, 1.4, 3.0, 2) + 0.45 * band(longest, 0, 3.4, 3), `avg shot ${avg.toFixed(1)} s, longest ${longest.toFixed(1)} s (long beats are auto-split)`, 'split long beats with a camera cut or insert every 3 s');

  // 3. EMOTION ARC: variety, a clear peak around 55-85 %, intensity range
  const emos = new Set(S.map((s) => s.emotion)), pk = S.findIndex((s) => s.arc === 'peak') / Math.max(1, n - 1), inten = S.map((s) => s.intensity), range = Math.max(...inten) - Math.min(...inten);
  add('emotion', 0.4 * lin(emos.size, 1, 4) + 0.3 * band(pk, 0.5, 0.85, 0.3) + 0.3 * lin(range, 0.1, 0.6), `${emos.size} emotions, peak at ${(pk * 100).toFixed(0)} %, range ${range.toFixed(2)}`, 'add a contrast beat (calm to shock, fear to relief) and place the peak near 70 %');

  // 4. CLARITY: speaking rate 2.3-3.1 words/s, short lines, simple words
  const rate = wc / total, long = lines.filter((l) => words(l).length > 13).length, avgLen = lines.join(' ').replace(/[^a-z ]/gi, '').length / wc;
  add('clarity', 0.5 * band(rate, 2.3, 3.1, 1.2) + 0.3 * (long ? 40 : 100) + 0.2 * band(avgLen, 3.6, 5.2, 1.5), `${rate.toFixed(1)} words/s, ${long} long lines, avg word ${avgLen.toFixed(1)} letters`, rate > 3.1 ? 'too dense: cut words or slow the voice' : rate < 2.3 ? 'too slow: tighten lines or raise speed' : 'split lines over 13 words');

  // 5. SHAREABILITY: specifics (numbers, names, times), direct address, comment bait
  const nums = (lines.join(' ').match(/\$?\d[\d:,.]*/g) || []).length, you = (lines.join(' ').match(/\b(you|your)\b/gi) || []).length, bait = /[?]\s*$/.test(last) || /\b(comment|tell me|would you|do you|what would)\b/i.test(last);
  add('shareability', 0.35 * lin(nums, 0, 3) + 0.3 * lin(you, 0, 4) + 0.35 * (bait ? 100 : 20), `${nums} specifics, ${you} direct address, ${bait ? 'ends with comment bait' : 'no comment bait'}`, 'end on a direct question to the viewer and add one concrete number or time');

  // 6. LOOP / ENDING: last line short and echoes the first line
  const key = (t) => new Set(words(t.toLowerCase().replace(/[^a-z ]/g, '')).filter((w) => w.length > 4)), kf = key(first), kl = key(last), echo = [...kl].some((w) => kf.has(w));
  add('loop', 0.4 * band(words(last).length, 3, 9, 6) + 0.35 * (echo ? 100 : 30) + 0.25 * (/[?!]$/.test(last) ? 100 : 40), `${words(last).length}-word ending, ${echo ? 'echoes the opening' : 'no callback to the opening'}`, 'finish with a short line that echoes the first line so the video loops');

  // 7. VISUAL VARIETY (editing): shot types, locations, inserts, props in hand, camera moves
  const types = new Set(S.map((s) => s.shot.type)), moves = new Set(S.map((s) => s.shot.move)), ins = S.filter((s) => s.insert).length, held = S.filter((s) => s.hold).length, locs = new Set(S.map((s) => s.set.kind));
  add('visuals', 0.3 * lin(types.size, 1, 4) + 0.2 * lin(moves.size, 1, 4) + 0.2 * band(ins, 1, 3, 2) + 0.15 * lin(locs.size, 1, 3) + 0.15 * lin(held + ins, 0, 3), `${types.size} shot types, ${moves.size} camera moves, ${ins} inserts, ${locs.size} locations`, 'add a prop insert and mix wide, medium and close shots');

  // 8. AUDIO + CAPTIONS: sound events per 10 s, voice-first mix, caption chunks of 1-3 words with emphasis
  const sfx = S.reduce((a, s) => a + s.sfx.length + 1, 0) + (S.filter((s) => s.insert).length), sfx10 = (sfx / total) * 10, caps = script.lines.flatMap((l) => l.caps.split('|')), over = caps.filter((c) => words(c).length > 3).length, emph = caps.filter((c) => c.includes('*')).length / caps.length;
  add('audio_captions', 0.4 * lin(sfx10, 1, 5) + 0.3 * (over ? 50 : 100) + 0.3 * lin(emph, 0.4, 1), `${sfx10.toFixed(1)} sound events/10 s, ${over} oversize captions, ${(emph * 100).toFixed(0)} % with highlighted word`, 'add sound hits on cuts and highlight one word per caption');

  const W = { hook: 0.22, retention: 0.2, emotion: 0.14, clarity: 0.1, shareability: 0.12, loop: 0.1, visuals: 0.07, audio_captions: 0.05 };
  const totalScore = Math.round(Object.entries(W).reduce((a, [k, w]) => a + dims[k].score * w, 0));
  return { total: totalScore, grade: totalScore >= 85 ? 'A' : totalScore >= 75 ? 'B' : totalScore >= 62 ? 'C' : 'D', dims, fixes, seconds: +total.toFixed(1), words: wc,
    verdict: totalScore >= 80 ? 'Strong: ready to post.' : totalScore >= 65 ? 'Decent: apply the listed fixes for a better first 3 seconds and ending.' : 'Weak: rewrite the hook and ending before rendering.' };
}

export function formatScore(r) {
  const bar = (s) => '█'.repeat(Math.round(s / 10)) + '░'.repeat(10 - Math.round(s / 10));
  return [`Viral score ${r.total}/100 (${r.grade}) · ${r.seconds}s · ${r.words} words`, r.verdict, '', ...Object.entries(r.dims).map(([k, v]) => `${k.padEnd(15)} ${bar(v.score)} ${String(v.score).padStart(3)}  ${v.note}`), ...(r.fixes.length ? ['', 'Fix first:', ...r.fixes.sort((a, b) => a.score - b.score).slice(0, 4).map((f) => `- ${f.dim}: ${f.fix}`)] : [])].join('\n');
}
