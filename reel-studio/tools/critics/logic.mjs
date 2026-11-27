// Logic critic (pre-render, storyboard JSON only): the mistakes a viewer notices at once and a layout check cannot see.
//   spatial     characters do not stand inside each other or inside furniture
//   facing      a character looks at what it is talking to or looking at, not away from it
//   emotion     the mood of the speaker fits the emotion written on the script line
//   continuity  the same character or prop keeps its kind, size and look across cuts in one world
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
import { bodiesOf, circleBoxGap, centreInside, facingOff, moodVA, EMO } from '../lib/spatial.mjs';

const f2 = (n) => (Math.round(n * 100) / 100).toString();
export async function run(P) {
  const r = new Report(P, 'logic'), sb = tryRd(path.join(P, 'storyboard/storyboard.json')), sc = tryRd(path.join(P, 'script/script.json'));
  if (!sb) { r.add('blocker', { problem: 'storyboard missing', evidence: '', expected: 'storyboard/storyboard.json', fix: 'create it', fix_target: 'storyboard' }); return r.finish(); }
  const shots = sb.shots.filter((s) => s.component === 'Stage3D' && s.props), bodies = new Map(shots.map((s) => [s.id, bodiesOf(s)]));

  r.check('spatial: no two characters overlap, nobody stands inside furniture or scenery');
  for (const s of shots) {
    const { cast, boxes } = bodies.get(s.id);
    for (let i = 0; i < cast.length; i++) for (let j = i + 1; j < cast.length; j++) {
      const a = cast[i], b = cast[j]; if (a.contact || b.contact) continue; const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < 0.3) r.add('blocker', { shot_id: s.id, problem: `${a.id} and ${b.id} stand inside each other`, evidence: `centres ${f2(d)} m apart`, expected: 'at least 0.6 m between character centres (or contact:true for a hug or handshake)', fix: `Move ${b.id} in cast.at, or mark contact:true if the touch is intended` });
      else if (d < 0.6) r.add('major', { shot_id: s.id, problem: `${a.id} and ${b.id} overlap`, evidence: `centres ${f2(d)} m apart`, expected: 'at least 0.6 m between character centres', fix: `Move one of them apart in cast.at` });
    }
    for (const c of cast) { if (c.y > 0.25) continue; for (const b of boxes) {
      if (centreInside(c, b)) r.add('blocker', { shot_id: s.id, problem: `${c.id} stands inside ${b.id}`, evidence: `centre (${f2(c.x)}, ${f2(c.z)}) is within the ${f2(b.w)}x${f2(b.d)} m footprint of ${b.id}`, expected: 'characters stand on the floor beside furniture, or on it with cast.y set', fix: `Move ${c.id} out of ${b.id} in cast.at (or raise cast.y if it should sit on it)` });
      else if (circleBoxGap(c, b) < -0.12) r.add('major', { shot_id: s.id, problem: `${c.id} overlaps ${b.id}`, evidence: `feet overlap its footprint by ${f2(-circleBoxGap(c, b))} m`, expected: 'feet clear of the footprint', fix: `Move ${c.id} away from ${b.id}` });
    } }
  }

  r.check('facing: a character faces what it looks at; a speaker does not turn its back on the person it talks to');
  for (const s of shots) {
    const { cast, boxes } = bodies.get(s.id), ref = (id) => cast.find((c) => c.id === id) || boxes.find((b) => b.id === id) || ((s.props.props3d || []).find((p) => p.id === id) && { x: s.props.props3d.find((p) => p.id === id).at[0], z: s.props.props3d.find((p) => p.id === id).at[2] });
    for (const c of cast) {
      const t = typeof c.lookAt === 'string' ? ref(c.lookAt) : null;
      if (t) { const off = facingOff(c, t); if (off > 120) r.add('major', { shot_id: s.id, problem: `${c.id} has its back to ${c.lookAt}, which it is looking at`, evidence: `body faces ${Math.round(off)} deg away from it`, expected: 'within 75 deg (the head can turn the rest)', fix: `Set ${c.id}.rotY so the body turns toward ${c.lookAt}` }); else if (off > 75) r.add('minor', { shot_id: s.id, problem: `${c.id} looks at ${c.lookAt} from a body turned ${Math.round(off)} deg away`, evidence: `${Math.round(off)} deg`, expected: 'within 75 deg', fix: `Turn ${c.id}.rotY toward ${c.lookAt}` }); }
      if (c.speaks) { const others = cast.filter((o) => o.id !== c.id); if (others.length) { const best = Math.min(...others.map((o) => facingOff(c, o))); if (best > 100) r.add('major', { shot_id: s.id, problem: `${c.id} speaks with its back to everyone else`, evidence: `nearest person is ${Math.round(best)} deg off its facing`, expected: 'a speaker faces someone (within 100 deg) unless it addresses the camera', fix: `Turn ${c.id}.rotY toward the listener` }); } }
    }
  }

  r.check('emotion: the speaker\'s mood fits the emotion on the script line');
  if (sc) for (const ln of sc.lines) {
    const s = shots.find((x) => x.line_ids?.includes(ln.id)); if (!s || !ln.emotion) continue; const target = EMO.emotions[ln.emotion]; if (!target) continue;
    const { cast } = bodies.get(s.id), who = cast.find((c) => c.speaks) || (cast.length === 1 ? cast[0] : null); if (!who) continue;
    const va = moodVA(who.mood);
    if (!va) { if (ln.emotion !== 'neutral') r.add('minor', { shot_id: s.id, line_id: ln.id, problem: `${who.id} has no mood on a "${ln.emotion}" line`, evidence: 'cast.mood is missing', expected: 'a mood from gestures.js MOODS', fix: `Set ${who.id}.mood to fit "${ln.emotion}"` }); continue; }
    const dv = Math.abs(target[0] - va[0]); if (dv >= 1.1) r.add('major', { shot_id: s.id, line_id: ln.id, problem: `${who.id} looks ${JSON.stringify(who.mood)} on a "${ln.emotion}" line`, evidence: `valence gap ${f2(dv)} (line ${f2(target[0])}, mood ${f2(va[0])})`, expected: 'a mood on the same side of positive and negative as the line', fix: `Change ${who.id}.mood (see remotion-template/src/three/emotion-data.json), or change the line emotion in the script` });
    else if (dv >= 0.8) r.add('minor', { shot_id: s.id, line_id: ln.id, problem: `${who.id}'s mood is a weak fit for a "${ln.emotion}" line`, evidence: `valence gap ${f2(dv)}`, expected: 'closer mood', fix: `Pick a closer mood for ${who.id}` });
  }

  r.check('continuity: the same character or prop keeps its kind, size and look across shots in one world');
  const seen = new Map();
  for (const s of shots) {
    for (const c of s.props.cast || []) { const k = `${s.props.world}/${c.id}`, sig = JSON.stringify([c.kind || 'human', c.scale || 1, c.look || null]), prev = seen.get(k); if (prev && prev.sig !== sig) r.add('major', { shot_id: s.id, problem: `${c.id} changes between ${prev.shot} and ${s.id}`, evidence: `${prev.sig} -> ${sig}`, expected: 'same kind, scale and look in one world (change it on purpose with a new id)', fix: `Copy ${c.id}'s kind, scale and look from ${prev.shot}` }); else if (!prev) seen.set(k, { sig, shot: s.id }); }
    for (const p of s.props.props3d || []) { const k = `${s.props.world}/${p.id}`, sig = JSON.stringify([p.kind, p.scale || 1]), prev = seen.get(k); if (prev && prev.sig !== sig) r.add('major', { shot_id: s.id, problem: `prop ${p.id} changes between ${prev.shot} and ${s.id}`, evidence: `${prev.sig} -> ${sig}`, expected: 'same kind and scale', fix: `Keep ${p.id} identical, or give the new one another id` }); else if (!prev) seen.set(k, { sig, shot: s.id }); }
  }
  r.notes.push('Collision uses floor footprints only (cast-data.json radii and footprints); arms, hats and animated paths are not checked. Overlay timing and caption/overlay-over-face need rendered frames and word times (frames and layout critics).');
  return r.finish();
}
