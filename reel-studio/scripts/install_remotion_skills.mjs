#!/usr/bin/env node
// Installs the OFFICIAL Remotion agent skills (github.com/remotion-dev/skills) so the agent writes correct Remotion code.
//   node scripts/install_remotion_skills.mjs [--into <project>] [--update]
// 1. keeps one checkout at ~/.reel-studio/remotion-skills (or $REEL_STUDIO_HOME): tools/rs.mjs reads its rule files from there
// 2. links `remotion-best-practices` (the router for all Remotion skills) into the skill folders of Claude Code, OpenCode and .agents
// We do not copy the files into this repo: they are Remotion's, and this way you always get the latest version (--update).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const a = process.argv.slice(2), into = a.includes('--into') ? path.resolve(a[a.indexOf('--into') + 1]) : null;
const HOME = process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'), dst = path.join(HOME, 'remotion-skills'), src = path.join(dst, 'skills/remotion-best-practices');
const run = (args, cwd) => spawnSync('git', args, { cwd, encoding: 'utf8' });
fs.mkdirSync(HOME, { recursive: true });
if (fs.existsSync(path.join(dst, '.git'))) { if (a.includes('--update') || !fs.existsSync(src)) { const r = run(['pull', '--ff-only'], dst); console.log(r.status ? `could not update (${(r.stderr || '').trim().split('\n')[0]}), keeping the existing copy` : 'remotion-skills updated'); } else console.log('remotion-skills already present (use --update to refresh)'); }
else { const r = run(['clone', '--depth', '1', 'https://github.com/remotion-dev/skills.git', dst]); if (r.status) { console.error(`could not clone remotion-dev/skills: ${(r.stderr || '').trim()}\nFallback: run  npx skills add remotion-dev/skills  and set REEL_STUDIO_HOME to a folder that contains remotion-skills/`); process.exit(1); } console.log('cloned remotion-dev/skills'); }
if (!fs.existsSync(path.join(src, 'SKILL.md'))) { console.error(`${src}/SKILL.md not found: the repository layout changed`); process.exit(1); }
const root = into || os.homedir(), bases = into ? ['.claude/skills', '.opencode/skills', '.agents/skills'] : ['.claude/skills', '.config/opencode/skills', '.agents/skills'];
for (const b of bases) { const link = path.join(root, b, 'remotion-best-practices'); try { fs.mkdirSync(path.dirname(link), { recursive: true }); fs.rmSync(link, { recursive: true, force: true }); fs.symlinkSync(src, link, 'dir'); } catch (e) { console.error(`skipped ${link}: ${e.message}`); } }
const ver = (fs.readFileSync(path.join(src, 'SKILL.md'), 'utf8').match(/version:\s*(\S+)/) || [])[1];
console.log(`official Remotion skills ${ver || ''} ready at ${src}\nlinked as remotion-best-practices into ${bases.map((b) => path.join(root, b)).join(', ')}`);
