// A true 3D stickman: connected, articulated limbs with real joints, a torso, a round head with a full animated face,
// planted feet, real shadows. Ink-black glossy body, white gloves and shoes, a coloured scarf as the identity mark.
// Same skeleton + joint conventions as the SDF Human (rig.js), so it uses the same gestures, moods, reach and lip-sync.
import * as THREE from 'three';
import { Rig } from './rig.js';
import { rbox } from './worlds.js';

const D = THREE.MathUtils.degToRad;
const sh = (m) => { m.castShadow = m.receiveShadow = true; return m; };

export class Stick3D extends Rig {
  constructor(o = {}) {
    super({ hips: 0.96, spine: 0.04, shoulderY: 0.5, shoulderX: 0.19, head: 0.62, upper: 0.3, fore: 0.3, hipX: 0.1, thigh: 0.47, shin: 0.47, hipDrop: 0.02 });
    const c = { body: '#16161d', head: '#16161d', glove: '#F6F3EC', shoe: '#F6F3EC', scarf: '#F2B84B', eye: '#FFFFFF', pupil: '#101015', scale: 1, ...o };
    this.o = c;
    const ink = new THREE.MeshPhysicalMaterial({ color: c.body, roughness: 0.32, metalness: 0.0, clearcoat: 0.7, clearcoatRoughness: 0.25 });
    const headM = new THREE.MeshPhysicalMaterial({ color: c.head, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const glove = new THREE.MeshStandardMaterial({ color: c.glove, roughness: 0.55 }), shoe = new THREE.MeshStandardMaterial({ color: c.shoe, roughness: 0.5 }), scarfM = new THREE.MeshStandardMaterial({ color: c.scarf, roughness: 0.75 });
    const limb = (parent, len, r0, r1, m = ink, y0 = 0) => { const g = sh(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 20, 1), m)); g.position.y = y0 - len / 2; parent.add(g); return g; };
    const joint = (parent, r, m = ink, p = [0, 0, 0]) => { const g = sh(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m)); g.position.set(...p); parent.add(g); return g; };
    const d = this.d;
    // torso + pelvis (spine pivot sits at the hips; the chest reaches up to the shoulders)
    const torso = sh(new THREE.Mesh(new THREE.CapsuleGeometry(0.075, d.shoulderY - 0.1, 8, 20), ink)); torso.position.y = d.shoulderY / 2 - 0.02; this.spine.add(torso);
    { const pel = joint(this.hips, 0.072, ink, [0, 0.015, 0]); pel.scale.set(1.5, 0.75, 0.95); }   // a flattened pelvis that bridges the hip joints instead of a third ball stacked between them
    for (const k of ['L', 'R']) {
      const a = this.arm[k]; joint(a.sh, 0.068); limb(a.sh, d.upper, 0.045, 0.04); joint(a.el, 0.052); limb(a.el, d.fore - 0.06, 0.04, 0.034);
      const hand = joint(a.hand, 0.078, glove, [0, 0.02, 0.005]); hand.scale.set(1, 1.1, 0.85);
      const l = this.leg[k]; joint(l.hip, 0.062); limb(l.hip, d.thigh, 0.058, 0.05); joint(l.kn, 0.058); limb(l.kn, d.shin - 0.05, 0.048, 0.04);
      const foot = rbox(0.13, 0.085, 0.27, shoe, 0, -0.035, 0.06, l.foot, 0.04); foot.castShadow = true;
    }
    // neck, scarf, head
    limb(this.head, 0.12, 0.04, 0.045, ink, 0.02);
    const sc = sh(new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.042, 12, 28), scarfM)); sc.rotation.x = Math.PI / 2; sc.position.y = 0.02; this.spine.add(sc); sc.position.y = d.shoulderY + 0.045; sc.position.z = 0.0;
    this.tail = new THREE.Group(); this.tail.position.set(0.07, d.shoulderY + 0.03, 0.075); this.spine.add(this.tail); const tail = rbox(0.085, 0.3, 0.035, scarfM, 0, -0.14, 0, this.tail, 0.015); tail.castShadow = true;
    const hd = sh(new THREE.Mesh(new THREE.SphereGeometry(0.205, 40, 28), headM)); hd.position.y = 0.2; this.head.add(hd);
    // face
    const eyeW = new THREE.MeshStandardMaterial({ color: c.eye, roughness: 0.15 }), pupM = new THREE.MeshBasicMaterial({ color: c.pupil }), lidM = headM;
    this.eyes = []; this.lids = []; this.pupils = [];
    for (const s of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(s * 0.082, 0.235, 0.165); this.head.add(e);
      const ball = sh(new THREE.Mesh(new THREE.SphereGeometry(0.056, 28, 20), eyeW)); ball.scale.set(1, 1.12, 0.7); e.add(ball);
      const pg = new THREE.Group(); pg.position.z = 0.03; e.add(pg); this.pupils.push(pg); const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), pupM); p.scale.set(1, 1.1, 0.5); p.position.z = 0.012; pg.add(p);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff' })); hl.position.set(0.009, 0.011, 0.032); pg.add(hl);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.061, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), lidM); lid.scale.set(1, 1.16, 0.78); lid.position.z = 0.002; e.add(lid); this.lids.push(lid); this.eyes.push(e);
    }
    const white = new THREE.MeshStandardMaterial({ color: '#F6F3EC', roughness: 0.5 });
    this.brows = [-1, 1].map((s) => { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.07, 4, 10), white); b.userData.s = s; this.head.add(b); return b; });
    this.mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), new THREE.MeshStandardMaterial({ color: '#5a1a22', roughness: 0.5 })); this.head.add(this.mouth);
    this.teeth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.01), white); this.head.add(this.teeth);
    this.smileArc = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.0075, 8, 32, Math.PI * 0.7), white); this.head.add(this.smileArc);
    this.group.scale.setScalar(c.scale); this.pose({}); this.face({});
  }
  face(q = {}) {
    const smile = q.smile ?? 0.15, open = Math.max(0, Math.min(1, q.open ?? 0)), brow = q.brow ?? 0, tilt = q.tilt ?? 0, lid = q.lid ?? 0;
    this.lids.forEach((l) => { l.rotation.x = -0.62 + Math.max(-0.4, Math.min(1, lid)) * 1.35; l.position.y = 0.0; });
    this.brows.forEach((b) => { const s = b.userData.s; b.position.set(s * 0.082, 0.318 + brow * 0.026, 0.158 - Math.abs(brow) * 0.004); b.rotation.set(-0.35, 0, Math.PI / 2 + s * D(tilt)); });
    if (q.look) this.pupils.forEach((p) => p.position.set(Math.max(-0.016, Math.min(0.016, (q.look[0] || 0) * 0.0007)), Math.max(-0.014, Math.min(0.014, -(q.look[1] || 0) * 0.0008)), 0.03));
    const my = 0.108;
    this.mouth.position.set(0, my - open * 0.01, 0.185 - 0.0); this.mouth.scale.set(0.045 + Math.max(0, smile) * 0.012 - open * 0.006, 0.004 + open * 0.034, 0.01); this.mouth.visible = open > 0.05;
    this.teeth.visible = open > 0.35; this.teeth.position.set(0, my + 0.004 + open * 0.005, 0.19); this.teeth.scale.set(1, 1, 1);
    this.smileArc.visible = open <= 0.05; const sm = Math.max(-1, Math.min(1, smile));
    this.smileArc.position.set(0, my + (sm > 0 ? 0.04 : 0.0) + (sm > 0 ? 0 : -0.012), 0.168); this.smileArc.rotation.set(0, 0, sm > 0 ? Math.PI * 1.15 : Math.PI * 0.15); this.smileArc.scale.set(0.55 + Math.abs(sm) * 0.55, 0.35 + Math.abs(sm) * 0.8, 1);
    this.smileArc.rotation.x = -0.05;
  }
  pose(q = {}) { super.pose(q); this.plant(q); if (this.tail) this.tail.rotation.x = -0.1 + (q.spine?.[0] ?? 0) * -0.01 + Math.sin((q._t ?? 0) * 2.2) * 0.08; }
}
export function makeStickBody(look = {}) { return new Stick3D(look); }
