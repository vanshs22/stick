#!/usr/bin/env node
// Style-reference chain check: an unfilled brief is refused, the worked example passes, the map picks the right pack and admits its gaps, the style critic demands a twist and a by-eye check.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PY } from './lib/pipeline.mjs';
const T = path.dirname(fileURLToPath(import.meta.url)), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'style-')), P = path.join(tmp, 'p'), R = path.join(P, 'references/r1');
fs.mkdirSync(R, { recursive: true }); fs.writeFileSync(path.join(R, 'analysis.json'), JSON.stringify({ kind: 'image', source: 'x' }));
const node = (s, ...a) => spawnSync('node', [path.join(T, s), ...a], { encoding: 'utf8' });
// a measurable synthetic frame: sharp warm centre, blurred cool edges, a vignette
const img = path.join(R, 'source.png'), mk = spawnSync(PY, ['-c', `import cv2,numpy as np;h,w=640,480;y,x=np.mgrid[0:h,0:w];im=np.zeros((h,w,3),np.uint8);im[...,2]=np.clip(120+x*0.2,0,255);im[...,0]=np.clip(200-x*0.25,0,255);im=cv2.GaussianBlur(im,(0,0),9);c=np.random.RandomState(1).randint(0,255,(200,200,3),np.uint8);im[220:420,140:340]=c;vig=1-0.5*(((x-w/2)/(w/2))**2+((y-h/2)/(h/2))**2);im=(im*np.clip(vig,0.2,1)[...,None]).astype(np.uint8);cv2.imwrite(r'${img.replace(/\\/g, '/')}',im)`], { encoding: 'utf8' }); assert.equal(mk.status, 0, mk.stderr);
let r = node('reference/style_brief.mjs', P, 'r1', '--template'); assert.equal(r.status, 0, r.stderr + r.stdout); const brief = JSON.parse(fs.readFileSync(path.join(R, 'style-brief.json'), 'utf8'));
assert.ok(brief.measured.background_blur_ratio < 0.5, `a sharp centre on a blurred ring reads as shallow depth of field (${brief.measured.background_blur_ratio})`); assert.ok(brief.measured.vignette > 0.15, 'the vignette is measured');
r = node('reference/style_brief.mjs', P, 'r1', '--validate'); assert.notEqual(r.status, 0, 'an unfilled brief must be refused'); assert.match(r.stderr, /NOT complete/);
const ex = JSON.parse(fs.readFileSync(path.join(T, '../skills/reference-style/example-podcast-3d.style-brief.json'), 'utf8')); ex.status = 'pending'; ex.reference = 'r1'; fs.writeFileSync(path.join(R, 'style-brief.json'), JSON.stringify(ex));
const vague = JSON.parse(JSON.stringify(ex)); vague.character.eyes.shape = 'nice'; fs.writeFileSync(path.join(R, 'style-brief.json'), JSON.stringify(vague)); r = node('reference/style_brief.mjs', P, 'r1', '--validate'); assert.notEqual(r.status, 0, 'a vague one-word description must be refused'); assert.match(r.stderr, /vague/);
fs.writeFileSync(path.join(R, 'style-brief.json'), JSON.stringify(ex)); r = node('reference/style_brief.mjs', P, 'r1', '--validate'); assert.equal(r.status, 0, r.stderr);
r = node('reference/style_map.mjs', P, 'r1'); assert.equal(r.status, 0, r.stderr); const map = JSON.parse(fs.readFileSync(path.join(R, 'style-map.json'), 'utf8'));
assert.equal(map.closest_pack, 'stylized-3d-presenter'); assert.ok(map.fidelity.some((f) => /hair/.test(f.element) && f.level === 'cannot'), 'volumetric hair is admitted as impossible'); assert.ok(map.needs_build.some((n) => /neon|monitor|microphone/.test(n.item)), 'set objects the engine lacks are listed'); assert.equal(map.overrides.defaults.stage3d.cast.human.skin, '#E6B28C');
r = node('reference/style_check.mjs', P, 'r1', '--template'); assert.equal(r.status, 0); r = node('reference/style_check.mjs', P, 'r1', '--validate'); assert.notEqual(r.status, 0, 'an unfilled style check must be refused');
const { makeTwist } = await import(pathToFileURL(path.join(T, 'lib/twist.mjs')).href); const tw = makeTwist({ kind: 'image' }, 'Same soft night-studio look with a new baker character and a teal palette.', 'r1'); assert.deepEqual(tw.style_levers.map((l) => l.id), ['palette_shift', 'character_swap']); assert.throws(() => makeTwist({ kind: 'image' }, 'Same soft night-studio look with a new baker character.', 'r1', 6, ['nope']), /unknown style lever/);
console.log('STYLE SELFTEST PASSED: measured blur and vignette, unfilled and vague briefs refused, example brief accepted, map picks stylized-3d-presenter and admits the hair gap, style check refuses blanks, image twists get style levers');
