#!/usr/bin/env node
// Style Studio: from "I want a <look> video" to an approved style pack, with pictures to choose from. The rest of the pipeline (script, gates, voice, captions, critics) does not change.
//   propose  <name> --brief "text" [--base <pack>] [--aspect 16:9|9:16] [--variants file.json] [--n 4] [--dir <studio dir>] [--shots S01,S02,S07,S16]
//   refine   <name> --from v2 [--set colors.accent=#ff5a3c ...] [--label "text"] [--why "text"]
//   approve  <name> --pick v3 --id <new-pack-id> --quote "<the user's own words>" [--skin game-hud|dev-terminal|finance-ticker|news-desk|creator-studio|explainer-notebook]   (the overlay skin the pack uses: docs/OVERLAY-BRAIN.md)
//   list     <name>
// 1. propose: writes 4 looks (yours from --variants, or four recipes of the base pack), renders the SAME four representative shots in each at the chosen aspect (title, stat, real-page card, checklist) and one sheet `choices.jpg` (row = look).
// 2. refine: copy a look, change named values, render it again. Repeat until the user is happy.
// 3. approve: needs the user's own words. Writes style-packs/<id>/{style.json,STYLE.md,preview/}, validated against schemas/style-pack.schema.json. Then `choose.mjs <project> style <id>` uses it like any pack.
// 3D looks on the inkbeat engine are DATA too: `propose <name> --engine inkbeat --variants file.json` where each variant has an `ink_look` (moods = light/sky/grade patches, hero, set from primitives; schema docs/INKBEAT.md,
// example skills/style-studio/ink-variants.example.json). Stills (wide, medium, close) are rendered by the real 3D engine, one row per look. `refine --set moods.main.patch.post.grade.saturation=1.3 --set set.props.0.c=#ff0000` or `--patch file.json` (deep merge) edit the data; `approve` writes the pack with `ink_look`, no code.
// A variants file is a JSON array: [{"id":"v1","label":"Warm paper","why":"calm, trustworthy","overrides":{"colors":{"bg":"#FBF3E4","accent":"#C8501F"},"fonts":{"sans":"Poppins"},"effects":{"grain":0.1},"chrome":"clean"}}]
// `overrides` has the shape of a project's style-overrides.json. Engines: this tool renders 2D and Stage3D packs (engine "remotion"). A new 3D look on the inkbeat engine is code (see docs/STYLE-GUIDE.md, section "A new 3D look").
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK, PY, deepMerge, setPath, defaultGL } from './lib/pipeline.mjs';
import { checkLook } from './ink/look_check.mjs';
import { renderStills } from './ink/lib/stills.mjs';

const a = process.argv.slice(2), cmd = a[0], name = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : d; }, all = (k) => a.flatMap((x, i) => (x === '--' + k ? [a[i + 1]] : []));
const usage = () => { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(2); };
if (!['propose', 'refine', 'approve', 'list'].includes(cmd) || !name) usage();
const D = path.resolve(opt('dir', 'style-studio'), name), J = path.join(D, 'choices.json'), rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)); };
const SHOTS = opt('shots', 'S01,S02,S07,S16');

/** four deterministic recipes of a base pack, used when the agent did not write its own looks: faithful, dark, warm, bold */
function recipes(base) {
  const c = base.tokens.colors, lum = (h) => { const n = parseInt(String(h).slice(1, 7), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; }, mixHex = (x, y, t) => '#' + [16, 8, 0].map((s) => Math.round(((parseInt(x.slice(1, 7), 16) >> s) & 255) * (1 - t) + ((parseInt(y.slice(1, 7), 16) >> s) & 255) * t).toString(16).padStart(2, '0')).join(''), dark = lum(c.bg) < 0.5;
  return [
    { id: 'v1', label: 'Faithful', why: 'the base pack as it is: the safe reference to compare the others with', overrides: {} },
    { id: 'v2', label: dark ? 'Light' : 'Dark', why: dark ? 'the same look on a light ground (daytime, calm)' : 'the same look on a dark ground (night, tech, focus)', overrides: dark ? { colors: { bg: '#F4F1EA', ink: '#16161A', ink2: '#3A3A42', muted: '#7C7A74', card: '#FFFFFF', accentSoft: mixHex('#F4F1EA', c.accent, 0.2) } } : { colors: { bg: '#101218', ink: '#F5F3EA', ink2: '#CFCDC4', muted: '#8E92A0', card: '#1B1E27', accentSoft: mixHex('#101218', c.accent, 0.3) } } },
    { id: 'v3', label: 'Warm', why: 'warmer ground and accent: friendly, human, story-led', overrides: { colors: { bg: mixHex(c.bg, '#FFE9C8', 0.45), accent: mixHex(c.accent, '#E8591A', 0.55), card: mixHex(c.card, '#FFF6E6', 0.5) }, effects: { grain: 0.08, vignette: 0.18 } } },
    { id: 'v4', label: 'Bold', why: 'one loud accent, heavier type, sticker chrome: thumbnails and fast pacing', overrides: { colors: { accent: '#FF3B6B', accentSoft: mixHex(c.bg, '#FF3B6B', 0.22) }, chrome: 'sticker' } },
  ];
}

function render(v, base, aspect) {
  const dir = path.join(D, 'variants', v.id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); wr(path.join(dir, 'overrides.json'), v.overrides || {});
  const r = spawnSync('node', ['--no-warnings', path.join(TK, 'tools/layout_lab.mjs'), '--style', base, '--aspect', aspect, '--shots', SHOTS, '--at', '0.8', '--no-critic', '--scale', '0.5', '--overrides', path.join(dir, 'overrides.json'), '--out', dir], { encoding: 'utf8', env: { ...process.env, REEL_TEST_MODE: '1' }, maxBuffer: 1 << 26 });
  if (r.status) { console.error(`render of ${v.id} failed:\n${(r.stdout + r.stderr).slice(-700)}`); process.exit(1); }
  const sheet = fs.readdirSync(dir).find((f) => f.endsWith('-sheet.jpg')); v.sheet = path.join('variants', v.id, sheet); console.log(`${v.id} ${v.label}: ${v.sheet}`);
}
/** one row per ink look: wide, medium, close at the studio aspect, rendered by the inkbeat engine (one bundle per run) */
async function renderInk(v, aspect) {
  const R = path.join(TK, 'renderers/inkbeat'), dir = path.join(D, 'variants', v.id), lay = aspect === '9:16' ? 'P' : 'L';
  const bad = checkLook(v.ink_look); if (bad.length) { console.error(`${v.id}: ink_look is not valid:\n  ` + bad.join('\n  ')); process.exit(1); }
  if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error(`run "npm install" in ${R} first (node scripts/setup.mjs --with-inkbeat)`); process.exit(1); }
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); wr(path.join(dir, 'look.json'), v.ink_look);
  const files = ['wide', 'medium', 'close'].map((fr) => path.join(dir, `${fr}.jpg`));
  try { await renderStills(['wide', 'medium', 'close'].map((fr, i) => ({ id: `LookCustom-${fr}-${lay}`, frame: 0, out: files[i], inputProps: { look: v.ink_look, frame: fr, layout: lay, mood: 0 } })), { scale: +opt('scale', '0.5'), quality: opt('quality', 'master') }); }   // one browser for the three frames (6 s each instead of about 55 s)
  catch (e) { console.error(`${v.id} failed:\n${String(e.message).slice(-600)}`); process.exit(1); }
  const py = `import sys
from PIL import Image
ims=[Image.open(f).convert('RGB') for f in sys.argv[2:]]; H=ims[0].height; S=Image.new('RGB',(sum(i.width for i in ims)+8*(len(ims)-1),H),(18,18,24)); x=0
for i in ims: S.paste(i,(x,0)); x+=i.width+8
S.save(sys.argv[1],quality=88)`;
  const r = spawnSync(PY, ['-c', py, path.join(dir, 'look-sheet.jpg'), ...files], { encoding: 'utf8' }); if (r.status) { console.error(r.stderr.slice(-300)); process.exit(1); }
  v.sheet = path.join('variants', v.id, 'look-sheet.jpg'); console.log(`${v.id} ${v.label}: ${v.sheet}`);
}
/** four looks that differ only in the sky are one look: warn when two variants' wide frames are within 9 percent mean difference */
function alike(S) {
  const py = `import sys
from PIL import Image, ImageChops, ImageStat
ims=[Image.open(f).convert('L').resize((96,96)) for f in sys.argv[1:]]
for i in range(len(ims)):
    for j in range(i+1,len(ims)): print(i,j,round(sum(ImageStat.Stat(ImageChops.difference(ims[i],ims[j])).mean)/255*100,1))`;
  const vs = S.variants.slice(-8), r = spawnSync(PY, ['-c', py, ...vs.map((v) => path.join(D, path.dirname(v.sheet), 'wide.jpg'))], { encoding: 'utf8' });
  for (const l of (r.stdout || '').trim().split('\n').filter(Boolean)) { const [i, j, d] = l.split(' '); if (+d < 9) console.log(`WARN ${vs[i].id} and ${vs[j].id} look alike (mean difference ${d} %): vary the set palette, the key light colour and the shading ramp, not only the sky`); }
}
function choices(S) {
  if (S.engine === 'inkbeat' && cmd === 'propose') alike(S);
  const rows = S.variants.slice(-8).map((v) => `${path.join(D, v.sheet)}=${v.id} ${v.label}`), py = `import sys
from PIL import Image, ImageDraw
items=[a.split('=',1) for a in sys.argv[2:]]; ims=[(Image.open(f).convert('RGB'),l) for f,l in items]; W=1600
rs=[(im.resize((W,round(im.height*W/im.width))),l) for im,l in ims]; S=Image.new('RGB',(W,sum(i.height+34 for i,_ in rs)),(20,20,26)); d=ImageDraw.Draw(S); y=0
for im,l in rs:
    d.text((10,y+8),l,fill=(255,220,120)); S.paste(im,(0,y+30)); y+=im.height+34
S.save(sys.argv[1],quality=88)`;
  const r = spawnSync(PY, ['-c', py, path.join(D, 'choices.jpg'), ...rows], { encoding: 'utf8' }); if (r.status) console.error(r.stderr.slice(-300)); else console.log(`\nLOOK AT: ${path.join(D, 'choices.jpg')}  (one row per look, the same four shots in each)`);
}
const load = () => { if (!fs.existsSync(J)) { console.error(`no studio "${name}" here (${D}). Run propose first.`); process.exit(1); } return rd(J); };
const pack = (b) => rd(path.join(TK, 'style-packs', b, 'style.json'));

if (cmd === 'propose') {
  const brief = opt('brief'), base = opt('base', 'editorial-notebook'), aspect = opt('aspect', '16:9'); if (!brief) usage();
  if (!fs.existsSync(path.join(TK, 'style-packs', base, 'style.json'))) { console.error(`no base pack "${base}". Packs: ${fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => d !== '_template').join(', ')}`); process.exit(1); }
  const ink = opt('engine') === 'inkbeat';
  if (ink) {
    if (!opt('variants')) { console.error('--engine inkbeat needs --variants <file.json>: an array of {id,label,why,ink_look}. Start from skills/style-studio/ink-variants.example.json'); process.exit(1); }
    const vs = rd(path.resolve(opt('variants'))); if (!vs.length || vs.some((v) => !v.id || !v.label || !v.ink_look)) { console.error('every variant needs id, label and ink_look'); process.exit(1); }
    const S = { name, brief, base: opt('base', 'kidsong-3d'), engine: 'inkbeat', aspect: opt('aspect', '9:16'), variants: vs.map((v) => ({ ...v })), status: 'awaiting-choice', created: new Date().toISOString() }; wr(J, S);
    for (const v of S.variants) await renderInk(v, S.aspect); wr(J, S); choices(S);
    console.log(`\nShow the user choices.jpg and ask ONE question: which look (${S.variants.map((v) => v.id).join(', ')}), or what to change. Then \`refine\` or \`approve\`.`); process.exit(0);
  }
  const bp = pack(base); if (bp.engine === 'inkbeat') { console.error(`"${base}" runs on the inkbeat 3D engine. A new 3D look here is data: add --engine inkbeat --variants <file> (docs/INKBEAT.md, skills/style-studio/ink-variants.example.json). The built-in four: node tools/ink/looks.mjs <outDir>.`); process.exit(1); }
  const variants = opt('variants') ? rd(path.resolve(opt('variants'))) : recipes(bp).slice(0, +opt('n', 4));
  if (!variants.length || variants.some((v) => !v.id || !v.label)) { console.error('every variant needs an id and a label'); process.exit(1); }
  const S = { name, brief, base, aspect, variants: variants.map((v) => ({ ...v })), status: 'awaiting-choice', created: new Date().toISOString() }; wr(J, S);
  for (const v of S.variants) render(v, base, aspect); wr(J, S); choices(S);
  console.log(`\nShow the user choices.jpg and ask ONE question: which look (${S.variants.map((v) => v.id).join(', ')}), or what to change. Then \`refine\` or \`approve\`.`);
}
if (cmd === 'list') { const S = load(); console.log(`${S.name}: ${S.status}\nbrief: ${S.brief}\nbase: ${S.base}, ${S.aspect}`); for (const v of S.variants) console.log(`  ${v.id} ${v.label}${v.why ? ' (' + v.why + ')' : ''}`); }
if (cmd === 'refine') {
  const S = load(), from = S.variants.find((v) => v.id === opt('from')); if (!from) { console.error(`--from must be one of ${S.variants.map((v) => v.id).join(', ')}`); process.exit(1); }
  if (S.engine === 'inkbeat') {
    const il = JSON.parse(JSON.stringify(from.ink_look)), cv = (x) => (/^-?\d+(\.\d+)?$/.test(x) ? +x : x === 'true' || x === 'false' ? x === 'true' : x.startsWith('[') || x.startsWith('{') ? JSON.parse(x) : x);
    for (const kv of all('set')) { const i = kv.indexOf('='); if (i < 1) { console.error(`--set needs path=value, got "${kv}"`); process.exit(1); } setPath(il, kv.slice(0, i), cv(kv.slice(i + 1))); }
    const merged = opt('patch') ? deepMerge(il, rd(path.resolve(opt('patch')))) : il, id = 'v' + (Math.max(...S.variants.map((v) => +v.id.slice(1) || 0)) + 1), nv = { id, label: opt('label', `${from.label} (changed)`), why: opt('why', `from ${from.id}: ${[...all('set'), opt('patch') && 'patch ' + opt('patch')].filter(Boolean).join(', ') || 'no change'}`), ink_look: merged, ...(from.overrides ? { overrides: from.overrides } : {}) };
    S.variants.push(nv); await renderInk(nv, S.aspect); wr(J, S); choices(S); process.exit(0);
  }
  const ov = JSON.parse(JSON.stringify(from.overrides || {})); for (const kv of all('set')) { const i = kv.indexOf('='); if (i < 1) { console.error(`--set needs path=value, got "${kv}"`); process.exit(1); } let v = kv.slice(i + 1); if (/^-?\d+(\.\d+)?$/.test(v)) v = +v; else if (v === 'true' || v === 'false') v = v === 'true'; setPath(ov, kv.slice(0, i), v); }
  const id = 'v' + (Math.max(...S.variants.map((v) => +v.id.slice(1) || 0)) + 1), nv = { id, label: opt('label', `${from.label} (changed)`), why: opt('why', `from ${from.id}: ${all('set').join(', ') || 'no change'}`), overrides: ov }; S.variants.push(nv); render(nv, S.base, S.aspect); wr(J, S); choices(S);
}
if (cmd === 'approve') {
  const S = load(), v = S.variants.find((x) => x.id === opt('pick')), id = opt('id'), quote = opt('quote', '').trim();
  if (!v || !id || !/^[a-z0-9][a-z0-9-]{2,40}$/.test(id)) { console.error('usage: approve <name> --pick v3 --id my-style (lowercase letters, digits, dashes) --quote "<the user\'s words>"'); process.exit(2); }
  if (quote.length < 3) { console.error('approve needs --quote: the user\'s own words choosing this look. Nobody approves a look for them.'); process.exit(1); }
  if (fs.existsSync(path.join(TK, 'style-packs', id))) { console.error(`style-packs/${id} already exists: choose another id (an existing pack is never overwritten)`); process.exit(1); }
  if (S.engine === 'inkbeat') {
    const bad = checkLook(v.ink_look); if (bad.length) { console.error('ink_look is not valid:\n  ' + bad.join('\n  ')); process.exit(1); }
    const b = pack(S.base), tok = v.overrides?.colors ? { colors: v.overrides.colors } : {}, out = { ...b, id, name: opt('title', S.name), description: `${S.brief} (3D look made in Style Studio, "${v.label}")`, tokens: deepMerge(b.tokens, tok), rules: v.rules || [`Look: ${S.brief}`, 'The set, hero and light are the data in ink_look: change them with Style Studio (refine), not by adding code.', 'Camera: the shot ladder in docs/CAMERA-GRAMMAR.md; every key fact in the story is an object in the set.', 'No flashing, no strobing; screen shake only on an impact beat.'], ink_look: v.ink_look, camera_language: opt('camera', b.camera_language), ...(opt('cadence') ? { cadence: opt('cadence') } : {}), ...(opt('skin') ? { overlay_skin: opt('skin') } : {}), studio: { from: S.base, look: v.id, brief: S.brief, approved_by_quote: quote, approved_at: new Date().toISOString() } };
    const pd = path.join(TK, 'style-packs', id), tmp = path.join(D, 'approved.style.json'); fs.writeFileSync(tmp, JSON.stringify(out)); const val = spawnSync('node', [path.join(TK, 'tools/validate.mjs'), 'style-pack', tmp], { encoding: 'utf8' }); if (val.status) { console.error('the pack does not validate:\n' + (val.stdout + val.stderr).slice(-600)); process.exit(1); }
    fs.mkdirSync(path.join(pd, 'preview'), { recursive: true }); fs.writeFileSync(path.join(pd, 'style.json'), JSON.stringify(out, null, 2)); fs.copyFileSync(path.join(D, v.sheet), path.join(pd, 'preview', 'look.jpg'));
    fs.writeFileSync(path.join(pd, 'STYLE.md'), `# ${out.name}\n\n${out.description}\n\nA 3D look as data (\`ink_look\` in style.json), made in Style Studio, look **${v.label}** (${v.why || ''}). Approved with: "${quote}".\n\nRender it: \`node tools/ink/scaffold_plan.mjs <project>\` reads \`ink_look\`; change it with \`style_studio.mjs refine\`. Preview: preview/look.jpg.\n`);
    S.status = 'approved'; S.approved = { pick: v.id, id, quote, at: new Date().toISOString() }; wr(J, S);
    console.log(`approved: style-packs/${id}/ (style.json with ink_look, STYLE.md, preview/look.jpg)\nuse it:  node tools/choose.mjs <project> style ${id}`); process.exit(0);
  }
  const b = pack(S.base), ov = JSON.parse(JSON.stringify(v.overrides || {})); if (ov.colors?.bg && !ov.bgs?.paper && b.tokens.bgs?.paper) ov.bgs = { ...(ov.bgs || {}), paper: ov.colors.bg };   // same rule as syncProject
  const { effects, defaults, ...tok } = ov, out = { ...b, id, name: opt('title', S.name), description: `${S.brief} (from ${S.base}, look "${v.label}")`, tokens: deepMerge(b.tokens, tok), effects: deepMerge(b.effects || {}, effects || {}), ...(b.defaults || defaults ? { defaults: deepMerge(b.defaults || {}, defaults || {}) } : {}), ...(opt('skin') ? { overlay_skin: opt('skin') } : {}), studio: { from: S.base, look: v.id, brief: S.brief, approved_by_quote: quote, approved_at: new Date().toISOString() } };
  const pd = path.join(TK, 'style-packs', id); fs.mkdirSync(path.join(pd, 'preview'), { recursive: true }); fs.writeFileSync(path.join(pd, 'style.json'), JSON.stringify(out, null, 2));
  const tmp = path.join(D, 'approved.style.json'); fs.writeFileSync(tmp, JSON.stringify(out)); const val = spawnSync('node', [path.join(TK, 'tools/validate.mjs'), 'style-pack', tmp], { encoding: 'utf8' }); if (val.status) { fs.rmSync(pd, { recursive: true, force: true }); console.error('the pack does not validate:\n' + (val.stdout + val.stderr).slice(-600)); process.exit(1); }
  fs.copyFileSync(path.join(D, v.sheet), path.join(pd, 'preview', 'look.jpg'));
  fs.writeFileSync(path.join(pd, 'STYLE.md'), `# ${out.name}\n\n${out.description}\n\nBuilt with Style Studio from \`${S.base}\`, look **${v.label}** (${v.why || ''}). Approved with: "${quote}".\n\n## Overrides on the base\n\n\`\`\`json\n${JSON.stringify(ov, null, 2)}\n\`\`\`\n\nEverything not listed here is the base pack (\`style-packs/${S.base}/STYLE.md\`). Rules: ${out.rules.length} inherited. Edit this file to add what is specific to this look (what to do, what never to do).\n`);
  S.status = 'approved'; S.approved = { pick: v.id, id, quote, at: new Date().toISOString() }; wr(J, S);
  console.log(`approved: style-packs/${id}/ (style.json, STYLE.md, preview/look.jpg)\nuse it:  node tools/choose.mjs <project> style ${id}`);
}
