// Turns plan.json (from the director) + a style preset into shots: set, cast, props, camera, overlays, transitions, sound cues.
// Nothing here is story-specific: every decision (emotion, location, clothes, pose, shot) comes from the plan.
import { ctx, setCtx, W, H, clamp, lerp, seg, eo, eio, eob, rr } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { drawChar } from './core/rig.js';
import * as S from './core/stage.js';
import * as Z from './core/sets.js';
import * as FX from './core/fx.js';
import { drawInsert } from './core/props.js';
import { render3d } from './three/render3d.js';

const INK = '#17171B', WHITE = '#FFFDF7';
const OUT = ['street', 'outdoor', 'forest'];

function speech(text, x, y, s = 1, side = 1) {
  const lines = text.length > 18 ? [text.slice(0, text.lastIndexOf(' ', 18) > 4 ? text.lastIndexOf(' ', 18) : 18), text.slice(text.lastIndexOf(' ', 18) > 4 ? text.lastIndexOf(' ', 18) + 1 : 18)] : [text];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.font = '900 44px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.max(...lines.map((t) => ctx.measureText(t).width)) + 70, h = lines.length * 56 + 46;
  rr(-w / 2 + 8, -h / 2 + 9, w, h, 26); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill(); rr(-w / 2, -h / 2, w, h, 26); ctx.fillStyle = WHITE; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(side * w * 0.2, h / 2 - 3); ctx.lineTo(side * w * 0.38, h / 2 + 58); ctx.lineTo(side * w * 0.04, h / 2 - 5); ctx.closePath(); ctx.fillStyle = WHITE; ctx.fill(); ctx.stroke();
  lines.forEach((t, i) => { ctx.fillStyle = INK; ctx.fillText(t, 0, -h / 2 + 30 + i * 56); }); ctx.restore();
}
function card(text, y, st, s = 1) { ctx.save(); ctx.translate(W / 2, y); ctx.scale(s, s); ctx.font = '900 54px Inter'; const w = ctx.measureText(text).width + 90; rr(-w / 2 + 6, -44, w, 96, 14); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill(); rr(-w / 2, -52, w, 96, 14); ctx.fillStyle = st.captions.hi; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, -4); ctx.restore(); }
function popText(text, y, st, p) { ctx.save(); ctx.translate(W / 2, y); ctx.scale(0.5 + 0.5 * p, 0.5 + 0.5 * p); ctx.font = `900 ${text.length > 7 ? 120 : 170}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 30; ctx.strokeStyle = '#0B0B10'; ctx.strokeText(text, 0, 0, 980); ctx.fillStyle = st.captions.hi; ctx.fillText(text, 0, 0, 980); ctx.restore(); }
const hexA = (h) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},A)`; };
// Depth-of-field: a true Gaussian blur (ctx.filter) applied to a quarter-size copy, then scaled back with high-quality smoothing.
// Blur is smooth by nature, so nothing visible is lost, and it is ~16x cheaper than filtering the full frame.
// The copy is rendered with `pad` extra pixels on every side and cropped afterwards, so the frame edges stay clean.
const OFF = document.createElement('canvas'), OFF2 = document.createElement('canvas');
const blurred = (px, fn) => {
  if (px <= 0) return fn();
  const k = 4, pad = Math.ceil((px / k) * 3) + 2, w = Math.ceil(W / k) + pad * 2, h = Math.ceil(H / k) + pad * 2;
  OFF.width = OFF2.width = w; OFF.height = OFF2.height = h;
  const main = ctx, o = OFF.getContext('2d'); o.setTransform(1 / k, 0, 0, 1 / k, pad, pad); setCtx(o);
  try { fn(); } finally { setCtx(main); }
  const o2 = OFF2.getContext('2d'); o2.filter = `blur(${(px / k).toFixed(2)}px)`; o2.drawImage(OFF, 0, 0); o2.filter = 'none';
  main.imageSmoothingEnabled = true; main.imageSmoothingQuality = 'high'; main.drawImage(OFF2, pad, pad, w - pad * 2, h - pad * 2, 0, 0, W, H);
};

const HOLD_POSE = { phone: 'phone', cup: 'drink', letter: 'reach', book: 'reach', key: 'reach', money: 'shake', flashlight: 'point', sign: 'point', bag: 'idle' };
function holdFor(sc) {
  if (sc.hold) return sc.hold;                       // chosen by the LLM planner
  const p = sc.props || [], pose = sc.hero.pose[1][1], txt = sc.text.toLowerCase();
  if (pose === 'phone' || (p.includes('phone') && /\b(call|called|ring|rang|text|texted|answer|picked)\b/.test(txt))) return 'phone';
  if (pose === 'drink' || p.includes('cup')) return 'cup';
  if (/\b(flashlight|torch)\b/.test(txt)) return 'flashlight';
  if (p.includes('letter') && /\b(read|letter|note|diary|contract|rule|rules|map)\b/.test(txt)) return /\bbook|diary\b/.test(txt) ? 'book' : 'letter';
  if (p.includes('key') && /\bkey|keys\b/.test(txt)) return 'key';
  if (p.includes('money') && /\b(cash|\$|wallet|paid|pay|borrow\w*|lend|bought)\b/.test(txt)) return 'money';
  return null;
}
export function buildFromPlan(plan, st) {
  const shots = [], cues = [], cue = (t, type, o = {}) => cues.push({ t: +t.toFixed(3), type, ...o });
  const cast = Object.fromEntries(plan.cast.map((c) => [c.id, c])), pal = st.sets.palette, sfxScale = st.audio.sfx ?? 1;
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  plan.scenes.forEach((sc, i) => {
    const at = cut(i), type = sc.shot.type, set = sc.set, outside = OUT.includes(set.kind), cm = st.camera;
    const camC = type === 'close' ? [540, 940] : type === 'wide' ? [540, 1120] : [540, 1000];
    shots.push({ id: 'S' + String(i + 1).padStart(2, '0'), at, cam3d: st.render !== '2d', cam: camC, zoom: sc.shot.zoom, move: sc.shot.move, trans: sc.transition, hand: cm.handheld, note: `${sc.arc} ${sc.emotion} ${set.kind}/${set.tod} ${type}/${sc.shot.move}`,
      draw(lt, d, t) {
        const amp = (sc.shot.move === 'track' ? 70 : 22) * cm.parallax, px = (seg(lt, 0, d) - 0.5) * 2 * amp, peakShake = sc.arc === 'peak' ? Math.max(0, 1 - lt / 0.8) * 0.8 : 0;
        const rain = set.weather === 'rain' || set.weather === 'storm', bolt = rain ? FX.lightning(t, i * 0.173) : 0, flick = sc.emotion === 'fear' || sc.emotion === 'tension' ? 0.5 + sc.intensity * 0.5 : 0;
        const whipP = sc.transition === 'whip' ? clamp(lt / 0.22) : 1;
        ctx.save(); if (whipP < 1) ctx.translate((1 - eo(whipP)) * 260, 0);
        const drawBg = () => {
          const o = { t, tod: set.tod, weather: set.weather, pal, shake: peakShake, px, flick, kind: set.kind };
          if (set.kind === 'elevator') S.elevator({ t, shake: peakShake });
          else if (set.kind === 'hallway') Z.hallway(o);
          else if (outside) Z.outside(o);
          else Z.room({ ...o, kind: ['room', 'bedroom', 'office', 'cafe', 'kitchen'].includes(set.kind) ? set.kind : 'room' });
        };
        if (st.render !== '2d') {
          const frac = lt / d, phase = sc.split2 && frac >= sc.split2 ? 2 : sc.split && frac >= sc.split ? 1 : 0, ALT = { close: 'medium', medium: 'close', wide: 'medium', two: 'close', insert: 'insert' };
          const ty = phase === 1 ? ALT[type] : type, mvv = phase === 0 ? sc.shot.move : phase === 1 ? sc.splitMove || 'push' : 'punch', starts = [0, (sc.split || 0) * d, (sc.split2 || 0) * d], ends = [sc.split ? sc.split * d : d, sc.split2 ? sc.split2 * d : d, d];
          const hero = cast[sc.hero.id], second = sc.costar ? cast[sc.costar.id] : sc.hero.id !== 'hero' && type === 'two' ? cast.hero : null, two = ty === 'two' && second;
          const hold = holdFor(sc), heroPose = hold && HOLD_POSE[hold] && sc.hero.pose[1][1] !== 'run' ? [[0, sc.hero.pose[0][1]], [0.3, HOLD_POSE[hold]]] : sc.hero.pose;
          const cs = []; if (ty !== 'insert') { cs.push({ id: hero.id, cast: hero, pose: heroPose, mood: sc.hero.mood, talk: true, seed: 0, hold, holdLabel: sc.pop || sc.insert?.value || '' }); if (two) cs.push({ id: second.id, cast: second, pose: sc.costar ? sc.costar.pose : 'idle', mood: sc.costar ? sc.costar.mood : 'calm', talk: false, seed: 1.7 }); }
          const cv3 = render3d({ t, lt, d, set, pal, type: ty === 'insert' ? 'wide' : two ? 'two' : ty, move: mvv, camLt: lt - starts[phase], camD: Math.max(0.3, ends[phase] - starts[phase]), zoom: sc.shot.zoom, style: st, flick, shake: peakShake, hand: st.camera.handheld, cast: cs, noChars: ty === 'insert', open: set.kind === 'elevator' && /\b(open|opened|opens|doors)\b/i.test(sc.text) && sc.arc !== 'build' ? 1 : 0 });
          if (ty === 'insert') { blurred(10, () => ctx.drawImage(cv3, 0, 0, W, H)); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-300, -300, W + 600, H + 600); if (sc.insert) drawInsert(sc.insert, t, lt, d, st); }
          else { ctx.drawImage(cv3, 0, 0, W, H); if (sc.bubble && st.bubbles) speech(sc.bubble, two ? 540 : 560, ty === 'close' ? 330 : 520, 0.8, 1); }
        } else if (type === 'insert') { ctx.save(); ctx.translate(px * 0.3, 0); blurred(14, drawBg); ctx.restore(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-300, -300, W + 600, H + 600); if (sc.insert) drawInsert(sc.insert, t, lt, d, st); }
        else {
          ctx.save(); ctx.translate(outside ? 0 : px * 0.35, 0); blurred(type === 'close' ? 5 : 0, drawBg); ctx.restore();
          const hero = cast[sc.hero.id], second = sc.costar ? cast[sc.costar.id] : sc.hero.id !== 'hero' && type === 'two' ? cast.hero : null;
          const two = type === 'two' && second, GY = type === 'wide' ? 1500 : type === 'close' ? 1960 : 1700, SC = type === 'wide' ? (two ? 0.58 : 0.7) : type === 'close' ? 1.55 : two ? 0.82 : 0.92;
          const base = (c, x, dir, pose, mood, talk, sOff = 1) => c && (S.glow(x, GY - 380 * SC, 560 * SC + 160, st.sets.palette.accent.startsWith('#') ? hexA(st.sets.palette.accent) : 'rgba(255,220,170,A)', set.tod === 'night' ? 0.30 : 0.12), true) && drawChar({ t, lt, x, y: GY, s: SC * sOff, dir, pose, mood, talk, sc: st.character, outfit: c.outfit, seed: c.id === 'hero' ? 0 : c.id.charCodeAt(1) * 1.7, look: () => [dir > 0 ? 0.5 : -0.5, 0], hold: sc.hero.id === c.id && sc.props.includes('phone') && (sc.hero.pose[1][1] === 'phone') ? (x2, y2) => { ctx.save(); ctx.translate(x2 + 6, y2 - 44); ctx.rotate(0.1); rr(-34, -64, 68, 128, 12); ctx.fillStyle = '#10131B'; ctx.fill(); rr(-28, -56, 56, 108, 8); ctx.fillStyle = '#7FB4FF'; ctx.fill(); ctx.restore(); } : null });
          ctx.save(); ctx.translate(px, 0);
          const heroX = two ? 380 : 540, secX = 720;
          if (two) { const ent = second.outfit.top === 'cloak'; base(second, ent ? 790 : secX, -1, sc.costar ? sc.costar.pose : 'idle', sc.costar ? sc.costar.mood : 'calm', false, ent ? 1.06 : 1); base(hero, heroX, 1, sc.hero.pose, sc.hero.mood, true); }
          else base(hero, heroX, 1, sc.hero.pose, sc.hero.mood, true);
          ctx.restore();
          if (sc.bubble && st.bubbles) speech(sc.bubble, two ? 540 : 560, type === 'close' ? 330 : 520, 0.8, 1);
        }
        if (rain && !set.kind.match(/elevator/)) FX.rain(t, outside ? 1 : 0.5);
        if (set.weather === 'fog') FX.fog(t);
        ctx.restore();
        FX.grade(sc.grade, sc.intensity, st, t);
        // flicker blackouts when afraid
        if (flick && Math.sin(t * 37 + i) > 0.82 + (1 - flick) * 0.15) FX.dip(0.35 + 0.25 * flick);
        if (bolt) FX.flash(0.55 * bolt, '210,225,255');
        // overlays
        const rule = sc.text.match(/^rule\s+(?:number\s+)?(\w+)/i);
        if (rule) card('RULE ' + ({ one: '01', two: '02', three: '03', four: '04', five: '05' }[rule[1].toLowerCase()] || rule[1].toUpperCase()), 250, st, eob(clamp(lt / 0.25)));
        else if (i === 0 && st.hookCard) card(sc.text.split(' ').slice(0, 4).join(' ').replace(/[.,!?]+$/, '').toUpperCase(), 250, st, eob(clamp(lt / 0.25)));
        if (sc.pop && lt > 0.08 && lt < Math.min(d - 0.1, 1.7)) popText(sc.pop, 430, st, eob(clamp((lt - 0.08) / 0.2)));
        if (sc.cta && lt > d - 1.6) card(sc.cta, 1480, st, eob(clamp((lt - (d - 1.6)) / 0.25)));
        if (sc.transition === 'flash') FX.flash(Math.max(0, 0.8 * (1 - lt / 0.16)));
        if (sc.transition === 'fade') FX.dip(Math.max(0, 1 - lt / 0.3));
      } });
    // sound
    if (sc.transition !== 'fade' && sfxScale > 0.4) cue(at, 'whoosh', { gain: 0.5 * sfxScale });
    sc.sfx.forEach((s) => { let t0 = at + 0.1; try { if (s.word) t0 = Wd(s.word, i); } catch {} cue(t0, s.type, { gain: (s.gain || 0.5) * sfxScale, dur: s.type === 'alarm' ? 1.2 : undefined }); });
    if (sc.insert?.type === 'clock') cue(at + 0.15, 'tock', { gain: 0.6 * sfxScale });
    if (sc.insert?.type === 'phone') { cue(at + 0.1, 'tock', { gain: 0.7 }); cue(at + 0.5, 'tock', { gain: 0.7 }); }
    { const dd = (i < plan.scenes.length - 1 ? cut(i + 1) : T.dur) - at; if (sc.split) cue(at + sc.split * dd, 'whoosh', { gain: 0.35 * sfxScale }); if (sc.split2) cue(at + sc.split2 * dd, 'whoosh', { gain: 0.35 * sfxScale }); }
    if (sc.pop) cue(at + 0.1, 'pop', { gain: 0.7 * sfxScale });
  });
  return { shots, cues };
}
