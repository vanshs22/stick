// Editorial presenter family (refs 5 and 6): paper background that changes colour per section, mono label top, big headline
// text with one red italic-serif keyword (this IS the caption), an explainer card in the middle and an illustrated presenter
// bottom-right. Everything comes from the plan: card (kind/value), bg, label, emotion, pose; sounds come out as cues.
import { ctx, W, H, clamp, lerp, eo, eob, eio, rr } from '../core/lib.js';
import { L, T, Wd } from '../core/timing.js';
import { captionList } from '../core/captions.js';
import { drawCard, CARD_PX } from './cards.js';
import { drawPresenter } from './avatar.js';

const BG = { paper: ['#F4F1EC', false], dark: ['#0F0F11', true], slate: ['#B7BEC9', false], green: ['#10261F', true], red: ['#E8381A', false], navy: ['#141D5F', true], cream: ['#EFE7D8', false] };
const ACC = '#E0301E';
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** headline = the current caption chunk, wrapped, keyword in red italic serif */
function headline(t, dark, onRed) {
  const c = captionList().find((c) => t >= c.s && t < c.e); if (!c) return;
  const lt = t - c.s, k = eo(clamp(lt / 0.22)), ink = onRed ? '#fff' : dark ? '#f4f1ec' : '#111', hi = onRed ? '#111' : ACC, maxW = 900, size = 74, gap = 18;
  const items = c.words.map((w) => { ctx.font = w.hi ? `italic 400 ${size * 1.14}px ${CARD_PX.serif}` : `500 ${size}px ${CARD_PX.sans}`; return { ...w, w: ctx.measureText(w.txt).width, font: ctx.font }; });
  const rows = [[]]; let rw = 0; for (const it of items) { if (rw + it.w > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(it); rw += it.w + gap; }
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 26); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  rows.forEach((r, ri) => { let x = 64; r.forEach((it) => { ctx.font = it.font; ctx.fillStyle = it.hi ? hi : ink; ctx.fillText(it.txt, x, 200 + ri * 94); x += it.w + gap; }); });
  ctx.restore();
}

function backdrop(bg, prev, lt) {
  const [c, dark] = BG[bg] || BG.paper;
  if (prev && prev !== bg) { const [pc] = BG[prev] || BG.paper, k = eio(clamp(lt / 0.28)); ctx.fillStyle = pc; ctx.fillRect(0, 0, W, H); ctx.fillStyle = c; ctx.fillRect(0, H * (1 - k), W, H * k + 2); }
  else { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }
  return dark;
}

export function buildEditorial(plan, st) {
  const shots = [], cues = [], cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const sf = st.audio.sfx ?? 1, hero = plan.cast[0], P = st.presenter || {}, h = hash(hero.name + st.id);
  const skins = st.character.skins || ['#E8B48C'], look = { skin: P.skin || skins[h % skins.length], hair: P.hair || '#2a2019', beard: P.beard ?? true, hat: P.hat === undefined ? '#1f1f22' : P.hat, glasses: P.glasses ?? true,
    jacket: P.jacket || '#5c5348', shirt: P.shirt || '#f1eee8' };
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08), N = plan.scenes.length;
  plan.scenes.forEach((sc, i) => {
    const at = cut(i), prevBg = i ? plan.scenes[i - 1].bg : null, bgChanged = i && prevBg !== sc.bg, card = sc.card || { kind: 'keyword', value: sc.text.split(' ')[0] };
    shots.push({ id: `${i}:${sc.arc}`, at, cam3d: true, note: `${card.kind} ${sc.bg} ${sc.emotion}`,
      draw(lt, d, t) {
        const dark = backdrop(sc.bg, prevBg, lt), onRed = sc.bg === 'red';
        const p = clamp((lt - 0.06) / 0.4), drift = 1 + 0.02 * lt / Math.max(1, d), out = clamp((d - lt) / 0.14);
        // label row
        ctx.save(); ctx.textBaseline = 'middle'; ctx.font = `500 24px ${CARD_PX.mono}`; ctx.fillStyle = onRed ? 'rgba(255,255,255,.8)' : dark ? '#8d8a85' : '#8a8782'; ctx.textAlign = 'left'; ctx.fillText(sc.label?.left || '', 64, 70);
        ctx.textAlign = 'right'; ctx.fillStyle = onRed ? '#fff' : ACC; ctx.fillText(sc.label?.right || '', W - 64, 70); ctx.restore();
        headline(t, dark, onRed);
        // card area (a little push-in), presenter anchored bottom right
        ctx.save(); ctx.translate(W / 2, 800); ctx.scale(drift, drift); ctx.globalAlpha = out; drawCard(card, { x: 0, y: 0, lt, d, p, dark: dark || onRed, accent: onRed ? '#111' : ACC }); ctx.restore();
        const gx = sc.hero.pose, mood = sc.hero.mood;
        drawPresenter({ x: 650 + Math.sin(t * 0.8) * 4, y: 1690, s: 1.38, t, lt, pose: gx, mood, talk: true, look });
      } });
    // ---- sound design: one soft sound per visual event, nothing stacked on the same beat ----
    const w0 = L(i);
    if (bgChanged) cue(at - 0.02, 'swish', { gain: 0.8 * sf });
    else if (i) cue(at + 0.02, 'whoosh', { gain: 0.35 * sf });
    const k = card.kind;
    if (k === 'step') cue(w0 + 0.12, 'tick', { gain: 0.9 * sf });
    else if (k === 'terminal') cue(w0 + 0.3, 'type', { gain: 0.8 * sf, dur: Math.min(1.8, 0.35 * Math.max(3, (card.value || '').length / 4)) });
    else if (k === 'stamp') cue(w0 + 0.3, 'stamp', { gain: 0.9 * sf });
    else if (k === 'cta') cue(w0 + 0.45, 'ding', { gain: 0.8 * sf });
    else if (k === 'stat' || k === 'chart') cue(w0 + 0.15, 'count', { gain: 0.7 * sf, dur: 0.9 });
    else cue(w0 + 0.12, 'pop', { gain: 0.8 * sf });
    if (sc.arc === 'peak') cue(w0 + 0.05, 'slam', { gain: 0.35 * sf });
  });
  // sort so overlapping cues don't matter; the mixer handles level
  return { shots, cues };
}
