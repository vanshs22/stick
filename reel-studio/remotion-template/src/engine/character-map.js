// Which sprite of character x or y to show: pure, so a node selftest can check it. Poses: neutral talking explaining pointing thinking surprised approval.
export const CHARACTERS = ['x', 'y'];
export const SPRITES = ['neutral', 'talking', 'explaining', 'pointing', 'thinking', 'surprised', 'approval'];
const BY_POSE = { point: 'pointing', reach: 'pointing', open: 'explaining', shrug: 'explaining', brace: 'explaining', halt: 'explaining', wave: 'explaining', think: 'thinking', phone: 'thinking', cower: 'thinking', thumbs: 'approval', cheer: 'approval' };
export function spriteFor(pose = 'idle', mood = 'calm', talking = false) {
  if (mood === 'surprised' || mood === 'scared') return 'surprised';
  if (BY_POSE[pose]) return BY_POSE[pose];
  if (mood === 'happy' || mood === 'relieved') return talking ? 'talking' : 'approval';
  return talking ? 'talking' : 'neutral';
}
