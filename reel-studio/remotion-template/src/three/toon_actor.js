// Toon-pen character renderer for style 2 (the inked ball-head cartoon: shaded fills, thick-thin ink ring, helmet/cap/hair/apron kit).
// Wraps romanFront (toon_cast.js) so a sprite can be drawn with our poses and moods. Design canvas is 600 x 1000, soles at y = 975.
import { Pen, romanFront, OUTFITS } from './toon_cast.js';

export const TOON_W = 600, TOON_H = 1000, TOON_FEET = 0.975;
// our own cast in this style (original designs, same construction as the supplied kit)
Object.assign(OUTFITS, {
  barnaby: { tunic: '#e8b33a', skin: '#fdebd5', cap: '#d8342b', bib: '#5f86b8', pants: '#5f86b8' },
  hank: { tunic: '#e9ddb4', skin: '#fdebd5', hair: '#3a2616', moustache: '#4a3020', vest: '#f6ebc8', trim: '#d9b84a', pants: '#3a2f3a' },
  rex: { tunic: '#2ba39a', skin: '#fdebd5', cap: '#c8372d', pants: '#3b4150' },
  gus: { tunic: '#c6d84a', skin: '#fdebd5', hardhat: '#f2b31a', bands: '#e8e8e0', bib: '#e8782a', pants: '#e8782a' },
});
const ARMS = { idle: ['hang', 'hang'], point: ['hang', 'point'], cheer: ['up', 'up'], shock: ['lift', 'lift'], think: ['hang', 'cheek'], shrug: ['hip', 'hip'], hammer: ['hang', 'up'], flail: ['up', 'up'], hold: ['belly', 'belly'], hip: ['hip', 'hip'], lean: ['hip', 'cross'], stomp: ['hip', 'hip'], sneak: ['hang', 'hang'], laughy: ['belly', 'hang'], slump: ['hang', 'hang'] };
const nearest = (pose) => { const sR = pose.sR?.[0] ?? 8, sL = pose.sL?.[0] ?? 8, pick = (a, side) => (a > 125 ? 'up' : a > 70 ? (side ? 'point' : 'lift') : a > 40 ? 'hip' : 'hang'); return [pick(sL, 0), pick(sR, 1)]; };
const BYNAME = { neutral: 'neutral', happy: 'smile', laugh: 'laugh', shock: 'shock', scared: 'nervous', sad: 'pained', smug: 'grin', angry: 'stern', determined: 'stern', worried: 'nervous', excited: 'grin', curious: 'smile', proud: 'grin', annoyed: 'stern', confused: 'dazed', surprised: 'shock', relieved: 'relief', thinking: 'neutral', deadpan: 'neutral' };
const faceOf = (x, name) => { if (name && BYNAME[name]) return BYNAME[name]; const s = x.smile ?? 0, o = x.open ?? 0, b = x.brow ?? 0, e = x.eyes ?? 1; if (e > 1.2) return o > 0.4 && (x.tilt ?? 0) > 0.5 ? 'nervous' : 'shock'; if (s > 0.7 && o > 0.5) return 'laugh'; if (s > 0.7) return 'grin'; if (s > 0.4) return 'smile'; if (s < -0.5 && b > 0.3) return 'stern'; if (s < -0.4) return 'pained'; if ((x.tilt ?? 0) < -0.7 && b > 0.3) return 'stubborn'; return 'neutral'; };
export function drawToon(ctx, CW, CH, s) {
  const { t = 0, pose, expr, look = {}, turn = 0, walk = 0, seed = 1, talk = 0, gaze = [0, 0], blinkPhase } = s, key = look.toon || 'barnaby';
  ctx.clearRect(0, 0, CW, CH); ctx.save(); ctx.scale(CW / TOON_W, CH / TOON_H);
  const arms = (s.poseName && ARMS[s.poseName]) || nearest(pose), c = (t + seed * 0.7) % 4.1, blink = c < 0.13 ? Math.sin((c / 0.13) * Math.PI) : 0;
  const ex = faceOf(expr, s.moodName), p = new Pen(ctx);
  romanFront(p, key, { expr: ex, blink, look: gaze[0] || 0, facing: Math.max(-1, Math.min(1, turn * 0.6)) * (look.flipTurn ? -1 : 1), seed: 3 + (seed % 5), L: arms[0], R: arms[1], tilt: (pose.tilt || 0) * 0.6, headTilt: (expr.tilt2 || 0) * 4, bob: Math.sin(t * 2.2 + seed) * 0.004 + 0.002, step: walk ? walk % 1 : 0, light: look.light });
  ctx.restore();
}
