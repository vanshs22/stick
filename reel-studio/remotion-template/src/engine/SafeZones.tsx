import React from 'react';
import {SAFE, W, H} from './tokens';

/** Debug overlay (pass safeZones=true): content must stay between the two lines; the red strip is covered by platform buttons. */
export const SafeZones: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.top, borderTop: '3px dashed #00c2ff'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.bottom, borderTop: '3px dashed #00c2ff'}} />
    <div style={{position: 'absolute', top: 0, bottom: 0, right: 0, width: SAFE.right_margin, background: 'rgba(255,0,0,0.12)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: H - 300, bottom: 0, background: 'rgba(255,0,0,0.10)'}} />
    <div style={{position: 'absolute', left: 8, top: SAFE.caption_y - 22, fontSize: 22, color: '#00c2ff', fontFamily: 'monospace'}}>captions y={SAFE.caption_y}  ({W}x{H})</div>
  </div>
);
