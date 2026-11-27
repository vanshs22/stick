#!/usr/bin/env node
// Twist engine check: a vague idea is refused, a real one yields levers, and the checker fails a film that copies the reference without the twist and passes one that has it.
import assert from 'node:assert/strict';
import { makeTwist, checkTwist } from './lib/twist.mjs';
const A = { timing: { cuts_per_10s: 4, median_shot: 2.2 }, look: { brightness: 0.4 }, audio: { sfx_per_10s: 1 } };
assert.throws(() => makeTwist(A, 'make it better', 'r1'), /8\+ words/);
const tw = makeTwist(A, 'Same fast pace but every claim gets a real captured proof card and the last line loops back to the hook.', 'r1', 10);
assert.equal(tw.improve.find((l) => l.id === 'proof_layer').min_shots, 2); assert.deepEqual(tw.keep[0].range, [3, 5.6]);
const lines = (a, b) => [{ text: a }, { text: 'middle line here' }, { text: b }];
const bare = { medianShot: 3.4, cutsPer10: 2.5, shots: [{ component: 'Stage3D' }], cuesPer10: 0, lines: lines('Why does a cache make things fast?', 'Save this video.') };
const bad = checkTwist(tw, bare).map((f) => f.lever); for (const l of ['proof_layer', 'loop_ending', 'tighter_pace']) assert.ok(bad.includes(l), `missing finding for ${l}: ${bad}`);
const good = { medianShot: 2.0, cutsPer10: 4.4, shots: [{ component: 'ProofCard' }, { component: 'RepoCard' }], cuesPer10: 1.2, lines: lines('Why does a cache make things fast?', 'That is why a cache is fast.') };
assert.deepEqual(checkTwist(tw, good), []); assert.equal(checkTwist(null, good)[0].lever, 'idea');
console.log('TWIST SELFTEST PASSED: vague idea refused, copy-without-twist fails 3 levers, real twist passes');
