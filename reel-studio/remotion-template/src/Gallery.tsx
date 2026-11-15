import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './engine/tokens';
import {Captions} from './engine/Captions';
import type {Timeline} from './engine/types';

const LINE = ['The future', 'is already', 'here.'];
const TYPO: Record<string, {name: string; render: () => React.ReactNode}> = {
  cinematic: {name: 'Cinematic bold', render: () => <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 150, letterSpacing: '-0.05em', lineHeight: 0.95, color: C.ink, textTransform: 'uppercase'}}>{LINE[0]}<br /><span style={{color: C.accent}}>{LINE[1]}</span><br />{LINE[2]}</div>},
  editorial: {name: 'Editorial serif', render: () => <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 110, color: C.ink, lineHeight: 1.05}}>{LINE[0]}<br /><span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, color: C.accent, fontSize: 130}}>{LINE[1]}</span><br />{LINE[2]}</div>},
  'modern-ui': {name: 'Modern UI', render: () => <div><div style={{fontFamily: F.mono, fontSize: 30, fontWeight: 700, color: C.muted, letterSpacing: '0.1em'}}>// 01 · INTRO</div><div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 104, color: C.ink, lineHeight: 1.08}}>{LINE.join(' ')}</div></div>},
  terminal: {name: 'Terminal / tech', render: () => <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 84, color: C.ink, lineHeight: 1.2}}><span style={{color: C.accent}}>$ </span>{LINE.join(' ')}<span style={{color: C.accent}}>_</span></div>},
  typewriter: {name: 'Documentary typewriter', render: () => <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 76, color: C.ink, lineHeight: 1.3, textTransform: 'uppercase'}}>{LINE.join(' ')}.<br /><span style={{fontSize: 36, color: C.muted}}>NOV 24, 1971 · PORTLAND</span></div>},
};
const WORDS = ['This', 'free', 'tool', 'has', '40,000', 'stars'];
const fake = (preset: string): Timeline => ({fps: 30, width: 1080, height: 1920, duration: 4, style: 'gallery', audio: '', shots: [], words: [], captions: {preset, chunks: [{t0: 0, t1: 9, words: WORDS.map((w, i) => ({w, t: 0.05 + i * 0.12, hi: i === 4}))}]}});

/** Preview sheet for the style gate. kind: typography | captions | style. variant: a key above (typography), a preset (captions), or the pack JSON (style). */
export const Gallery: React.FC<{kind: string; variant: string; pack?: any}> = ({kind, variant, pack}) => {
  if (kind === 'typography') { const v = TYPO[variant] || TYPO.cinematic; return <AbsoluteFill style={{background: C.bg, justifyContent: 'center', padding: 80}}>{v.render()}<div style={{position: 'absolute', left: 80, bottom: 200, fontFamily: F.mono, fontSize: 34, color: C.muted}}>{v.name}</div></AbsoluteFill>; }
  if (kind === 'captions') return <AbsoluteFill style={{background: 'linear-gradient(160deg,#3b4a7a,#1b2038)'}}><div style={{position: 'absolute', left: 80, top: 300, fontFamily: F.mono, fontSize: 38, color: '#ffffffaa'}}>caption preset: {variant}</div><Captions timeline={fake(variant)} /></AbsoluteFill>;
  const col = pack?.tokens?.colors || C;
  return (
    <AbsoluteFill style={{background: col.bg, padding: 80, justifyContent: 'center', gap: 36}}>
      <div style={{fontFamily: F.mono, fontSize: 34, color: col.muted}}>{pack?.family} · {pack?.id}</div>
      <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 120, color: col.ink, lineHeight: 1}}>{pack?.name}</div>
      <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 60, color: col.accent}}>{String(pack?.description || '').slice(0, 90)}</div>
      <div style={{display: 'flex', gap: 18}}>{Object.entries(col).slice(0, 8).map(([k, v]) => <div key={k} style={{width: 90, height: 90, borderRadius: 20, background: String(v), border: '2px solid #00000022'}} />)}</div>
    </AbsoluteFill>
  );
};
