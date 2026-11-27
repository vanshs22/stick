import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, delayRender, continueRender, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {talkAt, useShotTime} from '../engine/time';
import timeline from '../data/timeline.json';
import type {ShotProps} from '../engine/types';
// @ts-ignore (plain JS modules from the faceless-shorts engine, adapted)
import {makeEngine, QUALITY} from '../three/engine.js';
// @ts-ignore
import {buildWorld} from '../three/worlds.js';
// @ts-ignore
import {makeActor, makeProp} from '../three/cast.js';
// @ts-ignore
import {cameraAt} from '../three/cinema.js';
import style from '../data/style.json';
const PD = (((style as any).defaults || {}).stage3d || {}) as Record<string, any>;

/**
 * A directed 3D shot rendered with the film-look engine (soft shadows, depth of field, bloom, tone mapping).
 * props:
 *  world: 'home-studio' | ...        worldOpts: {...}
 *  cast: [{id, kind:'human'|'critter'|'blocky'|'stick', look:{...}, at:[x,z], rotY, pose:[[t,'gesture']...], mood:[[t,'mood']...], lookAt:'id', reach:[{target,side,from,to}], speaks}]
 *  props3d: [{id, kind:'giftbox', at:[x,y,z], open:[startSec, durSec]}]
 *  camera: the cinematography spec (framing, angle, subject, movement{type, why, from, to, target, duration, profile, curve, focus}) — see docs/CINEMATOGRAPHY.md
 *  look: {bloom, aperture, exposure, vignette, grain}
 * Everything is a pure function of the Remotion frame.
 */
type Entry = Record<string, any>;
export const Stage3D: React.FC<ShotProps & {world?: string; worldOpts?: Entry; cast?: Entry[]; props3d?: Entry[]; camera?: Entry; look?: Entry}> = ({shot, world = PD.world || 'home-studio', worldOpts = PD.worldOpts, cast: castIn = [], props3d = [], camera = {framing: 'medium', subject: castIn[0]?.id}, look: lookIn}) => {
  const cast: Entry[] = castIn.map((c) => ({...c, look: {...(PD.cast?.[c.kind || 'human'] || {}), ...(c.look || {})}}));   // the pack's costume is the default: one character, one look, every shot
  const look = {...(PD.look || {}), ...(lookIn || {})};
  const ref = useRef<HTMLCanvasElement>(null);
  const {width, height} = useVideoConfig();
  const {t, lt, d} = useShotTime(shot);
  const dpr = typeof window !== 'undefined' ? Math.min(1, window.devicePixelRatio || 1) : 1;
  const W = Math.round(width * dpr), H = Math.round(height * dpr);
  const S = useRef<any>(null);

  useLayoutEffect(() => {
    const h = delayRender('stage3d', {timeoutInMilliseconds: 180000});
    let doRender: (() => void) | null = null;
    try {
      const canvas = ref.current!;
      if (!S.current) {
        QUALITY.shadow = dpr < 0.75 ? 1024 : 2048;
        const E = makeEngine(canvas, {w: W, h: H, samples: dpr < 0.75 ? 0 : 2, shadowSize: QUALITY.shadow});
        const wd = buildWorld(world, E, worldOpts), actors = cast.map((c) => makeActor(c)), props = props3d.map((p) => makeProp(p));
        [...actors, ...props].forEach((a: any) => wd.scene.add(a.group));
        // glossy floor: a faded upside-down copy of every character and small set piece under it (kept in sync each frame)
        const mirrors: any[] = [];
        if (wd.reflect) [...actors, ...props].forEach((a: any) => { if (['keywall', 'neonring', 'screen'].includes(a.kind)) return; const copy = a.group.clone(true), wrap = new THREE.Group(); wrap.scale.y = -1; wrap.add(copy);
          copy.traverse((o: any) => { if (o.isMesh) { const fade = (m: any) => { const c = m.clone(); c.transparent = true; c.opacity = (m.opacity ?? 1) * 0.2; c.depthWrite = false; return c; }; o.material = Array.isArray(o.material) ? o.material.map(fade) : fade(o.material); o.castShadow = false; o.receiveShadow = false; o.renderOrder = 0; } });
          wd.scene.add(wrap); mirrors.push({src: a.group, copy}); });
        const cam = new THREE.PerspectiveCamera(30, width / height, 0.05, 120);
        S.current = {E, wd, actors, props, cam, mirrors};
      }
      const {E, wd, actors, props, cam, mirrors} = S.current;
      doRender = () => {
      const hasSpeakers = ((timeline as any).words || []).some((w: any) => w.speaker);
      const byId: Record<string, any> = {};
      [...actors, ...props].forEach((a: any) => (byId[a.id] = a));
      const ctx = {target: (id: string, off?: number[]) => { const s = byId[id] ? byId[id].subject() : wd.subjects[id]; const p = new THREE.Vector3(s.pos[0], s.pos[1] + s.height * 0.7, s.pos[2]); if (off) p.add(new THREE.Vector3(...off)); return p; }};
      actors.forEach((a: any, i: number) => a.update(lt, t, cast[i].speaks === false ? 0 : hasSpeakers ? talkAt(t, cast[i].speaker || cast[i].id) : cast[i].speaks || i === 0 ? talkAt(t) : 0, ctx));
      props.forEach((p: any) => p.update(lt, t));
      wd.update?.(t, lt);
      (mirrors || []).forEach((m: any) => { const a: THREE.Object3D[] = [], b: THREE.Object3D[] = []; m.src.traverse((o: any) => a.push(o)); m.copy.traverse((o: any) => b.push(o)); a.forEach((o, i) => { const q = b[i]; if (!q) return; q.position.copy(o.position); q.quaternion.copy(o.quaternion); q.scale.copy(o.scale); q.visible = o.visible; }); });
      const subjects: Entry = {...wd.subjects};
      [...actors, ...props].forEach((a: any) => (subjects[a.id] = a.subject()));
      const c = cameraAt(camera, subjects, lt, d, width / height);
      cam.fov = c.fov; cam.aspect = width / height; cam.position.set(...(c.pos as [number, number, number])); cam.up.set(0, 1, 0); cam.lookAt(...(c.look as [number, number, number])); if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      E.render(wd.scene, cam, {...wd.look, ...look, focus: c.focusDist, aperture: look?.aperture ?? c.aperture, t});
      };
      doRender();
    } finally {
      // screen props load their picture asynchronously: hold the frame until every image is in, then draw it again
      const waits = ((S.current?.props || []) as any[]).map((q) => q.ready).filter(Boolean);
      if (waits.length && doRender && !S.current.loaded) Promise.all(waits).then(() => { S.current.loaded = true; doRender && doRender(); continueRender(h); }).catch(() => continueRender(h)); else continueRender(h);
    }
  }, [t]);
  useEffect(() => () => { try { S.current?.E.renderer.dispose(); S.current?.E.renderer.forceContextLoss(); } catch (e) { /* ignore */ } }, []);
  return <AbsoluteFill style={{background: '#000'}}><canvas ref={ref} width={W} height={H} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
