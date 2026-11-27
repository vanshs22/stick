import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BGS, C, CAPTION, F, H, LANDSCAPE, PRESENTER, SAFE, TYPO, W} from './tokens';
import capCfg from '../data/captions.json';
const CC = capCfg as any;
/** where the captions sit: bottom (pack default), middle or top of the safe area, or an exact y */
const CAP_Y = CC.position?.y ?? ({bottom: SAFE.caption_y, middle: Math.round(H * 0.45), top: Math.round(H * 0.12)} as Record<string, number>)[CC.position?.anchor || 'bottom'] ?? SAFE.caption_y;
const CAP_SCALE = CC.scale ?? 1;
const HI_DEFAULT = (TYPO.highlight?.mode || 'color') as string;
import {E, clamp, p} from './anim';
import type {Chunk, Timeline} from './types';

/** true when a #rrggbb background is dark enough that ink text on it is unreadable */
const isDark = (c?: string) => { const m = /^#([0-9a-f]{6})/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5; };
type Pre = {dark?: boolean; size: number; weight: number; boxed: boolean; serif?: boolean; upper?: boolean; plate?: boolean; stroke?: boolean; lower?: boolean; sel?: boolean};
const PRESETS: Record<string, Pre> = {
  'word-pop': {size: 76, weight: 900, boxed: false},
  'one-word': {size: 118, weight: 900, boxed: false},
  boxed: {size: 62, weight: 800, boxed: true},
  phrase: {size: 58, weight: 500, boxed: false, serif: true},
  typewriter: {size: 54, weight: 600, boxed: true},
  karaoke: {size: 64, weight: 800, boxed: false},
  headline: {size: 80, weight: 500, boxed: false},
  dialogue: {size: 52, weight: 500, boxed: false},
  'caps-plate': {size: 40, weight: 900, boxed: false, upper: true, plate: true},
  'stroke-word': {size: 70, weight: 900, boxed: false, stroke: true, lower: true},   // one or two words, heavy sans, thick black stroke (sketchy stickman, long-form story shorts)
  'quote-side': {size: 46, weight: 500, boxed: false},   // two-faces: small quoted lines in the top third, aligned toward the speaker; the last line of the film is larger
  'soft-lower': {size: 58, weight: 600, boxed: false, lower: true},   // thin white lowercase sans with a soft shadow (stickman in a 3D world)
  'select-box': {size: 54, weight: 500, boxed: false, sel: true},   // the accent word sits in a lime box with four corner handles (neon dashboard)
};

/** an emoji picture (Noto, assets/emoji/<codepoints>.png) that pops in right after its word: scales 0 -> 1.18 -> 1 over 0.22 s, a 6 degree wobble, sized to the caption's own text height */
const cpOf = (e: string) => Array.from(e).map((c) => c.codePointAt(0)!.toString(16)).filter((x) => x !== 'fe0f').join('_');
const Emo: React.FC<{e: string; t: number; at: number}> = ({e, t, at}) => { const k = clamp((t - at) / 0.22), s = k < 0.7 ? (k / 0.7) * 1.18 : 1.18 - 0.18 * ((k - 0.7) / 0.3); return <Img src={staticFile(`assets/emoji/${cpOf(e)}.png`)} style={{display: 'inline-block', height: '1.02em', width: '1.02em', verticalAlign: '-0.14em', marginLeft: '0.14em', opacity: k > 0 ? 1 : 0, transform: `scale(${Math.max(0, s)}) rotate(${(1 - k) * -9}deg)`, WebkitTextStroke: 0}} />; };
const Word: React.FC<{w: Chunk['words'][number]; t: number; pre: Pre; preset: string; last: boolean; index: number; hi?: string}> = ({w, t, pre, preset, last, index, hi: HI = 'color'}) => {
  const a = p(t, w.t - 0.02, 0.26, E.outCubic);
  const lit = preset === 'karaoke' ? (t >= w.t ? 1 : 0) : 0;
  const color = preset === 'headline' ? (w.hi ? C.accent : t >= w.t ? (pre.dark ? '#F5F3EA' : C.ink) : (pre.dark ? 'rgba(245,243,234,0.45)' : C.muted)) : preset === 'dialogue' ? (w.hi ? C.accent : '#fff') : preset === 'karaoke' ? (lit ? C.accent : pre.boxed ? C.ink : '#fff') : w.hi ? C.accent : pre.boxed ? C.ink : CAPTION.fill;
  const vis = preset === 'karaoke' || preset === 'headline' ? 1 : preset === 'phrase' ? p(t, w.t - 0.25, 0.4, E.outCubic) : a;
  if (preset === 'typewriter') {
    const n = Math.floor(clamp((t - w.t) / 0.22) * w.w.length);
    return <span style={{color, marginRight: last ? 0 : '0.27em', fontFamily: F.mono}}>{w.w.slice(0, t >= w.t ? Math.max(1, n) : 0)}</span>;
  }
  return (
    <span style={{display: 'inline-block', position: 'relative', marginRight: last ? 0 : '0.27em', color: pre.sel ? (w.hi && t >= w.t ? '#0D0C12' : t >= w.t ? '#fff' : 'rgba(255,255,255,0.4)') : w.hi && HI === 'box' ? '#111' : color, ...(pre.stroke ? {WebkitTextStroke: `${Math.round(pre.size * 0.1)}px #000`, paintOrder: 'stroke fill', textTransform: 'lowercase' as const, textShadow: '0 4px 0 rgba(0,0,0,0.35)'} : {}), ...(pre.sel && w.hi && t >= w.t ? {WebkitTextStroke: '0', textShadow: 'none', background: C.accent, borderRadius: '0.16em', padding: '0 0.2em', outline: '2px solid rgba(255,255,255,0.7)'} : {}), ...(w.hi && HI === 'box' ? {background: C.accent, borderRadius: '0.18em', padding: '0 0.18em', WebkitTextStroke: '0'} : {}), ...(w.hi && HI === 'underline' ? {textDecoration: 'underline', textDecorationThickness: '0.09em', textUnderlineOffset: '0.12em', textDecorationColor: C.accent, color: pre.boxed ? C.ink : CAPTION.fill} : {}), ...(w.hi && HI === 'none' ? {color: pre.boxed ? C.ink : CAPTION.fill} : {}), opacity: vis, fontFamily: (pre.serif || (preset === 'headline' && w.hi)) ? F.serif : F.sans, fontStyle: (pre.serif || preset === 'headline') && w.hi ? 'italic' : 'normal', transform: `translateY(${(1 - vis) * 14}px) scale(${preset === 'karaoke' && lit ? 1.06 : 0.94 + 0.06 * vis})`}}>
      {w.w}{w.e ? <Emo e={w.e} t={t} at={w.t + 0.04} /> : null}{pre.sel && w.hi && t >= w.t ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y], i) => <i key={i} style={{position: 'absolute', width: 12, height: 12, borderRadius: 6, background: '#fff', border: `2px solid ${C.accent}`, left: x < 0 ? -6 : undefined, right: x > 0 ? -6 : undefined, top: y < 0 ? -6 : undefined, bottom: y > 0 ? -6 : undefined}} />) : null}
    </span>
  );
};

/** Captions from timeline.captions. Presets: word-pop, one-word, boxed, phrase, typewriter, karaoke. */
export const Captions: React.FC<{timeline: Timeline; show?: boolean; preset?: string; y?: number; scale?: number; hi?: string}> = ({timeline, show = true, preset: presetIn, y: yIn, scale: scIn, hi: hiIn}) => {
  const hiMode = hiIn ?? HI_DEFAULT;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (!show) return null;
  const chunk = timeline.captions.chunks.find((c) => t >= c.t0 - 0.01 && t < c.t1);
  if (!chunk) return null;
  const preset = presetIn || CC.preset || timeline.captions.preset, pre0 = PRESETS[preset] || PRESETS['word-pop'], pre = {...pre0, size: Math.round(pre0.size * (scIn ?? CAP_SCALE))};
  const sh0 = timeline.shots.find((sh) => t >= sh.start && t < sh.end), speaker = sh0?.speaker;
  pre.dark = isDark(sh0?.bg ? BGS[sh0.bg] || sh0.bg : C.bg);
  if (preset === 'headline') return <div style={{position: 'absolute', left: 64, right: LANDSCAPE ? (SAFE.content_left ? W - SAFE.content_left + 30 : 64) : 120, top: LANDSCAPE ? (PRESENTER ? (speaker ? 150 : 110) : Math.round(H * (speaker ? 0.24 : 0.2))) : speaker ? 226 : 190, textAlign: 'left', fontWeight: 500, fontSize: LANDSCAPE ? (PRESENTER ? 58 : 64) : 84, lineHeight: 1.12, letterSpacing: '-0.02em'}}>{speaker ? <div style={{position: 'absolute', top: -44, left: 0, background: C.accent, color: '#fff', fontFamily: F.mono, fontWeight: 800, fontSize: 26, letterSpacing: '0.08em', padding: '4px 16px', borderRadius: 6, textTransform: 'uppercase'}}>{speaker}</div> : null}<div>{chunk.words.map((w, i) => <Word key={i} w={w} t={t} pre={pre} preset={preset} last={i === chunk.words.length - 1} index={i} hi={hiMode} />)}</div></div>;
  if (preset === 'quote-side') { const lastShot = timeline.shots[timeline.shots.length - 1], payoff = !!sh0 && sh0.id === lastShot.id && t >= sh0.start + (sh0.end - sh0.start) * 0.35, right = speaker === 'far', sz = payoff ? Math.round(pre.size * 1.6) : pre.size;
    return <div style={{position: 'absolute', left: right ? 380 : 70, right: right ? 70 : 380, top: LANDSCAPE ? 60 : payoff ? 300 : 210, textAlign: right ? 'right' : 'left', fontFamily: F.caption, fontWeight: payoff ? 700 : 500, fontSize: sz, lineHeight: 1.22, color: '#F4F1EA', letterSpacing: '0.005em', textShadow: '0 2px 14px rgba(0,0,0,0.7)'}}>
      {'\u201C'}{chunk.words.map((w, i) => <span key={i} style={{opacity: p(t, w.t - 0.05, 0.3, E.outCubic), marginRight: '0.27em', color: w.hi ? C.accent : undefined}}>{w.w}</span>)}{'\u201D'}</div>; }
  if (preset === 'dialogue') return (
    <div style={{position: 'absolute', left: 70, right: 70, top: LANDSCAPE ? 60 : 170, textAlign: 'center', lineHeight: 1.2, fontSize: 52}}>
      {speaker ? <div style={{display: 'inline-block', background: C.accent, color: '#fff', fontFamily: F.mono, fontWeight: 800, fontSize: 26, letterSpacing: '0.08em', padding: '4px 16px', borderRadius: 6, marginBottom: 10, textTransform: 'uppercase'}}>{speaker}</div> : null}
      <div><div style={{display: 'inline-block', background: 'rgba(8,8,18,0.7)', borderRadius: 24, padding: '12px 30px 16px'}}>{chunk.words.map((w, i) => <Word key={i} w={w} t={t} pre={pre} preset={preset} last={i === chunk.words.length - 1} index={i} hi={hiMode} />)}</div></div>
    </div>);
  return (
    <div style={{position: 'absolute', left: 60, right: SAFE.right_margin, top: yIn ?? CAP_Y, textAlign: 'center', textTransform: pre.upper ? 'uppercase' : pre.lower ? 'lowercase' : undefined, fontFamily: F.caption, fontWeight: TYPO.caption?.weight ?? pre.weight, fontSize: pre.size, lineHeight: 1.15, letterSpacing: '-0.01em'}}>
      <div style={{display: 'inline-block', ...(pre.plate ? {background: 'rgba(20,14,34,0.72)', borderRadius: 18, padding: '8px 22px 10px', border: '2px solid rgba(255,255,255,0.18)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'} : pre.boxed ? {background: 'rgba(255,255,255,0.94)', borderRadius: 26, padding: '12px 30px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)'} : {textShadow: '0 4px 18px rgba(0,0,0,0.55)', WebkitTextStroke: `${Math.round(pre.size / 6.5)}px ${CAPTION.stroke}`, paintOrder: 'stroke fill'} as React.CSSProperties)}}>
        {chunk.words.map((w, i) => <Word key={i} w={w} t={t} pre={pre} preset={preset} last={i === chunk.words.length - 1} index={i} hi={hiMode} />)}
      </div>
    </div>
  );
};
