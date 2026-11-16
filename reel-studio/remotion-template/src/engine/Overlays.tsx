import React from 'react';
import {Box, Bracket, Circle, CrossedOff, Highlight as RoughHighlight, StrikeThrough, Underline} from '@remotion/rough-notation';
import {C, F} from './tokens';
import {E, SPR, clamp, mix, p, rnd, sp} from './anim';
import {atLocal, talkAt, useShotTime} from './time';
import type {Overlay, Shot} from './types';

/**
 * Graphics layered ON TOP of a shot's main component, each timed to a spoken word (anchor) or `at` seconds.
 * types: label, step-chip, step-label, sticker, tags, callout, cursor, scribble, hearts, calendar, waveform, warning, progress, backword
 * Positions are pixels on the 1080x1920 canvas (x = centre). Every overlay fades out with its shot.
 */
const shadow = '0 8px 24px rgba(20,20,19,0.18)';
const T: React.FC<{o: Overlay; shot: Shot; children: (k: {a: number; lt: number; s: number; fps: number}) => React.ReactNode}> = ({o, shot, children}) => {
  const {lt, d, fps} = useShotTime(shot);
  const s = o.anchor && o.anchor in shot.anchors ? atLocal(shot, o.anchor) : o.at ?? 0.2;
  const a = sp(lt, s, fps, SPR.pop), out = p(lt, d - 0.25, 0.22, E.inCubic);
  return <div style={{position: 'absolute', inset: 0, opacity: (1 - out) * (lt >= s ? 1 : 0), pointerEvents: 'none'}}>{children({a, lt, s, fps})}</div>;
};
const pos = (o: Overlay, dx: number, dy: number): React.CSSProperties => ({position: 'absolute', left: o.x ?? dx, top: o.y ?? dy, transform: 'translate(-50%, -50%)'});

const One: React.FC<{o: Overlay; shot: Shot}> = ({o, shot}) => {
  switch (o.type) {
    case 'label': return <T o={{...o, at: 0}} shot={shot}>{({lt}) => (
      <div style={{position: 'absolute', left: 64, right: 64, top: 118, display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontWeight: 500, fontSize: 24, color: C.muted, opacity: clamp(lt / 0.3)}}>
        <span>{o.left}</span><span style={{color: o.rightAccent === false ? C.muted : C.accent}}>{o.right}</span></div>)}</T>;
    case 'step-chip': return <T o={o} shot={shot}>{({a}) => (
      <div style={{...pos(o, 880, 600), width: 132, height: 132, borderRadius: 28, background: '#141413', boxShadow: shadow, transform: `translate(-50%,-50%) rotate(-4deg) scale(${mix(0.4, 1, a)})`, textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 84, color: '#fff', lineHeight: '104px'}}>{o.n}</div>
        <div style={{display: 'flex', gap: 7, justifyContent: 'center', marginTop: -6}}>{Array.from({length: o.of || 5}).map((_, i) => <div key={i} style={{width: 9, height: 9, borderRadius: 5, background: i < o.n ? C.accent : 'rgba(255,255,255,0.3)'}} />)}</div></div>)}</T>;
    case 'step-label': return <T o={{...o, at: o.at ?? 0.05}} shot={shot}>{({a}) => (
      <div style={{position: 'absolute', left: 0, right: 0, top: o.y ?? 70, textAlign: 'center', opacity: clamp(a * 2)}}>
        <span style={{display: 'inline-block', background: 'rgba(8,12,44,0.92)', color: '#fff', fontFamily: F.sans, fontWeight: 800, fontSize: 26, letterSpacing: '0.06em', padding: '10px 26px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.18)', textTransform: 'uppercase'}}>{o.text}</span>
        <div style={{display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10}}>{Array.from({length: o.of || 5}).map((_, i) => <div key={i} style={{width: 30, height: 5, borderRadius: 3, background: i < (o.n || 1) ? '#FFD84A' : 'rgba(255,255,255,0.3)'}} />)}</div></div>)}</T>;
    case 'sticker': return <T o={o} shot={shot}>{({a}) => (
      <div style={{...pos(o, 540, 700), transform: `translate(-50%,-50%) rotate(${o.rotate ?? -6}deg) scale(${mix(2.2, 1, clamp(a))})`, background: o.color || '#FFD84A', color: o.ink || '#141413', fontFamily: F.sans, fontWeight: 900, fontSize: o.size || 68, padding: '8px 30px', borderRadius: 10, border: '4px solid #141413', boxShadow: '6px 6px 0 rgba(20,20,19,0.9)', opacity: clamp(a * 2), whiteSpace: 'nowrap'}}>{o.text}</div>)}</T>;
    case 'tags': return <T o={o} shot={shot}>{({lt, s}) => (
      <div style={{...pos(o, 540, 1000), display: 'flex', gap: 14}}>{(o.items as {text: string; color?: string}[]).map((it, i) => { const k = p(lt, s + i * 0.18, 0.3, E.outBack); return (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, background: '#fff', color: '#141413', fontFamily: F.sans, fontWeight: 800, fontSize: 28, padding: '8px 22px', borderRadius: 40, boxShadow: shadow, transform: `scale(${mix(0.5, 1, k)})`, opacity: k}}><span style={{width: 14, height: 14, borderRadius: 7, background: it.color || '#2fb457'}} />{it.text}</div>); })}</div>)}</T>;
    case 'callout': return <T o={o} shot={shot}>{({a}) => (
      <div style={{...pos(o, 700, 1150), transform: `translate(-50%,-50%) rotate(${o.rotate ?? -3}deg) scale(${mix(0.7, 1, clamp(a))})`, background: '#fff', color: '#141413', fontFamily: F.sans, fontWeight: 800, fontSize: o.size || 34, padding: '12px 26px', borderRadius: 14, boxShadow: shadow, opacity: clamp(a * 2), whiteSpace: 'nowrap'}}>{o.text}</div>)}</T>;
    case 'cursor': return <T o={o} shot={shot}>{({lt, s}) => {
      const [x0, y0] = o.from || [300, 900], [x1, y1] = o.to || [620, 800], k = p(lt, s, o.dur || 0.7, E.inOutSoft), x = mix(x0, x1, k), y = mix(y0, y1, k), click = p(lt, s + (o.dur || 0.7) + 0.05, 0.4, E.outExpo);
      return <><svg width={60} height={72} viewBox="0 0 30 36" style={{position: 'absolute', left: x, top: y, transform: `scale(${1 - 0.15 * Math.sin(click * Math.PI)})`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'}}><path d="M2 2 L2 28 L9 21 L14 33 L19 31 L14 19 L24 19Z" fill="#fff" stroke="#141413" strokeWidth={2.4} strokeLinejoin="round" /></svg>
        {k < 1 ? [0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: x - 36 - i * 18, top: y + 20 + i * 9, width: 40 - i * 8, height: 4, borderRadius: 2, background: '#141413', opacity: 0.5 - i * 0.12}} />) : null}
        {click > 0 && click < 1 ? <div style={{position: 'absolute', left: x - 6, top: y - 6, width: 20 + click * 90, height: 20 + click * 90, marginLeft: -(click * 45), marginTop: -(click * 45), borderRadius: '50%', border: `4px solid ${C.accent}`, opacity: 1 - click}} /> : null}</>; }}</T>;
    case 'scribble': return <T o={o} shot={shot}>{({lt, s}) => {
      const w = o.w || 300, h = o.h || 120, k = p(lt, s, 0.55, E.outExpo), col = o.color || '#E5322D', kind = o.kind || 'circle', inner = <div style={{width: w, height: h}} />;
      const common = {color: col, progress: k, strokeWidth: o.strokeWidth || 7};
      return <div style={{position: 'absolute', left: (o.x ?? 540) - w / 2, top: (o.y ?? 700) - h / 2, width: w, height: h}}>
        {kind === 'underline' ? <Underline {...common}>{inner}</Underline> : kind === 'highlight' ? <RoughHighlight color={o.color || 'rgba(255,236,79,0.6)'} progress={k}>{inner}</RoughHighlight> : kind === 'box' ? <Box {...common}>{inner}</Box> : kind === 'strike' ? <StrikeThrough {...common}>{inner}</StrikeThrough> : kind === 'crossed' ? <CrossedOff {...common}>{inner}</CrossedOff> : kind === 'bracket' ? <Bracket {...common}>{inner}</Bracket> : <Circle {...common}>{inner}</Circle>}
      </div>; }}</T>;
    case 'hearts': return <T o={o} shot={shot}>{({lt, s}) => (
      <div>{Array.from({length: o.count || 7}).map((_, i) => { const k = (lt - s - i * 0.12) / 1.4; if (k < 0 || k > 1) return null; return <div key={i} style={{position: 'absolute', left: (o.x ?? 540) + Math.sin(k * 6 + i) * 60 + (rnd(i) - 0.5) * 120, top: (o.y ?? 900) - k * 360, fontSize: 40 + rnd(i + 3) * 30, opacity: 1 - k * k, color: '#E5322D'}}>♥</div>; })}</div>)}</T>;
    case 'calendar': return <T o={o} shot={shot}>{({a}) => (
      <div style={{...pos(o, 880, 820), width: 190, borderRadius: 18, background: '#fff', boxShadow: shadow, overflow: 'hidden', textAlign: 'center', transform: `translate(-50%,-50%) rotate(4deg) scale(${mix(0.5, 1, clamp(a))})`}}>
        <div style={{background: '#E5322D', color: '#fff', fontFamily: F.mono, fontWeight: 800, fontSize: 28, padding: '6px 0', letterSpacing: '0.1em'}}>{o.month}</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 100, color: '#141413', lineHeight: 1.05}}>{o.day}</div>
        <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 22, color: C.muted, paddingBottom: 10}}>{o.weekday}</div></div>)}</T>;
    case 'waveform': return <T o={o} shot={shot}>{({lt}) => { const {t} = useShotTime(shot), n = o.bars || 30; return (
      <div style={{...pos(o, 540, 1180), display: 'flex', gap: 5, alignItems: 'center', height: 80}}>{Array.from({length: n}).map((_, i) => <div key={i} style={{width: 7, borderRadius: 4, background: o.color || '#E5322D', height: 10 + (talkAt(t) * 0.7 + 0.3) * 60 * Math.abs(Math.sin(i * 0.7 + t * 9)), opacity: 0.4 + 0.6 * Math.abs(Math.sin(i * 0.5 + t * 3))}} />)}</div>); }}</T>;
    case 'warning': return <T o={o} shot={shot}>{({a}) => (
      <div style={{...pos(o, 540, 1180), width: 880, textAlign: 'center', background: 'rgba(40,36,10,0.9)', border: '3px solid #FFD84A', color: '#FFD84A', fontFamily: F.mono, fontWeight: 700, fontSize: 30, padding: '16px 20px', borderRadius: 12, opacity: clamp(a * 2), transform: `translate(-50%,-50%) translateY(${(1 - clamp(a)) * 30}px)`}}>⚠ {o.text}</div>)}</T>;
    case 'progress': return <T o={o} shot={shot}>{({lt, s, a}) => { const k = p(lt, s + 0.2, o.dur || 1.6, E.inOutSoft) * (o.to ?? 1); return (
      <div style={{...pos(o, 540, 1150), width: o.w || 520, background: '#fff', borderRadius: 18, boxShadow: shadow, padding: '20px 26px', opacity: clamp(a * 2)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: '#141413'}}><span>{o.name}</span><span>{Math.round(k * 100)}%</span></div>
        <div style={{height: 12, borderRadius: 6, background: '#e8e6e0', marginTop: 12}}><div style={{width: `${k * 100}%`, height: '100%', borderRadius: 6, background: C.accent}} /></div></div>); }}</T>;
    case 'backword': return <T o={{...o, at: o.at ?? 0}} shot={shot}>{({lt}) => <div style={{position: 'absolute', left: 0, right: 0, top: o.y ?? 560, textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: o.size || 280, color: o.color || '#bfe0ff', opacity: 0.35 * clamp(lt / 0.5), filter: 'blur(1.5px)', textShadow: '0 0 60px currentColor', letterSpacing: '-0.04em'}}>{o.text}</div>}</T>;
    default: return null;
  }
};
// x,y are pixels on the 1080x1920 canvas (x is the centre); values between -2 and 2 are read as fractions of the frame (0.5 = the middle)
const fixPos = (o: Overlay): Overlay => ({...o, x: o.x != null && Math.abs(o.x) <= 2 ? o.x * 1080 : o.x, y: o.y != null && Math.abs(o.y) <= 2 ? o.y * 1920 : o.y});
export const Overlays: React.FC<{shot: Shot}> = ({shot}) => <>{(shot.overlays || []).map((o, i) => <One key={i} o={fixPos(o)} shot={shot} />)}</>;
