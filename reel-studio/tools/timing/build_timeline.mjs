#!/usr/bin/env node
// THE timing core. storyboard + real word times -> timeline.json, which the Remotion project, the cue builder and the critics all read.
//   node tools/timing/build_timeline.mjs <projectDir> [--fps 30] [--preset word-pop]
// Needs: script/script.json, storyboard/storyboard.json, data/lines.json + data/words.json (from the voice tools), optional audio/audio-plan.json.
// Output: data/timeline.json, and a copy at remotion/src/data/timeline.json (+ audio/mix.wav -> remotion/public/audio/mix.wav when present).
// Every visual event is anchored to a SPOKEN WORD ({line, word}), so re-recording the voice re-times the whole video.
import fs from 'node:fs';
import path from 'node:path';

const a = process.argv.slice(2), P = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!P) { console.error('usage: build_timeline.mjs <projectDir> [--fps 30] [--preset word-pop]'); process.exit(2); }
const rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')), norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']+/g, '');
const script = rd('script/script.json'), sb = rd('storyboard/storyboard.json'), L = rd('data/lines.json'), W = rd('data/words.json'), fps = +opt('fps', 30), preset = opt('preset', (() => { try { return rd('brief.json').captions.preset; } catch { return 'word-pop'; } })() || 'word-pop');
const idx = Object.fromEntries(script.lines.map((l, i) => [l.id, i])), errs = [];
if (L.lines.length !== script.lines.length) errs.push(`data/lines.json has ${L.lines.length} lines but script.json has ${script.lines.length}: re-run the voice tools`);
// every script line belongs to exactly one shot, in order
const seen = []; sb.shots.forEach((s) => s.line_ids.forEach((id) => { if (!(id in idx)) errs.push(`shot ${s.id}: unknown line ${id}`); else seen.push(idx[id]); }));
seen.forEach((v, i) => { if (i && v <= seen[i - 1]) errs.push(`shots must follow the script order: line ${script.lines[v].id} is out of order`); });
script.lines.forEach((l, i) => { if (!seen.includes(i)) errs.push(`line ${l.id} is not covered by any shot`); });
const wordT = (line, word) => { const n = norm(word), li = idx[line]; const w = W.filter((x) => x.line === li).find((x) => norm(x.w) === n) || W.filter((x) => x.line === li).find((x) => norm(x.w).startsWith(n) && n.length > 2); return w ? w.s : null; };
const total = L.duration, shots = sb.shots.map((s, k) => {
  const first = L.lines[idx[s.line_ids[0]]], start = k === 0 ? 0 : Math.max(0, +(first.start - 0.08).toFixed(3));
  const anchors = {}; (s.anchors || []).forEach((an) => { const t = wordT(an.line, an.word); if (t == null) errs.push(`shot ${s.id}: anchor "${an.name}" word "${an.word}" not found in line ${an.line}`); else anchors[an.name] = +t.toFixed(3); });
  return { id: s.id, start, end: 0, component: s.component, props: s.props || {}, lines: s.line_ids, anchors, camera: s.camera || {}, transition_out: s.transition_out || {}, intent: s.visual_intent, ...(s.bg ? { bg: s.bg } : {}), ...(s.speaker ? { speaker: s.speaker } : {}), ...(s.presenter ? { presenter: s.presenter } : {}), ...(s.overlays ? { overlays: s.overlays.map((o) => { if (!o.anchor) return o; const an = (s.anchors || []).find((x) => x.name === o.anchor); return o; }) } : {}) };
});
shots.forEach((s, k) => { s.end = +(k + 1 < shots.length ? shots[k + 1].start : total).toFixed(3); if (s.end - s.start < 0.6) errs.push(`shot ${s.id} lasts only ${(s.end - s.start).toFixed(2)} s: merge it with a neighbour`); });
// captions: chunks of up to N words, broken at punctuation; the highlighted word = script emphasis, else a number, else the longest word
const N = { 'word-pop': 3, phrase: 5, 'one-word': 1, typewriter: 4, boxed: 4, karaoke: 4, headline: 6, dialogue: 6 }[preset] || 3, chunks = [];
script.lines.forEach((ln, li) => {
  const ws = W.filter((x) => x.line === li), emph = new Set((ln.emphasis || []).map(norm)); let cur = [];
  const flush = () => { if (!cur.length) return; const hi = cur.findIndex((x) => emph.has(norm(x.w))); const k = hi >= 0 ? hi : cur.findIndex((x) => /\d|\$/.test(x.w)) >= 0 ? cur.findIndex((x) => /\d|\$/.test(x.w)) : cur.reduce((b, x, j) => (norm(x.w).length > norm(cur[b].w).length ? j : b), 0);
    chunks.push({ t0: +(cur[0].s - 0.04).toFixed(3), t1: 0, words: cur.map((x, j) => ({ w: x.w, t: +x.s.toFixed(3), hi: j === k })) }); cur = []; };
  ws.forEach((x) => { cur.push(x); if (cur.length >= N || /[,.;:!?]$/.test(x.w) && cur.length >= (N === 1 ? 1 : 2)) flush(); }); flush();
});
chunks.forEach((c, i) => { const next = chunks[i + 1], last = c.words[c.words.length - 1].t; c.t1 = +(next ? Math.min(next.t0, last + 1.6) : total).toFixed(3); });
if (errs.length) { console.error('timeline NOT built:\n- ' + errs.join('\n- ')); process.exit(1); }
const style = (() => { try { return rd('style.json'); } catch { return {}; } })(), tl = { fps, width: 1080, height: 1920, duration: +(total + 0.2).toFixed(3), style: sb.style_pack, shots, captions: { preset, chunks }, words: W, audio: fs.existsSync(path.join(P, 'data/mix.wav')) ? 'audio/mix.wav' : '' };
if (style.size) { tl.width = style.size[0]; tl.height = style.size[1]; }
fs.mkdirSync(path.join(P, 'data'), { recursive: true }); fs.writeFileSync(path.join(P, 'data/timeline.json'), JSON.stringify(tl, null, 1));
const rem = path.join(P, 'remotion'); if (fs.existsSync(rem)) {
  fs.mkdirSync(path.join(rem, 'src/data'), { recursive: true }); fs.copyFileSync(path.join(P, 'data/timeline.json'), path.join(rem, 'src/data/timeline.json'));
  if (fs.existsSync(path.join(P, 'data/mix.wav'))) { fs.mkdirSync(path.join(rem, 'public/audio'), { recursive: true }); fs.copyFileSync(path.join(P, 'data/mix.wav'), path.join(rem, 'public/audio/mix.wav')); }
}
console.log(`timeline: ${shots.length} shots, ${chunks.length} caption chunks, ${tl.duration}s @ ${fps} fps -> data/timeline.json${fs.existsSync(rem) ? ' (+ remotion/src/data)' : ''}`);
