import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {CHARACTERS, spriteFor} from '../engine/character-map';
import {talkAt} from '../engine/time';
import {C, F, H, W} from '../engine/tokens';
import {E, p} from '../engine/anim';
import {useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';

/** Face-cam + overlay: a rounded face sheet fills the lower part of the frame (your clip, or a placeholder until footage exists) and a bordered card sits above it.
 *  props: mode 'split' (card above face) | 'card' (card grows, face hidden) | 'face' (face only), card {title, lines[]}, chip {n, total, label, color}, zoom (face punch-in 1..1.4), faceLabel (placeholder text) */
export const FaceCam: React.FC<ShotProps> = ({shot, mode = 'split', card = {}, chip, zoom = 1.12, faceLabel = 'your face-cam footage', character, pose = 'open', mood = 'calm'}) => {
  const f0 = useCurrentFrame();
  const {lt, d} = useShotTime(shot), enter = p(lt, 0, 0.35, E.outExpo), k = 1 + (zoom - 1) * p(lt, 0, d, E.inOutSoft), col = chip?.color || C.accent;
  const cardTop = mode === 'card' ? 195 : 155, cardH = mode === 'card' ? 625 : 385, faceTop = mode === 'card' ? H : mode === 'face' ? 0 : 560, sx = W / 720, sy = H / 1280;
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: faceTop * sy, bottom: 0, borderRadius: mode === 'face' ? 0 : 50 * sx, overflow: 'hidden', background: 'linear-gradient(160deg,#3a3633,#1b1917)'}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${k})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontFamily: F.mono, fontSize: 30 * sx, letterSpacing: '0.12em', textTransform: 'uppercase'}}>{character && CHARACTERS.includes(character) ? null : faceLabel}</div>
        {character && CHARACTERS.includes(character) ? <Img src={staticFile(`characters/${character}/${spriteFor(pose, mood, talkAt(f0 / 30) > 0.25)}.png`)} style={{position: 'absolute', left: '50%', bottom: 0, width: 960 * sx, transformOrigin: '50% 100%', transform: `translateX(-50%) scale(${k})`}} /> : null}
      </div>
      {mode !== 'face' ? (
        <div style={{position: 'absolute', left: 40 * sx, right: 40 * sx, top: cardTop * sy, height: cardH * sy, opacity: enter, transform: `translateY(${(1 - enter) * 40}px) scale(${0.96 + 0.04 * enter})`, background: C.card, border: `${6 * sx}px solid ${col}`, borderRadius: 30 * sx, boxShadow: '0 0 0 6px #000, 0 24px 60px rgba(0,0,0,0.25)', padding: `${28 * sy}px ${34 * sx}px`, overflow: 'hidden'}}>
          {card.title ? <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 44 * sx, color: C.ink, marginBottom: 18 * sy}}>{card.title}</div> : null}
          {(card.lines || []).map((l: string, i: number) => <div key={i} style={{fontFamily: F.mono, fontSize: 28 * sx, color: C.ink2, background: '#F1EFE9', borderRadius: 10 * sx, padding: `${8 * sy}px ${14 * sx}px`, marginBottom: 10 * sy, opacity: p(lt, 0.15 + i * 0.12, 0.25, E.outCubic)}}>{l}</div>)}
        </div>
      ) : null}
      {chip && mode !== 'face' ? <div style={{position: 'absolute', left: 54 * sx, top: (cardTop - 78) * sy, background: '#fff', borderRadius: 40, padding: `${8 * sy}px ${22 * sx}px`, fontFamily: F.sans, fontWeight: 800, fontSize: 28 * sx, color: C.ink, display: 'flex', alignItems: 'center', gap: 12 * sx, boxShadow: '0 4px 14px rgba(0,0,0,0.18)'}}><i style={{width: 16 * sx, height: 16 * sx, borderRadius: 16, background: col}} />{chip.n}/{chip.total} {chip.label}</div> : null}
    </AbsoluteFill>
  );
};
