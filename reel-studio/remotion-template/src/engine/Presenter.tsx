import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {H, LANDSCAPE, PRESENTER, W} from './tokens';
import {MOODS, POSES} from '../components/three/rig';
import {talkAt} from './time';
import {clamp, mix} from './anim';

/** Illustrated host (the persistent bottom-of-frame presenter of the editorial look). Look comes from style.json "presenter":
 *  {skin, hair, beard, hat ('#hex' beanie | 'none'), curly, glasses, jacket, shirt, x (px of neck), y, scale}. Mouth follows the real word times. */
type G = {el: [number, number]; h: [number, number]; kind: 'rest' | 'wave' | 'point' | 'open' | 'think'};
const GEST: Record<string, G> = {
  idle: {el: [-262, 240], h: [-232, 452], kind: 'rest'}, wave: {el: [-300, 40], h: [-330, -120], kind: 'wave'}, point: {el: [-300, 120], h: [-300, 20], kind: 'point'},
  open: {el: [-300, 110], h: [-340, 30], kind: 'open'}, think: {el: [-215, 80], h: [-95, -150], kind: 'think'}, shrug: {el: [-290, 130], h: [-340, 60], kind: 'open'},
};
const MAP: Record<string, string> = {idle: 'idle', relax: 'idle', slump: 'idle', point: 'point', reach: 'point', open: 'open', brace: 'open', panic: 'open', halt: 'open', cheer: 'wave', wave: 'wave', think: 'think', phone: 'think', cower: 'think', shrug: 'shrug'};
const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };

export const Presenter: React.FC<{pose?: string; mood?: string; look?: Record<string, any>}> = ({pose = 'idle', mood = 'calm', look}) => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, P = {...(PRESENTER || {}), ...(look || {})};   // look: per-shot appearance, so two characters can share one host rig
  const g = GEST[MAP[pose] || 'idle'], m = MOODS[mood] || MOODS.calm, ta = talkAt(t);
  const skin = P.skin || '#E8B48C', sk2 = shade(skin, -0.14), hair = P.hair || '#2a2019', jacket = P.jacket || '#5c5348', jSh = shade(jacket, -0.18), shirt = P.shirt || '#f1eee8', ink = '#1b1612';
  const bob = Math.sin(t * 1.7) * 5, tilt = Math.sin(t * 0.9) * 0.7 + (ta ? Math.sin(t * 9) * 0.35 : 0);
  const blink = t % 3.4 < 0.1 ? 0.1 : 1, eo = clamp(m.eye * blink, 0.08, 1.4), open = clamp(m.mouth + ta * 0.85), my = P.beard === false ? 86 : 104, w = 40 + m.smile * 10, sm = m.smile;
  const sw = g.kind === 'wave' ? Math.sin(t * 7) * 28 : Math.sin(t * 1.3) * 6, hd: [number, number] = g.kind === 'wave' ? [g.h[0] + sw, g.h[1]] : [g.h[0], g.h[1] + (g.kind === 'point' ? Math.sin(t * 3) * 6 : sw)];
  const hx = 128, hy = 158, size = 1100 * (P.scale || 1) * (LANDSCAPE ? 0.85 : 1), px = LANDSCAPE ? W * 0.2 : P.x ?? 640, py = LANDSCAPE ? H * 0.8 : P.y ?? 1700;   // landscape: the host stands on the left, the cards take the right 60 percent
  return (
    <svg width={size} height={size} viewBox="-550 -480 1100 1100" style={{position: 'absolute', left: px - size / 2, top: py - 480 * (size / 1100) + bob, overflow: 'visible'}}>
      <path d="M-250 640 L-262 120 Q-250 20 -120 0 L120 0 Q250 20 262 120 L250 640Z" fill={jacket} />
      <path d="M-96 0 L0 150 L96 0Z" fill={shirt} /><path d="M-96 0 L-30 0 L-86 70Z" fill={jSh} /><path d="M96 0 L30 0 L86 70Z" fill={jSh} />
      <polyline points="200,70 262,240 236,430" fill="none" stroke={jacket} strokeWidth={74} strokeLinecap="round" strokeLinejoin="round" /><ellipse cx={232} cy={452} rx={38} ry={34} fill={skin} />
      <rect x={-52} y={-70} width={104} height={90} rx={30} fill={sk2} />
      <g transform={`translate(0 -250) rotate(${tilt})`}>
        {P.longHair ? <path d={`M${-hx - 30} 0 C${-hx - 58} -250 ${hx + 58} -250 ${hx + 30} 0 L${hx + 52} 250 Q0 292 ${-hx - 52} 250Z`} fill={hair} /> : null}
        <ellipse cx={-hx + 6} cy={10} rx={26} ry={40} fill={sk2} /><ellipse cx={hx - 6} cy={10} rx={26} ry={40} fill={sk2} /><ellipse cx={0} cy={0} rx={hx} ry={hy} fill={skin} />
        {P.beard !== false ? <path d={`M${-hx + 4} -6 C${-hx - 6} 120 -70 190 0 192 C70 190 ${hx + 6} 120 ${hx - 4} -6 C${hx - 30} 40 70 54 0 52 C-70 54 ${-hx + 30} 40 ${-hx + 4} -6Z`} fill={hair} /> : null}
        {P.hat && P.hat !== 'none' ? <><path d={`M${-hx - 6} -60 C${-hx - 8} -210 ${hx + 8} -210 ${hx + 6} -60 L${hx + 8} -34 L${-hx - 8} -34Z`} fill={P.hat} /><rect x={-hx - 10} y={-62} width={hx * 2 + 20} height={38} rx={12} fill={shade(P.hat, -0.22)} /><rect x={-28} y={-54} width={56} height={18} rx={5} fill="#d4382a" /></>
          : P.curly ? <g fill={hair}>{Array.from({length: 13}).map((_, i) => { const a = Math.PI + (i / 12) * Math.PI; return <circle key={i} cx={Math.cos(a) * 128} cy={Math.sin(a) * 150 - 20} r={42} />; })}<ellipse cx={0} cy={-120} rx={120} ry={60} /></g>
          : <path d={`M${-hx - 4} -20 C${-hx - 10} -190 ${hx + 10} -190 ${hx + 4} -20 C${hx - 10} -92 ${-hx + 10} -92 ${-hx - 4} -20Z`} fill={hair} />}
        {[-1, 1].map((s) => <g key={s}>
          <ellipse cx={s * 52} cy={-4} rx={17} ry={17 * Math.min(1, eo)} fill="#fff" /><circle cx={s * 52 + Math.sin(t * 0.7) * 2.5} cy={-3} r={8.5 * Math.min(1.1, 0.7 + eo * 0.35)} fill={ink} />
          <rect x={s * 52 - 22} y={-4 - 34 - m.brow * 0.8 - 6} width={44} height={12} rx={6} fill={shade(hair, -0.1)} transform={`rotate(${s * m.tilt * 0.5} ${s * 52} ${-4 - 34 - m.brow * 0.8})`} />
          {P.glasses !== false ? <circle cx={s * 52} cy={-4} r={40} fill="none" stroke="#1b1b1f" strokeWidth={7} /> : null}</g>)}
        {P.glasses !== false ? <path d="M-14 -6 Q0 -16 14 -6" fill="none" stroke="#1b1b1f" strokeWidth={7} /> : null}
        <ellipse cx={0} cy={36} rx={14} ry={10} fill={shade(skin, -0.2)} />
        {P.beard !== false ? <path d="M-70 62 Q0 36 70 62 Q0 82 -70 62Z" fill={hair} /> : null}
        <path d={`M${-w} ${my - sm * 6} Q0 ${my + sm * 22 + open * 6} ${w} ${my - sm * 6} Q0 ${my + sm * 22 + open * 52 + 4} ${-w} ${my - sm * 6}Z`} fill={open > 0.12 ? '#4a1818' : ink} />
        {open > 0.3 ? <><ellipse cx={0} cy={my + open * 20 + 6} rx={w * 0.45} ry={9 * open} fill="#c55" /><rect x={-w * 0.55} y={my - sm * 4} width={w * 1.1} height={7} fill="#fff" /></> : null}
      </g>
      <polyline points={`-200,70 ${g.el[0]},${g.el[1]} ${hd[0]},${hd[1]}`} fill="none" stroke={jacket} strokeWidth={74} strokeLinecap="round" strokeLinejoin="round" />
      {g.kind === 'point' ? <g transform={`translate(${hd[0]} ${hd[1]}) rotate(-9)`}><rect x={-90} y={-20} width={110} height={40} rx={20} fill={skin} /><ellipse cx={0} cy={6} rx={44} ry={38} fill={skin} /></g>
        : g.kind === 'open' || g.kind === 'wave' ? <g fill={skin}><ellipse cx={hd[0]} cy={hd[1] - 10} rx={46} ry={52} />{[-2, -1, 0, 1, 2].map((k) => <ellipse key={k} cx={hd[0] + k * 17} cy={hd[1] - 56 + Math.abs(k) * 3} rx={10} ry={28} />)}</g>
        : <ellipse cx={hd[0]} cy={hd[1]} rx={40} ry={38} fill={skin} />}
    </svg>
  );
};
