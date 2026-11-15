import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {rnd} from '../../engine/anim';

function useTex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: number) {
  return useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); } return t;
  }, []);
}
const Plane: React.FC<{w: number; h: number; pos: [number, number, number]; map?: THREE.Texture; color?: string; additive?: boolean; opacity?: number}> = ({w, h, pos, map, color, additive, opacity}) => (
  <mesh position={pos}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} color={color} toneMapped={false} transparent={!!additive || opacity != null} opacity={opacity ?? 1} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} depthWrite={!additive} /></mesh>
);
const Floor: React.FC<{color: string; r?: number; map?: THREE.Texture}> = ({color, r = 12, map}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r, 48]} /><meshLambertMaterial color={color} map={map} /></mesh>
);

export type Rig = 'studio' | 'night' | 'noir' | 'golden' | 'bright-sky';
/** light rigs: strong ambient so the subject is always readable; noir keeps one hard light */
export const Lights: React.FC<{rig: Rig}> = ({rig}) => {
  if (rig === 'noir') return <><ambientLight intensity={0.5} color="#4a5a8a" /><spotLight position={[1.5, 4.2, 2.2]} angle={0.55} penumbra={0.6} intensity={90} color="#ffe2b0" distance={14} target-position={[0, 1, 0]} /><directionalLight position={[-3, 2, -3]} intensity={1.6} color="#ff4a3a" /></>;
  if (rig === 'night') return <><hemisphereLight args={['#8f9ed8', '#7a6a80', 2.0]} /><directionalLight position={[2.5, 4.5, 4]} intensity={2.2} color="#fff0dd" /><directionalLight position={[-3, 3, -3]} intensity={1.5} color="#6f8cff" /><pointLight position={[-1.1, 1.9, 1.3]} intensity={3} color="#ffb870" distance={7} /></>;
  if (rig === 'golden') return <><hemisphereLight args={['#ffe2b8', '#a07a5a', 1.8]} /><directionalLight position={[3, 3.5, 3]} intensity={2.6} color="#ffc680" /><directionalLight position={[-3, 2, -2]} intensity={1.0} color="#9ab4ff" /></>;
  if (rig === 'bright-sky') return <><hemisphereLight args={['#bfdcff', '#6a9a48', 2.2]} /><directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff6e0" /></>;
  return <><ambientLight intensity={1.4} /><directionalLight position={[2.5, 4.5, 4]} intensity={2.2} color="#ffffff" /><directionalLight position={[-3, 3, -3]} intensity={1.3} color="#9ab0ff" /></>;
};

const FR: Record<string, {pos: [number, number, number]; look: [number, number, number]; fov: number}> = {
  wide: {pos: [0, 1.6, 6.4], look: [0, 1.0, 0], fov: 36}, medium: {pos: [0, 1.4, 4.4], look: [0, 1.1, 0], fov: 34}, close: {pos: [0, 1.62, 2.5], look: [0, 1.55, 0], fov: 30}, desk: {pos: [0, 1.35, 3.8], look: [0, 1.15, 0], fov: 34},
};
/** Camera as a pure function of progress p (0..1). shot: wide|medium|close|desk; move: push|pull|drift|orbit|static */
export const CameraRig: React.FC<{shot?: string; move?: string; p: number; fov?: number}> = ({shot = 'medium', move = 'push', p, fov}) => {
  const {camera} = useThree();
  const f = FR[shot] || FR.medium, e = p * p * (3 - 2 * p);
  let [x, y, z] = f.pos; const [lx, ly, lz] = f.look;
  if (move === 'push') z -= 0.9 * e; else if (move === 'pull') z += 0.9 * (1 - e) - 0.9 * 0; else if (move === 'drift') { x += Math.sin(e * Math.PI) * 0.4; } else if (move === 'orbit') { const a = (e - 0.5) * 0.7, r = Math.hypot(x - lx, z - lz); x = lx + Math.sin(a) * r; z = lz + Math.cos(a) * r; }
  useLayoutEffect(() => { camera.position.set(x, y, z); camera.lookAt(lx, ly, lz); (camera as THREE.PerspectiveCamera).fov = fov || f.fov; camera.updateProjectionMatrix(); });
  return null;
};

const Stars: React.FC<{bg: string}> = ({bg}) => {
  const map = useTex(1024, 600, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1445'); g.addColorStop(1, bg); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { c.fillStyle = ['#fff', '#bcd0ff', '#ffb89a', '#9ad1ff'][i % 4] + (rnd(i + 3) > 0.5 ? 'ff' : '99'); c.beginPath(); c.arc(rnd(i) * w, rnd(i + 1) * h, 1 + rnd(i + 2) * 2.6, 0, 7); c.fill(); } });
  return <><Plane w={44} h={26} pos={[0, 4, -6]} map={map} /><Floor color="#2f43b8" /></>;
};
const Desk: React.FC = () => {
  const city = useTex(512, 300, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#070b24'); g.addColorStop(1, '#16255a'); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { c.fillStyle = '#0a1030'; c.fillRect(rnd(i) * w, h - (60 + rnd(i + 40) * 140), 30 + rnd(i + 9) * 30, 220); } });
  const glow = useTex(512, 300, (c, w, h) => { for (let i = 0; i < 60; i++) { const x = rnd(7 + i * 3) * w, y = rnd(8 + i * 3) * h, r = 3 + rnd(9 + i * 3) * 6, g = c.createRadialGradient(x, y, 0, x, y, r), col = ['#ffd27a', '#ffe7b0', '#8fd0ff', '#ff9d6a'][i % 4]; g.addColorStop(0, col); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } });
  const code = useTex(256, 192, (c, w, h) => { c.fillStyle = '#0f1630'; c.fillRect(0, 0, w, h); for (let r = 0; r < 14; r++) { let x = 12 + (r % 3) * 12; for (let k = 0; k < 4; k++) { const ww = 14 + rnd(r * 9 + k) * 44; c.fillStyle = ['#6fd3ff', '#f1c27a', '#7be0a8', '#d79bff', '#fff'][(r + k) % 5]; c.fillRect(x, 10 + r * 12.5, ww, 5); x += ww + 6; } } });
  return (
    <>
      <Floor color="#4a3226" r={14} /><Plane w={9} h={5.2} pos={[0, 2.6, -3.4]} map={city} /><Plane w={9} h={5.2} pos={[0, 2.6, -3.38]} map={glow} additive opacity={0.7} />
      <mesh position={[0, 0.78, 0.8]}><boxGeometry args={[3.4, 0.09, 1.1]} /><meshLambertMaterial color="#8a5a36" flatShading /></mesh>
      {[-1.6, 1.6].map((x) => <mesh key={x} position={[x, 0.39, 0.8]}><boxGeometry args={[0.1, 0.78, 0.9]} /><meshLambertMaterial color="#5d3a22" /></mesh>)}
      <group position={[1.15, 1.25, 0.55]} rotation={[0, -0.5, 0]}><mesh><boxGeometry args={[0.95, 0.6, 0.05]} /><meshLambertMaterial color="#12121a" /></mesh><Plane w={0.88} h={0.52} pos={[0, 0, 0.03]} map={code} /></group>
    </>
  );
};
const BlockWorld: React.FC = () => {
  const sky = useTex(8, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a62d8'); g.addColorStop(0.7, '#8cc8f6'); g.addColorStop(1, '#f6e6d0'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const grass = useTex(64, 64, (c) => { c.fillStyle = '#5db84a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#56ae44'; c.fillRect(0, 0, 32, 32); c.fillRect(32, 32, 32, 32); }, 14);
  const win = useTex(64, 256, (c, w, h) => { c.fillStyle = '#f4f8ff'; c.fillRect(0, 0, w, h); for (let r = 0; r < 20; r++) for (let k = 0; k < 4; k++) { c.fillStyle = '#4f8fe0'; c.fillRect(6 + k * 15, 6 + r * 12, 10, 7); } });
  return (
    <>
      <Plane w={60} h={34} pos={[0, 6, -14]} map={sky} /><Floor color="#ffffff" r={16} map={grass} />
      {Array.from({length: 40}).map((_, i) => { const s = i % 2 ? 1 : -1, h = 4 + rnd(i + 19) * (i % 5 === 0 ? 24 : 11), w = 1.1 + rnd(i + 3) * 1.6; return <mesh key={i} position={[s * (2.6 + rnd(i) * 9), h / 2, 3 - rnd(i + 9) * 17]}><boxGeometry args={[w, h, w]} /><meshLambertMaterial map={win} color={i % 4 ? '#ffffff' : '#ffe9b0'} /></mesh>; })}
      {Array.from({length: 7}).map((_, i) => <mesh key={'c' + i} position={[(rnd(i + 50) - 0.5) * 22, 3 + rnd(i + 60) * 6, -6 - rnd(i + 70) * 6]} scale={[2.4, 0.9, 1.2]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
    </>
  );
};
const NoirRoom: React.FC = () => (
  <>
    <Floor color="#15151c" r={12} /><Plane w={14} h={8} pos={[0, 4, -4]} color="#0b0b10" />
    <mesh position={[1.5, 3.6, 2.2]}><sphereGeometry args={[0.1, 10, 8]} /><meshBasicMaterial color="#ffe2b0" toneMapped={false} /></mesh>
    <mesh position={[0.8, 1.9, 1.1]} rotation={[0, 0, -0.38]}><coneGeometry args={[1.5, 3.8, 24, 1, true]} /><meshBasicMaterial color="#ffe2b0" transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} /></mesh>
  </>
);
const Studio: React.FC<{bg: string}> = ({bg}) => <><Plane w={40} h={26} pos={[0, 4, -5]} color={bg} /><Floor color="#d8d8de" r={14} /></>;

export type SetName = 'starfield' | 'desk-night' | 'block-world' | 'noir-room' | 'studio';
export const SetScene: React.FC<{name: SetName; bg?: string}> = ({name, bg = '#22349f'}) => name === 'starfield' ? <Stars bg={bg} /> : name === 'desk-night' ? <Desk /> : name === 'block-world' ? <BlockWorld /> : name === 'noir-room' ? <NoirRoom /> : <Studio bg={bg} />;
export const SET_BG: Record<SetName, string> = {starfield: '#22349f', 'desk-night': '#070a1c', 'block-world': '#8cc8f6', 'noir-room': '#050508', studio: '#e8e8ec'};
