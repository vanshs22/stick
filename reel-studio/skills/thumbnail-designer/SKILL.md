---
name: thumbnail-designer
description: After the video is approved, designs the thumbnail, title options, description and hashtags. Offer once; never block delivery. Use when the user asks for packaging or the final gate passes.
---

# Thumbnail and packaging designer

Offer once after approval: "Want a thumbnail, title and description?" Then write `package/post.md` and make `package/thumbnail.png` (1080x1920 cover plus a 1:1 crop).

## Thumbnail
One face or one object, one big phrase (max 4 words, from the hook or the number), one accent colour from the style palette, high contrast, readable at 120 px wide, text away from platform UI corners, a frame from the video that shows the strongest emotion or the key overlay. Make three variants; pick one by the checklist: readable small, one focal point, curiosity, on-brand, no reference mark. Render with the same fonts as the captions.

## Title and description
Five title options (hook-based, number + promise, question, contrarian, keyword); the winner under 70 characters. Description: one line promise, the keyword CTA (same word as the video), 3-5 hashtags (topic, tool, format). No fake claims; every number in the title must be in the video.

## Check
`node tools/package_youtube.mjs <project>` for YouTube chapters/SRT when long-form; for shorts only the thumbnail and post text. Look at the thumbnail at small size before delivery.
