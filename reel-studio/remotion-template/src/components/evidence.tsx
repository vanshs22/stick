import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F, LANDSCAPE, LY} from '../engine/tokens';
import {E, SPR, clamp, mix, p} from '../engine/anim';
import {useEnter} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {SHADOW, Skeleton, Zone, ZoneCtx} from './ui';
import {CARD} from '../engine/tokens';

/** REAL proof: a captured screenshot, a slow zoom to the important region, a hand-drawn circle, and the source named. props: image (path in public/), source, caption, highlight {x,y,w,h} (fractions of the image), anchor (when the circle is drawn). */
/** tells the overlays where the PICTURE of a card is (landscape rows put text beside it): `off` = its centre relative to the row centre, in the card's own px */
const CardBox: React.FC<{w: number; h: number; off?: number}> = ({w, h, off = 0}) => { const z = React.useContext(ZoneCtx); if (z.k && LANDSCAPE) CARD.v = {cx: z.cx + off * z.k, cy: z.cy, w: w * z.k, h: h * z.k}; return null; };
export const ProofCard: React.FC<ShotProps & {imageSize?: [number, number]}> = ({shot, image, source = '', caption = '', highlight, anchor, imageSize}) => {
  const {a, out, lt, d, start} = useEnter(shot, anchor, 0.1, SPR.soft, 0.4);
  const H = highlight || {x: 0.1, y: 0.1, w: 0.5, h: 0.2}, ar = imageSize ? imageSize[0] / imageSize[1] : 0, W = LANDSCAPE && ar ? Math.round(Math.min(LY.proofW, LY.proofH * ar)) : LY.proofW, HH = LANDSCAPE && ar ? Math.round(W / ar) : LY.proofH,   // landscape: the card takes the picture's own shape, so the circle lands on what it circles
    zMax = Math.max(1, Math.min(1.45, 0.88 / H.w, 0.88 / H.h)), zoom = mix(1, zMax, p(lt, start + 0.2, Math.max(0.6, d - start - 0.6), E.inOut));
  const org = (c: number) => (zMax <= 1.001 ? 50 : Math.max(0, Math.min(1, (0.5 - c * zMax) / (1 - zMax))) * 100), cx = org(H.x + H.w / 2), cy = org(H.y + H.h / 2),   // origin that centres the highlight, never exposing the card edge
   ring = p(lt, start + 0.25, 0.6, E.outExpo), per = 2 * (H.w * W + H.h * HH) * 1.3;
  return (
    <Zone w={LANDSCAPE ? W + 60 + 470 : W} h={LANDSCAPE ? Math.max(HH, 300) : HH + (caption ? 90 : 0) + (source ? 40 : 0)}><div style={{opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 50}px)`, ...(LANDSCAPE ? {display: 'flex', alignItems: 'center', gap: 60} : {})}}>
      <CardBox w={W} h={HH} off={-(60 + 470) / 2} />
      <div style={{width: W, height: HH, borderRadius: 26, overflow: 'hidden', background: C.card, boxShadow: SHADOW, position: 'relative'}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${cx}% ${cy}%`}}>
          {image ? <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} /> : <Skeleton rows={10} />}
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${HH}`} style={{position: 'absolute', inset: 0}}>
            <ellipse cx={(H.x + H.w / 2) * W} cy={(H.y + H.h / 2) * HH} rx={(H.w * W) / 2 + 24} ry={(H.h * HH) / 2 + 20} fill="none" stroke="#E5322D" strokeWidth={8} strokeLinecap="round" strokeDasharray={per} strokeDashoffset={per * (1 - ring)} />
          </svg>
        </div>
      </div>
      {LANDSCAPE ? <div style={{width: 470, flex: 'none'}}>{caption ? <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 56, color: C.ink, lineHeight: 1.12}}>{caption}</div> : null}{source ? <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 34, color: C.muted, marginTop: 20, wordBreak: 'break-word'}}>source: {source}</div> : null}</div> : <>
      {caption ? <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 58, color: C.ink, textAlign: 'center', marginTop: 28}}>{caption}</div> : null}
      {source ? <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 30, color: C.muted, textAlign: 'center', marginTop: 10}}>source: {source}</div> : null}
    </>}
    </div></Zone>
  );
};

const redact = (text: string, words: string[]) => text.split(/(\s+)/).map((w, i) => words.some((r) => w.toLowerCase().includes(r.toLowerCase())) ? <span key={i} style={{background: '#111', color: '#111', borderRadius: 4}}>{w}</span> : <span key={i}>{w}</span>);

/** Evidence props. props: variant ("case-file" | "polaroid" | "ticket"), title, lines[], stamp, redact[] (words to black out), image (for polaroid), anchor. */
export const EvidenceCard: React.FC<ShotProps> = ({shot, variant = 'case-file', title = '', lines = [], stamp = '', redact: red = [], image, anchor}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.1, SPR.pop);
  const st = p(lt, start + 0.7, 0.2, E.outExpo), rot = variant === 'polaroid' ? -4 : variant === 'ticket' ? 2 : -1.5;
  const base: React.CSSProperties = {opacity: clamp(a * 1.6) * (1 - out), transform: `rotate(${rot}deg) translateY(${(1 - a) * 90}px) scale(${mix(0.9, 1, a)})`, boxShadow: SHADOW, position: 'relative'};
  const stampEl = stamp ? <div style={{position: 'absolute', right: 40, bottom: 60, border: '10px solid #C0281E', color: '#C0281E', fontFamily: F.sans, fontWeight: 900, fontSize: 84, padding: '6px 28px', borderRadius: 14, transform: `rotate(-12deg) scale(${mix(2.4, 1, st)})`, opacity: st}}>{stamp}</div> : null;
  if (LANDSCAPE && variant === 'polaroid') return <Zone w={1000} h={560}><div style={{...base, width: 1000, background: '#fff', padding: '36px 40px', display: 'flex', alignItems: 'center', gap: 50}}><div style={{width: 460, height: 460, background: '#222', overflow: 'hidden', flex: 'none'}}>{image ? <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg,#556,#889)'}} />}</div><div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 72, color: '#222', lineHeight: 1.1}}>{title}</div>{stampEl}</div></Zone>;
  if (LANDSCAPE && variant === 'ticket') return <Zone w={1100} h={380 + (lines as string[]).length * 64}><div style={{...base, width: 1100, background: '#F5E9C8', borderRadius: 26, padding: '40px 56px', borderLeft: '40px dotted #D4B96A'}}><div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 58, color: '#3a2a10'}}>{title}</div>{(lines as string[]).map((l, i) => <div key={i} style={{fontFamily: F.mono, fontWeight: 600, fontSize: 36, color: '#5a4524', marginTop: 14}}>{redact(l, red as string[])}</div>)}{stampEl}</div></Zone>;
  if (LANDSCAPE) return <Zone w={1100} h={420 + (lines as string[]).length * 70}><div style={{...base, width: 1100, minHeight: 480, background: '#EBD9A8', borderRadius: 12, padding: '40px 56px'}}><div style={{position: 'absolute', left: 0, top: -34, width: 300, height: 40, background: '#EBD9A8', borderRadius: '12px 12px 0 0'}} /><div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 46, color: '#3a2a10', letterSpacing: '0.06em', borderBottom: '4px solid #3a2a10', paddingBottom: 14}}>{title}</div>{(lines as string[]).map((l, i) => <div key={i} style={{fontFamily: F.mono, fontWeight: 600, fontSize: 36, color: '#4a3a1a', marginTop: 20, lineHeight: 1.3}}>{redact(l, red as string[])}</div>)}{stampEl}</div></Zone>;
  if (variant === 'polaroid') return <Zone w={700} h={900}><div style={{...base, width: 700, background: '#fff', padding: '40px 40px 150px'}}><div style={{width: 620, height: 620, background: '#222', overflow: 'hidden'}}>{image ? <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg,#556,#889)'}} />}</div><div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 64, color: '#222', marginTop: 28, textAlign: 'center'}}>{title}</div>{stampEl}</div></Zone>;
  if (variant === 'ticket') return <Zone w={900} h={700}><div style={{...base, width: 900, background: '#F5E9C8', borderRadius: 26, padding: '56px 60px', borderLeft: '40px dotted #D4B96A'}}><div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 66, color: '#3a2a10'}}>{title}</div>{(lines as string[]).map((l, i) => <div key={i} style={{fontFamily: F.mono, fontWeight: 600, fontSize: 40, color: '#5a4524', marginTop: 18}}>{redact(l, red as string[])}</div>)}{stampEl}</div></Zone>;
  return <Zone w={900} h={800}><div style={{...base, width: 900, minHeight: 760, background: '#EBD9A8', borderRadius: 12, padding: '60px 64px'}}><div style={{position: 'absolute', left: 0, top: -34, width: 300, height: 40, background: '#EBD9A8', borderRadius: '12px 12px 0 0'}} /><div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 52, color: '#3a2a10', letterSpacing: '0.06em', borderBottom: '4px solid #3a2a10', paddingBottom: 18}}>{title}</div>{(lines as string[]).map((l, i) => <div key={i} style={{fontFamily: F.mono, fontWeight: 600, fontSize: 40, color: '#4a3a1a', marginTop: 26, lineHeight: 1.3}}>{redact(l, red as string[])}</div>)}{stampEl}</div></Zone>;
};
