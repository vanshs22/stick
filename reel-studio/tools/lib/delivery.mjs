// Delivery profile + audio mode of a project: ONE place that says what "finished" means for this video.
// Order of precedence: brief.delivery (explicit) > platform preset > nothing. A limit that is null is not checked.
import fs from 'node:fs';
import path from 'node:path';

/** Defaults per platform. Durations are the platforms' documented ceilings as we know them: they CHANGE, so override with brief.delivery.max_sec / max_mb.
 *  max_mb is null on purpose: upload size caps differ by account and app version; set brief.delivery.max_mb if you have one. */
export const PRESETS = {
  'instagram-reels': { aspect: '9:16', width: 1080, height: 1920, fps: 30, min_sec: 3, max_sec: 90, max_mb: null },
  'tiktok': { aspect: '9:16', width: 1080, height: 1920, fps: 30, min_sec: 3, max_sec: 600, max_mb: null },
  'youtube-shorts': { aspect: '9:16', width: 1080, height: 1920, fps: 30, min_sec: 3, max_sec: 180, max_mb: null },
  'youtube': { aspect: '16:9', width: 1920, height: 1080, fps: 30, min_sec: 3, max_sec: null, max_mb: null },
  'linkedin': { aspect: '16:9', width: 1920, height: 1080, fps: 30, min_sec: 3, max_sec: 600, max_mb: null },
  'x': { aspect: '16:9', width: 1920, height: 1080, fps: 30, min_sec: 1, max_sec: 140, max_mb: null },
};
export const AUDIO_MODES = ['narrated', 'narrated_music', 'music_only', 'silent', 'custom'];
const tryRd = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

/** the audio mode: audio-plan.mode, else derived from the older fields (voice engine + music bed) */
export function audioMode(P) {
  const plan = tryRd(path.join(P, 'audio/audio-plan.json')), brief = tryRd(path.join(P, 'brief.json')) || {};
  if (plan?.mode) return plan.mode;
  const engine = plan?.voice?.engine || brief.voice?.engine || 'kokoro', bed = plan?.music?.bed || (brief.music?.direction === 'none' ? 'none' : 'bed');
  if (engine === 'captions-only') return bed === 'none' ? 'silent' : 'music_only';
  return bed === 'none' ? 'narrated' : 'narrated_music';
}
export const needsNarration = (mode) => mode === 'narrated' || mode === 'narrated_music';
export const needsAudio = (mode) => mode !== 'silent';

/** everything final QA and the readiness gate check against */
export function deliveryProfile(P) {
  const brief = tryRd(path.join(P, 'brief.json')) || {}, preset = PRESETS[brief.platform] || {}, d = brief.delivery || {}, mode = audioMode(P);
  const pick = (k) => (k in d ? d[k] : preset[k] ?? null);
  const aspect = d.aspect || brief.aspect || preset.aspect || '9:16', [w, h] = aspect === '16:9' ? [1920, 1080] : aspect === '1:1' ? [1080, 1080] : aspect === '4:5' ? [1080, 1350] : [1080, 1920];
  return {
    platform: brief.platform || null, aspect, width: d.width || w, height: d.height || h, fps: pick('fps') || 30,
    min_sec: pick('min_sec'), max_sec: pick('max_sec'), max_mb: pick('max_mb'), target_sec: brief.duration_sec || null,
    audio_mode: mode, audio_required: needsAudio(mode), narration_required: needsNarration(mode),
    loudness_lufs: d.loudness_lufs ?? -14, true_peak_db: d.true_peak_db ?? -1.5,
    source: d && Object.keys(d).length ? 'brief.delivery + platform preset' : brief.platform ? `platform preset (${brief.platform})` : 'defaults',
  };
}
