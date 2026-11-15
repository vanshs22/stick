// 3D sets built from primitives with toon materials, real lights/shadows, fog and emissive windows. Cached per (kind, tod).
// buildSet(kind, tod, pal) -> { group, update(t, o), bg }  (characters stand on y=0 around x/z = 0; camera looks down -z)
import * as THREE from '../../vendor/three.module.js';
import { toon, addOutline, emissive } from './mat3d.js';
import { shade } from '../core/rig.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SKY = { day: ['#6FB6E8', '#F4EAD0'], dawn: ['#6E7FC0', '#F8C79C'], dusk: ['#3A3770', '#F29A5E'], night: ['#05060F', '#1B2342'] };
const dim = (c, tod) => (tod === 'night' ? shade(c, -0.28) : tod === 'dusk' ? shade(c, -0.12) : c);
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t; }
export const skyTexture = (tod, pal, city = true) => canvasTex(256, 512, (x, w, h) => {
  const [a, b] = tod === 'day' && pal?.sky ? pal.sky : SKY[tod] || SKY.day, g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, w, h);
  if (tod === 'night') { for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,235,${0.3 + rnd(i) * 0.6})`; x.fillRect(rnd(i + 1) * w, rnd(i + 2) * h * 0.6, 2, 2); } x.fillStyle = '#F3F1E4'; x.beginPath(); x.arc(w * 0.7, h * 0.22, 20, 0, 7); x.fill(); x.fillStyle = 'rgba(8,10,24,0.55)'; x.beginPath(); x.arc(w * 0.7 + 8, h * 0.22 - 3, 18, 0, 7); x.fill(); } else { x.fillStyle = tod === 'dusk' ? '#FFC27A' : '#FFF4C8'; x.beginPath(); x.arc(w * 0.72, h * 0.25, 22, 0, 7); x.fill(); }
  if (city) { x.fillStyle = dim('#5C6786', tod); for (let i = 0; i < 7; i++) x.fillRect(i * w / 7, h * (0.68 + rnd(i + 20) * 0.12), w / 7 - 4, h); x.fillStyle = dim('#3C4566', tod); for (let i = 0; i < 6; i++) x.fillRect(i * w / 6 + 8, h * (0.78 + rnd(i + 30) * 0.1), w / 6 - 10, h); if (tod !== 'day') for (let i = 0; i < 50; i++) { x.fillStyle = 'rgba(255,214,130,0.85)'; x.fillRect(rnd(i + 40) * w, h * (0.8 + rnd(i + 50) * 0.18), 3, 4); } }
});
const bld = (w, h, d, tod, seed, col) => { const tex = canvasTex(128, 256, (x, W, H) => { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); for (let r = 0; r < 14; r++) for (let c = 0; c < 6; c++) { const on = rnd(seed * 31 + r * 7 + c) > 0.45; x.fillStyle = tod === 'day' ? '#9FC3DD' : on ? '#FFD580' : '#1C2238'; x.fillRect(8 + c * 20, 10 + r * 17, 13, 10); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [0, 1, 2, 3, 4, 5].map((i) => (i === 4 || i === 5 ? new THREE.MeshLambertMaterial({ color: dim(col, tod), emissiveMap: tod === 'day' ? null : tex, emissive: tod === 'day' ? '#000' : '#fff', map: tex }) : new THREE.MeshLambertMaterial({ color: dim(col, tod) })))); m.castShadow = true; return m; };

const M = (g, mat, x = 0, y = 0, z = 0, ol = 0) => { const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (ol) addOutline(m, ol); return m; };
const box = (w, h, d, col, x, y, z, ol = 0.01) => M(new THREE.BoxGeometry(w, h, d), toon(col), x, y, z, ol);
function lights(group, tod, kind, o = {}) {
  const night = tod === 'night', L = [];
  group.add(new THREE.HemisphereLight(night ? '#5A6CA8' : '#FFF4E0', night ? '#22182C' : '#8A7A66', night ? 2.1 : 1.6));
  const key = new THREE.DirectionalLight(night ? '#9DB2FF' : tod === 'dusk' ? '#FFB070' : '#FFF1D8', night ? 2.0 : 2.4); key.position.set(2.5, 5, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -3; sc.near = 0.5; sc.far = 18; key.shadow.bias = -0.0008; group.add(key); L.key = key;
  const rim = new THREE.DirectionalLight(night ? '#FFB36B' : '#FFE9C8', night ? 2.6 : 1.0); rim.position.set(-3, 3.5, -4); group.add(rim);
  const fill = new THREE.PointLight(night ? '#FFC78A' : '#FFFFFF', night ? 14 : 6, 9, 2); fill.position.set(1.8, 1.9, 3.2); group.add(fill);
  return L;
}
function windowFrame(group, x, y, z, w, h, tod, pal, o = {}) {
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: skyTexture(tod, pal, o.city !== false) })); sky.position.set(x, y, z + 0.01); group.add(sky);
  const fc = shade(pal.wall, -0.5); for (const [bx, by, bw, bh] of [[0, h / 2, w + 0.12, 0.06], [0, -h / 2, w + 0.12, 0.06], [-w / 2, 0, 0.06, h], [w / 2, 0, 0.06, h], [0, 0, 0.04, h], [0, 0, w, 0.04]]) group.add(box(bw, bh, 0.05, fc, x + bx, y + by, z + 0.04, 0));
  for (const s of [-1, 1]) group.add(box(0.28, h + 0.2, 0.06, dim('#B24A4A', tod), x + s * (w / 2 + 0.15), y, z + 0.08, 0.008));
  if (tod !== 'day') { const l = new THREE.PointLight(tod === 'night' ? '#9FB4FF' : '#FFB070', tod === 'night' ? 10 : 12, 6, 2); l.position.set(x, y, z + 0.8); group.add(l); }
}
function lamp(group, x, z, tod) { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 8), toon('#2A2A33'), 0, 0.7, 0), M(new THREE.CylinderGeometry(0.1, 0.2, 0.28, 16, 1, true), toon(tod === 'day' ? '#E9D8B0' : '#FFD98A', { emissive: tod === 'day' ? '#000' : '#8A5A10' }), 0, 1.5, 0, 0.006)); g.position.set(x, 0, z); group.add(g); if (tod !== 'day') { const l = new THREE.PointLight('#FFC477', 22, 7, 2); l.position.set(x, 1.45, z + 0.2); l.castShadow = false; group.add(l); } }

const ROOM = { room: ['window', 'picture', 'lamp', 'sofa', 'plant'], bedroom: ['window', 'picture', 'lamp', 'bed'], office: ['window', 'clock', 'shelf', 'desk', 'lamp'], cafe: ['window', 'pendant', 'plant', 'table'], kitchen: ['window', 'picture', 'counter', 'table'] };
function buildRoom(kind, tod, pal, deep = 3.2) {
  const g = new THREE.Group(), W = 2.7, H = 3.0, wall = dim(pal.wall, tod), floor = dim(pal.floor, tod);
  lights(g, tod, kind);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, deep + 6), toon(floor)); fl.rotation.x = -Math.PI / 2; fl.position.z = -deep / 2 + 3; fl.receiveShadow = true; g.add(fl);
  for (let i = -4; i <= 4; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.02, deep + 6), new THREE.MeshBasicMaterial({ color: shade(floor, -0.2), transparent: true, opacity: 0.35 })); s.rotation.x = -Math.PI / 2; s.position.set(i * 0.6, 0.002, -deep / 2 + 3); g.add(s); }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), toon(wall)); back.position.set(0, H / 2, -deep); back.receiveShadow = true; g.add(back);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(deep + 6, H), toon(shade(wall, s < 0 ? -0.08 : -0.14))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * W, H / 2, -deep / 2 + 3); w.receiveShadow = true; g.add(w); }
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, deep + 6), toon(shade(wall, -0.3))); ce.rotation.x = Math.PI / 2; ce.position.set(0, H, -deep / 2 + 3); g.add(ce);
  g.add(box(W * 2, 0.12, 0.04, shade(wall, -0.3), 0, 0.06, -deep + 0.02, 0));
  const z = -deep + 0.1;
  for (const p of ROOM[kind] || ROOM.room) {
    if (p === 'window') windowFrame(g, kind === 'cafe' ? -0.9 : -0.8, 1.55, -deep + 0.02, 1.3, 1.4, tod, pal);
    else if (p === 'picture') { g.add(box(0.7, 0.5, 0.04, '#2A1E14', 0.9, 1.8, z, 0), box(0.6, 0.4, 0.05, dim('#D9A36B', tod), 0.9, 1.8, z + 0.01, 0)); }
    else if (p === 'clock') { const c = M(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24), toon('#F4F0E6'), 0.9, 2.1, z, 0.006); c.rotation.x = Math.PI / 2; g.add(c); }
    else if (p === 'lamp') lamp(g, p === 'lamp' && kind === 'office' ? -2.0 : 1.9, -deep + 0.6, tod);
    else if (p === 'sofa') { g.add(box(2.2, 0.45, 0.9, dim('#4C6A8C', tod), 0.4, 0.22, z + 0.4), box(2.2, 0.55, 0.25, dim('#5E7FA3', tod), 0.4, 0.62, z + 0.05), box(0.25, 0.65, 0.9, dim('#4C6A8C', tod), -0.75, 0.32, z + 0.4), box(0.25, 0.65, 0.9, dim('#4C6A8C', tod), 1.55, 0.32, z + 0.4)); }
    else if (p === 'bed') { g.add(box(2.0, 0.4, 1.7, dim('#5E6FA8', tod), 0.3, 0.2, z + 0.9), box(2.0, 0.08, 0.5, dim('#E9E4D8', tod), 0.3, 0.44, z + 0.2), box(0.6, 0.12, 0.35, '#FFFFFF', -0.2, 0.52, z + 0.25, 0.008)); }
    else if (p === 'desk') { g.add(box(2.0, 0.07, 0.8, dim('#A57444', tod), 0.4, 0.78, z + 0.5), box(0.07, 0.78, 0.7, dim('#7A5230', tod), -0.55, 0.39, z + 0.5), box(0.07, 0.78, 0.7, dim('#7A5230', tod), 1.35, 0.39, z + 0.5)); const m = box(0.55, 0.36, 0.04, '#10151F', 0.5, 1.05, z + 0.3); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ color: '#2A6FB5' })); s.position.set(0.5, 1.05, z + 0.33); g.add(m, s); if (tod !== 'day') { const l = new THREE.PointLight('#6FB4FF', 6, 4, 2); l.position.set(0.5, 1.1, z + 0.8); g.add(l); } }
    else if (p === 'table') { g.add(M(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 28), toon(dim('#B5834F', tod)), 0.5, 0.74, z + 1.0, 0.008), M(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10), toon(dim('#7A5230', tod)), 0.5, 0.37, z + 1.0), M(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 12), toon('#F2EBDD'), 0.4, 0.82, z + 0.95, 0.004)); }
    else if (p === 'counter') { g.add(box(2.4, 0.9, 0.6, dim('#7E5A41', tod), -0.6, 0.45, z + 0.3), box(2.5, 0.06, 0.7, dim('#E4D9C4', tod), -0.6, 0.93, z + 0.3), box(0.8, 1.9, 0.7, dim('#E9EEF2', tod), 1.3, 0.95, z + 0.35)); }
    else if (p === 'shelf') { g.add(box(0.9, 2.0, 0.35, dim('#6B4A30', tod), 2.0, 1.0, z + 0.18)); for (let r = 0; r < 4; r++) for (let b = 0; b < 6; b++) g.add(box(0.1, 0.32, 0.25, dim(['#B24A4A', '#3E6FA8', '#C9A24A', '#4FA36A'][(b + r) % 4], tod), 1.7 + b * 0.12, 0.35 + r * 0.45, z + 0.3, 0)); }
    else if (p === 'plant') { g.add(M(new THREE.CylinderGeometry(0.14, 0.11, 0.3, 12), toon(dim('#8A5A3C', tod)), -2.0, 0.15, z + 0.3, 0.006)); for (let k = 0; k < 5; k++) g.add(M(new THREE.SphereGeometry(0.16, 12, 10), toon(dim('#4F9A5B', tod)), -2.0 + (k - 2) * 0.07, 0.5 + (k % 3) * 0.18, z + 0.3, 0).clone()); }
    else if (p === 'pendant') { for (const x of [-0.4, 1.0]) { g.add(M(new THREE.CylinderGeometry(0.003, 0.003, 1, 4), toon('#222'), x, 2.5, z + 1.0), M(new THREE.ConeGeometry(0.22, 0.2, 16, 1, true), toon(dim('#2D7A6B', tod), { side: THREE.DoubleSide }), x, 2.0, z + 1.0, 0.005)); const l = new THREE.PointLight('#FFD69A', tod === 'night' ? 14 : 5, 5, 2); l.position.set(x, 1.85, z + 1.05); g.add(l); } }
  }
  return { group: g, update() {}, bg: tod === 'night' ? '#05060C' : '#1A1A22' };
}

function buildHallway(tod, pal) {
  const g = new THREE.Group(), W = 1.6, L = 24, wall = shade(pal.wall, tod === 'day' ? -0.35 : -0.5), flick = [];
  g.add(new THREE.HemisphereLight('#6A74B0', '#1C1424', 1.5)); { const rim = new THREE.DirectionalLight('#FFB36B', 2.2); rim.position.set(-2, 3, -5); g.add(rim); const fl2 = new THREE.PointLight('#FFC78A', 12, 8, 2); fl2.position.set(1.2, 1.8, 3.4); g.add(fl2); }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, L), toon(shade(pal.floor, -0.3))); fl.rotation.x = -Math.PI / 2; fl.position.z = -L / 2 + 4; fl.receiveShadow = true; g.add(fl);
  const run = new THREE.Mesh(new THREE.PlaneGeometry(0.9, L), toon('#6A1F2A')); run.rotation.x = -Math.PI / 2; run.position.set(0, 0.004, -L / 2 + 4); g.add(run);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(L, 3), toon(wall)); w.rotation.y = -s * Math.PI / 2; w.position.set(s * W, 1.5, -L / 2 + 4); g.add(w); for (let i = 0; i < 5; i++) { const d = box(0.05, 2.1, 0.9, '#5A3C26', s * (W - 0.02), 1.05, 1 - i * 3.6, 0.01); g.add(d); g.add(M(new THREE.SphereGeometry(0.04, 8, 8), toon('#E3B23C'), s * (W - 0.07), 1.0, 1 - i * 3.6 + 0.3)); } }
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, L), toon(shade(wall, -0.3))); ce.rotation.x = Math.PI / 2; ce.position.set(0, 3, -L / 2 + 4); g.add(ce);
  const end = box(W * 2, 3, 0.1, shade(wall, -0.6), 0, 1.5, -L + 4, 0); g.add(end); g.add(box(0.9, 2.1, 0.08, '#4A301E', 0, 1.05, -L + 4.06, 0.01));
  for (let i = 0; i < 3; i++) { const l = new THREE.PointLight('#FFE2B0', 34, 10, 2); l.position.set(0, 2.7, 0.5 - i * 5.5); g.add(l); const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.2), emissive('#FFF3D0')); bulb.position.copy(l.position); bulb.position.y = 2.95; g.add(bulb); flick.push({ l, bulb }); }
  const dir = new THREE.DirectionalLight('#9FB0FF', 1.1); dir.position.set(2, 4, 4); dir.castShadow = true; dir.shadow.mapSize.set(1024, 1024); dir.shadow.camera.left = -4; dir.shadow.camera.right = 4; dir.shadow.camera.top = 4; dir.shadow.camera.bottom = -3; g.add(dir);
  return { group: g, bg: '#04050A', fog: ['#0A0B14', 4, 16], update(t, o) { flick.forEach((f, i) => { const on = Math.sin(t * 13 + i * 5) > -0.1 - (o.flick || 0) * 0.7 ? 1 : 0.12; f.l.intensity = 34 * on; f.bulb.visible = on > 0.5; }); } };
}

function buildOutside(kind, tod, pal) {
  const g = new THREE.Group(), night = tod === 'night', rain = [];
  lights(g, tod, kind);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), toon(dim(kind === 'street' ? '#3A3F52' : kind === 'outdoor' ? '#5F9A5A' : '#2A3B2C', tod))); ground.rotation.x = -Math.PI / 2; ground.position.z = -20; ground.receiveShadow = true; g.add(ground);
  if (kind === 'street') {
    for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(3, 90), toon(dim('#8A8FA4', tod))); sw.rotation.x = -Math.PI / 2; sw.position.set(s * 3.4, 0.01, -20); sw.receiveShadow = true; g.add(sw); const kb = box(0.15, 0.14, 90, dim('#9A9FB4', tod), s * 1.95, 0.06, -20, 0); g.add(kb); }
    for (let i = 0; i < 30; i++) g.add(box(0.12, 0.01, 1.2, '#E8DCA0', 0, 0.012, 2 - i * 3, 0));
    for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { const w = 2 + rnd(i * 3 + s + 5) * 2, h = 4 + rnd(i * 7 + s + 9) * 9, d = 3 + rnd(i + s) * 2, b = bld(w, h, d, tod, i * 2 + (s > 0), ['#58638A', '#6A5A7A', '#4A6A7A', '#7A5A5A'][(i + (s > 0)) % 4]); b.position.set(s * (5.2 + w / 2 + rnd(i) * 1.2), h / 2, 3 - i * 4.4); g.add(b); }
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) lamp(g, s * 2.5, 1.5 - i * 7, tod);
  } else {
    for (let i = 0; i < (kind === 'forest' ? 46 : 16); i++) { const s = i % 2 ? 1 : -1, x = s * (1.8 + rnd(i * 5) * (kind === 'forest' ? 9 : 14)), z = 2 - rnd(i * 9 + 1) * 30, h = 2.5 + rnd(i * 3) * 3; const tr = M(new THREE.CylinderGeometry(0.12, 0.2, h, 8), toon(dim('#4A3322', tod)), x, h / 2, z, 0.008); g.add(tr); for (let k = 0; k < 3; k++) g.add(M(new THREE.SphereGeometry(0.9 - k * 0.15, 14, 10), toon(dim(kind === 'forest' ? '#1F3A28' : '#4F9A5B', tod)), x, h + k * 0.5 - 0.3, z, 0.01)); }
    if (kind === 'outdoor') { for (let i = 0; i < 5; i++) { const h = M(new THREE.SphereGeometry(6 + rnd(i) * 4, 18, 12), toon(dim(['#5E8A6A', '#4C7A52', '#7A98B8'][i % 3], tod)), -16 + i * 8, -3, -34 - i * 2); h.scale.y = 0.55; g.add(h); } const p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 60), toon(dim('#C9A878', tod))); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.012, -20); g.add(p); }
  }
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(130, 70), new THREE.MeshBasicMaterial({ map: skyTexture(tod, pal, false), fog: false })); sky.position.set(0, 24, -48); g.add(sky);
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(900 * 6), 3)); const rl = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#C8DAFF', transparent: true, opacity: 0.45 })); rl.frustumCulled = false; rl.visible = false; g.add(rl);
  return { group: g, bg: SKY[tod]?.[1] || '#222', fog: [night ? '#0A0E1E' : tod === 'dusk' ? '#8A6A7A' : '#B8D0E0', 8, kind === 'forest' ? 24 : 55], update(t, o) { rl.visible = !!o.rain; if (o.rain) { const a = rg.attributes.position.array; for (let i = 0; i < 900; i++) { const x = (rnd(i) - 0.5) * 16, z = 4 - rnd(i + 9) * 24, y = 7 - ((rnd(i + 3) * 8 + t * (9 + rnd(i + 5) * 3)) % 8); a.set([x, y, z, x - 0.05, y - 0.35, z], i * 6); } rg.attributes.position.needsUpdate = true; } } };
}

function buildElevator(tod, pal) {
  const r = buildRoom('room', 'night', { wall: '#6C7A93', floor: '#3A4558', sky: pal.sky }, 2.6); r.group.children.filter((c) => c.isMesh && c.geometry.type === 'PlaneGeometry').forEach(() => 0);
  const g = r.group; const dl = box(0.9, 2.2, 0.06, '#8D9AB0', -0.46, 1.1, -2.52), dr = box(0.9, 2.2, 0.06, '#A7B3C7', 0.46, 1.1, -2.52); g.add(dl, dr); const lob = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.3), new THREE.MeshBasicMaterial({ color: '#FFE7B8' })); lob.position.set(0, 1.15, -2.7); lob.visible = false; g.add(lob);
  const panel = box(0.06, 0.8, 0.4, '#161C2C', 2.62, 1.2, -1.2); g.add(panel); for (let i = 0; i < 3; i++) g.add(M(new THREE.SphereGeometry(0.035, 10, 8), emissive(['#FF3B30', '#F2B23E', '#8A96AD'][i]), 2.58, 1.4 - i * 0.2, -1.2));
  return { group: g, bg: '#080A12', update(t, o) { const open = o.open || 0; dl.position.x = -0.46 - open * 0.9; dr.position.x = 0.46 + open * 0.9; lob.visible = open > 0.02; } };
}

const CACHE = new Map();
export function buildSet(kind, tod, pal) {
  const key = kind + '|' + tod; if (CACHE.has(key)) return CACHE.get(key);
  let s; if (kind === 'hallway') s = buildHallway(tod, pal); else if (kind === 'elevator') s = buildElevator(tod, pal); else if (['street', 'outdoor', 'forest'].includes(kind)) s = buildOutside(kind, tod, pal); else s = buildRoom(ROOM[kind] ? kind : 'room', tod, pal);
  CACHE.set(key, s); return s;
}
