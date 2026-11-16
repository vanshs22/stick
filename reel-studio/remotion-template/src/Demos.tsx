import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions} from './engine/Captions';
import {E, p} from './engine/anim';
import {fontFamily} from './engine/fonts';
import type {Timeline} from './engine/types';

/** Animated previews: the user picks a caption look / a type set by watching it move over the project's own picture. */
export type CaptionDemoProps = {bg: string; timeline: Timeline; preset: string; label: string; y?: number; scale?: number; hi?: string; dur?: number};
export const CaptionDemo: React.FC<CaptionDemoProps> = ({bg, timeline, preset, label, y, scale, hi}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Img src={bg.startsWith('http') ? bg : staticFile(bg)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.25))'}} />
    <Captions timeline={timeline} preset={preset} y={y} scale={scale} hi={hi} />
    <div style={{position: 'absolute', left: 48, top: 64, fontFamily: fontFamily('JetBrainsMono'), fontWeight: 700, fontSize: 34, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '10px 18px', borderRadius: 12}}>{label}</div>
  </AbsoluteFill>
);

export type TypeSet = {name: string; headline: {font: string; weight?: number; case?: string}; supporting: {font: string}; ui: {font: string}; caption: {font: string; weight?: number}; sample?: {headline?: string; accent?: string; supporting?: string; ui?: string; caption?: string[]}};
export const TypeDemo: React.FC<{bg: string; set: TypeSet; dark?: boolean; n?: number | string; accent?: string}> = ({bg, set, dark = true, n, accent = '#FFC247'}) => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, ink = dark ? '#FFFFFF' : '#14161C';
  const hf = fontFamily(set.headline.font), sf = fontFamily(set.supporting.font), uf = fontFamily(set.ui.font), cf = fontFamily(set.caption.font);
  const S = {headline: 'Make videos with code', accent: 'code', supporting: 'every frame is a function', ui: '// 02 · the idea', caption: ['This', 'free', 'tool', 'has', '40,000', 'stars'], ...(set.sample || {})};
  const words = S.headline!.split(' '), up = (set.headline.case || '') === 'upper';
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={bg.startsWith('http') ? bg : staticFile(bg)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <AbsoluteFill style={{background: dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)'}} />
      <div style={{position: 'absolute', left: 64, top: 300, right: 64}}>
        <div style={{fontFamily: uf, fontWeight: 700, fontSize: 34, color: accent, marginBottom: 24, opacity: p(t, 0.1, 0.4, E.outCubic)}}>{S.ui}</div>
        <div style={{fontFamily: hf, fontWeight: set.headline.weight ?? 800, fontSize: 118, lineHeight: 1.04, color: ink, letterSpacing: '-0.025em', textTransform: up ? 'uppercase' : 'none'}}>
          {words.map((w, i) => { const a = p(t, 0.3 + i * 0.12, 0.5, E.outExpo), hi = w.toLowerCase() === (S.accent || '').toLowerCase(); return <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', marginRight: '0.22em'}}><span style={{display: 'inline-block', transform: `translateY(${(1 - a) * 110}%)`, color: hi ? accent : ink, fontFamily: hi ? sf : hf, fontStyle: hi ? 'italic' : 'normal', fontWeight: hi ? 400 : set.headline.weight ?? 800}}>{w}</span></span>; })}
        </div>
        <div style={{fontFamily: sf, fontStyle: 'italic', fontSize: 62, color: ink, opacity: 0.9 * p(t, 1.1, 0.5, E.outCubic), marginTop: 28, transform: `translateY(${(1 - p(t, 1.1, 0.5, E.outCubic)) * 24}px)`}}>{S.supporting}</div>
      </div>
      <div style={{position: 'absolute', left: 64, right: 64, top: 1180, textAlign: 'center', fontFamily: cf, fontWeight: set.caption.weight ?? 900, fontSize: 70, color: '#fff', WebkitTextStroke: '10px rgba(8,8,20,0.9)', paintOrder: 'stroke fill', lineHeight: 1.1}}>
        {S.caption!.map((w, i) => { const a = p(t, 1.6 + i * 0.16, 0.22, E.outCubic); return <span key={i} style={{display: 'inline-block', marginRight: '0.27em', color: i === 4 ? accent : '#fff', opacity: a, transform: `translateY(${(1 - a) * 14}px)`}}>{w}</span>; })}
      </div>
      <div style={{position: 'absolute', left: 48, top: 64, display: 'flex', gap: 14, alignItems: 'center'}}>{n != null ? <div style={{minWidth: 54, height: 54, borderRadius: 27, background: '#E8512A', color: '#fff', fontFamily: uf, fontWeight: 800, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', boxSizing: 'border-box'}}>{n}</div> : null}<div style={{fontFamily: uf, fontWeight: 700, fontSize: 32, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '10px 18px', borderRadius: 12}}>{set.name}</div></div>
      <div style={{position: 'absolute', left: 48, bottom: 64, fontFamily: uf, fontSize: 26, color: '#ffffffcc', background: 'rgba(0,0,0,0.5)', padding: '8px 14px', borderRadius: 10}}>headline {set.headline.font} · supporting {set.supporting.font} · UI {set.ui.font} · captions {set.caption.font}</div>
    </AbsoluteFill>
  );
};
