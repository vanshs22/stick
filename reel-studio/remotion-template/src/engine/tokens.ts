import style from '../data/style.json';
import timeline from '../data/timeline.json';
import capCfg from '../data/captions.json';

import typo from '../data/typography.json';
import {fontFamily} from './fonts';

// fonts come from typography/typography.json (chosen by the user at the typography gate); defaults keep the old look
export const TYPO = typo as any;
export const F = {serif: fontFamily(TYPO.supporting?.font || 'InstrumentSerif'), sans: fontFamily(TYPO.headline?.font || 'Inter'), mono: fontFamily(TYPO.ui?.font || 'JetBrainsMono'), caption: fontFamily(TYPO.caption?.font || TYPO.headline?.font || 'Inter')};
export const C = {...(style as any).colors} as Record<string, string>;
export const W: number = (timeline as any).width || 1080;
export const H: number = (timeline as any).height || 1920;
/** the frame is landscape (16:9 long-form): px authored on the 1080x1920 portrait canvas are scaled, the content zone and captions move (SAFE below) */
export const LANDSCAPE = W > H;
const SZ = (style as any).safe_zone || {};
/** safe zones in px of THIS frame. Portrait: style.json safe_zone (authored on 1080x1920). Landscape: derived from the height (content above the caption band, margins at the sides), a pack may override with safe_zone_landscape; with a presenter the cards take the right 60 percent */
/** the `headline` caption preset: portrait puts two big lines at the top; landscape gives them a LEFT COLUMN (like the presenter's) so the cards keep the full height */
export const HEADLINE = ((capCfg as any).preset || (timeline as any).captions?.preset) === 'headline';
export const SAFE = LANDSCAPE
  ? {top: Math.round(H * 0.07), bottom: Math.round(H * 0.93), caption_y: Math.round(H * 0.8), right_margin: Math.round(W * 0.08), content_top: Math.round(H * 0.14), content_bottom: Math.round(H * 0.78), content_left: (style as any).presenter ? Math.round(W * 0.4) : HEADLINE ? Math.round(W * 0.36) : 0, ...((style as any).safe_zone_landscape || {})}
  : {top: 180, bottom: 1380, caption_y: 1440, right_margin: 120, content_top: 180, content_bottom: 1380, content_left: 0, ...SZ};
/** x, y of a px position authored on the 1080x1920 portrait canvas, in this frame. Landscape maps the portrait CONTENT area (y 180..1380) onto the landscape content zone, so a tag stays on the same part of the card it was placed on; outside it the frame is scaled. */
/** the card the shot's Zone just drew (centre and size in px of this frame): overlays authored on the portrait card are mapped onto it. Set while rendering, before the overlays of the same shot. */
/** px at the bottom of the content zone reserved for strip overlays (tags, progress, warning, waveform, counter); set by the ShotRouter before the shot's Zone is drawn, landscape only */
export const DOCK: {v: number} = {v: 0};
export const CARD: {v: null | {cx: number; cy: number; w: number; h: number}} = {v: null};
/** portrait cards are about 940 x 1020 around (540, 780); landscape maps that box onto the drawn card (or, with no card, the content zone) */
const PBOX = {cx: 540, cy: 780, w: 940, h: 1020};
const BOX = () => CARD.v || {cx: SAFE.content_left + (W - SAFE.content_left) / 2, cy: (SAFE.content_top + SAFE.content_bottom) / 2, w: W - SAFE.content_left, h: SAFE.content_bottom - SAFE.content_top};
const IN = (y: number) => y >= 180 && y <= 1380;   // the portrait content area; above it is the top band (labels, headline), below it the caption band
export const fx = (x: number, y = 780) => (LANDSCAPE ? (IN(y) ? BOX().cx + ((x - PBOX.cx) / PBOX.w) * BOX().w : (x / 1080) * W) : x);
export const fy = (y: number) => (LANDSCAPE ? (IN(y) ? BOX().cy + ((y - PBOX.cy) / PBOX.h) * BOX().h : y < 180 ? (y / 180) * SAFE.content_top : SAFE.content_bottom + ((y - 1380) / 540) * (H - SAFE.content_bottom)) : y);
/** window chrome of the pack: 'clean' (soft shadow), 'sticker' (thick outline + hard shadow), 'glass' (dark translucent panel) */
export const CHROME: string = (style as any).chrome || 'clean';
/** named background colours a shot can switch to with `bg` (ref6 changes colour per section) */
export const BGS: Record<string, string> = {paper: C.bg, ...((style as any).bgs || {})};
export const PRESENTER = (style as any).presenter as undefined | Record<string, any>;
export const CAPTION = {fill: '#fff', stroke: 'rgba(8,8,20,0.92)', ...((style as any).caption || {})} as {fill: string; stroke: string};
export const STYLE_ID: string = (style as any).id;
/** card shapes: portrait cards are tall, landscape cards are wide. `box` is the natural size the Zone assumes for a card that does not say (landscape: conservative, the card shrinks to fit); `row` is the height of one list row. */
export const LY = LANDSCAPE
  ? {box: {w: 1100, h: 900}, winW: 1100, winH: 620, termW: 1100, termH: 560, proofW: 1100, proofH: 600, pageW: 1100, pageH: 600, mapW: 1100, mapH: 620, tlW: 1100, row: 92, versusRow: true, versusW: 470, flowRow: true, chartH: 380, lineW: 1000, lineH: 400, cols: 2}
  : {box: {w: 940, h: 1020}, winW: 940, winH: 1000, termW: 940, termH: 620, proofW: 940, proofH: 900, pageW: 900, pageH: 980, mapW: 940, mapH: 960, tlW: 940, row: 130, versusRow: false, versusW: 800, flowRow: false, chartH: 560, lineW: 820, lineH: 520, cols: 1};
