#!/usr/bin/env node
// Cinematography critic. Reads storyboard shots that use Stage3D and checks, with the SAME camera maths the renderer uses:
//   per shot  : valid framing/angle/movement names; every movement says WHY and gives from/to/target/duration/profile/curve/focus/constraints;
//               the movement really does what its name says; speed limits; the subject stays in the safe frame at start, middle and end
//   per cut   : jump cuts, axis crossing, screen-direction flips, character/prop position continuity, match cuts, motivated transitions
//   per film  : camera-move ratio, same move twice in a row
// It rejects unnecessary movement. It does NOT enforce a cut rate: a shot may hold still for as long as the story needs.
//   node tools/check_cinematography.mjs <projectDir> [--out review/cinematography-critic.json]
// Output: a critic-report (schemas/critic-report.schema.json) + exit 1 on any blocker/major finding.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TK = path.join(HERE, '..');
const cinema = await import(pathToFileURL(path.join(TK, 'remotion-template/src/three/cinema.js')).href);
const { FRAMINGS, ANGLES, MOVEMENTS, PROFILES, CURVES, cameraAt, project, solvePose } = cinema;
const DATA = JSON.parse(fs.readFileSync(path.join(TK, 'remotion-template/src/three/cast-data.json'), 'utf8'));

const P = process.argv[2]; if (!P) { console.error('usage: check_cinematography.mjs <projectDir> [--out file]'); process.exit(2); }
const outArg = process.argv.indexOf('--out'), outFile = outArg > 0 ? process.argv[outArg + 1] : path.join(P, 'review/cinematography-critic.json');
const sb = JSON.parse(fs.readFileSync(path.join(P, 'storyboard/storyboard.json'), 'utf8'));
let tl = null; try { tl = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')); } catch { /* estimate */ }
const EST = !tl, sev = (x) => (EST ? 'minor' : x);   // before voice timing exists, shot lengths are guesses: timing findings are only advisory
const dur = (s) => { const t = tl?.shots?.find((x) => x.id === s.id); return t ? t.end - t.start : 2.5; };

const F = []; let n = 0;
const add = (severity, shot, problem, evidence, expected, fix, extra = {}) => F.push({ id: `C${String(++n).padStart(2, '0')}`, severity, shot_id: shot, problem, evidence, expected, fix, fix_target: 'storyboard', ...extra });
const GENERIC = /\b(dynamic|dynamism|energy|energetic|interesting|engaging|keep(s)? (it |things )?(moving|alive|fresh)|more movement|spice|cinematic feel|looks? (cool|nice)|for variety|add motion|visual interest)\b/i;
const D2R = Math.PI / 180;

function subjectsOf(s) {
  const out = { ...(DATA.worlds[s.props?.world] || {}) };
  for (const c of s.props?.cast || []) { const at = c.at || [0, 0]; out[c.id] = { pos: [at[0], c.y || 0, at[1]], height: (DATA.heights[c.kind || 'human'] || 1.8) * (c.scale || 1), rotY: c.rotY || 0 }; }
  for (const p of s.props?.props3d || []) { const at = p.at || [0, 0, 0]; out[p.id] = { pos: at, height: (DATA.heights[p.kind] || 0.4) * (p.scale || 1), rotY: p.rotY || 0 }; }
  return out;
}
const stage = sb.shots.filter((s) => s.component === 'Stage3D');
for (const s of sb.shots) if (s.component === 'Scene3D') add('minor', s.id, 'legacy Scene3D shot', 'Scene3D uses primitive characters', 'Stage3D with a cinematography spec', 'Rebuild this shot with Stage3D (see docs/CINEMATOGRAPHY.md)');

const cams = {};   // per shot: {start, mid, end, subjects, spec}
let moves = 0, prevMove = null;
for (const s of stage) {
  const spec = s.props?.camera, d = dur(s), subj = subjectsOf(s);
  if (!spec) { add('blocker', s.id, 'no camera specification', 'props.camera is missing', 'framing + angle + subject (+ movement)', 'Add props.camera'); continue; }
  if (!FRAMINGS[spec.framing]) { add('blocker', s.id, 'unknown framing', `"${spec.framing}"`, Object.keys(FRAMINGS).join(', '), 'Use a supported framing'); continue; }
  if (spec.angle && !ANGLES[spec.angle]) add('blocker', s.id, 'unknown camera angle', `"${spec.angle}"`, Object.keys(ANGLES).join(', '), 'Use a supported angle');
  const refs = [spec.subject, spec.target, spec.movement?.target, spec.focus?.target, spec.movement?.focus?.target].filter((x) => typeof x === 'string');
  for (const r of refs) if (!subj[r]) add('blocker', s.id, 'camera refers to something that is not in the shot', `"${r}"`, `one of: ${Object.keys(subj).join(', ')}`, 'Add it to cast/props3d or fix the name');
  const mv = spec.movement || { type: 'static' }, type = mv.type || 'static';
  if (!MOVEMENTS.includes(type)) { add('blocker', s.id, 'unknown camera movement', `"${type}"`, MOVEMENTS.join(', '), 'Use a supported movement'); continue; }
  const badF = [mv.from?.framing, mv.to?.framing].filter((f) => f && !FRAMINGS[f]); if (badF.length) { add('blocker', s.id, 'camera movement uses an unknown framing', badF.map((f) => `"${f}"`).join(', '), Object.keys(FRAMINGS).join(', '), 'Use a supported framing in movement.from / movement.to'); continue; }
  let c0, c1, cm; try { c0 = cameraAt(spec, subj, 0, d); cm = cameraAt(spec, subj, d / 2, d); c1 = cameraAt(spec, subj, d, d); } catch (e) { add('blocker', s.id, 'camera cannot be solved', e.message, 'valid subjects and poses', 'Fix the camera spec'); continue; }
  cams[s.id] = { c0, cm, c1, subj, spec, d };
  if (type !== 'static') {
    moves++;
    const why = String(mv.why || '').trim();
    if (why.length < 40) add('major', s.id, 'camera movement has no reason', `why = "${why}"`, 'a sentence naming the story reason (what the move reveals, follows or emphasises) of at least 40 characters', 'Write the reason, or remove the movement');
    else if (GENERIC.test(why)) add('major', s.id, 'camera movement is justified only by "make it look busy"', `why = "${why}"`, 'a story reason: what changes for the viewer because of this move', 'Replace the reason with the real motivation, or make the shot static');
    for (const k of ['to', 'target', 'duration', 'profile', 'curve']) if (mv[k] == null && !(k === 'to' && ['handheld', 'focus-pull', 'rack-focus', 'subject-follow'].includes(type)) && !(k === 'target' && mv.focus?.target)) add('major', s.id, `movement is missing "${k}"`, JSON.stringify(mv).slice(0, 120), `${k} specified`, `Add movement.${k}`);
    if (!mv.focus && !spec.focus) add('major', s.id, 'movement has no focus plan', 'no focus', 'focus.target (+ aperture)', 'Add focus: {target, aperture}');
    if (!(mv.constraints?.length || spec.constraints?.length)) add('major', s.id, 'movement has no composition constraints', 'constraints missing', 'at least one constraint the framing must keep', 'Add constraints');
    if (mv.profile && !PROFILES.includes(mv.profile)) add('major', s.id, 'unknown speed profile', mv.profile, PROFILES.join(', '), 'Fix profile');
    if (mv.curve && !CURVES.includes(mv.curve)) add('major', s.id, 'unknown easing curve', mv.curve, CURVES.join(', '), 'Fix curve');
    const md = mv.duration === 'shot' || mv.duration == null ? d - (mv.start || 0) : mv.duration;
    if (md < 0.8 && type !== 'handheld') add(sev('major'), s.id, 'movement is too short to be read', `${md.toFixed(2)} s`, 'at least 0.8 s (a whip needs its own declaration)', 'Lengthen it or cut instead');
    if ((mv.start || 0) + md > d + 0.15) add('minor', s.id, 'movement outlasts the shot (it will be compressed to fit)', `${((mv.start || 0) + md).toFixed(2)} s in a ${d.toFixed(2)} s shot`, 'start + duration <= shot length', 'Shorten the movement');
    const tr = Math.hypot(c1.pos[0] - c0.pos[0], c1.pos[1] - c0.pos[1], c1.pos[2] - c0.pos[2]), speed = tr / Math.max(0.01, md);
    // the movement must do what its name says
    const fa = FRAMINGS[spec.framing].V * (mv.from?.distScale ?? spec.distScale ?? 1), fb = FRAMINGS[mv.to?.framing || spec.framing].V * (mv.to?.distScale ?? 1);
    if (type === 'dolly-push' && !(fb < fa - 0.01)) add('major', s.id, 'dolly-push does not get closer', `${spec.framing} -> ${mv.to?.framing || spec.framing} x${mv.to?.distScale ?? 1}`, 'to.framing tighter than the start framing, or to.distScale < 1', 'Use dolly-pull / another type, or fix to');
    if (type === 'dolly-pull' && !(fb > fa + 0.01)) add('major', s.id, 'dolly-pull does not get wider', `${spec.framing} -> ${mv.to?.framing || spec.framing}`, 'to.framing wider than the start framing', 'Fix to.framing');
    if (type === 'orbit') { const a0 = mv.from?.az ?? ANGLES[spec.angle || 'eye-level'].az, a1 = mv.to?.az; if (a1 == null || Math.abs(a1 - a0) < 8) add('major', s.id, 'orbit does not go around anything', `az ${a0} -> ${a1}`, 'to.az differs from the start azimuth by at least 8 degrees', 'Set to.az'); else if (Math.abs(a1 - a0) > 45) add('minor', s.id, 'wide orbit', `${Math.abs(a1 - a0)} degrees`, 'orbits above 45 degrees need a strong reason (a reveal)', 'Reduce the arc or say why in "why"'); if (Math.abs(a1 - a0) / md > 22) add(sev('major'), s.id, 'orbit is too fast', `${(Math.abs(a1 - a0) / md).toFixed(1)} deg/s`, '<= 22 deg/s', 'Lengthen the movement'); }
    const avgDist = (Math.hypot(...[0, 1, 2].map((k) => c0.pos[k] - c0.look[k])) + Math.hypot(...[0, 1, 2].map((k) => c1.pos[k] - c1.look[k]))) / 2, rel = tr / Math.max(0.3, avgDist) / md;
    if (['dolly-push', 'dolly-pull', 'tracking', 'crane', 'pedestal'].includes(type) && (rel > 0.22 || speed > 2.0)) add(sev('major'), s.id, 'camera moves too fast to read', `${speed.toFixed(2)} m/s = ${(rel * 100).toFixed(0)} percent of the subject distance per second`, '<= 22 percent of the subject distance per second and <= 2 m/s', 'Lengthen the movement or shorten the distance');
    if (['pan', 'tilt'].includes(type)) { const a = [c0.look, c1.look].map((l) => Math.atan2(l[0] - c0.pos[0], l[2] - c0.pos[2])), pitch = [c0.look, c1.look].map((l) => Math.atan2(l[1] - c0.pos[1], Math.hypot(l[0] - c0.pos[0], l[2] - c0.pos[2]))); const dd = Math.max(Math.abs(a[1] - a[0]), Math.abs(pitch[1] - pitch[0])) / D2R; if (dd < 2) add('major', s.id, `${type} does not turn the camera`, `${dd.toFixed(1)} degrees`, 'a visible change of direction', 'Change to.offset / to.subject'); if (dd / md > 28) add(sev('major'), s.id, `${type} is too fast`, `${(dd / md).toFixed(1)} deg/s`, '<= 28 deg/s', 'Lengthen the movement'); }
    if (type === 'crane' && Math.abs((mv.to?.el ?? 0) - (mv.from?.el ?? ANGLES[spec.angle || 'eye-level'].el)) < 6 && Math.abs(c1.pos[1] - c0.pos[1]) < 0.3) add('major', s.id, 'crane does not change height', `dy ${(c1.pos[1] - c0.pos[1]).toFixed(2)} m`, 'a visible height change', 'Set to.el');
    if (type === 'pedestal' && Math.abs(c1.pos[1] - c0.pos[1]) < 0.12) add('major', s.id, 'pedestal does not change height', `dy ${(c1.pos[1] - c0.pos[1]).toFixed(2)} m`, 'a visible height change', 'Change to.offset or to.cy');
    if (type === 'handheld' && (mv.amplitude_cm ?? 0.8) > 1.5) add('major', s.id, 'handheld is too shaky', `${mv.amplitude_cm} cm`, '<= 1.5 cm (it is controlled handheld)', 'Lower amplitude_cm');
    if (['focus-pull', 'rack-focus'].includes(type) && !(mv.focus?.from && mv.focus?.to)) add('major', s.id, `${type} needs two focus targets`, JSON.stringify(mv.focus || {}), 'focus.from and focus.to', 'Add focus.from / focus.to');
    if (type === 'subject-follow' && !(s.props.cast || []).some((c) => c.walk && c.id === spec.subject)) add('major', s.id, 'subject-follow but the subject does not move', `subject ${spec.subject}`, 'the followed character walks (cast.walk)', 'Add walk or use a static shot');
    if (prevMove === type) add('major', s.id, 'same camera movement twice in a row', type, 'consecutive moves differ, or one of them is not needed', 'Make one of the shots static');
    prevMove = type;
  } else prevMove = null;
  // composition: the focus subject must be in the safe frame at start / middle / end
  const fsId = typeof spec.focus?.target === 'string' ? spec.focus.target : typeof spec.subject === 'string' ? spec.subject : null;
  if (fsId && subj[fsId] && spec.framing !== 'insert') for (const [lab, c] of [['start', c0], ['middle', cm], ['end', c1]]) {
    const sj = subj[fsId], pt = project([sj.pos[0], sj.pos[1] + sj.height * (['close-up', 'extreme-close-up', 'medium-close-up'].includes(spec.framing) ? 0.9 : 0.55), sj.pos[2]], c);
    if (!pt.front) { add('blocker', s.id, 'focus subject is behind the camera', lab, 'in front of the camera', 'Fix the camera pose'); break; }
    if (pt.x < 0.05 || pt.x > 0.95 || pt.y < 0.08 || pt.y > 0.92) { add('major', s.id, 'focus subject leaves the safe frame', `${lab}: x ${pt.x.toFixed(2)} y ${pt.y.toFixed(2)}`, 'x 0.05-0.95, y 0.08-0.92', 'Adjust offset/framing', { timestamp_sec: lab === 'start' ? 0 : lab === 'middle' ? d / 2 : d }); break; }
  }
  const cons = [...(spec.constraints || []), ...(mv.constraints || [])].map(String);
  // default composition rule: in wide/medium framings of a character the HEAD must not be cut by the frame (close-ups, inserts and over-the-shoulder may crop on purpose). Opt out with a constraint "allow head crop".
  if (spec.subject && subj[spec.subject] && !['close-up', 'extreme-close-up', 'medium-close-up', 'insert', 'over-the-shoulder', 'ots'].includes(spec.framing) && !cons.some((x) => /allow.?head.?crop/i.test(x)) && (s.props?.cast || []).some((q) => q.id === spec.subject)) for (const [lab, c] of [['start', c0], ['middle', cm], ['end', c1]]) { const sj = subj[spec.subject], head = project([sj.pos[0], sj.pos[1] + sj.height * 0.99, sj.pos[2]], c); if (head.y < 0.0) { add('major', s.id, 'the head is cut by the top of the frame', `${lab}: top of the head at y ${head.y.toFixed(2)} (framing ${spec.framing})`, 'head inside the frame, or a close-up/over-the-shoulder framing chosen on purpose', 'Pull the camera back, lower the offset, or use a close-up framing; add the constraint "allow head crop" only if it is deliberate', { timestamp_sec: lab === 'start' ? 0 : lab === 'middle' ? d / 2 : d }); break; } }
  if (cons.some((x) => /no.?crop.?head|both eyes|face stays/i.test(x)) && spec.subject && subj[spec.subject]) for (const [lab, c] of [['start', c0], ['end', c1]]) { const sj = subj[spec.subject], head = project([sj.pos[0], sj.pos[1] + sj.height * 0.97, sj.pos[2]], c); if (head.y < 0.02) add('major', s.id, 'constraint broken: the head is cropped', `${lab}: head at y ${head.y.toFixed(2)}`, 'head inside the frame', 'Lower the framing or add headroom'); }
}

// ───────── cuts ─────────
const ids = stage.map((s) => s.id);
for (let i = 1; i < stage.length; i++) {
  const a = stage[i - 1], b = stage[i], ca = cams[a.id], cb = cams[b.id]; if (!ca || !cb) continue;
  if (sb.shots.indexOf(b) !== sb.shots.indexOf(a) + 1) continue;     // another shot in between (a cutaway): continuity is reset
  const sameWorld = a.props.world === b.props.world && JSON.stringify(a.props.worldOpts || {}) === JSON.stringify(b.props.worldOpts || {});
  const A = ca.spec, B = cb.spec, azA = A.az ?? ANGLES[A.angle || 'eye-level'].az, azB = B.az ?? ANGLES[B.angle || 'eye-level'].az;
  if (sameWorld && A.framing === B.framing && A.subject === B.subject && Math.abs(azA - azB) < 30 && !b.match_cut) add('major', b.id, 'jump cut: same framing, subject and nearly the same angle as the previous shot', `${a.id} -> ${b.id}: ${A.framing} / ${B.framing}, azimuth ${azA} -> ${azB}`, 'change the framing by at least one step, or the angle by 30 degrees or more (30-degree rule), or declare a match cut', 'Change framing/angle');
  if (sameWorld && A.subject === B.subject && A.subject && Math.sign(azA) !== Math.sign(azB) && Math.abs(azA) > 12 && Math.abs(azB) > 12) add('major', b.id, 'camera crosses the axis of action', `${a.id} az ${azA} -> ${b.id} az ${azB}`, 'keep the camera on the same side of the subject between cuts, or insert a neutral shot on the axis', 'Mirror the angle or add a neutral shot');
  // screen direction of the subject: sign of its facing projected on the camera's right vector
  const dirOf = (c, sid, cam) => { const sj = c.subj[sid]; if (!sj) return 0; const f = [Math.sin(sj.rotY), 0, Math.cos(sj.rotY)], fw = [cam.look[0] - cam.pos[0], 0, cam.look[2] - cam.pos[2]], l = Math.hypot(...fw) || 1, r = [fw[2] / l, 0, -fw[0] / l]; return f[0] * r[0] + f[2] * r[2]; };
  const sid = ca.spec.subject, same = typeof sid === 'string' && sid === cb.spec.subject && ca.subj[sid]?.kind !== 'giftbox';
  if (sameWorld && same && ca.subj[sid] && cb.subj[sid]) { const da = dirOf(ca, sid, ca.c1), db = dirOf(cb, sid, cb.c0); if (Math.abs(da) > 0.3 && Math.abs(db) > 0.3 && Math.sign(da) !== Math.sign(db) && Math.abs(ca.subj[sid].rotY - cb.subj[sid].rotY) < 0.3) add('major', b.id, 'screen direction flips across the cut', `${a.id}: subject faces ${da > 0 ? 'screen-left' : 'screen-right'}, ${b.id}: ${db > 0 ? 'screen-left' : 'screen-right'} while it does not turn`, 'the subject keeps looking/moving the same way on screen unless it turns in the shot', 'Mirror the angle or let the character turn on screen'); }
  // character continuity
  for (const c of b.props.cast || []) { const p = (a.props.cast || []).find((x) => x.id === c.id); if (p && sameWorld) { const d0 = Math.hypot((p.at?.[0] ?? 0) - (c.at?.[0] ?? 0), (p.at?.[1] ?? 0) - (c.at?.[1] ?? 0)); if (d0 > 0.6 && !(p.walk || c.walk)) add('major', b.id, 'character jumps to a different position between shots', `${c.id}: ${a.id} at ${JSON.stringify(p.at)}, ${b.id} at ${JSON.stringify(c.at)}`, 'same position unless the character walks', 'Keep the position or add a walk'); if (p.kind !== c.kind || JSON.stringify(p.look || {}) !== JSON.stringify(c.look || {})) add('major', b.id, 'character looks different from the previous shot', `${c.id}`, 'identical kind and look in every shot of the scene', 'Use the same look object'); } }
  for (const p of b.props.props3d || []) { const q = (a.props.props3d || []).find((x) => x.id === p.id); if (q && sameWorld && Math.hypot(...[0, 1, 2].map((k) => (q.at?.[k] ?? 0) - (p.at?.[k] ?? 0))) > 0.05) add('major', b.id, 'object moves between shots', `${p.id}`, 'same position unless it is moved on screen', 'Keep the position'); }
  if (!sameWorld) add('minor', b.id, 'location changes', `${a.id} -> ${b.id}`, 'a motivated transition (dip/wipe/match) is better than a straight cut', 'Declare transition_out.why', { fix_target: 'storyboard' });
  // match cut
  if (b.match_cut) { const sj = typeof B.subject === 'string' ? B.subject : null, pa = project(ca.subj[sj] ? [ca.subj[sj].pos[0], ca.subj[sj].pos[1] + ca.subj[sj].height * 0.6, ca.subj[sj].pos[2]] : [0, 0, 0], ca.c1), pb = project(cb.subj[sj] ? [cb.subj[sj].pos[0], cb.subj[sj].pos[1] + cb.subj[sj].height * 0.6, cb.subj[sj].pos[2]] : [0, 0, 0], cb.c0); if (Math.hypot(pa.x - pb.x, pa.y - pb.y) > 0.1) add('major', b.id, 'match cut does not match', `screen position ${pa.x.toFixed(2)},${pa.y.toFixed(2)} -> ${pb.x.toFixed(2)},${pb.y.toFixed(2)}`, 'the subject sits at the same screen position on both sides of the cut (within 0.1)', 'Adjust offset on one shot'); }
}
for (const s of sb.shots) { const t = s.transition_out?.type; if (t && !['cut'].includes(t) && String(s.transition_out.why || '').length < 12) add('minor', s.id, 'transition has no motivation', `${t}`, 'transition_out.why: a reason (time jump, location change, match...)', 'Add why or use a cut'); }
if (stage.length >= 4 && moves / stage.length > 0.6) add('minor', ids[0], 'most shots move the camera', `${moves} of ${stage.length}`, 'moves only where the story needs them; static shots are normal', 'Review each movement and drop the ones whose "why" is weak');

const blockers = F.filter((f) => f.severity === 'blocker').length, majors = F.filter((f) => f.severity === 'major').length;
const report = { critic: 'cinematography', target: path.basename(path.resolve(P)), note: EST ? 'shot lengths estimated (no data/timeline.json yet): re-run after the voice timing' : undefined, verdict: blockers ? 'fail' : majors ? 'revise' : 'pass', score: Math.max(0, 100 - blockers * 25 - majors * 10 - F.filter((f) => f.severity === 'minor').length * 2), findings: F, checked_at: new Date().toISOString(), stats: { stage3d_shots: stage.length, movements: moves } };
fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
for (const f of F) console.log(`${f.severity.toUpperCase().padEnd(7)} ${f.shot_id}  ${f.problem}\n          evidence: ${f.evidence}\n          expected: ${f.expected}\n          fix: ${f.fix}`);
console.log(`\ncinematography: ${report.verdict} (${report.score}/100): ${stage.length} Stage3D shots, ${moves} camera movements, ${blockers} blocker(s), ${majors} major, ${F.length - blockers - majors} minor -> ${outFile}`);
process.exit(blockers || majors ? 1 : 0);
