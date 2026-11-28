// The cast: characters and props, built from a plain JSON entry and updated as a pure function of shot time.
//   makeActor(entry)  -> { id, group, height, update(lt, t, talk), subject() }
//   makeProp(entry)   -> same interface
// A shot lists its cast in storyboard JSON; nothing here keeps state between frames.
import * as THREE from 'three';
import { Human } from './human.js';
import { gestureAt, moodAt, lifeLayer } from './gestures.js';
import { rbox, cyl, ball, emissive, shadow } from './worlds.js';
import { mat } from './world.js';
import { Critter } from './critter.js';
import { Cube } from './cube.js';
import { NEON_PROPS } from './neonprops.js';
import { Blocky } from './blocky.js';
import { Stick3D } from './stick3d.js';
import { VoxelPerson, VoxelMap, vmesh, VMAT } from './voxel.js';
import { makeSprite } from './sprite.js';
import { COUNTRY_PROPS } from './props_country.js';
import { CITY_PROPS } from './props_city.js';

const D = THREE.MathUtils.degToRad, ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const v = (a) => new THREE.Vector3(...a);

/** numeric two-bone reach for the SDF human: bends the shoulder (3 axes) + elbow until the hand is on `target` (world). Deterministic. */
function solveReach(h, side, q, target) {
  const k = side === 'L' ? 'L' : 'R', arm = h.arm[k], key = k === 'L' ? ['shL', 'elL'] : ['shR', 'elR'], s0 = q[key[0]] || [0, 0, 6], p = [s0[0], s0[1], s0[2], q[key[1]] ?? 10], tmp = new THREE.Vector3();
  const cost = (pp) => { const qq = { ...q, [key[0]]: [pp[0], pp[1], pp[2]], [key[1]]: Math.max(2, Math.min(150, pp[3])) }; h.pose(qq); arm.hand.getWorldPosition(tmp); return tmp.distanceTo(target); };
  let best = cost(p), step = 24;
  for (let it = 0; it < 46; it++) { let moved = false; for (let i = 0; i < 4; i++) for (const sg of [1, -1]) { const t = p.slice(); t[i] += sg * step; const c = cost(t); if (c < best - 1e-5) { best = c; p[i] = t[i]; moved = true; } } if (!moved) step *= 0.55; if (step < 0.15) break; }
  return { ...q, [key[0]]: [p[0], p[1], p[2]], [key[1]]: Math.max(2, Math.min(150, p[3])) };
}

/** one actor driver for every character that has the shared joint names (Human, Stick3D, Blocky, Critter) */
function rigActor(e, h) {
  const g = new THREE.Group(); g.add(h.group); const at = e.at || [0, 0]; g.position.set(at[0], e.y || 0, at[1]); g.rotation.y = e.rotY || 0;
  h.group.updateMatrixWorld(true); const height = new THREE.Box3().setFromObject(h.group).max.y;
  return {
    id: e.id, group: g, height,
    subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height, rotY: g.rotation.y }),
    update(lt, t, talk, ctx) {
      let q = gestureAt(e.pose, lt, e.blend), m = moodAt(e.mood, lt);
      const lf = lifeLayer(q, t, e.seed ?? 0, talk); q = lf;
      if (e.walk) { const w = e.walk, on = lt >= w.from && lt <= w.to, k = ease((lt - w.from) / 0.3) * (1 - ease((lt - w.to + 0.3) / 0.3)); if (on || k > 0) { const ph = (lt - w.from) * (w.speed || 6.2), s = Math.sin(ph) * k; q = { ...q, hipL: [s * 26, 0, 2], hipR: [-s * 26, 0, 2], knL: Math.max(0, -Math.sin(ph + 0.6)) * 40 * k + 4, knR: Math.max(0, Math.sin(ph + 0.6)) * 40 * k + 4, shL: [-s * 22, 0, 6], shR: [s * 22, 0, 6], elL: 18, elR: 18 }; g.position.x = w.path ? w.path[0][0] + (w.path[1][0] - w.path[0][0]) * ease((lt - w.from) / (w.to - w.from)) : g.position.x; g.position.z = w.path ? w.path[0][1] + (w.path[1][1] - w.path[0][1]) * ease((lt - w.from) / (w.to - w.from)) : g.position.z; } }
      g.updateMatrixWorld(true);
      for (const r of e.reach || []) { const k = ease((lt - r.from) / (r.ramp || 0.5)) * (1 - ease((lt - r.to) / (r.ramp || 0.5))); if (k > 0.001) { const tgt = ctx.target(r.target, r.offset); const solved = solveReach(h, r.side || 'R', q, tgt); const key = (r.side || 'R') === 'L' ? ['shL', 'elL'] : ['shR', 'elR']; q = { ...q, [key[0]]: [0, 1, 2].map((i) => (q[key[0]]?.[i] ?? 0) + (solved[key[0]][i] - (q[key[0]]?.[i] ?? 0)) * k), [key[1]]: (q[key[1]] ?? 10) + (solved[key[1]] - (q[key[1]] ?? 10)) * k }; } }
      const look = e.lookAt && ctx.target ? lookAngles(g, h, ctx.target(e.lookAt)) : m.look;
      h.pose({ ...q, lid: Math.max(m.lid ?? 0, lf.blink * 1.1) });
      h.face({ ...m, open: Math.max(m.open || 0, talk * 0.85), look: look ? [look[0] + Math.sin(t * 0.9 + (e.seed || 0)) * 1.2, (look[1] || 0)] : undefined, lid: Math.max(m.lid ?? 0, lf.blink * 1.1) });
      if (e.lookAt && ctx.target) { const a = headTurn(g, h, ctx.target(e.lookAt)); h.head.rotation.y += a * 0.55; }
    },
  };
}
const _p = new THREE.Vector3();
function headTurn(g, h, tgt) { h.head.getWorldPosition(_p); const d = tgt.clone().sub(_p), yaw = Math.atan2(d.x, d.z) - g.rotation.y, w = Math.atan2(Math.sin(yaw), Math.cos(yaw)); return Math.max(-1.0, Math.min(1.0, w)); }
function lookAngles(g, h, tgt) { h.head.getWorldPosition(_p); const d = tgt.clone().sub(_p), yaw = Math.atan2(d.x, d.z) - g.rotation.y, w = Math.atan2(Math.sin(yaw), Math.cos(yaw)), pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); return [Math.max(-25, Math.min(25, (w * 180) / Math.PI * 0.45)), Math.max(-14, Math.min(14, (-pitch * 180) / Math.PI * 0.6))]; }

/** a gift box with a hinged lid and a glowing key inside (the shared test prop) */
function giftbox(e) {
  const g = new THREE.Group(), c = e.color || '#C94A3A', rib = e.ribbon || '#F2C14E', s = e.scale || 1; g.scale.setScalar(s);
  rbox(0.34, 0.2, 0.34, mat({ color: c, roughness: 0.45 }), 0, 0.1, 0, g, 0.015);
  rbox(0.07, 0.201, 0.341, mat({ color: rib, roughness: 0.3, metalness: 0.2 }), 0, 0.1, 0, g, 0.005); rbox(0.341, 0.201, 0.07, mat({ color: rib, roughness: 0.3, metalness: 0.2 }), 0, 0.1, 0, g, 0.005);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.2, -0.17); g.add(hinge);
  const lid = new THREE.Group(); lid.position.set(0, 0, 0.17); hinge.add(lid); rbox(0.37, 0.06, 0.37, mat({ color: c, roughness: 0.45 }), 0, 0.03, 0, lid, 0.012); rbox(0.07, 0.061, 0.371, mat({ color: rib, roughness: 0.3 }), 0, 0.03, 0, lid, 0.005); rbox(0.371, 0.061, 0.07, mat({ color: rib, roughness: 0.3 }), 0, 0.03, 0, lid, 0.005);
  for (const sx of [-1, 1]) { const b = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 10, 24), mat({ color: rib, roughness: 0.3 }))); b.position.set(sx * 0.05, 0.085, 0); b.rotation.set(0.4, sx * 0.9, 0); lid.add(b); }
  const glow = new THREE.PointLight('#FFD27A', 0, 3, 1.6); glow.position.set(0, 0.3, 0); g.add(glow);
  const key = new THREE.Group(); key.position.set(0, 0.16, 0); g.add(key);
  const gold = new THREE.MeshStandardMaterial({ color: '#FFD45A', emissive: '#FFB800', emissiveIntensity: 0.0, metalness: 0.9, roughness: 0.18 });
  const ring = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 10, 24), gold)); ring.position.set(0, 0.05, 0); key.add(ring); const shaft = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.13, 10), gold)); shaft.position.set(0, -0.045, 0); key.add(shaft);
  for (const [dy, w] of [[-0.09, 0.03], [-0.065, 0.022]]) { const t = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, 0.01), gold)); t.position.set(w / 2, dy, 0); key.add(t); }
  const at = e.at || [0, 0, 0]; g.position.set(at[0], at[1], at[2]); g.rotation.y = e.rotY || 0;
  const open = e.open || [99, 1];
  return {
    id: e.id, group: g, height: 0.26 * s, kind: 'giftbox',
    subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height: 0.26 * s, rotY: g.rotation.y }),
    update(lt, t) {
      const k = ease((lt - open[0]) / open[1]), shake = (lt > open[0] - 0.5 && lt < open[0]) ? Math.sin(lt * 90) * 0.012 : 0;
      hinge.rotation.x = -k * 1.9 + shake; const rise = ease((lt - open[0] - 0.35) / 0.9);
      key.position.y = 0.12 + rise * 0.17 + Math.sin(t * 2.2) * 0.008 * rise; key.rotation.y = t * (1.2 + rise * 1.6); gold.emissiveIntensity = 0.1 + rise * 0.55; glow.intensity = rise * 1.1 + k * 0.5;
    },
  };
}
/** a small round side table (height 0.55) */
function sidetable(e) {
  const g = new THREE.Group(), c = e.color || '#C79A66', at = e.at || [0, 0, 0]; g.position.set(at[0], at[1], at[2]);
  if (e.blocky) { rbox(0.7, 0.07, 0.7, mat({ color: c, roughness: 0.5 }), 0, 0.535, 0, g, 0.03); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => rbox(0.08, 0.5, 0.08, mat({ color: '#7A5230', roughness: 0.7 }), x * 0.29, 0.25, z * 0.29, g, 0.015)); }
  else { cyl(0.3, 0.3, 0.04, mat({ color: c, roughness: 0.45 }), 0, 0.53, 0, g); cyl(0.035, 0.05, 0.5, mat({ color: '#2a2f3a', metalness: 0.6, roughness: 0.35 }), 0, 0.27, 0, g); cyl(0.2, 0.2, 0.03, mat({ color: '#2a2f3a', metalness: 0.6, roughness: 0.35 }), 0, 0.015, 0, g); }
  return { id: e.id, group: g, height: 0.55, subject: () => ({ pos: [at[0], at[1], at[2]], height: 0.55, rotY: 0 }), update() {} };
}

/** voxel gift box on the 0.1 m grid: hinged lid, ribbon cross, a pixel-art golden key that rises */
function voxGiftbox(e) {
  const g = new THREE.Group(), c = e.color || '#D9473A', rib = e.ribbon || '#F4C84A', at = e.at || [0, 0, 0]; g.position.set(at[0], at[1], at[2]); g.rotation.y = e.rotY || 0; g.scale.setScalar(e.scale || 1);
  const base = new VoxelMap().box(0, 0, 0, 4, 3, 4, c).box(1, 0, 0, 2, 3, 4, rib).box(0, 0, 1, 4, 3, 2, rib); vmesh(base, [2, 0, 2], g, [0, 0, 0], 0.04);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.3, -0.2); g.add(hinge); const lid = new THREE.Group(); lid.position.set(0, 0, 0.2); hinge.add(lid);
  const lm = new VoxelMap().box(0, 0, 0, 5, 1, 5, c).box(2, 0, 0, 1, 1, 5, rib).box(0, 0, 2, 5, 1, 1, rib).box(1, 1, 2, 1, 1, 1, rib).box(3, 1, 2, 1, 1, 1, rib).box(2, 1, 2, 1, 1, 1, rib); vmesh(lm, [2.5, 0, 2.5], lid, [0, 0, 0], 0.04);
  const glow = new THREE.PointLight('#FFD27A', 0, 3, 1.6); glow.position.set(0, 0.5, 0); g.add(glow);
  const key = new THREE.Group(); key.position.set(0, 0.25, 0); g.add(key);
  const km = new VoxelMap().box(0, 4, 0, 3, 1, 1, '#FFD45A').box(0, 6, 0, 3, 1, 1, '#FFD45A').box(0, 5, 0, 1, 1, 1, '#FFD45A').box(2, 5, 0, 1, 1, 1, '#FFD45A').box(1, -1, 0, 1, 5, 1, '#FFC93C').box(2, 0, 0, 1, 1, 1, '#FFC93C').box(2, 2, 0, 1, 1, 1, '#FFC93C');
  const kmesh = new THREE.Mesh(km.geometry([1.5, 3, 0.5], 0.03), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.5, emissive: '#FFB800', emissiveIntensity: 0.0 })); kmesh.castShadow = true; key.add(kmesh);
  const open = e.open || [99, 1];
  return { id: e.id, group: g, height: 0.4 * (e.scale || 1), subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height: 0.4 * (e.scale || 1), rotY: g.rotation.y }),
    update(lt, t) { const k = ease((lt - open[0]) / open[1]), shake = (lt > open[0] - 0.5 && lt < open[0]) ? Math.sin(lt * 90) * 0.012 : 0; hinge.rotation.x = -k * 1.9 + shake; const rise = ease((lt - open[0] - 0.35) / 0.9); key.position.y = 0.25 + rise * 0.3; key.rotation.y = t * (1.2 + rise * 1.6); kmesh.material.emissiveIntensity = 0.04 + rise * 0.22; glow.intensity = rise * 0.8 + k * 0.4; } };
}
function voxTable(e) {
  const g = new THREE.Group(), at = e.at || [0, 0, 0]; g.position.set(at[0], at[1], at[2]); const m = new VoxelMap().box(-4, 4, -4, 8, 1, 8, e.color || '#B98255'); for (const [x, z] of [[-3, -3], [2, -3], [-3, 2], [2, 2]]) m.box(x, 0, z, 1, 4, 1, '#7B5130'); vmesh(m, [0, 0, 0], g, [0, 0, 0], 0.04);
  return { id: e.id, group: g, height: 0.5, subject: () => ({ pos: [at[0], at[1], at[2]], height: 0.5, rotY: 0 }), update() {} };
}
const SIMPLE = { ...NEON_PROPS, ...COUNTRY_PROPS, ...CITY_PROPS, giftbox: (e) => (e.voxel ? voxGiftbox(e) : giftbox(e)), sidetable: (e) => (e.voxel ? voxTable(e) : sidetable(e)) };
export function makeProp(e) { const b = SIMPLE[e.kind]; if (!b) throw new Error(`unknown prop "${e.kind}". Known: ${Object.keys(SIMPLE).join(', ')}`); return b(e); }
const mk = (C) => (e) => { const b = new C({ ...(e.look || {}), scale: e.scale || 1 }); if (e.look?.noir && b.setAllMaterial) b.setAllMaterial(new THREE.MeshPhysicalMaterial({ color: e.look.noirColor || '#050507', roughness: 0.7, sheen: 0.6, sheenColor: new THREE.Color(e.look.rim || '#7a1e24'), sheenRoughness: 0.6 })); return rigActor(e, b); };
const ACTORS = { sprite: (e) => makeSprite(e), human: mk(Human), critter: mk(Critter), cube: mk(Cube), blocky: mk(Blocky), stick: mk(Stick3D), voxel: mk(VoxelPerson) };
export function makeActor(e) { const b = ACTORS[e.kind || 'human']; if (!b) throw new Error(`unknown character kind "${e.kind}". Known: ${Object.keys(ACTORS).join(', ')}`); return b(e); }
export { v };
