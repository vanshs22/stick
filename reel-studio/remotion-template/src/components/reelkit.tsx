import React from 'react';
import {C, F, LANDSCAPE} from '../engine/tokens';
import {E, SPR, clamp, mix, p, sp} from '../engine/anim';
import {useEnter, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {SHADOW, Zone} from './ui';

/** Cards taken from how the reference reels turn a LIST WORD into a picture (docs/OVERLAY-BRAIN.md): an options wheel whose sectors light as each option is spoken, and labelled devices that pop in one by one. */

/** An options wheel (a weapon wheel, a mode picker, a menu): 3 to 8 sectors, each lights on its spoken word and stays lit dimmer. props: items[] (required), center (text in the hub), title, anchorPrefix ('item' -> item0, item1 ...), color. */
export const RadialMenu: React.FC<ShotProps> = ({shot, items = [], center = '', title = '', anchorPrefix = 'item', color}) => {
  const {a, out, lt} = useEnter(shot, undefined, 0.05, SPR.soft), col = color || C.accent, N = Math.max(3, Math.min(8, items.length)), R = 330, r0 = 118, cx = 380, cy = 380;
  const at = (i: number) => (anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.4 + i * 0.6);
  const arc = (i: number) => { const g = 0.035, a0 = (i / N) * Math.PI * 2 - Math.PI / 2 + g, a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2 - g, pt = (r: number, an: number) => `${cx + r * Math.cos(an)},${cy + r * Math.sin(an)}`; return `M${pt(r0, a0)} L${pt(R, a0)} A${R},${R} 0 0 1 ${pt(R, a1)} L${pt(r0, a1)} A${r0},${r0} 0 0 0 ${pt(r0, a0)} Z`; };
  const act = items.map((_: string, i: number) => sp(lt, at(i), 30, SPR.pop)), last = Math.max(-1, ...items.map((_: string, i: number) => (lt >= at(i) ? i : -1)));
  return (
    <Zone w={760} h={LANDSCAPE ? 800 : 860}><div style={{opacity: clamp(a * 1.6) * (1 - out), transform: `scale(${mix(0.85, 1, clamp(a))})`, position: 'relative', width: 760, height: 760}}>
      <svg width={760} height={760} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <circle cx={cx} cy={cy} r={R + 26} fill="none" stroke={col} strokeOpacity={0.35} strokeWidth={3} strokeDasharray="6 12" />
        {items.slice(0, N).map((it: string, i: number) => { const k = clamp(act[i]), now = i === last; const am = ((i + 0.5) / N) * Math.PI * 2 - Math.PI / 2, lx = cx + (R * 0.62 + r0 * 0.38) * Math.cos(am), ly = cy + (R * 0.62 + r0 * 0.38) * Math.sin(am);
          return <g key={i}><path d={arc(i)} fill={k > 0 ? col : 'rgba(255,255,255,0.08)'} fillOpacity={k > 0 ? (now ? 0.88 : 0.38) : 1} stroke={k > 0 ? col : 'rgba(255,255,255,0.28)'} strokeWidth={now ? 5 : 3} style={{filter: now ? `drop-shadow(0 0 18px ${col})` : undefined}} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{fontFamily: F.sans, fontWeight: 900, fontSize: 36, letterSpacing: '0.04em', textTransform: 'uppercase'}} fill={now ? '#0b0c10' : k > 0 ? '#fff' : 'rgba(255,255,255,0.7)'} transform={`scale(${now ? 1.1 : 1})`} transform-origin={`${lx} ${ly}`}>{it}</text></g>; })}
        <circle cx={cx} cy={cy} r={r0 - 14} fill="rgba(10,12,18,0.9)" stroke={col} strokeWidth={4} style={{filter: `drop-shadow(0 0 16px ${col}88)`}} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#fff" style={{fontFamily: F.mono, fontWeight: 800, fontSize: 28, letterSpacing: '0.12em', textTransform: 'uppercase'}}>{center || items[Math.max(0, last)]}</text>
      </svg>
      {title ? <div style={{position: 'absolute', left: 0, right: 0, top: -6, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: '0.18em', color: C.muted, textTransform: 'uppercase'}}>{title}</div> : null}
    </div></Zone>
  );
};

/** Labelled devices side by side (the platforms a thing is posted to, the places it runs): each pops in on its spoken word. props: items [{label, sub, color}] or strings (required, 2 to 4), anchorPrefix ('d' -> d0, d1 ...), screens [public image per device] (optional). */
export const Devices: React.FC<ShotProps> = ({shot, items = [], anchorPrefix = 'd', screens = []}) => {
  const {a, out, lt} = useEnter(shot, undefined, 0.05), I = (items as any[]).slice(0, 4).map((x) => (typeof x === 'string' ? {label: x} : x)), n = I.length, W = n > 3 ? 220 : 270, Hh = W * 1.9;
  const at = (i: number) => (anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.35 + i * 0.5), tilt = (i: number) => (n === 1 ? 0 : (i / (n - 1) - 0.5) * 12);
  return (
    <Zone w={n * (W + 40) + 20} h={Hh + 120}><div style={{opacity: clamp(a * 1.6) * (1 - out), display: 'flex', gap: 40, alignItems: 'flex-end', justifyContent: 'center'}}>
      {I.map((d, i) => { const k = p(lt, at(i), 0.4, E.outBack), g = 0.32 * clamp(a * 1.6), col = d.color || C.accent;   // every phone is on screen from the start, dim and without its label; it lights on its word
        return <div key={i} style={{width: W, textAlign: 'center', opacity: g + (1 - g) * clamp(k * 2), filter: k <= 0 ? 'grayscale(1)' : undefined, transform: `translateY(${(1 - clamp(k)) * 40}px) rotate(${tilt(i)}deg) scale(${mix(0.9, 1, clamp(k))})`}}>
          <div style={{width: W, height: Hh, borderRadius: 36, background: '#0d0f14', border: '6px solid #1d2028', boxShadow: SHADOW, position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', top: 10, left: '50%', width: 70, height: 14, borderRadius: 8, background: '#05060a', transform: 'translateX(-50%)'}} />
            {screens[i] ? <img src={screens[i]} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${col}55, #0d0f14 70%)`}}><div style={{position: 'absolute', left: '18%', right: '18%', top: '38%', height: '20%', borderRadius: 14, background: col, opacity: 0.85}} /><div style={{position: 'absolute', left: '18%', right: '40%', top: '64%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.5)'}} /><div style={{position: 'absolute', left: '18%', right: '28%', top: '70%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.3)'}} /></div>}
          </div>
          <div style={{marginTop: 16, display: 'inline-block', opacity: clamp(k * 2), padding: '6px 20px', borderRadius: 30, background: col, color: '#0b0c10', fontFamily: F.sans, fontWeight: 900, fontSize: 32}}>{d.label}</div>
          {d.sub ? <div style={{marginTop: 6, fontFamily: F.mono, fontSize: 24, color: C.muted}}>{d.sub}</div> : null}
        </div>; })}
    </div></Zone>
  );
};
