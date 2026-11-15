#!/usr/bin/env node
// Competitor / trend research through Agent-Reach (github.com/Panniantong/Agent-Reach, MIT). No AI credits: it only reads public pages.
//   node research/competitors.mjs "stickman explainer shorts" [--channels web,github,youtube,reddit]
// -> research/<slug>.json (title, url, snippet per hit) and a short brief on stdout. Channels that are not set up are skipped with a note.
// Setup once:  python3 -m venv ar-venv && ar-venv/bin/pip install git+https://github.com/Panniantong/Agent-Reach   (HOME must be writable)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), a = process.argv.slice(2), q = a.find((x) => !x.startsWith('--')), ci = a.indexOf('--channels');
if (!q) { console.error('usage: competitors.mjs "<topic>" [--channels web,github,youtube,reddit]'); process.exit(2); }
const BIN = process.env.AGENT_REACH_BIN || '/projects/sandbox/ar-venv/bin/agent-reach', HOME = process.env.AGENT_REACH_HOME || '/projects/sandbox/ar-home';
fs.mkdirSync(HOME, { recursive: true });
const out = { query: q, at: new Date().toISOString(), hits: [], skipped: [] };
for (const ch of (ci >= 0 ? a[ci + 1] : 'web,github').split(',')) {
  try {
    const r = JSON.parse(execFileSync(BIN, [ch, 'search', q], { env: { ...process.env, HOME }, timeout: 90000, maxBuffer: 20e6 }).toString());
    if (!r.ok) throw new Error(r.error?.message || 'failed');
    for (const it of r.items.slice(0, 8)) out.hits.push({ channel: ch, title: it.title, url: it.url, published: it.published_at, snippet: String(it.text || '').replace(/\s+/g, ' ').slice(0, 300) });
  } catch (e) { out.skipped.push(`${ch}: ${String(e.message).split('\n')[0].slice(0, 120)}`); }
}
const file = path.join(HERE, q.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '.json'); fs.writeFileSync(file, JSON.stringify(out, null, 1));
out.hits.forEach((h) => console.log(`[${h.channel}] ${h.title}\n   ${h.url}\n   ${h.snippet.slice(0, 140)}`)); if (out.skipped.length) console.log('\nskipped:', out.skipped.join(' | ')); console.log('\nsaved', file);
