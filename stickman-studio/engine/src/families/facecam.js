// Face-cam family (ref 3): the user's own talking-head clip + explainer cards + captions + serif keyword pops.
// Layout per beat comes from the plan: a card beat is a split layout (beige panel with the card on top, the face in the lower
// 42 %), any other beat is the face full-bleed with a big serif keyword over it. Frames are pre-extracted JPEGs (facecam_prep.py).
import { ctx, W, H, clamp, eo, eio, rr } from '../core/lib.js';
import { L } from '../core/timing.js';
import { captionList } from '../core/captions.js';
import { drawCard, CARD_PX } from './cards.js';

const META = { fps: 30, frames: 0 }, CACHE = new Map(); let LAST = null;
const SPLIT_Y = 1130, PANEL = '#EAE4DA';
const frameNo = (t) => Math.min(META.frames, Math.max(1, Math.round(t * META.fps) + 1));
const load = (n) => CACHE.get(n) || (CACHE.set(n, new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `data/face/${String(n).padStart(5, '0')}.jpg`; })), CACHE.get(n));
export async function prep(t) { const n = frameNo(t), im = await load(n); if (im) LAST = im; if (CACHE.size > 40) for (const k of CACHE.keys()) { if (Math.abs(k - n) > 20) CACHE.delete(k); else break; } }
export async function init() { try { Object.assign(META, await (await fetch('data/face/meta.json', { cache: 'no-store' })).json()); await prep(0); } catch (e) { /* no clip: the layout still draws */ } }

function caption(t, onPanel) {
  const c = captionList().find((c) => t >= c.s && t < c.e); if (!c) return;
  const lt = t - c.s, k = eo(clamp(lt / 0.16)), y = onPanel ? 1010 : 1500;
  ctx.save(); ctx.globalAlpha = k; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const items = c.words.map((w) => { ctx.font = w.hi ? `italic 400 92px ${CARD_PX.serif}` : `700 74px ${CARD_PX.sans}`; return { ...w, w: ctx.measureText(w.txt).width, font: ctx.font }; });
  const total = items.reduce((a, i) => a + i.w + 20, -20), sc = Math.min(1, 960 / total); let x = (W - total * sc) / 2;
  ctx.translate(0, (1 - k) * 18);
  items.forEach((it) => { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = it.font; if (!onPanel) { ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(it.txt, 0, 0); } ctx.fillStyle = onPanel ? (it.hi ? '#E0301E' : '#151515') : '#fff'; ctx.fillText(it.txt, 0, 0); ctx.restore(); x += (it.w + 20) * sc; });
  ctx.restore();
}

export function buildFaceCam(plan, st) {
  const shots = [], cues = [], cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const sf = st.audio.sfx ?? 1, cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  plan.scenes.forEach((sc, i) => {
    const card = sc.card || { kind: 'keyword', value: '' }, split = !['keyword', 'stamp'].includes(card.kind) && i > 0 && sc.arc !== 'end';
    shots.push({ id: `${i}:${split ? 'card' : 'face'}`, at: cut(i), cam3d: true, note: `${card.kind} ${split ? 'split' : 'full'}`,
      draw(lt, d, t) {
        const k = eio(clamp(lt / 0.22));
        if (split) {
          ctx.fillStyle = PANEL; ctx.fillRect(0, 0, W, H);
          if (LAST) { const sy = Math.round(clamp((st.faceY ?? 0.55) * H - 395, 0, H - 790)); ctx.save(); ctx.beginPath(); ctx.rect(0, SPLIT_Y + (1 - k) * 700, W, H); ctx.clip(); ctx.drawImage(LAST, 0, sy, W, 790, 0, SPLIT_Y + (1 - k) * 700, W, 790); ctx.restore(); }
          const out = clamp((d - lt) / 0.12);
          ctx.save(); ctx.translate(W / 2, 520); ctx.scale(0.92, 0.92); ctx.globalAlpha = out; drawCard(card, { x: 0, y: 0, lt, d, p: clamp((lt - 0.08) / 0.4), dark: false, accent: '#E0301E' }); ctx.restore();
          ctx.font = `500 22px ${CARD_PX.mono}`; ctx.fillStyle = '#8a8782'; ctx.textAlign = 'left'; ctx.fillText(sc.label?.left || '', 56, 64);
        } else {
          if (LAST) ctx.drawImage(LAST, 0, 0, W, H); else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H); }
          const g = ctx.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, H * 0.55, W, H * 0.45);
          if (card.value) { const kk = clamp(lt / 0.3), s = 0.8 + 0.2 * (1 - Math.pow(1 - kk, 3)); ctx.save(); ctx.translate(W / 2, 1350); ctx.scale(s, s); ctx.globalAlpha = kk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `italic 400 150px ${CARD_PX.serif}`;
            const txt = String(card.value).toLowerCase(), fs = Math.min(150, 150 * 900 / Math.max(1, ctx.measureText(txt).width)); ctx.font = `italic 400 ${fs}px ${CARD_PX.serif}`; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineJoin = 'round'; ctx.strokeText(txt, 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(txt, 0, 0); ctx.restore(); }
        }
        caption(t, split);
      } });
    const w0 = L(i);
    if (i && split !== (plan.scenes[i - 1] && !['keyword', 'stamp'].includes((plan.scenes[i - 1].card || {}).kind))) cue(cut(i) - 0.02, 'swish', { gain: 0.7 * sf });
    if (split) cue(w0 + 0.12, card.kind === 'step' ? 'tick' : card.kind === 'terminal' ? 'type' : card.kind === 'cta' ? 'ding' : card.kind === 'stat' || card.kind === 'chart' ? 'count' : 'pop', { gain: 0.7 * sf, ...(card.kind === 'terminal' ? { dur: 1.2 } : {}) });
    else if (card.value) cue(w0 + 0.08, card.kind === 'stamp' ? 'stamp' : 'pop', { gain: 0.8 * sf });
  });
  return { shots, cues };
}
