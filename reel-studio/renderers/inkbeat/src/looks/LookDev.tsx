// Look-dev frames for the four 3D styles: the same camera grammar (wide establishing, medium, close-up) in each look, so the looks can be judged side by side.
//   Look-<style>-<wide|medium|close>   style = kidsong | zackd | anime | pixar
import React from "react";
import { AbsoluteFill } from "remotion";
import { Character3D, headOf } from "../inkbeat/char/Character3D";
import { inkScale } from "../inkbeat/char/material";
import { CastLight } from "../inkbeat/core/castLight";
import { useFonts } from "../inkbeat/core/frame";
import { moodOf } from "../inkbeat/core/moods";
import { aim } from "../inkbeat/core/rig";
import { View } from "../inkbeat/core/View";
import type { V3 } from "../inkbeat/types";
import { HEROES } from "./cast";
import "./looks";
import { AnimeStreet, Kitchen, Playroom, Studio } from "./Sets";

type Frame = "wide" | "medium" | "close";
type Cam = { from: V3; at: V3 | "head"; fov: number; face: number };
export type StyleId = "kidsong" | "zackd" | "anime" | "pixar";
const S: Record<StyleId, { size: [number, number]; mood: string; ink: number; hero: V3; yaw: number; blur: number; face: any; pose: any; cams: Record<Frame, Cam>; sky: boolean }> = {
  kidsong: { size: [1920, 1080], mood: "kids-day", ink: 0, hero: [-0.3, 0, -1.4], yaw: 0.35, blur: 0.7, sky: false,
    face: { eyes: "open", mouth: "grin", brows: "raised" }, pose: { armL: [60, 30], armR: [95, 40], armRFwd: 25, headTilt: 5 },
    cams: { wide: { from: [0.1, 0.8, 2.6], at: [-0.2, 0.85, -1.8], fov: 50, face: 0.5 }, medium: { from: [0.9, 0.75, 1.5], at: "head", fov: 42, face: 0.42 }, close: { from: [0.5, 0.85, -0.1], at: "head", fov: 36, face: 0.45 } } },
  zackd: { size: [1080, 1920], mood: "zd-studio", ink: 0, hero: [-1.35, 0, -2.0], yaw: 0.6, blur: 1.6, sky: true,
    face: { eyes: "wide", mouth: "o", brows: "raised" }, pose: { armL: [10, 10], armR: [70, 60], armRFwd: 30 },
    cams: { wide: { from: [0.1, 1.5, 4.2], at: [-0.2, 1.3, -2.4], fov: 52, face: 0.46 }, medium: { from: [0.8, 1.45, 0.6], at: [0.6, 1.35, -2.6], fov: 46, face: 0.48 }, close: { from: [0.6, 1.45, -0.2], at: [0.6, 1.35, -2.6], fov: 42, face: 0.5 } } },
  anime: { size: [1920, 1080], mood: "anime-day", ink: 0.45, hero: [0.5, 0, -2.0], yaw: -0.45, blur: 0.9, sky: true,
    face: { eyes: "open", mouth: "smile", brows: "neutral", look: -0.4 }, pose: { armL: [8, 8], armR: [8, 8], headTilt: -4 },
    cams: { wide: { from: [-2.6, 0.45, 3.4], at: [0.5, 1.0, -2.0], fov: 56, face: 0.78 }, medium: { from: [2.4, 1.3, 1.3], at: "head", fov: 36, face: 0.42 }, close: { from: [1.3, 1.7, -0.3], at: "head", fov: 28, face: 0.45 } } },
  pixar: { size: [1920, 1080], mood: "pixar-warm", ink: 0, hero: [-0.7, 0, -1.7], yaw: 0.6, blur: 2.4, sky: false,
    face: { eyes: "open", mouth: "smile", brows: "worried", look: 0.3 }, pose: { armL: [14, 30], armR: [40, 70], armRFwd: 40, headTilt: -5 },
    cams: { wide: { from: [2.0, 1.7, 3.8], at: [0, 1.2, -2.6], fov: 50, face: 0.5 }, medium: { from: [1.9, 1.45, 0.9], at: "head", fov: 38, face: 0.42 }, close: { from: [1.1, 1.55, -0.2], at: "head", fov: 30, face: 0.45 } } },
};
export const STYLE_SIZES = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v.size])) as Record<StyleId, [number, number]>;

export type Layout = "L" | "P";
/** L = 16:9 landscape, P = 9:16 portrait. Cameras are authored for the style's native layout; the other layout re-lenses by the vertical-fov x1.4 rule and lifts the subject so faces sit at 30-45 percent of the height */
export const LAYOUT_SIZE: Record<Layout, [number, number]> = { L: [1920, 1080], P: [1080, 1920] };
export const LookDev: React.FC<{ style: StyleId; frame: Frame; layout?: Layout }> = ({ style, frame, layout }) => {
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: "#1a1220" }} />;
  const c = S[style], H = HEROES[style], m = moodOf(c.mood), t = 1.6;
  inkScale.v = c.ink;
  const head = headOf(c.hero, H.height, H.build as any);
  const lay: Layout = layout ?? (c.size[0] > c.size[1] ? "L" : "P"), native: Layout = c.size[0] > c.size[1] ? "L" : "P", size = LAYOUT_SIZE[lay];
  const k0 = c.cams[frame], fovK = lay === native ? 1 : lay === "P" ? 1.4 : 1 / 1.4, k = { ...k0, fov: k0.fov * fovK, face: lay === "P" && native === "L" ? Math.min(k0.face, 0.42) : k0.face };
  const cam = aim(k.from, k.at === "head" ? head : k.at, k.fov, k.face);
  const focus = k.at === "head" ? head : (k.at as V3);
  return (
    <AbsoluteFill style={{ background: "#1a1220" }}>
      <View mood={m} cam={cam} t={t} focus={focus} blur={c.blur} sky={c.sky} width={size[0]} height={size[1]}>
        {style === "kidsong" ? <Playroom t={t} /> : style === "zackd" ? <Studio t={t} /> : style === "anime" ? <AnimeStreet t={t} /> : <Kitchen t={t} />}
        <Character3D {...(H as any)} position={c.hero} yaw={c.yaw} t={t} face={c.face} pose={c.pose} faceCamera={cam.pos} />
        <CastLight at={head} cam={cam.pos} mood={m} />
      </View>
    </AbsoluteFill>
  );
};
