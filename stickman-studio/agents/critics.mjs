// Visual and final critics (script, storyboard and sound critics live next to the agents they check).
import fs from 'node:fs';
import path from 'node:path';
import { proj, sh, readJSON, writeJSON, issue, scoreOf } from './core.mjs';

const lumas = (dir) => { const r = sh('ffmpeg', ['-v', 'error', '-pattern_type', 'glob', '-i', path.join(dir, '*.jpg'), '-vf', 'signalstats,metadata=print:file=-', '-f', 'null', '-']);
  return { y: [...r.out.matchAll(/YAVG=([\d.]+)/g)].map((m) => +m[1]), lo: [...r.out.matchAll(/YLOW=([\d.]+)/g)].map((m) => +m[1]), hi: [...r.out.matchAll(/YHIGH=([\d.]+)/g)].map((m) => +m[1]) }; };
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;

/** looks at 6 real frames of the preview. 3D families must be readable (not too dark, enough contrast); too dark -> raise exposure and look again (max 2 times). */
export async function previewCritic(job) {
  const P = proj(job), st = readJSON(path.join(P, 'style.json')), dur = readJSON(path.join(P, 'data/lines.json')).duration, I = [];
  if (!['lowpoly', 'voxel', 'blocky'].includes(st.family)) return { score: 100, issues: [], note: 'luminance check applies to the block 3D families' };
  for (let round = 0; round < 3; round++) {
    const dir = path.join(P, 'review/pf'); fs.rmSync(dir, { recursive: true, force: true });
    const times = Array.from({ length: 6 }, (_, i) => (1 + ((dur - 2) * i) / 5).toFixed(2)).join(',');
    const r = sh('node', ['tools/capture.mjs', 'frames', 'review/pf', times], { cwd: P, env: { QS: '&res=0.5', FPS: '20' } }); if (!r.ok) return { score: 60, issues: [issue('preview-failed', 'could not capture preview frames: ' + r.out.slice(-200), 'check the project', 40)] };
    const { y, lo, hi } = lumas(dir), my = med(y), dark = y.filter((v) => v < 45).length / y.length, contrast = med(hi) - med(lo), isDark = my < 48 || dark > 0.34, stats = { medianLuma: +my.toFixed(1), darkShare: +dark.toFixed(2), contrast, exposure: st.grade?.exposure ?? 1 };
    if (!isDark) return contrast < 45 ? { score: 90, issues: [issue('flat', `low contrast (${contrast}): the picture may look washed out`, 'add darker shadows or a stronger key light', 10)], stats } : { score: 100, issues: [], stats };
    if (round === 2) { I.push(issue('too-dark', `frames are dark (median luma ${my.toFixed(0)}, ${(dark * 100).toFixed(0)}% very dark) even at exposure ${st.grade?.exposure}`, 'brighten the set lights', 30)); break; }
    st.grade = { ...st.grade, exposure: +Math.min(2.4, (st.grade?.exposure ?? 1) + 0.3).toFixed(2) }; writeJSON(path.join(P, 'style.json'), st);
    job.log.push({ t: new Date().toISOString(), stage: 'preview', msg: `too dark (luma ${my}): exposure -> ${st.grade.exposure}` });
  }
  return { score: scoreOf(I), issues: I };
}

export function finalCritic(res, job) {
  const I = [], qa = res.qa || {}, checks = qa.checks || qa.results || [];
  checks.filter((c) => c.ok === false).forEach((c) => I.push(issue('qa-' + String(c.name || c.id || 'check').replace(/\W+/g, '-'), `${c.name || c.id}: ${c.note || ''}`, 'see qa.json', c.name === 'length 15-60 s' ? 5 : 25)));
  if (!fs.existsSync(res.video) || fs.statSync(res.video).size < 50e3) I.push(issue('no-video', 'the render produced no usable file', 're-run', 100));
  return { score: scoreOf(I), issues: I };
}
