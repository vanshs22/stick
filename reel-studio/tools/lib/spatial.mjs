// Shared spatial helpers for the logic critic. Pure functions on storyboard JSON, no renderer needed.
// Convention (same as three/cast.js): cast `at` = [x, z], props3d `at` = [x, y, z], forward vector of rotY = (sin, cos) in the x/z plane.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const T3 = path.join(TK, 'remotion-template/src/three');
export const DATA = JSON.parse(fs.readFileSync(path.join(T3, 'cast-data.json'), 'utf8'));
export const EMO = JSON.parse(fs.readFileSync(path.join(T3, 'emotion-data.json'), 'utf8'));

export const fwd = (rotY = 0) => [Math.sin(rotY), Math.cos(rotY)];
const hyp = (a, b) => Math.hypot(a, b);

/** Everything in a Stage3D shot that takes up floor: cast as circles, solid props and world props as boxes. */
export function bodiesOf(shot) {
  const p = shot.props || {}, out = { cast: [], boxes: [] };
  for (const c of p.cast || []) { const at = c.at || [0, 0]; out.cast.push({ id: c.id, kind: c.kind || 'human', x: at[0], z: at[1], y: c.y || 0, rotY: c.rotY || 0, r: (DATA.radii?.[c.kind || 'human'] ?? 0.35) * (c.scale || 1), speaks: !!c.speaks, mood: c.mood, lookAt: c.lookAt, contact: !!c.contact, raw: c }); }
  for (const q of p.props3d || []) { const fp = DATA.footprints?.[q.kind]; if (!fp || q.solid === false) continue; const at = q.at || [0, 0, 0], sc = q.scale || 1; out.boxes.push({ id: q.id, x: at[0], z: at[2], w: fp[0] * sc, d: fp[1] * sc, rotY: q.rotY || 0, top: (DATA.heights?.[q.kind] || 0.4) * sc }); }
  for (const [id, w] of Object.entries(DATA.worlds?.[p.world] || {})) { const fp = DATA.world_footprints?.[id]; if (fp) out.boxes.push({ id, x: w.pos[0], z: w.pos[2], w: fp[0], d: fp[1], rotY: w.rotY || 0, top: w.height || 1, world: true }); }
  return out;
}

/** Signed gap between a floor circle and a rotated box: negative = the circle centre is inside or overlapping by that much. */
export function circleBoxGap(c, b) {
  const dx = c.x - b.x, dz = c.z - b.z, co = Math.cos(b.rotY), si = Math.sin(b.rotY);
  const lx = dx * co - dz * si, lz = dx * si + dz * co, hx = b.w / 2, hz = b.d / 2;
  const qx = Math.abs(lx) - hx, qz = Math.abs(lz) - hz;
  if (qx <= 0 && qz <= 0) return -Math.min(-qx, -qz) - c.r;
  return hyp(Math.max(qx, 0), Math.max(qz, 0)) - c.r;
}
export const centreInside = (c, b) => { const dx = c.x - b.x, dz = c.z - b.z, co = Math.cos(b.rotY), si = Math.sin(b.rotY); return Math.abs(dx * co - dz * si) <= b.w / 2 && Math.abs(dx * si + dz * co) <= b.d / 2; };

/** Angle in degrees between where `from` faces and the direction to `to` (0 = looking straight at it, 180 = back turned). */
export function facingOff(from, to) {
  const f = fwd(from.rotY), dx = to.x - from.x, dz = to.z - from.z, L = hyp(dx, dz) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (f[0] * dx + f[1] * dz) / L))) * 180) / Math.PI;
}

/** Mean [valence, arousal] of a mood spec: "happy" or [[t, "happy"], [t2, "sad"]]. null if empty or unknown. */
export function moodVA(spec) {
  const names = typeof spec === 'string' ? [spec] : Array.isArray(spec) ? spec.map((s) => (Array.isArray(s) ? s[1] : s)) : [];
  const v = names.map((n) => EMO.moods[n]).filter(Boolean); if (!v.length) return null;
  return [v.reduce((a, x) => a + x[0], 0) / v.length, v.reduce((a, x) => a + x[1], 0) / v.length];
}
