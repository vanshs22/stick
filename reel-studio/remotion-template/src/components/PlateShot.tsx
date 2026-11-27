import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {E, p} from '../engine/anim';
import {useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';

/**
 * A photoreal PLATE (path-traced by renderers/blender, see docs/PHOTOREAL.md) with a real camera move: the plate and its depth map are drawn in one WebGL pass,
 * and every pixel shifts by its depth when the camera pushes, pulls, trucks, cranes or orbits. Cheap (one still per shot, ~1 s per second of film to render here) and film-like.
 * Honest limit: parallax is for moves up to about 8 degrees of orbit or 12 percent of push; a bigger move needs a Blender sequence (the `Footage` component plays it).
 * props: plate, depth (public paths), move {kind: push|pull|truck-left|truck-right|crane-up|crane-down|orbit-left|orbit-right|still, amount 0..1 (default 0.5), from 0..1, to 0..1, ease}, overscan (what the plate was rendered with, default 0.12), focus 0..1 (the depth that stays put, default 0.5), strength (parallax size, default 0.045), grain 0..0.05, handheld 0..1, anchor.
 */
const VS = 'attribute vec2 a; varying vec2 v; void main(){ v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }';
const FS = `precision highp float; varying vec2 v; uniform sampler2D tex, dep; uniform vec2 off; uniform float zoom, focus, strength, grain, ov, seed, aspect; uniform vec2 center;
float h(vec2 s){ return fract(sin(dot(s, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
void main(){
  vec2 uv = vec2(v.x, 1.0 - v.y);
  vec2 q = center + (uv - center) / zoom;                       // push / pull: scale about the subject
  q = (q - 0.5) / (1.0 + ov) + 0.5;                              // crop the overscan back to the frame
  vec2 u = q; for (int i = 0; i < 4; i++) { float d = texture2D(dep, u).r - focus; u = q + off * d * strength; }   // fixed-point parallax: near moves more than far
  vec3 c = texture2D(tex, u).rgb;
  c += (h(uv * 900.0) - 0.5) * grain * (1.0 - c);                // live film grain (the plate carries a still one)
  gl_FragColor = vec4(c, 1.0);
}`;
const load = (src: string) => new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => no(new Error(`PlateShot: cannot load ${src} (render it with tools/photoreal.mjs and keep it in public/)`)); i.src = src; });

export const PlateShot: React.FC<ShotProps> = ({shot, plate, depth, move = {}, overscan = 0.12, focus = 0.5, strength = 0.045, grain = 0.012, handheld = 0}) => {
  const {width, height} = useVideoConfig(), frame = useCurrentFrame(), {lt, d, fps} = useShotTime(shot), cv = React.useRef<HTMLCanvasElement>(null), gl = React.useRef<any>(null);
  const [h1] = React.useState(() => delayRender('plate-load'));
  React.useEffect(() => {
    let dead = false;
    // software WebGL can refuse a context while other tabs start theirs: retry (the render waits, it never draws a blank frame)
    const ctx = async () => { for (let i = 0; i < 40; i++) { const c = cv.current; const g = c && ((c.getContext('webgl', {preserveDrawingBuffer: true, antialias: false}) || c.getContext('experimental-webgl', {preserveDrawingBuffer: true})) as WebGLRenderingContext | null); if (g) return g; await new Promise((r) => setTimeout(r, 250)); } throw new Error('PlateShot: WebGL is not available (set REMOTION_GL=angle, or use swangle without a GPU)'); };
    Promise.all([load(staticFile(plate)), load(staticFile(depth)), ctx()]).then(([a, b, g]) => {
      if (dead || !cv.current) return; const mk = (t: number, im: HTMLImageElement) => { const x = g.createTexture(); g.activeTexture(g.TEXTURE0 + t); g.bindTexture(g.TEXTURE_2D, x); g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, im); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); };
      mk(0, a); mk(1, b); const sh = (ty: number, s: string) => { const o = g.createShader(ty)!; g.shaderSource(o, s); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o) || 'shader'); return o; };
      const pr = g.createProgram()!; g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr); g.useProgram(pr);
      const bf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, bf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW); const loc = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      g.uniform1i(g.getUniformLocation(pr, 'tex'), 0); g.uniform1i(g.getUniformLocation(pr, 'dep'), 1); gl.current = {g, pr}; continueRender(h1);
    }).catch((e) => { throw e; });
    return () => { dead = true; };
  }, [plate, depth]);
  React.useEffect(() => {
    if (!gl.current) return; const {g, pr} = gl.current, kind = move.kind || 'push', amt = move.amount ?? 0.5, f0 = move.from ?? 0, f1 = move.to ?? 1, k = f0 + (f1 - f0) * p(lt, 0, Math.max(0.2, d), (E as any)[move.ease || 'inOutSoft'] || E.inOutSoft), a = amt * k;
    const sgn = /left|down/.test(kind) ? -1 : 1, zoom = kind === 'push' ? 1 + 0.12 * a : kind === 'pull' ? 1 + 0.12 * (amt - a) : 1, o = [/truck|orbit/.test(kind) ? sgn * (a - amt / 2) * 2 : 0, /crane/.test(kind) ? sgn * (a - amt / 2) * 2 : 0];
    const t = frame / fps, hx = handheld ? (Math.sin(t * 1.9) + 0.5 * Math.sin(t * 4.1 + 1)) * 0.004 * handheld : 0, hy = handheld ? (Math.sin(t * 2.3 + 2) + 0.5 * Math.sin(t * 3.7)) * 0.004 * handheld : 0;
    const U = (n: string) => g.getUniformLocation(pr, n); g.viewport(0, 0, width, height);
    g.uniform2f(U('off'), o[0] + hx * 6, o[1] + hy * 6); g.uniform1f(U('zoom'), zoom + Math.abs(hx) * 2); g.uniform1f(U('focus'), focus); g.uniform1f(U('strength'), strength); g.uniform1f(U('grain'), grain); g.uniform1f(U('ov'), overscan); g.uniform1f(U('seed'), frame * 1.618); g.uniform1f(U('aspect'), width / height); g.uniform2f(U('center'), move.center?.[0] ?? 0.5, move.center?.[1] ?? 0.5);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  }, [frame, lt, d, move.kind, move.amount, focus, strength]);
  return <AbsoluteFill><canvas ref={cv} width={width} height={height} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
