// Block / low-poly 3D families (voxel explainer, Roblox-style story, low-poly night office). Same joint contract as char3d.js, so
// updateChar (poses, moods, lip-sync, props in hand) runs unchanged; only the geometry, materials and face drawing differ.
//   buildBlockChar(cast, sc)  sc.variant = 'voxel' | 'blocky' | 'lowpoly'
//   buildCreature(spec) / updateCreature(C, o)   the little companion (box creature with vertical eyes, screen-head bot, cloud)
//   buildFamilySet(world)   'desk' (night office) | 'stage' (starfield or studio) | 'world' (blocky town in the sky)
import * as THREE from '../../vendor/three.module.js';
import { shade } from '../core/rig.js';

const U = 1.75 / 926, rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const UP = new THREE.Vector3(0, 1, 0);
const mats = new Map();
const mat = (col, o = {}) => { const k = col + JSON.stringify(o); let m = mats.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.82, metalness: 0, ...o }); mats.set(k, m); } return m; };
const glow = (col, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) });
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
const box = (w, h, d, col, x, y, z, o) => mesh(new THREE.BoxGeometry(w, h, d), mat(col, o), x, y, z);
function canvasTex(w, h, fn, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t; }

// ---------------------------------------------------------------- characters
export function buildBlockChar(cast, sc) {
  const V = sc.variant || 'voxel', of = cast.outfit || {}, G = new THREE.Group(), J = { G, block: V };
  const skin = of.skin || sc.skin || '#B07A50', shirt = of.color || sc.shirt || '#222', pants = sc.pants || '#26305c', hair = sc.hair || '#17110d';
  const lw = V === 'voxel' ? 0.105 : V === 'blocky' ? 0.12 : 0.085;                 // limb thickness
  const low = V === 'lowpoly', cyl = (r, n = 6) => new THREE.CylinderGeometry(r, r, 1, n), bx = (r) => new THREE.BoxGeometry(r * 2, 1, r * 2);
  const limb = (col, r) => { const m = mesh(low ? cyl(r, 7) : bx(r), mat(col)); return m; };
  J.hip = new THREE.Group(); G.add(J.hip); J.upper = new THREE.Group(); J.hip.add(J.upper);
  J.leg = [-1, 1].map(() => ({ thigh: limb(pants, lw * 0.62), shin: limb(pants, lw * 0.55), shoe: mesh(new THREE.BoxGeometry(lw * 1.1, 0.06, lw * 1.9), mat(sc.shoe || '#e8e8ea'), 0, 0, 0) }));
  J.leg.forEach((l) => J.hip.add(l.thigh, l.shin, l.shoe));
  // torso
  const tw = V === 'voxel' ? 0.44 : V === 'blocky' ? 0.46 : 0.36, th = 0.56, td = V === 'voxel' ? 0.24 : 0.22;
  const torso = low ? mesh(new THREE.CylinderGeometry(0.2, 0.17, th, 8), mat(shirt), 0, th / 2, 0) : box(tw, th, td, shirt, 0, th / 2, 0);
  if (low) torso.scale.z = 0.7; J.upper.add(torso);
  if (sc.badge) { const b = box(0.07, 0.07, 0.01, sc.badge, tw * 0.22, 0.38, td / 2 + 0.006); J.upper.add(b); }
  if (V === 'lowpoly') { const col = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 8), mat(shade(shirt, -0.25)), 0, 0.57, 0); J.upper.add(col); }
  J.arm = [-1, 1].map((side) => {
    const a = { side, up: limb(low ? skin : shirt, lw * 0.5), fo: limb(skin, lw * 0.45), slU: limb(shirt, lw * 0.56), slF: low ? limb(shirt, lw * 0.52) : null, hand: new THREE.Group(), long: low };
    a.hand.add(V === 'lowpoly' ? mesh(new THREE.IcosahedronGeometry(0.052, 0), mat(skin)) : box(lw * 0.95, lw * 0.95, lw * 0.95, skin, 0, 0, 0));
    J.upper.add(a.up, a.fo, a.slU, a.hand); if (a.slF) J.upper.add(a.slF); return a;
  });
  // head
  J.neckTop = new THREE.Group(); J.neckTop.position.y = 0.6; J.upper.add(J.neckTop);
  J.head = new THREE.Group(); J.head.position.y = V === 'voxel' ? 0.25 : 0.22; J.neckTop.add(J.head);
  const hs = V === 'voxel' ? 0.44 : V === 'blocky' ? 0.34 : 0.4;
  if (V === 'voxel') J.head.add(box(hs, hs, hs, skin, 0, 0, 0));
  else if (V === 'blocky') J.head.add(mesh(new THREE.CylinderGeometry(hs * 0.5, hs * 0.5, hs * 0.8, 16), mat(skin), 0, 0, 0));
  else { const h = mesh(new THREE.IcosahedronGeometry(0.2, 1), mat(skin)); h.scale.set(1, 1.08, 0.95); J.head.add(h); }
  // hair / beard / hat
  const style = sc.hairStyle || (V === 'voxel' ? 'cap' : V === 'lowpoly' ? 'long' : 'none');
  if (V === 'voxel' && style === 'cap') { J.head.add(box(hs + 0.02, hs * 0.3, hs + 0.02, hair, 0, hs * 0.42, -0.005)); J.head.add(box(hs + 0.02, hs * 0.5, hs * 0.2, hair, 0, hs * 0.1, -hs * 0.5)); if (sc.beard) { J.head.add(box(hs + 0.02, hs * 0.32, hs * 0.22, hair, 0, -hs * 0.34, hs * 0.44)); J.head.add(box(hs * 0.25, hs * 0.32, hs + 0.02, hair, -hs * 0.5, -hs * 0.2, 0), box(hs * 0.25, hs * 0.32, hs + 0.02, hair, hs * 0.5, -hs * 0.2, 0)); } }
  if (V === 'blocky') J.head.add(mesh(new THREE.CylinderGeometry(hs * 0.505, hs * 0.505, hs * 0.1, 16), mat(hair), 0, hs * 0.37, 0));
  if (V === 'lowpoly') { const cap = mesh(new THREE.SphereGeometry(0.215, 8, 5, 0, Math.PI * 2, 0, 1.45), mat(hair)); cap.position.set(0, 0.02, -0.005); J.head.add(cap);
    for (const s of [-1, 1]) { const l = mesh(new THREE.IcosahedronGeometry(0.1, 0), mat(hair), s * 0.17, -0.12, -0.04); l.scale.set(0.9, 2.1, 1); J.head.add(l); } }
  // face decal
  J.faceCv = document.createElement('canvas'); J.faceCv.width = J.faceCv.height = 256; J.faceTex = new THREE.CanvasTexture(J.faceCv); J.faceTex.colorSpace = THREE.SRGBColorSpace;
  const fz = V === 'voxel' ? hs / 2 + 0.002 : V === 'blocky' ? hs * 0.5 + 0.002 : 0.2;
  J.head.add(mesh(new THREE.PlaneGeometry(hs * 0.95, hs * 0.95), new THREE.MeshBasicMaterial({ map: J.faceTex, transparent: true, depthWrite: false }), 0, V === 'lowpoly' ? 0.0 : 0, fz));
  J.props = {}; J.cast = cast; J.sc = sc; J.top = of.top || 'tee'; J.of = of; J.drawFace = blockFace; return J;
}

/** the animated face for the block variants (called by updateChar instead of the round-head faceTexture) */
export function blockFace(cv, F, o, t, ta, look) {
  const c = cv.getContext('2d'), V = o.sc?.variant || 'voxel'; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 256, 256); c.translate(128, 128);
  const blink = (t * 1 + (o.seed || 0)) % 3.7 < 0.1 ? 0.12 : 1, eo = Math.max(0.12, F.eo * blink), lx = (look?.[0] || 0) * 6, ly = (look?.[1] || 0) * 4, ink = '#14100d';
  const brow = (x, y, w, tilt) => { c.save(); c.translate(x, y - F.bl * 0.9); c.rotate(((x < 0 ? 1 : -1) * F.bt * Math.PI) / 180 * 0.5 + 0); c.fillStyle = V === 'lowpoly' ? '#3a2a22' : ink; c.fillRect(-w / 2, -5, w, V === 'lowpoly' ? 5 : 10); c.restore(); };
  if (V === 'voxel') {                                     // square white eyes, dark pupils (ref 7)
    for (const sx of [-1, 1]) { const ex = sx * 52, ey = -6; c.fillStyle = '#fff'; c.fillRect(ex - 28, ey - 30 * Math.min(1, eo), 56, 60 * Math.min(1, eo)); c.fillStyle = ink; const pw = 26, ph = Math.min(28, 40 * eo); c.fillRect(ex - 13 + lx * 1.5, ey - ph / 2 + ly + 4, pw, ph); brow(ex, ey - 42, 62, 0); }
    const mw = 34 + F.sm * 18, mh = 6 + (F.mo + ta * 0.9) * 40; c.fillStyle = '#3a1612'; c.fillRect(-mw / 2, 66 - (F.sm > 0.3 ? 4 : 0), mw, mh);
  } else if (V === 'blocky') {                             // Roblox face: dot eyes + smile
    c.fillStyle = ink; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 38 + lx, -10 + ly, 9, 14 * Math.min(1.2, eo), 0, 0, 7); c.fill(); }
    c.lineWidth = 9; c.lineCap = 'round'; c.strokeStyle = ink; c.beginPath(); const sm = F.sm, mo = F.mo + ta * 0.8; if (mo > 0.2) { c.fillStyle = '#4a1610'; c.beginPath(); c.ellipse(0, 52, 28 + sm * 8, 8 + mo * 28, 0, 0, 7); c.fill(); } else { c.moveTo(-34, 44 - sm * 6); c.quadraticCurveTo(0, 44 + sm * 34, 34, 44 - sm * 6); c.stroke(); }
  } else {                                                 // low-poly: small oval eyes behind round glasses
    for (const sx of [-1, 1]) { const ex = sx * 52; c.fillStyle = ink; c.beginPath(); c.ellipse(ex + lx * 0.8, -4 + ly, 7, 10 * Math.min(1.25, eo), 0, 0, 7); c.fill(); if (o.sc?.glasses !== false) { c.lineWidth = 6; c.strokeStyle = '#1b1b20'; c.beginPath(); c.arc(ex, -4, 40, 0, 7); c.stroke(); } brow(ex, -58, 44, 0); }
    if (o.sc?.glasses !== false) { c.lineWidth = 6; c.strokeStyle = '#1b1b20'; c.beginPath(); c.moveTo(-12, -6); c.quadraticCurveTo(0, -14, 12, -6); c.stroke(); }
    c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = '#6b3a30'; const mo = F.mo + ta * 0.8; if (mo > 0.18) { c.fillStyle = '#5a2620'; c.beginPath(); c.ellipse(0, 64, 12 + F.sm * 6, 4 + mo * 20, 0, 0, 7); c.fill(); } else { c.beginPath(); c.moveTo(-14, 66 - F.sm * 3); c.quadraticCurveTo(0, 66 + F.sm * 12, 14, 66 - F.sm * 3); c.stroke(); }
  }
}

// ---------------------------------------------------------------- creatures
/** spec: { kind: 'box' | 'screen' | 'cloud', color, eye } */
export function buildCreature(spec = {}) {
  const kind = spec.kind || 'box', col = spec.color || '#D9573A', eye = spec.eye || '#111', G = new THREE.Group(), C = { G, kind, base: 0 };
  C.body = new THREE.Group(); G.add(C.body);
  if (kind === 'cloud') { const m = mat(col, { emissive: shade(col, -0.45), emissiveIntensity: 0.5 }); for (const [x, y, z, r] of [[0, 0.18, 0, 0.19], [-0.15, 0.14, 0.02, 0.13], [0.15, 0.14, 0.02, 0.13], [0, 0.1, 0.06, 0.17]]) C.body.add(mesh(new THREE.IcosahedronGeometry(r, 1), m, x, y, z)); C.eyes = []; const t = canvasTex(128, 64, (x) => { x.fillStyle = '#fff'; x.font = '700 46px monospace'; x.fillText('>_', 14, 48); }); const pl = mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ map: t, transparent: true }), 0, 0.16, 0.24); C.body.add(pl); }
  else {
    const w = kind === 'screen' ? 0.26 : 0.34, h = kind === 'screen' ? 0.26 : 0.24; C.body.add(box(w, h, kind === 'screen' ? 0.24 : 0.26, col, 0, h / 2 + 0.05, 0));
    C.eyes = [-1, 1].map((s) => { const e = mesh(new THREE.PlaneGeometry(kind === 'screen' ? 0.045 : 0.035, kind === 'screen' ? 0.12 : 0.08), kind === 'screen' ? glow('#fff') : glow(eye), s * (kind === 'screen' ? 0.06 : 0.07), h / 2 + 0.08, (kind === 'screen' ? 0.12 : 0.131) + 0.002); C.body.add(e); return e; });
    for (const [x, z] of [[-0.11, 0.08], [0.11, 0.08], [-0.11, -0.08], [0.11, -0.08]]) C.body.add(box(0.06, 0.06, 0.06, shade(col, -0.2), x, 0.03, z));
    if (kind === 'box') for (const s of [-1, 1]) { const a = box(0.05, 0.1, 0.05, col, s * 0.2, 0.17, 0); a.rotation.z = -s * 0.5; C.body.add(a); }
  }
  return C;
}
export function updateCreature(C, o) {
  const { t, lt, x, z, s = 1, kick = 0, talk = 0 } = o, hop = Math.abs(Math.sin(Math.min(1, lt / 0.45) * Math.PI)) * (lt < 0.45 ? 1 : 0) * kick * 0.16 + talk * 0.012;
  C.G.position.set(x, o.y || 0, z); C.G.scale.setScalar(s); C.G.rotation.y = o.rotY || 0; C.body.position.y = hop + Math.sin(t * 2.2 + x) * 0.006;
  C.body.scale.set(1 + (hop > 0 ? -0.05 : 0), 1 + hop * 0.6, 1); const bl = (t + x * 3) % 3.4 < 0.09 ? 0.1 : 1; (C.eyes || []).forEach((e) => { e.scale.y = bl; }); C.G.visible = true;
}

// ---------------------------------------------------------------- sets
function dots(w, h, n, cols, seed, rmax = 14) { return canvasTex(w, h, (c) => { for (let i = 0; i < n; i++) { const x = rnd(seed + i * 3) * w, y = rnd(seed + i * 3 + 1) * h, r = 3 + rnd(seed + i * 3 + 2) * rmax, g = c.createRadialGradient(x, y, 0, x, y, r); const col = cols[i % cols.length]; g.addColorStop(0, col); g.addColorStop(0.6, col + '66'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }); }
const codeTex = (col = '#7be0a8') => canvasTex(256, 192, (c, w, h) => { c.fillStyle = '#0f1630'; c.fillRect(0, 0, w, h); for (let r = 0; r < 14; r++) { let x = 12 + (r % 3) * 12; const cols = ['#6fd3ff', '#f1c27a', col, '#d79bff', '#ffffff']; for (let k = 0; k < 4; k++) { const ww = 14 + rnd(r * 9 + k) * 44; c.fillStyle = cols[(r + k) % 5]; c.fillRect(x, 10 + r * 12.5, ww, 5); x += ww + 6; } } });

function lightsFor(g, w) {
  g.add(new THREE.HemisphereLight(w.sky || '#8f9ed8', w.ground || '#2a2030', w.hemi ?? 1.5));
  const key = new THREE.DirectionalLight(w.key || '#fff2dd', w.keyI ?? 2.2); key.position.set(2.5, 4.5, 4); g.add(key);
  const rim = new THREE.DirectionalLight(w.rim || '#8aa4ff', w.rimI ?? 1.4); rim.position.set(-3, 3, -3); g.add(rim);
}

export function buildFamilySet(w) {
  const g = new THREE.Group(); lightsFor(g, w); let upd = () => {};
  if (w.kind === 'desk') {                                 // low-poly night office
    { const fl = mesh(new THREE.PlaneGeometry(14, 10), mat(w.floor || '#2b1f1a'), 0, 0, 0); fl.rotation.x = -Math.PI / 2; g.add(fl); }
    const win = mesh(new THREE.PlaneGeometry(9, 5.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 300, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#070b24'); gr.addColorStop(1, '#16255a'); c.fillStyle = gr; c.fillRect(0, 0, W, H); for (let i = 0; i < 26; i++) { const x = rnd(i) * W, h = 60 + rnd(i + 40) * 140; c.fillStyle = '#0a1030'; c.fillRect(x, H - h, 30 + rnd(i + 9) * 30, h); } }) }), 0, 2.6, -3.4); g.add(win);
    const glowT = dots(512, 300, 60, ['#ffd27a', '#ffe7b0', '#8fd0ff', '#ff9d6a'], 7, 6); const bk = mesh(new THREE.PlaneGeometry(9, 5.2), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 2.6, -3.38); g.add(bk);
    const wall = mesh(new THREE.PlaneGeometry(14, 6), mat('#10142e'), 0, 3, -3.5); g.add(wall);
    g.add(box(3.4, 0.09, 1.1, w.desk || '#8a5a36', 0, 0.78, 0.8), box(0.1, 0.78, 0.9, '#5d3a22', -1.6, 0.39, 0.8), box(0.1, 0.78, 0.9, '#5d3a22', 1.6, 0.39, 0.8));
    const mon = new THREE.Group(); mon.add(box(0.95, 0.6, 0.05, '#12121a', 0, 0, 0), mesh(new THREE.PlaneGeometry(0.88, 0.52), new THREE.MeshBasicMaterial({ map: codeTex() }), 0, 0, 0.03), box(0.08, 0.3, 0.08, '#202028', 0, -0.4, -0.02)); mon.position.set(1.15, 1.25, 0.55); mon.rotation.y = -0.5; g.add(mon);
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 8), mat('#f2efe8'), -0.55, 0.87, 1.0));
    const lamp = new THREE.PointLight('#ffb870', 2.2, 7, 2); lamp.position.set(-1.1, 1.9, 1.3); g.add(lamp); g.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), glow('#ffd29a'), -1.1, 1.9, 1.3));
    return { group: g, bg: '#070a1c', fog: ['#070a1c', 9, 22], deskZ: 0.8, update() {} };
  }
  if (w.kind === 'stage') {                                // starfield (voxel explainer) or light studio with ticker wall
    const floor = mesh(new THREE.CircleGeometry(9, 40), mat(w.floor || '#16206a')); floor.rotation.x = -Math.PI / 2; g.add(floor);
    if (w.ticker) { const t = canvasTex(512, 256, (c, W, H) => { c.fillStyle = '#0c0f14'; c.fillRect(0, 0, W, H); c.font = '700 13px monospace'; for (let r = 0; r < 14; r++) for (let k = 0; k < 6; k++) { const up = rnd(r * 7 + k) > 0.45; c.fillStyle = up ? '#34e07b' : '#ff5a5f'; c.fillText(`IDX${10 + ((r * 7 + k * 13) % 80)} ${up ? '▲' : '▼'}${(rnd(r + k * 9) * 3).toFixed(2)}%`, 8 + k * 84, 18 + r * 17); } }); g.add(mesh(new THREE.PlaneGeometry(11, 5.6), new THREE.MeshBasicMaterial({ map: t }), 0, 4.2, -4.2)); for (let i = 0; i < 7; i++) g.add(box(0.9, 0.3, 0.35, i % 2 ? '#8e2f3a' : '#2f8e4f', -3.6 + i * 1.2, 0.5, -3.2)); }
    else { const st = mesh(new THREE.PlaneGeometry(44, 26), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 600, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d1445'); gr.addColorStop(1, w.bg || '#141d5f'); c.fillStyle = gr; c.fillRect(0, 0, W, H); for (let i = 0; i < 260; i++) { const x = rnd(i) * W, y = rnd(i + 1) * H, r = 1 + rnd(i + 2) * 2.6; c.fillStyle = ['#ffffff', '#bcd0ff', '#ffb89a', '#9ad1ff'][i % 4] + (rnd(i + 3) > 0.5 ? 'ff' : '99'); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }) }), 0, 4, -6); g.add(st); upd = (t) => { st.position.x = Math.sin(t * 0.2) * 0.4; }; }
    return { group: g, bg: w.bg || '#141d5f', fog: [w.bg || '#141d5f', 12, 30], update: upd };
  }
  // 'world': Roblox-style town in the sky
  const sky = mesh(new THREE.PlaneGeometry(60, 34), new THREE.MeshBasicMaterial({ map: canvasTex(8, 256, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a62d8'); gr.addColorStop(0.7, '#8cc8f6'); gr.addColorStop(1, '#f6e6d0'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }) }), 0, 6, -14); g.add(sky);
  const gr = mesh(new THREE.CircleGeometry(16, 6), mat(w.floor || '#5db84a')); gr.rotation.x = -Math.PI / 2; g.add(gr);
  const winTs = ['#4f8fe0', '#f0b64a', '#6ac0a0'].map((wc) => canvasTex(64, 256, (c, W, H) => { c.fillStyle = '#f4f8ff'; c.fillRect(0, 0, W, H); for (let r = 0; r < 20; r++) for (let k = 0; k < 4; k++) { c.fillStyle = wc; c.fillRect(6 + k * 15, 6 + r * 12, 10, 7); } }));
  const ck = canvasTex(64, 64, (c) => { c.fillStyle = '#5db84a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#56ae44'; c.fillRect(0, 0, 32, 32); c.fillRect(32, 32, 32, 32); }); ck.wrapS = ck.wrapT = THREE.RepeatWrapping; ck.repeat.set(14, 14); gr.material = new THREE.MeshLambertMaterial({ map: ck });
  for (let i = 0; i < 46; i++) { const side = i % 2 ? 1 : -1, x = side * (2.6 + rnd(i) * 9), z = 3 - rnd(i + 9) * 17, h = 4 + rnd(i + 19) * (i % 5 === 0 ? 26 : 12), ww = 1.1 + rnd(i + 3) * 1.6; const b = mesh(new THREE.BoxGeometry(ww, h, ww * (0.8 + rnd(i + 4) * 0.6)), new THREE.MeshLambertMaterial({ map: winTs[i % 3], color: i % 4 ? '#ffffff' : '#ffe9b0' }), x, h / 2, z); g.add(b); if (i % 3 === 0) g.add(mesh(new THREE.BoxGeometry(ww * 1.15, 0.16, ww * 1.15), mat('#e8c24a'), x, h + 0.08, z)); }
  for (let i = 0; i < 5; i++) g.add(box(0.9, 0.6, 0.9, '#7a5a3a', -3 + i * 1.5, 0.3, -2.6 - (i % 2)));
  for (let i = 0; i < 9; i++) { const cl = new THREE.Group(); for (let k = 0; k < 4; k++) cl.add(mesh(new THREE.IcosahedronGeometry(0.7 + rnd(i + k) * 0.5, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), k * 0.9, rnd(k) * 0.3, 0)); cl.position.set((rnd(i + 50) - 0.5) * 24, 3 + rnd(i + 60) * 6, -6 - rnd(i + 70) * 6); g.add(cl); }
  return { group: g, bg: '#8cc8f6', fog: ['#bfe0f8', 10, 34], update() {} };
}
