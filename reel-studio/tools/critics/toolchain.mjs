// Toolchain critic: proof that the tools of every stage RAN on this project (evidence files), not that the agent says so.
// A film made by skipping research, the contact sheet, the listening report or the sound-event check is not "done", even if it renders.
import fs from 'node:fs';
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { finalVideo } from '../lib/pipeline.mjs';
export async function run(P) {
  const r = new Report(P, 'toolchain'), has = (f) => fs.existsSync(path.join(P, f)), mt = (f) => (has(f) ? fs.statSync(path.join(P, f)).mtimeMs : 0), rd = (f) => tryRd(path.join(P, f));
  const brief = rd('brief.json') || {}, script = rd('script/script.json') || {}, plan = rd('audio/audio-plan.json') || {}, silent = plan.mode === 'silent', fv = finalVideo(P);
  const video = fv, need = (name, ok, file, fix, sev = 'major') => { r.check(name); if (!ok) r.add(sev, { problem: `${name}: no evidence`, evidence: file, expected: 'the stage tool ran and left its file', fix, fix_target: 'process' }); };
  need('research written', has('research/research.json'), 'research/research.json', 'run the research stage (skills/video-research)');
  need('viral plan written and scored (hook options, beats, loop, share reason)', has('script/viral-plan.json') || !!(rd('script/viral-plan.json') || {}).waived, 'script/viral-plan.json', 'node tools/script_studio.mjs new <P> ...');
  need('script and storyboard critics ran', has('review/critics/script.json') && has('review/critics/storyboard.json'), 'review/critics/{script,storyboard}.json', 'node tools/critique.mjs <P> stage:script  and  stage:storyboard');
  need('cinematography check ran on the storyboard', has('review/cinematography-critic.json') || !(rd('storyboard/storyboard.json')?.shots || []).some((s) => s.component === 'Stage3D'), 'review/cinematography-critic.json', 'node tools/check_storyboard.mjs <P>');
  need('visual concept written (every line has an approach and what the picture adds)', has('storyboard/visual-concept.json'), 'storyboard/visual-concept.json', 'node tools/visual_concept.mjs <P>');
  need('real assets reviewed', has('assets/asset-selection.json') || !has('assets/manifest.json'), 'assets/asset-selection.json', 'node tools/assets_review.mjs <P>');
  if (!silent) {
    need('voice aligned to words (Whisper) for caption and anchor timing', has('data/words.json') && has('data/lines.json'), 'data/words.json', 'build_video.mjs runs words.py; install faster-whisper');
    need('sound cues built from events', has('data/cues.json'), 'data/cues.json', 'node tools/audio/build_cues.mjs <P>');
    need('mix report (music under voice, headroom)', has('data/mix-report.json'), 'data/mix-report.json', 'python tools/audio/mix.py .');
    if (script.cast && Object.keys(script.cast).length) need('casting written for the characters', has('audio/casting.json'), 'audio/casting.json', 'node tools/audio/build_tts_input.mjs <P>');
    need('listening report cut for a human (clips + checklist)', has('review/ears/timeline.md'), 'review/ears/timeline.md', 'python tools/audio/ears.py <P>', 'minor');
  }
  need('video built and QA report present', !!video && has(video.replace(/\.mp4$/, '.qa.json')), 'renders/*.qa.json', 'node tools/build_video.mjs <P>');
  const qa = video && rd(video.replace(/\.mp4$/, '.qa.json')); if (qa) { r.check('QA passed on the master file'); if (!qa.pass && !qa.preview) r.add('blocker', { problem: 'final QA failed', evidence: (qa.checks || []).filter((c) => !c.ok && c.level !== 'warn').map((c) => c.name).join(', '), expected: 'all checks ok', fix: 'fix and rebuild', fix_target: 'render' }); }
  need('contact sheet made from THIS render (a person or the agent looked at it)', !!video && (fs.existsSync(path.join(P, 'review')) ? fs.readdirSync(path.join(P, 'review')).filter((f) => /^final.*\.jpe?g$/.test(f)).some((f) => mt(`review/${f}`) >= mt(video) - 1000) : false), 'review/final.jpg', 'node tools/qa/contact_sheet.mjs <mp4> <P>/review/final.jpg');
  if (brief.delivery?.upscale) need('4K (Lanczos) file exists for a project that asks for 4K', !!video && has(video.replace(/\.mp4$/, '.4k.mp4')), '*.4k.mp4', 'node tools/build_video.mjs <P> --upscale');
  const refs = has('references') ? fs.readdirSync(path.join(P, 'references')).filter((d) => has(`references/${d}/analysis.json`)) : [];
  for (const d of refs) need(`style brief (character, set, light, camera, colour) for reference "${d}"`, ['done', 'unavailable'].includes((rd(`references/${d}/style-brief.json`) || {}).status), `references/${d}/style-brief.json`, `node tools/reference/style_brief.mjs <P> ${d} --template, look, fill, --validate`);
  for (const d of refs) need(`twist written for reference "${d}"`, has(`references/${d}/twist.json`), `references/${d}/twist.json`, 'node tools/reference/twist.mjs <P> ' + d + ' --idea "..."');
  r.notes.push('This critic proves the tools ran. It does not judge the result: the contact sheet and the listening clips still need eyes and ears.'); return r.finish();
}
