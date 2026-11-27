// Render quality tier (input prop `quality`, set by tools/ink/render_segments_ink.mjs --quality). Software GL pays per pixel pass:
// Measured on 8 CPU cores, software GL, 702x1248: the cost is NOT the pixels or the shadow map (a 4.7x smaller frame or a 128 px shadow map changed nothing).
// It is the full-screen post passes (depth of field + bloom about 0.85 s per frame) and the hero's 120k triangles (about 0.5 s); the rest is a fixed floor of about 1 s.
// master = everything: 4x MSAA, 2x supersampled depth pass, 2048 shadow map, depth of field, bloom (the original look)
// fast   = no depth of field, 2x MSAA, 1x depth pass, 1024 shadow map, bloom kept (use with --fps-div 2: about 4x faster in total)
// draft  = also no bloom (looks and storyboards)
import { getInputProps } from "remotion";
const TIERS = { master: { msaa: 4, ss: 2, shadow: 2048, dof: true, bloom: true }, fast: { msaa: 2, ss: 1, shadow: 1024, dof: false, bloom: true }, draft: { msaa: 0, ss: 1, shadow: 1024, dof: false, bloom: false } } as const;
// the tier comes in as an input prop (renderMedia inputProps.quality): a bundle can be reused for every tier
let name = "master";
try { name = (getInputProps() as any).quality || "master"; } catch { /* studio preview: master */ }
export const QUALITY = name as keyof typeof TIERS;
export const Q = (TIERS as any)[name] ?? TIERS.master;
