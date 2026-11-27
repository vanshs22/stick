// The hunter's den: ONE interior for the whole BugHunter story (few locations, many framings). Every key fact of the
// script is a physical object with a painted tag: a shelf of skills, a jar of stars, a board of commands, a cabinet of
// reports, a gate with a sign, a certificate. All motion is a pure function of t.
import React from "react";
import * as THREE from "three";
import { boxG, coreMat, cylG, h1, Label, M, sphG } from "../inkbeat/core/kit";
import type { V3 } from "../inkbeat/types";
import { Window } from "../demo/Street";

/** where the key objects are (the plan aims cameras at these) */
export const DEN = {
  hero: [-0.9, 0, -1.3] as V3,
  shelf: [-2.6, 1.7, -3.85] as V3,
  jar: [-2.55, 1.0, -1.2] as V3,
  laptop: [1.4, 1.0, -2.7] as V3,
  board: [2.2, 2.6, -3.9] as V3,
  cabinet: [3.3, 0.9, -2.9] as V3,
  gate: [0.45, 1.0, -1.3] as V3,
  cert: [4.05, 1.9, -1.2] as V3,
  window: [0.1, 2.4, -3.95] as V3,
};

const COLS = ["#d8574a", "#e8a23a", "#4aa0a8", "#6a62c8", "#7ab04a", "#d86aa0", "#3a78c8", "#c8c04a"];
const star = (r: number) => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return new THREE.ExtrudeGeometry(s, { depth: r * 0.4, bevelEnabled: false });
};
const STAR = star(0.07);

const Shelf: React.FC<{ pop: number; popIdx: number[]; glow: number; tag: boolean }> = ({ pop, popIdx, glow, tag }) => (
  <group position={DEN.shelf}>
    <M g={boxG(3.0, 3.0, 0.5)} c="#5a3e34" tex="wood" p={[0, 0, 0]} />
    {[0, 1, 2, 3].map((r) => (
      <group key={r} position={[0, -1.15 + r * 0.74, 0.27]}>
        <M g={boxG(2.8, 0.06, 0.5)} c="#7a5a44" tex="wood" p={[0, -0.36, 0]} />
        {Array.from({ length: 14 }, (_, i) => {
          const k = r * 14 + i, hh = 0.42 + h1(k + 3) * 0.24, w = 0.12 + h1(k + 9) * 0.06, special = r === 2 && popIdx.includes(i);
          const out = special ? pop : 0;
          return (
            <group key={i} position={[-1.3 + i * 0.2, 0, out * 0.34]}>
              <M g={boxG(w, hh, 0.34)} c={COLS[(k * 3) % COLS.length]} tex="paper" p={[0, -0.33 + hh / 2, 0]} e={special && glow > 0 ? "#ffb040" : undefined} ei={special ? glow * 0.9 : 0} />
            </group>
          );
        })}
      </group>
    ))}
    {tag ? <Label text="80+ SKILLS" p={[0, 1.78, 0.27]} w={2.0} h={0.42} fg="#f4ead6" bg="#c8452f" font={0.62} /> : null}
  </group>
);

const StarJar: React.FC<{ t: number; tag: boolean }> = ({ t, tag }) => (
  <group position={[DEN.jar[0], 0, DEN.jar[2]]}>
    <M g={cylG(0.34, 0.36, 0.7, 20)} c="#8a5a3a" tex="wood" p={[0, 0.35, 0]} />
    <M g={cylG(0.36, 0.38, 0.06, 20)} c="#6a4430" tex="wood" p={[0, 0.72, 0]} />
    <M g={cylG(0.28, 0.28, 0.6, 20)} c="#cfe8ff" op={0.35} p={[0, 1.05, 0]} cast={false} />
    {Array.from({ length: 22 }, (_, i) => {
      const a = h1(i + 20) * 6.28, rr = 0.18 * Math.sqrt(h1(i + 40)), y = 0.82 + h1(i + 60) * 0.42;
      return <mesh key={i} geometry={STAR} material={coreMat("#ffc21a", 0.85 + 0.15 * Math.sin(t * 3 + i))} position={[Math.cos(a) * rr, y, Math.sin(a) * rr]} rotation={[0, h1(i) * 6, h1(i + 5) * 0.8]} />;
    })}
    <M g={cylG(0.26, 0.26, 0.07, 20)} c="#8a5a3a" p={[0, 1.38, 0]} />
    {tag ? <Label text="8K STARS" p={[0, 0.4, 0.352]} w={0.52} h={0.2} fg="#1a1416" bg="#ffc21a" font={0.6} /> : null}
  </group>
);

const Board: React.FC<{ t: number; tag: boolean }> = ({ t, tag }) => (
  <group position={DEN.board}>
    <M g={boxG(2.0, 1.4, 0.08)} c="#2a2540" tex="plaster" p={[0, 0, 0]} />
    {Array.from({ length: 15 }, (_, i) => {
      const cx = i % 5, cy = Math.floor(i / 5), on = 0.7 + 0.3 * Math.max(0, Math.sin(t * 2.2 - i * 0.5));
      return <mesh key={i} geometry={boxG(0.28, 0.26, 0.04)} material={coreMat(COLS[i % COLS.length], on)} position={[-0.8 + cx * 0.4, 0.28 - cy * 0.36, 0.06]} />;
    })}
    {tag ? <Label text="15 COMMANDS" p={[0, 0.92, 0.01]} w={1.8} h={0.34} fg="#f4ead6" bg="#c8452f" font={0.62} /> : null}
  </group>
);

const Cabinet: React.FC<{ tag: boolean }> = ({ tag }) => (
  <group position={[DEN.cabinet[0], 0, DEN.cabinet[2]]}>
    <M g={boxG(0.7, 1.7, 0.6)} c="#6a7a8a" tex="metal" p={[0, 0.85, 0]} />
    {[0.3, 0.72, 1.14].map((y) => (
      <group key={y}>
        <M g={boxG(0.6, 0.42, 0.04)} c="#8a9aaa" tex="metal" p={[0, y, 0.31]} />
        <M g={boxG(0.2, 0.04, 0.05)} c="#2a2a32" p={[0, y + 0.1, 0.34]} />
      </group>
    ))}
    {tag ? <Label text="681 REPORTS" p={[0, 1.52, 0.325]} w={0.62} h={0.2} fg="#f4ead6" bg="#3a78c8" font={0.62} /> : null}
    {[0, 1, 2].map((i) => <M key={i} g={boxG(0.5, 0.05, 0.36)} c={["#f4ead6", "#e8dcb8", "#fff8e8"][i]} tex="paper" p={[0, 1.73 + i * 0.05, -0.02]} r={[0, i * 0.12, 0]} />)}
  </group>
);

/** the 7-question gate: a barrier arm that lifts by `open` (0..1) */
const Gate: React.FC<{ open: number }> = ({ open }) => (
  <group position={[DEN.gate[0], 0, DEN.gate[2]]}>
    <M g={boxG(0.3, 1.5, 0.3)} c="#2a2a32" tex="metal" p={[0, 0.75, 0]} />
    <M g={boxG(0.34, 0.1, 0.34)} c="#e8a23a" p={[0, 1.55, 0]} />
    <group position={[0.1, 1.0, 0.0]} rotation={[0, 0, open * 1.25]}>
      {Array.from({ length: 8 }, (_, i) => <M key={i} g={boxG(0.2, 0.1, 0.1)} c={i % 2 ? "#f4ead6" : "#d8302a"} p={[0.12 + i * 0.2, 0, 0]} />)}
    </group>
    <Label text="7 QUESTIONS" p={[0, 1.26, 0.16]} w={0.74} h={0.22} fg="#1a1416" bg="#ffc21a" font={0.62} />
    <M g={boxG(0.3, 0.1, 0.5)} c="#2a2a32" p={[0, 0.05, 0]} />
  </group>
);

const Laptop: React.FC<{ screen: string; lines?: string[] }> = ({ screen, lines = [] }) => (
  <group position={[DEN.laptop[0], 0.8, DEN.laptop[2]]} rotation={[0, -0.25, 0]}>
    <M g={boxG(0.9, 0.04, 0.6)} c="#bcb4c8" tex="metal" p={[0, 0.02, 0]} />
    <group position={[0, 0.04, -0.28]} rotation={[-0.2, 0, 0]}>
      <M g={boxG(0.9, 0.58, 0.03)} c="#bcb4c8" tex="metal" p={[0, 0.29, 0]} />
      <mesh geometry={boxG(0.82, 0.5, 0.01)} material={coreMat("#ff8a3a", 0.85)} position={[0, 0.29, 0.02]} />
      {screen ? <Label text={screen} p={[0, 0.29, 0.03]} w={0.78} h={0.2} fg="#1a1416" bg="none" font={0.5} /> : null}
    </group>
    {lines.length ? null : null}
  </group>
);

export const Den: React.FC<{ t: number; gate?: number; gateOn?: boolean; screen?: string; pop?: number; glow?: number; tags?: string[] }> = ({ t, gate = 0, gateOn = false, screen = "", pop = 0, glow = 0, tags = [] }) => (
  <group>
    {/* shell: never casts shadows (the key light would be blocked by the ceiling) */}
    <M g={boxG(9.2, 0.2, 9)} c="#7a5640" tex="planks" ts={1.4} p={[0, -0.1, -1]} cast={false} />
    <M g={boxG(3.6, 0.03, 2.6)} c="#9a3a52" tex="fabric" p={[0.4, 0.015, -1.3]} cast={false} />
    <M g={boxG(9.2, 4.4, 0.2)} c="#4a4a92" tex="plaster" p={[0, 2.2, -4.2]} cast={false} />
    <M g={boxG(0.2, 4.4, 9)} c="#52488a" tex="plaster" p={[-4.3, 2.2, -1]} cast={false} />
    <M g={boxG(0.2, 4.4, 9)} c="#52488a" tex="plaster" p={[4.3, 2.2, -1]} cast={false} />
    <M g={boxG(9.2, 0.2, 9)} c="#3a3470" p={[0, 4.5, -1]} cast={false} />
    <M g={boxG(9.2, 0.3, 0.1)} c="#2e2a58" p={[0, 0.15, -4.08]} cast={false} />
    <Window p={[DEN.window[0], DEN.window[1], DEN.window[2]]} w={1.6} h={1.5} frame="#e8dcc8" />
    <mesh geometry={sphG(0.18, 16)} material={coreMat("#fff2c8", 0.95)} position={[0.45, 2.75, -3.93]} />
    <Shelf pop={pop} popIdx={[2, 6, 10]} glow={glow} tag={tags.includes("shelf")} />
    <Board t={t} tag={tags.includes("commands")} />
    <Cabinet tag={tags.includes("reports")} />
    <StarJar t={t} tag={tags.includes("stars")} />
    {gateOn ? <Gate open={gate} /> : null}
    <Laptop screen={screen} />
    {/* desk + chair + lamp */}
    <M g={boxG(2.3, 0.08, 0.95)} c="#8a6a4a" tex="wood" p={[1.5, 0.74, -2.75]} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <M key={i} g={boxG(0.08, 0.72, 0.08)} c="#4a3626" p={[1.5 + a * 1.06, 0.36, -2.75 + b * 0.4]} />)}
    <M g={cylG(0.22, 0.24, 0.05, 16)} c="#2a2a32" tex="metal" p={[2.4, 0.81, -2.95]} />
    <M g={cylG(0.02, 0.02, 0.5, 8)} c="#2a2a32" p={[2.4, 1.06, -2.95]} />
    <mesh geometry={sphG(0.12, 14)} material={coreMat("#ffd890", 0.9)} position={[2.3, 1.36, -2.9]} />
    <pointLight position={[2.2, 1.5, -2.5]} color="#ffb860" intensity={6} distance={7} decay={2} />
    <M g={cylG(0.07, 0.07, 0.12, 12)} c="#d8574a" p={[0.7, 0.84, -2.6]} />
    <M g={boxG(0.4, 0.04, 0.3)} c="#f4ead6" tex="paper" p={[0.95, 0.8, -2.5]} r={[0, 0.3, 0]} />
    <M g={boxG(0.6, 0.08, 0.6)} c="#3a78c8" tex="fabric" p={[1.6, 0.46, -1.85]} />
    <M g={boxG(0.6, 0.6, 0.08)} c="#3a78c8" tex="fabric" p={[1.6, 0.78, -1.56]} />
    {/* dressing: plant, books, boxes, cables, bin, poster */}
    <M g={cylG(0.22, 0.17, 0.4, 14)} c="#a85a3a" tex="brick" p={[-3.7, 0.2, -1.8]} />
    {[0, 1, 2, 3, 4].map((i) => <M key={i} g={sphG(0.2 + (i % 2) * 0.07, 12)} c={i % 2 ? "#4a8a4a" : "#5aa04a"} p={[-3.7 + Math.sin(i) * 0.12, 0.62 + i * 0.12, -1.8 + Math.cos(i) * 0.1]} />)}
    {[0, 1, 2].map((i) => <M key={i} g={boxG(0.5 - i * 0.04, 0.1, 0.36)} c={COLS[i * 2]} tex="paper" p={[-1.7, 0.05 + i * 0.1, -3.4]} r={[0, 0.2 * i, 0]} />)}
    <M g={boxG(0.55, 0.5, 0.45)} c="#c8945a" tex="planks" p={[3.7, 0.25, -1.0]} r={[0, 0.3, 0]} />
    <M g={boxG(0.4, 0.4, 0.4)} c="#c8945a" tex="planks" p={[3.75, 0.7, -1.0]} r={[0, 0.7, 0]} />
    <M g={cylG(0.2, 0.17, 0.4, 14, true)} c="#4a4a52" tex="metal" p={[0.4, 0.2, -3.5]} />
    <M g={boxG(0.9, 1.2, 0.04)} c="#d8574a" tex="paper" p={[-3.97, 2.2, -0.2]} r={[0, 1.57, 0]} />
    <Label text="HUNT" p={[-3.94, 2.3, -0.2]} r={[0, 1.57, 0]} w={0.7} h={0.3} fg="#f4ead6" bg="none" font={0.8} />
    <M g={boxG(2.0, 0.04, 0.04)} c="#2a2a32" p={[0.9, 0.04, -0.3]} r={[0, 0.4, 0]} />
    {/* certificate on the right wall */}
    <group position={DEN.cert} rotation={[0, -Math.PI / 2, 0]}>
      <M g={boxG(1.5, 1.1, 0.05)} c="#6a4a30" tex="wood" />
      <M g={boxG(1.36, 0.96, 0.03)} c="#fff8e8" tex="paper" p={[0, 0, 0.03]} />
      <Label text="AUTHORIZED" p={[0, 0.2, 0.06]} w={1.2} h={0.3} fg="#c8302a" bg="none" font={0.7} />
      <Label text="ONLY" p={[0, -0.1, 0.06]} w={0.8} h={0.3} fg="#c8302a" bg="none" font={0.8} />
      <M g={cylG(0.12, 0.12, 0.03, 18)} c="#c8302a" p={[0.45, -0.32, 0.07]} r={[Math.PI / 2, 0, 0]} />
    </group>
  </group>
);
