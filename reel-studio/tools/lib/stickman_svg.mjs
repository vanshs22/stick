// Original cartoon stickman as a flat SVG sprite (512 x 1024, feet at y 1000): big round white head, thick ink outline, thin limbs, white gloves.
// Used to bake transparent PNG sprites (tools/sprites_stick.mjs) that stand in lit 3D worlds (style 2: stickman in a 3D world).
// stickSVG({pose, mood, mouth ('closed'|'open'), look})  ->  svg string
export const POSES = ['idle', 'point', 'cheer', 'shock', 'think', 'shrug', 'walkA', 'walkB', 'flail', 'hammer'];
export const MOODS = ['neutral', 'happy', 'laugh', 'shock', 'sad', 'smug', 'scared', 'angry', 'determined'];
const INK = '#141414', W = 7;
const P = (a) => a.map((v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v)).join(' ');
// each pose: [right-shoulder side arm path (elbow, hand), left arm (elbow, hand), leg feet x offsets, body lean px, head dy]
const SH = { L: [214, 404], R: [298, 404] };
const POSE = {
  idle:   { aL: [[196, 500], [190, 590]], aR: [[316, 500], [322, 590]], legs: [-34, 34], lean: 0, bob: 0 },
  point:  { aL: [[190, 500], [186, 586]], aR: [[372, 420], [452, 396]], legs: [-30, 36], lean: 6, bob: 0 },
  cheer:  { aL: [[170, 330], [150, 230]], aR: [[342, 330], [362, 230]], legs: [-36, 36], lean: 0, bob: -6 },
  shock:  { aL: [[160, 330], [190, 262]], aR: [[352, 330], [322, 262]], legs: [-30, 30], lean: -6, bob: 0 },
  think:  { aL: [[196, 500], [190, 590]], aR: [[330, 470], [286, 366]], legs: [-30, 36], lean: 4, bob: 0 },
  shrug:  { aL: [[150, 470], [120, 420]], aR: [[362, 470], [392, 420]], legs: [-34, 34], lean: 0, bob: 6 },
  walkA:  { aL: [[236, 490], [262, 568]], aR: [[280, 490], [250, 560]], legs: [-74, 76], lean: 8, bob: 0 },
  walkB:  { aL: [[176, 490], [150, 566]], aR: [[336, 490], [366, 560]], legs: [66, -72], lean: 8, bob: -8 },
  flail:  { aL: [[150, 360], [100, 296]], aR: [[366, 330], [430, 262]], legs: [-60, 70], lean: -14, bob: -22 },
  hammer: { aL: [[196, 500], [190, 590]], aR: [[350, 380], [364, 268]], legs: [-34, 34], lean: 0, bob: 0 },
};
function brow(cx, y, mood, side) {   // side -1 left / +1 right; returns path d
  const s = side, up = { neutral: 0, happy: -6, laugh: -10, shock: -22, sad: 8, smug: -4, scared: -16, angry: 6, determined: 8 }[mood] ?? 0;
  const tilt = { neutral: 0, happy: 0, laugh: -3, shock: -2, sad: -16, smug: s < 0 ? 0 : -10, scared: -14, angry: 20, determined: 14 }[mood] ?? 0;   // positive = inner end down
  const x0 = cx - 40, x1 = cx + 40, yo = y + up, inner = s < 0 ? x1 : x0, outer = s < 0 ? x0 : x1;
  return `M ${outer} ${yo - tilt * 0.4} Q ${cx} ${yo - 18 - (mood === 'shock' ? 8 : 0)} ${inner} ${yo + tilt * 0.8}`;
}
function mouth(mood, open, cx, cy) {
  const o = open === 'open';
  switch (mood) {
    case 'happy': return o ? `<path d="M ${cx - 46} ${cy} Q ${cx} ${cy + 66} ${cx + 46} ${cy} Z" fill="#6b1d22" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/><path d="M ${cx - 24} ${cy + 36} Q ${cx} ${cy + 22} ${cx + 24} ${cy + 36} Q ${cx} ${cy + 56} ${cx - 24} ${cy + 36}" fill="#e8737a"/>` : `<path d="M ${cx - 44} ${cy} Q ${cx} ${cy + 40} ${cx + 44} ${cy}" fill="none" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>`;
    case 'laugh': return `<path d="M ${cx - 56} ${cy - 6} Q ${cx} ${cy + 86} ${cx + 56} ${cy - 6} Z" fill="#6b1d22" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/><path d="M ${cx - 30} ${cy + 40} Q ${cx} ${cy + 24} ${cx + 30} ${cy + 40} Q ${cx} ${cy + 66} ${cx - 30} ${cy + 40}" fill="#e8737a"/>`;
    case 'shock': case 'scared': return `<ellipse cx="${cx}" cy="${cy + 14}" rx="${o ? 24 : 20}" ry="${o ? 34 : 28}" fill="#6b1d22" stroke="${INK}" stroke-width="${W}"/>`;
    case 'sad': return o ? `<path d="M ${cx - 34} ${cy + 26} Q ${cx} ${cy - 6} ${cx + 34} ${cy + 26} Z" fill="#6b1d22" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/>` : `<path d="M ${cx - 34} ${cy + 24} Q ${cx} ${cy - 4} ${cx + 34} ${cy + 24}" fill="none" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>`;
    case 'smug': return `<path d="M ${cx - 36} ${cy + 8} Q ${cx + 6} ${cy + 26} ${cx + 44} ${cy - 6}" fill="none" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>`;
    case 'angry': return o ? `<path d="M ${cx - 38} ${cy + 22} L ${cx - 20} ${cy - 4} L ${cx + 20} ${cy - 4} L ${cx + 38} ${cy + 22} Z" fill="#6b1d22" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/>` : `<path d="M ${cx - 34} ${cy + 16} L ${cx + 34} ${cy + 16}" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>`;
    case 'determined': return o ? `<path d="M ${cx - 40} ${cy} Q ${cx} ${cy + 36} ${cx + 40} ${cy} Z" fill="#6b1d22" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/>` : `<path d="M ${cx - 32} ${cy + 12} Q ${cx} ${cy + 20} ${cx + 32} ${cy + 12}" fill="none" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>`;
    default: return o ? `<ellipse cx="${cx}" cy="${cy + 14}" rx="22" ry="${18}" fill="#6b1d22" stroke="${INK}" stroke-width="${W}"/>` : `<path d="M ${cx - 28} ${cy + 12} Q ${cx} ${cy + 22} ${cx + 28} ${cy + 12}" fill="none" stroke="${INK}" stroke-width="${W}" stroke-linecap="round"/>`;
  }
}
function eye(cx, cy, mood, side) {
  const rx = mood === 'shock' || mood === 'scared' ? 40 : 34, ry = mood === 'laugh' || mood === 'happy' ? 18 : mood === 'smug' ? 22 : mood === 'angry' || mood === 'determined' ? 32 : mood === 'sad' ? 36 : mood === 'shock' || mood === 'scared' ? 48 : 40;
  if (mood === 'laugh') return `<path d="M ${cx - 34} ${cy + 6} Q ${cx} ${cy - 34} ${cx + 34} ${cy + 6}" fill="none" stroke="${INK}" stroke-width="${W + 2}" stroke-linecap="round"/>`;
  const px = (mood === 'smug' ? 10 : 6) * (side), py = mood === 'sad' ? 8 : mood === 'smug' ? -2 : 2, pr = mood === 'shock' || mood === 'scared' ? 10 : 17;
  const lid = mood === 'smug' ? `<path d="M ${cx - rx} ${cy - 2} L ${cx + rx} ${cy - 2} L ${cx + rx} ${cy - ry - 4} L ${cx - rx} ${cy - ry - 4} Z" fill="#fff" stroke="none"/><path d="M ${cx - rx - 2} ${cy - 2} L ${cx + rx + 2} ${cy - 2}" stroke="${INK}" stroke-width="${W}"/>` : '';
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${INK}" stroke-width="${W}"/><circle cx="${cx + px}" cy="${cy + py}" r="${pr}" fill="${INK}"/><circle cx="${cx + px + 5}" cy="${cy + py - 6}" r="5" fill="#fff"/>` + lid;
}
function limb(x0, y0, mid, end, col = INK, w = 15) { return `<path d="M ${x0} ${y0} Q ${mid[0]} ${mid[1]} ${end[0]} ${end[1]}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; }
function hand(x, y) { return `<circle cx="${x}" cy="${y}" r="21" fill="#fff" stroke="${INK}" stroke-width="${W}"/>`; }
function hat(kind, cx, cy, col) {
  if (kind === 'straw') return `<ellipse cx="${cx}" cy="${cy - 118}" rx="205" ry="38" fill="${col}" stroke="${INK}" stroke-width="${W}"/><path d="M ${cx - 112} ${cy - 124} Q ${cx - 104} ${cy - 236} ${cx} ${cy - 238} Q ${cx + 104} ${cy - 236} ${cx + 112} ${cy - 124} Q ${cx} ${cy - 96} ${cx - 112} ${cy - 124} Z" fill="${col}" stroke="${INK}" stroke-width="${W}"/><path d="M ${cx - 108} ${cy - 148} Q ${cx} ${cy - 122} ${cx + 108} ${cy - 148}" fill="none" stroke="#a24b2f" stroke-width="22"/>`;
  if (kind === 'sun') return `<ellipse cx="${cx}" cy="${cy - 112}" rx="230" ry="44" fill="${col}" stroke="${INK}" stroke-width="${W}"/><path d="M ${cx - 120} ${cy - 118} Q ${cx - 112} ${cy - 216} ${cx} ${cy - 220} Q ${cx + 112} ${cy - 216} ${cx + 120} ${cy - 118} Q ${cx} ${cy - 86} ${cx - 120} ${cy - 118} Z" fill="${col}" stroke="${INK}" stroke-width="${W}"/><path d="M ${cx - 116} ${cy - 142} Q ${cx} ${cy - 112} ${cx + 116} ${cy - 142}" fill="none" stroke="#e86f8a" stroke-width="20"/>`;
  if (kind === 'cap') return `<path d="M ${cx - 138} ${cy - 70} Q ${cx - 132} ${cy - 196} ${cx} ${cy - 200} Q ${cx + 132} ${cy - 196} ${cx + 138} ${cy - 70} Z" fill="${col}" stroke="${INK}" stroke-width="${W}"/><path d="M ${cx + 30} ${cy - 84} L ${cx + 200} ${cy - 76} Q ${cx + 214} ${cy - 62} ${cx + 188} ${cy - 56} L ${cx + 40} ${cy - 62} Z" fill="${col}" stroke="${INK}" stroke-width="${W}"/>`;
  return '';
}
/** look: {shirt, pants?, hat: 'straw'|'sun'|'cap'|'none', hatColor, scarf?, cheeks?: bool, apron?} */
export function stickSVG({ pose = 'idle', mood = 'neutral', mouth: m = 'closed', look = {} } = {}) {
  const po = POSE[pose] || POSE.idle, shirt = look.shirt || '#2F7D5B', hatKind = look.hat ?? 'straw', hatCol = look.hatColor || '#E3C06A', lean = po.lean, bob = po.bob;
  const hx = 256 + lean * 1.4, hy = 236 + bob, nx = 256 + lean * 0.8, ty = 392 + bob * 0.6;
  const hipL = [256 - 22 + lean * 0.3, 640], hipR = [256 + 22 + lean * 0.3, 640];
  const legL = limb(hipL[0], hipL[1], [hipL[0] + po.legs[0] * 0.4, 820], [256 + po.legs[0] * 1.5 - 20, 976]), legR = limb(hipR[0], hipR[1], [hipR[0] + po.legs[1] * 0.4, 820], [256 + po.legs[1] * 1.5 + 20, 976]);
  const shoe = (x) => `<ellipse cx="${x}" cy="990" rx="40" ry="17" fill="#222" stroke="${INK}" stroke-width="${W}"/>`;
  const aL = po.aL, aR = po.aR, sL = [SH.L[0] + lean * 0.8, ty + 14], sR = [SH.R[0] + lean * 0.8, ty + 14];
  const hands = (A, S) => limb(S[0], S[1], A[0], A[1]) + hand(A[1][0], A[1][1]);
  const face = `${eye(hx - 52, hy + 4, mood, -1)}${eye(hx + 52, hy + 4, mood, 1)}<path d="${brow(hx - 52, hy - 62, mood, -1)}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="${brow(hx + 52, hy - 62, mood, 1)}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>${mouth(mood, m, hx, hy + 78)}`;
  const cheeks = look.cheeks === false ? '' : `<ellipse cx="${hx - 98}" cy="${hy + 58}" rx="20" ry="12" fill="#f4a9a0" opacity="0.55"/><ellipse cx="${hx + 98}" cy="${hy + 58}" rx="20" ry="12" fill="#f4a9a0" opacity="0.55"/>`;
  const sweat = mood === 'scared' ? `<path d="M ${hx + 138} ${hy - 80} Q ${hx + 156} ${hy - 40} ${hx + 138} ${hy - 22} Q ${hx + 118} ${hy - 40} ${hx + 138} ${hy - 80} Z" fill="#8fd3ff" stroke="${INK}" stroke-width="5"/>` : '';
  const torso = `<path d="M ${nx - 52} ${ty} Q ${nx - 66} ${ty + 120} ${nx - 46} ${ty + 244} L ${nx + 46} ${ty + 244} Q ${nx + 66} ${ty + 120} ${nx + 52} ${ty} Q ${nx} ${ty - 14} ${nx - 52} ${ty} Z" fill="${shirt}" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/>` + (look.apron ? `<path d="M ${nx - 36} ${ty + 70} L ${nx + 36} ${ty + 70} L ${nx + 42} ${ty + 244} L ${nx - 42} ${ty + 244} Z" fill="${look.apron}" stroke="${INK}" stroke-width="5"/>` : '') + (look.scarf ? `<path d="M ${nx - 58} ${ty - 2} Q ${nx} ${ty + 22} ${nx + 58} ${ty - 2} L ${nx + 54} ${ty + 22} Q ${nx} ${ty + 46} ${nx - 54} ${ty + 22} Z" fill="${look.scarf}" stroke="${INK}" stroke-width="5"/>` : '');
  const prop = pose === 'hammer' ? `<g transform="translate(${aR[1][0]} ${aR[1][1]}) rotate(-24)"><rect x="-8" y="-150" width="16" height="170" rx="6" fill="#9b6b3c" stroke="${INK}" stroke-width="5"/><rect x="-44" y="-176" width="88" height="40" rx="8" fill="#9aa3ad" stroke="${INK}" stroke-width="6"/></g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="1084" viewBox="0 -60 512 1084">
${legL}${legR}${shoe(256 + po.legs[0] * 1.5 - 20)}${shoe(256 + po.legs[1] * 1.5 + 20)}
${hands(aL, sL)}
<line x1="${nx}" y1="${hy + 150}" x2="${nx}" y2="${ty + 6}" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
${torso}
<circle cx="${hx}" cy="${hy}" r="158" fill="#fff" stroke="${INK}" stroke-width="${W + 1}"/>
${cheeks}${face}${sweat}${hat(hatKind, hx, hy, hatCol)}
${hands(aR, sR)}${prop}
</svg>`;
}
