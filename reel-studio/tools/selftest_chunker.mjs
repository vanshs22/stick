#!/usr/bin/env node
// Caption micro-syntax and the caption-style presets in foundation/captions.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCaption, alignCaption } from './lib/chunker.mjs';
import { check, loadSchema } from './validate.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
const W = 'Total myth stuck seven years'.split(' ').map((w, i) => ({ w, s: i * 0.4 }));
const p = parseCaption('TOTAL *MYTH | STUCK 7 *YEARS');
ok(p.length === 2 && p[0][1].hi && !p[0][0].hi && p[1][2].hi, 'pipe/star parse wrong');
const good = alignCaption('Total *myth | stuck seven *years', W);
ok(!good.error && good.chunks.length === 2 && good.chunks[0].words[1].hi && good.chunks[1].t0 === 0.76, 'aligned chunks wrong: ' + JSON.stringify(good));
ok(alignCaption('Total myth | stuck seven', W).error?.includes('repeat the spoken words'), 'a caption missing spoken words must be refused');
ok(alignCaption('Total *myth *stuck | seven years', W).error?.includes('more than one'), 'two accents in a chunk must be refused');
ok(alignCaption('', W).error, 'empty caption must be refused');
ok(alignCaption('total, MYTH! stuck seven years.', W).chunks?.length === 1, 'punctuation and case must be free');
ok(alignCaption('Total *myth', W.slice(0, 2), { myth: '🪦' }).chunks[0].words[1].e === '🪦', 'emoji must carry over');
const dir = path.join(TK, 'foundation/captions'), files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
ok(files.length >= 11, `expected 11 caption presets, found ${files.length}`);
for (const f of files) { const e = check(loadSchema('caption-style'), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); if (e.length) bad.push(`${f}: ${e[0]}`); }
if (bad.length) { console.error('CHUNKER SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log(`CHUNKER SELFTEST PASSED: | and *accent* syntax, order and accent rules, ${files.length} caption presets match caption-style.schema`);
