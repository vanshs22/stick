#!/usr/bin/env node
// Final pass on a rendered video: normalise loudness (two-pass loudnorm, video stream copied untouched), then check the result against the
// PROJECT'S delivery profile (brief.delivery or the platform preset, see tools/lib/delivery.mjs): decode errors, resolution, aspect, fps, duration,
// audio present when required, loudness, true peak, clipping, black and frozen picture, timeline gaps, caption timing and safe zone, file size (only if a limit exists).
// Writes <video>.qa.json: { pass, preview, delivery_ready, profile, checks[] }.
//   node qa/final_qa.mjs raw.mp4 final.mp4 [--project <dir>]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PY, TK } from '../lib/pipeline.mjs';   // also puts the installer's ffmpeg fallback on PATH
import { fileURLToPath } from 'node:url';
import { deliveryProfile } from '../lib/delivery.mjs';

const a = process.argv.slice(2), [src, dst] = a, pi = a.indexOf('--project'), P = pi >= 0 ? path.resolve(a[pi + 1]) : null;
const ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 27 });
const tryRd = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const json = (t) => { const m = t.match(/\{[^{}]*"input_i"[^{}]*\}/s); return m ? JSON.parse(m[0]) : null; };
const prof = P ? deliveryProfile(P) : { width: null, height: null, fps: null, min_sec: null, max_sec: null, max_mb: null, target_sec: null, audio_required: true, narration_required: false, audio_mode: 'unknown', loudness_lufs: -14, true_peak_db: -1.5, source: 'no project given: only the file itself is checked' };
const info0 = ff(['-i', src]).stderr, hasAudio = /Stream #\d+:\d+.*Audio:/.test(info0);
const T = prof.loudness_lufs, TP = prof.true_peak_db, checks = [], add = (name, ok, note, level = 'fail') => checks.push({ name, ok: !!ok, note, level: ok ? 'ok' : level });

// 1. loudness: only when there is audio to normalise
let m1 = null, m2 = null;
if (hasAudio) {
  m1 = json(ff(['-i', src, '-af', `loudnorm=I=${T}:TP=${TP}:LRA=11:print_format=json`, '-f', 'null', '-']).stderr);
  const af = m1 && isFinite(+m1.input_i) ? `loudnorm=I=${T}:TP=${TP}:LRA=11:measured_I=${m1.input_i}:measured_TP=${m1.input_tp}:measured_LRA=${m1.input_lra}:measured_thresh=${m1.input_thresh}:offset=${m1.target_offset}:linear=true` : `loudnorm=I=${T}:TP=${TP}:LRA=11`;
  const r = ff(['-y', '-i', src, '-c:v', 'copy', '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dst]); if (r.status) { console.error(r.stderr.slice(-400)); process.exit(1); }
  m2 = json(ff(['-i', dst, '-af', `loudnorm=I=${T}:TP=${TP}:LRA=11:print_format=json`, '-f', 'null', '-']).stderr);
} else { const r = ff(['-y', '-i', src, '-c', 'copy', '-movflags', '+faststart', dst]); if (r.status) { console.error(r.stderr.slice(-400)); process.exit(1); } }

// 2. the file itself
const dec = ff(['-v', 'error', '-i', dst, '-f', 'null', '-']), decErr = (dec.stderr || '').split('\n').filter((l) => l.trim() && !/^\s*(Last message repeated|Press)/.test(l));
add('file decodes without errors', dec.status === 0 && !decErr.length, decErr.length ? decErr.slice(0, 2).join(' | ').slice(0, 160) : 'clean');
const info = ff(['-i', dst]).stderr, dm = info.match(/Duration: (\d+):(\d+):([\d.]+)/), dur = dm ? dm.slice(1).reduce((s, v, i) => s + (+v) * [3600, 60, 1][i], 0) : 0;
const vm = info.match(/Video: [^\n]*?, (\d{2,5})x(\d{2,5})[^\n]*?, ([\d.]+) fps/), W = vm ? +vm[1] : 0, H = vm ? +vm[2] : 0, FPS = vm ? +vm[3] : 0;
const idx = P ? tryRd(path.join(P, 'renders/segments/index.json')) : null, scale = idx?.scale ?? 1, estimate = !!(P && fs.existsSync(path.join(P, 'data/.estimate'))), preview = scale < 1 || estimate;
if (P) {
  const ew = Math.round(prof.width * scale / 2) * 2, eh = Math.round(prof.height * scale / 2) * 2;
  add('resolution', Math.abs(W - ew) <= 2 && Math.abs(H - eh) <= 2, `${W}x${H} (expected ${ew}x${eh}${scale < 1 ? `, preview scale ${scale}` : ''})`);
  add('aspect ratio', Math.abs(W / H - prof.width / prof.height) < 0.01, `${(W / H).toFixed(3)} (expected ${(prof.width / prof.height).toFixed(3)})`);
  add('frame rate', Math.abs(FPS - prof.fps) < 0.1, `${FPS} fps (expected ${prof.fps})`);
}
if (prof.min_sec != null) add(`duration >= ${prof.min_sec} s`, dur >= prof.min_sec, `${dur.toFixed(1)} s`);
if (prof.max_sec != null) add(`duration <= ${prof.max_sec} s`, dur <= prof.max_sec, `${dur.toFixed(1)} s`);
if (prof.target_sec) add(`duration near the brief's ${prof.target_sec} s (within 30 percent)`, Math.abs(dur - prof.target_sec) <= prof.target_sec * 0.3, `${dur.toFixed(1)} s`, 'warn');
const size = fs.statSync(dst).size / 1e6; if (prof.max_mb != null) add(`file size <= ${prof.max_mb} MB`, size <= prof.max_mb, `${size.toFixed(1)} MB`);

// 3. audio, judged against the audio mode the project declared
if (prof.audio_required) {
  add(`audio stream present (mode: ${prof.audio_mode})`, hasAudio, hasAudio ? 'yes' : 'NO AUDIO STREAM in a project that needs audio');
  if (hasAudio) {
    const vol = ff(['-i', dst, '-af', 'volumedetect', '-vn', '-f', 'null', '-']).stderr, mean = +(vol.match(/mean_volume: (-?[\d.]+)/) || [])[1];
    add('audio is not silent', isFinite(mean) && mean > -50, `mean ${isFinite(mean) ? mean + ' dB' : 'unmeasured'}`);
    add('loudness', m2 ? Math.abs(+m2.input_i - T) <= 1.5 : false, m2 ? `${(+m2.input_i).toFixed(1)} LUFS (target ${T})` : 'unmeasured');
    add('true peak', m2 ? +m2.input_tp <= TP + 0.5 : false, m2 ? `${(+m2.input_tp).toFixed(1)} dBTP (limit ${TP + 0.5})` : '');
    const st = ff(['-i', src, '-af', 'astats=metadata=0', '-vn', '-f', 'null', '-']).stderr, pk = +(st.match(/Overall[\s\S]*?Peak level dB: (-?[\d.]+)/) || st.match(/Peak level dB: (-?[\d.]+)/) || [])[1];
    add('mix does not clip before normalising', !isFinite(pk) || pk < -0.1, isFinite(pk) ? `mix peak ${pk} dBFS` : 'unmeasured', 'warn');
  }
} else add('silent project has no audio stream', true, hasAudio ? 'note: a silent audio track exists' : 'intentionally silent (audio mode: silent)');

// 4. picture
const bl = (ff(['-i', dst, '-vf', 'blackdetect=d=0.5:pix_th=0.04', '-an', '-f', 'null', '-']).stderr.match(/black_start/g) || []).length;
const fz = (ff(['-i', dst, '-vf', 'freezedetect=n=-55dB:d=2.2', '-an', '-f', 'null', '-']).stderr.match(/freeze_start/g) || []).length;
add('no black frames', bl === 0, `${bl} black stretch(es)`); add('no frozen picture', fz === 0, `${fz} frozen stretch(es) > 2.2 s`);

// 5. the timeline and the captions (project only)
if (P) {
  const tl = tryRd(path.join(P, 'data/timeline.json')), fr = 1 / (tl?.fps || 30);
  if (tl) {
    const sh = tl.shots, gaps = []; sh.forEach((s, i) => { const prev = i ? sh[i - 1].end : 0; if (Math.abs(s.start - prev) > fr * 1.5) gaps.push(`${s.id} starts ${s.start.toFixed(2)} after ${prev.toFixed(2)}`); });
    if (sh.length && Math.abs(sh.at(-1).end - tl.duration) > fr * 1.5) gaps.push(`last shot ends ${sh.at(-1).end.toFixed(2)}, film is ${tl.duration.toFixed(2)}`);
    add('no gaps or overlaps in the shot timeline', !gaps.length, gaps.length ? gaps.slice(0, 3).join('; ') : `${sh.length} shots, contiguous`);
    add('every shot has a rendered clip', !idx || (idx.shots.length === sh.length && idx.shots.every((x) => x.ready)), idx ? `${idx.shots.filter((x) => x.ready).length}/${sh.length} clips` : 'no segment index');
    add('film length matches the timeline', Math.abs(dur - tl.duration) <= 0.25, `video ${dur.toFixed(2)} s, timeline ${tl.duration.toFixed(2)} s`);
    const ch = tl.captions?.chunks || [], bad = [];
    ch.forEach((c, i) => { if (c.t1 <= c.t0 || c.t1 - c.t0 < 0.15) bad.push(`chunk ${i} lasts ${(c.t1 - c.t0).toFixed(2)} s`); if (c.t1 > tl.duration + 0.05) bad.push(`chunk ${i} ends after the film`); if (i && c.t0 < ch[i - 1].t1 - 0.05) bad.push(`chunk ${i} overlaps the previous one`); });
    add('caption timing (ordered, no overlap, inside the film)', !bad.length, bad.length ? bad.slice(0, 3).join('; ') : `${ch.length} chunks`);
    const sz = tryRd(path.join(P, 'remotion/src/data/style.json'))?.safe_zone, cc = tryRd(path.join(P, 'remotion/src/data/captions.json')) || {}, cy = cc.position?.y ?? sz?.caption_y;
    if (tl.width > tl.height && tl.height) { const y = cc.position?.y ?? tl.height * 0.8; add('captions inside the safe zone (landscape)', cc.preset === 'headline' || (y >= tl.height * 0.5 && y <= tl.height * 0.95), `caption y ${Math.round(y)} px of ${tl.height}`); } else if (sz && cy != null && tl.height) { const k = tl.height / 1920, top = (sz.top ?? 180) * k, bottom = (sz.caption_bottom ?? 1500) * k, y = cy * k; add('captions inside the safe zone', cc.preset === 'headline' || (y >= top && y <= bottom), `caption y ${Math.round(y)} px, safe ${Math.round(top)}-${Math.round(bottom)}`); }
  }
}
// 4. QUALITY THAT USED TO SLIP THROUGH: a blurred or empty picture, a film with no background music, a film with no sound effects. Each is measured and each FAILS the export.
{
  const pj = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pq-')), 'pq.json'), pq = spawnSync(PY, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'picture_quality.py'), dst, '--json', pj], { encoding: 'utf8' }), pr = tryRd(pj);
  if (pr) add('picture has crisp detail where the viewer looks (no blurred-out props, no empty frames)', pr.pass, pr.pass ? `median centre detail ${pr.median_centre_share}` : `${pr.mush_frames} of ${pr.frames.length} sampled frames are soft or empty (at ${pr.mush_at.join(', ')} s): lower look.aperture (0.004 or less), bgImage.blur (6 or less), or bring the card in on the cut`);
  if (P && prof.audio_required) {
    const rep = tryRd(path.join(P, 'data/mix-report.json')), vc = tryRd(path.join(P, 'audio/voice-choice.json')) || {}, plan = tryRd(path.join(P, 'audio/audio-plan.json')) || {}, wantsMusic = /music/.test(prof.audio_mode || plan.mode || '') && !/^none$/i.test(plan.music?.bed || '');
    if (rep && !estimate) {
      if (wantsMusic) add('background music is in the mix and audible', /music/.test(rep.mode || '') && (rep.music_under_voice_db == null || rep.music_under_voice_db < 30), /music/.test(rep.mode || '') ? `music ${rep.music_under_voice_db ?? '?'} dB under the voice` : `mix mode is "${rep.mode}": no music was mixed`);
      const need = Math.max(2, Math.floor(dur / 7)), sfxOff = vc.sfx === 'none' && String(vc.sfx_reason || '').length >= 8;
      if (!sfxOff && !/^none$/i.test(vc.sfx || '')) add(`sound effects are present (at least ${need} for ${dur.toFixed(0)} s)`, (rep.cues || 0) >= need, `${rep.cues || 0} cue(s) mixed: tie a sound to each card, cut and reveal (skills/reel-craft section 6)`);
      else if (vc.sfx === 'none' && !sfxOff) add('sound effects switched off with a stated reason', false, 'voice-choice.json sfx "none" needs "sfx_reason" (8+ characters)');
    } else if (!estimate && wantsMusic) add('mix report exists (music and sound effects can be verified)', false, 'data/mix-report.json missing: the mix step did not run');
  }
}
const out = { pass: checks.every((c) => c.ok || c.level === 'warn'), preview, estimate, delivery_ready: !preview && checks.every((c) => c.ok || c.level === 'warn'), profile: prof, checks: checks.map(({ name, ok, note, level }) => ({ name, ok, note, level })), loudness_before: m1 && +m1.input_i, video: path.basename(dst), measured: { width: W, height: H, fps: FPS, duration: +dur.toFixed(3), size_mb: +size.toFixed(2), has_audio: hasAudio } };
fs.writeFileSync(dst.replace(/\.mp4$/, '.qa.json'), JSON.stringify(out, null, 1));
console.log(`${out.pass ? 'QA PASS' : 'QA FAIL'}${preview ? ' (PREVIEW: not a delivery render)' : ''}  profile: ${prof.source}, audio ${prof.audio_mode}`);
checks.forEach((c) => console.log(`  ${c.ok ? 'ok  ' : c.level === 'warn' ? 'warn' : 'FAIL'} ${c.name}: ${c.note}`));
