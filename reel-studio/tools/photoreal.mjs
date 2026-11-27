#!/usr/bin/env node
// Photoreal engine (Blender Cycles, path tracing) for plates, depth maps and sequences. No people (see docs/PHOTOREAL.md).
//   node tools/photoreal.mjs doctor                                   is Blender installed and does it render here? (prints the measured speed)
//   node tools/photoreal.mjs render <scene.json> --project <P> --name <shot> [--samples 64] [--scale 1] [--t 0]      -> <P>/assets/plates/<shot>.png + .depth.png + .json
//   node tools/photoreal.mjs sequence <scene.json> --project <P> --name <shot> [--fps 12] [--seconds 3] [--scale 0.5]  -> <P>/assets/plates/<shot>.mp4 (frames interpolated to 30 fps)
//   node tools/photoreal.mjs estimate <scene.json> [--samples 64]     predicted render time from the doctor benchmark
//   node tools/photoreal.mjs scene <preset> --out <scene.json>        starter scenes: product-table, interior, abstract-glass
// Install: bash install.sh --with-photoreal (a separate .venv-blender so Blender's pinned numpy never touches the voice and vision tools).
import fs from 'node:fs';
import path from 'node:path';
import { TK, run } from './lib/pipeline.mjs';

const a = process.argv.slice(2), cmd = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] ? a[i + 1] : d; };
const venv = path.join(TK, process.platform === 'win32' ? '.venv-blender/Scripts/python.exe' : '.venv-blender/bin/python'), R = path.join(TK, 'renderers/blender/render_scene.py'), sysl = path.join(TK, '.syslibs');
const env = { ...process.env, ...(fs.existsSync(sysl) ? { LD_LIBRARY_PATH: [path.join(sysl, 'usr/lib/x86_64-linux-gnu'), path.join(sysl, 'lib/x86_64-linux-gnu'), process.env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':') } : {}), BLENDER_USER_CONFIG: path.join(TK, '.cache/blender'), XDG_CONFIG_HOME: path.join(TK, '.cache') };
fs.mkdirSync(path.join(TK, '.cache/blender'), { recursive: true });
const have = () => fs.existsSync(venv);
const bench = path.join(TK, '.cache/photoreal-bench.json');
const need = () => { if (!have()) { console.error('Blender is not installed here.\n  bash install.sh --with-photoreal      (about 400 MB, separate .venv-blender)\nWithout it the other engines still work; photoreal shots need it.'); process.exit(1); } };

if (cmd === 'doctor') {
  need(); const t = Date.now(), tmp = path.join(TK, '.cache/doctor'); fs.mkdirSync(tmp, { recursive: true });
  const sc = { resolution: [960, 540], samples: 32, ground: { color: [0.5, 0.5, 0.5], size: 20 }, objects: [{ prim: 'sphere', size: 1, pos: [0, 0, 0.5], material: { color: [0.9, 0.3, 0.2], rough: 0.3 } }], lights: [{ type: 'AREA', pos: [2, -2, 3], energy: 300, look_at: [0, 0, 0.5] }], camera: { pos: [0, -3, 1], look_at: [0, 0, 0.5], fov: 40 }, film: {} };
  fs.writeFileSync(path.join(tmp, 'scene.json'), JSON.stringify(sc)); const r = run(venv, [R, path.join(tmp, 'scene.json'), path.join(tmp, 'd')], { env });
  if (r.status) { console.error('Blender did not render:\n' + (r.stderr || r.stdout).slice(-600) + '\nOn Linux a missing library (libSM, libGL) is the usual cause: python scripts/fetch_syslibs.py'); process.exit(1); }
  const j = JSON.parse(fs.readFileSync(path.join(tmp, 'd.json'), 'utf8')), px = 960 * 540 * 32, perMpxSample = j.seconds_render / (px / 1e6); fs.writeFileSync(bench, JSON.stringify({ device: j.device, s_per_mpx_sample: perMpxSample, at: new Date().toISOString() }));
  console.log(`ok: Blender renders here on ${j.device}. 960x540 at 32 samples took ${j.seconds_render} s (${((Date.now() - t) / 1000).toFixed(0)} s incl. start-up). Estimate for a 1080p plate at 64 samples: ${Math.round(perMpxSample * 2.07 * 64)} s.`); process.exit(0);
}
if (cmd === 'estimate') { const b = fs.existsSync(bench) ? JSON.parse(fs.readFileSync(bench, 'utf8')) : null; if (!b) { console.error('run `photoreal.mjs doctor` first (it measures this machine)'); process.exit(1); } const S = JSON.parse(fs.readFileSync(a[1], 'utf8')), [w, h] = S.resolution || [1920, 1080], s = +opt('samples', S.samples || 64), ov = (1 + (S.overscan || 0)) ** 2; console.log(`~${Math.round(b.s_per_mpx_sample * (w * h * ov) / 1e6 * s + 6)} s per plate on ${b.device} (${w}x${h}, ${s} samples, +6 s start-up and depth)`); process.exit(0); }
if (cmd === 'scene') {
  const out = opt('out', 'scene.json'), P = { 'product-table': { resolution: [1920, 1080], samples: 64, overscan: 0.12, hdri: 'assets/polyhaven/<pick: photo_studio_loft_hall>/<id>_2k.hdr', hdri_strength: 1, ground: { texture: 'assets/polyhaven/<pick: wood_table_001>', size: 30, uv_scale: 5 }, objects: [{ model: 'assets/polyhaven/<id>/<id>_1k.gltf', pos: [0, 0, 0], rot: [0, 0, -25], fit_height: 1 }], lights: [{ type: 'AREA', pos: [2.5, -2.5, 2.8], energy: 260, size: 2, look_at: [0, 0, 0.5], color: [1, 0.93, 0.82] }], camera: { pos: [0.9, -3.2, 0.9], look_at: [0, 0, 0.5], fov: 38, fstop: 2.4 }, film: { look: 'AgX', bloom: 0.25, grain: 0.012, vignette: 0.3, chroma: 0.002 } },
    interior: { resolution: [1920, 1080], samples: 96, overscan: 0.12, hdri: 'assets/polyhaven/<pick an indoor hdri>/<id>_2k.hdr', objects: [{ model: '<a room or furniture gltf>', pos: [0, 0, 0], fit_height: 1 }], camera: { keys: [{ t: 0, pos: [3, -4, 1.4], look_at: [0, 0, 0.9], fov: 40 }, { t: 4, pos: [2.3, -3.2, 1.3], look_at: [0, 0, 0.9], fov: 36 }], fstop: 2.8 }, film: { look: 'AgX', bloom: 0.2, grain: 0.015, vignette: 0.25 } },
    'abstract-glass': { resolution: [1920, 1080], samples: 96, overscan: 0.12, sky: [0.02, 0.02, 0.04], ground: { color: [0.02, 0.02, 0.03], rough: 0.15, size: 40 }, objects: [{ prim: 'sphere', size: 1.2, pos: [0, 0, 0.6], material: { color: [1, 1, 1], rough: 0.02, transmission: 1, ior: 1.5 } }, { prim: 'sphere', size: 0.3, pos: [0, 0, 0.6], material: { color: [1, 0.4, 0.1], emission: [1, 0.4, 0.1, 25] } }], lights: [{ type: 'AREA', pos: [3, -3, 3], energy: 400, size: 3, look_at: [0, 0, 0.6], color: [0.7, 0.8, 1] }], camera: { pos: [0, -4, 1.1], look_at: [0, 0, 0.6], fov: 35, fstop: 2.0 }, film: { look: 'AgX', bloom: 0.5, grain: 0.012, vignette: 0.35, chroma: 0.003 } } }[a[1]];
  if (!P) { console.error('presets: product-table, interior, abstract-glass'); process.exit(2); } fs.writeFileSync(out, JSON.stringify(P, null, 1)); console.log(`wrote ${out}. Replace the <pick ...> paths with assets from tools/assets/polyhaven.mjs (search ... / get ...).`); process.exit(0);
}
if (cmd === 'render' || cmd === 'sequence') {
  need(); const scene = path.resolve(a[1] || ''), P = path.resolve(opt('project', '.')), name = opt('name'); if (!fs.existsSync(scene) || !name) { console.error('usage: photoreal.mjs render|sequence <scene.json> --project <P> --name <shot> [--samples N] [--scale S]'); process.exit(2); }
  // assets the scene declares ({"assets":[{"kind":"hdri|texture|model","id":"...","res":"1k"}]}) are fetched (CC0, with provenance) when missing
  for (const x of JSON.parse(fs.readFileSync(scene, 'utf8')).assets || []) if (!fs.existsSync(path.join(P, 'assets/polyhaven', x.id))) { const g = run('node', [path.join(TK, 'tools/assets/polyhaven.mjs'), 'get', x.kind, x.id, '--res', x.res || '1k', '--dir', P]); if (g.status) { console.error(g.stderr || g.stdout); process.exit(1); } console.log((g.stdout || '').trim()); }
  const dir = path.join(P, 'assets/plates'); fs.mkdirSync(dir, { recursive: true }); const o = path.join(dir, name), args = [R, scene, o, ...(opt('samples') ? ['--samples', opt('samples')] : []), ...(opt('scale') ? ['--scale', opt('scale')] : []), ...(opt('t') ? ['--t', opt('t')] : [])];
  if (cmd === 'sequence') { const fps = opt('fps', '12'), sec = opt('seconds', '3'); args.push('--sequence', '--fps', fps, '--seconds', sec); const r = run(venv, args, { env, cwd: P, stdio: 'inherit' }); if (r.status) process.exit(1);
    const f = run('ffmpeg', ['-y', '-v', 'error', '-framerate', fps, '-i', `${o}_%04d.png`, '-vf', 'minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1,format=yuv420p', '-c:v', 'libx264', '-crf', '16', `${o}.mp4`]); if (f.status) { console.error(f.stderr); process.exit(1); } for (const x of fs.readdirSync(dir)) if (x.startsWith(name + '_') && x.endsWith('.png')) fs.rmSync(path.join(dir, x)); console.log(`sequence: ${o}.mp4 (frames rendered at ${fps} fps, interpolated to 30)`); process.exit(0); }
  const r = run(venv, args, { env, cwd: P }); if (r.status) { console.error((r.stderr || r.stdout).slice(-900)); process.exit(1); } const j = JSON.parse(fs.readFileSync(o + '.json', 'utf8'));
  console.log(`plate ${name}: ${j.resolution.join('x')} ${j.samples} samples on ${j.device} in ${j.seconds_render} s\n  storyboard props: {"plate":"assets/plates/${name}.png","depth":"assets/plates/${name}.depth.png","overscan":${JSON.parse(fs.readFileSync(scene, 'utf8')).overscan || 0}}`);
} else { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(2); }
