#!/usr/bin/env node
// Competitor and trend structure analysis from PUBLIC data: what formats work, never what they said. Needs the user's OK (same switch as search.mjs).
//   node tools/research/competitors.mjs <P> "<topic>" [--n 8] [--user-said "<their words>"]
// Uses yt-dlp search + public metadata (title, views, duration, date). Per video it keeps METRICS only (length, words per minute when subtitles are
// readable, hook type, call-to-action type, title pattern). Scripts are not stored, so nothing here can be copied.
import fs from 'node:fs';
import path from 'node:path';
import { run, rd, bin } from '../lib/pipeline.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), topic = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !topic) { console.error('usage: competitors.mjs <P> "<topic>" [--n 8] [--user-said "..."]'); process.exit(2); }
const brief = fs.existsSync(path.join(P, 'brief.json')) ? rd(path.join(P, 'brief.json')) : {}, mode = brief.research?.agent_reach || 'ask'; if (mode === 'no') { console.error('competitor research is switched off for this project'); process.exit(1); }
if (mode === 'ask' && !opt('user-said')) { console.error('Optional step. Ask the user "Should I analyse what works for competitors on this topic?" then pass --user-said "<their answer>".'); process.exit(1); }
const yt = bin('yt-dlp', 'YTDLP'), N = +opt('n', 8), r = run(yt, [`ytsearch${N * 2}:${topic} shorts`, '--flat-playlist', '--dump-json', '--no-warnings'], { timeout: 120000 });
if (r.error || (r.status && !r.stdout)) { console.error('search failed: ' + (r.error ? 'yt-dlp is not installed' : r.stderr.slice(-300))); process.exit(1); }
const vids = r.stdout.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((v) => v.duration && v.duration < 180).slice(0, N);
const HOOK = (t) => (/\?\s*$/.test(t.trim().split(/[.!]/)[0] + '?') && /^(what|why|how|did|do|can|is|are|would|have)\b/i.test(t.trim()) ? 'question' : /\b(\d+|never|stop|secret|nobody|everyone|wrong|mistake)\b/i.test(t) ? 'bold claim / number' : /\b(i |my |we )/i.test(t) ? 'story / first person' : 'statement');
const out = vids.map((v) => ({ url: v.url, title: v.title, channel: v.channel || v.uploader, views: v.view_count ?? null, duration: v.duration, title_pattern: HOOK(v.title || ''), title_words: (v.title || '').split(/\s+/).length }));
const views = out.map((o) => o.views).filter(Boolean).sort((x, y) => x - y), med = views.length ? views[Math.floor(views.length / 2)] : null, dur = out.map((o) => o.duration).sort((x, y) => x - y);
const words = {}; out.forEach((o) => (o.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w.length > 3).forEach((w) => (words[w] = (words[w] || 0) + 1)));
const summary = { topic, analysed: out.length, median_views: med, median_duration_s: dur.length ? dur[Math.floor(dur.length / 2)] : null, title_patterns: Object.entries(out.reduce((m, o) => ((m[o.title_pattern] = (m[o.title_pattern] || 0) + 1), m), {})), common_title_words: Object.entries(words).sort((x, y) => y[1] - x[1]).slice(0, 8), top_by_views: [...out].sort((x, y) => (y.views || 0) - (x.views || 0)).slice(0, 3).map((o) => `${o.title} (${o.views ?? '?'} views, ${o.duration}s)`), note: 'Metrics from public search results; the sample is small and YouTube ranks by relevance, so treat it as a hint, not a verdict.', retrieved_at: new Date().toISOString() };
fs.mkdirSync(path.join(P, 'research'), { recursive: true }); fs.writeFileSync(path.join(P, 'research/competitors.json'), JSON.stringify({ summary, videos: out }, null, 1));
fs.writeFileSync(path.join(P, 'research/opportunities.md'), `# Competitor structure: ${topic}\n\n- ${out.length} public videos analysed, median ${summary.median_views ?? '?'} views, median length ${summary.median_duration_s}s\n- Title patterns: ${summary.title_patterns.map(([k, v]) => `${k} x${v}`).join(', ')}\n- Common words: ${summary.common_title_words.map(([w, c]) => `${w}(${c})`).join(', ')}\n- Strongest: ${summary.top_by_views.join(' | ')}\n\nUse: choose a structure that works, then find an angle none of them cover. Never reuse their scripts or shots.\n`);
console.log(`research/competitors.json + opportunities.md (${out.length} videos)`); 
