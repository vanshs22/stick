// The director's rules as code (skills/reel-director, foundation/playbooks/camera.json + acting.json): purpose of a shot, camera by purpose, gesture by sentence function.
import { load } from '../playbook.mjs';
export const PURPOSES = ['hook', 'establish', 'explain', 'list-item', 'reveal', 'reaction', 'emotion', 'payoff', 'cta'];
export const ENGINE = { 'sketchy-stickman': '2d-flat', 'facecam-overlay': 'face-cam', 'doodle-explainer': 'board', 'neon-dashboard': 'board', 'editorial-notebook': 'board', 'roblox-inspired': '3d', 'voxel-explainer': '3d', 'voxel-studio': '3d', 'claude-minions': '3d', 'stylized-3d-presenter': '3d', 'stickman-3d': 'sprite-in-3d', 'inkbeat': 'sprite-in-3d', 'two-faces': '2d-flat' };
export const LABEL = { 'sketchy-stickman': 'flat-stickman', 'facecam-overlay': 'face-overlay', 'doodle-explainer': 'split-host', 'neon-dashboard': 'board', 'editorial-notebook': 'board', 'roblox-inspired': 'roblox', 'voxel-explainer': 'roblox', 'voxel-studio': 'roblox', 'claude-minions': 'minion-3d', 'stylized-3d-presenter': 'minion-3d', 'stickman-3d': 'stickman-3d-world', 'inkbeat': 'stickman-3d-world', 'two-faces': 'two-faces' };
/** camera recipe per purpose: framing, movement (names the engines already use), duration hint (s) and which playbook entry says so */
export const RECIPE = {
  hook: { framing: 'close', movement: 'push', dur: [0.5, 1.5], entry: 'hook-punch-in' },
  establish: { framing: 'wide', movement: 'orbit', dur: [4, 9], entry: 'establish-wide-orbit' },
  explain: { framing: 'medium', movement: 'push', dur: [2, 5], entry: 'explain-medium-push' },
  'list-item': { framing: 'medium', movement: 'hold', dur: [3, 8], entry: 'list-long-hold-reveals' },
  reveal: { framing: 'medium', movement: 'whip', dur: [1.2, 2.5], entry: 'reveal-whip-hold' },
  reaction: { framing: 'close', movement: 'push', dur: [0.8, 1.2], entry: 'reaction-shots' },
  emotion: { framing: 'extreme-close', movement: 'push', dur: [0.9, 1.6], entry: 'emotion-extreme-closeup' },
  payoff: { framing: 'wide', movement: 'pull', dur: [1.5, 2.5], entry: 'payoff-pull-back' },
  cta: { framing: 'medium', movement: 'hold', dur: [3, 5], entry: 'cta-comment-keyword' },
};
export const cutsPer10 = (style) => load('camera').entries.find((e) => e.id === 'cut-rhythm').parameters.cuts_per_10s[LABEL[style] || style];
/** sentence function (acting playbook): what the sentence does, from its words and its place in the script */
export function functionOf(text, i, n, beat) {
  const t = String(text);
  if (i === 0 || beat === 'hook') return 'hook';
  if (i === n - 1 || beat === 'cta') return 'cta';
  if (/\?\s*$/.test(t)) return 'question';
  if (/\b(but|instead|however|yet|while|not .* but)\b/i.test(t)) return 'contrast';
  if (/\b(first|second|third|next|then|finally|step|number|one|two|three)\b/i.test(t) || beat === 'step') return 'list-item';
  if (/\b(suddenly|turns out|and then|until|boom|bang|found|reveal)\b/i.test(t) || beat === 'twist') return 'reveal';
  if (/\b(never|don'?t|careful|warning|danger|avoid)\b/i.test(t)) return 'warning';
  if (beat === 'proof' || i === n - 2) return 'payoff-line';
  return 'explain';
}
/** gesture by sentence function, in the vocabulary of each engine (sprite poses of characters x/y; SDF gestures; stick poses) */
export const GESTURE = {
  hook: { sprite: 'pointing', sdf: 'lean-in', stick: 'point' },
  question: { sprite: 'thinking', sdf: 'think', stick: 'head' },
  contrast: { sprite: 'explaining', sdf: 'explain-wide', stick: 'explain' },
  'list-item': { sprite: 'pointing', sdf: 'point', stick: 'point' },
  reveal: { sprite: 'surprised', sdf: 'step-back', stick: 'shock' },
  warning: { sprite: 'explaining', sdf: 'hold-up', stick: 'explain' },
  'payoff-line': { sprite: 'approval', sdf: 'cheer', stick: 'explain' },
  cta: { sprite: 'pointing', sdf: 'point', stick: 'point' },
  explain: { sprite: 'explaining', sdf: 'explain', stick: 'explain' },
};
export const PURPOSE_OF_FUNCTION = { hook: 'hook', question: 'reaction', contrast: 'explain', 'list-item': 'list-item', reveal: 'reveal', warning: 'explain', 'payoff-line': 'payoff', cta: 'cta', explain: 'explain' };
