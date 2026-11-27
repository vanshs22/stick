// Four small sets, one per style. Every key fact in a story is an object; everything dressed in three depth layers; nothing random (pure in t).
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import React from "react";
import * as THREE from "three";
import { boxG, coreMat, cylG, Label, M, sphG, torG } from "../inkbeat/core/kit";
import type { V3 } from "../inkbeat/types";
import { Barrel, Crate, House, LampPost, Awning, Planter } from "../demo/Street";

const rb = new Map<string, THREE.BufferGeometry>();
/** rounded box: no sharp edges anywhere (the kids set uses only this) */
const rbG = (w: number, h: number, d: number, r = 0.06) => { const k = `${w}|${h}|${d}|${r}`; let g = rb.get(k); if (!g) { g = new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)); rb.set(k, g); } return g; };
const R: React.FC<{ g: [number, number, number]; c: string; p: V3; r?: V3; rad?: number; tex?: any }> = ({ g, c, p, r, rad = 0.07, tex }) => <M g={rbG(g[0], g[1], g[2], rad)} c={c} p={p} r={r} tex={tex} />;

// ---------------------------------------------------------------- kidsong: a playroom
const PRIM = ["#ff5a5a", "#ffb84a", "#ffe14a", "#5ad07a", "#4aa8ff", "#a06af0"];
export const Playroom: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <M g={rbG(14, 0.2, 14, 0.05)} c="#e8a868" tex="planks" ts={1.6} p={[0, -0.1, -2]} cast={false} />
    <M g={cylG(2.1, 2.1, 0.05, 40)} c="#7ad8ff" tex="fabric" p={[0, 0.025, -1.4]} cast={false} />
    <M g={cylG(1.4, 1.4, 0.06, 40)} c="#ffe14a" tex="fabric" p={[0, 0.05, -1.4]} cast={false} />
    <M g={boxG(14, 5, 0.2)} c="#ffd23a" tex="plaster" p={[0, 2.5, -5.2]} cast={false} />
    <M g={boxG(0.2, 5, 14)} c="#ff8a7a" tex="plaster" p={[-6.2, 2.5, -2]} cast={false} />
    <M g={boxG(0.2, 5, 14)} c="#5ad0a0" tex="plaster" p={[6.2, 2.5, -2]} cast={false} />
    <M g={boxG(14, 0.2, 14)} c="#fff8ee" p={[0, 5.1, -2]} cast={false} />
    {/* arched window with a sun */}
    <M g={cylG(1.3, 1.3, 0.1, 32, false, 0, Math.PI)} c="#9ae0ff" p={[1.8, 2.6, -5.05]} r={[Math.PI / 2, 0, Math.PI / 2]} cast={false} />
    <M g={rbG(2.6, 1.6, 0.1)} c="#9ae0ff" p={[1.8, 1.8, -5.05]} cast={false} />
    <mesh geometry={sphG(0.34, 20)} material={coreMat("#ffe14a", 0.95)} position={[2.3, 2.9, -4.98]} />
    {/* block tower with letters, a ball, a toy train, a teddy, a shelf of plushies, balloons */}
    {["A", "B", "C"].map((l, i) => (
      <group key={l} position={[-2.2 + (i === 2 ? 0.1 : 0), 0.3 + i * 0.6, -2.6]} rotation={[0, i * 0.25, 0]}>
        <R g={[0.6, 0.6, 0.6]} c={PRIM[i * 2]} p={[0, 0, 0]} rad={0.1} />
        <Label text={l} p={[0, 0, 0.305]} w={0.4} h={0.4} fg="#ffffff" bg="none" font={0.85} />
      </group>
    ))}
    <M g={sphG(0.32, 24)} c="#ff5a5a" p={[-1.0, 0.32, -1.2]} />
    <M g={torG(0.32, 0.03)} c="#ffffff" p={[-1.0, 0.32, -1.2]} r={[Math.PI / 2, 0, 0.3]} />
    {[0, 1, 2].map((i) => <R key={i} g={[0.7, 0.4, 0.4]} c={PRIM[(i * 2 + 1) % 6]} p={[1.0 + i * 0.78, 0.3, -0.7]} rad={0.12} />)}
    {[0, 1, 2].map((i) => <group key={i}><M g={cylG(0.11, 0.11, 0.06, 16)} c="#4a4a62" p={[1.0 + i * 0.78 - 0.2, 0.1, -0.5]} r={[Math.PI / 2, 0, 0]} /><M g={cylG(0.11, 0.11, 0.06, 16)} c="#4a4a62" p={[1.0 + i * 0.78 + 0.2, 0.1, -0.5]} r={[Math.PI / 2, 0, 0]} /></group>)}
    <M g={sphG(0.5, 24)} c="#c8905a" tex="fabric" p={[3.6, 0.55, -2.2]} /><M g={sphG(0.34, 20)} c="#c8905a" tex="fabric" p={[3.6, 1.2, -2.2]} />
    <M g={sphG(0.12, 12)} c="#c8905a" p={[3.4, 1.5, -2.2]} /><M g={sphG(0.12, 12)} c="#c8905a" p={[3.8, 1.5, -2.2]} />
    <R g={[2.4, 0.1, 0.5]} c="#ffb84a" p={[-4.2, 1.5, -4.8]} rad={0.04} /><R g={[2.4, 0.1, 0.5]} c="#ffb84a" p={[-4.2, 2.4, -4.8]} rad={0.04} />
    {[0, 1, 2, 3, 4].map((i) => <M key={i} g={sphG(0.22, 16)} c={PRIM[i]} p={[-5.0 + i * 0.5, 1.75 + (i % 2) * 0.9, -4.7]} />)}
    {[0, 1, 2].map((i) => <group key={i} position={[4.6 + i * 0.4, 0, -4]}><M g={cylG(0.01, 0.01, 2.2 + i * 0.3, 6)} c="#ffffff" p={[0, 1.2 + i * 0.15, 0]} cast={false} /><M g={sphG(0.3, 18)} c={PRIM[(i * 2) % 6]} p={[0, 2.4 + i * 0.3 + 0.06 * Math.sin(t * 1.4 + i), 0]} s={[1, 1.15, 1]} /></group>)}
    {[0, 1, 2, 3].map((i) => <M key={i} g={sphG(0.04, 8)} c="#ffffff" p={[-1.6 + i * 1.1, 3.4 + 0.1 * Math.sin(t + i * 2), -4.9]} cast={false} />)}
  </group>
);

// ---------------------------------------------------------------- zackd: a seamless studio with a clay cutaway
/** a layered clay cross-section of a body part on a pedestal: skin / fat / muscle / bone, opened 270 degrees; `inside` is the glowing subject of the story */
export const Cutaway: React.FC<{ p: V3; s?: number; t: number; tag?: string }> = ({ p, s = 1, t, tag }) => {
  // a cross-section seen face-on: concentric discs, each ring a little taller than the one outside it so the layers read as depth
  const layers: [number, string, number][] = [[1.0, "#d8a07a", 0.5], [0.86, "#f2d06a", 0.56], [0.68, "#c8484a", 0.62], [0.36, "#f4ead2", 0.7]];
  return (
    <group position={p} scale={s}>
      <M g={cylG(0.9, 1.05, 0.3, 40)} c="#e8e4f4" p={[0, 0.15, 0]} />
      <group position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {layers.map(([r, c, h], i) => <M key={i} g={cylG(r, r, h, 48)} c={c} tex={i === 2 ? "fabric" : undefined} p={[0, 0, 0]} />)}
        <mesh geometry={sphG(0.22, 20)} material={coreMat("#ff6aa8", 0.95 + 0.05 * Math.sin(t * 2))} position={[0, 0.42, 0]} scale={[1.2, 0.5, 1.2 + 0.05 * Math.sin(t * 2)]} />
      </group>
      {tag ? <Label text={tag} p={[0, 0.16, 1.08]} w={1.3} h={0.28} fg="#1a1416" bg="#ffffff" font={0.7} /> : null}
    </group>
  );
};
export const Studio: React.FC<{ t: number; tag?: string }> = ({ t, tag = "STOMACH" }) => (
  <group>
    <M g={cylG(8, 8, 0.2, 64)} c="#e4e0f6" p={[0, -0.1, -2]} cast={false} />
    <Cutaway p={[0.6, 0, -2.6]} s={1.25} t={t} tag={tag} />
    <M g={cylG(0.45, 0.5, 0.18, 24)} c="#e8e4f4" p={[-2.2, 0.09, -3.2]} />
    <M g={sphG(0.34, 24)} c="#ff6aa8" p={[-2.2, 0.55, -3.2]} />
  </group>
);

// ---------------------------------------------------------------- anime: a street under a big sky, power lines, petals
export const AnimeStreet: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <M g={boxG(70, 0.2, 70)} c="#8c8aa8" tex="stone" ts={1.4} p={[0, -0.1, 0]} cast={false} />
    <M g={boxG(30, 0.16, 3.2)} c="#d8ccbc" tex="stone" p={[0, 0.08, -3.6]} cast={false} />
    <House p={[-4.2, 0.16, -8]} w={5.4} h={5.0} d={4} wall="#f4e0c8" tex="none" roof="#3a5a8a" windows={2} lit={[0]} />
    <House p={[1.8, 0.16, -8.4]} w={5.6} h={6.6} d={4.2} wall="#f2e4cc" tex="none" roof="#2a4a7a" windows={3} />
    <House p={[8, 0.16, -7.8]} w={5} h={4.6} d={4} wall="#d0e0e8" tex="none" roof="#5a3a6a" windows={2} />
    <Awning p={[1.8, 2.7, -6.3]} w={5.0} color="#3a78c8" />
    <M g={cylG(0.07, 0.09, 6.2, 10)} c="#4a4258" tex="metal" p={[-3.4, 3.1, -2.2]} />
    <M g={boxG(1.9, 0.07, 0.07)} c="#4a4258" p={[-3.4, 5.8, -2.2]} />
    {[-0.7, 0, 0.7].map((o, i) => <M key={i} g={boxG(15, 0.008, 0.008)} c="#2a2640" p={[4.1, 5.6 - i * 0.02 + (i === 1 ? -0.1 : 0), -2.2 + o * 0.1]} cast={false} />)}
    <LampPost p={[2.8, 0.16, -2.4]} on={0} />
    <Barrel p={[-1.2, 0.16, -4.6]} /><Planter p={[5.2, 0.16, -4.6]} /><Crate p={[3.8, 0.16, -4.6]} s={0.5} yaw={0.3} />
  </group>
);

// ---------------------------------------------------------------- pixar: a warm kitchen at evening
export const Kitchen: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <M g={boxG(11, 0.2, 10)} c="#c8a078" tex="planks" ts={1.4} p={[0, -0.1, -1.5]} cast={false} />
    <M g={boxG(11, 4.6, 0.2)} c="#5f9aa6" tex="plaster" p={[0, 2.3, -5.6]} cast={false} />
    <M g={boxG(0.2, 4.6, 10)} c="#6aa4a8" tex="plaster" p={[-5.6, 2.3, -1.5]} cast={false} />
    <M g={boxG(0.2, 4.6, 10)} c="#6aa4a8" tex="plaster" p={[5.6, 2.3, -1.5]} cast={false} />
    <M g={boxG(11, 0.2, 10)} c="#4a7a8a" p={[0, 4.7, -1.5]} cast={false} />
    <M g={boxG(2.0, 1.6, 0.06)} c="#5a8ae8" p={[2.4, 2.5, -5.45]} cast={false} />
    <M g={boxG(2.2, 0.08, 0.14)} c="#f2ead8" p={[2.4, 1.66, -5.4]} /><M g={boxG(0.06, 1.6, 0.1)} c="#f2ead8" p={[2.4, 2.5, -5.4]} />
    <mesh geometry={sphG(0.2, 14)} material={coreMat("#fff0c8", 0.9)} position={[3.0, 3.0, -5.4]} />
    <M g={boxG(5.0, 1.0, 0.9)} c="#b8704a" tex="wood" p={[-1.2, 0.5, -4.8]} /><M g={boxG(5.2, 0.1, 1.0)} c="#f2ead8" tex="stone" p={[-1.2, 1.05, -4.8]} />
    <M g={boxG(2.4, 0.08, 1.1)} c="#9a6a44" tex="wood" p={[1.4, 0.82, -2.6]} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <M key={i} g={boxG(0.09, 0.8, 0.09)} c="#7a4a2e" p={[1.4 + a * 1.1, 0.4, -2.6 + b * 0.45]} />)}
    {[0, 1, 2].map((i) => <M key={i} g={sphG(0.2, 16)} c="#d8a050" p={[0.7 + i * 0.5, 0.98, -2.6]} s={[1.6, 0.7, 0.9]} />)}
    <M g={cylG(0.09, 0.07, 0.12, 14)} c="#f2ead8" p={[2.5, 0.92, -2.5]} />
    {[0, 1, 2, 3].map((i) => <M key={i} g={cylG(0.12, 0.12, 0.3, 14)} c={["#e8a23a", "#d8574a", "#7ab04a", "#f2ead8"][i]} p={[-3.1 + i * 0.42, 1.25, -4.8]} />)}
    <M g={boxG(2.6, 0.08, 0.4)} c="#9a6a44" tex="wood" p={[-3.2, 2.8, -5.4]} />
    {[0, 1, 2, 3, 4].map((i) => <M key={i} g={sphG(0.17, 14)} c={["#e8a23a", "#d8574a", "#f2ead8", "#7ab04a", "#c8905a"][i]} p={[-4.2 + i * 0.5, 3.05, -5.4]} />)}
    {[-2.4, 0.6].map((x, i) => <group key={i}><M g={cylG(0.01, 0.01, 1.2, 6)} c="#2a2a32" p={[x, 4.0, -2.6]} cast={false} /><M g={cylG(0.07, 0.34, 0.3, 20)} c="#e8a23a" p={[x, 3.3 + 0.01 * Math.sin(t + i), -2.6]} /><mesh geometry={sphG(0.12, 12)} material={coreMat("#ffd890", 0.9)} position={[x, 3.28, -2.6]} /><pointLight position={[x, 3.1, -2.4]} color="#ffb860" intensity={5} distance={7} decay={2} /></group>)}
    <M g={cylG(1.4, 1.4, 0.03, 36)} c="#d8574a" tex="fabric" p={[0, 0.015, -1.2]} cast={false} />
    {[0, 1, 2].map((i) => <M key={i} g={sphG(0.1 + i * 0.02, 10)} c="#f2ead8" p={[2.5 + Math.sin(t * 0.9 + i) * 0.04, 1.2 + i * 0.22 + (t * 0.2 % 0.3), -2.5]} s={[1, 0.8, 1]} cast={false} />)}
  </group>
);
