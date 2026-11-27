import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {ShotProps} from '../engine/types';

/** Marker for a shot drawn by the inkbeat 3D engine (renderers/inkbeat) instead of this template: the storyboard, gates, voice, captions timing, critics and QA treat it like any shot,
 *  and tools/build_video.mjs renders it with tools/ink/render_segments_ink.mjs. If you see this panel in a render, the film was built with the wrong engine. */
export const InkShot: React.FC<ShotProps> = ({shot}) => <AbsoluteFill style={{background: '#1a1630', color: '#fff', fontFamily: 'monospace', fontSize: 34, justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 80}}>{shot.id}: drawn by the inkbeat engine (ink-plan.json). Build with tools/build_video.mjs.</AbsoluteFill>;
