import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Shot} from './types';

/** Inside a shot: t = film time (s), lt = seconds since the shot began, d = shot length, p = 0..1 progress. */
export const useShotTime = (shot: Shot) => {
  const frame = useCurrentFrame(); // restarts at 0 inside each shot's <Sequence>
  const {fps} = useVideoConfig();
  const lt = frame / fps;
  const d = shot.end - shot.start;
  return {t: shot.start + lt, lt, d, p: Math.min(1, lt / Math.max(0.001, d)), fps, frame};
};

/** Film time of a named spoken-word anchor from the storyboard; falls back to the shot start. */
export const at = (shot: Shot, name: string, fallbackOffset = 0) => shot.anchors[name] ?? shot.start + fallbackOffset;

/** Local seconds (since the shot began) of an anchor: use this to time an entrance to a word. */
export const atLocal = (shot: Shot, name: string, fallbackOffset = 0) => at(shot, name, fallbackOffset) - shot.start;
