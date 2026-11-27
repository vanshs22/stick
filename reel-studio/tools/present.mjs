#!/usr/bin/env node
// Show the work IN THE CHAT. Prints compact markdown (tables, quotes) the agent pastes into its reply, and writes ONE image per gate that the agent opens with its image viewer so the user sees it in the conversation.
//   node tools/present.mjs <project> direction     the brief, the style (and its pictures), the topic and the research claims with sources
//   node tools/present.mjs <project> script        the lines (beat, text, emotion, emoji) + the viral plan in one table
//   node tools/present.mjs <project> storyboard    every shot: component, approach, the word each overlay lands on + the contact sheet image
//   node tools/present.mjs <project> captions      the preset, a sample of real chunks (with emoji), font and size
//   node tools/present.mjs <project> sound         voice and emotions, music genre and tempo, sound effects per shot
//   node tools/present.mjs <project> final         the film's numbers, every critic verdict, the files; the contact sheet
//   node tools/present.mjs <project> blueprint     storyboard + captions + sound in one message (the single approval before the build)
// The agent's job: paste the markdown, open the image(s) listed under "IMAGES", ask ONE question, STOP. (A host that cannot show images says so; the tables still carry the substance.)
import fs from 'node:fs';
import path from 'node:path';
import { PY, TK, finalVideo, rd, run } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || '.'), what = a[1], tryRd = (f) => { try { return rd(path.join(P, f)); } catch { return null; } }, md = [], images = [];
if (!what || !['direction', 'script', 'storyboard', 'captions', 'sound', 'final', 'blueprint'].includes(what) || !fs.existsSync(path.join(P, 'brief.json'))) { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(2); }
const cell = (s, n = 70) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, n), brief = tryRd('brief.json') || {}, sc = tryRd('script/script.json'), sb = tryRd('storyboard/storyboard.json'), tl = tryRd('data/timeline.json'), plan = tryRd('audio/audio-plan.json'), has = (f) => fs.existsSync(path.join(P, f));
const img = (f) => { if (has(f)) images.push(f); };

function direction() {
  const rs = tryRd('research/research.json'), tp = tryRd('topic/topic.json'), st = tryRd('style-selection.json'); md.push(`### Direction: ${brief.title || brief.topic}`, '', `- **Platform / frame:** ${brief.platform}, ${brief.aspect || '9:16'}, about ${brief.duration_sec}s, language ${brief.language}`, `- **Audience and goal:** ${cell(brief.audience, 100)} / ${cell(brief.goal, 100)}`, `- **Style:** \`${brief.style_pack}\`${st?.look ? ' (look ' + st.look + ')' : ''}`, `- **Voice:** ${brief.voice?.engine || 'kokoro'} ${brief.voice?.voice || ''}; **music:** ${brief.music?.direction || ''}; **captions:** ${brief.captions?.preset || ''}`, `- **Topic:** ${cell(tp?.chosen?.title || tp?.chosen || brief.topic, 100)}`);
  if (rs) md.push('', `**Research angle:** ${rs.angle}`, '', '| claim | status | sources |', '|---|---|---|', ...rs.claims.map((c) => `| ${cell(c.text, 90)} | ${c.status} | ${(c.source_ids || []).join(', ')} |`), '', ...rs.sources.map((s) => `- ${s.id}: [${cell(s.title, 60)}](${s.url})`));
  for (const f of fs.existsSync(path.join(P, 'review')) ? fs.readdirSync(path.join(P, 'review')).filter((x) => /^(styles?|choices).*\.jpe?g$/.test(x)) : []) img('review/' + f); if (has('style-studio')) for (const d of fs.readdirSync(path.join(P, 'style-studio'))) img(`style-studio/${d}/choices.jpg`);
}
function script() {
  if (!sc) return md.push('_no script yet_'); const vp = tryRd('script/viral-plan.json'), dur = sc.est_seconds || brief.duration_sec;
  md.push(`### Script: ${sc.title || brief.title} (${dur}s, ${brief.aspect || '9:16'}, ${brief.platform})`, '', '| # | beat | line | emotion | emoji |', '|---|---|---|---|---|', ...sc.lines.map((l, i) => `| ${l.id} | ${l.beat} | ${cell(l.text, 110)} | ${l.emotion || ''}${l.speaker ? ' (' + l.speaker + ')' : ''} | ${Object.values(l.emoji || {}).join(' ')} |`));
  if (vp) md.push('', `**Promise:** ${vp.promise}`, `**Hook:** "${vp.hook?.options?.[vp.hook.chosen]?.line}"  ·  **Loop:** ${cell(vp.loop, 90)}  ·  **CTA:** ${cell(vp.cta?.text || vp.cta, 70)}`);
  const cr = (n) => tryRd(`review/critics/${n}.json`); md.push('', `Critics: script ${cr('script')?.verdict || '-'} (${cr('script')?.score ?? ''}), viral ${cr('viral')?.verdict || '-'} (${cr('viral')?.score ?? ''}), research ${cr('research')?.verdict || '-'}.`);
}
function storyboard() {
  if (!sb) return md.push('_no storyboard yet_'); md.push(`### Storyboard: ${sb.shots.length} shots, style \`${sb.style_pack}\``, '', '| shot | picture | what it adds | lands on | sound |', '|---|---|---|---|---|');
  for (const s of sb.shots) md.push(`| ${s.id} | ${s.component} (${s.approach}) | ${cell(s.visual_intent, 70)} | ${cell((s.overlays || []).map((o) => `${o.type}@${o.anchor || o.at}`).join(', ') || (s.anchors || []).map((x) => x.word).slice(0, 3).join(', '), 60)} | ${cell((s.sfx || []).map((x) => x.type).join(', '), 24)} |`);
  const cr = tryRd('review/critics/storyboard.json'), vi = tryRd('review/critics/visual.json'); md.push('', `Critics: storyboard ${cr?.verdict || '-'} (${cr?.score ?? ''}), visual concept ${vi?.verdict || '-'}.`);
  img('review/storyboard.jpg'); img('review/storyboard-contact.jpg'); if (!images.length && has('review/storyboard')) fs.readdirSync(path.join(P, 'review/storyboard')).filter((x) => /\.png$/.test(x)).slice(0, 12).forEach((x) => img('review/storyboard/' + x)); for (const f of fs.existsSync(path.join(P, 'review/storyboard-sheets')) ? fs.readdirSync(path.join(P, 'review/storyboard-sheets')).sort() : []) img('review/storyboard-sheets/' + f); img('review/assets-sheet.jpg');
}
function captions() {
  const c = tryRd('typography/captions.json') || {}, ty = tryRd('typography/typography.json') || {}, ch = tl?.captions?.chunks || []; md.push(`### Captions: \`${c.preset || tl?.captions?.preset || 'word-pop'}\`, ${ty.caption?.font || ty.headline?.font || 'pack font'} ${ty.caption?.weight || ''}, position ${c.position?.anchor || 'bottom'}`, '');
  md.push('First chunks as the viewer reads them (accent word in **bold**, emoji right after its word):', '', ...ch.slice(0, 8).map((k) => `- ${k.t0.toFixed(1)}s  ${k.words.map((w) => (w.hi ? `**${w.w}**` : w.w) + (w.e ? ' ' + w.e : '')).join(' ')}`));
  for (const f of ['review/typography', 'review/captions']) if (has(f)) fs.readdirSync(path.join(P, f)).filter((x) => /\.(jpe?g|png)$/.test(x)).slice(0, 3).forEach((x) => img(`${f}/${x}`));
}
function sound() {
  const v = plan?.voice || {}, m = plan?.music || {}, cues = tryRd('data/cues.json')?.cues || []; md.push(`### Sound: mode \`${plan?.mode || 'narrated_music'}\``, '', `- **Voice:** ${v.engine || 'kokoro'} / ${v.voice || ''} x${v.speed || 1}${sc?.cast ? ' · cast: ' + Object.entries(sc.cast).map(([n, c]) => `${n} (${c.gender || ''}, ${c.tone || ''})`).join(', ') : ''}`);
  const em = {}; (sc?.lines || []).forEach((l) => { if (l.emotion) em[l.emotion] = (em[l.emotion] || 0) + 1; }); md.push(`- **Emotions used:** ${Object.entries(em).map(([k, n]) => `${k} x${n}`).join(', ') || 'none set'}`);
  md.push(`- **Music:** ${m.bed || m.direction || 'bed'}${m.gain_db ? ' (' + m.gain_db + ' dB)' : ''}${/genre:/.test(m.bed || '') ? ' (built for this film: ' + m.bed.replace('genre:', '') + ')' : ''}`, `- **Sound effects:** ${cues.length} cues, each tied to an event: ${[...new Set(cues.map((c) => c.type))].join(', ') || 'none yet'}`);
  for (const f of ['review/audio/voice-preview.wav', 'audio/previews']) if (has(f)) md.push(`- Listen: \`${f}\``); }
function final() {
  const v = finalVideo(P), q = v ? tryRd(v.replace(/\.mp4$/, '.qa.json')) : null; md.push(`### Final: ${v || 'no film yet'}`, '');
  if (q) md.push(`QA **${q.pass ? 'pass' : 'FAIL'}**${q.preview ? ' (preview resolution)' : ''}: ${['duration', 'loudness_after', 'width', 'height'].filter((k) => q[k] != null).map((k) => `${k} ${q[k]}`).join(', ')}`, '');
  const dir = path.join(P, 'review/critics'); const rows = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => rd(path.join(dir, f))) : []; md.push('| critic | verdict | score | open findings |', '|---|---|---|---|', ...rows.map((r) => `| ${r.critic} | ${r.verdict} | ${r.score} | ${r.findings.length} |`));
  const open = rows.flatMap((r) => r.findings.filter((f) => f.severity !== 'minor').map((f) => `- [${r.critic}] ${f.shot_id || ''} ${cell(f.problem, 100)}`)); if (open.length) md.push('', '**Open major findings:**', ...open); md.push('', `Files: ${['renders/youtube/thumbnail.jpg', 'renders/youtube/chapters.txt', 'renders/youtube/captions.en.srt', 'renders/post.md', 'renders/cover.jpg'].filter(has).join(', ')}`);
  for (const c of ['review/final.jpg', 'review/render-analysis/contact_sheet.jpg', 'review/contact-sheet.jpg']) img(c); img('renders/youtube/thumbnail.jpg'); img('renders/cover.jpg'); if (has('review/final/contact-sheet.jpg')) img('review/final/contact-sheet.jpg');
}
({ direction, script, storyboard, captions, sound, final, blueprint: () => { storyboard(); md.push(''); captions(); md.push(''); sound(); } })[what]();
const uniq = [...new Set(images)];
console.log(md.join('\n')); if (uniq.length) console.log('\nIMAGES (open each with your image viewer so the user sees them in the chat):\n' + uniq.map((f) => `- ${path.join(P, f)}`).join('\n'));
console.log('\nNow ask ONE question and STOP. Approve with their own words: ' + (what === 'blueprint' ? '`state.mjs bundle <P> approve --quote "..." [--all-frames]`' : what === 'final' ? '`state.mjs approve <P> final --quote "..."`' : '`state.mjs approve <P> <gate> --quote "..."`'));
