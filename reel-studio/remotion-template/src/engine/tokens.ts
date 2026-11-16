import style from '../data/style.json';

import typo from '../data/typography.json';
import {fontFamily} from './fonts';

// fonts come from typography/typography.json (chosen by the user at the typography gate); defaults keep the old look
export const TYPO = typo as any;
export const F = {serif: fontFamily(TYPO.supporting?.font || 'InstrumentSerif'), sans: fontFamily(TYPO.headline?.font || 'Inter'), mono: fontFamily(TYPO.ui?.font || 'JetBrainsMono'), caption: fontFamily(TYPO.caption?.font || TYPO.headline?.font || 'Inter')};
export const C = {...(style as any).colors} as Record<string, string>;
export const SAFE = {top: 180, bottom: 1380, caption_y: 1440, right_margin: 120, content_top: 180, content_bottom: 1380, ...((style as any).safe_zone || {})};
/** window chrome of the pack: 'clean' (soft shadow), 'sticker' (thick outline + hard shadow), 'glass' (dark translucent panel) */
export const CHROME: string = (style as any).chrome || 'clean';
/** named background colours a shot can switch to with `bg` (ref6 changes colour per section) */
export const BGS: Record<string, string> = {paper: C.bg, ...((style as any).bgs || {})};
export const PRESENTER = (style as any).presenter as undefined | Record<string, any>;
export const CAPTION = {fill: '#fff', stroke: 'rgba(8,8,20,0.92)', ...((style as any).caption || {})} as {fill: string; stroke: string};
export const STYLE_ID: string = (style as any).id;
export const W = 1080;
export const H = 1920;
