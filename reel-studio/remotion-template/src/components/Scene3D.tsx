import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {atLocal, talkAt, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {Creature, Humanoid, type CreatureProps, type HumanProps} from './three/Humanoid';
import {CameraRig, Lights, SET_BG, SetScene, type Rig, type SetName} from './three/Sets';

type Char = HumanProps & {speaks?: boolean; poseAnchor?: string; pose2?: string};
type Crt = CreatureProps & {kickAnchor?: string};

/**
 * A full 3D shot. props:
 *  set: starfield | desk-night | block-world | noir-room | studio   light: studio | night | noir | golden | bright-sky
 *  characters: [{variant: voxel|blocky|lowpoly|stick|noir, x, z, rotY, pose, mood, speaks, skin, shirt, pants, hair, beard, glasses, badge, pose2 + poseAnchor (change pose at a spoken word)}]
 *  creatures: [{kind: box|screen|cloud, x, y, z, scale, color, kickAnchor (hop at that word)}]
 *  wall: true = a screen wall of charts behind a studio set (data / finance look)
 *  camera: {shot: wide|medium|close|desk|presenter, move: push|pull|drift|orbit|static, fov}   bg: background colour for starfield/studio
 */
export const Scene3D: React.FC<ShotProps> = ({shot, set = 'studio', light, characters = [{}], creatures = [], camera = {}, bg, wall}) => {
  const {t, lt, p} = useShotTime(shot);
  const {width, height} = useVideoConfig();
  const rig: Rig = light || (set === 'noir-room' ? 'noir' : set === 'desk-night' ? 'night' : set === 'block-world' ? 'bright-sky' : 'studio');
  const talk = talkAt(t);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 1.4, 4.4], fov: 34}}>
        <color attach="background" args={[bg || SET_BG[set as SetName] || '#222']} />
        <Lights rig={rig} />
        <SetScene name={set as SetName} bg={bg} wall={wall} />
        <CameraRig shot={camera.shot || 'medium'} move={camera.move || 'push'} p={p} fov={camera.fov} />
        {(characters as Char[]).map((c, i) => {
          const sw = c.poseAnchor && c.pose2 && lt >= atLocal(shot, c.poseAnchor);
          return <Humanoid key={i} {...c} pose={sw ? c.pose2 : c.pose} t={t} lt={lt} seed={i * 1.7} talk={c.speaks === false ? 0 : i === 0 || c.speaks ? talk : 0} />;
        })}
        {(creatures as Crt[]).map((c, i) => <Creature key={i} {...c} t={t} kickAt={c.kickAnchor && c.kickAnchor in shot.anchors ? shot.anchors[c.kickAnchor] : -9} />)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
