// Country worlds for the stickman-in-3D style (learned from r21 and r26): a lit, real-time 3D diorama (rolling grass, wheat, hills, trees, barn, windmill,
// sun with rays, drifting clouds, fog) with props and signs that belong to the world. time: 'day' | 'dusk' | 'night' | 'storm'.
import * as THREE from 'three';
import { sky, clouds, sunlight, hills, tree, mat, T, canvasTex } from './world.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SKY = { day: ['#3D8EE0', '#CBEAF8', '#BFE4F7'], dusk: ['#4B3F9A', '#FFA070', '#E88A66'], night: ['#050A1E', '#1E2B55', '#0B1230'], storm: ['#4A5568', '#9AA5B1', '#7B8794'] };
const SUN = { day: { col: '#FFF0D6', i: 2.7, pos: [10, 14, 8], hemi: 1.25, sky: '#CFE6FF', ground: '#C48A5A', env: 0.3 }, dusk: { col: '#FFB27A', i: 2.6, pos: [-14, 5, -16], hemi: 0.9, sky: '#C9A6E0', ground: '#6A4A3A', env: 0.2 }, night: { col: '#9FB4FF', i: 0.9, pos: [-8, 12, 6], hemi: 0.35, sky: '#2A3A7A', ground: '#10162E', env: 0.06 }, storm: { col: '#DCE6F2', i: 1.2, pos: [6, 12, 6], hemi: 1.1, sky: '#9AA5B1', ground: '#5C6670', env: 0.15 } };
const GRASS = { day: '#6DBB4A', dusk: '#6C9F4E', night: '#2E5C46', storm: '#5C8A4C' };

function rayTex() { return canvasTex('sunray', 64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,240,200,0.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(w * 0.42, 0); g.lineTo(w * 0.58, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill(); }); }
function discTex() { return canvasTex('sundisc', 256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.18, 'rgba(255,244,200,0.95)'); gr.addColorStop(0.5, 'rgba(255,220,150,0.25)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }
function roadTex(time) { return canvasTex('road' + time, 256, 512, (g, w, h) => { g.fillStyle = time === 'night' ? '#2A2D35' : '#4A4D55'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? 255 : 0},${rnd(i) > 0.5 ? 255 : 0},${rnd(i) > 0.5 ? 255 : 0},0.05)`; g.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 2, 2); } g.fillStyle = '#E8B820'; g.fillRect(w / 2 - 6, 40, 4, 190); g.fillRect(w / 2 + 3, 40, 4, 190); g.fillRect(w / 2 - 6, 300, 4, 190); g.fillRect(w / 2 + 3, 300, 4, 190); g.fillStyle = '#E6E6E0'; g.fillRect(6, 0, 4, h); g.fillRect(w - 10, 0, 4, h); }); }

export function countryField(E, o = {}) {
  const time = o.time || 'day', scene = new THREE.Scene(), [top, hor, gnd] = SKY[time] || SKY.day, S = SUN[time] || SUN.day;
  sky(scene, { top, horizon: hor, ground: gnd }); scene.fog = new THREE.Fog(hor, o.fogNear ?? 38, o.fogFar ?? 190);
  const sun = sunlight(scene, E, { col: S.col, i: S.i * 1.1, pos: S.pos, sky: S.sky, ground: S.ground, hemi: S.hemi, env: S.env, box: 16 });
  const cl = clouds(scene, [[-40, 26, -110, 16], [30, 34, -125, 20], [70, 22, -100, 12], [-8, 18, -70, 9], [-70, 30, -90, 13]], time === 'night' ? '#3A4A7A' : time === 'dusk' ? '#FFB8A0' : time === 'storm' ? '#6C7683' : '#FFFFFF');
  // ground with a slow roll, a mown circle where the actors stand, a country road
  const geo = new THREE.PlaneGeometry(300, 300, 120, 120), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y + 0); p.setZ(i, (Math.sin(x * 0.07) * 0.7 + Math.cos(y * 0.05 + 1) * 0.9) * Math.min(1, Math.max(0, (d - 12) / 20))); }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mat({ map: T.grass(GRASS[time] || GRASS.day, [70, 70]) })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(14, 64), mat({ map: T.grass(GRASS[time] || GRASS.day, [8, 8]), color: '#ffffff' })); lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.005; lawn.receiveShadow = true; scene.add(lawn);
  if (o.road !== false) { const rd = new THREE.Mesh(new THREE.PlaneGeometry(o.roadW || 5, 260), mat({ map: roadTex(time), roughness: 0.9 })); rd.material.map.repeat.set(1, 26); rd.rotation.x = -Math.PI / 2; rd.position.set(o.roadX ?? 10, 0.012, -100); rd.receiveShadow = true; scene.add(rd); }
  hills(scene, { z: -78, col: time === 'night' ? '#244636' : time === 'dusk' ? '#7FA55E' : '#79C25A' });
  // foreground oak, tree line, barn, windmill
  const oak = tree(2.3, time === 'night' ? '#2F5A44' : '#4E9A3C'); oak.position.set(o.oakAt?.[0] ?? -9, 0, o.oakAt?.[1] ?? -8); scene.add(oak);
  [[-22, -16, 1.5, 'round'], [20, -22, 1.8, 'round'], [-30, -30, 2.0, 'cypress'], [32, -36, 2.2, 'cypress'], [-14, -40, 1.7, 'round'], [14, -48, 2.2, 'round']].forEach(([x, z, s, k], i) => { const t = tree(s * (1 + rnd(i) * 0.3), time === 'night' ? '#2A5240' : '#4E9A3C', k); t.position.set(x, 0, z); scene.add(t); });
  const barn = new THREE.Group(), red = mat({ color: time === 'night' ? '#5A2A28' : '#B03A2E' }), wh = mat({ color: '#F2EEE4' });
  const bx = (w, h, d, m, x, y, z, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  bx(8, 4.2, 6, red, 0, 2.1, 0, barn); [-1, 1].forEach((s) => { const r = bx(9.2, 0.3, 4, mat({ color: '#4A4A52' }), 0, 5.4, s * 1.7, barn); r.rotation.x = s * 0.62; r.position.y = 5.35; r.position.z = s * 1.65; });
  bx(2.4, 2.8, 0.1, wh, 0, 1.5, 3.05, barn); bx(0.2, 3.1, 0.12, red, 0, 1.5, 3.1, barn); const xa = bx(0.16, 3.3, 0.12, wh, 0, 1.5, 3.12, barn); xa.rotation.z = 0.7; const xb = bx(0.16, 3.3, 0.12, wh, 0, 1.5, 3.12, barn); xb.rotation.z = -0.7;
  barn.position.set(o.barnAt?.[0] ?? -20, 0, o.barnAt?.[1] ?? -30); barn.rotation.y = 0.35; scene.add(barn);
  const mill = new THREE.Group(), tw = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.8, 11, 16), mat({ color: '#EDE6D6' })); tw.position.y = 5.5; tw.castShadow = true; mill.add(tw); const cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.8, 16), mat({ color: '#7A3B2E' })); cap.position.y = 11.9; mill.add(cap);
  const rotor = new THREE.Group(); rotor.position.set(0, 10.6, 1.2); mill.add(rotor); for (let i = 0; i < 4; i++) { const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI) / 2; const bl = new THREE.Mesh(new THREE.BoxGeometry(1.3, 5.2, 0.1), mat({ color: '#F2EEE4' })); bl.position.set(0.5, 3.0, 0); bl.castShadow = true; arm.add(bl); rotor.add(arm); }
  mill.position.set(o.millAt?.[0] ?? 26, 0, o.millAt?.[1] ?? -34); scene.add(mill);
  // sun disc + rays (day and dusk)
  const rays = [];
  if (time === 'day' || time === 'dusk') {
    const dir = new THREE.Vector3(...S.pos).normalize(), far = dir.clone().multiplyScalar(170), disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: time === 'dusk' ? '#FFC090' : '#FFFFFF', fog: false, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })); disc.position.copy(far); disc.scale.setScalar(70); scene.add(disc);
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(14 + i * 3, 120), new THREE.MeshBasicMaterial({ map: rayTex(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); r.position.copy(dir.clone().multiplyScalar(70)).add(new THREE.Vector3(i * 2 - 6, -18, 0)); r.lookAt(dir.clone().multiplyScalar(300)); r.rotateZ(-0.5 + i * 0.2); scene.add(r); rays.push(r); }
  }
  // blades that sway in the wind: wheat strip + grass around the actors
  const blade = new THREE.ConeGeometry(0.035, 0.75, 3); blade.translate(0, 0.37, 0);
  const wheat = new THREE.InstancedMesh(blade, mat({ color: time === 'night' ? '#6A5A2A' : '#D9B24A', roughness: 0.9 }), 5200), wm = [], D = new THREE.Object3D();
  for (let i = 0; i < 5200; i++) { const x = (o.wheatX ?? -34) + rnd(i) * 22, z = -40 + rnd(i * 2.7) * 34; wm.push([x, z, rnd(i * 5) * 6.28, 0.8 + rnd(i * 9) * 0.7]); }
  const tuf = new THREE.InstancedMesh(blade, mat({ color: GRASS[time] || GRASS.day, roughness: 1 }), 4200), tm = [];
  for (let i = 0; i < 4200; i++) { const a = rnd(i * 1.7) * 6.28, r = 1.2 + Math.sqrt(rnd(i * 5.1)) * 15; tm.push([Math.cos(a) * r, Math.sin(a) * r - 1, rnd(i * 3) * 6.28, 0.35 + rnd(i * 7) * 0.5]); }
  scene.add(wheat, tuf);
  const wind = o.wind ?? 1;
  // wind-blown leaves and dust motes: small planes drifting along +x, looping
  const leafGeo = new THREE.PlaneGeometry(0.09, 0.05), leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshBasicMaterial({ color: time === 'night' ? '#6A7AA8' : '#E8C25A', side: THREE.DoubleSide, transparent: true, opacity: 0.85, fog: false }), 120), LD = new THREE.Object3D();
  scene.add(leaves);
  const flutter = (t) => { for (let i = 0; i < 120; i++) { const sp = 1.2 + rnd(i) * 2.2, x = ((rnd(i * 3) * 40 - 20 + t * sp * wind) % 40 + 40) % 40 - 20, y = 0.4 + rnd(i * 7) * 3.2 + Math.sin(t * 2 + i) * 0.25, z = -6 + rnd(i * 11) * 12; LD.position.set(x, y, z); LD.rotation.set(t * 3 + i, t * 2.2 + i * 2, t * 1.7); LD.updateMatrix(); leaves.setMatrixAt(i, LD.matrix); } leaves.instanceMatrix.needsUpdate = true; };
  const sway = (im, arr, t, amp) => { arr.forEach(([x, z, ry, s], i) => { D.position.set(x, 0, z); D.rotation.set(Math.sin(t * 1.6 * wind + x * 0.5 + z * 0.3) * amp * wind, ry, Math.cos(t * 1.3 * wind + x * 0.4) * amp * wind); D.scale.set(1, s, 1); D.updateMatrix(); im.setMatrixAt(i, D.matrix); }); im.instanceMatrix.needsUpdate = true; };
  return { scene, sun, look: { bloom: time === 'night' ? 0.9 : 0.35, bloomThreshold: 0.8, vignette: 0.3, grain: 0.02, warm: time === 'dusk' ? 0.05 : 0.01, exposure: time === 'night' ? 0.9 : 1.0 }, reflect: false,
    subjects: { field: { pos: [0, 0, 0], height: 1.9, rotY: 0 }, oak: { pos: [oak.position.x, 0, oak.position.z], height: 7, rotY: 0 }, barn: { pos: [barn.position.x, 0, barn.position.z], height: 5, rotY: 0 }, windmill: { pos: [mill.position.x, 0, mill.position.z], height: 13, rotY: 0 }, horizon: { pos: [0, 4, -90], height: 20, rotY: 0 }, sky: { pos: [0, 40, -100], height: 30, rotY: 0 } },
    update(t) { flutter(t); sway(wheat, wm, t, 0.16); sway(tuf, tm, t, 0.1); rotor.rotation.z = -t * 0.9 * wind; cl.forEach((c, i) => { c.position.x += 0; c.material.rotation = 0; c.position.x = [-40, 30, 70, -8, -70][i] + Math.sin(t * 0.05 + i) * 3 + t * 0.4 * wind; }); rays.forEach((r, i) => { r.material.opacity = 0.12 + 0.05 * Math.sin(t * 0.5 + i * 1.7); }); } };
}
