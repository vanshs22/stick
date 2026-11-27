import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {H, LANDSCAPE, PRESENTER, W} from './tokens';
import {talkAt} from './time';
import {clamp} from './anim';

/** Illustrated host, v2 (the persistent bottom-of-frame presenter). Look comes from style.json "presenter":
 *  {skin, hair, beard, hat ('#hex' beanie | 'none'), curly, longHair, glasses, jacket, shirt, x (px of neck), y, scale}. Per shot: presenter {pose, mood, look}; pose may be a name or [[t, name], ...].
 *  Two arms with fingered hands, a drawn face (lids, gaze, tapered brows, nose, mouth shapes), breathing, blinks, mouth follows the real word times. Pure function of time. */
type P2 = [number, number];
type Kind = 'rest' | 'open' | 'point' | 'fist' | 'thumb';
type Arm = {h: P2; kind: Kind; bend?: number};
const GEST: Record<string, [Arm, Arm]> = {   // [left arm (toward the cards), right arm]
  idle: [{h: [-215, 430], kind: 'rest'}, {h: [215, 430], kind: 'rest'}],
  wave: [{h: [-340, -150], kind: 'open'}, {h: [215, 430], kind: 'rest'}],
  point: [{h: [-400, -20], kind: 'point', bend: 0.5}, {h: [215, 430], kind: 'rest'}],
  open: [{h: [-335, 70], kind: 'open'}, {h: [335, 70], kind: 'open'}],
  shrug: [{h: [-310, 150], kind: 'open', bend: 1.4}, {h: [310, 150], kind: 'open', bend: 1.4}],
  think: [{h: [-215, 430], kind: 'rest'}, {h: [70, -105], kind: 'fist'}],
  thumbs: [{h: [-215, 430], kind: 'rest'}, {h: [300, -10], kind: 'thumb'}],
  cheer: [{h: [-320, -200], kind: 'fist'}, {h: [320, -200], kind: 'fist'}],
};
const MAP: Record<string, string> = {idle: 'idle', relax: 'idle', slump: 'idle', point: 'point', reach: 'point', open: 'open', brace: 'open', panic: 'open', halt: 'open', cheer: 'cheer', wave: 'wave', think: 'think', phone: 'think', cower: 'think', shrug: 'shrug', thumbs: 'thumbs'};
// face: brow = inner-end tilt (+ angry, - sad), by = brow lift, eye = lid opening, smile = mouth curve, open = base mouth opening, blush
const FACE: Record<string, {brow: number; by: number; eye: number; smile: number; open: number; blush?: number}> = {
  calm: {brow: 0, by: 0, eye: 1, smile: 0.35, open: 0}, happy: {brow: -2, by: 8, eye: 0.8, smile: 1, open: 0.35, blush: 0.5}, surprised: {brow: 0, by: 24, eye: 1.35, smile: 0, open: 0.8},
  worried: {brow: -14, by: 8, eye: 1.05, smile: -0.4, open: 0.05}, scared: {brow: -12, by: 22, eye: 1.3, smile: -0.2, open: 0.5}, angry: {brow: 16, by: -4, eye: 0.85, smile: -0.6, open: 0.05},
  sad: {brow: -16, by: 0, eye: 0.8, smile: -0.8, open: 0}, smirk: {brow: 6, by: 2, eye: 0.7, smile: 0.7, open: 0}, relieved: {brow: -4, by: 2, eye: 0.6, smile: 0.8, open: 0.1, blush: 0.3},
  determined: {brow: 10, by: -2, eye: 0.95, smile: 0.1, open: 0}, curious: {brow: -4, by: 14, eye: 1.1, smile: 0.2, open: 0.05},
};
const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
const ease = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const arms = (spec: string | [number, string][], lt: number): [Arm, Arm] => {
  const steps: [number, string][] = typeof spec === 'string' ? [[0, spec]] : spec;
  let i = 0; while (i + 1 < steps.length && lt >= steps[i + 1][0]) i++;
  const cur = GEST[MAP[steps[i][1]] || 'idle'], prev = i > 0 ? GEST[MAP[steps[i - 1][1]] || 'idle'] : GEST.idle, k = ease((lt - steps[i][0]) / 0.3);   // 0.3 s glide, also from rest at the start of the shot
  return [0, 1].map((s) => ({h: [prev[s].h[0] + (cur[s].h[0] - prev[s].h[0]) * k, prev[s].h[1] + (cur[s].h[1] - prev[s].h[1]) * k] as P2, kind: k > 0.5 ? cur[s].kind : prev[s].kind, bend: cur[s].bend})) as [Arm, Arm];
};

const Hand: React.FC<{p: P2; ang: number; kind: Kind; skin: string; sk2: string; flip: number; t: number}> = ({p, ang, kind, skin, sk2, flip, t}) => {
  const fing = (a: number, len: number, w = 15) => <g transform={`rotate(${a})`}><rect x={-w / 2} y={-len - 20} width={w} height={len + 22} rx={w / 2} fill={skin} /><path d={`M${-w / 2 + 2} ${-len * 0.4} h${w - 4}`} stroke={sk2} strokeWidth={2} /></g>;
  return <g transform={`translate(${p[0]} ${p[1]}) rotate(${ang + 90}) scale(${flip} 1)`}>
    {kind === 'open' ? <>{fing(-24, 40)}{fing(-8, 52)}{fing(8, 54)}{fing(24, 44)}<g transform="rotate(-62) translate(-14 -6)"><rect x={-8} y={-44} width={16} height={46} rx={8} fill={skin} /></g></> : null}
    {kind === 'point' ? <>{fing(-6, 66, 17)}<circle cx={14} cy={-20} r={10} fill={sk2} /><circle cx={2} cy={-12} r={10} fill={sk2} /><g transform="rotate(-50) translate(-12 -10)"><rect x={-8} y={-30} width={16} height={34} rx={8} fill={skin} /></g></> : null}
    {kind === 'thumb' ? <><g transform="rotate(-8)"><rect x={-9} y={-82} width={18} height={70} rx={9} fill={skin} /></g>{[-22, -7, 8, 23].map((x) => <rect key={x} x={x - 8} y={-24} width={16} height={26} rx={8} fill={sk2} />)}</> : null}
    {kind === 'fist' ? <>{[-24, -8, 8, 24].map((x) => <rect key={x} x={x - 9} y={-28} width={18} height={30} rx={9} fill={skin} stroke={sk2} strokeWidth={2} />)}</> : null}
    <ellipse cx={0} cy={4} rx={kind === 'rest' ? 34 : 38} ry={kind === 'rest' ? 32 : 40} fill={skin} />
    {kind === 'rest' ? <path d={`M-18 -8 q4 ${8 + Math.sin(t * 1.2) * 1} 10 0 M-2 -10 q4 8 10 0 M12 -8 q4 8 10 0`} stroke={sk2} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
  </g>;
};

export const Presenter: React.FC<{pose?: string | [number, string][]; mood?: string; look?: Record<string, any>}> = ({pose = 'idle', mood = 'calm', look}) => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, P = {...(PRESENTER || {}), ...(look || {})}, ta = talkAt(t);
  const fc = FACE[mood] || FACE.calm, [aL, aR] = arms(pose, t);
  const skin = P.skin || '#E8B48C', sk2 = shade(skin, -0.16), sk3 = shade(skin, -0.3), hair = P.hair || '#2a2019', jacket = P.jacket || '#5c5348', jSh = shade(jacket, -0.22), jHi = shade(jacket, 0.1), shirt = P.shirt || '#f1eee8', ink = '#1b1612';
  const breath = Math.sin(t * 1.9) * 4, sway = Math.sin(t * 0.8) * 8, tilt = Math.sin(t * 0.9) * 1.2 + (ta > 0.1 ? Math.sin(t * 8.5) * 0.9 : 0), nod = ta > 0.1 ? Math.sin(t * 6.3) * 4 : 0;
  const blink = (t + 0.7) % 3.6 < 0.11 ? 0.08 : 1, eo = clamp(fc.eye * blink, 0.06, 1.5), open = clamp(fc.open + ta * 0.9), glance = Math.sin(t * 0.6) * 5 + (fc.eye > 1.2 ? 0 : Math.sin(t * 1.9) * 2);
  const brow = fc.by + (ta > 0.25 ? -5 * Math.sin(t * 6) * ta : 0), hx = 122, hy = 148;
  const wave = (a: Arm, s: number): P2 => (a.kind === 'open' && a.h[1] < -100 && s === 0 ? [a.h[0] + Math.sin(t * 7) * 30, a.h[1]] : a.kind === 'point' ? [a.h[0], a.h[1] + Math.sin(t * 3) * 6] : [a.h[0], a.h[1] + Math.sin(t * 1.3 + s) * 5]);
  const shoulders: [P2, P2] = [[-190, 80 + breath * 0.4], [190, 80 + breath * 0.4]], hands: [P2, P2] = [wave(aL, 0), wave(aR, 1)], A = [aL, aR];
  const size = 1100 * (P.scale || 1) * (LANDSCAPE ? 0.85 : 1), px = LANDSCAPE ? W * 0.2 : P.x ?? 640, py = LANDSCAPE ? H * 0.8 : P.y ?? 1700;
  const w = 44 + fc.smile * 10, my = P.beard === false ? 92 : 104, mo = open * 54;
  const armPath = (s: P2, h: P2, side: number, bendK = 1) => { const mx = (s[0] + h[0]) / 2, my2 = (s[1] + h[1]) / 2, c: P2 = [mx + side * 30 * bendK, my2 + 55 * bendK]; return {d: `M${s[0]} ${s[1]} Q${c[0]} ${c[1]} ${h[0]} ${h[1]}`, c}; };
  const arm = (i: number) => { const side = i === 0 ? -1 : 1, ap = armPath(shoulders[i], hands[i], side, A[i].bend ?? 1), ang = (Math.atan2(hands[i][1] - ap.c[1], hands[i][0] - ap.c[0]) * 180) / Math.PI; return <g key={i}>
    <path d={ap.d} fill="none" stroke={jSh} strokeWidth={84} strokeLinecap="round" /><path d={ap.d} fill="none" stroke={jacket} strokeWidth={72} strokeLinecap="round" /><path d={ap.d} fill="none" stroke={jHi} strokeWidth={14} strokeLinecap="round" opacity={0.5} transform="translate(-14 -6)" />
    <Hand p={hands[i]} ang={ang} kind={A[i].kind} skin={skin} sk2={sk2} flip={i === 0 ? -1 : 1} t={t} /></g>; };
  return (
    <svg width={size} height={size} viewBox="-550 -480 1100 1100" style={{position: 'absolute', left: px - size / 2, top: py - 480 * (size / 1100) + breath + nod * 0.4, overflow: 'visible'}}>
      <g transform={`rotate(${sway * 0.08} 0 600)`}>
        <path d="M-262 640 L-268 130 Q-252 24 -120 4 L120 4 Q252 24 268 130 L262 640Z" fill={jacket} /><path d="M-262 640 L-268 130 Q-252 24 -120 4 L-60 4 Q-150 40 -170 130 L-160 640Z" fill={jSh} opacity={0.45} />
        <path d="M-100 2 L0 170 L100 2Z" fill={shirt} /><path d="M-100 2 L-40 2 L-92 86Z" fill={jSh} /><path d="M100 2 L40 2 L92 86Z" fill={jSh} /><path d="M-100 2 L-12 190 L-70 150Z" fill={jacket} stroke={jSh} strokeWidth={3} /><path d="M100 2 L12 190 L70 150Z" fill={jacket} stroke={jSh} strokeWidth={3} />
        {arm(1)}
        <path d="M-50 -60 L-46 12 Q0 52 46 12 L50 -60Z" fill={sk2} /><path d="M-46 12 Q0 52 46 12 L46 -6 Q0 30 -46 -6Z" fill={sk3} opacity={0.5} />
        <g transform={`translate(${sway * 0.6} -204) rotate(${tilt})`}>
          {P.longHair ? <path d={`M${-hx - 30} 0 C${-hx - 58} -250 ${hx + 58} -250 ${hx + 30} 0 L${hx + 52} 250 Q0 292 ${-hx - 52} 250Z`} fill={hair} /> : null}
          <ellipse cx={-hx + 4} cy={14} rx={24} ry={38} fill={skin} /><ellipse cx={hx - 4} cy={14} rx={24} ry={38} fill={skin} /><ellipse cx={-hx + 8} cy={16} rx={11} ry={20} fill={sk2} /><ellipse cx={hx - 8} cy={16} rx={11} ry={20} fill={sk2} />
          <ellipse cx={0} cy={0} rx={hx} ry={hy} fill={skin} /><path d={`M${-hx + 6} 40 Q${-hx + 40} ${hy - 6} 0 ${hy} Q${hx - 40} ${hy - 6} ${hx - 6} 40 Q${hx - 20} ${hy - 26} 0 ${hy - 20} Q${-hx + 20} ${hy - 26} ${-hx + 6} 40Z`} fill={sk2} opacity={0.55} />
          {fc.blush ? <><ellipse cx={-78} cy={52} rx={30} ry={17} fill="#E8746A" opacity={fc.blush * 0.5} /><ellipse cx={78} cy={52} rx={30} ry={17} fill="#E8746A" opacity={fc.blush * 0.5} /></> : null}
          {P.beard !== false ? <path d={`M${-hx + 4} 0 C${-hx - 6} 120 -70 186 0 190 C70 186 ${hx + 6} 120 ${hx - 4} 0 C${hx - 30} 44 70 58 0 56 C-70 58 ${-hx + 30} 44 ${-hx + 4} 0Z`} fill={hair} /> : null}
          {P.hat && P.hat !== 'none' ? <><path d={`M${-hx - 6} -60 C${-hx - 8} -214 ${hx + 8} -214 ${hx + 6} -60 L${hx + 8} -34 L${-hx - 8} -34Z`} fill={P.hat} /><rect x={-hx - 10} y={-62} width={hx * 2 + 20} height={38} rx={12} fill={shade(P.hat, -0.22)} /></>
            : P.curly ? <g fill={hair}>{Array.from({length: 13}).map((_, i) => { const a = Math.PI + (i / 12) * Math.PI; return <circle key={i} cx={Math.cos(a) * 126} cy={Math.sin(a) * 150 - 20} r={42} />; })}<ellipse cx={0} cy={-122} rx={118} ry={58} /></g>
            : <><path d={`M${-hx - 6} -10 C${-hx - 14} -200 ${hx + 14} -200 ${hx + 6} -10 C${hx - 10} -82 ${-hx + 10} -82 ${-hx - 6} -10Z`} fill={hair} /><path d={`M${-hx + 20} -76 Q-20 -130 ${hx - 10} -60 Q40 -100 ${-hx + 20} -76Z`} fill={shade(hair, 0.15)} opacity={0.5} /></>}
          {[-1, 1].map((s) => { const cx = s * 54, cy = -6, ry = 22 * Math.min(1.35, eo); return <g key={s}>
            <path d={`M${cx - 32} ${cy} Q${cx} ${cy - ry * 1.5} ${cx + 32} ${cy} Q${cx} ${cy + ry * 1.1} ${cx - 32} ${cy}Z`} fill="#fff" /><circle cx={cx + glance} cy={cy + 1} r={14 * Math.min(1.05, 0.65 + eo * 0.4)} fill={shade(hair, 0.1)} /><circle cx={cx + glance} cy={cy + 1} r={7} fill={ink} /><circle cx={cx + glance + 5} cy={cy - 5} r={3.5} fill="#fff" />
            <path d={`M${cx - 34} ${cy + 1} Q${cx} ${cy - ry * 1.5 - 2} ${cx + 34} ${cy + 1}`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
            <path d={`M${cx - s * 34} ${-4 - 42 - brow + s * 0 - fc.brow * 0.3} Q${cx} ${-4 - 58 - brow} ${cx + s * 34} ${-4 - 42 - brow + fc.brow * s * 0}`.replace(/NaN/g, '0')} fill="none" stroke={shade(hair, -0.1)} strokeWidth={15} strokeLinecap="round" transform={`rotate(${s * fc.brow * 0.55} ${cx} ${-46 - brow})`} />
            {P.glasses !== false ? <circle cx={cx} cy={cy} r={44} fill="rgba(255,255,255,0.08)" stroke="#1b1b1f" strokeWidth={7} /> : null}</g>; })}
          {P.glasses !== false ? <path d="M-12 -8 Q0 -18 12 -8" fill="none" stroke="#1b1b1f" strokeWidth={7} /> : null}
          <path d="M-9 -4 Q-20 34 -8 42 Q0 46 8 42 Q20 34 9 -4" fill={sk2} /><ellipse cx={-10} cy={42} rx={6} ry={4} fill={sk3} /><ellipse cx={10} cy={42} rx={6} ry={4} fill={sk3} />
          {P.beard !== false ? <path d="M-74 66 Q0 38 74 66 Q0 88 -74 66Z" fill={hair} /> : null}
          <path d={`M${-w} ${my - fc.smile * 6} Q0 ${my + fc.smile * 24 + 4 + mo * 0.25} ${w} ${my - fc.smile * 6} Q0 ${my + fc.smile * 24 + mo + 6} ${-w} ${my - fc.smile * 6}Z`} fill={open > 0.12 ? '#4a1818' : ink} />
          {open > 0.28 ? <><path d={`M${-w * 0.8} ${my - fc.smile * 4} Q0 ${my + 4} ${w * 0.8} ${my - fc.smile * 4} L${w * 0.7} ${my + 8} Q0 ${my + 14} ${-w * 0.7} ${my + 8}Z`} fill="#fff" /><ellipse cx={0} cy={my + mo * 0.75} rx={w * 0.5} ry={Math.max(4, mo * 0.2)} fill="#d9606a" /></> : null}
        </g>
        {arm(0)}
      </g>
    </svg>
  );
};
