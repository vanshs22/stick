#!/usr/bin/env node
// Combine two compatible 3D styles: the WORLD (set, light, palette, backdrop) of one with the CHARACTER of the other.
//   node tools/combine_styles.mjs <world-pack> <character-pack> [--id custom-id]   -> style-packs/<id>/style.json (+ preview via tools/style_previews.mjs --packs <id>)
// Compatible = both are Stage3D packs (sculpted 3D). 2D packs and legacy Scene3D packs cannot be combined (the tool says why).
import fs from 'node:fs';
import path from 'node:path';
import { TK, rd } from './lib/pipeline.mjs';
import { check, loadSchema } from './validate.mjs';
const a = process.argv.slice(2), [wid, cid] = a, opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!wid || !cid) { console.error('usage: combine_styles.mjs <world-pack> <character-pack> [--id x]'); process.exit(2); }
const load = (id) => rd(path.join(TK, 'style-packs', id, 'style.json')), W = load(wid), C = load(cid);
for (const [id, p] of [[wid, W], [cid, C]]) if (!p.defaults?.stage3d) { console.error(`"${id}" is not a Stage3D pack (${p.defaults?.scene3d ? 'legacy Scene3D' : '2D motion graphics'}): it cannot be combined. Combinable: ${fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => { try { return load(d).defaults?.stage3d; } catch { return false; } }).join(', ')}`); process.exit(1); }
const id = opt('id', `custom-${wid}-${cid}`).slice(0, 60), out = { ...JSON.parse(JSON.stringify(C)), id, name: `${C.name} in ${W.name}`, family: C.family, description: `${C.name}'s character in the ${W.name} world. World: ${W.description.split('. ')[0]}. Character: ${C.description.split('. ')[0]}.` };
out.tokens = { ...C.tokens, colors: { ...W.tokens.colors }, safe_zone: { ...C.tokens.safe_zone }, chrome: W.tokens.chrome || C.tokens.chrome };
out.effects = { ...(W.effects || {}) };
out.defaults = { ...C.defaults, stage3d: { world: W.defaults.stage3d.world, worldOpts: W.defaults.stage3d.worldOpts || {}, cast: C.defaults.stage3d.cast, look: { ...(W.defaults.stage3d.look || {}) } }, backdrop: W.defaults.backdrop };
out.camera_language = `${C.camera_language} (Character framing from ${cid}; the world is ${wid}: keep shots inside its set.)`;
out.rules = [...(C.rules || []).filter((r) => /face|acting|body|pose|character|expression|hand/i.test(r)).slice(0, 3), ...(W.rules || []).filter((r) => /light|world|colour|color|environment|camera|moves/i.test(r)).slice(0, 3), `COMBINED STYLE: check scale (character height vs props) and colour contrast in the preview before approving.`];
out.pitfalls = [...(C.pitfalls || []), ...(W.pitfalls || [])].slice(0, 4);
out.meta = { combined: { world: wid, character: cid }, created: new Date().toISOString() };
const errs = check(loadSchema('style-pack'), out); if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
const dir = path.join(TK, 'style-packs', id); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'style.json'), JSON.stringify(out, null, 2));
console.log(`created style-packs/${id}. Preview it: node tools/style_previews.mjs --packs ${id}`);
