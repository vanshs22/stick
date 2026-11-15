import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import timeline from './data/timeline.json';
import type {Timeline} from './engine/types';
import {C} from './engine/tokens';
import {ShotRouter} from './engine/ShotRouter';
import {Captions} from './engine/Captions';
import {SafeZones} from './engine/SafeZones';

const TL = timeline as unknown as Timeline;
const fr = (s: number) => Math.round(s * TL.fps);

export const Reel: React.FC<{captions: boolean; safeZones: boolean}> = ({captions, safeZones}) => (
  <AbsoluteFill style={{background: C.bg}}>
    {TL.shots.map((s) => (
      <Sequence key={s.id} name={`${s.id} ${s.component}`} from={fr(s.start)} durationInFrames={Math.max(1, fr(s.end) - fr(s.start))}>
        <ShotRouter shot={s} />
      </Sequence>
    ))}
    <Captions timeline={TL} show={captions} />
    {TL.audio ? <Audio src={staticFile(TL.audio)} /> : null}
    {safeZones ? <SafeZones /> : null}
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={Math.max(1, fr(TL.duration))} fps={TL.fps} width={TL.width} height={TL.height} defaultProps={{captions: true, safeZones: false}} />
);
