#!/usr/bin/env node
// Public-web research through Agent-Reach (github.com/Panniantong/Agent-Reach, installed FROM GITHUB: the PyPI package of the same name is a different project).
// OPTIONAL: the user decides. brief.research.agent_reach = "yes" | "no" | "ask" (default ask: needs --user-said "<their words>").
//   node tools/research/search.mjs <P> "<query>" [--channels web,github,youtube] [--limit 6]
//   node tools/research/search.mjs <P> --read <url> [--read <url2>]          reads pages to research/pages/*.md
// Output: research/sources.json (every hit: id, channel, title, url, snippet, retrieved_at) - the research critic checks claims against these ids.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { TK, run, rd, bin } from '../lib/pipeline.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; }, all = (k) => a.flatMap((x, i) => (x === '--' + k ? [a[i + 1]] : []));
const query = a[1] && !a[1].startsWith('--') ? a[1] : null, reads = all('read');
if (!a[0] || (!query && !reads.length)) { console.error('usage: search.mjs <P> "<query>" [--channels web,github,youtube] [--limit 6]  |  --read <url>'); process.exit(2); }
const brief = fs.existsSync(path.join(P, 'brief.json')) ? rd(path.join(P, 'brief.json')) : {}, mode = brief.research?.agent_reach || 'ask';
if (mode === 'no') { console.error('The user turned Agent-Reach research off for this project (brief.research.agent_reach = "no").'); process.exit(1); }
if (mode === 'ask' && !opt('user-said')) { console.error('Agent-Reach research is optional. Ask the user: "Shall I research competitors and trends on the public web?" then re-run with --user-said "<their answer>" (or set brief.research.agent_reach).'); process.exit(1); }
const AR = bin('agent-reach', 'AGENT_REACH_BIN'); let home = process.env.HOME || ''; try { fs.accessSync(home, fs.constants.W_OK); } catch { home = path.join(TK, '.home'); fs.mkdirSync(home, { recursive: true }); }
const env = { ...process.env, HOME: home }, call = (args) => { const r = run(AR, args, { env, timeout: 90000 }); if (r.error) return { ok: false, error: 'agent-reach is not installed: run the installer (scripts/install.sh)' }; try { return JSON.parse(r.stdout); } catch { return { ok: false, error: (r.stderr || r.stdout || 'no output').slice(0, 300) }; } };
const rdir = path.join(P, 'research'); fs.mkdirSync(path.join(rdir, 'pages'), { recursive: true }); const sf = path.join(rdir, 'sources.json'), S = fs.existsSync(sf) ? rd(sf) : { sources: [] }; const skipped = [];
const add = (it, channel, q) => { if (!it.url || S.sources.some((s) => s.url === it.url)) return; S.sources.push({ id: 'S' + (S.sources.length + 1), channel, query: q || null, title: it.title, url: it.url, author: it.author || null, published_at: it.published_at || null, snippet: String(it.text || '').replace(/\s+/g, ' ').slice(0, 320), retrieved_at: new Date().toISOString(), via: 'agent-reach' }); };
if (query) for (const ch of opt('channels', 'web,github,youtube').split(',')) { const r = call([ch, 'search', query, '--limit', opt('limit', '6')]); if (!r.ok) { skipped.push(`${ch}: ${r.error || r.error?.message || JSON.stringify(r.error || r).slice(0, 160)}`); continue; } (r.items || []).forEach((it) => add(it, ch, query)); }
for (const u of reads) { const r = call(['read', u]); if (!r.ok || !r.items?.[0]) { skipped.push(`read ${u}: ${JSON.stringify(r.error || r).slice(0, 160)}`); continue; } const it = r.items[0], f = path.join(rdir, 'pages', crypto.createHash('sha1').update(u).digest('hex').slice(0, 10) + '.md'); fs.writeFileSync(f, `# ${it.title}\n\nSource: ${u}\nRetrieved: ${new Date().toISOString()}\n\n${String(it.text || '').slice(0, 20000)}\n`); add({ ...it, text: it.text }, 'read', null); S.sources.find((s) => s.url === (it.url || u)).page = path.relative(P, f); }
fs.writeFileSync(sf, JSON.stringify(S, null, 1)); console.log(`${S.sources.length} source(s) in research/sources.json${skipped.length ? `\nskipped:\n- ${skipped.join('\n- ')}` : ''}`);
