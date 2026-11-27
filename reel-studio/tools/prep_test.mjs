#!/usr/bin/env node
// Prep test of a style, end to end with OUR skill: example project -> trimmed to about 10 s -> render (estimate timing, no voice) -> contact sheet ->
// logic / overlay / mood critics -> style DNA of the render -> numeric compare with the reference DNA. Writes prep-tests/<key>/{proof.mp4, contact.jpg, proof.dna.json, report.json}.
//   node tools/prep_test.mjs <key|all> [--tier preview|proof] [--words 28] [--out prep-tests]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, PY, run } from './lib/pipeline.mjs';
import { compare } from './reference/dna_compare.mjs';

const a = process.argv.slice(2), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d), table = JSON.parse(fs.readFileSync(path.join(TK, 'docs/styles/prep-tests.json'), 'utf8'));
delete table._doc; const keys = a[0] === 'all' ? Object.keys(table) : [a[0]];
if (!a[0] || keys.some((k) => !table[k])) { console.error(`usage: prep_test.mjs <${Object.keys(table).join('|')}|all> [--tier preview|proof] [--words 28] [--out dir]`); process.exit(2); }
const tier = opt('tier', 'preview'), words = Number(opt('words', 28)), OUT = path.resolve(opt('out', path.join(TK, 'prep-tests'))), env = { ...process.env, REEL_TEST_MODE: '1' };
const sh = (args, o = {}) => run('node', ['--no-warnings', ...args], { env, ...o });
const summary = [];
for (const key of keys) {
  const t = table[key], t0 = Date.now(), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prep-')), out = path.join(OUT, key); fs.mkdirSync(out, { recursive: true });
  console.log(`\n== ${key}: ${t.name} (example ${t.example}, tier ${tier})`);
  let r = sh([path.join(TK, 'tools/run_example.mjs'), t.example, key, '--dir', tmp]); if (r.status) { console.error('run_example failed: ' + (r.stderr || r.stdout).slice(-300)); summary.push({ key, ok: false, why: 'run_example failed' }); continue; }
  const P = path.join(tmp, key), rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')), wr = (f, v) => fs.writeFileSync(path.join(P, f), JSON.stringify(v, null, 1));
  const sc = rd('script/script.json'), sb = rd('storyboard/storyboard.json'), byId = Object.fromEntries(sc.lines.map((l) => [l.id, l])); let n = 0; const shots = [];
  for (const s of sb.shots) { if (n >= words) break; shots.push(s); n += s.line_ids.reduce((x, id) => x + byId[id].text.split(/\s+/).length, 0); }
  sb.shots = shots; const keep = new Set(shots.flatMap((s) => s.line_ids)); sc.lines = sc.lines.filter((l) => keep.has(l.id)); wr('script/script.json', sc); wr('storyboard/storyboard.json', sb);
  r = sh([path.join(TK, 'tools/build_video.mjs'), P, '--estimate', '--skip-readiness', '--tier', tier], { timeout: 3600000 });
  const mp4 = fs.existsSync(path.join(P, 'renders')) ? fs.readdirSync(path.join(P, 'renders')).filter((f) => f.endsWith('.mp4') && !/\.raw|\.4k|segments/.test(f)).map((f) => path.join(P, 'renders', f)).sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs)[0] : null;
  if (r.status || !mp4) { console.error('build failed:\n' + (r.stdout + r.stderr).slice(-600)); summary.push({ key, ok: false, why: 'build failed' }); continue; }
  fs.copyFileSync(mp4, path.join(out, 'proof.mp4'));
  const dur = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).stdout), fpsTile = (12 / dur).toFixed(3);
  run('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-vf', `fps=${fpsTile},scale=240:-2,tile=6x2`, '-frames:v', '1', path.join(out, 'contact.jpg')]);
  const critics = {}; for (const c of ['logic', 'overlays', 'mood']) { const cr = sh([path.join(TK, 'tools/critique.mjs'), P, c]); try { const j = rd(`review/critics/${c}.json`); critics[c] = { verdict: j.verdict, score: j.score, findings: j.findings.map((f) => `${f.severity}: ${f.problem}`) }; } catch { critics[c] = { verdict: 'not run', exit: cr.status }; } }
  const dnaFile = path.join(out, 'proof.dna.json'), d = run(PY, [path.join(TK, 'tools/reference/dna.py'), mp4, '--out', dnaFile]);
  let cmp = null; const refFile = path.join(TK, 'reference-library/dna', `${t.reference_dna}.dna.json`);
  if (!d.status && fs.existsSync(refFile)) cmp = compare(JSON.parse(fs.readFileSync(refFile, 'utf8')), JSON.parse(fs.readFileSync(dnaFile, 'utf8')));
  else console.log(d.status ? 'dna failed: ' + (d.stderr || '').slice(-200) : `no stored reference DNA yet (${path.basename(refFile)})`);
  const rep = { key, name: t.name, example: t.example, tier, duration_s: +dur.toFixed(1), shots: shots.length, built_in_s: Math.round((Date.now() - t0) / 1000), critics, compare: cmp ? { pass: cmp.pass, ok: cmp.rows.filter((x) => x.ok).length, total: cmp.rows.length, off: cmp.rows.filter((x) => !x.ok).map((x) => `${x.metric}: ref ${x.ref}, ours ${x.ours} (${x.tol})`) } : null, notes: ['Estimate timing, no voice: pace and captions follow estimated word times.', `Preview tier (${tier}) is small and half frame rate; judge the look on a proof or final render.`] };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(rep, null, 1)); summary.push({ key, ok: true, ...rep });
  console.log(`${key}: ${rep.duration_s} s, ${rep.shots} shots, built in ${rep.built_in_s} s | logic ${critics.logic.verdict} ${critics.logic.score ?? ''}, overlays ${critics.overlays.verdict}, mood ${critics.mood.verdict} | compare ${cmp ? `${rep.compare.ok}/${rep.compare.total} metrics match` : 'n/a'}`);
  fs.rmSync(tmp, { recursive: true, force: true });
}
fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 1));
console.log(`\n${summary.filter((s) => s.ok).length}/${summary.length} prep tests built -> ${path.relative(process.cwd(), OUT)}`);
process.exit(summary.every((s) => s.ok) ? 0 : 1);
