#!/usr/bin/env node
// Makes the toolkit visible to AI coding agents. Every folder under skills/ (plus the main reel-studio skill) is linked into the skill folders
// of Claude Code (.claude/skills), OpenCode (.opencode/skills) and the open Agent Skills location (.agents/skills).
//   node scripts/install.mjs                      global install in your home folder
//   node scripts/install.mjs --into <project>     install only into one project folder
//   node scripts/install.mjs --copy               copy instead of symlink (Windows / zip hand-off)
// Also writes ~/.reel-studio/toolkit (the toolkit path) so every skill can find its tools.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), a = process.argv.slice(2), into = a.includes('--into') ? path.resolve(a[a.indexOf('--into') + 1]) : null, copy = a.includes('--copy');
const root = into || os.homedir(), bases = into ? ['.claude/skills', '.opencode/skills', '.agents/skills'] : ['.claude/skills', '.config/opencode/skills', '.agents/skills'];
const subs = fs.readdirSync(path.join(TK, 'skills')).filter((d) => fs.existsSync(path.join(TK, 'skills', d, 'SKILL.md'))), skills = [['reel-studio', TK], ...subs.map((d) => [d, path.join(TK, 'skills', d)])];
for (const b of bases) for (const [name, src] of skills) {
  const dst = path.join(root, b, name); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.rmSync(dst, { recursive: true, force: true });
  if (copy) fs.cpSync(src, dst, { recursive: true, filter: (f) => !/node_modules|reel-projects|[\\/]\.git([\\/]|$)/.test(f) }); else fs.symlinkSync(src, dst, 'dir');
}
fs.mkdirSync(path.join(os.homedir(), '.reel-studio'), { recursive: true }); fs.writeFileSync(path.join(os.homedir(), '.reel-studio/toolkit'), TK);
console.log(`installed ${skills.length} skills (${copy ? 'copied' : 'linked'}) into ${bases.map((b) => path.join(root, b)).join(', ')}\ntoolkit path saved to ~/.reel-studio/toolkit\nnext: npx skills add remotion-dev/skills   then   node ${TK}/tools/doctor.mjs`);
