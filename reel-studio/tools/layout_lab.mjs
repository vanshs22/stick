#!/usr/bin/env node
// Layout lab: every card, overlay and caption preset of a style, in either frame shape, MEASURED and drawn, with no voice and no approval gates.
//   node tools/layout_lab.mjs [--style editorial-notebook|all] [--aspect 16:9|9:16|both] [--captions word-pop] [--fixture layout-gallery|<example>] [--out <dir>] [--scale 0.5] [--shots S01,S02] [--at 0.8] [--no-critic] [--overrides <style-overrides.json>]
// What it does, per (style x aspect): throwaway project from the fixture -> estimated timing -> Remotion stills of every shot -> layout probe (real DOM boxes) -> the layout critic -> a contact sheet.
// Exit code 1 when the critic finds a major or blocker. Use it after ANY change to a card, an overlay, a caption preset, a safe zone or a style pack.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK, PY, syncProject, timing } from './lib/pipeline.mjs';

const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : d; };
const fixture = opt('fixture', 'layout-gallery'), asp = opt('aspect', 'both'), cap = opt('captions', 'word-pop'), scale = opt('scale', '0.5'), only = opt('shots', ''), at = opt('at', '0.8');
const out = path.resolve(opt('out', path.join(process.cwd(), 'review-layout-lab')));
const packs = opt('style', 'editorial-notebook') === 'all' ? fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => !d.startsWith('_') && fs.existsSync(path.join(TK, 'style-packs', d, 'style.json'))) : opt('style', 'editorial-notebook').split(',');
const fx = fs.existsSync(path.join(TK, 'examples', fixture)) ? path.join(TK, 'examples', fixture) : path.resolve(fixture);
if (!fs.existsSync(path.join(fx, 'storyboard.json'))) { console.error(`no fixture "${fixture}" (expected examples/<name>/storyboard.json)`); process.exit(2); }
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)); };

/** two synthetic "pages" (wide and tall) so picture cards have something to show. They are drawings made here, never presented as captures. */
function synthAssets(P) {
  const d = path.join(P, 'assets/gallery'); fs.mkdirSync(d, { recursive: true });
  const py = `import sys
from PIL import Image, ImageDraw
def page(path,w,h):
    im=Image.new('RGB',(w,h),(246,244,239)); d=ImageDraw.Draw(im)
    d.rectangle([0,0,w,int(h*0.09)],fill=(30,30,40))
    d.rectangle([int(w*0.08),int(h*0.14),int(w*0.55),int(h*0.26)],fill=(255,214,102))
    for i in range(9):
        y=int(h*0.34)+i*int(h*0.062); d.rectangle([int(w*0.08),y,int(w*(0.92-0.07*(i%4))),y+int(h*0.028)],fill=(205,200,190))
    d.ellipse([int(w*0.62),int(h*0.16),int(w*0.9),int(h*0.16)+int(w*0.28)],fill=(120,160,230))
    im.save(path)
page(sys.argv[1]+'/page-wide.png',1600,900); page(sys.argv[1]+'/page-tall.png',900,1600)`;
  const r = spawnSync(PY, ['-c', py, d], { encoding: 'utf8' }); if (r.status) throw new Error(r.stderr);
}

const summary = [];
for (const pack of packs) for (const ar of asp === 'both' ? ['16:9', '9:16'] : [asp]) {
  const id = `${pack}-${ar.replace(':', 'x')}`, P = path.join(out, id); fs.rmSync(P, { recursive: true, force: true });
  const brief = { ...rd(path.join(fx, 'brief.json')), style_pack: pack, aspect: ar, platform: ar === '16:9' ? 'youtube' : 'instagram-reels', captions: { preset: cap } }, sb = rd(path.join(fx, 'storyboard.json'));
  wr(path.join(P, 'brief.json'), brief); wr(path.join(P, 'script/script.json'), rd(path.join(fx, 'script.json'))); wr(path.join(P, 'storyboard/storyboard.json'), { ...sb, style_pack: pack }); wr(path.join(P, 'audio/audio-plan.json'), rd(path.join(fx, 'audio-plan.json')));
  wr(path.join(P, 'typography/captions.json'), { preset: cap, position: { anchor: 'bottom', y: null }, scale: 1 }); fs.mkdirSync(path.join(P, 'data'), { recursive: true });
  if (fs.existsSync(path.join(fx, 'style-overrides.json'))) fs.copyFileSync(path.join(fx, 'style-overrides.json'), path.join(P, 'style-overrides.json'));
  if (opt('overrides')) fs.copyFileSync(path.resolve(opt('overrides')), path.join(P, 'style-overrides.json'));   // a look to try on this pack (style_studio.mjs uses this)
  synthAssets(P); syncProject(P); timing(P); spawnSync('node', [path.join(TK, 'tools/emoji.mjs'), 'ensure', P], { encoding: 'utf8' });   // pictures of any `prop` overlay
  console.log(`\n== ${id}: ${rd(path.join(P, 'data/timeline.json')).width}x${rd(path.join(P, 'data/timeline.json')).height}, captions ${cap}`);
  const env = { ...process.env };   // GL: whatever REMOTION_GL says (unset = Remotion's default; set swangle on a machine without a GPU)
  // one bundle for every shot: the probe renders the stills AND measures the boxes (review/layout/<shot>_<pct>.png + probe.json)
  const pr = spawnSync('node', ['--no-warnings', path.join(TK, 'tools/layout_probe.mjs'), P, '--at', at, '--scale', scale, ...(only ? ['--shots', only] : [])], { encoding: 'utf8', env, maxBuffer: 1 << 26, timeout: 3000000 }); if (pr.status) { console.error((pr.stdout + pr.stderr).slice(-800)); process.exit(1); }
  const tag = Math.round(+at * 100), sheetPy = `import sys,glob,os
from PIL import Image, ImageDraw
fs=sorted(glob.glob(sys.argv[1]+'/*_'+sys.argv[3]+'.png')); cols=int(sys.argv[4]); tw=int(sys.argv[5])
ims=[(os.path.basename(f).split('_')[0],Image.open(f).convert('RGB')) for f in fs]; th=round(tw*ims[0][1].height/ims[0][1].width); rows=-(-len(ims)//cols)
S=Image.new('RGB',(cols*tw,rows*(th+18)),(24,24,30)); d=ImageDraw.Draw(S)
for i,(n,im) in enumerate(ims):
    x,y=(i%cols)*tw,(i//cols)*(th+18); S.paste(im.resize((tw,th)),(x,y+18)); d.text((x+4,y+3),n,fill=(255,220,120))
S.save(sys.argv[2],quality=88)`;
  const sh = spawnSync(PY, ['-c', sheetPy, path.join(P, 'review/layout'), path.join(out, `${id}-sheet.jpg`), String(tag), '4', ar === '16:9' ? '640' : '320'], { encoding: 'utf8' }); if (sh.status) console.error(sh.stderr);
  if (!a.includes('--no-critic')) {
    const { run_ } = await import(new URL('./critics/layout.mjs', import.meta.url)); const rep = await run_(P); summary.push({ id, verdict: rep.verdict, score: rep.score, findings: rep.findings.length, major: rep.findings.filter((f) => f.severity !== 'minor').length });
  }
}
if (summary.length) { console.log('\n== lab summary'); for (const s of summary) console.log(`${s.verdict.padEnd(7)} ${String(s.score).padStart(3)}  ${s.id}  (${s.findings} findings, ${s.major} major+)`); wr(path.join(out, 'summary.json'), summary); }
console.log(`\nsheets and projects: ${out}`);
process.exit(summary.some((s) => s.major) ? 1 : 0);
