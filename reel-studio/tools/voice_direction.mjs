#!/usr/bin/env node
// Voice direction: turns a script into what a human performer (or a TTS engine) needs: pauses, pace, energy, stress words, breaths, small hesitations, and the gesture beats they drive.
//   node tools/voice_direction.mjs <script.json> [out.json]      writes voice-direction.json (default next to the script) and prints a performance sheet
// Rules (skills/story-writer/SKILL.md): the pause BEFORE a punchline is longer than the pause after it; questions end rising; a list speeds up; the hook is said like you mean it; the CTA is warm and slow; nobody breathes between every sentence.
import fs from 'node:fs';
import path from 'node:path';
const [f, o] = process.argv.slice(2); if (!f) { console.error('usage: voice_direction.mjs <script.json> [out.json]'); process.exit(2); }
const sc = JSON.parse(fs.readFileSync(f, 'utf8')), n = sc.lines.length;
const EN = { curious: ['mid', 'mid-high', 1.0], fear: ['mid', 'high', 1.08], anger: ['high', 'mid', 1.06], sad: ['low', 'low', 0.9], proud: ['mid', 'mid', 0.96], excited: ['high', 'high', 1.1], shock: ['high', 'high', 0.95], neutral: ['mid', 'mid', 1.0], determined: ['mid', 'low', 0.97], calm: ['low', 'mid', 0.94], sarcastic: ['mid', 'mid-low', 0.95], whisper: ['low', 'low', 0.88], happy: ['mid', 'mid-high', 1.04] };
const lines = sc.lines.map((l, i) => {
  const [energy, pitch, speed] = EN[l.emotion] || EN.neutral, t = l.text, short = t.split(/\s+/).length <= 5, q = /\?\s*$/.test(t), punch = l.beat === 'twist' || l.beat === 'proof' || /\b(then|until|but)\b/i.test(t.split(/[.!?]/)[0]);
  const d = { speed: +(speed * (i === 0 ? 1.04 : i === n - 1 ? 0.94 : 1)).toFixed(2), energy: i === 0 ? 'high' : i === n - 1 ? 'mid-warm' : energy, pitch: q ? 'rising-end' : pitch, pause_before: +(punch ? 0.3 : i === 0 ? 0 : short ? 0.12 : 0.06).toFixed(2), pause_after: +(q ? 0.55 : i === n - 1 ? 0.5 : short ? 0.4 : 0.28).toFixed(2), breath: !short && t.split(/\s+/).length > 9 && i > 0, stress: (l.emphasis && l.emphasis.length ? l.emphasis : (t.match(/\b[A-Z]{3,}\b|\b\d+\b/g) || []).concat((t.match(/\b(never|only|twice|slowly|nobody|always|dumbest|pull|push|one)\b/gi) || []))).slice(0, 3), ...(l.delivery || {}) };
  const marks = t.replace(/,\s/g, ', … ').replace(/\.\s+(?=[A-Z])/g, '. … ');   // a TTS engine reads "…" as a short pause; a performer reads it as a beat
  return { id: l.id, text: t, emotion: l.emotion || 'neutral', delivery: d, tts_text: marks, gestures: d.stress.map((w) => ({ at_word: w, beat: /^(never|only|nobody)$/i.test(w) ? 'point' : 'head-nod' })), note: q ? 'ends rising; leave room for the viewer to answer' : punch ? 'a beat of silence before the turn, then land it quietly' : i === 0 ? 'say it like it just happened to you' : '' };
});
const out = path.resolve(o || path.join(path.dirname(f), 'voice-direction.json')); fs.writeFileSync(out, JSON.stringify({ title: sc.title, lines }, null, 1) + '\n');
for (const l of lines) console.log(`${l.id}  ${l.emotion.padEnd(10)} speed ${l.delivery.speed}  energy ${l.delivery.energy.padEnd(8)} pitch ${l.delivery.pitch.padEnd(11)} pause ${l.delivery.pause_before}/${l.delivery.pause_after}${l.delivery.breath ? '  breath' : ''}  stress [${l.delivery.stress.join(', ')}]  ${l.note}`); console.log(`written ${out}`);
