// City props: cars (hatchback, pickup, bus), bench, bin, hydrant, bus stop. Real proportions in metres, glossy clear-coat paint, glass, wheels with rims, lit head and tail lamps.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat } from './world.js';

const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const sh = (m) => { m.castShadow = m.receiveShadow = true; return m; };
const rb = (w, h, d, m, x, y, z, p, r = 0.08) => { const b = sh(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m)); b.position.set(x, y, z); p.add(b); return b; };
const paint = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
const glass = new THREE.MeshPhysicalMaterial({ color: '#141C26', roughness: 0.05, metalness: 0.6, clearcoat: 1, envMapIntensity: 1.8 });
const tire = mat({ color: '#15161A', roughness: 0.9 }), rim = mat({ color: '#C8CCD2', metalness: 0.9, roughness: 0.25 }), dark = mat({ color: '#25272C', roughness: 0.7 });
const lamp = (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, toneMapped: false });
function wheels(g, xs, zs, r = 0.36) { xs.forEach((x) => zs.forEach((z) => { const w = new THREE.Group(), reg = (g.userData.wheels = g.userData.wheels || []).push(w), t = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.26, 24), tire)), h = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.275, 18), rim); t.rotation.z = h.rotation.z = Math.PI / 2; w.add(t, h); w.position.set(x, r, z); g.add(w); })); }
export function buildCar(kind = 'hatch', color = '#2E6FB5') {
  const g = new THREE.Group(), P = paint(color);
  if (kind === 'bus') {
    rb(2.5, 2.7, 9.5, P, 0, 1.75, 0, g, 0.18); rb(2.52, 0.9, 9.52, glass, 0, 2.35, 0, g, 0.1); rb(2.55, 0.18, 9.6, mat({ color: '#EDEDED' }), 0, 3.12, 0, g, 0.06);
    wheels(g, [-1.1, 1.1], [-3.1, 3.2], 0.5); [-1, 1].forEach((s) => { rb(0.5, 0.22, 0.05, lamp('#FFF4D0', 1.4), s * 0.85, 0.95, 4.78, g); rb(0.4, 0.2, 0.05, lamp('#FF2A2A', 2), s * 0.9, 1.1, -4.78, g); });
  } else if (kind === 'pickup') {
    rb(2.0, 0.7, 5.4, P, 0, 0.85, 0, g, 0.1); rb(1.85, 0.75, 1.8, P, 0, 1.55, 0.7, g, 0.14); rb(1.88, 0.5, 1.7, glass, 0, 1.6, 0.72, g, 0.08);
    rb(1.9, 0.28, 2.0, mat({ color: '#3A3D44', roughness: 0.8 }), 0, 1.2, -1.6, g, 0.05); wheels(g, [-0.9, 0.9], [-1.7, 1.55], 0.42);
    [-1, 1].forEach((s) => { rb(0.38, 0.16, 0.05, lamp('#FFF4D0', 1.4), s * 0.7, 0.95, 2.72, g); rb(0.3, 0.2, 0.05, lamp('#FF2A2A', 2), s * 0.85, 1.0, -2.72, g); }); rb(1.9, 0.18, 0.1, dark, 0, 0.5, 2.7, g, 0.04);
  } else {
    rb(1.85, 0.62, 4.3, P, 0, 0.72, 0, g, 0.14); rb(1.62, 0.58, 2.4, P, 0, 1.28, -0.25, g, 0.2); rb(1.66, 0.46, 2.3, glass, 0, 1.3, -0.25, g, 0.16);
    wheels(g, [-0.82, 0.82], [-1.35, 1.35], 0.34); [-1, 1].forEach((s) => { rb(0.42, 0.14, 0.05, lamp('#FFF4D0', 1.4), s * 0.62, 0.8, 2.16, g); rb(0.32, 0.16, 0.05, lamp('#FF2A2A', 2), s * 0.68, 0.86, -2.16, g); });
    rb(1.8, 0.16, 0.1, dark, 0, 0.45, 2.14, g, 0.04); rb(1.8, 0.16, 0.1, dark, 0, 0.45, -2.14, g, 0.04); rb(0.5, 0.12, 0.03, mat({ color: '#F5F5F0' }), 0, 0.62, 2.2, g, 0.01);
  }
  return g;
}
/** car: {at:[x,z], rotY, kind:'hatch'|'pickup'|'bus', color, path:[[t,x,z],...], hazard} a car that can be parked or drive a path (faces its direction of travel) */
function car(e) {
  const g = new THREE.Group(), body = buildCar(e.carKind || e.model || 'hatch', e.color), at = e.at || [0, 0]; g.add(body); g.position.set(at[0], 0, at[1]); g.rotation.y = e.rotY || 0;
  const hz = e.hazard ? new THREE.PointLight('#FFAA33', 2, 6, 2) : null; if (hz) { hz.position.set(0, 1, 0); g.add(hz); }
  return { id: e.id, group: g, height: 1.5, kind: 'car', subject: () => ({ pos: [g.position.x, 0, g.position.z], height: 1.4, rotY: g.rotation.y }),
    update(lt, t) { if (e.path && e.path.length) { const p = e.path; let i = 0; while (i < p.length - 1 && lt > p[i + 1][0]) i++; const a = p[i], b = p[Math.min(i + 1, p.length - 1)], k = b[0] > a[0] ? Math.max(0, Math.min(1, (lt - a[0]) / (b[0] - a[0]))) : 1; g.position.x = a[1] + (b[1] - a[1]) * k; g.position.z = a[2] + (b[2] - a[2]) * k; if (k > 0 && k < 1) g.rotation.y = Math.atan2(b[1] - a[1], b[2] - a[2]); body.position.y = Math.sin(t * 9) * 0.004; }
      if (hz) hz.intensity = Math.sin(t * 8) > 0 ? 2.5 : 0; } };
}
function bench(e) { const g = new THREE.Group(), at = e.at || [0, 0], w = mat({ color: '#8A5A35', roughness: 0.8 }); g.position.set(at[0], 0, at[1]); g.rotation.y = e.rotY || 0; rb(1.7, 0.08, 0.45, w, 0, 0.46, 0, g, 0.02); rb(1.7, 0.4, 0.07, w, 0, 0.75, -0.22, g, 0.02); [-0.75, 0.75].forEach((x) => rb(0.07, 0.46, 0.5, dark, x, 0.23, 0, g, 0.02)); return { id: e.id, group: g, height: 0.9, kind: 'bench', subject: () => ({ pos: [at[0], 0, at[1]], height: 0.9, rotY: 0 }), update() {} }; }
function hydrant(e) { const g = new THREE.Group(), at = e.at || [0, 0], m = mat({ color: '#D2322D', roughness: 0.45 }); g.position.set(at[0], 0, at[1]); const b = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.6, 16), m)); b.position.y = 0.3; const c = sh(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, 7, 0, 1.6), m)); c.position.y = 0.6; const n = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 10), m)); n.rotation.z = Math.PI / 2; n.position.y = 0.38; g.add(b, c, n); return { id: e.id, group: g, height: 0.75, kind: 'hydrant', subject: () => ({ pos: [at[0], 0, at[1]], height: 0.75, rotY: 0 }), update() {} }; }
function bin(e) { const g = new THREE.Group(), at = e.at || [0, 0]; g.position.set(at[0], 0, at[1]); const b = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.85, 18), mat({ color: '#2F5D4B', roughness: 0.6, metalness: 0.2 }))); b.position.y = 0.43; g.add(b); const l = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18), dark)); l.position.y = 0.88; g.add(l); return { id: e.id, group: g, height: 0.9, kind: 'bin', subject: () => ({ pos: [at[0], 0, at[1]], height: 0.9, rotY: 0 }), update() {} }; }
export const CITY_PROPS = { car, bench, hydrant, bin };

// ---------- more street props, a shop door that really opens, a parcel that follows a hand ----------
const wood = mat({ color: '#9A6B3E', roughness: 0.85 });
function cone(e) { const g = new THREE.Group(), at = e.at || [0, 0]; g.position.set(at[0], 0, at[1]); const b = sh(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.4), mat({ color: '#2B2B30' }))); b.position.y = 0.02; const c = sh(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 18), mat({ color: '#FF6A1A', roughness: 0.6 }))); c.position.y = 0.34; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.115, 0.1, 18), mat({ color: '#F2F2EE' })); st.position.y = 0.33; g.add(b, c, st); return { id: e.id, group: g, height: 0.65, kind: 'cone', subject: () => ({ pos: [at[0], 0, at[1]], height: 0.65, rotY: 0 }), update() {} }; }
function crate(e) { const g = new THREE.Group(), at = e.at || [0, 0], n = e.stack ?? 2; g.position.set(at[0], e.y || 0, at[1]); g.rotation.y = e.rotY || 0.2; for (let i = 0; i < n; i++) { const b = rb(0.7, 0.45, 0.7, wood, (i % 2) * 0.05, 0.225 + i * 0.45, 0, g, 0.03); b.rotation.y = i * 0.2; const sl = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.72), mat({ color: '#6F4A29' })); sl.position.set(0, 0.225 + i * 0.45, 0); g.add(sl); } return { id: e.id, group: g, height: n * 0.45, kind: 'crate', subject: () => ({ pos: [at[0], 0, at[1]], height: n * 0.45, rotY: 0 }), update() {} }; }
function planter(e) { const g = new THREE.Group(), at = e.at || [0, 0]; g.position.set(at[0], 0, at[1]); rb(0.9, 0.45, 0.45, mat({ color: '#6E7078', roughness: 0.9 }), 0, 0.225, 0, g, 0.04); for (let i = 0; i < 7; i++) { const s = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.17 + (i % 3) * 0.04, 1), mat({ color: ['#3E8E4E', '#58A64A', '#2F7A3E'][i % 3], flatShading: true }))); s.position.set(-0.36 + i * 0.12, 0.55 + (i % 2) * 0.1, (i % 3 - 1) * 0.1); g.add(s); } return { id: e.id, group: g, height: 0.8, kind: 'planter', subject: () => ({ pos: [at[0], 0, at[1]], height: 0.8, rotY: 0 }), update() {} }; }
function mailbox(e) { const g = new THREE.Group(), at = e.at || [0, 0]; g.position.set(at[0], 0, at[1]); const m = mat({ color: '#2F5BA8', roughness: 0.5, metalness: 0.3 }); rb(0.5, 0.9, 0.45, m, 0, 0.9, 0, g, 0.15); [-0.15, 0.15].forEach((x) => rb(0.07, 0.8, 0.07, dark, x, 0.4, 0, g, 0.02)); return { id: e.id, group: g, height: 1.4, kind: 'mailbox', subject: () => ({ pos: [at[0], 0, at[1]], height: 1.4, rotY: 0 }), update() {} }; }
/** shopdoor: {at:[x,z], face:1|-1 (the side the street is on, +1 = street at +x), open:[t0, dur], swing:'in'|'out', locked, sign:'PULL'} a framed glass door with a handle that really opens.
 *  The leaf swings about its hinge: 'in' pushes away from the street (into the shop), 'out' comes toward the street (a pull). Before `open` it can rattle (locked/stuck beats: rattle:[t0,dur]). */
function shopdoor(e) {
  const g = new THREE.Group(), at = e.at || [0, 0], face = e.face ?? 1, sw = e.swing || 'in', W = 1.0, Hh = 2.15; g.position.set(at[0], 0, at[1]); g.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2;   // local +z = toward the street
  const frame = mat({ color: '#23262B', metalness: 0.5, roughness: 0.5 }); rb(W + 0.24, 0.12, 0.2, frame, 0, Hh + 0.06, 0, g, 0.02); rb(0.12, Hh, 0.2, frame, -W / 2 - 0.06, Hh / 2, 0, g, 0.02); rb(0.12, Hh, 0.2, frame, W / 2 + 0.06, Hh / 2, 0, g, 0.02);
  rb(W + 0.4, 0.06, 0.5, mat({ color: '#8C8A84' }), 0, 0.03, 0.12, g, 0.01);   // threshold step
  const far = (e.hinge || 'far') === 'far', zOff = far ? -0.5 : 0.5, hx = face > 0 ? -zOff : zOff, hinge = new THREE.Group(); hinge.position.set(hx, 0, 0); g.add(hinge);   // hinge on the side AWAY from the camera by default so the open leaf never hangs in front of the person
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#7FB4D8', roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.55, clearcoat: 1 }), leaf = new THREE.Group(); leaf.position.x = -hx; hinge.add(leaf); const lx = hx < 0 ? 1 : -1;   // lx: which way the free edge lies in leaf space
  const pane = sh(new THREE.Mesh(new THREE.BoxGeometry(W - 0.08, Hh - 0.1, 0.04), glassM)); pane.position.y = Hh / 2; leaf.add(pane); [[0, 0.05, W, 0.12], [0, Hh - 0.1, W, 0.12], [-W / 2 + 0.05, Hh / 2, 0.1, Hh], [W / 2 - 0.05, Hh / 2, 0.1, Hh]].forEach(([x, y, w, h]) => rb(w, h, 0.07, frame, x, y, 0, leaf, 0.01));
  const handle = rb(0.05, 0.5, 0.06, mat({ color: '#D8D8DC', metalness: 0.9, roughness: 0.2 }), lx * (W / 2 - 0.12), 1.05, 0.08, leaf, 0.02); handle.name = 'handle';
  if (e.sign) { const t = document.createElement('canvas'); t.width = 256; t.height = 96; const c = t.getContext('2d'); c.fillStyle = '#F4F1E8'; c.fillRect(0, 0, 256, 96); c.strokeStyle = '#23262B'; c.lineWidth = 8; c.strokeRect(4, 4, 248, 88); c.fillStyle = '#B5372E'; c.font = '900 56px Arial'; c.textAlign = 'center'; c.fillText(e.sign, 128, 68); const tx = new THREE.CanvasTexture(t); tx.colorSpace = THREE.SRGBColorSpace; const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 })); pl.position.set(lx * 0.12, 1.5, 0.05); leaf.add(pl); }
  const open = e.open || [99, 1], rat = e.rattle, dirSign = (sw === 'in' ? 1 : -1) * lx;   // positive angle swings into the shop (-x for face +1), negative swings out to the street
  return { id: e.id, group: g, height: Hh, kind: 'shopdoor', subject: () => ({ pos: [at[0], 0, at[1]], height: Hh, rotY: g.rotation.y }),
    update(lt) { const k = ease((lt - open[0]) / open[1]); let a = dirSign * k * 1.75; if (rat && lt > rat[0] && lt < rat[0] + rat[1]) a += Math.sin((lt - rat[0]) * 38) * 0.025 * dirSign; hinge.rotation.y = a; } };
}
/** parcelbox: {follow:{id, dx, dy, dz}} a box carried at an actor's belly; follows the actor's position and bobs with its steps */
function parcelbox(e) {
  const g = new THREE.Group(); const box = rb(0.5, 0.32, 0.5, mat({ color: '#F2E4C9', roughness: 0.8 }), 0, 0, 0, g, 0.03); const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.07), mat({ color: '#D8342B' })); g.add(ribbon); const lid = rb(0.54, 0.05, 0.54, mat({ color: '#E8D2A8' }), 0, 0.185, 0, g, 0.01);
  const f = e.follow || {}; g.position.set(...(e.at || [0, 1, 0]));
  return { id: e.id, group: g, height: 0.4, kind: 'parcelbox', subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height: 0.4, rotY: 0 }),
    update(lt, t, byId) { const a = byId?.[f.id]; if (!a) return; const p = a.group.position, fl = a.flipSign?.() ?? 1; g.position.set(p.x + (f.dx ?? 0) * fl, p.y + (f.dy ?? 0.95) + Math.abs(Math.sin(t * 6)) * 0.0, p.z + (f.dz ?? 0.35)); g.rotation.y = 0.15 * Math.sin(t * 1.2); } };
}
Object.assign(CITY_PROPS, { cone, crate, planter, mailbox, shopdoor, parcelbox });
