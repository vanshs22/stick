// Cinematography: a camera specification -> an exact camera for any moment of a shot. Pure maths, no three.js, so the
// SAME code runs in the browser (Stage3D) and in Node (tools/check_cinematography.mjs: composition + continuity checks).
//
// A shot's camera = a base pose (framing + angle + subject) + at most one movement, and the movement must say WHY it exists.
// Units: metres, y up, subjects face +z when rotY = 0. Frame is 9:16 portrait unless aspect is given.

export const FRAMINGS = {
  // cy = height of the frame centre as a fraction of the subject's height, V = visible frame height as a multiple of it
  'extreme-wide': { cy: 0.5, V: 7.5 }, wide: { cy: 0.5, V: 3.4 }, 'medium-wide': { cy: 0.52, V: 1.9 }, medium: { cy: 0.7, V: 1.15 },
  'medium-close-up': { cy: 0.8, V: 0.78 }, 'close-up': { cy: 0.9, V: 0.45 }, 'extreme-close-up': { cy: 0.93, V: 0.2 },
  establishing: { cy: 0.5, V: 5.5 }, insert: { cy: 0.5, V: 2.4 }, 'top-down': { cy: 0.5, V: 3.0 },
  'over-the-shoulder': { cy: 0.85, V: 0.7 }, pov: { cy: 0.9, V: 1.4 },
};
/** default vertical field of view per framing: wide shots use a wider lens, close-ups a longer one (flatter faces, softer background) */
export const FOV = { 'extreme-wide': 58, establishing: 52, wide: 44, 'medium-wide': 38, medium: 33, 'medium-close-up': 30, 'close-up': 27, 'extreme-close-up': 24, insert: 30, 'top-down': 40, 'over-the-shoulder': 30, pov: 42 };
export const ANGLES = {
  'eye-level': { el: 0, az: 0, roll: 0 }, 'low-angle': { el: -16, az: 0, roll: 0 }, 'high-angle': { el: 22, az: 0, roll: 0 }, dutch: { el: 0, az: 0, roll: 10 },
  'three-quarter': { el: 0, az: 35, roll: 0 }, profile: { el: 0, az: 90, roll: 0 }, 'front-facing': { el: 0, az: 0, roll: 0 }, overhead: { el: 80, az: 0, roll: 0 },
};
export const MOVEMENTS = ['static', 'dolly-push', 'dolly-pull', 'tracking', 'pan', 'tilt', 'orbit', 'crane', 'pedestal', 'handheld', 'focus-pull', 'rack-focus', 'subject-follow', 'reveal'];
export const PROFILES = ['constant', 'ease-in', 'ease-out', 'ease-in-out'];
export const CURVES = ['linear', 'sine', 'cubic', 'expo', 'quint'];

const D2R = Math.PI / 180, lerp = (a, b, k) => a + (b - a) * k, v3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]), norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const CURVE = { linear: (t) => t, sine: (t) => 1 - Math.cos((t * Math.PI) / 2), cubic: (t) => t * t * t, expo: (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)), quint: (t) => t ** 5 };
/** speed profile + curve -> a function 0..1 -> 0..1 */
export function easeFn(profile = 'ease-in-out', curve = 'sine') {
  const f = CURVE[curve] || CURVE.sine;
  if (profile === 'constant') return (t) => clamp01(t);
  if (profile === 'ease-in') return (t) => f(clamp01(t));
  if (profile === 'ease-out') return (t) => 1 - f(1 - clamp01(t));
  return (t) => { t = clamp01(t); return t < 0.5 ? f(t * 2) / 2 : 1 - f((1 - t) * 2) / 2; };
}

/** subjects: { id: { pos:[x,y,z], height, rotY } }. A subject may also be a literal [x,y,z]. */
export function subjectOf(ref, subjects) {
  if (Array.isArray(ref)) return { pos: ref, height: 0.4, rotY: 0 };
  const s = subjects[ref]; if (!s) throw new Error(`camera subject "${ref}" is not in the scene (have: ${Object.keys(subjects).join(', ')})`);
  return { height: 1.75, rotY: 0, ...s };
}

/** one static camera from a pose { framing, angle, subject, az, el, roll, offset:[ox,oy], fov, dist, shoulder } */
export function solvePose(p, subjects, aspect = 9 / 16) {
  const fr = FRAMINGS[p.framing]; if (!fr) throw new Error(`unknown framing "${p.framing}"`);
  const an = ANGLES[p.angle || 'eye-level']; if (!an) throw new Error(`unknown angle "${p.angle}"`);
  const fov = p.fov || FOV[p.framing] || 30, s = subjectOf(p.subject, subjects), H = s.height;
  const el = (p.el ?? an.el) * D2R, az = (p.az ?? an.az) * D2R, roll = p.roll ?? an.roll, ox = p.offset?.[0] ?? 0, oy = p.offset?.[1] ?? 0;
  const center = add(s.pos, [0, (p.cy ?? fr.cy) * H, 0]);
  let pos, look;
  if (p.framing === 'pov') {                       // through the character's eyes, looking at the target
    const eye = add(s.pos, [0, H * 0.93, 0]), tgt = subjectOf(p.target, subjects); pos = add(eye, mul([Math.sin(s.rotY), 0, Math.cos(s.rotY)], 0.08)); look = add(tgt.pos, [0, tgt.height * 0.55, 0]);
  } else if (p.framing === 'over-the-shoulder') {  // behind `subject`'s shoulder, looking at `target`
    const tgt = subjectOf(p.target, subjects), sh = add(s.pos, [0, H * 0.9, 0]), tc = add(tgt.pos, [0, tgt.height * 0.8, 0]), d = norm([tc[0] - sh[0], 0, tc[2] - sh[2]]), side = [d[2], 0, -d[0]];
    pos = add(add(sh, mul(d, -(p.back ?? 1.1))), add(mul(side, (p.shoulderOffset ?? 0.5) * (p.side || 1)), [0, p.lift ?? 0.28, 0])); look = add(tc, mul(side, -(p.lookShift ?? 0.12) * (p.side || 1)));
  } else {
    const dist = (p.dist ?? (fr.V * H) / (2 * Math.tan((fov * D2R) / 2))) * (p.distScale ?? 1);
    const f = [Math.sin(s.rotY + az) * Math.cos(el), Math.sin(el), Math.cos(s.rotY + az) * Math.cos(el)];
    pos = add(center, mul(f, dist)); look = center;
  }
  const dir = norm(sub(look, pos)), right = norm(cross(dir, [0, 1, 0])), up = cross(right, dir), visH = 2 * Math.tan((fov * D2R) / 2) * len(sub(look, pos)), visW = visH * aspect;
  look = add(look, add(mul(right, -ox * visW), mul(up, -oy * visH)));   // ox>0 moves the subject to the right of the frame
  if (!['pov', 'over-the-shoulder'].includes(p.framing)) pos = add(pos, add(mul(right, -ox * visW), mul(up, -oy * visH)));
  if (pos[1] < 0.3) pos = [pos[0], 0.3, pos[2]];   // never put the lens under the ground (low angles on small subjects)
  return { pos, look, fov, roll };
}

/** project a world point to the frame: x,y in 0..1 (0,0 = top-left), plus whether it is in front of the camera */
export function project(pt, cam, aspect = 9 / 16) {
  const f = norm(sub(cam.look, cam.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(pt, cam.pos), z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
  if (z <= 0.001) return { x: NaN, y: NaN, front: false };
  const th = Math.tan((cam.fov * D2R) / 2), x = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / z / (th * aspect), y = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / z / th;
  return { x: 0.5 + x / 2, y: 0.5 - y / 2, front: true };
}

const noise = (t, s) => Math.sin(t * 1.7 + s) * 0.5 + Math.sin(t * 2.9 + s * 2.3) * 0.3 + Math.sin(t * 5.1 + s * 0.7) * 0.2;

/** Camera at shot-local time `t` (seconds). spec = { framing, angle, subject, ..., movement?: {type, from?, to?, start, duration, profile, curve, target, focus} } */
export function cameraAt(spec, subjects, t, shotDur, aspect = 9 / 16) {
  const base = { ...spec }; delete base.movement;
  const mv = spec.movement; let cam, focusSubject = spec.focus?.target || spec.subject;
  if (!mv || mv.type === 'static') cam = solvePose(base, subjects, aspect);
  else {
    const start = mv.start ?? 0, dur = mv.duration === 'shot' || mv.duration == null ? shotDur - start : Math.max(0.3, Math.min(mv.duration, shotDur - start));   // the real shot is only as long as its line: a longer move is compressed to finish with the shot
    const k = easeFn(mv.profile, mv.curve)((t - start) / Math.max(0.001, dur)), A = { ...base, ...(mv.from || {}) }, B = { ...base, ...(mv.to || {}) };
    if (['pan', 'tilt'].includes(mv.type)) { const a = solvePose(A, subjects, aspect), b = solvePose(B, subjects, aspect); cam = { pos: a.pos, look: v3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll, b.roll, k) }; }
    else if (mv.type === 'pedestal') { const a = solvePose(A, subjects, aspect), b = solvePose(B, subjects, aspect); cam = { pos: v3(a.pos, b.pos, k), look: v3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: a.roll }; }
    else if (mv.type === 'subject-follow') { const a = solvePose(A, subjects, aspect), s = subjectOf(spec.subject, subjects); cam = { ...a, look: add(s.pos, [0, FRAMINGS[A.framing].cy * s.height, 0]) }; }
    else if (['handheld', 'focus-pull', 'rack-focus'].includes(mv.type)) {
      cam = solvePose(base, subjects, aspect);
      if (mv.type === 'handheld') { const a = Math.min(mv.amplitude_cm ?? 0.8, 1.5) / 100; cam = { ...cam, pos: add(cam.pos, [noise(t, 1) * a, noise(t, 2) * a, noise(t, 3) * a]), look: add(cam.look, [noise(t, 4) * a * 0.6, noise(t, 5) * a * 0.6, 0]), roll: cam.roll + noise(t, 6) * 0.25 }; }
      else if (mv.focus?.to) focusSubject = k < 0.5 ? mv.focus.from || spec.subject : mv.focus.to;
    } else {                                           // dolly-push/pull, tracking, orbit, crane, reveal: blend the pose, then solve (straight dollies and true arcs both fall out of this)
      const m = { ...A }; for (const key of ['az', 'el', 'roll', 'fov', 'dist']) if (A[key] != null || B[key] != null) { const an = ANGLES[A.angle || 'eye-level'], bn = ANGLES[B.angle || 'eye-level']; m[key] = lerp(A[key] ?? an[key] ?? 0, B[key] ?? bn[key] ?? 0, k); }
      const fa = FRAMINGS[A.framing], fb = FRAMINGS[B.framing], fov = m.fov || FOV[A.framing] || 30, H = subjectOf(A.subject, subjects).height;
      if (fa && fb && A.framing !== 'pov' && A.framing !== 'over-the-shoulder') { const V = lerp(fa.V, fb.V, k); m.dist = (V * H) / (2 * Math.tan((fov * D2R) / 2)); m.fov = fov; m.framing = A.framing; m.cy = lerp(fa.cy, fb.cy, k); }
      m.distScale = lerp(A.distScale ?? 1, B.distScale ?? 1, k);
      m.offset = [lerp(A.offset?.[0] ?? 0, B.offset?.[0] ?? 0, k), lerp(A.offset?.[1] ?? 0, B.offset?.[1] ?? 0, k)];
      cam = solvePose(m, subjects, aspect);
      if (A.subject !== B.subject && B.subject != null) { const b = solvePose(B, subjects, aspect); cam = { ...cam, look: v3(solvePose(A, subjects, aspect).look, b.look, k) }; }
    }
  }
  const fs = subjectOf(focusSubject, subjects), c = add(fs.pos, [0, fs.height * 0.7, 0]);
  return { ...cam, focusDist: len(sub(c, cam.pos)), aperture: spec.focus?.aperture ?? 0.003 };
}
