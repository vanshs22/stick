#!/usr/bin/env node
// Decision galleries: the user CHOOSES by looking, with real renders from the project's own engine.
//   node tools/gallery.mjs <P> --kind styles [--detail <id>] [--compare <id,id>]   one numbered sheet of every style (real preview stills)
//   node tools/gallery.mjs <P> --kind typography [--all]    animated type sets over the project's picture  -> review/gallery/typography-<n>.mp4 + sheet
//   node tools/gallery.mjs <P> --kind captions               every caption preset animated with the real narration timing -> captions-<preset>.mp4 + sheet
//   node tools/gallery.mjs <P> --kind layout                 caption placement x highlight style, stills
// Needs the project's remotion node_modules (see tools/lib/pipeline.mjs syncProject) and, for sheets, ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
import { TK, run, rd, syncProject, timing, copyPublic } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; }, kind = opt('kind', 'styles');
if (!a[0] || !fs.existsSync(path.join(P, 'brief.json'))) { console.error('usage: gallery.mjs <projectDir> --kind styles|typography|captions|layout'); process.exit(2); }
const R = path.join(P, 'remotion'), OUT = path.join(P, 'review/gallery'); fs.mkdirSync(OUT, { recursive: true }); syncProject(P);
const env = { ...process.env, REMOTION_GL: process.env.REMOTION_GL || 'angle' };
const rem = (args) => { const r = run('npx', ['remotion', ...args, '--timeout=240000'], { cwd: R, env }); if (r.status) throw new Error((r.stderr || r.stdout).slice(-700)); };
const props = (name, o) => { const f = path.join(OUT, `_${name}.json`); fs.writeFileSync(f, JSON.stringify(o)); return f; };
const sheet = (name, o, file = `${name}.jpg`) => { const png = path.join(OUT, `${name}.png`); rem(['still', 'src/index.ts', 'Sheet', png, `--props=${props(name, o)}`]); const j = path.join(OUT, file); const f = run('ffmpeg', ['-y', '-v', 'error', '-i', png, '-q:v', '3', j]); return f.status ? png : j; };
const brief = rd(path.join(P, 'brief.json')), pub = (f) => copyPublic(P, [f])[0];
const packs = fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => fs.existsSync(path.join(TK, 'style-packs', d, 'style.json')) && d !== '_template' && !rd(path.join(TK, 'style-packs', d, 'style.json')).legacy).map((id) => ({ id, ...rd(path.join(TK, 'style-packs', id, 'style.json')) }));
const prev = (id) => ['01', '02', '03'].map((n) => path.join(TK, 'style-packs', id, 'preview', n + '.jpg')).filter(fs.existsSync);
const first = (t) => String(t || '').split(/(?<=[.!?])\s/)[0].slice(0, 130);

if (kind === 'styles') {
  const pick = (id) => packs.find((p) => p.id === id || p.name?.toLowerCase() === id.toLowerCase());
  const card = (p, i) => ({ n: i + 1, name: p.name, line: first(p.description), imgs: prev(p.id).map(pub), facts: [{ k: 'look', v: first(p.description) }, { k: 'camera', v: String(p.camera_language || '').slice(0, 190) }, ...(p.rules || []).slice(0, 2).map((r, k) => ({ k: 'rule ' + (k + 1), v: String(r).slice(0, 150) })), { k: 'engine', v: (rd(path.join(TK, 'style-packs', p.id, 'preview/index.json')).status || '').replace('stage3d', 'sculpted 3D + film look').replace('legacy-3d', 'legacy 3D (primitive characters)').replace('2d', '2D motion graphics') }], swatches: Object.values(p.tokens?.colors || {}).slice(0, 7).map(String) });
  const missing = packs.filter((p) => !prev(p.id).length).map((p) => p.id); if (missing.length) { console.error(`no preview renders for: ${missing.join(', ')}. Run: node tools/style_previews.mjs`); process.exit(1); }
  let out;
  if (opt('compare')) { const [x, y] = opt('compare').split(',').map(pick); out = sheet('styles-compare', { kind: 'compare', title: `${x.name}  vs  ${y.name}`, subtitle: 'Same story, two looks', items: [card(x, packs.indexOf(x)), card(y, packs.indexOf(y))] }); }
  else if (opt('detail')) { const x = pick(opt('detail')); out = sheet('styles-' + x.id, { kind: 'detail', title: x.name, subtitle: x.family, items: [card(x, packs.indexOf(x))] }); }
  else out = sheet('styles', { kind: 'grid', title: 'Choose a style', subtitle: 'Real renders of the same short story. Reply with a number, two numbers to compare, or "combine 2+5".', items: packs.map(card), cols: 2 });
  fs.writeFileSync(path.join(OUT, 'styles.md'), '# Styles\n\n' + packs.map((p, i) => `${i + 1}. **${p.name}** (${p.id}): ${first(p.description)}`).join('\n') + '\n\nAsk for: a number to choose, "compare 2 5" (`--compare id,id`), "details 3" (`--detail id`), "combine 2+5" (tools/combine_styles.mjs), or "new style from my reference" (tools/new_style_from_reference.mjs).\n');
  console.log(`${out}\n(numbering: ${packs.map((p, i) => `${i + 1}=${p.id}`).join(' ')})`);
} else if (kind === 'typography' || kind === 'captions' || kind === 'layout') {
  // the picture behind the demos: the project's own first shot if it exists, else the pack's preview still
  // the picture behind the demos: a caption-free frame of the project's own shot (falls back to the pack's preview still)
  const plate = () => { try { const tl = rd(path.join(P, 'data/timeline.json')), sh = tl.shots.find((x) => x.id === 'S02') || tl.shots[0], frame = Math.round((sh.start + (sh.end - sh.start) * 0.7) * tl.fps), f = path.join(OUT, 'plate.png'); rem(['still', 'src/index.ts', 'Reel', f, `--frame=${frame}`, '--props={"captions":false,"safeZones":false}']); return f; } catch (e) { return null; } };
  const still = plate() || prev(brief.style_pack)[1] || prev(brief.style_pack)[0];
  if (!still) { console.error('no picture to put the demos on: build the timeline or run style_previews first'); process.exit(1); }
  const bg = pub(still);
  if (kind === 'typography') {
    const sets = rd(path.join(TK, 'tools/lib/typesets.json')).slice(0, a.includes('--all') ? 8 : 6), dark = brief.style_pack !== 'editorial-notebook';
    sets.forEach((s, i) => { const f = props(`type-${i + 1}`, { bg, set: s, dark, n: i + 1 }); rem(['render', 'src/index.ts', 'TypeDemo', path.join(OUT, `typography-${i + 1}.mp4`), `--props=${f}`, '--scale=0.5']); rem(['still', 'src/index.ts', 'TypeDemo', path.join(OUT, `typography-${i + 1}.png`), `--props=${f}`, '--frame=100']); });
    const out = sheet('typography', { kind: 'grid', title: 'Choose the type', subtitle: 'Headline, supporting line, UI label and caption. Animated: open the .mp4 files.', items: sets.map((s, i) => ({ n: i + 1, name: s.name, line: `${s.best_for}. ${s.headline.font} / ${s.supporting.font} / ${s.ui.font}`, imgs: [pub(path.join(OUT, `typography-${i + 1}.png`))] })), cols: 3 });
    console.log(`${out}\nvideos: ${sets.map((s, i) => `${i + 1}=typography-${i + 1}.mp4 (${s.id})`).join(' ')}`);
  } else {
    const presets = ['word-pop', 'one-word', 'boxed', 'phrase', 'typewriter', 'karaoke', 'headline', 'dialogue'], cur = (() => { try { return rd(path.join(P, 'typography/captions.json')).preset; } catch { return null; } })() || brief.captions?.preset || 'word-pop';
    const mk = (preset) => { timing(P, { preset }); const tl = rd(path.join(P, 'data/timeline.json')); return { ...tl, shots: [], audio: '' }; };
    const tls = Object.fromEntries(presets.map((x) => [x, mk(x)])); timing(P, { preset: cur });
    if (kind === 'captions') {
      presets.forEach((x, i) => { const f = props(`cap-${i + 1}`, { bg, timeline: tls[x], preset: x, label: `${i + 1}  ${x}`, dur: 4.5 }); rem(['render', 'src/index.ts', 'CaptionDemo', path.join(OUT, `captions-${i + 1}.mp4`), `--props=${f}`, '--scale=0.5']); rem(['still', 'src/index.ts', 'CaptionDemo', path.join(OUT, `captions-${i + 1}.png`), `--props=${f}`, '--frame=45']); });
      const out = sheet('captions', { kind: 'grid', title: 'Choose the captions', subtitle: 'Timed to your real narration. Animated: open the .mp4 files.', items: presets.map((x, i) => ({ n: i + 1, name: x, line: { 'word-pop': 'bold, 1-3 words, accent word', 'one-word': 'one huge word at a time', boxed: 'white box, calm', phrase: 'serif phrases fade in', typewriter: 'types letter by letter', karaoke: 'words light up as spoken', headline: 'top-left editorial', dialogue: 'speaker tag, story' }[x], imgs: [pub(path.join(OUT, `captions-${i + 1}.png`))] })), cols: 4 });
      console.log(`${out}\nvideos: ${presets.map((x, i) => `${i + 1}=captions-${i + 1}.mp4 (${x})`).join(' ')}`);
    } else {
      const combos = []; for (const hi of ['color', 'underline', 'box']) for (const pos of ['bottom', 'middle', 'top']) combos.push({ pos, hi });
      const Y = { bottom: 1440, middle: 860, top: 230 }, picked = combos.filter((c, i) => i % 1 === 0).slice(0, 9);
      picked.forEach((c, i) => { const f = props(`lay-${i + 1}`, { bg, timeline: tls[cur === 'headline' || cur === 'dialogue' ? 'word-pop' : cur], preset: cur === 'headline' || cur === 'dialogue' ? 'word-pop' : cur, label: `${i + 1}  ${c.pos} / ${c.hi}`, y: Y[c.pos], hi: c.hi, dur: 3 }); rem(['still', 'src/index.ts', 'CaptionDemo', path.join(OUT, `layout-${i + 1}.png`), `--props=${f}`, '--frame=50']); });
      const out = sheet('layout', { kind: 'grid', title: 'Caption placement and highlight', subtitle: 'Safe zones respected: top 180, bottom 1380 for content, right 120.', items: picked.map((c, i) => ({ n: i + 1, name: `${c.pos} / ${c.hi}`, line: c.hi === 'color' ? 'accent colour' : c.hi === 'underline' ? 'underline on the key word' : 'box behind the key word', imgs: [pub(path.join(OUT, `layout-${i + 1}.png`))] })), cols: 3 });
      console.log(`${out}\nchoices: ${picked.map((c, i) => `${i + 1}=${c.pos}/${c.hi}`).join(' ')}`);
    }
  }
} else { console.error('kind must be styles|typography|captions|layout'); process.exit(2); }
