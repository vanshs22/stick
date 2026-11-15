// Trend researcher: what are people already publishing on this topic? Uses Agent-Reach (public web, no credits). Optional: skipped when it is not installed.
import { research } from '../research/competitors.mjs';
export async function trendResearcher(job) {
  const q = job.brief.topic || job.brief.text.slice(0, 80), r = research(`${q} short video`, 'web');
  return { query: q, titles: r.hits.map((h) => h.title.replace(/\s*[|\-–].*$/, '').slice(0, 90)).slice(0, 8), skipped: r.skipped };
}
