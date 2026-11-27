#!/usr/bin/env node
// remocn (https://remocn.dev, MIT): a registry of 900+ copy-paste Remotion components. Use it whenever a shot needs a ready-made animation, text
// effect, transition, background, caption style or app-screen simulation instead of building one.
//   node tools/remocn.mjs search "<what you need>" [--vibe tech] [--max 12] [--refresh]   find components (reads the live index, cached one day)
//   node tools/remocn.mjs info <name>                                                   props, usage, "use when / do not use when"
//   node tools/remocn.mjs add <name...> --project <P> [--install-deps]                  copy the source into <P>/remotion/src/remocn and register it
//   node tools/remocn.mjs list --project <P>                                            what is installed in a project
// Then a storyboard shot is {"component":"RemocnBlock","props":{"name":"claude-code","props":{...},"anchor":"<word anchor>"}}.
// Components are copied (you own the code), run on OUR Remotion timeline, and are never used for facts or screenshots: evidence stays real captures.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), BASE = process.env.REMOCN_URL || 'https://remocn.dev';
const CACHE = path.join(process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'), 'remocn');

/** parse the markdown tables of llms-components.txt into [{name, section, use, avoid, length, vibe, tier, deps, docs}] */
export function parseIndex(text) {
  const out = []; let section = '';
  for (const line of text.split('\n')) {
    const h = line.match(/^##\s+(.+)/); if (h) { section = h[1].trim(); continue; }
    if (!/^\s*\|\s*`/.test(line)) continue;
    const c = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '').split(/\s\|\s/).map((x) => x.trim());   // cells are separated by " | "
    if (c.length < 8) continue;
    const strip = (x) => x.replace(/^`|`$/g, '');
    out.push({ name: strip(c[0]), section, use: c[1], avoid: c[2], length: c[3], vibe: c[4], tier: c[5], deps: c[6] === '—' ? [] : [...c[6].matchAll(/`([^`]+)`/g)].map((m) => m[1]), docs: (c[7].match(/\((https?:[^)]+)\)/) || [])[1] || '' });
  }
  return out;
}
/** words in the query that appear in the entry, weighted: name > use-for > vibe/section > avoid */
export function score(e, q) {
  const words = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2); let s = 0;
  for (const w of words) { if (e.name.includes(w)) s += 5; if (e.use.toLowerCase().includes(w)) s += 3; if (`${e.vibe} ${e.section}`.toLowerCase().includes(w)) s += 2; if (e.avoid.toLowerCase().includes(w)) s -= 1; }
  return s;
}
const get = async (url) => { const r = await fetch(url, { headers: { 'User-Agent': 'reel-studio' } }); if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`); return r; };
async function index(refresh) {
  const f = path.join(CACHE, 'llms-components.txt'); fs.mkdirSync(CACHE, { recursive: true });
  if (!refresh && fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs < 864e5) return parseIndex(fs.readFileSync(f, 'utf8'));
  try { const t = await (await get(`${BASE}/llms-components.txt`)).text(); fs.writeFileSync(f, t); return parseIndex(t); }
  catch (e) { if (fs.existsSync(f)) { console.error(`(offline: using the cached index) ${e.message}`); return parseIndex(fs.readFileSync(f, 'utf8')); } throw new Error(`cannot reach ${BASE} and no cached index: ${e.message}. remocn is optional: build the shot from our own components instead.`); }
}
const pascal = (n) => n.split(/[-_]/).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

/** copy one registry item (and the registry items it depends on) into <R>/src/remocn, rewriting the "@/" imports to relative ones */
async function install(name, R, done, npm) {
  if (done.has(name)) return; done.add(name);
  const item = await (await get(`${BASE}/r/${name}.json`)).json();
  for (const d of item.registryDependencies || []) await install(String(d).replace(/^@remocn\//, ''), R, done, npm);
  for (const d of item.dependencies || []) npm.add(d);
  for (const f of item.files || []) {
    const target = String(f.target || f.path).replace(/^components\/remocn\//, '').replace(/^lib\//, 'lib/'), dest = path.join(R, 'src/remocn', target);
    let code = f.content || ''; fs.mkdirSync(path.dirname(dest), { recursive: true });
    const rel = (to) => { let r = path.relative(path.dirname(dest), path.join(R, 'src/remocn', to)).split(path.sep).join('/'); return r.startsWith('.') ? r : './' + r; };
    code = code.replace(/(from\s+['"])@\/components\/remocn\/([^'"]+)(['"])/g, (_, a, p, z) => a + rel(p) + z).replace(/(from\s+['"])@\/lib\/([^'"]+)(['"])/g, (_, a, p, z) => a + rel('lib/' + p) + z);
    const left = code.match(/from\s+['"]@\/[^'"]+['"]/g); if (left) console.error(`  note: ${target} still imports ${left.join(', ')}: edit it to a relative path`);
    fs.writeFileSync(dest, code);
    if (item.type === 'registry:component' && /\.tsx$/.test(target)) { const ex = [...code.matchAll(/export (?:const|function) ([A-Z]\w*)/g)].map((m) => m[1]); done.main ||= {}; done.main[item.name] = { file: target.replace(/\.tsx$/, ''), exp: ex.includes(pascal(item.name)) ? pascal(item.name) : ex.find((x) => !/^[A-Z0-9_]+$/.test(x)) || ex[0] }; }
  }
}
function writeRegistry(R) {
  const dir = path.join(R, 'src/remocn'), meta = path.join(dir, 'INSTALLED.json'), items = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : {};
  const names = Object.keys(items).sort(); fs.mkdirSync(path.join(R, 'src/data'), { recursive: true });
  const imp = names.map((n, i) => `import {${items[n].exp} as C${i}} from '../remocn/${items[n].file}';`).join('\n');
  fs.writeFileSync(path.join(R, 'src/data/remocn-registry.ts'), `// GENERATED by tools/remocn.mjs: do not edit by hand.\nimport type React from 'react';\n${imp}\nexport const REMOCN: Record<string, React.ComponentType<any>> = {${names.map((n, i) => ` '${n}': C${i}`).join(',')} };\n`);
}

const [, , cmd, ...rest] = process.argv;
const flag = (k) => rest.includes('--' + k), opt = (k) => (flag(k) ? rest[rest.indexOf('--' + k) + 1] : undefined), pos = rest.filter((x, i) => !x.startsWith('--') && !(i > 0 && ['--vibe', '--max', '--project'].includes(rest[i - 1])));
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    if (cmd === 'search') {
      const q = pos.join(' '); if (!q) throw new Error('usage: remocn.mjs search "<what you need>" [--vibe tech] [--max 12]');
      const all = (await index(flag('refresh'))).filter((e) => !opt('vibe') || e.vibe.toLowerCase() === opt('vibe').toLowerCase()), top = all.map((e) => [score(e, q), e]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, +(opt('max') || 12));
      if (!top.length) console.log(`nothing matches "${q}" in ${all.length} components. Try other words (the index describes WHEN to use each) or build it from our own components.`);
      for (const [, e] of top) console.log(`${e.name.padEnd(28)} ${String(e.length).padEnd(6)} ${e.vibe.padEnd(8)} ${e.section}\n    use: ${e.use}\n    not: ${e.avoid}${e.deps.length ? `\n    needs: ${e.deps.join(', ')}` : ''}`);
      if (top.length) console.log(`\nnext: node tools/remocn.mjs info <name>   then   node tools/remocn.mjs add <name> --project <P>`);
    } else if (cmd === 'info') {
      const name = pos[0]; if (!name) throw new Error('usage: remocn.mjs info <name>'); const e = (await index()).find((x) => x.name === name); if (!e) throw new Error(`no component "${name}" (try: remocn.mjs search "<words>")`);
      const md = await (await get(e.docs.endsWith('.md') ? e.docs : e.docs + '.md')).text(); console.log(`${e.name}  (${e.length}, ${e.vibe}, ${e.section})\nneeds: ${e.deps.join(', ') || 'nothing else'}\n`); console.log(md.split('\n').filter((l) => !/^```tsx?$/.test(l)).slice(0, 90).join('\n'));
    } else if (cmd === 'add') {
      const P = path.resolve(opt('project') || ''); if (!opt('project') || !pos.length) throw new Error('usage: remocn.mjs add <name...> --project <P> [--install-deps]');
      const R = path.join(P, 'remotion'); if (!fs.existsSync(R)) throw new Error(`${R} not found: create the project first (new_project.mjs)`);
      const idx = await index(), npm = new Set(), done = new Set(); done.main = {};
      for (const n of pos) { if (!idx.find((e) => e.name === n)) throw new Error(`"${n}" is not in the remocn index (remocn.mjs search "<words>")`); await install(n, R, done, npm); }
      const meta = path.join(R, 'src/remocn/INSTALLED.json'), cur = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : {};
      for (const n of pos) { const m = done.main[n]; if (!m?.exp) throw new Error(`could not find the exported component of "${n}" in the copied file`); cur[n] = { ...m, source: `${BASE}/r/${n}.json`, license: 'MIT (remocn)', added_at: new Date().toISOString() }; }
      fs.writeFileSync(meta, JSON.stringify(cur, null, 1)); writeRegistry(R);
      fs.writeFileSync(path.join(R, 'src/remocn/LICENSE-NOTICE.txt'), 'These files were copied from the remocn registry (https://remocn.dev, https://github.com/Remocn/remocn), MIT licensed. Keep this notice. Remotion keeps its own license.\n');
      const miss = [...npm].filter((d) => d !== 'remotion' && !fs.existsSync(path.join(R, 'node_modules', ...d.split('/'))));
      console.log(`installed: ${[...done].join(', ')}\nregistered for storyboards: ${pos.join(', ')} -> {"component":"RemocnBlock","props":{"name":"${pos[0]}","props":{...}}}`);
      if (miss.length) { if (flag('install-deps')) { const { spawnSync } = await import('node:child_process'); const T = path.join(TK, 'remotion-template'); console.log(`npm install ${miss.join(' ')} (shared template packages, saved in remotion-template/package.json)`); const r = spawnSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', ...miss], { cwd: T, stdio: 'inherit', shell: process.platform === 'win32' }); if (r.status) throw new Error('npm install failed'); } else console.log(`MISSING npm packages: ${miss.join(' ')}. Run again with --install-deps (installs them once for every project), or pick another component.`); }
    } else if (cmd === 'list') {
      const P = path.resolve(opt('project') || ''), meta = path.join(P, 'remotion/src/remocn/INSTALLED.json'); console.log(fs.existsSync(meta) ? Object.keys(JSON.parse(fs.readFileSync(meta, 'utf8'))).join('\n') : '(none installed)');
    } else { console.error('usage: remocn.mjs search|info|add|list ...  (see the header of this file)'); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
