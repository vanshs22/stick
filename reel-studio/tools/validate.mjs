#!/usr/bin/env node
// Tiny JSON-Schema checker (no dependencies): type, required, enum, properties, items, minimum, maximum, minItems, pattern, additionalProperties:false.
//   node tools/validate.mjs <schema-name|path> <file.json>      e.g.  node tools/validate.mjs script projects/x/script/script.json
// Exit 0 = valid. Otherwise prints every problem with its JSON path, so the agent can fix the file and re-run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export function check(schema, v, p = '$', out = []) {
  const t = Array.isArray(v) ? 'array' : v === null ? 'null' : Number.isInteger(v) ? 'integer' : typeof v;
  if (schema.type) { const ok = [].concat(schema.type).some((x) => x === t || (x === 'number' && t === 'integer')); if (!ok) { out.push(`${p}: expected ${[].concat(schema.type).join('|')}, got ${t}`); return out; } }
  if (schema.enum && !schema.enum.includes(v)) out.push(`${p}: "${v}" is not one of ${schema.enum.join(', ')}`);
  if (typeof v === 'number') { if (schema.minimum != null && v < schema.minimum) out.push(`${p}: ${v} < minimum ${schema.minimum}`); if (schema.maximum != null && v > schema.maximum) out.push(`${p}: ${v} > maximum ${schema.maximum}`); }
  if (typeof v === 'string' && schema.pattern && !new RegExp(schema.pattern).test(v)) out.push(`${p}: "${v}" does not match ${schema.pattern}`);
  if (typeof v === 'string' && schema.minLength && v.length < schema.minLength) out.push(`${p}: text is empty or too short`);
  if (t === 'array') { if (schema.minItems && v.length < schema.minItems) out.push(`${p}: needs at least ${schema.minItems} item(s)`); if (schema.items) v.forEach((x, i) => check(schema.items, x, `${p}[${i}]`, out)); }
  if (t === 'object') {
    for (const k of schema.required || []) if (!(k in v)) out.push(`${p}: missing required "${k}"`);
    for (const [k, s] of Object.entries(schema.properties || {})) if (k in v) check(s, v[k], `${p}.${k}`, out);
    if (schema.additionalProperties === false) for (const k of Object.keys(v)) if (!(k in (schema.properties || {}))) out.push(`${p}: unknown field "${k}"`);
  }
  return out;
}
export const loadSchema = (name) => JSON.parse(fs.readFileSync((fs.existsSync(name) && fs.statSync(name).isFile()) ? name : path.join(HERE, '../schemas', name.replace(/\.schema\.json$/, '') + '.schema.json'), 'utf8'));
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [sn, f] = process.argv.slice(2); if (!sn || !f) { console.error('usage: validate.mjs <schema> <file.json>'); process.exit(2); }
  let data; try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error(`${f}: not valid JSON (${e.message})`); process.exit(1); }
  const errs = check(loadSchema(sn), data); if (errs.length) { console.error(`${f} does not match ${sn}:\n- ` + errs.slice(0, 40).join('\n- ')); process.exit(1); } console.log(`ok: ${f} matches ${sn}`);
}
