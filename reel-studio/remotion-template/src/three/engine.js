// Renderer + film look: ACES tone curve, soft shadows, environment light, bloom, depth of field, vignette + grain.
//   const E = makeEngine(canvas)   ·   E.render(scene, camera, { bloom, focus, aperture, maxblur, grade })
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const W = 1080, H = 1920;
/** quality knobs (set by Stage3D from the render scale): shadow map size */
export const QUALITY = { shadow: 4096 };
const GRADE = {
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.35 }, uGrain: { value: 0.025 }, uTime: { value: 0 }, uWarm: { value: 0.04 }, uSat: { value: 1.0 }, uCon: { value: 1.0 }, uShT: { value: new THREE.Vector3(-0.03, 0.012, 0.065) }, uHiT: { value: new THREE.Vector3(0.055, 0.028, -0.045) }, uSplit: { value: 1.0 }, uCurve: { value: 0.4 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig, uGrain, uTime, uWarm, uSat, uCon, uSplit, uCurve; uniform vec3 uShT, uHiT; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 7.13) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; d.x *= 0.5625;
      c.rgb *= 1.0 - uVig * smoothstep(0.25, 0.75, length(d) * 1.4);
      c.rgb = clamp(c.rgb, 0.0, 1.0); c.rgb = mix(c.rgb, c.rgb * c.rgb * (3.0 - 2.0 * c.rgb), uCurve); float lu = dot(c.rgb, vec3(0.299, 0.587, 0.114)); float shm = 1.0 - smoothstep(0.0, 0.6, lu), him = smoothstep(0.4, 1.0, lu); c.rgb += (uShT * shm + uHiT * him) * uSplit; c.rgb = mix(vec3(lu), c.rgb, uSat * (1.0 - 0.2 * him)); c.rgb = (c.rgb - 0.5) * uCon + 0.5; c.rgb += (h(vUv * 1000.0) - 0.5) * uGrain; c.r += uWarm * 0.5; c.b -= uWarm * 0.5; gl_FragColor = c; }`,
};

const INK = {
  uniforms: { tDiffuse: { value: null }, tNormal: { value: null }, tDepth: { value: null }, tMask: { value: null }, uNear: { value: 0.05 }, uFar: { value: 520 }, uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uInk: { value: new THREE.Color('#241726') }, uStrength: { value: 0 }, uWidth: { value: 1.6 }, uFadeA: { value: 140 }, uFadeB: { value: 520 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  // ink goes on the NEAR side of depth jumps and on creases (normal change); fades with distance (technique from the animated-shorts kit)
  fragmentShader: `uniform sampler2D tDiffuse, tNormal, tDepth, tMask; uniform float uNear, uFar, uStrength, uWidth, uFadeA, uFadeB; uniform vec2 uTexel; uniform vec3 uInk; varying vec2 vUv;
    float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); if (uStrength <= 0.0) { gl_FragColor = c; return; }
      float lc = lin(texture2D(tDepth, vUv).x); vec3 nc = texture2D(tNormal, vUv).xyz * 2.0 - 1.0; float e = 0.0; vec2 o[4]; o[0] = vec2(1.0, 0.0); o[1] = vec2(-1.0, 0.0); o[2] = vec2(0.0, 1.0); o[3] = vec2(0.0, -1.0);
      for (int i = 0; i < 4; i++) { vec2 uv = vUv + o[i] * uTexel * uWidth; float ln = lin(texture2D(tDepth, uv).x); vec3 nn = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
        e = max(e, smoothstep(0.04, 0.09, (ln - lc) / max(lc, 0.01))); e = max(e, smoothstep(0.35, 0.7, 1.0 - dot(nc, nn)) * step(abs(ln - lc) / max(lc, 0.01), 0.05)); }
      e *= 1.0 - smoothstep(uFadeA, uFadeB, lc); e *= 1.0 - step(0.5, texture2D(tMask, vUv).r); c.rgb = mix(c.rgb, uInk, clamp(e * uStrength, 0.0, 1.0)); gl_FragColor = c; }`,
};
const NORMAL_MAT = new THREE.MeshNormalMaterial();
export function makeEngine(canvas, { w = W, h = H, samples = 4, shadowSize = 2048 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setSize(w, h, false); renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer), envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples });
  renderer.userData = { shadowSize };
  const composer = new EffectComposer(renderer, rt); composer.setSize(w, h);
  const rp = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); composer.addPass(rp);
  const nrt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 0 }); nrt.depthTexture = new THREE.DepthTexture(w, h); nrt.depthTexture.type = THREE.UnsignedIntType;
  const mrt = new THREE.WebGLRenderTarget(w, h, { samples: 0 }), MASK_MAT = new THREE.MeshBasicMaterial({ color: '#ffffff', alphaTest: 0.3, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const inkPass = new ShaderPass(INK); inkPass.uniforms.tMask.value = mrt.texture; inkPass.uniforms.tNormal.value = nrt.texture; inkPass.uniforms.tDepth.value = nrt.depthTexture; inkPass.uniforms.uTexel.value.set(1 / w, 1 / h); composer.addPass(inkPass);
  const bokeh = new BokehPass(rp.scene, rp.camera, { focus: 3, aperture: 0.002, maxblur: 0.008 }); composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.35, 0.6, 0.85); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GRADE); composer.addPass(grade);
  return {
    renderer, envMap, composer,
    /** image-based light from our own sky: blue skylight fill and a warm sun lobe, so shadows are sky-tinted instead of grey */
    skyEnv(top, hor, gnd, sunDir = [0.5, 0.6, 0.4], sunCol = '#FFF0D6', sunI = 6) {
      const s = new THREE.Scene(), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(hor) }, gnd: { value: new THREE.Color(gnd) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'uniform vec3 top, hor, gnd; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(hor, top, pow(clamp(y * 1.4, 0.0, 1.0), 0.6)) : mix(hor, gnd, clamp(-y * 3.0, 0.0, 1.0)); gl_FragColor = vec4(c, 1.0); }' });
      s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), m)); const d = new THREE.Vector3(...sunDir).normalize().multiplyScalar(40), sun = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(sunCol).multiplyScalar(sunI), toneMapped: false })); sun.position.copy(d); s.add(sun);
      return pmrem.fromScene(s, 0.03).texture;
    },
    /** look = { bloom, bloomThreshold, focus (m), aperture (0 = all sharp), maxblur, exposure, vignette, grain, warm, t } */
    render(scene, camera, look = {}) {
      rp.scene = scene; rp.camera = camera; bokeh.scene = scene; bokeh.camera = camera;
      bokeh.enabled = (look.aperture ?? 0.0015) > 0;
      bokeh.uniforms.focus.value = look.focus ?? 3; bokeh.uniforms.aperture.value = look.aperture ?? 0.0015; bokeh.uniforms.maxblur.value = look.maxblur ?? 0.006;
      bloom.strength = look.bloom ?? 0.3; bloom.threshold = look.bloomThreshold ?? 0.85; bloom.radius = 0.6;
      renderer.toneMappingExposure = look.exposure ?? 1.0;
      grade.uniforms.uVig.value = look.vignette ?? 0.35; grade.uniforms.uGrain.value = look.grain ?? 0.02; grade.uniforms.uWarm.value = look.warm ?? 0.03; grade.uniforms.uTime.value = look.t ?? 0; grade.uniforms.uSplit.value = look.split ?? 1.0; grade.uniforms.uCurve.value = look.curve ?? 0.4; grade.uniforms.uSat.value = look.saturation ?? 1.0; grade.uniforms.uCon.value = look.contrast ?? 1.0;
      inkPass.uniforms.uStrength.value = look.ink ?? 0; inkPass.enabled = (look.ink ?? 0) > 0;
      if (inkPass.enabled) {   // normal + depth pass: transparent, alpha-tested, instanced and billboard things are hidden here (cards draw their own ink)
        const hid = []; scene.traverse((o) => { if (o.visible && (o.userData.noInk || o.isSprite || o.isInstancedMesh || (o.material && (o.material.alphaTest > 0 || o.material.transparent || o.material.fog === false)))) { o.visible = false; hid.push(o); } });
        const prevOM = scene.overrideMaterial; scene.overrideMaterial = NORMAL_MAT; renderer.setRenderTarget(nrt); renderer.setClearColor(0x8080ff, 1); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null); scene.overrideMaterial = prevOM; hid.forEach((o) => { o.visible = true; });
        const bodies = []; scene.traverse((o) => { if (o.userData.inkMask) bodies.push(o); });   // billboard cards: white silhouette mask so the world's ink never draws across them
        if (bodies.length) { const mats = bodies.map((b) => b.material), lay = camera.layers.mask; bodies.forEach((b) => { b.layers.enable(1); MASK_MAT.map = b.material.map; b.material = MASK_MAT.clone(); b.material.map = mats[bodies.indexOf(b)].map; }); camera.layers.set(1); renderer.setRenderTarget(mrt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null); camera.layers.mask = lay; bodies.forEach((b, i) => { b.material.dispose(); b.material = mats[i]; }); } else { renderer.setRenderTarget(mrt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.setRenderTarget(null); }
        inkPass.uniforms.uNear.value = camera.near; inkPass.uniforms.uFar.value = camera.far; inkPass.uniforms.uWidth.value = look.inkWidth ?? 1.6; if (look.inkColor) inkPass.uniforms.uInk.value.set(look.inkColor);
      }
      composer.render();
    },
  };
}
/** the default light rig: warm key with soft shadow, cool fill, rim, sky/ground bounce. Returns { key, rim, group } */
export function lightRig(scene, { key = '#FFE2C2', keyI = 3.2, keyPos = [2.5, 4, 3], rimCol = '#BFD8FF', rimI = 2.2, sky = '#FFF4E6', ground = '#8C6E55', hemiI = 0.9, shadowBox = 3, target = [0, 1, 0] } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const k = new THREE.DirectionalLight(key, keyI); k.position.set(...keyPos); k.target.position.set(...target); k.castShadow = true;
  k.shadow.mapSize.set(QUALITY.shadow, QUALITY.shadow); k.shadow.bias = -0.0004; k.shadow.normalBias = 0.02; k.shadow.radius = 6;
  Object.assign(k.shadow.camera, { left: -shadowBox, right: shadowBox, top: shadowBox, bottom: -shadowBox, near: 0.1, far: 20 }); k.shadow.camera.updateProjectionMatrix();
  g.add(k, k.target);
  const r = new THREE.DirectionalLight(rimCol, rimI); r.position.set(-3, 3, -3); g.add(r);
  g.add(new THREE.HemisphereLight(sky, ground, hemiI));
  return { key: k, rim: r, group: g };
}
export function camera(fov = 30) { return new THREE.PerspectiveCamera(fov, W / H, 0.05, 120); }
