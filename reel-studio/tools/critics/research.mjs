// Research critic: are the facts real, sourced and reachable? (automatic; fact CORRECTNESS still needs the agent to have read the sources)
import fs from 'node:fs';
import path from 'node:path';
import { Report, tryRd } from './lib.mjs';
export async function run(P, o = {}) {
  const r = new Report(P, 'research'), res = tryRd(path.join(P, 'research/research.json')), src = tryRd(path.join(P, 'research/sources.json'));
  r.check('research.json exists and has claims');
  if (!res) { r.add('blocker', { problem: 'no research/research.json', evidence: 'file missing', expected: 'claims with sources', fix: 'run the research stage', fix_target: 'research' }); return r.finish(); }
  const claims = res.claims || [], ids = new Set([...(res.sources || []).map((s) => s.id), ...(src?.sources || []).map((s) => s.id)]);
  r.check('every claim is sourced');
  for (const c of claims) {
    const used = [].concat(c.source_ids || c.sources || []);
    if (!used.length && c.status !== 'unverified') r.add('major', { line_id: c.id, problem: 'claim without a source', evidence: `"${String(c.text || c.claim).slice(0, 90)}"`, expected: 'source_ids that exist, or status "unverified" (then it is removed or labelled)', fix: 'attach a source or drop the claim', fix_target: 'research' });
    for (const u of used) if (!ids.has(u)) r.add('major', { line_id: c.id, problem: 'claim cites a source id that does not exist', evidence: u, expected: 'an id from research.json sources or research/sources.json', fix: 'fix the id', fix_target: 'research' });
    if (c.status === 'unverified') r.add('minor', { line_id: c.id, problem: 'unverified claim still in the research', evidence: String(c.text || c.claim).slice(0, 90), expected: 'removed from the script or labelled as unverified', fix: 'verify or remove', fix_target: 'research' });
  }
  r.check('enough independent sources'); const hosts = new Set((res.sources || []).map((s) => { try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch { return s.id; } })); const primary = (res.sources || []).some((s) => /primary|official/i.test(`${s.type || ''}`)); if (claims.length >= 3 && hosts.size < 2 && !primary) r.add('major', { problem: 'only one source domain for several claims', evidence: [...hosts].join(', '), expected: 'at least 2 independent domains, or primary sources', fix: 'add a second source', fix_target: 'research' });
  if (o.online !== false) { r.check('source URLs reachable (HTTP HEAD/GET)'); for (const s of (res.sources || []).filter((x) => /^https?:/.test(x.url || '')).slice(0, 12)) { try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000); let h = await fetch(s.url, { method: 'HEAD', signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'reel-studio-critic' } }); if (h.status === 405 || h.status === 403) h = await fetch(s.url, { signal: ctl.signal, headers: { 'User-Agent': 'reel-studio-critic' } }); clearTimeout(t); if (h.status >= 400 && h.status !== 403 && h.status !== 999) r.add('major', { problem: 'source URL does not load', evidence: `${s.url} -> HTTP ${h.status}`, expected: 'a reachable page', fix: 'replace the source', fix_target: 'research' }); } catch (e) { r.add('minor', { problem: 'source URL not checked', evidence: `${s.url}: ${e.message}`, expected: 'reachable', fix: 'check by hand', fix_target: 'research' }); } } }
  r.notes.push('Automatic checks cannot judge whether a claim is TRUE: the agent must have read each source. This critic proves only that sources exist and load.'); return r.finish();
}
