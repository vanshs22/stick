#!/usr/bin/env node
// Shared learning files (foundation/playbooks/*.json): rules learned from the references, used by every style.
//   node tools/playbook.mjs list                                       playbooks and entry counts
//   node tools/playbook.mjs validate                                   every playbook against schemas/playbook.schema.json (exit 1 on a problem)
//   node tools/playbook.mjs query <playbook> [--when text] [--style id] [--engine e]   matching entries, ready to read
//   node tools/playbook.mjs learn <playbook> <entry-id> --ref <video id> --note "what this reference shows"   appends evidence, never rewrites a rule
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, loadSchema } from './validate.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), DIR = process.env.PLAYBOOK_DIR || path.join(TK, 'foundation/playbooks');
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
export const names = () => fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
export const load = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n + '.json'), 'utf8'));
export function validateAll() {
  const out = [], schema = loadSchema('playbook');
  for (const n of names()) { const pb = load(n), e = check(schema, pb); e.forEach((x) => out.push(`${n}: ${x}`)); const ids = pb.entries?.map((x) => x.id) || []; ids.filter((x, i) => ids.indexOf(x) !== i).forEach((x) => out.push(`${n}: duplicate entry id "${x}"`)); if (pb.id !== n) out.push(`${n}: id "${pb.id}" differs from file name`); }
  return out;
}
export function query(n, { when, style, engine } = {}) {
  const w = when?.toLowerCase();
  return load(n).entries.filter((e) => (!w || `${e.id} ${e.when}`.toLowerCase().includes(w)) && (!style || !e.styles || e.styles.includes(style)) && (!engine || !e.how_by_engine || e.how_by_engine[engine]));
}
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'list') for (const n of names()) console.log(`${n.padEnd(14)} ${load(n).entries.length} entries  ${load(n).title}`);
  else if (cmd === 'validate') { const e = validateAll(); if (e.length) { console.error('playbooks invalid:\n- ' + e.join('\n- ')); process.exit(1); } console.log(`${names().length} playbooks valid.`); }
  else if (cmd === 'query' && a) { const r = query(a, { when: arg('when'), style: arg('style'), engine: arg('engine') }); console.log(JSON.stringify(r, null, 1)); console.error(`${r.length} entr${r.length === 1 ? 'y' : 'ies'}`); }
  else if (cmd === 'learn' && a && b) {
    const ref = arg('ref'), note = arg('note'); if (!ref || !note) { console.error('learn needs --ref and --note'); process.exit(2); }
    const pb = load(a), en = pb.entries.find((x) => x.id === b); if (!en) { console.error(`no entry "${b}" in ${a}`); process.exit(1); }
    en.evidence.push({ ref, note }); fs.writeFileSync(path.join(DIR, a + '.json'), JSON.stringify(pb, null, 1) + '\n'); console.log(`added evidence to ${a}/${b} (${en.evidence.length} total)`);
  } else { console.error('usage: playbook.mjs list|validate|query <pb>|learn <pb> <entry> --ref --note'); process.exit(2); }
}
