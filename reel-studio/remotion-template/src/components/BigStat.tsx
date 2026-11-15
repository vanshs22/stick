import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../engine/tokens';
import {E, p} from '../engine/anim';
import {atLocal, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';

/** A number that counts up. props: value (number), prefix, suffix, label, anchor (word anchor that starts the count). */
export const BigStat: React.FC<ShotProps> = ({shot, value = 0, prefix = '', suffix = '', label = '', anchor}) => {
  const {lt} = useShotTime(shot);
  const start = anchor ? atLocal(shot, anchor) : 0.15;
  const a = p(lt, start, 1.1, E.outExpo);
  const n = Math.round(Number(value) * a);
  const pop = p(lt, start, 0.4, E.outBack);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `scale(${0.85 + 0.15 * pop})`, textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 260, color: C.ink, letterSpacing: '-0.04em'}}>{prefix}{n.toLocaleString('en-US')}{suffix}</div>
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 10}}>{label}</div>
      </div>
    </AbsoluteFill>
  );
};
