import React from "react";
import { Composition } from "remotion";
import { Demo, DEMO_MOODS } from "./demo/Demo";
import { DemoCast } from "./demo/DemoCast";
import { DemoMove, MOVE_FRAMES } from "./demo/DemoMove";
import { SUB } from "./inkbeat/core/frame";
import { Story } from "./story/Story";
import { PLAN } from "./story/plan.gen";
import { LAYOUT_SIZE, LookDev, STYLE_SIZES } from "./looks/LookDev";
import type { StyleId } from "./looks/LookDev";
import { CustomLook } from "./looks/custom";
import type { InkLook } from "./looks/custom";

// LookCustom-<wide|medium|close>-<L|P>: a pack's ink_look rendered from `--props=<file.json>` ({look, mood?}); the default is a stand-in
const STUB: InkLook = { moods: { day: { base: "day" } }, set: { preset: "playroom" } };

// DemoHero: a low hero framing with foreground props. Demo: one still. Demo-<mood>: the same frame in each act light. DemoWide: the whole set.
// DemoCast: the three example characters in a row (a landscape family sheet).
// DemoMove: a 3 s beat-rig move (sharp). DemoMoveSub: the same at SUB × fps for motion blur (average with ffmpeg tmix).
export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={Demo} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{ mood: "day", wide: false }} />
    <Composition id="DemoHero" component={Demo} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{ mood: "dusk", wide: false, hero: true }} />
    <Composition id="DemoWide" component={Demo} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{ mood: "day", wide: true }} />
    {DEMO_MOODS.map((m) => (
      <Composition key={m} id={`Demo-${m}`} component={Demo} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{ mood: m, wide: false }} />
    ))}
    <Composition id="DemoCast" component={DemoCast} durationInFrames={30} fps={30} width={1920} height={1080} defaultProps={{ mood: "day" }} />
    <Composition id="DemoMove" component={DemoMove} durationInFrames={MOVE_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="DemoMoveSub" component={DemoMove} durationInFrames={MOVE_FRAMES * SUB} fps={30 * SUB} width={1080} height={1920} defaultProps={{ sub: true }} />
    <Composition id="Story" component={Story} durationInFrames={PLAN.duration} fps={PLAN.fps} width={PLAN.size[0]} height={PLAN.size[1]} defaultProps={{ sub: false }} />
    <Composition id="StorySub" component={Story} durationInFrames={PLAN.duration * SUB} fps={PLAN.fps * SUB} width={PLAN.size[0]} height={PLAN.size[1]} defaultProps={{ sub: true }} />
    {(["wide", "medium", "close"] as const).flatMap((fr) =>
      (["L", "P"] as const).map((ly) => (
        <Composition key={`custom-${fr}-${ly}`} id={`LookCustom-${fr}-${ly}`} component={CustomLook} durationInFrames={30} fps={30} width={LAYOUT_SIZE[ly][0]} height={LAYOUT_SIZE[ly][1]} defaultProps={{ look: STUB, frame: fr, layout: ly, mood: 0 }} />
      )),
    )}
    {(Object.keys(STYLE_SIZES) as StyleId[]).flatMap((st) =>
      (["wide", "medium", "close"] as const).flatMap((fr) =>
        (["L", "P"] as const).map((ly) => (
          <Composition key={`${st}-${fr}-${ly}`} id={`Look-${st}-${fr}-${ly}`} component={LookDev} durationInFrames={30} fps={30} width={LAYOUT_SIZE[ly][0]} height={LAYOUT_SIZE[ly][1]} defaultProps={{ style: st, frame: fr, layout: ly }} />
        )),
      ),
    )}
  </>
);
