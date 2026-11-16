// "Pips": original small expressive characters. A smooth sculpted bean body (surface-nets clay), a dark glass visor whose glowing
// face really acts (eyes that squint, widen, droop, look around; brows; a mouth that lip-syncs), an antenna bulb that reacts to the
// mood, stubby limbs with mitten hands and boots, optional headset. Not a copy of any existing character: the visor-face and the
// soft bean silhouette are the identity; colour, antenna and accessories make each Pip different.
import * as THREE from 'three';
import { ellipsoid, capsule, smin, rbox, mesh, rgb } from './sdf.js';
import { Rig } from './rig.js';

const cache = new Map();
const sculpt = (key, f, b, step, col) => { if (!cache.has(key)) cache.set(key, mesh(f, b, step, col)); return cache.get(key); };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const D = THREE.MathUtils.degToRad;

export class Critter extends Rig {
  constructor(o = {}) {
    super({ hips: 0.3, spine: 0, shoulderY: 0.44, shoulderX: 0.31, head: 0.5, upper: 0.13, fore: 0.17, hipX: 0.13, thigh: 0.15, shin: 0.15, hipDrop: 0 });
    const c = { body: '#F0683C', belly: '#FFE9C9', boots: '#2A2A33', eye: '#7CF3FF', antenna: '#7CF3FF', headset: false, badge: null, scale: 1, ...o };
    this.o = c; const B = rgb(c.body), BE = rgb(c.belly), K = JSON.stringify([c.body, c.belly]);
    const mat = (extra = {}) => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: new THREE.Color(c.belly), ...extra });
    const add = (parent, geo, pos = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat()); m.castShadow = m.receiveShadow = true; m.position.set(...pos); parent.add(m); return m; };
    // body: a soft pear/bean, belly patch and a waist seam painted into the vertex colours
    add(this.spine, sculpt('critter-body' + K, (p) => smin(ellipsoid(p, [0, 0.52, 0], [0.3, 0.3, 0.27]), ellipsoid(p, [0, 0.24, 0.01], [0.285, 0.26, 0.26]), 0.14),
      [[-0.36, -0.08, -0.34], [0.36, 0.86, 0.36]], 0.011, (p) => { const patch = sstep(0.04, 0.0, Math.hypot(p[0] / 1.0, (p[1] - 0.22) / 1.5) - 0.17) * sstep(0.02, 0.1, p[2]); const seam = sstep(0.006, 0.0, Math.abs(p[1] - 0.12) - 0.008); const base = mixc(B, BE, patch); return mixc(base, rgb(c.boots), seam * 0.6); }));
    for (const k of ['L', 'R']) {
      const a = this.arm[k], s = a.side;
      add(a.sh, sculpt('critter-up' + K, (p) => capsule(p, [0, 0, 0], [0, -0.13, 0], 0.062, 0.056), [[-0.09, -0.19, -0.09], [0.09, 0.08, 0.09]], 0.005, () => B));
      add(a.el, sculpt('critter-fo' + K + s, (p) => smin(capsule(p, [0, 0, 0], [0, -0.14, 0.004], 0.054, 0.05), ellipsoid(p, [0, -0.19, 0.01], [0.074, 0.086, 0.068]), 0.04), [[-0.11, -0.3, -0.1], [0.11, 0.07, 0.1]], 0.005, (p) => (p[1] < -0.12 ? BE : B)));
      const l = this.leg[k];
      add(l.hip, sculpt('critter-th' + K, (p) => capsule(p, [0, 0, 0], [0, -0.15, 0.003], 0.075, 0.068), [[-0.1, -0.2, -0.1], [0.1, 0.09, 0.1]], 0.005, () => B));
      add(l.kn, sculpt('critter-boot' + c.boots, (p) => smin(capsule(p, [0, 0, 0], [0, -0.09, 0.005], 0.064, 0.064), ellipsoid(p, [0, -0.095, 0.045], [0.095, 0.058, 0.14]), 0.04), [[-0.13, -0.19, -0.14], [0.13, 0.07, 0.22]], 0.005, (p) => (p[1] < -0.12 ? mixc(rgb(c.boots), [0.9, 0.9, 0.9], 0.55) : rgb(c.boots))));
    }
    // visor, face, antenna, headset live on the head group (origin = middle of the face)
    const dark = new THREE.MeshPhysicalMaterial({ color: '#11131A', roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
    this.visor = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), dark); this.visor.scale.set(0.255, 0.2, 0.125); this.visor.position.set(0, 0.0, 0.205); this.visor.castShadow = true; this.head.add(this.visor);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 10, 56), mat({ vertexColors: false, color: c.belly })); rim.scale.set(0.262, 0.207, 0.05); rim.position.set(0, 0, 0.255); rim.castShadow = true; this.head.add(rim);
    this.faceCv = document.createElement('canvas'); this.faceCv.width = 512; this.faceCv.height = 320; this.faceTex = new THREE.CanvasTexture(this.faceCv); this.faceTex.colorSpace = THREE.SRGBColorSpace; this.faceTex.anisotropy = 4;
    this.face3 = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.8, 1.6), new THREE.MeshBasicMaterial({ map: this.faceTex, transparent: true, toneMapped: false, depthWrite: false }));
    this.face3.scale.set(0.2575, 0.2035, 0.1275); this.face3.position.copy(this.visor.position); this.head.add(this.face3);
    const stalk = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.12, 4, 10), new THREE.MeshStandardMaterial({ color: c.boots, roughness: 0.5 })); stalk.position.set(0, 0.36, -0.02); stalk.castShadow = true; this.head.add(stalk);
    this.bulbMat = new THREE.MeshStandardMaterial({ color: c.antenna, emissive: c.antenna, emissiveIntensity: 1.2, roughness: 0.3 }); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), this.bulbMat); bulb.position.set(0, 0.46, -0.02); this.head.add(bulb);
    if (c.headset) { const hm = new THREE.MeshStandardMaterial({ color: c.boots, roughness: 0.4, metalness: 0.2 }); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 24), hm); e.rotation.z = Math.PI / 2; e.position.set(s * 0.315, -0.02, -0.02); e.castShadow = true; this.head.add(e); } const band = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.012, 8, 40, Math.PI), hm); band.position.set(0, -0.02, -0.02); this.head.add(band); const boom = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.2, 4, 8), hm); boom.position.set(0.25, -0.12, 0.2); boom.rotation.set(0.9, 0, 1.0); this.head.add(boom); }
    if (c.badge) { const bd = new THREE.Mesh(new THREE.CircleGeometry(0.028, 24), new THREE.MeshBasicMaterial({ color: c.badge, toneMapped: false })); bd.position.set(0.13, 0.4, 0.27); bd.rotation.y = 0.45; this.spine.add(bd); }
    this.group.scale.setScalar(c.scale); this.pose({}); this.face({});
  }
  face(q = {}) {
    const g = this.faceCv.getContext('2d'), W = 512, H = 320, smile = q.smile ?? 0.2, open = Math.max(0, Math.min(1, q.open ?? 0)), brow = q.brow ?? 0, tilt = q.tilt ?? 0, lid = Math.max(-0.4, Math.min(1, q.lid ?? 0)), look = q.look || [0, 0], eye = this.o.eye;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = eye; g.shadowBlur = 22; g.fillStyle = eye; g.strokeStyle = eye;
    const lx = Math.max(-26, Math.min(26, look[0] * 1.3)), ly = Math.max(-18, Math.min(18, -look[1] * 1.2)), happy = smile > 0.55 && lid <= 0.45;
    for (const s of [-1, 1]) {
      const cx = W / 2 + s * 112 + lx, cy = 118 + ly;
      if (happy) { g.lineWidth = 20; g.beginPath(); g.arc(cx, cy + 34, 40, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      else {
        const ry = 62 * (lid < 0 ? 1 - lid * 0.55 : 1), rx = 42 * (lid < 0 ? 1 - lid * 0.1 : 1), cover = Math.max(0, lid) * 2 * ry;
        g.save(); g.beginPath(); g.rect(cx - rx - 8, cy - ry - 8 + cover, rx * 2 + 16, ry * 2 + 16); g.clip(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill();
        g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx - 12, cy - ry * 0.32, 11, 15, 0, 0, 7); g.fill(); g.restore(); g.fillStyle = eye; g.shadowBlur = 22;
      }
      g.lineWidth = 13; g.beginPath(); const by = cy - 96 - brow * 26, ang = -s * tilt * 0.022; g.moveTo(cx - 44, by - Math.sin(ang) * 44 + 8); g.quadraticCurveTo(cx, by - 18, cx + 44, by + Math.sin(ang) * 44 + 8); g.stroke();
    }
    const my = 250;
    if (open > 0.08) { g.beginPath(); g.ellipse(W / 2 + lx * 0.4, my + open * 4, 30 + Math.max(0, smile) * 18, 8 + open * 34, 0, 0, 7); g.fill(); }
    else { g.lineWidth = 15; g.beginPath(); g.moveTo(W / 2 - 46 + lx * 0.4, my - smile * 4); g.quadraticCurveTo(W / 2 + lx * 0.4, my + smile * 46, W / 2 + 46 + lx * 0.4, my - smile * 4); g.stroke(); }
    this.faceTex.needsUpdate = true;
    if (this.bulbMat) this.bulbMat.emissiveIntensity = 0.8 + (q.open ?? 0) * 1.6 + Math.max(0, smile) * 0.6;
  }
}
