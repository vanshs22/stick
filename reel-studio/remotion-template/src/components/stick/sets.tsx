import React from 'react';
import {INK} from './rig';

/** Painted flat sets with the same outline weight as the characters (4 px). Each draws on a W x H canvas; `floor` is the y where feet land. One saturated key colour with warm neutrals per set. */
export type SetName = 'kitchen' | 'station' | 'street';
const S = 3;
const SOFT = '#5a4636';   // the reference sets use soft brown line, thinner than the characters
const O = {stroke: SOFT, strokeWidth: S, strokeLinejoin: 'round' as const};
export const SET_FLOOR: Record<SetName, number> = {kitchen: 0.78, station: 0.8, street: 0.82};

export const Kitchen: React.FC<{W: number; H: number}> = ({W, H}) => {
  const tile = 70, rows = Math.ceil(H * 0.62 / tile), cols = Math.ceil(W / tile);
  return <g>
    <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#7FD1C0" />
    {Array.from({length: rows}, (_, r) => <path key={'r' + r} d={`M0 ${r * tile} H${W}`} stroke="#5FB5A4" strokeWidth={2} />)}{Array.from({length: cols}, (_, c) => <path key={'c' + c} d={`M${c * tile} 0 V${H * 0.62}`} stroke="#5FB5A4" strokeWidth={2} />)}
    <rect x={0} y={H * 0.04} width={W} height={H * 0.17} fill="#F2E3C6" {...O} />
    {Array.from({length: 4}, (_, i) => <g key={i}><rect x={W * (0.02 + i * 0.245)} y={H * 0.05} width={W * 0.22} height={H * 0.15} fill="#F7EBD3" {...O} /><circle cx={W * (0.2 + i * 0.245)} cy={H * 0.15} r={7} fill="#B9A67F" {...O} /></g>)}
    <path d={`M${W * 0.3} ${H * 0.21} L${W * 0.36} ${H * 0.3} H${W * 0.64} L${W * 0.7} ${H * 0.21}Z`} fill="#B8BEC4" {...O} />
    <path d={`M${W * 0.5} 0 V${H * 0.07}`} stroke={SOFT} strokeWidth={S} /><path d={`M${W * 0.42} ${H * 0.13} Q${W * 0.5} ${H * 0.06} ${W * 0.58} ${H * 0.13}Z`} fill="#4FA58F" {...O} />
    <rect x={-W} y={H * 0.62} width={W * 3} height={H * 2} fill="#A8E0D2" {...O} />
    {Array.from({length: 8}, (_, i) => <path key={i} d={`M${W * (i / 8)} ${H * 0.62} L${W * (i / 8 - 0.12 + 0.24 * (i / 8))} ${H}`} stroke="#7FC4B3" strokeWidth={2} />)}
    <rect x={W * 0.04} y={H * 0.44} width={W * 0.2} height={H * 0.18} fill="#C9CED2" {...O} /><circle cx={W * 0.09} cy={H * 0.5} r={16} fill="#8B9096" {...O} /><circle cx={W * 0.19} cy={H * 0.5} r={16} fill="#8B9096" {...O} />
  </g>;
};
export const Station: React.FC<{W: number; H: number}> = ({W, H}) => <g>
  <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7EC8F0" /><stop offset="1" stopColor="#D8F0FA" /></linearGradient></defs>
  <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#sk)" />
  {[[0.1, 0.2], [0.55, 0.14], [0.82, 0.24]].map(([x, y], i) => <g key={i} fill="#fff" stroke="none"><ellipse cx={W * x} cy={H * y} rx={W * 0.1} ry={H * 0.025} /><ellipse cx={W * (x + 0.05)} cy={H * (y - 0.015)} rx={W * 0.06} ry={H * 0.02} /></g>)}
  <g><rect x={0} y={H * 0.3} width={W * 0.5} height={H * 0.28} fill="#D96B45" {...O} />{Array.from({length: 4}, (_, i) => <rect key={i} x={W * (0.04 + i * 0.115)} y={H * 0.35} width={W * 0.08} height={H * 0.1} fill="#F7E7B0" {...O} />)}<rect x={W * 0.05} y={H * 0.22} width={W * 0.42} height={H * 0.07} fill="#fff" {...O} /></g>
  <g><path d={`M${W * 0.62} ${H * 0.58} V${H * 0.3}`} stroke={SOFT} strokeWidth={S + 2} /><path d={`M${W * 0.88} ${H * 0.58} V${H * 0.3}`} stroke={SOFT} strokeWidth={S + 2} /><rect x={W * 0.56} y={H * 0.22} width={W * 0.4} height={H * 0.1} fill="#fff" {...O} /><path d={`M${W * 0.6} ${H * 0.27} H${W * 0.92}`} stroke="#2F6DB5" strokeWidth={10} /></g>
  <rect x={-W} y={H * 0.58} width={W * 3} height={H * 0.1} fill="#CFCBC4" {...O} /><rect x={0} y={H * 0.675} width={W} height={H * 0.018} fill="#F2C94C" {...O} />
  <rect x={-W} y={H * 0.693} width={W * 3} height={H * 2} fill="#8A6A52" {...O} />{Array.from({length: 14}, (_, i) => <path key={i} d={`M${W * (i / 14 + 0.02)} ${H * 0.8} h${W * 0.05}`} stroke="#5E4535" strokeWidth={10} />)}
  <path d={`M0 ${H * 0.74} H${W}`} stroke="#B8BEC4" strokeWidth={9} /><path d={`M0 ${H * 0.9} H${W}`} stroke="#B8BEC4" strokeWidth={9} />
</g>;
export const Street: React.FC<{W: number; H: number}> = ({W, H}) => <g>
  <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#B9A5E8" />
  {[[0.0, 0.28, 0.26, '#8E7CC3'], [0.24, 0.18, 0.22, '#A08ED6'], [0.46, 0.34, 0.3, '#7B69B3'], [0.74, 0.22, 0.26, '#9A87CF']].map(([x, y, w, c], i) => <g key={i}><rect x={W * +x} y={H * +y} width={W * +w} height={H * (0.7 - +y)} fill={c as string} {...O} />{Array.from({length: 6}, (_, k) => <rect key={k} x={W * (+x + 0.03 + (k % 2) * 0.1)} y={H * (+y + 0.04 + Math.floor(k / 2) * 0.08)} width={W * 0.06} height={H * 0.045} fill="#E9E1FA" {...O} />)}</g>)}
  <path d={`M${W * 0.7} ${H * 0.72} q${W * 0.1} -${H * 0.2} ${W * 0.3} -${H * 0.08} V${H * 0.72}Z`} fill="#67B857" {...O} />
  <rect x={-W} y={H * 0.7} width={W * 3} height={H * 0.06} fill="#D8D2E6" {...O} /><rect x={-W} y={H * 0.76} width={W * 3} height={H * 2} fill="#6F6A80" {...O} />{Array.from({length: 5}, (_, i) => <rect key={i} x={W * (0.04 + i * 0.2)} y={H * 0.87} width={W * 0.1} height={H * 0.012} fill="#F2E7B8" stroke="none" />)}
  <g><path d={`M${W * 0.5} ${H * 0.56} V${H * 0.72}`} stroke={SOFT} strokeWidth={S + 2} /><rect x={W * 0.34} y={H * 0.44} width={W * 0.32} height={H * 0.13} fill="#fff" {...O} /><text x={W * 0.5} y={H * 0.52} textAnchor="middle" fontFamily="sans-serif" fontWeight={800} fontSize={H * 0.028} fill={INK}>OPEN LATE</text></g>
</g>;
export const SETS: Record<SetName, React.FC<{W: number; H: number}>> = {kitchen: Kitchen, station: Station, street: Street};
