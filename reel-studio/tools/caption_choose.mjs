#!/usr/bin/env node
// Chooses and tweaks the caption look for a project (skills/caption-chooser, foundation/playbooks/caption.json).
//   node tools/caption_choose.mjs <project> [--write] [--history <dir>]
// Ranks the playbook's presets by style pack, content type and emotion; tweaks position, scale and accent; refuses a look that repeats
// one of the last five projects (same preset + accent); prints the choice. --write saves captions/captions-choice.json, typography/captions.json
// and adds a `caption` micro-syntax string (keyword accents) to every script line that has none.
import fs from 'node:fs';
import path from 'node:path';
import { load } from './playbook.mjs';
import { autoCaption } from './lib/keywords.mjs';

export const PACK_LABEL = { 'sketchy-stickman': 'flat-stickman', 'cine-stickman': 'flat-stickman', 'facecam-overlay': 'face-overlay', 'doodle-explainer': 'split-host', 'neon-dashboard': 'board', 'editorial-notebook': 'board', 'roblox-inspired': 'roblox', 'voxel-explainer': 'roblox', 'voxel-studio': 'roblox', 'claude-minions': 'minion-3d', 'stylized-3d-presenter': 'minion-3d', 'stickman-3d': 'stickman-3d-world', 'stickman-world': 'stickman-3d-world', 'inkbeat': 'stickman-3d-world', 'two-faces': 'two-faces' };
const FEEL = { curious: 'calm', calm: 'calm', neutral: 'calm', whisper: 'calm', proud: 'calm', fear: 'tense', anger: 'tense', determined: 'tense', sad: 'tense', happy: 'funny', excited: 'funny', sarcastic: 'funny', shock: 'shocking' };
const LOUD = new Set(['excited', 'shock', 'anger', 'happy']);
const ACCENTS = ['#FFD400', '#7CFF4F', '#FF7A3D', '#4DE1FF', '#FF4D8D', '#B28DFF'];
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

export function infer(brief, script) {
  const lines = script.lines || [], text = lines.map((l) => l.text).join(' '), speakers = new Set(lines.map((l) => l.speaker).filter(Boolean));
  const content = brief.content_type || (speakers.size >= 2 ? 'dialogue' : (text.match(/\d/g) || []).length >= 6 ? 'numbers' : /\b(install|plugin|tool|skill|repo|prompt|setup|comment)\b/i.test(text) ? 'tutorial' : 'story');
  const tally = {}; for (const l of lines) { const f = FEEL[l.emotion] || 'calm'; tally[f] = (tally[f] || 0) + 1; }
  const emotion = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm', loud = lines.filter((l) => LOUD.has(l.emotion)).length / Math.max(1, lines.length);
  return { content, emotion, loud };
}
export function rank(pack, ctx) {
  const label = PACK_LABEL[pack] || pack;
  return load('caption').entries.filter((e) => e.parameters?.preset).map((e) => {
    const P = e.parameters; let s = 0; if (!e.styles) s += 0.5; else if (e.styles.includes(label)) s += 2; else s -= 2;
    if (P.content?.includes(ctx.content)) s += 1; if (P.emotion?.includes(ctx.emotion)) s += 1; return { id: e.id, preset: P.preset, zone: P.zone, score: s, entry: e };
  }).sort((a, b) => b.score - a.score);
}
export function choose(P, { history } = {}) {
  const brief = rd(path.join(P, 'brief.json'), {}), script = rd(path.join(P, 'script/script.json'), { lines: [] }), ctx = infer(brief, script), ranked = rank(brief.style_pack, ctx);
  const dir = history || path.dirname(path.resolve(P)), recent = fs.existsSync(dir) ? fs.readdirSync(dir).map((d) => path.join(dir, d)).filter((d) => path.resolve(d) !== path.resolve(P)).map((d) => ({ d, c: rd(path.join(d, 'captions/captions-choice.json')), t: fs.statSync(d).mtimeMs })).filter((x) => x.c).sort((a, b) => b.t - a.t).slice(0, 5) : [];
  const pal = rd(path.join(P, 'style-overrides.json'), {})?.colors?.accent || null; let pick = null, accent = null;
  search: for (const cand of ranked) for (const ac of [pal, ...ACCENTS].filter(Boolean)) if (!recent.some((r) => r.c.preset === cand.preset && r.c.accent === ac)) { pick = cand; accent = ac; break search; }
  if (!pick) { pick = ranked[0]; accent = ACCENTS[recent.length % ACCENTS.length]; }
  const zone = pick.zone, position = zone === 'seam' ? { anchor: 'custom', y: Math.round(1920 * 0.46) } : zone === 'upper' ? { anchor: 'middle', y: null } : { anchor: 'bottom', y: null };
  const scale = +(ctx.loud > 0.3 ? 1.1 : ctx.emotion === 'calm' ? 0.95 : 1).toFixed(2), weight = ctx.loud > 0.3 ? 800 : ctx.emotion === 'calm' ? 500 : 700;
  return { schema_version: 1, style_pack: brief.style_pack || null, content: ctx.content, emotion: ctx.emotion, entry: pick.id, preset: pick.preset, accent, weight, position, scale, signature: ctx.emotion === 'tense' ? 'ink-drip underline on the accent word' : 'none', differs_from: recent.map((r) => path.basename(r.d)), ranked: ranked.slice(0, 3).map((x) => `${x.id} ${x.score}`) };
}
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const a = process.argv.slice(2), P = a[0]; if (!P) { console.error('usage: caption_choose.mjs <project> [--write] [--history dir]'); process.exit(2); }
  const ch = choose(P, { history: a.includes('--history') ? a[a.indexOf('--history') + 1] : null }); console.log(JSON.stringify(ch, null, 1));
  if (a.includes('--write')) {
    const w = (f, v) => { fs.mkdirSync(path.dirname(path.join(P, f)), { recursive: true }); fs.writeFileSync(path.join(P, f), JSON.stringify(v, null, 1) + '\n'); };
    w('captions/captions-choice.json', ch); w('typography/captions.json', { preset: ch.preset, position: ch.position, scale: ch.scale, chosen_at: new Date().toISOString() });
    const bf = path.join(P, 'brief.json'), b = rd(bf, {}); b.captions = { ...(b.captions || {}), preset: ch.preset }; fs.writeFileSync(bf, JSON.stringify(b, null, 1) + '\n');
    const sf = path.join(P, 'script/script.json'), s = rd(sf); let n = 0; if (s) { const max = ch.preset === 'one-word' ? 1 : ch.preset === 'stroke-word' ? 2 : 3; for (const l of s.lines) if (!l.caption) { l.caption = autoCaption(l.text, { maxWords: max }); n++; } fs.writeFileSync(sf, JSON.stringify(s, null, 1) + '\n'); }
    console.error(`written: captions/captions-choice.json, typography/captions.json, brief.captions.preset=${ch.preset}, ${n} caption string(s) with keyword accents`);
  }
}
