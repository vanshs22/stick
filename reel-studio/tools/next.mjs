#!/usr/bin/env node
// "What do I do now?" For any agent, including a small or cheap one: reads the project's state and files and prints the ONE next step,
// the skill to read, the exact commands, and what "done" looks like. Run it after every step.   node tools/next.mjs <project> [--all]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, GATES, load } from './state.mjs';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), P = path.resolve(process.argv[2] || '.');
if (!fs.existsSync(path.join(P, 'state.json'))) { console.error(`${P} is not a project (no state.json). Create one: node ${TK}/tools/new_project.mjs <name> --dir <parent> --style <pack-id>`); process.exit(2); }
const has = (f) => fs.existsSync(path.join(P, f)), rd = (f) => { try { return JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')); } catch { return null; } };
const S = (cmd) => `node ${TK}/tools/${cmd}`, st = load(P), mode = st.mode;
const brief = rd('brief.json'), sb = rd('storyboard/storyboard.json'), plan = rd('audio/audio-plan.json');
const audioChosen = plan && !/DRAFT/.test(plan.status || '') && has('audio/voice-choice.json');
const rendered = has(`renders/${path.basename(P)}.mp4`) || (fs.existsSync(path.join(P, 'renders')) && fs.readdirSync(path.join(P, 'renders')).some((f) => /\.mp4$/.test(f) && !/raw/.test(f)));
const critic = (n) => has(`review/critics/${n}.json`);

// stage -> { done: is the WORK finished, skill, todo, cmds, ready: what proves it is good }
const W = {
  intake: { done: !!brief?.style_pack, skill: 'video-director', todo: 'Write brief.json (title, topic, platform, duration_sec, language, style_pack, audience, goal, voice, music, captions, cta, research). Put style_pack in it.', cmds: [S(`validate.mjs production-brief ${P}/brief.json`)], ready: 'validate prints "ok"' },
  style: { done: has('style-selection.json'), skill: 'video-director', todo: 'Show the user the style gallery (numbered real previews), let them choose, record it.', cmds: [S(`gallery.mjs ${P} --kind styles`), S(`choose.mjs ${P} style <pack-id>`)], ready: 'style-selection.json exists' },
  topic: { done: has('topic/topic.json'), skill: 'video-research', todo: 'Write topic/topic.json {chosen, shortlist[3], reason}.', cmds: [], ready: 'file exists, the user picked one' },
  research: { done: has('research/research.json') && critic('research'), skill: 'video-research', todo: 'Research with real sources, capture real pages (small viewport so text is readable), write research/research.json with claims + sources, then run the research critic.', cmds: [S(`research/search.mjs ${P} "<query>"`), S(`capture/capture_web.mjs <url> --out ${P}/assets/<id> --manifest ${P}/assets/manifest.json --id SRC1 --viewport 480x486 --scale 2 --expect "<text you will quote>"`), S(`validate.mjs research ${P}/research/research.json`), S(`critique.mjs ${P} stage:research`)], ready: 'research critic has no blocker/major; you OPENED every capture' },
  script: { done: has('script/script.json'), skill: 'script-writing', todo: 'Write script/script.json (hook first, claims cite research ids, 2.4 words per second).', cmds: [S(`validate.mjs script ${P}/script/script.json`)], ready: 'validate ok' },
  script_critic: { done: critic('script') && critic('research'), skill: 'script-critique', todo: 'Run the critics, fix what they list, run again.', cmds: [S(`critique.mjs ${P} script`), S(`fix_plan.mjs ${P}`)], ready: 'script critic: pass or only minors you can defend' },
  storyboard: { done: !!sb && has('review/storyboard-sheets/storyboard-1.jpg') && critic('storyboard'), skill: 'storyboard (+ remocn, threejs-production, playwright-capture)', todo: 'Draft with the scaffold, then improve every shot (our component vs a remocn one, poses, framing, anchors). Render the sheets and OPEN them; fix what you see; run the storyboard critic.', cmds: [S(`scaffold_storyboard.mjs ${P}`), S(`check_storyboard.mjs ${P}`), S(`storyboard_review.mjs ${P}`), S(`critique.mjs ${P} storyboard`), S(`remocn.mjs search "<what the shot must do>"`)], ready: 'check_storyboard OK, you looked at every frame, no face/text/caption collisions' },
  storyboard_critic: { done: critic('storyboard'), skill: 'storyboard-critique', todo: 'Run the storyboard critic (it includes the cinematography critic).', cmds: [S(`critique.mjs ${P} storyboard`)], ready: 'pass' },
  audio: { done: audioChosen, skill: 'audio-production', todo: 'Make voice/music/sfx previews, let the user choose, record it (pronunciations go in the plan, never in the script text).', cmds: [S(`audio/preview_audio.mjs ${P}`), S(`choose.mjs ${P} voice --voice <id> --speed 1.0 --music bed --sfx soft --pron "word=spoken"`)], ready: 'audio-plan.json has no DRAFT status; voice-choice.json exists' },
  typography: { done: has('typography/typography.json'), skill: 'typography', todo: 'Show animated type sets, let the user choose.', cmds: [S(`gallery.mjs ${P} --kind typography`), S(`choose.mjs ${P} typography <number>`)], ready: 'typography.json exists' },
  captions: { done: has('typography/captions.json'), skill: 'captions', todo: 'Show caption presets with the real words, let the user choose.', cmds: [S(`gallery.mjs ${P} --kind captions`), S(`choose.mjs ${P} captions --preset word-pop`)], ready: 'captions.json exists' },
  assets: { done: true, skill: 'playwright-capture', todo: 'Evidence was captured in research. Nothing else unless a shot needs a new capture.', cmds: [], ready: '' },
  production: { done: true, skill: 'video-director', todo: 'Everything is chosen. Ask the user for the go-ahead to render the full video.', cmds: [], ready: '' },
  build: { done: rendered, skill: 'remotion-production', todo: 'One command builds it: voice, timing, sound, mix, per-shot render, assemble, loudness. Use --scale 0.5 for a preview first; scale 1 for delivery. Re-run after any fix: only changed shots re-render.', cmds: [S(`build_video.mjs ${P} --scale 0.5`)], ready: 'DONE line printed; renders/<name>.mp4 exists' },
  visual_critic: { done: critic('video') && critic('frames'), skill: 'visual-critique', todo: 'Critics read the real render. Then OPEN the contact sheet and the vision packet images.', cmds: [S(`critique.mjs ${P} all`), S(`qa/contact_sheet.mjs ${P}/renders/<name>.mp4 ${P}/review/final.jpg --every 2`), S(`critique.mjs ${P} vision --packet composition`), S(`fix_plan.mjs ${P}`)], ready: 'no blocker/major left; you opened the images' },
  audio_critic: { done: critic('voice') && critic('music'), skill: 'audio-production', todo: 'Voice/music/sfx critics measure the real mix (you cannot hear: say taste needs the user\'s ears).', cmds: [S(`critique.mjs ${P} audio`)], ready: 'pass' },
  final: { done: rendered && critic('final'), skill: 'final-quality-control', todo: 'Render at scale 1 if you only have a preview, run all critics, show the user the film + contact sheet + critic summary. Fix with fix_plan + build_video --shots.', cmds: [S(`build_video.mjs ${P}`), S(`critique.mjs ${P} all`), S(`fix_plan.mjs ${P}`)], ready: 'final critic has no major; user approves' },
  deliver: { done: has(`renders/${path.basename(P)}.receipt.json`) || (fs.existsSync(path.join(P, 'renders')) && fs.readdirSync(path.join(P, 'renders')).some((f) => /receipt/.test(f))), skill: 'final-quality-control', todo: 'Seal the video with the approval receipt, copy the finals to output/, tell the user where they are.', cmds: [S(`state.mjs seal ${P} ${P}/renders/<name>.mp4`)], ready: 'receipt written' },
};
const show = (k, why) => { const w = W[k]; console.log(`NEXT: ${k}  (${why})\nread : skills/${w.skill.split(' ')[0]}/SKILL.md  (toolkit: ${TK})\ndo   : ${w.todo}`); if (w.cmds.length) console.log(`run  :\n  ${w.cmds.join('\n  ')}`); if (w.ready) console.log(`good : ${w.ready}`); };
let printed = false;
for (const k of STAGES) {
  const w = W[k], s = st.stages[k], gate = GATES.includes(k);
  const work = w.done;
  if (!work) { show(k, 'the work for this stage is not finished'); printed = true; break; }
  if (gate && s.status !== 'approved' && mode !== 'test') {
    if (s.status === 'awaiting_approval') { console.log(`NEXT: ASK THE USER and STOP  (${k} is waiting for their answer)\nshow : review/approvals/${k}.md and the files it lists\nthen : when they answer, record THEIR words: ${S(`state.mjs approve ${P} ${k} --quote "<their words>"`)}  (or reject --note "<what to change>")\n${k === 'storyboard' ? `frames: ${S(`state.mjs frame ${P} S03 approve|reject|replace`)} one by one; the gate cannot be approved while a frame is open\n` : ''}Never approve for them.${['intake', 'style', 'topic', 'research', 'script', 'script_critic'].includes(k) ? ' (Early gates only: if the user said "run through to X" you may use approve --delegated --quote "<their instruction>".)' : ''}`); }
    else if (s.status === 'changes_requested') console.log(`NEXT: make the changes the user asked for in ${k}, then request again.\n${s.note ? `their note: ${s.note}\n` : ''}${S(`state.mjs request ${P} ${k} --question "..."`)}`);
    else console.log(`NEXT: request approval for ${k}\nrun  : ${S(`state.mjs request ${P} ${k} --question "<one clear question>"`)}\nthen : show the user the files it lists, ask ONE question, and STOP until they answer.`);
    printed = true; break;
  }
}
if (!printed) console.log(`All stages are done${mode === 'test' ? ' (TEST project)' : ''}. The finished video is in ${P}/renders/. Tell the user where it is and what the critics said.`);
if (process.argv.includes('--all')) { console.log('\nAll stages:'); for (const k of STAGES) console.log(`  ${k.padEnd(18)} ${String(st.stages[k].status).padEnd(18)} ${W[k].done ? 'work done' : 'work open'}${GATES.includes(k) ? '  [gate]' : ''}`); }
