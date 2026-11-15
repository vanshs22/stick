// Editor: runs the render pipeline in stages (voice + word timing + auto-fixes + sound mix + contact sheet, then the video). Presets trade speed for quality.
import path from 'node:path';
import { STUDIO, proj, sh, readJSON } from './core.mjs';

const PRESET = { turbo: ['--turbo'], fast: ['--fast'], full: [] };
export function prepare(job) {
  const b = job.brief, args = [path.join(STUDIO, 'make.sh'), 'x', '--name', job.id, '--stage', 'prepare', ...PRESET.turbo];
  const r = sh('bash', args, { env: { STUDIO_NO_LLM: '1' } }); if (!r.ok) throw new Error('prepare failed:\n' + r.out.slice(-900));
  return { sheet: path.join(proj(job), 'review/sheet.jpg'), log: r.out.split('\n').filter((l) => /fix:|before fixes|CHECK|data\/mix/.test(l)).join('\n') };
}
export function render(job) {
  const t0 = Date.now(), args = [path.join(STUDIO, 'make.sh'), 'x', '--name', job.id, '--stage', 'render', ...(PRESET[job.brief.preset] || [])];
  const r = sh('bash', args, { env: { STUDIO_NO_LLM: '1' } }); if (!r.ok) throw new Error('render failed:\n' + r.out.slice(-900));
  const video = path.join(proj(job), `renders/${job.id}.mp4`);
  return { video, qa: readJSON(path.join(proj(job), `renders/${job.id}.qa.json`)), seconds: Math.round((Date.now() - t0) / 1000), out: r.out.split('\n').filter((l) => /QA|ok |FAIL|WARN|VIDEO/.test(l)).join('\n') };
}
