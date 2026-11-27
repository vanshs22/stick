#!/usr/bin/env node
// Integration test for the HTML/GSAP and remocn adapters, through the REAL renderer (Chrome via Remotion), not mocks:
//   1. an HtmlBlock plays a paused GSAP timeline that the Remotion frame seeks: the same frame rendered twice is byte-identical, a later frame is different
//   2. a block that reads window.__hfVariables really receives the variables (the text on screen changes with them)
//   3. a REAL HyperFrames registry block (npx hyperframes add) renders (needs network; otherwise reported as NOT TESTED)
//   4. a REAL remocn component installs, registers and renders (needs network; otherwise NOT TESTED)
//   node tools/selftest_hyperframes.mjs [--block bar-chart-race] [--remocn <name>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TK, PY } from './lib/pipeline.mjs';

const a = process.argv.slice(2), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d), env = { ...process.env, REEL_TEST_MODE: '1', TTS_SCRIPT: 'data/tts.json' };
const node = (args, o = {}) => spawnSync('node', ['--no-warnings', ...args], { encoding: 'utf8', env, ...o });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-hf-')), W = { n: 0, fail: 0, skipped: [] };
const ok = (name, c, d = '') => { W.n++; if (!c) { W.fail++; console.error(`FAIL: ${name} ${d}`); } else console.log(`ok   ${name}`); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);

// a project with ONE shot whose component we swap
const r0 = node([path.join(TK, 'tools/run_example.mjs'), 'motion-graphics', 'hf', '--dir', tmp]); if (r0.status) { console.error(r0.stderr || r0.stdout); process.exit(1); }
const P = path.join(tmp, 'hf'), rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')), wr = (f, v) => fs.writeFileSync(path.join(P, f), JSON.stringify(v, null, 1));
const sc = rd('script/script.json'), sb = rd('storyboard/storyboard.json'); sb.shots = sb.shots.slice(0, 1); const keep = new Set(sb.shots[0].line_ids); sc.lines = sc.lines.filter((l) => keep.has(l.id)); wr('script/script.json', sc);
fs.mkdirSync(path.join(P, 'assets/hyperframes'), { recursive: true });
fs.writeFileSync(path.join(P, 'assets/hyperframes/probe.html'), `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#101820}#stage{position:relative;width:1080px;height:1920px;font-family:sans-serif;color:#fff}#t{position:absolute;left:80px;top:600px;font-size:120px;font-weight:900}#bar{position:absolute;left:80px;top:900px;height:60px;width:0;background:#FFB547}</style></head><body><div id="stage" data-composition-id="probe" data-width="1080" data-height="1920" data-duration="3"><div id="t">HELLO</div><div id="bar"></div></div>
<script>var V=window.__hfVariables||{};document.getElementById('t').textContent=V.word||'HELLO';</script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><script>const tl=gsap.timeline({paused:true});tl.to('#bar',{width:900,duration:2,ease:'none'},0);window.__timelines=window.__timelines||{};window.__timelines['probe']=tl;</script></body></html>`);
const setShot = (src, vars) => { const s = rd('storyboard/storyboard.json'); s.shots = [{ ...sb.shots[0], component: 'HtmlBlock', props: { src, vars: vars || {}, fit: 'cover' }, approach: 'motion-graphics', why_renderer: 'test block', anchors: [], overlays: [], sfx: [] }]; wr('storyboard/storyboard.json', s); };
const still = (at, tag) => { const r = node([path.join(TK, 'tools/preview_shots.mjs'), P, '--at', String(at)], { timeout: 600000 }); const f = path.join(P, 'review/storyboard/S01.png'), o = path.join(tmp, `${tag}.png`); if (!fs.existsSync(f)) throw new Error('no still: ' + (r.stdout + r.stderr).slice(-300)); fs.copyFileSync(f, o); return o; };
const prep = () => { node([path.join(TK, 'tools/audio/build_tts_input.mjs'), P]); spawnSync(PY, [path.join(TK, 'tools/audio/estimate.py'), '.'], { cwd: P, env, encoding: 'utf8' }); const r = node([path.join(TK, 'tools/timing/build_timeline.mjs'), P]); node(['-e', `import('${pathToFileURL(path.join(TK, 'tools/lib/pipeline.mjs')).href}').then(m=>m.syncProject(${JSON.stringify(P)}))`]); return r.status === 0; };

try {
  setShot('assets/hyperframes/probe.html', { word: 'GREETINGS' }); ok('project prepared (timeline + template sync)', prep());
  const a1 = still(0.25, 'a1'), a2 = still(0.25, 'a2'), b1 = still(0.85, 'b1');
  ok('same frame rendered twice is BYTE-IDENTICAL (deterministic: the Remotion frame is the only clock)', sha(a1) === sha(a2), `${sha(a1)} vs ${sha(a2)}`);
  ok('a later frame is different (the GSAP timeline really is seeked)', sha(a1) !== sha(b1));
  // the bar grows with time: measure it from the pixels
  const probe = spawnSync(PY, ['-c', `
from PIL import Image
import sys
def bar(f):
    im=Image.open(f).convert('RGB'); w,h=im.size; y=int(h*0.5)
    # find the amber bar's right edge on any row near the bar band
    best=0
    for yy in range(int(h*0.44),int(h*0.52),6):
        x=0
        for xx in range(0,w,4):
            r,g,b=im.getpixel((xx,yy))
            if r>230 and 150<g<210 and b<110: x=xx
        best=max(best,x)
    return best
print(bar('${a1}'),bar('${b1}'))`], { encoding: 'utf8' }).stdout.trim().split(' ').map(Number);
  ok('the animated bar is longer at 0.85 than at 0.25 of the shot', probe.length === 2 && probe[1] > probe[0] + 40, `edges ${probe}`);
  const txt = spawnSync(PY, ['-c', `
from PIL import Image
im=Image.open('${a1}').convert('RGB'); w,h=im.size
n=sum(1 for x in range(0,w,3) for y in range(int(h*0.28),int(h*0.38),3) if sum(im.getpixel((x,y)))>690)
print(n)`], { encoding: 'utf8' }).stdout.trim();
  ok('the block drew its headline in white (not blank, text visible)', +txt > 80, `white pixels ${txt}`);
  // variables: a different word changes the picture (the block reads window.__hfVariables)
  setShot('assets/hyperframes/probe.html', { word: 'GOODBYE' }); prep(); const c1 = still(0.25, 'c1');
  ok('window.__hfVariables reaches the block (changing the variable changes the frame)', sha(c1) !== sha(a1));

  // real HyperFrames block from the registry
  const blk = opt('block', 'bar-chart-race'), ad = node([path.join(TK, 'tools/hyperframes.mjs'), 'add', blk, '--project', P], { timeout: 200000 });
  if (ad.status) { W.skipped.push(`real HyperFrames block "${blk}" (could not install: ${(ad.stderr + ad.stdout).trim().split('\n').pop()})`); console.log(`SKIP real HyperFrames block: ${(ad.stderr + ad.stdout).trim().split('\n').pop().slice(0, 150)}`); }
  else {
    setShot(`assets/hyperframes/${blk}.html`, {}); ok('real block: prepared', prep());
    const d1 = still(0.2, 'd1'), d2 = still(0.2, 'd2'), e1 = still(0.8, 'e1');
    ok(`real block "${blk}": same frame twice is byte-identical`, sha(d1) === sha(d2), `${sha(d1)} vs ${sha(d2)}`); ok(`real block "${blk}": animation advances (frame at 0.8 differs)`, sha(d1) !== sha(e1));
    const u = spawnSync(PY, ['-c', `
from PIL import Image
im=Image.open('${d1}').convert('RGB'); px=im.getdata(); s=set(px[i] for i in range(0,len(px),997)); print(len(s))`], { encoding: 'utf8' }).stdout.trim();
    ok(`real block "${blk}" is not a blank frame`, +u > 30, `distinct colours ${u}`);
  }
  // real remocn component
  const rn = opt('remocn', ''), s1 = node([path.join(TK, 'tools/remocn.mjs'), 'search', 'typewriter', '--max', '1'], { timeout: 120000 });
  const name = rn || ((s1.stdout.match(/^\s*([a-z0-9][a-z0-9-]+)\s/m) || [])[1]);
  if (s1.status || !name) { W.skipped.push('real remocn component (search failed: offline?)'); console.log('SKIP remocn: search failed (offline?)'); }
  else {
    const add = node([path.join(TK, 'tools/remocn.mjs'), 'add', name, '--project', P, '--install-deps'], { timeout: 300000 });
    if (add.status) { W.skipped.push(`remocn "${name}" (add failed: ${(add.stderr + add.stdout).trim().split('\n').pop()})`); console.log('SKIP remocn add failed: ' + (add.stderr + add.stdout).trim().split('\n').pop().slice(0, 150)); }
    else {
      const s = rd('storyboard/storyboard.json'); s.shots[0] = { ...s.shots[0], component: 'RemocnBlock', props: { name, props: {} } }; wr('storyboard/storyboard.json', s);
      ok(`remocn "${name}": storyboard checker accepts it`, node([path.join(TK, 'tools/check_storyboard.mjs'), P]).status === 0);
      prep(); const f1 = still(0.4, 'f1'), f2 = still(0.4, 'f2'); ok(`remocn "${name}": same frame twice is byte-identical`, sha(f1) === sha(f2), `${sha(f1)} vs ${sha(f2)}`);
    }
  }
} catch (e) { ok('test run', false, e.message); }
fs.rmSync(tmp, { recursive: true, force: true });
console.log(W.skipped.length ? `\nNOT TESTED (reported, not faked): ${W.skipped.join('; ')}` : '');
if (W.fail) { console.error(`${W.fail} of ${W.n} checks FAILED`); process.exit(1); } console.log(`HYPERFRAMES / REMOCN ADAPTER SELFTEST PASSED: ${W.n} checks${W.skipped.length ? ` (${W.skipped.length} not tested)` : ''}`);
