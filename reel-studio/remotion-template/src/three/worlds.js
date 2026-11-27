// Worlds (environments). Each builder returns { scene, update(t), subjects, look } built around the origin:
// people stand on y = 0 facing +z (toward a camera on the +z side), the room is open on the camera side.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { lightRig } from './engine.js';
import { T, mat, canvasTex, sky, clouds, sunlight, tree } from './world.js';
import { voxelValley } from './voxelworld.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const shadow = (m) => { m.castShadow = m.receiveShadow = true; return m; };
/** a rounded box (soft edges catch light: the single biggest difference between "CGI cubes" and "designed props") */
export function rbox(w, h, d, m, x = 0, y = 0, z = 0, parent, r = 0.02) { const b = shadow(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), m)); b.position.set(x, y, z); if (parent) parent.add(b); return b; }
export function cyl(r1, r2, h, m, x = 0, y = 0, z = 0, parent, seg = 24) { const c = shadow(new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m)); c.position.set(x, y, z); if (parent) parent.add(c); return c; }
export function ball(r, m, x = 0, y = 0, z = 0, parent) { const b = shadow(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), m)); b.position.set(x, y, z); if (parent) parent.add(b); return b; }
export const emissive = (color, i = 2) => new THREE.MeshStandardMaterial({ color: '#000', emissive: color, emissiveIntensity: i, roughness: 0.4 });
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

/** texture of a code editor, for monitors */
function screenTex(w = 512, h = 320, accent = '#6FD3FF') {
  return canvasTex('screen' + accent, w, h, (g) => {
    g.fillStyle = '#0E1424'; g.fillRect(0, 0, w, h); g.fillStyle = '#17203a'; g.fillRect(0, 0, w, 22); ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(14 + i * 16, 11, 4, 0, 7); g.fill(); });
    const cols = [accent, '#F1C27A', '#7BE0A8', '#D79BFF', '#ffffff'];
    for (let r = 0; r < 14; r++) { let x = 20 + (r % 3) * 22; for (let k = 0; k < 4; k++) { const ww = 28 + rnd(r * 9 + k) * 90; g.fillStyle = cols[(r + k) % 5]; g.globalAlpha = 0.8; g.fillRect(x, 40 + r * 19, ww, 8); x += ww + 10; } }
    g.globalAlpha = 1;
  });
}
/** window with a soft night-city / dusk backdrop, for interiors */
function cityTex(top = '#10163A', bottom = '#4a3a7a') {
  return canvasTex('city' + top + bottom, 512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { const bw = 30 + rnd(i) * 50, bh = 80 + rnd(i + 20) * 230, x = rnd(i + 40) * w; g.fillStyle = shade('#1a2048', 0.7 + rnd(i) * 0.5); g.fillRect(x, h - bh, bw, bh); for (let k = 0; k < 14; k++) { if (rnd(i * 30 + k) > 0.45) { g.fillStyle = rnd(k) > 0.5 ? '#ffd88a' : '#9fd6ff'; g.fillRect(x + 4 + rnd(i * 5 + k) * (bw - 10), h - bh + 6 + rnd(k + i) * (bh - 12), 4, 5); } } }
    g.filter = 'blur(2px)';
  });
}

function daySkyTex() {
  return canvasTex('daysky', 512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6FB4F5'); gr.addColorStop(0.7, '#CFE8FF'); gr.addColorStop(1, '#F4F9FF'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.9)'; [[120, 120, 60], [190, 100, 80], [270, 125, 55], [380, 220, 70], [440, 200, 50], [90, 280, 50]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    for (let i = 0; i < 14; i++) { const bw = 30 + rnd(i) * 44, bh = 50 + rnd(i + 20) * 150, x = rnd(i + 40) * w; g.fillStyle = shade('#9CB4D6', 0.85 + rnd(i) * 0.3); g.fillRect(x, h - bh, bw, bh); }
  });
}
// ═══════════════════════════ HOME STUDIO (presenter) / LOFT (stick) ═══════════════════════════ ═══════════════════════════
export function homeStudio(E, o = {}) {
  const day = !!o.day, scene = new THREE.Scene(); scene.background = new THREE.Color(day ? '#cfe6ff' : '#0b1022'); scene.environment = E.envMap; scene.environmentIntensity = day ? 0.7 : 0.28;
  const wallCol = o.wall || '#2F4B63', trim = '#E8E1D4', wood = o.wood || '#B98255', accent = o.accent || '#F2B84B';
  const lamps = [];
  // room shell, open toward +z
  const floor = shadow(new THREE.Mesh(new THREE.PlaneGeometry(14, 22), mat({ map: T.planks(wood, [4, 6]), roughness: 0.55 }))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 3); scene.add(floor);
  const back = shadow(new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat({ color: wallCol, roughness: 0.9 }))); back.position.set(0, 5.5, -3.4); scene.add(back);
  const left = shadow(new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat({ color: shade(wallCol, 0.85), roughness: 0.9 }))); left.rotation.y = Math.PI / 2; left.position.set(-5, 5.5, 4); scene.add(left);
  const right = shadow(new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat({ color: shade(wallCol, 0.8), roughness: 0.9 }))); right.rotation.y = -Math.PI / 2; right.position.set(5, 5.5, 4); scene.add(right);
  rbox(14, 0.12, 0.05, mat({ color: trim }), 0, 0.06, -3.38, scene); rbox(14, 0.1, 0.05, mat({ color: trim }), 0, 4.6, -3.38, scene);
  // wainscot + picture rail give the wall scale
  rbox(14, 0.9, 0.04, mat({ color: shade(wallCol, 0.7), roughness: 0.8 }), 0, 0.55, -3.37, scene);
  // window with a city outside
  const wx = -1.6; const win = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.7), new THREE.MeshBasicMaterial({ map: day ? daySkyTex() : cityTex(o.skyTop, o.skyBottom), toneMapped: false })); win.position.set(wx, 2.25, -3.36); scene.add(win);
  rbox(2.2, 0.08, 0.09, mat({ color: trim }), wx, 3.14, -3.34, scene); rbox(2.2, 0.08, 0.09, mat({ color: trim }), wx, 1.36, -3.34, scene); rbox(0.08, 1.8, 0.09, mat({ color: trim }), wx - 1.06, 2.25, -3.34, scene); rbox(0.08, 1.8, 0.09, mat({ color: trim }), wx + 1.06, 2.25, -3.34, scene); rbox(0.05, 1.7, 0.08, mat({ color: trim }), wx, 2.25, -3.34, scene);
  // curtains
  [[-1.0, -1], [1.0, 1]].forEach(([dx, s]) => rbox(0.34, 2.2, 0.08, mat({ color: shade(wallCol, 1.35), roughness: 1 }), wx + dx * 1.18, 2.2, -3.28, scene, 0.05));
  // desk + monitor + lamp
  const dx = 1.7, dz = -2.45, desk = new THREE.Group(); desk.position.set(dx, 0, dz); scene.add(desk);
  rbox(2.4, 0.07, 0.95, mat({ color: shade(wood, 0.8), roughness: 0.45 }), 0, 0.76, 0, desk, 0.03);
  [[-1.1, -0.38], [1.1, -0.38], [-1.1, 0.38], [1.1, 0.38]].forEach(([x, z]) => rbox(0.07, 0.74, 0.07, mat({ color: '#222831', roughness: 0.4, metalness: 0.5 }), x, 0.37, z, desk));
  const mon = new THREE.Group(); mon.position.set(0.1, 0.8, -0.2); desk.add(mon);
  rbox(1.0, 0.6, 0.05, mat({ color: '#15181f', roughness: 0.3 }), 0, 0.5, 0, mon, 0.025);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.54), new THREE.MeshBasicMaterial({ map: screenTex(512, 300, accent), toneMapped: false })); scr.position.set(0, 0.5, 0.03); mon.add(scr);
  rbox(0.07, 0.25, 0.05, mat({ color: '#15181f', metalness: 0.6, roughness: 0.3 }), 0, 0.12, -0.01, mon); rbox(0.34, 0.025, 0.2, mat({ color: '#15181f', metalness: 0.6 }), 0, 0.01, 0.02, mon);
  rbox(0.5, 0.02, 0.17, mat({ color: '#2a2f3a', roughness: 0.5 }), 0.05, 0.795, 0.3, desk); cyl(0.045, 0.04, 0.09, mat({ color: '#E8E1D4', roughness: 0.3 }), -0.8, 0.84, 0.15, desk);
  const lampG = new THREE.Group(); lampG.position.set(-0.95, 0.8, -0.2); desk.add(lampG); cyl(0.09, 0.1, 0.03, mat({ color: '#20242d', metalness: 0.7, roughness: 0.3 }), 0, 0.015, 0, lampG); cyl(0.012, 0.012, 0.45, mat({ color: '#20242d', metalness: 0.7 }), 0, 0.24, 0, lampG);
  const shd = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 24, 1, true), mat({ color: accent, roughness: 0.5, side: THREE.DoubleSide }))); shd.position.set(0.05, 0.5, 0); shd.rotation.z = 0.5; lampG.add(shd);
  const bulb = ball(0.035, emissive('#FFE3B0', 3), 0.08, 0.44, 0, lampG); bulb.castShadow = false;
  const lampLight = new THREE.PointLight('#FFC27A', day ? 0.6 : 3.2, 6, 1.6); lampLight.position.set(dx - 0.9, 1.2, dz - 0.1); scene.add(lampLight);
  const screenLight = new THREE.PointLight(accent, 1.6, 4, 1.8); screenLight.position.set(dx + 0.1, 1.2, dz + 0.5); scene.add(screenLight);
  // chair
  const chair = new THREE.Group(); chair.position.set(dx + 0.1, 0, dz + 0.75); chair.rotation.y = 0.5; scene.add(chair);
  rbox(0.5, 0.08, 0.5, mat({ color: '#2b3340', roughness: 0.6 }), 0, 0.5, 0, chair, 0.04); rbox(0.48, 0.55, 0.07, mat({ color: '#2b3340', roughness: 0.6 }), 0, 0.82, -0.23, chair, 0.04); cyl(0.025, 0.025, 0.45, mat({ color: '#15181f', metalness: 0.6 }), 0, 0.25, 0, chair);
  for (let a = 0; a < 5; a++) rbox(0.3, 0.025, 0.04, mat({ color: '#15181f', metalness: 0.5 }), Math.cos(a * 1.2566) * 0.15, 0.03, Math.sin(a * 1.2566) * 0.15, chair).rotation.y = -a * 1.2566;
  // bookshelf
  const sh = new THREE.Group(); sh.position.set(-3.7, 0, -3.1); scene.add(sh);
  const frameM = mat({ color: shade(wood, 0.72), roughness: 0.6 });
  rbox(0.05, 2.4, 0.38, frameM, -0.825, 1.2, 0, sh, 0.01); rbox(0.05, 2.4, 0.38, frameM, 0.825, 1.2, 0, sh, 0.01); rbox(1.7, 2.4, 0.03, mat({ color: shade(wallCol, 0.6), roughness: 0.9 }), 0, 1.2, -0.17, sh, 0.005); rbox(1.7, 0.05, 0.38, frameM, 0, 2.4, 0, sh, 0.01);
  for (let r = 0; r < 5; r++) { rbox(1.6, 0.04, 0.36, frameM, 0, 0.04 + r * 0.55, 0, sh, 0.008); if (r === 4) break; let x = -0.74; for (let k = 0; k < 16 && x < 0.7; k++) { const w = 0.04 + rnd(r * 13 + k) * 0.06, h = 0.26 + rnd(r * 7 + k) * 0.2; if (rnd(r * 3 + k * 5) > 0.82) { x += 0.12; continue; } rbox(w, h, 0.22, mat({ color: ['#C94A3A', '#2F6DB5', '#E8B23A', '#3F8F6B', '#7A4FA3', '#E8E1D4'][(r + k) % 6], roughness: 0.7 }), x + w / 2, 0.06 + r * 0.55 + h / 2, 0.0, sh, 0.008); x += w + 0.006; } }
  // plants
  const plant = (x, z, s = 1, col = '#3F8F5B') => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); cyl(0.2, 0.15, 0.34, mat({ color: '#D8C6A8', roughness: 0.7 }), 0, 0.17, 0, g); for (let i = 0; i < 9; i++) { const l = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), mat({ color: shade(col, 0.8 + rnd(i) * 0.5), roughness: 0.6 }))); l.scale.set(0.5, 1.7, 0.18); l.position.set(Math.cos(i * 2.4) * 0.1, 0.6 + rnd(i + 3) * 0.3, Math.sin(i * 2.4) * 0.1); l.rotation.set(Math.sin(i * 2.4) * 0.55, i * 0.9, -Math.cos(i * 2.4) * 0.55); g.add(l); } return g; };
  plant(-2.6, -2.8, 1.2); plant(4.2, -2.4, 1.5, '#2F7F55'); plant(-1.5, 1.4, 0.7, '#4FA06A');
  // rug, wall art, floor lamp
  const rug = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.02, 48), mat({ color: shade(accent, 0.55), roughness: 1 }))); rug.position.set(0, 0.011, 0.2); scene.add(rug);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.45, 64), new THREE.MeshBasicMaterial({ color: shade(accent, 1.0), toneMapped: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.025, 0.2); scene.add(ring);
  [[1.2, 3.1, -3.36, 0.7, 0.9, '#E8B23A'], [2.3, 3.0, -3.36, 0.5, 0.5, '#C94A3A'], [-3.7, 3.6, -3.36, 0.9, 0.6, '#3F8F6B']].forEach(([x, y, z, w, h, c], i) => { rbox(w + 0.08, h + 0.08, 0.03, mat({ color: '#15181f' }), x, y, z, scene); rbox(w, h, 0.02, mat({ color: c, roughness: 0.8 }), x, y, z + 0.02, scene); });
  const fl = new THREE.Group(); fl.position.set(3.7, 0, -2.2); scene.add(fl); cyl(0.14, 0.16, 0.03, mat({ color: '#20242d', metalness: 0.7 }), 0, 0.015, 0, fl); cyl(0.012, 0.012, 1.7, mat({ color: '#20242d', metalness: 0.7 }), 0, 0.88, 0, fl); const fs = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.7), mat({ color: '#FFF2D8', emissive: '#FFC27A', emissiveIntensity: 0.9, side: THREE.DoubleSide }))); fs.position.set(0, 1.75, 0); fl.add(fs);
  const fLight = new THREE.PointLight('#FFB867', day ? 0.5 : 2.4, 7, 1.6); fLight.position.set(3.5, 1.7, -2.0); scene.add(fLight);
  // soft key from the front-left and a cool rim from the window side
  if (o.sofa) { const sf = new THREE.Group(); sf.position.set(o.sofa[0], 0, o.sofa[1]); scene.add(sf); const fab = mat({ color: shade(accent, 0.95), roughness: 0.95 }); rbox(2.1, 0.32, 0.9, fab, 0, 0.3, 0, sf, 0.1); rbox(2.1, 0.55, 0.22, fab, 0, 0.68, -0.34, sf, 0.09); [-1, 1].forEach((x) => rbox(0.22, 0.55, 0.9, fab, x * 0.95, 0.45, 0, sf, 0.09)); [-1, 1].forEach((x) => rbox(0.8, 0.14, 0.7, mat({ color: shade(accent, 1.12), roughness: 0.95 }), x * 0.42, 0.52, 0.06, sf, 0.06)); rbox(0.38, 0.38, 0.12, mat({ color: '#F3E7D3', roughness: 1 }), -0.7, 0.7, 0.0, sf, 0.05).rotation.set(-0.2, 0.3, 0.1); }
  const rig = lightRig(scene, day ? { key: '#FFF1D6', keyI: 3.4, keyPos: [-3.5, 5, 4], rimCol: '#CFE4FF', rimI: 1.2, sky: '#DCEBFF', ground: '#B89B7A', hemiI: 1.0, shadowBox: 5, target: [0, 1, 0] } : { key: '#FFE7CC', keyI: 2.2, keyPos: [-3, 4.2, 4.5], rimCol: '#7FA9FF', rimI: 2.4, sky: '#9BB4D8', ground: '#5C4636', hemiI: 0.55, shadowBox: 4.5, target: [0, 1, 0] });
  rig.key.shadow.camera.far = 24; rig.key.shadow.camera.updateProjectionMatrix();
  return {
    scene, look: day ? { bloom: 0.2, bloomThreshold: 0.92, vignette: 0.18, grain: 0.015, warm: 0.02, exposure: 1.0 } : { bloom: 0.45, bloomThreshold: 0.8, vignette: 0.32, grain: 0.02, warm: 0.02, exposure: 1.05 },
    subjects: { desk: { pos: [dx, 0.8, dz], height: 0.8, rotY: 0 }, monitor: { pos: [dx + 0.1, 0.9, dz - 0.15], height: 0.6, rotY: 0 }, window: { pos: [wx, 1.4, -3.3], height: 1.7, rotY: 0 } },
    update(t) { lampLight.intensity = 3.2 + Math.sin(t * 1.3) * 0.08; screenLight.intensity = 1.6 + Math.sin(t * 7.3) * 0.12; },
  };
}


// ═══════════════════════════ BLOCK YARD (block-toy world) ═══════════════════════════
function studTex(base = '#5DB84A', rep = 60) {
  return canvasTex('studs' + base, 128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 16 + i * 32, y = 16 + j * 32, gr = g.createRadialGradient(x - 3, y - 3, 1, x, y, 11); gr.addColorStop(0, shade(base, 1.32)); gr.addColorStop(1, shade(base, 0.78)); g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x + 2, y + 3, 11, 0, 7); g.fill(); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 9.5, 0, 7); g.fill(); }
  }, [rep, rep]);   // canvasTex wants [x, y]: a bare number gave NaN repeats and the studs never showed
}
function blockTree(s = 1, leaf = '#4FA84A', trunk = '#7A5230') {
  const g = new THREE.Group(); rbox(0.26, 1.1, 0.26, mat({ color: trunk, roughness: 0.8 }), 0, 0.55, 0, g, 0.03);
  [[1.5, 1.3, 0], [1.1, 2.0, 0.04], [0.7, 2.55, -0.03]].forEach(([w, y, o], i) => rbox(w, w * 0.9, w, mat({ color: shade(leaf, 0.92 + i * 0.1), roughness: 0.7 }), o, y, o * 0.5, g, 0.1)); g.scale.setScalar(s); return g;
}
function blockHouse(o = {}) {
  const g = new THREE.Group(), wall = mat({ color: o.wall || '#EBD9B4', roughness: 0.6 }), roof = mat({ color: o.roof || '#C8472F', roughness: 0.5 }), trim = mat({ color: '#FFFFFF', roughness: 0.4 });
  rbox(3.6, 2.0, 2.7, wall, 0, 1.0, 0, g, 0.05); rbox(3.8, 0.14, 2.9, trim, 0, 0.07, 0, g, 0.03);
  for (const sx of [-1, 1]) { const r = rbox(2.4, 0.16, 3.1, roof, sx * 0.93, 2.55, 0, g, 0.04); r.rotation.z = -sx * 0.62; }
  rbox(0.2, 0.9, 3.0, roof, 0, 2.97, 0, g, 0.03).scale.set(1, 0.3, 1); rbox(0.5, 1.1, 0.5, mat({ color: '#B7664A', roughness: 0.8 }), 1.15, 3.0, -0.4, g, 0.04);
  rbox(0.62, 1.18, 0.08, mat({ color: '#3C6FB6', roughness: 0.4 }), 0, 0.64, 1.36, g, 0.03); ball(0.035, mat({ color: '#FFD45A', metalness: 0.8, roughness: 0.25 }), 0.2, 0.62, 1.42, g); rbox(0.76, 1.3, 0.05, trim, 0, 0.7, 1.33, g, 0.02);
  [-1.2, 1.2].forEach((x) => { rbox(0.82, 0.82, 0.06, trim, x, 1.22, 1.36, g, 0.02); const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.68), new THREE.MeshStandardMaterial({ color: '#BFE4FF', emissive: '#7FB6E8', emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.2 })); gl.position.set(x, 1.22, 1.395); g.add(gl); rbox(0.04, 0.7, 0.03, trim, x, 1.22, 1.4, g, 0.005); rbox(0.7, 0.04, 0.03, trim, x, 1.22, 1.4, g, 0.005); rbox(0.9, 0.12, 0.2, mat({ color: '#6B4A2E' }), x, 0.77, 1.44, g, 0.03); for (let k = 0; k < 4; k++) ball(0.07, mat({ color: ['#FF6B8E', '#FFD45A', '#FF8F3D', '#FFFFFF'][k] }), x - 0.3 + k * 0.2, 0.88, 1.46, g); });
  rbox(1.4, 0.14, 0.9, mat({ color: '#B9B4AA', roughness: 0.8 }), 0, 0.07, 1.8, g, 0.03); rbox(1.1, 0.1, 0.4, mat({ color: '#B9B4AA', roughness: 0.8 }), 0, 0.05, 2.35, g, 0.03);
  return g;
}
/** the things that make a block-game world read as a game world: a spawn pad, lamp posts, a mailbox, a leaderboard sign, flower beds, rocks, and a colourful obstacle course in the distance */
function blockProps(scene) {
  const M = (c, o = {}) => mat({ color: c, roughness: 0.55, ...o });
  // spawn pad: a glowing disc the avatar appears on
  const pad = new THREE.Group(); const disc = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 40), M('#E8EEF5'))); disc.position.y = 0.04; pad.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.035, 8, 48), new THREE.MeshStandardMaterial({ color: '#6FE3FF', emissive: '#3CCBFF', emissiveIntensity: 1.2 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.09; pad.add(ring); pad.position.set(-0.4, 0, 0.6); scene.add(pad);
  // lamp posts along the path
  [[3.1, -0.4], [-1.9, -0.9], [4.6, -5.5]].forEach(([x, z]) => { rbox(0.12, 1.9, 0.12, M('#3A3F4A'), x, 0.95, z, scene, 0.03); rbox(0.34, 0.34, 0.34, new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#FFD66B', emissiveIntensity: 1.1 }), x, 1.98, z, scene, 0.08); });
  // mailbox
  rbox(0.1, 0.8, 0.1, M('#7A5230'), 3.9, 0.4, 0.8, scene, 0.02); rbox(0.5, 0.3, 0.3, M('#D8402F'), 3.9, 0.9, 0.8, scene, 0.08); rbox(0.04, 0.2, 0.04, M('#FFE34D'), 4.12, 1.02, 0.8, scene, 0.01);
  // leaderboard sign (readable text on a plank)
  const board = canvasTex('lb-sign', 256, 160, (g, w, h) => { g.fillStyle = '#23262F'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFD45A'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('TOP BUILDERS', w / 2, 38); g.font = 'bold 24px sans-serif'; g.textAlign = 'left'; ['1  Nova      9,420', '2  Pixel     8,115', '3  You       7,990'].forEach((t, i) => { g.fillStyle = i === 2 ? '#7CF0A6' : '#E9EEF5'; g.fillText(t, 22, 78 + i * 30); }); });
  rbox(0.1, 1.5, 0.1, M('#7A5230'), -3.3, 0.75, 0.9, scene, 0.02); rbox(0.1, 1.5, 0.1, M('#7A5230'), -1.9, 0.75, 0.9, scene, 0.02); rbox(1.7, 1.05, 0.1, M('#23262F'), -2.6, 1.55, 0.9, scene, 0.05);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.95), new THREE.MeshBasicMaterial({ map: board, toneMapped: false })); face.position.set(-2.6, 1.55, 0.96); scene.add(face);
  // flower beds and rocks
  [['#FF6FA3', -1.1, 0.2], ['#FFD45A', 2.6, 0.5], ['#7FD3FF', 1.9, 0.9], ['#FF8A4D', -3.9, -0.7], ['#FF6FA3', 5.4, -0.5]].forEach(([c, x, z], i) => { rbox(0.6, 0.12, 0.34, M('#7A5230'), x, 0.06, z, scene, 0.03); for (let k = 0; k < 4; k++) { rbox(0.05, 0.22, 0.05, M('#3F9A47'), x - 0.21 + k * 0.14, 0.2, z, scene, 0.01); rbox(0.13, 0.13, 0.13, M(c), x - 0.21 + k * 0.14, 0.34, z, scene, 0.04); } });
  [[-5.1, -1.6, 0.5], [6.2, -2.0, 0.65], [-0.8, -6.0, 0.8]].forEach(([x, z, s], i) => { const r = rbox(s, s * 0.7, s * 0.85, M('#9AA1AB', { roughness: 0.85 }), x, s * 0.33, z, scene, 0.12); r.rotation.y = i; });
  // obstacle course in the distance: coloured platforms climbing away, with a truss tower
  ['#FF5D5D', '#FFB347', '#FFE34D', '#6FD66F', '#4FC3F7', '#9575F5'].forEach((c, i) => rbox(2.2, 0.35, 2.2, M(c), -14 + i * 2.2, 0.2 + i * 0.7, -16 - (i % 2) * 1.5, scene, 0.08));
  for (let i = 0; i < 6; i++) { rbox(0.12, 6, 0.12, M('#C9CED6', { metalness: 0.4 }), -17.5 + (i % 2) * 0.9, 3, -14.5 + Math.floor(i / 2) * 0.9, scene, 0.02); }
  // a second row of houses far away so the yard feels like a neighbourhood
  [[-14, -22, '#F2C6A0', '#6B5B95'], [10, -20, '#BFE3C0', '#C8472F'], [18, -24, '#F7E3A3', '#3C6FB6']].forEach(([x, z, w, r], i) => { const hh = blockHouse({ wall: w, roof: r }); hh.position.set(x, 0, z); hh.rotation.y = -0.2 + i * 0.25; hh.scale.setScalar(1.2); scene.add(hh); });
}
export function blockYard(E, o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#9FD0F5'); scene.environment = E.envMap; scene.environmentIntensity = 0.5;
  sky(scene, { top: '#3D86E0', horizon: '#CDE9FB', ground: '#8CCB6A' });
  const studMap = studTex('#63BC4B', 60), plate = shadow(new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: studMap, bumpMap: studMap, bumpScale: 1.6, roughness: 0.5 }))); plate.rotation.x = -Math.PI / 2; plate.position.set(0, 0, -20); scene.add(plate);
  const house = blockHouse(o.house); house.position.set(1.2, 0, -3.6); scene.add(house);
  const h2 = blockHouse({ wall: '#BFD9EE', roof: '#3C6FB6' }); h2.position.set(-6.8, 0, -7.5); h2.rotation.y = 0.4; scene.add(h2);
  [[-3.8, -3.0, 1.1], [4.9, -3.4, 1.4], [-2.4, -9.5, 1.5], [7.5, -9, 1.2], [-9.5, -3, 1.3], [10.5, -5, 1.6]].forEach(([x, z, sc], i) => { const t = blockTree(sc, i % 2 ? '#4FA84A' : '#5DBB52'); t.position.set(x, 0, z); t.rotation.y = i; scene.add(t); });
  // path of bricks from the door to the camera, flowers, bushes
  for (let i = 0; i < 9; i++) rbox(0.9, 0.07, 0.5, mat({ color: i % 2 ? '#C9C3B6' : '#B6B0A4', roughness: 0.85 }), 1.2 + Math.sin(i * 0.9) * 0.08, 0.035, -1.2 + i * 0.62, scene, 0.03);
  [[-1.6, -0.5], [3.7, -0.2], [-0.2, -2.4], [3.2, -2.5]].forEach(([x, z], i) => rbox(0.7, 0.5, 0.7, mat({ color: '#3F9A47', roughness: 0.8 }), x, 0.25, z, scene, 0.18));
  for (let i = 0; i < 26; i++) { const x = -5.6 + i * 0.44; if (x > 0.35 && x < 2.1) continue; rbox(0.09, 0.62, 0.05, mat({ color: '#FFFFFF', roughness: 0.5 }), x, 0.31, -1.55, scene, 0.015); }
  [[-2.65, 5.7], [3.5, 3.0]].forEach(([cx, w]) => { rbox(w, 0.06, 0.04, mat({ color: '#FFFFFF' }), cx, 0.5, -1.55, scene, 0.01); rbox(w, 0.06, 0.04, mat({ color: '#FFFFFF' }), cx, 0.2, -1.55, scene, 0.01); });
  blockProps(scene);
  // far mountains (pyramids) and drifting block clouds
  [[-24, -42, 16, 11, '#7FA6C9'], [8, -50, 20, 14, '#6F9AC2'], [34, -40, 14, 9, '#86AECF'], [-46, -34, 12, 8, '#8AB1D4']].forEach(([x, z, r, h, c]) => { const m = shadow(new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), mat({ color: c, roughness: 0.9 }))); m.position.set(x, h / 2 - 0.4, z); m.rotation.y = 0.8; scene.add(m); });
  const clouds = []; for (let i = 0; i < 8; i++) { const cg = new THREE.Group(); const n = 3 + (i % 3); for (let k = 0; k < n; k++) rbox(1.8 + rnd(i + k) * 1.4, 0.7 + rnd(k) * 0.4, 1.4 + rnd(k + 5), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, emissive: '#FFFFFF', emissiveIntensity: 0.35 }), k * 1.5 - n * 0.7, rnd(k + i) * 0.4, rnd(k) * 0.6, cg, 0.25); cg.position.set(-24 + i * 7.5, 9 + (i % 3) * 2.4, -22 - (i % 4) * 4); cg.scale.setScalar(1.4); scene.add(cg); clouds.push(cg); }
  sunlight(scene, E, { col: '#FFF1D2', i: 3.4, pos: [7, 10, 8], target: [0, 0.8, 0], box: 9, sky: '#CDE6FF', ground: '#8FC66B', hemi: 1.15, env: 0.55 });
  return {
    scene, look: { bloom: 0.18, bloomThreshold: 0.93, vignette: 0.16, grain: 0.012, warm: 0.02, exposure: 1.0 },
    subjects: { house: { pos: [1.2, 0, -3.6], height: 3.2, rotY: 0 }, door: { pos: [1.2, 0.6, -2.25], height: 1.2, rotY: 0 } },
    update(t) { clouds.forEach((c, i) => { c.position.x = ((c.position.x + 30 + t * (0.18 + (i % 3) * 0.06)) % 66) - 30; }); },
  };
}


// ═══════════════════════════ WORKSHOP (small expressive characters) ═══════════════════════════
function pegTex(accent) {
  return canvasTex('peg' + accent, 1024, 512, (g, w, h) => {
    g.fillStyle = '#E9D9B8'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(80,60,40,0.22)'; for (let y = 14; y < h; y += 28) for (let x = 14; x < w; x += 28) { g.beginPath(); g.arc(x, y, 3.4, 0, 7); g.fill(); }
    const tool = (x, y, kind, col) => { g.save(); g.translate(x, y); g.strokeStyle = 'rgba(40,30,20,0.55)'; g.lineWidth = 3; g.fillStyle = col; if (kind === 'hammer') { g.beginPath(); g.roundRect(-8, -10, 16, 120, 6); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-34, -34, 68, 30, 6); g.fillStyle = '#7C8794'; g.fill(); g.stroke(); } else if (kind === 'wrench') { g.beginPath(); g.roundRect(-9, 0, 18, 130, 8); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -4, 26, 0, 7); g.fill(); g.stroke(); } else if (kind === 'saw') { g.beginPath(); g.moveTo(0, 0); g.lineTo(130, 24); g.lineTo(130, 66); g.lineTo(0, 66); g.closePath(); g.fillStyle = '#BFC8D2'; g.fill(); g.stroke(); g.fillStyle = col; g.beginPath(); g.roundRect(-34, 8, 38, 50, 10); g.fill(); g.stroke(); } else { g.beginPath(); g.roundRect(0, 0, 90, 56, 8); g.fill(); g.stroke(); } g.restore(); };
    tool(90, 90, 'hammer', accent); tool(220, 80, 'wrench', '#C9503A'); tool(330, 100, 'saw', '#2F6DB5'); tool(560, 70, 'wrench', '#E8B23A'); tool(690, 90, 'hammer', '#3F8F6B'); tool(820, 110, 'box', '#C9503A'); tool(900, 270, 'box', '#2F6DB5'); tool(120, 330, 'box', '#E8B23A');
  });
}
export function workshop(E, o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#10202a'); scene.environment = E.envMap; scene.environmentIntensity = 0.32;
  const wall = o.wall || '#2C6E7A', accent = o.accent || '#F0683C';
  const floor = shadow(new THREE.Mesh(new THREE.PlaneGeometry(14, 22), mat({ map: T.planks('#6B4A32', [4, 6]), roughness: 0.6 }))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 3); scene.add(floor);
  const back = shadow(new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat({ color: wall, roughness: 0.9 }))); back.position.set(0, 5.5, -3.4); scene.add(back);
  for (const sx of [-1, 1]) { const w = shadow(new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat({ color: shade(wall, 0.8), roughness: 0.9 }))); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 5, 5.5, 4); scene.add(w); }
  const peg = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshStandardMaterial({ map: pegTex(accent), roughness: 0.8 })); peg.position.set(0.4, 2.35, -3.36); scene.add(peg); rbox(5.7, 0.08, 0.06, mat({ color: '#6B4A32' }), 0.4, 3.78, -3.34, scene); rbox(5.7, 0.08, 0.06, mat({ color: '#6B4A32' }), 0.4, 0.92, -3.34, scene);
  const bench = new THREE.Group(); bench.position.set(0.4, 0, -2.8); scene.add(bench);
  rbox(5.2, 0.1, 0.85, mat({ color: '#B98255', roughness: 0.5 }), 0, 0.88, 0, bench, 0.03); rbox(5.0, 0.08, 0.7, mat({ color: '#5A3E2A' }), 0, 0.28, 0, bench, 0.02); [-2.5, 2.5].forEach((x) => [-0.35, 0.35].forEach((z) => rbox(0.1, 0.84, 0.1, mat({ color: '#5A3E2A', roughness: 0.7 }), x, 0.42, z, bench, 0.02)));
  const lampM = emissive('#FFE3B0', 3); cyl(0.06, 0.08, 0.03, mat({ color: '#20242d', metalness: 0.7 }), -1.6, 0.95, -0.1, bench); cyl(0.012, 0.012, 0.4, mat({ color: '#20242d', metalness: 0.7 }), -1.6, 1.16, -0.1, bench); ball(0.05, lampM, -1.52, 1.4, -0.1, bench);
  [['#C9503A', -0.4], ['#2F6DB5', 0.05], ['#E8B23A', 0.5]].forEach(([c, x], i) => rbox(0.22 + i * 0.03, 0.14, 0.2, mat({ color: c, roughness: 0.5 }), x, 1.0, 0.0, bench, 0.03)); cyl(0.05, 0.045, 0.1, mat({ color: '#E9D9B8', roughness: 0.3 }), 1.4, 0.98, 0.1, bench); rbox(0.4, 0.3, 0.3, mat({ color: '#3a4350', metalness: 0.4, roughness: 0.4 }), 2.0, 1.08, 0, bench, 0.03);
  const crates = new THREE.Group(); crates.position.set(3.7, 0, -2.5); scene.add(crates); [[0, 0, 0], [0.62, 0, 0.05], [0.28, 0.58, 0.02]].forEach(([x, y, z], i) => rbox(0.6, 0.55, 0.6, mat({ color: ['#B98255', '#A87445', '#C98F5B'][i], roughness: 0.7 }), x, 0.28 + y, z, crates, 0.03));
  const sh = new THREE.Group(); sh.position.set(-3.8, 0, -3.1); scene.add(sh); rbox(0.05, 2.2, 0.4, mat({ color: '#6B4A32' }), -0.7, 1.1, 0, sh, 0.01); rbox(0.05, 2.2, 0.4, mat({ color: '#6B4A32' }), 0.7, 1.1, 0, sh, 0.01); for (let r = 0; r < 4; r++) { rbox(1.45, 0.04, 0.4, mat({ color: '#8A5E3C' }), 0, 0.2 + r * 0.6, 0, sh, 0.01); for (let k = 0; k < 4; k++) { const c = ['#C9503A', '#2F6DB5', '#E8B23A', '#3F8F6B'][(r + k) % 4]; if ((r + k) % 2) cyl(0.09, 0.09, 0.22, mat({ color: c, roughness: 0.2, metalness: 0.1 }), -0.5 + k * 0.33, 0.33 + r * 0.6, 0, sh); else rbox(0.24, 0.22, 0.24, mat({ color: c, roughness: 0.6 }), -0.5 + k * 0.33, 0.33 + r * 0.6, 0, sh, 0.02); } }
  const bulbs = []; [[-1.8, 2.7], [0.4, 3.0], [2.4, 2.7]].forEach(([x, y], i) => { cyl(0.006, 0.006, 4 - y + 3, mat({ color: '#20242d' }), x, y + (7 - y) / 2 - 0.2, -1.4, scene, 6); cyl(0.07, 0.05, 0.1, mat({ color: '#20242d', metalness: 0.6 }), x, y + 0.08, -1.4, scene); ball(0.09, emissive('#FFD9A0', 3.2), x, y - 0.03, -1.4, scene); const pl = new THREE.PointLight('#FFC27A', 2.2, 7, 1.6); pl.position.set(x, y - 0.1, -1.2); scene.add(pl); bulbs.push(pl); });
  const rug = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.02, 48), mat({ color: shade(wall, 1.15), roughness: 1 }))); rug.position.set(0, 0.011, 0.3); scene.add(rug); const ring = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.56, 64), new THREE.MeshBasicMaterial({ color: accent, toneMapped: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.025, 0.3); scene.add(ring);
  const rig = lightRig(scene, { key: '#FFE2C2', keyI: 2.0, keyPos: [-3, 4.4, 4.5], rimCol: '#7FD0E0', rimI: 2.2, sky: '#A8C8D0', ground: '#5C4636', hemiI: 0.5, shadowBox: 4.5, target: [0, 0.8, 0] }); rig.key.shadow.camera.far = 24; rig.key.shadow.camera.updateProjectionMatrix();
  return { scene, look: { bloom: 0.4, bloomThreshold: 0.82, vignette: 0.3, grain: 0.02, warm: 0.02, exposure: 1.05 }, subjects: { bench: { pos: [0.4, 0.9, -2.8], height: 0.8, rotY: 0 }, pegboard: { pos: [0.4, 2.35, -3.3], height: 2.8, rotY: 0 } }, update(t) { bulbs.forEach((b, i) => { b.intensity = 2.2 + Math.sin(t * 5 + i * 2) * 0.05; }); } };
}

// ═══════════════════════════ NOIR ROOM (one light, faceless figures, evidence) ═══════════════════════════
function boardTex() {
  return canvasTex('noirboard', 1024, 640, (g, w, h) => {
    g.fillStyle = '#3a2f26'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${20 + rnd(i) * 30},${14 + rnd(i + 1) * 20},10,0.35)`; g.fillRect(rnd(i * 3) * w, rnd(i * 7) * h, 3, 3); }
    const photos = [[110, 90, 190, 150, -3], [380, 60, 170, 210, 2], [640, 100, 200, 150, -2], [850, 70, 150, 190, 4], [210, 340, 200, 160, 2], [520, 330, 170, 220, -4], [790, 380, 190, 150, 3]];
    g.strokeStyle = '#B3262B'; g.lineWidth = 3; g.beginPath(); photos.forEach(([x, y, pw, ph], i) => { const cx = x + pw / 2, cy = y + 6; i ? g.lineTo(cx, cy) : g.moveTo(cx, cy); }); g.stroke();
    photos.forEach(([x, y, pw, ph, r], i) => { g.save(); g.translate(x + pw / 2, y + ph / 2); g.rotate((r * Math.PI) / 180); g.fillStyle = '#E9E2D2'; g.fillRect(-pw / 2, -ph / 2, pw, ph); g.fillStyle = ['#2a3038', '#3a2f2a', '#242a30', '#33302a'][i % 4]; g.fillRect(-pw / 2 + 8, -ph / 2 + 8, pw - 16, ph - 40); g.fillStyle = '#B3262B'; g.beginPath(); g.arc(0, -ph / 2 + 6, 6, 0, 7); g.fill(); g.restore(); });
  });
}
export function noirRoom(E, o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#040508'); scene.environment = E.envMap; scene.environmentIntensity = 0.05; scene.fog = new THREE.FogExp2('#030408', 0.085);
  const floor = shadow(new THREE.Mesh(new THREE.PlaneGeometry(16, 22), mat({ color: '#0d0e13', roughness: 0.28, metalness: 0.15 }))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 3); scene.add(floor);
  const back = shadow(new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat({ color: '#0a0c11', roughness: 0.95 }))); back.position.set(0, 5.5, -3.4); scene.add(back);
  for (const sx of [-1, 1]) { const w = shadow(new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat({ color: '#080a0e', roughness: 0.95 }))); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 4.6, 5.5, 4); scene.add(w); }
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.25), new THREE.MeshStandardMaterial({ map: boardTex(), roughness: 0.9 })); bd.position.set(-1.2, 2.2, -3.36); scene.add(bd); rbox(3.75, 0.08, 0.06, mat({ color: '#2a2018' }), -1.2, 3.36, -3.34, scene); rbox(3.75, 0.08, 0.06, mat({ color: '#2a2018' }), -1.2, 1.04, -3.34, scene);
  const desk = new THREE.Group(); desk.position.set(1.5, 0, -2.3); scene.add(desk); rbox(2.0, 0.08, 0.9, mat({ color: '#2c2118', roughness: 0.5 }), 0, 0.78, 0, desk, 0.02); [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]].forEach(([x, z]) => rbox(0.07, 0.76, 0.07, mat({ color: '#1c1510' }), x, 0.38, z, desk)); rbox(0.5, 0.2, 0.4, mat({ color: '#15181e', metalness: 0.5, roughness: 0.4 }), -0.5, 0.92, 0.0, desk, 0.02); rbox(0.42, 0.03, 0.3, mat({ color: '#d8cfba' }), 0.35, 0.83, 0.12, desk, 0.005).rotation.y = 0.25;
  const lampPost = new THREE.Group(); lampPost.position.set(2.2, 0, -2.1); scene.add(lampPost); cyl(0.008, 0.008, 0.62, mat({ color: '#111', metalness: 0.7 }), 0, 1.1, 0, lampPost); ball(0.04, emissive('#FFE0A0', 4), 0, 1.45, 0, lampPost);
  // the one light: a warm spot from above with a visible beam and dust in it
  const spot = new THREE.SpotLight('#FFD9A0', 26, 12, 0.55, 0.6, 1.4); spot.position.set(0.4, 5.0, 2.4); spot.target.position.set(0, 0.3, 0.3); spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0004; spot.shadow.radius = 6; scene.add(spot, spot.target);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.7, 5.3, 36, 1, true), new THREE.MeshBasicMaterial({ color: '#FFD9A0', transparent: true, opacity: 0.022, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.position.set(0.2, 2.65, 1.35); beam.rotation.set(0.2, 0, 0.07); scene.add(beam);
  const dust = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color: '#FFE8C0', toneMapped: false, transparent: true, opacity: 0.55 })); scene.add(m); dust.push(m); }
  const rim = new THREE.DirectionalLight('#C8302F', 2.2); rim.position.set(-3, 2.5, -3); scene.add(rim); scene.add(new THREE.HemisphereLight('#27324a', '#0a0a10', 0.4));
  return { scene, look: { bloom: 0.5, bloomThreshold: 0.75, vignette: 0.55, grain: 0.05, warm: 0.0, exposure: 1.1 }, subjects: { board: { pos: [-1.2, 2.2, -3.3], height: 2.2, rotY: 0 }, desk: { pos: [1.5, 0.8, -2.3], height: 0.8, rotY: 0 } },
    update(t) { dust.forEach((m, i) => { m.position.set(-0.8 + rnd(i) * 2.2 + Math.sin(t * 0.3 + i) * 0.15, 0.4 + ((rnd(i + 5) * 4.2 + t * (0.03 + rnd(i) * 0.04)) % 4.2), 0.2 + rnd(i + 9) * 2.2 + Math.cos(t * 0.25 + i) * 0.15); }); } };
}


/** "Neon stage": a dark glossy stage under coloured spotlights in front of a bokeh city at night. The characters stand at the front, big set pieces (neonprops.js) float behind them. */
export function neonStage(E, o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0b0716'); scene.environment = E.envMap; scene.environmentIntensity = 0.2; scene.fog = new THREE.FogExp2('#150b2a', 0.03);
  const warm = o.accent || '#FF9A4D', violet = o.violet || '#8a63ff', pink = o.pink || '#FF5CA8';
  const floor = shadow(new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshPhysicalMaterial({ color: '#0f0a20', roughness: 0.16, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.84, depthWrite: false }))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -8); floor.renderOrder = -2; scene.add(floor);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 72), new THREE.MeshStandardMaterial({ color: '#2a1d52', roughness: 0.35, metalness: 0.2, transparent: true, opacity: 0.55, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.set(0, 0.006, 0.1); disc.receiveShadow = true; disc.renderOrder = -1; scene.add(disc);
  const grid = new THREE.GridHelper(60, 60, violet, violet); grid.position.set(0, 0.004, -8); grid.material.transparent = true; grid.material.opacity = 0.3; grid.material.toneMapped = false; scene.add(grid);
  // the city: dark towers with thousands of lit windows. The depth of field turns them into bokeh.
  const sky = document.createElement('canvas'); sky.width = 1536; sky.height = 640; const c = sky.getContext('2d'); const g0 = c.createLinearGradient(0, 0, 0, 640); g0.addColorStop(0, '#1b1038'); g0.addColorStop(1, '#3a1a4a'); c.fillStyle = g0; c.fillRect(0, 0, 1536, 640);
  for (let i = 0, x = -20; x < 1560; i++) { const w = 60 + rnd(i) * 120, h = 160 + rnd(i + 7) * 380; c.fillStyle = ['#150d2c', '#1a1033', '#120b26'][i % 3]; c.fillRect(x, 640 - h, w, h);
    for (let wy = 640 - h + 14; wy < 626; wy += 22) for (let wx = x + 8; wx < x + w - 10; wx += 16) { const r = rnd(wx * 0.37 + wy * 1.7 + i); if (r > 0.62) { c.fillStyle = r > 0.93 ? pink : r > 0.8 ? '#FFD27A' : r > 0.7 ? warm : violet; c.globalAlpha = 0.55 + rnd(wx + wy) * 0.45; c.fillRect(wx, wy, 8, 11); } } c.globalAlpha = 1; x += w + 6; }
  const st = new THREE.CanvasTexture(sky); st.colorSpace = THREE.SRGBColorSpace; const city = new THREE.Mesh(new THREE.PlaneGeometry(52, 21.7), new THREE.MeshBasicMaterial({ map: st, toneMapped: false, fog: false })); city.position.set(0, 9.5, -19); scene.add(city);
  // spotlight cones (visible light beams)
  const cones = []; [[-3.2, violet, 0.5], [3.4, warm, -0.45], [0.2, pink, 0.1]].forEach(([x, col, rz], i) => { const m = new THREE.Mesh(new THREE.ConeGeometry(2.4, 11, 40, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false })); m.position.set(x, 5.2, -4.5 - i); m.rotation.z = rz; scene.add(m); cones.push(m); });
  const stageRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.2, 80), new THREE.MeshBasicMaterial({ color: warm, toneMapped: false, side: THREE.DoubleSide })); stageRing.rotation.x = -Math.PI / 2; stageRing.position.set(0, 0.012, 0.1); scene.add(stageRing);
  const dust = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), new THREE.MeshBasicMaterial({ color: i % 3 ? '#FFE0B0' : '#cdb9ff', toneMapped: false, transparent: true, opacity: 0.6 })); scene.add(m); dust.push(m); }
  const rig = lightRig(scene, { key: '#FFC48F', keyI: 3.1, keyPos: [-3, 4.6, 5], rimCol: violet, rimI: 3.2, sky: '#6a4bb0', ground: '#1a0f33', hemiI: 0.55, shadowBox: 5, target: [0, 0.8, 0] }); rig.key.shadow.camera.far = 24; rig.key.shadow.camera.updateProjectionMatrix();
  const pl = new THREE.PointLight(pink, 2.6, 12, 2); pl.position.set(2.5, 2.2, 2); scene.add(pl);
  const sp = new THREE.SpotLight('#FFD2A0', 70, 16, 0.62, 0.9, 1.6); sp.position.set(-3.2, 5.2, 4.2); sp.target.position.set(0, 0.4, 0.2); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -0.0003; sp.shadow.radius = 9; scene.add(sp, sp.target);   // a visible, soft shadow of each cubie on the stage
  return { scene, reflect: true, look: { bloom: 0.7, bloomThreshold: 0.68, vignette: 0.42, grain: 0.03, warm: 0, exposure: 1.05 }, subjects: { stage: { pos: [0, 0, 0.3], height: 1.4, rotY: 0 }, city: { pos: [0, 9, -19], height: 18, rotY: 0 } },
    update(t) { cones.forEach((m, i) => { m.material.opacity = 0.06 + Math.sin(t * 0.8 + i * 2) * 0.02; m.rotation.z += Math.sin(t * 0.3 + i) * 0.0006; }); stageRing.scale.setScalar(1 + Math.sin(t * 2) * 0.01);
      dust.forEach((m, i) => { m.position.set(-4 + rnd(i) * 8 + Math.sin(t * 0.3 + i) * 0.2, 0.3 + ((rnd(i + 3) * 6 + t * (0.05 + rnd(i) * 0.08)) % 6), -3 + rnd(i + 9) * 6); }); } };
}

import { countryField } from './worlds_country.js';
export const WORLDS = { 'country-field': countryField, 'neon-stage': neonStage, 'noir-room': noirRoom, workshop, 'home-studio': homeStudio, 'block-yard': blockYard, 'voxel-valley': voxelValley };
export function buildWorld(name, E, opts) { const b = WORLDS[name]; if (!b) throw new Error(`unknown world "${name}". Known: ${Object.keys(WORLDS).join(', ')}`); return b(E, opts || {}); }
