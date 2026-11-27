// Voxel valley: a golden-hour voxel landscape built on the same grid as the characters (terrain = 2 units = 0.2 m).
// Layers: far hills, rolling grass terrain with dirt and stone, a pond with sand, voxel trees, a cabin with glowing windows,
// lanterns, a stone path, flowers; ambient life: drifting voxel clouds, chimney smoke, falling leaves, fireflies.
import * as THREE from 'three';
import { VoxelMap, VMAT, vmesh } from './voxel.js';
import { sky, sunlight } from './world.js';

const hash = (x, y = 0, z = 0) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, s = (t) => t * t * (3 - 2 * t); const a = hash(xi, 0, zi), b = hash(xi + 1, 0, zi), c = hash(xi, 0, zi + 1), d = hash(xi + 1, 0, zi + 1); return a + (b - a) * s(xf) + (c - a) * s(zf) + (a - b - c + d) * s(xf) * s(zf); };
const fbm = (x, z) => vnoise(x, z) * 0.55 + vnoise(x * 2.1, z * 2.1) * 0.3 + vnoise(x * 4.3, z * 4.3) * 0.15;
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const T = 0.2;   // terrain block size (2 units)

export function voxelValley(E, o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#F7C58D'); scene.environment = E.envMap; scene.environmentIntensity = 0.45;
  sky(scene, { top: '#3C6BC8', horizon: '#FFD9A6', ground: '#9BC76A' });
  // ── terrain ──
  const N = 110, half = N / 2, M = new VoxelMap(T), pond = [-3.0, -1.0, 1.45], cabin = [1.6, -4.4], pathX = 0.55;
  const height = (i, k) => {
    const x = (i - half) * T, z = (k - half) * T, d = Math.hypot(x, z - 0.4), plate = Math.max(0, Math.min(1, (d - 3.6) / 4.5)), hills = Math.max(0, fbm(x * 0.22, z * 0.22) - 0.28) * 14 * plate;
    const pd = Math.hypot(x - pond[0], z - pond[1]), ph = pd < pond[2] + 0.8 ? -Math.max(0, 1 - (pd - 0.2) / (pond[2] + 0.6)) * 3.2 : 0;
    return Math.round(hills + ph);
  };
  const H = []; for (let i = 0; i < N; i++) { H[i] = []; for (let k = 0; k < N; k++) H[i][k] = height(i, k); }
  const surface = {};
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
    const h = H[i][k], x = (i - half) * T, z = (k - half) * T, nearPond = Math.hypot(x - pond[0], z - pond[1]) < pond[2] + 0.55, onPath = Math.abs(x - pathX - Math.sin(z * 0.6) * 0.25) < 0.22 && z > cabin[1] + 1.5 && z < 3.2 && h <= 0;
    const g = hash(i, 0, k), top = nearPond && h <= 0 ? '#E7D49C' : onPath ? (g > 0.5 ? '#B9B2A4' : '#A59E92') : g > 0.66 ? '#79C74E' : g > 0.33 ? '#6DBB45' : '#64B03F';
    for (let y = h - 1; y >= h - 4; y--) M.set(i, y, k, y === h - 1 ? top : y >= h - 3 ? (nearPond ? '#D3BE86' : '#8E5F3A') : '#7C8794');
  }
  const terrain = new THREE.Mesh(M.geometry([half, 0, half], 0.07), VMAT()); terrain.castShadow = terrain.receiveShadow = true; scene.add(terrain);
  // far hills as simple voxel silhouettes (atmospheric perspective: bluer with distance)
  [[-14, -26, 9, 7, '#7FA8C9'], [6, -32, 12, 9, '#7099BD'], [22, -24, 8, 6, '#8AB2CF']].forEach(([x, z, r, h, c]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true })); m.position.set(x, h / 2 - 0.3, z); m.rotation.y = 0.8; scene.add(m); });
  // ── water ──
  const water = new THREE.Mesh(new THREE.PlaneGeometry(pond[2] * 2.6, pond[2] * 2.6), new THREE.MeshStandardMaterial({ color: '#5FB4E6', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.82, emissive: '#2F7FB8', emissiveIntensity: 0.25 })); water.rotation.x = -Math.PI / 2; water.position.set(pond[0], -0.46, pond[1]); scene.add(water);
  // ── trees (blocks of 2 units) ──
  const tree = (x, z, s = 1, leaf = '#58B346') => {
    const m = new VoxelMap(0.4); const th = 3 + Math.floor(hash(x, z) * 3);
    m.box(0, 0, 0, 1, th, 1, '#7B5130'); for (let dy = 0; dy < 4; dy++) { const r = dy === 3 ? 1 : dy === 2 ? 2 : 2; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (Math.abs(a) + Math.abs(b) <= r + 1 && !(dy === 0 && a === 0 && b === 0)) m.set(a, th - 1 + dy, b, shade(leaf, 0.85 + hash(a + x, dy, b + z) * 0.35)); }
    const mesh = vmesh(m, [0.5, 0, 0.5], scene, [x, 0, z], 0.06); mesh.scale.setScalar(s); return mesh;
  };
  const rawTree = (x, z, s) => { const t = tree(x, z, s); t.position.y = H[Math.round(x / T + half)]?.[Math.round(z / T + half)] * T || 0; };
  [[-4.6, -2.8, 1], [-1.8, -4.8, 1.2], [4.4, -3.6, 1.1], [3.6, -1.2, 0.9], [-5.8, -5.5, 1.3], [6.2, -6, 1.2], [-3.2, -7.5, 1.4], [0.4, -8.6, 1.3], [5.5, 1.2, 1.0], [-6.5, 0.8, 1.1]].forEach(([x, z, s], i) => rawTree(x, z, s));
  // ── cabin ──
  const cb = new VoxelMap(0.4), W = 9, D = 7, WH = 5, wall = '#E9D7B0', beam = '#7B5130', roof = '#B8442F';
  cb.box(0, 0, 0, W, WH, D, (x, y, z) => ((x === 0 || x === W - 1) && (z === 0 || z === D - 1) ? beam : y === 0 ? '#8A8479' : wall));
  for (let r = 0; r < 5; r++) cb.box(-1 + r, WH + r, -1, W + 2 - 2 * r, 1, D + 2, shade(roof, 0.9 + r * 0.05));
  cb.box(W - 3, WH + 2, 1, 2, 4, 2, '#8C5B44'); cb.box(3, 0, D - 1, 2, 3, 1, '#6B4429'); cb.box(1, 2, D - 1, 2, 2, 1, '#FFE3A0'); cb.box(W - 3, 2, D - 1, 2, 2, 1, '#FFE3A0');
  vmesh(cb, [W / 2, 0, D / 2], scene, [cabin[0], 0, cabin[1]], 0.05);
  for (const [dx] of [[-1.7], [1.7]]) { const gl = new THREE.PointLight('#FFC66E', 1.1, 5, 1.8); gl.position.set(cabin[0] + dx * 1.0, 0.9, cabin[1] + 2.0); scene.add(gl); }
  // ── lanterns + flowers ──
  const lanterns = []; [[-0.9, 0.3], [1.9, -1.9], [-2.2, -3.2]].forEach(([x, z]) => { const m = new VoxelMap(0.1); m.box(0, 0, 0, 1, 7, 1, '#4A3426'); m.box(-1, 7, -1, 3, 3, 3, '#FFD27A'); const mm = vmesh(m, [0.5, 0, 0.5], scene, [x, 0, z], 0.02); const em = mm.material; em.emissive = new THREE.Color('#FFB84A'); em.emissiveIntensity = 0.55; const pl = new THREE.PointLight('#FFBE5C', 1.5, 6, 1.7); pl.position.set(x, 0.85, z); scene.add(pl); lanterns.push(pl); });
  const fl = new VoxelMap(0.1); for (let i = 0; i < 60; i++) { const x = Math.round((hash(i, 1) - 0.5) * 120), z = Math.round((hash(i, 2) - 0.5) * 110) - 20; fl.set(x, 0, z, ['#FF6B8E', '#FFD45A', '#FFFFFF', '#FF9F43'][i % 4]); fl.set(x, -1, z, '#3F9A3F'); } const flm = vmesh(fl, [0, 0, 0], scene, [0, 0, 0], 0.02);
  // ── ambient life ──
  const cloudMap = new VoxelMap(0.4); [[0, 0, 0, 5, 2, 3], [1, 2, 0, 3, 1, 2], [-2, 0, 1, 3, 1, 2]].forEach(([x, y, z, w, h, d]) => cloudMap.box(x, y, z, w, h, d, '#FFFFFF'));
  const clouds = []; for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(cloudMap.geometry([0, 0, 0], 0.02), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, emissive: '#FFE8CF', emissiveIntensity: 0.55 })); c.position.set(-22 + i * 7.5, 8 + (i % 3) * 1.8, -16 - (i % 4) * 3); c.scale.setScalar(1.2 + (i % 3) * 0.4); scene.add(c); clouds.push(c); }
  const smoke = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: '#E8E4DC', roughness: 1, transparent: true, opacity: 0.7 })); scene.add(m); smoke.push(m); }
  const leaves = []; for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.07), new THREE.MeshStandardMaterial({ color: i % 2 ? '#E9A23B' : '#C8512B', roughness: 0.9 })); scene.add(m); leaves.push(m); }
  const flies = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: '#FFF3A8', toneMapped: false })); scene.add(m); flies.push(m); }
  // ── light: low golden sun, long soft shadows ──
  sunlight(scene, E, { col: '#FFD9A0', i: 3.6, pos: [-6, 5.5, 7], target: [0, 0.6, 0], box: 8, sky: '#BCD6FF', ground: '#7A8F4B', hemi: 0.95, env: 0.5 });
  return {
    scene, look: { bloom: 0.3, bloomThreshold: 0.88, vignette: 0.25, grain: 0.012, warm: 0.035, exposure: 1.0 },
    subjects: { cabin: { pos: [cabin[0], 0, cabin[1] + 1.4], height: 3.4, rotY: 0 }, pond: { pos: [pond[0], 0, pond[1]], height: 0.4, rotY: 0 }, door: { pos: [cabin[0] - 0.4, 0, cabin[1] + 1.4], height: 1.2, rotY: 0 } },
    update(t) {
      clouds.forEach((c, i) => { c.position.x = ((c.position.x + 30 + t * (0.15 + (i % 3) * 0.05)) % 66) - 30; });
      smoke.forEach((m, i) => { const p = (t * 0.22 + i / smoke.length) % 1; m.position.set(cabin[0] + 1.0 + p * 0.6 + Math.sin(p * 6 + i) * 0.08, 4.6 + p * 1.8, cabin[1] - 0.6); m.scale.setScalar(0.6 + p * 1.6); m.material.opacity = 0.6 * (1 - p); });
      leaves.forEach((m, i) => { const p = (t * 0.16 + hash(i)) % 1; m.position.set(-3 + hash(i, 3) * 7 + Math.sin(t * 0.9 + i) * 0.35, 3 - p * 3, -4 + hash(i, 5) * 7); m.rotation.set(t * 1.3 + i, t * 0.8, i); });
      flies.forEach((m, i) => { m.position.set(-2.5 + hash(i, 7) * 6 + Math.sin(t * 0.7 + i) * 0.4, 0.3 + hash(i, 9) * 1.1 + Math.sin(t * 1.3 + i * 2) * 0.12, -3 + hash(i, 11) * 5 + Math.cos(t * 0.6 + i) * 0.4); m.visible = Math.sin(t * 2.2 + i * 1.7) > -0.3; });
      lanterns.forEach((l, i) => { l.intensity = 1.5 + Math.sin(t * 7 + i * 3) * 0.12; });
    },
  };
}
