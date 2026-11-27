import React from 'react';

/** Sketchy stickman rig v2 (pure SVG, a pure function of time). Studied from the reference clips: a BIG white head with a soft shade crescent, heavy half-lidded eyes with
 *  a lid line that runs past the corner, tapered arched brows, mouths with cheek lines, shaded colour-block clothes with sleeves, thin black noodle limbs, white gloves with fingers.
 *  Local coordinates: 400 wide, 620 tall, feet at y 600, waist at y 440, head centre (200, 135). Faces swap on beats, they do not tween. */
export const INK = '#0A0A0A';
export const LW = 6;   // the one outline weight on characters and props

export type Mood = 'neutral' | 'smug' | 'happy' | 'worried' | 'angry' | 'shock' | 'sad' | 'deadpan' | 'shout';
type Face = {eyes: 'open' | 'half' | 'laugh' | 'wide' | 'tear'; brow: 'flat' | 'smug' | 'raised' | 'sad' | 'angry'; mouth: 'flat' | 'smirk' | 'laugh' | 'wobble' | 'teeth' | 'o' | 'frown' | 'shout'; look?: [number, number]};
export const FACES: Record<Mood, Face> = {
  neutral: {eyes: 'open', brow: 'flat', mouth: 'flat'}, smug: {eyes: 'half', brow: 'smug', mouth: 'smirk', look: [8, 0]}, happy: {eyes: 'laugh', brow: 'raised', mouth: 'laugh'},
  worried: {eyes: 'open', brow: 'sad', mouth: 'wobble', look: [-6, 5]}, angry: {eyes: 'open', brow: 'angry', mouth: 'teeth'}, shock: {eyes: 'wide', brow: 'raised', mouth: 'o'},
  sad: {eyes: 'tear', brow: 'sad', mouth: 'frown', look: [0, 6]}, deadpan: {eyes: 'half', brow: 'flat', mouth: 'flat', look: [10, 0]}, shout: {eyes: 'wide', brow: 'angry', mouth: 'shout'},
};

type P = [number, number];
export type Pose = 'idle' | 'wave' | 'point' | 'shrug' | 'hold' | 'head' | 'cross' | 'explain';
const SH: [P, P] = [[142, 285], [258, 285]];   // shoulders (left, right)
const POSES: Record<Pose, [P, P]> = {
  idle: [[118, 450], [282, 450]], wave: [[118, 450], [340, 140]], point: [[118, 450], [392, 300]], shrug: [[80, 340], [320, 340]],
  hold: [[168, 395], [236, 395]], head: [[96, 135], [304, 135]], cross: [[258, 380], [142, 380]], explain: [[118, 450], [350, 350]],
};
const ease = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
/** pose spec: 'idle' or [[t, 'wave'], [t2, 'point']]; hands glide between poses over 0.18 s */
export const handsAt = (spec: Pose | [number, Pose][] | undefined, lt: number): [P, P] => {
  const steps: [number, Pose][] = typeof spec === 'string' || !spec ? [[0, (spec as Pose) || 'idle']] : spec;
  let i = 0; while (i + 1 < steps.length && lt >= steps[i + 1][0]) i++;
  const cur = POSES[steps[i][1]] || POSES.idle, prev = POSES[steps[Math.max(0, i - 1)][1]] || cur, k = i > 0 ? ease((lt - steps[i][0]) / 0.18) : 1;
  const m = (a: P, b: P): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  return [m(prev[0], cur[0]), m(prev[1], cur[1])];
};

const darken = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k)); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); };
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** arm as a quadratic from shoulder s to hand h, bent by gravity; returns control point and the point 34 percent along (where the sleeve ends) */
const arm = (s: P, h: P, side: number) => { const c: P = [(s[0] + h[0]) / 2 + side * 26, (s[1] + h[1]) / 2 + 34], q = lerp(s, c, 0.26), e = lerp(q, lerp(c, h, 0.26), 0.26); return {c, q, e}; };

const Hand: React.FC<{p: P; kind: 'open' | 'point' | 'fist'; flip?: number}> = ({p, kind, flip = 1}) => {
  const f = (x1: number, y1: number, x2: number, y2: number, w = 12) => <g><path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={INK} strokeWidth={w + 5} strokeLinecap="round" /><path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#fff" strokeWidth={w} strokeLinecap="round" /></g>;
  return <g transform={`translate(${p[0]} ${p[1]}) scale(${flip} 1)`}>
    {kind === 'point' ? <>{f(8, -4, 46, -8, 12)}{f(4, 8, 22, 12, 10)}{f(0, 14, 14, 20, 10)}</> : kind === 'open' ? <>{f(-10, -14, -16, -36)}{f(0, -16, 0, -42)}{f(10, -14, 16, -38)}{f(16, -6, 36, -22, 11)}</> : null}
    <ellipse cx={0} cy={0} rx={kind === 'fist' ? 22 : 21} ry={kind === 'fist' ? 20 : 19} fill="#fff" stroke={INK} strokeWidth={LW - 1} />
    {kind === 'fist' ? <path d="M-12 -10 q6 -6 12 0 M-2 -12 q6 -6 12 0 M-8 6 q10 6 22 -2" fill="none" stroke={INK} strokeWidth={3} /> : null}
  </g>;
};

const Eye: React.FC<{cx: number; kind: Face['eyes']; look: P; skin: string; side: number}> = ({cx, kind, look, skin, side}) => {
  const cy = 132;
  if (kind === 'laugh') return <path d={`M${cx - 32} ${cy + 8} Q${cx} ${cy - 32} ${cx + 32} ${cy + 8}`} fill="none" stroke={INK} strokeWidth={LW + 2} strokeLinecap="round" />;
  const big = kind === 'wide', rx = big ? 30 : 28, ry = big ? 32 : 24, id = `ec${cx}`;
  return <g>
    <clipPath id={id}><path d={`M${cx - rx} ${cy} Q${cx} ${cy - ry * 1.5} ${cx + rx} ${cy} Q${cx} ${cy + ry * 1.3} ${cx - rx} ${cy}Z`} /></clipPath>
    <path d={`M${cx - rx} ${cy} Q${cx} ${cy - ry * 1.5} ${cx + rx} ${cy} Q${cx} ${cy + ry * 1.3} ${cx - rx} ${cy}Z`} fill="#fff" stroke={INK} strokeWidth={LW - 1} strokeLinejoin="round" />
    <g clipPath={`url(#${id})`}>
      <circle cx={cx + look[0]} cy={cy + look[1]} r={big ? 8 : 12} fill={INK} />
      {big ? null : <circle cx={cx + look[0] + 4} cy={cy + look[1] - 4} r={3.5} fill="#fff" />}
      {kind === 'half' ? <path d={`M${cx - rx - 4} ${cy - 22} H${cx + rx + 4} V${cy - 1} H${cx - rx - 4}Z`} fill={skin} /> : null}
    </g>
    {kind === 'half' ? <path d={`M${cx - rx - 8} ${cy - 1} H${cx + rx + 9}`} stroke={INK} strokeWidth={LW + 2} strokeLinecap="round" /> : <path d={`M${cx - rx - 2} ${cy - 1} Q${cx} ${cy - ry * 1.5 + 2} ${cx + rx + 3} ${cy - 2}`} fill="none" stroke={INK} strokeWidth={LW} strokeLinecap="round" />}
    {kind === 'half' || kind === 'tear' ? <path d={`M${cx - rx + 4} ${cy + 24} Q${cx} ${cy + 32} ${cx + rx - 4} ${cy + 24}`} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} strokeLinecap="round" /> : null}
    {kind === 'tear' ? <path d={`M${cx + 8 * side} ${cy + 28} Q${cx + 18 * side} ${cy + 56} ${cx + 6 * side} ${cy + 68} Q${cx - 8 * side} ${cy + 54} ${cx + 8 * side} ${cy + 28}Z`} fill="#6EC1F0" stroke={INK} strokeWidth={3} /> : null}
  </g>;
};
const Brow: React.FC<{cx: number; dir: number; kind: Face['brow']}> = ({cx, dir, kind}) => {
  const base = kind === 'raised' ? 84 : 92, inY = kind === 'angry' ? base + 20 : kind === 'sad' ? base - 14 : kind === 'smug' ? (dir > 0 ? base + 8 : base - 6) : base + 1, outY = kind === 'angry' ? base - 6 : kind === 'sad' ? base + 12 : kind === 'smug' ? (dir > 0 ? base - 2 : base + 4) : base + 3;
  const innerX = cx + 30 * dir, outerX = cx - 32 * dir, my = Math.min(inY, outY) - 12;   // dir 1 = the left eye: its inner end is toward the nose (right)
  return <path d={`M${outerX} ${outY} Q${cx} ${my} ${innerX} ${inY}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />;
};
const Mouth: React.FC<{kind: Face['mouth']; talk: number}> = ({kind, talk}) => {
  const y = 196, open = Math.max(0, Math.min(1, talk));
  if (open > 0.15 && !['laugh', 'shout', 'teeth'].includes(kind)) return <g><ellipse cx={204} cy={y + 6} rx={20 + open * 8} ry={7 + open * 19} fill="#6e1824" stroke={INK} strokeWidth={LW - 1} /><ellipse cx={204} cy={y + 12 + open * 12} rx={11} ry={5 + open * 4} fill="#e0707a" /></g>;
  switch (kind) {
    case 'smirk': return <g><path d={`M138 ${y - 4} Q196 ${y + 34} 268 ${y - 20}`} fill="none" stroke={INK} strokeWidth={LW} strokeLinecap="round" /><path d={`M268 ${y - 20} q8 -3 10 -12`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" /><path d={`M168 ${y + 22} Q206 ${y + 32} 242 ${y + 16}`} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={3} strokeLinecap="round" /></g>;
    case 'laugh': return <g><path d={`M140 ${y - 14} Q204 ${y + 82} 268 ${y - 14}Z`} fill="#6e1824" stroke={INK} strokeWidth={LW} strokeLinejoin="round" /><path d={`M146 ${y - 10} Q204 ${y + 4} 262 ${y - 10} L254 ${y + 8} Q204 ${y + 18} 154 ${y + 8}Z`} fill="#fff" /><ellipse cx={204} cy={y + 34} rx={30} ry={13} fill="#e0707a" /></g>;
    case 'wobble': return <path d={`M158 ${y + 10} q12 -14 24 0 t24 0 t24 0 t24 0`} fill="none" stroke={INK} strokeWidth={LW} strokeLinecap="round" />;
    case 'teeth': return <g><path d={`M146 ${y - 12} H262 Q270 ${y + 22} 204 ${y + 28} Q138 ${y + 22} 146 ${y - 12}Z`} fill="#fff" stroke={INK} strokeWidth={LW} strokeLinejoin="round" /><path d={`M150 ${y + 8} H258 M176 ${y - 10} V${y + 24} M204 ${y - 12} V${y + 28} M232 ${y - 10} V${y + 24}`} stroke={INK} strokeWidth={3} /></g>;
    case 'o': return <g><ellipse cx={204} cy={y + 12} rx={22} ry={29} fill="#6e1824" stroke={INK} strokeWidth={LW} /><ellipse cx={204} cy={y + 24} rx={12} ry={9} fill="#e0707a" /></g>;
    case 'frown': return <path d={`M152 ${y + 26} Q204 ${y - 22} 256 ${y + 26}`} fill="none" stroke={INK} strokeWidth={LW} strokeLinecap="round" />;
    case 'shout': return <g><path d={`M138 ${y - 22} Q204 ${y + 96} 270 ${y - 22}Z`} fill="#6e1824" stroke={INK} strokeWidth={LW} strokeLinejoin="round" /><ellipse cx={204} cy={y + 40} rx={34} ry={16} fill="#e0707a" /></g>;
    default: return <path d={`M166 ${y + 4} Q204 ${y + 10} 244 ${y + 2}`} fill="none" stroke={INK} strokeWidth={LW} strokeLinecap="round" />;
  }
};

export type StickProps = {mood?: Mood; pose?: Pose | [number, Pose][]; lt: number; talk?: number; shirt?: string; skin?: string; hair?: 'none' | 'curly' | 'cap' | 'short'; hairColor?: string; seated?: boolean; look?: P; tilt?: number};
/** a character, local 400 x 620, feet at y 600 */
export const Stick: React.FC<StickProps> = ({mood = 'neutral', pose = 'idle', lt, talk = 0, shirt = '#D8342B', skin = '#FFFFFF', hair = 'none', hairColor = '#141414', seated = false, look, tilt = 0}) => {
  const face = FACES[mood], [hl, hr] = handsAt(pose, lt), blink = (lt % 3.4) > 3.28 && ['open', 'half'].includes(face.eyes), lk = look || face.look || [0, 0];
  const sway = Math.sin(lt * 1.7) * 1.2, bob = Math.sin(lt * 3.1) * 2, shade = darken(shirt, 0.74), skinShade = skin === '#FFFFFF' ? '#E9D6CF' : darken(skin, 0.86);
  const aL = arm(SH[0], hl, -1), aR = arm(SH[1], hr, 1), pointing = (h: P) => h[0] > 330 && h[1] > 250 && h[1] < 330;
  return (
    <g transform={`rotate(${sway} 200 600) translate(0 ${bob})`}>
      {!seated ? <g stroke={INK} strokeWidth={15} strokeLinecap="round" fill="none"><path d="M180 440 L162 590" /><path d="M220 440 L238 590" /><ellipse cx={150} cy={598} rx={28} ry={12} fill={INK} stroke="none" /><ellipse cx={250} cy={598} rx={28} ry={12} fill={INK} stroke="none" /></g> : null}
      {[[SH[0], hl, aL], [SH[1], hr, aR]].map(([s, h, a]: any, i) => <path key={'n' + i} d={`M${s[0]} ${s[1]} Q${a.c[0]} ${a.c[1]} ${h[0]} ${h[1]}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />)}
      {[[SH[0], aL], [SH[1], aR]].map(([s, a]: any, i) => <g key={'s' + i}><path d={`M${s[0]} ${s[1]} Q${a.q[0]} ${a.q[1]} ${a.e[0]} ${a.e[1]}`} fill="none" stroke={INK} strokeWidth={42} strokeLinecap="round" /><path d={`M${s[0]} ${s[1]} Q${a.q[0]} ${a.q[1]} ${a.e[0]} ${a.e[1]}`} fill="none" stroke={shirt} strokeWidth={33} strokeLinecap="round" /><path d={`M${s[0] + (i ? -6 : 6)} ${s[1] + 6} Q${a.q[0]} ${a.q[1] + 6} ${a.e[0]} ${a.e[1] + 8}`} fill="none" stroke={shade} strokeWidth={7} strokeLinecap="round" opacity={0.6} /></g>)}
      <path d="M134 280 Q200 262 266 280 L280 446 Q200 462 120 446Z" fill={shirt} stroke={INK} strokeWidth={LW} strokeLinejoin="round" />
      <path d="M134 280 Q150 360 142 450 L120 446Z" fill={shade} opacity={0.55} /><path d="M176 272 Q200 308 224 272 Q200 262 176 272Z" fill={shade} stroke={INK} strokeWidth={4} strokeLinejoin="round" /><path d="M162 350 Q176 376 168 404 M240 340 Q232 372 244 398" fill="none" stroke={shade} strokeWidth={5} strokeLinecap="round" />
      <Hand p={hl} kind={hl[1] < 200 ? 'open' : 'fist'} flip={-1} /><Hand p={hr} kind={pointing(hr) ? 'point' : hr[1] < 200 ? 'open' : 'fist'} />
      <g transform={`rotate(${tilt} 200 250)`}>
        <rect x={184} y={236} width={32} height={42} fill={skin} stroke={INK} strokeWidth={LW - 1} />
        <circle cx={200} cy={135} r={112} fill={skin} stroke={INK} strokeWidth={LW + 1} />
        <path d="M104 190 A112 112 0 0 0 232 244 A104 104 0 0 1 104 190Z" fill={skinShade} />
        {hair === 'curly' ? <g fill={hairColor} stroke={INK} strokeWidth={LW - 2}>{Array.from({length: 15}, (_, i) => { const a = Math.PI * (0.88 + i * 0.087); return <circle key={i} cx={200 + 116 * Math.cos(a)} cy={118 + 112 * Math.sin(a)} r={28} />; })}<path d="M104 96 Q200 20 296 96 Q250 64 200 66 Q150 64 104 96Z" /></g> : null}
        {hair === 'short' ? <path d="M92 118 Q96 20 200 22 Q304 20 308 118 Q290 70 240 62 Q190 76 150 70 Q110 76 92 118Z" fill={hairColor} stroke={INK} strokeWidth={LW} strokeLinejoin="round" /> : null}
        {hair === 'cap' ? <g><path d="M96 76 Q200 -28 304 76Z" fill={hairColor} stroke={INK} strokeWidth={LW} strokeLinejoin="round" /><path d="M86 78 H328" stroke={INK} strokeWidth={LW + 3} strokeLinecap="round" /></g> : null}
        <Brow cx={154} dir={1} kind={face.brow} /><Brow cx={246} dir={-1} kind={face.brow} />
        {blink ? <path d="M124 134 H184 M216 134 H276" stroke={INK} strokeWidth={LW + 1} strokeLinecap="round" /> : <><Eye cx={154} kind={face.eyes} look={lk} skin={skin} side={-1} /><Eye cx={246} kind={face.eyes} look={lk} skin={skin} side={1} /></>}
        <Mouth kind={face.mouth} talk={talk} />
      </g>
    </g>
  );
};
