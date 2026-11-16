import React from 'react';
import {AbsoluteFill} from 'remotion';
import gsap from 'gsap';
import {C, F} from '../engine/tokens';
import {atLocal, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {Zone} from './ui';

/**
 * A flow diagram animated with GSAP, driven by the Remotion frame (the timeline is built once, paused, and SEEKED every frame).
 * props: nodes ["Read files","Write code","Check"], anchorPrefix ('n' -> anchors n0, n1, ...), title
 * Each node pops on its spoken word, the arrow into it draws just before.
 */
export const FlowDiagram: React.FC<ShotProps & {nodes: string[]; anchorPrefix?: string; title?: string}> = ({shot, nodes, anchorPrefix = 'n', title}) => {
  const {lt} = useShotTime(shot);
  const ids = nodes.map((_, i) => `fd-${shot.id}-${i}`), at = nodes.map((_, i) => atLocal(shot, `${anchorPrefix}${i}`, 0.3 + i * 0.7));
  const ref = React.useRef<HTMLDivElement>(null), tlRef = React.useRef<any>(null);
  // the timeline is built AFTER the elements exist (GSAP resolves selectors when it creates tweens), paused, then seeked by the Remotion frame
  React.useLayoutEffect(() => {
    if (!tlRef.current) {
      const t = gsap.timeline({paused: true}), q = (s: string) => ref.current!.querySelector(s);
      nodes.forEach((_, i) => { t.fromTo(q(`#${ids[i]}`), {scale: 0.6, opacity: 0, y: 24}, {scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.7)'}, at[i]); if (i) t.fromTo(q(`#${ids[i]}-arrow`), {scaleY: 0, opacity: 0}, {scaleY: 1, opacity: 1, duration: 0.3, ease: 'power2.out'}, Math.max(0, at[i] - 0.25)); });
      tlRef.current = t;
    }
    tlRef.current.pause(); tlRef.current.time(lt, false);
  }, [lt]);
  return (
    <Zone>
      <div ref={ref} style={{width: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
        {title ? <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.muted, letterSpacing: '0.08em', marginBottom: 26, textTransform: 'uppercase'}}>{title}</div> : null}
        {nodes.map((n, i) => (
          <React.Fragment key={i}>
            {i ? <div id={`${ids[i]}-arrow`} style={{width: 6, height: 56, background: C.accent, borderRadius: 3, transformOrigin: 'top', opacity: 0}} /> : null}
            <div id={ids[i]} style={{opacity: 0, width: 760, padding: '26px 34px', borderRadius: 26, background: C.card, border: `3px solid ${C.accent}`, boxShadow: '0 14px 40px rgba(0,0,0,0.18)', fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: C.ink, display: 'flex', alignItems: 'center', gap: 22}}><span style={{fontFamily: F.mono, fontSize: 34, color: C.accent}}>{i + 1}</span>{n}</div>
          </React.Fragment>
        ))}
      </div>
    </Zone>
  );
};
