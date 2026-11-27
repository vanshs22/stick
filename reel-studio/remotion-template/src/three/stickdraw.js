// Hand-animated cartoon stickman drawn with Canvas2D every frame (style 2: a 2D character living in a 3D world).
// Joint-driven: shoulders, elbows, hips, knees, torso lean, head tilt, a 3/4 turn, brows, blinking eyes, a continuous mouth, squash and stretch,
// and the slightly boiling line of hand-drawn animation (the line re-wobbles at 12 fps). Pure function of its arguments.
//   drawStick(ctx, W, H, s)  s = { t, pose: {...joints}, look:{...costume}, expr:{brow, tilt, smile, open, eyes, look:[x,y]}, turn, walk, seed }
const R = Math.PI / 180, INK = '#161616';
export const POSES = {
  idle:   { sL: [8, 10], sR: [8, 10], hL: [4, 4], hR: [4, 4], lean: 0, tilt: 0 },
  point:  { sL: [8, 10], sR: [84, 8], hL: [4, 4], hR: [4, 4], lean: 4, tilt: 3 },
  cheer:  { sL: [150, 20], sR: [150, 20], hL: [5, 4], hR: [5, 4], lean: -3, tilt: 0 },
  shock:  { sL: [118, 120], sR: [118, 120], hL: [4, 3], hR: [4, 3], lean: -5, tilt: -4 },
  think:  { sL: [8, 10], sR: [40, 130], hL: [4, 4], hR: [4, 4], lean: 3, tilt: 6 },
  shrug:  { sL: [52, 70], sR: [52, 70], hL: [4, 4], hR: [4, 4], lean: 0, tilt: 5 },
  hammer: { sL: [8, 10], sR: [128, 60], hL: [4, 4], hR: [4, 4], lean: 2, tilt: 0 },
  flail:  { sL: [130, 20], sR: [160, 30], hL: [30, 30], hR: [18, 50], lean: -12, tilt: -8 },
  hold:   { sL: [60, 60], sR: [60, 60], hL: [4, 4], hR: [4, 4], lean: 2, tilt: 0 },
  slump:  { sL: [4, 8], sR: [4, 8], hL: [3, 6], hR: [3, 6], lean: 8, tilt: 10 },
};
export const EXPR = {
  neutral: { brow: 0, tilt: 0, smile: 0.2, open: 0, eyes: 1 }, happy: { brow: -0.2, tilt: 0, smile: 0.9, open: 0.25, eyes: 0.8 }, laugh: { brow: -0.5, tilt: 0, smile: 1, open: 0.9, eyes: 0 },
  shock: { brow: -1, tilt: 0.1, smile: 0, open: 0.8, eyes: 1.3 }, scared: { brow: -0.8, tilt: 0.9, smile: -0.2, open: 0.5, eyes: 1.25 }, sad: { brow: 0.3, tilt: 0.8, smile: -0.8, open: 0.05, eyes: 0.85 },
  smug: { brow: -0.1, tilt: -0.3, smile: 0.6, open: 0, eyes: 0.55 }, angry: { brow: 0.4, tilt: -1, smile: -0.5, open: 0.4, eyes: 0.8 }, determined: { brow: 0.3, tilt: -0.7, smile: 0.1, open: 0.15, eyes: 0.9 },
};
const mix = (a, b, k) => a + (b - a) * k, rn = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const wob = (seed, i, amp) => (rn(seed * 13 + i * 7.31) - 0.5) * 2 * amp;
export function blendPose(a, b, k) { const o = {}; for (const key of Object.keys(a)) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => mix(v, b[key][i], k)) : mix(a[key], b[key], k); return o; }
export function blendExpr(a, b, k) { const o = {}; for (const key of Object.keys(a)) o[key] = mix(a[key], b[key], k); return o; }

export function drawStick(ctx, W, H, s) {
  const { t = 0, pose = POSES.idle, look = {}, expr = EXPR.neutral, turn = 0, walk = 0, seed = 1 } = s, u = H / 1160, fr = Math.floor(t * 12), L = (w) => w * u;
  ctx.clearRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H * 0.985); ctx.scale(u, u); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bob = Math.sin(t * 2.2 + seed) * 3 + Math.abs(Math.sin(walk * Math.PI)) * -16 * (walk ? 1 : 0), sq = 1 + Math.sin(t * 2.2 + seed) * 0.006;
  const wb = (i, a = 2.2) => wob(seed + fr * 0.37, i, a);                       // boiling line: new wobble every 1/12 s
  const stroke = (w, col = INK) => { ctx.strokeStyle = col; ctx.lineWidth = w; };
  const line = (pts, w, col = INK) => { stroke(w, col); ctx.beginPath(); ctx.moveTo(pts[0][0] + wb(1), pts[0][1] + wb(2)); for (let i = 1; i < pts.length; i++) { const p = pts[i], q = pts[i - 1]; ctx.quadraticCurveTo(q[0] + wb(i * 3), q[1] + wb(i * 5), (p[0] + q[0]) / 2 + wb(i * 7), (p[1] + q[1]) / 2 + wb(i * 11)); } ctx.lineTo(pts[pts.length - 1][0] + wb(13), pts[pts.length - 1][1] + wb(17)); ctx.stroke(); };
  const lean = pose.lean * R + walk * 0.05, hipY = -410 + bob, shY = -690 + bob, shX = Math.sin(lean) * 120, hdY = -870 + bob * 1.2;
  const limb = (ox, oy, a1, a2, l1, l2, w, sd = 1) => { const e = [ox + sd * Math.sin(a1) * l1, oy + Math.cos(a1) * l1], h = [e[0] + sd * Math.sin(a1 + a2) * l2, e[1] + Math.cos(a1 + a2) * l2]; line([[ox, oy], e, h], w); return h; };
  // legs (hip angle, knee bend); walking swings them in opposition
  const sw = walk ? Math.sin(walk * Math.PI * 2) : 0, dirx = turn >= 0 ? 1 : -1, sp = Math.abs(turn) > 0.5 ? 0.5 : 0.12;   // side-on walk swings the legs along x, front-on lifts the knees
  const thL = -pose.hL[0] * R - sw * sp * dirx, thR = pose.hR[0] * R + sw * sp * dirx, kL = (pose.hL[1] + Math.max(0, sw) * 40) * R, kR = (pose.hR[1] + Math.max(0, -sw) * 40) * R;
  const boot = (p, ang) => { ctx.save(); ctx.translate(p[0], p[1] + 8); ctx.rotate(ang); stroke(L(7)); ctx.fillStyle = look.boots || '#2b2118'; ctx.beginPath(); ctx.ellipse(10 * dirx, 0, 46, 22, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); };
  const lg = (hx, th, kb) => { const e = [hx + Math.sin(th) * 205, hipY + Math.cos(th) * 205], h = [e[0] + Math.sin(th - kb * Math.sign(th || 1) * 0.0 + kb * -1 * dirx) * 205, e[1] + Math.cos(th + kb * -1 * dirx) * 205]; line([[hx, hipY], e, h], 12); return h; };
  const fL = lg(-26 + shX * 0.3, thL, kL), fR = lg(26 + shX * 0.3, thR, kR); boot(fL, 0); boot(fR, 0.05);
  // back arm (viewer's right), torso, head, front arm
  const hand = (p, col = '#fff') => { stroke(L(7)); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], 27, 0, 7); ctx.fill(); ctx.stroke(); };
  const armOf = (side, a) => { const ox = shX + side * 56, oy = shY + 20, e = [ox + side * Math.sin(a[0] * R) * 150, oy + Math.cos(a[0] * R) * 150], h = limb(ox, oy, a[0] * R, a[1] * R, 150, 150, 10, side); if (look.shirt) { ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 31; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(e[0], e[1]); ctx.stroke(); ctx.strokeStyle = look.shirt; ctx.lineWidth = 21; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(e[0], e[1]); ctx.stroke(); } return h; }, aR = armOf(1, pose.sR); hand(aR);
  // torso (shirt, overalls)
  const sh = look.shirt || '#2F7D5B', tw = 56, g = ctx.createLinearGradient(-tw, 0, tw, 0); g.addColorStop(0, sh); g.addColorStop(1, '#00000033');
  ctx.save(); ctx.translate(shX * 0.5, 0); ctx.rotate(lean * 0.6); ctx.beginPath(); ctx.moveTo(-tw + wb(3), shY + 10); ctx.bezierCurveTo(-tw - 22, shY + 130, -tw - 10, hipY - 60, -tw + 10 + wb(4), hipY + 20); ctx.lineTo(tw - 10 + wb(5), hipY + 20); ctx.bezierCurveTo(tw + 10, hipY - 60, tw + 22, shY + 130, tw + wb(6), shY + 10); ctx.quadraticCurveTo(0, shY - 22, -tw, shY + 10); ctx.closePath();
  ctx.fillStyle = sh; ctx.fill(); ctx.fillStyle = g; ctx.fill(); stroke(L(7.5)); ctx.stroke();
  if (look.apron) { ctx.fillStyle = look.apron; ctx.beginPath(); ctx.moveTo(-48, shY + 90); ctx.lineTo(48, shY + 90); ctx.lineTo(56, hipY + 18); ctx.lineTo(-56, hipY + 18); ctx.closePath(); ctx.fill(); stroke(L(5)); ctx.stroke(); }
  if (look.overalls) { ctx.fillStyle = look.overalls; ctx.beginPath(); ctx.moveTo(-56, shY + 130); ctx.lineTo(56, shY + 130); ctx.lineTo(tw - 8, hipY + 20); ctx.lineTo(-tw + 8, hipY + 20); ctx.closePath(); ctx.fill(); stroke(L(6)); ctx.stroke(); [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(sd * 40, shY + 130); ctx.lineTo(sd * 30, shY + 20); ctx.stroke(); }); }
  if (look.scarf) { ctx.fillStyle = look.scarf; ctx.beginPath(); ctx.moveTo(-tw, shY + 4); ctx.quadraticCurveTo(0, shY + 40, tw, shY + 4); ctx.lineTo(tw - 6, shY + 34); ctx.quadraticCurveTo(0, shY + 70, -tw + 6, shY + 34); ctx.closePath(); ctx.fill(); stroke(L(5)); ctx.stroke(); }
  ctx.restore();
  // neck + head
  line([[shX * 0.6, shY + 6], [shX * 0.8 + wb(9), hdY + 100]], 12);
  ctx.save(); ctx.translate(shX * 1.1, hdY); ctx.rotate((pose.tilt + (expr.tilt2 || 0)) * R); const hw = 124 * (1 - Math.abs(turn) * 0.1), hh = 134;
  const hg = ctx.createRadialGradient(-hw * 0.35 + turn * 20, -hh * 0.4, 10, 0, 0, hh * 1.1); hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.7, '#f4f1ec'); hg.addColorStop(1, '#d9d4cb');
  ctx.beginPath(); for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2, rr = 1 + wb(i + 40, 0.012); const x = Math.cos(a) * hw * rr, y = Math.sin(a) * hh * rr * (Math.sin(a) > 0 ? 1.0 : 1.02); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fillStyle = hg; ctx.fill(); stroke(L(8)); ctx.stroke();
  const fx = turn * 46;   // face slides toward the turn
  ctx.fillStyle = '#efeae2'; stroke(L(6.5)); [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.ellipse(sd * (hw - 4) + fx * 0.3, 8, 18, 28, 0, 0, 7); ctx.fill(); ctx.stroke(); });
  ctx.beginPath(); ctx.ellipse(0, 0, 1, 1, 0, 0, 0); 
  ctx.beginPath(); ctx.moveTo(fx * 1.0 - 8, 26); ctx.quadraticCurveTo(fx * 1.0 + 12, 40, fx * 1.0 - 2, 46); stroke(L(5)); ctx.stroke();
  if (look.hair) { ctx.fillStyle = look.hair; ctx.beginPath(); ctx.moveTo(-hw + 6, -20); ctx.bezierCurveTo(-hw - 12, -150, -30, -170, 30 + fx * 0.4, -150); ctx.bezierCurveTo(120, -140, hw + 8, -80, hw - 6, -14); ctx.bezierCurveTo(80, -86, -50, -96, -hw + 6, -20); ctx.fill(); stroke(L(6.5)); ctx.stroke(); }
  const ep = { l: [-48 + fx, -6], r: [48 + fx, -6] }, open = Math.max(0, Math.min(1, expr.eyes ?? 1)), blink = (() => { const c = (t + seed * 0.7) % 4.1; return c < 0.13 ? Math.sin((c / 0.13) * Math.PI) : 0; })(), eo = open * (1 - blink * 0.95);
  for (const [k, side] of [['l', -1], ['r', 1]]) {
    const [ex, ey] = ep[k], rx = 25 * (1 + (open - 1) * 0.2), ry = Math.max(2.5, 31 * eo);
    if (open < 0.12) { stroke(L(8)); ctx.beginPath(); ctx.arc(ex, ey + 10, 26, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); continue; }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, 7); ctx.fill(); stroke(L(6)); ctx.stroke();
    const lk = s.gaze || [0, 0], px = ex + lk[0] * 10 + turn * 6, py = ey + lk[1] * 8; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(px, py, 15 * Math.min(1, ry / 24), Math.min(19, ry * 0.8), 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + 4, py - 5, 3.4, 0, 7); ctx.fill();
    const by = ey - 56 - expr.brow * 24, outer = [ex + side * 40, by + expr.tilt * 8 + (expr.tilt < 0 ? 4 : 0)], inner = [ex - side * 32, by - expr.tilt * 20], mid = [ex, by - 12 - Math.abs(expr.tilt) * 2]; line([outer, mid, inner], 11);
  }
  // mouth: a continuous curve from smile to frown with an opening
  const mx = fx * 0.9, my = 70, sm = expr.smile, op = Math.max(0, Math.min(1, expr.open + (s.talk || 0) * 0.7)), mw = 44 + Math.abs(sm) * 14;
  ctx.beginPath(); ctx.moveTo(mx - mw, my - sm * 6); ctx.quadraticCurveTo(mx, my + sm * 34 - op * 4, mx + mw, my - sm * 6); if (op > 0.12) { ctx.quadraticCurveTo(mx, my + sm * 30 + op * 74, mx - mw, my - sm * 6); ctx.closePath(); ctx.fillStyle = '#6b1d22'; ctx.fill(); if (op > 0.5 && sm > 0.3) { ctx.fillStyle = '#fff'; ctx.fillRect(mx - mw * 0.75, my - sm * 5, mw * 1.5, 12); ctx.fillStyle = '#e8737a'; ctx.beginPath(); ctx.ellipse(mx, my + op * 46, mw * 0.5, 14, 0, 0, 7); ctx.fill(); } }
  stroke(L(7.5)); ctx.stroke();
  if (look.cheeks !== false) { ctx.fillStyle = 'rgba(240,120,110,0.28)'; [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.ellipse(sd * 88 + fx, 44, 22, 13, 0, 0, 7); ctx.fill(); }); }
  if (look.glasses) { stroke(L(6)); ctx.fillStyle = 'rgba(160,180,195,0.45)'; [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.roundRect(sd * 48 + fx - 36, -44, 72, 76, 22); ctx.fill(); ctx.stroke(); }); }
  // hats
  const hat = look.hat, hc = look.hatColor || '#E3C06A';
  if (hat === 'straw' || hat === 'sun') { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(0, -108, hat === 'sun' ? 196 : 176, 34, 0, 0, 7); ctx.fill(); stroke(L(7)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-96, -112); ctx.bezierCurveTo(-96, -226, 96, -226, 96, -112); ctx.bezierCurveTo(50, -92, -50, -92, -96, -112); ctx.fill(); ctx.stroke(); ctx.strokeStyle = look.band || '#B04A2E'; ctx.lineWidth = L(20); ctx.beginPath(); ctx.moveTo(-94, -134); ctx.quadraticCurveTo(0, -112, 94, -134); ctx.stroke(); }
  if (hat === 'cap') { ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(-120, -64); ctx.bezierCurveTo(-120, -190, 120, -190, 120, -64); ctx.closePath(); ctx.fill(); stroke(L(7)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(30 + fx, -78); ctx.quadraticCurveTo(150 + fx, -86, 178 + fx, -56); ctx.quadraticCurveTo(100 + fx, -52, 24 + fx, -60); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  const aL = armOf(-1, pose.sL); hand(aL);
  ctx.restore();
}
