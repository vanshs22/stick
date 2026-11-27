#!/usr/bin/env node
// Playbooks: all valid, planted defects rejected, query filters, learn appends evidence without touching rules.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check, loadSchema } from './validate.mjs';
import { names, load, validateAll, query } from './playbook.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), bad = [], schema = loadSchema('playbook');
const must = (n, ok, why) => { if (!ok) bad.push(`${n}: ${why}`); };
must('all valid', validateAll().length === 0, validateAll()[0]);
must('six playbooks', names().length >= 6, `found ${names().length}`);
const cam = load('camera'), e0 = cam.entries[0];
must('missing evidence', check(schema, { ...cam, entries: [{ ...e0, evidence: [] }] }).length > 0, 'empty evidence accepted');
must('bad engine key', check(schema, { ...cam, entries: [{ ...e0, how_by_engine: { 'vr-headset': 'x' } }] }).length > 0, 'unknown engine accepted');
must('unknown field', check(schema, { ...cam, vibes: 1 }).length > 0, 'extra field accepted');
must('query by when', query('camera', { when: 'reveal' }).some((e) => e.id === 'reveal-whip-hold'), 'reveal not found');
must('query by engine drops none-engine entries', query('overlay', { engine: 'board' }).length === query('overlay').length, 'overlay entries without engine map must stay');
const need = ['camera:hook-punch-in', 'camera:emotion-extreme-closeup', 'camera:list-long-hold-reveals', 'caption:keyword-scoring', 'caption:chooser-rules', 'overlay:comment-cta-box', 'audio:sfx-density-by-style', 'audio:prosody-gate', 'acting:gesture-by-function', 'hook-cta:cta-comment-keyword'];
for (const k of need) { const [p, id] = k.split(':'); must(k, load(p).entries.some((e) => e.id === id), 'entry missing'); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-')); fs.cpSync(path.join(TK, 'foundation/playbooks'), tmp, { recursive: true });
execFileSync('node', [path.join(TK, 'tools/playbook.mjs'), 'learn', 'camera', 'hook-punch-in', '--ref', 'rTEST', '--note', 'a new reference shows the same'], { env: { ...process.env, PLAYBOOK_DIR: tmp } });
const after = JSON.parse(fs.readFileSync(path.join(tmp, 'camera.json'), 'utf8')), en = after.entries.find((e) => e.id === 'hook-punch-in');
must('learn appended', en.evidence.some((x) => x.ref === 'rTEST') && en.evidence.length === e0.evidence.length + 1, 'evidence not appended');
must('learn kept rule', en.do === e0.do, 'rule text changed');
console.log(bad.length ? 'FAIL\n- ' + bad.join('\n- ') : `playbooks ok: ${names().length} files, ${names().reduce((n, p) => n + load(p).entries.length, 0)} entries, defects rejected, learn appends`);
process.exit(bad.length ? 1 : 0);
