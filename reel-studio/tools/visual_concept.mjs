#!/usr/bin/env node
// The visual concept: for each narration line, WHAT KIND of picture carries it and what that picture adds. A draft is generated from the script, the research
// and the captures; you must edit every entry (the critic refuses a DRAFT) before it goes to the user (gate: visual_concept).
//   node tools/visual_concept.mjs <project> [--force]
import fs from 'node:fs';
import path from 'node:path';
import { TK, rd } from './lib/pipeline.mjs';
const P = path.resolve(process.argv[2] || '.'), f = path.join(P, 'storyboard/visual-concept.json');
if (!fs.existsSync(path.join(P, 'script/script.json'))) { console.error('needs script/script.json'); process.exit(2); }
if (fs.existsSync(f) && !process.argv.includes('--force')) { console.error(`${f} exists (use --force to overwrite)`); process.exit(1); }
const brief = rd(path.join(P, 'brief.json')), script = rd(path.join(P, 'script/script.json')), pack = (() => { try { return rd(path.join(TK, 'style-packs', brief.style_pack, 'style.json')); } catch { return {}; } })(), three = pack.family === '3d';
const caps = (() => { try { return rd(path.join(P, 'assets/manifest.json')).assets.filter((x) => x.kind === 'real'); } catch { return []; } })();
let capLeft = caps.length;
const lines = script.lines.map((l, i) => {
  const num = /\d|\b(zero|one|two|three|four|five|ten|hundred|thousand|million|percent)\b/i.test(l.text), claim = (l.claims || []).length > 0, cmd = /`|\bnpx|\bnpm |\bgit |\bpip |\bpython|\bnode /.test(l.text);
  let approach, hint = l.visual_hint || '';
  if (claim && capLeft > 0 && /\b(says|docs?|documentation|official|according|page|repo|stars?)\b/i.test(l.text + hint)) { approach = 'evidence-card'; capLeft--; }
  else if (cmd) approach = 'designed-ui';
  else if (num && /\b(per|percent|times|faster|slower|more|less|minutes?|seconds?|users?|stars?|requests?)\b/i.test(l.text)) approach = 'data-viz';
  else if (i === 0) approach = three ? 'character-3d' : 'metaphor-env';
  else if (l.beat === 'cta' || l.beat === 'save') approach = 'motion-graphics';
  else if (l.beat === 'objection') approach = three ? 'character-3d' : 'designed-ui';
  else approach = three ? 'physical-3d' : 'designed-ui';
  return { line_id: l.id, line: l.text, approach, adds_information: `DRAFT: ${hint || 'say what the viewer sees here that the narration does not say'}`, evidence_source: (l.claims || [])[0] || null };
});
fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify({ status: 'DRAFT: edit every entry, then set "ready"', style_pack: brief.style_pack, approaches: 'screenshot | designed-ui | motion-graphics | character-3d | physical-3d | metaphor-env | data-viz | evidence-card | combo', lines }, null, 1));
console.log(`draft visual concept: ${lines.length} lines -> ${path.relative(P, f)}\n  ${lines.map((x) => `${x.line_id} ${x.approach}`).join(', ')}\nnext: edit each adds_information (what does the picture show that the words do not?), set status "ready", then node ${TK}/tools/critique.mjs ${P} visual`);
