// General sets: perspective rooms (room/office/cafe/kitchen), corridor (hallway), outdoor scenery (street/outdoor/forest).
// All are pure functions of time and take the style palette, time of day and weather.
import { ctx, W, H, lerp, clamp, rnd, TAU } from './lib.js';
import { shade } from './rig.js';
import { BX0, BX1, BY0, BY1, lw, rw, cp, fp, poly, ln, grad, glow, motes } from './stage.js';

const tone = (hex, tod) => (tod === 'night' ? shade(hex, -0.46) : tod === 'dusk' ? shade(hex, -0.22) : tod === 'dawn' ? shade(hex, -0.08) : hex);
const SKY = { day: ['#7EC4EA', '#F4EAD0'], dawn: ['#7E8FC4', '#F8C79C'], dusk: ['#3E3B6E', '#F29A5E'], night: ['#060811', '#1B2342'] };
const skyOf = (tod, pal) => (tod === 'night' ? [pal.sky?.[0] && pal.night ? pal.sky[0] : SKY.night[0], SKY.night[1]] : tod === 'day' && pal.sky ? pal.sky : SKY[tod] || SKY.day);

function sun(tod, x, y, r, t) {
  if (tod === 'night') { glow(x, y, r * 4, 'rgba(210,225,255,A)', 0.25); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#F3F1E4'; ctx.fill(); ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.9, 0, TAU); ctx.fillStyle = 'rgba(8,10,24,0.55)'; ctx.fill(); }
  else { glow(x, y, r * 5, tod === 'dusk' ? 'rgba(255,150,80,A)' : 'rgba(255,240,190,A)', 0.4); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = tod === 'dusk' ? '#FFC27A' : '#FFF4C8'; ctx.fill(); }
}
function skyBox(x, y, w, h, tod, pal, t, weather, city = true) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const [a, b] = skyOf(tod, pal); ctx.fillStyle = grad(0, y, 0, y + h, [[0, a], [1, b]]); ctx.fillRect(x, y, w, h);
  if (tod === 'night') for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(255,255,230,${0.3 + 0.4 * Math.sin(t * 2 + i)})`; ctx.fillRect(x + rnd(i) * w, y + rnd(i + 5) * h * 0.6, 3, 3); }
  sun(tod, x + w * 0.72, y + h * 0.28, Math.min(w, h) * 0.1, t);
  if (city) { ctx.fillStyle = tone('#5C6786', tod); for (let i = 0; i < 6; i++) ctx.fillRect(x + i * w / 6, y + h * (0.55 + rnd(i + 20) * 0.2), w / 6 - 6, h); ctx.fillStyle = tone('#3C4566', tod); for (let i = 0; i < 5; i++) ctx.fillRect(x + i * w / 5 + 10, y + h * (0.7 + rnd(i + 30) * 0.15), w / 5 - 14, h);
    if (tod === 'night' || tod === 'dusk') for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(255,214,130,0.85)'; ctx.fillRect(x + rnd(i + 40) * w, y + h * (0.74 + rnd(i + 50) * 0.24), 4, 5); } }
  if (weather === 'rain' || weather === 'storm') { ctx.strokeStyle = 'rgba(200,220,255,0.35)'; ctx.lineWidth = 2; for (let i = 0; i < 26; i++) { const rx = x + rnd(i + 60) * w, ry = y + ((rnd(i + 70) * h + t * 520) % h); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 26); ctx.stroke(); } }
  ctx.restore();
}

// ---------- props on the back wall / floor ----------
function winProp(x, y, w, h, o) { skyBox(x, y, w, h, o.tod, o.pal, o.t, o.weather); ctx.lineWidth = 12; ctx.strokeStyle = shade(o.pal.wall, -0.45); ctx.strokeRect(x, y, w, h); ln([x + w / 2, y], [x + w / 2, y + h], ctx.strokeStyle, 8); ln([x, y + h * 0.5], [x + w, y + h * 0.5], ctx.strokeStyle, 8);
  ctx.fillStyle = tone('#B24A4A', o.tod); ctx.beginPath(); ctx.moveTo(x - 16, y - 10); ctx.lineTo(x + w * 0.2, y - 10); ctx.lineTo(x + w * 0.12, y + h + 20); ctx.lineTo(x - 16, y + h + 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + w + 16, y - 10); ctx.lineTo(x + w * 0.8, y - 10); ctx.lineTo(x + w * 0.88, y + h + 20); ctx.lineTo(x + w + 16, y + h + 20); ctx.fill(); }
function lampProp(x, base, o, s = 1) { ln([x, base], [x, base - 250 * s], '#2A2A33', 8); poly([[x - 52 * s, base - 250 * s], [x + 52 * s, base - 250 * s], [x + 34 * s, base - 330 * s], [x - 34 * s, base - 330 * s]], o.tod === 'night' ? '#FFD98A' : '#E9D8B0'); if (o.tod === 'night' || o.tod === 'dusk') { glow(x, base - 280 * s, 420 * s, 'rgba(255,200,120,A)', 0.4); } }
function deskProp(x, base, o) { poly([[x - 190, base - 150], [x + 190, base - 150], [x + 190, base - 126], [x - 190, base - 126]], tone('#A57444', o.tod), '#2A1E14', 4); ctx.fillStyle = tone('#7A5230', o.tod); ctx.fillRect(x - 170, base - 126, 20, 126); ctx.fillRect(x + 150, base - 126, 20, 126);
  poly([[x - 70, base - 150], [x + 70, base - 150], [x + 60, base - 290], [x - 60, base - 290]], '#10151F', '#2A3447', 5); poly([[x - 56, base - 160], [x + 56, base - 160], [x + 50, base - 278], [x - 50, base - 278]], '#1E4B7A'); glow(x, base - 220, 300, 'rgba(110,190,255,A)', 0.22); ctx.fillStyle = '#2A3447'; ctx.fillRect(x - 12, base - 152, 24, 14); }
function tableProp(x, base, o) { ctx.fillStyle = tone('#B5834F', o.tod); ctx.beginPath(); ctx.ellipse(x, base - 150, 160, 40, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 5; ctx.stroke(); ctx.fillStyle = tone('#7A5230', o.tod); ctx.fillRect(x - 12, base - 150, 24, 150); ctx.fillStyle = '#F6F1E6'; ctx.fillRect(x - 24, base - 200, 48, 48); ctx.strokeRect(x - 24, base - 200, 48, 48); }
function bedProp(x, base, o) { poly([[x - 170, base - 90], [x + 170, base - 90], [x + 170, base], [x - 170, base]], tone('#5E6FA8', o.tod), '#1B2238', 5); poly([[x - 170, base - 130], [x + 170, base - 130], [x + 170, base - 90], [x - 170, base - 90]], tone('#E9E4D8', o.tod), '#1B2238', 5); ctx.fillStyle = tone('#FFFFFF', o.tod); ctx.beginPath(); ctx.ellipse(x - 100, base - 145, 62, 22, 0, 0, TAU); ctx.fill(); }
function sofaProp(x, base, o) { poly([[x - 200, base - 200], [x + 200, base - 200], [x + 200, base - 100], [x - 200, base - 100]], tone('#5E7FA3', o.tod), '#1B2238', 5); poly([[x - 230, base - 120], [x + 230, base - 120], [x + 230, base], [x - 230, base]], tone('#4C6A8C', o.tod), '#1B2238', 5); }
function counterProp(x, base, o) { ctx.fillStyle = tone('#7E5A41', o.tod); ctx.fillRect(x - 230, base - 190, 460, 190); ctx.fillStyle = tone('#E4D9C4', o.tod); ctx.fillRect(x - 244, base - 214, 488, 28); ctx.fillStyle = tone('#E9EEF2', o.tod); ctx.fillRect(x - 230, base - 440, 110, 250); ctx.strokeStyle = '#2A2F3A'; ctx.lineWidth = 5; ctx.strokeRect(x - 230, base - 440, 110, 250); }
function doorProp(x, base, o, w = 150, h = 380) { ctx.fillStyle = tone('#7A5236', o.tod); ctx.fillRect(x - w / 2, base - h, w, h); ctx.strokeStyle = '#1D130C'; ctx.lineWidth = 6; ctx.strokeRect(x - w / 2, base - h, w, h); ctx.strokeRect(x - w / 2 + 16, base - h + 20, w - 32, h * 0.38); ctx.strokeRect(x - w / 2 + 16, base - h + h * 0.48, w - 32, h * 0.42); ctx.beginPath(); ctx.arc(x + w / 2 - 22, base - h * 0.45, 9, 0, TAU); ctx.fillStyle = '#E3B23C'; ctx.fill(); }
function shelfProp(x, base, o) { ctx.fillStyle = tone('#6B4A30', o.tod); ctx.fillRect(x - 100, base - 420, 200, 420); for (let r = 0; r < 4; r++) { ctx.fillStyle = tone('#3F2C1C', o.tod); ctx.fillRect(x - 100, base - 420 + r * 104, 200, 8); for (let b = 0; b < 7; b++) { ctx.fillStyle = tone(['#B24A4A', '#3E6FA8', '#C9A24A', '#4FA36A'][(b + r) % 4], o.tod); ctx.fillRect(x - 92 + b * 26, base - 414 + r * 104 + 12, 20, 86 - (b % 3) * 8); } } }
function plantProp(x, base, o) { ctx.fillStyle = tone('#8A5A3C', o.tod); ctx.fillRect(x - 30, base - 70, 60, 70); for (const [dx, dy, r] of [[-26, -120, -0.5], [0, -150, 0], [26, -118, 0.5], [-8, -178, -0.2]]) { ctx.save(); ctx.translate(x + dx, base + dy); ctx.rotate(r); ctx.beginPath(); ctx.ellipse(0, 0, 22, 62, 0, 0, TAU); ctx.fillStyle = tone('#4F9A5B', o.tod); ctx.fill(); ctx.restore(); } }
function clockProp(x, y, o) { ctx.beginPath(); ctx.arc(x, y, 46, 0, TAU); ctx.fillStyle = tone('#F4F0E6', o.tod); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#2A2F3A'; ctx.stroke(); const a = o.t * 0.05; ln([x, y], [x + Math.sin(a) * 30, y - Math.cos(a) * 30], '#222', 5); ln([x, y], [x + Math.sin(a * 12) * 38, y - Math.cos(a * 12) * 38], '#222', 3); }
function pictureProp(x, y, o) { ctx.fillStyle = '#2A1E14'; ctx.fillRect(x - 70, y - 54, 140, 108); ctx.fillStyle = tone(['#D9A36B', '#8FB8C9', '#C98F8F'][Math.floor(rnd(Math.floor(x)) * 3)], o.tod); ctx.fillRect(x - 58, y - 42, 116, 84); ctx.fillStyle = tone('#6E8F5E', o.tod); ctx.beginPath(); ctx.moveTo(x - 58, y + 42); ctx.lineTo(x - 10, y - 4); ctx.lineTo(x + 20, y + 20); ctx.lineTo(x + 58, y - 14); ctx.lineTo(x + 58, y + 42); ctx.fill(); }
function pendant(x, o, t) { ln([x, 0], [x, 210], '#222', 4); poly([[x - 56, 270], [x + 56, 270], [x + 30, 210], [x - 30, 210]], tone('#2D7A6B', o.tod)); glow(x, 280, 380, 'rgba(255,220,150,A)', o.tod === 'night' ? 0.4 : 0.22); }

const KIT = {
  room: (o) => [['window', 0.26], ['picture', 0.7], ['lamp', 0.9], ['sofa', 0.55]],
  bedroom: (o) => [['window', 0.28], ['picture', 0.7], ['lamp', 0.92], ['bed', 0.62]],
  office: (o) => [['window', 0.3], ['clock', 0.62], ['shelf', 0.86], ['desk', 0.52], ['lamp', 0.2]],
  cafe: (o) => [['window', 0.36], ['pendant', 0.66], ['plant', 0.9], ['table', 0.5], ['picture', 0.1]],
  kitchen: (o) => [['window', 0.42], ['picture', 0.8], ['counter', 0.2], ['table', 0.64]],
};
function placeProps(kind, o) {
  const bx = (u) => lerp(BX0, BX1, u), wallTop = BY0 + 40;
  for (const [p, u] of KIT[kind](o)) {
    const x = bx(u);
    if (p === 'window') winProp(x - 120, wallTop + 40, 240, 300, o); else if (p === 'picture') pictureProp(x, wallTop + 120, o); else if (p === 'clock') clockProp(x, wallTop + 110, o);
    else if (p === 'lamp') lampProp(x, BY1, o); else if (p === 'sofa') sofaProp(x, BY1, o); else if (p === 'bed') bedProp(x, BY1, o); else if (p === 'desk') deskProp(x, BY1, o);
    else if (p === 'table') tableProp(x, BY1, o); else if (p === 'counter') counterProp(x, BY1, o); else if (p === 'shelf') shelfProp(x, BY1, o); else if (p === 'plant') plantProp(x, BY1, o); else if (p === 'pendant') pendant(x, o, o.t);
  }
}

/** perspective room. kind: room|bedroom|office|cafe|kitchen */
export function room(o) {
  const { t, tod, pal, kind = 'room', shake = 0 } = o, W0 = tone(pal.wall, tod), F0 = tone(pal.floor, tod);
  ctx.save(); ctx.translate(Math.sin(shake * 23) * 6, Math.cos(shake * 19) * 4);
  ctx.fillStyle = '#080A12'; ctx.fillRect(-300, -300, W + 600, H + 600);
  poly([[BX0, BY0], [BX1, BY0], [BX1, BY1], [BX0, BY1]], grad(0, BY0, 0, BY1, [[0, shade(W0, 0.06)], [1, shade(W0, -0.12)]]));
  ctx.fillStyle = shade(F0, -0.25); ctx.fillRect(BX0, BY1 - 26, BX1 - BX0, 26);
  placeProps(kind, o);
  poly([cp(-0.3, -0.3), cp(1.3, -0.3), cp(1.3, 1), cp(-0.3, 1)], grad(0, 0, 0, BY0, [[0, shade(W0, -0.55)], [1, shade(W0, -0.3)]]));
  poly([lw(-0.3, 0), lw(1, 0), lw(1, 1), lw(-0.3, 1)], grad(0, 0, BX0, 0, [[0, shade(W0, -0.35)], [1, shade(W0, -0.12)]]));
  poly([rw(-0.3, 0), rw(1, 0), rw(1, 1), rw(-0.3, 1)], grad(W, 0, BX1, 0, [[0, shade(W0, -0.38)], [1, shade(W0, -0.14)]]));
  ln(lw(-0.2, 0.86), lw(1, 0.86), shade(W0, -0.3), 22); ln(rw(-0.2, 0.86), rw(1, 0.86), shade(W0, -0.3), 22);
  poly([fp(-0.3, -0.3), fp(1.3, -0.3), fp(1.3, 1), fp(-0.3, 1)], grad(0, BY1, 0, H, [[0, shade(F0, 0.1)], [0.5, F0], [1, shade(F0, -0.5)]]));
  for (const b of [0.18, 0.4, 0.62, 0.82]) ln(fp(-0.3, b), fp(1.3, b), 'rgba(0,0,0,0.12)', 3);
  for (const a of [0, 0.2, 0.4, 0.6, 0.8, 1]) ln(fp(a, 1), fp(lerp(-0.6, 1.6, a), -0.3), 'rgba(0,0,0,0.1)', 3);
  glow(540, 380, 900, tod === 'night' ? 'rgba(255,200,130,A)' : 'rgba(255,245,215,A)', tod === 'night' ? 0.1 : 0.2);
  if (tod === 'night') { ctx.fillStyle = 'rgba(6,10,28,0.16)'; ctx.fillRect(-300, -300, W + 600, H + 600); }
  motes(t, 18); ctx.restore();
}

/** one-point corridor: doors along both walls, flickering lights, fog */
export function hallway(o) {
  const { t, tod, pal, flick = 0, shake = 0 } = o, W0 = tone(pal.wall, tod === 'day' ? 'dusk' : tod), F0 = tone(pal.floor, 'night');
  ctx.save(); ctx.translate(Math.sin(shake * 23) * 6, Math.cos(shake * 19) * 4);
  ctx.fillStyle = '#04050A'; ctx.fillRect(-300, -300, W + 600, H + 600);
  poly([[BX0, BY0], [BX1, BY0], [BX1, BY1], [BX0, BY1]], grad(0, BY0, 0, BY1, [[0, '#080A10'], [1, shade(W0, -0.4)]]));
  doorProp(540, BY1, { tod: 'night' }, 120, 300); glow(540, 900, 260, 'rgba(255,200,120,A)', 0.12);
  poly([cp(-0.3, -0.3), cp(1.3, -0.3), cp(1.3, 1), cp(-0.3, 1)], grad(0, 0, 0, BY0, [[0, shade(W0, -0.7)], [1, shade(W0, -0.45)]]));
  poly([lw(-0.3, 0), lw(1, 0), lw(1, 1), lw(-0.3, 1)], grad(0, 0, BX0, 0, [[0, shade(W0, -0.4)], [1, shade(W0, -0.2)]]));
  poly([rw(-0.3, 0), rw(1, 0), rw(1, 1), rw(-0.3, 1)], grad(W, 0, BX1, 0, [[0, shade(W0, -0.42)], [1, shade(W0, -0.22)]]));
  for (const u of [0.2, 0.5, 0.78]) for (const side of [lw, rw]) { const a = side(u, 0.26), b = side(u + 0.14, 0.26), c = side(u + 0.14, 1), d = side(u, 1); poly([a, b, c, d], shade(W0, -0.5), '#02030A', 4); poly([side(u + 0.02, 0.32), side(u + 0.12, 0.32), side(u + 0.12, 0.98), side(u + 0.02, 0.98)], tone('#6B4A30', 'night'), '#050404', 3); }
  poly([fp(-0.3, -0.3), fp(1.3, -0.3), fp(1.3, 1), fp(-0.3, 1)], grad(0, BY1, 0, H, [[0, '#2A2330'], [1, '#0C0A12']]));
  poly([fp(0.3, 1), fp(0.7, 1), fp(0.92, -0.3), fp(0.08, -0.3)], 'rgba(120,30,40,0.55)');
  for (const b of [0.2, 0.5, 0.8]) { const on = Math.sin(t * 13 + b * 9) > -0.1 - flick * 0.7 ? 1 : 0.15; glow(...cp(0.5, b), 260 - b * 120, 'rgba(255,225,170,A)', 0.4 * on); const [lx, ly] = cp(0.5, b); ctx.fillStyle = `rgba(255,245,210,${0.9 * on})`; ctx.fillRect(lx - 40 + b * 20, ly - 6, 80 - b * 40, 10); }
  ctx.restore();
}

// ---------- outdoor scenery with parallax ----------
export function outside(o) {
  const { t, tod, pal, kind = 'street', weather = 'none', px = 0 } = o, [a, b] = skyOf(tod, pal), HZ = 1120;
  ctx.fillStyle = grad(0, 0, 0, HZ, [[0, a], [1, b]]); ctx.fillRect(-300, -300, W + 600, HZ + 300);
  if (tod === 'night') for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,235,${0.25 + 0.5 * Math.abs(Math.sin(t * 1.4 + i))})`; ctx.fillRect(rnd(i) * W - px * 0.05, rnd(i + 9) * 700, 3, 3); }
  sun(tod, 760 - px * 0.1, 360, 64, t);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = tod === 'night' ? 'rgba(40,50,80,0.5)' : 'rgba(255,255,255,0.7)'; const cx = ((rnd(i + 3) * 1500 + t * (6 + i * 2)) % 1500) - 200 - px * 0.12; ctx.beginPath(); ctx.ellipse(cx, 220 + i * 90, 150, 40, 0, 0, TAU); ctx.ellipse(cx + 80, 200 + i * 90, 100, 36, 0, 0, TAU); ctx.fill(); }
  const layer = (k, par, base, hMin, hMax, col, wMin, wMax, win) => { const sx = -px * par; ctx.fillStyle = col; for (let i = -2; i < 16; i++) { const bw = wMin + rnd(k + i) * (wMax - wMin), bh = hMin + rnd(k + i + 30) * (hMax - hMin), bx = sx + i * ((wMin + wMax) / 2); ctx.fillRect(bx, base - bh, bw, bh + 4);
      if (win && (tod === 'night' || tod === 'dusk')) for (let r = 0; r < bh / 60; r++) for (let c = 0; c < bw / 50; c++) if (rnd(k + i * 7 + r * 3 + c) > 0.55) { ctx.fillStyle = Math.sin(t * 0.8 + i + r) > -0.9 ? 'rgba(255,208,120,0.85)' : 'rgba(255,208,120,0.2)'; ctx.fillRect(bx + 14 + c * 44, base - bh + 20 + r * 56, 22, 28); } ctx.fillStyle = col; } };
  if (kind === 'street') { layer(100, 0.15, HZ, 260, 560, tone('#58638A', tod), 120, 200, false); layer(200, 0.4, HZ + 10, 200, 460, tone('#3E4766', tod), 150, 230, true); layer(300, 0.8, HZ + 30, 120, 300, tone('#2A3150', tod), 200, 300, true); }
  else if (kind === 'outdoor') { for (const [k, par, base, col] of [[1, 0.1, HZ - 60, '#7A98B8'], [2, 0.3, HZ, '#5E8A6A'], [3, 0.6, HZ + 40, '#4C7A52']]) { ctx.fillStyle = tone(col, tod); ctx.beginPath(); ctx.moveTo(-300, base + 200); for (let x = -300; x <= W + 300; x += 40) ctx.lineTo(x - px * par, base - 160 * (0.5 + 0.5 * Math.sin(x * 0.004 + k * 2)) - 60 * Math.sin(x * 0.011 + k)); ctx.lineTo(W + 300, base + 200); ctx.fill(); } }
  else { ctx.fillStyle = tone('#2C4A38', tod); ctx.fillRect(-300, HZ - 80, W + 600, 300); }
  // ground
  const g0 = kind === 'street' ? tone('#3A3F52', tod) : kind === 'outdoor' ? tone('#5F9A5A', tod) : tone('#2A3B2C', tod);
  ctx.fillStyle = grad(0, HZ, 0, H, [[0, shade(g0, 0.12)], [1, shade(g0, -0.45)]]); ctx.fillRect(-300, HZ, W + 600, H - HZ + 300);
  if (kind === 'street') { poly([[-300, H], [W + 300, H], [W / 2 + 80, HZ], [W / 2 - 80, HZ]], 'rgba(0,0,0,0.18)'); poly([[-300, H], [-60, H], [W / 2 - 80, HZ], [W / 2 - 100, HZ]], tone('#8A8FA4', tod)); poly([[W + 60, H], [W + 300, H], [W / 2 + 100, HZ], [W / 2 + 80, HZ]], tone('#8A8FA4', tod));
    for (let i = 0; i < 8; i++) { const p = ((i + (t * 0.6) % 1) / 8), y = lerp(HZ, H, p * p), w = lerp(6, 46, p * p), hh = lerp(4, 70, p * p); ctx.fillStyle = 'rgba(240,230,170,0.7)'; ctx.fillRect(W / 2 - w / 2, y, w, hh); } }
  else if (kind === 'outdoor') { poly([[W / 2 - 40, HZ], [W / 2 + 40, HZ], [W + 120, H], [-120, H]], tone('#C9A878', tod)); }
  else { for (let i = 0; i < 12; i++) { const par = 0.2 + (i % 4) * 0.28, x = ((rnd(i) * 1500 - px * par) % 1500) - 200, w = 22 + par * 70; ctx.fillStyle = tone(i % 2 ? '#1E2B20' : '#25382A', tod); ctx.fillRect(x, 100 - par * 80, w, HZ + 160 - 100 + par * 80); } }
  // near props with strongest parallax: lamp posts / trees
  for (let i = 0; i < 3; i++) { const x = ((i * 520 + 120 - px * 1.1) % 1700) - 300; if (kind === 'street') { ln([x, H], [x, 700], '#1A1D28', 16); ln([x, 700], [x + 70, 690], '#1A1D28', 12); if (tod === 'night' || tod === 'dusk') { glow(x + 76, 700, 420, 'rgba(255,214,140,A)', 0.5); circle2(x + 76, 700, 18, '#FFE9B0'); } } else { ln([x, H], [x, 520], tone('#4A3322', tod), 34); ctx.beginPath(); ctx.arc(x, 470, 150, 0, TAU); ctx.fillStyle = tone(kind === 'forest' ? '#1F3A28' : '#4F9A5B', tod); ctx.fill(); } }
  if (weather === 'fog' || kind === 'forest') for (let i = 0; i < 5; i++) { const y = 700 + i * 150, xo = Math.sin(t * 0.3 + i) * 80; ctx.fillStyle = grad(0, y - 90, 0, y + 90, [[0, 'rgba(210,220,235,0)'], [0.5, `rgba(210,220,235,${tod === 'night' ? 0.1 : 0.18})`], [1, 'rgba(210,220,235,0)']]); ctx.fillRect(-300 + xo, y - 90, W + 600, 180); }
  motes(t, 10);
}
function circle2(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = c; ctx.fill(); }

export const ROOM_KINDS = ['room', 'bedroom', 'office', 'cafe', 'kitchen'];
