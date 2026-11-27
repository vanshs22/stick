#!/usr/bin/env node
// Characters x and y (cut from the user's sheet) and the hand-drawn doodle overlay: sprites exist with real transparency, pose and mood pick the right sprite, doodle shapes are all drawn.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PY, run } from './lib/pipeline.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), T = path.join(TK, 'remotion-template'), bad = [], ok = (c, m) => { if (!c) bad.push(m); };
const { CHARACTERS, SPRITES, spriteFor } = await import(pathToFileURL(path.join(T, 'src/engine/character-map.js')).href);
ok(CHARACTERS.join() === 'x,y' && SPRITES.length === 7, 'characters must be x and y with 7 sprites');
const cases = [['idle', 'calm', false, 'neutral'], ['idle', 'calm', true, 'talking'], ['point', 'calm', false, 'pointing'], ['open', 'happy', true, 'explaining'], ['think', 'worried', false, 'thinking'], ['idle', 'surprised', true, 'surprised'], ['thumbs', 'happy', false, 'approval'], ['idle', 'happy', false, 'approval'], ['unknown', 'calm', false, 'neutral']];
for (const [p, m, t, want] of cases) ok(spriteFor(p, m, t) === want, `spriteFor(${p}, ${m}, ${t}) should be ${want}, got ${spriteFor(p, m, t)}`);
const files = CHARACTERS.flatMap((c) => SPRITES.map((s) => path.join(T, 'public/characters', c, `${s}.png`)));
ok(files.every((f) => fs.existsSync(f)), 'a sprite file is missing: ' + files.filter((f) => !fs.existsSync(f)).map((f) => path.basename(f)).join(', '));
const r = run(PY, ['-c', "import sys\nfrom PIL import Image\nbad=[]\nfor f in sys.argv[1:]:\n  im=Image.open(f)\n  a=im.convert('RGBA').getchannel('A'); w,h=im.size\n  if im.mode!='RGBA' or a.getpixel((2,2))!=0 or a.getpixel((w-3,2))!=0 or max(a.getpixel((w//2+d,h-k)) for d in (-20,0,20) for k in range(3,14))==0 or w<200: bad.append(f.split('/')[-2]+'/'+f.split('/')[-1])\nprint(','.join(bad))", ...files]);
ok(r.status === 0 && !r.stdout.trim(), 'sprites must be RGBA, transparent in the top corners, solid near the bottom centre: ' + (r.stdout || r.stderr).trim().slice(0, 160));
const O = fs.readFileSync(path.join(T, 'src/engine/Overlays.tsx'), 'utf8'), man = JSON.parse(fs.readFileSync(path.join(T, 'src/components/manifest.json'), 'utf8')).overlays.doodle || '';
const shapes = [...man.matchAll(/'(\w+)'/g)].map((m) => m[1]);
ok(shapes.length >= 10, 'manifest must list the doodle shapes');
for (const s of shapes) ok(new RegExp(`\\b${s}: \\[`).test(O), `doodle shape "${s}" is in the manifest but not drawn in Overlays.tsx`);
const P = fs.readFileSync(path.join(T, 'src/engine/Presenter.tsx'), 'utf8'); ok(/CHARACTERS\.includes\(P\.character\)/.test(P), 'Presenter must switch to a character sprite when presenter.character is x or y');
if (bad.length) { console.error('CHARACTERS SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log(`CHARACTERS SELFTEST PASSED: x and y, ${files.length} transparent sprites, pose/mood/speech pick the sprite, ${shapes.length} doodle shapes drawn`);
