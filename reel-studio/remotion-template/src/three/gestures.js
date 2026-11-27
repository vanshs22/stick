// Named body language for the SDF Human (degrees). A shot says "pose: [[0,'idle'],[1.2,'explain']]" and the engine blends
// between them with an ease, then adds breathing, weight shift, head life and blinks on top (all pure functions of time).

const P = (o) => o;
export const GESTURES = {
  idle: P({ shL: [0, 0, 6], shR: [0, 0, 6], elL: 10, elR: 10, spine: [0, 0, 0], head: [0, 0, 0] }),
  relax: P({ shL: [4, 0, 9], shR: [4, 0, 9], elL: 16, elR: 16, spine: [2, 0, 0], head: [2, 0, 2] }),
  explain: P({ shL: [38, 6, 16], shR: [44, -6, 16], elL: 78, elR: 84, spine: [2, 0, 0], head: [0, 0, 0] }),
  'explain-wide': P({ shL: [30, 10, 40], shR: [30, -10, 40], elL: 55, elR: 55, spine: [0, 0, 0], head: [-2, 0, 0] }),
  point: P({ shL: [0, 0, 6], shR: [82, -14, 8], elL: 10, elR: 6, spine: [1, 6, 0], head: [0, 8, 0] }),
  think: P({ shL: [8, 0, 10], shR: [64, 0, 6], elL: 40, elR: 128, spine: [3, 0, 1], head: [4, 6, 6] }),
  shrug: P({ shL: [14, 0, 30], shR: [14, 0, 30], elL: 90, elR: 90, spine: [0, 0, 0], head: [0, 0, 7] }),
  wave: P({ shL: [0, 0, 6], shR: [20, 0, 105], elR: 85, elL: 10, spine: [0, 0, 0], head: [0, 0, 4] }),
  cheer: P({ shL: [0, 0, 165], shR: [0, 0, 165], elL: 10, elR: 10, spine: [-4, 0, 0], head: [-8, 0, 0] }),
  hold: P({ shL: [52, 0, 8], shR: [52, 0, 8], elL: 70, elR: 70, spine: [4, 0, 0], head: [10, 0, 0] }),
  'hold-up': P({ shL: [70, 0, 10], shR: [70, 0, 10], elL: 60, elR: 60, spine: [0, 0, 0], head: [-4, 0, 0] }),
  reach: P({ shL: [6, 0, 8], shR: [78, -8, 6], elL: 10, elR: 22, spine: [8, 6, 0], head: [6, 6, 0] }),
  'lean-in': P({ shL: [14, 0, 10], shR: [14, 0, 10], elL: 30, elR: 30, spine: [14, 0, 0], head: [-6, 0, 0] }),
  'step-back': P({ shL: [20, 0, 24], shR: [20, 0, 24], elL: 50, elR: 50, spine: [-8, 0, 0], head: [-4, 0, 0], hipL: [-4, 0, 2], hipR: [8, 0, 2] }),
  slump: P({ shL: [0, 0, 4], shR: [0, 0, 4], elL: 8, elR: 8, spine: [12, 0, 0], head: [16, 0, 0] }),
  'hands-on-head': P({ shL: [150, 0, 40], shR: [150, 0, 40], elL: 130, elR: 130, spine: [0, 0, 0], head: [-4, 0, 0] }),
  cower: P({ shL: [90, 0, 20], shR: [90, 0, 20], elL: 125, elR: 125, spine: [16, 0, 0], head: [14, 0, 0], knL: 22, knR: 22, hipL: [24, 0, 4], hipR: [24, 0, 4] }),
};

/** facial moods: smile -1..1, brow -1..1, tilt (+ angry, - worried), lid (-0.4 wide .. 1 closed), look */
export const MOODS = {
  calm: { smile: 0.18, brow: 0, tilt: 0, lid: 0 }, happy: { smile: 1.0, brow: 0.5, tilt: -4, lid: 0.18 }, curious: { smile: 0.3, brow: 0.6, tilt: -6, lid: -0.15, look: [8, 4] },
  surprised: { smile: 0.1, brow: 1, tilt: 0, lid: -0.4, open: 0.55 }, worried: { smile: -0.55, brow: 0.6, tilt: -24, lid: 0, look: [0, -4] }, sad: { smile: -0.95, brow: 0.45, tilt: -28, lid: 0.22 },
  angry: { smile: -0.7, brow: -0.8, tilt: 26, lid: 0.2 }, smirk: { smile: 0.55, brow: 0.2, tilt: 6, lid: 0.25 }, scared: { smile: -0.3, brow: 0.9, tilt: -14, lid: -0.35, open: 0.35 },
  relieved: { smile: 0.7, brow: 0.15, tilt: -8, lid: 0.4 }, determined: { smile: 0.1, brow: -0.35, tilt: 12, lid: 0.1 },
};

export const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const mixv = (a, b, k) => (Array.isArray(a) || Array.isArray(b) ? [0, 1, 2].map((i) => (a?.[i] ?? 0) + ((b?.[i] ?? 0) - (a?.[i] ?? 0)) * k) : (a ?? 0) + ((b ?? 0) - (a ?? 0)) * k);
export function blendTable(table, spec, lt, fallback, blendTime = 0.45) {
  const steps = typeof spec === 'string' ? [[0, spec]] : spec && spec.length ? spec : [[0, fallback]];
  let i = 0; while (i + 1 < steps.length && lt >= steps[i + 1][0]) i++;
  const cur = table[steps[i][1]] || table[fallback], prev = table[(i > 0 ? steps[i - 1][1] : steps[0][1])] || cur, k = i > 0 ? ease((lt - steps[i][0]) / blendTime) : 1, out = {};
  for (const key of new Set([...Object.keys(prev), ...Object.keys(cur)])) out[key] = mixv(prev[key], cur[key], k);
  return out;
}
export const gestureAt = (spec, lt, bt) => blendTable(GESTURES, spec, lt, 'idle', bt);
export const moodAt = (spec, lt) => blendTable(MOODS, spec, lt, 'calm', 0.3);

/** life on top of the pose: breathing, weight shift, head drift, blinks. All deterministic in t. seed separates characters. */
export function lifeLayer(q, t, seed = 0, talk = 0) {
  const o = { ...q }, br = Math.sin(t * 1.9 + seed) * 0.6, sw = Math.sin(t * 0.55 + seed * 2) * 1.2;
  o.spine = [(q.spine?.[0] ?? 0) + br * 0.7 + talk * 1.2, (q.spine?.[1] ?? 0) + sw * 0.5, (q.spine?.[2] ?? 0) + sw * 0.4];
  o.head = [(q.head?.[0] ?? 0) + Math.sin(t * 0.8 + seed) * 1.2 + talk * Math.sin(t * 7 + seed) * 1.5, (q.head?.[1] ?? 0) + Math.sin(t * 0.6 + seed * 3) * 2.2, (q.head?.[2] ?? 0) + Math.sin(t * 0.45 + seed) * 1];
  const ph = (t * 0.32 + seed * 0.37) % 1, blink = ph > 0.955 ? Math.sin(((ph - 0.955) / 0.045) * Math.PI) : 0;       // a blink about every 3 s
  return { ...o, blink };
}
