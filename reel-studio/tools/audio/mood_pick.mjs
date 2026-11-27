#!/usr/bin/env node
// Music by story: reads script/script.json, groups lines by beat (in order), averages the line emotions (valence, arousal)
// and picks the nearest music mood per beat, with a tempo from the arousal and a genre hint.
//   node tools/audio/mood_pick.mjs <project> [--write]      --write stores music_by_beat in audio/audio-plan.json
// The plan feeds tools/audio/library.mjs (query) and music_lab.py (genre@bpm). The mood critic then checks the fit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), EMO = JSON.parse(fs.readFileSync(path.join(HERE, '../../remotion-template/src/three/emotion-data.json'), 'utf8'));
const GENRE = { tense: 'phonk', curious: 'lofi', playful: 'house', warm: 'lofi', epic: 'cinematic', sad: 'cinematic', eerie: 'cinematic', triumphant: 'corporate', calm: 'lofi', chaotic: 'trap' };

export function pickMusic(script) {
  const order = [], by = {};
  for (const l of script.lines) { if (!l.beat) continue; if (!by[l.beat]) { by[l.beat] = []; order.push(l.beat); } if (EMO.emotions[l.emotion]) by[l.beat].push(EMO.emotions[l.emotion]); }
  return order.filter((b) => by[b].length).map((beat) => {
    const v = by[beat].reduce((a, x) => a + x[0], 0) / by[beat].length, a = by[beat].reduce((s, x) => s + x[1], 0) / by[beat].length;
    const [mood] = Object.entries(EMO.music_moods).map(([m, [mv, ma]]) => [m, Math.hypot(mv - v, (ma - a) * 0.6)]).sort((x, y) => x[1] - y[1])[0];
    const bpm = Math.round((70 + a * 70) / 2) * 2, genre = GENRE[mood];
    return { beat_id: beat, mood, bpm, genre, energy: +a.toFixed(2), source: 'music_lab', query: `${genre}@${bpm}`, duck_db: 4 + Math.round(a * 3) };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href && process.argv[2]) {
  const P = path.resolve(process.argv[2]), sc = JSON.parse(fs.readFileSync(path.join(P, 'script/script.json'), 'utf8')), plan = pickMusic(sc);
  if (!plan.length) { console.error('no script line has both a beat and an emotion: nothing to pick from'); process.exit(1); }
  for (const b of plan) console.log(`${b.beat_id.padEnd(14)} ${b.mood.padEnd(11)} ${String(b.bpm).padStart(3)} bpm  ${b.query}  energy ${b.energy}`);
  if (process.argv.includes('--write')) { const f = path.join(P, 'audio/audio-plan.json'); let ap = {}; try { ap = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* new plan */ } ap.music_by_beat = plan; fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(ap, null, 1)); console.log(`written to ${path.relative(P, f)}`); }
}
