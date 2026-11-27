// Props that belong to the country worlds: a plank fence that can grow and fly away, a diegetic road sign, a straw hat in the wind, a tree stump, a windsock.
import * as THREE from 'three';
import { mat, T, canvasTex } from './world.js';

const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const val = (spec, lt, d) => { if (!Array.isArray(spec)) return spec ?? d; let v = spec[0][1], p = spec[0][0]; for (let i = 0; i < spec.length; i++) { if (lt >= spec[i][0]) { v = spec[i][1]; p = spec[i][0]; if (i < spec.length - 1) { const k = ease((lt - p) / Math.max(0.001, spec[i + 1][0] - p)); v = spec[i][1] + (spec[i + 1][1] - spec[i][1]) * k; } } } return v; };

/** plankfence: {at:[x,z], rotY, len, h: number | [[t,height],...], col, fly:{from, dur, lift, spin, drift}} */
function plankfence(e) {
  const g = new THREE.Group(), inner = new THREE.Group(), len = e.len || 8, at = e.at || [0, 0]; g.add(inner); g.position.set(at[0], 0, at[1]); g.rotation.y = e.rotY || 0;
  const post = mat({ color: '#5A4430', roughness: 1 }), mk = (i) => mat({ color: ['#C9AE86', '#B89C76', '#D2B88E', '#AA9070', '#C0A47C'][i % 5], roughness: 0.95 });
  const n = Math.max(2, Math.round(len / 1.2)); for (let i = 0; i <= n; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), post); p.position.set(-len / 2 + (len / n) * i, 0.6, 0); p.castShadow = p.receiveShadow = true; inner.add(p); }
  // vertical boards of uneven height and colour, with gaps, nailed to two rails
  const bw = 0.2, cnt = Math.round(len / (bw + 0.03)); for (let i = 0; i < cnt; i++) { const hgt = 1 + (((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1) * 0.12; const b = new THREE.Mesh(new THREE.BoxGeometry(bw, hgt, 0.05), mk(i)); b.position.set(-len / 2 + (i + 0.5) * (len / cnt), hgt / 2, 0.11); b.rotation.z = (((Math.sin(i * 78.233) * 43758.5453) % 1) - 0.5) * 0.02; b.castShadow = b.receiveShadow = true; inner.add(b); }
  [0.3, 0.85].forEach((y) => { const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.08), post); r.position.set(0, y, 0.05); r.castShadow = true; inner.add(r); });
  return { id: e.id, group: g, height: 1.2, kind: 'plankfence', subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height: 1.2 * inner.scale.y, rotY: g.rotation.y }),
    update(lt, t) { const h = val(e.h, lt, 1); inner.scale.y = h; const f = e.fly; if (f) { const k = ease((lt - f.from) / (f.dur || 2)); g.position.y = k * (f.lift ?? 8); g.position.x = at[0] + k * (f.drift ?? 6); g.rotation.z = k * (f.spin ?? 0.9); g.rotation.x = k * 0.3 * Math.sin(t * 2); } } };
}
/** roadsign: {at:[x,z], rotY, text, bg, fg, neon, w, h, post} a board on a post; neon = emissive plate with a light */
function roadsign(e) {
  const g = new THREE.Group(), at = e.at || [0, 0], w = e.w || 1.6, h = e.h || 0.9, py = e.postH ?? 1.8; g.position.set(at[0], 0, at[1]); g.rotation.y = e.rotY || 0;
  const tex = canvasTex('sign' + e.text + (e.bg || '') + (e.fg || ''), 512, Math.round(512 * (h / w)), (c, W, H) => { c.fillStyle = e.bg || '#1E5B3A'; c.fillRect(0, 0, W, H); c.strokeStyle = e.fg || '#FFFFFF'; c.lineWidth = 12; c.strokeRect(14, 14, W - 28, H - 28); c.fillStyle = e.fg || '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; const lines = String(e.text || '').split('\n'); const fs = Math.min(150, (W - 80) / Math.max(4, Math.max(...lines.map((s) => s.length)) * 0.62)); c.font = `900 ${fs}px "Archivo Black", Impact, sans-serif`; lines.forEach((s, i) => c.fillText(s, W / 2, H / 2 + (i - (lines.length - 1) / 2) * fs * 1.05)); });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), e.neon ? new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 1.6, roughness: 0.4 }) : mat({ map: tex, roughness: 0.6 })); panel.position.y = py; panel.castShadow = true; g.add(panel);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, py, 10), mat({ color: '#8A8F98', metalness: 0.5, roughness: 0.5 })); post.position.y = py / 2; post.castShadow = true; g.add(post);
  if (e.neon) { const pl = new THREE.PointLight(e.neon === true ? '#FF5A3A' : e.neon, 3.2, 9, 1.6); pl.position.set(0, py, 0.6); g.add(pl); }
  return { id: e.id, group: g, height: py + h / 2, kind: 'roadsign', subject: () => ({ pos: [g.position.x, 0, g.position.z], height: py + h / 2, rotY: g.rotation.y }), update(lt, t) { if (e.neon) panel.material.emissiveIntensity = 1.4 + 0.25 * Math.sin(t * 7); } };
}
/** hat3d: {path:[[t,x,y,z],...], spin, col} a straw hat that flies */
function hat3d(e) {
  const g = new THREE.Group(), c = e.col || '#E3C06A', m = mat({ color: c, roughness: 0.9 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.025, 28), m), dome = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.16, 24), m), band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.04, 24), mat({ color: '#A24B2F' })); dome.position.y = 0.085; band.position.y = 0.04; [brim, dome, band].forEach((x) => { x.castShadow = true; g.add(x); });
  const p = e.path || [[0, 0, 1, 0]]; g.position.set(p[0][1], p[0][2], p[0][3]);
  return { id: e.id, group: g, height: 0.2, kind: 'hat3d', subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height: 0.3, rotY: 0 }),
    update(lt, t) { let i = 0; while (i < p.length - 1 && lt > p[i + 1][0]) i++; const a = p[i], b = p[Math.min(i + 1, p.length - 1)], k = b[0] > a[0] ? ease((lt - a[0]) / (b[0] - a[0])) : 1; g.position.set(a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k); g.rotation.set(0.5 * Math.sin(lt * 3), lt * (e.spin ?? 6), 0.7 * Math.sin(lt * 2.3)); } };
}
function stump(e) { const g = new THREE.Group(), at = e.at || [0, 0]; g.position.set(at[0], 0, at[1]); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.5, 18), mat({ color: '#7A5234' })); s.position.y = 0.25; s.castShadow = true; g.add(s); const top = new THREE.Mesh(new THREE.CircleGeometry(0.45, 18), mat({ color: '#C79A66' })); top.rotation.x = -Math.PI / 2; top.position.y = 0.502; g.add(top); return { id: e.id, group: g, height: 0.5, kind: 'stump', subject: () => ({ pos: [at[0], 0, at[1]], height: 0.5, rotY: 0 }), update() {} }; }
export const COUNTRY_PROPS = { plankfence, roadsign, hat3d, stump };
