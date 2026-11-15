import React from 'react';
import {AbsoluteFill} from 'remotion';
import {REGISTRY} from '../components/registry';
import {Overlays} from './Overlays';
import type {Shot} from './types';

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
  return <><Comp shot={shot} {...shot.props} /><Overlays shot={shot} /></>;
};
