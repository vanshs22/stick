import {continueRender, delayRender, staticFile} from 'remotion';
import {LOCAL_FONTS} from './fonts.local';
import {loadFont as Inter} from '@remotion/google-fonts/Inter';
import {loadFont as Manrope} from '@remotion/google-fonts/Manrope';
import {loadFont as SpaceGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as Poppins} from '@remotion/google-fonts/Poppins';
import {loadFont as ArchivoBlack} from '@remotion/google-fonts/ArchivoBlack';
import {loadFont as Fraunces} from '@remotion/google-fonts/Fraunces';
import {loadFont as DMSerifDisplay} from '@remotion/google-fonts/DMSerifDisplay';
import {loadFont as PlayfairDisplay} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as InstrumentSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as JetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as SpaceMono} from '@remotion/google-fonts/SpaceMono';
import {loadFont as Bangers} from '@remotion/google-fonts/Bangers';
import {loadFont as LilitaOne} from '@remotion/google-fonts/LilitaOne';
import {loadFont as BebasNeue} from '@remotion/google-fonts/BebasNeue';
import {loadFont as Oswald} from '@remotion/google-fonts/Oswald';
import {loadFont as Montserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as Caveat} from '@remotion/google-fonts/Caveat';
import {loadFont as Fredoka} from '@remotion/google-fonts/Fredoka';
import {loadFont as DMSans} from '@remotion/google-fonts/DMSans';

/** The curated type library. name -> {load, weights, italic}. A pack/project picks names in typography/typography.json. */
type Spec = {load: any; weights: string[]; italic?: boolean; kind: 'sans' | 'serif' | 'mono' | 'display' | 'hand'};
export const FONTS: Record<string, Spec> = {
  Inter: {load: Inter, weights: ['400', '500', '600', '700', '800', '900'], kind: 'sans'}, Manrope: {load: Manrope, weights: ['400', '600', '700', '800'], kind: 'sans'},
  SpaceGrotesk: {load: SpaceGrotesk, weights: ['400', '500', '700'], kind: 'sans'}, Poppins: {load: Poppins, weights: ['400', '600', '700', '800', '900'], kind: 'sans'},
  Montserrat: {load: Montserrat, weights: ['500', '700', '800', '900'], kind: 'sans'}, DMSans: {load: DMSans, weights: ['400', '500', '700'], kind: 'sans'},
  ArchivoBlack: {load: ArchivoBlack, weights: ['400'], kind: 'display'}, BebasNeue: {load: BebasNeue, weights: ['400'], kind: 'display'}, Oswald: {load: Oswald, weights: ['500', '700'], kind: 'display'},
  Bangers: {load: Bangers, weights: ['400'], kind: 'display'}, LilitaOne: {load: LilitaOne, weights: ['400'], kind: 'display'}, Fredoka: {load: Fredoka, weights: ['500', '600', '700'], kind: 'display'},
  InstrumentSerif: {load: InstrumentSerif, weights: ['400'], italic: true, kind: 'serif'}, Fraunces: {load: Fraunces, weights: ['400', '700', '900'], italic: true, kind: 'serif'},
  PlayfairDisplay: {load: PlayfairDisplay, weights: ['400', '700', '900'], italic: true, kind: 'serif'}, DMSerifDisplay: {load: DMSerifDisplay, weights: ['400'], italic: true, kind: 'serif'},
  JetBrainsMono: {load: JetBrainsMono, weights: ['400', '500', '700'], kind: 'mono'}, SpaceMono: {load: SpaceMono, weights: ['400', '700'], kind: 'mono'}, Caveat: {load: Caveat, weights: ['400', '700'], kind: 'hand'},
};
const done: Record<string, string> = {};
/** bundled woff2 files (tools/fonts_localize.mjs): no network, so a render never waits on Google Fonts */
const loadLocal = (n: string): string | null => {
  const L = LOCAL_FONTS[n]; if (!L || !L.faces.length || typeof FontFace === 'undefined') return null;
  const h = delayRender(`font ${n}`, {timeoutInMilliseconds: 60000});
  Promise.all(L.faces.map((f) => new FontFace(L.family, `url(${staticFile(f.file)}) format('woff2')`, {style: f.style, weight: f.weight}).load().then((ff) => { (document as any).fonts.add(ff); }))).then(() => continueRender(h), () => continueRender(h));
  return L.family;
};
/** load a font by library name and return its CSS family (loaded once) */
export const fontFamily = (name: string, fallback = 'Inter'): string => {
  const n = FONTS[name] ? name : fallback; if (done[n]) return done[n];
  const loc = loadLocal(n); if (loc) return (done[n] = loc);
  const s = FONTS[n]; const f = s.load('normal', {weights: s.weights, subsets: ['latin']}); if (s.italic) { try { s.load('italic', {weights: s.weights.slice(0, 1), subsets: ['latin']}); } catch (e) { /* no italic */ } }
  return (done[n] = f.fontFamily);
};
