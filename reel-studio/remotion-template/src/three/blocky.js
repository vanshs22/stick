// "Blockhead": an original block-toy character in the spirit of block-building game avatars (not a copy of any one):
// soft-edged plastic bricks, rigid blocky limbs, a painted-on face that really emotes, sleeve/trouser colour blocking, a cap.
// Same skeleton conventions as the SDF Human (rig.js). Arms and legs are rigid like toys: shoulders and hips rotate, elbows/knees do not.
import * as THREE from 'three';
import { Rig } from './rig.js';
import { rbox } from './worlds.js';

const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const plastic = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.35, ...o });

export class Blocky extends Rig {
  constructor(o = {}) {
    super({ hips: 0.66, spine: 0, shoulderY: 0.58, shoulderX: 0.4, head: 0.62, upper: 0.34, fore: 0.3, hipX: 0.135, thigh: 0.33, shin: 0.33, hipDrop: 0 });
    const c = { skin: '#F2C68E', shirt: '#2f9a5a', sleeve: null, pants: '#27386b', shoe: '#1b1d27', hat: '#D8402F', hatStyle: 'cap', hair: '#3a2a1a', logo: '#FFE34D', scale: 1, ...o };
    this.o = c; this.elbowFlex = false; this.kneeFlex = false;
    const skin = plastic(c.skin), shirt = plastic(c.shirt), sleeve = plastic(c.sleeve || c.shirt), pants = plastic(c.pants), shoe = plastic(c.shoe, { roughness: 0.5 });
    // torso with a chest emblem
    rbox(0.56, 0.64, 0.3, shirt, 0, 0.29, 0, this.spine, 0.045);
    const emb = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: logoTex(c.logo), transparent: true })); emb.position.set(0, 0.34, 0.153); this.spine.add(emb);
    rbox(0.58, 0.07, 0.31, plastic(shade(c.pants, 1.15)), 0, -0.02, 0, this.spine, 0.02);                      // belt
    for (const k of ['L', 'R']) {
      const a = this.arm[k]; rbox(0.25, 0.4, 0.25, sleeve, 0, -0.14, 0, a.sh, 0.04); rbox(0.24, 0.3, 0.24, skin, 0, -0.5, 0, a.sh, 0.04);   // sleeve + forearm (rigid)
      const l = this.leg[k]; rbox(0.27, 0.58, 0.27, pants, 0, -0.29, 0, l.hip, 0.04); rbox(0.285, 0.1, 0.33, shoe, 0, -0.62, 0.025, l.hip, 0.04);
    }
    // neck + head
    rbox(0.14, 0.1, 0.14, skin, 0, 0.0, 0, this.head, 0.02);
    const head = rbox(0.4, 0.4, 0.38, skin, 0, 0.27, 0, this.head, 0.12); this.skull = head;
    this.faceCv = document.createElement('canvas'); this.faceCv.width = this.faceCv.height = 256; this.faceTex = new THREE.CanvasTexture(this.faceCv); this.faceTex.colorSpace = THREE.SRGBColorSpace; this.faceTex.anisotropy = 4;
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: this.faceTex, transparent: true, toneMapped: false, depthWrite: false })); fp.position.set(0, 0.27, 0.192); this.head.add(fp);
    // headwear
    if (c.hatStyle === 'cap') { rbox(0.42, 0.14, 0.4, plastic(c.hat), 0, 0.42, -0.005, this.head, 0.06); rbox(0.34, 0.035, 0.22, plastic(shade(c.hat, 0.85)), 0, 0.37, 0.27, this.head, 0.015); }
    else if (c.hatStyle === 'hair') rbox(0.42, 0.13, 0.42, plastic(c.hair), 0, 0.43, -0.01, this.head, 0.06);
    // ears, shirt collar and hem stripe, cuffs: small things that make the avatar read as designed
    for (const s of [-1, 1]) rbox(0.05, 0.1, 0.07, skin, s * 0.205, 0.26, 0, this.head, 0.02);
    rbox(0.3, 0.05, 0.16, plastic(shade(c.shirt, 1.25)), 0, 0.6, 0.075, this.spine, 0.02);
    rbox(0.575, 0.06, 0.305, plastic(shade(c.shirt, 0.78)), 0, -0.01, 0, this.spine, 0.02);
    for (const k of ['L', 'R']) rbox(0.255, 0.05, 0.255, plastic(shade(c.sleeve || c.shirt, 0.8)), 0, -0.325, 0, this.arm[k].sh, 0.02);
    if (c.backpack) rbox(0.36, 0.46, 0.14, plastic(c.backpack), 0, 0.3, -0.22, this.spine, 0.06);
    if (c.hatStyle === 'beanie') { rbox(0.42, 0.16, 0.42, plastic(c.hat), 0, 0.41, -0.005, this.head, 0.08); rbox(0.08, 0.08, 0.08, plastic(shade(c.hat, 1.3)), 0, 0.52, 0, this.head, 0.04); }
    if (c.nameTag) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = 'rgba(16,18,24,0.7)'; g.beginPath(); g.roundRect(4, 6, 248, 52, 14); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText(c.nameTag, 128, 44); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); tag.scale.set(0.46, 0.115, 1); tag.position.set(0, 0.74, 0); tag.renderOrder = 10; this.head.add(tag); }
    this.group.scale.setScalar(c.scale); this.pose({}); this.face({});
  }
  /** painted-on face: the whole expression is redrawn from the mood each frame */
  face(q = {}) {
    const g = this.faceCv.getContext('2d'), smile = q.smile ?? 0.2, open = Math.max(0, Math.min(1, q.open ?? 0)), brow = q.brow ?? 0, tilt = q.tilt ?? 0, lid = Math.max(-0.4, Math.min(1, q.lid ?? 0)), look = q.look || [0, 0];
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 256, 256); g.translate(128, 128); g.lineCap = 'round'; g.lineJoin = 'round';
    const ink = '#15161c', ey = -14, lx = Math.max(-8, Math.min(8, look[0] * 0.4)), ly = Math.max(-6, Math.min(6, -look[1] * 0.4));
    for (const s of [-1, 1]) {
      const ex = s * 50, eh = Math.max(3, 30 * (1 - Math.max(0, lid)) * (lid < 0 ? 1 + -lid * 0.5 : 1)), ew = 17;
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, ew + 4, eh + 4, 0, 0, 7); g.fill();
      g.fillStyle = ink; g.beginPath(); g.ellipse(ex + lx, ey + ly, ew * 0.62, Math.max(2.5, eh * 0.72), 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + lx + 4, ey + ly - 5, 3.4, 0, 7); g.fill();
      g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); const by = ey - 36 - brow * 16, ang = (tilt * Math.PI) / 180 * 0.9 * -s; g.moveTo(ex - 24, by + Math.sin(-ang) * 24 * 0.6); g.lineTo(ex + 24, by + Math.sin(ang) * 24 * 0.6); g.stroke();
    }
    g.strokeStyle = ink; g.lineWidth = 9;
    if (open > 0.06) { g.fillStyle = '#4a1418'; g.beginPath(); g.ellipse(0, 62, 24 + Math.max(0, smile) * 8, 6 + open * 26, 0, 0, 7); g.fill(); if (open > 0.3) { g.fillStyle = '#fff'; g.fillRect(-20, 62 - (6 + open * 26) + 3, 40, 7); } g.stroke(); }
    else { g.beginPath(); g.moveTo(-34, 58 - smile * 4); g.quadraticCurveTo(0, 58 + smile * 34, 34, 58 - smile * 4); g.stroke(); }
    this.faceTex.needsUpdate = true;
  }
}
function logoTex(col) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.translate(64, 64); g.fillStyle = col;
  for (let i = 0; i < 4; i++) { g.save(); g.rotate((i * Math.PI) / 2); g.fillRect(-10, -52, 20, 38); g.restore(); } g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
