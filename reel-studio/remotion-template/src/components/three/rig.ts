// Pose and face data for the 3D characters. Pure data + pure functions of time: deterministic, no useFrame.
export type Pose = {aL: [number, number]; aR: [number, number]; lean: number; tilt: number; stance: number; walk?: number};
const P = (o: Partial<Pose>): Pose => ({aL: [8, 6], aR: [8, 6], lean: 0, tilt: 0, stance: 6, ...o});
/** arm = [shoulder raise (deg, 0 = hanging), elbow bend forward (deg)] */
export const POSES: Record<string, Pose> = {
  idle: P({}), relax: P({aL: [14, 10], aR: [14, 10], tilt: 3}), slump: P({aL: [6, 6], aR: [6, 6], tilt: 9, lean: 4}),
  point: P({aR: [100, 5]}), open: P({aL: [105, 15], aR: [105, 15], stance: 12}), cheer: P({aL: [160, 10], aR: [160, 10], stance: 12}),
  think: P({aR: [55, 150], tilt: 7}), shrug: P({aL: [72, 100], aR: [72, 100], tilt: 5}), wave: P({aR: [150, 30], tilt: 3}),
  panic: P({aL: [38, 152], aR: [38, 152], stance: 16, tilt: 6}), brace: P({aL: [78, 28], aR: [78, 28], stance: 30, lean: 6}),
  cower: P({aL: [150, 125], aR: [150, 125], stance: 30, lean: 8, tilt: 9}), phone: P({aR: [60, 150], aL: [18, 12], tilt: -4}),
  reach: P({aR: [112, 12], aL: [14, 8], lean: 5}), halt: P({aL: [28, 140], aR: [28, 140]}), walk: P({walk: 1, aL: [15, 10], aR: [15, 10]}),
};
export type Mood = {brow: number; tilt: number; eye: number; smile: number; mouth: number};
export const MOODS: Record<string, Mood> = {
  calm: {brow: 0, tilt: 0, eye: 1, smile: 0.1, mouth: 0}, happy: {brow: 8, tilt: -2, eye: 0.95, smile: 1, mouth: 0.12}, scared: {brow: 26, tilt: -10, eye: 1.3, smile: -0.3, mouth: 0.6},
  worried: {brow: 10, tilt: -16, eye: 1.05, smile: -0.5, mouth: 0.05}, angry: {brow: -8, tilt: 22, eye: 0.85, smile: -0.6, mouth: 0.18}, sad: {brow: 4, tilt: -20, eye: 0.82, smile: -0.85, mouth: 0},
  surprised: {brow: 30, tilt: 0, eye: 1.35, smile: 0, mouth: 0.5}, relieved: {brow: 4, tilt: -8, eye: 0.8, smile: 0.7, mouth: 0.08}, smirk: {brow: 0, tilt: 9, eye: 0.8, smile: 0.6, mouth: 0},
};
const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
const ss = (u: number) => u * u * (3 - 2 * u);
type Spec = string | [number, string][];
function blend<T extends Record<string, any>>(table: Record<string, T>, spec: Spec, lt: number, fallback: string): T {
  const get = (n: string) => table[n] || table[fallback];
  if (typeof spec === 'string') return get(spec);
  if (lt <= spec[0][0]) return get(spec[0][1]);
  for (let i = 1; i < spec.length; i++) {
    if (lt <= spec[i][0]) {
      const k = ss((lt - spec[i - 1][0]) / Math.max(1e-6, spec[i][0] - spec[i - 1][0])), A = get(spec[i - 1][1]), B = get(spec[i][1]);
      const m = (a: any, b: any): any => (Array.isArray(a) ? a.map((v: number, j: number) => mixN(v, b[j], k)) : typeof a === 'number' ? mixN(a, b, k) : b);
      return Object.fromEntries(Object.keys(A).map((key) => [key, m((A as any)[key], (B as any)[key])])) as T;
    }
  }
  return get(spec[spec.length - 1][1]);
}
/** pose / mood as a name or keyframes [[localSeconds, name], ...] blended smoothly */
export const poseAt = (spec: Spec, lt: number): Pose => blend(POSES, spec, lt, 'idle');
export const moodAt = (spec: Spec, lt: number): Mood => blend(MOODS, spec, lt, 'calm');

export type Variant = 'voxel' | 'blocky' | 'lowpoly' | 'stick' | 'noir';
/** draws the face onto a 256x256 canvas; talk 0..1 = mouth openness from the real word times */
export function drawFace(c: CanvasRenderingContext2D, v: Variant, m: Mood, talk: number, t: number, glasses = false) {
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 256, 256); if (v === 'noir') return; c.translate(128, 128);
  const blink = (t * 1.0) % 3.7 < 0.1 ? 0.12 : 1, eo = Math.max(0.12, m.eye * blink), ink = '#14100d', open = Math.min(1, m.mouth + talk * 0.9), lx = Math.sin(t * 0.7) * 3;
  const brow = (x: number, y: number, w: number, thick: number) => { c.save(); c.translate(x, y - m.brow * 0.9); c.rotate(((x < 0 ? 1 : -1) * m.tilt * Math.PI) / 360); c.fillStyle = ink; c.fillRect(-w / 2, -thick / 2, w, thick); c.restore(); };
  if (v === 'voxel') {
    for (const s of [-1, 1]) { c.fillStyle = '#fff'; c.fillRect(s * 52 - 28, -6 - 30 * Math.min(1, eo), 56, 60 * Math.min(1, eo)); c.fillStyle = ink; c.fillRect(s * 52 - 13 + lx, -6 - 14 * Math.min(1, eo) + 4, 26, 28 * Math.min(1, eo)); brow(s * 52, -50, 62, 10); }
    c.fillStyle = '#3a1612'; c.fillRect(-(34 + m.smile * 18) / 2, 66, 34 + m.smile * 18, 6 + open * 40);
  } else if (v === 'blocky' || v === 'stick') {
    c.fillStyle = v === 'stick' ? '#111' : ink; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 38 + lx, -10, v === 'stick' ? 12 : 9, 14 * Math.min(1.2, eo), 0, 0, 7); c.fill(); }
    c.lineWidth = 9; c.lineCap = 'round'; c.strokeStyle = ink;
    if (open > 0.2) { c.fillStyle = '#4a1610'; c.beginPath(); c.ellipse(0, 52, 28 + m.smile * 8, 8 + open * 28, 0, 0, 7); c.fill(); } else { c.beginPath(); c.moveTo(-34, 44 - m.smile * 6); c.quadraticCurveTo(0, 44 + m.smile * 34, 34, 44 - m.smile * 6); c.stroke(); }
    if (v === 'stick') { brow(-38, -46, 40, 8); brow(38, -46, 40, 8); }
  } else {
    for (const s of [-1, 1]) { c.fillStyle = ink; c.beginPath(); c.ellipse(s * 52 + lx * 0.8, -4, 7, 10 * Math.min(1.25, eo), 0, 0, 7); c.fill(); if (glasses) { c.lineWidth = 6; c.strokeStyle = '#1b1b20'; c.beginPath(); c.arc(s * 52, -4, 40, 0, 7); c.stroke(); } brow(s * 52, -58, 44, 5); }
    if (glasses) { c.lineWidth = 6; c.strokeStyle = '#1b1b20'; c.beginPath(); c.moveTo(-12, -6); c.quadraticCurveTo(0, -14, 12, -6); c.stroke(); }
    c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = '#6b3a30';
    if (open > 0.18) { c.fillStyle = '#5a2620'; c.beginPath(); c.ellipse(0, 64, 12 + m.smile * 6, 4 + open * 20, 0, 0, 7); c.fill(); } else { c.beginPath(); c.moveTo(-14, 66 - m.smile * 3); c.quadraticCurveTo(0, 66 + m.smile * 12, 14, 66 - m.smile * 3); c.stroke(); }
  }
}
