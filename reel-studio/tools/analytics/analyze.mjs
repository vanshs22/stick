#!/usr/bin/env node
// Optional creator analytics.  node tools/analytics/analyze.mjs --csv <export.csv>[,more.csv] [--retention <curve.csv>] [--urls a,b] [--screenshots <folder>] [--out <folder>] [--learn]
// Reads YOUR exports (YouTube Studio / Instagram / TikTok CSV, or a hand-made sheet). Column names are matched loosely:
//   title|video  views|plays  likes  comments  shares  saves  watch|avg_view|average view duration (s)  retention|avg_percentage_viewed (%)  duration|length (s)  topic  style  hook  (any extra column named topic/style/hook/format/voice groups the comparison)
// Retention curve CSV: two columns, time (s or %) and retention (%).
// Prints findings with the numbers behind them, writes <out>/analytics.md, and with --learn appends the findings to memory/learnings.md.
// It never invents data: with fewer than 5 videos it says the sample is too small to compare.
import fs from 'node:fs';
import path from 'node:path';
import { TK } from '../lib/pipeline.mjs';
const a = process.argv.slice(2), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
if (!opt('csv') && !opt('retention') && !opt('urls') && !opt('screenshots')) { console.error('usage: analyze.mjs --csv f.csv[,g.csv] [--retention curve.csv] [--urls u1,u2] [--screenshots dir] [--out dir] [--learn]'); process.exit(2); }

export function parseCsv(t) {
  const rows = []; let r = [], c = '', q = false; t = t.replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',' || ch === ';' || ch === '\t') { r.push(c); c = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); c = ''; if (r.some((x) => x.trim())) rows.push(r); r = []; } else c += ch; }
  r.push(c); if (r.some((x) => x.trim())) rows.push(r);
  const head = rows[0].map((h) => h.trim()); return rows.slice(1).map((x) => Object.fromEntries(head.map((h, i) => [h, (x[i] ?? '').trim()])));
}
const num = (v) => { if (v == null) return null; const s = String(v).replace(/[,%\s]/g, ''); if (/^\d+:\d+(:\d+)?$/.test(String(v).trim())) return String(v).trim().split(':').reduce((p, x) => p * 60 + +x, 0); const n = parseFloat(s); return Number.isFinite(n) ? n : null; };
const find = (row, re) => { const k = Object.keys(row).find((x) => re.test(x.toLowerCase().replace(/[_\s-]+/g, ' '))); return k ? num(row[k]) : null; };
const key = (row, re) => Object.keys(row).find((x) => re.test(x.toLowerCase().replace(/[_\s-]+/g, ' ')));
const med = (v) => { const s = v.filter((x) => x != null).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const f1 = (x) => (x == null ? 'n/a' : Math.round(x * 10) / 10);

const out = [], notes = [], learn = [];
let md = '# Creator analytics\n\n';
if (opt('csv')) {
  const rows = opt('csv').split(',').flatMap((f) => parseCsv(fs.readFileSync(f, 'utf8')));
  const V = rows.map((r) => ({ title: r[key(r, /^(video )?(title|name)$|^video$/)] || '(untitled)', views: find(r, /^(views|plays|video views)$/), likes: find(r, /^likes?$/), comments: find(r, /^comments?$/), shares: find(r, /^shares?$/), saves: find(r, /^saves?$|^bookmarks?$/), watch: find(r, /(avg|average).*(view|watch).*(dur|time)|^watch time$/), ret: find(r, /(avg|average).*(percent|%)|^retention/), len: find(r, /^(duration|length)( s| sec| seconds)?$/), raw: r })).filter((v) => v.views != null);
  md += `Source: ${opt('csv')}: ${V.length} videos with a view count.\n\n`;
  if (V.length < 5) { notes.push(`only ${V.length} video(s): too few to compare topics, styles or lengths. Add more exports.`); md += `**${notes.at(-1)}**\n\n`; }
  const eng = (v) => (v.views ? ((v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0)) / v.views : null);
  const sorted = [...V].sort((x, y) => y.views - x.views);
  md += `## Top and bottom by views\n${sorted.slice(0, 3).map((v) => `- ${v.title}: ${v.views} views, engagement ${f1(eng(v) * 100)}%, retention ${f1(v.ret)}%`).join('\n')}\n…\n${sorted.slice(-2).map((v) => `- ${v.title}: ${v.views} views`).join('\n')}\n\n`;
  if (V.length >= 5) {
    const top = sorted.slice(0, Math.ceil(V.length / 3)), low = sorted.slice(-Math.ceil(V.length / 3)), cmp = (name, fn, unit) => { const t = med(top.map(fn)), l = med(low.map(fn)); if (t != null && l != null && Math.abs(t - l) > 0) { const line = `top-third videos have median ${name} ${f1(t)}${unit} vs ${f1(l)}${unit} for the bottom third`; md += `- ${line}\n`; return { t, l, line }; } return null; };
    md += '## What separates the top third from the bottom third\n';
    const L = cmp('length', (v) => v.len, ' s'); if (L && Math.abs(L.t - L.l) / Math.max(L.t, L.l) > 0.2) learn.push(`[analytics] ${L.line}: ${L.t < L.l ? 'shorter' : 'longer'} cuts performed better in this sample (n=${V.length}, correlation not proof) -> test it on the next video`);
    const R = cmp('average % viewed', (v) => v.ret, ' %'); if (R && Math.abs(R.t - R.l) > 5) learn.push(`[analytics] ${R.line} -> look at what the high-retention videos do in the first 3 seconds`);
    cmp('engagement rate', (v) => (eng(v) == null ? null : eng(v) * 100), ' %'); cmp('saves per view', (v) => (v.saves != null && v.views ? (v.saves / v.views) * 100 : null), ' %');
    // group comparisons for any tag columns the creator added
    for (const tag of ['topic', 'style', 'hook', 'format', 'voice']) {
      const col = Object.keys(V[0].raw).find((k) => k.toLowerCase().trim() === tag); if (!col) continue; const g = {}; for (const v of V) (g[v.raw[col] || '(none)'] ||= []).push(v.views);
      const rows2 = Object.entries(g).filter(([, x]) => x.length >= 2).map(([k, x]) => [k, med(x), x.length]).sort((x, y) => y[1] - x[1]); if (rows2.length < 2) { md += `\n(${tag}: no group has 2+ videos yet)\n`; continue; }
      md += `\n### By ${tag}\n${rows2.map(([k, m, n]) => `- ${k}: median ${f1(m)} views (n=${n})`).join('\n')}\n`; learn.push(`[analytics] by ${tag}: best "${rows2[0][0]}" (median ${f1(rows2[0][1])} views, n=${rows2[0][2]}) vs worst "${rows2.at(-1)[0]}" (${f1(rows2.at(-1)[1])}, n=${rows2.at(-1)[2]}); small sample, treat as a hypothesis`);
    }
  }
}
if (opt('retention')) {
  const R = parseCsv(fs.readFileSync(opt('retention'), 'utf8')).map((r) => { const ks = Object.keys(r); return [num(r[ks[0]]), num(r[ks[1]])]; }).filter((x) => x[0] != null && x[1] != null);
  if (R.length < 4) notes.push('retention curve has fewer than 4 points'); else {
    const drops = R.slice(1).map((p, i) => ({ at: R[i][0], to: p[0], drop: R[i][1] - p[1] })).sort((x, y) => y.drop - x.drop).slice(0, 3);
    md += `\n## Retention drop-offs (${opt('retention')})\nStart ${f1(R[0][1])}% -> end ${f1(R.at(-1)[1])}%.\n${drops.map((d) => `- biggest loss between ${d.at} and ${d.to}: ${f1(d.drop)} points`).join('\n')}\n`;
    const early = R.find((p) => p[0] >= (R.at(-1)[0] > 100 ? 3 : 5)); if (early) { md += `- retention at the end of the hook window (${early[0]}): ${f1(early[1])}%\n`; if (early[1] < 70) learn.push(`[analytics] only ${f1(early[1])}% still watching after the hook window (${early[0]}) -> rewrite the opening, open on the payoff or a question`); }
    if (drops[0] && drops[0].drop > 8) learn.push(`[analytics] biggest retention loss is between ${drops[0].at} and ${drops[0].to} (${f1(drops[0].drop)} points) -> check what the video does there (a long explanation, a slow shot)`);
  }
}
if (opt('urls')) { md += `\n## URLs supplied\n${opt('urls').split(',').map((u) => `- ${u}`).join('\n')}\nThe numbers behind a URL are not public. Export the CSV from the platform, or capture the analytics page with tools/capture/capture_web.mjs while you are logged in, and run this again.\n`; notes.push('URLs recorded only: no metrics are read from them.'); }
if (opt('screenshots')) { const d = opt('screenshots'), imgs = fs.readdirSync(d).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)); md += `\n## Screenshots supplied (${imgs.length})\n${imgs.map((f) => `- ${path.join(d, f)}`).join('\n')}\nThese need the AGENT'S EYES: open each, type the numbers you can read into a CSV, and re-run. This tool does not OCR.\n`; notes.push('screenshots listed only: read them yourself and enter the numbers in a CSV.'); }
if (!learn.length) md += '\nNo comparison was strong enough to turn into a lesson.\n';
const dir = path.resolve(opt('out', 'analytics')); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'analytics.md'), md); console.log(md);
if (a.includes('--learn') && learn.length) { fs.appendFileSync(path.join(TK, 'memory/learnings.md'), '\n' + learn.map((l) => `- ${l}`).join('\n') + '\n'); console.log(`appended ${learn.length} lesson(s) to memory/learnings.md`); }
