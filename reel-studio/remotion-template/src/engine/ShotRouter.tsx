import React from 'react';
import {AbsoluteFill} from 'remotion';
import {REGISTRY} from '../components/registry';
import {Overlays} from './Overlays';
import type {Shot} from './types';
import style from '../data/style.json';
/** a pack may declare defaults.backdrop = {world, worldOpts, camera, look}: 2D cards then sit on that world, locked off and softly out of focus. No pack backdrop = the flat pack colour. */
const BACKDROP = ((style as any).defaults || {}).backdrop as undefined | {world: string; worldOpts?: any; camera: any; look?: any};

/** Looks the shot's component up in the registry. An unknown name renders a loud red card, so critics catch it in the contact sheet. */
export const ShotRouter: React.FC<{shot: Shot}> = ({shot}) => {
  const Comp = REGISTRY[shot.component];
  if (!Comp) {
    return (
      <AbsoluteFill style={{background: '#7a0000', color: '#fff', fontFamily: 'monospace', fontSize: 42, padding: 80, justifyContent: 'center'}}>
        MISSING COMPONENT: {shot.component} (shot {shot.id}). Add it to src/components/registry.ts or pick an existing one.
      </AbsoluteFill>
    );
  }
  const Backdrop = BACKDROP && !['Scene3D', 'Stage3D'].includes(shot.component) ? REGISTRY.Stage3D : null;
  return <>{Backdrop ? <Backdrop shot={shot} world={BACKDROP!.world} worldOpts={BACKDROP!.worldOpts} cast={[]} camera={BACKDROP!.camera} look={{aperture: 0.02, maxblur: 0.02, ...(BACKDROP!.look || {})}} /> : null}<Comp shot={shot} {...shot.props} /><Overlays shot={shot} />{((shot as any).blocks || []).map((b: any, i: number) => { const B = REGISTRY.HtmlBlock; return <B key={i} shot={shot} {...b} />; })}</>;
};
