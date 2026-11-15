import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, SAFE} from './tokens';
import {E, p} from './anim';
import type {Timeline} from './types';

/** Captions from timeline.captions. Presets: word-pop (default), one-word, boxed. M2 adds typewriter, karaoke, phrase. */
export const Captions: React.FC<{timeline: Timeline; show?: boolean}> = ({timeline, show = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (!show) return null;
  const chunk = timeline.captions.chunks.find((c) => t >= c.t0 - 0.01 && t < c.t1);
  if (!chunk) return null;
  const preset = timeline.captions.preset;
  const boxed = preset === 'boxed';
  const size = preset === 'one-word' ? 110 : 64;
  return (
    <div style={{position: 'absolute', left: 60, right: SAFE.right_margin, top: SAFE.caption_y, textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: size, lineHeight: 1.15, letterSpacing: '-0.01em'}}>
      <div style={{display: 'inline-block', ...(boxed ? {background: 'rgba(255,255,255,0.94)', borderRadius: 26, padding: '12px 30px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)'} : {textShadow: '0 4px 18px rgba(0,0,0,0.45)'})}}>
        {chunk.words.map((w, i) => {
          const a = p(t, w.t - 0.02, 0.26, E.outCubic);
          return (
            <span key={i} style={{display: 'inline-block', marginRight: i < chunk.words.length - 1 ? '0.27em' : 0, color: w.hi ? C.accent : boxed ? C.ink : '#fff', opacity: a, transform: `translateY(${(1 - a) * 14}px) scale(${0.94 + 0.06 * a})`}}>
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
