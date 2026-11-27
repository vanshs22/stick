import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {H, W} from '../engine/tokens';
import {p, E} from '../engine/anim';
import {useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';

/**
 * Two-person deep-thinking shot: two painted faces on black, one lit warm (near), one lit cold (far). Nothing moves but the eyes, the breath and a slow push.
 * props: framing 'two' | 'near' | 'far', speaker 'near' | 'far' (the speaker is lit a little brighter), push (0.03-0.06), look {warm, cool, bg}, glance (0..1 how often the eyes find the other face)
 * Original art (procedural SVG, brush texture by turbulence), not a copy of any reference painting.
 */
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** blink times: one every 3-5 s, deterministic from the seed */
const blinkAt = (t: number, seed: number) => { let c = hash(seed) * 2.5, k = 0; while (c < t - 0.2 && k < 60) { c += 3 + hash(seed + k + 1) * 2; k++; } const d = Math.abs(t - c); return d < 0.12 ? 1 - d / 0.12 : 0; };

type FaceP = {cx: number; cy: number; rx: number; tone: string; shade: string; speaking: boolean; t: number; seed: number; side: 1 | -1; id: string; gaze: number};
const Face: React.FC<FaceP> = ({cx, cy, rx, tone, shade, speaking, t, seed, side, id, gaze}) => {
  const ry = rx * 1.3, breath = 1 + 0.008 * Math.sin(t * 1.7 + seed), blink = blinkAt(t, seed), look = Math.sin(t * 0.37 + seed) * 0.35 + gaze * side * -1, up = Math.sin(t * 0.23 + seed * 2) * 0.12;
  const eye = (ex: number) => { const ew = rx * 0.2, eh = rx * 0.1 * (1 - 0.92 * blink); return <g key={ex}>
    <ellipse cx={ex} cy={cy - ry * 0.06} rx={ew * 1.5} ry={ew * 0.95} fill="#0a0a0d" opacity={0.55} />
    <ellipse cx={ex} cy={cy - ry * 0.06} rx={ew} ry={Math.max(1.5, eh)} fill="#e9e4da" />
    <circle cx={ex + look * ew * 0.55} cy={cy - ry * 0.06 + up * eh} r={Math.min(eh, ew * 0.5) * 0.92} fill="#08080b" />
    <circle cx={ex + look * ew * 0.55 + eh * 0.28} cy={cy - ry * 0.06 + up * eh - eh * 0.3} r={eh * 0.16} fill="#fff" opacity={0.85 * (1 - blink)} /></g>; };
  return (
    <g transform={`translate(${cx} ${cy}) scale(${breath}) translate(${-cx} ${-cy})`} filter="url(#paint)" opacity={speaking ? 1 : 0.8}>
      <ellipse cx={cx} cy={cy + ry * 1.25} rx={rx * 1.45} ry={ry * 0.9} fill={`url(#sh${id})`} />
      <rect x={cx - rx * 0.28} y={cy + ry * 0.7} width={rx * 0.56} height={ry * 0.6} fill={shade} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#hd${id})`} />
      <path d={`M ${cx - rx * 0.96} ${cy - ry * 0.18} Q ${cx - rx * 0.9} ${cy - ry * 1.05} ${cx} ${cy - ry * 1.04} Q ${cx + rx * 0.9} ${cy - ry * 1.05} ${cx + rx * 0.96} ${cy - ry * 0.18} Q ${cx + rx * 0.5} ${cy - ry * 0.7} ${cx} ${cy - ry * 0.66} Q ${cx - rx * 0.5} ${cy - ry * 0.7} ${cx - rx * 0.96} ${cy - ry * 0.18} Z`} fill="#15110f" opacity={0.92} />
      {eye(cx - rx * 0.38)}{eye(cx + rx * 0.38)}
      <path d={`M ${cx - rx * 0.62} ${cy - ry * 0.2} Q ${cx - rx * 0.38} ${cy - ry * 0.27} ${cx - rx * 0.14} ${cy - ry * 0.2}`} stroke="#120e0c" strokeWidth={rx * 0.035} fill="none" opacity={0.7} />
      <path d={`M ${cx + rx * 0.14} ${cy - ry * 0.2} Q ${cx + rx * 0.38} ${cy - ry * 0.27} ${cx + rx * 0.62} ${cy - ry * 0.2}`} stroke="#120e0c" strokeWidth={rx * 0.035} fill="none" opacity={0.7} />
      <path d={`M ${cx - rx * 0.1} ${cy + ry * 0.02} Q ${cx} ${cy + ry * 0.12} ${cx + rx * 0.1} ${cy + ry * 0.02}`} stroke="#120e0c" strokeWidth={rx * 0.02} fill="none" opacity={0.35} />
      <path d={`M ${cx - rx * 0.2} ${cy + ry * 0.4} Q ${cx} ${cy + ry * 0.43} ${cx + rx * 0.2} ${cy + ry * 0.4}`} stroke="#120e0c" strokeWidth={rx * 0.028} fill="none" opacity={0.55} />
    </g>);
};
export const TwoFaces: React.FC<ShotProps> = ({shot, framing = 'two', speaker = 'near', push = 0.045, look = {}, glance = 0.5}) => {
  const {lt, d} = useShotTime(shot), f = useCurrentFrame(), warm = look.warm || '#d99a62', cool = look.cool || '#6ea3b4', bg = look.bg || '#06060a', k = 1 + push * p(lt, 0, d, E.inOutSoft), t = f / 30;
  const G: Record<string, {n: [number, number, number]; r: [number, number, number]}> = {two: {n: [0.34, 0.54, 255], r: [0.72, 0.47, 215]}, near: {n: [0.42, 0.56, 430], r: [1.06, 0.5, 330]}, far: {n: [-0.1, 0.58, 330], r: [0.58, 0.54, 450]}};
  const g = G[framing] || G.two, ox = framing === 'far' ? 0 : 0, gz = glance * (0.5 + 0.5 * Math.sin(t * 0.6));
  const near = {cx: g.n[0] * W, cy: g.n[1] * H, rx: g.n[2]}, far = {cx: g.r[0] * W, cy: g.r[1] * H, rx: g.r[2]};
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{transform: `scale(${k})`, transformOrigin: `${framing === 'far' ? '58%' : '40%'} 52%`}}>
        <defs>
          <filter id="paint" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="7" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="16" /></filter>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(f / 3) % 50} /><feColorMatrix type="saturate" values="0" /></filter>
          <radialGradient id="hdn" cx="0.68" cy="0.4" r="0.8"><stop offset="0" stopColor={warm} /><stop offset="0.55" stopColor="#6e4a38" /><stop offset="1" stopColor="#1b1210" /></radialGradient>
          <radialGradient id="hdr" cx="0.3" cy="0.4" r="0.8"><stop offset="0" stopColor={cool} /><stop offset="0.55" stopColor="#38535c" /><stop offset="1" stopColor="#0e171b" /></radialGradient>
          <radialGradient id="shn" cx="0.5" cy="0.2" r="0.8"><stop offset="0" stopColor="#4a2f26" /><stop offset="1" stopColor={bg} /></radialGradient>
          <radialGradient id="shr" cx="0.5" cy="0.2" r="0.8"><stop offset="0" stopColor="#233c46" /><stop offset="1" stopColor={bg} /></radialGradient>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.85" /></radialGradient>
        </defs>
        <Face {...far} tone={cool} shade="#1a2a31" speaking={speaker === 'far'} t={t} seed={5.3} side={-1} id="r" gaze={gz} />
        <Face {...near} tone={warm} shade="#3a2620" speaking={speaker === 'near'} t={t} seed={1.7} side={1} id="n" gaze={gz} />
        <rect width={W} height={H} fill="url(#vig)" /><rect width={W} height={H} filter="url(#grain)" opacity={0.09} style={{mixBlendMode: 'overlay'}} />
      </svg>
    </AbsoluteFill>);
};
