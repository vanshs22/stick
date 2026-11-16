// Voxel toolkit + the voxel character. ONE base unit (U = 0.1 m) for characters, props and (at 2U) terrain, so every cube in a frame
// belongs to the same grid. Geometry is built from a sparse voxel map with hidden faces removed and a little per-voxel colour variation.
import * as THREE from 'three';
import { Rig } from './rig.js';

export const U = 0.1;
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], k: 0.86 }, { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], k: 0.78 },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], k: 1.12 }, { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], k: 0.62 },
  { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], k: 0.95 }, { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], k: 0.7 },
];
const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
export class VoxelMap {
  constructor(unit = U) { this.m = new Map(); this.u = unit; }
  set(x, y, z, color) { this.m.set(`${x},${y},${z}`, new THREE.Color(color)); return this; }
  box(x0, y0, z0, nx, ny, nz, color) { for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) this.set(x0 + x, y0 + y, z0 + z, typeof color === 'function' ? color(x0 + x, y0 + y, z0 + z) : color); return this; }
  has(x, y, z) { return this.m.has(`${x},${y},${z}`); }
  /** merged BufferGeometry with vertex colours; `origin` = grid coordinate that becomes (0,0,0); jitter = per-voxel brightness variation */
  geometry(origin = [0, 0, 0], jitter = 0.05) {
    const pos = [], nor = [], col = [], idx = [], u = this.u;
    for (const [key, c0] of this.m) {
      const [x, y, z] = key.split(',').map(Number), j = 1 + (hash(x, y, z) - 0.5) * 2 * jitter;
      for (const f of FACES) {
        if (this.has(x + f.n[0], y + f.n[1], z + f.n[2])) continue;
        const b = pos.length / 3, k = f.k * j;
        for (const c of f.c) { pos.push((x + c[0] - origin[0]) * u, (y + c[1] - origin[1]) * u, (z + c[2] - origin[2]) * u); nor.push(...f.n); col.push(Math.min(1, c0.r * k), Math.min(1, c0.g * k), Math.min(1, c0.b * k)); }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
  }
}
export const VMAT = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.0 });
export function vmesh(map, origin, parent, pos = [0, 0, 0], jitter) { const m = new THREE.Mesh(map.geometry(origin, jitter), VMAT()); m.castShadow = m.receiveShadow = true; m.position.set(...pos); if (parent) parent.add(m); return m; }
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

/** "Voxel person": 18 voxels tall (1.8 m), 6-voxel head. Rigid-block limbs with real elbows/knees; the face is built from voxels and swaps states. */
export class VoxelPerson extends Rig {
  constructor(o = {}) {
    super({ hips: 0.6, spine: 0, shoulderY: 0.52, shoulderX: 0.4, head: 0.6, upper: 0.3, fore: 0.3, hipX: 0.15, thigh: 0.3, shin: 0.3, hipDrop: 0 });
    const c = { skin: '#C98A5E', hair: '#2A1B12', shirt: '#4B6FE0', sleeve: null, pants: '#2C3A63', shoes: '#F2F2F2', hairStyle: 'cap', beard: false, glasses: false, badge: null, iris: '#1B1410', scale: 1, ...o };
    this.o = c; const sk = (k = 1) => shade(c.skin, k);
    const T = new VoxelMap(); T.box(-3, 0, -2, 6, 6, 4, (x, y, z) => (y === 0 ? shade(c.pants, 1.1) : c.shirt)); if (c.badge) T.box(1, 3, 2, 1, 1, 1, c.badge);
    T.box(-1, 5, -2, 2, 1, 4, shade(c.shirt, 0.82)); vmesh(T, [0, 0, 0], this.spine, [0, 0, 0]);
    // head (6x6x6) + hair
    const H = new VoxelMap(); H.box(-3, 0, -3, 6, 6, 6, (x, y, z) => sk(0.97 + hash(x, y, z) * 0.06));
    const hs = c.hairStyle; const HR = c.hair;
    H.box(-3, 5, -3, 6, 1, 5, HR); if (hs !== 'none') { H.box(-3, 2, -3, 6, 4, 1, HR); H.box(-3, 3, -3, 1, 3, 6, HR); H.box(2, 3, -3, 1, 3, 6, HR); if (hs === 'long') { H.box(-3, 0, -3, 6, 3, 1, HR); H.box(-3, 0, -3, 1, 3, 3, HR); H.box(2, 0, -3, 1, 3, 3, HR); } if (hs === 'spiky') for (const [x, z] of [[-2, -1], [0, 0], [1, -2], [-1, 1], [2, 1]]) H.box(x, 6, z, 1, 1 + ((x + z + 8) % 2), 1, HR); }
    if (c.beard) { H.box(-3, 0, 1, 6, 2, 2, HR); H.box(-3, 0, -1, 1, 3, 2, HR); H.box(2, 0, -1, 1, 3, 2, HR); }
    this.skullMap = H; vmesh(H, [0, 0, 0], this.head, [0, 0, 0]);
    // arms: upper (sleeve) + forearm (skin); pivot at the top
    const sl = c.sleeve || c.shirt;
    for (const k of ['L', 'R']) {
      const a = this.arm[k], up = new VoxelMap().box(-1, -3, -1, 2, 3, 2, sl), fo = new VoxelMap().box(-1, -3, -1, 2, 3, 2, (x, y) => (y === -1 ? sk(1.0) : sk(0.98))); vmesh(up, [0, 0, 0], a.sh); vmesh(fo, [0, 0, 0], a.el);
      const l = this.leg[k], th = new VoxelMap().box(-1, -3, -1, 3, 3, 3, c.pants), sh = new VoxelMap().box(-1, -3, -1, 3, 2, 3, c.pants).box(-1, -3, -1, 3, 1, 4, c.shoes); vmesh(th, [0.5, 0, 0.5], l.hip); vmesh(sh, [0.5, 0, 0.5], l.kn);
    }
    this.buildFace(); this.group.scale.setScalar(c.scale); this.pose({}); this.face({});
  }
  buildFace() {
    const c = this.o, f = new THREE.Group(); f.position.set(0, 0, 0.3 + 0.001); this.head.add(f); const vm = (map, parent, p = [0, 0, 0]) => { const m = new THREE.Mesh(map.geometry([0, 0, 0], 0.0), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })); m.position.set(...p); parent.add(m); return m; };
    this.eyeParts = []; const white = '#FBFBF6', ink = '#15100D', skin = c.skin;
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * 0.15, 0.3, 0); f.add(g);
      const w = vm(new VoxelMap().box(-1, 0, 0, 2, 2, 1, white), g, [0, 0, 0]); const pg = new THREE.Group(); g.add(pg); const p = vm(new VoxelMap().box(0, 0, 0, 1, 1, 1, c.iris), pg, [-0.05, 0.05, 0.01]); const hl = vm(new VoxelMap().box(0, 0, 0, 1, 1, 1, white), pg, [0.0, 0.1, 0.012]); hl.scale.setScalar(0.28); hl.position.set(0.03, 0.14, 0.011);
      const lid = vm(new VoxelMap().box(-1, 0, 0, 2, 2, 1, shade(skin, 0.99)), g, [0, 0, 0.012]); lid.scale.set(1.02, 0.01, 1); lid.position.y = 0.2;
      const brow = vm(new VoxelMap().box(-1, 0, 0, 2, 1, 1, c.hair), g, [0, 0.2, 0.0]); this.eyeParts.push({ g, pg, lid, brow, s });
    }
    const mk = (cells, col = '#2A0E0C') => { const m = new VoxelMap(); for (const [x, y] of cells) m.set(x, y, 0, col); return vm(m, f, [0, 0.0, 0]); }, teeth = (cells) => { const m = new VoxelMap(); for (const [x, y] of cells) m.set(x, y, 0, '#F6F2EA'); return m; };
    this.mouths = { flat: mk([[-1, 0], [0, 0]], '#2A0E0C'), smile: mk([[-2, 1], [-1, 0], [0, 0], [1, 1]], '#2A0E0C'), frown: mk([[-2, 0], [-1, 1], [0, 1], [1, 0]], '#2A0E0C'), open: mk([[-1, 0], [0, 0]]), big: mk([[-1, 0], [0, 0], [-1, 1], [0, 1]]) }; Object.values(this.mouths).forEach((m) => (m.visible = false)); this.mouths.flat.visible = true;
    if (c.glasses) { const gm = new VoxelMap(); for (const x0 of [-3, 0]) { gm.box(x0, 0, 0, 3, 1, 1, '#1A1A22'); gm.box(x0, 3, 0, 3, 1, 1, '#1A1A22'); gm.box(x0, 1, 0, 1, 2, 1, '#1A1A22'); gm.box(x0 + 2, 1, 0, 1, 2, 1, '#1A1A22'); } gm.box(-0, 1, 0, 0, 0, 0, '#1A1A22'); const g = vm(gm, f, [0, 0.27, 0.02]); g.position.set(-0.0, 0.27, 0.02); g.scale.setScalar(1); g.position.x = -0.0; }
  }
  face(q = {}) {
    if (!this.eyeParts) return;
    const smile = q.smile ?? 0.15, open = Math.max(0, Math.min(1, q.open ?? 0)), lid = q.lid ?? 0, look = q.look || [0, 0], brow = q.brow ?? 0, tilt = q.tilt ?? 0;
    for (const e of this.eyeParts) {
      const cover = Math.max(0, Math.min(1, lid)) * 0.2;                           // lid lowers from the top
      e.lid.scale.y = Math.max(0.01, cover / 0.2 * 1.0); e.lid.position.y = 0.2 - cover; e.lid.visible = cover > 0.02;
      e.pg.position.set(Math.max(-0.05, Math.min(0.05, (look[0] || 0) * 0.002)), Math.max(-0.05, Math.min(0.05, -(look[1] || 0) * 0.003)), 0);
      e.brow.position.y = 0.2 + brow * 0.04; e.brow.rotation.z = (e.s * tilt * Math.PI) / 180 * -0.7; e.g.scale.y = lid < -0.2 ? 1.18 : 1;
    }
    const m = this.mouths; Object.values(m).forEach((x) => (x.visible = false));
    (open > 0.6 ? m.big : open > 0.22 ? m.open : smile > 0.4 ? m.smile : smile < -0.3 ? m.frown : m.flat).visible = true;
  }
}
