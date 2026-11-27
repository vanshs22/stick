#!/usr/bin/env node
// A clearly labelled RECREATION of a page or interface that could not be captured. Allowed only with the user's own words.
//   node tools/capture/register_recreation.mjs <manifest.json> --id REC1 --path assets/recreated-ui.png --label "Recreated interface, not the real site" --quote "<what the user said>" [--of <url>]
import fs from 'node:fs';
import path from 'node:path';
const a = process.argv.slice(2), mf = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !opt('id') || !opt('path') || !opt('label')) { console.error('usage: register_recreation.mjs <manifest> --id X --path file --label "..." --quote "<user words>" [--of url]'); process.exit(2); }
if ((opt('quote', '') || '').trim().length < 6) { console.error('refused: a recreation needs the user\'s permission in their own words (--quote). Ask: "I could not capture the real page. May I use a clearly labelled recreation?"'); process.exit(1); }
const m = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : { assets: [] };
m.assets.push({ id: opt('id'), type: 'image', kind: 'recreation', path: opt('path'), source_url: opt('of', ''), license: 'original recreation', original: true, captured_at: new Date().toISOString(), label: opt('label'), permission_quote: opt('quote'), notes: 'Shown on screen with the label. Never presented as the real page.' });
fs.mkdirSync(path.dirname(mf), { recursive: true }); fs.writeFileSync(mf, JSON.stringify(m, null, 1)); console.log(`registered recreation ${opt('id')} (label: "${opt('label')}")`);
