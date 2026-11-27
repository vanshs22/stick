import React from 'react';
import {C, F, W} from './tokens';
import {E, SPR, clamp, p, sp} from './anim';
import {atLocal, useShotTime} from './time';
import type {Overlay, Shot} from './types';

/**
 * Overlay types learned from the 27 reference shorts (foundation/playbooks/overlay.json):
 *   dial         speed / level gauge, needle moves from `from` to `to` (0..1) on the word; big `label` ("10x"), small `sub` ("SPEED")
 *   hud          series HUD, top-left: red dot + `label`, big `value` (number, flicks to `valueTo` at `changeAt` seconds), small `caption`
 *   hub          centre `text` with `items` [{label, at?|anchor?}] spokes drawn one by one
 *   step-card    window card: step chip `chip` ("STEP 2/5"), `title`, `lines`[], `progress` 0..1
 *   device-list  `rows` [{label, tag?, tone? good|bad|neutral, at?|anchor?}] with tags landing one row at a time
 * Positions are pixels on the 1080x1920 canvas (x = centre). Every overlay fades out with its shot.
 */
const Wrap: React.FC<{o: Overlay; shot: Shot; children: (k: {a: number; lt: number; s: number; at: (x: any, d: number) => number}) => React.ReactNode}> = ({o, shot, children}) => {
  const {lt, d, fps} = useShotTime(shot);
  const s = o.anchor && o.anchor in shot.anchors ? atLocal(shot, o.anchor) : o.at ?? 0.2, a = sp(lt, s, fps, SPR.pop), out = p(lt, d - 0.25, 0.22, E.inCubic);
  const at = (x: any, dflt: number) => (x?.anchor && x.anchor in shot.anchors ? atLocal(shot, x.anchor) : x?.at ?? dflt);
  return <div data-lay="overlay" style={{position: 'absolute', inset: 0, opacity: (1 - out) * (lt >= s ? 1 : 0), pointerEvents: 'none'}}>{children({a, lt, s, at})}</div>;
};
const card: React.CSSProperties = {background: 'rgba(255,255,255,0.97)', borderRadius: 26, boxShadow: '0 18px 50px rgba(10,10,20,0.28)', color: '#14141c', fontFamily: F.sans};
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => { const pt = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)]; const [x0, y0] = pt(a0), [x1, y1] = pt(a1); return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };

export const OverlayV3: React.FC<{o: any; shot: Shot}> = ({o, shot}) => {
  const col = o.color || C.accent;
  if (o.type === 'dial') return <Wrap o={o} shot={shot}>{({a, lt, s}) => { const k = p(lt, s, o.dur || 0.9, E.outBack ?? E.outCubic), v = (o.from ?? 0.1) + ((o.to ?? 0.95) - (o.from ?? 0.1)) * k, ang = -210 + v * 240, cx = 150, cy = 150;
    return <div style={{position: 'absolute', left: (o.x ?? W / 2) - 150, top: (o.y ?? 640) - 150, width: 300, height: 300, transform: `scale(${0.85 + a * 0.15})`, opacity: clamp(a * 2)}}>
      <svg width={300} height={300}><path d={arc(cx, cy, 118, -210, 30)} stroke="rgba(255,255,255,0.18)" strokeWidth={16} fill="none" strokeLinecap="round" /><path d={arc(cx, cy, 118, -210, Math.max(-209.9, ang))} stroke={col} strokeWidth={16} fill="none" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + 96 * Math.cos((ang * Math.PI) / 180)} y2={cy + 96 * Math.sin((ang * Math.PI) / 180)} stroke="#fff" strokeWidth={6} strokeLinecap="round" /><circle cx={cx} cy={cy} r={11} fill="#fff" /></svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 176, textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: o.size || 64, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.5)'}}>{o.label}</div>
      {o.sub ? <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: F.mono, fontSize: 18, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)'}}>{o.sub}</div> : null}</div>; }}</Wrap>;
  if (o.type === 'hud') return <Wrap o={{...o, at: o.at ?? 0}} shot={shot}>{({a, lt}) => { const flip = o.valueTo != null && lt >= (o.changeAt ?? 1.5), val = flip ? o.valueTo : o.value, pop = flip ? 1 + 0.25 * (1 - p(lt, o.changeAt ?? 1.5, 0.25, E.outCubic)) : 1;
    return <div style={{position: 'absolute', left: o.x ?? 64, top: o.y ?? 150, opacity: clamp(a * 2), transform: `translateY(${(1 - a) * -20}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: F.sans, fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: '0.06em', textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}><span style={{width: 14, height: 14, borderRadius: 14, background: '#FF3B30', boxShadow: '0 0 14px #FF3B30'}} />{o.label}</div>
      <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: o.size || 84, color: '#fff', lineHeight: 1, transformOrigin: 'left center', transform: `scale(${pop})`, textShadow: '0 4px 16px rgba(0,0,0,0.6)'}}>{val}</div>
      {o.caption ? <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.7)'}}>{o.caption}</div> : null}</div>; }}</Wrap>;
  if (o.type === 'hub') return <Wrap o={o} shot={shot}>{({lt, s, at, a}) => { const items: any[] = o.items || [], R = o.r || 250, cx = o.x ?? W / 2, cy = o.y ?? 760;
    return <>{items.map((it, i) => { const ang = (-90 + (360 / items.length) * i) * (Math.PI / 180), t0 = at(it, s + 0.35 * (i + 1)), k = p(lt, t0, 0.35, E.outCubic), x = cx + R * Math.cos(ang) * k, y = cy + R * Math.sin(ang) * k;
      return <React.Fragment key={i}><svg style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}><line x1={cx} y1={cy} x2={x} y2={y} stroke={col} strokeWidth={4} opacity={k} /></svg>
        <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${k})`, ...card, padding: '12px 22px', borderRadius: 40, fontWeight: 800, fontSize: 28, opacity: k}}>{it.label}</div></React.Fragment>; })}
      <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${a})`, width: 150, height: 150, borderRadius: 150, background: col, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 34, boxShadow: '0 12px 40px rgba(0,0,0,0.35)'}}>{o.text}</div></>; }}</Wrap>;
  if (o.type === 'step-card') return <Wrap o={o} shot={shot}>{({a, lt, s}) => { const prog = clamp((o.progress ?? 0) * p(lt, s, 0.9, E.outCubic));
    return <div style={{position: 'absolute', left: (o.x ?? W / 2) - 400, top: (o.y ?? 760) - 200, width: 800, ...card, padding: '26px 34px 30px', transform: `scale(${0.92 + a * 0.08})`, opacity: clamp(a * 2)}}>
      <div style={{display: 'flex', gap: 8, marginBottom: 14}}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <i key={c} style={{width: 14, height: 14, borderRadius: 14, background: c}} />)}</div>
      {o.chip ? <div style={{display: 'inline-block', fontFamily: F.mono, fontSize: 18, letterSpacing: '0.14em', fontWeight: 700, color: '#fff', background: col, padding: '4px 12px', borderRadius: 8}}>{o.chip}</div> : null}
      <div style={{fontWeight: 900, fontSize: 40, marginTop: 10}}>{o.title}</div>
      {(o.lines || []).map((l: string, i: number) => <div key={i} style={{fontFamily: F.mono, fontSize: 24, color: '#3d3d46', marginTop: 8, opacity: p(lt, s + 0.3 + i * 0.25, 0.2, E.outCubic)}}>{l}</div>)}
      {o.progress != null ? <div style={{height: 10, borderRadius: 10, background: '#e6e6ee', marginTop: 20}}><div style={{width: `${prog * 100}%`, height: 10, borderRadius: 10, background: col}} /></div> : null}</div>; }}</Wrap>;
  if (o.type === 'device-list') return <Wrap o={o} shot={shot}>{({a, lt, s, at}) => { const rows: any[] = o.rows || [];
    return <div style={{position: 'absolute', left: (o.x ?? W / 2) - 400, top: (o.y ?? 760) - 40 - rows.length * 36, width: 800, ...card, padding: '18px 26px', transform: `scale(${0.94 + a * 0.06})`, opacity: clamp(a * 2)}}>{rows.map((r, i) => { const k = p(lt, at(r, s + 0.4 * (i + 1)), 0.25, E.outCubic), tone = r.tone === 'bad' ? '#E5484D' : r.tone === 'good' ? '#2E9E5B' : '#6b6b78';
      return <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < rows.length - 1 ? '1px solid #ececf2' : 'none', fontSize: 30, fontWeight: 700, opacity: 0.35 + 0.65 * k}}><span>{r.label}</span>{r.tag ? <span style={{fontFamily: F.mono, fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', color: '#fff', background: tone, padding: '5px 12px', borderRadius: 8, transform: `scale(${0.6 + 0.4 * k})`, opacity: k}}>{r.tag}</span> : null}</div>; })}</div>; }}</Wrap>;
  return null;
};
