// Split render work across processes or machines (two Kaggle GPUs): balanced by frame count, not by shot count, so shards finish together.
export function shardPlan(items, n, weight = (x) => x.to - x.from + 1) {
  const buckets = Array.from({ length: n }, () => ({ load: 0, items: [] }));
  for (const it of [...items].sort((a, b) => weight(b) - weight(a))) { const b = buckets.reduce((m, x) => (x.load < m.load ? x : m)); b.items.push(it); b.load += weight(it); }
  return buckets.map((b) => b.items);
}
/** "2/3" -> the second of three shards (1-based); null for no sharding */
export function parseShard(s) {
  if (!s) return null; const m = /^(\d+)\/(\d+)$/.exec(s); if (!m || +m[1] < 1 || +m[1] > +m[2]) throw new Error(`--shard must look like 1/2 (shard 1 of 2), got "${s}"`); return { i: +m[1], n: +m[2] };
}
export const pickShard = (items, spec, weight) => (spec ? shardPlan(items, spec.n, weight)[spec.i - 1] : items);

/** Render tiers: one flag instead of three. Explicit --scale / --fps-div / --quality still win. */
export const TIERS = { preview: { scale: '0.25', 'fps-div': '2', quality: 'draft' }, proof: { scale: '0.5', 'fps-div': '2', quality: 'fast' }, final: { scale: '1' } };
