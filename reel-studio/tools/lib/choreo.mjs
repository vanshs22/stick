// Choreography: a script line may carry `stage: { place, time, cast, props3d, actions, camera }`. This module compiles the actions
// (walk, pose, mood, open, enter, carry) into sprite paths, pose and mood keys and door timings, and PROVES the logic before any render:
// reach before open, open before enter, a pulled door never sweeps a person, nobody overlaps anybody or any prop, nobody stands on the road unless the story crosses it.
const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const FOOT = { car: 1.2, bench: 0.9, hydrant: 0.35, bin: 0.4, cone: 0.3, crate: 0.55, planter: 0.6, mailbox: 0.35, shopdoor: 0.0, roadsign: 0.25, stump: 0.45, plankfence: 0.0, parcelbox: 0.0 };
/** where an actor is at time t (same easing the sprite uses) */
export function posAt(c, t) { const p = c.path; if (!p || !p.length) return c.at; let i = 0; while (i < p.length - 1 && t > p[i + 1][0]) i++; const a = p[i], b = p[Math.min(i + 1, p.length - 1)], k = b[0] > a[0] ? ease((t - a[0]) / (b[0] - a[0])) : 1; return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
export function compileStage(stage, cast, props3d, dur) {
  const T = (x) => +(Math.max(0, Math.min(1, x)) * dur).toFixed(2), byCast = Object.fromEntries(cast.map((c) => [c.id, c])), byProp = Object.fromEntries(props3d.map((p) => [p.id, p])), notes = [];
  for (const a of stage.actions || []) {
    const c = a.who ? byCast[a.who] : null, p = a.prop ? byProp[a.prop] : null, t0 = T(a.at ?? 0), d = Math.max(0.3, (a.dur ?? 0.2) * dur);
    if (a.who && !c) { notes.push(`action refers to unknown actor "${a.who}"`); continue; } if (a.prop && !p) { notes.push(`action refers to unknown prop "${a.prop}"`); continue; }
    if (a.do === 'walk' || a.do === 'enter') { const to = a.do === 'enter' ? [byProp[a.through].at[0] - (a.beyond ?? 0.9) * (byProp[a.through].face ?? 1), byProp[a.through].at[1]] : a.to; c.path = c.path || [[0, c.at[0], c.at[1]]]; const last = c.path[c.path.length - 1]; if (t0 > last[0] + 0.01) c.path.push([t0, last[1], last[2]]); c.path.push([+(t0 + d).toFixed(2), to[0], to[1]]); c.flip = to[0] < last[1] ? true : to[0] > last[1] ? false : c.flip; }
    else if (a.do === 'pose') { c.pose = c.pose || [[0, 'idle']]; c.pose.push([t0, a.pose]); }
    else if (a.do === 'mood') { c.mood = c.mood || [[0, 'neutral']]; c.mood.push([t0, a.mood]); }
    else if (a.do === 'open') { p.open = [t0, d]; if (a.swing) p.swing = a.swing; }
    else if (a.do === 'rattle') { p.rattle = [t0, d]; }
    else if (a.do === 'carry') { props3d.push({ id: a.item || 'parcel', kind: 'parcelbox', follow: { id: a.who, dx: a.dx ?? 0, dy: a.dy ?? 0.95, dz: a.dz ?? 0.42 } }); }
  }
  for (const c of cast) { if (c.pose) c.pose.sort((x, y) => x[0] - y[0]); if (c.mood) c.mood.sort((x, y) => x[0] - y[0]); }
  return notes;
}
/** logic proof for one shot; returns a list of problems (empty = the choreography holds) */
export function checkChoreo(shot, dur, opts = {}) {
  const P = shot.props, cast = P.cast || [], props = P.props3d || [], out = [], id = shot.id, step = 0.1, seenRoad = new Set();
  const doors = props.filter((p) => p.kind === 'shopdoor');
  for (const d of doors) {
    if (!d.open || d.open[0] + d.open[1] < 0.25) continue; const [t0, dd] = d.open,   // a door that is already open when the shot starts needs no swing proof
     who = cast.filter((c) => (c.pose || []).some((k) => k[1] === 'reach'));
    const reachT = Math.min(...who.flatMap((c) => c.pose.filter((k) => k[1] === 'reach').map((k) => k[0])), 99);
    if (reachT > t0 + 0.05) out.push(`${id}: door ${d.id} opens at ${t0}s but nobody reaches for the handle first (reach at ${reachT}s)`);
    const enters = cast.filter((c) => (c.path || []).some((k) => k[1] * (d.face ?? 1) < d.at[0] * (d.face ?? 1) - 0.15));
    for (const c of enters) { const inT = (c.path.find((k) => k[1] * (d.face ?? 1) < d.at[0] * (d.face ?? 1) - 0.15) || [99])[0]; if (inT < t0 + dd - 0.25) out.push(`${id}: ${c.id} goes through ${d.id} at ${inT}s before it is open (open ends ${(t0 + dd).toFixed(2)}s)`); }
    if ((d.swing || 'in') === 'out') { const face = d.face ?? 1, hinge = [d.at[0], d.at[1] + ((d.hinge || 'far') === 'near' ? 0.5 : -0.5)]; for (const c of cast) for (let t = t0; t <= t0 + dd + 0.05; t += step) { const p = posAt(c, t), k = Math.min(1, (t - t0) / dd), street = (p[0] - d.at[0]) * face > -0.15, dist = Math.hypot(p[0] - hinge[0], p[1] - hinge[1]); if (street && dist < 0.35 + 1.0 * k) { out.push(`${id}: ${c.id} stands inside the swing of door ${d.id} at ${t.toFixed(2)}s (${dist.toFixed(2)} m from the hinge): step back before a pulled door opens`); break; } } }
    if (d.open) for (const c of cast) { const e = c.path?.[c.path.length - 1]; if (e && Math.abs(e[1] - d.at[0]) < 0.45 && Math.abs(e[2] - (d.at[1] + ((d.hinge || 'far') === 'near' ? 0.5 : -0.5))) < 0.5) out.push(`${id}: ${c.id} ends next to the door leaf (z ${e[2]}): stand in the opening, not on the hinge side`); }
  }
  for (let t = 0; t <= dur; t += step) {
    for (let i = 0; i < cast.length; i++) { const a = posAt(cast[i], t); for (let j = i + 1; j < cast.length; j++) { const b = posAt(cast[j], t); if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.55) { out.push(`${id}: ${cast[i].id} and ${cast[j].id} overlap at ${t.toFixed(2)}s`); i = 99; break; } }
      if (i >= 99) break; for (const p of props) { const r = FOOT[p.kind] ?? 0; if (r && p.at && Math.hypot(a[0] - p.at[0], a[1] - p.at[1]) < r) { out.push(`${id}: ${cast[i].id} walks into ${p.id} (${p.kind}) at ${t.toFixed(2)}s`); break; } } }
    if (P.world === 'city-street' && opts.roadHalf) for (const c of cast) { const a = posAt(c, t); if (Math.abs(a[0]) < opts.roadHalf - 0.3 && !(c.crosses) && !seenRoad.has(c.id)) { seenRoad.add(c.id); out.push(`${id}: ${c.id} stands on the road at ${t.toFixed(2)}s (traffic lanes are live)`); } }
  }
  return [...new Set(out)];
}
