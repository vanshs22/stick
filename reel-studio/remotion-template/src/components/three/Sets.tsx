import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
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
  if (rig === 'night') return <><hemisphereLight args={['#9fb0f0', '#8a6a80', 3.0]} /><directionalLight position={[2.5, 4.5, 4]} intensity={2.8} color="#fff0dd" /><directionalLight position={[-3, 3, -3]} intensity={1.5} color="#6f8cff" /><pointLight position={[-1.1, 1.9, 1.3]} intensity={7} color="#ffb870" distance={8} /></>;
  if (rig === 'golden') return <><hemisphereLight args={['#ffe2b8', '#a07a5a', 1.8]} /><directionalLight position={[3, 3.5, 3]} intensity={2.6} color="#ffc680" /><directionalLight position={[-3, 2, -2]} intensity={1.0} color="#9ab4ff" /></>;
  if (rig === 'bright-sky') return <><hemisphereLight args={['#bfdcff', '#6a9a48', 2.2]} /><directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff6e0" /></>;
  return <><ambientLight intensity={1.4} /><directionalLight position={[2.5, 4.5, 4]} intensity={2.2} color="#ffffff" /><directionalLight position={[-3, 3, -3]} intensity={1.3} color="#9ab0ff" /></>;
};

const FR: Record<string, {pos: [number, number, number]; look: [number, number, number]; fov: number}> = {
  wide: {pos: [0, 1.6, 6.4], look: [0, 1.0, 0], fov: 36}, medium: {pos: [0, 1.4, 4.4], look: [0, 1.1, 0], fov: 34}, close: {pos: [0, 1.62, 2.5], look: [0, 1.55, 0], fov: 30}, desk: {pos: [0, 1.35, 3.8], look: [0, 1.15, 0], fov: 34}, presenter: {pos: [0, 1.4, 3.1], look: [0, 1.22, 0], fov: 36}, bg: {pos: [0, 1.9, 6.6], look: [0, 2.3, 0], fov: 36}, creature: {pos: [0.3, 0.75, 3.5], look: [0, 0.38, 0], fov: 34}, hero: {pos: [0.6, 0.5, 3.3], look: [0, 1.3, 0], fov: 38}, over: {pos: [1.7, 1.6, 3.1], look: [-0.2, 1.1, 0], fov: 34}, top: {pos: [0.4, 3.4, 3.2], look: [0, 0.5, 0], fov: 36}, low: {pos: [-0.9, 0.35, 2.7], look: [0, 0.6, 0], fov: 40},
};
/** Camera as a pure function of progress p (0..1). shot: wide|medium|close|desk; move: push|pull|drift|orbit|static */
export const CameraRig: React.FC<{shot?: string; move?: string; p: number; fov?: number}> = ({shot = 'medium', move = 'push', p, fov}) => {
  const {camera} = useThree();
  const f = FR[shot] || FR.medium, e = p * p * (3 - 2 * p);
  let [x, y, z] = f.pos; const [lx, ly, lz] = f.look;
  if (move === 'push') z -= 0.55 * e; else if (move === 'pull') z += 0.9 * (1 - e) - 0.9 * 0; else if (move === 'drift') { x += Math.sin(e * Math.PI) * 0.4; } else if (move === 'orbit') { const a = (e - 0.5) * 0.7, r = Math.hypot(x - lx, z - lz); x = lx + Math.sin(a) * r; z = lz + Math.cos(a) * r; }
  const fr = useCurrentFrame() / 30; x += Math.sin(fr * 0.8) * 0.07; y += Math.sin(fr * 1.1 + 1) * 0.035; // handheld sway: the camera is never locked
  useLayoutEffect(() => { camera.position.set(x, y, z); camera.lookAt(lx, ly, lz); (camera as THREE.PerspectiveCamera).fov = fov || f.fov; camera.updateProjectionMatrix(); });
  return null;
};

const shade = (hex: string, k: number) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };
const NEON = ['#ffd166', '#ff6b9a', '#4ecdc4', '#8e7dff', '#7ee0c3'];
/** low-poly shapes drifting behind the action: the set is never still. colors cycle through the list. */
const Floaters: React.FC<{colors?: string[]; n?: number; spread?: number; zFar?: number}> = ({colors = NEON, n = 18, spread = 9, zFar = 5}) => {
  const f = useCurrentFrame() / 30;
  return <>{Array.from({length: n}).map((_, i) => {
    const x = (rnd(i + 1) - 0.5) * spread, y = 0.5 + rnd(i + 20) * 4.6, z = -1.8 - rnd(i + 40) * zFar, s = 0.14 + rnd(i + 60) * 0.34, k = i % 4;
    return (
      <mesh key={i} position={[x + Math.sin(f * 0.5 + i) * 0.3, y + Math.sin(f * 0.8 + i * 1.7) * 0.34, z]} rotation={[f * (0.3 + rnd(i) * 0.6), f * (0.4 + rnd(i + 5) * 0.6), 0]} scale={s}>
        {k === 0 ? <boxGeometry args={[1, 1, 1]} /> : k === 1 ? <octahedronGeometry args={[0.8, 0]} /> : k === 2 ? <coneGeometry args={[0.7, 1.1, 4]} /> : <icosahedronGeometry args={[0.8, 0]} />}
        <meshLambertMaterial color={colors[i % colors.length]} flatShading emissive={colors[i % colors.length]} emissiveIntensity={0.25} />
      </mesh>
    );
  })}</>;
};
/** soft round shadow so characters and creatures sit on the floor */
export const Shadow: React.FC<{x?: number; z?: number; r?: number}> = ({x = 0, z = 0, r = 0.5}) => {
  const map = useTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  return <mesh position={[x, 0.006, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[r * 2.4, r * 2.4]} /><meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} /></mesh>;
};
/** a spotlight pool + pulsing ring on the floor, so the hero always has a stage */
const Stage: React.FC<{bg: string; grid?: boolean}> = ({bg, grid}) => {
  const f = useCurrentFrame() / 30;
  const map = useTex(512, 512, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, shade(bg, 0.13)); g.addColorStop(0.55, shade(bg, 0.0)); g.addColorStop(1, shade(bg, -0.1)); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (grid) { c.strokeStyle = 'rgba(120,220,255,0.28)'; c.lineWidth = 2; for (let i = 0; i <= 32; i++) { c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16, h); c.moveTo(0, i * 16); c.lineTo(w, i * 16); c.stroke(); } }
  });
  const pulse = 1 + 0.05 * Math.sin(f * 2.2);
  return (
    <>
      <Floor color="#ffffff" r={16} map={map} />
      <mesh position={[0, 0.012, 0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={pulse}><ringGeometry args={[1.5, 1.56, 64]} /><meshBasicMaterial color={shade(bg, 0.3)} transparent opacity={0.6} toneMapped={false} /></mesh>
      <mesh position={[0, 0.011, 0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={2 - pulse}><ringGeometry args={[2.3, 2.33, 64]} /><meshBasicMaterial color={shade(bg, 0.3)} transparent opacity={0.3} toneMapped={false} /></mesh>
    </>
  );
};
const Backdrop: React.FC<{bg: string; w?: number; h?: number; pos?: [number, number, number]}> = ({bg, w = 44, h = 30, pos = [0, 5, -7]}) => {
  const map = useTex(512, 512, (c, cw, ch) => {
    const g = c.createRadialGradient(cw / 2, ch * 0.62, 0, cw / 2, ch * 0.62, cw * 0.75); g.addColorStop(0, shade(bg, 0.14)); g.addColorStop(1, shade(bg, -0.2)); c.fillStyle = g; c.fillRect(0, 0, cw, ch);
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 8; y < ch; y += 24) for (let x = 8; x < cw; x += 24) { c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); }
  });
  return <Plane w={w} h={h} pos={pos} map={map} />;
};
const StarPoints: React.FC = () => {
  const f = useCurrentFrame() / 30;
  const geo = useMemo(() => { const n = 520, a = new Float32Array(n * 3), col = new Float32Array(n * 3), pal = [new THREE.Color('#ffffff'), new THREE.Color('#bcd0ff'), new THREE.Color('#ffd1a8'), new THREE.Color('#9af0ff')]; for (let i = 0; i < n; i++) { const r = 5 + rnd(i) * 9, th = rnd(i + 99) * Math.PI * 2; a[i * 3] = Math.cos(th) * r * 1.1; a[i * 3 + 1] = rnd(i + 7) * 10 - 1.5; a[i * 3 + 2] = -3 - rnd(i + 3) * 9; const c = pal[i % 4]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; }, []);
  return <points geometry={geo} rotation={[0, 0, f * 0.03]} position={[0, 2.5, 0]}><pointsMaterial size={0.09} sizeAttenuation vertexColors transparent opacity={0.95} toneMapped={false} depthWrite={false} /></points>;
};
const Stars: React.FC<{bg: string}> = ({bg}) => (
  <><Backdrop bg={bg} /><StarPoints /><Floaters colors={['#58e1ff', '#ff6bd6', '#ffd166', '#8e7dff']} n={16} /><Stage bg={shade(bg, -0.02)} grid /></>
);
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
const Tower: React.FC<{levels: number; p: number; storm: boolean}> = ({levels, p, storm}) => {
  const f = useCurrentFrame() / 30, pal = ['#ff6b6b', '#ffd166', '#4ecdc4', '#8e7dff', '#ff9f43', '#6bcB77'];
  return (
    <group position={[0.62, 0, -0.9]} rotation={[0, 0, storm ? Math.sin(f * 7) * 0.035 : 0]}>
      {Array.from({length: levels}).map((_, i) => {
        const k = Math.min(1, Math.max(0, p * 1.25 - (i / levels) * 0.8) * 4); if (k <= 0) return null;
        return <mesh key={i} position={[Math.sin(i * 1.7) * 0.03, 0.26 + i * 0.52 + (1 - k) * 2.2, 0]} scale={[1, k, 1]}><boxGeometry args={[0.7, 0.5, 0.7]} /><meshLambertMaterial color={pal[i % pal.length]} flatShading /></mesh>;
      })}
    </group>
  );
};
const BlockWorld: React.FC<{tower?: number; storm?: boolean; p?: number}> = ({tower = 0, storm = false, p = 0}) => {
  const f = useCurrentFrame() / 30, flash = storm && (f * 2.6) % 2.4 < 0.14;
  const sky = useTex(8, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a62d8'); g.addColorStop(0.7, '#8cc8f6'); g.addColorStop(1, '#f6e6d0'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const grass = useTex(64, 64, (c) => { c.fillStyle = '#5db84a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#56ae44'; c.fillRect(0, 0, 32, 32); c.fillRect(32, 32, 32, 32); }, 14);
  const win = useTex(64, 256, (c, w, h) => { c.fillStyle = '#f4f8ff'; c.fillRect(0, 0, w, h); for (let r = 0; r < 20; r++) for (let k = 0; k < 4; k++) { c.fillStyle = '#4f8fe0'; c.fillRect(6 + k * 15, 6 + r * 12, 10, 7); } });
  return (
    <>
      <Plane w={60} h={34} pos={[0, 6, -14]} map={sky} /><Floor color="#ffffff" r={16} map={grass} />
      {Array.from({length: 40}).map((_, i) => { const s = i % 2 ? 1 : -1, h = 4 + rnd(i + 19) * (i % 5 === 0 ? 24 : 11), w = 1.1 + rnd(i + 3) * 1.6; return <mesh key={i} position={[s * (2.6 + rnd(i) * 9), h / 2, 3 - rnd(i + 9) * 17]}><boxGeometry args={[w, h, w]} /><meshLambertMaterial map={win} color={i % 4 ? '#ffffff' : '#ffe9b0'} /></mesh>; })}
      {Array.from({length: 9}).map((_, i) => <mesh key={'c' + i} position={[((rnd(i + 50) * 26 + f * (0.25 + rnd(i) * 0.3)) % 26) - 13, 3 + rnd(i + 60) * 6, -6 - rnd(i + 70) * 6]} scale={[2.4, 0.9, 1.2]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color={storm ? '#59607a' : '#ffffff'} /></mesh>)}
      {storm ? <Plane w={80} h={50} pos={[0, 6, -13.5]} color="#070b24" opacity={0.62} /> : null}
      {flash ? <Plane w={80} h={50} pos={[0, 6, -13.4]} color="#ffffff" opacity={0.55} /> : null}
      {tower > 0 ? <Tower levels={tower} p={p} storm={storm} /> : null}
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
const Wall: React.FC = () => {
  const map = useTex(512, 256, (c, w, h) => { c.fillStyle = '#0c0f14'; c.fillRect(0, 0, w, h); for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const x = 8 + k * 84, y = 10 + r * 82; c.fillStyle = '#151a22'; c.fillRect(x, y, 76, 70); c.strokeStyle = (r + k) % 3 ? '#34e07b' : '#ff5a5f'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 12; i++) { const yy = y + 45 - rnd(r * 9 + k * 3 + i) * 28 - i * 1.2; i ? c.lineTo(x + 6 + i * 5.6, yy) : c.moveTo(x + 6, yy); } c.stroke(); } c.fillStyle = '#181d26'; c.fillRect(0, 252, w, 4); });
  return <Plane w={12} h={6} pos={[0, 3.9, -4.6]} map={map} />;
};
const Studio: React.FC<{bg: string; wall?: boolean}> = ({bg, wall}) => <><Backdrop bg={bg} />{wall ? <Wall /> : <Floaters />}<Stage bg={bg} /></>;

export type SetName = 'starfield' | 'desk-night' | 'block-world' | 'noir-room' | 'studio';
export const SetScene: React.FC<{name: SetName; bg?: string; wall?: boolean; tower?: number; storm?: boolean; p?: number}> = ({name, bg: bg0, wall, tower, storm, p}) => { const bg = bg0 || SET_BG[name]; return name === 'starfield' ? <Stars bg={bg} /> : name === 'desk-night' ? <Desk /> : name === 'block-world' ? <BlockWorld tower={tower} storm={storm} p={p} /> : name === 'noir-room' ? <NoirRoom /> : <Studio bg={bg} wall={wall} />; };
export const SET_BG: Record<SetName, string> = {starfield: '#1b1470', 'desk-night': '#0d1536', 'block-world': '#8cc8f6', 'noir-room': '#050508', studio: '#e9e4da'};
