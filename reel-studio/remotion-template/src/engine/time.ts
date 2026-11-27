import {useCurrentFrame, useVideoConfig} from 'remotion';
import timeline from '../data/timeline.json';
import {E, SPR, clamp, p, sp, type SpringCfg} from './anim';
import type {Shot} from './types';

/** Inside a shot: t = film time (s), lt = seconds since the shot began, d = shot length, p = 0..1 progress. */
export const useShotTime = (shot: Shot) => {
  const frame = useCurrentFrame(); // restarts at 0 inside each shot's <Sequence>
  const {fps} = useVideoConfig();
  const lt = frame / fps;
  const d = shot.end - shot.start;
  return {t: shot.start + lt, lt, d, p: Math.min(1, lt / Math.max(0.001, d)), fps, frame};
};

/** Film time of a named spoken-word anchor from the storyboard; falls back to the shot start + offset. */
export const at = (shot: Shot, name: string, fallbackOffset = 0) => shot.anchors[name] ?? shot.start + fallbackOffset;
/** Local seconds (since the shot began) of an anchor: time an entrance to a word with this. */
export const atLocal = (shot: Shot, name: string, fallbackOffset = 0) => at(shot, name, fallbackOffset) - shot.start;

/**
 * The standard entrance/exit of any element. start = the anchor word (or `delay` seconds into the shot).
 * a = spring 0..1 (may overshoot), vis = opacity-safe 0..1 incl. the exit, out = exit progress, lt = local seconds, start = local start.
 */
export const useEnter = (shot: Shot, anchor?: string, delay = 0.1, cfg: SpringCfg = SPR.soft, exit = 0.3) => {
  const {lt, d, fps, t} = useShotTime(shot);
  // no dead time: unanchored entrances start within 0.06 s of the cut, exits take at most 0.12 s, and the first shot is never blank at frame 0
  const start = anchor && anchor in shot.anchors ? atLocal(shot, anchor) : Math.min(delay, 0.06);
  const ex = Math.min(exit, 0.12);
  // the CARD is on screen within 0.4 s of the cut even when its word comes late (an empty frame until the word is a dead frame, and the video critic reads it as an unplanned cut); `start` still returns the word's time, so typing, circles and ticks stay on the word
  const a = Math.max(sp(lt, Math.min(start, 0.4), fps, cfg), shot.start < 0.05 ? 0.4 : 0);
  const out = p(lt, d - ex, ex, E.inCubic);
  return {a, out, vis: clamp(a * 1.6) * (1 - out), lt, d, start, fps, t};
};

/** How open the speaker's mouth is (0..1) at film time t, from the real word times. */
export const talkAt = (t: number, who?: string) => {
  const W = (timeline as any).words as {s: number; e: number; speaker?: string}[], me = who?.toLowerCase();
  for (const w of W) {
    if (me && w.speaker && w.speaker.toLowerCase() !== me) continue;   // dialogue: only the character who speaks this word moves their mouth
    if (t < w.s - 0.02) return 0;
    if (t <= w.e + 0.05) {
      const q = clamp((t - w.s) / Math.max(0.08, w.e - w.s));
      const syl = Math.max(1, Math.round((w.e - w.s) / 0.16));
      return (0.3 + 0.7 * Math.abs(Math.sin(q * syl * Math.PI))) * clamp(Math.min((t - w.s + 0.02) / 0.05, (w.e + 0.05 - t) / 0.05) + 0.2);
    }
  }
  return 0;
};
