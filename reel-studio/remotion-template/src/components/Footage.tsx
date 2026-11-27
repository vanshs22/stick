import React from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile} from 'remotion';
import {C} from '../engine/tokens';
import {E, mix, p} from '../engine/anim';
import {useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';
import {SHADOW, Win, Zone} from './ui';

/**
 * A real clip: a Playwright recording of a real site (tools/capture/record_broll.mjs), a Blender sequence (tools/photoreal.mjs sequence) or footage you own.
 * The clip is played as a JPEG FRAME SEQUENCE (tools/footage_frames.mjs makes <src>.frames/ at build time): exact per frame and independent of the machine's video decoder. Muted: voice and music are mixed separately.
 * props: src (public path of the mp4, required), from (seconds into the clip), speed (1), hold ('last' keeps the last frame when the clip is shorter than the shot, default; 'loop' repeats), fit ('cover' | 'contain'),
 * zoom {from, to} (slow push over the shot), focus [x,y] 0..1, window ('none' | 'browser') with url, source (shown small: what it is and where it came from), anchor.
 */
export const Footage: React.FC<ShotProps> = ({shot, src, from = 0, speed = 1, hold = 'last', fit = 'cover', zoom, focus = [0.5, 0.5], window: win = 'none', url = '', source = ''}) => {
  const {lt, d} = useShotTime(shot), [meta, setMeta] = React.useState<{fps: number; count: number} | null>(null), [h1] = React.useState(() => delayRender('footage-meta'));
  React.useEffect(() => { fetch(staticFile(`${src}.frames/meta.json`)).then((r) => r.json()).then((m) => { setMeta(m); continueRender(h1); }).catch(() => { throw new Error(`Footage: ${src}.frames/meta.json is missing: run node tools/footage_frames.mjs ensure <project> (build_video does it)`); }); }, [src]);
  const z = zoom ? mix(zoom.from ?? 1, zoom.to ?? 1.12, p(lt, 0, d, E.inOutSoft)) : 1, a = p(lt, 0, 0.25, E.outCubic);
  const idx = meta ? (() => { const raw = Math.floor((from + lt * speed) * meta.fps); return 1 + (hold === 'loop' ? raw % meta.count : Math.min(meta.count - 1, raw)); })() : 1;
  const vid = <div style={{width: '100%', height: '100%', overflow: 'hidden', background: '#000'}}>{meta ? <Img src={staticFile(`${src}.frames/f${String(idx).padStart(5, '0')}.jpg`)} style={{width: '100%', height: '100%', objectFit: fit, transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`, transform: `scale(${z})`}} /> : null}</div>;
  if (win === 'browser') return <Zone w={1100} h={760}><div style={{opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}><Win title={url} width={1100} height={620} style={{boxShadow: SHADOW}}>{vid}</Win>{source ? <div style={{marginTop: 14, fontFamily: 'monospace', fontSize: 28, color: C.muted, textAlign: 'center'}}>{source}</div> : null}</div></Zone>;
  return <AbsoluteFill style={{opacity: a}}>{vid}{source ? <div style={{position: 'absolute', left: 48, bottom: 120, fontFamily: 'monospace', fontSize: 28, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '6px 14px', borderRadius: 8}}>{source}</div> : null}</AbsoluteFill>;
};
