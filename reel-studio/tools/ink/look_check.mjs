// Validate a pack's `ink_look` (3D look as data, renderers/inkbeat/src/looks/custom.tsx). Returns a list of problems; empty = ok.
//   node tools/ink/look_check.mjs <look.json | style.json>
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
export const BASES = ['day', 'dusk', 'night', 'cold', 'lamp', 'golden', 'kids-day', 'kids-night', 'zd-studio', 'zd-inside', 'anime-day', 'anime-dusk', 'pixar-warm', 'pixar-cool', 'pixar-golden'];
export const HEROES = ['kidsong', 'zackd', 'anime', 'pixar'], PRESETS = ['playroom', 'studio', 'street', 'kitchen'];
export const SHAPES = ['box', 'round', 'cyl', 'sph', 'cone', 'tor', 'label', 'glow', 'panel'], TEX = ['plaster', 'planks', 'wood', 'stone', 'brick', 'roofTiles', 'shingles', 'rock', 'sand', 'grass', 'fabric', 'metal', 'paper', 'none'];
const hex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c), v3 = (a) => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite);
export function checkLook(L) {
  const e = [];
  if (!L || typeof L !== 'object') return ['ink_look is not an object'];
  const ms = Object.entries(L.moods || {}); if (!ms.length) e.push('moods: at least one mood {base, patch}');
  for (const [k, m] of ms) { if (!/^[a-z0-9-]+$/.test(k)) e.push(`mood id "${k}": lowercase letters, digits, dashes`); if (!BASES.includes(m?.base)) e.push(`mood ${k}: base "${m?.base}" is not one of ${BASES.join(', ')}`); }
  if (L.ink != null && !(L.ink >= 0 && L.ink <= 1)) e.push('ink: 0..1');
  if (L.hero?.base && !HEROES.includes(L.hero.base)) e.push(`hero.base must be one of ${HEROES.join(', ')}`);
  const s = L.set; if (!s) e.push('set: {preset} or {floor, walls, props}');
  else if (s.preset) { if (!PRESETS.includes(s.preset)) e.push(`set.preset must be one of ${PRESETS.join(', ')}`); }
  else {
    if (!s.floor || !hex(s.floor.c)) e.push('set.floor.c: a #rrggbb colour (a set with no floor leaves the hero floating)');
    if (s.walls && !hex(s.walls.c)) e.push('set.walls.c: #rrggbb');
    if (s.ceiling && !hex(s.ceiling)) e.push('set.ceiling: #rrggbb');
    const pr = s.props || []; if (pr.length > 80) e.push('set.props: at most 80 entries (use repeat for rows)'); if (!pr.length) e.push('set.props: an empty room is a bad shot; add the objects the story is about');
    pr.forEach((o, i) => {
      const w = `props[${i}]`; if (!SHAPES.includes(o.k)) e.push(`${w}.k "${o.k}" is not one of ${SHAPES.join(', ')}`);
      if (o.c && !hex(o.c)) e.push(`${w}.c: #rrggbb`); if (o.p && !v3(o.p)) e.push(`${w}.p: [x,y,z]`); if (o.k === 'panel' && !['rug', 'stripes', 'canvas', 'waves', 'checker', 'planks', 'scales'].includes(o.pat)) e.push(`${w}.pat: rug | stripes | canvas | waves | checker | planks | scales`); if (o.tex && !TEX.includes(o.tex)) e.push(`${w}.tex "${o.tex}" is not one of ${TEX.join(', ')}`);
      if (o.k === 'label' && !o.text) e.push(`${w}: a label needs text`); if (o.repeat && !(o.repeat.n >= 1 && o.repeat.n <= 40 && v3(o.repeat.step))) e.push(`${w}.repeat: {n 1..40, step [x,y,z]}`);
    });
    if (s.lights?.length > 6) e.push('set.lights: at most 6 (each is a real light: software GL is slow)');
  }
  return e;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), p = checkLook(Array.isArray(j) ? j[0].ink_look : j.ink_look || j); console.log(p.length ? p.join('\n') : 'ok'); process.exit(p.length ? 1 : 0); }
