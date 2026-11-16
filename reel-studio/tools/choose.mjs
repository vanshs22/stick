#!/usr/bin/env node
// Records the USER's choice at a gallery, in the file the stage's approval fingerprints. It never approves anything by itself.
//   node tools/choose.mjs <P> style <pack-id|number>            -> style-selection.json + brief.style_pack
//   node tools/choose.mjs <P> typography <number|set-id>        -> typography/typography.json
//   node tools/choose.mjs <P> captions --preset word-pop [--position bottom|middle|top|<y>] [--scale 1] [--highlight color|underline|box|none]
//   node tools/choose.mjs <P> layout <1-9>                      (the numbers of `gallery.mjs --kind layout`)
//   node tools/choose.mjs <P> voice --voice am_michael --speed 1.05 [--pace calm|brisk] [--music bed|upbeat|tension|none|<file>] [--sfx soft|none|punchy] [--pron "ffmpeg=eff eff em peg;yt-dlp=why tee dee el pee"]
import fs from 'node:fs';
import path from 'node:path';
import { TK, rd } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), what = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; }, w = (f, o) => { fs.mkdirSync(path.dirname(path.join(P, f)), { recursive: true }); fs.writeFileSync(path.join(P, f), JSON.stringify(o, null, 1)); console.log(`wrote ${f}`); };
if (!a[0] || !what || !fs.existsSync(path.join(P, 'brief.json'))) { console.error('usage: choose.mjs <projectDir> style|typography|captions|layout|voice ...'); process.exit(2); }
const brief = rd(path.join(P, 'brief.json')), now = new Date().toISOString();
const packs = fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => fs.existsSync(path.join(TK, 'style-packs', d, 'style.json')) && d !== '_template' && !rd(path.join(TK, 'style-packs', d, 'style.json')).legacy);
if (what === 'style') {
  const v = a[2], id = /^\d+$/.test(v) ? packs[+v - 1] : v; if (!packs.includes(id)) { console.error(`unknown style "${v}". Known: ${packs.map((p, i) => `${i + 1}=${p}`).join(' ')}`); process.exit(1); }
  const pack = rd(path.join(TK, 'style-packs', id, 'style.json')); w('style-selection.json', { pack: id, name: pack.name, chosen_at: now, status: (fs.existsSync(path.join(TK, 'style-packs', id, 'preview/index.json')) ? rd(path.join(TK, 'style-packs', id, 'preview/index.json')).status : 'unknown'), combined_from: pack.meta?.combined || null, reference: pack.meta?.reference || null });
  brief.style_pack = id; fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify(brief, null, 1)); console.log(`brief.style_pack = ${id}`);
} else if (what === 'typography') {
  const sets = rd(path.join(TK, 'tools/lib/typesets.json')), v = a[2], s = /^\d+$/.test(v) ? sets[+v - 1] : sets.find((x) => x.id === v); if (!s) { console.error(`unknown set. ${sets.map((x, i) => `${i + 1}=${x.id}`).join(' ')}`); process.exit(1); }
  let hi = 'color'; try { hi = rd(path.join(P, 'typography/typography.json')).highlight?.mode || 'color'; } catch { /* default */ }
  w('typography/typography.json', { id: s.id, name: s.name, chosen_at: now, headline: s.headline, supporting: s.supporting, ui: s.ui, caption: s.caption, highlight: { mode: hi } });
} else if (what === 'captions' || what === 'layout') {
  let preset = opt('preset', null), position = opt('position', 'bottom'), highlight = opt('highlight', 'color');
  if (what === 'layout') { const combos = []; for (const hi of ['color', 'underline', 'box']) for (const pos of ['bottom', 'middle', 'top']) combos.push({ pos, hi }); const c = combos[+a[2] - 1]; if (!c) { console.error('layout 1-9'); process.exit(1); } position = c.pos; highlight = c.hi; try { preset = preset || rd(path.join(P, 'typography/captions.json')).preset; } catch { /* none */ } }
  if (!preset) { console.error('captions need --preset'); process.exit(1); }
  const y = /^\d+$/.test(position) ? +position : null; if (y != null && (y < 180 || y > 1500)) { console.error('y must be inside the safe area 180-1500'); process.exit(1); }
  w('typography/captions.json', { preset, position: { anchor: y == null ? position : 'custom', y }, scale: +opt('scale', 1), chosen_at: now });
  let t = {}; try { t = rd(path.join(P, 'typography/typography.json')); } catch { t = { headline: { font: 'Inter', weight: 800 }, supporting: { font: 'InstrumentSerif' }, ui: { font: 'JetBrainsMono' }, caption: { font: 'Inter', weight: 900 } }; } t.highlight = { mode: highlight }; w('typography/typography.json', t);
} else if (what === 'voice') {
  const c = { voice: opt('voice', 'am_michael'), speed: +opt('speed', 1.0), pace: opt('pace', 'calm'), music: opt('music', 'bed'), sfx: opt('sfx', 'soft'), pronunciations: Object.fromEntries((opt('pron', '') || '').split(';').filter(Boolean).map((x) => x.split('='))), chosen_at: now };
  w('audio/voice-choice.json', c);
  const f = path.join(P, 'audio/audio-plan.json'); if (fs.existsSync(f)) { const ap = rd(f); ap.voice = { ...(ap.voice || {}), engine: ap.voice?.engine || 'kokoro', voice: c.voice, speed: c.speed, pronunciations: c.pronunciations }; ap.music = { ...(ap.music || {}), bed: c.music }; fs.writeFileSync(f, JSON.stringify(ap, null, 1)); console.log('updated audio/audio-plan.json'); }
} else { console.error('unknown choice kind'); process.exit(2); }
