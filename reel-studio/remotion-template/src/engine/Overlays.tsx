import React from 'react';
import {Box, Bracket, Circle, CrossedOff, Highlight as RoughHighlight, StrikeThrough, Underline} from '@remotion/rough-notation';
import {C, CARD, F, H, LANDSCAPE, SAFE, W, fx, fy} from './tokens';
import {E, SPR, clamp, mix, p, rnd, sp} from './anim';
import {atLocal, talkAt, useShotTime} from './time';
import type {Overlay, Shot} from './types';
import {Img, staticFile} from 'remotion';
import {REMOCN} from '../data/remocn-registry';

/**
 * Graphics layered ON TOP of a shot's main component, each timed to a spoken word (anchor) or `at` seconds.
 * types: label, step-chip, step-label, sticker, tags, callout, cursor, scribble, hearts, calendar, waveform, warning, progress, backword
 * Positions are pixels on the 1080x1920 portrait canvas (scaled to the frame in landscape; fractions of the frame work in both) (x = centre). Every overlay fades out with its shot.
 */
const shadow = '0 8px 24px rgba(20,20,19,0.18)';
const T: React.FC<{o: Overlay; shot: Shot; children: (k: {a: number; lt: number; s: number; fps: number}) => React.ReactNode}> = ({o, shot, children}) => {
  const {lt, d, fps} = useShotTime(shot);
  const s = o.anchor && o.anchor in shot.anchors ? atLocal(shot, o.anchor) : o.at ?? 0.2;
  const a = sp(lt, s, fps, SPR.pop), out = p(lt, d - 0.25, 0.22, E.inCubic);
  return <div data-lay="overlay" style={{position: 'absolute', inset: 0, opacity: (1 - out) * (lt >= s ? 1 : 0), pointerEvents: 'none'}}>{children({a, lt, s, fps})}</div>;
};
const pos = (o: Overlay, dx: number, dy: number): React.CSSProperties => ({position: 'absolute', left: o.x ?? dx, top: o.y ?? dy, transform: 'translate(-50%, -50%)'});

const One: React.FC<{o: Overlay; shot: Shot}> = ({o, shot}) => {
  switch (o.type) {
    // ---- HUD pieces of the neon-stage look: a headline plaque, a counting number, an emoji thought bubble, a neon burst ----
    case 'plaque': return <T o={{...o, at: o.at ?? 0}} shot={shot}>{({a, lt}) => { const steps = (o.texts || []).map((x: any) => ({t: x.anchor && x.anchor in shot.anchors ? atLocal(shot, x.anchor) : x.at ?? 0, text: x.text})).filter((x: any) => x.t <= lt).sort((m: any, n: any) => m.t - n.t), cur = steps[steps.length - 1], text = cur?.text ?? o.text, bump = cur ? Math.max(0, 1 - (lt - cur.t) / 0.25) * 0.06 : 0; return (
      <div style={{position: 'absolute', left: 0, right: 0, top: o.y ?? 150, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - a) * -30}px) scale(${0.92 + a * 0.08})`, opacity: clamp(a * 1.6)}}>
        <div style={{padding: '16px 34px 18px', borderRadius: 26, background: 'rgba(24,18,38,0.78)', border: `2px solid ${o.border || 'rgba(255,255,255,0.28)'}`, boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 18px rgba(255,255,255,0.05)', textAlign: 'center', maxWidth: 900}}>
          {o.kicker ? <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.18em', color: o.kickerColor || 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6}}>{o.kicker}</div> : null}
          <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: o.size || 52, lineHeight: 1.05, color: '#fff', textTransform: o.caps === false ? 'none' : 'uppercase', letterSpacing: '0.01em', textShadow: '0 3px 0 rgba(0,0,0,0.35)', transform: `scale(${1 + bump})`}}>{text}</div>
        </div>
      </div>); }}</T>;
    case 'counter': return <T o={{...o, at: o.at ?? 0.3}} shot={shot}>{({lt, s, a}) => { const k = p(lt, s, o.dur || 1.6, E.outExpo), v = Math.round((o.from ?? 0) + ((o.to ?? 100) - (o.from ?? 0)) * k);
      return <div style={{position: 'absolute', left: LANDSCAPE || o._role ? (o.x ?? W / 2) - 450 : 0, right: LANDSCAPE || o._role ? W - (o.x ?? W / 2) - 450 : 0, top: LANDSCAPE || o._role ? (o.y ?? 560) - 55 : o.y ?? 560, display: 'flex', justifyContent: 'center', opacity: clamp(a * 1.6), transform: `scale(${0.9 + a * 0.1})`}}><div style={{padding: '12px 36px 14px', borderRadius: 24, background: 'rgba(14,10,24,0.82)', border: '2px solid rgba(255,255,255,0.22)', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: o.size || 76, color: o.color || '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05}}>{(o.prefix || '') + v.toLocaleString('en-US') + (o.suffix || '')}</div>
        {o.label ? <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: 4}}>{o.label}</div> : null}</div></div>; }}</T>;
    case 'bubble': return <T o={o} shot={shot}>{({a, lt, s}) => (
      <div style={{...pos(o, 540, 1000), transform: `translate(-50%, -50%) scale(${a}) rotate(${Math.sin((lt - s) * 5) * 1.5}deg)`, opacity: clamp(a * 2)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', borderRadius: 40, background: '#fff', color: '#14101c', fontFamily: F.sans, fontWeight: 800, fontSize: o.size || 34, boxShadow: '0 6px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap'}}><span style={{fontSize: (o.size || 34) + 6}}>{o.emoji || '\u{1F914}'}</span><span>{o.text}</span></div>
        <div style={{width: 0, height: 0, margin: '-2px auto 0', borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '16px solid #fff'}} />
      </div>)}</T>;
    case 'burst': return <T o={o} shot={shot}>{({lt, s}) => { const k = p(lt, s, 0.7, E.outExpo), n = o.count || 14, cx = o.x ?? 540, cy = o.y ?? 900;
      return <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 1 - p(lt, s + 0.35, 0.4, E.inCubic)}}>{Array.from({length: n}).map((_, i) => { const ang = (i / n) * Math.PI * 2 + 0.3, r0 = 60 + k * 90, r1 = r0 + 60 + k * (140 + (i % 3) * 60); return <line key={i} x1={cx + Math.cos(ang) * r0} y1={cy + Math.sin(ang) * r0} x2={cx + Math.cos(ang) * r1} y2={cy + Math.sin(ang) * r1} stroke={[o.color || '#FFB84D', '#FF5CA8', '#7DE3FF'][i % 3]} strokeWidth={9 - (i % 3) * 2} strokeLinecap="round" />; })}</svg>; }}</T>;
    // a giant word that slams in on its anchor (KILLED, FREE, $0, #1): {text, x, y, size, rotate, color, shadow}
    case 'impact': return <T o={o} shot={shot}>{({lt, s}) => { const k = p(lt, s, 0.3, E.outBack), dt = lt - s, shake = dt < 0.45 ? Math.sin(dt * 70) * (1 - dt / 0.45) * 12 : 0;
      return <div style={{position: 'absolute', left: o.x ?? 540, top: o.y ?? 760, transform: `translate(-50%, -50%) translateX(${shake}px) rotate(${o.rotate ?? -6}deg) scale(${0.25 + 0.75 * k})`, opacity: clamp(k * 3), fontFamily: F.sans, fontWeight: 900, fontSize: o.size || 220, lineHeight: 1, color: o.color || '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', whiteSpace: 'nowrap', WebkitTextStroke: `${o.stroke ?? 12}px ${o.strokeColor || '#1b1233'}`, paintOrder: 'stroke fill', textShadow: `0 14px 0 ${o.shadow || '#FF5C7A'}, 0 26px 44px rgba(0,0,0,0.5)`}}>{o.text}</div>; }}</T>;
    // a remocn component floating over the 3D stage (keeps the characters): {name, props, scale, x, y} x,y = pixel shift of its centre
    case 'remocn': return <T o={{...o, at: o.at ?? 0}} shot={shot}>{() => { const C0 = REMOCN[o.name]; if (!C0) throw new Error(`overlay remocn: "${o.name}" is not installed (node tools/remocn.mjs add ${o.name} --project <P>)`);
      return <div style={{position: 'absolute', inset: 0, transform: `translate(${o.x ?? 0}px, ${o.y ?? 0}px) scale(${o.scale ?? 0.7})`, transformOrigin: 'center center'}}><C0 {...(o.props || {})} /></div>; }}</T>;
    // ---- the reference reels' vocabulary (docs/OVERLAY-BRAIN.md): a ring that says "look here", a verdict banner, a price tag on an object, money or confetti falling on a number
    case 'prop': return <T o={{...o, at: o.at ?? 0.1}} shot={shot}>{({lt, s}) => {
      // a picture of a thing (Noto emoji, assets/emoji/<codepoints>.png) as a sticker-prop; anim: pop | drop | spin | shake | float | stack. The universal answer to "show the idea as an object".
      const cp = Array.from(String(o.emoji || '')).map((c) => c.codePointAt(0)!.toString(16)).filter((x) => x !== 'fe0f').join('_'), sz = o.size || 190, n = Math.min(6, Math.max(1, o.count || (o.anim === 'stack' ? 3 : 1))), anim = o.anim || 'pop';
      const one = (i: number) => { const u = clamp((lt - s - (anim === 'stack' ? i * 0.16 : 0)) / 0.4), base = u < 0.7 ? (u / 0.7) * 1.15 : 1.15 - 0.15 * ((u - 0.7) / 0.3), t = lt - s;
        const dy = anim === 'drop' ? -(1 - E.outCubic(u)) * 260 + Math.abs(Math.sin(t * 7)) * -18 * Math.exp(-t * 3) : anim === 'float' ? Math.sin(t * 2.2) * 10 : anim === 'stack' ? -i * sz * 0.34 : 0, dx = anim === 'shake' ? Math.sin(t * 38) * 14 * Math.exp(-t * 2.2) : anim === 'stack' ? i * sz * 0.1 : 0, rot = anim === 'spin' ? (1 - E.outCubic(u)) * 360 : anim === 'shake' ? Math.sin(t * 38) * 6 * Math.exp(-t * 2.2) : (o.rotate ?? -6);
        return <Img key={i} src={staticFile(`assets/emoji/${cp}.png`)} style={{position: 'absolute', left: -sz / 2 + dx, top: -sz / 2 + dy, width: sz, height: sz, transform: `rotate(${rot}deg) scale(${u <= 0 ? 0 : base})`, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.38))'}} />; };
      return <div style={{position: 'absolute', left: o.x ?? 800, top: o.y ?? 560, width: 0, height: 0}}>{Array.from({length: n}).map((_, i) => one(i))}{o.text ? <div style={{position: 'absolute', left: -200, width: 400, top: sz * 0.55, textAlign: 'center', opacity: clamp((lt - s) / 0.3), }}><span style={{display: 'inline-block', background: 'rgba(20,20,19,0.88)', color: '#fff', fontFamily: F.sans, fontWeight: 900, fontSize: 30, letterSpacing: '0.06em', padding: '6px 18px', borderRadius: 10}}>{o.text}</span></div> : null}</div>; }}</T>;
    case 'focus-ring': return <T o={{...o, at: o.at ?? 0.1}} shot={shot}>{({lt, s}) => { const r = o.r ?? 120, k = p(lt, s, 0.35, E.outCubic), pulse = (u: number) => { const q = ((lt - s) * 0.9 + u) % 1; return {sc: 0.7 + q * 0.9, op: (1 - q) * 0.55}; };
      return <div style={{position: 'absolute', left: (o.x ?? 540) - r, top: (o.y ?? 700) - r, width: r * 2, height: r * 2, opacity: k}}>
        {[0, 0.5].map((u, i) => { const q = pulse(u); return <div key={i} style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${o.color || C.accent}`, transform: `scale(${q.sc})`, opacity: q.op}} />; })}
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `5px solid ${o.color || C.accent}`, boxShadow: `0 0 28px ${o.color || C.accent}, inset 0 0 22px ${o.color || C.accent}55`, transform: `scale(${mix(1.25, 1, k)})`}} /></div>; }}</T>;
    case 'verdict': { const bad = o.tone === 'bad' || /fail|wrong|dead|lost|over/i.test(String(o.text)); return <T o={{...o, at: o.at ?? 0.05}} shot={shot}>{({lt, s}) => { const k = p(lt, s, 0.28, E.outBack), shake = bad && lt - s < 0.5 ? Math.sin((lt - s) * 60) * (1 - (lt - s) / 0.5) * 9 : 0, col = bad ? '#FF4D4D' : '#B6FF3B';
      return <div style={{position: 'absolute', left: 0, right: 0, top: o.y ?? (LANDSCAPE ? 70 : 150), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: clamp(k * 2), transform: `translateX(${shake}px) scale(${mix(1.4, 1, clamp(k))})`}}>
        <div style={{padding: '12px 46px 14px', border: `4px solid ${col}`, background: 'rgba(8,10,14,0.88)', color: col, fontFamily: F.sans, fontWeight: 900, fontSize: o.size || (LANDSCAPE ? 66 : 84), letterSpacing: '0.04em', textTransform: 'uppercase', textShadow: `0 0 26px ${col}99`, boxShadow: `0 0 40px ${col}55`}}>{o.text}</div>
        {o.sub ? <div style={{fontFamily: F.mono, fontSize: 26, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase'}}>{o.sub}</div> : null}
        {o.retry || bad && o.retry !== false ? <div style={{padding: '8px 30px', borderRadius: 40, background: col, color: '#0b0c10', fontFamily: F.sans, fontWeight: 900, fontSize: 32, opacity: clamp((lt - s - 0.35) / 0.2)}}>↻ {typeof o.retry === 'string' ? o.retry : 'RETRY'}</div> : null}</div>; }}</T>; }
    case 'price-tag': return <T o={o} shot={shot}>{({lt, s, a}) => { const sw = Math.sin((lt - s) * 4.2) * 9 * Math.exp(-(lt - s) / 1.8), big = o.size || 60;
      return <div style={{...pos(o, 760, 520), transform: `translate(-50%, 0) rotate(${sw + (o.rotate ?? 6)}deg) scale(${mix(0.4, 1, clamp(a))})`, transformOrigin: '50% 0', opacity: clamp(a * 2)}}>
        <div style={{width: 3, height: 46, background: 'rgba(255,255,255,0.55)', margin: '0 auto'}} />
        <div style={{background: o.color || '#B6FF3B', color: '#0b0c10', borderRadius: 14, padding: '10px 26px 12px', textAlign: 'center', fontFamily: F.sans, fontWeight: 900, boxShadow: '0 10px 28px rgba(0,0,0,0.45)', border: '4px solid #0b0c10'}}>
          <div style={{fontSize: big, lineHeight: 1}}>{o.text}</div>{o.sub ? <div style={{fontFamily: F.mono, fontSize: big * 0.36, letterSpacing: '0.16em', marginTop: 4}}>{o.sub}</div> : null}</div></div>; }}</T>;
    case 'rain': return <T o={{...o, at: o.at ?? 0}} shot={shot}>{({lt, s}) => { const n = o.count || 22, kind = o.kind || 'bills', dur = o.dur || 2.4, cols = o.colors || ['#7BE070', '#B6FF3B', '#FFD84A', '#FF5CA8', '#7DE3FF'];
      return <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{Array.from({length: n}).map((_, i) => { const t0 = s + rnd(i) * 0.9, k = (lt - t0) / dur; if (k < 0 || k > 1) return null; const x = (o.x != null ? o.x : W / 2) + (rnd(i + 5) - 0.5) * (o.spread ?? W * 0.7) + Math.sin(k * 7 + i) * 30, y = -80 + k * (H * 0.85), rot = (rnd(i + 9) - 0.5) * 520 * k, sz = 46 + rnd(i + 3) * 30;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: kind === 'bills' ? sz * 1.9 : sz * 0.8, height: kind === 'bills' ? sz : sz * 0.8, borderRadius: kind === 'confetti' ? 3 : kind === 'coins' ? '50%' : 6, background: kind === 'bills' ? 'linear-gradient(135deg,#8FE388,#3E9E4C)' : kind === 'coins' ? '#FFD84A' : cols[i % cols.length], border: kind === 'bills' ? '3px solid #1d5a28' : kind === 'coins' ? '4px solid #b88a0a' : 'none', transform: `rotate(${rot}deg)`, opacity: 1 - k * k, color: '#1d5a28', fontFamily: F.sans, fontWeight: 900, fontSize: sz * 0.62, textAlign: 'center', lineHeight: `${sz}px`, boxShadow: '0 6px 14px rgba(0,0,0,0.35)'}}>{kind === 'bills' ? '$' : kind === 'coins' ? '¢' : ''}</div>; })}</div>; }}</T>;
    case 'label': return <T o={{...o, at: 0}} shot={shot}>{({lt}) => (
      <div style={{position: 'absolute', left: 64, right: 64, top: LANDSCAPE ? 46 : 118, display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontWeight: 500, fontSize: 24, color: C.muted, opacity: clamp(lt / 0.3)}}>
        <span>{o.left}</span><span style={{color: o.rightAccent === false ? C.muted : C.accent}}>{o.right}</span></div>)}</T>;
    case 'step-chip': return <T o={o} shot={shot}>{({a}) => (
      <div style={{...pos(o, 880, 600), width: 132, height: 132, borderRadius: 28, background: '#141413', boxShadow: shadow, transform: `translate(-50%,-50%) rotate(-4deg) scale(${mix(0.4, 1, a)})`, textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 84, color: '#fff', lineHeight: '104px'}}>{o.n}</div>
        <div style={{display: 'flex', gap: 7, justifyContent: 'center', marginTop: -6}}>{Array.from({length: o.of || 5}).map((_, i) => <div key={i} style={{width: 9, height: 9, borderRadius: 5, background: i < o.n ? C.accent : 'rgba(255,255,255,0.3)'}} />)}</div></div>)}</T>;
    case 'step-label': return <T o={{...o, at: o.at ?? 0.05}} shot={shot}>{({a}) => (
      <div style={{position: 'absolute', left: LANDSCAPE ? SAFE.content_left : 0, right: 0, top: LANDSCAPE ? 40 : o.y ?? 70, textAlign: 'center', opacity: clamp(a * 2)}}>
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
    case 'calendar': return <T o={o} shot={shot}>{({a, lt, s}) => (
      <div style={{...pos(o, 880, 820), width: 190, borderRadius: 18, background: '#fff', boxShadow: shadow, overflow: 'hidden', textAlign: 'center', transform: `translate(-50%,-50%) rotate(4deg) scale(${mix(0.5, 1, clamp(a))})`}}>
        <div style={{background: '#E5322D', color: '#fff', fontFamily: F.mono, fontWeight: 800, fontSize: 28, padding: '6px 0', letterSpacing: '0.1em'}}>{o.month}</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 100, color: '#141413', lineHeight: 1.05}}>{o.day}</div>
        <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 22, color: C.muted, paddingBottom: 10}}>{o.weekday}</div>
        {o.crossed ? <svg width="100%" height="100%" viewBox="0 0 190 200" style={{position: 'absolute', inset: 0}}><path d="M18 22 L172 182 M172 20 L20 184" stroke="#E5322D" strokeWidth={14} strokeLinecap="round" fill="none" strokeDasharray="260" strokeDashoffset={260 * (1 - clamp((lt - s - 0.15) / 0.3))} /></svg> : null}</div>)}</T>;
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
/** Landscape placement (portrait is untouched). `place` on an overlay overrides the default of its type:
 *  'dock'  badges (sticker, step-chip, calendar, bubble, callout, impact): snap to the nearest corner or edge of the drawn card, centred on it, so they never cover its text
 *  'strip' wide items (tags, progress, warning, waveform, counter): a reserved lane under the card (the Zone leaves it free)
 *  'card'  pointers (cursor, scribble, burst, hearts, remocn): the portrait position is mapped proportionally onto the card, so they still point at the same part of the picture
 *  'free'  fractions or px of the frame as written */
const DOCKED = new Set(['sticker', 'step-chip', 'calendar', 'bubble', 'callout', 'impact', 'price-tag']);
const FREE = new Set(['verdict', 'rain']);   // full-width banners and full-frame particles: no card to dock to
export const STRIP = new Set(['tags', 'progress', 'warning', 'waveform', 'counter']);
const clampX = (x: number) => Math.min(Math.max(x, W * 0.07), W * 0.93), clampY = (y: number) => Math.min(Math.max(y, H * 0.09), H * 0.88);
const landscapePos = (o: Overlay): Overlay => {
  const place = o.place || (DOCKED.has(o.type) ? 'dock' : STRIP.has(o.type) ? 'strip' : FREE.has(o.type) ? 'free' : 'card'), card = CARD.v;
  if (place === 'strip') { const cx = card ? card.cx : SAFE.content_left + (W - SAFE.content_left) / 2; return {...o, x: cx, y: SAFE.content_bottom - 50}; }
  if (place === 'dock' && card && typeof o.x === 'number') {
    // the badge sits on the card's TOP edge (80 percent outside it), on the side the portrait position was on; its size is estimated from its text so it stays inside the frame
    const n = String(o.text || o.n || o.day || '').length || 1, sz = o.size || ({sticker: 68, impact: 220, callout: 34, bubble: 34, 'price-tag': 60}[o.type as string] ?? 60);
    const hw = (o.type === 'step-chip' ? 66 : o.type === 'calendar' ? 95 : o.type === 'impact' ? n * sz * 0.34 : o.type === 'sticker' ? n * sz * 0.34 + 34 : n * sz * 0.29 + 50), hh = o.type === 'step-chip' ? 66 : o.type === 'calendar' ? 105 : o.type === 'impact' ? sz * 0.55 : o.type === 'sticker' ? sz * 0.55 : sz * 0.8;
    const u = (o.x - 540) / 940, xMin = Math.max(card.cx - card.w / 2 + hw, hw + W * 0.03), xMax = Math.min(card.cx + card.w / 2 - hw, W - hw - W * 0.03), slot = (o as any)._slot as undefined | [number, number], x = slot && slot[1] > 1 ? xMin + (Math.max(xMin, xMax) - xMin) * (1 - slot[0] / (slot[1] - 1)) : Math.min(Math.max(card.cx + u * card.w * 0.9, xMin), Math.max(xMin, xMax));   // 2+ badges on one card take turns along its top edge (rightmost authored x = rightmost slot)
    return {...o, x, y: o.type === 'price-tag' ? Math.max(H * 0.02, card.cy - card.h / 2 - 118) : Math.max(card.cy - card.h / 2 - hh * 0.8, hh + H * 0.02), ...(o.type === 'impact' ? {size: Math.round(sz * 0.75)} : {})};   // a hanging tag is top-anchored: its string and most of its body sit above the card edge
  }
  const ys = typeof o.y === 'number' && Math.abs(o.y) > 2 ? o.y : undefined;
  const mapPt = (pt: number[]) => [clampX(fx(pt[0], pt[1])), clampY(fy(pt[1]))];
  return {...o, x: o.x != null ? (Math.abs(o.x) <= 2 ? o.x * W : clampX(fx(o.x, ys))) : o.x, y: o.y != null ? (Math.abs(o.y) <= 2 ? o.y * H : clampY(fy(o.y))) : o.y, ...(o.from ? {from: mapPt(o.from)} : {}), ...(o.to ? {to: mapPt(o.to)} : {})};
};
const fixPos = (o: Overlay): Overlay => LANDSCAPE || o.place || (o as any).from_director ? {...landscapePos(o), _role: true} : {...o, x: o.x != null && Math.abs(o.x) <= 2 ? o.x * W : o.x, y: o.y != null && Math.abs(o.y) <= 2 ? o.y * H : o.y};
const isDock = (o: Overlay) => (o.place || (DOCKED.has(o.type) ? 'dock' : '')) === 'dock' && typeof o.x === 'number';
export const Overlays: React.FC<{shot: Shot}> = ({shot}) => { const all = shot.overlays || [], dk = all.map((o, i) => ({o, i})).filter(({o}) => isDock(o)).sort((x, y) => (x.o.x as number) - (y.o.x as number)), slot: Record<number, [number, number]> = {}; dk.forEach(({i}, r) => { slot[i] = [r, dk.length]; });
  return <>{all.map((o, i) => <One key={i} o={fixPos(slot[i] ? {...o, _slot: slot[i]} as Overlay : o)} shot={shot} />)}</>; };
