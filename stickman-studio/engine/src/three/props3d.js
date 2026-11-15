// Hand-held 3D props. makeProp(name, label) returns a group positioned so the hand grips it. Add a prop = add a case.
import * as THREE from '../../vendor/three.module.js';
import { toon, addOutline, emissive } from './mat3d.js';

const mesh = (g, m, ol = 0.004) => { const x = new THREE.Mesh(g, m); x.castShadow = true; if (ol) addOutline(x, ol); return x; };
function labelTex(text, bg, fg, w = 256, h = 128, size = 64) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = `900 ${size}px Inter`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 4, w - 20); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function makeProp(name, label = '') {
  const g = new THREE.Group();
  switch (name) {
    case 'phone': { const b = mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), toon('#10131B')); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.138), new THREE.MeshBasicMaterial({ map: labelTex(label || '', '#6FA9FF', '#0B1B3A', 128, 256, 34) })); s.position.z = 0.0066; g.add(b, s); g.position.set(0.0, 0.05, 0.035); g.rotation.set(-0.2, 0, 0.1); break; }
    case 'cup': { const c = mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 16), toon('#F2EBDD')), t = mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 14), toon('#F2EBDD'), 0); t.position.set(0.06, 0, 0); const k = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.004, 16), toon('#5A3A22')); k.position.y = 0.044; g.add(c, t, k); g.position.set(0, 0.03, 0.04); break; }
    case 'letter': { const p = mesh(new THREE.BoxGeometry(0.2, 0.26, 0.004), new THREE.MeshBasicMaterial({ map: labelTex(label || '≡ ≡ ≡', '#F2EBD6', '#2B2A30', 128, 160, 44) })); g.add(p); g.position.set(0, 0.06, 0.06); g.rotation.x = -0.4; break; }
    case 'key': { const r = mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16), toon('#E3B23C')), s = mesh(new THREE.BoxGeometry(0.012, 0.1, 0.008), toon('#E3B23C'), 0); s.position.y = -0.07; const t = mesh(new THREE.BoxGeometry(0.035, 0.012, 0.008), toon('#E3B23C'), 0); t.position.set(0.02, -0.1, 0); g.add(r, s, t); g.position.set(0, 0.08, 0.03); break; }
    case 'money': { const b = mesh(new THREE.BoxGeometry(0.2, 0.09, 0.006), new THREE.MeshBasicMaterial({ map: labelTex(label || '$', '#2F7A4E', '#EAFBEF', 256, 112, 70) })); g.add(b); g.position.set(0, 0.05, 0.05); g.rotation.set(-0.3, 0, 0.15); break; }
    case 'flashlight': { const b = mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.17, 14), toon('#3B4152')), h = mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.045, 14), toon('#596075')); h.position.y = 0.1; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.004, 14), emissive('#FFF2C4')); l.position.y = 0.124; const beam = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.3, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#FFE9B0', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })); beam.position.y = 0.78; g.add(b, h, l, beam); g.rotation.x = Math.PI / 2 - 0.15; g.position.set(0, 0.03, 0.08); break; }
    case 'book': { const b = mesh(new THREE.BoxGeometry(0.15, 0.2, 0.03), toon('#3E6FA8')); const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.19, 0.026), toon('#F2EBD6')); p.position.x = 0.005; g.add(b, p); g.position.set(0, 0.05, 0.06); g.rotation.x = -0.35; break; }
    case 'bag': { const b = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.08), toon('#C9566E')), h = mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 14, Math.PI), toon('#7A2E40'), 0); h.position.y = 0.08; g.add(b, h); g.position.set(0, -0.1, 0.02); break; }
    case 'sign': { const p = mesh(new THREE.BoxGeometry(0.34, 0.2, 0.01), new THREE.MeshBasicMaterial({ map: labelTex(label || 'STOP', '#F2C64B', '#17171B', 256, 150, 70) })), s = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8), toon('#5A4636'), 0); s.position.y = -0.3; g.add(p, s); g.position.set(0, 0.2, 0.05); break; }
    default: { g.add(mesh(new THREE.SphereGeometry(0.05, 14, 10), toon('#E3B23C'))); }
  }
  return g;
}
