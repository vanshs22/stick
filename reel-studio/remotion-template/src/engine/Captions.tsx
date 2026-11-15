import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, SAFE} from './tokens';
import {E, clamp, p} from './anim';
import type {Chunk, Timeline} from './types';

type Pre = {size: number; weight: number; boxed: boolean; serif?: boolean};
const PRESETS: Record<string, Pre> = {
  'word-pop': {size: 64, weight: 800, boxed: false},
  'one-word': {size: 118, weight: 900, boxed: false},
  boxed: {size: 62, weight: 800, boxed: true},
  phrase: {size: 58, weight: 500, boxed: false, serif: true},
  typewriter: {size: 54, weight: 600, boxed: true},
  karaoke: {size: 64, weight: 800, boxed: false},
};

const Word: React.FC<{w: Chunk['words'][number]; t: number; pre: Pre; preset: string; last: boolean; index: number}> = ({w, t, pre, preset, last, index}) => {
  const a = p(t, w.t - 0.02, 0.26, E.outCubic);
  const lit = preset === 'karaoke' ? (t >= w.t ? 1 : 0) : 0;
  const color = preset === 'karaoke' ? (lit ? C.accent : pre.boxed ? C.ink : '#fff') : w.hi ? C.accent : pre.boxed ? C.ink : '#fff';
  const vis = preset === 'karaoke' ? 1 : preset === 'phrase' ? p(t, w.t - 0.25, 0.4, E.outCubic) : a;
  if (preset === 'typewriter') {
    const n = Math.floor(clamp((t - w.t) / 0.22) * w.w.length);
    return <span style={{color, marginRight: last ? 0 : '0.27em', fontFamily: F.mono}}>{w.w.slice(0, t >= w.t ? Math.max(1, n) : 0)}</span>;
  }
  return (
    <span style={{display: 'inline-block', marginRight: last ? 0 : '0.27em', color, opacity: vis, fontFamily: pre.serif ? F.serif : F.sans, fontStyle: pre.serif && w.hi ? 'italic' : 'normal', transform: `translateY(${(1 - vis) * 14}px) scale(${preset === 'karaoke' && lit ? 1.06 : 0.94 + 0.06 * vis})`}}>
      {w.w}
    </span>
  );
};

/** Captions from timeline.captions. Presets: word-pop, one-word, boxed, phrase, typewriter, karaoke. */
export const Captions: React.FC<{timeline: Timeline; show?: boolean}> = ({timeline, show = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (!show) return null;
  const chunk = timeline.captions.chunks.find((c) => t >= c.t0 - 0.01 && t < c.t1);
  if (!chunk) return null;
  const preset = timeline.captions.preset, pre = PRESETS[preset] || PRESETS['word-pop'];
  return (
    <div style={{position: 'absolute', left: 60, right: SAFE.right_margin, top: SAFE.caption_y, textAlign: 'center', fontWeight: pre.weight, fontSize: pre.size, lineHeight: 1.15, letterSpacing: '-0.01em'}}>
      <div style={{display: 'inline-block', ...(pre.boxed ? {background: 'rgba(255,255,255,0.94)', borderRadius: 26, padding: '12px 30px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)'} : {textShadow: '0 4px 18px rgba(0,0,0,0.55)'})}}>
        {chunk.words.map((w, i) => <Word key={i} w={w} t={t} pre={pre} preset={preset} last={i === chunk.words.length - 1} index={i} />)}
      </div>
    </div>
  );
};
