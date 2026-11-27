#!/usr/bin/env node
// The viral script editor: every video starts from a viral plan, then the script is written against it and scored against a rubric.
//   node tools/script_studio.mjs new   <P> [--format explainer|story|dialogue-comedy|listicle|tutorial|news] [--ref <refName>]   scaffold script/viral-plan.json (every field is TODO until you write it)
//   node tools/script_studio.mjs score <P>                                          the rubric (tools/critics/viral.mjs) with the concrete rewrite for every finding
//   node tools/script_studio.mjs hooks "<topic>"                                    the hook patterns with a fill-in line each, to write three options from
// Instructions for the writer: skills/viral-script/SKILL.md.
import fs from 'node:fs';
import path from 'node:path';
import { TK } from './lib/pipeline.mjs';
import { run as viral, hookPattern } from './critics/viral.mjs';
const [cmd, a1, ...rest] = process.argv.slice(2), opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; }, rdj = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const FORMATS = { explainer: ['hook', 'stakes', 'setup', 'mechanism', 'proof', 'twist', 'cta'], tutorial: ['hook', 'stakes', 'step', 'step', 'proof', 'cta'], story: ['hook', 'setup', 'step', 'twist', 'proof', 'cta'], 'dialogue-comedy': ['hook', 'setup', 'step', 'twist', 'twist', 'cta'], listicle: ['hook', 'step', 'step', 'step', 'proof', 'cta'], news: ['hook', 'stakes', 'proof', 'mechanism', 'cta'] };
if (cmd === 'hooks') {
  const t = a1 || '<topic>'; console.log(`Hook patterns for "${t}". Write THREE with different patterns, say each aloud (3 seconds, 8 to 9 words), pick one.\n- open-loop question : "Why does ${t} ...?"  (the answer must come late)\n- number + stake     : "<specific number> <people/things> ... and <what they lose>."\n- contradiction      : "${t} is not what you think. <one concrete reason>."\n- accusation / you   : "You are doing ${t} wrong. Here is the proof."\n- POV / cold open    : "POV: <the moment it goes wrong>."  /  "Last night, <odd thing> showed up."\nBad: greetings ("Hey guys"), "In this video", "Today we", filler ("So", "Okay so").`); process.exit(0);
}
const P = path.resolve(a1 || ''); if (!['new', 'score'].includes(cmd) || !fs.existsSync(P)) { console.error('usage: script_studio.mjs new|score <project> | hooks "<topic>"'); process.exit(2); }
if (cmd === 'new') {
  const f = path.join(P, 'script/viral-plan.json'); if (fs.existsSync(f) && !rest.includes('--force')) { console.error('script/viral-plan.json exists (use --force to overwrite)'); process.exit(1); }
  const brief = rdj(path.join(P, 'brief.json')) || {}, script = rdj(path.join(P, 'script/script.json')), format = opt('format', brief.format || 'explainer'), beats = FORMATS[format] || FORMATS.explainer, ref = opt('ref');
  const bp = ref && rdj(path.join(P, 'references', ref, 'blueprint.json')), dur = brief.duration_sec || bp?.duration || 30, T = (x) => `TODO: ${x}`;
  const plan = { format, promise: T('one sentence: what the viewer gets, learns or feels by the end'), audience_pain: T('what they are stuck on, afraid of or curious about'),
    hook: { options: [{ pattern: 'open-loop question', line: T('hook option 1') }, { pattern: 'contradiction', line: T('hook option 2') }, { pattern: 'number + stake', line: T('hook option 3') }], chosen: 0, why: T('why this one stops the scroll') },
    beats: beats.map((b, i) => ({ beat: b, from_pct: Math.round((i / beats.length) * 100), to_pct: Math.round(((i + 1) / beats.length) * 100), job: T(`what "${b}" must do`), lines: script ? script.lines.filter((l) => l.beat === b).map((l) => l.id) : [] })),
    open_loops: [{ opens: 'L01', closes: T('line id where the question is answered (late)') }],
    emotion_arc: [{ lines: ['L01'], emotion: T('curious | shock | fear | happy | sad | determined | calm | proud') }],
    retention: [{ at: T('line id'), device: T('pattern interrupt: new shot size, stat, sound hit, character reaction') }],
    overlay_plan: [{ line: T('line id'), device: T('a component from the manifest that shows what the voice cannot say'), why: T('what it adds') }],
    sound_plan: [{ line: T('line id'), sfx: T('pop|tick|stamp|whoosh|...'), why: T('the visual event it belongs to') }],
    cta: { keyword: brief.cta?.keyword || T('ONE WORD'), line: T('last line id') }, loop: { echo: T('a content word used in the first AND last line') }, share: { reason: T('why a stranger sends this to a friend'), comment_bait: T('what makes them comment the keyword') },
    ...(ref ? { reference: { name: ref, keep: bp ? [`pace: median shot ${bp.median_shot}s`, `${bp.cuts_per_10s} cuts per 10 s`, `caption zone y ${bp.caption_y ?? 'n/a'}`] : [], twist: T('the better twist, measurable: see references/<ref>/twist.json'), beat_grid: bp?.beat_grid || null } } : {}), duration_sec: dur };
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(plan, null, 1)); console.log(`script/viral-plan.json written (${format}, ${beats.length} beats). Fill every TODO, write script/script.json against it, then: node tools/script_studio.mjs score ${P}`); process.exit(0);
}
const r = await viral(P); const plan = rdj(path.join(P, 'script/viral-plan.json')), s = rdj(path.join(P, 'script/script.json'));
console.log(`viral rubric: ${r.verdict} (${r.score}/100)`); if (s) console.log(`hook "${s.lines[0].text}" -> pattern: ${hookPattern(s.lines[0].text).join(', ') || 'none recognised'}`);
for (const f of r.findings) console.log(`  ${f.severity.toUpperCase().padEnd(7)} ${f.line_id || ''} ${f.problem}\n          fix: ${f.fix}`); process.exit(r.verdict === 'fail' ? 1 : 0);
