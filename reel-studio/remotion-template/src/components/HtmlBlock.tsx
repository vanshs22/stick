import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {useShotTime} from '../engine/time';
import type {ShotProps} from '../engine/types';

/**
 * Hosts a HyperFrames-style HTML block (HTML + CSS + a PAUSED GSAP timeline registered on window.__timelines[id]) inside Remotion.
 * There is ONE clock: Remotion's frame. Each frame this seeks the block's timeline to the shot-local time, so the result is deterministic
 * and never runs a second timeline of its own. Blocks come from `npx hyperframes add <block>` (Apache-2.0 registry) or are hand-written.
 * props: src (path inside public/, e.g. hyperframes/lower-third.html), id (timeline id, default = the first registered), vars (given to the block as window.__hfVariables, the HyperFrames contract, AND as {{key}} text replacements),
 *        at (seconds into the shot when the block starts), fit ('contain' = whole block visible, 'cover' = fills the 9:16 frame and crops; default contain)
 */
export const HtmlBlock: React.FC<ShotProps & {src: string; id?: string; vars?: Record<string, any>; at?: number; fit?: 'contain' | 'cover'}> = ({shot, src, id, vars = {}, at = 0, fit = 'contain'}) => {
  const {lt} = useShotTime(shot);
  const frame = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<{html: string; w: number; h: number} | null>(null);
  const [handle] = useState(() => delayRender(`html-block ${src}`, {timeoutInMilliseconds: 60000}));
  useEffect(() => {
    fetch(staticFile(src)).then((r) => { if (!r.ok) throw new Error(`HtmlBlock: ${src} not found (HTTP ${r.status})`); return r.text(); }).then((t) => {
      let html = t.replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[\d.]+\/dist\/gsap(\.min)?\.js/g, new URL(staticFile('vendor/gsap.min.js'), window.location.href).href);
      for (const [k, v] of Object.entries(vars)) html = html.split(`{{${k}}}`).join(String(v));
      // HyperFrames blocks read their variables from window.__hfVariables (layered over the defaults declared in data-composition-variables); it must exist BEFORE the block's own script runs
      if (Object.keys(vars).length) html = html.replace(/<head[^>]*>/i, (m) => `${m}<script>window.__hfVariables=${JSON.stringify(vars).replace(/</g, '\\u003c')};</script>`);
      const w = +(html.match(/data-width="(\d+)"/)?.[1] || 1080), h = +(html.match(/data-height="(\d+)"/)?.[1] || 1920);
      setDoc({html, w, h});
    }).catch((e) => { throw e; });
  }, [src]);
  const seek = () => { const w: any = frame.current?.contentWindow; const tls = w?.__timelines; if (!tls) return false; const tl = tls[id || Object.keys(tls)[0]]; if (!tl) return false; tl.pause(); tl.time(Math.max(0, lt - at), false); return true; };
  useLayoutEffect(() => { if (doc) seek(); }, [lt, doc]);
  if (!doc) return null;
  const k = (fit === 'cover' ? Math.max : Math.min)(1080 / doc.w, 1920 / doc.h);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <iframe ref={frame} srcDoc={doc.html} title={src} onLoad={() => { setTimeout(() => { seek(); continueRender(handle); }, 120); }} style={{width: doc.w, height: doc.h, border: 0, background: 'transparent', transform: `scale(${k})`, transformOrigin: 'center center', flex: 'none'}} />
    </AbsoluteFill>
  );
};
