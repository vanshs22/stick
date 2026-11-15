#!/usr/bin/env node
// Script analyser + shot planner. Plain script in -> plan.json (per-line emotion, set, cast, clothes, poses, camera, insert,
// transition, sfx) + script.json (narration lines with caption chunks) + report.json (hook / pacing / structure checks).
// Rule-based: no AI service, no credits. The agent (or the user) writes the words; this decides how every frame should look.
//   node director.mjs script.txt --style amber-noir --out ../projects/my-video [--voice am_michael] [--speed 1.05]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEX = JSON.parse(fs.readFileSync(path.join(HERE, 'lexicon.json'), 'utf8'));
const STYLES = Object.fromEntries(fs.readdirSync(path.join(HERE, '../styles')).filter((f) => f.endsWith('.json')).map((f) => { const s = JSON.parse(fs.readFileSync(path.join(HERE, '../styles', f), 'utf8')); return [s.id, s]; }));

const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const norm = (t) => ' ' + t.toLowerCase().replace(/[^a-z0-9$:'% ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
const countHits = (padded, list) => list.reduce((n, w) => n + (padded.includes(' ' + w + ' ') ? 1 : 0), 0);
const words = (t) => t.split(/\s+/).filter(Boolean);

// ---------- 1. clean + split the script into beats (one beat = one cut) ----------
export function splitBeats(raw, maxWords = 13) {
  const fill = new RegExp(`\\b(very|really|actually|basically|literally|quite)\\s+`, 'gi');
  const sentences = raw.replace(/\r/g, '').split(/\n+/).flatMap((p) => p.match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g) || []).map((s) => s.replace(fill, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = [];
  for (const s of sentences) {
    let parts = [s];
    if (words(s).length > maxWords) parts = s.split(/(?<=,)\s+|\s+(?=(?:and|but|because|so|then|until|while|where|which)\s)/i).reduce((acc, p) => { const last = acc[acc.length - 1]; if (last && words(last).length < 5) acc[acc.length - 1] = last + ' ' + p; else acc.push(p); return acc; }, []);
    parts.forEach((p, i) => out.push(i < parts.length - 1 ? p.replace(/,$/, ',') : p));
  }
  return out.reduce((acc, l) => { const p = acc[acc.length - 1]; if (p && words(l).length <= 2 && !/[?!]$/.test(l) && !/^["“]/.test(l) && words(p).length + words(l).length <= maxWords && !/[.?!]$/.test(p)) acc[acc.length - 1] = p + ' ' + l; else acc.push(l); return acc; }, []);
}

// ---------- caption chunks ----------
function makeCaps(text, perChunk, emoWords) {
  const w = words(text); const chunks = []; let cur = [];
  for (const t of w) { cur.push(t); const stop = /[,.;:!?]$/.test(t); if (cur.length >= perChunk || (stop && cur.length >= 2)) { chunks.push(cur); cur = []; } }
  if (cur.length) { if (chunks.length && cur.length === 1) chunks[chunks.length - 1].push(cur[0]); else chunks.push(cur); }
  return chunks.map((c) => { let k = 0, best = -1; c.forEach((t, j) => { const n = t.toLowerCase().replace(/[^a-z0-9$:']/g, ''); const sc = (emoWords.has(n) ? 8 : 0) + (/\d|\$/.test(t) ? 6 : 0) + n.length; if (sc > best) { best = sc; k = j; } }); return c.map((t, j) => (j === k ? '*' + t : t)).join(' '); }).join(' | ');
}

// ---------- 2. whole-script pass: genre, cast, outfits ----------
function detectCast(lines, style) {
  const text = lines.join(' '), pad = norm(text), roleCount = {}, nameCount = {};
  for (const [role, def] of Object.entries(LEX.roles)) { const n = countHits(pad, def.words.filter((w) => !['he', 'him', 'she', 'her'].includes(w))); if (n) roleCount[role] = n; }
  lines.forEach((l) => { const toks = words(l); toks.forEach((t, i) => { const clean = t.replace(/[^A-Za-z']/g, ''); if (i > 0 && /^[A-Z][a-z]{2,}$/.test(clean) && !LEX.stop.includes(clean) && !/[.!?:]$/.test(toks[i - 1]) && !/^["“‘']/.test(t)) nameCount[clean] = (nameCount[clean] || 0) + 1; }); });
  const firstPerson = /\b(i|my|me|we|our)\b/i.test(text) ? (text.match(/\b(i|my|me)\b/gi) || []).length : 0, secondPerson = (text.match(/\b(you|your)\b/gi) || []).length;
  const ranked = [...Object.entries(nameCount).map(([k, v]) => ({ key: k, kind: 'name', n: v })), ...Object.entries(roleCount).map(([k, v]) => ({ key: k, kind: 'role', n: v }))].sort((a, b) => b.n - a.n);
  const cast = [{ id: 'hero', name: firstPerson >= 2 ? 'I' : secondPerson >= 2 ? 'You' : ranked[0]?.key || 'Hero', role: ranked[0]?.kind === 'role' && firstPerson < 2 && secondPerson < 2 ? ranked[0].key : 'hero' }];
  const used = new Set([cast[0].name, cast[0].role]);
  for (const r of ranked) { if (cast.length >= 3) break; if (used.has(r.key)) continue; used.add(r.key); cast.push({ id: 'c' + cast.length, name: r.key, role: r.kind === 'role' ? r.key : 'friend' }); }
  if (cast.length === 1) cast.push({ id: 'c1', name: 'other', role: ranked.find((r) => r.kind === 'role' && r.key !== cast[0].role)?.key || 'friend', implicit: true });
  const C = style.character, pal = C.outfits || ['#D6452F', '#2D5A9E', '#4FA36A', '#C9566E', '#E6B53C'];
  cast.forEach((c, i) => {
    const R = LEX.roles[c.role] || {}, h = hash(c.name + c.id);
    const female = !!R.female || (new RegExp(`${c.name}[^.!?]{0,40}\\b(she|her)\\b|\\b(she|her)\\b[^.!?]{0,40}${c.name}`, 'i').test(text) && c.name.length > 2);
    c.outfit = { top: R.top || (female ? 'dress' : C.defaultTop || 'tee'), color: R.color || pal[(h + i) % pal.length], hat: R.hat || 'none', female, faceless: !!R.faceless,
      skin: (C.skins || ['#E8B48C'])[(h >> 3) % (C.skins || ['#E8B48C']).length], hair: R.faceless ? 'none' : (female ? (h % 2 ? 'long' : 'bun') : ['curly', 'short', 'short', 'bald'][(h >> 5) % 4]) };
    if (c.id === 'hero' && !R.top) { c.outfit.top = C.heroTop || c.outfit.top; c.outfit.color = C.heroColor || c.outfit.color; }
  });
  return { cast, firstPerson, secondPerson };
}

// ---------- 3. per-line analysis ----------
function emotionOf(text, prev) {
  const pad = norm(text), score = {}; let total = 0;
  for (const [e, list] of Object.entries(LEX.emotion)) { const s = countHits(pad, list); if (s) { score[e] = s; total += s; } }
  const ex = (text.match(/!/g) || []).length, q = (text.match(/\?/g) || []).length, caps = words(text).filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w)).length;
  if (ex) { score.surprise = (score.surprise || 0) + 0.4 * ex; score.anger = (score.anger || 0) + 0.2 * ex; }
  if (q) score.tension = (score.tension || 0) + 0.35 * q;
  let emo = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0];
  const inten = LEX.intensifiers.filter((w) => pad.includes(' ' + w + ' ')).length;
  let intensity = clamp(0.28 * (score[emo] || 0) + 0.18 * ex + 0.15 * inten + 0.15 * caps + (emo ? 0.12 : 0));
  if (!emo) { emo = prev && prev.intensity > 0.45 ? prev.emotion : 'calm'; intensity = prev && emo !== 'calm' ? prev.intensity * 0.6 : 0.12; }
  return { emotion: emo, intensity, score };
}
function setOf(text, cur, style) {
  const pad = norm(text); let best = null, bs = 0;
  for (const [k, list] of Object.entries(LEX.sets)) { const s = countHits(pad, list); if (s > bs) { bs = s; best = k; } }
  const todHit = Object.entries(LEX.tod).map(([k, l]) => [k, countHits(pad, l)]).sort((a, b) => b[1] - a[1])[0], wHit = Object.entries(LEX.weather).map(([k, l]) => [k, countHits(pad, l)]).sort((a, b) => b[1] - a[1])[0];
  return { kind: best || cur.kind || style.sets.default, tod: todHit[1] ? todHit[0] : cur.tod || style.sets.tod, weather: wHit[1] ? wHit[0] : cur.weather || 'none', changed: !!best && best !== cur.kind };
}
function actionOf(text, emotion, arc) {
  const pad = norm(text); let best = null, bs = 0;
  for (const [k, def] of Object.entries(LEX.actions)) { const s = countHits(pad, def.words); if (s > bs) { bs = s; best = def.pose; } }
  if (best && !(bs === 1 && ['wait', 'no', 'this', 'that', 'there', 'why', 'how', 'who', 'never'].some((w) => pad.includes(' ' + w + ' ')) && emotion !== 'calm' && best !== 'run')) return best;
  return { fear: arc === 'peak' ? 'cower' : 'brace', tension: arc === 'build' ? 'think' : 'idle', anger: 'point', sad: 'relax', joy: arc === 'peak' ? 'cheer' : 'open', surprise: 'panic', relief: 'relax', smug: 'shrug', calm: 'idle' }[emotion] || 'idle';
}
function insertOf(text, props) {
  const t = text.match(/\b(\d{1,2})(?::(\d{2}))?\s?(a\.?m\.?|p\.?m\.?)/i); if (t) return { type: 'clock', value: `${t[1]}:${t[2] || '00'}` + ' ' + t[3].replace(/\./g, '').toUpperCase() };
  const t2 = text.match(/\b(\d{1,2}):(\d{2})\b/); if (t2) return { type: 'clock', value: `${t2[1]}:${t2[2]}` };
  const m = text.match(/\$\s?[\d,]+(?:\.\d+)?|\b[\d,]{3,}\s?(?:dollars|rupees|euros|bucks)\b/i); if (m) return { type: 'money', value: m[0].replace(/\s+/g, ' ').toUpperCase() };
  if (props.includes('door') && /\b(knock|knocked|knocking|door)\b/i.test(text)) return { type: 'door' };
  if (props.includes('phone') && /\b(ring|rang|call|called|text|texted|message)\b/i.test(text)) return { type: 'phone', value: /\bunknown\b/i.test(text) ? 'UNKNOWN' : '' };
  if (props.includes('letter') && /\b(letter|note|rule|rules|contract|document|diary)\b/i.test(text)) return { type: 'letter' };
  if (props.includes('light') && /\b(lights?|power|flashlight|candle|switch)\b/i.test(text) && /\b(off|out|flicker|flickered|died|dark)\b/i.test(text)) return { type: 'light' };
  return null;
}

export function direct(raw, styleId = 'auto', opts = {}) {
  const lines = splitBeats(raw, opts.maxWords || 13);
  if (!lines.length) throw new Error('empty script');
  // genre
  const all = norm(lines.join(' ')), g = { horror: countHits(all, LEX.emotion.fear) * 1.2 + countHits(all, ['ghost', 'haunted', 'midnight', 'scream']), comedy: countHits(all, LEX.emotion.smug) + countHits(all, LEX.emotion.joy) * 0.6 + (raw.match(/!/g) || []).length * 0.4, cozy: countHits(all, ['coffee', 'cafe', 'rain', 'quiet', 'morning', 'book', 'tea', 'peaceful', 'calm']) * 1.5, history: countHits(all, ['samurai', 'empire', 'king', 'queen', 'ancient', 'century', 'war', 'tower', 'castle', 'history', 'emperor', 'roman', 'japan']) * 2 + (/\b1[0-9]{3}\b/.test(raw) ? 3 : 0), explain: countHits(all, ['why', 'how', 'because', 'fact', 'science', 'rule', 'steps']) };
  const genre = Object.entries(g).sort((a, b) => b[1] - a[1])[0][1] > 1 ? Object.entries(g).sort((a, b) => b[1] - a[1])[0][0] : 'explain';
  const AUTO = { horror: 'amber-noir', comedy: 'cartoon-comedy', cozy: 'cozy-cafe', history: 'historical-cartoon', explain: 'safety-explainer' };
  const style = STYLES[styleId === 'auto' ? AUTO[genre] : styleId]; if (!style) throw new Error(`unknown style "${styleId}". Styles: ${Object.keys(STYLES).join(', ')}`);
  const { cast, firstPerson } = detectCast(lines, style);
  const emoWordSet = new Set(Object.values(LEX.emotion).flat().filter((w) => !w.includes(' ')));
  // per-line features
  let prev = null, setCur = {}, focusPrev = 'hero', lastOther = cast[1]?.id;
  const items = lines.map((text, i) => {
    const e = emotionOf(text, prev), pad = norm(text); if (genre === 'horror' && e.emotion === 'calm') { e.emotion = 'tension'; e.intensity = Math.max(e.intensity, 0.3); } prev = e;
    const set = setOf(text, setCur, style); setCur = { kind: set.kind, tod: set.tod, weather: set.weather };
    const toks = words(text), lower = pad;
    // who is in the line
    const mention = cast.filter((c) => c.id !== 'hero' && (lower.includes(' ' + c.name.toLowerCase() + ' ') || (LEX.roles[c.role]?.words || []).some((w) => lower.includes(' ' + w + ' ') && !['he', 'she', 'her', 'him'].includes(w))));
    const heroMention = /\b(i|me|my|we|you|your)\b/i.test(text) || lower.includes(' ' + cast[0].name.toLowerCase() + ' ');
    if (mention.length) lastOther = mention[0].id;
    let focus = mention.length && !heroMention ? mention[0].id : heroMention ? 'hero' : /\b(she|her)\b/i.test(text) ? (cast.find((c) => c.outfit.female)?.id || focusPrev) : /\b(he|him|his)\b/i.test(text) ? (cast.find((c) => !c.outfit.female && c.id !== 'hero')?.id || focusPrev) : focusPrev;
    if (!cast.find((c) => c.id === focus)) focus = 'hero'; focusPrev = focus;
    const quoted = text.match(/["“]([^"”]+)["”]/);
    const props = Object.entries(LEX.props).filter(([, l]) => countHits(pad, l) > 0).map(([k]) => k);
    const tj = LEX.timejump.some((w) => lower.includes(' ' + w + ' '));
    return { i, text, ...e, set, focus, others: mention.map((m) => m.id).filter((id) => id !== focus), heroMention, quoted: quoted ? quoted[1] : null, props, timejump: tj, nWords: toks.length };
  });
  // arc: hook / build / peak / resolve / end
  const n = items.length; let peak = 0, pv = -1;
  items.forEach((it, i) => { const p = i / Math.max(1, n - 1), w = p > 0.4 && p < 0.92 ? 1.25 : 1; if (it.intensity * w > pv) { pv = it.intensity * w; peak = i; } });
  if (pv < 0.35) peak = Math.min(n - 1, Math.round(n * 0.7));
  items.forEach((it, i) => { it.arc = i === 0 ? 'hook' : i === n - 1 ? 'end' : i === peak ? 'peak' : i < peak ? 'build' : 'resolve'; if (it.arc === 'peak') it.intensity = Math.max(it.intensity, 0.75); if (it.arc === 'hook') it.intensity = Math.max(it.intensity, 0.5); });
  // shots
  const P = style.pacing, cam = style.camera; let lastType = '', run = 0, insertGap = 9, prevEmo = 'calm', prevPose = 'idle', prevFocusMood = 'calm';
  const faceOf = (e) => LEX.face[e] || 'calm';
  const plan = items.map((it, i) => {
    const pose = actionOf(it.text, it.emotion, it.arc), insert = insertGap >= 1 && i > 0 ? insertOf(it.text, it.props) : null; insertGap = insert ? 0 : insertGap + 1;
    let type = 'medium';
    if (insert) type = 'insert';
    else if (it.set.changed || i === 0 || (it.timejump && it.set.kind)) type = it.nWords > 8 ? 'wide' : 'wide';
    else if (it.arc === 'peak' || it.intensity > 0.62 || it.quoted) type = 'close';
    else if (it.others.length || (it.focus !== 'hero')) type = 'two';
    else if (i % 3 === 2 && it.intensity > 0.3) type = 'close';
    if (type === lastType) run++; else run = 0;
    if (run >= 2) type = type === 'medium' ? 'close' : type === 'close' ? 'medium' : type === 'wide' ? 'medium' : 'two';
    if (it.arc === 'hook' && type === 'wide' && it.intensity > 0.5) type = 'close';
    lastType = type;
    const move = it.arc === 'peak' ? 'punch' : it.emotion === 'fear' || it.emotion === 'tension' ? 'handheld' : pose === 'run' ? 'track' : it.emotion === 'sad' || it.emotion === 'relief' ? 'pull' : type === 'wide' ? 'push' : (i % 2 ? 'push' : 'drift');
    const transition = it.timejump ? 'fade' : it.arc === 'peak' && it.intensity > 0.6 ? 'flash' : pose === 'run' || it.emotion === 'surprise' ? 'whip' : 'cut';
    const sfx = []; const pad = norm(it.text);
    for (const [s, list] of Object.entries(LEX.sfx)) if (countHits(pad, list) && sfx.length < 2 && !(s === 'heartbeat' && it.intensity < 0.5)) sfx.push({ type: s, gain: s === 'heartbeat' ? 0.55 : 0.6, word: (list.find((w) => pad.includes(' ' + w + ' ')) || '') });
    if (it.arc === 'peak' && !sfx.some((s) => s.type === 'slam')) sfx.push({ type: 'slam', gain: 0.6, word: '' });
    const mood = faceOf(it.emotion), costar = it.others[0] || (type === 'two' ? lastOther : null);
    const out = { ...it, shot: { type, move, zoom: +(cam.zoom * (type === 'close' ? 1.4 : type === 'wide' ? 0.8 : 1)).toFixed(3) }, insert, transition, sfx,
      pop: (it.text.match(/\$\s?[\d,]+|\b\d{1,2}:\d{2}\s?(?:AM|PM)?\b|\b\d{2,}\b/i) || [null])[0] || (/\b(never|nobody|only|rule \w+|do not|don't)\b/i.test(it.text) && it.intensity > 0.45 ? (it.text.match(/\b(never|nobody|only|do not|don't)\b/i)[0].toUpperCase()) : null),
      hero: { id: it.focus, pose: [[0, prevPose], [0.35, pose]], mood: [[0, prevFocusMood], [0.3, mood]], talk: true }, costar: costar ? { id: costar, pose: [[0, 'idle'], [0.4, it.emotion === 'fear' || it.emotion === 'surprise' ? 'panic' : it.emotion === 'anger' ? 'point' : 'idle']], mood: [[0, 'calm'], [0.4, it.emotion === 'joy' ? 'happy' : it.emotion === 'fear' ? 'scared' : it.emotion === 'anger' ? 'angry' : it.emotion === 'sad' ? 'sad' : 'calm']] } : null,
      bubble: it.quoted ? it.quoted.slice(0, 40) : null,
      fx: [...(it.emotion === 'fear' || it.emotion === 'tension' ? ['flicker'] : []), ...(it.set.weather === 'rain' ? ['rain'] : []), ...(it.set.weather === 'fog' ? ['fog'] : []), ...(it.arc === 'peak' ? ['flash'] : [])],
      grade: it.emotion };
    prevPose = pose; prevFocusMood = mood; prevEmo = it.emotion;
    return out;
  });
  // captions + script.json
  const lex = emoWordSet;
  const script = { title: opts.title || lines[0].replace(/[.!?]+$/, ''), voice: opts.voice || style.audio.voice, speed: opts.speed || style.audio.speed, lead: 0.3, outro: 1.0, gap: 0.22, music: genre === 'horror' || style.audio.music === 'tension' ? 'tension' : style.audio.music, style: style.id,
    lines: plan.map((p) => ({ text: p.text, caps: makeCaps(p.text, style.captions.words, lex) })) };
  // report
  const wc = lines.reduce((a, l) => a + words(l).length, 0), estDur = wc / (2.55 * script.speed);
  const first = lines[0], hookOk = words(first).length <= 11 && (/[?]/.test(first) || /\b(never|nobody|secret|why|what|how|last|first|\d)\b/i.test(first) || /\byou\b/i.test(first));
  const emos = new Set(plan.map((p) => p.emotion)), kinds = new Set(plan.map((p) => p.set.kind));
  const report = { style: style.id, genre, beats: n, words: wc, estimatedSeconds: +estDur.toFixed(1), cast: cast.map((c) => `${c.id}:${c.name}(${c.role})`), hook: { ok: hookOk, line: first, advice: hookOk ? 'ok' : 'Open with a question, a shock or a rule in 11 words or fewer. Patterns: ' + LEX.hookPatterns.join(' / ') },
    pacing: { longestBeatWords: Math.max(...plan.map((p) => p.nWords)), avgBeatSeconds: +(estDur / n).toFixed(2), note: estDur > 62 ? 'too long for a Short: cut to <= 60 s' : estDur < 18 ? 'very short: add a mid-story twist beat' : 'ok' },
    structure: { emotions: [...emos], variety: emos.size >= 3 ? 'ok' : 'flat: add a contrast beat (fear->relief, calm->shock)', locations: [...kinds], peakLine: plan.find((p) => p.arc === 'peak')?.text, endsOnLoop: /[?]$/.test(lines[n - 1]) || /\b(again|next|follow|comment)\b/i.test(lines[n - 1]) ? 'ok' : 'end on a question, twist or callback so viewers replay or comment' } };
  return { style, script, plan: { style: style.id, genre, cast, music: script.music, scenes: plan }, report };
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const a = process.argv.slice(2), arg = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
  if (!a[0] || a[0].startsWith('--')) { console.error('usage: director.mjs script.txt [--style auto|<id>] [--out dir] [--voice id] [--speed 1.05]\nstyles: ' + Object.keys(STYLES).join(', ')); process.exit(2); }
  const raw = a[0] === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(a[0], 'utf8');
  const res = direct(raw, arg('style', 'auto'), { voice: arg('voice'), speed: arg('speed') ? +arg('speed') : undefined });
  const out = path.resolve(arg('out', '.')); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'script.json'), JSON.stringify(res.script, null, 1)); fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify(res.plan, null, 1)); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(res.report, null, 1));
  console.log(JSON.stringify(res.report, null, 2));
  res.plan.scenes.forEach((s) => console.log(`${String(s.i).padStart(2)} ${s.arc.padEnd(7)} ${s.emotion.padEnd(8)} ${s.intensity.toFixed(2)} ${s.set.kind}/${s.set.tod}${s.set.weather !== 'none' ? '/' + s.set.weather : ''} ${s.shot.type}/${s.shot.move} ${s.hero.id}:${s.hero.pose[1][1]}${s.costar ? ' +' + s.costar.id : ''}${s.insert ? ' INSERT:' + s.insert.type : ''}${s.pop ? ' POP:' + s.pop : ''} ${s.transition} | ${s.text}`));
}
