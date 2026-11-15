// Shared plumbing for the agent team: job store, env, shell helper, LLM budget, and the worker-plus-critic loop.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { askJSON } from '../director/llm.mjs';

export const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const JOBS = path.join(STUDIO, 'jobs'), PROJECTS = path.join(STUDIO, 'projects'), MEMORY = path.join(STUDIO, 'memory');
export const proj = (job) => path.join(PROJECTS, job.id), jdir = (job) => path.join(JOBS, job.id);

// studio.env (API keys, paths) is also read here, so every agent sees the same settings as make.sh
try { for (const l of fs.readFileSync(path.join(STUDIO, 'studio.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)=([^#\n]*)/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim(); } } catch {}
const FF = process.env.FFMPEG_BIN || '/projects/sandbox/faceless-shorts/bin';
export const env = () => ({ ...process.env, PATH: `${FF}:${process.env.PATH}`, FACELESS_HOME: process.env.FACELESS_HOME || '/projects/sandbox/faceless-shorts/.faceless-home',
  CHROME: process.env.CHROME || (fs.readdirSync('/root/.cache/ms-playwright').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => `/root/.cache/ms-playwright/${d}/chrome-headless-shell-linux64/chrome-headless-shell`).find((p) => fs.existsSync(p)) || '') });

export const readJSON = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
export const writeJSON = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)); };
export const loadJob = (id) => readJSON(path.join(JOBS, id, 'job.json'));
export const saveJob = (job) => writeJSON(path.join(JOBS, job.id, 'job.json'), job);
export const say = (job, stage, msg) => { job.log.push({ t: new Date().toISOString(), stage, msg }); console.log(`[${stage}] ${msg}`); };

/** run a command, return { ok, out } (stdout+stderr, last 6000 chars). Never throws. */
export function sh(cmd, args, o = {}) {
  const r = spawnSync(cmd, args, { cwd: o.cwd || STUDIO, env: { ...env(), ...(o.env || {}) }, encoding: 'utf8', maxBuffer: 64e6, timeout: o.timeout || 3600e3 });
  return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).slice(-6000), code: r.status };
}

/** one cheap LLM call with a per-job budget (FreeLLMAPI first, OpenAI fallback: see director/llm.mjs). null = no key / over budget / failed. */
export async function ask(job, system, user, tag, check) {
  if (job.llm.calls >= job.llm.max || process.env.STUDIO_NO_LLM) return null;
  const r = await askJSON(system, user, { tag, check }); if (!r) return null;
  if (!r.cached) { job.llm.calls++; job.llm.by[r.provider] = (job.llm.by[r.provider] || 0) + 1; }
  return r.json;
}

/** worker -> critic -> (feedback -> worker) up to `max` attempts; keeps the best attempt. Every attempt is recorded on the job. */
export async function withCritic(job, stage, worker, critic, { max = 2, pass = 75 } = {}) {
  let fb = null, best = null; const tries = [];
  for (let i = 0; i < max; i++) {
    const art = await worker(fb), rep = await critic(art, job); tries.push({ score: rep.score, issues: rep.issues.map((x) => x.code) });
    if (!best || rep.score > best.rep.score) best = { art, rep };
    if (rep.score >= pass) break; fb = rep;
  }
  job.stages[stage] = { ...(job.stages[stage] || {}), score: best.rep.score, attempts: tries, issues: best.rep.issues };
  say(job, stage, `critic ${best.rep.score}/100 after ${tries.length} attempt(s)${best.rep.issues.length ? ': ' + best.rep.issues.map((x) => x.code).join(', ') : ''}`);
  return best;
}
export const issue = (code, msg, fix) => ({ code, msg, fix });
export const scoreOf = (issues, base = 100) => Math.max(0, base - issues.reduce((a, i) => a + (i.w ?? 15), 0));
