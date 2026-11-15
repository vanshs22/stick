// 3D shot renderer: scene + camera rig + painterly post pass. render3d(spec) draws one frame onto its WebGL canvas.
import * as THREE from '../../vendor/three.module.js';
import { buildSet } from './sets3d.js';
import { buildChar, updateChar } from './char3d.js';
import { buildBlockChar, buildCreature, updateCreature, buildFamilySet } from './blockfam.js';

const W = 1080, H = 1920, RES = Math.min(1, Math.max(0.4, +new URLSearchParams(location.search).get('res') || 1)), RW = Math.round(W * RES), RH = Math.round(H * RES);
let R, scene, cam, rt, post, quad, qs, inited = false; const sets = new Map(), chars = new Map(), creatures = new Map();
const smooth = (x) => x * x * (3 - 2 * x), eo = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const POST = {
  uniforms: { tex: { value: null }, res: { value: new THREE.Vector2(RW, RH) }, paint: { value: 0.5 }, t: { value: 0 }, sat: { value: 1 }, expo: { value: 1 }, warm: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D tex; uniform vec2 res; uniform float paint, t, sat, expo; uniform vec3 warm; varying vec2 v;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    if (paint < 0.01) { gl_FragColor = vec4(mix(vec3(dot(texture2D(tex, v).rgb, vec3(0.299, 0.587, 0.114))), texture2D(tex, v).rgb, sat) * warm * expo, 1.0); gl_FragColor.rgb = pow(clamp(gl_FragColor.rgb, 0.0, 1.0), vec3(0.4545)); return; }
    vec2 px = 1.0 / res; vec2 w = vec2(n(v*vec2(60.0,110.0)+3.0), n(v*vec2(60.0,110.0)+9.0)) - 0.5;
    vec2 uv = v + w * px * 3.0 * paint;                      // hand-painted edge wobble
    vec3 c = texture2D(tex, uv).rgb;
    vec3 a = texture2D(tex, uv + vec2(px.x*1.6, 0.0)).rgb, b = texture2D(tex, uv - vec2(px.x*1.6, 0.0)).rgb, d = texture2D(tex, uv + vec2(0.0, px.y*1.6)).rgb, e = texture2D(tex, uv - vec2(0.0, px.y*1.6)).rgb;
    vec3 soft = (c*2.0 + a + b + d + e) / 6.0;               // brush-softened colour
    c = mix(c, soft, 0.55 * paint);
    float L = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(c, floor(c * 9.0 + 0.5) / 9.0, 0.22 * paint);    // gentle colour banding like gouache
    float g = n(v * vec2(520.0, 920.0)) * 0.5 + n(v * vec2(130.0, 230.0)) * 0.5;
    c *= 1.0 - (0.10 * paint) * (g - 0.35);                  // paper / canvas grain
    float s = abs(dot(a - b, vec3(0.33))) + abs(dot(d - e, vec3(0.33)));
    c *= 1.0 - smoothstep(0.18, 0.5, s) * 0.35 * paint;      // ink-line darkening on strong edges
    c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, sat) * warm * expo;
    gl_FragColor = vec4(c, 1.0);
  }`,
};

export function init() {
  if (inited) return R.domElement; inited = true;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  R.setPixelRatio(1); R.setSize(RW, RH, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap; R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.35;
  scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 120);
  rt = new THREE.WebGLRenderTarget(RW, RH, { samples: RES < 1 ? 2 : 4, type: THREE.UnsignedByteType }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  post = new THREE.ShaderMaterial({ ...POST, uniforms: THREE.UniformsUtils.clone(POST.uniforms), depthTest: false, depthWrite: false }); post.uniforms.tex.value = rt.texture;
  qs = new THREE.Scene(); quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false; qs.add(quad);
  return cv;
}

const FR = { wide: { pos: [0, 1.75, 6.6], look: [0, 1.0, 0], fov: 36 }, medium: { pos: [0, 1.4, 4.4], look: [0, 1.0, 0], fov: 34 }, close: { pos: [0, 1.66, 2.5], look: [0, 1.56, 0], fov: 30 }, two: { pos: [0, 1.45, 5.4], look: [0, 1.0, 0], fov: 35 }, insert: { pos: [0, 1.6, 6.6], look: [0, 1.2, 0], fov: 36 } };
const hash = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

/**
 * spec: { t, lt, d, set:{kind,tod,weather}, pal, type, move, zoom, style, flick, shake, cast:[{id, cast, pose, mood, talk, hold, holdLabel, slot}], noChars, paint }
 */
export function render3d(spec) {
  const cv = init(), { t, lt, d, set, pal, type } = spec, u = Math.min(1, Math.max(0, (spec.camLt ?? lt) / Math.max(0.01, spec.camD ?? d)));
  const key = spec.world ? 'fam|' + spec.style.id : set.kind + '|' + set.tod; let S = sets.get(key); if (!S) { S = spec.world ? buildFamilySet(spec.world) : buildSet(set.kind, set.tod, pal); sets.set(key, S); scene.add(S.group); }
  sets.forEach((s) => { s.group.visible = s === S; });
  scene.background = new THREE.Color(S.bg || '#101018'); const fog = S.fog || [set.tod === 'night' ? '#0A0E1E' : set.tod === 'dusk' ? '#6A5A7A' : '#C8D4DC', 7, 26]; scene.fog = set.kind === 'elevator' || spec.world && !S.fog ? null : new THREE.Fog(fog[0], fog[1] ?? 7, fog[2] ?? 26);
  S.update?.(t, { rain: set.weather === 'rain' || set.weather === 'storm', flick: spec.flick, open: spec.open, t });
  // characters
  chars.forEach((c) => { c.G.visible = false; });
  if (!spec.noChars) spec.cast.forEach((c, i) => {
    let J = chars.get(c.id + spec.style.id); if (!J) { J = spec.style.character.variant ? buildBlockChar(c.cast, spec.style.character) : buildChar(c.cast, spec.style.character); chars.set(c.id + spec.style.id, J); scene.add(J.G); }
    const two = spec.cast.length > 1, x = two ? (i === 0 ? -0.55 : 0.6) : 0, rotY = two ? (i === 0 ? 0.42 : -0.46) : 0, ent = c.cast.outfit?.top === 'cloak', k = ent ? 1.14 : 1;
    updateChar(J, { t, lt, pose: c.pose, mood: c.mood, talk: c.talk, hold: c.hold, holdLabel: c.holdLabel, seed: c.seed, x: x + (ent ? 0.35 : 0), z: ent ? -1.4 : two ? 0 : 0, rotY });
    J.G.scale.setScalar(k);
  });
  // companions (little creatures)
  creatures.forEach((c) => { c.G.visible = false; });
  (spec.creatures || []).forEach((c) => { let C = creatures.get(c.id + spec.style.id); if (!C) { C = buildCreature(c.spec); creatures.set(c.id + spec.style.id, C); scene.add(C.G); } updateCreature(C, { t, lt, ...c }); });
  // camera
  const f = (spec.style.frames || {})[type] || FR[type] || FR.medium; let [px, py, pz] = f.pos, [lx, ly, lz] = f.look, fov = f.fov; const z = (spec.zoom || 0.1) * 6, mv = spec.move;
  if (mv === 'push') pz -= z * smooth(u); else if (mv === 'pull') pz -= z * (1 - smooth(u)); else if (mv === 'drift') { px += Math.sin(u * Math.PI) * 0.32; lx += Math.sin(u * Math.PI) * 0.1; } else if (mv === 'track') { px += (u - 0.5) * 1.8; lx += (u - 0.5) * 1.2; } else if (mv === 'punch') { fov *= 1 + 0.22 * (1 - eo((spec.camLt ?? lt) / 0.4)); pz -= z * 0.5 * smooth(u); } else pz -= z * 0.4 * smooth(u);
  const hh = (mv === 'handheld' ? 1 : 0.35) * (spec.hand || 0.004) * 12; px += (Math.sin(t * 7.3) * 0.6 + Math.sin(t * 13.1) * 0.3) * hh * 0.4; py += Math.sin(t * 6.1) * hh * 0.35; lx += Math.sin(t * 4.2) * hh * 0.1;
  if (spec.shake) { px += Math.sin(t * 61) * 0.05 * spec.shake; py += Math.cos(t * 53) * 0.04 * spec.shake; }
  cam.fov = fov; cam.position.set(px, py, pz); cam.lookAt(lx, ly, lz); cam.rotation.z += Math.sin(t * 1.1) * 0.004; cam.updateProjectionMatrix();
  const g = spec.style.grade || {}; post.uniforms.expo.value = g.exposure ?? 1; post.uniforms.paint.value = spec.paint ?? (g.paint ?? 0.6); post.uniforms.sat.value = spec.style.sets?.saturation ?? 1; post.uniforms.t.value = t;
  R.setRenderTarget(rt); R.render(scene, cam); R.setRenderTarget(null); R.render(qs, new THREE.Camera());
  return cv;
}
