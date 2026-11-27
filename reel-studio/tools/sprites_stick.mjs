#!/usr/bin/env node
// Bakes transparent PNG sprites of the original cartoon stickmen: remotion-template/public/sprites/<char>/<pose>_<mood>_<closed|open>.png (512x1024, feet at the bottom) + manifest.json.
//   node tools/sprites_stick.mjs [--only otto] [--poses idle,point] [--moods neutral,shock]
// Needs Chromium (pre-installed with playwright). One page, one screenshot per sprite; about 3 minutes for everything.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { TK } from './lib/pipeline.mjs';
import { POSES, MOODS, stickSVG } from './lib/stickman_svg.mjs';

const require = createRequire(import.meta.url), { chromium } = require('playwright');
export const CHARS = {
  otto: { shirt: '#2F7D5B', hat: 'straw', hatColor: '#E3C06A', apron: '#8A5A3A' },
  mabel: { shirt: '#C9556B', hat: 'sun', hatColor: '#F2E3B0', scarf: '#F2C14E' },
  rex: { shirt: '#3C5FA8', hat: 'cap', hatColor: '#D8342B' },
};
const a = process.argv.slice(2), opt = (k) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1].split(',') : null);
const only = opt('only') || Object.keys(CHARS), poses = opt('poses') || POSES, moods = opt('moods') || MOODS, out = path.join(TK, 'remotion-template/public/sprites');
const br = await chromium.launch(), page = await br.newPage({ viewport: { width: 512, height: 1084 }, deviceScaleFactor: 1 }); let n = 0;
for (const c of only) { fs.mkdirSync(path.join(out, c), { recursive: true });
  for (const pose of poses) for (const mood of moods) for (const mouth of ['closed', 'open']) {
    await page.setContent(`<html><body style="margin:0;background:transparent">${stickSVG({ pose, mood, mouth, look: CHARS[c] })}</body></html>`);
    await page.screenshot({ path: path.join(out, c, `${pose}_${mood}_${mouth}.png`), omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 1084 } }); n++;
  } }
await br.close(); fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ chars: Object.keys(CHARS), poses: POSES, moods: MOODS, size: [512, 1084], feet_y: 1050 }, null, 1));
console.log(`baked ${n} sprites into ${path.relative(TK, out)}`);
