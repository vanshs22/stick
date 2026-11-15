// Painted-style sets with real perspective: elevator cabin, shaft cutaway, control room, plus lighting helpers.
import { ctx, W, H, lerp, clamp, rnd, TAU } from './lib.js';

export const BX0 = 230, BX1 = 850, BY0 = 420, BY1 = 1250;
export const lw = (u, v) => [lerp(0, BX0, u), lerp(lerp(0, BY0, u), lerp(H, BY1, u), v)];
export const rw = (u, v) => [lerp(W, BX1, u), lerp(lerp(0, BY0, u), lerp(H, BY1, u), v)];
export const cp = (a, b) => [lerp(lerp(0, BX0, b), lerp(W, BX1, b), a), lerp(0, BY0, b)];
export const fp = (a, b) => [lerp(lerp(0, BX0, b), lerp(W, BX1, b), a), lerp(H, BY1, b)];
export const ALARM_BTN = rw(0.66, 0.56);

export function poly(pts, fill, stroke, lwid = 4) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lwid; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function ln(a, b, col, w) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }
export function grad(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
export function glow(x, y, r, col, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

export function motes(t, n = 26) {
  for (let i = 0; i < n; i++) {
    const x = (rnd(i) * W + t * (7 + rnd(i + 3) * 12)) % W, y = rnd(i + 7) * 1500 + 150 + Math.sin(t * 0.6 + i) * 30;
    ctx.beginPath(); ctx.arc(x, y, 2 + rnd(i + 11) * 2.5, 0, TAU); ctx.fillStyle = `rgba(255,236,190,${0.1 + rnd(i + 5) * 0.12})`; ctx.fill();
  }
}

/** elevator cabin seen from the front corner. open 0..1 slides the doors and reveals a warm lobby. */
export function elevator({ t = 0, open = 0, alarm = false, shake = 0, floorNo = '3' } = {}) {
  ctx.save(); ctx.translate(Math.sin(shake * 23) * 7, Math.cos(shake * 19) * 5);
  ctx.fillStyle = '#0B101C'; ctx.fillRect(-300, -300, W + 600, H + 600);
  // back wall: lobby (when open) + sliding doors
  ctx.save(); ctx.beginPath(); ctx.rect(BX0, BY0, BX1 - BX0, BY1 - BY0); ctx.clip();
  if (open > 0) {
    ctx.filter = 'blur(2px)';
    ctx.fillStyle = grad(0, BY0, 0, BY1, [[0, '#FFF2CC'], [0.55, '#F2D9A0'], [0.56, '#D9B77E'], [1, '#B58D58']]); ctx.fillRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
    poly([[470, 640], [610, 640], [610, 1080], [470, 1080]], '#7A5C3C'); poly([[490, 660], [590, 660], [590, 1080], [490, 1080]], '#FFF7DD');
    for (let i = 0; i < 3; i++) glow(540, 470 + i * 0, 260 - i * 60, 'rgba(255,240,200,A)', 0.5);
    ctx.fillStyle = '#6B8F6A'; ctx.beginPath(); ctx.ellipse(300, 1060, 55, 90, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8A6A48'; ctx.fillRect(270, 1110, 60, 140);
    ctx.filter = 'none';
  }
  const dw = (BX1 - BX0) / 2, dl = BX0 - open * dw, dr = BX0 + dw + open * dw;
  for (const [x0] of [[dl], [dr]]) {
    ctx.fillStyle = grad(x0, 0, x0 + dw, 0, [[0, '#7C8AA3'], [0.5, '#A7B3C7'], [1, '#6F7E98']]); ctx.fillRect(x0, BY0 + 80, dw, BY1 - BY0 - 80);
    for (let k = 0; k < dw; k += 9) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(x0 + k, BY0 + 80, 3, BY1 - BY0 - 80); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x0, BY0 + 80, 5, BY1 - BY0 - 80); ctx.fillRect(x0 + dw - 5, BY0 + 80, 5, BY1 - BY0 - 80);
  }
  ctx.fillStyle = '#4A566F'; ctx.fillRect(BX0, BY0, BX1 - BX0, 80);
  ctx.fillStyle = '#05070B'; ctx.fillRect(480, BY0 + 14, 120, 54);
  const on = Math.sin(t * 17) > -0.55 || open > 0; ctx.fillStyle = on ? '#FFB347' : '#5A3A16'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(floorNo, 540, BY0 + 42);
  ctx.restore();
  // ceiling, walls, floor
  poly([cp(-0.3, -0.3), cp(1.3, -0.3), cp(1.3, 1), cp(-0.3, 1)], grad(0, 0, 0, BY0, [[0, '#121827'], [1, '#2B364D']]));
  poly([lw(-0.3, 0), lw(1, 0), lw(1, 1), lw(-0.3, 1)], grad(0, 0, BX0, 0, [[0, '#2F394F'], [1, '#6C7A93']]));
  poly([rw(-0.3, 0), rw(1, 0), rw(1, 1), rw(-0.3, 1)], grad(W, 0, BX1, 0, [[0, '#2D374C'], [1, '#68768F']]));
  for (const u of [0.3, 0.62]) { ln(lw(u, 0), lw(u, 1), 'rgba(0,0,0,0.3)', 4); ln(lw(u, 0), lw(u, 1), 'rgba(255,255,255,0.08)', 2); ln(rw(u, 0), rw(u, 1), 'rgba(0,0,0,0.3)', 4); ln(rw(u, 0), rw(u, 1), 'rgba(255,255,255,0.08)', 2); }
  ln(lw(-0.2, 0.64), lw(1, 0.64), 'rgba(0,0,0,0.35)', 18); ln(lw(-0.2, 0.62), lw(1, 0.62), '#C9D3E4', 11);
  ln(rw(-0.2, 0.64), rw(0.45, 0.64), 'rgba(0,0,0,0.35)', 18); ln(rw(-0.2, 0.62), rw(0.45, 0.62), '#C9D3E4', 11);
  poly([fp(-0.3, -0.3), fp(1.3, -0.3), fp(1.3, 1), fp(-0.3, 1)], grad(0, BY1, 0, H, [[0, '#6B788E'], [0.5, '#3A4558'], [1, '#161C2A']]));
  for (const a of [0, 0.25, 0.5, 0.75, 1]) ln(fp(a, 1), fp(lerp(-0.5, 1.5, a), -0.3), 'rgba(255,255,255,0.07)', 3);
  for (const b of [0.2, 0.45, 0.68, 0.85]) ln(fp(-0.3, b), fp(1.3, b), 'rgba(255,255,255,0.06)', 3);
  glow(540, 1500, 520, 'rgba(255,238,200,A)', 0.12);
  // control panel on the right wall
  poly([rw(0.5, 0.46), rw(0.82, 0.46), rw(0.82, 0.8), rw(0.5, 0.8)], '#161C2C', '#8A97AD', 4);
  [[0.56, alarm ? '#FF3B30' : '#8A2A2A'], [0.64, '#F2B23E'], [0.72, '#8A96AD']].forEach(([v, c], i) => { const [bx, by] = rw(0.66, v); ctx.beginPath(); ctx.ellipse(bx, by, 14, 21, 0, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#0C101A'; ctx.stroke(); if (i === 0 && alarm) glow(bx, by, 120, 'rgba(255,60,50,A)', 0.55 + 0.3 * Math.sin(t * 12)); });
  // ceiling light + glow
  poly([cp(0.3, 0.42), cp(0.7, 0.42), cp(0.7, 0.72), cp(0.3, 0.72)], '#FFF4D6', 'rgba(20,24,36,0.9)', 8);
  const fl = 0.55 + 0.1 * Math.sin(t * 40) * (shake > 0.01 ? 1 : 0); glow(540, 380, 900, 'rgba(255,236,190,A)', fl * 0.22);
  if (alarm) glow(540, 300, 1100, 'rgba(255,40,30,A)', 0.14 + 0.1 * Math.sin(t * 12));
  motes(t);
  ctx.restore();
}

/** side-on cutaway of the shaft: a lit cabin stuck far below the lobby floor, a dark pit under it. */
export function shaft({ t = 0, lt = 0 } = {}) {
  ctx.fillStyle = grad(0, 0, 0, H, [[0, '#20293D'], [0.5, '#0E1424'], [1, '#04060B']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.fillStyle = grad(0, 0, 0, 640, [[0, '#FFE7B0'], [1, '#E3B877']]); ctx.fillRect(-300, 120, 600, 520); ctx.fillRect(780, 120, 600, 520);
  ctx.fillStyle = '#3A4358'; ctx.fillRect(-300, 640, 600, 70); ctx.fillRect(780, 640, 600, 70);
  ctx.fillStyle = '#2A3246'; ctx.fillRect(-300, 710, 560, 1400); ctx.fillRect(820, 710, 560, 1400);
  for (let y = 760; y < H; y += 120) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(-300, y, 560, 6); ctx.fillRect(820, y, 560, 6); }
  ln([300, 640], [300, H + 100], '#5A6781', 10); ln([780, 640], [780, H + 100], '#5A6781', 10);
  for (let y = 700 + ((lt * 80) % 200); y < H; y += 200) { ln([300, y], [330, y], '#6F7F9C', 6); ln([750, y], [780, y], '#6F7F9C', 6); }
  for (const x of [470, 540, 610]) ln([x, 640], [x, 960], '#8F9BB2', 5);
  // hazard zone between lobby floor and the cabin roof
  ctx.save(); ctx.beginPath(); ctx.rect(330, 650, 420, 310); ctx.clip(); ctx.fillStyle = 'rgba(200,30,30,0.16)'; ctx.fillRect(330, 650, 420, 310);
  ctx.strokeStyle = 'rgba(255,200,50,0.22)'; ctx.lineWidth = 16; for (let k = -400; k < 800; k += 56) { ctx.beginPath(); ctx.moveTo(330 + k + (t * 24) % 56, 960); ctx.lineTo(330 + k + 310 + (t * 24) % 56, 650); ctx.stroke(); } ctx.restore();
  // cabin
  ctx.fillStyle = '#1A2133'; ctx.fillRect(330, 950, 420, 20); ctx.fillStyle = grad(0, 970, 0, 1420, [[0, '#FFE9B8'], [1, '#C8A36A']]); ctx.fillRect(342, 970, 396, 440);
  ctx.fillStyle = '#1A2133'; ctx.fillRect(330, 1410, 420, 24); ctx.lineWidth = 8; ctx.strokeStyle = '#0C101A'; ctx.strokeRect(330, 950, 420, 484);
  glow(540, 1000, 420, 'rgba(255,230,170,A)', 0.18);
  // darkness below and a falling pebble
  const fy = 800 + ((lt * 620) % 1250), fa = clamp(1 - (fy - 800) / 1200); ctx.beginPath(); ctx.arc(790 + 0, fy, 9, 0, TAU); ctx.fillStyle = `rgba(210,215,230,${0.9 * fa})`; ctx.fill();
  for (let i = 0; i < 12; i++) { const y = 1500 + i * 60; ctx.fillStyle = `rgba(255,120,60,${0.05 + 0.05 * Math.sin(t * 3 + i)})`; ctx.fillRect(300, y, 480, 3); }
  motes(t, 14);
}

export function controlRoom({ t = 0 } = {}) {
  ctx.fillStyle = grad(0, 0, 0, H, [[0, '#D9CFBF'], [0.6, '#C2B6A2'], [1, '#8D8068']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  poly([[60, 250], [700, 250], [700, 880], [60, 880]], grad(0, 250, 0, 880, [[0, '#4F6AA8'], [0.45, '#F0A579'], [1, '#FFD7A0']]), '#4A4338', 14);
  const sky = (seed, base, h, col) => { ctx.fillStyle = col; for (let i = 0; i < 9; i++) { const bw = 52 + rnd(seed + i) * 40, bh = h * (0.4 + rnd(seed + i + 9) * 0.6), bx = 60 + i * 76; ctx.fillRect(bx, base - bh, bw, bh); } };
  ctx.save(); ctx.beginPath(); ctx.rect(60, 250, 640, 630); ctx.clip(); sky(1, 880, 330, '#7C86B0'); sky(21, 880, 250, '#3B466E');
  for (let i = 0; i < 70; i++) { if (Math.sin(t * 0.7 + i) > -0.6) { ctx.fillStyle = 'rgba(255,225,150,0.8)'; ctx.fillRect(70 + rnd(i) * 620, 620 + rnd(i + 3) * 250, 6, 8); } }
  ctx.restore(); ln([380, 250], [380, 880], '#4A4338', 12); ln([60, 560], [700, 560], '#4A4338', 10);
  poly([[60, 880], [700, 880], [700, 1010], [60, 1010]], '#9A8C74'); ctx.fillStyle = '#B9AC93'; for (let k = 0; k < 6; k++) ctx.fillRect(110 + k * 100, 905, 70, 80);
  glow(380, 560, 700, 'rgba(255,190,130,A)', 0.14);
}
export function controlDesk({ t = 0 } = {}) {
  ctx.fillStyle = grad(0, 1330, 0, H, [[0, '#B98A5C'], [0.06, '#8E6544'], [1, '#4A3322']]); ctx.fillRect(-300, 1330, W + 600, H - 1330 + 300);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-300, 1330, W + 600, 10);
  for (const [x, y] of [[60, 1040], [330, 1090]]) {
    poly([[x, y], [x + 250, y], [x + 250, y + 220], [x, y + 220]], '#131A28', '#2A3447', 8); poly([[x + 14, y + 14], [x + 236, y + 14], [x + 236, y + 206], [x + 14, y + 206]], '#1C3A5E');
    ctx.strokeStyle = '#7EE0FF'; ctx.lineWidth = 5; ctx.beginPath(); for (let k = 0; k < 10; k++) { const px = x + 24 + k * 20, py = y + 120 + Math.sin(t * 2 + k * 0.9 + x) * 40; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ctx.fillStyle = '#2A3447'; ctx.fillRect(x + 100, y + 220, 50, 70); glow(x + 125, y + 110, 260, 'rgba(120,210,255,A)', 0.16);
  }
  ctx.fillStyle = '#E9E3D3'; ctx.fillRect(720, 1318, 60, 14); ln([750, 1318], [770, 1240], '#2A3447', 8); poly([[735, 1240], [800, 1240], [790, 1200], [745, 1200]], '#F2B23E'); glow(770, 1260, 260, 'rgba(255,210,120,A)', 0.2);
}

export function vignette(strength = 0.42) {
  const g = ctx.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
}
