#!/usr/bin/env node
// Free, licensed backgrounds and music with provenance. No key, no account: Wikimedia Commons for photos (originals with machine-readable licences) and Openverse for music (CC0 and public domain only).
//   node tools/assets/fetch.mjs image "<query>" --project <P> [--id bg/city] [--n 6] [--contact] [--pick 1 | --match "part of the title"]  photos for shot.bgImage (checked for sharpness at 1080x1920)
//   node tools/assets/fetch.mjs music "<query>" --project <P> [--id music/bed] [--n 4] [--pick 1]    a music file for audio-plan music.bed "file" (choose.mjs voice --music <path>)
// Every download is written to <P>/assets/manifest.json with licence, author, source page, date and sha256, so assets_review can refuse unlicensed files.
// CC0 / PDM only on purpose: no attribution burden, safe for any platform. Search results vary by day; --n lists candidates, --pick chooses the k-th that passes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const a = process.argv.slice(2), kind = a[0], q = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; }, P = path.resolve(opt('project', ''));
if (!['image', 'music'].includes(kind) || !q || !fs.existsSync(P)) { console.error('usage: fetch.mjs image|music "<query>" --project <P> [--id bg/city] [--n 4] [--pick 1]'); process.exit(2); }
const rest_contact = () => a.includes('--contact');
const UA = { 'User-Agent': 'reel-studio/2.1 (https://github.com/vanshs22/stick; open-source video toolkit; CC0 asset fetch)' }, n = +opt('n', 4), pick = +opt('pick', 1);
const get = async (u, o = {}) => { for (let k = 0; k < 4; k++) { try { const r = await fetch(u, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(60000), ...o }); if (r.status === 429 || r.status >= 500) { const ra = Number(r.headers.get('retry-after')) || 0; if (k < 3) await new Promise((s) => setTimeout(s, Math.min(40, ra || 6 * (k + 1)) * 1000)); throw new Error('HTTP ' + r.status); } return r; } catch (e) { if (k === 3) throw e; } } };
import { spawnSync } from 'node:child_process';
import './../lib/pipeline.mjs';
import { deliveryProfile } from '../lib/delivery.mjs';   // ffmpeg on PATH (the size of a download is MEASURED, never trusted from an API)
const px = (f) => { const m = spawnSync('ffmpeg', ['-hide_banner', '-i', f], { encoding: 'utf8' }).stderr.match(/Video: [^\n]*?, (\d{2,6})x(\d{2,6})/); return m ? [+m[1], +m[2]] : null; };
const FR = (() => { try { const d = deliveryProfile(P); return [d.width, d.height]; } catch { return [1080, 1920]; } })();
const fit = (w, h) => Math.max(FR[0] / w, FR[1] / h);   // scale needed to cover the project's frame (1080x1920 or 1920x1080): above 1 the photo is stretched (soft)
let cands;
if (kind === 'image') {   // Wikimedia Commons: original files with machine-readable licences; only CC0 and public domain
  const j = await (await get(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=300&format=json&origin=*`)).json();
  cands = Object.values(j.query?.pages || {}).map((p) => { const i = p.imageinfo?.[0], m = i?.extmetadata || {}, lic = m.LicenseShortName?.value || ''; return i && /^(CC0|Public domain|PD)/i.test(lic) && /jpeg|png/.test(i.mime) && Math.min(i.width, i.height) >= 1080 ? { title: p.title.replace(/^File:/, ''), w: i.width, h: i.height, license: lic, author: String(m.Artist?.value || 'unknown').replace(/<[^>]*>/g, '').trim(), page: i.descriptionurl, url: i.thumburl || i.url, thumb: i.thumburl, orig: i.url, mime: i.mime } : null; }).filter(Boolean).sort((x, y) => (opt('tall', '1') === '1' ? y.h / y.w - x.h / x.w : 0));
} else {
  const raw = await (await get(`https://api.openverse.org/v1/audio/?q=${encodeURIComponent(q)}&license=cc0,pdm&page_size=20`)).json(); if (!raw.results) { console.error('Openverse said: ' + JSON.stringify(raw).slice(0, 200)); process.exit(1); }
  cands = raw.results.filter((r) => r.url && r.duration >= 20000 && r.duration <= 240000).map((r) => ({ title: r.title, license: String(r.license).toUpperCase() + ' ' + (r.license_version || ''), author: r.creator || 'unknown', page: r.foreign_landing_url || r.url, url: r.url, secs: Math.round(r.duration / 1000), via: r.provider }));
}
if (!cands.length) { console.error(`no CC0 ${kind} found for "${q}". Try other words${kind === 'image' ? ' (or --tall 0)' : ''}.`); process.exit(1); }
console.log(`${cands.length} CC0 / public-domain ${kind} candidates for "${q}":`); cands.slice(0, n).forEach((r, i) => console.log(`  ${i + 1}. ${r.title.slice(0, 55)} | ${kind === 'image' ? `${r.w}x${r.h}, x${fit(r.w, r.h).toFixed(2)} to cover` : `${r.secs} s`} | ${r.author.slice(0, 24)} | ${r.license}`));
if (kind === 'image' && rest_contact()) {   // LOOK before you pick: numbered thumbnails side by side (left to right = 1, 2, 3 ...)
  const dir = path.join(P, 'review/candidates'); fs.mkdirSync(dir, { recursive: true }); const files = [];
  for (const [i, r] of cands.slice(0, n).entries()) { try { const b = Buffer.from(await (await get(r.thumb)).arrayBuffer()), f = path.join(dir, `${i + 1}.jpg`); fs.writeFileSync(f, b); if (px(f)) files.push(f); await new Promise((s) => setTimeout(s, 600)); } catch { /* skip this thumbnail */ } }
  if (files.length > 1) { const out = path.join(dir, `sheet-${Date.now()}.jpg`); const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', files.map((_, i) => `[${i}:v]scale=-2:420[v${i}]`).join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') + `hstack=inputs=${files.length}`, '-frames:v', '1', out], { encoding: 'utf8' }); if (!r.status) console.log(`candidate sheet (numbered left to right): ${path.relative(process.cwd(), out)}\nLook at it, then re-run with --pick <number>.`); }
  if (!a.includes('--pick')) process.exit(0);
}
const m = opt('match', ''), c = m ? cands.find((x) => x.title.toLowerCase().includes(m.toLowerCase())) : cands[pick - 1]; if (m && !c) { console.error(`no candidate whose title contains "${m}"`); process.exit(1); } if (!c) { console.error(`nothing at --pick ${pick}`); process.exit(1); }
const id = opt('id', `${kind === 'image' ? 'bg' : 'music'}/${q.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`);
if (kind === 'image') c.url = c.orig;   // the original (Wikimedia rate-limits generated thumbnails); downscaled locally below
const body = Buffer.from(await (await get(c.url)).arrayBuffer());
const ext = (kind === 'image' ? 'jpg' : c.mime ? 'jpg' : c.url.split('?')[0].split('.').pop() || 'mp3').toLowerCase().replace('jpeg', 'jpg'), rel = `${id}.${ext}`, file = path.join(P, 'assets', rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body);
let real = null; if (kind === 'image') { real = px(file); if (real && real[1] > 2400) { const t = file + '.small.jpg'; spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-vf', 'scale=-2:2400:flags=lanczos', '-q:v', '2', t]); if (fs.existsSync(t)) { fs.renameSync(t, file); real = px(file); } } if (!real) { fs.rmSync(file); console.error('the download is not an image'); process.exit(1); } if (fit(...real) > 1.15) console.error(`WARNING: the file is ${real.join('x')}, x${fit(...real).toFixed(2)} to cover 1080x1920: it will look soft. Pick another (--pick) or use it blurred behind a card (bgImage.blur).`); }
const mf = path.join(P, 'assets/manifest.json'), man = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : { assets: [] }; man.assets = man.assets.filter((x) => x.path !== rel);
man.assets.push({ id, type: kind === 'image' ? 'image' : 'audio', path: rel, source_url: c.page, license: c.license, author: c.author, captured_at: new Date().toISOString(), original: false, notes: `${c.title || ''}; via ${kind === 'image' ? 'Wikimedia Commons' : 'Openverse/' + (c.via || '')}; sha256 ${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16)}${real ? `; ${real.join('x')} (x${fit(...real).toFixed(2)} to cover 1080x1920)` : ''}` });
fs.writeFileSync(mf, JSON.stringify(man, null, 1));
if (kind === 'music') {   // music from a free library is often NOT music (drones, ambience, noise): vet it. earshot (if installed) says what it sounds like; otherwise only the length is known.
  const es = process.env.EARSHOT_BIN || process.env.EARSHOT_PY?.replace(/python[^/\\]*$/, 'earshot'); const r = es && fs.existsSync(es) ? spawnSync(es, ['describe', file], { encoding: 'utf8', timeout: 240000, env: { ...process.env, PATH: `${process.env.EARSHOT_PATH || ''}${path.delimiter}${process.env.PATH}` } }) : null, txt = r?.stdout || '';
  const musicScore = +(txt.match(/Music \(AudioSet Music ([\d.]+)\)/) || [])[1]; if (r && !r.status) { console.log(`earshot says: ${txt.split('\n')[0].slice(0, 220)}`); if (!(musicScore >= 0.6)) console.error(`WARNING: this does not read as music (AudioSet Music ${isNaN(musicScore) ? 'not found' : musicScore}): it sounds like noise or ambience. Pick another candidate (--pick), or write the reason you keep it.`); } else console.log('music not vetted: install earshot (tools/audio/earshot.mjs) to check that it is really music before you use it, and LISTEN to the clip.');
}
console.log(`\nsaved assets/${rel} (${(body.length / 1e6).toFixed(1)} MB), licence ${c.license}, by ${c.author}${real ? `, ${real.join('x')}` : ''}. In the storyboard: ${kind === 'image' ? `"bgImage": {"src": "assets/${rel}", "dim": 0.35}` : `node tools/choose.mjs <P> voice ... --music assets/${rel}`}`);
