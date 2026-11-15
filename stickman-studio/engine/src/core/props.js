// Large "insert" props: the close-up cut-aways that sell a story beat (clock face, ringing phone, money, door, letter, bulb).
import { ctx, W, H, rr, clamp, rnd, eob, seg, TAU } from './lib.js';
import { glow, grad } from './stage.js';

const INK = '#15151A';
const T = (txt, x, y, size, col, w = 900) => { ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(txt, x, y, w); };

export function drawInsert(ins, t, lt, d, st) {
  const pop = eob(clamp(lt / 0.28)), cx = W / 2, cy = 900, acc = st.sets?.palette?.accent || '#FFD43B';
  ctx.save(); ctx.translate(cx, cy); ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop); ctx.translate(-cx, -cy);
  switch (ins.type) {
    case 'clock': {
      rr(cx - 400, cy - 250, 800, 500, 40); ctx.fillStyle = '#12151D'; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#2B3345'; ctx.stroke();
      rr(cx - 360, cy - 210, 720, 420, 24); ctx.fillStyle = '#05060A'; ctx.fill(); glow(cx, cy, 520, 'rgba(255,60,40,A)', 0.22);
      const blink = Math.sin(t * 6) > -0.3; T(ins.value.replace(/\s?(AM|PM)$/, ''), cx - 40, cy, 230, `rgba(255,70,50,${blink ? 1 : 0.35})`);
      const ap = (ins.value.match(/AM|PM/) || [''])[0]; if (ap) T(ap, cx + 290, cy + 70, 70, '#FF5A45', 120);
      break; }
    case 'phone': {
      const ring = Math.sin(t * 28) * 5 * (lt < d - 0.2 ? 1 : 0);
      ctx.save(); ctx.translate(cx + ring, cy); ctx.rotate(ring * 0.004);
      rr(-250, -430, 500, 860, 64); ctx.fillStyle = '#0B0D12'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#303A4C'; ctx.stroke(); rr(-222, -402, 444, 804, 44); ctx.fillStyle = grad(0, -400, 0, 400, [[0, '#18233A'], [1, '#0C1220']]); ctx.fill();
      glow(0, 0, 520, 'rgba(110,170,255,A)', 0.28); T(ins.value || 'INCOMING CALL', 0, -170, ins.value ? 66 : 44, '#CFE1FF', 420);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 40, 80 + i * 60 + ((t * 80) % 60), 0, TAU); ctx.strokeStyle = `rgba(120,220,150,${0.5 - i * 0.14})`; ctx.lineWidth = 6; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 40, 70, 0, TAU); ctx.fillStyle = '#3FBF6A'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-26, 60); ctx.quadraticCurveTo(-30, 14, 10, 4); ctx.moveTo(26, 22); ctx.lineTo(30, 62); ctx.stroke();
      ctx.restore(); break; }
    case 'money': {
      ctx.save(); ctx.rotate(-0.06); rr(cx - 410, cy - 210, 820, 420, 28); ctx.fillStyle = '#2F7A4E'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = '#D9F2DF'; ctx.stroke(); rr(cx - 360, cy - 160, 720, 320, 18); ctx.lineWidth = 5; ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 120, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      T(ins.value, cx, cy, ins.value.length > 8 ? 120 : 170, '#F4FFF6', 700); ctx.restore(); break; }
    case 'door': {
      rr(cx - 260, cy - 440, 520, 880, 18); ctx.fillStyle = '#5E3C24'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = '#1D1008'; ctx.stroke();
      for (const [y, h] of [[-390, 330], [-30, 420]]) { rr(cx - 200, cy + y, 400, h, 12); ctx.lineWidth = 8; ctx.strokeStyle = '#3B2414'; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx + 190, cy + 40, 30, 0, TAU); ctx.fillStyle = '#E3B23C'; ctx.fill();
      ctx.fillStyle = 'rgba(255,200,120,0.55)'; ctx.fillRect(cx - 260, cy + 440, 520, 14); if (Math.sin(t * 2.2) > 0.3) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(cx - 90, cy + 440, 60, 14); ctx.fillRect(cx + 40, cy + 440, 60, 14); }
      const k = (lt * 3) % 1; if (lt < d - 0.2) { ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy - 100, 90 + k * 120, 0, TAU); ctx.stroke(); } break; }
    case 'letter': {
      ctx.save(); ctx.rotate(-0.04); rr(cx - 330, cy - 430, 660, 860, 14); ctx.fillStyle = '#F2EBD6'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#3B3224'; ctx.stroke();
      for (let i = 0; i < 9; i++) { const w = 380 + rnd(i) * 160, show = clamp((lt - i * 0.12) / 0.3); ctx.fillStyle = '#2B2A30'; ctx.fillRect(cx - 270, cy - 330 + i * 70, w * show, 14); }
      ctx.beginPath(); ctx.arc(cx + 190, cy + 330, 54, 0, TAU); ctx.fillStyle = '#B3262E'; ctx.fill(); ctx.restore(); break; }
    case 'light': {
      const on = lt < 0.5 ? 1 : Math.sin(lt * 44) > 0 && lt < d * 0.55 ? 1 : 0;
      ctx.fillStyle = '#05060B'; ctx.fillRect(-300, -300, W + 600, H + 600); ln2(cx, 0, cx, cy - 120); if (on) glow(cx, cy, 800, 'rgba(255,225,150,A)', 0.55);
      ctx.beginPath(); ctx.ellipse(cx, cy, 90, 118, 0, 0, TAU); ctx.fillStyle = on ? '#FFF3C4' : '#2A2A30'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = on ? '#FFE08A' : '#3A3A44'; ctx.stroke(); ctx.fillStyle = '#3A3A44'; ctx.fillRect(cx - 44, cy - 150, 88, 54); break; }
    default: { rr(cx - 260, cy - 260, 520, 520, 40); ctx.fillStyle = acc; ctx.fill(); }
  }
  ctx.restore();
}
function ln2(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.lineWidth = 8; ctx.strokeStyle = '#3A3A44'; ctx.stroke(); }
