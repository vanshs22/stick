// Rigged cartoon character (v2): style-driven look (head fill, outline, limbs, hands, face mode), clothing (tee, hoodie,
// coat, dress, uniform, cloak), hats and hair, keyframed poses/moods, FK legs grounded on the floor, lip-sync from word timings.
import { ctx, clamp, lerp, TAU } from './lib.js';
import { T } from './timing.js';

const INK = '#17171B';
const rad = (d) => (d * Math.PI) / 180;
const ss = (u) => u * u * (3 - 2 * u);
const mix = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => mix(v, b[i], u)) : a && typeof a === 'object' ? Object.fromEntries(Object.keys(a).map((k) => [k, mix(a[k], b[k], u)])) : a + (b - a) * u);
function pick(spec, table, lt) {
  if (typeof spec === 'string') return table[spec] || table.idle || table.calm;
  if (lt <= spec[0][0]) return table[spec[0][1]] || table.idle || table.calm;
  for (let i = 1; i < spec.length; i++) if (lt <= spec[i][0]) { const A = table[spec[i - 1][1]] || table.idle || table.calm, B = table[spec[i][1]] || table.idle || table.calm; return mix(A, B, ss((lt - spec[i - 1][0]) / (spec[i][0] - spec[i - 1][0] || 1e-6))); }
  return table[spec[spec.length - 1][1]] || table.idle || table.calm;
}
export function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = (v) => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); }

const FACE0 = { bl: 0, bt: 0, eo: 1, sm: 0.1, mo: 0, dart: 0, trem: 0 };
const faces = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ...FACE0, ...v }]));
export const FACES = faces({
  calm: {}, worried: { bl: 10, bt: -16, eo: 1.05, sm: -0.5, mo: 0.05, dart: 0.3 }, scared: { bl: 26, bt: -10, eo: 1.3, sm: -0.3, mo: 0.6, dart: 1, trem: 1 },
  determined: { bl: -4, bt: 14, eo: 0.9, sm: 0 }, angry: { bl: -8, bt: 22, eo: 0.85, sm: -0.6, mo: 0.18, trem: 0.4 }, happy: { bl: 8, bt: -2, eo: 0.95, sm: 1, mo: 0.12 },
  relieved: { bl: 4, bt: -8, eo: 0.8, sm: 0.7, mo: 0.08 }, surprised: { bl: 30, eo: 1.35, sm: 0, mo: 0.5 }, sad: { bl: 4, bt: -20, eo: 0.82, sm: -0.85, mo: 0 }, smirk: { bl: 0, bt: 9, eo: 0.8, sm: 0.6 },
});
const POSE0 = { aL: [10, 8], aR: [10, 8], lean: 0, tilt: 0, stance: 8, bend: 4, walk: 0, wave: 0, hop: 0, jit: 0 };
const poses = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ...POSE0, ...v }]));
export const POSES = poses({
  idle: {}, relax: { aL: [14, 10], aR: [14, 10], tilt: 3 }, slump: { aL: [6, 6], aR: [6, 6], tilt: 9, lean: 4 },
  brace: { aL: [78, -28], aR: [78, -28], stance: 34, bend: 48 }, panic: { aL: [38, 152], aR: [38, 152], stance: 16, bend: 18, tilt: 6, jit: 1 },
  reach: { aR: [112, -12], aL: [14, 8], lean: 5, stance: 10 }, halt: { aL: [28, 140], aR: [28, 140], lean: -3, stance: 12 },
  phone: { aR: [60, 150], aL: [18, 12], tilt: -4 }, drink: { aR: [58, 152], aL: [18, 12], tilt: -6 }, point: { aR: [100, -5], aL: [10, 8], lean: 4 },
  open: { aL: [108, 20], aR: [108, 20], stance: 12 }, cheer: { aL: [160, 10], aR: [160, 10], stance: 12, hop: 1 },
  shake: { aR: [38, 24], aL: [10, 8], lean: 2 }, walk: { walk: 1, stance: 6, aL: [15, 10], aR: [15, 10] },
  run: { walk: 1.8, stance: 4, lean: 11, aL: [35, 95], aR: [35, 95] }, hands: { aL: [120, 70], aR: [120, 70], tilt: 4 },
  cower: { aL: [150, 125], aR: [150, 125], stance: 30, bend: 60, lean: -6, tilt: 9, jit: 0.6 }, think: { aR: [55, 155], aL: [10, 8], tilt: 7 },
  shrug: { aL: [72, 100], aR: [72, 100], tilt: 5 }, wave: { aR: [150, 30], aL: [10, 8], wave: 1, tilt: 3 },
});

/** how open the speaker's mouth is at time t (0..1), driven by the word timings */
export function talkAt(t) {
  for (const w of T.words) {
    if (t < w.s - 0.02) return 0;
    if (t <= w.e + 0.05) {
      const p = clamp((t - w.s) / Math.max(0.08, w.e - w.s)), syl = Math.max(1, Math.round((w.e - w.s) / 0.16));
      return (0.3 + 0.7 * Math.abs(Math.sin(p * syl * Math.PI))) * clamp(Math.min((t - w.s + 0.02) / 0.05, (w.e + 0.05 - t) / 0.05) + 0.2);
    }
  }
  return 0;
}

function limb(pts, w, col) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
const ellipse = (x, y, rx, ry, fill, stroke, lw = 6, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke && lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } };

function drawFace(F, o, t, ta, look, fx) {
  const sc = o.sc, mode = sc.face, dark = sc.head === 'black', bu = ((t + o.seed * 1.7) % 3.7) - 3.5, blink = bu > 0 ? Math.max(0, 1 - Math.abs(bu - 0.08) / 0.08) : 0;
  const eo = Math.max(0.07, F.eo * (1 - 0.93 * blink)), ol = sc.outline > 0 ? sc.outline * 0.6 : 0, lineCol = dark ? '#F2E9DA' : INK;
  if (o.faceless) return;
  const lk = [look[0] + F.dart * Math.sin(t * 9.1 + o.seed) * 0.7, look[1] + F.dart * Math.sin(t * 7.3) * 0.35];
  for (const side of [-1, 1]) {
    const ex = side * 44, ey = -4;
    if (mode === 'full') {
      const inner = ex - side * 30, outer = ex + side * 30, top = ey - 32 * eo;
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 29, 32 * eo, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(ex - 40, ey - 50, 80, 100);
      const px = ex + lk[0] * 10, py = ey + lk[1] * 11; ellipse(px, py, 13.5 - F.dart * 3, 13.5 - F.dart * 3, INK); ellipse(px + 4.5, py - 5, 4, 4, '#FFFFFF');
      const inD = Math.max(0, F.bt) * 1.1, outD = Math.max(0, -F.bt) * 0.8;
      ctx.beginPath(); ctx.moveTo(outer, ey - 60); ctx.lineTo(inner, ey - 60); ctx.lineTo(inner, top + inD); ctx.lineTo(outer, top + outD); ctx.closePath(); ctx.fillStyle = o.headFill; ctx.fill(); ctx.restore();
      ellipse(ex, ey, 29, 32 * eo, null, INK, 6);
      if (inD > 1 || outD > 1) limb([[outer, top + outD], [inner, top + inD]], 6, INK);
    } else if (dark) {
      // round white eyes on a dark head (amber-noir look)
      const ry = 25 * Math.min(1.25, eo), px = lk[0] * 7, py = lk[1] * 6;
      ellipse(ex, ey, 23, ry, '#F6EFE2'); if (eo > 0.25) ellipse(ex + px, ey + py, 10 - F.dart * 3, Math.min(10 - F.dart * 3, ry * 0.7), '#14090f');
      if (F.bt > 8) limb([[ex - side * 24, ey - ry - 6 + F.bt * 0.4], [ex + side * 22, ey - ry - 2]], 6, '#F2E9DA');
    } else {
      // minimal dot eyes on a white head
      ellipse(ex, ey, 10, 15 * Math.min(1.3, eo), INK); if (eo > 0.4) ellipse(ex + 3, ey - 5, 3, 3, '#FFFFFF');
    }
    const by = -62 - F.bl;
    if (mode === 'full' || !dark) { ctx.beginPath(); ctx.moveTo(side * 72, by); ctx.quadraticCurveTo(side * 44, by - 12 + F.bt * 0.5, side * 16, by + F.bt); ctx.lineWidth = mode === 'full' ? 13 : 8; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); }
    if (F.sm > 0.6 && sc.blush) ellipse(side * 64, 30, 20, 11, 'rgba(255,90,80,0.2)');
  }
  if (mode === 'full') { ctx.beginPath(); ctx.arc(0, 26, 9, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,30,20,0.55)'; ctx.stroke(); }
  const m = clamp(Math.max(F.mo, ta * 0.85)), sm = F.sm, my = mode === 'full' ? 46 : 52, w = 28 + 8 * Math.max(0, sm), cy = my - sm * 9;
  if (m > 0.1) {
    const h = 8 + m * 30;
    if (sm < -0.1) { ellipse(0, my + 10 + h * 0.3, w * 0.52, 10 + h * 0.75, dark ? '#F2E9DA' : '#6E2430', dark ? null : INK, 6); if (!dark) ellipse(0, my + 14 + h * 0.8, w * 0.32, h * 0.3, '#D9646E'); return; }
    ctx.beginPath(); ctx.moveTo(-w, cy); ctx.quadraticCurveTo(0, my + 3 - sm * 3, w, cy); ctx.quadraticCurveTo(0, my + h * 1.7, -w, cy); ctx.closePath();
    ctx.save(); ctx.clip(); ctx.fillStyle = dark ? '#F2E9DA' : '#6E2430'; ctx.fillRect(-w - 4, my - 30, w * 2 + 8, 120);
    if (!dark) { if (m > 0.25 || sm > 0.5) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-w, my - 22, w * 2, 22); } ellipse(0, my + h * 0.9, 15, h * 0.28, '#D9646E'); }
    ctx.restore(); if (!dark) { ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); }
  } else { ctx.beginPath(); ctx.moveTo(-w, cy); ctx.quadraticCurveTo(0, my + sm * 16 + 4, w, cy); ctx.lineWidth = 7; ctx.strokeStyle = lineCol; ctx.lineCap = 'round'; ctx.stroke(); }
}

function drawHead(o, F, P, t, ta, look) {
  const sc = o.sc, R = 116, hairCol = o.hairColor, hat = o.hat, hood = hat === 'hood' || o.top === 'cloak';
  ctx.save(); ctx.translate(0, -300); ctx.rotate(rad(P.tilt + 1.6 * Math.sin(t * 1.3 + o.seed) + ta * 2)); ctx.translate(0, -118);
  if (hood) { ellipse(0, 6, R + 20, R + 22, o.shirt, sc.outline > 0 ? INK : null, 8); ellipse(0, 6, R + 20, R + 22, null, sc.outline > 0 ? INK : 'rgba(255,200,140,0.35)', sc.outline > 0 ? 8 : 4); }
  const blobs = (r, n = 11, a0 = 185, da = 17) => { for (let k = 0; k < n; k++) { const a = rad(a0 + k * da); ellipse(Math.cos(a) * 106, Math.sin(a) * 106, r, r, hairCol); } };
  if (o.hair === 'curly') blobs(38);
  if (o.hair === 'bun') ellipse(34, -R - 12, 46, 44, hairCol, INK, 6);
  if (o.hair === 'long') { ellipse(-R + 6, 40, 40, 120, hairCol); ellipse(R - 6, 40, 40, 120, hairCol); }
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = o.headFill; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = o.headShade; ctx.fillRect(-R, -R, R * 2, R * 2); ellipse(-16, -14, R - 4, R - 4, o.headFill); ctx.restore();
  if (sc.outline > 0) ellipse(0, 0, R, R, null, INK, sc.outline); else ellipse(0, 0, R, R, null, 'rgba(255,200,140,0.4)', 4);
  drawFace(F, o, t, ta, look);
  if (['curly', 'bun', 'short', 'long'].includes(o.hair) && !hood) {
    const a0 = rad(198), a1 = rad(342), x0 = Math.cos(a0) * (R - 2), y0 = Math.sin(a0) * (R - 2), x1 = Math.cos(a1) * (R - 2), y1 = Math.sin(a1) * (R - 2), cy = o.hair === 'curly' ? -92 : -80;
    ctx.beginPath(); ctx.arc(0, 0, R + 2, a0, a1); ctx.quadraticCurveTo(0, cy, x0, y0); ctx.closePath(); ctx.fillStyle = hairCol; ctx.fill();
    if (o.hair === 'curly') for (let u = 0.04; u < 1; u += 0.12) { const q = 1 - u, bx = q * q * x1 + u * u * x0, by = q * q * y1 + 2 * q * u * cy + u * u * y0; ellipse(bx, by, 17, 17, hairCol); }
  }
  if (!hood && (hat === 'cap' || hat === 'beanie' || hat === 'chef')) {
    const hc = hat === 'chef' ? '#F6F6F2' : shade(o.shirt, -0.12);
    if (hat === 'chef') { ellipse(0, -R - 20, 74, 56, hc, INK, 7); ctx.fillStyle = hc; ctx.fillRect(-82, -R + 6, 164, 30); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.strokeRect(-82, -R + 6, 164, 30); }
    else { ctx.beginPath(); ctx.arc(0, 0, R + 6, rad(187), rad(353)); ctx.quadraticCurveTo(0, -48, Math.cos(rad(187)) * (R + 6), Math.sin(rad(187)) * (R + 6)); ctx.closePath(); ctx.fillStyle = hc; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
      if (hat === 'cap') { ellipse(70, -52, 78, 15, shade(hc, -0.2), INK, 7); ellipse(0, -112, 15, 15, '#F2C64B', INK, 4); } else ellipse(0, -R + 6, 100, 16, shade(hc, 0.15), INK, 6); }
  }
  ctx.restore();
}

/**
 * o: { t, lt, x, y(ground), s, dir, pose, mood, look(lt)=>[x,y], talk, hold(x,y), sc(style.character), outfit{top,color,hat,skin,hair,female,faceless}, seed }
 * pose / mood: a name or [[localTime, name], ...] keyframes blended smoothly.
 */
export function drawChar(o) {
  const sc = { head: 'skin', outline: 10, limbs: INK, limbW: 20, hands: 'glove', face: 'full', blush: true, ...(o.sc || {}) }, of = o.outfit || {};
  const skin = of.skin || '#E8B48C', headFill = sc.head === 'white' ? '#FFFDF7' : sc.head === 'black' ? '#141116' : skin, headShade = sc.head === 'white' ? '#DAD3C6' : sc.head === 'black' ? '#1F1A21' : shade(skin, -0.16);
  const shirt = of.color || '#D6452F', top = of.top || 'tee';
  o = { s: 0.85, dir: 1, seed: 0, lt: 0, pose: 'idle', mood: 'calm', hairColor: sc.head === 'black' ? '#0E0A0D' : INK, ...o, sc, shirt, top, hat: of.hat || 'none', hair: sc.head === 'black' ? 'none' : of.hair || 'short', faceless: !!of.faceless, headFill, headShade, skin };
  if (top === 'cloak') { o.headFill = '#ECE7DB'; o.headShade = '#CFC9B9'; o.faceless = true; o.hat = 'hood'; }
  const { t, lt, x, y, s, dir, seed } = o, P = pick(o.pose, POSES, lt), F = pick(o.mood, FACES, lt), ta = o.talk ? talkAt(t) : 0;
  const look = o.look ? o.look(lt) : [Math.sin(t * 0.8 + seed) * 0.35, Math.sin(t * 0.53 + seed * 2) * 0.2];
  const ph = t * 6.6 * Math.max(1, P.walk) + seed, pants = sc.head === 'skin' ? (of.pants || '#2B3350') : sc.limbs, limbCol = sc.limbs, LW = sc.limbW;
  const legs = [-1, 1].map((side) => {
    const q = ph + (side < 0 ? 0 : Math.PI), w = P.walk * Math.sin(q), lift = P.walk * Math.max(0, Math.cos(q));
    const th1 = rad(side * P.stance + 26 * w), th2 = th1 - rad(side * P.bend + 38 * lift), hx = side * 36, kx = hx + 190 * Math.sin(th1), ky = 190 * Math.cos(th1);
    return { side, h: [hx, 0], k: [kx, ky], f: [kx + 190 * Math.sin(th2), ky + 190 * Math.cos(th2)] };
  });
  const fmax = Math.max(...legs.map((l) => l.f[1])), hop = Math.abs(Math.sin(t * 7 + seed)) * 36 * P.hop, bob = Math.sin(t * 2.6 + seed) * 3 - Math.abs(Math.sin(ph)) * 12 * Math.min(1.4, P.walk) - hop, hipY = y - (fmax + 14) * s;
  const jx = (P.jit + F.trem) * (Math.sin(t * 61 + seed) * 2.2 + Math.sin(t * 43) * 1.4);
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18); ctx.beginPath(); ctx.arc(0, 0, 150 * s * (1 - hop * 0.15), 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x + Math.sin(t * 2.1 + seed) * 3 * s + jx * s, hipY + bob * s); ctx.scale(dir * s, s);
  const longSleeve = ['hoodie', 'coat', 'uniform', 'cloak'].includes(top), cloak = top === 'cloak';
  if (!cloak) for (const L of legs) {
    if (top === 'dress' || sc.head !== 'skin') limb([L.h, L.k], 22, limbCol); else { limb([L.h, L.k], 46, INK); limb([L.h, L.k], 34, pants); }
    limb([L.k, L.f], LW, limbCol);
    ellipse(L.f[0] + 14, L.f[1] + 4, 38, 18, sc.head === 'skin' ? '#2A2A33' : limbCol, sc.outline > 0 ? INK : null, 5);
  }
  ctx.rotate(rad(P.lean));
  const arms = [-1, 1].map((side) => {
    const [a1, a2] = side < 0 ? P.aL : P.aR, sw = side * P.walk * 18 * Math.sin(ph + (side < 0 ? Math.PI : 0)), wv = side > 0 ? P.wave * 24 * Math.sin(t * 9) : 0;
    const A1 = a1 + 2.5 * Math.sin(t * 2.3 + side + seed) + sw, A2 = a2 + 3 * Math.sin(t * 2.9 + side * 1.3 + seed) + wv;
    const sx = side * 86, sy = -270, t1 = rad(A1), t2 = rad(A1 + A2), ex = sx + side * 150 * Math.sin(t1), ey = sy + 150 * Math.cos(t1);
    return { side, s: [sx, sy], e: [ex, ey], h: [ex + side * 140 * Math.sin(t2), ey + 140 * Math.cos(t2)] };
  });
  // body
  const bottom = top === 'coat' ? 96 : top === 'dress' ? 130 : cloak ? 330 : 8, flare = top === 'dress' ? 62 : cloak ? 70 : top === 'coat' ? 8 : 0;
  ctx.save(); ctx.scale(1 + Math.sin(t * 2.4 + seed) * 0.008, 1 + Math.sin(t * 2.4 + seed) * 0.014);
  if (!cloak) { ctx.fillStyle = headShade; ctx.fillRect(-17, -322, 34, 40); }
  if (top === 'hoodie' && o.hat !== 'hood') ellipse(0, -292, 78, 34, shade(shirt, -0.28), INK, 7);
  const torso = new Path2D(); torso.moveTo(-90, -270); torso.quadraticCurveTo(0, -312, 90, -270); torso.quadraticCurveTo(100, -140, 74 + flare, bottom - (cloak ? 30 : 0)); torso.quadraticCurveTo(0, bottom + 18, -74 - flare, bottom - (cloak ? 30 : 0)); torso.quadraticCurveTo(-100, -140, -90, -270); torso.closePath();
  ctx.fillStyle = shirt; ctx.fill(torso); ctx.save(); ctx.clip(torso); ctx.fillStyle = shade(shirt, -0.26); ctx.beginPath(); ctx.moveTo(26, -330); ctx.lineTo(160, -330); ctx.lineTo(160, bottom + 40); ctx.lineTo(40, bottom + 40); ctx.quadraticCurveTo(56, -140, 26, -330); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-170, bottom - 28, 340, 40);
  if (top === 'hoodie') { ctx.fillStyle = shade(shirt, -0.18); ctx.fillRect(-48, -90, 96, 50); }
  if (top === 'uniform') { ctx.fillStyle = '#E6C64B'; ctx.fillRect(-90, -52, 180, 14); ctx.fillRect(28, -200, 26, 22); }
  if (top === 'coat') { ctx.fillStyle = shade(shirt, 0.55); ctx.beginPath(); ctx.moveTo(-26, -300); ctx.lineTo(26, -300); ctx.lineTo(0, -120); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-26, -300); ctx.lineTo(0, -120); ctx.lineTo(26, -300); ctx.stroke(); }
  ctx.restore(); ctx.lineWidth = sc.outline > 0 ? Math.max(6, sc.outline - 1) : 4; ctx.strokeStyle = sc.outline > 0 ? INK : 'rgba(255,200,140,0.32)'; ctx.stroke(torso);
  if (top !== 'coat' && top !== 'cloak') { ctx.beginPath(); ctx.arc(0, -296, 26, 0.1 * Math.PI, 0.9 * Math.PI); ctx.fillStyle = headFill; ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); }
  ctx.restore();
  drawHead(o, F, P, t, ta, look);
  for (const A of arms) {
    if (longSleeve) { limb([A.s, A.e, A.h], 46, sc.outline > 0 ? INK : 'rgba(0,0,0,0)'); limb([A.s, A.e, A.h], 34, shirt); }
    else { limb([A.s, A.e, A.h], LW, limbCol); const mx = lerp(A.s[0], A.e[0], 0.55), my = lerp(A.s[1], A.e[1], 0.55); limb([A.s, [mx, my]], 46, INK); limb([A.s, [mx, my]], 34, shirt); }
    if (o.hold && A.side === 1) o.hold(A.h[0], A.h[1]);
    const ang = Math.atan2(A.h[1] - A.e[1], A.h[0] - A.e[0]), hc = Math.cos(ang), hs = Math.sin(ang);
    if (sc.hands === 'glove') { ellipse(A.h[0] + A.side * 14, A.h[1] - 14, 13, 17, '#FFFFFF', INK, 5, ang); ellipse(A.h[0] + hc * 10, A.h[1] + hs * 10, 27, 22, '#FFFFFF', INK, 6, ang); }
    else if (sc.hands === 'mitten') { ellipse(A.h[0] + hc * 8, A.h[1] + hs * 8, 22, 19, longSleeve ? limbCol : limbCol, null, 0, ang); ellipse(A.h[0] + A.side * 10, A.h[1] - 10, 9, 11, limbCol); }
  }
  ctx.restore();
}
