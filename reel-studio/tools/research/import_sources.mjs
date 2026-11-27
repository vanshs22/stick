#!/usr/bin/env node
// Research WITHOUT Agent-Reach: you (or the user) bring the material, this records it with provenance in research/sources.json (same format as search.mjs).
// Use when Agent-Reach is not installed, the user said no, a site blocks automated access, or the user hands you exports and notes.
//   node tools/research/import_sources.mjs <P> --url <u> [--title "..."] [--note "what it says / why it matters"] [--fetch]   a page you or the user found (--fetch tries to download its text)
//   node tools/research/import_sources.mjs <P> --file <notes.md|.txt|.html|.pdf-text> [--title "..."] [--url <origin>]        a file the user supplied (copied into research/pages/)
//   node tools/research/import_sources.mjs <P> --text "<pasted excerpt>" --title "..." [--url <origin>]                       text the user pasted
//   node tools/research/import_sources.mjs <P> --competitors <list.csv>                                                      the user's own list: title,url,views,duration,date (METRICS only, never scripts)
// Every entry records HOW it arrived (via: user-supplied | fetched | user-listed) so the research critic and the report never claim a retrieval that did not happen.
// Nothing here bypasses access controls: if a page needs a login or a paywall, the user supplies the text they are allowed to use.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !['url', 'file', 'text', 'competitors'].some((k) => a.includes('--' + k))) { console.error('usage: import_sources.mjs <P> (--url u [--fetch] | --file f | --text "..." | --competitors list.csv) [--title t] [--note n]'); process.exit(2); }
const rdir = path.join(P, 'research'); fs.mkdirSync(path.join(rdir, 'pages'), { recursive: true });
const sf = path.join(rdir, 'sources.json'), S = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')) : { sources: [] };
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const add = (o) => { const dup = o.url && S.sources.find((s) => s.url === o.url); if (dup) { console.log(`already recorded: ${dup.id} ${o.url}`); return dup; } const s = { id: 'S' + (S.sources.length + 1), channel: 'manual', query: null, author: null, published_at: null, retrieved_at: new Date().toISOString(), ...o }; S.sources.push(s); return s; };
const save = (id, title, url, text) => { const f = path.join(rdir, 'pages', `${id}.md`); fs.writeFileSync(f, `# ${title}\n\nSource: ${url || '(user-supplied, no URL)'}\nRecorded: ${new Date().toISOString()}\n\n${text}\n`); return path.relative(P, f); };
if (opt('url')) {
  const url = opt('url'); let text = '', via = 'user-listed', title = opt('title', url);
  if (a.includes('--fetch')) { try { const res = await fetch(url, { headers: { 'User-Agent': 'reel-studio research' }, signal: AbortSignal.timeout(20000) }); if (res.ok) { const h = await res.text(); text = strip(h).slice(0, 20000); via = 'fetched'; title = opt('title', (h.match(/<title[^>]*>([^<]+)/i) || [])[1] || url); } else console.log(`could not fetch (HTTP ${res.status}): recorded as user-listed; the user can paste the text with --text`); } catch (e) { console.log(`could not fetch (${e.message}): recorded as user-listed`); } }
  const s = add({ title, url, via, snippet: (text || opt('note', '')).slice(0, 320), note: opt('note', null) }); if (text) s.page = save(s.id, title, url, text);
  console.log(`${s.id} ${via}: ${title}`);
} else if (opt('file')) {
  const f = path.resolve(opt('file')); if (!fs.existsSync(f)) { console.error(`no such file: ${f}`); process.exit(1); }
  const raw = fs.readFileSync(f, 'utf8'), text = /\.html?$/i.test(f) ? strip(raw) : raw, title = opt('title', path.basename(f)), s = add({ title, url: opt('url', null), via: 'user-supplied', snippet: text.replace(/\s+/g, ' ').slice(0, 320), note: opt('note', null), original_file: path.basename(f) }); s.page = save(s.id, title, opt('url', null), text.slice(0, 40000)); console.log(`${s.id} user-supplied: ${title}`);
} else if (opt('text')) {
  const title = opt('title'); if (!title) { console.error('--text needs --title'); process.exit(2); }
  const s = add({ title, url: opt('url', null), via: 'user-supplied', snippet: opt('text').replace(/\s+/g, ' ').slice(0, 320), note: opt('note', null) }); s.page = save(s.id, title, opt('url', null), opt('text')); console.log(`${s.id} user-supplied: ${title}`);
} else if (opt('competitors')) {
  const lines = fs.readFileSync(path.resolve(opt('competitors')), 'utf8').trim().split(/\r?\n/), head = lines.shift().split(',').map((h) => h.trim().toLowerCase()), col = (k) => head.findIndex((h) => h.includes(k));
  const rows = lines.map((l) => l.split(',')).map((c) => ({ title: c[col('title')] || null, url: c[col('url')] || null, views: +(c[col('view')] || 0) || null, duration: +(c[col('dur')] || 0) || null, date: c[col('date')] || null })).filter((r) => r.title || r.url);
  const views = rows.map((r) => r.views).filter(Boolean).sort((x, y) => x - y), dur = rows.map((r) => r.duration).filter(Boolean).sort((x, y) => x - y);
  fs.writeFileSync(path.join(rdir, 'competitors.json'), JSON.stringify({ summary: { source: 'user-supplied list', analysed: rows.length, median_views: views[Math.floor(views.length / 2)] ?? null, median_duration_s: dur[Math.floor(dur.length / 2)] ?? null, note: 'metrics only: no scripts are stored' }, videos: rows }, null, 1));
  console.log(`research/competitors.json: ${rows.length} entries from the user's list (metrics only)`); process.exit(0);
}
fs.writeFileSync(sf, JSON.stringify(S, null, 1)); console.log(`${S.sources.length} source(s) in research/sources.json`);
