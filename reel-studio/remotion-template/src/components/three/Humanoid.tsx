import React, {useMemo} from 'react';
import * as THREE from 'three';
import {drawFace, moodAt, poseAt, type Variant} from './rig';

export type HumanProps = {
  variant?: Variant; x?: number; z?: number; rotY?: number; scale?: number;
  pose?: string | [number, string][]; mood?: string | [number, string][]; talk?: number; t?: number; lt?: number; seed?: number;
  skin?: string; shirt?: string; pants?: string; hair?: string; shoe?: string; hairStyle?: 'none' | 'cap' | 'long' | 'short'; beard?: boolean; glasses?: boolean; badge?: string;
};
const rad = (d: number) => (d * Math.PI) / 180;
const lam = (color: string, o: any = {}) => <meshLambertMaterial color={color} flatShading {...o} />;

const Limb: React.FC<{len: number; r: number; color: string; round?: boolean}> = ({len, r, color, round}) => (
  <mesh position={[0, -len / 2, 0]}>{round ? <cylinderGeometry args={[r, r, len, 8]} /> : <boxGeometry args={[r * 2, len, r * 2]} />}{lam(color)}</mesh>
);

/** One character, any look. Everything is a pure function of (pose, mood, talk, t): safe for Remotion rendering. */
export const Humanoid: React.FC<HumanProps> = ({variant = 'voxel', x = 0, z = 0, rotY = 0, scale = 1, pose = 'idle', mood = 'calm', talk = 0, t = 0, lt = 0, seed = 0,
  skin = '#B07A50', shirt = '#333344', pants = '#26305c', hair = '#17110d', shoe = '#e8e8ea', hairStyle, beard = false, glasses = false, badge}) => {
  const P = poseAt(pose as any, lt), M = moodAt(mood as any, lt);
  const walk = P.walk ? Math.sin(t * 6 + seed) : 0, sway = Math.sin(t * 2.3 + seed) * 0.01;
  const low = variant === 'lowpoly', stick = variant === 'stick', noir = variant === 'noir', limbR = variant === 'voxel' ? 0.052 : variant === 'blocky' ? 0.06 : stick ? 0.022 : low ? 0.042 : 0.05;
  const round = low || stick || variant === 'blocky' || noir, bodyCol = noir ? '#16161b' : shirt, skinCol = noir ? '#16161b' : stick ? '#f4f1ea' : skin, pantsCol = noir ? '#16161b' : stick ? '#111' : pants;
  const hs = variant === 'voxel' ? 0.44 : variant === 'blocky' ? 0.34 : low ? 0.4 : 0.34, bob = Math.abs(walk) * 0.03;
  const cv = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 256; return c; }, []);
  const tex = useMemo(() => { const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [cv]);
  drawFace(cv.getContext('2d')!, variant, M, talk, t, glasses); tex.needsUpdate = true;
  const arm = (side: 1 | -1, a: [number, number]) => (
    <group position={[side * (variant === 'voxel' ? 0.27 : 0.23), 1.38, 0]} rotation={[side * walk * 0.5, 0, side * rad(a[0] + 3 * Math.sin(t * 2.3 + side))]}>
      <Limb len={0.34} r={limbR} color={low || variant === 'voxel' ? bodyCol : skinCol} round={round} />
      <group position={[0, -0.34, 0]} rotation={[-rad(a[1]), 0, 0]}>
        <Limb len={0.32} r={limbR * 0.92} color={skinCol} round={round} />
        <mesh position={[0, -0.34, 0]}>{low ? <icosahedronGeometry args={[0.05, 0]} /> : stick ? <sphereGeometry args={[0.04, 10, 8]} /> : <boxGeometry args={[0.09, 0.09, 0.09]} />}{lam(skinCol)}</mesh>
      </group>
    </group>
  );
  const leg = (side: 1 | -1) => (
    <group position={[side * 0.1, 0.92, 0]} rotation={[side * walk * 0.55, 0, side * rad(P.stance) * 0.4]}>
      <Limb len={0.88} r={limbR * 1.1} color={pantsCol} round={round} />
      <mesh position={[0, -0.9, 0.05]}><boxGeometry args={[0.11, 0.06, 0.2]} />{lam(noir || stick ? '#111' : shoe)}</mesh>
    </group>
  );
  const faceZ = variant === 'blocky' ? hs * 0.5 + 0.002 : low ? 0.2 : hs / 2 + 0.002;
  return (
    <group position={[x, bob, z]} rotation={[0, rotY, 0]} scale={scale}>
      {leg(-1)}{leg(1)}
      <group rotation={[rad(P.lean) * 0.4, 0, rad(-P.tilt) * 0.3 + sway]}>
        <mesh position={[0, 1.15, 0]}>{low ? <cylinderGeometry args={[0.2, 0.17, 0.56, 8]} /> : stick ? <cylinderGeometry args={[0.03, 0.03, 0.56, 8]} /> : noir ? <cylinderGeometry args={[0.2, 0.26, 0.7, 10]} /> : variant === 'blocky' ? <boxGeometry args={[0.46, 0.52, 0.22]} /> : <boxGeometry args={[0.44, 0.56, 0.24]} />}{lam(bodyCol)}</mesh>
        {badge ? <mesh position={[0.1, 1.2, 0.125]}><boxGeometry args={[0.07, 0.07, 0.01]} />{lam(badge)}</mesh> : null}
        {arm(-1, P.aL)}{arm(1, P.aR)}
        <group position={[0, 1.62, 0]} rotation={[0, Math.sin(t * 0.8 + seed) * 0.12, rad(-P.tilt) * 0.5]}>
          <mesh>{variant === 'voxel' ? <boxGeometry args={[hs, hs, hs]} /> : variant === 'blocky' ? <cylinderGeometry args={[hs * 0.5, hs * 0.5, hs * 0.8, 16]} /> : low ? <icosahedronGeometry args={[0.2, 1]} /> : <sphereGeometry args={[hs / 2, 20, 16]} />}{lam(noir ? '#1c1c22' : stick ? '#f4f1ea' : skinCol)}</mesh>
          {variant === 'voxel' && (hairStyle ?? 'cap') !== 'none' ? <><mesh position={[0, hs * 0.42, -0.005]}><boxGeometry args={[hs + 0.02, hs * 0.3, hs + 0.02]} />{lam(hair)}</mesh><mesh position={[0, hs * 0.1, -hs * 0.5]}><boxGeometry args={[hs + 0.02, hs * 0.5, hs * 0.2]} />{lam(hair)}</mesh></> : null}
          {variant === 'voxel' && beard ? <mesh position={[0, -hs * 0.34, hs * 0.44]}><boxGeometry args={[hs + 0.02, hs * 0.32, hs * 0.22]} />{lam(hair)}</mesh> : null}
          {variant === 'blocky' ? <mesh position={[0, hs * 0.37, 0]}><cylinderGeometry args={[hs * 0.505, hs * 0.505, hs * 0.1, 16]} />{lam(hair)}</mesh> : null}
          {low ? <mesh position={[0, 0.02, -0.005]}><sphereGeometry args={[0.215, 8, 5, 0, Math.PI * 2, 0, 1.45]} />{lam(hair)}</mesh> : null}
          {low && (hairStyle ?? 'long') === 'long' ? [-1, 1].map((s) => <mesh key={s} position={[s * 0.17, -0.12, -0.04]} scale={[0.9, 2.1, 1]}><icosahedronGeometry args={[0.1, 0]} />{lam(hair)}</mesh>) : null}
          {!noir ? <mesh position={[0, 0, faceZ]}><planeGeometry args={[hs * 0.95, hs * 0.95]} /><meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} /></mesh> : null}
        </group>
      </group>
    </group>
  );
};

export type CreatureProps = {kind?: 'box' | 'screen' | 'cloud'; eyes?: 'arch' | 'slit'; color?: string; eye?: string; x?: number; y?: number; z?: number; scale?: number; rotY?: number; t?: number; kickAt?: number};
/** A small companion with vertical eyes. kickAt = film time of a hop (when it reacts). */
export const Creature: React.FC<CreatureProps> = ({kind = 'box', eyes = 'arch', color = '#E8643C', eye = '#111', x = 0, y = 0, z = 0, scale = 1, rotY = 0.25, t = 0, kickAt = -9}) => {
  const k = Math.min(1, Math.max(0, (t - kickAt) / 0.45)), hop = k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.16 : 0, bl = (t + x * 3) % 3.4 < 0.09 ? 0.1 : 1;
  return (
    <group position={[x, y + hop + Math.sin(t * 2.2 + x) * 0.006, z]} rotation={[0, rotY, 0]} scale={scale}>
      {kind === 'cloud' ? <>{[[0, 0.18, 0, 0.19], [-0.15, 0.14, 0.02, 0.13], [0.15, 0.14, 0.02, 0.13], [0, 0.1, 0.06, 0.17]].map((q, i) => <mesh key={i} position={[q[0], q[1], q[2]]}><icosahedronGeometry args={[q[3], 1]} />{lam(color, {emissive: color, emissiveIntensity: 0.25})}</mesh>)}</> :
        <><mesh position={[0, 0.17, 0]}><boxGeometry args={[kind === 'screen' ? 0.26 : 0.34, kind === 'screen' ? 0.26 : 0.24, 0.26]} />{lam(color)}</mesh>
          {kind === 'box' && eyes === 'arch' ? [-1, 1].map((s) => <group key={s} position={[s * 0.085, 0.2, 0.134]} scale={[1, bl, 1]}>{[-1, 1].map((q) => <mesh key={q} position={[q * 0.018, -0.006, 0]} rotation={[0, 0, -q * 0.75]}><boxGeometry args={[0.05, 0.014, 0.004]} /><meshBasicMaterial color={eye} /></mesh>)}</group>) : [-1, 1].map((s) => <mesh key={s} position={[s * (kind === 'screen' ? 0.06 : 0.07), 0.19, 0.133]} scale={[1, bl, 1]}><planeGeometry args={[kind === 'screen' ? 0.045 : 0.035, kind === 'screen' ? 0.12 : 0.08]} /><meshBasicMaterial color={kind === 'screen' ? '#ffffff' : eye} /></mesh>)}
          {[[-0.11, 0.08], [0.11, 0.08], [-0.11, -0.08], [0.11, -0.08]].map((q, i) => <mesh key={i} position={[q[0], 0.03, q[1]]}><boxGeometry args={[0.06, 0.06, 0.06]} />{lam(color)}</mesh>)}</>}
    </group>
  );
};
