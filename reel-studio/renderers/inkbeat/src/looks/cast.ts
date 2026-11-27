// One original hero per style, all built from the same character family (inkbeat/char/family.ts): only the build, the face style and the outfit change.
import { HAIR, KID_BUILD, SKIN } from "../inkbeat/char/family";
import type { CharacterSpec } from "../inkbeat/char/Character3D";

export const HEROES = {
  /** Pip: a toddler. Head 1.5x, barrel body, short limbs, big soft eyes, rosy cheeks, primary-colour overalls. */
  kidsong: { height: 1.0, build: { ...KID_BUILD, headScale: 1.5, limb: 1.0 }, look: { skin: SKIN.light, outfit: "overalls", colors: { top: "#ffb84a", inner: "#fff2c8", bottom: "#4aa8ff", shoes: "#ff5a7a", accent: "#ffe14a" }, hair: "curly", hairColor: "#8a5a3a", face: { eyeScale: 1.35, blush: 0.7, nose: "button", brow: 0.9 }, seed: 11 } },
  /** Sam: a plain, readable adult so the cutaway is the star. Clay skin, light jacket. */
  zackd: { height: 1.74, build: { torso: "block", torsoWidth: 1.0 }, look: { skin: SKIN.light, outfit: "jacket", colors: { top: "#dcd8ee", inner: "#ffffff", bottom: "#3b3d46", shoes: "#f4f4f4", accent: "#b8b8d0" }, hair: "swoop", hairColor: HAIR.espresso, face: { eyeScale: 1.05, nose: "hook", blush: 0.25 }, seed: 5 } },
  /** Ren: a tall, narrow anime lead. Small head, long limbs, very large eyes, lashes, indigo hair, school-jacket outfit. */
  anime: { height: 1.74, build: { headScale: 0.88, torso: "block", torsoWidth: 0.88, limb: 0.82, neck: 1.1, armLength: 1.05 }, look: { skin: SKIN.fair, outfit: "jacket", colors: { top: "#26346e", inner: "#ffffff", bottom: "#262a40", shoes: "#2a2a32", accent: "#e8483a" }, hair: "swoop", hairColor: "#23266a", face: { eyeScale: 1.55, lash: true, brow: 0.8, blush: 0.15, nose: "button", eyeColor: "#3a78e8" }, seed: 2 } },
  /** Mara: a warm storybook baker. Head 1.16x, pear body, big expressive eyes, heavy brows for acting, apron. */
  pixar: { height: 1.62, build: { headScale: 1.16, torso: "pear", torsoWidth: 1.04, limb: 1.05 }, look: { skin: SKIN.tan, outfit: "apron", colors: { top: "#d8574a", inner: "#efe6d2", bottom: "#4a3a52", shoes: "#5a3a2b", accent: "#efe6d2" }, hair: "bun", hairColor: HAIR.auburn, face: { eyeScale: 1.28, brow: 1.35, blush: 0.4, nose: "button", lash: true, eyeColor: "#3f7a5a" }, seed: 9 } },
} satisfies Record<string, CharacterSpec>;
