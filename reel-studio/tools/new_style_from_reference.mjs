#!/usr/bin/env node
// Draft a NEW style pack from an analysed reference. Honest scope: it fills what can be MEASURED (palette, caption zone, pace, camera habits)
// and starts from an existing pack for the character and world. What must be BUILT (new character, new environment) is listed as TODO:
// a pack is not finished until it renders in the style gallery and passes the critics.
//   node tools/new_style_from_reference.mjs <P> <refName> --id my-style --base stickman-3d
import fs from 'node:fs';
import path from 'node:path';
import { TK, rd } from './lib/pipeline.mjs';
import { check, loadSchema } from './validate.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), name = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const dir = path.join(P, 'references', name || ''); if (!name || !fs.existsSync(path.join(dir, 'analysis.json')) || !opt('id') || !opt('base')) { console.error('usage: new_style_from_reference.mjs <P> <refName> --id new-style --base <existing-pack>'); process.exit(2); }
const A = rd(path.join(dir, 'analysis.json')), base = rd(path.join(TK, 'style-packs', opt('base'), 'style.json')), out = JSON.parse(JSON.stringify(base)), id = opt('id');
const pal = (A.look?.palette || A.palette || []).map((p) => p.hex), lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); }, sorted = [...pal].sort((x, y) => lum(x) - lum(y)), sat = (h) => { const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return Math.max(r, g, b) - Math.min(r, g, b); };
const dark = A.look ? A.look.brightness < 0.45 : A.brightness < 0.45, bg = dark ? sorted[0] : sorted.at(-1), accent = [...pal].sort((x, y) => sat(y) - sat(x))[0] || base.tokens.colors.accent;
out.id = id; out.name = `${id} (from ${name})`; out.description = `DRAFT style derived from reference "${name}": palette, caption placement and pacing measured; world and character borrowed from ${opt('base')} until built.`;
out.tokens.colors = { ...out.tokens.colors, bg, ink: dark ? '#FFFFFF' : '#14161C', ink2: dark ? '#FFFFFF' : '#14161C', accent, accentSoft: accent + '33' };
const bands = (A.text?.persistent_bands || []).filter((b) => b.y_from >= 0.5); if (bands.length) out.tokens.safe_zone = { ...out.tokens.safe_zone, caption_y: Math.round(bands[0].y_from * 1920) };
const t = A.timing; out.camera_language = `Measured from the reference: ${t ? `${t.cuts_per_10s} cuts per 10 s, median shot ${t.median_shot}s, camera static in ${Math.round(A.camera.static_share * 100)} percent of shots (${Object.keys(A.camera.moves).join(', ')}). ` : ''}This is a measurement, not a rule: the director decides each shot from the story.`;
out.meta = { reference: { name, source: A.source, analysed: new Date().toISOString(), vision_status: A.vision?.status || 'pending' }, status: 'draft' };
out.rules = [`TODO (not built): ${A.vision?.status === 'done' ? 'build the character and environment described in references/' + name + '/reference-report.md' : 'finish the vision pass first (tools/reference/vision.mjs)'}`, ...(out.rules || []).slice(0, 3)];
const errs = check(loadSchema('style-pack'), out); if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
const dst = path.join(TK, 'style-packs', id); fs.mkdirSync(dst, { recursive: true }); fs.writeFileSync(path.join(dst, 'style.json'), JSON.stringify(out, null, 2));
console.log(`draft style-packs/${id} created (colours ${bg} / ${accent}, base ${opt('base')}). TODO: ${out.rules[0]}\nPreview it: node tools/style_previews.mjs --packs ${id}`);
