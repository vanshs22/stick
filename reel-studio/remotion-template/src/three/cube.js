// "Cubies": original glossy cube-bodied mascots for the neon-stage look. A soft rounded cube with a high-gloss clear coat and a faint inner glow,
// square white eyes with square pupils that look around, a small mouth that lip-syncs, stubby mitten arms and boots, optional bow / antenna / halo.
// Not a copy of any existing character: the rounded-cube body with a glossy face plate is the identity; colour and one accessory make each Cubie different.
// Same Rig as every other actor, so poses, moods, reach and lip-sync are shared (see gestures.js).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Rig } from './rig.js';

export class Cube extends Rig {
  constructor(o = {}) {
    super({ hips: 0.33, spine: 0, shoulderY: 0.5, shoulderX: 0.54, head: 0.5, upper: 0.1, fore: 0.14, hipX: 0.22, thigh: 0.17, shin: 0.16, hipDrop: 0 });
    const c = { body: '#FF7A3D', boots: '#2A2230', eye: '#ffffff', pupil: '#14101c', blush: '#FF9EB5', bow: null, antenna: null, halo: null, glow: 0.22, scale: 1, ...o };
    this.o = c;
    const body = new THREE.MeshPhysicalMaterial({ color: c.body, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.5, sheenColor: new THREE.Color(c.body), emissive: new THREE.Color(c.body), emissiveIntensity: c.glow });
    const dark = new THREE.MeshPhysicalMaterial({ color: c.boots, roughness: 0.3, clearcoat: 0.6 });
    const add = (parent, geo, mat, pos = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; m.position.set(...pos); parent.add(m); return m; };
    // the cube is the head group (it tilts and bobs as one soft block)
    add(this.head, new RoundedBoxGeometry(0.98, 0.84, 0.78, 6, 0.2), body);
    for (const k of ['L', 'R']) {
      const a = this.arm[k];
      add(a.sh, new RoundedBoxGeometry(0.16, 0.2, 0.16, 4, 0.06), body, [0, -0.05, 0]);
      add(a.el, new RoundedBoxGeometry(0.17, 0.22, 0.17, 4, 0.07), body, [0, -0.07, 0.01]);
      const l = this.leg[k];
      add(l.hip, new RoundedBoxGeometry(0.2, 0.24, 0.2, 4, 0.07), body, [0, -0.08, 0]);
      add(l.kn, new RoundedBoxGeometry(0.24, 0.16, 0.34, 4, 0.06), dark, [0, -0.1, 0.05]);
    }
    // face plate: eyes + mouth drawn on a canvas that sits just in front of the cube
    this.faceCv = document.createElement('canvas'); this.faceCv.width = 512; this.faceCv.height = 384; this.faceTex = new THREE.CanvasTexture(this.faceCv); this.faceTex.colorSpace = THREE.SRGBColorSpace; this.faceTex.anisotropy = 4;
    this.face3 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.675), new THREE.MeshBasicMaterial({ map: this.faceTex, color: '#a8a8a8', transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.face3.position.set(0, 0.02, 0.395); this.head.add(this.face3);
    if (c.bow) { const bm = new THREE.MeshPhysicalMaterial({ color: c.bow, roughness: 0.25, clearcoat: 1, emissive: new THREE.Color(c.bow), emissiveIntensity: 0.2 }), g = new THREE.Group(); g.position.set(-0.3, 0.46, 0.12); g.rotation.z = 0.28;
      for (const s of [-1, 1]) { const w = add(g, new THREE.ConeGeometry(0.17, 0.3, 24), bm, [s * 0.17, 0, 0]); w.rotation.z = -s * Math.PI / 2; w.scale.set(1, 1, 0.55); }
      add(g, new THREE.SphereGeometry(0.075, 20, 14), bm); this.head.add(g); }
    if (c.antenna) { add(this.head, new THREE.CylinderGeometry(0.018, 0.018, 0.2, 10), dark, [0, 0.52, 0]); this.bulbMat = new THREE.MeshStandardMaterial({ color: c.antenna, emissive: c.antenna, emissiveIntensity: 1.4 }); add(this.head, new THREE.SphereGeometry(0.07, 20, 14), this.bulbMat, [0, 0.66, 0]); }
    if (c.halo) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 12, 40), new THREE.MeshBasicMaterial({ color: c.halo, toneMapped: false })); h.rotation.x = Math.PI / 2; h.position.set(0, 0.62, 0); this.head.add(h); }
    this.group.scale.setScalar(c.scale); this.pose({}); this.face({});
  }
  face(q = {}) {
    const c = this.o, g = this.faceCv.getContext('2d'), W = 512, H = 384, smile = q.smile ?? 0.2, open = Math.max(0, Math.min(1, q.open ?? 0)), lid = Math.max(-0.4, Math.min(1, q.lid ?? 0)), brow = q.brow ?? 0, tilt = q.tilt ?? 0, look = q.look || [0, 0];
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round';
    const lx = Math.max(-1, Math.min(1, look[0] / 25)), ly = Math.max(-1, Math.min(1, -look[1] / 25)), ex = 92, ey = 142, ew = 96 * (lid < 0 ? 1 - lid * 0.1 : 1), eh = 116 * (lid < 0 ? 1 - lid * 0.5 : 1), cover = Math.max(0, lid) * eh * 1.15;
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    for (const s of [-1, 1]) {
      const cx = W / 2 + s * ex, cy = ey; g.save(); rr(cx - ew / 2, cy - eh / 2 + cover, ew, Math.max(4, eh - cover), 16); g.clip();
      g.fillStyle = c.eye; g.fillRect(cx - ew, cy - eh, ew * 2, eh * 2);
      g.fillStyle = c.pupil; const pw = ew * 0.56, ph = eh * 0.6; rr(cx - pw / 2 + lx * 12, cy - ph / 2 + ly * 14 + cover * 0.4, pw, ph, 8); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(cx - pw / 2 + lx * 12 + 6, cy - ph / 2 + ly * 14 + cover * 0.4 + 6, 11, 11); g.restore();
      if (Math.abs(brow) > 0.08) { g.strokeStyle = c.pupil; g.lineWidth = 11; g.beginPath(); const by = cy - eh / 2 - 22 - brow * 22, a = -s * tilt * 0.02; g.moveTo(cx - 36, by - Math.sin(a) * 30); g.lineTo(cx + 36, by + Math.sin(a) * 30); g.stroke(); }
      if (smile > 0.5) { g.fillStyle = c.blush; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(cx + s * 30, cy + eh / 2 + 34, 26, 13, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    }
    const my = 306, mx = W / 2 + lx * 10; g.fillStyle = c.pupil; g.strokeStyle = c.pupil;
    if (open > 0.08) { rr(mx - 26 - smile * 8, my - 6, 52 + smile * 16, 14 + open * 52, 14); g.fill(); if (open > 0.5) { g.fillStyle = '#d6485f'; g.beginPath(); g.ellipse(mx, my + 18 + open * 28, 17, 9, 0, 0, 7); g.fill(); } }
    else { g.lineWidth = 12; g.beginPath(); g.moveTo(mx - 28, my - smile * 3); g.quadraticCurveTo(mx, my + 8 + smile * 34, mx + 28, my - smile * 3); g.stroke(); }
    this.faceTex.needsUpdate = true;
    if (this.bulbMat) this.bulbMat.emissiveIntensity = 1 + open * 1.6;
  }
}
