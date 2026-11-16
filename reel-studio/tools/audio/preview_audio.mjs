#!/usr/bin/env node
// Audio gate previews: HEAR the narration, the music direction and the sound-effect palette before approving.
//   node tools/audio/preview_audio.mjs <P> [--voices am_michael,af_heart,bm_george,af_bella] [--speeds 1.0,1.1] [--lines 2] [--pron "ffmpeg=eff eff em peg"]
// Output (review/audio-preview/): voice-<voice>-<speed>.mp3, music-<bed|upbeat|tension|none>.mp3 (under the first voice), sfx-palette.mp3, index.md
// Then record the choice: node tools/choose.mjs <P> voice --voice af_heart --speed 1.05 --music upbeat --sfx soft
import fs from 'node:fs';
import path from 'node:path';
import { TK, PY, run, rd } from '../lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !fs.existsSync(path.join(P, 'script/script.json'))) { console.error('usage: preview_audio.mjs <projectDir> [--voices a,b] [--speeds 1.0,1.1] [--lines 2]'); process.exit(2); }
const out = path.join(P, 'review/audio-preview'); fs.mkdirSync(out, { recursive: true });
const script = rd(path.join(P, 'script/script.json')), text = script.lines.slice(0, +opt('lines', 2)).map((l) => l.text).join(' ');
const voices = opt('voices', 'am_michael,af_heart,bm_george,af_bella'), speeds = opt('speeds', '1.0'), env = { ...process.env };
let r = run(PY, [path.join(TK, 'tools/audio/preview_voices.py'), '--out', out, '--text', text, '--voices', voices, '--speeds', speeds, '--pron', opt('pron', '')], { env }); if (r.status) { console.error(r.stderr.slice(-600)); process.exit(1); }
const lines = r.stdout.trim().split('\n'), mp3 = (wav) => { const m = wav.replace(/\.wav$/, '.mp3'); const f = run('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-b:a', '128k', m]); return f.status ? wav : m; };
const first = voices.split(',')[0], firstSpeed = speeds.split(',')[0], narr = path.join(out, `voice-${first}-${firstSpeed}.wav`);
// music beds and the effect palette go through the REAL mixer (tools/audio/mix.py), so what you hear is what the video gets
const mixIn = (name, music, cues) => { const d = path.join(out, '_mix-' + name); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(path.join(d, 'data'), { recursive: true }); const dur = +(run('ffmpeg', ['-i', narr, '-hide_banner'], {}).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/)?.slice(1).reduce((s, v, i) => s + +v * [3600, 60, 1][i], 0) || 8).toFixed(2); fs.copyFileSync(narr, path.join(d, 'data/narration.wav')); fs.writeFileSync(path.join(d, 'data/cues.json'), JSON.stringify({ duration: dur + 1.5, cues: cues || [] })); fs.writeFileSync(path.join(d, 'script.json'), JSON.stringify({ music })); const m = run(PY, [path.join(TK, 'tools/audio/mix.py'), d], { env }); if (m.status) throw new Error(m.stderr.slice(-300)); const dst = path.join(out, name + '.wav'); fs.copyFileSync(path.join(d, 'data/mix.wav'), dst); fs.rmSync(d, { recursive: true, force: true }); return mp3(dst); };
const files = [...lines.map((l) => l.split(' ')[0]).filter((f) => f.endsWith('.wav')).map((f) => mp3(path.join(out, f)))];
const music = ['bed', 'upbeat', 'tension', 'none'].map((m) => mixIn('music-' + m, m)), sfxTypes = ['pop', 'whoosh', 'swish', 'type', 'ding', 'sparkle', 'thud', 'stamp', 'tick', 'boing'];
const sfx = mixIn('sfx-palette', 'none', sfxTypes.map((t, i) => ({ t: 0.4 + i * 0.75, type: t, gain: 0.8 })));
for (const f of fs.readdirSync(out)) if (f.endsWith('.wav') && fs.existsSync(path.join(out, f.replace('.wav', '.mp3')))) fs.rmSync(path.join(out, f));
fs.writeFileSync(path.join(out, 'index.md'), `# Audio previews\n\nNarration sample: "${text}"\n\n## Voices\n${lines.map((l, i) => `${i + 1}. ${l.replace('.wav', '.mp3')}`).join('\n')}\n\n## Music direction (under the first voice)\n${['bed (calm pad + arpeggio)', 'upbeat', 'tension (drone + pulse)', 'none'].map((m, i) => `${i + 1}. music-${m.split(' ')[0]}.mp3: ${m}`).join('\n')}\n\n## Sound-effect palette\nsfx-palette.mp3 plays: ${sfxTypes.join(', ')}. Every effect in the video is tied to a visual event (word anchor, reveal, transition) and listed with its reason in data/cues.json.\n\nChoose: node tools/choose.mjs <P> voice --voice <id> --speed <x> --music <bed|upbeat|tension|none> --sfx <soft|none|punchy> [--pron "word=spoken form;..."]\n`);
console.log(`${files.length} voice samples, ${music.length} music directions, 1 sfx palette in ${out}\n${lines.join('\n')}`);
