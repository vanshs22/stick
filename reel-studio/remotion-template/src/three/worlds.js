// Worlds (environments). Each builder returns { scene, update(t), subjects, look } built around the origin:
// people stand on y = 0 facing +z (toward a camera on the +z side), the room is open on the camera side.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { lightRig } from './engine.js';
import { T, mat, canvasTex, sky, clouds, sunlight, tree } from './world.js';

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
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 16 + i * 32, y = 16 + j * 32, gr = g.createRadialGradient(x - 3, y - 3, 1, x, y, 11); gr.addColorStop(0, shade(base, 1.22)); gr.addColorStop(1, shade(base, 0.86)); g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x + 1.5, y + 2, 10.5, 0, 7); g.fill(); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 9.5, 0, 7); g.fill(); }
  }, rep);
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
export function blockYard(E, o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#9FD0F5'); scene.environment = E.envMap; scene.environmentIntensity = 0.5;
  sky(scene, { top: '#3D86E0', horizon: '#CDE9FB', ground: '#8CCB6A' });
  const plate = shadow(new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: studTex('#63BC4B', 90), roughness: 0.55 }))); plate.rotation.x = -Math.PI / 2; plate.position.set(0, 0, -20); scene.add(plate);
  const house = blockHouse(o.house); house.position.set(1.2, 0, -3.6); scene.add(house);
  const h2 = blockHouse({ wall: '#BFD9EE', roof: '#3C6FB6' }); h2.position.set(-6.8, 0, -7.5); h2.rotation.y = 0.4; scene.add(h2);
  [[-3.8, -3.0, 1.1], [4.9, -3.4, 1.4], [-2.4, -9.5, 1.5], [7.5, -9, 1.2], [-9.5, -3, 1.3], [10.5, -5, 1.6]].forEach(([x, z, sc], i) => { const t = blockTree(sc, i % 2 ? '#4FA84A' : '#5DBB52'); t.position.set(x, 0, z); t.rotation.y = i; scene.add(t); });
  // path of bricks from the door to the camera, flowers, bushes
  for (let i = 0; i < 9; i++) rbox(0.9, 0.07, 0.5, mat({ color: i % 2 ? '#C9C3B6' : '#B6B0A4', roughness: 0.85 }), 1.2 + Math.sin(i * 0.9) * 0.08, 0.035, -1.2 + i * 0.62, scene, 0.03);
  [[-1.6, -0.5], [3.7, -0.2], [-0.2, -2.4], [3.2, -2.5]].forEach(([x, z], i) => rbox(0.7, 0.5, 0.7, mat({ color: '#3F9A47', roughness: 0.8 }), x, 0.25, z, scene, 0.18));
  for (let i = 0; i < 26; i++) { const x = -5.6 + i * 0.44; if (x > 0.35 && x < 2.1) continue; rbox(0.09, 0.62, 0.05, mat({ color: '#FFFFFF', roughness: 0.5 }), x, 0.31, -1.55, scene, 0.015); }
  [[-2.65, 5.7], [3.5, 3.0]].forEach(([cx, w]) => { rbox(w, 0.06, 0.04, mat({ color: '#FFFFFF' }), cx, 0.5, -1.55, scene, 0.01); rbox(w, 0.06, 0.04, mat({ color: '#FFFFFF' }), cx, 0.2, -1.55, scene, 0.01); });
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

export const WORLDS = { 'home-studio': homeStudio, 'block-yard': blockYard };
export function buildWorld(name, E, opts) { const b = WORLDS[name]; if (!b) throw new Error(`unknown world "${name}". Known: ${Object.keys(WORLDS).join(', ')}`); return b(E, opts || {}); }
