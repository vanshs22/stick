// Story: the whole film from a resolved plan (plan.gen.ts, made by tools/ink/plan.mjs from ink-plan.json + the real word
// timings). Every shot = a set + a hero + a base lens; the camera is that lens folded through the shot's beats
// (core/rig.ts poseAt), with a push-through at each cut. Pure function of the frame.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CAST } from "../inkbeat/char/cast";
import { Character3D, headOf } from "../inkbeat/char/Character3D";
import { Captions, makeChunks } from "../inkbeat/core/captions";
import type { Word } from "../inkbeat/core/captions";
import { CastLight } from "../inkbeat/core/castLight";
import { subFrame, useFonts } from "../inkbeat/core/frame";
import { moodOf } from "../inkbeat/core/moods";
import { aim, near, poseAt, withShake } from "../inkbeat/core/rig";
import type { Cam } from "../inkbeat/core/rig";
import { SHOTS as PRESETS } from "../inkbeat/core/shots";
import { View } from "../inkbeat/core/View";
import type { V3 } from "../inkbeat/types";
import { Crate } from "../demo/Street";
import { Den } from "./Den";
import "../looks/looks";
import { HEROES } from "../looks/cast";
import { AnimeStreet, Kitchen, Playroom, Studio } from "../looks/Sets";
import { heroOf, LookSetOf, registerLook } from "../looks/custom";
import { inkScale } from "../inkbeat/char/material";
import { PLAN } from "./plan.gen";

type CamSpec = { preset?: "heroLow" | "medium" | "closeUp" | "wide"; side?: number; fov?: number; fill?: number; aim?: { from: V3; at: V3; fov: number; face?: number; near?: number } };
// The film's LOOK (plan.look): the original den + adult hero, or one of the four styles (kidsong, zackd, anime, pixar): each has its own set, hero, outline strength and sky. Same camera grammar for all.
const LK: string = ((PLAN as any).look as string) || "den";
const DEN_HERO = { ...CAST.adult, look: { ...CAST.adult.look, colors: { ...CAST.adult.look.colors, top: "#2f7a5a", inner: "#f4ead6", accent: "#ffc21a" } } };
// plan.lookSpec = a pack's ink_look (data): its moods, hero and set replace the built-in ones (looks/custom.tsx)
const SPEC: any = (PLAN as any).lookSpec || null;
if (SPEC) registerLook(SPEC);
const HERO: any = SPEC ? heroOf(SPEC) : LK === "den" ? DEN_HERO : (HEROES as any)[LK];
const SETS: Record<string, React.FC<{ t: number }>> = { kidsong: Playroom, zackd: Studio, anime: AnimeStreet, pixar: Kitchen };
const INK: Record<string, number> = { kidsong: 0, zackd: 0, anime: 0.45, pixar: 0 }, SKY: Record<string, boolean> = { zackd: true, anime: true };
const LookSet = SPEC ? ((p: { t: number }) => <LookSetOf look={SPEC} t={p.t} />) : SETS[LK];
const H = HERO.height;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

const camOf = (s: CamSpec, hero: { at: V3; yaw: number }) => {
  if (s.aim) { const c = aim(s.aim.from, s.aim.at, s.aim.fov, s.aim.face ?? 0.4); return { cam: s.aim.near ? near(c, s.aim.near) : c, fg: [] as V3[], blur: undefined as number | undefined, focus: undefined as V3 | undefined }; }
  const p = PRESETS[s.preset ?? "medium"]({ feet: hero.at, height: H, facing: hero.yaw, side: s.side, fov: s.fov });
  return { cam: p.cam, fg: p.fg, blur: p.blur, focus: p.focus };
};

const CHUNKS = makeChunks(PLAN.words as unknown as Word[], PLAN.duration / PLAN.fps);

export const Story: React.FC<{ sub?: boolean }> = ({ sub = false }) => {
  const ready = useFonts();
  const g = useCurrentFrame();
  if (!ready) return <AbsoluteFill style={{ background: "#1a1220" }} />;
  const { n, fp } = sub ? subFrame(g) : { n: g, fp: g };
  const t = fp / PLAN.fps, tn = n / PLAN.fps;
  const si = Math.max(0, PLAN.shots.findIndex((s: any, i: number) => t >= s.t && (i === PLAN.shots.length - 1 || t < PLAN.shots[i + 1].t)));
  const S = PLAN.shots[si] as any;
  const hero = { at: (S.hero?.at ?? [-0.9, 0, -1.3]) as V3, yaw: S.hero?.yaw ?? 0.7 };
  const base = camOf(S.cam, hero);
  const prms = (S.beats as any[]).map((b) => ({ ...b, to: b.to ? camOf(b.to, hero).cam : undefined }));
  const p = poseAt(base.cam, S.beats, S.t, t, prms);
  // push-through at the cut: the outgoing shot punches in over 3 frames, the incoming lands over 8 frames with a fov pull
  const toEnd = S.end - t, sinceStart = t - S.t;
  let fovK = 1;
  if (si < PLAN.shots.length - 1 && toEnd < 0.1) fovK = 1 - 0.3 * ease(clamp(1 - toEnd / 0.1));
  if (si > 0 && sinceStart < 0.27) fovK = 1.18 - 0.18 * ease(clamp(sinceStart / 0.27));
  const lens = PLAN.size[0] > PLAN.size[1] ? 1 / 1.4 : 1;   // cameras are authored on the vertical frame: landscape re-lenses by the vertical-fov x1.4 rule
  const cam: Cam = { ...withShake(p, p.shake), fov: p.fov * fovK * lens };
  const head = headOf(hero.at, H, HERO.build);
  const focus: V3 = S.focus === "hero" || !S.focus ? (base.focus ?? head) : (S.focus as V3);
  const acts = (S.acts as any[]).filter((a) => a.t <= t);
  const act = acts.reduce((m, a) => ({ ...m, ...a, face: { ...m.face, ...a.face }, pose: { ...m.pose, ...a.pose } }), { face: {}, pose: {} } as any);
  const open = S.show?.gate != null ? ease(clamp((t - S.show.gate) / 0.5)) : S.show?.gateOpen ? 1 : 0;
  const pop = S.show?.pop != null ? ease(clamp((t - S.show.pop) / 0.3)) : 0;
  const m = moodOf(S.mood); if (LK !== "den") inkScale.v = SPEC ? SPEC.ink ?? 0 : INK[LK] ?? 0;
  const sway = Math.sin(t * 1.3) * 0.05;
  return (
    <AbsoluteFill style={{ background: "#1a1220" }}>
      <View mood={m} cam={cam} t={t} focus={focus} blur={S.blur ?? base.blur ?? 1.4} sky={SPEC ? SPEC.sky ?? true : !!SKY[LK]} width={PLAN.size[0]} height={PLAN.size[1]}>
        {LookSet ? <LookSet t={t} /> : <Den t={t} gateOn={S.show?.gate != null || !!S.show?.gateOn} tags={S.show?.tags ?? []} gate={open} screen={S.show?.screen ?? ""} pop={pop} glow={pop} />}
        {S.hero?.hidden ? null : (
          <Character3D {...HERO} position={hero.at} yaw={hero.yaw + sway} t={t} face={{ eyes: "open", mouth: "smile", ...act.face }} pose={{ armL: [8, 8], armR: [8, 8], bob: Math.sin(t * 4) * 2, ...act.pose }} faceCamera={cam.pos} hold={act.hold ?? null} />
        )}
        {SPEC ? null : base.fg.map((f, i) => <Crate key={i} p={f} s={i ? 0.32 : 0.4} yaw={i ? -0.3 : 0.4} />)}
        <CastLight at={head} cam={cam.pos} mood={m} />
      </View>
      {PLAN.captions ? <Captions chunks={CHUNKS} t={tn} accent={new Set(PLAN.accent as unknown as string[])} accentColor="#ffc21a" until={PLAN.captionsUntil} width={PLAN.size[0]} height={PLAN.size[1]} /> : null}
    </AbsoluteFill>
  );
};
