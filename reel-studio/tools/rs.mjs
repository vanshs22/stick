#!/usr/bin/env node
// Looks up the OFFICIAL Remotion rule files (installed by scripts/install_remotion_skills.mjs) and prints them, so an agent can read the right rule in one command.
//   node tools/rs.mjs list              all topics
//   node tools/rs.mjs <topic> [...]     print the rule(s): e.g. 3d, audio, sequencing, transitions, captions, text-highlights, calculate-metadata, render
//   node tools/rs.mjs --path            where the rules are
// Topic = file name without .md; a folder overview is its name without "remotion-" (markup, captions, maps, render, studio, license, create...); "router" = the main SKILL.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOME = process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio');
const CANDS = [path.join(HOME, 'remotion-skills/skills/remotion-best-practices'), path.join(os.homedir(), '.agents/skills/remotion-best-practices'), path.join(os.homedir(), '.claude/skills/remotion-best-practices')];
const ROOT = CANDS.find((d) => fs.existsSync(path.join(d, 'SKILL.md')));
if (!ROOT) { console.error('Official Remotion skills are not installed. Run: node scripts/install_remotion_skills.mjs'); process.exit(1); }
const topics = { router: path.join(ROOT, 'SKILL.md') };
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!['assets', 'agents', 'node_modules', 'scripts', 'techniques'].includes(f.name)) walk(p); } else if (f.name.endsWith('.md')) { const k = f.name === 'REFERENCE.md' ? path.basename(d).replace(/^remotion-/, '') : f.name.slice(0, -3); topics[k] ||= p; } } })(ROOT);
(function maps() { const t = path.join(ROOT, 'remotion-maps/techniques'); if (fs.existsSync(t)) for (const d of fs.readdirSync(t)) { const f = path.join(t, d, 'TECHNIQUE.md'); if (fs.existsSync(f)) topics['maps-' + d] = f; } })();
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === '--path') console.log(ROOT);
else if (!cmd || cmd === 'list') { console.log(`official Remotion rules at ${ROOT}\n` + Object.keys(topics).sort().join('  ')); }
else for (const q of [cmd, ...rest]) { const k = topics[q] ? q : Object.keys(topics).filter((t) => t.includes(q)); const hit = typeof k === 'string' ? k : k.length === 1 ? k[0] : null; if (!hit) { console.error(`${k.length ? 'ambiguous' : 'unknown'} topic "${q}"${k.length ? ': ' + k.join(', ') : ''} (node tools/rs.mjs list)`); process.exit(1); } console.log(`\n######## ${hit}  (${path.relative(ROOT, topics[hit])})\n` + fs.readFileSync(topics[hit], 'utf8')); }
