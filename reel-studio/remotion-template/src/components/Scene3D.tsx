import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {atLocal, talkAt, useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
import style from '../data/style.json';
const D = (((style as any).defaults || {}).scene3d || {}) as Record<string, any>;
import {Creature, Humanoid, type CreatureProps, type HumanProps} from './three/Humanoid';
import {CameraRig, Lights, SET_BG, SetScene, Shadow, type Rig, type SetName} from './three/Sets';

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
/** auto-director: a shot longer than ~1.8 s is cut into segments, each with its own angle and camera move, so the picture changes every ~1.7 s */
const ROT: Record<string, string[]> = {wide: ['medium', 'over'], medium: ['close', 'wide'], close: ['over', 'medium'], over: ['hero', 'medium'], hero: ['wide', 'low'], low: ['medium', 'hero'], desk: ['close', 'wide'], presenter: ['close', 'over'], creature: ['creature', 'creature'], top: ['wide', 'medium']};
const MOVES = ['drift', 'orbit', 'pull', 'push'];
export const Scene3D: React.FC<ShotProps> = ({shot, set = D.set || 'studio', light = D.light, characters = [{}], creatures = [], camera = {}, bg = D.bg, wall = D.wall, tower, storm}) => {
  const {t, lt, p} = useShotTime(shot);
  const {width, height} = useVideoConfig();
  const rig: Rig = light || (set === 'noir-room' ? 'noir' : set === 'desk-night' ? 'night' : set === 'block-world' ? 'bright-sky' : 'studio');
  const talk = talkAt(t);
  const base = camera.shot || 'medium', n = camera.auto === false ? 1 : Math.max(1, Math.round((shot.end - shot.start) / 1.7)), seg = Math.min(n - 1, Math.floor(p * n)), ps = p * n - seg;
  const camShot = seg === 0 ? base : (ROT[base] || ROT.medium)[(seg - 1) % 2], camMove = seg === 0 ? camera.move || 'push' : MOVES[seg % 4];
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 1.4, 4.4], fov: 34}}>
        <color attach="background" args={[bg || SET_BG[set as SetName] || '#222']} />
        <Lights rig={rig} />
        <SetScene name={set as SetName} bg={bg} wall={wall} tower={tower} storm={storm} p={p} />
        <CameraRig shot={camShot} move={camMove} p={ps} fov={camera.fov} />
        {(characters as Char[]).map((c, i) => <Shadow key={'s' + i} x={c.x} z={c.z} r={0.42 * (c.scale || 1)} />)}
        {(creatures as Crt[]).map((c, i) => <Shadow key={'q' + i} x={c.x} z={c.z} r={0.28 * (c.scale || 1)} />)}
        {(characters as Char[]).map((c, i) => {
          const sw = c.poseAnchor && c.pose2 && lt >= atLocal(shot, c.poseAnchor);
          return <Humanoid key={i} {...c} pose={sw ? c.pose2 : c.pose} t={t} lt={lt} seed={i * 1.7} talk={c.speaks === false ? 0 : i === 0 || c.speaks ? talk : 0} />;
        })}
        {(creatures as Crt[]).map((c, i) => <Creature key={i} {...c} t={t} kickAt={c.kickAnchor && c.kickAnchor in shot.anchors ? shot.anchors[c.kickAnchor] : -9} />)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
