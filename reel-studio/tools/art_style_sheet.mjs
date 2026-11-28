#!/usr/bin/env node
// Choice sheets of ten different ART STYLES for the stickman characters.   node tools/art_style_sheet.mjs <3d|flat> [out.jpg]
//   3d   = shown standing in front of our lit 3D world (style 2)      flat = shown on dark cinematic sets (style 3)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { TK } from './lib/pipeline.mjs';
import { ART, artSVG } from './lib/artstyles.mjs';

const require = createRequire(import.meta.url), { chromium } = require('playwright'), mode = process.argv[2] || 'flat', out = process.argv[3] || path.join(TK, `docs/styles/ARTSTYLES-${mode}.jpg`);
const bgFile = path.join(TK, mode === '3d' ? 'storyboard-tests/2-stickman-3d/shots/S02.png' : 'storyboard-tests/3-flat-stickman/shots/S03.png'), bg = fs.existsSync(bgFile) ? `data:image/png;base64,${fs.readFileSync(bgFile).toString('base64')}` : '';
const stage = (id) => `<defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a30"/><stop offset="1" stop-color="#06080f"/></linearGradient><linearGradient id="cone${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c0" stop-opacity="0.55"/><stop offset="1" stop-color="#fff3c0" stop-opacity="0.04"/></linearGradient></defs><rect width="460" height="640" fill="url(#bg${id})"/><polygon points="170,0 290,0 440,640 20,640" fill="url(#cone${id})"/><rect y="560" width="460" height="80" fill="#0b0f1a"/>`;
let g = '';
ART.forEach((a, k) => { const x0 = (k % 5) * 460, y0 = Math.floor(k / 5) * 640;
  g += `<g transform="translate(${x0} ${y0})"><clipPath id="c${k}"><rect width="460" height="640"/></clipPath><g clip-path="url(#c${k})">${mode === '3d' && bg ? `<image href="${bg}" x="-90" y="-40" width="640" height="1138" preserveAspectRatio="xMidYMid slice"/>` : stage(k)}
    ${['idle', 'cheer'].map((p, i) => `<g transform="translate(${i * 215 - 4} 100) scale(0.74)">${artSVG(a.id, p)}</g>`).join('')}</g>
    <rect width="460" height="62" fill="#000" opacity="0.62"/><text x="14" y="44" fill="#ffd400" font-size="44" font-weight="bold" font-family="sans-serif">${a.n}</text><text x="68" y="28" fill="#fff" font-size="21" font-weight="bold" font-family="sans-serif">${a.name}</text><text x="68" y="52" fill="#ccc" font-size="17" font-family="sans-serif">${a.who}</text></g>`; });
const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 2300, height: 1280 } }); pg.on('pageerror', (e) => console.error(e.message));
await pg.setContent(`<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="2300" height="1280">${g}</svg></body></html>`); await pg.screenshot({ path: out, type: 'jpeg', quality: 90 }); await br.close(); console.log('wrote', out);
