---
name: cta-writer
description: Writes the last 5 seconds: the comment keyword, the payoff line, the end card and the series tag, each matched to the format. Use after the script body is written and before the storyboard.
---

# CTA writer

The ending decides saves, follows and comments. Read `node tools/playbook.mjs query hook-cta --when cta`. Write `script/cta.json`.

## Procedure
1. Pick the pattern by format: tutorial or tool short = comment keyword; story series = cliffhanger plus 'PART N / FOLLOW FOR PART N+1'; stand-alone story = callback or twist; dialogue comedy = joke tag then keyword.
2. Keyword: a real word from the video, 3-9 letters, not generic ('link', 'yes'); said once and shown in the comment-box overlay and the last caption. It must appear in `brief.json` so the description repeats it.
3. Payoff line: states what the viewer gets ('I'll send you the whole setup'); one sentence; no 'follow for more' filler unless it is a series tag.
4. End card: layout from the style pack (comment box, follow card, PART N card, gradient plate with handle); duration 3-5 s; music resolves, then stops for the last word.
5. Check the loop: does the last visual or line answer the first?

## Output `script/cta.json`
`{ "pattern", "keyword", "line", "end_card": { "type", "text", "dur_s" }, "series": { "part", "next" } | null, "loops_to_hook": true }`

## Refuse
Two asks in one ending (comment AND follow AND share), a keyword the video never mentioned, a CTA longer than 6 s.

## Question and keyword CTAs for story shorts (see skills/story-writer/SKILL.md)
End on ONE open question that is cheap and personal to answer, with a comment keyword (PUSHED, ROUTE), said in the character's voice, last 1-2 s. `tools/script_lint.mjs` fails scripts with no open loop or a generic like-and-subscribe CTA.
