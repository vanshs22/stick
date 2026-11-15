// Lighting, weather and colour-grade effects, all driven by the story emotion and the style preset.
import { ctx, W, H, clamp, rnd, TAU } from './lib.js';

export function rain(t, amt = 1) {
  ctx.save(); ctx.strokeStyle = 'rgba(205,220,255,0.32)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (let i = 0; i < 150 * amt; i++) { const x = (rnd(i) * (W + 300) - 100 - t * 120) % (W + 300), y = (rnd(i + 5) * H + t * 1500 * (0.7 + rnd(i + 9) * 0.5)) % H, l = 34 + rnd(i + 3) * 40; ctx.beginPath(); ctx.moveTo(x < 0 ? x + W + 300 : x, y); ctx.lineTo((x < 0 ? x + W + 300 : x) - 9, y + l); ctx.stroke(); }
  ctx.restore();
}
export function fog(t, amt = 0.16) {
  for (let i = 0; i < 4; i++) { const y = 800 + i * 270 + Math.sin(t * 0.3 + i) * 30; const g = ctx.createLinearGradient(0, y - 140, 0, y + 140); g.addColorStop(0, 'rgba(200,210,225,0)'); g.addColorStop(0.5, `rgba(200,210,225,${amt})`); g.addColorStop(1, 'rgba(200,210,225,0)'); ctx.fillStyle = g; ctx.fillRect(-300 + Math.sin(t * 0.2 + i) * 100, y - 140, W + 600, 280); }
}
/** 0..1 lightning/flash brightness at time t (rare double flashes) */
export function lightning(t, seed = 0) { const p = (t * 0.42 + seed) % 1; return p < 0.018 ? 1 : p > 0.05 && p < 0.062 ? 0.7 : 0; }

const GRADES = {
  fear: { tint: 'rgba(8,36,52,0.30)', vig: 0.28 }, tension: { tint: 'rgba(30,26,60,0.18)', vig: 0.18 }, anger: { tint: 'rgba(150,20,10,0.16)', vig: 0.12 },
  sad: { tint: 'rgba(60,85,120,0.24)', vig: 0.15 }, joy: { tint: 'rgba(255,205,110,0.10)', vig: 0 }, relief: { tint: 'rgba(255,225,160,0.12)', vig: 0 },
  surprise: { tint: 'rgba(255,255,255,0.04)', vig: 0.05 }, smug: { tint: 'rgba(255,200,120,0.05)', vig: 0.05 }, calm: { tint: 'rgba(0,0,0,0)', vig: 0 },
};
export function grade(emotion, intensity, style, t) {
  const g = GRADES[emotion] || GRADES.calm, sg = style.grade || {};
  ctx.save(); ctx.fillStyle = g.tint; ctx.globalAlpha = 0.4 + 0.6 * intensity; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.globalAlpha = 1;
  if (sg.tint) { ctx.fillStyle = sg.tint; ctx.fillRect(-300, -300, W + 600, H + 600); }
  if (emotion === 'anger') { ctx.fillStyle = `rgba(160,10,0,${0.05 + 0.05 * Math.sin(t * 9)})`; ctx.fillRect(-300, -300, W + 600, H + 600); }
  const v = clamp((sg.vignette ?? 0.35) + g.vig * (0.5 + intensity)), vg = ctx.createRadialGradient(W / 2, H / 2, 360, W / 2, H / 2, 1180); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${v})`); ctx.fillStyle = vg; ctx.fillRect(-300, -300, W + 600, H + 600);
  if (sg.bloom) { ctx.globalCompositeOperation = 'screen'; const b = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, 900); b.addColorStop(0, `rgba(255,220,170,${0.1 * sg.bloom})`); b.addColorStop(1, 'rgba(255,220,170,0)'); ctx.fillStyle = b; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  if (sg.grain) { const n = 260; ctx.fillStyle = 'rgba(255,255,255,1)'; for (let i = 0; i < n; i++) { ctx.globalAlpha = sg.grain * (0.5 + rnd(i + Math.floor(t * 24) * 7) * 0.5); ctx.fillRect(rnd(i * 3 + Math.floor(t * 24)) * W, rnd(i * 5 + 1 + Math.floor(t * 24)) * H, 3, 3); } ctx.globalAlpha = 1; }
  ctx.restore();
}
export function flash(a, col = '255,255,255') { if (a > 0.01) { ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(-300, -300, W + 600, H + 600); } }
export function dip(a) { if (a > 0.01) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(-300, -300, W + 600, H + 600); } }
