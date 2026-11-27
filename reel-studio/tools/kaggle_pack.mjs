#!/usr/bin/env node
// Pack a project and the toolkit for Kaggle: a dataset (tar.gz) plus a kernel script and both metadata files, ready for the Kaggle MCP or CLI.
//   node tools/kaggle_pack.mjs <project> --user <kaggle-username> [--out kaggle-pack] [--tier proof] [--probe-only] [--with-node-modules]
// Flow with a Kaggle MCP (or `kaggle datasets create -p <out>/dataset`, `kaggle kernels push -p <out>/kernel`):
//   1. create the dataset from <out>/dataset   2. push the kernel from <out>/kernel (GPU on, internet on for the first run)
//   3. poll its status   4. download the kernel output (out/*.mp4, gpu-probe.json). Start with --probe-only to learn what the GPU can do.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, run } from './lib/pipeline.mjs';

const a = process.argv.slice(2), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d), P = path.resolve(a[0] || ''), user = opt('user', ''), out = path.resolve(opt('out', 'kaggle-pack'));
if (!a[0] || !fs.existsSync(path.join(P, 'storyboard/storyboard.json')) || !/^[a-z0-9-]+$/i.test(user)) { console.error('usage: kaggle_pack.mjs <project> --user <kaggle-username> [--out dir] [--tier preview|proof|final] [--probe-only] [--with-node-modules]'); process.exit(2); }
const slug = `reel-studio-${path.basename(P).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.slice(0, 50).replace(/-$/, ''), tier = opt('tier', 'proof');
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'kpack-')); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'dataset'), { recursive: true }); fs.mkdirSync(path.join(out, 'kernel'), { recursive: true }); fs.mkdirSync(stage, { recursive: true });
const skip = new Set(['.git', 'projects', 'reel-projects', 'kaggle-pack', '.cache', ...(a.includes('--with-node-modules') ? [] : ['node_modules'])]);
fs.cpSync(TK, path.join(stage, 'rs'), { recursive: true, filter: (s) => !skip.has(path.basename(s)) && !/\.(mp4|mov)$/.test(s) });
fs.cpSync(P, path.join(stage, 'rs/project'), { recursive: true, filter: (s) => !['node_modules', 'segments'].includes(path.basename(s)) });
const tar = run('tar', ['-czf', path.join(out, 'dataset', `${slug}.tar.gz`), '-C', stage, 'rs']); if (tar.status) { console.error(tar.stderr); process.exit(1); } fs.rmSync(stage, { recursive: true, force: true });
fs.writeFileSync(path.join(out, 'dataset/dataset-metadata.json'), JSON.stringify({ title: slug, id: `${user}/${slug}`, licenses: [{ name: 'CC0-1.0' }] }, null, 1));
const cfg = { dataset_slug: slug, tier, name: path.basename(P), probe_only: a.includes('--probe-only'), concurrency: 3 };
fs.writeFileSync(path.join(out, 'kernel/kernel.py'), fs.readFileSync(path.join(TK, 'kaggle/kernel_template.py'), 'utf8').replace('__CONFIG__', JSON.stringify(cfg)));
fs.writeFileSync(path.join(out, 'kernel/kernel-metadata.json'), JSON.stringify({ id: `${user}/${slug}-render`, title: `${slug} render`, code_file: 'kernel.py', language: 'python', kernel_type: 'script', is_private: true, enable_gpu: true, enable_internet: true, dataset_sources: [`${user}/${slug}`], competition_sources: [], kernel_sources: [] }, null, 1));
console.log(`packed ${path.relative(process.cwd(), out)}: dataset ${slug}.tar.gz (${(fs.statSync(path.join(out, 'dataset', slug + '.tar.gz')).size / 1048576).toFixed(1)} MB), kernel ${user}/${slug}-render, tier ${tier}${cfg.probe_only ? ', PROBE ONLY' : ''}.`);
