// Background pedestrians for the city world: small toon walkers (4-frame walk cycle drawn once per outfit), one lane per direction, spacing >= 6 m, so they never collide with each other or with a hero standing mid-sidewalk.
import * as THREE from 'three';
import { Pen, romanFront, OUTFITS } from './toon_cast.js';
Object.assign(OUTFITS, {
  ped1: { noSkirt: true, noBelt: true, tunic: '#4f7fb8', skin: '#f5c9a0', hair: '#5a3b2a', pants: '#3b3f52' },
  ped2: { noSkirt: true, noBelt: true, tunic: '#c25a7a', skin: '#fdebd5', hair: '#1e1714', pants: '#6b4a8a' },
  ped3: { noSkirt: true, noBelt: true, tunic: '#5d8a3a', skin: '#c99067', hair: '#1e1714', pants: '#3a3a42' },
  ped4: { noSkirt: true, noBelt: true, tunic: '#d9a441', skin: '#ecd0b6', cap: '#5b4a8a', pants: '#2f3a4f' },
  ped5: { noSkirt: true, noBelt: true, tunic: '#e8e4da', skin: '#fdebd5', hair: '#8a5a3a', pants: '#4a3a2f' },
  ped6: { noSkirt: true, noBelt: true, tunic: '#2f6f6a', skin: '#f5c9a0', cap: '#c8372d', pants: '#3b4150' },
});
const cache = {};
function frames(key) {
  if (cache[key]) return cache[key];
  const out = [0, 1, 2, 3].map((i) => { const c = document.createElement('canvas'); c.width = 240; c.height = 400; const g = c.getContext('2d'); g.scale(0.4, 0.4); romanFront(new Pen(g), key, { expr: 'calm', step: i / 4, L: 'hang', R: 'hang', seed: 3 + (key.length % 4) }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; });
  return (cache[key] = out);
}
export function makeWalkers(scene, RW, SW, night, only) {
  const keys = ['ped1', 'ped2', 'ped3', 'ped4', 'ped5', 'ped6'], lanes = [{ x: -(RW / 2 + SW - 0.6), dir: -1 }, { x: RW / 2 + 0.7, dir: 1 }, { x: RW / 2 + SW - 0.6, dir: -1 }], walkers = [], LOOP = 90, VH = 1.78, CH = VH / 0.89, CW = CH * 0.6;
  const geo = new THREE.PlaneGeometry(CW, CH); geo.translate(0, CH / 2 - (1 - 0.975) * CH, 0);
  const cc = document.createElement('canvas'); cc.width = cc.height = 64; { const x = cc.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(5,10,20,0.8)'); gr.addColorStop(1, 'rgba(5,10,20,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
  const blobTex = new THREE.CanvasTexture(cc);
  lanes.forEach((ln, li) => { if (Array.isArray(only) && !only.includes(li)) return; for (let k = 0; k < 3; k++) { const key = keys[(li * 2 + k) % keys.length], tx = frames(key), m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tx[0], transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1, emissive: '#ffffff', emissiveMap: tx[0], emissiveIntensity: night ? 0.25 : 0.3 })); m.receiveShadow = true; m.castShadow = false;
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.17; scene.add(m, blob); walkers.push({ m, blob, tx, ln, z0: 25 - (k * 30 + li * 9), sp: 1.15 + 0.1 * k }); } });
  const place = (t) => walkers.forEach((w) => { const d = ((w.z0 + w.ln.dir * w.sp * t) % LOOP + LOOP) % LOOP; const z = 25 - d; w.m.position.set(w.ln.x, 0.16 + Math.abs(Math.sin(t * w.sp * 4.4)) * 0.025, z); w.blob.position.set(w.ln.x, 0.175, z); const f = Math.floor(((d * 0.62) % 1) * 4) % 4, tex = w.tx[f]; if (w.m.material.map !== tex) { w.m.material.map = tex; w.m.material.emissiveMap = tex; } });
  place(0);
  return { update: place, face(cam) { walkers.forEach((w) => { w.m.rotation.y = Math.atan2(cam.position.x - w.m.position.x, cam.position.z - w.m.position.z); }); } };
}
