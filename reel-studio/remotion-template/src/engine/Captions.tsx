import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, CAPTION, F, SAFE, TYPO} from './tokens';
import capCfg from '../data/captions.json';
const CC = capCfg as any;
/** where the captions sit: bottom (pack default), middle or top of the safe area, or an exact y */
const CAP_Y = CC.position?.y ?? ({bottom: SAFE.caption_y, middle: 860, top: 230} as Record<string, number>)[CC.position?.anchor || 'bottom'] ?? SAFE.caption_y;
const CAP_SCALE = CC.scale ?? 1;
const HI_DEFAULT = (TYPO.highlight?.mode || 'color') as string;
import {E, clamp, p} from './anim';
import type {Chunk, Timeline} from './types';

type Pre = {size: number; weight: number; boxed: boolean; serif?: boolean; upper?: boolean; plate?: boolean};
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
};

const Word: React.FC<{w: Chunk['words'][number]; t: number; pre: Pre; preset: string; last: boolean; index: number; hi?: string}> = ({w, t, pre, preset, last, index, hi: HI = 'color'}) => {
  const a = p(t, w.t - 0.02, 0.26, E.outCubic);
  const lit = preset === 'karaoke' ? (t >= w.t ? 1 : 0) : 0;
  const color = preset === 'headline' ? (w.hi ? C.accent : t >= w.t ? C.ink : C.muted) : preset === 'dialogue' ? (w.hi ? C.accent : '#fff') : preset === 'karaoke' ? (lit ? C.accent : pre.boxed ? C.ink : '#fff') : w.hi ? C.accent : pre.boxed ? C.ink : CAPTION.fill;
  const vis = preset === 'karaoke' || preset === 'headline' ? 1 : preset === 'phrase' ? p(t, w.t - 0.25, 0.4, E.outCubic) : a;
  if (preset === 'typewriter') {
    const n = Math.floor(clamp((t - w.t) / 0.22) * w.w.length);
    return <span style={{color, marginRight: last ? 0 : '0.27em', fontFamily: F.mono}}>{w.w.slice(0, t >= w.t ? Math.max(1, n) : 0)}</span>;
  }
  return (
    <span style={{display: 'inline-block', marginRight: last ? 0 : '0.27em', color: w.hi && HI === 'box' ? '#111' : color, ...(w.hi && HI === 'box' ? {background: C.accent, borderRadius: '0.18em', padding: '0 0.18em', WebkitTextStroke: '0'} : {}), ...(w.hi && HI === 'underline' ? {textDecoration: 'underline', textDecorationThickness: '0.09em', textUnderlineOffset: '0.12em', textDecorationColor: C.accent, color: pre.boxed ? C.ink : CAPTION.fill} : {}), ...(w.hi && HI === 'none' ? {color: pre.boxed ? C.ink : CAPTION.fill} : {}), opacity: vis, fontFamily: (pre.serif || (preset === 'headline' && w.hi)) ? F.serif : F.sans, fontStyle: (pre.serif || preset === 'headline') && w.hi ? 'italic' : 'normal', transform: `translateY(${(1 - vis) * 14}px) scale(${preset === 'karaoke' && lit ? 1.06 : 0.94 + 0.06 * vis})`}}>
      {w.w}
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
  const speaker = timeline.shots.find((sh) => t >= sh.start && t < sh.end)?.speaker;
  if (preset === 'headline') return <div style={{position: 'absolute', left: 64, right: 120, top: 190, textAlign: 'left', fontWeight: 500, fontSize: 84, lineHeight: 1.12, letterSpacing: '-0.02em'}}>{chunk.words.map((w, i) => <Word key={i} w={w} t={t} pre={pre} preset={preset} last={i === chunk.words.length - 1} index={i} hi={hiMode} />)}</div>;
  if (preset === 'dialogue') return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 170, textAlign: 'center', lineHeight: 1.2, fontSize: 52}}>
      {speaker ? <div style={{display: 'inline-block', background: C.accent, color: '#fff', fontFamily: F.mono, fontWeight: 800, fontSize: 26, letterSpacing: '0.08em', padding: '4px 16px', borderRadius: 6, marginBottom: 10, textTransform: 'uppercase'}}>{speaker}</div> : null}
      <div><div style={{display: 'inline-block', background: 'rgba(8,8,18,0.7)', borderRadius: 24, padding: '12px 30px 16px'}}>{chunk.words.map((w, i) => <Word key={i} w={w} t={t} pre={pre} preset={preset} last={i === chunk.words.length - 1} index={i} hi={hiMode} />)}</div></div>
    </div>);
  return (
    <div style={{position: 'absolute', left: 60, right: SAFE.right_margin, top: yIn ?? CAP_Y, textAlign: 'center', textTransform: pre.upper ? 'uppercase' : undefined, fontFamily: F.caption, fontWeight: TYPO.caption?.weight ?? pre.weight, fontSize: pre.size, lineHeight: 1.15, letterSpacing: '-0.01em'}}>
      <div style={{display: 'inline-block', ...(pre.plate ? {background: 'rgba(20,14,34,0.72)', borderRadius: 18, padding: '8px 22px 10px', border: '2px solid rgba(255,255,255,0.18)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'} : pre.boxed ? {background: 'rgba(255,255,255,0.94)', borderRadius: 26, padding: '12px 30px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)'} : {textShadow: '0 4px 18px rgba(0,0,0,0.55)', WebkitTextStroke: `${Math.round(pre.size / 6.5)}px ${CAPTION.stroke}`, paintOrder: 'stroke fill'} as React.CSSProperties)}}>
        {chunk.words.map((w, i) => <Word key={i} w={w} t={t} pre={pre} preset={preset} last={i === chunk.words.length - 1} index={i} hi={hiMode} />)}
      </div>
    </div>
  );
};
