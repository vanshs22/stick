#!/usr/bin/env node
// The "did you actually look?" protocol for a style-matched film. After the render, compare the film with the style brief BY EYE, item by item.
//   node tools/reference/style_check.mjs <P> <refName> --template      writes review/style-check.json with every must-keep item and the twist to confirm
//   node tools/reference/style_check.mjs <P> <refName> --validate      refuses unfilled items; any item that is NOT in the film needs "fix" or "accept: <reason>"
// Open: the contact sheet (review/final*.jpg), review/style-frames/*.jpg (four frames of the film) and the reference image or keyframes.
import fs from 'node:fs';
import path from 'node:path';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), name = a[1], F = path.join(P, 'review/style-check.json'), B = path.join(P, 'references', name || '', 'style-brief.json');
if (!name || !fs.existsSync(B)) { console.error('usage: style_check.mjs <P> <refName> --template|--validate (needs a completed style brief)'); process.exit(2); }
const brief = JSON.parse(fs.readFileSync(B, 'utf8')), T = (s) => `TODO: ${s}`;
if (a.includes('--template')) {
  const frames = fs.existsSync(path.join(P, 'review/style-frames')) ? fs.readdirSync(path.join(P, 'review/style-frames')).filter((f) => /\.jpg$/.test(f)).map((f) => `review/style-frames/${f}`) : [];
  fs.mkdirSync(path.join(P, 'review'), { recursive: true });
  fs.writeFileSync(F, JSON.stringify({ status: 'pending', reference: name, looked_at: frames, inspected: [], must_keep: (brief.must_keep || []).map((item) => ({ item, seen: T('true | false'), note: T('where in the film you see it (shot id, frame), or what is missing') })), what_is_different_on_purpose: (brief.free_to_change || []).map((item) => ({ item, changed_to: T('what you changed it to') })), twist: { visible: T('true | false'), what: T('describe the twist as a viewer would see it in the first 5 seconds') }, brand_marks_checked: T('true: no logo, trademark or real person from the reference is in the film') }, null, 1));
  console.log(`wrote review/style-check.json. Open ${frames.join(', ') || 'review/style-frames/*.jpg (run critique.mjs <P> style first)'} and the contact sheet, then fill it and run --validate.`); process.exit(0);
}
if (a.includes('--validate')) {
  if (!fs.existsSync(F)) { console.error('run --template first'); process.exit(1); } const j = JSON.parse(fs.readFileSync(F, 'utf8')), bad = [];
  if (!(j.inspected || []).length) bad.push('inspected: list every image you opened');
  for (const m of j.must_keep || []) { if (typeof m.seen !== 'boolean') bad.push(`must_keep "${String(m.item).slice(0, 50)}": seen must be true or false`); else if (String(m.note || '').startsWith('TODO') || String(m.note || '').length < 6) bad.push(`must_keep "${String(m.item).slice(0, 50)}": write where you see it`); else if (!m.seen && !/^(fix|accept: .{8,})/i.test(m.decision || '')) bad.push(`must_keep "${String(m.item).slice(0, 50)}" is missing: add decision "fix" or "accept: <reason>"`); }
  for (const d of j.what_is_different_on_purpose || []) if (String(d.changed_to || '').startsWith('TODO') || String(d.changed_to || '').length < 4) bad.push(`different on purpose "${String(d.item).slice(0, 40)}": say what it is now`);
  if (typeof j.twist?.visible !== 'boolean' || String(j.twist?.what || '').startsWith('TODO') || String(j.twist?.what || '').length < 12) bad.push('twist: visible true/false and a real description');
  if (j.brand_marks_checked !== true && !/^true/.test(String(j.brand_marks_checked))) bad.push('brand_marks_checked: look for logos, trademarks, real people and set it to true');
  if (bad.length) { console.error(`style check NOT complete:\n- ${bad.join('\n- ')}`); process.exit(1); }
  const open = (j.must_keep || []).filter((m) => !m.seen && /^fix/i.test(m.decision || '')); j.status = open.length ? 'needs_fix' : 'done'; j.validated_at = new Date().toISOString(); fs.writeFileSync(F, JSON.stringify(j, null, 1));
  console.log(open.length ? `${open.length} must-keep item(s) marked "fix": fix them, re-render, then run --template again` : 'style check complete'); process.exit(open.length ? 1 : 0);
}
console.error('choose --template or --validate'); process.exit(2);
