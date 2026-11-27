// A 3D look as DATA (a style pack's `ink_look`, schema in docs/INKBEAT.md): moods (light, sky, grade) + a hero + a set built from primitives.
// The Style Studio writes this JSON, renders stills of it, the user picks and refines, and the pack stores it. No code is written for a new look.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Character3D, headOf } from "../inkbeat/char/Character3D";
import { inkScale } from "../inkbeat/char/material";
import { CastLight } from "../inkbeat/core/castLight";
import { useFonts } from "../inkbeat/core/frame";
import { boxG, canvasTex, coneG, coreMat, cylG, Label, M, sphG, torG } from "../inkbeat/core/kit";
import { mapMaterial } from "../inkbeat/mat/materials";
import { MOODS, moodOf } from "../inkbeat/core/moods";
import { aim } from "../inkbeat/core/rig";
import { View } from "../inkbeat/core/View";
import type { V3 } from "../inkbeat/types";
import { HEROES } from "./cast";
import "./looks";
import { AnimeStreet, Kitchen, Playroom, Studio } from "./Sets";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const merge = (a: any, b: any): any => {
  if (b === undefined) return a;
  if (Array.isArray(b) || typeof b !== "object" || b === null) return b;
  const o: any = { ...(a || {}) };
  for (const k of Object.keys(b)) o[k] = merge(a?.[k], b[k]);
  return o;
};
export type Prop = { k: "box" | "round" | "cyl" | "sph" | "cone" | "tor" | "label" | "glow" | "panel"; cast?: boolean; pat?: "rug" | "stripes" | "canvas" | "waves" | "checker" | "planks" | "scales"; c2?: string; c3?: string; n?: number; s?: number[]; p?: V3; r?: V3; c?: string; tex?: any; ts?: number; rad?: number; sc?: V3; e?: string; ei?: number; anim?: "bob" | "spin" | "sway"; repeat?: { n: number; step: V3; colors?: string[] }; text?: string; w?: number; h?: number; fg?: string; bg?: string; k2?: number };
export type InkLook = {
  moods: Record<string, { base: string; patch?: any }>;
  ink?: number; sky?: boolean; blur?: number;
  hero?: { base?: keyof typeof HEROES; [k: string]: any };
  set?: { preset?: "playroom" | "studio" | "street" | "kitchen"; floor?: { c: string; tex?: string; ts?: number; size?: [number, number]; disc?: boolean }; walls?: { c: string; tex?: string; sides?: ("back" | "left" | "right")[]; h?: number; w?: number }; ceiling?: string; props?: Prop[]; lights?: { p: V3; color: string; intensity: number; distance?: number }[] };
};
/** register the look's moods (idempotent) and return the id of the first one */
export const registerLook = (L: InkLook): string[] => Object.entries(L.moods).map(([id, m]) => { const k = "c-" + id; MOODS[k] = merge(MOODS[m.base] ?? MOODS.day, m.patch || {}); return k; });
export const heroOf = (L: InkLook): any => { const { base = "pixar", ...o } = L.hero || {}; return merge((HEROES as any)[base], o); };


/** image patterns for `panel` props (drawn once on a canvas; lit like any other surface). c = base, c2 = second colour, c3 = accent, n = repeat count */
const drawPat = (g: CanvasRenderingContext2D, W: number, H: number, pat: string, c: string, c2: string, c3: string, n: number) => {
  g.fillStyle = c; g.fillRect(0, 0, W, H);
  if (pat === "stripes") { const w = W / n; g.fillStyle = c2; for (let i = 0; i < n; i += 2) g.fillRect(i * w, 0, w, H); }
  else if (pat === "checker") { const w = W / n; g.fillStyle = c2; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2) g.fillRect(x * w, y * w, w, w); }
  else if (pat === "planks") { const w = H / n; g.strokeStyle = c2; g.lineWidth = 3; for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(0, i * w); g.lineTo(W, i * w); g.stroke(); } g.globalAlpha = 0.25; g.fillStyle = c2; for (let i = 0; i < n * 6; i++) g.fillRect(((i * 97) % W), ((i * 53) % H), 40 + (i * 13) % 90, 2); g.globalAlpha = 1; }
  else if (pat === "canvas") { g.globalAlpha = 0.18; g.strokeStyle = c2; g.lineWidth = 1; for (let i = 0; i < W; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke(); } for (let i = 0; i < H; i += 4) { g.beginPath(); g.moveTo(0, i); g.lineTo(W, i); g.stroke(); } g.globalAlpha = 0.5; g.lineWidth = 3; const w = W / n; for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w, H); g.stroke(); } g.globalAlpha = 1; }
  else if (pat === "waves" || pat === "scales") { const r = W / n; g.strokeStyle = c2; g.lineWidth = 3; for (let y = 0; y < n * 2 + 1; y++) for (let x = 0; x < n + 1; x++) for (let k = 3; k >= 1; k--) { g.beginPath(); g.arc(x * r + (y % 2 ? r / 2 : 0), y * r * 0.5, (r / 2) * (k / 3) * 1.0, Math.PI, 0); g.fillStyle = k % 2 ? c2 : c; g.fill(); g.stroke(); } }
  else if (pat === "rug") {
    const b = W * 0.06; g.fillStyle = c2; g.fillRect(0, 0, W, b); g.fillRect(0, H - b, W, b); g.fillRect(0, 0, b, H); g.fillRect(W - b, 0, b, H);
    g.strokeStyle = c3; g.lineWidth = 4; g.strokeRect(b * 1.5, b * 1.5, W - b * 3, H - b * 3);
    const cx = W / 2, cy = H / 2, R = W * 0.34; g.fillStyle = c2; g.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.04) { const rr = R * (1 + 0.12 * Math.sin(a * n)); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.closePath(); g.fill(); g.strokeStyle = c3; g.lineWidth = 5; g.stroke();
    g.fillStyle = c3; g.beginPath(); g.arc(cx, cy, R * 0.45, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(cx, cy, R * 0.28, 0, 7); g.fill(); g.fillStyle = c3; g.beginPath(); g.arc(cx, cy, R * 0.12, 0, 7); g.fill();
    g.strokeStyle = c3; g.lineWidth = 2; for (let a = 0; a < Math.PI * 2; a += Math.PI / n) { g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5); g.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); g.stroke(); }
    g.fillStyle = c3; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(b * 0.5 + ((W - b) * i) / 11, b * 0.5, 4, 0, 7); g.fill(); g.beginPath(); g.arc(b * 0.5 + ((W - b) * i) / 11, H - b * 0.5, 4, 0, 7); g.fill(); }
  }
};

const rb = new Map<string, any>();
const rbG = (w: number, h: number, d: number, r = 0.07) => { const k = `${w}|${h}|${d}|${r}`; let g = rb.get(k); if (!g) { g = new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)); rb.set(k, g); } return g; };
const clampN = (a: any, n: number, d: number) => Array.from({ length: n }, (_, i) => (typeof a?.[i] === "number" ? Math.min(40, Math.max(0.005, a[i])) : d));

const Item: React.FC<{ o: Prop; i: number; t: number }> = ({ o, i, t }) => {
  const c = o.c ?? "#c8c8d0", p0 = o.p ?? [0, 0, 0], rp = o.repeat, col = rp?.colors?.length ? rp.colors[i % rp.colors.length] : c;
  const p: V3 = [p0[0] + (rp?.step[0] ?? 0) * i, p0[1] + (rp?.step[1] ?? 0) * i, p0[2] + (rp?.step[2] ?? 0) * i];
  if (o.anim === "bob") p[1] += 0.06 * Math.sin(t * 1.6 + i);
  const r: V3 = [o.r?.[0] ?? 0, (o.r?.[1] ?? 0) + (o.anim === "spin" ? t * 0.8 : o.anim === "sway" ? 0.12 * Math.sin(t + i) : 0), o.r?.[2] ?? 0], s = o.s || [];
  const common = { c: col, p, r, tex: o.tex, ts: o.ts, s: o.sc, e: o.e, ei: o.ei, cast: o.cast !== false };   // e/ei: a lit, coloured emissive (lanterns, signs). `glow` is an unlit HDR core: it blooms toward white, use it for flames and bulbs only
  switch (o.k) {
    case "box": { const [w, h, d] = clampN(s, 3, 1); return <M g={boxG(w, h, d)} {...common} />; }
    case "round": { const [w, h, d] = clampN(s, 3, 1); return <M g={rbG(w, h, d, o.rad)} {...common} />; }
    case "cyl": { const [a, b, h] = clampN(s, 3, 0.5); return <M g={cylG(a, b, h, 32)} {...common} />; }
    case "sph": return <M g={sphG(clampN(s, 1, 0.5)[0], 24)} {...common} />;
    case "cone": { const [a, h] = clampN(s, 2, 1); return <M g={coneG(a, h, 20)} {...common} />; }
    case "tor": { const [a, b] = clampN(s, 2, 0.1); return <M g={torG(a, b)} {...common} />; }
    case "panel": { const [w, h, d] = clampN(s, 3, 1), key = ["pat", o.pat, col, o.c2, o.c3, o.n].join("|"), map = canvasTex(key, 512, 512, (g, W, H) => drawPat(g, W, H, o.pat || "canvas", col, o.c2 || "#222222", o.c3 || "#dddddd", o.n || 8)); return <mesh geometry={boxG(w, h, d)} material={mapMaterial(map)} position={p} rotation={r} receiveShadow castShadow={false} />; }
    case "glow": return <mesh geometry={sphG(clampN(s, 1, 0.2)[0], 14)} material={coreMat(col, o.k2 ?? 0.95)} position={p} scale={o.sc} />;
    case "label": return <Label text={o.text ?? ""} p={p} r={r} w={o.w ?? 1} h={o.h ?? 0.3} fg={o.fg} bg={o.bg} />;
  }
  return null;
};
/** a room or stage from primitives: floor, walls, ceiling, props, practical lights. Pure in t. */
export const ParamSet: React.FC<{ spec: NonNullable<InkLook["set"]>; t: number }> = ({ spec, t }) => {
  const f = spec.floor, w = spec.walls, [fw, fd] = f?.size ?? [16, 16], wh = w?.h ?? 5, ww = w?.w ?? fw, sides = w?.sides ?? ["back", "left", "right"];
  return (
    <group>
      {f ? (f.disc ? <M g={cylG(fw / 2, fw / 2, 0.2, 64)} c={f.c} tex={f.tex as any} ts={f.ts} p={[0, -0.1, -2]} cast={false} /> : <M g={boxG(fw, 0.2, fd)} c={f.c} tex={f.tex as any} ts={f.ts} p={[0, -0.1, -2]} cast={false} />) : null}
      {w && sides.includes("back") ? <M g={boxG(ww, wh, 0.2)} c={w.c} tex={w.tex as any} p={[0, wh / 2, -2 - fd / 2]} cast={false} /> : null}
      {w && sides.includes("left") ? <M g={boxG(0.2, wh, fd)} c={w.c} tex={w.tex as any} p={[-fw / 2, wh / 2, -2]} cast={false} /> : null}
      {w && sides.includes("right") ? <M g={boxG(0.2, wh, fd)} c={w.c} tex={w.tex as any} p={[fw / 2, wh / 2, -2]} cast={false} /> : null}
      {spec.ceiling ? <M g={boxG(fw, 0.2, fd)} c={spec.ceiling} p={[0, wh + 0.1, -2]} cast={false} /> : null}
      {(spec.props || []).slice(0, 80).flatMap((o, j) => Array.from({ length: Math.min(40, Math.max(1, o.repeat?.n ?? 1)) }, (_, i) => <Item key={`${j}-${i}`} o={o} i={i} t={t} />))}
      {(spec.lights || []).slice(0, 6).map((l, i) => <pointLight key={i} position={l.p} color={l.color} intensity={l.intensity} distance={l.distance ?? 8} decay={2} />)}
    </group>
  );
};
const PRESET: Record<string, React.FC<{ t: number }>> = { playroom: Playroom, studio: Studio, street: AnimeStreet, kitchen: Kitchen };
export const LookSetOf: React.FC<{ look: InkLook; t: number }> = ({ look, t }) => {
  const s = look.set;
  if (!s) return null;
  if (s.preset) { const P = PRESET[s.preset]; return P ? <P t={t} /> : null; }
  return <ParamSet spec={s} t={t} />;
};

/** Studio preview frame of a look: wide / medium / close in 16:9 (L) or 9:16 (P). Props come from `remotion still --props=<file>`. */
export type CustomFrame = "wide" | "medium" | "close";
export const CustomLook: React.FC<{ look: InkLook; frame: CustomFrame; layout: "L" | "P"; mood?: number }> = ({ look, frame, layout, mood = 0 }) => {
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: "#1a1220" }} />;
  const ids = registerLook(look), m = moodOf(ids[Math.min(mood, ids.length - 1)]), H = heroOf(look), t = 1.6, at: V3 = [-0.4, 0, -1.8], head = headOf(at, H.height, H.build), h = H.height;
  inkScale.v = look.ink ?? 0;
  const k = layout === "P" ? 1.4 : 1, hy = h * 0.8;
  const cams: Record<CustomFrame, { from: V3; to: V3 | "head"; fov: number; face: number }> = {
    wide: { from: [0.3, hy + 0.3, 4.0], to: [0, h * 0.62, -2.4], fov: 52, face: layout === "P" ? 0.4 : 0.5 },
    medium: { from: [1.1, hy, 0.9], to: "head", fov: 40, face: 0.42 },
    close: { from: [0.55, h * 0.9, -0.35], to: "head", fov: 32, face: 0.45 },
  };
  const c = cams[frame], cam = aim(c.from, c.to === "head" ? head : c.to, c.fov * k, c.face), size = layout === "P" ? [1080, 1920] : [1920, 1080];
  return (
    <AbsoluteFill style={{ background: "#1a1220" }}>
      <View mood={m} cam={cam} t={t} focus={c.to === "head" ? head : c.to} blur={look.blur ?? 1.4} sky={look.sky ?? true} width={size[0]} height={size[1]}>
        <LookSetOf look={look} t={t} />
        <Character3D {...H} position={at} yaw={0.5} t={t} face={{ eyes: "open", mouth: "smile", brows: "neutral" }} pose={{ armL: [10, 10], armR: [40, 50], armRFwd: 20 }} faceCamera={cam.pos} />
        <CastLight at={head} cam={cam.pos} mood={m} />
      </View>
    </AbsoluteFill>
  );
};
