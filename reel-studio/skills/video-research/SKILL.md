---
name: video-research
description: Finds and verifies what a video will say - topic shortlist, facts with sources, competitor and trend analysis, real evidence to capture. Use for the topic, research and research-critic stages, or whenever a claim needs a source.
---

# Video research

## Topic stage (gate)
If the user has no topic: propose 5, each with a hook idea, why this audience cares, and what real evidence exists (a page, repo, product or data).
Sources of ideas: the creator profile topics, `node $TK/tools/research/search.mjs "<niche> short video" --channels web,github`, questions people ask, what competitors made recently.
Do not claim views, engagement or rankings you cannot verify. Write "unknown" instead.

## Research stage (gate)
1. Search with your web tools and `tools/research/search.mjs`. Prefer primary sources: the product's own site and docs, the repo, official announcements, papers, data owners.
2. Write `research/research.json` (schema `research`): `angle` (the one thing the video proves), `claims` with `status` (`verified` = two sources or one primary source; `unverified`; `opinion`), `sources` with url, title, capture date, license note, `evidence_to_capture` (what real page or action to record), `hook_ideas`, `limitations`.
3. Competitor and reference analysis: what structure, hook, pacing and visuals do successful videos in this niche use? Record techniques only (see reference-analysis). Never copy a script, scene or footage.
4. Validate: `node $TK/tools/validate.mjs research $P/research/research.json`.

## Research critic (run before asking for approval)
Write `review/research-critic.json` (schema `critic-report`, critic `research`). Check:
- Every number and quote has a source id. Any `unverified` claim is marked and will not be stated as fact.
- At least one piece of real evidence is capturable, or the limitation is stated.
- The angle is specific and new compared to the competitors you looked at.
- Sources are reachable and dated. Nothing relies on a single anonymous page.
Verdict `pass` only with no blockers.

## Then show the user
The angle in one sentence, the 5-8 key claims with their status, the evidence you will capture, and what you could not verify. Ask: "Approve this direction?"

## Tools (v2)
- `node $TK/tools/research/search.mjs $P "<query>" [--channels web,github,youtube]` (and `--read <url>` to save a page to `research/pages/`) uses Agent-Reach (no keys). Agent-Reach is OPTIONAL and per project: `brief.research.agent_reach` = yes / no / ask. On "ask", get the user's answer first and pass it with `--user-said "<their words>"`. Without it, use your own web search and record every URL in `research/sources.json`.
- `node $TK/tools/research/competitors.mjs $P "<topic>" [--user-said "..."]` collects what similar videos do (titles, length, hook style) into `research/competitors.json` and `opportunities.md`.
- Real evidence: `tools/capture/capture_web.mjs` (see playwright-capture). Reference videos: see reference-analysis.
- `node $TK/tools/critique.mjs $P research` before asking the user to approve the research.
