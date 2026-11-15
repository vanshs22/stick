import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, SAFE} from '../engine/tokens';
import {E, p} from '../engine/anim';
import {atLocal, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';

/** Headline whose words rise out of a mask. props: text, accent (word to colour), anchor (name of a word anchor that starts it). */
export const TitleCard: React.FC<ShotProps> = ({shot, text = '', accent = '', anchor}) => {
  const {lt} = useShotTime(shot);
  const start = anchor ? atLocal(shot, anchor) : 0.1;
  const words = String(text).split(/\s+/).filter(Boolean);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 80px', top: SAFE.top, bottom: 1920 - SAFE.bottom}}>
      <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 112, lineHeight: 1.05, color: C.ink, textAlign: 'center', letterSpacing: '-0.03em'}}>
        {words.map((w, i) => {
          const a = p(lt, start + i * 0.07, 0.5, E.outExpo);
          const hi = w.replace(/[^\w']/g, '').toLowerCase() === String(accent).toLowerCase();
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', marginRight: '0.22em'}}>
              <span style={{display: 'inline-block', transform: `translateY(${(1 - a) * 110}%)`, color: hi ? C.accent : C.ink, fontFamily: hi ? F.serif : F.sans, fontStyle: hi ? 'italic' : 'normal', fontWeight: hi ? 400 : 800}}>{w}</span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
