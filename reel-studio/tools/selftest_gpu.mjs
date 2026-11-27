#!/usr/bin/env node
// GPU readiness without a GPU: shards are balanced by frames, tiers map to flags, the probe reports honestly, the Kaggle pack is well formed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shardPlan, parseShard, pickShard, TIERS } from './lib/shard.mjs';
import { probe, isSoftware } from './gpu_probe.mjs';
import { run, TK } from './lib/pipeline.mjs';

const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
const items = [300, 90, 90, 90, 60, 60, 60, 30].map((n, i) => ({ id: 'S' + i, from: 0, to: n - 1 }));
const sh = shardPlan(items, 2), load = (b) => b.reduce((a, x) => a + x.to + 1, 0);
ok(sh.flat().length === items.length && new Set(sh.flat().map((x) => x.id)).size === items.length, 'every shot must land in exactly one shard');
ok(Math.abs(load(sh[0]) - load(sh[1])) <= 60, `shards unbalanced: ${load(sh[0])} vs ${load(sh[1])} frames`);
ok(pickShard(items, parseShard('2/2'), undefined).length === sh[1].length, 'pickShard 2/2 must give the second shard');
ok(pickShard(items, null).length === items.length, 'no shard means all shots');
for (const bad_ of ['0/2', '3/2', 'x', '1-2']) { let t = false; try { parseShard(bad_); } catch { t = true; } ok(t, `parseShard must refuse "${bad_}"`); }
ok(TIERS.preview.scale < TIERS.proof.scale && TIERS.proof.scale < TIERS.final.scale && TIERS.final.scale === '1', 'tiers must grow in size');
ok(isSoftware('ANGLE (Google, Vulkan 1.3, SwiftShader Device)') && isSoftware('llvmpipe (LLVM 15)') && !isSoftware('NVIDIA Tesla T4/PCIe/SSE2'), 'software detection wrong');
const p = probe();
ok(['swangle', 'angle-egl', 'vulkan', 'angle'].includes(p.recommended_gl), 'probe gave no recommendation');
ok(p.gpu_rendering === !isSoftware(p.backends[p.recommended_gl]?.renderer || 'SwiftShader') || !p.gpu_rendering, 'gpu_rendering must agree with the renderer name');
ok(Object.values(p.backends).every((b) => 'software' in b), 'every backend needs a software flag');
ok(!p.gpu || /nvenc/.test(p.encoder) || p.nvenc === false, 'encoder choice must follow NVENC availability');

const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'kg-')); fs.mkdirSync(path.join(proj, 'storyboard')); fs.writeFileSync(path.join(proj, 'storyboard/storyboard.json'), '{"shots":[]}'); fs.writeFileSync(path.join(proj, 'brief.json'), '{}');
const out = path.join(proj, 'pack'), r = run('node', [path.join(TK, 'tools/kaggle_pack.mjs'), proj, '--user', 'someone', '--out', out, '--tier', 'proof', '--probe-only']);
ok(!r.status, 'kaggle_pack failed: ' + (r.stderr || r.stdout).slice(-200));
if (!r.status) {
  const km = JSON.parse(fs.readFileSync(path.join(out, 'kernel/kernel-metadata.json'), 'utf8')), dm = JSON.parse(fs.readFileSync(path.join(out, 'dataset/dataset-metadata.json'), 'utf8')), k = fs.readFileSync(path.join(out, 'kernel/kernel.py'), 'utf8');
  ok(km.enable_gpu === true && km.code_file === 'kernel.py' && km.dataset_sources[0] === dm.id && /^someone\/[a-z0-9-]+$/.test(dm.id), 'kernel/dataset metadata not consistent');
  ok(/"probe_only":true/.test(k) && !k.includes('__CONFIG__'), 'kernel config not filled in');
  ok(fs.readdirSync(path.join(out, 'dataset')).some((f) => f.endsWith('.tar.gz')), 'dataset tarball missing');
}
if (bad.length) { console.error('GPU SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log(`GPU SELFTEST PASSED: shards balanced by frames, tiers, software detection, probe here says ${p.recommended_gl} (${p.gpu_rendering ? 'GPU' : 'software'}), Kaggle pack well formed`);
