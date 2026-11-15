import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F} from '../engine/tokens';
import {E, SPR, blink, clamp, mix, p, sp, typed} from '../engine/anim';
import {atLocal, useEnter, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {Pill, SHADOW, Skeleton, Win, Zone} from './ui';

const swing = (a: number, out: number) => ({transform: `perspective(1800px) translateX(${(1 - a) * 220 - out * 260}px) rotateY(${(1 - a) * 30 - out * 36}deg) scale(${mix(0.92, 1, a)})`, opacity: clamp(a * 1.8) * (1 - out)});

/** A browser window that swings in, showing a real screenshot. props: url, title, image (path inside public/, e.g. "assets/repo.png"), anchor, zoom ({x,y,scale} fractions: slow push toward that spot). */
export const BrowserWindow: React.FC<ShotProps> = ({shot, url = '', title, image, anchor, zoom}) => {
  const {a, out, lt, d} = useEnter(shot, anchor, 0.1, SPR.soft, 0.4);
  const z = zoom ? mix(1, zoom.scale || 1.5, p(lt, 0.6, Math.max(0.5, d - 1), E.inOut)) : 1, ox = zoom ? `${(zoom.x ?? 0.5) * 100}% ${(zoom.y ?? 0.5) * 100}%` : '50% 50%';
  return (
    <Zone><div style={swing(a, out)}>
      <Win title={title || url} width={940} height={1000}>
        {image ? <div style={{width: '100%', height: '100%', overflow: 'hidden'}}><Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transform: `scale(${z})`, transformOrigin: ox}} /></div> : <Skeleton rows={9} />}
      </Win>
    </div></Zone>
  );
};

/** A terminal that types commands. props: lines[] (a line starting with ">" is output, shown at once), prompt ("$"), anchor, cps (30). */
export const Terminal: React.FC<ShotProps> = ({shot, lines = [], prompt = '$', anchor, cps = 30}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.25, SPR.soft, 0.4);
  let t0 = start; const rows: React.ReactNode[] = [];
  (lines as string[]).forEach((ln, i) => {
    const isOut = ln.startsWith('>'), txt = isOut ? ln.slice(1).trim() : ln, dur = isOut ? 0.01 : txt.length / cps + 0.25, shown = isOut ? (lt >= t0 ? txt : '') : typed(txt, lt, t0, cps);
    if (lt >= t0 || i === 0) rows.push(<div key={i} style={{color: isOut ? '#9aa0aa' : '#f2f2f2', minHeight: 50}}>{isOut ? '' : <span style={{color: C.accent}}>{prompt} </span>}{shown}{i === (lines as string[]).length - 1 || (lt < t0 + dur) ? <span style={{opacity: blink(lt), color: '#f2f2f2'}}>▌</span> : null}</div>);
    t0 += dur;
  });
  return <Zone><div style={swing(a, out)}><Win dark title="terminal" width={940} height={620}><div style={{padding: '34px 40px', fontFamily: F.mono, fontWeight: 600, fontSize: 40, lineHeight: 1.35}}>{rows}</div></Win></div></Zone>;
};

/** A phone showing a post or a screenshot. props: title, text, image, likes (number that counts up), anchor. */
export const PhoneFrame: React.FC<ShotProps> = ({shot, title = '', text = '', image, likes = 0, anchor}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.1, SPR.pop);
  const n = Math.round(Number(likes) * p(lt, start + 0.5, 1.2, E.outExpo));
  return (
    <Zone><div style={{transform: `scale(${mix(0.85, 1, a)}) rotate(${(1 - a) * -4}deg)`, opacity: clamp(a * 1.6) * (1 - out)}}>
      <div style={{width: 520, height: 1000, borderRadius: 78, background: '#111', padding: 16, boxShadow: SHADOW, position: 'relative'}}>
        <div style={{width: '100%', height: '100%', borderRadius: 64, background: C.bg, overflow: 'hidden', position: 'relative'}}>
          {image ? <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{padding: '90px 40px'}}><div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 40, color: C.ink}}>{title}</div><div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 52, marginTop: 28, color: C.accent, lineHeight: 1.15}}>{text}</div></div>}
          {Number(likes) > 0 ? <div style={{position: 'absolute', right: 24, bottom: 40}}><Pill>♥ {n.toLocaleString('en-US')}</Pill></div> : null}
        </div>
      </div>
    </div></Zone>
  );
};

/** A chat. props: messages [{from:"you"|"ai", text}], anchorPrefix ("m" -> anchors m0, m1...). Without anchors messages appear 0.8 s apart. */
export const ChatBubbles: React.FC<ShotProps> = ({shot, messages = [], anchorPrefix = 'm'}) => {
  const {lt, d} = useEnter(shot, undefined, 0);
  return (
    <Zone><div style={{width: 920, display: 'flex', flexDirection: 'column', gap: 26}}>
      {(messages as {from: string; text: string}[]).map((m, i) => {
        const s = anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.2 + i * 0.8, a = p(lt, s, 0.4, E.outBack), out = p(lt, d - 0.3, 0.25, E.inCubic), me = m.from === 'you';
        return <div key={i} style={{alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: 760, opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 40}px) scale(${mix(0.9, 1, a)})`, background: me ? C.accent : C.card, color: me ? '#fff' : C.ink, padding: '24px 34px', borderRadius: 38, fontFamily: F.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.25, boxShadow: SHADOW}}>{m.text}</div>;
      })}
    </div></Zone>
  );
};

/** Ruled notebook page with a title and bullets (calm explainer look). props: title, bullets[], anchorPrefix ("b"). */
export const NotebookPage: React.FC<ShotProps> = ({shot, title = '', bullets = [], anchorPrefix = 'b'}) => {
  const {a, out, lt} = useEnter(shot, undefined, 0.05);
  return (
    <Zone><div style={{width: 900, minHeight: 980, background: '#FFFEFA', borderRadius: 14, boxShadow: SHADOW, padding: '70px 70px 60px 110px', position: 'relative', opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 60}px) rotate(${-0.6}deg)`, backgroundImage: 'repeating-linear-gradient(transparent 0 79px, #E6EEF7 79px 81px)'}}>
      <div style={{position: 'absolute', left: 80, top: 0, bottom: 0, width: 3, background: '#F2B8B0'}} />
      <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 92, color: C.ink, marginBottom: 30}}>{title}</div>
      {(bullets as string[]).map((b, i) => {
        const s = anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.5 + i * 0.6, k = p(lt, s, 0.4, E.outCubic);
        return <div key={i} style={{fontFamily: F.sans, fontWeight: 600, fontSize: 50, lineHeight: '81px', color: C.ink2 || C.ink, opacity: k, transform: `translateX(${(1 - k) * -30}px)`}}><span style={{color: C.accent, marginRight: 18}}>•</span>{b}</div>;
      })}
    </div></Zone>
  );
};

/** The "Comment WORD" call to action: types the keyword, then flips to Posted. props: keyword, anchor, reward ("and I'll send you the link"). */
export const CommentBox: React.FC<ShotProps> = ({shot, keyword = 'GUIDE', anchor, reward = "and I'll send you the link"}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.2, SPR.pop);
  const typedKw = typed(String(keyword), lt, start + 0.2, 9), done = lt > start + 0.2 + String(keyword).length / 9 + 0.35, k = p(lt, start + 0.2 + String(keyword).length / 9 + 0.35, 0.3, E.outBack);
  return (
    <Zone><div style={{opacity: clamp(a * 1.6) * (1 - out), transform: `scale(${mix(0.9, 1, a)})`, width: 900}}>
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: C.muted, marginBottom: 22, textTransform: 'uppercase', letterSpacing: '0.08em'}}>comment</div>
      <div style={{background: done ? C.accent : C.card, borderRadius: 80, padding: '34px 50px', boxShadow: SHADOW, display: 'flex', alignItems: 'center', gap: 22, fontFamily: F.sans, fontWeight: 800, fontSize: 84, color: done ? '#fff' : C.ink, transform: `scale(${done ? mix(1.06, 1, k) : 1})`}}>
        {done ? '✓ Posted' : <>{typedKw}<span style={{opacity: blink(lt), color: C.accent}}>|</span></>}
      </div>
      <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 62, color: C.ink, marginTop: 34, textAlign: 'center'}}>{reward}</div>
    </div></Zone>
  );
};
