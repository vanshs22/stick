import React from 'react';
import {C, F} from '../engine/tokens';
import {E, blink, mix, p, typed} from '../engine/anim';
import {useEnter} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {Zone} from './ui';

/** Types text letter by letter from its anchor. props: text, anchor, cps (28), mono (true), size (52). */
export const Typewriter: React.FC<ShotProps> = ({shot, text = '', anchor, cps = 28, mono = true, size = 52}) => {
  const {lt, start, vis} = useEnter(shot, anchor, 0.2);
  return (
    <Zone>
      <div style={{opacity: vis, fontFamily: mono ? F.mono : F.sans, fontWeight: 600, fontSize: size, color: C.ink, lineHeight: 1.35, maxWidth: 900, whiteSpace: 'pre-wrap'}}>
        {typed(String(text), lt, start, cps)}
        <span style={{opacity: blink(lt), color: C.accent}}>|</span>
      </div>
    </Zone>
  );
};

/** A verdict stamp that slams in. props: text, anchor, color (accent), rotate (-8), size (120). */
export const Stamp: React.FC<ShotProps> = ({shot, text = 'VERIFIED', anchor, color, rotate = -8, size = 120}) => {
  const {lt, start, vis} = useEnter(shot, anchor, 0.2);
  const k = p(lt, start, 0.22, E.outExpo), col = color || C.bad;
  return (
    <Zone>
      <div style={{opacity: vis * k, transform: `rotate(${rotate}deg) scale(${mix(2.6, 1, k)})`, border: `14px solid ${col}`, borderRadius: 26, padding: '14px 44px', color: col, fontFamily: F.sans, fontWeight: 900, fontSize: size, letterSpacing: '0.04em', textTransform: 'uppercase'}}>{text}</div>
    </Zone>
  );
};

/** A sentence where one word gets a marker swipe. props: text, mark (the word), anchor (when the swipe starts), size (84). */
export const Highlight: React.FC<ShotProps> = ({shot, text = '', mark = '', anchor, size = 84}) => {
  const {lt, start, vis} = useEnter(shot, undefined, 0.1);
  const a = p(lt, anchor && anchor in shot.anchors ? shot.anchors[anchor] - shot.start : start + 0.5, 0.45, E.outExpo);
  return (
    <Zone>
      <div style={{opacity: vis, fontFamily: F.sans, fontWeight: 800, fontSize: size, lineHeight: 1.18, color: C.ink, textAlign: 'center', letterSpacing: '-0.02em'}}>
        {String(text).split(' ').map((w, i) => {
          const hit = w.replace(/[^\w']/g, '').toLowerCase() === String(mark).toLowerCase();
          return (
            <span key={i} style={{position: 'relative', display: 'inline-block', marginRight: '0.25em'}}>
              {hit ? <span style={{position: 'absolute', left: -8, bottom: 4, height: '46%', width: `${a * 108}%`, background: C.accentSoft, zIndex: 0, borderRadius: 8}} /> : null}
              <span style={{position: 'relative', zIndex: 1, color: hit ? C.accent : C.ink}}>{w}</span>
            </span>
          );
        })}
      </div>
    </Zone>
  );
};

/** A list whose items pop in one by one. props: items[], anchorPrefix ("item" -> anchors item0, item1...), size (62). Items without an anchor appear 0.55 s apart. */
export const KineticList: React.FC<ShotProps> = ({shot, items = [], anchorPrefix = 'item', size = 62}) => {
  const {lt, d} = useEnter(shot, undefined, 0);
  return (
    <Zone>
      <div style={{display: 'flex', flexDirection: 'column', gap: 26, width: 900}}>
        {(items as string[]).map((it, i) => {
          const s = anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.2 + i * 0.55, a = p(lt, s, 0.4, E.outBack), out = p(lt, d - 0.3, 0.25, E.inCubic);
          return (
            <div key={i} style={{opacity: Math.min(1, a * 1.5) * (1 - out), transform: `translateX(${(1 - a) * -80}px)`, display: 'flex', alignItems: 'center', gap: 24, fontFamily: F.sans, fontWeight: 700, fontSize: size, color: C.ink}}>
              <div style={{width: 20, height: 20, borderRadius: 10, background: C.accent, flex: 'none'}} />
              {it}
            </div>
          );
        })}
      </div>
    </Zone>
  );
};
