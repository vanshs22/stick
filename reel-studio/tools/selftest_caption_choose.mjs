#!/usr/bin/env node
// Caption keyword scorer and chooser: accents on the right words, style decides preset, a repeated look is refused, --write is idempotent.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { autoCaption, scoreWords } from './lib/keywords.mjs';
import { choose } from './caption_choose.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), bad = [], must = (n, ok, why) => { if (!ok) bad.push(`${n}: ${why}`); };
const ac = autoCaption('It cuts your costs by 90 percent, for absolutely free.', { maxWords: 3 });
must('number accented', /\*90/.test(ac), ac); must('absolute accented', /\*(absolutely|free)/.test(ac), ac);
must('stop words never', !/\*(the|and|it|for)\b/i.test(autoCaption('The cat and the dog went to the park.')), 'stop word accented');
must('one accent per chunk', autoCaption('Never install 5 free plugins today now', { maxWords: 4 }).split('|').every((c) => (c.match(/\*/g) || []).length <= 1), 'two accents in a chunk');
must('negation scores', scoreWords('Do not click').find((x) => x.w === 'not').score >= 3, 'no negation score');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capch-')), mk = (name, pack, lines) => { const P = path.join(root, name); fs.mkdirSync(path.join(P, 'script'), { recursive: true }); fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify({ style_pack: pack })); fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ lines })); return P; };
const L = [{ id: 'L01', text: 'Wait, what did you just say?', speaker: 'a', emotion: 'shock' }, { id: 'L02', text: 'I said no more free dinners.', speaker: 'b', emotion: 'sarcastic' }];
const p1 = mk('p1', 'sketchy-stickman', L), p2 = mk('p2', 'sketchy-stickman', L), p3 = mk('p3', 'doodle-explainer', [{ id: 'L01', text: 'Install these five free plugins and comment kit.', emotion: 'excited' }]);
const c1 = choose(p1); must('flat stickman gets a heavy-stroke look', c1.preset === 'stroke-word', c1.preset);
execFileSync('node', [path.join(TK, 'tools/caption_choose.mjs'), p1, '--write'], { stdio: 'pipe' });
const sc = JSON.parse(fs.readFileSync(path.join(p1, 'script/script.json'), 'utf8')); must('caption strings written', sc.lines.every((l) => l.caption && /\|?/.test(l.caption)), 'missing caption');
must('typography file written', JSON.parse(fs.readFileSync(path.join(p1, 'typography/captions.json'), 'utf8')).preset === 'stroke-word', 'typography/captions.json');
const c2 = choose(p2); must('second project must differ (accent or preset)', c2.accent !== c1.accent || c2.preset !== c1.preset, 'same look twice'); must('lists what it differs from', c2.differs_from.includes('p1'), 'no differs_from');
const c3 = choose(p3); must('split-host tutorial avoids the stickman look', c3.preset !== 'stroke-word', c3.preset);
console.log(bad.length ? 'FAIL\n- ' + bad.join('\n- ') : `caption chooser ok: keywords, style ranking, duplicate refusal (${c1.preset}/${c1.accent} then ${c2.preset}/${c2.accent}), ${c3.preset} for split-host`);
process.exit(bad.length ? 1 : 0);
