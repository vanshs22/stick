#!/usr/bin/env node
// STYLE BRIEF: read the LOOK of a reference image or video (character design, materials, set, light, camera, colour, post) so a film can be made in that style.
// The numbers are measured here; the design (what the eyes are like, what is on the shelf) needs EYES, so the agent fills the sheet after looking, and this tool refuses a sheet that is empty or vague.
//   node tools/reference/style_brief.mjs <P> <refName> --template     measure + write references/<name>/style-brief.json (fill every TODO after LOOKING at the images it lists)
//   node tools/reference/style_brief.mjs <P> <refName> --validate     check it is complete, specific and honest; sets status "done"
//   node tools/reference/style_brief.mjs <P> <refName> --unavailable "this model cannot read images"
// Then: node tools/reference/style_map.mjs <P> <refName>   (what our engine can do, closest pack, overrides, gaps, twist options)
import fs from 'node:fs';
import path from 'node:path';
import { PY, run, rd } from '../lib/pipeline.mjs';
import { fileURLToPath } from 'node:url';
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), name = a[1], dir = path.join(P, 'references', name || ''), AN = path.join(dir, 'analysis.json'), F = path.join(dir, 'style-brief.json');
if (!name || !fs.existsSync(AN)) { console.error('usage: style_brief.mjs <P> <refName> --template|--validate|--unavailable "why"   (ingest the reference first: tools/reference/ingest.mjs)'); process.exit(2); }
export const MEDIUMS = ['3d-stylized', '3d-realistic', '3d-low-poly', '3d-voxel', '3d-stick', '2d-flat', '2d-cartoon', '2d-cutout', '2d-anime', 'motion-graphics', 'photo-real', 'mixed'];
const T = (s) => `TODO: ${s}`;
const template = (m, files) => ({
  status: 'pending', reference: name, inspected: [], model_can_see_images: true, looked_at: files, measured: m,
  _how: 'LOOK at every file in looked_at (open them as images), then replace every TODO with what you SEE. Be specific: "large glossy brown eyes, about 1/4 of the face width, with a white catch-light" beats "big eyes". Numbers and hex colours where you can. Never describe a real person by name: describe the DESIGN.',
  medium: { kind: T(`one of ${MEDIUMS.join(' | ')}`), look_in_one_line: T('e.g. "soft stylised 3D, Pixar-like: round faces, big glossy eyes, warm practical lights, shallow depth of field"'), render_traits: [T('3 to 6 traits: subsurface skin, soft shadows, bloom on lights, hand-painted textures, outlines, flat colour...')] },
  character: { present: T('true | false'), count: T('number'), role: T('who they are in the picture (host, presenter, commuter...)'), age_look: T('child | teen | young adult | adult | older'), build: T('slim | average | stocky...'),
    head: { shape: T('round | oval | square jaw...'), size_vs_body: T('e.g. head is 1/4 of body height (stylised) | 1/7 (realistic)') },
    eyes: { size_vs_face: T('e.g. each eye about 1/5 of face width'), shape: T('round | almond...'), iris_hex: T('#hex'), highlights: T('catch-lights: where and how many'), lids_lashes: T('lids, lashes, brows relation') },
    brows: T('thickness, colour, shape, how they act'), nose: T('shape and size'), mouth: T('shape; teeth shown?; open or closed in this frame'), ears: T('visible? size'),
    hair: { style: T('cut and silhouette'), volume: T('flat | medium | voluminous (clumps? strands?)'), color_hex: T('#hex'), shading: T('glossy highlights? rim light in hair?') },
    skin: { tone_hex: T('#hex of the lit skin'), shading: T('matte | soft subsurface glow | glossy; blush; shadow colour') },
    outfit: { garment: T('hoodie, jacket...'), color_hex: T('#hex'), fabric: T('knit, cotton, leather: how the fabric catches light'), details: T('folds, drawstrings, logos (describe, do not copy brands)') },
    hands: { detail: T('simplified mitten | five fingers | knuckles/nails'), gesture: T('what the hands do') }, expression: T('the emotion and how it is built (brow, eyes, mouth)'), pose: T('body pose and gesture'),
    proportions_notes: T('anything unusual: neck, shoulders, scale of hands'), identity_note: T('describe the DESIGN only; never name or imitate a real person') },
  environment: { place: T('where is this (home studio, street, stage...)'), background_depth: T('how many layers, how far, how blurred'), set_dressing: [{ item: T('object'), position: T('left/right/back, high/low'), colour_hex: T('#hex'), emissive: T('true if it glows') }], practical_lights: [{ item: T('lamp, neon sign, screen'), colour_hex: T('#hex') }], screens_text: T('anything readable on screens (describe; do not copy)'), textures: T('wood, fabric, plants: how detailed') },
  lighting: { key: { side: T('left | right | front | above'), colour_hex: T('#hex'), softness: T('hard | soft | very soft') }, fill: T('colour and strength'), rim: { colour_hex: T('#hex or none'), side: T('which edge') }, practicals: T('what glows and what colour it casts'), ambient: T('overall level and colour'), contrast: T('low | medium | high'), mood: T('cosy | tense | clean | neon...'), time_of_day: T('night | day | golden hour | unknown'), volumetrics: T('light shafts, haze, or none') },
  camera: { framing: T('extreme-wide | wide | medium-wide | medium | medium-close-up | close-up | extreme-close-up'), angle: T('eye-level | low-angle | high-angle | three-quarter | profile'), lens_feel: T('wide 24mm | normal 35-50mm | portrait 85mm: how perspective bends'), dof: { subject_sharp: T('true | false'), background_blur: T('none | slight | strong') }, composition: { subject_position: T('e.g. right of centre, lower two thirds'), foreground_objects: T('e.g. microphone in the lower right, out of focus'), headroom: T('tight | normal | loose'), negative_space: T('where') }, movement: T('video only: push-in, pan, handheld, static') },
  colour: { dominant_hex: T('#hex'), accent_hex: T('#hex'), grade: T('warm-orange/teal-blue split, pastel, monochrome...'), saturation: T('low | medium | high') },
  post: { bloom: T('none | subtle | strong (glow on bright objects)'), vignette: T('none | subtle | strong'), grain: T('none | fine | heavy'), other: T('chromatic aberration, halation, outlines...') },
  text_graphics: { captions: T('style, position, font feel; or none'), overlays_ui: T('stickers, banners, lower thirds; or none') },
  motion_and_pacing: { applies: T('true for video, false for an image'), cuts_per_10s: T('number or n/a'), camera_moves: T('list or n/a'), character_motion: T('how they move: bouncy, snappy, smooth'), lip_sync_and_blinks: T('visible mouth shapes, blink rate, or n/a') },
  audio_and_story: { sound: T('voice, music, sfx feel; or n/a for an image'), format: T('what kind of content is it (podcast clip, explainer, comedy skit...)') },
  what_makes_it_this_style: [T('5 to 8 short rules: if you break one it stops looking like this (e.g. "eyes are always large and glossy with two catch-lights")')],
  must_keep: [T('the 4 to 6 things the new film must keep to read as the same style')],
  free_to_change: [T('the things you will change for the twist (character, palette, set, topic)')],
  brand_marks_to_avoid: [T('logos, trademarks, recognisable IP, real people in the reference. Use [] ONLY after you checked and found none')],
  allowed_mediums: MEDIUMS,
});
const frames = () => {
  const src = fs.readdirSync(dir).filter((f) => /^source\.(png|jpe?g|webp|gif)$/i.test(f)).map((f) => path.join(dir, f)), kf = fs.existsSync(path.join(dir, 'keyframes')) ? fs.readdirSync(path.join(dir, 'keyframes')).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort().map((f) => path.join(dir, 'keyframes', f)) : [];
  const all = [...src, ...kf]; return all.length > 6 ? all.filter((_, i) => i % Math.ceil(all.length / 6) === 0).slice(0, 6) : all;
};
if (a.includes('--template')) {
  const fr = frames(); if (!fr.length) { console.error('no image or keyframes found in ' + dir); process.exit(1); }
  const out = path.join(dir, 'measure.json'), r = run(PY, [path.join(TK, 'tools/reference/style_measure.py'), out, ...fr]); if (r.status) { console.error(r.stderr || r.stdout); process.exit(1); }
  const m = rd(out).overall; fs.writeFileSync(F, JSON.stringify(template(m, fr.map((f) => path.relative(P, f))), null, 1));
  const fa = m.face || {}; console.log(`wrote references/${name}/style-brief.json (${fr.length} frame(s) measured).\nMeasured: brightness ${m.brightness}, contrast ${m.contrast_p5_p95}, warm ${m.warm_share} / cool ${m.cool_share}, light from the ${m.light_side}, vignette ${m.vignette}, background blur ratio ${m.background_blur_ratio} (below 0.6 = shallow depth of field), grain ${m.grain}${fa.found ? `, face found (${fa.framing}, key light ${fa.key_side}, skin ${fa.skin_hex})` : ', no face found by the classifier (read it by looking)'}.\nNow LOOK at: ${fr.map((f) => path.relative(P, f)).join(', ')}\nthen fill every TODO and run --validate.`); process.exit(0);
}
if (a.includes('--unavailable')) { const j = fs.existsSync(F) ? rd(F) : {}; j.status = 'unavailable'; j.model_can_see_images = false; j.reason = a[a.indexOf('--unavailable') + 1] || 'no reason given'; fs.writeFileSync(F, JSON.stringify(j, null, 1)); console.log('marked unavailable: only the measured numbers exist; ask the user to describe the character, set and lighting in words'); process.exit(0); }
if (a.includes('--validate')) {
  if (!fs.existsSync(F)) { console.error('run --template first'); process.exit(1); } const j = rd(F), bad = [], flat = [];
  const walk = (o, p) => { if (typeof o === 'string') { if (/^TODO/.test(o)) bad.push(p); else if (o.trim().length < 3 && !/^(\d+|true|false|n\/a|no|yes)$/i.test(o.trim())) bad.push(p + ' (empty)'); } else if (Array.isArray(o)) o.forEach((x, i) => walk(x, `${p}[${i}]`)); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!k.startsWith('_') && !['measured', 'looked_at', 'allowed_mediums', 'inspected', 'reference', 'status', 'validated_at', 'model_can_see_images'].includes(k)) walk(v, p ? `${p}.${k}` : k); };
  walk(j, '');
  const miss = (j.looked_at || []).filter((f) => !(j.inspected || []).includes(f)); if (!(j.inspected || []).length) bad.push('inspected: list every image you opened'); else if (miss.length > Math.floor((j.looked_at || []).length / 2)) bad.push(`inspected: you did not open ${miss.slice(0, 3).join(', ')}`);
  if (!MEDIUMS.includes(j.medium?.kind)) bad.push(`medium.kind must be one of ${MEDIUMS.join(', ')}`);
  for (const [k, lo] of [['what_makes_it_this_style', 5], ['must_keep', 3], ['free_to_change', 2]]) if (!Array.isArray(j[k]) || j[k].filter((x) => String(x).length > 12).length < lo) bad.push(`${k}: at least ${lo} specific entries`);
  const hexes = JSON.stringify(j).match(/#[0-9A-Fa-f]{6}\b/g) || []; if (hexes.length < 6) bad.push(`only ${hexes.length} hex colours written: give skin, hair, outfit, key light, accent and dominant as #RRGGBB`);
  const vague = /\b(nice|good|cool|beautiful|amazing|great|pretty|stylish)\b/i; walk2(j);
  function walk2(o, p = '') { if (typeof o === 'string' && vague.test(o) && o.split(/\s+/).length < 6) flat.push(`${p}: "${o}"`); else if (Array.isArray(o)) o.forEach((x, i) => walk2(x, `${p}[${i}]`)); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!k.startsWith('_') && k !== 'measured') walk2(v, p ? `${p}.${k}` : k); }
  if (bad.length || flat.length) { console.error(`style brief NOT complete (${bad.length + flat.length} problem(s)):\n- ${[...bad.slice(0, 25), ...flat.slice(0, 5).map((x) => 'too vague ' + x)].join('\n- ')}${bad.length > 25 ? `\n- ... and ${bad.length - 25} more` : ''}`); process.exit(1); }
  j.status = 'done'; j.validated_at = new Date().toISOString(); fs.writeFileSync(F, JSON.stringify(j, null, 1)); console.log(`style brief complete: ${hexes.length} colours, ${j.what_makes_it_this_style.length} style rules. Next: node tools/reference/style_map.mjs ${P} ${name}`); process.exit(0);
}
console.error('choose --template, --validate or --unavailable'); process.exit(2);
