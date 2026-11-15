import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {E, mix, p} from './anim';

/** How a shot ENTERS, chosen by the previous shot's transition_out.type: cut | fade | dip | slide | whip | wipe | mask | swing | zoom. */
export const Transition: React.FC<{type?: string; children: React.ReactNode}> = ({type = 'cut', children}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const D = type === 'whip' ? 0.2 : 0.3;
  const a = p(t, 0, D, E.outExpo);
  let style: React.CSSProperties = {};
  if (type === 'fade') style = {opacity: a};
  else if (type === 'slide' || type === 'whip') style = {transform: `translateX(${(1 - a) * width * (type === 'whip' ? 0.9 : 0.35)}px)`, opacity: mix(0.2, 1, a), filter: type === 'whip' && a < 1 ? `blur(${(1 - a) * 14}px)` : undefined};
  else if (type === 'wipe') style = {clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`};
  else if (type === 'mask') style = {clipPath: `circle(${a * 150}% at 50% 50%)`};
  else if (type === 'swing') style = {transform: `perspective(1800px) rotateY(${(1 - a) * 28}deg)`, opacity: a, transformOrigin: '0% 50%'};
  else if (type === 'zoom') style = {transform: `scale(${mix(1.18, 1, a)})`, opacity: a};
  return (
    <AbsoluteFill>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {type === 'dip' ? <AbsoluteFill style={{background: '#000', opacity: 1 - a, pointerEvents: 'none'}} /> : null}
    </AbsoluteFill>
  );
};
