#!/usr/bin/env node
// Poly Haven (CC0): HDRI lighting, PBR textures and 3D models for the Blender engine, with provenance. No account, no key.
//   node tools/assets/polyhaven.mjs search <hdris|textures|models> [--q word] [--cat category] [--limit 12]
//   node tools/assets/polyhaven.mjs get <hdri|texture|model> <id> [--res 2k] [--dir <project or folder>]      -> <dir>/assets/polyhaven/<id>/...
//   node tools/assets/polyhaven.mjs sheet <hdris|textures|models> --q word --dir <folder> [--limit 12]       -> thumbnail contact sheet to choose from
// Every download is recorded in <dir>/assets/polyhaven/manifest.json (id, kind, licence CC0, source url, author names, size, date). The asset_review stage refuses an asset without it.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PY } from '../lib/pipeline.mjs';

const a = process.argv.slice(2), [cmd, kind, id] = a, opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] ? a[i + 1] : d; };
const API = 'https://api.polyhaven.com', UA = { 'User-Agent': 'reel-studio-toolkit/3 (+local)' }, TYPE = { hdri: 'hdris', hdris: 'hdris', texture: 'textures', textures: 'textures', model: 'models', models: 'models' };
const j = async (u) => { const r = await fetch(u, { headers: UA }); if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); return r.json(); };
const dl = async (u, f) => { fs.mkdirSync(path.dirname(f), { recursive: true }); if (fs.existsSync(f) && fs.statSync(f).size) return fs.statSync(f).size; const r = await fetch(u, { headers: UA }); if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); const b = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(f, b); return b.length; };
if (!['search', 'get', 'sheet'].includes(cmd) || !TYPE[kind]) { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 7).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(2); }
const dir = path.resolve(opt('dir', '.')), root = path.join(dir, 'assets/polyhaven');

async function list(t) { const q = (opt('q', '') || '').toLowerCase(), cat = opt('cat'), all = await j(`${API}/assets?t=${t}${cat ? '&c=' + encodeURIComponent(cat) : ''}`); return Object.entries(all).filter(([k, v]) => !q || (k + ' ' + v.name + ' ' + (v.tags || []).join(' ') + ' ' + (v.categories || []).join(' ')).toLowerCase().includes(q)).sort((x, y) => (y[1].download_count || 0) - (x[1].download_count || 0)).slice(0, +opt('limit', 12)); }
const note = (rec) => { const f = path.join(root, 'manifest.json'); let m = []; try { m = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* new */ } m = m.filter((x) => x.id !== rec.id); m.push(rec); fs.mkdirSync(root, { recursive: true }); fs.writeFileSync(f, JSON.stringify(m, null, 1)); };

if (cmd === 'search' || cmd === 'sheet') {
  const t = TYPE[kind], rows = await list(t);
  for (const [k, v] of rows) console.log(`${k.padEnd(28)} ${(v.categories || []).join(',').padEnd(24)} ${(v.tags || []).slice(0, 5).join(' ')}`);
  if (cmd === 'sheet') { const d = path.join(root, '_thumbs'); fs.mkdirSync(d, { recursive: true }); const files = []; for (const [k] of rows) { const f = path.join(d, k + '.jpg'); try { await dl(`https://cdn.polyhaven.com/asset_img/thumbs/${k}.png?width=320&height=180`, f); files.push(f); } catch { /* no thumb */ } }
    const py = `import sys\nfrom PIL import Image, ImageDraw\nfs=sys.argv[2:]; ims=[(Image.open(f).convert('RGB').resize((320,180)),f.split('/')[-1][:-4]) for f in fs]; c=4; r=-(-len(ims)//c); S=Image.new('RGB',(c*320,r*200),(20,20,26)); d=ImageDraw.Draw(S)\nfor i,(im,n) in enumerate(ims):\n    x,y=(i%c)*320,(i//c)*200; S.paste(im,(x,y+20)); d.text((x+4,y+4),n,fill=(255,220,120))\nS.save(sys.argv[1],quality=88)`;
    const out = path.join(dir, `review/polyhaven-${kind}.jpg`); fs.mkdirSync(path.dirname(out), { recursive: true }); const p = spawnSync(PY, ['-c', py, out, ...files], { encoding: 'utf8' }); console.log(p.status ? p.stderr : `LOOK AT: ${out}`); }
} else {
  if (!id) { console.error('give an asset id (search first)'); process.exit(2); }
  const t = TYPE[kind], info = await j(`${API}/info/${id}`), files = await j(`${API}/files/${id}`), res = opt('res', t === 'hdris' ? '2k' : '1k'), out = path.join(root, id); let bytes = 0; const got = [];
  if (t === 'hdris') { const u = files.hdri?.[res]?.hdr?.url; if (!u) throw new Error(`no ${res} hdr for ${id} (have ${Object.keys(files.hdri || {})})`); bytes += await dl(u, path.join(out, `${id}_${res}.hdr`)); got.push(`${id}_${res}.hdr`); }
  else if (t === 'textures') { for (const [map, v] of Object.entries(files)) { const r = v?.[res]; const u = r?.jpg?.url || r?.png?.url; if (u && /^(Diffuse|Rough|nor_gl|Displacement|AO|arm|Metal)$/.test(map)) { const f = `${map}${path.extname(u)}`; bytes += await dl(u, path.join(out, f)); got.push(f); } } }
  else { const g = files.gltf?.[res]?.gltf; if (!g) throw new Error(`no ${res} gltf for ${id} (have ${Object.keys(files.gltf || {})})`); bytes += await dl(g.url, path.join(out, `${id}_${res}.gltf`)); got.push(`${id}_${res}.gltf`); for (const [p, v] of Object.entries(g.include || {})) { bytes += await dl(v.url, path.join(out, p)); got.push(p); } }
  note({ id, kind: t, resolution: res, name: info.name, licence: 'CC0 1.0 (public domain)', author: info.authors ? Object.keys(info.authors) : [], source: `https://polyhaven.com/a/${id}`, files: got, bytes, fetched: new Date().toISOString() });
  console.log(`${id} (${info.name}): ${got.length} files, ${(bytes / 1048576).toFixed(1)} MB -> ${out}`);
}
