// Shared toon materials: 3-step lighting ramp, cached colours, inverted-hull ink outlines.
import * as THREE from '../../vendor/three.module.js';

const ramp = new THREE.DataTexture(new Uint8Array([70, 150, 215, 255]), 4, 1, THREE.RedFormat); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const cache = new Map();
export const toon = (col, o = {}) => { const k = col + JSON.stringify(o); let m = cache.get(k); if (!m) { m = new THREE.MeshToonMaterial({ color: col, gradientMap: ramp, ...o }); cache.set(k, m); } return m; };
const HULL = new Map();
export const hull = (w, col = '#0E0E12') => { const k = w + col; let m = HULL.get(k); if (!m) { m = new THREE.ShaderMaterial({ uniforms: { th: { value: w }, c: { value: new THREE.Color(col) } }, vertexShader: 'uniform float th; void main(){ vec3 p = position + normalize(normal) * th; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }', fragmentShader: 'uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.0); }', side: THREE.BackSide }); HULL.set(k, m); } return m; };
export const addOutline = (mesh, w = 0.006, col) => { const o = new THREE.Mesh(mesh.geometry, hull(w, col)); mesh.add(o); return o; };
export const emissive = (col, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) });
