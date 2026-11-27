#!/usr/bin/env node
// A capture records where its highlight landed (assets/<id>/capture.json "highlights", fractions of the picture). Captures made for another layout (16:9 uses a wider page) put the same
// element somewhere else, so the storyboard's circle must follow the capture: this copies the recorded box into every shot that shows that capture (not highlight_manual shots).
//   node tools/sync_highlights.mjs <projectDir>
import fs from 'node:fs';
import path from 'node:path';
const P = path.resolve(process.argv[2] || ''), f = path.join(P, 'storyboard/storyboard.json');
if (!fs.existsSync(f)) { console.error('usage: sync_highlights.mjs <projectDir>'); process.exit(2); }
const sb = JSON.parse(fs.readFileSync(f, 'utf8')); let n = 0;
for (const s of sb.shots) { const img = s.props?.image; if (!img || !s.props.highlight || s.props.highlight_manual) continue;
  let cj; try { cj = JSON.parse(fs.readFileSync(path.join(P, path.dirname(img), 'capture.json'), 'utf8')); } catch { continue; }
  const rec = Object.values(cj.highlights || {}); if (!rec.length) continue;
  const h = s.props.highlight, best = rec.map((r) => ({ r, d: Math.abs(r.x + r.w / 2 - (h.x + h.w / 2)) + Math.abs(r.y + r.h / 2 - (h.y + h.h / 2)) })).sort((a, b) => a.d - b.d)[0].r;   // the record nearest to the current circle
  const nh = { x: +best.x.toFixed(4), y: +best.y.toFixed(4), w: +best.w.toFixed(4), h: +best.h.toFixed(4) };
  if (['x', 'y', 'w', 'h'].some((k) => Math.abs(nh[k] - h[k]) > 0.005)) { s.props.highlight = nh; n++; console.log(`${s.id}: highlight -> ${JSON.stringify(nh)}`); } }
if (n) fs.writeFileSync(f, JSON.stringify(sb, null, 2)); console.log(n ? `${n} highlight(s) follow their capture` : 'highlights already match their captures');
