// 3D toon character. Same poses / moods / lip-sync data as the 2D rig (rig.js), driven onto real 3D joints:
// head sphere with the animated face as a decal texture, tapered torso, clothes, hair, hats, FK legs grounded on the floor,
// arms that reach toward the camera, and hands that can hold props.
import * as THREE from '../../vendor/three.module.js';
import { compose, pick, POSES, FACES, talkAt, faceTexture, shade } from '../core/rig.js';
import { toon, hull, addOutline } from './mat3d.js';
import { makeProp } from './props3d.js';

const U = 1.75 / 926, rad = (d) => (d * Math.PI) / 180, P3 = (x, y, z = 0) => new THREE.Vector3(x * U, -y * U, z * U);
const UP = new THREE.Vector3(0, 1, 0);

function limbMesh(r, col, outline = true) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), toon(col)); m.castShadow = true; if (outline) addOutline(m, 0.006); return m; }
function place(m, a, b) { const d = b.clone().sub(a), len = d.length() || 1e-4; m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); m.scale.set(1, len, 1); }
function ball(r, col, sx = 1, sy = 1, sz = 1, ol = 0.006) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), toon(col)); m.scale.set(sx, sy, sz); m.castShadow = true; if (ol) addOutline(m, ol); return m; }

export function buildChar(cast, sc) {
  const of = cast.outfit || {}, top = of.top || 'tee', hat = of.hat || 'none', G = new THREE.Group(), J = { G };
  const dark = sc.head === 'black', skin = of.skin || '#E8B48C', headFill = sc.head === 'white' ? '#FFFDF7' : dark ? '#141116' : skin, shirt = of.color || '#D6452F';
  J.cloak = top === 'cloak'; const headCol = J.cloak ? '#ECE7DB' : headFill, limbCol = sc.limbs || '#17171B', pants = sc.head === 'skin' ? (of.pants || '#2B3350') : limbCol;
  J.hip = new THREE.Group(); G.add(J.hip); J.upper = new THREE.Group(); J.hip.add(J.upper);
  // legs
  J.leg = [-1, 1].map(() => ({ thigh: limbMesh(sc.head === 'skin' && top !== 'dress' ? 0.034 : 0.021, sc.head === 'skin' && top !== 'dress' ? pants : limbCol), shin: limbMesh(0.019, limbCol), shoe: ball(0.075, sc.head === 'skin' ? '#2A2A33' : limbCol, 0.8, 0.5, 1.5, 0.005) }));
  J.leg.forEach((l) => { J.hip.add(l.thigh, l.shin, l.shoe); });
  // torso (lathe) per outfit
  const prof = { tee: [[0.02, 0], [0.145, 0.0], [0.17, 0.2], [0.2, 0.42], [0.2, 0.5], [0.12, 0.56], [0.06, 0.575]], hoodie: [[0.02, 0], [0.16, 0.0], [0.18, 0.2], [0.21, 0.42], [0.21, 0.5], [0.12, 0.56], [0.06, 0.575]], uniform: [[0.02, 0], [0.15, 0.0], [0.17, 0.2], [0.2, 0.42], [0.2, 0.5], [0.12, 0.56], [0.06, 0.575]],
    coat: [[0.02, -0.2], [0.24, -0.2], [0.2, 0.2], [0.21, 0.42], [0.21, 0.5], [0.12, 0.56], [0.06, 0.575]], dress: [[0.02, -0.26], [0.38, -0.26], [0.2, 0.2], [0.18, 0.4], [0.2, 0.5], [0.12, 0.56], [0.06, 0.575]], cloak: [[0.02, -0.75], [0.5, -0.75], [0.3, 0.1], [0.24, 0.46], [0.2, 0.55], [0.1, 0.6], [0.06, 0.62]] }[top] || [[0.02, 0], [0.15, 0], [0.2, 0.5], [0.06, 0.575]];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 22), toon(shirt)); torso.scale.z = 0.62; torso.castShadow = true; addOutline(torso, 0.006); J.upper.add(torso);
  if (top === 'hoodie') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.03), toon(shade(shirt, -0.18))); p.position.set(0, 0.17, 0.125); J.upper.add(p); }
  if (top === 'uniform') { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.2), toon('#E6C64B')); b.position.set(0, 0.1, 0); J.upper.add(b); }
  if (top === 'coat') for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.015), toon(shade(shirt, 0.55))); l.position.set(s * 0.05, 0.36, 0.13); l.rotation.z = -s * 0.22; J.upper.add(l); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 10), toon(shade(headCol, -0.12))); neck.position.y = 0.58; J.upper.add(neck);
  // arms
  J.arm = [-1, 1].map((side) => {
    const longSleeve = ['hoodie', 'coat', 'uniform', 'cloak'].includes(top), a = { side, up: limbMesh(0.019, limbCol), fo: limbMesh(0.019, limbCol), slU: limbMesh(longSleeve ? 0.034 : 0.036, shirt), slF: longSleeve ? limbMesh(0.03, shirt) : null,
      hand: new THREE.Group(), long: longSleeve };
    const glove = sc.hands === 'glove', hm = ball(glove ? 0.056 : 0.048, glove ? '#FFFFFF' : limbCol, 1, 0.92, 1.05, glove ? 0.005 : 0); const th = ball(0.026, glove ? '#FFFFFF' : limbCol, 1, 1.2, 1, glove ? 0.004 : 0); th.position.set(side * 0.04, 0.02, 0.025); a.hand.add(hm, th); if (sc.hands === 'none') a.hand.visible = false;
    J.upper.add(a.up, a.fo, a.slU, a.hand); if (a.slF) J.upper.add(a.slF); return a;
  });
  // head
  J.neckTop = new THREE.Group(); J.neckTop.position.copy(P3(0, -300)); J.neckTop.position.y = 0.6; J.upper.add(J.neckTop);
  const R = 116 * U; J.head = new THREE.Group(); J.head.position.y = 118 * U; J.neckTop.add(J.head);
  const hm = ball(R, headCol, 1, 1, 1, sc.outline > 0 ? 0.007 : 0); hm.castShadow = true; J.head.add(hm);
  J.faceCv = document.createElement('canvas'); J.faceCv.width = J.faceCv.height = 256; J.faceTex = new THREE.CanvasTexture(J.faceCv); J.faceTex.colorSpace = THREE.SRGBColorSpace; J.faceTex.anisotropy = 2;
  const span = 0.96, cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 40, 30, Math.PI / 2 - span, span * 2, Math.PI / 2 - span, span * 2), new THREE.MeshBasicMaterial({ map: J.faceTex, transparent: true, depthWrite: false })); J.head.add(cap);
  // hair / hats
  const hairCol = dark ? '#0E0A0D' : '#17171B', hair = dark || J.cloak ? 'none' : of.hair || 'short', hood = hat === 'hood' || J.cloak;
  if (hair === 'curly') for (let k = 0; k < 22; k++) { const a = rad(205 + (k % 11) * 13), r = ball(R * (0.3 + (k % 3) * 0.03), hairCol, 1, 1, 1, 0); r.position.set(Math.cos(a) * R * 0.96, Math.sin(a) * R * 0.96 * (0.5 + 0.5 * (k < 11)), -R * 0.1 + (k < 11 ? R * 0.22 : -R * 0.3)); r.position.y = R * 0.55 + (k < 11 ? 0.0 : -0.01) + Math.sin(a) * R * 0.5; J.head.add(r); }
  if (['short', 'curly', 'bun', 'long'].includes(hair)) { const d = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 28, 16, 0, Math.PI * 2, 0, 1.12), toon(hairCol)); d.rotation.x = -0.28; d.castShadow = true; J.head.add(d); }
  if (hair === 'bun') { const b = ball(R * 0.36, hairCol, 1, 1, 1, 0.005); b.position.set(0, R * 1.05, -R * 0.2); J.head.add(b); }
  if (hair === 'long') for (const s of [-1, 1]) { const l = ball(R * 0.34, hairCol, 0.8, 2.3, 0.9, 0); l.position.set(s * R * 0.88, -R * 0.45, -R * 0.1); J.head.add(l); }
  if (hood) { const h = new THREE.Mesh(new THREE.SphereGeometry(R * 1.2, 28, 20, 0, Math.PI * 2, 0, 2.35), toon(shirt)); h.rotation.x = -0.12; h.position.set(0, R * 0.05, -R * 0.12); h.castShadow = true; addOutline(h, 0.006); J.head.add(h); }
  if (!hood && (hat === 'cap' || hat === 'beanie')) { const hc = shade(shirt, -0.12), d = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 24, 14, 0, Math.PI * 2, 0, 1.15), toon(hc)); d.rotation.x = -0.12; addOutline(d, 0.006); J.head.add(d); if (hat === 'cap') { const br = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.75, R * 0.75, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), toon(shade(hc, -0.2))); br.position.set(0, R * 0.42, R * 0.82); br.rotation.x = -0.12; br.scale.set(1, 1, 1.15); br.rotation.y = Math.PI / 2; J.head.add(br); } }
  if (!hood && hat === 'chef') { const c = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.7, R * 0.6, R * 0.6, 20), toon('#F6F6F2')); c.position.y = R * 1.15; addOutline(c, 0.006); const p = ball(R * 0.78, '#F6F6F2', 1, 0.7, 1, 0.006); p.position.y = R * 1.5; J.head.add(c, p); }
  // props held by hands, shoes etc.
  J.props = {}; J.cast = cast; J.sc = sc; J.top = top; J.of = of; return J;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
/** pose the character for film time t. spec = { lt, pose, mood, talk, look, x, z, rotY, hold } */
export function updateChar(J, spec) {
  const { t, lt } = spec, o = compose({ t, lt, pose: spec.pose, mood: spec.mood, talk: spec.talk, sc: J.sc, outfit: J.of, seed: spec.seed || 0, look: spec.look });
  const P = pick(o.pose, POSES, lt), F = pick(o.mood, FACES, lt), ta = o.talk ? talkAt(t) : 0, seed = o.seed || 0, sc = J.sc;
  const look = o.look ? o.look(lt) : [Math.sin(t * 0.8 + seed) * 0.35, Math.sin(t * 0.53 + seed * 2) * 0.2];
  const ph = t * 6.6 * Math.max(1, P.walk) + seed;
  // legs (FK, grounded)
  const legs = [-1, 1].map((side) => { const q = ph + (side < 0 ? 0 : Math.PI), w = P.walk * Math.sin(q), lift = P.walk * Math.max(0, Math.cos(q)), th1 = rad(side * P.stance + 26 * w), th2 = th1 - rad(side * P.bend + 38 * lift), hx = side * 36, kx = hx + 190 * Math.sin(th1), ky = 190 * Math.cos(th1);
    return { side, h: P3(hx, 0), k: P3(kx, ky, 0.04 * 100 * (P.bend / 50) + lift * 40), f: P3(kx + 190 * Math.sin(th2), ky + 190 * Math.cos(th2), lift * 60) }; });
  const fmax = Math.max(...legs.map((l) => -l.f.y)) / U, hop = Math.abs(Math.sin(t * 7 + seed)) * 36 * P.hop, bob = Math.sin(t * 2.6 + seed) * 3 - Math.abs(Math.sin(ph)) * 12 * Math.min(1.4, P.walk) - hop;
  const jx = (P.jit + F.trem) * (Math.sin(t * 61 + seed) * 2.2 + Math.sin(t * 43) * 1.4);
  J.hip.position.set((Math.sin(t * 2.1 + seed) * 3 + jx) * U, (fmax + 14 + bob) * U, 0);
  J.leg.forEach((L, i) => { const l = legs[i]; place(L.thigh, l.h, l.k); place(L.shin, l.k, l.f); L.shoe.position.copy(l.f).add(_a.set(0, -0.012, 0.045)); });
  J.upper.rotation.z = -rad(P.lean); J.upper.scale.set(1 + Math.sin(t * 2.4 + seed) * 0.008, 1 + Math.sin(t * 2.4 + seed) * 0.014, 1);
  // arms
  J.arm.forEach((A) => {
    const side = A.side, [a1, a2] = side < 0 ? P.aL : P.aR, sw = side * P.walk * 18 * Math.sin(ph + (side < 0 ? Math.PI : 0)), wv = side > 0 ? P.wave * 24 * Math.sin(t * 9) : 0;
    const A1 = a1 + 2.5 * Math.sin(t * 2.3 + side + seed) + sw, A2 = a2 + 3 * Math.sin(t * 2.9 + side * 1.3 + seed) + wv, t1 = rad(A1), t2 = rad(A1 + A2), f = P.fwd || 0;
    const s = P3(side * 86, -270 + 0, 0.0), e = P3(side * 86 + side * 150 * Math.sin(t1), -270 + 150 * Math.cos(t1), 150 * f * Math.abs(Math.sin(t1)) * 1.1), h = P3(0, 0);
    h.set(e.x + side * 140 * Math.sin(t2) * U, e.y - 140 * Math.cos(t2) * U, e.z + 140 * f * Math.abs(Math.sin(t2)) * U * 1.2);
    s.y = -(-270) * U * 1; s.y = 270 * U; e.y = (270 - 150 * Math.cos(t1)) * U; h.y = e.y - 140 * Math.cos(t2) * U;
    place(A.up, s, e); place(A.fo, e, h); const mid = s.clone().lerp(e, 0.55); place(A.slU, s, A.long ? e : mid); if (A.slF) place(A.slF, e, h);
    A.hand.position.copy(h); A.hand.lookAt(h.clone().add(h.clone().sub(e)));
    if (side > 0) { const want = spec.hold || null; Object.entries(J.props).forEach(([k, g]) => { g.visible = k === want; }); if (want && !J.props[want]) { const g = makeProp(want, spec.holdLabel); J.props[want] = g; A.hand.add(g); } if (want) J.props[want].visible = true; }
  });
  // head
  J.neckTop.rotation.z = -rad(P.tilt + 1.6 * Math.sin(t * 1.3 + seed) + ta * 2); J.head.rotation.y = look[0] * 0.18; J.head.rotation.x = look[1] * 0.12 + (ta ? -0.03 * ta : 0);
  faceTexture(J.faceCv, F, { ...o, seed, sc, faceless: J.cloak || o.faceless, headFill: J.cloak ? '#ECE7DB' : o.headFill }, t, ta, look); J.faceTex.needsUpdate = true;
  J.G.position.set(spec.x || 0, 0, spec.z || 0); J.G.rotation.y = spec.rotY || 0; J.G.visible = true;
}
