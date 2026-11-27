import React from 'react';
import {AbsoluteFill, Composition, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Audio} from '@remotion/media';
import timeline from './data/timeline.json';
import type {Timeline, Shot} from './engine/types';
import {C} from './engine/tokens';
import {ShotRouter} from './engine/ShotRouter';
import {Captions} from './engine/Captions';
import {SafeZones} from './engine/SafeZones';
import {Transition} from './engine/Transition';
import {Effects} from './engine/Effects';
import {Sheet, sheetHeight} from './Sheets';
import {CaptionDemo, TypeDemo} from './Demos';
import {Presenter} from './engine/Presenter';
import {BGS, H, LANDSCAPE, PRESENTER, SAFE, W} from './engine/tokens';

const TL = timeline as unknown as Timeline;
const fr = (s: number) => Math.round(s * TL.fps);

const bgOf = (s?: string) => (s ? BGS[s] || s : undefined);
/** the persistent host: one Presenter, its pose/mood follow the active shot (shot.presenter) */
const PresenterLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / TL.fps, sh = TL.shots.find((s) => t >= s.start && t < s.end);
  if (!sh || sh.presenter?.hidden || ['Scene3D', 'Stage3D'].includes(sh.component)) return null;
  // the host fades in once (film start, or after a shot without a host); between host shots it stays put
  const i = TL.shots.indexOf(sh), pv = i > 0 ? TL.shots[i - 1] : null, carried = pv && !pv.presenter?.hidden && !['Scene3D', 'Stage3D'].includes(pv.component);
  const enter = carried ? 1 : Math.min(1, (t - sh.start) / 0.35);
  return <AbsoluteFill style={{opacity: enter, transform: `translateY(${(1 - enter) * 60}px)`}}><Presenter pose={sh.presenter?.pose || 'idle'} mood={sh.presenter?.mood || 'calm'} look={sh.presenter?.look} /></AbsoluteFill>;
};

/** a real photo behind a shot: cover-fit, slow push-in (ken-burns), optional blur, a scrim so text and cards stay readable */
const BgImage: React.FC<{b: NonNullable<Shot['bgImage']>}> = ({b}) => {
  const f = useCurrentFrame(), {durationInFrames} = useVideoConfig(), z = interpolate(f, [0, durationInFrames], [1.04, b.zoom ?? 1.14], {extrapolateRight: 'clamp'}), [fx, fy] = b.focus || [0.5, 0.5];
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img src={staticFile(b.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${z})${b.flip ? ' scaleX(-1)' : ''}`, filter: b.blur ? `blur(${b.blur}px)` : undefined}} />
    {/* scrim 'dark' (default) for light text, 'light' for packs whose ink is dark: the card text must stay readable on the photo */}
    <AbsoluteFill style={{background: b.scrim === 'light' ? `linear-gradient(180deg, rgba(255,255,255,${(b.dim ?? 0.5) + 0.1}) 0%, rgba(255,255,255,${b.dim ?? 0.5}) 50%, rgba(255,255,255,${(b.dim ?? 0.5) + 0.15}) 100%)` : `linear-gradient(180deg, rgba(0,0,0,${(b.dim ?? 0.35) + 0.15}) 0%, rgba(0,0,0,${b.dim ?? 0.35}) 45%, rgba(0,0,0,${(b.dim ?? 0.35) + 0.25}) 100%)`}} />
  </AbsoluteFill>;
};

/** Layout probe (critics): measures where text, cards and captions really landed in THIS frame and logs it as one JSON line (remotion still --log=verbose --props '{"probe":true}'). */
const LayoutProbe: React.FC = () => {
  const [h] = React.useState(() => delayRender('layout-probe'));
  React.useEffect(() => {
    // measure after the page has laid out (the first commit can run before Remotion has sized the frame)
    const t = setTimeout(() => {
      const root = document.querySelector('[data-lay=root]') as HTMLElement, org = root.getBoundingClientRect(), ox = org.left, oy = org.top;
      const eff = (e: Element | null) => { let o = 1; for (let n = e; n && n !== document.body; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
      const box = (e: Element) => { let r = e.getBoundingClientRect(), l = r.left, t = r.top, rt = r.right, b = r.bottom; for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.overflow !== 'visible' && n.getAttribute('data-lay') !== 'root') { const q = n.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rt = Math.min(rt, q.right); b = Math.min(b, q.bottom); } } /* a zoomed picture inside an overflow:hidden frame is only seen where the frame is */ return {x: Math.round(l - ox), y: Math.round(t - oy), w: Math.max(0, Math.round(rt - l)), h: Math.max(0, Math.round(b - t)), o: +eff(e).toFixed(2)}; };
      const leaves = (sel: string) => Array.from(document.querySelectorAll(sel)).flatMap((rt) => Array.from(rt.querySelectorAll('*')).filter((e) => (e.children.length === 0 && (e.textContent || '').trim().length > 0) || e.tagName.toLowerCase() === 'img').map((e) => ({t: (e.textContent || '').trim().slice(0, 40), ...box(e)})).filter((r) => r.w > 2 && r.h > 2 && r.o > 0.5));
      const card = Array.from(document.querySelectorAll('[data-lay=card]')).map(box).filter((r) => r.o > 0.5);
      console.log('__LAYOUT__' + JSON.stringify({dbg: {ox: Math.round(ox), oy: Math.round(oy), ow: Math.round(org.width), oh: Math.round(org.height)}, W, H, safe: SAFE, landscape: LANDSCAPE, card, cardText: leaves('[data-lay=card]'), overlay: leaves('[data-lay=overlay]'), caption: leaves('[data-lay=caption]')}));
      continueRender(h);
    }, 350);
    return () => clearTimeout(t);
  }, [h]);
  return null;
};

export const Reel: React.FC<{captions: boolean; safeZones: boolean; probe?: boolean}> = ({captions, safeZones, probe}) => (
  <AbsoluteFill data-lay="root" style={{background: C.bg}}>
    {probe ? <LayoutProbe /> : null}
    {TL.shots.map((s, i) => (
      <Sequence key={s.id} name={`${s.id} ${s.component}`} from={fr(s.start)} durationInFrames={Math.max(1, fr(s.end) - fr(s.start))}>
        <Transition type={i ? TL.shots[i - 1].transition_out?.type : 'cut'}>
          {bgOf(s.bg) ? <AbsoluteFill style={{background: bgOf(s.bg)}} /> : null}
          {s.bgImage ? <BgImage b={s.bgImage} /> : null}
          <ShotRouter shot={s} />
        </Transition>
      </Sequence>
    ))}
    {PRESENTER ? <PresenterLayer /> : null}
    <Effects />
    <div data-lay="caption" style={{position: 'absolute', inset: 0}}><Captions timeline={TL} show={captions} /></div>
    {TL.audio ? <Audio src={staticFile(TL.audio)} /> : null}
    {safeZones ? <SafeZones /> : null}
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
  <Composition id="Reel" component={Reel} durationInFrames={Math.max(1, fr(TL.duration))} fps={TL.fps} width={TL.width} height={TL.height} defaultProps={{captions: true, safeZones: false, probe: false}} />
  <Composition id="Sheet" component={Sheet as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{kind: 'grid', title: 'Sheet', items: []} as any} calculateMetadata={({props}: any) => ({height: sheetHeight(props)})} />
  <Composition id="CaptionDemo" component={CaptionDemo as any} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{bg: '', timeline: TL, preset: 'word-pop', label: ''} as any} calculateMetadata={({props}: any) => ({durationInFrames: Math.round((props.dur || 4) * 30)})} />
  <Composition id="TypeDemo" component={TypeDemo as any} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{bg: '', set: {name: 'Default', headline: {font: 'Inter'}, supporting: {font: 'InstrumentSerif'}, ui: {font: 'JetBrainsMono'}, caption: {font: 'Inter'}}} as any} />
  </>
);
