import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {fontFamily} from './engine/fonts';

/** Decision sheets: the user chooses by LOOKING. One still, numbered, readable on a phone. Data comes in as props (from tools/gallery.mjs etc.). */
const SANS = fontFamily('Inter'), MONO = fontFamily('JetBrainsMono'), SERIF = fontFamily('InstrumentSerif');
const INK = '#14161C', PAPER = '#F4F1EA', ACC = '#E8512A', MUTE = '#7A7A80';
type Item = {n?: number | string; name?: string; line?: string; imgs?: string[]; img?: string; tag?: string; facts?: {k: string; v: string}[]; swatches?: string[]; id?: string; lines?: string; cam?: string; why?: string; status?: string; letter?: string};
export type SheetProps = {kind: 'grid' | 'detail' | 'compare' | 'storyboard' | 'alts'; title: string; subtitle?: string; items: Item[]; cols?: number};
const src = (p: string) => (/^https?:|^data:/.test(p) ? p : staticFile(p));
const Badge: React.FC<{n: number | string; c?: string}> = ({n, c = ACC}) => <div style={{minWidth: 46, height: 46, padding: '0 12px', borderRadius: 23, background: c, color: '#fff', fontFamily: MONO, fontWeight: 800, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>{n}</div>;
const Head: React.FC<{title: string; sub?: string}> = ({title, sub}) => (
  <div style={{padding: '44px 48px 20px'}}><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 56, color: INK, letterSpacing: '-0.02em'}}>{title}</div>{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: MUTE, marginTop: 4}}>{sub}</div> : null}</div>
);
const Thumb: React.FC<{img: string; w: number; h: number; r?: number}> = ({img, w, h, r = 14}) => <div style={{width: w, height: h, borderRadius: r, overflow: 'hidden', background: '#d8d4ca', flex: 'none'}}><Img src={src(img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div>;

const Grid: React.FC<SheetProps> = ({items, cols = 2}) => {
  const w = (1080 - 96 - (cols - 1) * 20) / cols, nI = Math.max(1, Math.min(4, Math.max(...items.map((x) => (x.imgs || []).length), 1))), tw = (w - 32 - (nI - 1) * 8) / nI, th = Math.min(560, tw * 1.78);
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 20, padding: '0 48px'}}>
      {items.map((it, i) => (
        <div key={i} style={{width: w, background: '#fff', borderRadius: 22, padding: 16, boxShadow: '0 6px 24px rgba(0,0,0,0.08)', boxSizing: 'border-box'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}><Badge n={it.n ?? i + 1} /><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, color: INK, lineHeight: 1.1}}>{it.name}</div></div>
          <div style={{display: 'flex', gap: 8}}>{(it.imgs || []).slice(0, 4).map((im, k) => <Thumb key={k} img={im} w={tw} h={th} r={10} />)}</div>
          <div style={{fontFamily: SANS, fontSize: 20, color: MUTE, marginTop: 10, lineHeight: 1.25, height: 52, overflow: 'hidden'}}>{it.line}</div>
        </div>
      ))}
    </div>
  );
};
const Detail: React.FC<{it: Item; w: number}> = ({it, w}) => {
  const tw = (w - 2 * 10) / 2, th = tw * 1.78;
  return (
    <div style={{width: w}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}>{it.n != null ? <Badge n={it.n} /> : null}<div style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, color: INK, lineHeight: 1.05}}>{it.name}</div></div>
      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>{(it.imgs || []).slice(0, 4).map((im, k) => <Thumb key={k} img={im} w={tw} h={th} />)}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: INK, margin: '14px 0 10px', lineHeight: 1.15}}>{it.line}</div>
      {(it.facts || []).map((f, i) => <div key={i} style={{fontFamily: SANS, fontSize: 21, color: INK, marginBottom: 6, lineHeight: 1.25}}><b style={{fontFamily: MONO, fontSize: 17, color: ACC}}>{f.k.toUpperCase()} </b>{f.v}</div>)}
      <div style={{display: 'flex', gap: 8, marginTop: 8}}>{(it.swatches || []).map((c, i) => <div key={i} style={{width: 44, height: 44, borderRadius: 10, background: c, border: '2px solid #00000022'}} />)}</div>
    </div>
  );
};
const Storyboard: React.FC<SheetProps> = ({items}) => (
  <div style={{display: 'flex', flexWrap: 'wrap', gap: 18, padding: '0 40px'}}>
    {items.map((it, i) => (
      <div key={i} style={{width: 500, height: 540, background: '#fff', borderRadius: 18, padding: 14, boxSizing: 'border-box', display: 'flex', gap: 14, boxShadow: '0 4px 18px rgba(0,0,0,0.07)'}}>
        <Thumb img={it.img!} w={248} h={440} r={10} />
        <div style={{flex: 1, overflow: 'hidden'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}><Badge n={it.id!} c={it.status === 'approved' ? '#2E8B57' : it.status === 'rejected' || it.status === 'replace_requested' ? '#C94A3A' : ACC} /></div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 20, color: INK, lineHeight: 1.25, marginBottom: 8}}>"{it.lines}"</div>
          <div style={{fontFamily: MONO, fontSize: 15, color: ACC, lineHeight: 1.3, marginBottom: 6}}>{it.cam}</div>
          <div style={{fontFamily: SANS, fontSize: 16, color: MUTE, lineHeight: 1.3}}>{it.why}</div>
        </div>
      </div>
    ))}
  </div>
);
const Alts: React.FC<SheetProps> = ({items}) => {
  const n = items.length, w = (1080 - 96 - (n - 1) * 16) / n, h = w * 1.78;
  return (
    <div style={{display: 'flex', gap: 16, padding: '0 48px', alignItems: 'flex-start'}}>
      {items.map((it, i) => (
        <div key={i} style={{width: w}}><Thumb img={it.img!} w={w} h={h} /><div style={{display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 6px'}}><Badge n={it.letter!} /><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, color: INK}}>{it.name}</div></div><div style={{fontFamily: MONO, fontSize: 16, color: MUTE, lineHeight: 1.3}}>{it.cam}</div></div>
      ))}
    </div>
  );
};
export const Sheet: React.FC<SheetProps> = (p) => (
  <AbsoluteFill style={{background: PAPER}}>
    <Head title={p.title} sub={p.subtitle} />
    {p.kind === 'grid' ? <Grid {...p} /> : p.kind === 'detail' ? <div style={{padding: '0 48px'}}><Detail it={p.items[0]} w={984} /></div> : p.kind === 'compare' ? <div style={{display: 'flex', gap: 24, padding: '0 48px'}}>{p.items.slice(0, 2).map((it, i) => <Detail key={i} it={it} w={480} />)}</div> : p.kind === 'storyboard' ? <Storyboard {...p} /> : <Alts {...p} />}
  </AbsoluteFill>
);

/** sheets grow with their content: the composition height comes from here (see Root.tsx calculateMetadata) */
export const sheetHeight = (p: SheetProps): number => {
  const n = p.items?.length || 0;
  if (p.kind === 'grid') { const cols = p.cols || 2, w = (1080 - 96 - (cols - 1) * 20) / cols, nI = Math.max(1, Math.min(4, Math.max(...(p.items || []).map((x) => (x.imgs || []).length), 1))), tw = (w - 32 - (nI - 1) * 8) / nI, th = Math.min(560, tw * 1.78); return Math.max(1920, Math.round(190 + Math.ceil(n / cols) * (th + 150 + 20) + 40)); }
  if (p.kind === 'storyboard') return Math.max(1920, 190 + Math.ceil(n / 2) * 558 + 40);
  if (p.kind === 'detail') return 2200; if (p.kind === 'compare') return 2400;
  if (p.kind === 'alts') return 1180;
  return 1920;
};
