// A shared skeleton for every non-sculpted character (stick, blocky, critter). It uses the SAME joint names and the SAME
// angle conventions as the SDF Human, so one gesture library, one mood library, one reach solver and one lip-sync drive all of them.
//   const r = new Rig({ hips: 0.93, ... });  r.group (feet at y=0, faces +z) · r.hips · r.spine · r.head · r.arm.L/R {sh, el, hand} · r.leg.L/R {hip, kn, foot}
//   r.pose({ spine, head, shL, elL, shR, elR, hipL, knL, hipR, knR })   degrees, identical to Human.pose
import * as THREE from 'three';

const D = THREE.MathUtils.degToRad;
const G = (parent, pos) => { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; };
export const DIMS = { hips: 0.93, spine: 0.04, shoulderY: 0.43, shoulderX: 0.2, head: 0.58, upper: 0.27, fore: 0.36, hipX: 0.088, thigh: 0.42, shin: 0.45, hipDrop: 0.03 };

export class Rig {
  constructor(d = {}) {
    const c = (this.d = { ...DIMS, ...d });
    this.group = new THREE.Group(); this.hips = G(this.group, [0, c.hips, 0]); this.spine = G(this.hips, [0, c.spine, 0]); this.head = G(this.spine, [0, c.head, 0]);
    this.arm = {}; this.leg = {}; this.elbowFlex = true; this.kneeFlex = true;
    for (const s of [-1, 1]) {
      const k = s < 0 ? 'L' : 'R', sh = G(this.spine, [s * c.shoulderX, c.shoulderY, -0.005]), el = G(sh, [0, -c.upper, 0]), hand = G(el, [0, -c.fore, 0.015]);
      this.arm[k] = { sh, el, hand, side: s };
      const hip = G(this.hips, [s * c.hipX, -c.hipDrop, 0]), kn = G(hip, [0, -c.thigh, 0.005]), foot = G(kn, [0, -c.shin, 0]);
      this.leg[k] = { hip, kn, foot, side: s };
    }
  }
  pose(q = {}) {
    const r3 = (g, a = [0, 0, 0]) => g.rotation.set(D(a[0]), D(a[1]), D(a[2]));
    r3(this.spine, q.spine); r3(this.head, q.head);
    r3(this.arm.L.sh, [-(q.shL?.[0] ?? 0), q.shL?.[1] ?? 0, -(q.shL?.[2] ?? 6)]); this.arm.L.el.rotation.set(-D(this.elbowFlex ? q.elL ?? 10 : 0), 0, 0);
    r3(this.arm.R.sh, [-(q.shR?.[0] ?? 0), q.shR?.[1] ?? 0, q.shR?.[2] ?? 6]); this.arm.R.el.rotation.set(-D(this.elbowFlex ? q.elR ?? 10 : 0), 0, 0);
    r3(this.leg.L.hip, [-(q.hipL?.[0] ?? 0), q.hipL?.[1] ?? 0, -(q.hipL?.[2] ?? 2)]); this.leg.L.kn.rotation.set(D(this.kneeFlex ? q.knL ?? 2 : 0), 0, 0);
    r3(this.leg.R.hip, [-(q.hipR?.[0] ?? 0), q.hipR?.[1] ?? 0, q.hipR?.[2] ?? 2]); this.leg.R.kn.rotation.set(D(this.kneeFlex ? q.knR ?? 2 : 0), 0, 0);
    this.group.updateMatrixWorld(true);
  }
  face() {}
  /** floor correction: when the legs bend the hips must drop so the feet stay on the ground */
  plant(q = {}) {
    const c = this.d, fl = (hip, kn) => { const a = D(hip?.[0] ?? 0), b = D(kn ?? 2); return c.thigh * Math.cos(a) + c.shin * Math.cos(a - b); };
    const reach = Math.max(fl(q.hipL, q.knL), fl(q.hipR, q.knR)); this.hips.position.y = c.hips - (c.thigh + c.shin - reach);
  }
}
