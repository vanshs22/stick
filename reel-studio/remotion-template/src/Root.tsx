import React from 'react';
import {AbsoluteFill, Composition, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import timeline from './data/timeline.json';
import type {Timeline} from './engine/types';
import {C} from './engine/tokens';
import {ShotRouter} from './engine/ShotRouter';
import {Captions} from './engine/Captions';
import {SafeZones} from './engine/SafeZones';
import {Transition} from './engine/Transition';
import {Effects} from './engine/Effects';
import {Sheet, sheetHeight} from './Sheets';
import {CaptionDemo, TypeDemo} from './Demos';
import {Presenter} from './engine/Presenter';
import {BGS, PRESENTER} from './engine/tokens';

const TL = timeline as unknown as Timeline;
const fr = (s: number) => Math.round(s * TL.fps);

const bgOf = (s?: string) => (s ? BGS[s] || s : undefined);
/** the persistent host: one Presenter, its pose/mood follow the active shot (shot.presenter) */
const PresenterLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / TL.fps, sh = TL.shots.find((s) => t >= s.start && t < s.end);
  if (!sh || sh.presenter?.hidden || ['Scene3D', 'Stage3D'].includes(sh.component)) return null;
  const enter = Math.min(1, (t - sh.start) / 0.35);
  return <AbsoluteFill style={{opacity: enter, transform: `translateY(${(1 - enter) * 60}px)`}}><Presenter pose={sh.presenter?.pose || 'idle'} mood={sh.presenter?.mood || 'calm'} /></AbsoluteFill>;
};

export const Reel: React.FC<{captions: boolean; safeZones: boolean}> = ({captions, safeZones}) => (
  <AbsoluteFill style={{background: C.bg}}>
    {TL.shots.map((s, i) => (
      <Sequence key={s.id} name={`${s.id} ${s.component}`} from={fr(s.start)} durationInFrames={Math.max(1, fr(s.end) - fr(s.start))}>
        <Transition type={i ? TL.shots[i - 1].transition_out?.type : 'cut'}>
          {bgOf(s.bg) ? <AbsoluteFill style={{background: bgOf(s.bg)}} /> : null}
          <ShotRouter shot={s} />
        </Transition>
      </Sequence>
    ))}
    {PRESENTER ? <PresenterLayer /> : null}
    <Effects />
    <Captions timeline={TL} show={captions} />
    {TL.audio ? <Audio src={staticFile(TL.audio)} /> : null}
    {safeZones ? <SafeZones /> : null}
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
  <Composition id="Reel" component={Reel} durationInFrames={Math.max(1, fr(TL.duration))} fps={TL.fps} width={TL.width} height={TL.height} defaultProps={{captions: true, safeZones: false}} />
  <Composition id="Sheet" component={Sheet as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{kind: 'grid', title: 'Sheet', items: []} as any} calculateMetadata={({props}: any) => ({height: sheetHeight(props)})} />
  <Composition id="CaptionDemo" component={CaptionDemo as any} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{bg: '', timeline: TL, preset: 'word-pop', label: ''} as any} calculateMetadata={({props}: any) => ({durationInFrames: Math.round((props.dur || 4) * 30)})} />
  <Composition id="TypeDemo" component={TypeDemo as any} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{bg: '', set: {name: 'Default', headline: {font: 'Inter'}, supporting: {font: 'InstrumentSerif'}, ui: {font: 'JetBrainsMono'}, caption: {font: 'Inter'}}} as any} />
  </>
);
