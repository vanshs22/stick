// Parity check: a plan merged with an LLM reply must have EXACTLY the fields the rule plan has (music, emotion, face, scene, shot,
// sfx, transition, card, bg, label ...), even when the reply is partial or contains garbage. Run: node director/parity.test.mjs
import fs from 'node:fs';
import assert from 'node:assert';
import { direct } from './director.mjs';
import { mergeInto, cleanBeat, ENUM } from './llm.mjs';

const cases = [['../examples/editorial-notes.txt', 'editorial-explainer'], ['../examples/dialogue-launch.txt', 'lowpoly-office'], ['../examples/voxel-steps.txt', 'voxel-explainer'], ['../examples/horror-dispatch.txt', 'amber-noir']];
for (const [f, style] of cases) {
  const raw = fs.readFileSync(new URL(f, import.meta.url), 'utf8'), rule = direct(raw, style), llm = direct(raw, style);
  const reply = { provider: 'test', hookAlt: 'x', beats: rule.plan.scenes.map((_, i) => cleanBeat(i % 3 === 0 ? { emotion: 'smug', kind: 'spaceship', transition: 'dissolve', card: { kind: 'hologram' } } : i % 3 === 1 ? { emotion: 'fear', intensity: 7, sfx: ['pop', 'nope'], transition: 'flash', card: { kind: 'stat', value: '10K' } } : {})) };
  mergeInto(llm.plan, reply);
  rule.plan.scenes.forEach((a, i) => {
    const b = llm.plan.scenes[i];
    assert.deepStrictEqual(Object.keys(b).filter((k) => !['why'].includes(k)).sort(), Object.keys(a).sort(), `${style} beat ${i}: LLM plan has different fields`);
    assert(ENUM.transition.includes(b.transition) && ENUM.emotion.includes(b.emotion) && b.intensity >= 0 && b.intensity <= 1, `${style} beat ${i}: invalid value`);
    assert(Array.isArray(b.sfx) && b.hero && b.shot && b.set && b.grade, `${style} beat ${i}: missing structure`);
    if (a.card) assert(b.card && ENUM.card.includes(b.card.kind) && b.bg && b.label, `${style} beat ${i}: card/bg/label lost`);
    if (a.arc === 'peak') assert(b.sfx.some((x) => x.type === 'slam'), `${style}: peak slam lost`);
  });
  assert.strictEqual(llm.plan.music, rule.plan.music); assert.deepStrictEqual(Object.keys(llm.script), Object.keys(rule.script));
  console.log('ok', style, rule.plan.scenes.length, 'beats');
}
