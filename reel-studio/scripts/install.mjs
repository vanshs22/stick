#!/usr/bin/env node
// Makes the toolkit visible to AI coding agents. Every folder under skills/ (plus the main reel-studio skill) is linked into the skill folders
// of Claude Code (.claude/skills), OpenCode (.opencode/skills) and the open Agent Skills location (.agents/skills).
//   node scripts/install.mjs                      global install in your home folder
//   node scripts/install.mjs --into <project>     install only into one project folder
//   node scripts/install.mjs --copy               copy instead of symlink (Windows / zip hand-off)
//   (also installs the official Remotion agent skills; skip with --no-remotion)
// Also writes ~/.reel-studio/toolkit (the toolkit path) so every skill can find its tools.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), a = process.argv.slice(2), into = a.includes('--into') ? path.resolve(a[a.indexOf('--into') + 1]) : null, copy = a.includes('--copy');
const root = into || os.homedir(), bases = into ? ['.claude/skills', '.opencode/skills', '.agents/skills'] : ['.claude/skills', '.config/opencode/skills', '.agents/skills'];
const subs = fs.readdirSync(path.join(TK, 'skills')).filter((d) => fs.existsSync(path.join(TK, 'skills', d, 'SKILL.md'))), skills = [['reel-studio', TK], ...subs.map((d) => [d, path.join(TK, 'skills', d)])];
const cp = (src, dst) => fs.cpSync(src, dst, { recursive: true, filter: (f) => !/node_modules|reel-projects|[\\/]\.git([\\/]|$)|[\\/]\.venv([\\/]|$)/.test(f) });
const done = [], failed = [], kept = [];
for (const b of bases) {
  try {
    for (const [name, src] of skills) {
      const dst = path.join(root, b, name); fs.mkdirSync(path.dirname(dst), { recursive: true });
      // never overwrite something that is not ours (a user's own skill called "storyboard" or "captions"): only replace our own symlink or a copy carrying our marker
      const mine = (() => { try { const l = fs.lstatSync(dst); if (l.isSymbolicLink()) return fs.realpathSync(dst).startsWith(TK); return fs.existsSync(path.join(dst, '.reel-studio-managed')); } catch { return null; } })();
      if (mine === false) { kept.push(`${path.join(root, b, name)}`); continue; }
      fs.rmSync(dst, { recursive: true, force: true });
      if (copy || process.platform === 'win32') { cp(src, dst); fs.writeFileSync(path.join(dst, '.reel-studio-managed'), TK); } else { try { fs.symlinkSync(src, dst, 'dir'); } catch { cp(src, dst); fs.writeFileSync(path.join(dst, '.reel-studio-managed'), TK); } }   // Windows: symlinks need admin rights, so copy
    }
    done.push(b);
  } catch (e) { failed.push(`${b} (${e.code || e.message})`); }
}
if (kept.length) console.log(`kept your own skills (not overwritten): ${kept.join(', ')}. Rename them or use --into <project> if you want ours there.`);
if (failed.length) console.log(`could not write: ${failed.join(', ')}. Those folders are read-only or missing here; use --into <project> or point your agent at AGENTS.md.`);
const RH = process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'); try { fs.mkdirSync(RH, { recursive: true }); fs.writeFileSync(path.join(RH, 'toolkit'), TK); } catch { console.log(`could not save the toolkit path to ${RH} (read-only). Set REEL_STUDIO_HOME to a writable folder.`); }
if (!a.includes('--no-remotion')) { const r = spawnSync('node', [path.join(TK, 'scripts/install_remotion_skills.mjs'), ...(into ? ['--into', into] : [])], { encoding: 'utf8' }); console.log((r.stdout + r.stderr).trim()); }
console.log(`installed ${skills.length} skills into ${done.map((b) => path.join(root, b)).join(', ') || 'nowhere (see above)'}\ntoolkit path saved to ~/.reel-studio/toolkit\nnext: node ${TK}/tools/doctor.mjs`);
