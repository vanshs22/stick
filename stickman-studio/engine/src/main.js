// Boot: fonts -> style + plan + timing -> captions -> shots. draw(t) renders film time t as a pure function of t.
// window.OP is the API tools/capture.mjs drives: ready, bootError, duration(), draw(t), frame(t, q), cues(), shots(), captions().
import { W, H, setCtx, ctx, clamp, eo, eio } from './core/lib.js';
import { T, loadTiming } from './core/timing.js';
import { buildCaptions, drawCaption, captionList } from './core/captions.js';
import { setCapLook } from './core/kit.js';
import { buildFromPlan } from './render.js';
import { buildEditorial } from './families/editorial.js';
import { buildStory3D } from './families/story3d.js';
import { buildFaceCam, prep as facePrep, init as faceInit } from './families/facecam.js';
const FAMILIES = { stick: buildFromPlan, editorial: buildEditorial, facecam: buildFaceCam, lowpoly: buildStory3D, voxel: buildStory3D, blocky: buildStory3D };

const cv = document.getElementById('cv');
setCtx(cv.getContext('2d'));
const OP = (window.OP = { ready: false });
let STYLE = null;

function draw(t) {
  t = clamp(t, 0, T.dur - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.letterSpacing = '0px'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const S = OP._shots; let i = S.length - 1; while (i > 0 && S[i].at > t) i--;
  const sh = S[i], end = i < S.length - 1 ? S[i + 1].at : T.dur, d = end - sh.at, lt = t - sh.at, u = clamp(lt / d), e = eio(u), z = sh.zoom ?? 0.08, mv = sh.move, cam = STYLE.camera;
  let scale = 1, dx = 0, dy = 0;
  if (mv === 'push') scale = 1 + z * e; else if (mv === 'pull') scale = 1 + z * (1 - e); else if (mv === 'punch') scale = 1 + 0.12 * (1 - eo(clamp(lt / 0.4))) + z * 0.5 * e; else if (mv === 'track') { scale = 1 + z * 0.4; dx = (0.5 - e) * 80; } else if (mv === 'handheld') { scale = 1 + z * 0.5 * e; } else { scale = 1 + z * 0.5 * e; dx = Math.sin(e * Math.PI) * 18; }
  if (sh.cam3d) { scale = 1; dx = dy = 0; } else scale *= 1 + cam.punch * (1 - eo(clamp(lt / 0.22)));
  const hh = (mv === 'handheld' ? 3.2 : 1) * cam.handheld;
  if (!sh.cam3d) { dx += Math.sin(t * 7.3) * hh * 2400 + Math.sin(t * 13.1) * hh * 900; dy += Math.sin(t * 6.1) * hh * 2100; }
  const edge = sh.cam3d ? 1 : 1.01 + Math.max((Math.abs(dx) + 18) / 540, (Math.abs(dy) + 18) / 960); scale = Math.max(scale, edge);   // never reveal past the picture edge
  const [cx, cy] = sh.cam || [540, 1000];
  ctx.save(); ctx.translate(cx + dx, cy + dy); if (!sh.cam3d) ctx.rotate(Math.sin(t * 1.1) * 0.004 + (mv === 'handheld' ? Math.sin(t * 9) * 0.004 : 0)); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
  sh.draw(lt, d, t);
  ctx.restore();
  ctx.globalAlpha = 1; ctx.letterSpacing = '0px'; ctx.filter = 'none';
  const fade = Math.min(clamp(t / 0.25), clamp((T.dur - t) / 0.35));
  if (fade < 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - fade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (!STYLE.captions.own) drawCaption(t);
}

(async () => {
  try {
    await Promise.all([document.fonts.load('900 100px Inter'), document.fonts.load('500 40px Grotesk'), document.fonts.load('700 40px Grotesk'), document.fonts.load('italic 400 40px SerifI'), document.fonts.load('500 24px Mono'), document.fonts.load('600 24px Mono')]);
    const get = async (f) => (await fetch(f, { cache: 'no-store' })).json();
    const [script, plan, style] = await Promise.all([get('script.json'), get('plan.json'), get('style.json')]);
    STYLE = style; setCapLook(style.captions);
    await loadTiming();
    buildCaptions(script);
    if (style.family === 'facecam' && !style.synthFace) { await faceInit(); OP.prep = facePrep; }
    const { shots, cues } = (FAMILIES[style.family || 'stick'] || buildFromPlan)(plan, style);
    shots.sort((a, b) => a.at - b.at);
    OP._shots = shots; OP.script = script;
    OP.duration = () => T.dur;
    OP.draw = draw;
    OP.frame = async (t, q = 0.92) => { if (OP.prep) await OP.prep(clamp(t, 0, T.dur)); draw(t); return q >= 1 ? cv.toDataURL('image/jpeg', 0.97) : cv.toDataURL('image/jpeg', q); };
    OP.shots = () => shots.map((s, i) => ({ id: s.id, at: +s.at.toFixed(3), end: +(i < shots.length - 1 ? shots[i + 1].at : T.dur).toFixed(3), note: s.note || '' }));
    OP.captions = () => captionList().map((c) => ({ s: +c.s.toFixed(3), e: +c.e.toFixed(3), text: c.words.map((w) => (w.hi ? '*' : '') + w.txt).join(' ') }));
    OP.cues = () => cues.slice().sort((a, b) => a.t - b.t);
    OP.ready = true;
    const q = new URLSearchParams(location.search);
    if (!q.has('capture')) {
      if (q.has('t')) draw(+q.get('t'));
      else {
        const audio = new Audio('data/mix.wav'); let t0 = null;
        const btn = document.getElementById('play'); btn.hidden = false;
        btn.onclick = () => { btn.hidden = true; t0 = performance.now(); audio.currentTime = 0; audio.play().catch(() => {}); };
        const loop = (now) => { const tt = t0 == null ? 0 : (now - t0) / 1000; draw(t0 == null ? 0 : tt); if (t0 != null && tt > T.dur) { t0 = null; btn.hidden = false; } requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
  } catch (e) { OP.bootError = String(e && e.stack || e); console.error(e); }
})();
