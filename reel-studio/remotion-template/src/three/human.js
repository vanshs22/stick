// A stylized 3D person sculpted from SDFs (smooth, clay-like), split into rigid parts on a simple skeleton so it can
// be posed every frame. new Human({ skin, shirt, pants, shoes, hair, face: true|false, scale }).
//   h.group (add to scene; feet at y = 0) · h.pose({ spine, chest, head, shL, elL, shR, elR, hipL, knL, hipR, knR }) degrees
//   h.setXray(true) (body becomes x-ray glass with bones + organs inside, head stays) · h.setLook(mat) (Night File looks)
import * as THREE from 'three';
import { sphere, ellipsoid, capsule, smin, smax, ssub, noise3, mesh, rgb } from './sdf.js';

const D = THREE.MathUtils.degToRad;
const cache = new Map();
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };                                    // sculpts are reused across characters with the same look
function sculpt(key, f, bounds, step, color) { const k = key; if (!cache.has(k)) cache.set(k, mesh(f, bounds, step, color)); return cache.get(k); }

export const SKIN_MAT = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.35, sheenRoughness: 0.7, sheenColor: new THREE.Color('#ffd6c2') });

export class Human {
  constructor(o = {}) {
    const c = { skin: '#E3A988', shirt: '#3E7CC9', pants: '#2B3550', shoes: '#F2F2F2', hair: '#3A2618', iris: '#4A3426', ...o };
    this.o = c; const face = c.face !== false, K = JSON.stringify(c);
    const S = rgb(c.skin), SH = rgb(c.shirt), PA = rgb(c.pants), SO = rgb(c.shoes);
    this.mat = SKIN_MAT(); this.parts = [];
    const add = (parent, geo, pos = [0, 0, 0]) => { const m = new THREE.Mesh(geo, this.mat); m.castShadow = true; m.receiveShadow = true; m.position.set(...pos); parent.add(m); this.parts.push(m); return m; };
    const G = (parent, pos) => { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; };

    this.group = new THREE.Group(); this.group.scale.setScalar(c.scale || 1);
    this.hips = G(this.group, [0, 0.93, 0]);
    // torso (pivot low in the back so the spine bends naturally)
    this.spine = G(this.hips, [0, 0.04, 0]);
    add(this.spine, sculpt('torso' + K, (p) => {
      let d = ellipsoid(p, [0, 0.34, 0], [0.185, 0.165, 0.118]);
      d = smin(d, ellipsoid(p, [0, 0.13, 0.008], [0.162, 0.17, 0.112]), 0.08);
      d = smin(d, ellipsoid(p, [0, -0.04, 0], [0.165, 0.11, 0.108]), 0.07);
      d = smin(d, capsule(p, [-0.165, 0.43, -0.005], [0.165, 0.43, -0.005], 0.062), 0.07);
      d = smin(d, capsule(p, [0, 0.46, -0.005], [0, 0.6, 0.0], 0.05, 0.047), 0.05);
      return d;
    }, [[-0.27, -0.17, -0.16], [0.27, 0.64, 0.17]], 0.0065, (p) => { const collar = ellipsoid(p, [0, 0.555, 0.03], [0.078, 0.085, 0.085]); const top = mixc(SH, S, sstep(0.006, -0.006, collar)); return mixc(PA, top, sstep(-0.085, -0.05, p[1])); }));
    // head
    this.head = G(this.spine, [0, 0.58, 0]);
    add(this.head, sculpt('head' + face + c.skin, (p) => {
      let d = ellipsoid(p, [0, 0.15, -0.005], [0.108, 0.128, 0.118]);
      if (!face) return smin(d, capsule(p, [0, -0.02, 0], [0, 0.06, 0.01], 0.05), 0.05);
      d = smin(d, ellipsoid(p, [0, 0.072, 0.03], [0.094, 0.082, 0.092]), 0.05);
      d = smin(d, ellipsoid(p, [0, 0.018, 0.058], [0.043, 0.033, 0.038]), 0.04);
      for (const s of [-1, 1]) { d = smin(d, ellipsoid(p, [s * 0.052, 0.075, 0.068], [0.038, 0.032, 0.032]), 0.03); d = smin(d, ellipsoid(p, [s * 0.108, 0.105, -0.005], [0.017, 0.033, 0.024]), 0.012); d = ssub(d, sphere(p, [s * 0.041, 0.124, 0.112], 0.026), 0.018); }
      d = smin(d, capsule(p, [0, 0.12, 0.104], [0, 0.088, 0.117], 0.009, 0.013), 0.02);
      d = smin(d, sphere(p, [0, 0.082, 0.113], 0.016), 0.016);
      d = smin(d, ellipsoid(p, [0, 0.043, 0.104], [0.026, 0.011, 0.012]), 0.012);
      d = ssub(d, capsule(p, [-0.024, 0.039, 0.116], [0.024, 0.039, 0.116], 0.0035), 0.004);
      return smin(d, capsule(p, [0, -0.04, -0.005], [0, 0.05, 0.005], 0.048), 0.04);
    }, [[-0.14, -0.06, -0.14], [0.14, 0.3, 0.16]], 0.0038, () => S));
    if (face) {
      const white = new THREE.MeshPhysicalMaterial({ color: '#F7F4EF', roughness: 0.2, clearcoat: 1 });
      const iris = new THREE.MeshStandardMaterial({ color: c.iris, roughness: 0.3 }), pupil = new THREE.MeshBasicMaterial({ color: '#0B0907' });
      this.eyes = [];
      for (const s of [-1, 1]) {
        const e = new THREE.Group(); e.position.set(s * 0.041, 0.124, 0.091); this.head.add(e); this.eyes.push(e);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.022, 32, 24), white); e.add(ball);
        const ir = new THREE.Mesh(new THREE.CircleGeometry(0.0108, 32), iris); ir.position.z = 0.0222; e.add(ir);
        const pu = new THREE.Mesh(new THREE.CircleGeometry(0.0052, 24), pupil); pu.position.z = 0.0224; e.add(pu);
        const hl = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); hl.position.set(0.0035, 0.004, 0.0226); e.add(hl);
        // eyelids (skin): upper lid covers the top of the eye; this.lids lets shots blink / squint / widen
        const lidM = new THREE.MeshPhysicalMaterial({ color: c.skin, roughness: 0.55, sheen: 0.35, sheenColor: new THREE.Color('#ffd6c2') });
        const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0236, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), lidM); lid.position.set(s * 0.041, 0.124, 0.091); lid.rotation.x = 0.12; this.head.add(lid);
        const low = new THREE.Mesh(new THREE.SphereGeometry(0.0234, 32, 16, 0, Math.PI * 2, Math.PI * 0.78, Math.PI * 0.22), lidM); low.rotation.x = -0.25; low.position.copy(lid.position); this.head.add(low);
        (this.lids ||= []).push(lid);
      }
      // brows + mouth (added in the Remotion port): driven by face() so characters can emote and lip-sync
      const browM = new THREE.MeshStandardMaterial({ color: c.hair, roughness: 0.7 });
      this.brows = [-1, 1].map((s) => { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.0048, 0.036, 4, 10), browM); b.rotation.z = Math.PI / 2; b.userData.s = s; b.castShadow = false; this.head.add(b); return b; });
      this.mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshStandardMaterial({ color: '#4a1818', roughness: 0.6 })); this.mouth.position.set(0, 0.039, 0.1135); this.head.add(this.mouth);
      this.teeth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.0035, 0.002), new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.4 })); this.teeth.position.set(0, 0.043, 0.1155); this.head.add(this.teeth);
      this.smileArc = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0022, 6, 24, Math.PI * 0.62), new THREE.MeshStandardMaterial({ color: '#7a3b36', roughness: 0.6 })); this.head.add(this.smileArc);
      this.face({});
      const HA = rgb(c.hair);
      add(this.head, sculpt('hair' + c.hair, (p) => {
        let d = ellipsoid(p, [0, 0.168, -0.014], [0.118, 0.138, 0.13]);
        const line = 0.05 + 0.16 * Math.min(1, Math.max(0, (p[2] + 0.04) / 0.14));                       // hairline: low at the back, high at the front
        d = smax(d, -(p[1] - line), 0.02);
        d = smin(d, ellipsoid(p, [0.02, 0.262, 0.05], [0.085, 0.045, 0.075]), 0.04);                      // quiff
        d += 0.006 * noise3(p[0] * 45, p[1] * 25, p[2] * 45);
        return d;
      }, [[-0.15, 0.02, -0.16], [0.15, 0.33, 0.16]], 0.004, () => HA));
    }
    // arms
    this.arm = {};
    for (const s of [-1, 1]) {
      const k = s < 0 ? 'L' : 'R', sh = G(this.spine, [s * 0.2, 0.43, -0.005]);
      add(sh, sculpt('uarm' + K, (p) => smin(capsule(p, [0, 0, 0], [0, -0.27, 0], 0.048, 0.04), capsule(p, [0, 0.0, 0], [0, -0.13, 0], 0.062, 0.056), 0.02),
        [[-0.08, -0.33, -0.08], [0.08, 0.07, 0.08]], 0.005, (p) => mixc(S, SH, sstep(-0.142, -0.128, p[1]))));
      const el = G(sh, [0, -0.27, 0]);
      add(el, sculpt('farm' + s + c.skin, (p) => {
        let d = capsule(p, [0, 0, 0], [0, -0.23, 0.005], 0.039, 0.031);
        d = smin(d, ellipsoid(p, [0, -0.29, 0.008], [0.041, 0.055, 0.021]), 0.03);
        d = smin(d, capsule(p, [0, -0.31, 0.008], [0, -0.365, 0.018], 0.022, 0.017), 0.02);
        for (const fx of [-0.011, 0.011]) d = ssub(d, capsule(p, [fx, -0.335, 0.035], [fx, -0.4, 0.04], 0.0025), 0.003);
        d = smin(d, capsule(p, [-s * 0.028, -0.26, 0.018], [-s * 0.04, -0.31, 0.036], 0.012, 0.01), 0.012);
        return d;
      }, [[-0.08, -0.41, -0.06], [0.08, 0.06, 0.08]], 0.005, () => S));
      const hand = G(el, [0, -0.36, 0.015]); this.arm[k] = { sh, el, hand };
    }
    // legs
    this.leg = {};
    for (const s of [-1, 1]) {
      const k = s < 0 ? 'L' : 'R', hip = G(this.hips, [s * 0.088, -0.03, 0]);
      add(hip, sculpt('thigh' + c.pants, (p) => capsule(p, [0, 0, 0], [0, -0.42, 0.005], 0.082, 0.06), [[-0.1, -0.5, -0.1], [0.1, 0.1, 0.1]], 0.007, () => PA));
      const kn = G(hip, [0, -0.42, 0.005]);
      add(kn, sculpt('shin' + c.pants + c.shoes, (p) => {
        let d = capsule(p, [0, 0, 0], [0, -0.38, -0.005], 0.058, 0.045);
        d = smin(d, ellipsoid(p, [0, -0.43, 0.045], [0.056, 0.05, 0.12]), 0.04);
        return smax(d, -(p[1] + 0.475), 0.01);
      }, [[-0.09, -0.5, -0.1], [0.09, 0.07, 0.19]], 0.006, (p) => (p[1] > -0.36 ? PA : SO)));
      this.leg[k] = { hip, kn };
    }
    this.pose({});
  }
  /** pose in degrees: spine/chest/head [x, y, z]; shL/shR [x (forward +), y, z (out +)]; elL/elR bend; hipL/hipR [x (forward +), y, z]; knL/knR bend */
  pose(q) {
    const r3 = (g, a = [0, 0, 0]) => g.rotation.set(D(a[0]), D(a[1]), D(a[2]));
    r3(this.spine, q.spine); r3(this.head, q.head);
    r3(this.arm.L.sh, [-(q.shL?.[0] ?? 0), q.shL?.[1] ?? 0, -(q.shL?.[2] ?? 6)]); this.arm.L.el.rotation.set(-D(q.elL ?? 10), 0, 0);
    r3(this.arm.R.sh, [-(q.shR?.[0] ?? 0), q.shR?.[1] ?? 0, q.shR?.[2] ?? 6]); this.arm.R.el.rotation.set(-D(q.elR ?? 10), 0, 0);
    r3(this.leg.L.hip, [-(q.hipL?.[0] ?? 0), q.hipL?.[1] ?? 0, -(q.hipL?.[2] ?? 2)]); this.leg.L.kn.rotation.set(D(q.knL ?? 2), 0, 0);
    r3(this.leg.R.hip, [-(q.hipR?.[0] ?? 0), q.hipR?.[1] ?? 0, q.hipR?.[2] ?? 2]); this.leg.R.kn.rotation.set(D(q.knR ?? 2), 0, 0);
    if (this.lids) this.lids.forEach((l) => (l.rotation.x = 0.12 + (q.lid ?? 0) * 1.25));   // lid: -0.4 wide open … 0 normal … 1 closed
    if (q.look && this.eyes) this.eyes.forEach((e) => e.rotation.set(D(q.look[1] || 0), D(q.look[0] || 0), 0));
    this.group.updateMatrixWorld(true);
  }
  /** expression: smile -1..1, open 0..1 (mouth), brow -1..1 (down..up), tilt (deg, inner-brow angle: + angry, - worried), lid -0.4..1, look [yawDeg, pitchDeg] */
  face(q = {}) {
    if (!this.brows) return;
    const smile = q.smile ?? 0.15, open = Math.max(0, Math.min(1, q.open ?? 0)), brow = q.brow ?? 0, tilt = q.tilt ?? 0;
    this.brows.forEach((b) => { const s = b.userData.s; b.position.set(s * 0.041, 0.158 + brow * 0.012 + (q.browAsym?.[s > 0 ? 1 : 0] ?? 0) * 0.01, 0.1015 - 0.003 * Math.abs(brow)); b.rotation.z = Math.PI / 2 + s * D(tilt); b.rotation.x = -0.18; b.scale.x = 1 + Math.abs(brow) * 0.05; });
    const w = 0.02 + Math.max(0, smile) * 0.007 - open * 0.003, h = 0.0012 + open * 0.0125;
    this.mouth.scale.set(w, h, 0.004); this.mouth.position.y = 0.039 - open * 0.004; this.mouth.visible = open > 0.04 || smile > 0.55;
    if (open <= 0.04 && smile > 0.55) { this.mouth.scale.set(0.02, 0.0045 * smile, 0.004); this.mouth.position.y = 0.04; }
    this.teeth.visible = open > 0.3 || smile > 0.8; this.teeth.position.y = 0.0405 + open * 0.0005; this.teeth.scale.set(0.8 + open * 0.2, 1, 1);
    this.smileArc.visible = open <= 0.04 && smile < 0.55 && Math.abs(smile) > 0.12;
    this.smileArc.position.set(0, 0.0545 - Math.sign(smile) * 0.011 + Math.abs(smile) * (smile > 0 ? 0.004 : -0.002), 0.1);
    this.smileArc.rotation.set(0, 0, smile > 0 ? Math.PI * 1.19 : Math.PI * 0.19); this.smileArc.scale.set(0.45 + Math.abs(smile) * 0.5, 0.55 + Math.abs(smile) * 0.6, 1);
    if (this.lids) this.lids.forEach((l) => (l.rotation.x = 0.12 + (q.lid ?? 0) * 1.25));
    if (q.look && this.eyes) this.eyes.forEach((e) => e.rotation.set(D(q.look[1] || 0), D(q.look[0] || 0), 0));
  }
  /** walking pose at phase ph (radians) */
  walk(ph, amt = 1) { const s = Math.sin(ph) * amt; this.pose({ hipL: [s * 26, 0, 2], hipR: [-s * 26, 0, 2], knL: Math.max(0, -Math.sin(ph + 0.6)) * 40 * amt + 4, knR: Math.max(0, Math.sin(ph + 0.6)) * 40 * amt + 4, shL: [-s * 20, 0, 6], shR: [s * 20, 0, 6], elL: 18, elR: 18, spine: [3, s * 4, 0] }); this.hips.position.y = 0.93 - Math.abs(Math.cos(ph)) * 0.012 * amt; }
  /** swap the body (not the head) to another material, e.g. x-ray glass; null restores */
  setBodyMaterial(m) { this.parts.forEach((p) => { if (p.parent !== this.head) p.material = m || this.mat; p.castShadow = !m; }); }
  /** every part to one material (Night File silhouettes) */
  setAllMaterial(m) { this.parts.forEach((p) => (p.material = m)); }
}
