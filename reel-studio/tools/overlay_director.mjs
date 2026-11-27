#!/usr/bin/env node
// Overlay director: reads the script and decides, for every sentence, WHAT should appear on screen on WHICH word (a prop, a card, a counter, a tag, a banner), in the visual language (skin) of the topic.
// The thinking comes from two reference reels (docs/OVERLAY-BRAIN.md). This tool is the mechanical half: it finds what deserves a picture, picks the device, enforces the budget and writes the plan; YOU add what only understanding can
// (a prop for an idea no rule knows, the metaphor of the story) by editing the plan or the storyboard, then run the critics.
//   node tools/overlay_director.mjs <project> [--skin game-hud|dev-terminal|finance-ticker|news-desk|creator-studio|explainer-notebook] [--apply] [--max 3] [--gap 1.0]
//   node tools/overlay_director.mjs --text "One sentence to try." [--beat hook|step|cta]
// Writes <project>/storyboard/overlay-plan.json and prints it. With --apply the OVERLAYS are merged into storyboard/storyboard.json (anchors added; your own overlays are kept; a card the plan suggests is only printed:
// changing a shot's main picture is a design decision for you and the user). Budget: at most --max (3) per line, at least --gap (1.0 s, or 3 words) between two on one line, at most 4 on screen.
import fs from 'node:fs';
import path from 'node:path';
import { TK, rd } from './lib/pipeline.mjs';
import { detect, norm } from './lib/overlay_brain.mjs';

const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : d; }, MAX = +opt('max', 3), GAP = +opt('gap', 1.0);
const SK = JSON.parse(fs.readFileSync(path.join(TK, 'skills/overlay-design/skins.json'), 'utf8')).skins;
const pickSkin = (text, forced) => { if (forced) return SK.find((s) => s.id === forced) || (console.error(`unknown skin "${forced}". Skins: ${SK.map((s) => s.id).join(', ')}`), process.exit(2)); const t = ' ' + norm(text).replace(/\s+/g, ' ') + ' ', words = String(text).toLowerCase().split(/[^a-z0-9$']+/); const sc = SK.map((s) => ({ s, n: s.match.reduce((n, k) => n + (k.includes(' ') ? (String(text).toLowerCase().includes(k) ? 2 : 0) : words.filter((w) => w === k).length), 0) })).sort((x, y) => y.n - x.n); void t; return sc[0].n ? sc[0].s : SK.find((s) => s.id === 'explainer-notebook'); };
// where an overlay sits on the 1080x1920 portrait canvas (landscape maps these by role: docs/LONGFORM-LANDSCAPE.md)
const POS = { prop: { x: 800, y: 560 }, 'price-tag': { x: 780, y: 470 }, calendar: { x: 880, y: 440 }, sticker: { x: 860, y: 430 }, callout: { x: 700, y: 1130 }, bubble: { x: 790, y: 520 }, cursor: {}, 'focus-ring': { x: 540, y: 760 } };

function planLine(ln, i, words, ctx) {
  const cand = detect(ln.text, { beat: ln.beat, skin: ctx.skin, keyword: ctx.keyword }).sort((x, y) => y.priority - x.priority || x.i - y.i), chosen = [], t = (d) => (words ? words.find((w) => w.line === i && norm(w.w) === norm(d.word))?.s ?? null : null);
  for (const d of cand) { if (chosen.filter((c) => !/^(step|verdict-bad|verdict-good)$/.test(c.device)).length >= MAX && !/^(step|verdict-bad|verdict-good)$/.test(d.device)) continue; const ts = t(d); const TOP = (x) => /^(step|verdict-bad|verdict-good)$/.test(x.device);   // the top band (step label, verdict banner) never competes with a prop for the same place or moment
    if (chosen.some((c) => !(TOP(c) !== TOP(d)) && (ts != null && t(c) != null ? Math.abs(t(c) - ts) < GAP : Math.abs(c.i - d.i) < 3) || (c.device === d.device && c.word === d.word))) continue; if (d.kind === 'card' && chosen.some((c) => c.kind === 'card')) continue; chosen.push(d); }
  // a sentence that shows nothing gets its emphasised word as a keyword sticker (every line earns a visual beat; the reference reels never leave a line bare)
  if (!chosen.some((c) => c.kind === 'overlay') && !chosen.length) { const e = (ln.emphasis || [])[0]; if (e) { const k = ln.text.split(/\s+/).findIndex((w) => norm(w) === norm(e)); if (k >= 0) chosen.push({ i: k, word: e, device: 'keyword', kind: 'overlay', spec: { type: 'sticker', text: e.toUpperCase().replace(/[^A-Z0-9$%]/g, ''), color: ctx.skin.accent, rotate: -4, size: 54 }, why: `the emphasised word "${e}" as a keyword sticker (this line had nothing concrete to show)`, priority: 2 }); } }
  return chosen.sort((x, y) => x.i - y.i);
}

if (opt('text')) { const skin = pickSkin(opt('text'), opt('skin')); console.log(`skin: ${skin.id}`); for (const d of planLine({ text: opt('text'), beat: opt('beat', 'step') }, 0, null, { skin })) console.log(`  "${d.word}" -> ${d.device} (${d.kind}): ${d.why}${d.kind === 'card' ? '  ' + JSON.stringify(d.spec) : ''}`); process.exit(0); }

const P = path.resolve(a[0] || ''); if (!a[0] || !fs.existsSync(path.join(P, 'script/script.json'))) { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(2); }
const sc = rd(path.join(P, 'script/script.json')), brief = (() => { try { return rd(path.join(P, 'brief.json')); } catch { return {}; } })(), pack = (() => { try { return rd(path.join(TK, 'style-packs', brief.style_pack, 'style.json')); } catch { return {}; } })();
const words = (() => { try { return rd(path.join(P, 'data/words.json')); } catch { return null; } })(), sbf = path.join(P, 'storyboard/storyboard.json'), sb = fs.existsSync(sbf) ? rd(sbf) : null;
const skin = pickSkin(opt('skin') ? '' : [brief.topic, brief.title, brief.goal, sc.lines.map((l) => l.text).join(' ')].join(' '), opt('skin') || pack.overlay_skin);
const steps = sc.lines.flatMap((l) => l.text.split(/\s+/).filter((w) => /^(first|next|then|last|finally)$/i.test(norm(w)))), numbered = Math.max(0, ...sc.lines.flatMap((l) => [...l.text.matchAll(/\b(?:number|step)\s+(\w+)/gi)].map((m) => +norm(m[1]) || ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 }[norm(m[1])] || 0)))), NSTEPS = numbered || steps.length || 0;
let seq = 0; const plan = { skin: skin.id, vocabulary: skin.vocabulary, generated: new Date().toISOString(), budget: { max_per_line: MAX, min_gap_s: GAP, max_on_screen: 4 }, lines: [], cards: [] };
sc.lines.forEach((ln, i) => {
  const ds = planLine(ln, i, words, { skin, keyword: brief.cta?.keyword }).map((d) => { const name = `ov${i + 1}_${norm(d.word).replace(/[^a-z0-9]/g, '') || 'w' + d.i}`; let spec = JSON.parse(JSON.stringify(d.spec));
    if (d.device === 'step') { seq++; const n = spec.n ?? seq; spec = { type: 'step-label', text: (skin.words.step || 'STEP {n}/{N}').replace('{n}', n).replace('{N}', NSTEPS || '?'), n, of: NSTEPS || undefined }; }
    if (d.device === 'verdict-bad' || d.device === 'verdict-good') spec.text = d.device === 'verdict-bad' ? skin.words.fail : skin.words.pass;
    return { word: d.word, anchor: name, device: d.device, kind: d.kind, spec, why: d.why, token: d.i }; });
  plan.lines.push({ id: ln.id, beat: ln.beat, text: ln.text, devices: ds, ...(ds.length ? {} : { needs_prop: true }) });
  for (const d of ds) if (d.kind === 'card') { const tokens = ln.text.split(/\s+/), pre = d.spec.anchorPrefix; d.card_anchors = (d.spec.item_tokens || []).map((k, j) => ({ name: `${pre}${j}`, line: ln.id, word: tokens[k].replace(/[^A-Za-z0-9$%.'-]/g, '') })); const { item_tokens, ...spec } = d.spec; plan.cards.push({ line: ln.id, word: d.word, ...spec, anchors: d.card_anchors, wheel_or_list: skin.prefer?.list && d.device === 'list' ? skin.prefer.list : undefined }); }
});
const total = plan.lines.reduce((n, l) => n + l.devices.length, 0), words_ = sc.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0), dur = sc.est_seconds || brief.duration_sec || words_ / 2.8;
plan.summary = { devices: total, overlays: total - plan.cards.length, card_suggestions: plan.cards.length, lines_with_a_visual: plan.lines.filter((l) => l.devices.length).length + '/' + plan.lines.length, events_per_min_est: +(total / dur * 60).toFixed(1), reference_reels_events_per_min: 31 };
fs.mkdirSync(path.join(P, 'storyboard'), { recursive: true }); fs.writeFileSync(path.join(P, 'storyboard/overlay-plan.json'), JSON.stringify(plan, null, 1));
console.log(`skin: ${skin.id}  (${skin.vocabulary.slice(0, 110)}...)\n`);
for (const l of plan.lines) { console.log(`${l.id} [${l.beat}] ${l.text}`); if (!l.devices.length) console.log('    (nothing the lexicon knows: run the napkin protocol, docs/OVERLAY-BRAIN.md "Unusual ideas": find the object, the number, the person, the moment; then add a prop overlay by hand)'); for (const d of l.devices) console.log(`    on "${d.word}": ${d.device.padEnd(16)} ${d.kind === 'card' ? 'CARD ' + d.spec.component : [].concat(d.spec).map((x) => x.type).join('+')}  - ${d.why}`); }
console.log(`\n${plan.summary.devices} devices (${plan.summary.overlays} overlays, ${plan.summary.card_suggestions} card suggestions), ${plan.summary.lines_with_a_visual} lines have a visual, about ${plan.summary.events_per_min_est} per minute (the reference reels: about 31).`);
if (a.includes('--apply')) {
  if (!sb) { console.error('no storyboard yet: write it first (scaffold_storyboard.mjs), then --apply'); process.exit(1); } let added = 0;
  for (const s of sb.shots) { const ids = new Set(s.line_ids), mine = plan.lines.filter((l) => ids.has(l.id)); s.overlays = s.overlays || []; s.anchors = s.anchors || [];
    for (const l of mine) for (const d of l.devices) { if (d.kind !== 'overlay') continue; if (s.overlays.some((o) => o.anchor === d.anchor || (o.anchor && s.anchors.find((x) => x.name === o.anchor)?.word?.toLowerCase() === d.word.toLowerCase() && o.type === (Array.isArray(d.spec) ? d.spec[0].type : d.spec.type)))) continue;
      if (!s.anchors.some((x) => x.name === d.anchor)) s.anchors.push({ name: d.anchor, line: l.id, word: d.word }); // from_director marks an overlay placed by ROLE (dock, strip, card, free) in both frame shapes, so a tag never covers a card's words
      const specs = Array.isArray(d.spec) ? d.spec : [d.spec];
      for (const sp of specs) { const p0 = POS[sp.type] || {}, ov = { ...p0, ...sp, anchor: d.anchor, from_director: true }; if (sp.type === 'cursor') { ov.from = [300, 1000]; ov.to = [620, 820]; } if (sp.type === 'scribble') { ov.x = POS.calendar.x; ov.y = POS.calendar.y; ov.anchor = d.anchor; } s.overlays.push(ov); added++; } } }
  fs.writeFileSync(sbf, JSON.stringify(sb, null, 1)); console.log(`\nmerged ${added} overlay(s) into storyboard/storyboard.json (marked "from_director": remove any you do not want). Cards are only suggested above.`);
}
