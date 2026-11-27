// Look variants for the four 3D styles. Each look is an existing act mood (core/moods.ts) with a deep patch: the ramp
// (cel / smooth / clay), the outline (off, or a thin coloured line), the light rig, the sky and the grade. A look is data;
// the engine, the rig and the character family stay the same, so the camera grammar (skills/camera-grammar) is common.
import { MOODS } from "../inkbeat/core/moods";
import type { MoodPreset } from "../inkbeat/core/moods";

const merge = (a: any, b: any): any => {
  if (Array.isArray(b) || typeof b !== "object" || b === null) return b;
  const o: any = { ...a };
  for (const k of Object.keys(b)) o[k] = merge(a?.[k], b[k]);
  return o;
};
const V = (base: string, patch: any): MoodPreset => merge(MOODS[base], patch);
const sky = (top: string, mid: string, bottom: string, o: any = {}) => ({ top, mid, bottom, cloudColor: mid, cloudLit: "#ffffff", clouds: 0.3, stars: 0, rays: 0, horizon: 0.2, brush: 0.02, sunOn: 0, moonOn: 0, ...o });

// ---------------------------------------------------------------- kidsong: a toddler-song world. Soft, bright, round, no outlines, no harsh shadow.
// Better than the reference it is modelled on: shadows keep a little colour and detail (the reference is flat), a soft rim separates characters
// from the set, and nothing flashes, shakes or pulses.
const kids = {
  "kids-day": V("day", {
    note: "toddler-song day: high key, pastel-saturated, soft coloured shade, no outline",
    lights: { hemi: { sky: "#e8f4ff", ground: "#ffc8a8", intensity: 0.85 }, key: { color: "#fff2dc", intensity: 2.5, dir: [0.5, 0.8, 0.5] }, rim: { color: "#fff0e0", intensity: 1.3 }, fill: { color: "#ffd0e8", intensity: 0.7 } },
    fog: { color: "#e8f6ff", density: 0.002 },
    sky: sky("#62c8ff", "#a8e6ff", "#fff4f8", { clouds: 0.35, sunOn: 0.5 }),
    toon: { ramp: "smooth", shadowTint: [0.9, 0.82, 1.1], shadowAmt: 0.55, hiTint: [1.04, 1.02, 0.96], hiAmt: 0.3, rimAmt: 0.3, paint: 0 },
    post: { outline: { enabled: false }, dof: { maxBlurPx: 0.7 }, bloom: { strength: 0.25 }, vignette: { amount: 0.08 }, grade: { exposure: 0.8, contrast: 1.14, saturation: 1.6, shadowTint: "#8a6ad0", highlightTint: "#fff8ee", gain: "#ffffff" } },
    camFill: { color: "#fff0f8", intensity: 0.5 },
  }),
  "kids-night": V("lamp", {
    note: "toddler-song bedtime: indigo room, warm lamp, stars, still no outline",
    lights: { hemi: { sky: "#9a8ae0", ground: "#5a3a7a", intensity: 1.1 }, key: { color: "#ffd8a0", intensity: 2.6 } },
    sky: sky("#2a2a7a", "#4a4ab0", "#8a7ad8", { stars: 0.8, moonOn: 0.9 }),
    toon: { ramp: "smooth", shadowTint: [0.9, 0.88, 1.15], shadowAmt: 0.4, paint: 0 },
    post: { outline: { enabled: false }, dof: { maxBlurPx: 0.7 }, vignette: { amount: 0.12 }, grade: { saturation: 1.15, exposure: 0.95 } },
  }),
};

// ---------------------------------------------------------------- zackd: studio-lit semi-realistic clay 3D. Seamless backdrop, clay shading with a warm bleed, cutaway interiors.
// Better than the reference: a fixed colour code for what a cutaway shows (skin tan, fat yellow, muscle red, bone cream, the subject of the story in saturated pink)
// and a lit cutaway interior that is clearly the same object as the outside.
const zack = {
  "zd-studio": V("day", {
    note: "high-key studio: neutral white key, lilac seamless backdrop, clay shading, no outline",
    lights: { hemi: { sky: "#f0f0ff", ground: "#a8a0d0", intensity: 0.7 }, key: { color: "#ffffff", intensity: 3.0, dir: [0.4, 0.9, 0.7] }, rim: { color: "#d8e4ff", intensity: 2.2 }, fill: { color: "#ffd8ec", intensity: 0.6 } },
    fog: { color: "#e8e4f4", density: 0.003 },
    sky: sky("#d8d8fa", "#b4b8ee", "#9aa0dc", { clouds: 0, sunOn: 0, brush: 0 }),
    toon: { ramp: "clay", shadowTint: [1.0, 0.9, 0.95], shadowAmt: 0.5, hiTint: [1.04, 1.0, 0.98], hiAmt: 0.4, rimColor: "#f0f4ff", rimAmt: 0.3, paint: 0 },
    post: { outline: { enabled: false }, dof: { maxBlurPx: 2.0 }, bloom: { strength: 0.35 }, vignette: { amount: 0.12 }, grade: { exposure: 0.82, contrast: 1.14, saturation: 1.2, shadowTint: "#5a4a9a", highlightTint: "#ffffff", gain: "#ffffff" } },
    camFill: { color: "#ffffff", intensity: 0.4 },
  }),
  "zd-inside": V("lamp", {
    note: "inside a cutaway: warm magenta key, moist pink rim, dark violet depth",
    lights: { hemi: { sky: "#ff9ab8", ground: "#6a1a4a", intensity: 1.0 }, key: { color: "#ffb8c8", intensity: 3.4 }, rim: { color: "#ff6a9a", intensity: 2.4 }, fill: { color: "#a8a0ff", intensity: 0.7 } },
    fog: { color: "#7a2a5a", density: 0.02 },
    sky: sky("#3a1038", "#6a2058", "#a03a78"),
    toon: { ramp: "clay", shadowTint: [1.1, 0.8, 0.95], shadowAmt: 0.6, paint: 0 },
    post: { outline: { enabled: false }, dof: { maxBlurPx: 2.6 }, bloom: { strength: 0.55 }, vignette: { amount: 0.3 }, grade: { saturation: 1.18, contrast: 1.12 } },
  }),
};

// ---------------------------------------------------------------- anime: cel-shaded 3D with a film grade. Two-band cel ramp, a thin coloured line, hard backlight, painted sky, strong halation.
// Better than a generic "anime filter": characters animate on twos (12 drawings a second, camera stays smooth), the sky is a graded painting with lit cloud edges,
// the line colour follows the light (dark indigo by day, wine by dusk) and impact frames are a designed 2-frame inversion (see skills/inkbeat or anime pack).
const anime = {
  "anime-day": V("day", {
    note: "anime day: two-band cel, thin indigo line, backlit sun, deep painted sky, halation",
    lights: { hemi: { sky: "#8ab8ff", ground: "#b89870", intensity: 0.8 }, key: { color: "#fff4e0", intensity: 4.4, dir: [-0.5, 0.45, -0.7] }, rim: { color: "#ffffff", intensity: 3.0, dir: [-0.6, 0.4, -0.8] }, fill: { color: "#a8c0ff", intensity: 0.35 } },
    fog: { color: "#cfe4ff", density: 0.002 },
    sky: sky("#0f46c8", "#4a98f0", "#ffe8c8", { clouds: 0.7, cloudLit: "#ffffff", cloudColor: "#a8c8f0", sunOn: 0.9, rays: 0.5, brush: 0.08, horizon: 0.12, sun: { dir: [-0.5, 0.35, -1], color: "#fff4d0", size: 9 } }),
    toon: { ramp: "cel", shadowTint: [0.86, 0.88, 1.16], shadowAmt: 0.85, hiTint: [1.08, 1.04, 0.94], hiAmt: 0.5, rimColor: "#ffffff", rimAmt: 0.6, paint: 0 },
    post: { outline: { enabled: true, color: "#1e1a46", widthPx: 1.6, strength: 0.85, farWidth: 0.5, farOpacity: 0.35, minPx: 1.5 }, dof: { maxBlurPx: 0.9 }, bloom: { threshold: 0.85, strength: 0.85, radiusPx: 60, scatter: 0.6 }, vignette: { amount: 0.12 }, grade: { exposure: 0.85, contrast: 1.24, saturation: 1.42, shadowTint: "#2a2a98", highlightTint: "#fff0d0", gain: "#fff8f0" } },
    camFill: { color: "#e8f0ff", intensity: 0.3 },
  }),
  "anime-dusk": V("dusk", {
    note: "anime dusk: magenta-to-amber sky gradient, wine line, long cel shadows, lens glow",
    lights: { key: { color: "#ffa860", intensity: 4.6, dir: [-0.7, 0.18, -0.6] }, rim: { color: "#ffc890", intensity: 3.0 }, fill: { color: "#8a78ff", intensity: 0.7 } },
    sky: sky("#2a2a8a", "#d8689a", "#ffc47a", { clouds: 0.6, cloudLit: "#ffd8a0", cloudColor: "#9a5a9a", sunOn: 0.9, rays: 0.6, horizon: 0.1, sun: { dir: [-0.6, 0.12, -1], color: "#ffd890", size: 10 } }),
    toon: { ramp: "cel", shadowTint: [0.9, 0.76, 1.15], shadowAmt: 0.85, rimColor: "#ffd8a0", rimAmt: 0.6, paint: 0 },
    post: { outline: { enabled: true, color: "#3a1640", widthPx: 1.6, strength: 0.85, minPx: 1.5 }, dof: { maxBlurPx: 1.0 }, bloom: { threshold: 0.8, strength: 1.0, radiusPx: 70, tint: "#ffb878" }, vignette: { amount: 0.18 }, grade: { saturation: 1.3, contrast: 1.2, shadowTint: "#5a2a8a", highlightTint: "#ffd8a0" } },
  }),
};

// ---------------------------------------------------------------- pixar-soft: storybook 3D with a colour script. Continuous soft shading, no outline, warm key against cool shade,
// shallow focus, filmic grade. Better than a generic "3D cartoon": the colour script is planned per act (warm home, cool doubt, golden resolve), skin and cloth
// keep a warm bleed in the shade, eyes are large and brows carry the acting.
const pixar = {
  "pixar-warm": V("lamp", {
    note: "storybook warm interior: tungsten key, cool blue shade, soft wrap shading, shallow focus",
    lights: { hemi: { sky: "#9ab0ff", ground: "#5a3a30", intensity: 0.55 }, key: { color: "#ffc080", intensity: 4.2, dir: [0.55, 0.65, 0.5] }, rim: { color: "#8ab0ff", intensity: 3.0 }, fill: { color: "#6a94ff", intensity: 0.8 } },
    fog: { color: "#3a2a38", density: 0.0015 },
    toon: { ramp: "smooth", shadowTint: [0.82, 0.88, 1.12], shadowAmt: 0.55, hiTint: [1.1, 1.0, 0.86], hiAmt: 0.45, rimColor: "#a8c0ff", rimAmt: 0.35, paint: 0 },
    post: { outline: { enabled: false }, dof: { maxBlurPx: 2.6 }, bloom: { threshold: 1.0, strength: 0.6, radiusPx: 50 }, vignette: { amount: 0.28 }, grade: { exposure: 0.74, contrast: 1.22, saturation: 1.15, shadowTint: "#102a70", highlightTint: "#ffe0b0" } },
  }),
  "pixar-cool": V("cold", {
    note: "storybook doubt: cool blue light, one warm window, soft wrap shading",
    toon: { ramp: "smooth", shadowTint: [0.78, 0.9, 1.15], shadowAmt: 0.6, paint: 0 },
    post: { outline: { enabled: false }, dof: { maxBlurPx: 2.8 }, bloom: { strength: 0.55 }, vignette: { amount: 0.3 }, grade: { saturation: 1.05, contrast: 1.12, exposure: 0.9 } },
  }),
  "pixar-golden": V("golden", {
    note: "storybook resolve: low golden sun, long soft shadows, warm bounce",
    toon: { ramp: "smooth", shadowTint: [0.95, 0.84, 1.08], shadowAmt: 0.5, paint: 0 },
    post: { outline: { enabled: false }, dof: { maxBlurPx: 2.6 }, bloom: { strength: 0.7 }, vignette: { amount: 0.25 }, grade: { saturation: 1.12, contrast: 1.1 } },
  }),
};

Object.assign(MOODS, kids, zack, anime, pixar);
export const LOOKS = { kidsong: Object.keys(kids), zackd: Object.keys(zack), anime: Object.keys(anime), pixar: Object.keys(pixar) };
