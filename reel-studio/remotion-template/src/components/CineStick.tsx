import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../engine/tokens';
import {E, clamp, p} from '../engine/anim';
import {talkAt, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
// @ts-ignore plain JS shared with the sprite baker
import {stickG} from './stick/stickman_svg.js';

/**
 * Cinematic flat stickman scene (style 3, learned from r10 r13 r14 r06): clean thick-outline cartoon characters in dark, lit vector sets.
 * props: bg 'stage' | 'bedroom' | 'car' | 'control' | 'newsroom' | 'street' | 'void'
 *        cast [{id, x (0-1), y (feet, 0-1, default 0.93), scale (1 = body about 62% of the frame), look {shirt, top 'hoodie', hat 'capback'|'cap'|'top', hatColor, hair 'short'|'mess', hairColor, glasses, glowEyes, halo 'bulbs'}, mood, pose, flip, mouth}]
 *        crowd {n, seed, y}           camera {zoom, on (cast id, frames its head), focus [x,y], push, shake}
 *        light {cone {x, color, alpha, width}, vignette, tint, glow {x, y, color, r}}     phone {mood, look}    tv {content 'skull'|'map'}
 */
type Cast = {id: string; x: number; y?: number; scale?: number; look?: Record<string, any>; mood?: any; pose?: any; flip?: boolean; mouth?: string};
const at = (spec: any, lt: number, d: string) => { if (!Array.isArray(spec)) return spec || d; let v = spec[0][1]; for (const [t, n] of spec) if (lt >= t) v = n; return v; };
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const HAIR = ['#2a1d14', '#7a4a21', '#e0b44a', '#15151a', '#b5532a', '#c9c9d0'], SHIRT = ['#6b4fa3', '#2f7d5b', '#c9556b', '#3c5fa8', '#d9a13a', '#4aa3a0'], SKIN = null;

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="cs-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1220" /><stop offset="1" stopColor="#05070d" /></linearGradient>
    <linearGradient id="cs-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2230" /><stop offset="1" stopColor="#0a0e16" /></linearGradient>
    <radialGradient id="cs-vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.9" /></radialGradient>
    <filter id="cs-blur"><feGaussianBlur stdDeviation="14" /></filter><filter id="cs-blur2"><feGaussianBlur stdDeviation="40" /></filter>
  </defs>
);
const Scr: React.FC<{x: number; y: number; w: number; h: number; kind?: string}> = ({x, y, w, h, kind = 'road'}) => (
  <g>
    <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={18} fill="#262a31" stroke="#0a0a0d" strokeWidth={6} />
    <clipPath id={`cl-${x}-${y}`}><rect x={x} y={y} width={w} height={h} rx={8} /></clipPath>
    <g clipPath={`url(#cl-${x}-${y})`}>{kind === 'road' ? <><rect x={x} y={y} width={w} height={h * 0.5} fill="#9ed3f2" /><rect x={x} y={y + h * 0.5} width={w} height={h * 0.5} fill="#b9b98a" /><polygon points={`${x + w * 0.4},${y + h * 0.5} ${x + w * 0.6},${y + h * 0.5} ${x + w * 0.9},${y + h} ${x + w * 0.1},${y + h}`} fill="#5a5d66" /><line x1={x + w / 2} y1={y + h * 0.5} x2={x + w / 2} y2={y + h} stroke="#fff" strokeWidth={4} strokeDasharray="14 12" /></> : <rect x={x} y={y} width={w} height={h} fill="#10151c" />}</g>
    <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke="#ffffff22" strokeWidth={2} />
  </g>
);
const BG: Record<string, () => JSX.Element> = {
  void: () => <rect width={W} height={H} fill="url(#cs-room)" />,
  stage: () => (<><rect width={W} height={H} fill="url(#cs-room)" /><rect y={H * 0.78} width={W} height={H * 0.22} fill="url(#cs-floor)" /><rect y={H * 0.78 - 4} width={W} height={6} fill="#ffffff10" /></>),
  bedroom: () => (<><rect width={W} height={H} fill="#0c1424" /><rect y={H * 0.74} width={W} height={H * 0.26} fill="#101827" /><rect x={W * 0.12} y={H * 0.12} width={W * 0.34} height={H * 0.24} rx={10} fill="#16305a" stroke="#0a0a0d" strokeWidth={8} /><circle cx={W * 0.36} cy={H * 0.19} r={52} fill="#e8f0ff" opacity={0.9} /><line x1={W * 0.29} y1={H * 0.12} x2={W * 0.29} y2={H * 0.36} stroke="#0a0a0d" strokeWidth={8} /><rect x={W * 0.52} y={H * 0.56} width={W * 0.46} height={H * 0.2} rx={16} fill="#2c3d78" stroke="#0a0a0d" strokeWidth={8} /><rect x={W * 0.52} y={H * 0.5} width={W * 0.1} height={H * 0.08} rx={10} fill="#e8e0d0" stroke="#0a0a0d" strokeWidth={6} /></>),
  car: () => (<><rect width={W} height={H} fill="#0a121c" /><rect x={W * 0.05} y={H * 0.04} width={W * 0.9} height={H * 0.4} rx={30} fill="#16273d" /><circle cx={W * 0.5} cy={H * 0.05} r={90} fill="#e6f0ff" opacity={0.55} filter="url(#cs-blur)" /><path d={`M 0 ${H * 0.66} Q ${W * 0.5} ${H * 0.58} ${W} ${H * 0.66} L ${W} ${H} L 0 ${H} Z`} fill="#0d0f14" stroke="#06070a" strokeWidth={8} /><rect x={W * 0.1} y={H * 0.74} width={W * 0.2} height={H * 0.07} rx={12} fill="#1d2029" /><rect x={W * 0.7} y={H * 0.74} width={W * 0.2} height={H * 0.07} rx={12} fill="#1d2029" /><rect x={W * 0.38} y={H * 0.86} width={W * 0.24} height={H * 0.05} rx={8} fill="#0b3a44" stroke="#06070a" strokeWidth={5} /></>),
  control: () => (<><rect width={W} height={H} fill="#080d14" />{[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <Scr key={`${r}${c}`} x={W * 0.08 + c * W * 0.31} y={H * 0.06 + r * H * 0.15} w={W * 0.26} h={H * 0.12} />))}<rect y={H * 0.56} width={W} height={H * 0.1} fill="#1a2029" stroke="#06070a" strokeWidth={6} /><rect y={H * 0.66} width={W} height={H * 0.34} fill="#0b1018" /><rect x={W * 0.12} y={H * 0.575} width={W * 0.76} height={H * 0.04} rx={8} fill="#2b3340" /></>),
  newsroom: () => (<><rect width={W} height={H} fill="#240808" /><rect x={W * 0.04} y={H * 0.1} width={W * 0.92} height={H * 0.5} rx={44} fill="#2a1010" stroke="#0a0505" strokeWidth={10} /><rect x={W * 0.08} y={H * 0.13} width={W * 0.84} height={H * 0.44} rx={30} fill="#b8403a" /><g fill="#e9d9cf" opacity={0.92}><path d={`M ${W * 0.12} ${H * 0.2} q 90 -30 180 10 t 40 90 q -90 30 -130 -10 z`} /><path d={`M ${W * 0.3} ${H * 0.42} q 40 -10 70 20 t -10 100 q -50 -20 -60 -120 z`} /><path d={`M ${W * 0.56} ${H * 0.2} q 120 -30 240 20 t 40 80 q -120 40 -240 -10 z`} /></g><circle cx={W * 0.2} cy={H * 0.26} r={26} fill="#ff2a2a" filter="url(#cs-blur)" /><circle cx={W * 0.36} cy={H * 0.5} r={22} fill="#ff2a2a" filter="url(#cs-blur)" /><rect y={H * 0.7} width={W} height={H * 0.3} fill="#4a1a12" stroke="#0a0505" strokeWidth={8} /><line x1={W * 0.3} y1={H * 0.1} x2={W * 0.2} y2={H * 0.03} stroke="#0a0505" strokeWidth={10} /><line x1={W * 0.7} y1={H * 0.1} x2={W * 0.8} y2={H * 0.03} stroke="#0a0505" strokeWidth={10} /></>),
  street: () => (<><rect width={W} height={H} fill="#0a1020" />{[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={i * W * 0.22 - 10} y={H * (0.28 + rnd(i) * 0.2)} width={W * 0.2} height={H * 0.6} fill={['#141c2e', '#101726', '#1a2236'][i % 3]} />{[0, 1, 2, 3].flatMap((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={i * W * 0.22 + 20 + c * 80} y={H * (0.34 + rnd(i) * 0.2) + r * 120} width={46} height={64} fill={rnd(i * 9 + r * 3 + c) > 0.55 ? '#ffd778' : '#1b2438'} />))}</g>)}<rect y={H * 0.8} width={W} height={H * 0.2} fill="#10141c" /><rect x={W * 0.72} y={H * 0.36} width={10} height={H * 0.44} fill="#07080c" /><circle cx={W * 0.72} cy={H * 0.36} r={120} fill="#ffe7a8" opacity={0.5} filter="url(#cs-blur2)" /></>),
};

const Char: React.FC<{c: Cast; lt: number; talk: boolean; t: number; zoomUnit: number}> = ({c, lt, talk, t}) => {
  const scale = c.scale ?? 1, unit = (H * 0.62 * scale) / 1084, fy = (c.y ?? 0.93) * H, mood = at(c.mood, lt, 'neutral'), pose = at(c.pose, lt, 'idle');
  const mouth = c.mouth || (talk && Math.sin(t * 21 + c.x * 9) > -0.15 ? 'open' : 'closed'), look = c.look || {}, flip = c.flip ? -1 : 1;
  const sway = Math.sin(t * 1.9 + c.x * 5) * 0.012, breath = 1 + 0.01 * Math.sin(t * 2.2 + c.x * 3);
  const g = stickG({pose, mood, mouth, look: {cheeks: false, ...look}}), hx = 256, hy = 236;
  const halo = look.halo === 'bulbs' ? Array.from({length: 6}, (_, i) => { const a = t * 0.9 + (i * Math.PI * 2) / 6, bx = hx + Math.cos(a) * 250, by = hy - 60 + Math.sin(a) * 90; return <g key={i}><circle cx={bx} cy={by} r={44} fill="#ffe08a" opacity={0.55} filter="url(#cs-blur)" /><circle cx={bx} cy={by} r={18} fill="#fff6c9" stroke="#141414" strokeWidth={5} /></g>; }) : null;
  const eyes = look.glowEyes ? [-52, 52].map((dx) => <circle key={dx} cx={hx + dx} cy={hy + 4} r={26} fill={look.glowEyes} opacity={0.95} style={{mixBlendMode: 'screen'}} filter="url(#cs-blur)" />) : null;
  return <g transform={`translate(${c.x * W} ${fy}) rotate(${sway * 57}) scale(${unit * flip} ${unit * breath}) translate(-256 -1050)`}>{halo ? <g>{halo}</g> : null}<g dangerouslySetInnerHTML={{__html: g}} />{eyes}</g>;
};

export const CineStick: React.FC<ShotProps> = ({shot, bg = 'stage', cast = [], crowd, camera = {}, light = {}, speaker, phone, tv}) => {
  const {lt, d} = useShotTime(shot), t = shot.start + lt, say = speaker || shot.speaker, tn = say ? talkAt(t, say) : 0, Bg = BG[bg] || BG.void;
  const z0 = camera.zoom ?? 1, zoom = z0 + (camera.push ?? 0.03) * lt, on = camera.on ? (cast as Cast[]).find((c) => c.id === camera.on) : null;
  const headOf = (c: Cast) => { const unit = (H * 0.62 * (c.scale ?? 1)) / 1084; return [c.x * W + (c.flip ? -1 : 1) * 0 * unit, (c.y ?? 0.93) * H - (1050 - 236) * unit]; };
  const f = on ? headOf(on) : [(camera.focus?.[0] ?? 0.5) * W, (camera.focus?.[1] ?? 0.5) * H], shk = camera.shake ?? 0, sx = Math.sin(t * 31) * shk, sy = Math.cos(t * 27) * shk, tgt = camera.at ?? [0.5, on ? 0.42 : 0.5];
  const cone = light.cone, glow = light.glow, enter = p(lt, 0, 0.3, E.outCubic);
  const crowdN = crowd?.n ?? 0, cy0 = (crowd?.y ?? 0.8) * H;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <g transform={`translate(${tgt[0] * W + sx} ${tgt[1] * H + sy}) scale(${zoom}) translate(${-f[0]} ${-f[1]})`}>
          <Bg />
          {crowdN ? Array.from({length: crowdN}, (_, i) => { const r = rnd(i + (crowd.seed ?? 1) * 31), row = i % 3, x = (rnd(i * 7 + 3) * 1.2 - 0.1) * W; return <g key={i} opacity={0.85 - row * 0.1}><g transform={`translate(${x} ${cy0 + row * 40 - r * 20}) scale(${0.1 + row * 0.02}) translate(-256 -1050)`} dangerouslySetInnerHTML={{__html: stickG({pose: 'idle', mood: ['neutral', 'worried', 'sad', 'scared'][i % 4], look: {hat: 'none', hair: ['short', 'mess', 'none'][i % 3], hairColor: HAIR[i % HAIR.length], shirt: SHIRT[(i * 5) % SHIRT.length], cheeks: false}})}} /></g>; }) : null}
          {tv ? <g transform={`translate(${(tv.x ?? 0.78) * W} ${(tv.y ?? 0.2) * H})`}><rect x={-120} y={-100} width={240} height={190} rx={26} fill="#2a2f38" stroke="#0a0a0d" strokeWidth={8} /><rect x={-96} y={-78} width={192} height={140} rx={18} fill="#0f1318" /><circle cx={0} cy={-8} r={52} fill="#e9e6df" stroke="#0a0a0d" strokeWidth={5} /><circle cx={-20} cy={-14} r={14} fill="#0a0a0d" /><circle cx={20} cy={-14} r={14} fill="#0a0a0d" /><rect x={-22} y={20} width={44} height={22} fill="#e9e6df" stroke="#0a0a0d" strokeWidth={4} /><line x1={-40} y1={-100} x2={-70} y2={-146} stroke="#0a0a0d" strokeWidth={8} /><line x1={40} y1={-100} x2={70} y2={-146} stroke="#0a0a0d" strokeWidth={8} /><circle cx={0} cy={-10} r={170} fill="#9fd6ff" opacity={0.12} filter="url(#cs-blur2)" /></g> : null}
          {cone ? <g style={{mixBlendMode: 'screen'}} opacity={(cone.alpha ?? 0.5) * enter}><defs><linearGradient id="cs-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={cone.color || '#fff3c0'} stopOpacity="0.95" /><stop offset="1" stopColor={cone.color || '#fff3c0'} stopOpacity="0.08" /></linearGradient></defs><polygon points={`${(cone.x ?? 0.5) * W - 70},0 ${(cone.x ?? 0.5) * W + 70},0 ${(cone.x ?? 0.5) * W + (cone.width ?? 0.34) * W},${H * 0.86} ${(cone.x ?? 0.5) * W - (cone.width ?? 0.34) * W},${H * 0.86}`} fill="url(#cs-cone)" filter="url(#cs-blur)" /><ellipse cx={(cone.x ?? 0.5) * W} cy={H * 0.86} rx={(cone.width ?? 0.34) * W} ry={70} fill={cone.color || '#fff3c0'} opacity={0.55} filter="url(#cs-blur)" /></g> : null}
          {(cast as Cast[]).map((c) => <Char key={c.id} c={c} lt={lt} t={t} talk={!!say && c.id.toLowerCase() === String(say).toLowerCase() && tn > 0.25} zoomUnit={zoom} />)}
          {phone ? <g transform={`translate(${W * 0.5} ${H * 0.4})`}><rect x={-230} y={-330} width={460} height={760} rx={50} fill="#14161b" stroke="#050607" strokeWidth={10} /><clipPath id="cs-ph"><rect x={-206} y={-300} width={412} height={640} rx={24} /></clipPath><g clipPath="url(#cs-ph)"><rect x={-206} y={-300} width={412} height={640} fill="#d8c9a6" /><g transform="translate(0 330) scale(0.62) translate(-256 -1050)" dangerouslySetInnerHTML={{__html: stickG({pose: 'idle', mood: phone.mood || 'happy', mouth: phone.mouth || 'closed', look: {cheeks: false, ...(phone.look || {})}})}} /></g><circle cx={0} cy={388} r={26} fill="#d33" /></g> : null}
          {glow ? <circle cx={glow.x * W} cy={glow.y * H} r={glow.r ?? 420} fill={glow.color || '#ff3030'} opacity={(glow.alpha ?? 0.4) * enter} filter="url(#cs-blur2)" style={{mixBlendMode: 'screen'}} /> : null}
        </g>
        {light.tint ? <rect width={W} height={H} fill={light.tint} opacity={light.tintAlpha ?? 0.18} style={{mixBlendMode: 'multiply'}} /> : null}
        <rect width={W} height={H} fill="url(#cs-vig)" opacity={light.vignette ?? 0.85} />
      </svg>
    </AbsoluteFill>
  );
};
