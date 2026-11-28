// Scene planner for style 2 (2D character in a real 3D world): turns script lines into a full shot plan.
// Rules come from foundation/playbooks (camera: measured-move-mix, move-envelope-on-the-word, one-take-travels-between-subjects, dissolve-at-place-or-time-change;
// acting; hook-cta) and skills/reel-director/SCENE-PLANNING.md. Pure functions: same script in, same plan out.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const LOCATIONS = {
  city: { world: 'city-street', test: /\b(street|city|town|traffic|bus|buses|car|cars|truck|store|shop|office|building|crowd|sidewalk|bench|market|cafe|corner|highway|stop)\b/i, stage: [-5.4, 1.0], subjects: { wide: 'street', far: 'skyline' } },
  country: { world: 'country-field', test: /\b(farm|farmer|field|fence|wind|tree|road|barn|gate|hat|grass|wheat|meadow|village|hill|rural|empty)\b/i, stage: [0, 0.6], subjects: { wide: 'field', far: 'horizon' } },
};
const OBJECTS = [  // a noun in the line becomes a hero object (insert shot) when the world can show it
  { re: /\bsign\b/i, kind: 'roadsign', city: [-7.2, -3], country: [2.6, -1.8], opts: { text: 'DETOUR', w: 1.6, h: 0.9 } },
  { re: /\bfence\b/i, ins: 'wide', kind: 'plankfence', country: [0, -1.8], opts: { len: 5.5, h: 1.2 } },
  { re: /\bhat\b/i, kind: 'hat3d', country: [0, -1.5], city: [-5.2, -1.5], opts: {} },
  { re: /\b(car|truck|bus|buses)\b/i, ins: 'wide', kind: 'car', city: [2.0, -4], country: [4.5, -3], opts: { carKind: 'pickup', color: '#C0392B' } },
  { re: /\bbench\b/i, kind: 'bench', city: [-7.4, -2], country: [3, -2], opts: { rotY: 1.57 } },
  { re: /\bgate\b/i, ins: 'wide', kind: 'plankfence', country: [0, -2.2], opts: { len: 3.2, h: 1.1 } },
];
const FILL = {   // set dressing that gives foreground / midground / background layers around the stage (the world adds buildings, trees, parked cars)
  city: [{ kind: 'bin', at: [-6.9, 4.2] }, { kind: 'hydrant', at: [-6.6, -5.5] }, { kind: 'bench', at: [-7.5, -9], opts: { rotY: 1.57 } }, { kind: 'car', at: [2.2, -18], opts: { carKind: 'hatch', color: '#2E6FB5' } }],
  country: [{ kind: 'stump', at: [-2.8, 2.6] }, { kind: 'roadsign', at: [3.4, -6], opts: { text: 'FARM', w: 1.2, h: 0.7 } }, { kind: 'plankfence', at: [-9, -6], opts: { len: 7, h: 1 } }],
};
const MOOD = { shock: 'shock', calm: 'neutral', sarcastic: 'smug', whisper: 'neutral', curious: 'neutral', fear: 'scared', anger: 'angry', joy: 'happy', surprise: 'shock', sad: 'sad', proud: 'smug', neutral: 'neutral', smug: 'smug', determined: 'determined', worry: 'scared', excited: 'happy' };
const POSE_BY_FN = { hook: 'point', establish: 'idle', explain: 'hip', 'list-item': 'point', reveal: 'shock', reaction: 'shrug', emotion: 'slump', payoff: 'cheer', cta: 'point', contrast: 'shrug', question: 'think', warning: 'hold', 'payoff-line': 'cheer' };
const wordsOf = (t) => String(t).replace(/[^\w' -]/g, ' ').split(/\s+/).filter(Boolean);
const durOf = (t) => Math.max(1.6, wordsOf(t).length / 3.4);
/** fraction through the line where the key word lands (an emphasised word, else the last noun-like word, else 0.6) */
function keyFrac(line) {
  const w = wordsOf(line.text), emph = (line.emphasis || []).map((x) => String(x).toLowerCase());
  let i = w.findIndex((x) => emph.includes(x.toLowerCase())); if (i < 0) { for (let k = w.length - 1; k >= 0; k--) if (w[k].length > 4) { i = k; break; } } if (i < 0) i = Math.floor(w.length * 0.6);
  return Math.max(0.25, Math.min(0.8, (i + 0.5) / w.length));
}
export function detectPlace(text, prev) { const c = LOCATIONS.city.test.test(text), f = LOCATIONS.country.test.test(text); if (c && !f) return 'city'; if (f && !c) return 'country'; if (c && f) return prev || 'city'; return prev || 'city'; }
export function timeOf(text, i, n) { if (/\b(night|dark|midnight|evening)\b/i.test(text)) return 'night'; if (/\b(sunset|dusk)\b/i.test(text)) return 'dusk'; if (/\b(morning|dawn|early)\b/i.test(text)) return 'day'; return i >= n - 2 ? 'golden' : i === 0 ? 'day' : 'day'; }
const FN = (text, i, n, beat) => (i === 0 || beat === 'hook' ? 'hook' : i === n - 1 || beat === 'cta' ? 'cta' : /\?\s*$/.test(text) ? 'question' : /\b(suddenly|turns out|then|until|but|looked)\b/i.test(text) ? 'reveal' : /\b(each|every|first|second|third|again)\b/i.test(text) ? 'list-item' : beat === 'proof' || i === n - 2 ? 'payoff' : 'explain');
const PURPOSE = { hook: 'hook', question: 'explain', reveal: 'reveal', 'list-item': 'explain', payoff: 'payoff', explain: 'explain', cta: 'cta' };

/** plan the shots: returns { shots, ledger } */
export function planScenes(script, opts = {}) {
  const lines = script.lines, n = lines.length, shots = [], ledger = []; let prevPlace = null, prevFrame = '', prevAngle = '', sign = 1;
  lines.forEach((l, i) => {
    const place = detectPlace(l.text, prevPlace), L = LOCATIONS[place], time = timeOf(l.text, i, n), fn = FN(l.text, i, n, l.beat), changed = prevPlace && place !== prevPlace;
    let purpose = PURPOSE[fn] || 'explain'; if (i === 1 && !changed) purpose = 'establish'; if (/^(fear|anger|sad|shock)$/.test(l.emotion || '') && purpose === 'explain') purpose = 'emotion';
    const obj = OBJECTS.find((o) => o.re.test(l.text) && o[place]); const dur = durOf(l.text), f = keyFrac(l), [ax, az] = L.stage;
    const hero = 'otto', needPartner = /\b(he|she|they|farmer|driver|man|woman|boss|friend|neighbou?r|officer|looked|said|asked|paid)\b/i.test(l.text) && i > 0, partner = i % 2 ? 'mabel' : 'rex', crowd = /\b(crowd|everyone|people|buses|traffic)\b/i.test(l.text);
    const cast = [{ id: hero, kind: 'sprite', char: hero, height: 2.0, at: [ax + (rnd(i) - 0.5) * 0.5, az + (place === 'city' ? rnd(i + 3) * 1.2 : 0)], pose: [[0, 'idle'], [+(f * dur).toFixed(2), POSE_BY_FN[fn] || 'idle']], mood: [[0, MOOD[l.emotion] || 'neutral']], speaks: false, ...(place === 'city' ? { gaze: [0.4, 0] } : {}) }];
    if (needPartner) cast.push({ id: partner, kind: 'sprite', char: partner, height: 2.0, at: [ax + (place === 'city' ? 1.8 : 1.9), az - 0.7], flip: true, pose: [[0, 'idle'], [+(f * dur).toFixed(2), fn === 'reveal' ? 'point' : 'hip']], mood: [[0, MOOD[l.emotion] || 'neutral']], speaks: false });
    if (crowd && place === 'city') cast.push({ id: 'gus', kind: 'sprite', char: 'gus', height: 2.0, at: [ax + 3.4, az - 2.4], flip: true, pose: [[0, 'idle']], mood: [[0, 'neutral']], speaks: false });
    const props3d = []; if (obj) props3d.push({ id: 'hero_' + obj.kind, kind: obj.kind, at: obj[place], ...obj.opts });
    for (const fl of FILL[place]) if (!props3d.some((p) => p.kind === fl.kind && Math.hypot(p.at[0] - fl.at[0], p.at[1] - fl.at[1]) < 3)) props3d.push({ id: `fill_${fl.kind}_${FILL[place].indexOf(fl)}`, kind: fl.kind, at: fl.at, ...(fl.opts || {}) });
    // camera: one take, keyed on the word; angle and framing never repeat the neighbour (ledger rule)
    const angles = ['eye-level', 'low-angle', 'high-angle'], pick = (a) => (a === prevAngle ? angles[(angles.indexOf(a) + 1) % 3] : a);
    let angle = pick(purpose === 'hook' || purpose === 'payoff' ? 'low-angle' : purpose === 'establish' ? 'high-angle' : purpose === 'emotion' ? 'eye-level' : angles[(i + 1) % 3]); sign = -sign; const az0 = 14 * sign;
    const subj = obj && purpose === 'explain' ? props3d[0]?.id || hero : hero, tgt = needPartner && purpose === 'reveal' ? partner : hero;
    let keys, why, framing;
    if (purpose === 'hook') { framing = 'medium'; keys = [{ t: 0, framing: 'medium', angle, subject: hero, az: az0 }, { t: Math.min(0.5, f), framing: 'close-up', angle, subject: hero, az: az0 * 0.4 }, { t: 1, framing: 'close-up', angle, subject: hero, az: -az0 * 0.3 }]; why = `Start close on the hero and push in on the key word so the claim lands on his face before the second sentence.`; }
    else if (purpose === 'establish') { framing = 'extreme-wide'; keys = [{ t: 0, framing: 'extreme-wide', angle: 'high-angle', subject: hero, az: -az0 }, { t: Math.max(0.55, f), framing: 'wide', angle: 'eye-level', subject: hero, az: az0 }, { t: 1, framing: 'medium-wide', angle: 'eye-level', subject: hero, az: az0 * 1.4 }]; why = `Show the whole place first, then travel down to the hero so the viewer knows where the story happens before it starts.`; }
    else if (purpose === 'reveal') { framing = 'medium'; keys = [{ t: 0, framing: 'medium', angle, subject: hero, az: az0 }, { t: Math.max(0.3, f - 0.1), framing: 'medium-close-up', angle, subject: hero, az: az0 }, { t: Math.min(1, f + 0.2), framing: 'wide', angle: 'eye-level', subject: needPartner ? partner : hero, az: -az0 * 1.6 }]; why = `Hold on the hero, then pull back and arc to the reveal on the spoken word so the new thing arrives as a camera move, not a cut.`; }
    else if (purpose === 'emotion') { framing = 'medium-close-up'; keys = [{ t: 0, framing: 'medium-close-up', angle: 'eye-level', subject: hero, az: az0, roll: 2 * sign }, { t: 1, framing: 'close-up', angle: 'eye-level', subject: hero, az: az0 * 0.3, roll: 3 * sign }]; why = `Stay on the face and creep in with a slight roll so the reaction is the whole picture.`; }
    else if (purpose === 'payoff') { framing = 'medium'; keys = [{ t: 0, framing: 'medium', angle, subject: hero, az: az0 }, { t: Math.max(0.5, f), framing: 'medium-wide', angle: 'eye-level', subject: tgt, az: -az0 }, { t: 1, framing: 'wide', angle: 'eye-level', subject: hero, az: -az0 * 1.5 }]; why = `Pull back to the wide on the last line so the result reads as a picture the viewer can see.`; }
    else if (purpose === 'cta') { framing = 'medium'; keys = [{ t: 0, framing: 'medium-close-up', angle: 'eye-level', subject: hero, az: az0 }, { t: 1, framing: 'close-up', angle: 'eye-level', subject: hero, az: az0 * 0.5 }]; why = `A calm push on the hero while the call to action is spoken so the last frame is on the character.`; }
    else { framing = obj ? (obj.ins === 'wide' ? 'medium-wide' : 'close-up') : 'medium'; keys = [{ t: 0, framing: obj ? 'wide' : 'medium', angle, subject: subj, az: obj ? az0 * 3 : az0 }, { t: Math.max(0.35, f), framing: obj ? (obj.ins === 'wide' ? 'medium-wide' : 'close-up') : 'medium-close-up', angle, subject: subj, az: obj ? az0 * 2.4 : az0 * 0.5 }, { t: 1, framing: obj ? (obj.ins === 'wide' ? 'medium-wide' : 'close-up') : 'medium-close-up', angle: pick(angles[(i + 2) % 3]), subject: subj, az: obj ? az0 * 1.8 : -az0 * 0.4 }]; why = obj ? `Push in on the object the line names so the viewer sees the thing the sentence is about.` : `Medium take that pushes in on the key word and drifts to a new side so it does not repeat the last shot.`; }
    for (const k of keys) { if (k.framing === 'close-up') k.distScale = 1.65; else if (k.framing === 'medium-close-up') k.distScale = 1.3; }   // 9:16 is narrow: a ball head is wider than the close-up table assumes
    if (keys[0].framing === prevFrame && keys[0].angle === prevAngle) { keys[0].angle = pick(angles[(angles.indexOf(keys[0].angle) + 1) % 3]); }
    const camera = { framing: keys[0].framing, angle: keys[0].angle, subject: keys[0].subject, focus: { target: tgt === partner && purpose === 'reveal' ? partner : hero, aperture: 0.0015 }, constraints: ['subject stays in the safe frame', 'camera never inside a prop or the ground'], movement: { type: 'take', duration: 'shot', why: why + ` (line ${l.id}, key word at ${(f * 100) | 0}% of the line)`, keys } };
    const trans = purpose === 'reveal' ? { type: 'whip', sound: 'whoosh', why: 'The new thing arrives on the whip so the reveal is a camera move, not a cut' } : { type: 'cut', sound: 'none' };
    const key = wordsOf(l.text)[Math.min(wordsOf(l.text).length - 1, Math.floor(f * wordsOf(l.text).length))];
    shots.push({ id: `S${String(i + 1).padStart(2, '0')}`, line_ids: [l.id], visual_intent: `${purpose} in the ${place === 'city' ? 'city street' : 'country'}: ${why}`, shot_type: '3d-scene', component: 'Stage3D', approach: 'physical-3d', why_renderer: 'The world and the camera tell the story; the sprite actor stands inside it.',
      props: { world: LOCATIONS[place].world, worldOpts: { time, ink: opts.ink ?? 0.8 }, cast, props3d, camera }, anchors: [{ name: 'a0', line: l.id, word: String(key).toLowerCase() }], overlays: [], transition_out: trans });
    ledger.push({ shot: shots.at(-1).id, place, time, purpose, framing: keys[0].framing, angle: keys[0].angle, subject: keys[0].subject, move: `take ${keys.map((k) => k.framing).join(' > ')}`, transition: trans.type, cast: cast.map((c) => c.id).join('+'), hero: obj?.kind || '' });
    prevPlace = place; prevFrame = keys[0].framing; prevAngle = keys[0].angle;
  });
  ledger.forEach((r, i) => { const nx = ledger[i + 1]; if (nx && nx.place !== r.place) { shots[i].transition_out = { type: 'dissolve', sound: 'none', why: `Place changes from ${r.place} to ${nx.place} so the story hands over with a 3-6 frame dissolve` }; r.transition = 'dissolve'; } else if (shots[i].transition_out.type === 'dissolve') { shots[i].transition_out = { type: 'cut', sound: 'none' }; r.transition = 'cut'; } });   // a dissolve belongs to the shot BEFORE a place change
  return { shots, ledger };
}
/** the ledger check: neighbours must differ in framing+angle, and a place change needs a dissolve (skills/reel-director/SCENE-PLANNING.md) */
export function checkLedger(ledger) {
  const out = []; ledger.forEach((r, i) => { const p = ledger[i - 1]; if (!p) return; if (p.framing === r.framing && p.angle === r.angle) out.push(`${r.shot}: same framing and angle as ${p.shot}`); if (p.place !== r.place && p.transition !== 'dissolve') out.push(`${p.shot}: place changes but the transition is ${p.transition}`); });
  const hero = ledger.filter((r) => r.hero).length; if (ledger.length >= 6 && hero === 0) out.push('no hero object insert in a film of 6 or more shots'); return out;
}
