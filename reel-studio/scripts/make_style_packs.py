"""Generates style-packs/<id>/style.json and STYLE.md. Edit the data below, then: python3 scripts/make_style_packs.py"""
import json, os
SZ = {"top": 180, "bottom": 1380, "caption_y": 1440, "right_margin": 120}
FONTS = {"sans": "Inter", "serif": "InstrumentSerif", "mono": "JetBrainsMono"}
def col(bg, ink, accent, **k): return {"bg": bg, "ink": ink, "ink2": k.get("ink2", ink), "muted": k.get("muted", "#8C8A82"), "card": k.get("card", "#FFFFFF"), "accent": accent, "accentSoft": k.get("soft", accent + "33"), "good": "#4E9A5B", "bad": "#C94A3A"}
P = [
 dict(id="editorial-notebook", name="Editorial notebook", family="2d", description="Calm cream paper, italic serif accent word, windows and terminals that swing in. Explains one idea simply.",
  colors=col("#FAF9F5", "#141413", "#D97757", soft="#F6E3D9"), effects={"paper": True, "grain": 0.04}, captions="boxed", shots=[1.5, 3.5], music="upbeat",
  best="software and idea explainers, tutorials, how-to",
  rules=["One accent colour (orange) used for the single most important word or number per shot.", "Headline words rise out of a mask; the accent word is italic serif.", "Windows and phones swing in from the right with a small 3D turn; everything exits before the next shot starts.", "Real screenshots beat drawn UI: use ProofCard or BrowserWindow with a capture whenever a real thing is named.", "Motion is calm: springs with little overshoot, no shake, no flashes."],
  components=["TitleCard", "BigStat", "NotebookPage", "Terminal", "BrowserWindow", "PhoneFrame", "ChatBubbles", "CommentBox", "Checklist", "Highlight", "KineticList", "ProofCard", "BarChart", "LineChart", "Versus"],
  camera="No camera: layout and motion only. Slow 2 percent push on cards.", typo="Heavy sans headlines, italic serif accent, mono labels.", trans=["cut", "slide", "mask", "swing"], audio="upbeat bed, soft pop on each card, tick on steps, type on terminals, ding on the comment box",
  pitfalls=["More than one accent word per shot.", "Text smaller than 48 px.", "A fake screenshot of a real site.", "Shots longer than 4 s without a new element appearing."], refs=["reel-maker", "animated-reels", "reference videos ref5, ref6"]),
 dict(id="noir-3d", name="Noir 3D", family="3d", description="Dark rooms with ONE light, faceless figures, typewriter dates and evidence cards. Quiet and uneasy.",
  colors=col("#050508", "#EDE6D6", "#D32F2F", muted="#8A8578", card="#14141A", soft="#D32F2F33"), effects={"grain": 0.12, "vignette": 0.5}, captions="typewriter", shots=[3, 5], music="tension",
  best="mysteries, true stories, history of unsolved events (facts sourced, victims respected)",
  rules=["One light source per scene; everything else falls into darkness.", "Red means the subject. Nothing else is red except evidence marks (stamp, circle, string).", "No faces, no gore, no weapons shown; facts checked against primary sources and listed.", "Slow: 3 to 5 s shots, push-ins and drifts only; longer pauses between sentences.", "Captions typewriter, sentence case, cream with one red word."],
  components=["Scene3D", "EvidenceCard", "Typewriter", "Stamp", "ProofCard", "Timeline", "TitleCard"], camera="Slow push-in or drift; wide lens (fov 55+) in dark rooms; never inside the light cone.", typo="Mono typewriter, cream, dates top-left.", trans=["fade", "dip", "cut"], audio="tension drone, one hard hit at the turn, quiet room tone, no cheerful sounds",
  pitfalls=["Camera inside the light cone gives a flat brown frame.", "Seats or walls between camera and subject.", "Too tight on a dark doorway reads as an empty frame."], refs=["faceless-shorts night-file"],
  scene=dict(set="noir-room", light="noir", characters=[dict(variant="noir", pose="idle", mood="calm")])),
 dict(id="voxel-explainer", name="Voxel explainer", family="3d", description="Blocky voxel presenter and a little box creature on a deep-blue starfield, step chips and cards. Friendly tech explainer.",
  colors=col("#22349F", "#FFFFFF", "#FFD84A", muted="#B8C2FF", card="#141D5F", soft="#FFD84A33"), effects={"bokeh": True, "vignette": 0.25}, captions="word-pop", shots=[1.5, 3], music="upbeat",
  best="how-to and tool explainers for a young or casual audience, 'step 1, step 2' formats",
  rules=["A 3D voxel presenter in the lower half, cards in the upper half, captions at the bottom.", "A companion creature reacts (hops) on the key word of the shot.", "Step chips (STEP 1 .. n) appear top centre with the card.", "Hero shirt must be lighter than the background (readability): check luma.", "Yellow is the accent: one yellow word in captions."],
  components=["Scene3D", "Terminal", "BrowserWindow", "CommentBox", "Checklist", "BigStat", "KineticList"], camera="Medium shot mostly, slow push; close only for reactions.", typo="Heavy sans, white with yellow accent.", trans=["cut", "zoom", "whip"], audio="upbeat groove, pop on card, tick on step chip, hop = boing",
  pitfalls=["Dark shirt on dark background.", "Creature cropped by the frame edge.", "Cards covering the head."], refs=["reference videos ref7, ref2"],
  scene=dict(set="starfield", light="studio", characters=[dict(variant="voxel", x=-0.2, pose="open", mood="happy", skin="#A8704A", shirt="#5a5a72", hair="#14100c", beard=True, badge="#F2C12E")], creatures=[dict(kind="box", x=0.8, z=0.4, scale=1.1, color="#F0683C")])),
 dict(id="stickman-3d", name="3D stickman", family="3d", description="Simple expressive stick figures acting in bright minimal studio sets. Comedy, 'what if' and survival explainers.",
  colors=col("#E8E8EC", "#111111", "#E8512A", muted="#777777", soft="#E8512A33"), effects={"vignette": 0.1}, captions="word-pop", shots=[1.5, 3], music="bed",
  best="comedy bits, 'what would you do if', quick lessons with a character",
  rules=["White round head, black limbs, big readable face; pose and mood carry the joke.", "Bright flat studio; one prop per shot.", "Exaggerate poses (panic, cheer, shrug); hold them for a beat.", "Cut on action; whip transition into a surprise.", "Captions big, low, one accent word."],
  components=["Scene3D", "BigStat", "Versus", "Highlight", "KineticList", "Stamp", "CommentBox"], camera="Medium and close; punch-in on the punchline.", typo="Heavy sans, black on light.", trans=["cut", "whip", "zoom"], audio="bed, boing/pop on gags, thud on falls",
  pitfalls=["Faces too small to read.", "Idle poses for more than 2 s.", "Props floating in front of the face."], refs=["reference videos (stickman shorts)"],
  scene=dict(set="studio", light="studio", characters=[dict(variant="stick", pose="idle", mood="happy")])),
 dict(id="roblox-inspired", name="Roblox-inspired world", family="3d", description="A bright blocky town in the sky with simple block characters; one huge yellow word at a time. Story and 'did you know' videos.",
  colors=col("#8CC8F6", "#111111", "#FFE600", muted="#4a6a8a", soft="#FFE60044"), effects={}, captions="one-word", shots=[1, 2.5], music="bed",
  best="fast narrated stories and facts about places, money, scale ('the richer you are, the higher you live')",
  rules=["Original block characters and worlds; never recreate Roblox characters or logos.", "One word on screen at a time, big, yellow, black outline-like shadow.", "Camera moves every shot: tilt up, drift, orbit; shots 1 to 2.5 s.", "The world itself tells the story: scale, height, contrast between places.", "Bright sky colours; always readable."],
  components=["Scene3D", "BigStat", "BarChart", "Timeline"], camera="Dynamic: low-angle tilt-ups, orbit, drift; fov 36-60.", typo="One-word captions, 118 px.", trans=["whip", "cut", "zoom"], audio="light bed, whoosh on every camera move, pop on reveals",
  pitfalls=["Too many words per caption.", "Static camera.", "Characters tiny in wide shots with nothing to see."], refs=["reference video ref8"],
  scene=dict(set="block-world", light="bright-sky", characters=[dict(variant="blocky", pose="idle", mood="happy", skin="#F4C98C", shirt="#2f7f4a", hair="#3a2a1a")])),
 dict(id="stylized-3d-presenter", name="Stylized 3D presenter", family="3d", description="Faceted low-poly person at a desk at night, city bokeh, little helper creatures. Dialogue and tech-story comedy.",
  colors=col("#070A1C", "#FFFFFF", "#F4CB3A", muted="#9aa6d6", card="#12162f", soft="#F4CB3A33"), effects={"bokeh": True, "vignette": 0.35, "grain": 0.05}, captions="phrase", shots=[2, 4], music="bed",
  best="dialogue and story comedy about tech and work, character-led explainers",
  rules=["Warm key light on the face, cool rim; the face is always readable (check luma).", "Close-ups for emotion, medium with the desk for context, wide only to set the place.", "Helpers (box, screen, cloud) react on key words; speech is the presenter's mouth.", "Captions small and calm at the bottom; speaker changes shown in the caption colour.", "Original characters only."],
  components=["Scene3D", "Terminal", "ChatBubbles", "Typewriter", "CommentBox", "Highlight"], camera="Slow push-ins; close-up on reactions; desk shot for 2-character beats.", typo="Phrase captions, serif accent.", trans=["cut", "fade", "dip"], audio="calm bed, keyboard type sounds, soft pop on helper reactions",
  pitfalls=["Orange face from a warm light that is too strong.", "Lower face lost in shadow.", "Helpers hidden behind the desk."], refs=["reference videos ref1, ref4"],
  scene=dict(set="desk-night", light="night", characters=[dict(variant="lowpoly", pose="idle", mood="calm", skin="#F1CBA8", shirt="#F4CB3A", hair="#3a2418", glasses=True)], creatures=[dict(kind="cloud", x=-0.5, y=0.83, z=0.9, scale=0.8, color="#4a46c9"), dict(kind="screen", x=-1.0, y=0.83, z=0.9, scale=0.8, color="#232329")])),
 dict(id="original-creatures", name="Original creatures", family="3d", description="Small round-and-boxy original creatures with big vertical eyes and comic reactions on a clean studio set.",
  colors=col("#F3EFE6", "#1c1c22", "#2FA3A0", muted="#8a8578", soft="#2FA3A033"), effects={"vignette": 0.1}, captions="word-pop", shots=[1.5, 3], music="upbeat",
  best="comedy and personality-driven explainers where a character reacts to facts",
  rules=["Original designs (shape, colour, eyes) so they are never mistaken for a protected character.", "Big simple eyes; the blink and the hop carry the emotion.", "Two to four creatures at most; each has its own colour and role (sceptic, fan, expert).", "Reaction shots: cut to the creature on the punchline word.", "Studio background stays plain."],
  components=["Scene3D", "ChatBubbles", "BigStat", "Versus", "Highlight", "CommentBox"], camera="Medium two-shots; close on a reaction.", typo="Friendly heavy sans.", trans=["cut", "zoom", "whip"], audio="upbeat bed, boing on hops, pop on text",
  pitfalls=["Copying a famous mascot.", "More than 4 creatures.", "No reaction to the key word."], refs=["reference videos ref1, ref4, ref7 (creature idea only)"],
  scene=dict(set="studio", light="studio", characters=[dict(variant="stick", pose="think", mood="worried", x=-0.7)], creatures=[dict(kind="box", x=0.4, z=0.5, scale=1.6, color="#2FA3A0"), dict(kind="cloud", x=1.0, z=0.3, scale=1.4, color="#E8643C")])),
 dict(id="paper-atlas", name="Paper atlas", family="2d", description="History and places in cut paper: parchment maps, red routes, dated labels and polaroid evidence.",
  colors=col("#EFE3C6", "#3b2a12", "#B3261E", muted="#8a7350", card="#F8F0DC", soft="#B3261E22"), effects={"paper": True, "grain": 0.08, "vignette": 0.2}, captions="phrase", shots=[2.5, 4.5], music="bed",
  best="history, geography, how a thing spread; calm documentary pacing",
  rules=["Parchment background, crimson routes and stamps, ink-brown text.", "A map or a timeline in most shots; routes draw themselves as the place is named.", "Dates are labels (mono), places are labels (serif italic).", "Polaroids and case cards for real photos and documents, with sources named.", "Slow, steady: 2.5 to 4.5 s shots."],
  components=["RouteMap", "Timeline", "EvidenceCard", "ProofCard", "TitleCard", "Stamp", "BigStat"], camera="No camera; slow zoom on maps.", typo="Serif italic for places, mono for dates.", trans=["fade", "cut", "wipe"], audio="calm bed, paper slide whooshes, stamp on dates",
  pitfalls=["Modern UI mixed into a paper look.", "Unsourced dates.", "Too many labels crossing the route."], refs=["faceless-shorts paper-atlas"]),
]
for d in P:
    tokens = {"colors": d["colors"], "fonts": FONTS, "safe_zone": SZ}
    sty = {"id": d["id"], "name": d["name"], "family": d["family"], "description": d["description"], "tokens": tokens, "effects": d["effects"], "rules": d["rules"], "components": d["components"],
           "camera_language": d["camera"], "typography": d["typo"], "transitions": d["trans"], "audio_direction": d["audio"], "pitfalls": d["pitfalls"], "references": d["refs"],
           "defaults": {"captions": d["captions"], "shot_seconds": d["shots"], "music": d["music"], **({"scene3d": d["scene"]} if "scene" in d else {})}}
    os.makedirs(f"style-packs/{d['id']}", exist_ok=True); json.dump(sty, open(f"style-packs/{d['id']}/style.json", "w"), indent=1)
    md = f"# {d['name']} ({d['family']})\n\n{d['description']}\n\nBest for: {d['best']}.\n\n## Rules\n" + "\n".join(f"- {r}" for r in d["rules"]) + f"\n\n## Defaults\nCaptions `{d['captions']}`, shots {d['shots'][0]}-{d['shots'][1]} s, music `{d['music']}`.\nCamera: {d['camera']}\nType: {d['typo']}\nTransitions: {', '.join(d['trans'])}\nSound: {d['audio']}\n\n## Components\n{', '.join(d['components'])}\n\n## Pitfalls\n" + "\n".join(f"- {p}" for p in d["pitfalls"]) + "\n\n## References (technique only, never copied)\n" + ", ".join(d["refs"]) + "\n"
    if "scene" in d: md += "\n## 3D starting point (Scene3D props)\n```json\n" + json.dumps(d["scene"]) + "\n```\n"
    open(f"style-packs/{d['id']}/STYLE.md", "w").write(md)
print(len(P), "packs")
