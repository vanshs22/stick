#!/usr/bin/env node
// Creates a production folder: the stage folders, state.json (approval gates) and a copy of the Remotion template.
//   node tools/new_project.mjs <name> [--dir <parent folder, default ./reel-projects>] [--style <style-pack id>] [--test]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { init } from './state.mjs';

const a = process.argv.slice(2), name = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!name || name.startsWith('--')) { console.error('usage: new_project.mjs <name> [--dir parent] [--style id] [--test]'); process.exit(2); }
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), P = path.resolve(opt('dir', 'reel-projects'), name);
if (fs.existsSync(P)) { console.error(`${P} already exists: choose another name, or continue that project.`); process.exit(2); }
for (const d of ['research', 'script', 'storyboard', 'audio', 'assets', 'data', 'review', 'renders']) fs.mkdirSync(path.join(P, d), { recursive: true });
fs.cpSync(path.join(TK, 'remotion-template'), path.join(P, 'remotion'), { recursive: true, filter: (f) => !f.split(path.sep).includes('node_modules') });
if (fs.existsSync(path.join(TK, 'remotion-template/node_modules'))) fs.symlinkSync(path.join(TK, 'remotion-template/node_modules'), path.join(P, 'remotion/node_modules'), 'dir');   // one shared install, not 700 MB per project
const sp = opt('style') && path.join(TK, 'style-packs', opt('style'), 'style.json');
if (sp) { if (!fs.existsSync(sp)) { console.error(`no style pack "${opt('style')}" (looked for ${sp})`); process.exit(2); } const s = JSON.parse(fs.readFileSync(sp, 'utf8')); fs.writeFileSync(path.join(P, 'remotion/src/data/style.json'), JSON.stringify({ id: s.id, ...s.tokens, effects: s.effects || {}, defaults: s.defaults || {} }, null, 1)); }
fs.writeFileSync(path.join(P, 'assets/manifest.json'), JSON.stringify({ assets: [] }, null, 1)); fs.writeFileSync(path.join(P, '.toolkit'), TK);
if (a.includes('--test') && process.env.REEL_TEST_MODE !== '1') { console.error('--test is only for toolkit self-tests (REEL_TEST_MODE=1)'); process.exit(2); }
init(P, { test: a.includes('--test') }); console.log(`project: ${P}\ntoolkit: ${TK}\nnext   : write ${path.join(P, 'brief.json')} (schema: production-brief), then follow the stages in state.json`);
