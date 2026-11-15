import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import style from '../data/style.json';
import {rnd} from './anim';

/** Atmosphere layer above the shots, below the captions. Controlled by style.json "effects": {grain, vignette, bokeh, rain, halftone, paper}. */
export const Effects: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = ((style as any).effects || {}) as Record<string, number | boolean>;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {fx.paper ? <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35), rgba(120,90,50,0.12))`, mixBlendMode: 'multiply'}} /> : null}
      {fx.dots ? <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(20,20,19,0.16) 1px, transparent 1.4px)', backgroundSize: '7px 7px', opacity: Number(fx.dots)}} /> : null}
      {fx.halftone ? <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(0,0,0,0.12) 1.5px, transparent 2px)', backgroundSize: '14px 14px', opacity: Number(fx.halftone)}} /> : null}
      {fx.bokeh ? Array.from({length: 16}).map((_, i) => {
        const x = rnd(i) * 1080, y = rnd(i + 30) * 1920, r = 22 + rnd(i + 60) * 64, ph = Math.sin(frame / 40 + i) * 0.5 + 0.5;
        return <div key={i} style={{position: 'absolute', left: x, top: y + Math.sin(frame / 90 + i) * 16, width: r, height: r, borderRadius: '50%', background: `hsla(${[330, 260, 210, 30, 180][i % 5]},85%,65%,${0.14 + 0.2 * ph})`, filter: 'blur(2px)'}} />;
      }) : null}
      {fx.rain ? Array.from({length: 40}).map((_, i) => {
        const x = rnd(i) * 1080, y = ((rnd(i + 9) * 1920 + frame * (30 + rnd(i) * 20)) % 2100) - 100;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 2, height: 46, background: 'rgba(200,220,255,0.35)', transform: 'rotate(8deg)'}} />;
      }) : null}
      {fx.grain ? (
        <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: Number(fx.grain), mixBlendMode: 'overlay'}}>
          <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 9} /></filter>
          <rect width="100%" height="100%" filter="url(#g)" />
        </svg>
      ) : null}
      {fx.vignette ? <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${Number(fx.vignette)}) 100%)`}} /> : null}
    </AbsoluteFill>
  );
};
