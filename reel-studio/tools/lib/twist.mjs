// "Copy the style, then add a better twist" as MEASURABLE rules, not a vibe.
// makeTwist: a reference analysis + the author's one-sentence idea -> twist.json (what to keep, which levers to improve, with numeric targets).
// checkTwist: twist.json + facts about the finished film -> findings (empty = the twist is really in the film).
const PROOF = new Set(['ProofCard', 'BrowserWindow', 'RepoCard', 'PhoneFrame', 'ProfileCard', 'EvidenceCard', 'Terminal', 'HtmlBlock']);
const content = (t) => (String(t || '').toLowerCase().match(/[a-z]{4,}/g) || []);
export const LEVERS = {
  proof_layer: 'Show real evidence the reference does not: real captures (page, repo, post, terminal) on screen.',
  event_sound: 'Sound tied to visual events at a density near the reference, with no sound that has no cause.',
  loop_ending: 'The last line echoes a content word of the first line, so the replay feels seamless.',
  tighter_pace: 'Same family of pace, never slower: median shot no longer than the reference, cuts per 10 s at least 90 percent of it.',
  emotional_range: 'At least three different emotions across the spoken lines (story and dialogue films).',
};
export const STYLE_LEVERS = {
  palette_shift: 'Rotate the palette 20 to 110 degrees of hue (same brightness and saturation family): measured by the style critic.',
  character_swap: 'A different character in the same rendering style: other age, hair, outfit colour, profession. Confirmed by eye (style-check).',
  set_swap: 'The same lighting recipe in a different place with different set dressing. Confirmed by eye.',
  lighting_twist: 'Same key/rim logic, different practical colour or time of day. Confirmed by eye.',
  camera_twist: 'Same lens feel plus a purposeful move or closer angle the reference lacks. Confirmed by eye.',
  format_twist: 'Same look, different content format (skit, countdown, comparison). Confirmed by eye.',
  story_twist: 'A reversal or reveal the reference does not have, paid off in the last line. Confirmed by eye.',
};
export function makeTwist(A, idea, name = 'reference', shots = 6, levers = []) {
  const t = A?.timing || {}, cuts = t.cuts_per_10s, med = t.median_shot, sfx = A?.audio?.sfx_per_10s ?? A?.sound?.sfx_per_10s;
  if (!idea || idea.trim().split(/\s+/).length < 8) throw new Error('--idea must say in one sentence (8+ words) what is BETTER than the reference, e.g. "Same fast tech-news pace, but every claim gets a real captured proof card and the last line loops to the hook."');
  const styleLevers = (levers.length ? levers : A?.kind === 'image' ? ['palette_shift', 'character_swap'] : []).map((id) => { if (!STYLE_LEVERS[id]) throw new Error(`unknown style lever "${id}". Known: ${Object.keys(STYLE_LEVERS).join(', ')}`); return { id, rule: STYLE_LEVERS[id] }; });
  const keep = [cuts != null && { metric: 'cuts_per_10s', ref: cuts, range: [+(cuts * 0.75).toFixed(2), +(cuts * 1.4).toFixed(2)] }, med != null && { metric: 'median_shot', ref: med, range: [+(med * 0.7).toFixed(2), +(med * 1.15).toFixed(2)] }, A?.look?.brightness != null && { metric: 'brightness', ref: A.look.brightness, range: [+Math.max(0, A.look.brightness - 0.2).toFixed(2), +Math.min(1, A.look.brightness + 0.2).toFixed(2)] }].filter(Boolean);
  const improve = A?.kind === 'image' ? [] : [{ id: 'proof_layer', min_shots: Math.max(1, Math.round(shots / 5)) }, { id: 'event_sound', ref_per_10s: sfx ?? null }, { id: 'loop_ending' }, { id: 'tighter_pace', max_median: med ?? null, min_cuts_per_10s: cuts != null ? +(cuts * 0.9).toFixed(2) : null }, { id: 'emotional_range', min_emotions: 3, only_if_speakers: true }].map((l) => ({ ...l, rule: LEVERS[l.id] }));
  return { reference: name, idea: idea.trim(), keep, improve, style_levers: styleLevers, never_copy: ['script and wording', 'characters', 'scenes and shots', 'logos and brand marks', 'music'], created_at: new Date().toISOString() };
}
/** facts = { medianShot, cutsPer10, shots:[{component}], cuesPer10, lines:[{text,emotion,speaker}] } */
export function checkTwist(tw, f) {
  const out = [], bad = (id, problem, evidence, fix) => out.push({ lever: id, problem, evidence, fix });
  if (!tw || !tw.idea) return [{ lever: 'idea', problem: 'a reference was used but there is no twist.json', evidence: 'missing', fix: 'node tools/reference/twist.mjs <P> <ref> --idea "<what is better>"' }];
  for (const l of tw.improve || []) {
    if (l.id === 'proof_layer') { const n = (f.shots || []).filter((s) => PROOF.has(s.component)).length; if (n < l.min_shots) bad(l.id, 'not enough real-evidence shots', `${n} of ${l.min_shots} needed`, 'add a captured ProofCard, BrowserWindow, RepoCard, PhoneFrame or Terminal shot'); }
    if (l.id === 'event_sound' && l.ref_per_10s != null && f.cuesPer10 != null && (f.cuesPer10 < l.ref_per_10s * 0.5 || f.cuesPer10 > l.ref_per_10s * 2.5 + 2)) bad(l.id, 'sound density is far from the reference', `${f.cuesPer10.toFixed(1)} per 10 s vs ${l.ref_per_10s}`, 'add or remove event-tied sounds');
    if (l.id === 'loop_ending' && f.lines?.length > 1) { const a = new Set(content(f.lines[0].text)); if (!content(f.lines.at(-1).text).some((w) => a.has(w))) bad(l.id, 'the last line does not echo the first', `"${f.lines[0].text}" / "${f.lines.at(-1).text}"`, 'reuse a content word of the hook in the last line'); }
    if (l.id === 'tighter_pace') { if (l.max_median != null && f.medianShot > l.max_median * 1.0001) bad(l.id, 'slower than the reference', `median shot ${f.medianShot}s vs ${l.max_median}s`, 'shorten shots or cut more often'); if (l.min_cuts_per_10s != null && f.cutsPer10 < l.min_cuts_per_10s) bad(l.id, 'fewer cuts than the reference allows', `${f.cutsPer10} per 10 s vs ${l.min_cuts_per_10s}`, 'cut more often'); }
    if (l.id === 'emotional_range' && (f.lines || []).some((x) => x.speaker) && new Set((f.lines || []).map((x) => x.emotion || 'neutral')).size < l.min_emotions) bad(l.id, 'flat delivery', `${new Set((f.lines || []).map((x) => x.emotion || 'neutral')).size} emotion(s)`, 'give lines emotions (fear, shock, happy, sad...)');
  }
  return out;
}
