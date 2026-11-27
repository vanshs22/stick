---
name: remocn
description: Pull ready-made Remotion components (text animations, transitions, backgrounds, shaders, captions, app-screen simulations, animated icons, whole scenes) from the remocn registry whenever a shot needs one that our own components do not cover. Use in the storyboard and build stages before writing an animation by hand.
---

# remocn: a library of 900+ copy-paste Remotion components

remocn (https://remocn.dev, MIT, independent of Remotion) publishes components as source. You find one, copy it into the project, and use it as a shot. It runs on OUR timeline (Remotion's frame), so nothing else changes: anchors, captions, critics and per-shot rendering all work as before.

## When to use it
First check our own components (`manifest.json`, the style pack's `components`). Reach for remocn when the shot needs something we do not have: a particular text reveal, a scene transition, an animated background or shader, a camera/physics effect, an animated icon, a branded app-screen simulation (AI chat, terminal, code editor), or a whole ready-made scene. If an hour of hand-written animation would be the alternative, search first.

## Steps
1. Search by what the shot must DO, in plain words: `node $TK/tools/remocn.mjs search "title that resolves from a blur" --vibe premium`. Each result says `use:` and `not:` (when NOT to use it) and its length in frames at 30 fps. Pick by those notes and by the pack's mood, not by name. Filter with `--vibe tech|premium|clean|...`.
2. Read it: `node $TK/tools/remocn.mjs info <name>` (props, usage, notes). Never invent props or durations; use only what the page lists.
3. Install into the project: `node $TK/tools/remocn.mjs add <name> --project $P`. It copies the source (and what it needs) into `$P/remotion/src/remocn/`, registers it, and tells you if an npm package is missing; then add `--install-deps` (installs once for every project).
4. Use it in the storyboard:
   `{"id":"S04","line_ids":["L04"],"component":"RemocnBlock","shot_type":"ui","props":{"name":"soft-blur-in","props":{"text":"No timeline. Just code.","fontSize":72},"anchor":"<anchor name>","scale":1}}`
   - `props.props` = the component's own props. `anchor` (or `at`, seconds) starts it on a spoken word, as for every other component.
   - Length: the registry's frame count is the time the animation needs; the shot must last at least that long plus a hold. A shot shorter than the component clips it.
5. Run `check_storyboard.mjs` (it verifies the component is installed), then `storyboard_review.mjs` and OPEN the stills.

## Portrait fit (our frames are 1080x1920, remocn defaults to 16:9)
Components read the composition size, so they adapt, but they keep 16:9 type sizes. In stills we saw: big headlines overflow the width (use fontSize 72 or less for about 25 characters, or break the line), app windows come out small (set `scale` about 1.1; 1.2 clips the edges), and dark windows need the pack's light backdrop to be readable. Always check the still.

## Craft rules (from the remocn project, they match ours)
- No glow halos or blurred blobs behind headings; no gradient-filled text; no decorative ALL-CAPS or wide tracking; one accent colour; stagger entrances, one focal action per beat.
- Never a bare `Math.random()` (renders must repeat exactly); no placeholder copy such as "Lorem" or "Scene A". Replace sample text and names in props.
- Animations must finish inside their Sequence; do not cut a component short.

## Honesty rules (ours, they win)
- remocn app-screen simulations (Claude Code, v0, ChatGPT, terminals, dashboards) are illustrations. Never use one as evidence of a real result or a real product screen. Evidence stays a real capture (`playwright-capture`). If a viewer could mistake a simulation for a real screen, label it on screen or register it with `capture/register_recreation.mjs`.
- Do not show invented numbers or metrics in a simulated dashboard.
- Keep `src/remocn/LICENSE-NOTICE.txt` in the project (MIT notice). Remotion's own license still applies.

## If it fails
Offline: `remocn.mjs` uses the cached index (`~/.reel-studio/remocn`) for search and says so; `add` needs the network. If a component does not fit, say so and build the shot from our own components. remocn is optional: the toolkit works without it.
Optional extras from the remocn project: an MCP server at https://remocn.dev/mcp (search, docs, previews; read-only) that your agent may use instead of `remocn.mjs search`.

## On 3D and stage packs (claude-minions and others with characters)
A remocn block used as a whole shot has no characters and its own background, which looks like a hole on these packs. Use the `remocn` OVERLAY instead (see skills/storyboard "Stage packs"), scale 0.6 to 0.8, shifted off the duo. Values that worked: `terminal-simulator` fontSize 40, scale 0.75, y -250; compare with our `laptop` set piece with typed `lines` first, it is usually better on a stage. Try remocn where it adds something we lack (a text effect, a transition, a chat or code UI), render both in the same shot, and keep ours when it looks better: say so in `visual_intent`. In a short test two remocn comparisons are enough; do not force a worse shot into the film.
