// City street world (style 2 in a town): asphalt road with lane paint and a crosswalk, sidewalks with curbs, two rows of varied buildings (window grids, shopfronts, awnings,
// rooftop kit), street lamps, traffic lights, trees in planters, parked and driving cars, a billboard. time: 'day' | 'golden' | 'dusk' | 'night'. Pure function of time.
import * as THREE from 'three';
import { sky, clouds, sunlight, mat, canvasTex } from './world.js';
import { leafTree } from './worlds_country.js';
import { buildCar } from './props_city.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SKY = { day: ['#3C86DE', '#CFE4F4', '#CFE4F4'], golden: ['#2D63BE', '#F2D2A4', '#E6BC8A'], dusk: ['#3B3590', '#FF9E78', '#E48A68'], night: ['#050A1E', '#1B2A52', '#0B1230'] };
const SUN = { day: { col: '#FFF0D6', i: 3.2, pos: [13, 9, -5], hemi: 1.0, sky: '#CFE6FF', ground: '#9A8C78' }, golden: { col: '#FFC27A', i: 3.8, pos: [16, 6, -7], hemi: 0.7, sky: '#B8D2F2', ground: '#B08A5A' }, dusk: { col: '#FFA878', i: 2.5, pos: [-14, 5, -16], hemi: 0.8, sky: '#B9A0DC', ground: '#5A4A4A' }, night: { col: '#8FA8FF', i: 0.8, pos: [-8, 12, 6], hemi: 0.45, sky: '#2A3A7A', ground: '#10162A' } };
const WALLS = ['#B96B4C', '#C9B79A', '#8F9AA6', '#D8C9A8', '#A5584A', '#7C8C86', '#CFC3B0', '#9B7B63'];
const NAMES = ['CAFE', 'PIZZA', 'BAKERY', 'PHARMACY', 'BOOKS', 'DINER', 'MARKET', 'BARBER', 'HARDWARE', 'LAUNDRY'];
const sh = (m) => { m.castShadow = m.receiveShadow = true; return m; };

const asphalt = (time) => canvasTex('asph' + time, 512, 512, (g, w, h) => { g.fillStyle = time === 'night' ? '#1E2128' : '#6B6862'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5200; i++) { const v = 60 + rnd(i) * 55; g.fillStyle = `rgba(${v},${v},${v + 4},${0.08 + rnd(i * 3) * 0.12})`; g.fillRect(rnd(i * 7) * w, rnd(i * 11) * h, 1 + rnd(i * 5) * 3, 1 + rnd(i * 9) * 3); } g.strokeStyle = 'rgba(15,15,20,0.5)'; g.lineWidth = 1.6; for (let i = 0; i < 5; i++) { g.beginPath(); let x = rnd(i) * w, y = 0; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (rnd(i * 9 + k) - 0.5) * 40; y += h / 8; g.lineTo(x, y); } g.stroke(); } }, [1, 1]);
const walk = () => canvasTex('walk', 256, 256, (g, w, h) => { g.fillStyle = '#B7B3AA'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8E8B84'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(0,0,0,${rnd(i) * 0.06})`; g.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 2, 2); } }, [1, 1]);
/** a 2 x 2 window module: wall, frames, glass with sky gradient, some lit / curtained; mask texture for night emission */
function facade(wall, seed, night) {
  const draw = (emit) => (g, w, h) => { g.fillStyle = emit ? '#000' : wall; g.fillRect(0, 0, w, h);
    if (!emit) { for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${rnd(i + seed) * 0.05})`; g.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 3, 3); } g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, h - 10, w, 5); }
    for (let cx = 0; cx < 2; cx++) for (let cy = 0; cy < 2; cy++) { const x = cx * 128 + 22, y = cy * 128 + 18, ww = 84, hh = 92, lit = rnd(seed * 7 + cx * 3 + cy) > 0.55;
      if (emit) { if (night && lit) { g.fillStyle = rnd(seed + cx + cy) > 0.5 ? '#FFD89A' : '#FFF2CC'; g.fillRect(x, y, ww, hh); } continue; }
      g.fillStyle = '#2B2F36'; g.fillRect(x - 6, y - 6, ww + 12, hh + 12); const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, night ? '#10182B' : '#7FB0DC'); gr.addColorStop(1, night ? '#0A0F1E' : '#3E6C98'); g.fillStyle = gr; g.fillRect(x, y, ww, hh);
      if (night && lit) { g.fillStyle = '#E8C070'; g.fillRect(x, y, ww, hh); }
      g.fillStyle = '#E8E6E0'; g.fillRect(x + ww / 2 - 2, y, 4, hh); g.fillRect(x, y + hh * 0.45, ww, 4); if (!night && rnd(seed + cx * 5 + cy * 2) > 0.6) { g.fillStyle = 'rgba(240,230,210,0.85)'; g.fillRect(x, y, ww * 0.4, hh); }
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 8, y + hh + 6, ww + 16, 6); } };
  return [canvasTex(`fac${wall}${seed}${night}`, 256, 256, draw(false), [1, 1]), canvasTex(`facE${wall}${seed}${night}`, 256, 256, draw(true), [1, 1])];
}
const shopTex = (name, seed, night) => canvasTex(`shop${name}${seed}${night}`, 512, 256, (g, w, h) => { const hue = Math.floor(rnd(seed) * 360); g.fillStyle = '#2A2C32'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 40, 0, h); gr.addColorStop(0, night ? '#E8C27A' : '#8DB8D8'); gr.addColorStop(1, night ? '#B8863A' : '#41627F'); g.fillStyle = gr; g.fillRect(24, 56, w - 48, h - 70);
  for (let i = 0; i < 6; i++) { g.fillStyle = `hsla(${hue},40%,${night ? 40 : 30}%,0.5)`; g.fillRect(40 + i * 78, 110, 60, 100); } g.fillStyle = `hsl(${hue},55%,${night ? 46 : 40}%)`; g.fillRect(0, 0, w, 52); g.fillStyle = '#fff'; g.font = '800 36px Arial'; g.textAlign = 'center'; g.fillText(name, w / 2, 40);
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#F2F0EA' : `hsl(${hue},70%,45%)`; g.fillRect(i * (w / 12), 52, w / 12, 16); } }, [1, 1]);

export function cityStreet(E, o = {}) {
  const time = o.time || 'day', night = time === 'night', scene = new THREE.Scene(), [top, hor, gnd] = SKY[time] || SKY.day, S = SUN[time] || SUN.day, U = { t: 0 };
  sky(scene, { top, horizon: hor, ground: gnd }); scene.fog = new THREE.FogExp2(hor, { day: 0.0085, golden: 0.0095, dusk: 0.011, night: 0.014 }[time] ?? 0.0085);
  const sun = sunlight(scene, E, { col: S.col, i: S.i, pos: S.pos, sky: S.sky, ground: S.ground, hemi: S.hemi, env: night ? 0.35 : 0.55, box: 60, far: 240, target: [0, 0, -30], dome: [top, hor, gnd] });
  const cl = clouds(scene, [[-70, 40, -170, 24], [30, 50, -190, 30], [100, 34, -160, 20], [-20, 30, -130, 14]], night ? '#33406E' : time === 'dusk' ? '#FFB8A0' : '#FFFFFF');
  const RW = o.roadW ?? 9, SW = 3.2, LEN = 320;
  const road = sh(new THREE.Mesh(new THREE.PlaneGeometry(RW, LEN), mat({ map: asphalt(time), roughness: night ? 0.45 : 0.9 }))); road.material.map.repeat.set(1, LEN / 9); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -90); road.receiveShadow = true; scene.add(road);
  const paint = mat({ color: '#F2F0E6', roughness: 0.7 }), yel = mat({ color: '#E8B923', roughness: 0.7 }), stripe = (w, l, m, x, z) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, l), m); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.02, z); s.receiveShadow = true; scene.add(s); };
  for (let z = 30; z > -250; z -= 6) stripe(0.14, 3, paint, 0, z); stripe(0.14, LEN, yel, -0.22, -90); stripe(0.14, LEN, yel, 0.22, -90); stripe(0.16, LEN, paint, -RW / 2 + 0.35, -90); stripe(0.16, LEN, paint, RW / 2 - 0.35, -90);
  for (let i = -5; i <= 5; i++) stripe(0.55, 3.6, paint, i * 0.8, -8);
  [-1, 1].forEach((s) => { const sw = sh(new THREE.Mesh(new THREE.BoxGeometry(SW, 0.16, LEN), mat({ map: walk(), roughness: 0.95 }))); sw.material.map.repeat.set(SW / 2, LEN / 2); sw.position.set(s * (RW / 2 + SW / 2), 0.08, -90); scene.add(sw); const cb = sh(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, LEN), mat({ color: '#9A978F', roughness: 0.9 }))); cb.position.set(s * (RW / 2 + 0.1), 0.1, -90); scene.add(cb); });
  // buildings: two rows, varied size, facade modules, shopfront strip, awning, rooftop kit
  const bd = new THREE.Group(); scene.add(bd); let boxes = [];
  [-1, 1].forEach((side, si) => { let z = 18; for (let i = 0; z > -230; i++) { const seed = si * 100 + i, w = 5.5 + rnd(seed) * 4, d = 9 + rnd(seed * 3) * 6, h = 9 + rnd(seed * 5) * 22, wall = WALLS[Math.floor(rnd(seed * 7) * WALLS.length)], x = side * (RW / 2 + SW + d / 2 + 0.1), [fm, fe] = facade(wall, seed, night);
      const mk = (tm, te) => { const m = mat({ map: tm, roughness: 0.85 }); if (night) { m.emissiveMap = te; m.emissive = new THREE.Color('#fff'); m.emissiveIntensity = 1.4; } return m; };
      const t1 = fm.clone(), t2 = fm.clone(), e1 = fe.clone(), e2 = fe.clone(); [t1, t2, e1, e2].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }); t1.repeat.set(w / 3.4, h / 3.4); e1.repeat.copy(t1.repeat); t2.repeat.set(d / 3.4, h / 3.4); e2.repeat.copy(t2.repeat);
      const front = mk(t1, e1), sideM = mk(t2, e2), roofM = mat({ color: '#4A4A50', roughness: 1 }), b = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), [sideM, sideM, roofM, roofM, front, front]); // +x,-x faces use side module
      b.position.set(x, h / 2, z - w / 2); sh(b); bd.add(b); boxes.push({ x, z: z - w / 2, w, d, h, side });
      const st = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, 3.1), new THREE.MeshStandardMaterial({ map: shopTex(NAMES[Math.floor(rnd(seed * 11) * NAMES.length)], seed, night), roughness: 0.4, emissive: night ? '#fff' : '#000', emissiveMap: night ? shopTex(NAMES[Math.floor(rnd(seed * 11) * NAMES.length)], seed, night) : null, emissiveIntensity: 0.9 })); st.rotation.y = -side * Math.PI / 2; st.position.set(x - side * (d / 2 + 0.03), 1.6, z - w / 2); scene.add(st);
      const roofKit = Math.floor(rnd(seed * 13) * 3); if (roofKit === 0) { const tk = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 14), mat({ color: '#6A4A38' }))); tk.position.set(x, h + 1.2, z - w / 2); bd.add(tk); } else if (roofKit === 1) { const ac = sh(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 1.4), mat({ color: '#B8BCC2', metalness: 0.5 }))); ac.position.set(x, h + 0.5, z - w / 2); bd.add(ac); }
      z -= w + 0.15 + rnd(seed * 17) * 0.4; } });
  // lamps, traffic lights, trees, signs on the sidewalks
  const lampM = mat({ color: '#3B3F46', metalness: 0.6, roughness: 0.5 }), glow = new THREE.MeshStandardMaterial({ color: night ? '#FFE6B0' : '#EEE8D8', emissive: night ? '#FFD890' : '#000', emissiveIntensity: night ? 4 : 0, toneMapped: false }); let lights = 0;
  for (let z = -6; z > -160; z -= 14) [-1, 1].forEach((s) => { const px = s * (RW / 2 + 0.7), p = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.4, 10), lampM)); p.position.set(px, 2.7, z); scene.add(p); const arm = sh(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.07), lampM)); arm.position.set(px - s * 0.7, 5.4, z); scene.add(arm); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.25), glow); hd.position.set(px - s * 1.3, 5.34, z); scene.add(hd); if (night && lights < 4 && Math.abs(z) < 40) { const pl = new THREE.PointLight('#FFD890', 22, 18, 1.8); pl.position.set(px - s * 1.3, 5.1, z); scene.add(pl); lights++; } });
  for (let z = -2; z > -150; z -= 16) [-1, 1].forEach((s, k) => { if ((Math.floor(z / 16) + k) % 2) return; const t = leafTree(time, 1.5 + rnd(z * 3) * 0.6, Math.abs(z) * 7, 0.5); t.position.set(s * (RW / 2 + 1.6), 0.16, z - 7); scene.add(t); });
  const tl = new THREE.Group(), tp = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 10), lampM)); tp.position.y = 2.5; tl.add(tp); const ar = sh(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, RW * 0.7), lampM)); ar.position.set(0, 5, -RW * 0.35); tl.add(ar);
  [['#2ECC71', 0.4], ['#E74C3C', 0.4]].forEach(([c, i], k) => { const L = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k ? 0.2 : 3, toneMapped: false })); L.position.set(0, 4.8 - k * 0.0, -RW * 0.6 + k * 0.4); tl.add(L); }); tl.position.set(RW / 2 + 0.6, 0, -14); scene.add(tl);
  // cars: parked along both kerbs, three driving
  const cars = []; const cols = ['#2E6FB5', '#C0392B', '#E8E4DA', '#2F2F34', '#E0A100', '#3E8E5E', '#8E44AD', '#9AA0A8']; const kinds = ['hatch', 'hatch', 'pickup', 'hatch', 'bus'];
  for (let i = 0; i < 16; i++) { const s = i % 2 ? 1 : -1, c = buildCar(kinds[Math.floor(rnd(i * 5) * kinds.length)], cols[Math.floor(rnd(i * 3) * cols.length)]); c.position.set(s * (RW / 2 - 1.0), 0, -6 - i * 10.5 - rnd(i) * 3); c.rotation.y = s > 0 ? Math.PI : 0; scene.add(c); }
  [[0, -2.2, 6, 'hatch', '#E8E4DA'], [1, 2.2, -12, 'pickup', '#C0392B'], [2, -2.2, -40, 'bus', '#E0A100']].forEach(([i, x, z0, kd, col]) => { const c = buildCar(kd, col); c.position.set(x, 0, z0); scene.add(c); cars.push({ c, x, z0, dir: x < 0 ? 1 : -1, sp: 5 + i * 1.5 }); c.rotation.y = x < 0 ? Math.PI : 0; });
  // billboard
  const bb = new THREE.Group(), bt = canvasTex('bb' + time, 512, 256, (g, w, h) => { g.fillStyle = night ? '#101830' : '#FFD23A'; g.fillRect(0, 0, w, h); g.fillStyle = night ? '#FF5A8A' : '#C0252B'; g.font = '900 78px Arial'; g.textAlign = 'center'; g.fillText('BIG SALE', w / 2, 120); g.font = '700 40px Arial'; g.fillStyle = night ? '#9FD0FF' : '#222'; g.fillText('EVERYTHING MUST GO', w / 2, 190); }, [1, 1]); const bp = sh(new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 0.3), new THREE.MeshStandardMaterial({ map: bt, emissiveMap: bt, emissive: '#fff', emissiveIntensity: night ? 1.6 : 0.15 }))); bp.position.y = 2.25; bb.add(bp); bb.position.set(-(RW / 2 + SW + 8), 34, -60); bb.rotation.y = Math.PI / 2 - 0.35; bb.visible = boxes.some((b) => b.h > 28); scene.add(bb);
  const look = { bloom: night ? 0.9 : 0.2, bloomThreshold: night ? 0.7 : 0.92, vignette: 0.3, grain: 0.016, warm: time === 'golden' || time === 'dusk' ? 0.05 : 0.02, exposure: night ? 1.0 : 1.0, saturation: 1.06, contrast: 1.08, aperture: 0.0015, maxblur: 0.005, split: night ? 0.6 : 0.55, curve: 0.4 };
  return { scene, sun, reflect: false, look, subjects: { street: { pos: [0, 0, -10], height: 2, rotY: 0 }, skyline: { pos: [0, 12, -60], height: 30, rotY: 0 }, crosswalk: { pos: [0, 0, -8], height: 2, rotY: 0 }, horizon: { pos: [0, 4, -120], height: 20, rotY: 0 } },
    update(t) { cl.forEach((c, i) => { c.position.x += Math.sin(t * 0.05 + i) * 0.002; }); cars.forEach((k) => { const z = ((k.z0 - k.dir * -1 * 0) + (-k.dir) * k.sp * t); k.c.position.z = ((((k.z0 - k.dir * k.sp * t) + 60) % 160) + 160) % 160 - 100 + 40; }); } };
}
