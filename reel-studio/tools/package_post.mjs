#!/usr/bin/env node
// Everything you need to post the finished video, drafted from the project: cover frame, post caption, alt text, sources and a production report.
//   node tools/package_post.mjs <project> [--video renders/<name>.mp4] [--cover-at 1.0] [--tags a,b,c]
// Writes renders/cover.jpg, renders/post.md, renders/report.md. The text is a DRAFT built from the script: read it and edit it (the first caption line is the hook).
import fs from 'node:fs';
import path from 'node:path';
import { run, rd } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
if (!a[0] || !fs.existsSync(path.join(P, 'script/script.json'))) { console.error('usage: package_post.mjs <project> [--video file.mp4] [--cover-at 1.0]'); process.exit(2); }
const tryRd = (f) => { try { return rd(path.join(P, f)); } catch { return null; } };
const script = rd(path.join(P, 'script/script.json')), brief = tryRd('brief.json') || {}, research = tryRd('research/research.json'), sb = tryRd('storyboard/storyboard.json'), tl = tryRd('data/timeline.json'), st = tryRd('state.json');
const rdir = path.join(P, 'renders'), mp4 = opt('video') ? path.resolve(P, opt('video')) : (fs.existsSync(rdir) ? fs.readdirSync(rdir).filter((f) => /\.mp4$/.test(f) && !/raw|segments/.test(f)).map((f) => path.join(rdir, f)).sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs)[0] : null);
if (!mp4) { console.error('no finished video in renders/: run tools/build_video.mjs first'); process.exit(1); }
const L = script.lines, hook = L[0].text, cta = L.find((l) => l.beat === 'cta')?.text, body = L.filter((l) => !['hook', 'cta', 'save'].includes(l.beat)).slice(0, 5);

// cover: the sharpest-looking early frame (try a few moments, keep the one with the most detail); the hook text is already on it
// candidate moments: when the first caption chunks are fully spoken (no half-written caption on the cover), else fixed times
const chunkEnds = (tl?.captions?.chunks || []).slice(0, 3).map((c) => +(c.t0 + 0.85 * (c.t1 - c.t0)).toFixed(2)), times = (a.includes('--cover-at') ? [+opt('cover-at', 1.0)] : [...chunkEnds, 1.0, 1.6]).filter((t) => !tl || t < tl.duration), covers = [];
for (const [i, t] of times.entries()) { const f = path.join(rdir, `.cover${i}.jpg`); if (run('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', mp4, '-frames:v', '1', '-q:v', '2', f]).status === 0 && fs.existsSync(f)) covers.push({ t, f, size: fs.statSync(f).size }); }
covers.sort((x, y) => y.size - x.size); if (covers[0]) fs.copyFileSync(covers[0].f, path.join(rdir, 'cover.jpg')); for (const c of covers) fs.rmSync(c.f, { force: true });

const stop = new Set('the a an and or of to in on for with this that your you is are it as at by from be was were have has not but so how why what makes make feel feels really just like more most very into over than then there their they them nobody works using used keeps keep gets get does about'.split(' '));
const tags = opt('tags', '') ? opt('tags', '').split(',').map((w) => '#' + w.trim().replace(/^#/, '')).filter((w) => w.length > 1) : [...new Set(`${brief.topic || ''} ${brief.title || ''} ${script.title || ''}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !stop.has(w)))].slice(0, 4).map((w) => '#' + w);
const post = `${hook}\n\n${body.map((l) => `- ${l.text}`).join('\n')}\n\n${cta || (brief.cta?.text ? brief.cta.text + '.' : 'Save this for later.')}\n\n${[...tags, '#shorts'].slice(0, 5).join(' ')}\n\n(Draft: the hashtags are guessed from the title, so replace them (or run again with --tags a,b,c) and edit the wording. ${brief.voice?.engine ? 'The voice is AI-generated: switch on the platform\'s AI label.' : ''})\n`;
const alt = (sb?.shots || []).map((s) => `- ${s.id}: ${String(s.alt || s.visual_intent || '').replace(/^DRAFT:\s*/, '').replace(/\s*\((hook|stakes|setup|step|mechanism|proof|objection|twist|cta|save)\)\s*$/, '')}`).join('\n');
fs.writeFileSync(path.join(rdir, 'post.md'), `# Post draft\n\n## Caption\n${post}\n## Alt text (one line per shot; put a clean description in the shot field alt)\n${alt}\n\n## Cover\nrenders/cover.jpg (frame at ${covers[0]?.t ?? '?'} s)\n`);

const crit = ['research', 'script', 'storyboard', 'captions', 'voice', 'music', 'sfx', 'frames', 'video', 'final'].map((n) => { const r = tryRd(`review/critics/${n}.json`); return r ? `| ${n} | ${r.verdict} | ${r.score} | ${r.findings.filter((f) => f.severity !== 'minor').length} | ${r.assessment || 'automatic'} |` : null; }).filter(Boolean);
const gates = st ? Object.entries(st.stages).filter(([, v]) => v.status === 'approved').map(([k, v]) => `- ${k}: ${v.by === 'user-delegation' ? 'DELEGATED by the user' : 'approved by the user'}${v.quote ? ` ("${String(v.quote).slice(0, 60)}")` : ''}`).join('\n') : '(no state)';
fs.writeFileSync(path.join(rdir, 'report.md'), `# Production report: ${brief.title || script.title}\n\n- video: ${path.basename(mp4)}${tl ? `, ${tl.duration.toFixed(1)} s, ${tl.width}x${tl.height}` : ''}\n- style: ${brief.style_pack}\n- mode: ${st?.mode || 'n/a'}${st?.mode === 'test' ? ' (TEST: not user-approved)' : ''}\n\n## Sources\n${(research?.sources || []).map((s) => `- ${s.id}: ${s.title} <${s.url}> (${s.type || 'source'}, ${s.captured_at})`).join('\n') || '(none)'}\n\n## Approvals\n${gates}\n\n## Critics\n| critic | verdict | score | blockers+majors | how |\n|---|---|---|---|---|\n${crit.join('\n')}\n\nAutomatic critics measure; they do not hear or judge taste. Vision critics run only when the agent opened the images.\n`);
console.log(`cover: renders/cover.jpg (frame at ${covers[0]?.t} s)\npost : renders/post.md (draft caption, ${tags.length + 1} hashtags to review, alt text)\nreport: renders/report.md\nnext: read post.md and edit the caption; show the user the cover and the report.`);
