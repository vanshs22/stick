import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, CHROME, F} from '../engine/tokens';
import {E, SPR, clamp, mix, p} from '../engine/anim';
import {useEnter} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {Pill, SHADOW, Win, Zone} from './ui';

const Folder: React.FC<{size?: number}> = ({size = 46}) => <svg width={size} height={size * 0.8} viewBox="0 0 46 37"><path d="M2 6a4 4 0 0 1 4-4h12l5 6h17a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#4A9DFF" /></svg>;

/** A folder listing (Finder style) with one row selected. props: title ("FILES"), items [names], select (index), anchor (when the selection lands), input (true = the selected row is an empty rename box). */
export const FileList: React.FC<ShotProps> = ({shot, title = 'FILES', items = [], select = -1, anchor, input = false}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.1, SPR.soft, 0.4), sel = p(lt, start + 0.3, 0.35, E.outBack);
  return (
    <Zone><div style={{width: 900, opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 50}px)`}}>
      <Win title={title} width={900} height={120 + (items as string[]).length * 112 + 20} dark={CHROME === 'glass'}>
        <div style={{padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 8}}>
          {(items as string[]).map((n, i) => { const on = i === select; return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 24, height: 96, padding: '0 28px', borderRadius: 16, fontFamily: F.sans, fontWeight: 700, fontSize: 46, color: CHROME === 'glass' ? '#fff' : C.ink, border: on ? `${mix(0, 4, sel)}px solid #FFD84A` : '4px solid transparent', background: on ? 'rgba(255,216,74,0.12)' : 'transparent'}}>
              <Folder />{on && input ? <span style={{opacity: Math.floor(lt * 2) % 2 ? 0.2 : 1}}>|</span> : n}</div>); })}
        </div>
      </Win>
    </div></Zone>
  );
};

/** A price list with the lines struck through one by one and a total. props: title, items [{name, price}], total, anchorPrefix ("i" -> i0,i1...), strike (true). */
export const Ledger: React.FC<ShotProps> = ({shot, title = 'What I pay for', items = [], total = '', anchorPrefix = 'i', strike = true}) => {
  const {a, out, lt} = useEnter(shot, undefined, 0.05);
  const I = items as {name: string; price: string}[];
  return (
    <Zone><div style={{width: 900, background: '#fff', borderRadius: CHROME === 'sticker' ? 16 : 30, border: CHROME === 'sticker' ? '4px solid #141413' : undefined, boxShadow: CHROME === 'sticker' ? '12px 12px 0 rgba(20,20,19,0.85)' : SHADOW, padding: '44px 56px', opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 50}px)`}}>
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18}}>{title}</div>
      {I.map((it, i) => { const s = anchorPrefix + i in shot.anchors ? shot.anchors[anchorPrefix + i] - shot.start : 0.5 + i * 0.5, k = strike ? p(lt, s, 0.3, E.outCubic) : 0; return (
        <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontWeight: 600, fontSize: 40, color: k > 0.5 ? C.muted : C.ink, padding: '12px 0', position: 'relative'}}><span>{it.name}</span><span>{it.price}</span>
          <div style={{position: 'absolute', left: 0, top: '52%', height: 5, background: C.bad, width: `${k * 100}%`, borderRadius: 3}} /></div>); })}
      {total ? <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '4px solid #141413', marginTop: 16, paddingTop: 16, fontFamily: F.mono, fontWeight: 800, fontSize: 44, color: C.ink}}><span>Total / month</span><span>{total}</span></div> : null}
    </div></Zone>
  );
};

/** A creator profile with a video grid. props: name, handle, stat ("169K subscribers"), tiles [{views}], highlight (tile index), badge ("9M VIEWS"), anchor. */
export const ProfileCard: React.FC<ShotProps> = ({shot, name = '', handle = '', stat = '', tiles = [], highlight = -1, badge = '', anchor}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.1), hl = p(lt, start + 0.5, 0.4, E.outBack), bd = p(lt, start + 0.8, 0.3, E.outBack);
  const T = (tiles as {views: string}[]), hue = [28, 200, 340, 120, 260, 50];
  return (
    <Zone><div style={{width: 760, borderRadius: CHROME === 'sticker' ? 18 : 40, background: CHROME === 'glass' ? 'rgba(10,16,60,0.78)' : '#111', boxShadow: SHADOW, padding: 30, opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 50}px) rotate(-1deg)`, position: 'relative', border: CHROME === 'sticker' ? '4px solid #141413' : undefined}}>
      <div style={{background: C.accent, borderRadius: 10, textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 64, color: '#fff', padding: '8px 0'}}>{name}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, margin: '22px 4px'}}><div style={{width: 84, height: 84, borderRadius: 42, background: '#fff', color: C.accent, fontFamily: F.sans, fontWeight: 900, fontSize: 56, textAlign: 'center', lineHeight: '84px'}}>{name.slice(0, 1)}</div>
        <div><div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 40, color: '#fff'}}>{name}</div><div style={{fontFamily: F.mono, fontSize: 24, color: '#9aa', display: 'flex', gap: 12}}>{handle}<span style={{border: hl > 0.5 && highlight < 0 ? '3px solid #FFD84A' : '3px solid transparent', borderRadius: 6, padding: '0 6px', color: '#fff'}}>{stat}</span></div></div></div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8}}>
        {T.slice(0, 6).map((t, i) => <div key={i} style={{height: 250, borderRadius: 8, background: `linear-gradient(160deg, hsl(${hue[i % 6]},55%,45%), hsl(${hue[i % 6] + 30},45%,22%))`, position: 'relative', border: i === highlight ? `${mix(0, 6, hl)}px solid #FFD84A` : '6px solid transparent', boxSizing: 'border-box'}}><span style={{position: 'absolute', left: 10, bottom: 8, fontFamily: F.sans, fontWeight: 700, fontSize: 24, color: '#fff'}}>{t.views}</span></div>)}
      </div>
      {badge ? <div style={{position: 'absolute', left: 160, bottom: 56, transform: `rotate(-6deg) scale(${mix(2, 1, clamp(bd))})`, opacity: clamp(bd * 2), background: '#FFD84A', color: '#141413', fontFamily: F.sans, fontWeight: 900, fontSize: 72, padding: '4px 28px', borderRadius: 8, border: '4px solid #141413'}}>{badge}</div> : null}
    </div></Zone>
  );
};

/** A GitHub-style repository page with the star count circled. props: repo ("owner/name"), description, stars ("105k"), forks, commits, anchor (when the circle is drawn). */
export const RepoCard: React.FC<ShotProps> = ({shot, repo = 'owner/project', description = '', stars = '', forks = '', commits = '', anchor}) => {
  const {a, out, lt, start} = useEnter(shot, anchor, 0.1, SPR.soft, 0.4), k = p(lt, start + 0.5, 0.6, E.outExpo), len = 520;
  return (
    <Zone><div style={{opacity: clamp(a * 1.6) * (1 - out), transform: `translateY(${(1 - a) * 50}px)`, position: 'relative'}}>
      <Win title={`github.com/${repo}`} width={940} height={640}>
        <div style={{padding: '30px 34px', fontFamily: F.sans, color: '#1f2328'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 36, fontWeight: 600}}>▣ <span style={{color: '#0969da'}}>{repo.split('/')[0]}</span> / <b style={{color: '#0969da'}}>{repo.split('/')[1]}</b><span style={{fontSize: 22, border: '1px solid #d0d7de', borderRadius: 20, padding: '2px 12px', fontWeight: 500}}>Public</span></div>
          <div style={{display: 'flex', gap: 14, marginTop: 24, fontSize: 28, fontWeight: 600}}>
            {['♡ Sponsor', '🔔 Notifications', `⑂ Fork ${forks}`].map((b) => <span key={b} style={{border: '1px solid #d0d7de', borderRadius: 10, padding: '8px 16px', background: '#f6f8fa'}}>{b}</span>)}
            <span style={{border: '1px solid #d0d7de', borderRadius: 10, padding: '8px 16px', background: '#f6f8fa'}}>★ Star <b>{stars}</b></span></div>
          <div style={{display: 'flex', gap: 24, marginTop: 30, alignItems: 'center'}}><span style={{background: '#1f883d', color: '#fff', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 28}}>{'<> Code ▾'}</span><span style={{fontSize: 26, color: '#57606a'}}>{commits} Commits</span></div>
          <div style={{fontSize: 36, fontWeight: 700, marginTop: 36}}>About</div><div style={{fontSize: 32, lineHeight: 1.4, marginTop: 10, color: '#24292f'}}>{description}</div>
        </div>
      </Win>
      <svg width={940} height={640} style={{position: 'absolute', left: 0, top: 0}}><ellipse cx={718} cy={220} rx={150} ry={44} fill="none" stroke="#E5322D" strokeWidth={8} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} transform="rotate(-3 718 220)" /></svg>
    </div></Zone>
  );
};

/** Closing card. props: headline, accent (word), cta ("Comment WORD"), handle. */
export const EndCard: React.FC<ShotProps> = ({shot, headline = '', accent = '', cta = '', handle = ''}) => {
  const {a, lt} = useEnter(shot, undefined, 0.05), words = String(headline).split(' ');
  return (
    <AbsoluteFill style={{background: `linear-gradient(170deg, ${C.bg}, ${C.accentSoft || C.bg})`, justifyContent: 'center', alignItems: 'center', paddingBottom: 220, opacity: clamp(a * 2)}}>
      <div style={{fontFamily: F.serif, fontSize: 124, textAlign: 'center', lineHeight: 1.05, color: C.ink, padding: '0 80px'}}>{words.map((w, i) => { const hi = w.toLowerCase().replace(/[^\w]/g, '') === String(accent).toLowerCase(); const k = p(lt, 0.15 + i * 0.08, 0.5, E.outExpo); return <span key={i} style={{display: 'inline-block', marginRight: '0.25em', opacity: k, transform: `translateY(${(1 - k) * 40}px)`, color: hi ? C.accent : C.ink, fontStyle: hi ? 'italic' : 'normal'}}>{w}</span>; })}</div>
      {cta ? <div style={{marginTop: 60, transform: `scale(${mix(0.7, 1, p(lt, 0.8, 0.4, E.outBack))})`}}><Pill tone="dark" size={54}>{cta}</Pill></div> : null}
      {handle ? <div style={{marginTop: 40, fontFamily: F.mono, fontWeight: 600, fontSize: 32, color: C.muted}}>{handle}</div> : null}
    </AbsoluteFill>
  );
};
