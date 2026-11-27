// Analyse the RENDERED video with the same OpenCV tool used for references (cached by file size+mtime).
import fs from 'node:fs';
import path from 'node:path';
import { TK, PY, run, rd } from '../lib/pipeline.mjs';
export function analyseRender(P) {
  const rdir = path.join(P, 'renders'), v = fs.existsSync(rdir) ? fs.readdirSync(rdir).filter((f) => /\.mp4$/.test(f) && !/raw|seg|\.4k\.mp4$/.test(f)).map((f) => path.join(rdir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] : null; if (!v) return null;
  const out = path.join(P, 'review/render-analysis'), key = `${fs.statSync(v).size}-${fs.statSync(v).mtimeMs}`, kf = path.join(out, '.key');
  if (!(fs.existsSync(kf) && fs.readFileSync(kf, 'utf8') === key && fs.existsSync(path.join(out, 'analysis.json')))) { fs.mkdirSync(out, { recursive: true }); const r = run(PY, [path.join(TK, 'tools/reference/analyze.py'), v, '--out', out, '--fps', '8']); if (r.status) throw new Error(r.stderr.slice(-400)); fs.writeFileSync(kf, key); }
  return { file: v, analysis: rd(path.join(out, 'analysis.json')) };
}
