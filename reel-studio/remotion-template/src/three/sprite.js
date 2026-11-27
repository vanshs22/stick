// A 2D cartoon stickman standing in a lit 3D world (style 2, learned from r21 and r26): a flat PNG sprite on a camera-facing plane, lit by the scene,
// with a projected ground shadow. Poses and moods are baked sprites (tools/sprites_stick.mjs); the actor swaps them as a pure function of shot time.
//   entry: { kind:'sprite', char:'otto', at:[x,z], y, height:1.9, pose:[[0,'idle'],[1.2,'point']], mood:[[0,'neutral']], flip, path:[[t,x,z],...], speed, wind, sun:[x,y,z] }
import * as THREE from 'three';
import { staticFile } from 'remotion';

const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const loader = new THREE.TextureLoader(), cache = {};
const load = (url) => (cache[url] ||= loader.loadAsync(url).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; return t; }));
const names = (spec, d) => (Array.isArray(spec) ? spec.map((x) => x[1]) : spec ? [spec] : [d]);
const at = (spec, lt, d) => { if (!Array.isArray(spec)) return spec || d; let v = spec[0][1]; for (const [t, n] of spec) if (lt >= t) v = n; return v; };

export function makeSprite(e) {
  const H = e.height || 1.9, SZ = [512, 1084], FEET = 1050, Wd = (H * SZ[0]) / SZ[1], char = e.char || 'otto', g = new THREE.Group(), seed = e.seed ?? 0;
  const start = e.at || [0, 0]; g.position.set(start[0], e.y || 0, start[1]);
  const geo = new THREE.PlaneGeometry(Wd, H); geo.translate(0, H / 2 - ((SZ[1] - FEET) / SZ[1]) * H, 0);
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1, metalness: 0, emissive: '#ffffff', emissiveIntensity: e.glow ?? 0.1 })); body.castShadow = false; g.add(body);
  const sh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.34, alphaTest: 0.3, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })); sh.matrixAutoUpdate = false; sh.frustumCulled = false; g.add(sh);
  const poses = new Set(['idle', ...names(e.pose, 'idle'), ...(e.path ? ['walkA', 'walkB'] : [])]), moods = new Set(['neutral', ...names(e.mood, 'neutral')]), tex = {};
  const jobs = []; for (const p of poses) for (const m of moods) for (const o of ['closed', 'open']) { const k = `${p}_${m}_${o}`; jobs.push(load(staticFile(`sprites/${char}/${k}.png`)).then((t) => { tex[k] = t; }).catch(() => {})); }
  const L = new THREE.Vector3(...(e.sun || [-0.45, 1, 0.35])).normalize(), hh = 0.03, M = new THREE.Matrix4().set(1, -L.x / L.y, 0, (L.x / L.y) * hh, 0, 0, 0, hh, 0, -L.z / L.y, 1, (L.z / L.y) * hh, 0, 0, 0, 1);
  const inv = new THREE.Matrix4(); let flip = e.flip ? -1 : 1, cur = null;
  const pick = (lt, t, talk, moving) => {
    let pose = at(e.pose, lt, 'idle'); if (moving) pose = Math.floor((lt * (e.cadence || 3.4)) % 2) === 0 ? 'walkA' : 'walkB';
    const mood = at(e.mood, lt, 'neutral'), open = talk > 0.25 && Math.sin(t * 21 + seed * 7) > -0.15 ? 'open' : 'closed';
    return tex[`${pose}_${mood}_${open}`] || tex[`${pose}_${mood}_closed`] || tex[`idle_${mood}_closed`] || tex['idle_neutral_closed'];
  };
  return {
    id: e.id, group: g, height: H, kind: 'sprite', ready: Promise.all(jobs),
    subject: () => ({ pos: [g.position.x, g.position.y, g.position.z], height: H, rotY: 0 }),
    update(lt, t, talk) {
      let moving = false;
      if (e.path && e.path.length) { const p = e.path; let i = 0; while (i < p.length - 1 && lt > p[i + 1][0]) i++; const a = p[i], b = p[Math.min(i + 1, p.length - 1)], k = b[0] > a[0] ? ease((lt - a[0]) / (b[0] - a[0])) : 1; const dx = b[1] - a[1], dz = b[2] - a[2];
        g.position.x = a[1] + dx * k; g.position.z = a[2] + dz * k; moving = k > 0.001 && k < 0.999 && lt >= p[0][0]; if (moving && Math.abs(dx) > 0.05) flip = dx < 0 ? -1 : 1; }
      const tx = pick(lt, t, talk, moving); if (tx && tx !== cur) { cur = tx; body.material.map = tx; body.material.emissiveMap = tx; body.material.needsUpdate = true; sh.material.map = tx; sh.material.needsUpdate = true; }
      if (e.rise) { const k = ease((lt - e.rise.from) / (e.rise.dur || 2)); g.position.y = (e.y || 0) + k * (e.rise.height ?? 6); g.position.x = start[0] + k * (e.rise.drift ?? 0); }
      const breath = 1 + 0.01 * Math.sin(t * 2.1 + seed), hop = moving ? Math.abs(Math.sin(lt * (e.cadence || 3.4) * Math.PI)) * 0.06 : 0;
      body.scale.set(flip, breath, 1); body.position.y = hop; body.rotation.z = (e.wind ?? 0.02) * Math.sin(t * 2.6 + seed) + (moving ? 0.03 * flip : 0);
    },
    faceCamera(cam) {
      const yaw = Math.atan2(cam.position.x - g.position.x, cam.position.z - g.position.z); body.rotation.y = yaw; sh.visible = true;
      g.updateMatrixWorld(true); body.updateMatrixWorld(true); inv.copy(g.matrixWorld).invert(); sh.matrix.copy(inv).multiply(M).multiply(body.matrixWorld);
    },
  };
}
