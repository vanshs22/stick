// Story / explainer shots for the block 3D families: 'lowpoly' (night office story), 'voxel' (explainer with a creature on a
// starfield or studio stage) and 'blocky' (Roblox-style town story). The plan is the same as for the stickman videos (emotion, pose,
// shot, split cameras); this file adds the family look: world, creatures, explainer cards, caption layout and sounds.
import { ctx, W, H, clamp, eo, eob, rr } from '../core/lib.js';
import { L, T, Wd } from '../core/timing.js';
import { captionList } from '../core/captions.js';
import { render3d } from '../three/render3d.js';
import { drawCard, CARD_PX } from './cards.js';
import * as FX from '../core/fx.js';

const ALT = { close: 'medium', medium: 'close', wide: 'medium', two: 'close', insert: 'medium' };

/** caption in the family's own layout. look: { y, size, box, tag } */
function ownCaption(t, st, who) {
  const c = captionList().find((c) => t >= c.s && t < c.e); if (!c) return;
  const K = st.captions, lt = t - c.s, k = eo(clamp(lt / 0.16)), top = K.layout === 'top';
  ctx.save(); ctx.globalAlpha = k; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const size = K.size, items = c.words.map((w) => { ctx.font = `${w.hi ? 800 : K.weight || 600} ${size}px ${CARD_PX.sans}`; return { ...w, w: ctx.measureText(w.txt).width, font: ctx.font }; });
  const gap = size * 0.28, rows = [[]]; let rw = 0; for (const it of items) { if (rw + it.w > 860 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(it); rw += it.w + gap; }
  const lh = size * 1.2, y0 = K.y - (top ? 0 : (rows.length - 1) * lh);
  if (K.box) { const bw = Math.max(...rows.map((r) => r.reduce((a, i) => a + i.w + gap, -gap))) + 56, bh = rows.length * lh + 26; rr((W - bw) / 2, y0 - lh / 2 - 13, bw, bh, 22); ctx.fillStyle = K.box; ctx.fill(); }
  if (K.tag && who) { ctx.font = `800 24px ${CARD_PX.mono}`; const tw = ctx.measureText(who).width + 28; rr((W - tw) / 2, y0 - lh / 2 - 62, tw, 36, 8); ctx.fillStyle = K.tagColor || '#E8512A'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(who, W / 2, y0 - lh / 2 - 44); ctx.textAlign = 'left'; }
  rows.forEach((r, ri) => { const tot = r.reduce((a, i) => a + i.w + gap, -gap); let x = (W - tot) / 2; r.forEach((it) => { ctx.font = it.font; if (K.stroke) { ctx.lineWidth = size * 0.2; ctx.strokeStyle = K.stroke; ctx.strokeText(it.txt, x, y0 + ri * lh); } ctx.fillStyle = it.hi ? K.hi : K.fill; ctx.fillText(it.txt, x, y0 + ri * lh); x += it.w + gap; }); });
  ctx.restore();
}

export function buildStory3D(plan, st) {
  const shots = [], cues = [], cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const cast = Object.fromEntries(plan.cast.map((c) => [c.id, c])), sf = st.audio.sfx ?? 1, cut = (i) => (i === 0 ? 0 : L(i) - 0.08), world = st.world, cr = st.creatures || [];
  plan.scenes.forEach((sc, i) => {
    const at = cut(i), type = sc.shot.type === 'insert' ? 'medium' : sc.shot.type, card = sc.card, showCard = st.cards && card && card.kind !== 'keyword' && sc.arc !== 'end' || (card && card.kind === 'cta');
    shots.push({ id: `S${String(i + 1).padStart(2, '0')}`, at, cam3d: true, note: `${sc.arc} ${sc.emotion} ${type}/${sc.shot.move}${showCard ? ' +' + card.kind : ''}`,
      draw(lt, d, t) {
        const frac = lt / d, avoid = st.avoidClose, phase = sc.split2 && frac >= sc.split2 ? 2 : sc.split && frac >= sc.split ? 1 : 0, ty0 = phase === 1 ? ALT[type] : type, ty = avoid && (ty0 === 'close' || ty0 === 'wide' || ty0 === 'two') ? 'medium' : ty0;
        const mvv = phase === 0 ? sc.shot.move : phase === 1 ? sc.splitMove || 'push' : 'punch', starts = [0, (sc.split || 0) * d, (sc.split2 || 0) * d], ends = [sc.split ? sc.split * d : d, sc.split2 ? sc.split2 * d : d, d];
        const hero = st.singleCast ? plan.cast[0] : cast[sc.hero.id], second = sc.costar ? cast[sc.costar.id] : null, two = !st.singleCast && ty === 'two' && second;
        const cs = [{ id: hero.id, cast: hero, pose: sc.hero.pose, mood: sc.hero.mood, talk: true, seed: 0 }]; if (two) cs.push({ id: second.id, cast: second, pose: sc.costar.pose, mood: sc.costar.mood, talk: false, seed: 1.7 });
        const kick = i % Math.max(1, cr.length), creatures = cr.map((c, k) => ({ id: 'cr' + k, spec: c, x: c.x ?? (-0.9 + k * 0.5), z: c.z ?? 0.9, y: c.y ?? 0, s: c.s ?? 1, kick: k === kick || showCard ? 1 : 0, talk: 0, rotY: c.rotY ?? 0.25 }));
        const cv3 = render3d({ t, lt, d, set: { kind: world.kind, tod: 'night', weather: 'none' }, pal: {}, world, type: ty, move: mvv, camLt: lt - starts[phase], camD: Math.max(0.3, ends[phase] - starts[phase]), zoom: sc.shot.zoom, style: st, hand: st.camera.handheld, paint: st.grade?.paint ?? 0, shake: sc.arc === 'peak' ? Math.max(0, 1 - lt / 0.8) * 0.6 : 0, cast: cs, creatures });
        ctx.drawImage(cv3, 0, 0, W, H);
        // explainer chip + card
        if (st.stepChip) { const m = sc.label?.right || ''; if (m) { ctx.save(); ctx.font = `800 24px ${CARD_PX.mono}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m + (card?.label ? ' · ' + String(card.label).toUpperCase() : ''), W / 2, 70); ctx.fillStyle = '#FFD84A'; ctx.fillRect(W / 2 - 40, 96, 80, 5); ctx.restore(); } }
        if (showCard) { const p = clamp((lt - 0.05) / 0.4), out = clamp((d - lt) / 0.14); ctx.save(); ctx.translate(W / 2, st.cardY ?? 600); ctx.scale(st.cardScale ?? 0.7, st.cardScale ?? 0.7); ctx.globalAlpha = out; drawCard(card, { x: 0, y: 0, lt, d, p, dark: true, accent: st.cardAccent || '#E8512A' }); ctx.restore(); }
        if (sc.pop && st.popText && lt > 0.08 && lt < Math.min(d - 0.1, 1.6)) { const q = eob(clamp((lt - 0.08) / 0.2)); ctx.save(); ctx.translate(W / 2, 500); ctx.scale(0.5 + 0.5 * q, 0.5 + 0.5 * q); ctx.font = `900 ${sc.pop.length > 7 ? 120 : 170}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 28; ctx.strokeStyle = '#0B0B10'; ctx.strokeText(sc.pop, 0, 0, 980); ctx.fillStyle = st.captions.hi; ctx.fillText(sc.pop, 0, 0, 980); ctx.restore(); }
        if (st.captions.own) ownCaption(t, st, st.captions.tag && plan.cast.length > 1 ? (hero.name === 'I' ? 'YOU' : hero.name).toUpperCase() : '');
        FX.grade(sc.grade, sc.intensity, st, t);                       // emotion colour grade: cold for fear, warm for joy ...
        // grade
        if (st.grade?.vignette) { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${st.grade.vignette})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        if (sc.transition === 'flash') { ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.7 * (1 - lt / 0.16))})`; ctx.fillRect(0, 0, W, H); }
      } });
    // sound: one cue per visual event
    const w0 = L(i);
    if (i && sc.transition !== 'fade') cue(at, sc.transition === 'whip' || sc.shot.move === 'punch' ? 'whoosh' : 'swish', { gain: 0.5 * sf });
    sc.sfx.forEach((s) => { let t0 = at + 0.1; try { if (s.word) t0 = Wd(s.word, i); } catch {} cue(t0, s.type, { gain: (s.gain || 0.5) * sf, dur: s.type === 'alarm' ? 1.2 : undefined }); });
    const k = sc.card?.kind;
    if (st.cards && k && k !== 'keyword') cue(w0 + 0.1, k === 'step' ? 'tick' : k === 'terminal' ? 'type' : k === 'stamp' ? 'stamp' : k === 'cta' ? 'ding' : k === 'stat' || k === 'chart' ? 'count' : 'pop', { gain: 0.7 * sf, ...(k === 'terminal' ? { dur: 1.2 } : {}) });
    else if (sc.pop) cue(w0 + 0.1, 'pop', { gain: 0.7 * sf });
    { const dd = (i < plan.scenes.length - 1 ? cut(i + 1) : T.dur) - at; if (sc.split) cue(at + sc.split * dd, 'swish', { gain: 0.3 * sf }); if (sc.split2) cue(at + sc.split2 * dd, 'swish', { gain: 0.3 * sf }); }
  });
  return { shots, cues };
}
