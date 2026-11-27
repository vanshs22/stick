import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../engine/tokens';
import {E, clamp, p} from '../engine/anim';
import {atLocal, talkAt, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {INK, LW, Stick, type Mood, type Pose} from './stick/rig';
import {SETS, SET_FLOOR, type SetName} from './stick/sets';

type Cast = {id: string; x: number; mood?: Mood | [number, Mood][]; pose?: Pose | [number, Pose][]; shirt?: string; skin?: string; hair?: 'none' | 'curly' | 'cap'; hairColor?: string; seated?: boolean; flip?: boolean; scale?: number; look?: [number, number]; prop?: 'wallet'; propOpen?: boolean};
const moodAt = (spec: any, lt: number): Mood => { if (!Array.isArray(spec)) return (spec as Mood) || 'neutral'; let m = spec[0][1]; for (const [t, v] of spec) if (lt >= t) m = v; return m; };

/** A 2D stickman scene: a painted set, 1-3 characters with face sprites, a camera that cuts between wide and punch-in, optional speech bubble and title bar.
 *  props: set, cast[{id, x(0-1), mood, pose, shirt, hair, seated, flip, scale}], camera{zoom, on (character id to frame), focus[x,y], at[x,y], push(per s)}, bubble{who, text, anchor}, titleBar, speaker (character id whose mouth moves) */
export const StickScene: React.FC<ShotProps> = ({shot, set = 'kitchen', cast = [], camera = {}, bubble, titleBar, speaker}) => {
  const {lt} = useShotTime(shot);
  const Set_ = SETS[set as SetName] || SETS.kitchen, floor = H * (SET_FLOOR[set as SetName] ?? 0.8), base = (H * 0.5) / 620, SEAT = H * 0.7;   // the seated waist sits just under the table top
  const z = (camera.zoom ?? 1) + (camera.push ?? 0.03) * lt;
  const say = speaker || shot.speaker, talkNow = say ? talkAt(shot.start + lt, say) : 0;
  const who = (c: Cast) => c.id.toLowerCase() === String(say || '').toLowerCase();
  const sorted = [...(cast as Cast[])];
  const y0 = (c: Cast) => (c.seated ? SEAT - 440 * base * (c.scale ?? 1) : floor - 600 * base * (c.scale ?? 1));   // local y 0 on screen
  const head = (c: Cast) => ({x: c.x * W, y: y0(c) + 135 * base * (c.scale ?? 1)});
  const on = camera.on ? (cast as Cast[]).find((c) => c.id === camera.on) : null, f = camera.focus ?? [0.5, 0.58];
  const fx = on ? head(on).x : f[0] * W, fy = on ? head(on).y + (camera.lift ?? 0) * H : f[1] * H, tgt = camera.at ?? [0.5, on ? 0.36 : 0.42];   // the focus point lands on screen at `at`, so a punch-in always puts the face above the caption band
  const bub = bubble && cast.find((c: Cast) => c.id === bubble.who), bt = bubble ? (bubble.anchor ? atLocal(shot, bubble.anchor) : 0.1) : 0, ba = bubble ? p(lt, bt, 0.22, E.outBack) : 0;
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${tgt[0] * W} ${tgt[1] * H}) scale(${z}) translate(${-fx} ${-fy})`}>
          <Set_ W={W} H={H} />
          {sorted.map((c) => { const s = base * (c.scale ?? 1), seated = !!c.seated; return (
            <g key={c.id} transform={`translate(${c.x * W} ${y0(c)}) scale(${c.flip ? -s : s} ${s}) translate(-200 0)`}>
              <Stick lt={lt} mood={moodAt(c.mood, lt)} pose={c.pose} shirt={c.shirt} skin={c.skin} hair={c.hair} hairColor={c.hairColor} seated={seated} look={c.look} talk={who(c) ? talkNow : 0} tilt={who(c) ? Math.sin(lt * 2.2) * 2 : 0} />
              {c.prop === 'wallet' ? <g><rect x={166} y={360} width={74} height={52} rx={6} fill={c.propOpen ? '#8a5a30' : '#6b3f1d'} stroke={INK} strokeWidth={LW} strokeLinejoin="round" />{c.propOpen ? <path d="M172 368 H234 M172 404 H234" stroke={INK} strokeWidth={3} /> : <path d="M166 378 Q203 398 240 378" fill="none" stroke={INK} strokeWidth={3} />}</g> : null}
            </g>); })}
          {set === 'kitchen' ? <g><rect x={W * 0.1} y={H * 0.675} width={W * 0.8} height={H * 0.035} fill="#C98B4A" stroke={INK} strokeWidth={LW} strokeLinejoin="round" /><path d={`M${W * 0.16} ${H * 0.71} V${H * 0.86} M${W * 0.84} ${H * 0.71} V${H * 0.86}`} stroke={INK} strokeWidth={14} strokeLinecap="round" /></g> : null}

        </g>
        {bubble && bub ? (() => { const hp = head(bub), sx = tgt[0] * W + z * (hp.x - fx), sy = tgt[1] * H + z * (hp.y - fy), w = Math.min(W * 0.62, 70 + String(bubble.text).length * 22), h = 150, x = Math.max(w / 2 + 30, Math.min(W - w / 2 - 30, sx + (bubble.dx ?? 0))), y = Math.max(h / 2 + 90, Math.min(H * 0.34, sy - 70 * z - 160)), tipY = Math.max(y + h / 2 + 20, sy - 74 * z); return (
          <g transform={`translate(${x} ${y}) scale(${ba})`} opacity={clamp(ba * 2)}><path d={`M${-24} ${h / 2 - 6} L${sx - x} ${tipY - y} L${24} ${h / 2 - 6}Z`} fill="#fff" stroke={INK} strokeWidth={LW} strokeLinejoin="round" /><ellipse cx={0} cy={0} rx={w / 2} ry={h / 2} fill="#fff" stroke={INK} strokeWidth={LW} /><rect x={-26} y={h / 2 - 12} width={52} height={14} fill="#fff" />
            <text textAnchor="middle" y={12} fontFamily="Inter, sans-serif" fontWeight={800} fontSize={48} fill={INK}>{bubble.text}</text></g>); })() : null}
      </svg>
      {titleBar ? <div style={{position: 'absolute', left: 30, right: 30, top: 38, background: '#FFE500', border: `${LW}px solid ${INK}`, padding: '10px 18px', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 46, color: INK, lineHeight: 1.1}}>{titleBar}</div> : null}
    </AbsoluteFill>
  );
};
