#!/usr/bin/env node
// Character design sheets for the two stickman styles: every cast member in 8 poses/expressions on a light and a dark background.
//   node tools/character_sheet_stick.mjs [2|3] [out.jpg]      2 = canvas characters of the 3D-world style, 3 = SVG characters of the cinematic flat style
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { TK } from './lib/pipeline.mjs';

const require = createRequire(import.meta.url), { chromium } = require('playwright'), which = process.argv[2] || '2', out = process.argv[3] || path.join(TK, `docs/styles/CHARACTERS-STYLE${which}.jpg`);
const CASES = [['idle', 'neutral'], ['point', 'happy'], ['cheer', 'laugh'], ['shock', 'shock'], ['think', 'smug'], ['hammer', 'determined'], ['shrug', 'sad'], ['flail', 'scared']];
let html;
if (which === 'd3') {
  const m = await import(path.join(TK, 'tools/lib/stickman_svg.mjs')), ds = (await import(path.join(TK, 'remotion-template/src/three/cast_designs.js'))).DESIGNS; let g = '';
  ds.forEach((d, k) => { const x0 = (k % 5) * 460, y0 = Math.floor(k / 5) * 620; g += `<rect x="${x0}" y="${y0}" width="460" height="620" fill="${k % 2 ? '#161b28' : '#10131c'}"/>`;
    [['idle', 'neutral'], ['cheer', 'laugh']].forEach((q, i) => { g += `<g transform="translate(${x0 + i * 225 + 4} ${y0 + 100}) scale(0.4)">${m.stickG({ pose: q[0], mood: q[1], mouth: i ? 'open' : 'closed', look: { eyeStyle: 'ink', ...d.svg } })}</g>`; });
    g += `<text x="${x0 + 14}" y="${y0 + 50}" fill="#ffd400" font-size="46" font-weight="bold" font-family="sans-serif">${d.n}</text><text x="${x0 + 70}" y="${y0 + 46}" fill="#ddd" font-size="21" font-family="sans-serif">${d.name.split(',')[0]}</text>`; });
  html = `<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="2300" height="1240">${g}</svg></body></html>`;
} else if (which === 'd2') {
  const src = fs.readFileSync(path.join(TK, 'remotion-template/src/three/stickdraw.js'), 'utf8').replace(/export /g, ''), ds = fs.readFileSync(path.join(TK, 'remotion-template/src/three/cast_designs.js'), 'utf8').replace(/export /g, '');
  html = `<html><body style="margin:0;background:#9cc3e6"><canvas id=c width=2300 height=1240></canvas><script>${src}\n${ds}
const c=document.getElementById('c'),ctx=c.getContext('2d'),tmp=document.createElement('canvas');tmp.width=260;tmp.height=620;const tc=tmp.getContext('2d');
DESIGNS.forEach((d,k)=>{const x0=(k%5)*460,y0=Math.floor(k/5)*620;ctx.fillStyle=k%2?'#a9cdea':'#9cc3e6';ctx.fillRect(x0,y0,460,620);
[['idle','neutral',0.2],['cheer','laugh',0]].forEach((q,i)=>{tc.clearRect(0,0,260,620);drawStick(tc,260,620,{t:.4+i,pose:POSES[q[0]],expr:EXPR[q[1]],turn:q[2],look:d.canvas,seed:d.n+i,gaze:[.3,0]});ctx.drawImage(tmp,x0+i*215,y0+40,240,573);});
ctx.fillStyle='#111';ctx.font='bold 46px sans-serif';ctx.fillText(d.n,x0+14,y0+50);ctx.font='22px sans-serif';ctx.fillText(d.name,x0+14,y0+82);});
</script></body></html>`;
} else if (which === '2') {
  const src = fs.readFileSync(path.join(TK, 'remotion-template/src/three/stickdraw.js'), 'utf8').replace(/export /g, ''), sp = fs.readFileSync(path.join(TK, 'remotion-template/src/three/sprite.js'), 'utf8'), cos = sp.slice(sp.indexOf('export const COSTUMES') + 7, sp.indexOf('};', sp.indexOf('export const COSTUMES')) + 2);
  html = `<html><body style="margin:0"><canvas id=c width=1600 height=2880></canvas><script>${src}\n${cos}
const c=document.getElementById('c'),ctx=c.getContext('2d'),tmp=document.createElement('canvas');tmp.width=260;tmp.height=620;const tc=tmp.getContext('2d');
const cases=${JSON.stringify(CASES)};let row=0;
for(const bg of ['#9cc3e6','#1c2230']){for(const ch of Object.keys(COSTUMES)){ctx.fillStyle=bg;ctx.fillRect(0,row*480,1600,480);
cases.forEach((k,i)=>{tc.clearRect(0,0,260,620);drawStick(tc,260,620,{t:.3+i*.31,pose:POSES[k[0]],expr:EXPR[k[1]],turn:[0,.4,0,0,-.4,.3,0,0][i],look:COSTUMES[ch],seed:1+i,gaze:[.3,0]});ctx.drawImage(tmp,i*200,row*480,200,477);});row++;}}
</script></body></html>`;
} else {
  const m = await import(path.join(TK, 'tools/lib/stickman_svg.mjs')), looks = [
    { hat: 'capback', hatColor: '#D8342B', shirt: '#8D9199', pants: '#3b4150', eyeStyle: 'ink', rim: '#6f8cff', bodyW: 1.0, headS: 1.25 }, { hat: 'none', hair: 'short', hairColor: '#4a3020', glasses: true, top: 'hoodie', shirt: '#2c2f38', pants: '#222630', eyeStyle: 'ink', rim: '#6f8cff', bodyW: 1.15, headS: 1.2 },
    { hat: 'top', shirt: '#F5F0E6', pants: '#1b1b22', eyeStyle: 'ink', rim: '#ffe9a0', bodyW: 0.8, headS: 1.1 }, { hat: 'none', hair: 'mess', hairColor: '#b5532a', shirt: '#3c9a5a', pants: '#2d3a58', eyeStyle: 'ink', bodyW: 0.95, headS: 1.3 }];
  let g = ''; let row = 0;
  for (const bg of ['#8fb0d6', '#10131c']) for (const lk of looks) { g += `<rect y="${row * 320}" width="2080" height="320" fill="${bg}"/>`; CASES.forEach((k, i) => { g += `<g transform="translate(${i * 260 + 54} ${row * 320 + 40}) scale(0.27)">${m.stickG({ pose: k[0], mood: k[1] === 'happy' ? 'grimace' : k[1] === 'sad' ? 'worried' : k[1], mouth: i % 2 ? 'open' : 'closed', look: lk })}</g>`; }); row++; }
  html = `<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="2080" height="2560" viewBox="0 0 2080 2560">${g}</svg></body></html>`;
}
const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: (which === 'd2' || which === 'd3') ? 2300 : which === '2' ? 1600 : 2080, height: (which === 'd2' || which === 'd3') ? 1240 : which === '2' ? 2880 : 2560 } }); pg.on('pageerror', (e) => console.error('page error:', e.message));
await pg.setContent(html); await pg.screenshot({ path: out, type: 'jpeg', quality: 88 }); await br.close(); console.log('wrote', out);
