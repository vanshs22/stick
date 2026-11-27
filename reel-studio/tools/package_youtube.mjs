#!/usr/bin/env node
// YouTube long-form package for a finished 16:9 film: chapters, captions (SRT), a 1280x720 thumbnail, description, tags.
//   node tools/package_youtube.mjs <project> [--video renders/<name>.mp4] [--title "..."] [--thumb-at 1.0] [--thumb-text "THREE WORDS"] [--min-chapter 30]
// Writes <project>/renders/youtube/{youtube.json, chapters.txt, captions.en.srt, thumbnail.jpg, description.md}. A DRAFT built from script, timings and research: read it, edit it, then run `critique.mjs <project> youtube`.
// Chapters: a line with `"chapter": "Title"` in script.json starts one; otherwise a change of `beat` does, and chapters shorter than --min-chapter seconds merge into the previous one.
import fs from 'node:fs';
import path from 'node:path';
import { PY, TK, finalVideo, rd, run } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d), tryRd = (f) => { try { return rd(path.join(P, f)); } catch { return null; } };
if (!a[0] || !fs.existsSync(path.join(P, 'script/script.json'))) { console.error('usage: package_youtube.mjs <project> [--video file.mp4] [--title "..."] [--thumb-at 1.0] [--thumb-text "WORDS"] [--min-chapter 30]'); process.exit(2); }
const script = rd(path.join(P, 'script/script.json')), brief = tryRd('brief.json') || {}, lines = tryRd('data/lines.json'), words = tryRd('data/words.json'), research = tryRd('research/research.json');
if (!lines || !words) { console.error('no timing yet (data/lines.json, data/words.json): run tools/build_video.mjs first'); process.exit(1); }
const vid = opt('video') ? path.resolve(P, opt('video')) : finalVideo(P) && path.join(P, finalVideo(P)), out = path.join(P, 'renders/youtube'); fs.mkdirSync(out, { recursive: true });
const total = lines.duration || lines.lines.at(-1).end, ts = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, mm = String(m).padStart(h ? 2 : 1, '0'); return (h ? `${h}:` : '') + `${mm}:${String(x).padStart(2, '0')}`; };
const title = opt('title', brief.title || script.title || 'Untitled'), cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ---- chapters
const MIN = +opt('min-chapter', 30), beatName = { hook: 'Intro', setup: 'Setup', step: 'Steps', proof: 'Proof', cta: 'Wrap-up' };
let ch = [];
script.lines.forEach((l, i) => { const L = lines.lines[i]; if (!L) return; const t = l.chapter || null; if (t) ch.push({ t0: i === 0 ? 0 : L.start, title: t }); else if (!ch.length || (!script.lines.some((x) => x.chapter) && script.lines[i - 1].beat !== l.beat)) ch.push({ t0: i === 0 ? 0 : L.start, title: beatName[l.beat] ? `${beatName[l.beat]}: ${cap1(l.text.replace(/[.!?]+$/, '').split(/\s+/).slice(0, 5).join(' '))}` : cap1(l.text.split(/\s+/).slice(0, 6).join(' ')) }); });
ch[0].t0 = 0; for (let i = 1; i < ch.length;) { if (ch[i].t0 - ch[i - 1].t0 < MIN) ch.splice(i, 1); else i++; }   // YouTube needs 0:00 first and each chapter at least 10 s: we keep MIN seconds so a viewer can use them
if (ch.length > 1 && total - ch.at(-1).t0 < MIN) ch.pop();
const chaptersTxt = ch.map((c) => `${ts(c.t0)} ${c.title}`).join('\n'); fs.writeFileSync(path.join(out, 'chapters.txt'), chaptersTxt + '\n');

// ---- captions (SRT): sentences cut at punctuation or 84 characters (two 42-character lines), 1 to 6 seconds each
const cues = []; let cur = []; const flush = () => { if (!cur.length) return; cues.push({ s: cur[0].s, e: cur.at(-1).e, text: cur.map((w) => w.w).join(' ') }); cur = []; };
for (const w of words) { if (cur.length && (cur.map((x) => x.w).join(' ') + ' ' + w.w).length > 84 || cur.length && w.e - cur[0].s > 6) flush(); cur.push(w); if (/[.!?,;:]$/.test(w.w) && cur.length >= 4) flush(); } flush();
for (let i = 0; i < cues.length - 1; i++) cues[i].e = Math.min(cues[i].e + 0.15, cues[i + 1].s - 0.02);   // linger a little, never overlap
const two = (t) => { if (t.length <= 42) return t; const m = Math.floor(t.length / 2); let k = t.lastIndexOf(' ', m + 8); if (k < 12) k = t.indexOf(' ', m); return k > 0 ? t.slice(0, k) + '\n' + t.slice(k + 1) : t; };
const st = (s) => { const ms = Math.round(s * 1000), h = String(Math.floor(ms / 3600000)).padStart(2, '0'), m = String(Math.floor(ms / 60000) % 60).padStart(2, '0'), x = String(Math.floor(ms / 1000) % 60).padStart(2, '0'); return `${h}:${m}:${x},${String(ms % 1000).padStart(3, '0')}`; };
fs.writeFileSync(path.join(out, `captions.${brief.language || 'en'}.srt`), cues.map((c, i) => `${i + 1}\n${st(c.s)} --> ${st(c.e)}\n${two(c.text)}\n`).join('\n'));

// ---- thumbnail 1280x720 (a frame of the film + big readable words; YouTube shows it at about 168 px wide, so three or four words, high contrast)
const STOP = new Set('a an the of to in on for with from and or but is are was how why what this that your my our by at as'.split(' ')), cut = (t) => { const w = t.split(/\s+/).slice(0, 4); while (w.length > 1 && STOP.has(w.at(-1).toLowerCase())) w.pop(); return w.join(' '); };   // never end the thumbnail on "from" or "a"
const thumbText = opt('thumb-text', cut(title)).toUpperCase(), thumb = path.join(out, 'thumbnail.jpg');
if (vid && fs.existsSync(vid)) {
  const fr = path.join(out, '.frame.png'), r = run('ffmpeg', ['-y', '-v', 'error', '-ss', opt('thumb-at', '1.0'), '-i', vid, '-frames:v', '1', fr]);
  if (!r.status) {
    const py = `import sys
from PIL import Image, ImageDraw, ImageFont
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size; s=max(1280/w,720/h); im=im.resize((round(w*s),round(h*s))); l=(im.width-1280)//2; t=(im.height-720)//2; im=im.crop((l,t,l+1280,t+720))
ov=Image.new('RGBA',(1280,720),(0,0,0,0)); d=ImageDraw.Draw(ov)
for y in range(720):
    a=min(252,int(260*((y-300)/260))) if y>300 else 0; d.line([(0,y),(1280,y)],fill=(8,8,16,a))
im=Image.alpha_composite(im.convert('RGBA'),ov); d=ImageDraw.Draw(im)
f=sys.argv[4]; text=sys.argv[3]; size=150
while size>60:
    ft=ImageFont.truetype(f,size); parts=text.split(' '); lines=[];cur=''
    for p in parts:
        t=(cur+' '+p).strip()
        if d.textlength(t,font=ft)<=1130: cur=t
        else: lines.append(cur); cur=p
    lines.append(cur)
    if len(lines)<=2: break
    size-=10
y=700-(len(lines)*int(size*1.05))-20
for ln in lines:
    d.text((64,y),ln,font=ft,fill=(255,255,255),stroke_width=max(6,size//14),stroke_fill=(10,10,20)); y+=int(size*1.05)
im.convert('RGB').save(sys.argv[2],quality=90)`;
    const font = [path.join(TK, 'renderers/inkbeat/public/fonts/Poppins-ExtraBold.ttf')].find((f) => fs.existsSync(f)) || '';
    const p = run(PY, ['-c', py, fr, thumb, thumbText, font]); if (p.status) console.error('thumbnail text failed:', (p.stderr || '').slice(-300)); fs.rmSync(fr, { force: true });
  } else console.error('could not read a frame from the video:', (r.stderr || '').slice(-200));
} else console.error('no finished video found: the thumbnail is skipped (run build_video.mjs, then this again)');

// ---- description + metadata
const tags = [...new Set([...(brief.tags || []), ...String(brief.topic || title).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3)])].slice(0, 12);
const sources = (research?.sources || []).slice(0, 8).map((s) => `- ${s.title || s.id}: ${s.url}`).join('\n'), cta = script.lines.find((l) => l.beat === 'cta')?.text;
const desc = `${script.lines[0].text}\n\n${brief.goal ? cap1(brief.goal) + '.\n\n' : ''}CHAPTERS\n${chaptersTxt}\n\n${sources ? 'SOURCES\n' + sources + '\n\n' : ''}${cta ? cta + '\n\n' : ''}${tags.map((t) => '#' + t).slice(0, 3).join(' ')}\n`;
fs.writeFileSync(path.join(out, 'description.md'), desc);
fs.writeFileSync(path.join(out, 'youtube.json'), JSON.stringify({ title, title_length: title.length, chapters: ch, tags, thumbnail: fs.existsSync(thumb) ? 'thumbnail.jpg' : null, captions: `captions.${brief.language || 'en'}.srt`, description_length: desc.length, duration_sec: +total.toFixed(1), note: 'DRAFT: edit before upload. Nothing is uploaded by this tool.' }, null, 1));
console.log(`youtube package: ${out}\n  ${ch.length} chapters, ${cues.length} caption cues, thumbnail ${fs.existsSync(thumb) ? 'ok' : 'missing'}, description ${desc.length} chars, title ${title.length} chars`);
