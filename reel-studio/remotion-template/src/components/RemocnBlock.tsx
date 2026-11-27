import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {atLocal} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {REMOCN} from '../data/remocn-registry';

/**
 * Hosts one component from the remocn registry (MIT, https://remocn.dev) inside a shot. Remocn components are plain Remotion components driven by
 * useCurrentFrame(), so they run on OUR single timeline: the shot's Sequence gives frame 0 = shot start, `anchor`/`at` moves their start onto a spoken word.
 * Install first: `node tools/remocn.mjs add <name> --project <P>`. props: name (required), props (the component's own props, see `remocn.mjs info <name>`),
 * anchor (spoken-word anchor where it starts) or at (seconds into the shot), scale (about 1.1 enlarges app windows that were designed for 16:9), dy (px shift).
 */
export const RemocnBlock: React.FC<ShotProps & {name: string; props?: Record<string, any>; anchor?: string; at?: number; scale?: number; dy?: number}> = ({shot, name, props = {}, anchor, at = 0, scale = 1, dy = 0}) => {
  const {fps} = useVideoConfig();
  const C = REMOCN[name];
  if (!C) throw new Error(`RemocnBlock: "${name}" is not installed in this project. Run: node tools/remocn.mjs add ${name} --project <project>`);
  const start = anchor ? atLocal(shot, anchor, at) : at;
  return (
    <AbsoluteFill>
      <Sequence from={Math.max(0, Math.round(start * fps))} layout="none"><AbsoluteFill style={{transform: `translateY(${dy}px) scale(${scale})`, transformOrigin: 'center center'}}><C {...props} /></AbsoluteFill></Sequence>
    </AbsoluteFill>
  );
};
