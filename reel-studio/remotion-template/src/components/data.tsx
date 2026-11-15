import React from 'react';
import {C, F} from '../engine/tokens';
import {E, clamp, mix, p} from '../engine/anim';
import {useEnter} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {SHADOW, Zone} from './ui';

const Card: React.FC<{children: React.ReactNode; a: number; out: number; w?: number; h?: number}> = ({children, a, out, w = 940, h = 780}) => (
  <div style={{width: w, height: h, background: C.card, borderRadius: 40, boxShadow: SHADOW, padding: 56, opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 60}px)`, position: 'relative'}}>{children}</div>
);

/** Bars that grow. props: bars [{label, value}], unit, highlight (index), title, anchor. */
export const BarChart: React.FC<ShotProps> = ({shot, bars = [], unit = '', highlight = -1, title = '', anchor}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.1);
  const B = bars as {label: string; value: number}[], max = Math.max(1, ...B.map((b) => b.value));
  return (
    <Zone><Card a={a} out={out}>
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em'}}>{title}</div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 28, height: 560, marginTop: 30}}>
        {B.map((b, i) => {
          const k = p(lt, start + 0.3 + i * 0.12, 0.7, E.outExpo);
          return <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%'}}>
            <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 38, color: i === highlight ? C.accent : C.ink, opacity: k}}>{Math.round(b.value * k).toLocaleString('en-US')}{unit}</div>
            <div style={{width: '100%', height: `${(b.value / max) * 78 * k}%`, background: i === highlight ? C.accent : C.accentSoft, borderRadius: 16, marginTop: 10}} />
            <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: C.muted, marginTop: 14}}>{b.label}</div>
          </div>;
        })}
      </div>
    </Card></Zone>
  );
};

/** A line that draws itself. props: points (numbers), label, unit, anchor. */
export const LineChart: React.FC<ShotProps> = ({shot, points = [], label = '', unit = '', anchor}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.1);
  const P = (points as number[]), max = Math.max(1, ...P), W = 820, H = 520, xy = P.map((v, i) => [(i / Math.max(1, P.length - 1)) * W, H - (v / max) * H * 0.9] as [number, number]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '), len = xy.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - xy[i - 1][0], q[1] - xy[i - 1][1]) : 0), 0), k = p(lt, start + 0.3, 1.3, E.inOutSoft);
  return (
    <Zone><Card a={a} out={out}>
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em'}}>{label}</div>
      <svg width={W} height={H + 20} style={{marginTop: 40, overflow: 'visible'}}>
        <path d={d} fill="none" stroke={C.accent} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
        {xy.length ? <circle cx={mix(xy[0][0], xy[xy.length - 1][0], k)} cy={mix(xy[0][1], xy[xy.length - 1][1], k)} r={16} fill={C.accent} opacity={k > 0.02 ? 1 : 0} /> : null}
      </svg>
      <div style={{position: 'absolute', right: 56, top: 40, fontFamily: F.sans, fontWeight: 900, fontSize: 72, color: C.accent}}>{Math.round(P[P.length - 1] * k).toLocaleString('en-US')}{unit}</div>
    </Card></Zone>
  );
};

/** Horizontal timeline. props: events [{date, label}], anchorPrefix ("e" -> e0, e1...). */
export const Timeline: React.FC<ShotProps> = ({shot, events = [], anchorPrefix = 'e'}) => {
  const {a, out, lt} = useEnter(shot, undefined, 0.05);
  const Ev = events as {date: string; label: string}[];
  return (
    <Zone><div style={{width: 940, opacity: clamp(a * 1.6) * (1 - out), position: 'relative', height: 600}}>
      <div style={{position: 'absolute', left: 40, top: 300, height: 8, borderRadius: 4, background: C.accent, width: `${p(lt, 0.2, Math.max(1, Ev.length * 0.6), E.inOutSoft) * 860}px`}} />
      {Ev.map((e, i) => {
        const s = anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.4 + i * 0.6, k = p(lt, s, 0.4, E.outBack), x = 40 + (i / Math.max(1, Ev.length - 1)) * 860, up = i % 2 === 0;
        return <div key={i} style={{position: 'absolute', left: x - 120, width: 240, top: up ? 90 : 340, textAlign: 'center', opacity: k, transform: `scale(${mix(0.6, 1, k)})`}}>
          <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: C.accent}}>{e.date}</div><div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: C.ink, marginTop: 8, lineHeight: 1.15}}>{e.label}</div>
        </div>;
      })}
      {Ev.map((_, i) => <div key={'d' + i} style={{position: 'absolute', left: 40 + (i / Math.max(1, Ev.length - 1)) * 860 - 18, top: 286, width: 36, height: 36, borderRadius: 18, background: C.card, border: `8px solid ${C.accent}`}} />)}
    </div></Zone>
  );
};

/** Items that tick off one by one, optionally under a heading with a progress bar ("CLAUDE IS BUILDING"). props: items[], heading, progress (true = bar fills as items tick), anchorPrefix ("c" -> c0, c1...). */
export const Checklist: React.FC<ShotProps> = ({shot, items = [], heading = '', progress = false, anchorPrefix = 'c'}) => {
  const {a, out, lt} = useEnter(shot, undefined, 0.05), I = items as string[];
  const done = I.filter((_, i) => p(lt, anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.4 + i * 0.7, 0.35, E.outBack) > 0.5).length;
  return (
    <Zone><Card a={a} out={out} h={Math.max(420, 190 + I.length * 130 + (heading ? 80 : 0) + (progress ? 60 : 0))}>
      {heading ? <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6}}>{heading}</div> : null}
      {I.map((it, i) => {
        const s = anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.4 + i * 0.7, k = p(lt, s, 0.35, E.outBack);
        return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, height: 130, fontFamily: F.sans, fontWeight: 700, fontSize: 52, color: C.ink}}>
          <div style={{width: 64, height: 64, borderRadius: 32, border: `6px solid ${k > 0.5 ? C.good : C.muted}`, background: k > 0.5 ? C.good : 'transparent', color: '#fff', fontSize: 40, textAlign: 'center', lineHeight: '52px', transform: `scale(${mix(1, 1.15, Math.sin(k * Math.PI))})`}}>{k > 0.5 ? '✓' : ''}</div>{it}
        </div>;
      })}
      {progress ? <div style={{height: 14, borderRadius: 7, background: '#e8e6e0', marginTop: 8}}><div style={{height: '100%', width: `${(done / Math.max(1, I.length)) * 100}%`, borderRadius: 7, background: C.accent}} /></div> : null}
    </Card></Zone>
  );
};

/** Two things face to face. props: left, right, badge ("VS"), leftSub, rightSub, anchor. */
export const Versus: React.FC<ShotProps> = ({shot, left = '', right = '', badge = 'VS', leftSub = '', rightSub = '', anchor}) => {
  const {out, lt, start} = useEnter(shot, anchor, 0.1);
  const l = p(lt, start, 0.5, E.outExpo), r = p(lt, start + 0.15, 0.5, E.outExpo), b = p(lt, start + 0.45, 0.4, E.outBack);
  const box = (txt: string, sub: string, k: number, dir: number, hot: boolean) => <div style={{width: 800, padding: '40px 50px', background: hot ? C.accent : C.card, color: hot ? '#fff' : C.ink, borderRadius: 40, boxShadow: SHADOW, textAlign: 'center', opacity: clamp(k * 1.6) * (1 - out), transform: `translateX(${(1 - k) * dir * 500}px)`}}><div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 84}}>{txt}</div>{sub ? <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 32, opacity: 0.8, marginTop: 8}}>{sub}</div> : null}</div>;
  return <Zone><div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>{box(left, leftSub, l, -1, false)}<div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 120, color: C.accent, transform: `scale(${mix(0.3, 1, b)})`, opacity: b * (1 - out)}}>{badge}</div>{box(right, rightSub, r, 1, true)}</div></Zone>;
};

/** Parchment map with a route that draws itself. props: points [{x,y,label}] (x and y 0..1), title. */
export const RouteMap: React.FC<ShotProps> = ({shot, points = [], title = ''}) => {
  const {a, out, lt} = useEnter(shot, undefined, 0.05);
  const Pt = (points as {x: number; y: number; label?: string}[]).map((q) => ({...q, X: q.x * 860 + 40, Y: q.y * 760 + 80}));
  const d = Pt.map((q, i) => `${i ? 'L' : 'M'}${q.X} ${q.Y}`).join(' '), len = Pt.reduce((s, q, i) => (i ? s + Math.hypot(q.X - Pt[i - 1].X, q.Y - Pt[i - 1].Y) : 0), 0), k = p(lt, 0.4, Math.max(1.2, Pt.length * 0.7), E.inOutSoft);
  return (
    <Zone><div style={{width: 940, height: 960, borderRadius: 24, background: 'radial-gradient(ellipse at 40% 30%, #F3E6C8, #D9C79B)', boxShadow: SHADOW, position: 'relative', opacity: clamp(a * 1.6) * (1 - out), overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 50, top: 36, fontFamily: F.serif, fontStyle: 'italic', fontSize: 70, color: '#5b4524'}}>{title}</div>
      <svg width={940} height={960} style={{position: 'absolute', inset: 0}}>
        <path d={d} fill="none" stroke="#B3261E" strokeWidth={9} strokeDasharray={`4 18`} strokeLinecap="round" opacity={0.25} />
        <path d={d} fill="none" stroke="#B3261E" strokeWidth={10} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
        {Pt.map((q, i) => { const s = (i / Math.max(1, Pt.length - 1)) * 0.9; const v = clamp((k - s) * 8); return <g key={i} opacity={v}><circle cx={q.X} cy={q.Y} r={16} fill="#B3261E" /><text x={q.X + 26} y={q.Y + 12} fontFamily={F.sans} fontWeight={800} fontSize={38} fill="#3b2a12">{q.label}</text></g>; })}
      </svg>
    </div></Zone>
  );
};
