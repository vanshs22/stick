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
export const SAFE = {top: 180, bottom: 1380, caption_y: 1440, right_margin: 120, ...((style as any).safe_zone || {})};
export const STYLE_ID: string = (style as any).id;
export const W = 1080;
export const H = 1920;
