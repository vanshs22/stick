import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../engine/tokens';

export const SHADOW = '0 1px 3px rgba(20,20,19,0.06), 0 14px 40px rgba(20,20,19,0.12), 0 40px 100px rgba(20,20,19,0.14)';

/** centre column inside the safe zone (y 180-1380) */
export const Zone: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={{top: 180, bottom: 540, justifyContent: 'center', alignItems: 'center', padding: '0 70px', ...style}}>{children}</AbsoluteFill>
);

/** desktop window chrome. children fill the body. */
export const Win: React.FC<{title?: string; width?: number; height?: number; dark?: boolean; children?: React.ReactNode; style?: React.CSSProperties}> = ({title = '', width = 900, height = 600, dark, children, style}) => (
  <div style={{width, height, borderRadius: 30, overflow: 'hidden', background: dark ? '#151517' : C.card, boxShadow: SHADOW, border: `1px solid ${dark ? '#2a2a2e' : 'rgba(0,0,0,0.07)'}`, position: 'relative', ...style}}>
    <div style={{height: 62, background: dark ? '#1d1d20' : '#F6F4EF', display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderBottom: `1px solid ${dark ? '#2a2a2e' : 'rgba(0,0,0,0.07)'}`}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 17, height: 17, borderRadius: 9, background: c}} />)}
      <div style={{flex: 1, textAlign: 'center', fontFamily: F.sans, fontWeight: 600, fontSize: 23, color: dark ? '#8d8d95' : C.muted, marginRight: 70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</div>
    </div>
    <div style={{position: 'absolute', top: 62, left: 0, right: 0, bottom: 0}}>{children}</div>
  </div>
);

export const Pill: React.FC<{children: React.ReactNode; tone?: 'light' | 'accent' | 'dark'; size?: number}> = ({children, tone = 'light', size = 34}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', padding: `${size * 0.4}px ${size * 0.75}px`, borderRadius: 999, fontFamily: F.sans, fontWeight: 700, fontSize: size, whiteSpace: 'nowrap', background: tone === 'accent' ? C.accent : tone === 'dark' ? '#151517' : C.card, color: tone === 'light' ? C.ink : '#fff', boxShadow: SHADOW}}>{children}</div>
);

export const Skeleton: React.FC<{rows?: number}> = ({rows = 6}) => (
  <div style={{padding: 40, display: 'flex', flexDirection: 'column', gap: 22}}>
    {Array.from({length: rows}).map((_, i) => <div key={i} style={{height: 20, borderRadius: 10, width: `${95 - ((i * 23) % 50)}%`, background: C.accentSoft || '#eee'}} />)}
  </div>
);
