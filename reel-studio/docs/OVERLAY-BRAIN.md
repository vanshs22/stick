# The overlay brain: how to think "what does the viewer SEE when this word is said?"

Two reference reels (a GTA clip-making explainer, a "five Claude skills" explainer) look expensive because of one habit, not because of one trick: **every concrete word becomes a literal object, number or action on screen, on that word, inside one themed visual world, and something new arrives about every 1.4 seconds.** This file turns that habit into a procedure any AI can follow, plus a tool (`tools/overlay_director.mjs`) that does the mechanical half and a critic that checks the result. We learn the method; we never copy a layout, a brand, a character or a line of text.

## 1. What was measured (`tools/reference/overlay_scan.py`, `beat_sync.py`)
| | length | words per min | new visual per min | median gap | longest gap | camera still/drift/move | plates on screen |
|---|---|---|---|---|---|---|---|
| reel 8 (GTA clips) | 43 s | 231 | 32 | 1.3 s | 4.1 s | 1/30/69 % | 5.2 (8.7 % of the frame) |
| reel 9 (five skills) | 57 s | 224 | 31 | 1.5 s | 6.1 s | 2/35/63 % | 5.2 (7.3 % of the frame) |
A "visual beat" is a rise of the picture's change above its running level in the stage region. Both reels speak at about 225 words a minute and renew the picture about every 1.4 s. Word-level sync could not be measured honestly at that speech density (the chance level is above 60 percent), so the claim is made from reading the frames: the new object appears at or just before its word. Our target: **a new visual at least every 3 s on average, never more than 6 s apart** (the critic checks), and one per 1.4 s in fast styles.

## 2. The five moves behind everything
1. **Pick a world, then dress every idea in it (a SKIN).** Reel 8 turned a clip-making tutorial into a game: a mission header with a step counter ("YOUR FIRST CLIP 0/4"), waypoints on a map for steps, a weapon wheel for a list of options, a loot counter for money, MISSION FAILED with a RETRY button for the problem, MISSION PASSED for the result. Reel 9 turned a list of tools into a graph of skill nodes joined by lines, with a starter-skills progress chip (0/5 filling to 5/5) and a terminal for every demonstration. The skin is the topic's own visual language; it makes 40 different graphics feel like one design. `skills/overlay-design/skins.json` has six; add yours.
2. **Nouns become props, verbs become actions, numbers become counters, absence becomes a crossing-out.** Money earned: bills fall onto a counter. "Free": a price tag hangs from the thing and swings. "No monthly fee": a calendar of months with a red X. "Your own PC": a drawing of a PC. "Open Claude Code": a terminal appears. "Copy the link": the URL is highlighted with a cursor. "Paste it": an ENTER key. "Chases, crashes, fights": a wheel whose sectors light one per word. "335 lines": an odometer counts to 335 beside a paper stack, then "just 10" counts to 10. "Board of directors": three chairs, a name card on each as the name is said. "Yesterday, today, tomorrow": hanging day signs on the terminal. "84 websites": a grid of 84 cards. "Million-dollar websites": framed pictures on a wall.
3. **Objects persist and transform; they do not cut.** The terminal that opens on "open Claude Code" is still there at "install", gets a $0 tag at "free", and has a cursor at "paste". New things arrive around it. The viewer never re-orients; the picture just gets richer. A shot's main card carries 3 to 6 events before it is replaced.
4. **A ring says where to look.** A pulsing circle (our `focus-ring`) sits on the object the narrator is about to name, and dims the rest. One hero per moment.
5. **The stage is never empty and the host stays.** The picture is on screen from the first frame; the speaker's face or a presenter stays below; captions sit between them with the key word in a highlight box. A card that waits for its word to appear leaves an empty frame: our cards now show from the cut and let the word light the detail.

## 3. The procedure (do this for every sentence)
1. **Read the whole script first and choose the skin** (`overlay_director.mjs` proposes one from the topic; override with `--skin`, or `overlay_skin` in the style pack). Write the world's vocabulary in one line: what is a step here, a win, a failure, a price, a list, a result?
2. **Read each sentence as the viewer and underline every concrete word:** a number, a price, a date, a duration, a place, a platform, a tool or brand, an action someone must perform, a list of options, a comparison, a failure, a win, an absence ("no", "without", "never").
3. **Give each underlined word ONE device** from the table below, in the skin's words. If a word has no obvious device, ask: *what would I draw on a napkin to make this obvious?* Prefer the literal object. If two devices compete, keep the one that shows what the narration does not already say.
4. **Check the rhythm.** Mark the times: a new visual at least every 3 s (fast styles 1.4 s); a gap over 6 s needs a prop, a counter or a card step. Never two heroes on one word.
5. **Make it continuous.** Decide which object carries across the sentence; the new devices attach to it or appear around it.
6. **Budget and legibility:** at most 4 graphics at once; each stays `0.9 s + 0.28 s per word`; text at least 28 px; nothing over a face or a card's words (the `place` roles do this for you: `docs/LONGFORM-LANDSCAPE.md`).
7. **Run the tools:** `node tools/overlay_director.mjs <P> --apply` (the mechanical pass), then edit; `node tools/critique.mjs <P> storyboard` (coverage and gaps); look at the stills; vision critic `overlays`.

## 4. Word to device (what the director knows; add rules in `tools/lib/overlay_brain.mjs`)
| the script says | device | where it lands |
|---|---|---|
| a number or a spoken count ("335", "three weeks", "ten seconds") | `counter` (with its unit) | counts up on the word |
| "thousands of dollars", "earn", "revenue" | `rain` (bills) onto a counter | on "thousands" |
| "free", "zero dollars", "$0" | `price-tag` hung on the thing | on the word |
| "no monthly fee", "no subscription" | `calendar` + `scribble crossed` | on "no" |
| a date ("November 19th") | `calendar` page with the real date | on the month |
| "first", "next", "then", "last", "number three" | `step-label` in the skin's words (STEP 2/4, MISSION 2/4) | top band, on the word |
| a platform (TikTok, Reels, Shorts, YouTube) | `Devices` card: one phone per platform, each lights on its name | on each name |
| a list of 3 to 6 short items | `RadialMenu` (options wheel) or `KineticList`, one slot lit per spoken item | on each item |
| an action to perform (open, install, paste, drag, post) | `cursor` doing it, or the matching UI card (`Terminal`, `FileList`, `CommentBox`) | on the verb |
| a named tool or brand | a label plate (`callout`) or a node in a graph, with its licence or stars if real | on the name |
| the problem in the hook ("nobody", "flops", "fails") | `verdict` bad (FAILED + RETRY) | on the word |
| the result or the loop closing ("done", "no more flops") | `verdict` good (PASSED, POSTED) | on the word |
| a comparison (with / without, vs, instead of) | `Versus` | on the contrast word |
| a question | `bubble` | at the question mark |
| the comment keyword | `CommentBox` types it, flips to Posted | on the keyword |
| a warning | `warning` plate | on the word |
| a claim about a real page | `ProofCard` or `Footage` (real recording) circled on the claim | on the claim |
| an idea no rule knows | YOUR job: the napkin test, then a `callout`, a `sticker` or a new card | on the word |

## 5. Worked examples (read from the reels, word by word; ours to understand, not to copy)
Reel 8, "Everybody is telling you to use Claude Code to clip gameplay videos of GTA 6 and earn thousands of dollars. But nobody's actually showing you how." -> a wall of short clips (clip) -> a terminal typing the command -> a game logo on "GTA 6" -> a money counter with bills falling on "thousands of dollars" -> the counter drops to $0 in red on "nobody", a FAILED banner with a RETRY button.
"Open Claude Code and tell it to install ClipSkitty from GitHub. It's a free clipper that runs on your own PC, so there's no monthly fee." -> a mission card (step 0/4) -> a terminal with the install command -> a repo card ringed on the name -> a $0 FREE tag swings from the terminal on "free" -> a PC illustration on "your own PC" -> a calendar of months crossed out on "no monthly fee".
"Now it knows what a great GTA moment looks like. The chases, the crashes, and the fights." -> a wheel; CHASE lights on "chases", CRASH on "crashes", FIGHT on "fights".
"Then, on November 19th, copy the link to any big streamer ... and paste it." -> a NOV 19 chip on a browser tab -> the URL highlighted, a cursor -> an ENTER key in the terminal.
"Last, post them on TikTok, Reels, and Shorts. Comment clip, and I'll send you the tool." -> STEP 4/4 -> three labelled phones -> a comment thread -> MISSION PASSED with the three deliverables listed as rows.
Reel 9, "Number three is Ponytail ... Without the skill, Claude would write 335 lines of code for a simple date picker. But with the skill, just 10." -> a node lights and a ring appears -> a terminal -> an odometer counts 0 to 335 beside a growing stack of paper -> the counter runs to 010 and the stack collapses.
"With every new chat, Claude forgets what it built yesterday ... tomorrow Claude picks up right where you left off." -> day signs "yesterday / today / tomorrow" hang on the terminal; the old screen dissolves into particles on "forgets" and returns on "tomorrow".
Ours, generated by the director from a different script (`examples/overlay-brain-demo`): "Three weeks per video? You flop." -> a 3 WEEKS counter, a FLOPPED banner with RETRY; "costs zero dollars and has no monthly fee" -> a $0 FREE tag, a calendar crossed out; "the jokes, the stories, and the fights" -> a wheel that lights on each; "TikTok, Reels, and Shorts" -> three phones that light on their names; "No more flops" -> POSTED.

## 6. Originality (the rule that keeps this ours)
Take the method (a skin, literal props, a persistent object, a focus ring, a steady cadence), then change everything visible: your own world for the topic, your own props, your own palette and type, your own words on the banners. A film that reuses a reel's mission structure, character, set or wording is a copy, not an improvement. The twist (`tools/reference/twist.mjs`) is how we prove the difference.

## 7. Limits (honest)
The director finds what a word list can find. It does not understand a metaphor; it will not invent the right prop for "board of directors". That is the AI's job at step 3 of the procedure, and the napkin test is the method. Card suggestions (a wheel, phones, the comment box) are printed, not applied: changing a shot's main picture is a design decision. Props the reels drew by hand (a PC, a stack of paper, framed pictures) need an illustration: use a Remotion card, a `remocn` component, a Stage3D prop, or a Blender plate (`docs/PHOTOREAL.md`); the toolkit does not ship a prop library of drawings.


## 8. Unusual ideas (the napkin protocol)
The director knows words, not meaning. For anything it does not know, YOU supply the picture. Do it in this order and stop at the first that works:
1. **Look it up**: `tools/lib/concepts.mjs` maps about 700 words (concrete things and idea-metaphors such as memory, risk, speed, trust, complexity, time, cost, scale, hierarchy, network, dependency, decision, growth, failure, secret, pressure, bottleneck, shortcut) to a picture and an animation. The director already emits a `prop` overlay for them (one per line, the idea-metaphor first). Add words there, one line each.
2. **Find the object**: what physical thing is this about? A debt is a chain, a deadline an alarm, a bottleneck a roadblock, latency a queue at one counter. Say it as "the <idea> is a <object>".
3. **Find the number, the person, the moment**: a counter for the number, a name sticker for the person, a verdict banner or a scribble for the moment.
4. **Compose a new prop** when no emoji says it: stack two (`prop` with `count` and `anim: stack`), put a `callout` or `sticker` beside it, draw a `scribble` (circle, underline, cross-out) on the card, use a `remocn` block, a Stage3D object, a Blender render, or an SVG you write. The overlay only needs a picture and a time.
5. A line that stays bare after 1 to 4 is a talking-head beat: keep it under 2 seconds or cut the line.

The `prop` overlay: `{"type":"prop","emoji":"🧠","anim":"pop|drop|spin|shake|float|stack","size":180,"count":3,"text":"MEMORY","x":800,"y":560,"anchor":"<word>"}`. Pictures are Noto Emoji files fetched by `node tools/emoji.mjs ensure <project>` (it scans the storyboard and `overlay-plan.json`). Try a line: `node tools/overlay_director.mjs --text "Every bottleneck in your memory pipeline costs you."`. Budget: one prop per line, never on top of a card's text, and not on a line where a counter, price tag or verdict already carries the idea.
