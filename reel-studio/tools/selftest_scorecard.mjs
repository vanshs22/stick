#!/usr/bin/env node
// Scorecard: pass, revise, blocker veto, escalate after 3 failed rounds, escalate on thrash, weights renormalised when stages did not run.
import { score } from './scorecard.mjs';
import { check, loadSchema } from './validate.mjs';

const rep = (critic, s, blockers = 0) => ({ critic, score: s, findings: Array.from({ length: blockers }, () => ({ severity: 'blocker', problem: 'x' })) });
const bad = [], ok = (c, m) => { if (!c) bad.push(m); };

const allGood = { script: rep('script', 95), viral: rep('viral', 92), storyboard: rep('storyboard', 96), logic: rep('logic', 100), visual: rep('visual', 90), voice: rep('voice', 90), music: rep('music', 85), captions: rep('captions', 95), sfx: rep('sfx', 90), layout: rep('layout', 92), frames: rep('frames', 90), video: rep('video', 95) };
const a = score(allGood);
ok(a.status === 'pass' && a.overall >= 88, `all good should pass, got ${a.status} ${a.overall}`);
ok(!check(loadSchema('scorecard'), a).length, 'scorecard does not match its schema');

const veto = score({ ...allGood, storyboard: rep('storyboard', 90, 0), logic: { critic: 'logic', score: 75, findings: [{ severity: 'blocker', shot_id: 'S02', problem: 'hero inside desk' }] } });
const sbS = veto.stages.find((s) => s.stage === 'storyboard');
ok(sbS.status === 'revise' && sbS.score === 75 && /hero inside desk/.test(sbS.blockers[0]), 'a blocker in the logic critic must hold the storyboard stage back');
ok(veto.status === 'revise', 'overall must not pass while a stage fails');

const hist = (n, v) => Array.from({ length: n }, (_, i) => ({ stages: { storyboard: v[i] } }));
ok(score({ storyboard: rep('storyboard', 60) }, hist(3, [50, 55, 58])).stages[0].status === 'escalate', '3 failed rounds must escalate');
ok(score({ storyboard: rep('storyboard', 68) }, hist(2, [66, 67])).stages[0].status === 'escalate', 'a gain under 5 points over two rounds must escalate (thrash)');
ok(score({ storyboard: rep('storyboard', 78) }, hist(2, [60, 68])).stages[0].status === 'revise', 'a steady climb must keep revising');
ok(score({ storyboard: rep('storyboard', 30) }).stages[0].status === 'fail', 'a very low score is a fail, not a revise');

const only = score({ script: rep('script', 95) });
ok(only.overall === 95 && only.status === 'pass', 'weights must renormalise over the stages that ran');
ok(score({}).stages.length === 0 && score({}).status !== 'pass', 'no critics run must never pass');

if (bad.length) { console.error('SCORECARD SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log('SCORECARD SELFTEST PASSED: pass, blocker veto, revise, fail, escalate after 3 rounds, escalate on thrash, weights renormalised, schema valid');
