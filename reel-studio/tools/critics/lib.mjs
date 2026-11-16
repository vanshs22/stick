// Shared by every critic: one report format (schemas/critic-report.schema.json), saved to review/critics/<critic>.json.
import fs from 'node:fs';
import path from 'node:path';
import { rd } from '../lib/pipeline.mjs';
export class Report {
  constructor(P, critic, assessment = 'automatic') { this.P = P; this.critic = critic; this.assessment = assessment; this.findings = []; this.checked = []; this.notes = []; }
  check(name) { this.checked.push(name); return this; }
  /** severity: blocker | major | minor */
  add(severity, f) { this.findings.push({ id: `${this.critic.slice(0, 3).toUpperCase()}${String(this.findings.length + 1).padStart(2, '0')}`, severity, fix_target: 'storyboard', ...f }); return this; }
  finish() {
    const n = (s) => this.findings.filter((f) => f.severity === s).length, b = n('blocker'), m = n('major'), mi = n('minor');
    const r = { critic: this.critic, target: path.basename(this.P), verdict: b ? 'fail' : m ? 'revise' : 'pass', score: Math.max(0, 100 - b * 25 - m * 10 - mi * 2), assessment: this.assessment, checks_run: this.checked, findings: this.findings, notes: this.notes, checked_at: new Date().toISOString() };
    const f = path.join(this.P, 'review/critics', `${this.critic}.json`); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(r, null, 1));
    for (const x of this.findings) console.log(`${x.severity.toUpperCase().padEnd(7)} ${x.shot_id || x.line_id || ''}${x.timestamp_sec != null ? ' @' + x.timestamp_sec + 's' : ''}  ${x.problem || ''}\n          evidence: ${x.evidence}\n          expected: ${x.expected}\n          fix [${x.fix_target}]: ${x.fix}`);
    console.log(`${this.critic}: ${r.verdict} (${r.score}/100) after ${this.checked.length} check(s), ${b} blocker / ${m} major / ${mi} minor -> ${path.relative(this.P, f)}`); return r;
  }
}
export const tryRd = (f) => { try { return rd(f); } catch { return null; } };
export const wordsOf = (t) => String(t).toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/).filter(Boolean);
