import style from '../data/style.json';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

// fonts every style pack can use by name; a pack that needs another font adds it here (see skills/typography)
const serif = loadSerif('normal', {weights: ['400'], subsets: ['latin']});
loadSerif('italic', {weights: ['400'], subsets: ['latin']});
const inter = loadInter('normal', {weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin']});
const mono = loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']});

export const F = {serif: serif.fontFamily, sans: inter.fontFamily, mono: mono.fontFamily};
export const C = {...(style as any).colors} as Record<string, string>;
export const SAFE = {top: 180, bottom: 1380, caption_y: 1440, right_margin: 120, content_top: 180, content_bottom: 1380, ...((style as any).safe_zone || {})};
/** window chrome of the pack: 'clean' (soft shadow), 'sticker' (thick outline + hard shadow), 'glass' (dark translucent panel) */
export const CHROME: string = (style as any).chrome || 'clean';
/** named background colours a shot can switch to with `bg` (ref6 changes colour per section) */
export const BGS: Record<string, string> = {paper: C.bg, ...((style as any).bgs || {})};
export const PRESENTER = (style as any).presenter as undefined | Record<string, any>;
export const CAPTION = {fill: '#fff', stroke: 'rgba(0,0,0,0.55)', ...((style as any).caption || {})} as {fill: string; stroke: string};
export const STYLE_ID: string = (style as any).id;
export const W = 1080;
export const H = 1920;
