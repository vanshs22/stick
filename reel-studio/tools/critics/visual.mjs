// Visual-intent critic: does every narration line get a picture that ADDS information, and is the renderer chosen for a reason?
// Measurable: approach and reason present, renderer fits the approach, text cards do not just repeat the narration, no long run of the same approach,
// storyboard/visual-concept.json covers every line and is not a DRAFT. Whether the picture is GOOD needs eyes (vision critics).
import path from 'node:path';
import { Report, tryRd, wordsOf } from './lib.mjs';
import { APPROACHES, CARRIERS, TEXT_ONLY } from '../lib/approach.mjs';
const overlap = (a, b) => { const A = wordsOf(a).filter((w) => w.length > 2), B = new Set(wordsOf(b)); return A.length ? A.filter((w) => B.has(w)).length / A.length : 0; };
const textOf = (p = {}) => [p.text, p.title, p.headline, ...(p.items || []).map((i) => (typeof i === 'string' ? i : i.text || i.label || '')), p.mark].filter(Boolean).join(' ');
export async function run(P) {
  const r = new Report(P, 'visual'), sb = tryRd(path.join(P, 'storyboard/storyboard.json')), sc = tryRd(path.join(P, 'script/script.json')), vc = tryRd(path.join(P, 'storyboard/visual-concept.json')), tl = tryRd(path.join(P, 'data/timeline.json'));
  if (!sb || !sc) { r.add('blocker', { problem: 'storyboard or script missing', evidence: '', expected: 'both files', fix: 'create them', fix_target: 'storyboard' }); return r.finish(); }
  const line = Object.fromEntries(sc.lines.map((l) => [l.id, l])), at = (s) => tl?.shots.find((x) => x.id === s.id)?.start ?? null;
  r.check('visual-concept.json covers every script line with an approach and the information the picture adds');
  if (!vc) r.add('major', { problem: 'no storyboard/visual-concept.json', evidence: '', expected: 'one entry per script line: approach, adds_information', fix: `node tools/visual_concept.mjs ${P} (drafts it), then edit every entry`, fix_target: 'visual_concept' });
  else {
    if (vc.status && /draft/i.test(vc.status)) r.add('major', { problem: 'visual-concept.json is still a DRAFT', evidence: `status: ${vc.status}`, expected: 'every entry edited by you, then status "ready"', fix: 'edit each entry (what does the picture show that the words do not?) and set status to "ready"', fix_target: 'visual_concept' });
    for (const l of sc.lines) { const e = (vc.lines || []).find((x) => x.line_id === l.id);
      if (!e) { r.add('major', { line_id: l.id, problem: 'line has no visual concept', evidence: l.text.slice(0, 60), expected: 'an entry', fix: 'add it', fix_target: 'visual_concept' }); continue; }
      if (!APPROACHES.includes(e.approach)) r.add('major', { line_id: l.id, problem: `unknown approach "${e.approach}"`, evidence: '', expected: APPROACHES.join(' | '), fix: 'pick one', fix_target: 'visual_concept' });
      if (!e.adds_information || e.adds_information.length < 20 || /^DRAFT/i.test(e.adds_information)) r.add('major', { line_id: l.id, problem: 'does not say what the picture adds to the words', evidence: e.adds_information || '(empty)', expected: 'a concrete statement: what the viewer SEES/LEARNS that the narration does not say', fix: 'write it, or choose a different visual', fix_target: 'visual_concept' });
      else if (overlap(e.adds_information, l.text) > 0.85) r.add('minor', { line_id: l.id, problem: 'adds_information just restates the line', evidence: e.adds_information.slice(0, 80), expected: 'new visual information', fix: 'rewrite it', fix_target: 'visual_concept' }); }
  }
  r.check('every shot names its approach and why this renderer suits it');
  let run = 0, prev = '';
  for (const s of sb.shots) {
    const ls = (s.line_ids || []).map((id) => line[id]).filter(Boolean), t0 = at(s), common = { shot_id: s.id, ...(t0 != null ? { timestamp_sec: +t0.toFixed(2) } : {}) };
    if (!s.approach) { r.add('major', { ...common, problem: 'shot has no "approach"', evidence: s.component, expected: APPROACHES.join(' | '), fix: 'set approach and why_renderer on the shot', fix_target: 'storyboard' }); continue; }
    if (!APPROACHES.includes(s.approach)) r.add('major', { ...common, problem: `unknown approach "${s.approach}"`, evidence: '', expected: APPROACHES.join(' | '), fix: 'pick one', fix_target: 'storyboard' });
    if (!s.why_renderer || s.why_renderer.length < 25 || /^DRAFT/i.test(s.why_renderer)) r.add('major', { ...common, problem: 'no real reason given for the renderer', evidence: s.why_renderer || '(empty)', expected: 'why THIS component/renderer shows the idea better than the alternatives (25+ characters, not DRAFT)', fix: 'write why_renderer', fix_target: 'storyboard' });
    const ok = CARRIERS[s.approach]; if (ok && !ok.includes(s.component)) r.add('major', { ...common, problem: `${s.component} cannot carry the approach "${s.approach}"`, evidence: `${s.approach} is carried by ${ok.join(', ')}`, expected: 'renderer that matches the approach', fix: 'change the component or the approach', fix_target: 'storyboard' });
    if (s.approach === 'combo' && (s.layers || []).length < 2) r.add('major', { ...common, problem: 'combo shot lists fewer than 2 layers', evidence: JSON.stringify(s.layers || []), expected: 'layers: ["3d character", "real capture", "2d overlay"...]', fix: 'name the layers', fix_target: 'storyboard' });
    if (ls.length && vc) { const e = (vc.lines || []).find((x) => x.line_id === ls[0].id); if (e && e.approach !== s.approach && !s.deviation_reason) r.add('minor', { ...common, problem: `shot approach "${s.approach}" differs from the concept "${e.approach}"`, evidence: ls[0].id, expected: 'same, or a deviation_reason on the shot', fix: 'align them or explain', fix_target: 'storyboard' }); }
    if (TEXT_ONLY.has(s.component) && ls.length) { const txt = textOf(s.props), lw = wordsOf(ls.map((l) => l.text).join(' ')), tw = wordsOf(txt); if (tw.length >= 4 && overlap(txt, ls.map((l) => l.text).join(' ')) >= 0.8 && tw.length >= lw.length * 0.6 && !(s.overlays || []).length && !(s.layers || []).length) r.add('major', { ...common, problem: 'the card only repeats the narration as text', evidence: `"${txt.slice(0, 70)}" vs line "${ls[0].text.slice(0, 50)}"`, expected: 'a picture that adds information: a diagram, number, capture, character action; or a card with a short key phrase (under 60 percent of the line)', fix: 'replace the visual or cut the card to its key phrase', fix_target: 'storyboard' }); }
    run = s.approach === prev ? run + 1 : 1; prev = s.approach; if (run === 4) r.add('minor', { ...common, problem: '4 shots in a row use the same approach', evidence: s.approach, expected: 'a change of approach at least every 3 shots', fix: 'vary the visual language (capture, diagram, character)', fix_target: 'storyboard' });
  }
  r.notes.push('Does the picture actually look right and explain the line? That needs eyes: run the vision critics (tools/critique.mjs <P> vision --packet composition).'); return r.finish();
}
