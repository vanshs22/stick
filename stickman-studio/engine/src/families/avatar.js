// Illustrated presenter for the editorial family: flat vector person (head, beard, beanie/hair, glasses, jacket) drawn in 2D.
// Everything that varies per beat comes from the plan: mood -> face, pose -> gesture, word timings -> mouth.
import { ctx, clamp, lerp, rr, TAU } from '../core/lib.js';
import { shade, talkAt } from '../core/rig.js';

// face numbers per mood: brow lift/tilt, eye openness, smile curve (-1 frown .. 1 grin), mouth base openness
const M = {
  calm: { b: [0, 0], e: 1, s: 0.15, o: 0 }, happy: { b: [-6, -3], e: 0.85, s: 0.95, o: 0.25 }, scared: { b: [-16, 9], e: 1.35, s: -0.5, o: 0.55 },
  worried: { b: [-8, 8], e: 1.05, s: -0.35, o: 0.05 }, angry: { b: [4, -14], e: 0.8, s: -0.6, o: 0.1 }, sad: { b: [-4, 12], e: 0.8, s: -0.7, o: 0 },
  surprised: { b: [-20, 0], e: 1.4, s: 0, o: 0.8 }, relieved: { b: [-3, 4], e: 0.6, s: 0.55, o: 0.1 }, smirk: { b: [-3, -5], e: 0.8, s: 0.5, o: 0 },
};
const GEST = { // elbow/hand targets for the raised (viewer-left) arm, in avatar units; k = how raised
  idle: { h: [-232, 452], el: [-262, 240] }, wave: { h: [-330, -120], el: [-300, 40], wave: 1 }, point: { h: [-300, 20], el: [-300, 120], point: 1 },
  open: { h: [-340, 30], el: [-300, 110], open: 1 }, think: { h: [-95, -150], el: [-215, 80], think: 1 }, shrug: { h: [-340, 60], el: [-290, 130], open: 1 },
};
const MAP = { idle: 'idle', relax: 'idle', slump: 'idle', brace: 'open', panic: 'open', reach: 'point', halt: 'open', phone: 'idle', drink: 'think', point: 'point', open: 'open', cheer: 'wave', shake: 'open', walk: 'idle', run: 'idle', hands: 'open', cower: 'think', think: 'think', shrug: 'shrug', wave: 'wave' };

function limb(pts, w, col) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); }

/** o: {x,y,s,t,lt,pose(spec),mood(spec),look:{skin,hair,beard,hat,jacket,shirt,glasses}} ; (x,y) = neck base centre */
export function drawPresenter(o) {
  const { t, lt, look: L } = o;
  const moodName = Array.isArray(o.mood) ? o.mood.reduce((m, k) => (lt >= k[0] ? k[1] : m), o.mood[0][1]) : o.mood;
  const poseName = Array.isArray(o.pose) ? o.pose.reduce((m, k) => (lt >= k[0] ? k[1] : m), o.pose[0][1]) : o.pose;
  const F = M[moodName] || M.calm, G = GEST[MAP[poseName] || 'idle'], ta = o.talk ? talkAt(t) : 0;
  const bob = Math.sin(t * 1.7) * 5, tilt = Math.sin(t * 0.9) * 0.012 + (ta ? Math.sin(t * 9) * 0.006 : 0);
  const skin = L.skin, skinSh = shade(skin, -0.14), jacket = L.jacket, jSh = shade(jacket, -0.18), hair = L.hair, ink = '#1b1612';
  ctx.save(); ctx.translate(o.x, o.y + bob); ctx.scale(o.s, o.s);
  // --- torso (cropped by the frame bottom) ---
  const tor = (c) => { ctx.beginPath(); ctx.moveTo(-250, 640); ctx.lineTo(-262, 120); ctx.quadraticCurveTo(-250, 20, -120, 0); ctx.lineTo(120, 0); ctx.quadraticCurveTo(250, 20, 262, 120); ctx.lineTo(250, 640); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
  tor(jacket);
  ctx.beginPath(); ctx.moveTo(-96, 0); ctx.lineTo(0, 150); ctx.lineTo(96, 0); ctx.closePath(); ctx.fillStyle = L.shirt; ctx.fill();            // shirt V
  ctx.beginPath(); ctx.moveTo(-96, 0); ctx.lineTo(-30, 0); ctx.lineTo(-86, 70); ctx.closePath(); ctx.fillStyle = jSh; ctx.fill();               // lapels
  ctx.beginPath(); ctx.moveTo(96, 0); ctx.lineTo(30, 0); ctx.lineTo(86, 70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = jSh; ctx.fillRect(-4, 150, 8, 500);                                                                                          // zip line
  // --- right arm (viewer right): rests ---
  limb([[200, 70], [262, 240], [236, 430]], 74, jacket); ctx.beginPath(); ctx.ellipse(232, 452, 38, 34, 0, 0, TAU); ctx.fillStyle = skin; ctx.fill();
  // --- neck + head (tilted) ---
  ctx.fillStyle = skinSh; rr(-52, -70, 104, 90, 30); ctx.fill();
  ctx.save(); ctx.translate(0, -250); ctx.rotate(tilt);
  const hx = 128, hy = 158;
  ctx.beginPath(); ctx.ellipse(-hx + 6, 10, 26, 40, 0, 0, TAU); ctx.ellipse(hx - 6, 10, 26, 40, 0, 0, TAU); ctx.fillStyle = skinSh; ctx.fill();   // ears
  ctx.beginPath(); ctx.ellipse(0, 0, hx, hy, 0, 0, TAU); ctx.fillStyle = skin; ctx.fill();
  // beard + moustache
  if (L.beard) {
    ctx.beginPath(); ctx.moveTo(-hx + 4, -6); ctx.bezierCurveTo(-hx - 6, 120, -70, 190, 0, 192); ctx.bezierCurveTo(70, 190, hx + 6, 120, hx - 4, -6);
    ctx.bezierCurveTo(hx - 30, 40, 70, 54, 0, 52); ctx.bezierCurveTo(-70, 54, -hx + 30, 40, -hx + 4, -6); ctx.closePath(); ctx.fillStyle = hair; ctx.fill();
  }
  // hat or hair
  if (L.hat) { ctx.beginPath(); ctx.moveTo(-hx - 6, -60); ctx.bezierCurveTo(-hx - 8, -210, hx + 8, -210, hx + 6, -60); ctx.lineTo(hx + 8, -34); ctx.lineTo(-hx - 8, -34); ctx.closePath(); ctx.fillStyle = L.hat; ctx.fill();
    ctx.fillStyle = shade(L.hat, -0.22); rr(-hx - 10, -62, hx * 2 + 20, 38, 12); ctx.fill(); ctx.fillStyle = '#d4382a'; rr(-28, -54, 56, 18, 5); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(-hx - 4, -20); ctx.bezierCurveTo(-hx - 10, -190, hx + 10, -190, hx + 4, -20); ctx.bezierCurveTo(hx - 10, -92, -hx + 10, -92, -hx - 4, -20); ctx.closePath(); ctx.fillStyle = hair; ctx.fill(); }
  // eyes + brows + glasses
  const blink = (t % 3.4) < 0.1 ? 0.1 : 1, eo = clamp(F.e * blink, 0.08, 1.4);
  for (const sx of [-1, 1]) {
    const ex = sx * 52, ey = -4;
    ctx.beginPath(); ctx.ellipse(ex, ey, 17, 17 * Math.min(1, eo), 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + Math.sin(t * 0.7) * 2.5, ey + 1, 8.5 * Math.min(1.1, 0.7 + eo * 0.35), 0, TAU); ctx.fillStyle = ink; ctx.fill();
    ctx.save(); ctx.translate(ex, ey - 34 + F.b[0] * 0.8); ctx.rotate(sx * F.b[1] * Math.PI / 180); ctx.lineCap = 'round'; ctx.strokeStyle = hair === '#' ? ink : shade(hair, -0.1); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, 0); ctx.stroke(); ctx.restore();
    if (L.glasses) { ctx.beginPath(); ctx.arc(ex, ey, 40, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = '#1b1b1f'; ctx.stroke(); }
  }
  if (L.glasses) { ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(0, -16, 14, -6); ctx.lineWidth = 7; ctx.strokeStyle = '#1b1b1f'; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, 36, 14, 10, 0, 0, TAU); ctx.fillStyle = shade(skin, -0.2); ctx.fill();                                           // nose
  // mouth: open by speech + mood
  const open = clamp(F.o + ta * 0.85, 0, 1), my = L.beard ? 104 : 86, w = 40 + F.s * 10;
  if (L.beard) { ctx.beginPath(); ctx.moveTo(-70, 62); ctx.quadraticCurveTo(0, 36, 70, 62); ctx.quadraticCurveTo(0, 82, -70, 62); ctx.fillStyle = hair; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-w, my - F.s * 6);
  ctx.quadraticCurveTo(0, my + F.s * 22 + open * 6, w, my - F.s * 6); ctx.quadraticCurveTo(0, my + F.s * 22 + open * 52 + 4, -w, my - F.s * 6); ctx.closePath();
  ctx.fillStyle = open > 0.12 ? '#4a1818' : ink; ctx.fill();
  if (open > 0.3) { ctx.beginPath(); ctx.ellipse(0, my + open * 20 + 6, w * 0.45, 9 * open, 0, 0, TAU); ctx.fillStyle = '#c55'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-w * 0.55, my - F.s * 4, w * 1.1, 7); }
  ctx.restore();
  // --- raised arm (viewer left) with a hand ---
  const sw = G.wave ? Math.sin(t * 7) * 28 : G.point ? Math.sin(t * 3) * 6 : Math.sin(t * 1.3) * 6;
  const sh = [-200, 70], el = [G.el[0] - (G.wave ? 30 : 0), G.el[1]], hd = [G.h[0] + sw * (G.wave ? 1 : 0), G.h[1] + (G.wave ? 0 : sw)];
  limb([sh, el, hd], 74, jacket);
  if (G.point) { ctx.save(); ctx.translate(hd[0], hd[1]); ctx.rotate(-0.15); ctx.fillStyle = skin; rr(-90, -20, 110, 40, 20); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 6, 44, 38, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  else if (G.open || G.wave) { ctx.beginPath(); ctx.ellipse(hd[0], hd[1] - 10, 46, 52, 0.2, 0, TAU); ctx.fillStyle = skin; ctx.fill(); for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(hd[0] + k * 17, hd[1] - 56 - Math.abs(k) * -3, 10, 28, k * 0.12, 0, TAU); ctx.fill(); } }
  else { ctx.beginPath(); ctx.ellipse(hd[0], hd[1], 40, 38, 0, 0, TAU); ctx.fillStyle = skin; ctx.fill(); }
  ctx.restore();
}
