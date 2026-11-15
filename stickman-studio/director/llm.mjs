// Optional ONE-call LLM planner: understands meaning (sarcasm, metaphor, unusual places) and fills the storyboard fields the
// keyword director can only guess. Cost is one short request per video (about 1.5k tokens in, 1.5k out: well under a cent on
// Gemini Flash / GPT-4o-mini / Claude Haiku). Results are cached, validated against fixed lists, and merged over the rule plan,
// so a bad or missing answer can never break a render. No key set -> the rule-based plan is used as is.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), CACHE = path.join(HERE, '..', '.cache', 'llm');
export const ENUM = {
  emotion: ['fear', 'tension', 'anger', 'sad', 'joy', 'surprise', 'relief', 'smug', 'calm'],
  kind: ['elevator', 'hallway', 'street', 'outdoor', 'forest', 'office', 'cafe', 'kitchen', 'bedroom', 'room'],
  tod: ['day', 'dawn', 'dusk', 'night'], weather: ['none', 'rain', 'fog', 'snow'],
  pose: ['idle', 'relax', 'slump', 'brace', 'panic', 'reach', 'halt', 'phone', 'drink', 'point', 'open', 'cheer', 'shake', 'walk', 'run', 'hands', 'cower', 'think', 'shrug', 'wave'],
  shot: ['wide', 'medium', 'two', 'close', 'insert'], move: ['push', 'pull', 'drift', 'track', 'handheld', 'punch'],
  hold: ['phone', 'cup', 'letter', 'book', 'key', 'money', 'flashlight', 'sign', 'bag'], insert: ['clock', 'phone', 'money', 'door', 'letter', 'light'],
  sfx: ['thud', 'heartbeat', 'inhale', 'alarm', 'tock', 'sparkle', 'boing', 'zip', 'slam', 'pop'],
};
const pickOne = (v, list) => (list.includes(v) ? v : undefined);

const SYSTEM = `You are a storyboard director for short vertical videos with 3D stick-figure characters. You receive numbered narration beats and return ONLY JSON.
Understand MEANING, not keywords: sarcasm, metaphor and irony change the emotion; unusual places map to the closest allowed set.
Return {"genre": string, "viral_hook_alt": string, "beats":[{"i":int,"emotion":E,"intensity":0..1,"kind":K,"tod":T,"weather":W,"pose":P,"hold":H|null,"shot":S,"move":M,"insert":{"type":I,"value":string}|null,"pop":string|null,"bubble":string|null,"sfx":[X],"why":string}]} with exactly one object per beat.
E in ${ENUM.emotion}. K in ${ENUM.kind}. T in ${ENUM.tod}. W in ${ENUM.weather}. P in ${ENUM.pose}. H in ${ENUM.hold}. S in ${ENUM.shot}. M in ${ENUM.move}. I in ${ENUM.insert}. X in ${ENUM.sfx}.
Rules: beat 0 is the hook (strong visual, a pop word); put the emotional peak near 70% of the story; vary shots (no 3 identical in a row); use "insert" only when a prop is the point of the beat; "hold" is what the speaker holds in hand; "pop" is a 1-2 word kinetic keyword or number; "bubble" only for spoken dialogue; keep "why" under 8 words.`;

export function providers() { const e = process.env, out = []; if (e.GEMINI_API_KEY) out.push('gemini'); if (e.OPENAI_API_KEY) out.push('openai'); if (e.ANTHROPIC_API_KEY) out.push('anthropic'); if (e.OPENROUTER_API_KEY) out.push('openrouter'); if (e.LLM_PROVIDER === 'mock') out.push('mock'); return e.LLM_PROVIDER && out.includes(e.LLM_PROVIDER) ? [e.LLM_PROVIDER] : out; }

async function call(provider, system, user, timeoutMs = 45000) {
  const e = process.env, ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    if (provider === 'mock') return process.env.LLM_MOCK_REPLY || '{}';
    if (provider === 'gemini') { const m = e.LLM_MODEL || 'gemini-2.0-flash'; const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${e.GEMINI_API_KEY}`, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 3000 } }) }); if (!r.ok) throw new Error('gemini ' + r.status); return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text; }
    if (provider === 'openai' || provider === 'openrouter') { const url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions', key = provider === 'openai' ? e.OPENAI_API_KEY : e.OPENROUTER_API_KEY, m = e.LLM_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.0-flash-001'); const r = await fetch(url, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify({ model: m, temperature: 0.4, max_tokens: 3000, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }) }); if (!r.ok) throw new Error(provider + ' ' + r.status); return (await r.json()).choices?.[0]?.message?.content; }
    if (provider === 'anthropic') { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-api-key': e.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: e.LLM_MODEL || 'claude-3-5-haiku-latest', max_tokens: 3000, temperature: 0.4, system, messages: [{ role: 'user', content: user + '\nReturn only the JSON object.' }] }) }); if (!r.ok) throw new Error('anthropic ' + r.status); return (await r.json()).content?.[0]?.text; }
  } finally { clearTimeout(to); }
  throw new Error('unknown provider ' + provider);
}
const parseJSON = (t) => { if (!t) return null; try { return JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } } };

/** validate one beat against the fixed lists; anything invalid is dropped so the rule-based value stays */
export function cleanBeat(b) {
  if (!b || typeof b !== 'object') return {};
  const o = {}; const e = pickOne(b.emotion, ENUM.emotion); if (e) o.emotion = e;
  if (typeof b.intensity === 'number') o.intensity = Math.max(0, Math.min(1, b.intensity));
  const kind = pickOne(b.kind, ENUM.kind), tod = pickOne(b.tod, ENUM.tod), wx = pickOne(b.weather, ENUM.weather); if (kind) o.kind = kind; if (tod) o.tod = tod; if (wx) o.weather = wx;
  const pose = pickOne(b.pose, ENUM.pose); if (pose) o.pose = pose; if (b.hold === null || pickOne(b.hold, ENUM.hold)) o.hold = b.hold;
  const shot = pickOne(b.shot, ENUM.shot), mv = pickOne(b.move, ENUM.move); if (shot) o.shot = shot; if (mv) o.move = mv;
  if (b.insert === null) o.insert = null; else if (b.insert && pickOne(b.insert.type, ENUM.insert)) o.insert = { type: b.insert.type, ...(b.insert.value ? { value: String(b.insert.value).slice(0, 14) } : {}) };
  if (b.pop === null || typeof b.pop === 'string') o.pop = b.pop ? String(b.pop).slice(0, 14).toUpperCase() : null; if (b.bubble === null || typeof b.bubble === 'string') o.bubble = b.bubble ? String(b.bubble).slice(0, 40) : null;
  if (Array.isArray(b.sfx)) o.sfx = b.sfx.filter((x) => ENUM.sfx.includes(x)).slice(0, 2); if (typeof b.why === 'string') o.why = b.why.slice(0, 60);
  return o;
}

/** returns { beats:[cleaned], genre, hookAlt, provider, cached } or null */
export async function planWithLLM(beats, styleId, styleDesc) {
  const prov = providers(); if (!prov.length) return null;
  const key = crypto.createHash('sha1').update(JSON.stringify([beats, styleId, process.env.LLM_MODEL || '', prov[0]])).digest('hex').slice(0, 16), file = path.join(CACHE, key + '.json');
  if (fs.existsSync(file)) return { ...JSON.parse(fs.readFileSync(file, 'utf8')), cached: true };
  const user = `Style: ${styleId} - ${styleDesc}\nBeats:\n` + beats.map((t, i) => `${i}. ${t}`).join('\n');
  for (const p of prov) for (let attempt = 0; attempt < 2; attempt++) {
    try { const j = parseJSON(await call(p, SYSTEM, attempt ? user + '\nYour last reply was not valid JSON. Reply with the JSON object only.' : user)); if (j?.beats?.length) { const out = { provider: p, genre: j.genre, hookAlt: j.viral_hook_alt, beats: beats.map((_, i) => cleanBeat(j.beats.find((b) => b.i === i) || j.beats[i])) }; fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(file, JSON.stringify(out)); return out; } } catch (err) { console.error(`[llm ${p}] ${err.message}`); }
  }
  return null;
}

/** merge validated LLM beats over the rule-based plan, in place */
export function mergeInto(plan, llm) {
  if (!llm) return plan; let changed = 0;
  plan.scenes.forEach((s, i) => {
    const b = llm.beats[i]; if (!b) return; const had = JSON.stringify([s.emotion, s.set, s.hero.pose, s.shot]);
    if (b.emotion) { s.emotion = b.emotion; s.grade = b.emotion; s.hero.mood = [[0, s.hero.mood[0][1]], [0.3, { fear: 'scared', tension: 'worried', anger: 'angry', sad: 'sad', joy: 'happy', surprise: 'surprised', relief: 'relieved', smug: 'smirk', calm: 'calm' }[b.emotion]]]; }
    if (b.intensity != null) s.intensity = b.intensity; if (b.kind) s.set.kind = b.kind; if (b.tod) s.set.tod = b.tod; if (b.weather) s.set.weather = b.weather;
    if (b.pose) s.hero.pose = [[0, s.hero.pose[0][1]], [0.35, b.pose]]; if ('hold' in b) s.hold = b.hold || undefined; if (b.shot) s.shot.type = b.shot; if (b.move) s.shot.move = b.move;
    if ('insert' in b) s.insert = b.insert; if ('pop' in b) s.pop = b.pop; if ('bubble' in b && b.bubble) { s.bubble = b.bubble; s.quoted = b.bubble; } if (b.sfx) s.sfx = b.sfx.map((type) => ({ type, gain: 0.6, word: '' }));
    if (b.shot === 'insert' && !s.insert) s.shot.type = 'medium'; if (s.shot.type === 'insert' && !s.insert) s.shot.type = 'close'; s.why = b.why;
    if (had !== JSON.stringify([s.emotion, s.set, s.hero.pose, s.shot])) changed++;
  });
  plan.llm = { provider: llm.provider, cached: !!llm.cached, beatsChanged: changed, hookAlt: llm.hookAlt };
  return plan;
}
