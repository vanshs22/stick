// A hand-animated 2D cartoon stickman standing in a lit 3D world (style 2, learned from r21 and r26).
// The character is DRAWN every frame (stickdraw.js: joints, 3/4 turn, brows, blinks, continuous mouth, squash, a line that re-wobbles at 12 fps) onto a canvas texture
// on a camera-facing plane, lit by the scene, with a projected ground shadow. Poses and expressions blend smoothly over time: a pure function of shot time.
//   entry: { kind:'sprite', char:'otto', at:[x,z], y, height:1.9, pose:[[0,'idle'],[1.2,'point']], mood:[[0,'neutral']], turn, flip, path:[[t,x,z],...], rise:{from,dur,height,drift}, look:{costume}, gaze:[x,y], sun:[x,y,z] }
import * as THREE from 'three';
import { drawStick, POSES, EXPR, blendPose, blendExpr } from './stickdraw.js';

const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
export const COSTUMES = {
  otto: { hat: 'straw', hatColor: '#E3C06A', band: '#B04A2E', shirt: '#2F7D5B', apron: '#8A5A3A', boots: '#3a2a1c' },
  mabel: { hat: 'sun', hatColor: '#F2E3B0', band: '#E86F8A', shirt: '#C9556B', scarf: '#F2C14E', boots: '#4a2a2a' },
  rex: { hat: 'cap', hatColor: '#D8342B', shirt: '#3C5FA8', boots: '#222' },
};
const keys = (spec, d) => (Array.isArray(spec) ? spec : [[0, spec || d]]);
/** smooth value between keyframed names: blends the previous and the next name over `ramp` seconds before a key */
function sample(spec, lt, table, blend, d, ramp = 0.28) {
  const k = keys(spec, d); let i = 0; while (i < k.length - 1 && lt >= k[i + 1][0] - ramp) i++;
  const a = table[k[i][1]] || table[d]; if (i >= k.length - 1) return a; const b = table[k[i + 1][1]] || table[d], s = k[i + 1][0] - ramp;
  return lt <= s ? a : blend(a, b, ease((lt - s) / ramp));
}
export function makeSprite(e) {
  const H = e.height || 1.9, CW = 720, CH = 1080, FEET = 0.985, Wd = (H * CW) / CH, g = new THREE.Group(), seed = e.seed ?? 1, start = e.at || [0, 0];
  g.position.set(start[0], e.y || 0, start[1]);
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  const geo = new THREE.PlaneGeometry(Wd, H); geo.translate(0, H / 2 - (1 - FEET) * H, 0);
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1, metalness: 0, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: e.glow ?? 0.22 })); g.add(body);
  const sh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: '#000000', transparent: true, opacity: 0.36, alphaTest: 0.3, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })); sh.matrixAutoUpdate = false; sh.frustumCulled = false; g.add(sh);
  const L = new THREE.Vector3(...(e.sun || [-0.45, 1, 0.35])).normalize(), hh = 0.03, M = new THREE.Matrix4().set(1, -L.x / L.y, 0, (L.x / L.y) * hh, 0, 0, 0, hh, 0, -L.z / L.y, 1, (L.z / L.y) * hh, 0, 0, 0, 1);
  const inv = new THREE.Matrix4(), costume = { ...(COSTUMES[e.char || 'otto'] || {}), ...(e.look || {}) }; let flip = e.flip ? -1 : 1, turn = e.turn ?? 0.25, walkPhase = 0, last = -1;
  return {
    id: e.id, group: g, height: H, kind: 'sprite', ready: Promise.resolve(),
    subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height: H, rotY: 0 }),
    update(lt, t, talk) {
      let moving = false, vx = 0;
      if (e.path && e.path.length) { const p = e.path; let i = 0; while (i < p.length - 1 && lt > p[i + 1][0]) i++; const a = p[i], b = p[Math.min(i + 1, p.length - 1)], k = b[0] > a[0] ? ease((lt - a[0]) / (b[0] - a[0])) : 1, dx = b[1] - a[1], dz = b[2] - a[2];
        g.position.x = a[1] + dx * k; g.position.z = a[2] + dz * k; moving = k > 0.001 && k < 0.999 && lt >= p[0][0]; vx = dx; if (moving && Math.abs(dx) > 0.05) { flip = dx < 0 ? -1 : 1; turn = 1; } }
      if (e.rise) { const k = ease((lt - e.rise.from) / (e.rise.dur || 2)); g.position.y = (e.y || 0) + k * (e.rise.height ?? 6); g.position.x = start[0] + k * (e.rise.drift ?? 0); }
      if (moving) walkPhase += lt > last && last >= 0 ? (lt - last) * (e.cadence || 1.7) : 0; last = lt;
      const pose = sample(e.pose, lt, POSES, blendPose, 'idle'), expr = sample(e.mood, lt, EXPR, blendExpr, 'neutral', 0.22);
      const open = talk > 0.25 ? 0.25 + 0.55 * Math.abs(Math.sin(t * 17 + seed * 3)) : 0, anticip = Math.sin(t * 1.3 + seed) * 0.15;
      drawStick(ctx, CW, CH, { t, pose, expr: { ...expr, tilt2: anticip }, look: costume, turn: e.turn ?? (moving ? 1 : turn), walk: moving ? walkPhase : 0, seed, talk: open, gaze: e.gaze || [0.2, 0] });
      tex.needsUpdate = true; body.scale.set(flip, 1, 1); body.rotation.z = (e.wind ?? 0.012) * Math.sin(t * 2.6 + seed);
    },
    faceCamera(cam) {
      body.rotation.y = Math.atan2(cam.position.x - g.position.x, cam.position.z - g.position.z); g.updateMatrixWorld(true); body.updateMatrixWorld(true);
      inv.copy(g.matrixWorld).invert(); sh.matrix.copy(inv).multiply(M).multiply(body.matrixWorld);
    },
  };
}
