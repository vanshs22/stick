// Style-fidelity critic: is the finished film in the SAME STYLE FAMILY as the reference (measured), different enough to be new (measured), and did the agent LOOK and confirm every "must keep" (protocol)?
// Runs only when a project has a completed style brief (tools/reference/style_brief.mjs). It cannot judge taste: it measures the look and demands the looking.
import fs from 'node:fs';
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { TK, PY, run, finalVideo } from '../lib/pipeline.mjs';
import { checkTwist } from '../lib/twist.mjs';
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
export async function run_(P) {
  const r = new Report(P, 'style'), rdir = path.join(P, 'references'), refs = fs.existsSync(rdir) ? fs.readdirSync(rdir).filter((d) => tryRd(path.join(rdir, d, 'style-brief.json'))?.status === 'done') : [];
  if (!refs.length) { r.notes.push('No completed style brief in this project: nothing to compare (reference stage: style_brief.mjs).'); return r.finish(); }
  const v = finalVideo(P); if (!v) { r.add('blocker', { problem: 'no rendered film to compare with the reference style', evidence: '', expected: 'renders/*.mp4', fix: 'render', fix_target: 'render' }); return r.finish(); }
  const fdir = path.join(P, 'review/style-frames'); fs.mkdirSync(fdir, { recursive: true }); const dur = tryRd(path.join(P, 'data/timeline.json'))?.duration || 10, files = [];
  for (const q of [0.15, 0.35, 0.55, 0.8]) { const f = path.join(fdir, `f${Math.round(q * 100)}.jpg`); run('ffmpeg', ['-y', '-v', 'error', '-ss', String((dur * q).toFixed(2)), '-i', path.join(P, v), '-frames:v', '1', '-q:v', '2', f]); if (fs.existsSync(f)) files.push(f); }
  const mo = path.join(fdir, 'measure.json'), mr = run(PY, [path.join(TK, 'tools/reference/style_measure.py'), mo, ...files]); if (mr.status) { r.add('major', { problem: 'could not measure the film', evidence: (mr.stderr || '').slice(-160), expected: 'style_measure.py runs', fix: 'bash install.sh', fix_target: 'process' }); return r.finish(); }
  const M = tryRd(mo).overall, sb = tryRd(path.join(P, 'storyboard/storyboard.json'));
  for (const d of refs) {   // one picture to LOOK at: the reference on the left, four frames of the film on the right, same height
    const rdirD = path.join(rdir, d), refImg = ['source.jpg', 'source.jpeg', 'source.png', 'source.webp', 'keyframes/shot_01.jpg', 'keyframes/image.jpg'].map((f) => path.join(rdirD, f)).find((f) => fs.existsSync(f));
    if (refImg && files.length) { const ins = [refImg, ...files], out = path.join(P, `review/style-compare-${d}.jpg`); run('ffmpeg', ['-y', '-v', 'error', ...ins.flatMap((f) => ['-i', f]), '-filter_complex', ins.map((_, i) => `[${i}:v]scale=-2:640[v${i}]`).join(';') + ';' + ins.map((_, i) => `[v${i}]`).join('') + `hstack=inputs=${ins.length}`, '-frames:v', '1', '-q:v', '3', out]); if (fs.existsSync(out)) r.notes.push(`LOOK at review/style-compare-${d}.jpg: the reference (left) and the film (right)`); }
  }
  for (const d of refs) {
    const B = tryRd(path.join(rdir, d, 'style-brief.json')), R = B.measured, tw = tryRd(path.join(rdir, d, 'twist.json')), levers = (tw?.style_levers || []).map((l) => l.id), shifted = levers.includes('palette_shift');
    r.check(`same family as "${d}": brightness, saturation, contrast, depth of field (measured)`);
    if (R) {
      for (const [k, tol, what] of [['brightness', 0.22, 'overall brightness'], ['saturation', 0.22, 'colour saturation'], ['contrast_p5_p95', 0.3, 'contrast']]) if (R[k] != null && Math.abs(M[k] - R[k]) > tol) r.add('minor', { problem: `${what} is far from the reference style`, evidence: `film ${M[k]} vs reference ${R[k]}`, expected: `within ${tol} so it reads as the same family`, fix: 'adjust exposure, bloom or the palette override', fix_target: 'style' });
      if (R.background_blur_ratio != null && R.background_blur_ratio < 0.6 && M.background_blur_ratio > 0.95) r.add('minor', { problem: 'the reference has a shallow depth of field and the film is sharp everywhere', evidence: `blur ratio film ${M.background_blur_ratio} vs reference ${R.background_blur_ratio}`, expected: 'blurred background (aperture 0.004 or more, or blur the bgImage)', fix: 'raise look.aperture', fix_target: 'style' });
      if (R.warm_share != null && Math.abs((M.warm_share - M.cool_share) - (R.warm_share - R.cool_share)) > 0.6 && !shifted) r.add('minor', { problem: 'warm/cool balance is the opposite of the reference and no palette_shift twist is declared', evidence: `film ${(M.warm_share - M.cool_share).toFixed(2)} vs ref ${(R.warm_share - R.cool_share).toFixed(2)}`, expected: 'same temperature family, or declare palette_shift in the twist', fix: 'adjust the palette or declare the twist', fix_target: 'style' });
    } else r.notes.push(`reference "${d}" has no measured numbers (an unavailable brief): only the protocol below applies`);
    r.check(`not a copy of "${d}": palette differs when a palette_shift twist is declared`);
    const refHue = R?.palette?.[0]?.hue != null ? (R.roles?.accent ? hueOfHex(R.roles.accent) : R.palette[0].hue) : null, filmHue = M.roles?.accent ? hueOfHex(M.roles.accent) : null, shift = refHue != null && filmHue != null ? hueDist(refHue, filmHue) : null;
    if (shifted && shift != null && (shift < 20 || shift > 110)) r.add('minor', { problem: shift < 20 ? 'palette_shift was declared but the accent colour did not move' : 'palette shifted so far it no longer reads as the same style', evidence: `accent hue moved ${shift} degrees`, expected: '20 to 110 degrees', fix: 'adjust the accent in style-overrides.json', fix_target: 'style' });
    for (const f of checkTwist(tw, { shots: sb?.shots || [], lines: tryRd(path.join(P, 'script/script.json'))?.lines || [], cuesPer10: null, medianShot: null, cutsPer10: null })) r.add('minor', { problem: `twist vs "${d}": ${f.problem}`, evidence: f.evidence, expected: 'the lever from twist.json is visible in the film', fix: f.fix, fix_target: 'storyboard' });
    if (!tw?.idea) r.add('major', { problem: `no twist written for style reference "${d}"`, evidence: 'twist.json missing', expected: 'a one-sentence, 8+ word twist', fix: `node tools/reference/twist.mjs <P> ${d} --idea "..." --levers palette_shift,character_swap`, fix_target: 'process' });
    r.check('the agent LOOKED at the film against the brief (review/style-check.json)');
    const sc = tryRd(path.join(P, 'review/style-check.json'));
    if (!sc || sc.status !== 'done') r.add('major', { problem: 'the film was not checked against the style brief by eye', evidence: sc ? `style-check.json is "${sc.status}"` : 'review/style-check.json missing', expected: 'every must-keep item confirmed on the contact sheet', fix: `node tools/reference/style_check.mjs <P> ${d} --template, look at review/style-frames/*.jpg and the contact sheet, fill it, --validate`, fix_target: 'process' });
    else for (const m of sc.must_keep || []) if (m.seen === false && !/^accept:/i.test(m.decision || '')) r.add('major', { problem: `a must-keep style element is not in the film: ${String(m.item).slice(0, 80)}`, evidence: m.note, expected: 'fix it, or accept with a stated reason ("accept: <why>")', fix: m.decision || 'fix in the storyboard or overrides', fix_target: 'style' });
  }
  r.notes.push('Measured: brightness, saturation, contrast, depth of field, temperature and palette shift. Not measurable: character design, face, hair, set dressing, mood. Those are the must_keep items the agent confirms by looking.'); return r.finish();
}
function hueOfHex(h) { const n = parseInt(h.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round(((x * 60) + 360) % 360); }
export { run_ as run };
