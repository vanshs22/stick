// Explainer cards for the editorial / face-cam / 3D-explainer families. drawCard(card, o) draws one card centred at (o.x, o.y);
// o = { lt (seconds since the beat started), d (beat length), p (entrance 0..1), dark (bool), accent, x, y, ink, paper }.
// Every card is built from the plan's { kind, value, label, items } only, so a new script needs no new art.
import { ctx, W, clamp, lerp, seg, eo, eob, rr, TAU } from '../core/lib.js';

const SANS = 'Grotesk, Inter, sans-serif', SERIF = 'SerifI, Georgia, serif', MONO = 'Mono, monospace';
const tx = (s, x, y, font, fill, align = 'left') => { ctx.font = font; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); };
const shadow = (w, h, r, k = 1) => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 40 * k; ctx.shadowOffsetY = 18 * k; rr(-w / 2, -h / 2, w, h, r); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore(); };
const num = (s) => { const m = String(s).replace(/,/g, '').match(/([\d.]+)\s*([kKmM%x]?)/); return m ? { n: parseFloat(m[1]), suf: m[2], dollar: /\$/.test(s) } : null; };
const fmt = (v, suf, dollar, orig) => { const dec = /\./.test(orig) ? 1 : 0, big = Math.abs(v) >= 1000 && !suf; const s = big ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec); return (dollar ? '$' : '') + s + suf; };

const DRAW = {
  step(c, o) {
    const n = +c.value || 1, k = eob(clamp(o.p)), rot = -0.07 + Math.sin(o.lt * 2) * 0.01;
    ctx.save(); ctx.rotate(rot); ctx.scale(k, k); shadow(430, 430, 96); rr(-215, -215, 430, 430, 96); ctx.fillStyle = '#111'; ctx.fill();
    rr(-190, -190, 380, 380, 76); ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 3; ctx.stroke();
    tx(String(n), 0, -6, `700 300px ${SANS}`, '#fff', 'center');
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((i - 2) * 46, 158, 11, 0, TAU); ctx.fillStyle = i < n ? o.accent : 'rgba(255,255,255,.28)'; ctx.fill(); }
    ctx.restore();
  },
  terminal(c, o) {
    const k = eo(clamp(o.p)), W2 = 880, H2 = 420, txt = c.value || '', typed = Math.floor(txt.length * clamp((o.lt - 0.25) / Math.max(0.5, o.d * 0.6)));
    ctx.save(); ctx.translate(0, (1 - k) * 80); ctx.globalAlpha = k; shadow(W2, H2, 30);
    rr(-W2 / 2, -H2 / 2, W2, H2, 30); ctx.fillStyle = '#151517'; ctx.fill();
    ['#ff5f57', '#febc2e', '#28c840'].forEach((cl, i) => { ctx.beginPath(); ctx.arc(-W2 / 2 + 44 + i * 36, -H2 / 2 + 42, 10, 0, TAU); ctx.fillStyle = cl; ctx.fill(); });
    tx(`${c.label || 'terminal'} · on this computer`, 0, -H2 / 2 + 42, `500 22px ${MONO}`, '#7c7c82', 'center');
    tx('$', -W2 / 2 + 56, -10, `600 40px ${MONO}`, o.accent); const shown = txt.slice(0, typed);
    ctx.font = `600 38px ${MONO}`; const wrap = [], per = 30; { let ln = ''; for (const w1 of shown.split(' ')) { if ((ln + ' ' + w1).trim().length > per && ln) { wrap.push(ln); ln = w1; } else ln = (ln + ' ' + w1).trim(); } wrap.push(ln); }
    wrap.forEach((l, i) => tx(l, -W2 / 2 + 96, -10 + i * 56, `600 38px ${MONO}`, '#f2f2f2'));
    if (Math.floor(o.lt * 2.4) % 2 === 0 || typed < txt.length) { const last = wrap[wrap.length - 1] || ''; ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-W2 / 2 + 100 + last.length * 22.9, -32 + (wrap.length - 1) * 56, 14, 44); }
    if (typed >= txt.length && txt.length) { ctx.save(); ctx.translate(W2 / 2 - 120, H2 / 2 - 60); ctx.rotate(-0.05); rr(-70, -34, 140, 68, 14); ctx.fillStyle = '#E0301E'; ctx.fill(); tx('ENTER', 0, 0, `700 26px ${MONO}`, '#fff', 'center'); ctx.restore(); }
    if (c.step) { ctx.save(); ctx.translate(-W2 / 2 + 30, -H2 / 2 - 34); ctx.rotate(-0.04); rr(0, -38, 190, 76, 18); ctx.fillStyle = o.accent; ctx.fill(); tx('STEP ' + c.step, 95, 0, `700 34px ${MONO}`, '#fff', 'center'); ctx.restore(); }
    ctx.restore();
  },
  cta(c, o) {
    const k = eob(clamp(o.p)), pw = 760, ph = 150;
    ctx.save(); ctx.scale(k, k); tx('comment', 0, -180, `600 38px ${MONO}`, o.dark ? '#bbb' : '#666', 'center');
    ctx.save(); ctx.rotate(-0.025 + Math.sin(o.lt * 3) * 0.006); shadow(pw, ph, 75, 0.8); rr(-pw / 2, -ph / 2 - 40, pw, ph, 75); ctx.fillStyle = '#E0301E'; ctx.fill();
    ctx.beginPath(); ctx.arc(-pw / 2 + 80, -40, 28, 0, TAU); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
    tx((c.value || 'GO').toUpperCase(), 40, -36, `700 ${c.value && c.value.length > 7 ? 74 : 96}px ${SANS}`, '#fff', 'center'); ctx.restore();
    const b = clamp((o.lt - 0.5) / 0.4); if (b > 0) { ctx.globalAlpha = b; rr(-300, 110, 600, 84, 42); ctx.fillStyle = o.dark ? '#222' : '#fff'; ctx.fill(); tx(`I'll send you the system`, 0, 152, `500 32px ${SANS}`, o.dark ? '#ddd' : '#333', 'center'); }
    ctx.restore();
  },
  versus(c, o) {
    const k = eob(clamp(o.p)), a = clamp((o.lt - 0.3) / 0.4);
    ctx.save(); ctx.scale(k, k);
    tx('VS', -250, -60, `700 150px ${SANS}`, '#E0301E', 'center');
    ctx.save(); ctx.translate(120, -50); shadow(540, 170, 26, 0.7); rr(-270, -85, 540, 170, 26); ctx.fillStyle = '#fff'; ctx.fill();
    tx(c.value || 'THEM', 0, 0, `700 ${String(c.value || '').length > 10 ? 54 : 74}px ${SANS}`, '#111', 'center'); ctx.restore();
    ctx.save(); ctx.globalAlpha = a; ctx.translate(250, 130 + (1 - a) * 40); ctx.rotate(0.07); rr(-150, -60, 300, 120, 22); ctx.fillStyle = '#E0301E'; ctx.fill(); tx('$0', 0, 4, `700 90px ${SANS}`, '#fff', 'center'); ctx.restore();
    ctx.restore();
  },
  stat(c, o) {
    const k = eo(clamp(o.p)), v = num(c.value), cnt = v ? v.n * eo(clamp((o.lt - 0.1) / 0.9)) : 0;
    ctx.save(); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); ctx.globalAlpha = k;
    ctx.font = `700 230px ${SANS}`; const s = v ? fmt(cnt, v.suf, v.dollar, String(c.value)) : String(c.value), fs = ctx.measureText(s).width > 860 ? 230 * 860 / ctx.measureText(s).width : 230;
    tx(s, 0, -30, `700 ${fs}px ${SANS}`, o.dark ? '#fff' : '#111', 'center'); tx((c.label || '').toUpperCase(), 0, 110, `600 36px ${MONO}`, o.dark ? '#aaa' : '#666', 'center');
    rr(-180, 160, 360, 8, 4); ctx.fillStyle = o.dark ? '#333' : '#ddd'; ctx.fill(); rr(-180, 160, 360 * eo(clamp((o.lt - 0.1) / 0.9)), 8, 4); ctx.fillStyle = '#E0301E'; ctx.fill(); ctx.restore();
  },
  chart(c, o) {
    const k = eo(clamp(o.p)), g = eo(clamp((o.lt - 0.15) / 1.1)), W2 = 840, H2 = 520;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 60); shadow(W2, H2, 28); rr(-W2 / 2, -H2 / 2, W2, H2, 28); ctx.fillStyle = o.dark ? '#1b1b1d' : '#fff'; ctx.fill();
    tx((c.label || 'growth').toUpperCase(), -W2 / 2 + 44, -H2 / 2 + 50, `600 26px ${MONO}`, '#8a8782');
    const pts = 9, bw = 58, gap = 28, x0 = -((pts * bw + (pts - 1) * gap) / 2), base = H2 / 2 - 60;
    for (let i = 0; i < pts; i++) { const hgt = (40 + Math.pow(i / (pts - 1), 1.7) * 300) * clamp(g * 1.4 - i * 0.07); rr(x0 + i * (bw + gap), base - hgt, bw, hgt, 10); ctx.fillStyle = i === pts - 1 ? '#E0301E' : (o.dark ? '#444' : '#d9d5cf'); ctx.fill(); }
    tx(String(c.value || ''), W2 / 2 - 44, -H2 / 2 + 54, `700 54px ${SANS}`, '#E0301E', 'right'); ctx.restore();
  },
  doc(c, o) {
    const k = eob(clamp(o.p)); ctx.save(); ctx.scale(k, k);
    const names = [c.value || 'NOTES.md', 'DESIGN.md', 'PLAN.md'], cols = ['#F2B23E', '#4F7DE3', '#E0301E'];
    [2, 1, 0].forEach((i) => { ctx.save(); ctx.translate((i - 1) * 90, i * 26 - 40); ctx.rotate((i - 1) * 0.11); shadow(480, 560, 14, 0.6); rr(-240, -280, 480, 560, 14); ctx.fillStyle = '#fffdfa'; ctx.fill(); rr(-240, -280, 480, 70, 14); ctx.fillStyle = cols[i]; ctx.fill();
      tx(names[i], -200, -245, `700 34px ${MONO}`, '#fff'); for (let r = 0; r < 7; r++) { rr(-200, -160 + r * 52, 400 * (r % 3 === 2 ? 0.6 : 1), 14, 7); ctx.fillStyle = '#e2ded7'; ctx.fill(); } ctx.restore(); });
    ctx.restore();
  },
  phone(c, o) {
    const k = eob(clamp(o.p)), w = 430, h = 820; ctx.save(); ctx.scale(k, k); ctx.rotate(-0.03); shadow(w, h, 66);
    rr(-w / 2, -h / 2, w, h, 66); ctx.fillStyle = '#111'; ctx.fill(); rr(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 54); ctx.fillStyle = '#fbfaf7'; ctx.fill();
    ctx.save(); ctx.clip(); tx('New reel', 0, -h / 2 + 70, `700 28px ${SANS}`, '#111', 'center');
    rr(-170, -h / 2 + 110, 340, 430, 24); ctx.fillStyle = '#f0ece4'; ctx.fill(); rr(-170, -h / 2 + 110, 340, 430, 24); ctx.strokeStyle = '#E0301E'; ctx.lineWidth = 4; ctx.stroke();
    const words = String(c.value || '').split(' '); let ln = '', y = -h / 2 + 170; for (const w1 of words) { if ((ln + ' ' + w1).length > 16) { tx(ln.trim(), -140, y, `700 36px ${SANS}`, '#111'); y += 48; ln = w1; } else ln += ' ' + w1; } tx(ln.trim(), -140, y, `700 36px ${SANS}`, '#111');
    const lk = clamp((o.lt - 0.6) / 0.3); ctx.restore();
    if (lk > 0) { ctx.save(); ctx.translate(120, -h / 2 + 70 + (1 - lk) * 20); ctx.globalAlpha = lk; rr(-70, -26, 140, 52, 26); ctx.fillStyle = '#fff'; ctx.fill(); tx('♥ ' + Math.round(2396884 * lk).toLocaleString('en-US'), 0, 2, `700 22px ${SANS}`, '#E0301E', 'center'); ctx.restore(); }
    ctx.restore();
  },
  stamp(c, o) {
    const p = clamp(o.p), s = lerp(2.4, 1, eo(clamp(p * 1.6))), a = clamp(p * 2);
    ctx.save(); ctx.rotate(-0.1); ctx.scale(s, s); ctx.globalAlpha = a; const t = c.value || 'NO'; ctx.font = `700 120px ${SANS}`; const w = Math.min(920, ctx.measureText(t).width + 120);
    rr(-w / 2, -110, w, 220, 22); ctx.lineWidth = 14; ctx.strokeStyle = '#E0301E'; ctx.stroke(); rr(-w / 2 + 14, -96, w - 28, 192, 12); ctx.lineWidth = 3; ctx.stroke();
    tx(t, 0, 4, `700 ${Math.min(120, 120 * (w - 120) / Math.max(1, ctx.measureText(t).width))}px ${SANS}`, '#E0301E', 'center'); ctx.restore();
  },
  list(c, o) {
    const k = eo(clamp(o.p)), items = c.items || [], W2 = 800, rowH = 118, H2 = items.length * rowH + 90;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 50); shadow(W2, H2, 28); rr(-W2 / 2, -H2 / 2, W2, H2, 28); ctx.fillStyle = o.dark ? '#1b1b1d' : '#fff'; ctx.fill();
    items.forEach((it, i) => { const y = -H2 / 2 + 70 + i * rowH + rowH / 2 - 20, ck = clamp((o.lt - 0.25 - i * 0.28) / 0.25);
      ctx.beginPath(); ctx.arc(-W2 / 2 + 80, y, 28, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = ck > 0.5 ? '#2fb457' : '#bbb'; ctx.stroke();
      if (ck > 0) { ctx.beginPath(); ctx.moveTo(-W2 / 2 + 66, y); ctx.lineTo(-W2 / 2 + 77, y + 12); ctx.lineTo(-W2 / 2 + 98 * (0.6 + 0.4 * ck) - 6, y - 12 * ck); ctx.strokeStyle = '#2fb457'; ctx.lineWidth = 8; ctx.stroke(); }
      tx(it, -W2 / 2 + 140, y, `600 48px ${SANS}`, o.dark ? '#f2f2f2' : '#111'); });
    ctx.restore();
  },
  keyword(c, o) {
    const k = eob(clamp(o.p)), t = (c.value || '').toUpperCase(); ctx.save(); ctx.scale(k, k); ctx.font = `700 190px ${SANS}`;
    const fs = Math.min(190, 190 * 900 / Math.max(1, ctx.measureText(t).width)); tx(t, 0, 0, `700 ${fs}px ${SANS}`, o.dark ? '#fff' : '#111', 'center');
    const g = eo(clamp((o.lt - 0.2) / 0.5)); ctx.strokeStyle = '#E0301E'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(0, 0, (ctx.measureText(t).width * fs / 190 / 2 + 50), fs * 0.72, -0.04, -2.2, -2.2 + TAU * 0.96 * g); ctx.stroke(); ctx.restore();
  },
};

export function drawCard(card, o) {
  const fn = DRAW[card.kind] || DRAW.keyword;
  ctx.save(); ctx.translate(o.x ?? W / 2, o.y ?? 760);
  const prev = ctx.letterSpacing; try { fn(card, o); } finally { ctx.restore(); ctx.letterSpacing = prev; ctx.globalAlpha = 1; }
}
export const CARD_PX = { sans: SANS, serif: SERIF, mono: MONO };
