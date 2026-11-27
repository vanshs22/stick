import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, CARD, CHROME, DOCK, F, H, LANDSCAPE, LY, SAFE, W} from '../engine/tokens';

export const SHADOW = '0 1px 3px rgba(20,20,19,0.06), 0 14px 40px rgba(20,20,19,0.12), 0 40px 100px rgba(20,20,19,0.14)';

/** content area between style.json safe_zone.content_top and content_bottom; cards are designed for ~1000 px and shrink to fit a smaller zone (packs with a presenter or step labels) */
export const ZoneCtx = React.createContext({k: 1, cx: 0, cy: 0, w: 0, h: 0});
/** `w`,`h`: the natural size of the card inside (default LY.box). Portrait shrinks a card to fit; landscape also grows a card up to 1.15x to fill the zone. */
export const Zone: React.FC<{children: React.ReactNode; style?: React.CSSProperties; w?: number; h?: number}> = ({children, style, w = LY.box.w, h = LY.box.h}) => {
  const cb = SAFE.content_bottom - DOCK.v, zh = cb - SAFE.content_top, zw = W - SAFE.content_left - 60, k = Math.min(LANDSCAPE ? 1.3 : 1, zh / h, zw / w);
  CARD.v = {cx: SAFE.content_left + (W - SAFE.content_left) / 2, cy: (SAFE.content_top + cb) / 2, w: w * k, h: h * k};   // portrait too: an overlay with a role (place, or made by the director) docks to the drawn card
  return (
    <AbsoluteFill style={{top: SAFE.content_top, left: SAFE.content_left, width: 'auto', right: 0, height: 'auto', bottom: H - cb, justifyContent: 'center', alignItems: 'center', padding: '0 70px', ...style}}>
      <ZoneCtx.Provider value={{k, cx: SAFE.content_left + (W - SAFE.content_left) / 2, cy: (SAFE.content_top + cb) / 2, w, h}}><div data-lay="card" style={{transform: `scale(${k})`, transformOrigin: 'center center'}}>{children}</div></ZoneCtx.Provider>
    </AbsoluteFill>
  );
};

/** desktop window chrome. The pack's look (style.json "chrome") decides: clean | sticker (thick outline, hard shadow) | glass (dark translucent). */
export const Win: React.FC<{title?: string; width?: number; height?: number; dark?: boolean; children?: React.ReactNode; style?: React.CSSProperties}> = ({title = '', width = 900, height = 600, dark, children, style}) => {
  const sticker = CHROME === 'sticker', glass = CHROME === 'glass', isDark = dark || glass;
  const border = sticker ? '4px solid #141413' : `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)'}`;
  return (
    <div style={{width, height, borderRadius: sticker ? 18 : 30, overflow: 'hidden', background: glass ? 'rgba(10,16,60,0.93)' : isDark ? '#151517' : C.card, boxShadow: sticker ? '12px 12px 0 rgba(20,20,19,0.85)' : glass ? '0 20px 60px rgba(0,0,0,0.45)' : SHADOW, border, position: 'relative', backdropFilter: glass ? 'blur(14px)' : undefined, ...style}}>
      <div style={{height: 62, background: glass ? 'rgba(255,255,255,0.06)' : isDark ? '#1d1d20' : sticker ? '#EDEAE2' : '#F6F4EF', display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderBottom: sticker ? '4px solid #141413' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'}`}}>
        {(sticker ? ['#E5322D', '#cfcac0', '#fff'] : ['#FF5F57', '#FEBC2E', '#28C840']).map((c, i) => <div key={i} style={{width: 17, height: 17, borderRadius: 9, background: c, border: sticker ? '3px solid #141413' : undefined, boxSizing: 'border-box'}} />)}
        <div style={{flex: 1, textAlign: 'center', fontFamily: sticker ? F.mono : F.sans, fontWeight: 600, fontSize: 28, color: isDark ? '#9a9aa8' : C.muted, marginRight: 70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</div>
      </div>
      <div style={{position: 'absolute', top: 62, left: 0, right: 0, bottom: 0}}>{children}</div>
    </div>
  );
};

export const Pill: React.FC<{children: React.ReactNode; tone?: 'light' | 'accent' | 'dark'; size?: number}> = ({children, tone = 'light', size = 34}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', padding: `${size * 0.4}px ${size * 0.75}px`, borderRadius: 999, fontFamily: F.sans, fontWeight: 700, fontSize: size, whiteSpace: 'nowrap', background: tone === 'accent' ? C.accent : tone === 'dark' ? '#151517' : C.card, color: tone === 'light' ? C.ink : '#fff', boxShadow: SHADOW}}>{children}</div>
);

export const Skeleton: React.FC<{rows?: number}> = ({rows = 6}) => (
  <div style={{padding: 40, display: 'flex', flexDirection: 'column', gap: 22}}>
    {Array.from({length: rows}).map((_, i) => <div key={i} style={{height: 20, borderRadius: 10, width: `${95 - ((i * 23) % 50)}%`, background: C.accentSoft || '#eee'}} />)}
  </div>
);
