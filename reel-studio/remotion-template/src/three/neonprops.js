// Set pieces for the neon-stage look: things the story is ABOUT, shown as big glowing objects above/behind the characters.
//   laptop  a desk with a glowing laptop (code lines on screen) and a floor ring        {at, label}
//   trophy  a gold cup on a numbered podium with a light beam                           {at, number: 1}
//   keywall a tilted wall of glowing keys (a "directory" of things)                     {at, cols: 22, rows: 16, color: '#8a63ff'}
//   pricestack  stacked boxes with price tags                                           {at, labels: ['$199', '$99', '$49']}
//   neonring    a glowing ring on the floor                                             {at, color: '#FFB84D', radius: 1.4}
//   podium  a plain rounded block to stand things on                                    {at, color}
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { staticFile } from 'remotion';

const rb = (w, h, d, r = 0.04) => new RoundedBoxGeometry(w, h, d, 4, r);
const glossy = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.1, ...extra });
const glow = (color, i = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: i < 1, opacity: i });
const put = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const root = (e) => { const g = new THREE.Group(), at = e.at || [0, 0, 0]; g.position.set(at[0], at[1], at[2]); g.rotation.y = e.rotY || 0; g.scale.setScalar(e.scale || 1); return { g, at }; };
const done = (e, g, at, height, update = () => {}) => ({ id: e.id, group: g, height: height * (e.scale || 1), kind: e.kind, subject: () => ({ pos: [at[0], at[1], at[2]], height: height * (e.scale || 1), rotY: g.rotation.y }), update });
const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const ring = (parent, r, color, y = 0.012) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.07, 64), new THREE.MeshBasicMaterial({ color, toneMapped: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = y; parent.add(m); return m; };


/** text typed onto a canvas screen: lines = ['$ curl -I site', '# comment', '> output', 'plain'] (colour by first character); cps = characters per second */
function typedScreen(lines, w = 640, h = 420, cps = 38) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; let last = -1;
  const total = lines.reduce((n, l) => n + l.length + 1, 0);
  const draw = (lt, start = 0.3) => {
    const k = Math.min(total, Math.max(0, Math.floor((lt - start) * cps))); if (k === last) return; last = k;
    g.fillStyle = '#0d0b18'; g.fillRect(0, 0, w, h); g.font = '600 26px "JetBrains Mono", Menlo, monospace'; g.textBaseline = 'top'; let left = k;
    lines.forEach((l, i) => { const n = Math.max(0, Math.min(l.length, left)); left -= l.length + 1; g.fillStyle = l[0] === '$' ? '#9be37d' : l[0] === '#' ? '#8e86ad' : l[0] === '>' ? '#7DE3FF' : '#f2eefc'; g.fillText(l.slice(0, n) + (n < l.length || (left < 0 && n === l.length && Math.floor(lt * 2) % 2 === 0 && i === lines.length - 1) ? '\u258c' : ''), 24, 22 + i * 40); });
    t.needsUpdate = true;
  };
  draw(0); return { texture: t, draw };
}
const PHOTO = (url, mat, onLoad, tint = '#9c9c9c') => new Promise((res) => new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.color.set(tint); mat.needsUpdate = true; onLoad?.(t.image); res(); }, undefined, () => res()));   // a white page would bloom into a white blob: keep it under the bloom threshold

function laptop(e) {
  const { g, at } = root(e), wood = glossy('#3a2a4a', { roughness: 0.5 });
  const deskParts = [put(g, rb(1.5, 0.09, 0.8, 0.03), wood, 0, 0.86, 0)]; for (const x of [-0.65, 0.65]) for (const z of [-0.3, 0.3]) deskParts.push(put(g, rb(0.09, 0.84, 0.09, 0.02), wood, x, 0.42, z));
  put(g, rb(0.78, 0.04, 0.54, 0.02), glossy('#8d8aa0', { metalness: 0.7 }), 0, 0.93, 0.04);
  const screen = tex(512, 340, (c, w, h) => { c.fillStyle = '#0d0b18'; c.fillRect(0, 0, w, h); const cols = ['#7DE3FF', '#FFB84D', '#FF5CA8', '#9be37d', '#b9a2ff']; for (let i = 0; i < 12; i++) { c.fillStyle = cols[(i * 7) % 5]; c.fillRect(34 + (i % 3) * 22, 30 + i * 24, 80 + ((i * 53) % 220), 11); } });
  const typed = e.lines ? typedScreen(e.lines, 640, 430, e.cps || 34) : null;
  const scr = put(g, new THREE.PlaneGeometry(0.74, 0.5), new THREE.MeshBasicMaterial({ map: typed ? typed.texture : screen, toneMapped: false }), 0, 1.22, -0.2); scr.rotation.x = -0.12; put(g, rb(0.78, 0.54, 0.03, 0.02), glossy('#2a2438'), 0, 1.22, -0.225).rotation.x = -0.12;
  const r1 = ring(g, 0.92, e.color || '#b9a2ff'), r2 = ring(g, 1.1, e.color || '#b9a2ff', 0.01);
  if (e.desk === false) { for (const m of [...deskParts, r1, r2]) g.remove(m); for (const m of g.children) m.position.y -= 0.8; }   // a floating laptop: no desk, no floor rings
  return done(e, g, at, 1.5, (lt, t) => { typed?.draw(lt, e.start ?? 0.3); r1.material.opacity = 1; r1.scale.setScalar(1 + Math.sin(t * 2) * 0.02); r2.scale.setScalar(1 + Math.sin(t * 2 + 1) * 0.03); });
}

/** a floating screen on the stage showing a real picture (a capture) and/or typed text: it keeps the duo in the frame. {image: 'assets/..png', lines: [...], w: 1.9, highlight: {x,y,w,h} (fractions), label} */
function screenProp(e) {
  const { g, at } = root(e), w = e.w || 1.9; let h = e.h || w * 0.78;
  const frame = put(g, rb(w + 0.16, h + 0.16, 0.07, 0.05), glossy(e.frame || '#2a2438', { emissive: new THREE.Color(e.glow || '#8a63ff'), emissiveIntensity: 0.25 }));
  const mat = new THREE.MeshBasicMaterial({ color: '#15101f', toneMapped: false }), plane = put(g, new THREE.PlaneGeometry(1, 1), mat, 0, 0, 0.045); plane.scale.set(w, h, 1);
  const hl = new THREE.Group(); hl.position.z = 0.05; g.add(hl);
  const mark = (img) => { const asp = img ? img.height / img.width : h / w; h = w * asp; plane.scale.set(w, h, 1); frame.scale.set(1, (h + 0.16) / (w * 0.78 + 0.16), 1);
    if (e.highlight) { const H = e.highlight, cx = (H.x + H.w / 2 - 0.5) * w, cy = (0.5 - (H.y + H.h / 2)) * h, hw = H.w * w, hh = H.h * h, tk = 0.025, col = e.highlightColor || '#FF5C7A'; hl.clear();
      for (const [x, y, ww, hh2] of [[0, hh / 2, hw, tk], [0, -hh / 2, hw, tk], [-hw / 2, 0, tk, hh], [hw / 2, 0, tk, hh]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh2), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); m.position.set(cx + x, cy + y, 0); hl.add(m); }
      const fill = new THREE.Mesh(new THREE.PlaneGeometry(hw, hh), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, toneMapped: false })); fill.position.set(cx, cy, -0.001); hl.add(fill); } };
  let ready = null, typed = null;
  if (e.image) ready = PHOTO(staticFile(e.image), mat, mark); else mark(null);
  if (e.lines) { typed = typedScreen(e.lines, 640, Math.round(640 * h / w), e.cps || 34); mat.map = typed.texture; mat.color.set('#bdbdbd'); }
  const out = done(e, g, at, h + 0.2, (lt) => { typed?.draw(lt, e.start ?? 0.3); const k = Math.min(1, lt / 0.35); g.scale.setScalar((e.scale || 1) * (0.9 + 0.1 * (1 - Math.pow(1 - k, 3)))); g.position.y = at[1] + Math.sin(lt * 1.6) * 0.02; });
  out.ready = ready; return out;
}

function trophy(e) {
  const { g, at } = root(e), gold = glossy('#FFC83D', { metalness: 0.9, roughness: 0.18, emissive: new THREE.Color('#aa7a10'), emissiveIntensity: 0.08 });
  const num = tex(256, 256, (c, w, h) => { c.fillStyle = '#4b3aa8'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '900 150px Inter, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('#' + (e.number || 1), w / 2, h / 2 + 8); });
  put(g, rb(0.9, 0.5, 0.9, 0.06), new THREE.MeshBasicMaterial({ map: num, toneMapped: false }), 0, 0.25, 0);
  const pts = [[0, 0], [0.12, 0], [0.12, 0.05], [0.05, 0.1], [0.05, 0.3], [0.2, 0.55], [0.3, 0.7], [0.27, 0.78], [0.0, 0.78]].map((p) => new THREE.Vector2(p[0], p[1])); const cup = put(g, new THREE.LatheGeometry(pts, 36), gold, 0, 0.5, 0); cup.scale.setScalar(1.1);
  for (const s of [-1, 1]) { const h = put(g, new THREE.TorusGeometry(0.13, 0.025, 10, 24, Math.PI), gold, s * 0.37, 1.12, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 6, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#FFD86B', transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false })); beam.position.y = 3.5; g.add(beam);
  return done(e, g, at, 1.5, (lt, t) => { cup.rotation.y = t * 0.8; beam.material.opacity = 0.09 + Math.sin(t * 3) * 0.025; });
}
function keywall(e) {
  const { g, at } = root(e), cols = e.cols || 22, rows = e.rows || 16, n = cols * rows, geo = rb(0.34, 0.34, 0.14, 0.06);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ toneMapped: false }), n), col = new THREE.Color(), base = new THREE.Color(e.color || '#8a63ff'), m4 = new THREE.Matrix4(), seed = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < n; i++) { const x = i % cols, y = Math.floor(i / cols); m4.setPosition((x - cols / 2) * 0.4, y * 0.4, 0); mesh.setMatrixAt(i, m4); col.copy(base).multiplyScalar(0.28 + seed(i) * 0.5); mesh.setColorAt(i, col); }
  mesh.instanceColor.needsUpdate = true; g.add(mesh); g.rotation.x = e.tilt ?? -0.55;
  return done(e, g, at, rows * 0.4, (lt, t) => { for (let i = 0; i < n; i += 3) { const k = 0.28 + (0.35 + 0.35 * Math.sin(t * 3 + seed(i) * 40)) * 0.9; col.copy(base).multiplyScalar(k); mesh.setColorAt(i, col); } mesh.instanceColor.needsUpdate = true; });
}
function pricestack(e) {
  const { g, at } = root(e), labels = e.labels || ['$199', '$99', '$49'], cols = ['#6a3fd0', '#c43a7a', '#e08a2c'];
  labels.forEach((t, i) => { const face = tex(512, 192, (c, w, h) => { c.fillStyle = cols[i % 3]; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, 0, w, 14); c.fillStyle = '#fff'; c.font = `900 ${Math.round(Math.min(120, 470 / (Math.max(3, t.length) * 0.62)))}px Inter, Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, w / 2, h / 2 + 8); }); put(g, rb(1.5, 0.5, 0.7, 0.05), [glossy(cols[i % 3]), glossy(cols[i % 3]), glossy(cols[i % 3]), glossy(cols[i % 3]), new THREE.MeshBasicMaterial({ map: face, toneMapped: false }), glossy(cols[i % 3])], 0, 0.27 + i * 0.52, 0); });
  return done(e, g, at, labels.length * 0.52, (lt, t) => { g.children.forEach((c, i) => { c.position.x = Math.sin(t * 1.3 + i) * 0.02; }); });
}
function neonring(e) { const { g, at } = root(e); const r = ring(g, e.radius || 1.4, e.color || '#FFB84D'); ring(g, (e.radius || 1.4) + 0.2, e.color || '#FFB84D', 0.011).material.opacity = 0.5; return done(e, g, at, 0.05, (lt, t) => { r.scale.setScalar(1 + Math.sin(t * 2.4) * 0.015); }); }
function podium(e) { const { g, at } = root(e); put(g, rb(e.w || 1.2, e.h || 0.5, e.d || 1.0, 0.08), glossy(e.color || '#4b3aa8'), 0, (e.h || 0.5) / 2, 0); return done(e, g, at, e.h || 0.5); }

export const NEON_PROPS = { laptop, trophy, keywall, pricestack, neonring, podium, screen: screenProp };
